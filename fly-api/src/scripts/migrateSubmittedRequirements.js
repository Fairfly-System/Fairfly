/**
 * Migration & Cleanup Script:
 * 1. Prunes redundant data from 'submitted_requirements' collection (keeping strictly id, requirements, submittedBy, clientUid, timestamps).
 * 2. Removes bloated requirements arrays and redundant 'submitted_requirements' field from 'inquiries', 'quotations', and 'activeServices', keeping strictly 'submittedRequirementsId'.
 *
 * Usage:
 *   node src/scripts/migrateSubmittedRequirements.js [--dry-run]
 */

const { db, admin } = require('../config/firebase');
const { generatePrefixedId, ID_PREFIXES } = require('../utils/idGenerator');
const { sanitizeRequirementsArray } = require('../controllers/submittedRequirementsController');

const isDryRun = process.argv.includes('--dry-run');

/**
 * Normalizes requirement objects or strings into standard format
 */
function normalizeRequirementsList(rawReqs, specifiedReqs = '') {
  if (!rawReqs && !specifiedReqs) return [];

  const normalized = [];

  if (Array.isArray(rawReqs)) {
    for (let idx = 0; idx < rawReqs.length; idx++) {
      const item = rawReqs[idx];
      if (!item) continue;

      if (typeof item === 'string') {
        normalized.push({
          id: `req_item_${idx + 1}`,
          name: item.trim(),
          title: item.trim(),
          value: '',
          inputType: 'text',
          file: null,
          uploadedAt: new Date().toISOString()
        });
      } else if (typeof item === 'object') {
        const name = item.name || item.title || item.label || `Requirement ${idx + 1}`;
        const fileObj = item.file || item.attachment || null;
        let fileUrl = null;
        let fileName = null;
        let fileSize = null;
        let fileType = null;

        if (typeof fileObj === 'string' && fileObj.startsWith('http')) {
          fileUrl = fileObj;
          fileName = item.fileName || name;
        } else if (typeof fileObj === 'object' && fileObj) {
          fileUrl = fileObj.url || fileObj.downloadUrl || null;
          fileName = fileObj.fileName || fileObj.name || null;
          fileSize = fileObj.fileSize || fileObj.size || null;
          fileType = fileObj.fileType || fileObj.type || null;
        } else if (item.fileUrl || item.url) {
          fileUrl = item.fileUrl || item.url;
          fileName = item.fileName || name;
        }

        const value = typeof item.value === 'string' ? item.value : (item.textValue || '');

        normalized.push({
          id: item.id || `req_item_${idx + 1}`,
          name,
          title: name,
          label: item.label || name,
          value,
          inputType: item.inputType || (fileUrl ? 'file' : 'text'),
          required: item.required !== false,
          file: fileUrl ? {
            url: fileUrl,
            fileName: fileName || 'Document',
            fileSize: fileSize || null,
            fileType: fileType || null
          } : null,
          uploadedAt: item.uploadedAt || new Date().toISOString()
        });
      }
    }
  }

  // If there is raw specifiedRequirements string and nothing in the list
  if (normalized.length === 0 && typeof specifiedReqs === 'string' && specifiedReqs.trim()) {
    normalized.push({
      id: 'req_item_1',
      name: 'Client Specified Requirements',
      title: 'Client Specified Requirements',
      value: specifiedReqs.trim(),
      inputType: 'textarea',
      file: null,
      uploadedAt: new Date().toISOString()
    });
  }

  return sanitizeRequirementsArray(normalized);
}

