const { admin, db } = require('../config/firebase');

async function main() {
  const isExecute = process.argv.includes('--execute');
  console.log(`\n======================================================`);
  console.log(`=== SCANNING USERS, PAYMENTS & ACTIVE SERVICES (${isExecute ? 'EXECUTE' : 'DRY RUN'}) ===`);
  console.log(`======================================================\n`);

  // 1. Scan User table for all role === 'operator' (and also check if 'branch_operator' exists)
  const usersSnap = await db.collection('users').get();
  const recordedOperators = new Map();

  usersSnap.forEach((doc) => {
    const data = doc.data();
    const role = (data.role || '').toLowerCase();
    if (role === 'operator' || role === 'branch_operator') {
      recordedOperators.set(doc.id, {
        id: doc.id,
        role: data.role,
        branchName: data.branchName || data.name || data.fullName || 'Unnamed Branch',
        email: data.email || ''
      });
    }
  });

  console.log(`Found ${recordedOperators.size} recorded operator(s) in 'users' collection:`);
  for (const [opId, opInfo] of recordedOperators.entries()) {
    console.log(`  - [${opId}] ${opInfo.branchName} (${opInfo.email}, role: ${opInfo.role})`);
  }

  // Helper to check if an operator ID is recognized
  const isRecognizedOperator = (opId) => {
    if (!opId) return false;
    return recordedOperators.has(opId);
  };

  // 2. Scan payments collection
  const paymentsSnap = await db.collection('payments').get();
  const orphanedPayments = [];
  const validPayments = [];

  paymentsSnap.forEach((doc) => {
    const data = doc.data();
    const opId = data.operatorId || data.branchUid || null;
    const isOrphan = !isRecognizedOperator(opId);

    if (isOrphan) {
      orphanedPayments.push({
        id: doc.id,
        operatorId: opId,
        branchName: data.branchName || 'Unknown',
        amount: Number(data.amount || 0),
        status: data.status,
        clientName: data.clientName || 'Unknown Client',
        fulfillmentId: data.fulfillmentId || null,
        paidAt: data.paidAt || data.createdAt || null
      });
    } else {
      validPayments.push({
        id: doc.id,
        operatorId: opId,
        branchName: data.branchName || recordedOperators.get(opId)?.branchName,
        amount: Number(data.amount || 0),
        status: data.status,
        clientName: data.clientName || 'Unknown Client',
        fulfillmentId: data.fulfillmentId || null,
        paidAt: data.paidAt || data.createdAt || null
      });
    }
  });

  console.log(`\nPayments scan results:`);
  console.log(`  Total payments: ${paymentsSnap.size}`);
  console.log(`  Valid payments: ${validPayments.length}`);
  console.log(`  Orphaned payments: ${orphanedPayments.length}`);

  if (orphanedPayments.length > 0) {
    console.log(`\n  Orphaned payments details:`);
    orphanedPayments.forEach((p) => {
      console.log(`    - ID: ${p.id} | Op: ${p.operatorId} (${p.branchName}) | Amount: ₱${p.amount} | Status: ${p.status} | Client: ${p.clientName}`);
    });
  }

  // 3. Scan activeServices collection
  const servicesSnap = await db.collection('activeServices').get();
  const orphanedServices = [];
  const validServices = [];

  servicesSnap.forEach((doc) => {
    const data = doc.data();
    const opId = data.fulfilledBranchUid || data.branchUid || data.operatorId || null;
    const isOrphan = !isRecognizedOperator(opId);

    if (isOrphan) {
      orphanedServices.push({
        id: doc.id,
        operatorId: opId,
        serviceTitle: data.serviceTitle || data.title || 'Untitled Service',
        status: data.status,
        clientName: data.clientName || 'Unknown Client',
        createdAt: data.createdAt || null
      });
    } else {
      validServices.push({
        id: doc.id,
        operatorId: opId,
        serviceTitle: data.serviceTitle || data.title || 'Untitled Service',
        status: data.status,
        clientName: data.clientName || 'Unknown Client',
        createdAt: data.createdAt || null
      });
    }
  });

  console.log(`\nActiveServices scan results:`);
  console.log(`  Total active services: ${servicesSnap.size}`);
  console.log(`  Valid active services: ${validServices.length}`);
  console.log(`  Orphaned active services: ${orphanedServices.length}`);

  if (orphanedServices.length > 0) {
    console.log(`\n  Orphaned active services details:`);
    orphanedServices.forEach((s) => {
      console.log(`    - ID: ${s.id} | Op: ${s.operatorId} | Title: ${s.serviceTitle} | Status: ${s.status} | Client: ${s.clientName}`);
    });
  }

  // 4. Scan receipts collection for orphaned receipts
  const receiptsSnap = await db.collection('receipts').get();
  const orphanedReceipts = [];
  receiptsSnap.forEach((doc) => {
    const data = doc.data();
    const opId = data.operatorId || data.branchUid || null;
    const isOrphanOp = !isRecognizedOperator(opId);
    const isOrphanPayment = orphanedPayments.some(p => p.id === data.paymentId);
    if (isOrphanOp || isOrphanPayment) {
      orphanedReceipts.push({
        id: doc.id,
        operatorId: opId,
        paymentId: data.paymentId,
        receiptNo: data.receiptNo || 'N/A'
      });
    }
  });

  console.log(`\nReceipts scan results:`);
  console.log(`  Total receipts: ${receiptsSnap.size}`);
  console.log(`  Orphaned receipts to delete: ${orphanedReceipts.length}`);

  // 5. If execution requested, delete orphaned payments, activeServices, and receipts
  if (isExecute) {
    console.log(`\nDeleting ${orphanedPayments.length} payment(s), ${orphanedServices.length} active service(s), and ${orphanedReceipts.length} receipt(s)...`);
    
    let batch = db.batch();
    let count = 0;

    for (const p of orphanedPayments) {
      batch.delete(db.collection('payments').doc(p.id));
      count++;
      if (count === 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    for (const s of orphanedServices) {
      batch.delete(db.collection('activeServices').doc(s.id));
      count++;
      if (count === 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    for (const r of orphanedReceipts) {
      batch.delete(db.collection('receipts').doc(r.id));
      count++;
      if (count === 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
    console.log(`Deletion completed successfully.`);

    // 6. Update system_stats per usual!
    console.log(`\nUpdating system_stats/revenue...`);
    
    // Recalculate directly from remaining valid PAID payments and recorded operators
    const remainingPaidPayments = validPayments.filter(p => p.status === 'PAID');
    let totalRevenue = 0;
    let paidCount = 0;

    const operatorStatsMap = {};
    for (const [opId, opInfo] of recordedOperators.entries()) {
      operatorStatsMap[opId] = {
        operatorId: opId,
        branchName: opInfo.branchName,
        email: opInfo.email,
        totalRevenue: 0,
        paidCount: 0
      };
    }

    remainingPaidPayments.forEach((p) => {
      const amt = Number(p.amount || 0);
      totalRevenue += amt;
      paidCount += 1;
      if (operatorStatsMap[p.operatorId]) {
        operatorStatsMap[p.operatorId].totalRevenue += amt;
        operatorStatsMap[p.operatorId].paidCount += 1;
      }
    });

    const now = new Date().toISOString();
    const systemStatsRef = db.collection('system_stats').doc('revenue');
    await systemStatsRef.set({
      totalRevenue,
      paidCount,
      currency: 'PHP',
      operators: operatorStatsMap,
      updatedAt: now,
      syncedBy: 'admin-cleanup-script'
    });

    console.log(`\n=== SYSTEM STATS UPDATED ===`);
    console.log(`Total Revenue: ₱${totalRevenue}`);
    console.log(`Total Paid Count: ${paidCount}`);
    console.log(`Operators breakdown:`, JSON.stringify(operatorStatsMap, null, 2));
  } else {
    console.log(`\n[DRY RUN ONLY] Run with --execute to perform deletions and update system_stats.`);
  }
}

main().then(() => {
  console.log(`\nDone.`);
  process.exit(0);
}).catch((err) => {
  console.error(`Error:`, err);
  process.exit(1);
});
