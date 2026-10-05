/**
 * Clean Pseudo Requirements:
 * Finds and cleans any submitted_requirements documents or inquiries that have
 * "Specified Requirements of Client" as a pseudo document requirement.
 *
 * Usage:
 *   node src/scripts/cleanPseudoRequirements.js [--dry-run]
 */

const { db } = require('../config/firebase');

const isDryRun = process.argv.includes('--dry-run');

function isPseudoReq(r) {
  const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
  return name === 'specified requirements of client' ||
         name === 'client specified requirements' ||
         name === 'specified requirements of the client' ||
         name === 'specified requirements';
}

async function cleanPseudoRequirements() {
  console.log(`\n=== Scanning for Pseudo Requirements in Firestore ${isDryRun ? '[DRY RUN]' : '[LIVE]'} ===\n`);

  // 1. Scan submitted_requirements collection
  const reqSnap = await db.collection('submitted_requirements').get();
  console.log(`Checking ${reqSnap.size} submitted_requirements documents...`);

  let reqsCleaned = 0;
  let reqsDeleted = 0;

  for (const doc of reqSnap.docs) {
    const data = doc.data();
    if (!Array.isArray(data.requirements)) continue;

    const pseudoItems = data.requirements.filter(isPseudoReq);
    if (pseudoItems.length > 0) {
      const remaining = data.requirements.filter(r => !isPseudoReq(r));
      console.log(`  Found pseudo-requirement in ${doc.id}: ${pseudoItems.map(p => p.name || p.title).join(', ')}`);

      if (remaining.length === 0) {
        console.log(`    -> Document ${doc.id} has NO other requirements. ${isDryRun ? 'Would delete and unlink from inquiries' : 'Deleting document and unlinking from inquiries'}.`);
        if (!isDryRun) {
          await doc.ref.delete();
          // Unlink from any inquiries pointing to this doc
          const linkedInqs = await db.collection('inquiries').where('submittedRequirementsId', '==', doc.id).get();
          for (const inqDoc of linkedInqs.docs) {
            await inqDoc.ref.update({ submittedRequirementsId: null });
            console.log(`       Unlinked submittedRequirementsId from inquiry ${inqDoc.id}`);
          }
        }
        reqsDeleted++;
      } else {
        console.log(`    -> Document ${doc.id} has ${remaining.length} remaining requirements. ${isDryRun ? 'Would update' : 'Updating document'}.`);
        if (!isDryRun) {
          await doc.ref.update({
            requirements: remaining,
            updatedAt: new Date().toISOString()
          });
        }
        reqsCleaned++;
      }
    }
  }

  // 2. Scan inquiries collection
  const inqSnap = await db.collection('inquiries').get();
  console.log(`\nChecking ${inqSnap.size} inquiries documents...`);

  let inqCleaned = 0;

  for (const doc of inqSnap.docs) {
    const data = doc.data();
    let needsUpdate = false;
    const updatePayload = {};

    if (Array.isArray(data.requirements)) {
      const pseudoItems = data.requirements.filter(isPseudoReq);
      if (pseudoItems.length > 0) {
        const remaining = data.requirements.filter(r => !isPseudoReq(r));
        console.log(`  Found pseudo-requirement in inquiry ${doc.id}`);
        updatePayload.requirements = remaining;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      if (!isDryRun) {
        await doc.ref.update(updatePayload);
      }
      inqCleaned++;
    }
  }

  console.log(`\n================================================================`);
  console.log(`Summary:`);
  console.log(`  submitted_requirements deleted (empty after cleanup): ${reqsDeleted}`);
  console.log(`  submitted_requirements pruned: ${reqsCleaned}`);
  console.log(`  inquiries pruned: ${inqCleaned}`);
  console.log(`================================================================\n`);
}

cleanPseudoRequirements()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  });
