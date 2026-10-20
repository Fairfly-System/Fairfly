/**
 * FairFly Database Schema & Optimization — Phase 5 Document Migration
 * 
 * Safely and idempotently migrates existing Firestore collections to canonical schema:
 * 1. TICKETS:
 *    - Decouples embedded messages[] array to tickets/{ticketId}/messages subcollection
 *    - Initializes root metadata: messageCount, lastMessage, lastMessageAt
 *    - Deletes legacy messages[] array from root document
 * 
 * 2. APPOINTMENTS:
 *    - Unifies preferredDate + preferredTime into canonical scheduledAt (ISO 8601 UTC timestamp in Asia/Manila PST)
 * 
 * 3. RECEIPTS:
 *    - Removes self-referencing id, receiptId
 *    - Removes bloated Base64 qrCodeDataUrl
 *    - Removes static boilerplate: businessName, businessTagline, legalNotice, formNo
 *    - Removes redundant aliases: paymentStatus, paymentMethodType, amountInCentavos, description
 * 
 * 4. PAYMENTS:
 *    - Removes self-referencing id
 *    - Removes redundant amountInCentavos, isWalkInCash
 * 
 * 5. ACTIVE SERVICES:
 *    - Removes self-referencing id
 *    - Removes dead serviceUID
 *    - Removes redundant totalSteps (derived from steps.length)
 *    - Removes redundant operatorId (retaining branchUid)
 *    - Initializes canonical priorityType if missing
 * 
 * 6. INQUIRIES:
 *    - Removes redundant workflow (retaining isWalkIn)
 *    - Removes redundant fragmented name fields (firstName, lastName, etc.)
 *    - Standardizes remarks onto clientRemarks and removes duplicate remarks
 *    - Removes redundant operatorId (retaining branchUid)
 * 
 * 7. QUOTATIONS:
 *    - Removes redundant preparedBy (retaining preparedByName)
 *    - Removes duplicate remarks (retaining operatorRemarks & clientRemarks)
 *    - Removes duplicate operatorId (retaining branchUid)
 * 
 * 8. WORKFLOW TEMPLATES:
 *    - Removes redundant type (retaining serviceType)
 * 
 * Usage:
 *   node src/scripts/migrateSchemaPhase5.js [--dry-run]
 */

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const isDryRun = process.argv.includes('--dry-run');

/**
 * Helper to convert time strings to minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  let trimmed = timeStr.trim();
  // If timeStr is a range like "09:00 - 10:00" or "09:00-10:00", use the starting time
  if (trimmed.includes('-') || trimmed.includes('–')) {
    trimmed = trimmed.split(/[-–]/)[0].trim();
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    return hours * 60 + mins;
  }
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  return null;
}

/**
 * Unifies date + time string into canonical ISO 8601 UTC timestamp in PST (UTC+8)
 */
function toCanonicalScheduledAt(dateStr, timeStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmedDate = dateStr.trim();
  const [y, m, d] = trimmedDate.split('-').map(Number);
  if (!y || !m || !d) return null;

  const minsFromMidnight = timeToMinutes(timeStr) ?? 600; // default 10:00 AM
  const hours = Math.floor(minsFromMidnight / 60);
  const minutes = minsFromMidnight % 60;

  // Manila is UTC+8 -> UTC hour is hours - 8
  const utcMs = Date.UTC(y, m - 1, d, hours - 8, minutes, 0);
  return new Date(utcMs).toISOString();
}

/**
 * Batch manager respecting Firestore limits (<= 400 ops per commit)
 */
class BatchManager {
  constructor(database, dryRun) {
    this.db = database;
    this.dryRun = dryRun;
    this.batch = database.batch();
    this.opsCount = 0;
    this.totalCommitted = 0;
  }

  async update(ref, data) {
    if (!data || Object.keys(data).length === 0) return;
    if (this.dryRun) {
      this.opsCount++;
      return;
    }
    this.batch.update(ref, data);
    this.opsCount++;
    if (this.opsCount >= 350) {
      await this.commit();
    }
  }

  async set(ref, data) {
    if (!data || Object.keys(data).length === 0) return;
    if (this.dryRun) {
      this.opsCount++;
      return;
    }
    this.batch.set(ref, data);
    this.opsCount++;
    if (this.opsCount >= 350) {
      await this.commit();
    }
  }

  async commit() {
    if (this.opsCount > 0) {
      if (!this.dryRun) {
        await this.batch.commit();
        this.batch = this.db.batch();
      }
      this.totalCommitted += this.opsCount;
      this.opsCount = 0;
    }
  }
}

