/**
 * Migration: Normalize Firestore Collections
 * 
 * Applies the approved normalization audit schema to existing Firestore documents:
 * 1. passwordResetRequests: removes `id`, `operatorName`, `branchUid`, `branchName`
 * 2. tickets: removes `operatorName`, `operatorEmail` from root doc (preserves messages[].senderName)
 * 3. qualificationApplications: removes `operatorName`, `branchName`
 * 4. inquiries: removes duplicate fields `fullName`, `cellphone` (merging into canonical clientName, phoneNumber; remarks is preserved as an active operational feature)
 * 5. appointments: removes duplicate fields `branchName`, `operatorId` (merging into preferredBranchLocation, branchUid)
 * 6. conversations: removes redundant `participantDetails` and `participantRoles` (user profiles resolved dynamically)
 * 
 * Usage:
 *   node src/scripts/migrateNormalizedCollections.js [--dry-run]
 */

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const isDryRun = process.argv.includes('--dry-run');

async function migratePasswordResetRequests() {
  console.log(`\n--- 1. Migrating passwordResetRequests ---`);
  const snap = await db.collection('passwordResetRequests').get();
  console.log(`Found ${snap.size} passwordResetRequests documents.`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedKeys = [];

    ['id', 'operatorName', 'branchUid', 'branchName'].forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = admin.firestore.FieldValue.delete();
        removedKeys.push(field);
      }
    });

    if (removedKeys.length > 0) {
      console.log(`  [${doc.id}] Removing: ${removedKeys.join(', ')}`);
      if (!isDryRun) {
        await doc.ref.update(updates);
      }
      updated++;
    }
  }
  console.log(`passwordResetRequests: ${updated} updated, ${snap.size - updated} unchanged.`);
}

async function migrateTickets() {
  console.log(`\n--- 2. Migrating tickets ---`);
  const snap = await db.collection('tickets').get();
  console.log(`Found ${snap.size} tickets documents.`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedKeys = [];

    ['operatorName', 'operatorEmail'].forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = admin.firestore.FieldValue.delete();
        removedKeys.push(field);
      }
    });

    if (removedKeys.length > 0) {
      console.log(`  [${doc.id}] Removing root fields: ${removedKeys.join(', ')}`);
      if (!isDryRun) {
        await doc.ref.update(updates);
      }
      updated++;
    }
  }
  console.log(`tickets: ${updated} updated, ${snap.size - updated} unchanged.`);
}

async function migrateQualificationApplications() {
  console.log(`\n--- 3. Migrating qualificationApplications ---`);
  const snap = await db.collection('qualificationApplications').get();
  console.log(`Found ${snap.size} qualificationApplications documents.`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedKeys = [];

    ['operatorName', 'branchName'].forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = admin.firestore.FieldValue.delete();
        removedKeys.push(field);
      }
    });

    if (removedKeys.length > 0) {
      console.log(`  [${doc.id}] Removing: ${removedKeys.join(', ')}`);
      if (!isDryRun) {
        await doc.ref.update(updates);
      }
      updated++;
    }
  }
  console.log(`qualificationApplications: ${updated} updated, ${snap.size - updated} unchanged.`);
}

async function migrateInquiries() {
  console.log(`\n--- 4. Migrating inquiries ---`);
  const snap = await db.collection('inquiries').get();
  console.log(`Found ${snap.size} inquiries documents.`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedKeys = [];

    // Migrate fullName -> clientName if needed
    if (data.fullName !== undefined) {
      if (!data.clientName && data.fullName) {
        updates.clientName = data.fullName;
      }
      updates.fullName = admin.firestore.FieldValue.delete();
      removedKeys.push('fullName');
    }

    // Migrate cellphone -> phoneNumber if needed
    if (data.cellphone !== undefined) {
      if (!data.phoneNumber && data.cellphone) {
        updates.phoneNumber = data.cellphone;
      }
      updates.cellphone = admin.firestore.FieldValue.delete();
      removedKeys.push('cellphone');
    }

    if (removedKeys.length > 0) {
      console.log(`  [${doc.id}] Removing duplicate fields: ${removedKeys.join(', ')}`);
      if (!isDryRun) {
        await doc.ref.update(updates);
      }
      updated++;
    }
  }
  console.log(`inquiries: ${updated} updated, ${snap.size - updated} unchanged.`);
}

