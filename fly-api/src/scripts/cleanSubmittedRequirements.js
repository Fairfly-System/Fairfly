/**
 * Migration: Clean up submitted_requirements documents
 * Removes legacy fields: `id`, `clientUid`, `inquiryId` and any other
 * non-canonical fields from existing submitted_requirements documents.
 * 
 * Canonical fields kept: requirements, submittedBy, createdAt, updatedAt
 *
 * Usage:
 *   node src/scripts/cleanSubmittedRequirements.js [--dry-run]
 */

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const isDryRun = process.argv.includes('--dry-run');

const CANONICAL_FIELDS = new Set([
  'requirements',
  'submittedBy',
  'createdAt',
  'updatedAt'
]);

async function cleanSubmittedRequirements() {
  console.log(`\n=== Clean submitted_requirements documents${isDryRun ? ' [DRY RUN]' : ''} ===\n`);

  const snapshot = await db.collection('submitted_requirements').get();
  console.log(`Found ${snapshot.size} submitted_requirements documents.\n`);

  let cleaned = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fieldsToRemove = {};
    const extraFields = [];

    for (const key of Object.keys(data)) {
      if (!CANONICAL_FIELDS.has(key)) {
        fieldsToRemove[key] = admin.firestore.FieldValue.delete();
        extraFields.push(key);
      }
    }

    // If submittedBy is missing but clientUid exists, migrate it before deleting
    if (!data.submittedBy && data.clientUid) {
      fieldsToRemove['submittedBy'] = data.clientUid; // Set submittedBy from clientUid
      delete fieldsToRemove['clientUid']; // Still delete clientUid below
      fieldsToRemove['clientUid'] = admin.firestore.FieldValue.delete();
      console.log(`  [${doc.id}] Migrating clientUid -> submittedBy: ${data.clientUid}`);
    }

    if (extraFields.length === 0) {
      skipped++;
      continue;
    }

    console.log(`  [${doc.id}] Removing: ${extraFields.join(', ')}`);

    if (!isDryRun) {
      try {
        await doc.ref.update(fieldsToRemove);
        cleaned++;
      } catch (err) {
        console.error(`  [${doc.id}] ERROR: ${err.message}`);
        errors++;
      }
    } else {
      cleaned++;
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`  Cleaned: ${cleaned}`);
  console.log(`  Skipped (already clean): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${snapshot.size}\n`);
}

cleanSubmittedRequirements()
  .then(() => {
    console.log('Migration complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
