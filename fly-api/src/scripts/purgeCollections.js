/**
 * purgeCollections.js
 * Deletes all documents in:
 * - payments
 * - inquiries
 * - quotations
 * - submitted_requirements
 * as requested in the workflow remodel specification.
 */

const { db } = require('../config/firebase');

const COLLECTIONS_TO_PURGE = [
  'payments',
  'inquiries',
  'quotations',
  'submitted_requirements'
];

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  let totalDeleted = 0;

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });

  async function deleteQueryBatch(q, resolve, reject) {
    try {
      const snapshot = await q.get();

      const batchSize = snapshot.size;
      if (batchSize === 0) {
        resolve(totalDeleted);
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      totalDeleted += batchSize;
      process.nextTick(() => {
        deleteQueryBatch(q, resolve, reject);
      });
    } catch (err) {
      reject(err);
    }
  }
}

async function runPurge() {
  console.log('========================================================');
  console.log('STARTING FIRESTORE PURGE OF SPECIFIED COLLECTIONS');
  console.log('========================================================\n');

  for (const coll of COLLECTIONS_TO_PURGE) {
    console.log(`Purging collection "${coll}"...`);
    const count = await deleteCollection(coll);
    console.log(`✓ Purged ${count} document(s) from "${coll}".`);
  }

  // Also purge any test service created during verification
  const testServiceRef = db.collection('services').doc('SVC-TEST-REMODEL-001');
  const testServiceSnap = await testServiceRef.get();
  if (testServiceSnap.exists) {
    await testServiceRef.delete();
    console.log('✓ Purged test service SVC-TEST-REMODEL-001.');
  }

  // Also clean up any test fulfillments in activeServices starting with SVC-
  const activeServicesSnap = await db.collection('activeServices').get();
  const activeBatch = db.batch();
  let testActiveCount = 0;
  activeServicesSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (
      (data.quotationId && (data.quotationId.startsWith('QTN-') || data.quotationId.startsWith('QT-'))) ||
      doc.id.includes('TEST') ||
      (data.clientName && (data.clientName.includes('Juan Dela Cruz') || data.clientName.includes('Pedro Penduko') || data.clientName.includes('Elena Rostova') || data.clientName.includes('Maria Clara')))
    ) {
      activeBatch.delete(doc.ref);
      testActiveCount++;
    }
  });
  if (testActiveCount > 0) {
    await activeBatch.commit();
    console.log(`✓ Purged ${testActiveCount} test record(s) from activeServices.`);
  }

  console.log('\n========================================================');
  console.log('ALL SPECIFIED COLLECTIONS SUCCESSFULLY PURGED!');
  console.log('========================================================\n');
}

runPurge()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Purge failed:', err);
    process.exit(1);
  });