// -----------------------------------------------------------------
// 1. TICKETS MIGRATION
// -----------------------------------------------------------------
async function migrateTickets(batchManager) {
  console.log('\n--- [1/8] Migrating Tickets (Subcollection Decoupling) ---');
  const snap = await db.collection('tickets').get();
  console.log(`Found ${snap.size} ticket documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const hasEmbeddedMessages = Array.isArray(data.messages) && data.messages.length > 0;
    const hasLegacyRootMessagesField = data.messages !== undefined;

    if (!hasEmbeddedMessages && !hasLegacyRootMessagesField) {
      skippedCount++;
      continue;
    }

    const updates = {};

    // 1. Check if messages subcollection already populated
    const subSnap = await doc.ref.collection('messages').get();
    if (subSnap.empty && hasEmbeddedMessages) {
      console.log(`  [${doc.id}] Decoupling ${data.messages.length} messages to subcollection`);
      for (const msg of data.messages) {
        const msgId = msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const msgPayload = {
          id: msgId,
          ticketId: doc.id,
          senderId: msg.senderId || data.operatorId || 'operator',
          senderRole: msg.senderRole || 'operator',
          senderName: msg.senderName || 'Operator',
          message: msg.message || '',
          createdAt: msg.createdAt || data.createdAt || new Date().toISOString()
        };
        await batchManager.set(doc.ref.collection('messages').doc(msgId), msgPayload);
      }
    }

    // 2. Update root document metadata
    const messageCount = data.messageCount || (hasEmbeddedMessages ? data.messages.length : (subSnap.size || 1));
    const lastMsg = data.lastMessage || (hasEmbeddedMessages ? data.messages[data.messages.length - 1]?.message : data.title);
    const lastMsgAt = data.lastMessageAt || (hasEmbeddedMessages ? data.messages[data.messages.length - 1]?.createdAt : (data.updatedAt || data.createdAt));

    updates.messageCount = messageCount;
    if (lastMsg) updates.lastMessage = lastMsg;
    if (lastMsgAt) updates.lastMessageAt = lastMsgAt;
    updates.messages = admin.firestore.FieldValue.delete();

    console.log(`  [${doc.id}] Updating root metadata: messageCount=${messageCount}, deleting messages array`);
    await batchManager.update(doc.ref, updates);
    migratedCount++;
  }

  await batchManager.commit();
  console.log(`Tickets Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 2. APPOINTMENTS MIGRATION
// -----------------------------------------------------------------
async function migrateAppointments(batchManager) {
  console.log('\n--- [2/8] Migrating Appointments (scheduledAt Datetime Unification) ---');
  const snap = await db.collection('appointments').get();
  console.log(`Found ${snap.size} appointment documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.scheduledAt) {
      skippedCount++;
      continue;
    }

    const pDate = data.preferredDate || data.appointmentDate || data.date;
    const pTime = data.preferredTime || data.startTime || data.time;

    if (!pDate) {
      skippedCount++;
      continue;
    }

    const scheduledAt = toCanonicalScheduledAt(pDate, pTime);
    if (!scheduledAt) {
      skippedCount++;
      continue;
    }

    console.log(`  [${doc.id}] Setting scheduledAt = ${scheduledAt} (from ${pDate} ${pTime || '10:00 AM'})`);
    await batchManager.update(doc.ref, { scheduledAt });
    migratedCount++;
  }

  await batchManager.commit();
  console.log(`Appointments Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 3. RECEIPTS MIGRATION
// -----------------------------------------------------------------
async function migrateReceipts(batchManager) {
  console.log('\n--- [3/8] Migrating Receipts (Payload Pruning & Redundancy Elimination) ---');
  const snap = await db.collection('receipts').get();
  console.log(`Found ${snap.size} receipt documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedFields = [];

    // Redundant self-referencing IDs
    if (data.id !== undefined) {
      updates.id = admin.firestore.FieldValue.delete();
      removedFields.push('id');
    }
    if (data.receiptId !== undefined) {
      updates.receiptId = admin.firestore.FieldValue.delete();
      removedFields.push('receiptId');
    }

    // Heavy Base64 data URL
    if (data.qrCodeDataUrl !== undefined) {
      updates.qrCodeDataUrl = admin.firestore.FieldValue.delete();
      removedFields.push('qrCodeDataUrl');
    }

    // Static boilerplate
    ['businessName', 'businessTagline', 'legalNotice', 'formNo'].forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = admin.firestore.FieldValue.delete();
        removedFields.push(field);
      }
    });

    // Redundant payment aliases
    if (data.paymentStatus !== undefined) {
      updates.paymentStatus = admin.firestore.FieldValue.delete();
      removedFields.push('paymentStatus');
    }
    if (data.paymentMethodType !== undefined) {
      updates.paymentMethodType = admin.firestore.FieldValue.delete();
      removedFields.push('paymentMethodType');
    }
    if (data.amountInCentavos !== undefined) {
      updates.amountInCentavos = admin.firestore.FieldValue.delete();
      removedFields.push('amountInCentavos');
    }

    // Deduplicate description if serviceTitle is present
    if (data.description !== undefined && data.serviceTitle && data.description === data.serviceTitle) {
      updates.description = admin.firestore.FieldValue.delete();
      removedFields.push('description');
    }

    if (removedFields.length > 0) {
      console.log(`  [${doc.id}] Pruning: ${removedFields.join(', ')}`);
      await batchManager.update(doc.ref, updates);
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  await batchManager.commit();
  console.log(`Receipts Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 4. PAYMENTS MIGRATION
// -----------------------------------------------------------------
async function migratePayments(batchManager) {
  console.log('\n--- [4/8] Migrating Payments (Redundancy Elimination) ---');
  const snap = await db.collection('payments').get();
  console.log(`Found ${snap.size} payment documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedFields = [];

    if (data.id !== undefined) {
      updates.id = admin.firestore.FieldValue.delete();
      removedFields.push('id');
    }
    if (data.amountInCentavos !== undefined) {
      updates.amountInCentavos = admin.firestore.FieldValue.delete();
      removedFields.push('amountInCentavos');
    }
    if (data.isWalkInCash !== undefined) {
      updates.isWalkInCash = admin.firestore.FieldValue.delete();
      removedFields.push('isWalkInCash');
    }
    if (data.receivedByOperatorId !== undefined && data.operatorId) {
      updates.receivedByOperatorId = admin.firestore.FieldValue.delete();
      removedFields.push('receivedByOperatorId');
    }

    if (removedFields.length > 0) {
      console.log(`  [${doc.id}] Pruning: ${removedFields.join(', ')}`);
      await batchManager.update(doc.ref, updates);
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  await batchManager.commit();
  console.log(`Payments Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 5. ACTIVE SERVICES MIGRATION
// -----------------------------------------------------------------
async function migrateActiveServices(batchManager) {
  console.log('\n--- [5/8] Migrating Active Services ---');
  const snap = await db.collection('activeServices').get();
  console.log(`Found ${snap.size} activeServices documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedFields = [];

    if (data.id !== undefined) {
      updates.id = admin.firestore.FieldValue.delete();
      removedFields.push('id');
    }
    if (data.serviceUID !== undefined) {
      updates.serviceUID = admin.firestore.FieldValue.delete();
      removedFields.push('serviceUID');
    }
    if (data.totalSteps !== undefined) {
      updates.totalSteps = admin.firestore.FieldValue.delete();
      removedFields.push('totalSteps');
    }
    if (data.operatorId !== undefined && data.branchUid) {
      updates.operatorId = admin.firestore.FieldValue.delete();
      removedFields.push('operatorId');
    }

    // Normalize priorityType if missing
    if (!data.priorityType && data.priority) {
      updates.priorityType = data.priority.toLowerCase().includes('high') ? 'high' : 'normal';
    }

    if (removedFields.length > 0 || updates.priorityType) {
      const summary = removedFields.length > 0 ? `Pruning: ${removedFields.join(', ')}` : '';
      const pSummary = updates.priorityType ? `priorityType=${updates.priorityType}` : '';
      console.log(`  [${doc.id}] ${summary} ${pSummary}`.trim());
      await batchManager.update(doc.ref, updates);
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  await batchManager.commit();
  console.log(`Active Services Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 6. INQUIRIES MIGRATION
// -----------------------------------------------------------------
async function migrateInquiries(batchManager) {
  console.log('\n--- [6/8] Migrating Inquiries ---');
  const snap = await db.collection('inquiries').get();
  console.log(`Found ${snap.size} inquiry documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedFields = [];

    // Redundant workflow string when isWalkIn boolean exists
    if (data.workflow !== undefined && data.isWalkIn !== undefined) {
      updates.workflow = admin.firestore.FieldValue.delete();
      removedFields.push('workflow');
    }

    // Fragmented name parts when clientName exists
    ['firstName', 'middleInitial', 'lastName', 'contactPersonFirstName', 'contactPersonMiddleInitial', 'contactPersonLastName'].forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = admin.firestore.FieldValue.delete();
        removedFields.push(field);
      }
    });

    // Redundant duplicate remarks when clientRemarks exists
    if (data.remarks !== undefined && data.clientRemarks !== undefined) {
      updates.remarks = admin.firestore.FieldValue.delete();
      removedFields.push('remarks');
    } else if (data.remarks !== undefined && data.clientRemarks === undefined) {
      // Elevate remarks to canonical clientRemarks
      updates.clientRemarks = data.remarks;
      updates.remarks = admin.firestore.FieldValue.delete();
      removedFields.push('remarks->clientRemarks');
    }

    // Redundant duplicate operatorId when branchUid exists
    if (data.operatorId !== undefined && data.branchUid) {
      updates.operatorId = admin.firestore.FieldValue.delete();
      removedFields.push('operatorId');
    }

    if (removedFields.length > 0 || updates.clientRemarks) {
      console.log(`  [${doc.id}] Updating: ${removedFields.join(', ')}`);
      await batchManager.update(doc.ref, updates);
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  await batchManager.commit();
  console.log(`Inquiries Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 7. QUOTATIONS MIGRATION
// -----------------------------------------------------------------
async function migrateQuotations(batchManager) {
  console.log('\n--- [7/8] Migrating Quotations ---');
  const snap = await db.collection('quotations').get();
  console.log(`Found ${snap.size} quotation documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedFields = [];

    // Redundant duplicate preparedBy when preparedByName exists
    if (data.preparedBy !== undefined && data.preparedByName) {
      updates.preparedBy = admin.firestore.FieldValue.delete();
      removedFields.push('preparedBy');
    }

    // Redundant duplicate remarks when operatorRemarks exists
    if (data.remarks !== undefined && data.operatorRemarks !== undefined) {
      updates.remarks = admin.firestore.FieldValue.delete();
      removedFields.push('remarks');
    } else if (data.remarks !== undefined && data.operatorRemarks === undefined) {
      // Elevate remarks to operatorRemarks
      updates.operatorRemarks = data.remarks;
      updates.remarks = admin.firestore.FieldValue.delete();
      removedFields.push('remarks->operatorRemarks');
    }

    // Redundant operatorId when branchUid exists
    if (data.operatorId !== undefined && data.branchUid) {
      updates.operatorId = admin.firestore.FieldValue.delete();
      removedFields.push('operatorId');
    }

    if (removedFields.length > 0 || updates.operatorRemarks) {
      console.log(`  [${doc.id}] Updating: ${removedFields.join(', ')}`);
      await batchManager.update(doc.ref, updates);
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  await batchManager.commit();
  console.log(`Quotations Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// 8. WORKFLOW TEMPLATES MIGRATION
// -----------------------------------------------------------------
async function migrateWorkflowTemplates(batchManager) {
  console.log('\n--- [8/8] Migrating Workflow Templates ---');
  const snap = await db.collection('workflowTemplates').get();
  console.log(`Found ${snap.size} workflowTemplates documents.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};

    if (data.type !== undefined && data.serviceType) {
      updates.type = admin.firestore.FieldValue.delete();
      console.log(`  [${doc.id}] Removing redundant type alias`);
      await batchManager.update(doc.ref, updates);
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  await batchManager.commit();
  console.log(`Workflow Templates Migration: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

// -----------------------------------------------------------------
// MAIN RUNNER
// -----------------------------------------------------------------
async function runMigration() {
  console.log('================================================================');
  console.log(`FAIRFLY PHASE 5 DATABASE MIGRATION SCRIPT ${isDryRun ? '(DRY RUN)' : '(LIVE EXECUTION)'}`);
  console.log('================================================================');

  const batchManager = new BatchManager(db, isDryRun);

  try {
    await migrateTickets(batchManager);
    await migrateAppointments(batchManager);
    await migrateReceipts(batchManager);
    await migratePayments(batchManager);
    await migrateActiveServices(batchManager);
    await migrateInquiries(batchManager);
    await migrateQuotations(batchManager);
    await migrateWorkflowTemplates(batchManager);

    console.log('\n================================================================');
    console.log(`MIGRATION FINISHED SUCCESSFULLY! Total operations: ${batchManager.totalCommitted}`);
    if (isDryRun) {
      console.log('NOTE: This was a DRY RUN. No Firestore documents were modified.');
    }
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n[FATAL] Migration failed with error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Unhandled migration error:', err);
      process.exit(1);
    });
}

module.exports = { runMigration, timeToMinutes, toCanonicalScheduledAt };
