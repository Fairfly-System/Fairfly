const { db } = require('../config/firebase');
const { userCache } = require('../services/cacheService');

async function testChatNormalization() {
  console.log('================================================================');
  console.log('Testing Chat Conversations Normalization & Profile Resolution');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Check live Firestore conversation documents
    const convSnap = await db.collection('conversations').limit(5).get();
    console.log(`--- Test 1: Live Firestore Conversation Document Schema (${convSnap.size} docs) ---`);
    for (const doc of convSnap.docs) {
      const data = doc.data();
      assert(Array.isArray(data.participants), `[${doc.id}] Has participants array`);
      assert(data.participantDetails === undefined, `[${doc.id}] Pruned redundant participantDetails`);
      assert(data.participantRoles === undefined, `[${doc.id}] Pruned redundant participantRoles`);
      assert(typeof data.unreadCount === 'object', `[${doc.id}] Preserves unreadCount mapping`);
      assert(data.createdAt !== undefined, `[${doc.id}] Preserves createdAt timestamp`);
    }

    // 2. Test userCache resolution for participants
    console.log('\n--- Test 2: User Profile Cache & Resolution ---');
    const userSnap = await db.collection('users').limit(2).get();
    const testUids = userSnap.docs.map(d => d.id);

    for (const uid of testUids) {
      let uData = userCache.get(uid);
      if (!uData) {
        const uDoc = await db.collection('users').doc(uid).get();
        uData = uDoc.data();
        userCache.set(uid, uData);
      }
      assert(uData !== undefined, `Resolved user data for ${uid}`);
      assert(userCache.get(uid) !== undefined, `Cached user data in memory for ${uid}`);
    }

    console.log('\n================================================================');
    console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testChatNormalization();
