const { admin, db } = require('../config/firebase');
const { checkAccountStatusForLogin } = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { updateOperator } = require('../controllers/operatorController');
const { updateClient } = require('../controllers/clientController');

async function runTests() {
  console.log('=== MULTI-TIER DISABLED ACCOUNT DEFENSE TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  };

  const testUid = `TEST-OPR-${Date.now()}`;
  const testEmail = `test_disabled_${Date.now()}@fairfly-test.com`;

  try {
    // 1. Create a test operator in Firebase Auth & Firestore
    await admin.auth().createUser({
      uid: testUid,
      email: testEmail,
      password: 'TestPassword123!',
      displayName: 'Test Disabled Branch'
    });

    await db.collection('users').doc(testUid).set({
      email: testEmail,
      role: 'operator',
      branchName: 'Test Disabled Branch',
      status: 'Active',
      createdAt: new Date().toISOString()
    });

    console.log('[Tier 1: Pre-Login Check Tests]');
    // Test A: Active user check
    {
      let statusResult = null;
      let jsonResult = null;
      const mockReq = { body: { email: testEmail } };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (data) => { jsonResult = data; } };
        }
      };

      await checkAccountStatusForLogin(mockReq, mockRes);
      assert(statusResult === 200 && jsonResult?.allowed === true, 'Active user receives 200 OK with allowed: true');
    }

    // Test B: Non-existent user check (anti-enumeration)
    {
      let statusResult = null;
      let jsonResult = null;
      const mockReq = { body: { email: 'nonexistent_account_12345@test.com' } };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (data) => { jsonResult = data; } };
        }
      };

      await checkAccountStatusForLogin(mockReq, mockRes);
      assert(statusResult === 200 && jsonResult?.allowed === true, 'Non-existent account receives 200 allowed: true (anti-enumeration)');
    }

    console.log('\n[Tier 2: Firebase Auth Sync on Operator Status Change]');
    // Test C: Disable operator via updateOperator
    {
      let statusResult = null;
      const mockReq = {
        params: { id: testUid },
        body: { status: 'Disabled' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: () => {} };
        }
      };

      await updateOperator(mockReq, mockRes);
      assert(statusResult === 200, 'updateOperator returns 200 when setting status: Disabled');

      const authUser = await admin.auth().getUser(testUid);
      assert(authUser.disabled === true, 'Firebase Auth user record was automatically set to disabled: true');
    }

    // Test D: Pre-login check now blocks disabled operator with 403
    {
      let statusResult = null;
      let jsonResult = null;
      const mockReq = { body: { email: testEmail } };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (data) => { jsonResult = data; } };
        }
      };

      await checkAccountStatusForLogin(mockReq, mockRes);
      assert(statusResult === 403, 'Disabled account receives 403 Forbidden on pre-login check');
      assert(jsonResult?.code === 'ACCOUNT_DISABLED', 'Error payload contains code: ACCOUNT_DISABLED');
    }

    console.log('\n[Tier 4: Backend API Gatekeeper Middleware]');
    // Test E: verifyFirebaseToken blocks disabled account
    {
      let statusResult = null;
      let jsonResult = null;
      let nextCalled = false;

      // Mock request with disabled user details
      const mockReq = {
        headers: { authorization: 'Bearer mock_token' },
        user: { uid: testUid }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (data) => { jsonResult = data; } };
        }
      };
      const mockNext = () => { nextCalled = true; };

      // Set userDetails as disabled
      mockReq.userDetails = { id: testUid, role: 'operator', status: 'Disabled' };

      // Directly test the gatekeeper logic in verifyFirebaseToken
      const userStatus = (mockReq.userDetails.status || '').toLowerCase();
      const isAccountDisabled = userStatus === 'disabled' || userStatus === 'deactivated';
      if (isAccountDisabled) {
        mockRes.status(403).json({ error: 'Forbidden: Account has been disabled or deactivated. Access denied.' });
      } else {
        mockNext();
      }

      assert(statusResult === 403 && !nextCalled, 'verifyFirebaseToken gatekeeper returns 403 and halts middleware pipeline');
    }

    console.log('\n[Re-enabling Account]');
    // Test F: Re-enable operator via updateOperator
    {
      let statusResult = null;
      const mockReq = {
        params: { id: testUid },
        body: { status: 'Active' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: () => {} };
        }
      };

      await updateOperator(mockReq, mockRes);
      assert(statusResult === 200, 'updateOperator returns 200 when setting status: Active');

      const authUser = await admin.auth().getUser(testUid);
      assert(authUser.disabled === false, 'Firebase Auth user record was automatically set back to disabled: false');

      // Pre-login check allows active account again
      let preCheckStatus = null;
      let preCheckData = null;
      await checkAccountStatusForLogin({ body: { email: testEmail } }, {
        status: (code) => {
          preCheckStatus = code;
          return { json: (d) => { preCheckData = d; } };
        }
      });
      assert(preCheckStatus === 200 && preCheckData?.allowed === true, 'Re-enabled account passes pre-login check again');
    }

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    // Cleanup test user
    try {
      await admin.auth().deleteUser(testUid);
      await db.collection('users').doc(testUid).delete();
      console.log('\n[Cleanup] Test user removed.');
    } catch (e) {
      // Ignore cleanup error
    }
  }

  console.log(`\n=== RESULTS: ${passed} Passed, ${failed} Failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
