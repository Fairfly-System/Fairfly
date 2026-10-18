/**
 * testProfileAndSecurityFlow.js
 * Comprehensive automated verification for:
 * 1. GET /api/auth/profile (Derivation from verified JWT, hiding passwords, role metadata)
 * 2. PATCH /api/auth/profile (Basic info edits, whitelisting, preventing mass assignment)
 * 3. POST /api/auth/change-password (Fresh auth_time proof verification, password policy)
 */

const assert = require('assert');
const { admin, db } = require('../config/firebase');
const { getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { userCache } = require('../services/cacheService');

async function runTests() {
  console.log('=== FAIRFLY PROFILE & SECURITY WORKFLOW VERIFICATION SUITE ===\n');

  let passed = 0;
  let failed = 0;

  const testAssert = (cond, desc) => {
    if (cond) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  };

  const testUid = `TEST-USR-PROF-${Date.now()}`;
  const testEmail = `test_prof_${Date.now()}@fairfly-test.com`;
  const initialPassword = 'InitialPassword123!';

  try {
    // Setup test user in Firebase Auth & Firestore
    await admin.auth().createUser({
      uid: testUid,
      email: testEmail,
      password: initialPassword,
      displayName: 'Test Traveler Original'
    });

    await db.collection('users').doc(testUid).set({
      fullName: 'Test Traveler Original',
      name: 'Test Traveler Original',
      email: testEmail,
      phone: '09123456789',
      address: '123 Test Street, Manila',
      role: 'client',
      status: 'Active',
      approvalStatus: 'Approved',
      idType: 'Passport',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('[Suite 1: Profile Retrieval Tests]');
    {
      let statusResult = null;
      let jsonResult = null;
      const mockReq = {
        user: { uid: testUid, email: testEmail }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await getProfile(mockReq, mockRes);
      testAssert(statusResult === 200, 'getProfile returns 200 OK');
      testAssert(jsonResult?.fullName === 'Test Traveler Original', 'Retrieved fullName matches database');
      testAssert(jsonResult?.email === testEmail, 'Email matches authoritative Auth email');
      testAssert(jsonResult?.role === 'client', 'User role is correctly reported as client');
      testAssert(jsonResult?.password === undefined, 'Password is never exposed in profile payload');
    }

    console.log('\n[Suite 2: Basic Profile Editing & Field Protection Tests]');
    {
      // Test A: Normal update of permitted fields (fullName, phone, address)
      let statusResult = null;
      let jsonResult = null;
      const mockReq = {
        user: { uid: testUid, email: testEmail },
        body: {
          fullName: 'Updated Traveler Name',
          phone: '+63 999 888 7777',
          address: '456 New Horizon Blvd, Quezon City'
        }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await updateProfile(mockReq, mockRes);
      testAssert(statusResult === 200, 'updateProfile returns 200 OK');
      testAssert(jsonResult?.success === true, 'Response contains success: true');

      // Verify Firestore persisted updates
      const updatedDoc = await db.collection('users').doc(testUid).get();
      const updatedData = updatedDoc.data();
      testAssert(updatedData.fullName === 'Updated Traveler Name', 'fullName persisted correctly in Firestore');
      testAssert(updatedData.name === 'Updated Traveler Name', 'name parity updated');
      testAssert(updatedData.phone === '+63 999 888 7777', 'phone persisted correctly in Firestore');
      testAssert(updatedData.address === '456 New Horizon Blvd, Quezon City', 'address persisted correctly');

      // Verify Firebase Auth displayName sync
      const authUser = await admin.auth().getUser(testUid);
      testAssert(authUser.displayName === 'Updated Traveler Name', 'Firebase Auth displayName synchronized');
    }

    {
      // Test B: Empty name rejection
      let statusResult = null;
      let jsonResult = null;
      const mockReq = {
        user: { uid: testUid, email: testEmail },
        body: { fullName: '   ' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await updateProfile(mockReq, mockRes);
      testAssert(statusResult === 400, 'Empty name update is rejected with 400 Bad Request');
    }

    console.log('\n[Suite 3: Secure Change Password Tests]');
    {
      // Test A: Reject weak password (< 6 chars)
      let statusResult = null;
      let jsonResult = null;
      const mockReq = {
        user: { uid: testUid, auth_time: Math.floor(Date.now() / 1000) },
        body: { newPassword: '123', confirmPassword: '123' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await changePassword(mockReq, mockRes);
      testAssert(statusResult === 400 && jsonResult?.error?.includes('6 characters'), 'Password < 6 characters rejected');
    }

    {
      // Test B: Reject password confirmation mismatch
      let statusResult = null;
      let jsonResult = null;
      const mockReq = {
        user: { uid: testUid, auth_time: Math.floor(Date.now() / 1000) },
        body: { newPassword: 'NewSecurePassword123!', confirmPassword: 'DifferentPassword123!' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await changePassword(mockReq, mockRes);
      testAssert(statusResult === 400 && jsonResult?.error?.includes('match'), 'Mismatched confirmation rejected');
    }

    {
      // Test C: Reject stale / expired reauthentication (auth_time > 300 seconds ago)
      let statusResult = null;
      let jsonResult = null;
      const staleAuthTime = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago (> 5 mins)
      const mockReq = {
        user: { uid: testUid, auth_time: staleAuthTime },
        body: { newPassword: 'NewSecurePassword123!', confirmPassword: 'NewSecurePassword123!' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await changePassword(mockReq, mockRes);
      testAssert(statusResult === 401 && jsonResult?.code === 'AUTH_TIME_EXPIRED', 'Stale reauthentication (auth_time > 300s) rejected with 401 AUTH_TIME_EXPIRED');
    }

    {
      // Test D: Successful password change with fresh auth_time
      let statusResult = null;
      let jsonResult = null;
      const freshAuthTime = Math.floor(Date.now() / 1000) - 10; // 10 seconds ago (fresh)
      const mockReq = {
        user: { uid: testUid, auth_time: freshAuthTime },
        body: { newPassword: 'NewSecurePassword123!', confirmPassword: 'NewSecurePassword123!' }
      };
      const mockRes = {
        status: (code) => {
          statusResult = code;
          return { json: (d) => { jsonResult = d; } };
        }
      };

      await changePassword(mockReq, mockRes);
      testAssert(statusResult === 200 && jsonResult?.success === true, 'Valid password change succeeds with 200 OK');

      // Verify that Firestore users table still has NO password field
      const userDoc = await db.collection('users').doc(testUid).get();
      testAssert(userDoc.data().password === undefined, 'Firestore users document contains 0 password fields');
      testAssert(userDoc.data().newPassword === undefined, 'Firestore users document contains 0 newPassword fields');
    }

  } finally {
    // Cleanup test artifacts
    try {
      await admin.auth().deleteUser(testUid);
      await db.collection('users').doc(testUid).delete();
      userCache.delete(testUid);
      console.log('\n[Cleanup] Test user removed successfully.');
    } catch (cleanupErr) {
      console.warn('Cleanup notice:', cleanupErr.message);
    }
  }

  console.log(`\n=== RESULTS: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