async function migrateAppointments() {
  console.log(`\n--- 5. Migrating appointments ---`);
  const snap = await db.collection('appointments').get();
  console.log(`Found ${snap.size} appointments documents.`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedKeys = [];

    // Migrate branchName -> preferredBranchLocation if needed
    if (data.branchName !== undefined) {
      if (!data.preferredBranchLocation && data.branchName) {
        updates.preferredBranchLocation = data.branchName;
      }
      updates.branchName = admin.firestore.FieldValue.delete();
      removedKeys.push('branchName');
    }

    // Migrate operatorId -> branchUid if needed
    if (data.operatorId !== undefined) {
      if (!data.branchUid && data.operatorId) {
        updates.branchUid = data.operatorId;
      }
      updates.operatorId = admin.firestore.FieldValue.delete();
      removedKeys.push('operatorId');
    }

    if (removedKeys.length > 0) {
      console.log(`  [${doc.id}] Removing duplicate fields: ${removedKeys.join(', ')}`);
      if (!isDryRun) {
        await doc.ref.update(updates);
      }
      updated++;
    }
  }
  console.log(`appointments: ${updated} updated, ${snap.size - updated} unchanged.`);
}

async function migrateConversations() {
  console.log(`\n--- 6. Migrating conversations & message subcollections ---`);
  const snap = await db.collection('conversations').get();
  console.log(`Found ${snap.size} conversations documents.`);

  let updatedConv = 0;
  let updatedMsgs = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const removedKeys = [];

    if (data.participantDetails !== undefined) {
      updates.participantDetails = admin.firestore.FieldValue.delete();
      removedKeys.push('participantDetails');
    }

    if (data.participantRoles !== undefined) {
      updates.participantRoles = admin.firestore.FieldValue.delete();
      removedKeys.push('participantRoles');
    }

    if (data.lastMessageSenderName !== undefined) {
      updates.lastMessageSenderName = admin.firestore.FieldValue.delete();
      removedKeys.push('lastMessageSenderName');
    }

    if (removedKeys.length > 0) {
      console.log(`  [${doc.id}] Removing: ${removedKeys.join(', ')}`);
      if (!isDryRun) {
        await doc.ref.update(updates);
      }
      updatedConv++;
    }

    // Migrate messages subcollection
    const msgsSnap = await doc.ref.collection('messages').get();
    for (const msgDoc of msgsSnap.docs) {
      const mData = msgDoc.data();
      const mUpdates = {};
      const mRemovedKeys = [];

      ['senderName', 'senderRole', 'read', 'timestamp'].forEach(field => {
        if (mData[field] !== undefined) {
          mUpdates[field] = admin.firestore.FieldValue.delete();
          mRemovedKeys.push(field);
        }
      });

      if (!mData.createdAt && mData.timestamp) {
        mUpdates.createdAt = mData.timestamp;
      }

      if (mRemovedKeys.length > 0) {
        console.log(`    [msg ${msgDoc.id}] Removing: ${mRemovedKeys.join(', ')}`);
        if (!isDryRun) {
          await msgDoc.ref.update(mUpdates);
        }
        updatedMsgs++;
      }
    }
  }
  console.log(`conversations: ${updatedConv} updated, messages: ${updatedMsgs} updated.`);
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`FAIRFLY FIRESTORE NORMALIZATION MIGRATION${isDryRun ? ' [DRY RUN]' : ''}`);
  console.log(`======================================================`);

  try {
    await migratePasswordResetRequests();
    await migrateTickets();
    await migrateQualificationApplications();
    await migrateInquiries();
    await migrateAppointments();
    await migrateConversations();

    console.log(`\n======================================================`);
    console.log(`MIGRATION COMPLETE${isDryRun ? ' [DRY RUN - No writes made]' : ' [SUCCESS]'}`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

run();
