const { db } = require('../config/firebase');
const { sanitizeFolder } = require('../utils/fileSecurity');
const { COLLECTIONS: DB_COLLECTIONS, getFromDatabase, updateToDatabase, deleteFromDatabase } = require('../services/firebaseService');

const COLLECTIONS = {
  FRANCHISE_APPLICATIONS: 'franchiseApplications',
  APPOINTMENTS: 'appointments',
  USERS: 'users'
};

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3] ? match[3].toUpperCase() : null;

  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function checkCollision(existingSlots, newStartStr, newEndStr) {
  const newStart = timeToMinutes(newStartStr);
  const newEnd = timeToMinutes(newEndStr);
  if (newStart === null || newEnd === null || newEnd <= newStart) {
    throw new Error('Invalid new time interval');
  }

  for (const existing of existingSlots) {
    const existingStart = timeToMinutes(existing.startTime || existing.time);
    const existingEnd = timeToMinutes(existing.endTime) || (existingStart !== null ? existingStart + 60 : null);

    if (existingStart !== null && existingEnd !== null) {
      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          collision: true,
          conflictingSlot: `${existing.startTime || existing.time} - ${existing.endTime || 'end'}`
        };
      }
    }
  }

  return { collision: false };
}

async function runTests() {
  console.log('================================================================');
  console.log('Testing Franchisee Application & Consultation Workflow');
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

  const testAppId = `FRA-TEST-${Date.now()}`;
  const testApptId = `APPT-TEST-${Date.now()}`;
  const mockOperatorUid = `OP-TEST-${Date.now()}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Storage Subfolder Security & Validation
    // -------------------------------------------------------------
    console.log('--- Test 1: Storage Subfolder Security for Franchise Applications ---');

    const validFolder = sanitizeFolder(`franchise_applications/${testAppId}/proofs`);
    assert(validFolder === `franchise_applications/${testAppId}/proofs`, 'Allows franchise_applications/{appId}/proofs');

    const validContracts = sanitizeFolder(`franchise_applications/${testAppId}/contracts`);
    assert(validContracts === `franchise_applications/${testAppId}/contracts`, 'Allows franchise_applications/{appId}/contracts');

    const validConsultations = sanitizeFolder(`franchise_applications/${testAppId}/consultations`);
    assert(validConsultations === `franchise_applications/${testAppId}/consultations`, 'Allows franchise_applications/{appId}/consultations');

    const sanitizedUnauthorized = sanitizeFolder(`franchise_applications/${testAppId}/unauthorized`);
    assert(sanitizedUnauthorized === `franchise_applications/${testAppId}/proofs`, 'Normalizes unauthorized subfolder to proofs fallback');

    const sanitizedFlat = sanitizeFolder(`franchise_applications/${testAppId}`);
    assert(sanitizedFlat === `franchise_applications/${testAppId}/proofs`, 'Enforces 3-level folder structure with proofs fallback');

    // -------------------------------------------------------------
    // Test 2: Consultation Collision Detection Logic
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Consultation Time Slot Collision Detection ---');

    const existingSlots = [
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '14:00', endTime: '15:30' }
    ];

    // 2.1 Overlapping slots
    const testOverlap1 = checkCollision(existingSlots, '10:30', '11:30');
    assert(testOverlap1.collision === true, 'Detects partial overlap: 10:30-11:30 collides with 10:00-11:00');

    const testOverlap2 = checkCollision(existingSlots, '09:30', '10:30');
    assert(testOverlap2.collision === true, 'Detects start overlap: 09:30-10:30 collides with 10:00-11:00');

    const testSubset = checkCollision(existingSlots, '10:15', '10:45');
    assert(testSubset.collision === true, 'Detects interior subset: 10:15-10:45 collides with 10:00-11:00');

    const testSuperset = checkCollision(existingSlots, '09:00', '12:00');
    assert(testSuperset.collision === true, 'Detects superset encompassing slot: 09:00-12:00 collides with 10:00-11:00');

    // 2.2 Non-overlapping adjacent slots
    const testAdjacentAfter = checkCollision(existingSlots, '11:00', '12:00');
    assert(testAdjacentAfter.collision === false, 'Allows adjacent subsequent slot: 11:00-12:00 does NOT collide with 10:00-11:00');

    const testAdjacentBefore = checkCollision(existingSlots, '09:00', '10:00');
    assert(testAdjacentBefore.collision === false, 'Allows adjacent preceding slot: 09:00-10:00 does NOT collide with 10:00-11:00');

    const testMiddleSlot = checkCollision(existingSlots, '11:30', '13:30');
    assert(testMiddleSlot.collision === false, 'Allows non-overlapping slot in between: 11:30-13:30 is clear');

    // -------------------------------------------------------------
    // Test 3: Franchise Application Creation & Scheduling
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Application Submission with Proofs & Consultation Scheduling ---');

    const testApplicationData = {
      id: testAppId,
      fullName: 'Test Applicant Juan Dela Cruz',
      email: `test.applicant.${Date.now()}@example.com`,
      phone: '+63 917 123 4567',
      preferredBranchLocation: 'Quezon City Branch',
      preferredMeetingDate: '2026-10-20',
      preferredMeetingStartTime: '10:00',
      preferredMeetingEndTime: '11:00',
      proofOfCapability: [
        {
          name: 'financial_statement.pdf',
          url: 'https://storage.googleapis.com/fairfly/franchise_applications/test/proofs/financial_statement.pdf',
          size: 204800,
          type: 'application/pdf'
        }
      ],
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await db.collection('franchiseApplications').doc(testAppId).set(testApplicationData);
    const savedApp = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`);
    assert(savedApp && savedApp.id === testAppId, 'Saved franchise application in Firestore');
    assert(savedApp.proofOfCapability.length === 1, 'Preserves proofOfCapability file attachments');

    // Schedule consultation appointment
    const consultationAppointment = {
      id: testApptId,
      franchiseApplicationId: testAppId,
      clientName: savedApp.fullName,
      clientEmail: savedApp.email,
      clientPhone: savedApp.phone,
      preferredBranchLocation: savedApp.preferredBranchLocation,
      branchName: savedApp.preferredBranchLocation,
      preferredDate: '2026-10-20',
      startTime: '10:00',
      endTime: '11:00',
      type: 'franchise_consultation',
      status: 'Confirmed',
      proofOfCapability: savedApp.proofOfCapability,
      notes: 'Initial franchise qualification meeting',
      createdAt: new Date().toISOString()
    };

    await db.collection('appointments').doc(testApptId).set(consultationAppointment);
    await updateToDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`, {
      status: 'appointment_scheduled',
      consultationAppointmentId: testApptId,
      updatedAt: new Date().toISOString()
    });

    const updatedApp = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`);
    assert(updatedApp.status === 'appointment_scheduled', 'Updated franchise application status to appointment_scheduled');
    assert(updatedApp.consultationAppointmentId === testApptId, 'Linked consultationAppointmentId to franchise application');

    // -------------------------------------------------------------
    // Test 4: Post-Consultation Operator Account Creation & Approval Link
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Post-Consultation Franchise Approval & Operator Linking ---');

    // Simulate operator creation linking logic (as performed in operatorController.js)
    const appDbPath = `${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`;
    const existingApp = await getFromDatabase(appDbPath);
    assert(Boolean(existingApp), 'Found existing franchise application for linking');

    if (existingApp) {
      await updateToDatabase(appDbPath, {
        status: 'approved',
        operatorId: mockOperatorUid,
        updatedAt: new Date().toISOString()
      });

      const apptDbPath = `${COLLECTIONS.APPOINTMENTS}/${testApptId}`;
      await updateToDatabase(apptDbPath, {
        operatorId: mockOperatorUid,
        status: 'Completed',
        updatedAt: new Date().toISOString()
      });
    }

    const finalizedApp = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`);
    assert(finalizedApp.status === 'approved', 'Franchise application transitioned to approved status');
    assert(finalizedApp.operatorId === mockOperatorUid, `Franchise application correctly linked to operatorId: ${mockOperatorUid}`);

    const finalizedAppt = await getFromDatabase(`${COLLECTIONS.APPOINTMENTS}/${testApptId}`);
    assert(finalizedAppt.status === 'Completed', 'Consultation appointment transitioned to Completed status');
    assert(finalizedAppt.operatorId === mockOperatorUid, 'Consultation appointment linked to new operator UID');

    // -------------------------------------------------------------
    // Clean up test records
    // -------------------------------------------------------------
    console.log('\n--- Cleaning up test records ---');
    await deleteFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`);
    await deleteFromDatabase(`${COLLECTIONS.APPOINTMENTS}/${testApptId}`);
    console.log('  [CLEANUP] Deleted test documents successfully');

    console.log('\n================================================================');
    console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    try {
      await deleteFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${testAppId}`);
      await deleteFromDatabase(`${COLLECTIONS.APPOINTMENTS}/${testApptId}`);
    } catch (_) {}
    process.exit(1);
  }
}

runTests();