async function runMigration() {
  console.log('================================================================');
  console.log(`Starting Submitted Requirements Schema Cleanup ${isDryRun ? '[DRY RUN]' : '[LIVE]'}`);
  console.log('================================================================\n');

  const inquiryReqMap = new Map();
  const quotationReqMap = new Map();

  let batch = db.batch();
  let batchCount = 0;

  // ---------------------------------------------------------------------------
  // Step 1: Clean & Prune 'submitted_requirements' collection
  // ---------------------------------------------------------------------------
  console.log('--- Step 1: Pruning redundant fields in submitted_requirements collection ---');
  const reqsSnap = await db.collection('submitted_requirements').get();
  console.log(`Found ${reqsSnap.size} submitted_requirements records.`);

  for (const docSnap of reqsSnap.docs) {
    const data = docSnap.data();
    const submitter = data.submittedBy || data.clientUid || null;
    const cleanRequirements = sanitizeRequirementsArray(data.requirements || []);

    const prunedPayload = {
      id: docSnap.id,
      requirements: cleanRequirements,
      submittedBy: submitter,
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: data.updatedAt || admin.firestore.FieldValue.serverTimestamp()
    };

    if (!isDryRun) {
      batch.set(docSnap.ref, prunedPayload); // Overwrites entire document with only clean fields
      batchCount++;

      if (batchCount >= 300) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (!isDryRun && batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }
  console.log(`Pruned ${reqsSnap.size} submitted_requirements records.`);

  // ---------------------------------------------------------------------------
  // Step 2: Clean & Normalize 'inquiries' collection
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 2: Cleaning inquiries collection (stripping bloat & dual key) ---');
  const inquiriesSnap = await db.collection('inquiries').get();
  console.log(`Found ${inquiriesSnap.size} inquiry records.`);

  let inquiriesCleaned = 0;
  for (const docSnap of inquiriesSnap.docs) {
    const data = docSnap.data();
    let reqId = data.submittedRequirementsId || data.submitted_requirements;

    // If no reqId yet, create a submitted_requirements doc
    if (!reqId) {
      const rawReqs = data.requirements || data.submittedRequirements || data.formAnswers;
      const rawText = data.specifiedRequirements || (typeof data.requirements === 'string' ? data.requirements : '');
      const normalizedReqs = normalizeRequirementsList(rawReqs, rawText);

      reqId = generatePrefixedId(ID_PREFIXES.SUBMITTED_REQUIREMENTS);
      const reqDocRef = db.collection('submitted_requirements').doc(reqId);
      const submitter = data.clientUid || null;

      const reqPayload = {
        id: reqId,
        requirements: normalizedReqs,
        submittedBy: submitter,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!isDryRun) {
        batch.set(reqDocRef, reqPayload);
        batchCount++;
      }
    }

    inquiryReqMap.set(docSnap.id, reqId);

    // Update inquiry doc: keep submittedRequirementsId, remove submitted_requirements and requirements array
    const updates = {
      submittedRequirementsId: reqId,
      submitted_requirements: admin.firestore.FieldValue.delete(),
      requirements: admin.firestore.FieldValue.delete(),
      submittedRequirements: admin.firestore.FieldValue.delete()
    };

    if (!isDryRun) {
      batch.update(docSnap.ref, updates);
      batchCount++;

      if (batchCount >= 300) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    inquiriesCleaned++;
  }

  if (!isDryRun && batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }
  console.log(`Cleaned ${inquiriesCleaned} inquiry records.`);

  // ---------------------------------------------------------------------------
  // Step 3: Clean & Normalize 'quotations' collection
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 3: Cleaning quotations collection (stripping bloat & dual key) ---');
  const quotationsSnap = await db.collection('quotations').get();
  console.log(`Found ${quotationsSnap.size} quotation records.`);

  let quotationsCleaned = 0;
  for (const docSnap of quotationsSnap.docs) {
    const data = docSnap.data();
    let reqId = data.submittedRequirementsId || data.submitted_requirements;

    if (!reqId && data.inquiryId && inquiryReqMap.has(data.inquiryId)) {
      reqId = inquiryReqMap.get(data.inquiryId);
    }

    if (!reqId) {
      const rawReqs = data.submittedRequirements || data.requirements;
      const normalizedReqs = normalizeRequirementsList(rawReqs);

      reqId = generatePrefixedId(ID_PREFIXES.SUBMITTED_REQUIREMENTS);
      const reqDocRef = db.collection('submitted_requirements').doc(reqId);
      const submitter = data.clientUid || null;

      const reqPayload = {
        id: reqId,
        requirements: normalizedReqs,
        submittedBy: submitter,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!isDryRun) {
        batch.set(reqDocRef, reqPayload);
        batchCount++;
      }
    }

    quotationReqMap.set(docSnap.id, reqId);

    const updates = {
      submittedRequirementsId: reqId,
      submitted_requirements: admin.firestore.FieldValue.delete(),
      submittedRequirements: admin.firestore.FieldValue.delete()
    };

    // If requirements was an array or bloated object, delete it
    if (Array.isArray(data.requirements) || typeof data.requirements === 'object') {
      updates.requirements = admin.firestore.FieldValue.delete();
    }

    if (!isDryRun) {
      batch.update(docSnap.ref, updates);
      batchCount++;

      if (batchCount >= 300) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    quotationsCleaned++;
  }

  if (!isDryRun && batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }
  console.log(`Cleaned ${quotationsCleaned} quotation records.`);

  // ---------------------------------------------------------------------------
  // Step 4: Clean & Normalize 'activeServices' collection
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 4: Cleaning activeServices collection (stripping bloat & dual key) ---');
  const activeServicesSnap = await db.collection('activeServices').get();
  console.log(`Found ${activeServicesSnap.size} activeService records.`);

  let activeServicesCleaned = 0;
  for (const docSnap of activeServicesSnap.docs) {
    const data = docSnap.data();
    let reqId = data.submittedRequirementsId || data.submitted_requirements;

    if (!reqId && data.quotationId && quotationReqMap.has(data.quotationId)) {
      reqId = quotationReqMap.get(data.quotationId);
    } else if (!reqId && data.inquiryId && inquiryReqMap.has(data.inquiryId)) {
      reqId = inquiryReqMap.get(data.inquiryId);
    }

    if (!reqId) {
      const rawReqs = data.submittedRequirements || data.requirements;
      const normalizedReqs = normalizeRequirementsList(rawReqs);

      reqId = generatePrefixedId(ID_PREFIXES.SUBMITTED_REQUIREMENTS);
      const reqDocRef = db.collection('submitted_requirements').doc(reqId);
      const submitter = data.clientUid || null;

      const reqPayload = {
        id: reqId,
        requirements: normalizedReqs,
        submittedBy: submitter,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!isDryRun) {
        batch.set(reqDocRef, reqPayload);
        batchCount++;
      }
    }

    const updates = {
      submittedRequirementsId: reqId,
      submitted_requirements: admin.firestore.FieldValue.delete(),
      submittedRequirements: admin.firestore.FieldValue.delete()
    };

    if (!isDryRun) {
      batch.update(docSnap.ref, updates);
      batchCount++;

      if (batchCount >= 300) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    activeServicesCleaned++;
  }

  if (!isDryRun && batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }
  console.log(`Cleaned ${activeServicesCleaned} activeService records.`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('MIGRATION & CLEANUP SUMMARY');
  console.log('================================================================');
  console.log(`Execution Mode:                 ${isDryRun ? 'DRY RUN (No changes saved)' : 'LIVE'}`);
  console.log(`submitted_requirements pruned:  ${reqsSnap.size}`);
  console.log(`Inquiries cleaned:              ${inquiriesCleaned}`);
  console.log(`Quotations cleaned:             ${quotationsCleaned}`);
  console.log(`Active Services cleaned:        ${activeServicesCleaned}`);
  console.log('================================================================\n');
}

runMigration()
  .then(() => {
    console.log('Schema migration and cleanup completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed with error:', err);
    process.exit(1);
  });
