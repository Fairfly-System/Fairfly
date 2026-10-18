const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Known test identifiers
const TEST_OPERATOR_IDS = new Set([
  'operator_branch_001',
  'operator_branch_valiuag_001',
  'BRANCH-P6-VERIFY-001'
]);

const TEST_CLIENT_KEYWORDS = [
  'pedro penduko',
  'maria clara',
  'juan dela cruz',
  'roberto gomez',
  'maria santos',
  'client_test_receipt',
  'client_online',
  'client-p6-verify'
];

// Legitimate records explicitly to KEEP (Belonging to valid recorded operators)
const KEEP_PAYMENT_IDS = new Set([
  'PAY-2wNsyO3dIQPU5eG0w8RX', // Reimier Reyes (₱38,888, Baliuag Branch)
  'PAY-W2MMf7kQTqS8Csjhz6Ij'  // Client 1 (₱1,500, Baliuag Branch)
]);

const KEEP_SERVICE_IDS = new Set([
  'SVC-vom5AF4pa2Hd2jwSmAuO', // Baliuag Branch Completed
  'SVC-jcGhsVi5TlIfrsrmHDFY'  // Baliuag Branch Pending
]);

function isTestPayment(id, data) {
  if (KEEP_PAYMENT_IDS.has(id)) return false;
  if (id.startsWith('PAY-TEST-')) return true;

  const opId = data.operatorId || '';
  if (TEST_OPERATOR_IDS.has(opId)) return true;

  const clientName = (data.clientName || '').toLowerCase();
  const clientUid = (data.clientUid || '').toLowerCase();
  for (const kw of TEST_CLIENT_KEYWORDS) {
    if (clientName.includes(kw) || clientUid.includes(kw)) return true;
  }

  // Orphan walk-in QR or unlinked payments without fulfillment
  if (!data.fulfillmentId && data.status === 'PAYMENT_PENDING') return true;

  // Unlinked from active services
  if (data.fulfillmentId && !KEEP_SERVICE_IDS.has(data.fulfillmentId)) return true;

  return true;
}

function isTestService(id, data) {
  if (KEEP_SERVICE_IDS.has(id)) return false;

  const opId = data.operatorId || data.branchUid || '';
  if (TEST_OPERATOR_IDS.has(opId)) return true;

  const clientName = (data.clientName || '').toLowerCase();
  const clientUid = (data.clientUid || '').toLowerCase();
  for (const kw of TEST_CLIENT_KEYWORDS) {
    if (clientName.includes(kw) || clientUid.includes(kw)) return true;
  }

  return true;
}

async function runCleanup(execute = false) {
  console.log(`=== STARTING ${execute ? 'EXECUTION' : 'DRY-RUN'} OF TEST DATA CLEANUP ===\n`);

  // 1. Audit payments
  const paymentsSnap = await db.collection('payments').get();
  const paymentsToDelete = [];
  const paymentsToKeep = [];

  paymentsSnap.forEach((doc) => {
    const data = doc.data();
    if (isTestPayment(doc.id, data)) {
      paymentsToDelete.push({ id: doc.id, client: data.clientName, amount: data.amount, op: data.operatorId, svc: data.fulfillmentId });
    } else {
      paymentsToKeep.push({ id: doc.id, client: data.clientName, amount: data.amount, op: data.operatorId, svc: data.fulfillmentId, status: data.status });
    }
  });

  console.log(`Payments total: ${paymentsSnap.size}`);
  console.log(`Payments to DELETE: ${paymentsToDelete.length}`);
  console.log(`Payments to KEEP: ${paymentsToKeep.length}`);
  console.log('\nRetained payments:', JSON.stringify(paymentsToKeep, null, 2));

  // 2. Audit activeServices
  const servicesSnap = await db.collection('activeServices').get();
  const servicesToDelete = [];
  const servicesToKeep = [];

  servicesSnap.forEach((doc) => {
    const data = doc.data();
    if (isTestService(doc.id, data)) {
      servicesToDelete.push({ id: doc.id, client: data.clientName, op: data.operatorId || data.branchUid, status: data.status });
    } else {
      servicesToKeep.push({ id: doc.id, client: data.clientName, op: data.operatorId || data.branchUid, status: data.status });
    }
  });

  console.log(`\nActiveServices total: ${servicesSnap.size}`);
  console.log(`ActiveServices to DELETE: ${servicesToDelete.length}`);
  console.log(`ActiveServices to KEEP: ${servicesToKeep.length}`);
  console.log('\nRetained activeServices:', JSON.stringify(servicesToKeep, null, 2));

  if (!execute) {
    console.log('\n[DRY RUN COMPLETE] No data was deleted. Re-run with execute = true to apply changes.');
    return;
  }

  // Execute deletion in batches (Firestore allows up to 500 ops per batch)
  console.log('\n[EXECUTING DELETIONS IN BATCHES]...');

  let batch = db.batch();
  let opCount = 0;

  for (const item of paymentsToDelete) {
    batch.delete(db.collection('payments').doc(item.id));
    opCount++;
    if (opCount === 450) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  for (const item of servicesToDelete) {
    batch.delete(db.collection('activeServices').doc(item.id));
    opCount++;
    if (opCount === 450) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  console.log(`\nSUCCESS: Deleted ${paymentsToDelete.length} test payments and ${servicesToDelete.length} test activeServices!`);
}

const shouldExecute = process.argv.includes('--execute');
runCleanup(shouldExecute).catch(console.error);
