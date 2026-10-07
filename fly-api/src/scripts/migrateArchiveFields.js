const { db } = require('../config/firebase');

async function migrateArchiveFields() {
  console.log('Starting migration for archive and rejection fields on inquiries and quotations...');

  let inqUpdated = 0;
  let quoteUpdated = 0;

  // 1. Inquiries
  console.log('\n--- Checking inquiries collection ---');
  const inqSnap = await db.collection('inquiries').get();
  console.log(`Found ${inqSnap.size} inquiries.`);

  const inqBatch = db.batch();
  let inqBatchCount = 0;

  for (const doc of inqSnap.docs) {
    const data = doc.data();
    const needsArchiveFields = typeof data.archived !== 'boolean';

    if (needsArchiveFields) {
      inqBatch.update(doc.ref, {
        archived: false,
        archivedAt: null,
        archivedBy: null,
        archivedReason: null
      });
      inqBatchCount++;
      inqUpdated++;
    }
  }

  if (inqBatchCount > 0) {
    await inqBatch.commit();
    console.log(`Updated ${inqBatchCount} inquiries with default archive fields.`);
  } else {
    console.log('All inquiries already have archive fields initialized.');
  }

  // 2. Quotations
  console.log('\n--- Checking quotations collection ---');
  const quoteSnap = await db.collection('quotations').get();
  console.log(`Found ${quoteSnap.size} quotations.`);

  const quoteBatch = db.batch();
  let quoteBatchCount = 0;

  for (const doc of quoteSnap.docs) {
    const data = doc.data();
    const needsArchiveFields = typeof data.archived !== 'boolean';
    const needsRejectFields = data.rejectedAt === undefined;

    if (needsArchiveFields || needsRejectFields) {
      const updates = {};
      if (needsArchiveFields) {
        updates.archived = false;
        updates.archivedAt = null;
        updates.archivedBy = null;
        updates.archivedReason = null;
      }
      if (needsRejectFields) {
        updates.rejectedAt = null;
        updates.rejectedBy = null;
        updates.rejectionReason = null;
      }

      quoteBatch.update(doc.ref, updates);
      quoteBatchCount++;
      quoteUpdated++;
    }
  }

  if (quoteBatchCount > 0) {
    await quoteBatch.commit();
    console.log(`Updated ${quoteBatchCount} quotations with default archive/rejection fields.`);
  } else {
    console.log('All quotations already have archive/rejection fields initialized.');
  }

  console.log('\n======================================================');
  console.log(`Migration Complete: ${inqUpdated} inquiries, ${quoteUpdated} quotations updated.`);
  console.log('======================================================\n');
}

migrateArchiveFields()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
