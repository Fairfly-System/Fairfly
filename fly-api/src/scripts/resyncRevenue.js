const { admin, db } = require('../config/firebase');

async function resyncRevenue() {
  const isExecute = process.argv.includes('--execute');
  console.log(`\n======================================================`);
  console.log(`=== RESYNC REVENUE & OPERATOR METRICS (${isExecute ? 'EXECUTE' : 'DRY RUN'}) ===`);
  console.log(`======================================================\n`);

  // 1. Fetch operators
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
        email: data.email || '',
        currentTotalRevenue: data.totalRevenue,
        currentCompletedCount: data.completedServicesCount
      });
    }
  });

  console.log(`Found ${recordedOperators.size} operator(s):`);
  for (const [opId, opInfo] of recordedOperators.entries()) {
    console.log(`  - [${opId}] ${opInfo.branchName} (${opInfo.email})`);
    console.log(`    Current in user doc -> totalRevenue: ${opInfo.currentTotalRevenue}, completedServicesCount: ${opInfo.currentCompletedCount}`);
  }

  // 2. Fetch all PAID payments
  const paymentsSnap = await db.collection('payments').where('status', '==', 'PAID').get();
  let systemTotalRevenue = 0;
  let systemPaidCount = 0;

  const operatorPaymentStats = {};
  for (const [opId, opInfo] of recordedOperators.entries()) {
    operatorPaymentStats[opId] = {
      operatorId: opId,
      branchName: opInfo.branchName,
      email: opInfo.email,
      totalRevenue: 0,
      paidCount: 0
    };
  }

  console.log(`\nProcessing ${paymentsSnap.size} PAID payment(s):`);
  paymentsSnap.forEach((doc) => {
    const p = doc.data();
    const amount = Number(p.amount || 0);
    const opId = p.operatorId || p.branchUid;
    
    systemTotalRevenue += amount;
    systemPaidCount += 1;

    console.log(`  - Payment ${doc.id}: ₱${amount} | Operator: ${opId} (${p.branchName}) | Date: ${p.paidAt || p.createdAt}`);

    if (opId && operatorPaymentStats[opId]) {
      operatorPaymentStats[opId].totalRevenue += amount;
      operatorPaymentStats[opId].paidCount += 1;
    }
  });

  console.log(`\nCalculated System Revenue: ₱${systemTotalRevenue} (${systemPaidCount} paid payments)`);
  for (const [opId, stats] of Object.entries(operatorPaymentStats)) {
    console.log(`  - Operator [${opId}]: ₱${stats.totalRevenue} (${stats.paidCount} paid payments)`);
  }

  // 3. Fetch active services to count real completed services
  const servicesSnap = await db.collection('activeServices').where('status', '==', 'Completed').get();
  const operatorCompletedCounts = {};
  for (const opId of recordedOperators.keys()) {
    operatorCompletedCounts[opId] = 0;
  }

  console.log(`\nProcessing ${servicesSnap.size} Completed active service(s):`);
  servicesSnap.forEach((doc) => {
    const s = doc.data();
    const opId = s.fulfilledBranchUid || s.branchUid || s.operatorId;
    console.log(`  - Service ${doc.id}: ${s.serviceTitle || s.serviceType} | Op: ${opId} | Completed: ${s.completedAt}`);
    if (opId && operatorCompletedCounts[opId] !== undefined) {
      operatorCompletedCounts[opId] += 1;
    }
  });

  for (const [opId, count] of Object.entries(operatorCompletedCounts)) {
    console.log(`  - Operator [${opId}] Real Completed Services Count: ${count}`);
  }

  if (isExecute) {
    console.log(`\n[EXECUTING UPDATES]`);
    const now = new Date().toISOString();

    // 4. Overwrite system_stats/revenue cleanly (removing all dot-notated legacy keys)
    const systemStatsRef = db.collection('system_stats').doc('revenue');
    await systemStatsRef.set({
      totalRevenue: systemTotalRevenue,
      paidCount: systemPaidCount,
      currency: 'PHP',
      operators: operatorPaymentStats,
      updatedAt: now,
      syncedBy: 'resync-revenue-script'
    });
    console.log(`✓ Updated system_stats/revenue cleanly.`);

    // 5. Update each operator's user doc
    for (const [opId, stats] of Object.entries(operatorPaymentStats)) {
      const realCompleted = operatorCompletedCounts[opId] || 0;
      await db.collection('users').doc(opId).update({
        totalRevenue: stats.totalRevenue,
        completedServicesCount: realCompleted,
        updatedAt: now
      });
      console.log(`✓ Updated users/${opId}: totalRevenue=${stats.totalRevenue}, completedServicesCount=${realCompleted}`);
    }

    console.log(`\n=== RESYNC COMPLETE ===`);
  } else {
    console.log(`\n[DRY RUN] Run with --execute to apply changes to Firestore.`);
  }
}

resyncRevenue()
  .then(() => {
    console.log('Finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during resync:', err);
    process.exit(1);
  });
