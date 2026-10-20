/**
 * Automated Test Suite: Phase 4 Refactor
 * Verifies:
 * 1. Support Ticket Subcollection Architecture (tickets/{ticketId}/messages)
 * 2. Unbounded Array Elimination on Root Ticket Documents
 * 3. Thread Retrieval & Lightweight List Views
 * 4. 100% Backward Compatibility for Legacy Embedded Messages & Hybrid Merging
 * 5. Appointment Datetime Unification (scheduledAt ISO 8601 UTC Timestamp with Asia/Manila PST)
 * 6. Franchise Consultation Scheduling with Unified Datetime & Collision Detection
 */

const { db } = require('../config/firebase');
const { 
  createTicket, 
  getTickets, 
  getTicketById, 
  getTicketMessages, 
  addMessageToThread 
} = require('../controllers/ticketController');
const {
  createAppointment,
  getAppointments,
  scheduleFranchiseAppointment
} = require('../controllers/appointmentController');

const createdTicketIds = [];
const createdAppointmentIds = [];
const createdFranchiseAppIds = [];

// Helper to mock express req/res
function createMockReqRes({ body = {}, params = {}, query = {}, user = {}, userDetails = {} }) {
  const req = {
    body,
    params,
    query,
    user: { uid: 'test_operator_001', email: 'operator@fairfly.com', ...user },
    userDetails: { role: 'operator', branchName: 'FairFly Main Branch', ...userDetails }
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode() { return statusCode; },
    getData() { return responseData; }
  };

  return { req, res };
}

async function runTests() {
  console.log('================================================================');
  console.log('FAIRFLY PHASE 4 ARCHITECTURAL REFACTOR TEST SUITE');
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
    // -------------------------------------------------------------
    // TEST SUITE 1: TICKET CREATION & SUBCOLLECTION ISOLATION
    // -------------------------------------------------------------
    console.log('--- TEST 1: Ticket Creation & Messages Subcollection Isolation ---');
    const { req: createReq, res: createRes } = createMockReqRes({
      body: {
        title: 'Phase 4 System Test Ticket',
        category: 'Technical',
        priority: 'High',
        initialMessage: 'Initial message testing subcollection decoupling.'
      },
      user: { uid: 'op_phase4_test' },
      userDetails: { role: 'operator', branchName: 'Bacolod Branch' }
    });

    await createTicket(createReq, createRes);
    assert(createRes.getStatusCode() === 201, 'Ticket created with HTTP 201');

    const createdData = createRes.getData();
    const ticketId = createdData.id;
    createdTicketIds.push(ticketId);

    assert(Boolean(ticketId), `Ticket ID generated: ${ticketId}`);
    assert(createdData.messageCount === 1, 'Root metadata messageCount is 1');
    assert(createdData.lastMessage === 'Initial message testing subcollection decoupling.', 'Root metadata has lastMessage');
    assert(Boolean(createdData.lastMessageAt), 'Root metadata has lastMessageAt');

    // Inspect direct Firestore root document
    const rootDocSnap = await db.collection('tickets').doc(ticketId).get();
    const rootData = rootDocSnap.data();
    assert(rootData.messages === undefined, 'Root Firestore document does NOT store bloated messages array');

    // Inspect messages subcollection
    const subColSnap = await db.collection('tickets').doc(ticketId).collection('messages').get();
    assert(subColSnap.size === 1, 'Initial message saved in tickets/{id}/messages subcollection');
    const firstMsg = subColSnap.docs[0].data();
    assert(firstMsg.message === 'Initial message testing subcollection decoupling.', 'Subcollection message content matches');
    assert(firstMsg.senderId === 'op_phase4_test', 'Subcollection message senderId matches');

    // -------------------------------------------------------------
    // TEST SUITE 2: POSTING THREAD REPLIES
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Adding Messages to Thread via Subcollection ---');
    const { req: replyReq, res: replyRes } = createMockReqRes({
      params: { id: ticketId },
      body: { message: 'Admin reply verifying thread append to subcollection.' },
      user: { uid: 'admin_test_001', email: 'admin@fairfly.com' },
      userDetails: { role: 'admin', isSuperAdmin: true, name: 'Super Admin' }
    });

    await addMessageToThread(replyReq, replyRes);
    assert(replyRes.getStatusCode() === 200, 'Reply added with HTTP 200');

    // Verify subcollection now has 2 messages
    const subColAfterReply = await db.collection('tickets').doc(ticketId).collection('messages').get();
    assert(subColAfterReply.size === 2, 'Subcollection now contains 2 messages');

    // Verify root doc updated metadata without array bloat
    const rootAfterReply = (await db.collection('tickets').doc(ticketId).get()).data();
    assert(rootAfterReply.messages === undefined, 'Root Firestore document still has NO messages array');
    assert(rootAfterReply.messageCount === 2, 'Root metadata messageCount incremented to 2');
    assert(rootAfterReply.lastMessage === 'Admin reply verifying thread append to subcollection.', 'Root metadata lastMessage updated');
    assert(rootAfterReply.status === 'Ongoing', 'Ticket status transitioned from Pending to Ongoing');

    // -------------------------------------------------------------
    // TEST SUITE 3: THREAD RETRIEVAL & DIRECT SUBCOLLECTION ENDPOINT
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Reading Ticket Thread by ID & Messages Endpoint ---');
    const { req: getReq, res: getRes } = createMockReqRes({
      params: { id: ticketId },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });

    await getTicketById(getReq, getRes);
    assert(getRes.getStatusCode() === 200, 'getTicketById returned HTTP 200');
    const fetchedTicket = getRes.getData();
    assert(Array.isArray(fetchedTicket.messages) && fetchedTicket.messages.length === 2, 'getTicketById returns 2 messages from subcollection');
    assert(fetchedTicket.participants && Object.keys(fetchedTicket.participants).length >= 1, 'Participants resolved properly');

    const { req: msgReq, res: msgRes } = createMockReqRes({
      params: { id: ticketId },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });
    await getTicketMessages(msgReq, msgRes);
    assert(msgRes.getStatusCode() === 200, 'getTicketMessages endpoint returned HTTP 200');
    assert(msgRes.getData().messages.length === 2, 'Direct subcollection endpoint returned 2 messages');

    // -------------------------------------------------------------
    // TEST SUITE 4: BACKWARD COMPATIBILITY FOR LEGACY EMBEDDED TICKETS
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Backward Compatibility with Unmigrated Legacy Tickets ---');
    const legacyTicketId = `TKT_LEGACY_${Date.now()}`;
    createdTicketIds.push(legacyTicketId);

    const legacyDoc = {
      operatorId: 'op_legacy_user',
      title: 'Legacy Ticket Without Subcollection',
      category: 'Inquiry',
      priority: 'Low',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: 'Legacy message embedded on root',
      messages: [
        {
          id: 'msg_legacy_1',
          senderId: 'op_legacy_user',
          senderRole: 'operator',
          message: 'Legacy message embedded on root',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };
    await db.collection('tickets').doc(legacyTicketId).set(legacyDoc);

    // Read legacy ticket
    const { req: legReq, res: legRes } = createMockReqRes({
      params: { id: legacyTicketId },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });
    await getTicketById(legReq, legRes);
    assert(legRes.getStatusCode() === 200, 'getTicketById read unmigrated legacy ticket cleanly');
    assert(legRes.getData().messages.length === 1, 'Legacy messages array preserved and returned');
    assert(legRes.getData().messages[0].message === 'Legacy message embedded on root', 'Legacy message content intact');

    // Post a reply to the legacy ticket -> hybrid merge verification
    const { req: legReplyReq, res: legReplyRes } = createMockReqRes({
      params: { id: legacyTicketId },
      body: { message: 'Reply to legacy ticket creating subcollection message' },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });
    await addMessageToThread(legReplyReq, legReplyRes);
    assert(legReplyRes.getStatusCode() === 200, 'Reply to legacy ticket succeeded');

    // Read again -> must seamlessly merge legacy embedded msg + new subcollection msg
    const { req: legMergeReq, res: legMergeRes } = createMockReqRes({
      params: { id: legacyTicketId },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });
    await getTicketById(legMergeReq, legMergeRes);
    const mergedData = legMergeRes.getData();
    assert(mergedData.messages.length === 2, 'Seamlessly merged legacy message with new subcollection message');
    assert(mergedData.messages[0].id === 'msg_legacy_1', 'First message is legacy message');
    assert(mergedData.messages[1].message === 'Reply to legacy ticket creating subcollection message', 'Second message is new reply');

    // -------------------------------------------------------------
    // TEST SUITE 5: LIGHTWEIGHT TICKET LISTING
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Lightweight Ticket Listing Optimization ---');
    const { req: listReq, res: listRes } = createMockReqRes({
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });
    await getTickets(listReq, listRes);
    assert(listRes.getStatusCode() === 200, 'getTickets returned HTTP 200');
    const ticketList = listRes.getData();
    assert(Array.isArray(ticketList) && ticketList.length >= 2, 'Retrieved ticket list');
    const targetTicket = ticketList.find(t => t.id === ticketId);
    assert(targetTicket && targetTicket.messages === undefined, 'Ticket in list omits heavy messages array');
    assert(targetTicket && targetTicket.messageCount >= 2, 'Ticket in list provides messageCount metadata');

    // -------------------------------------------------------------
    // TEST SUITE 6: APPOINTMENT DATETIME UNIFICATION (scheduledAt)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Appointment Datetime Unification (scheduledAt UTC Timestamp) ---');
    const { req: apptReq, res: apptRes } = createMockReqRes({
      body: {
        clientName: 'Maria Santos',
        clientPhone: '09171234567',
        clientEmail: 'maria@example.com',
        preferredBranchLocation: 'Bacolod Branch',
        branchUid: 'op_phase4_test',
        preferredDate: '2026-11-20',
        preferredTime: '02:30 PM', // 14:30 PST (UTC+8) -> 06:30 UTC
        serviceType: 'Passport Assistance',
        purpose: 'New Passport Application'
      },
      user: { uid: 'client_maria_001' },
      userDetails: { role: 'client' }
    });

    await createAppointment(apptReq, apptRes);
    assert(apptRes.getStatusCode() === 201, 'Appointment created with HTTP 201');
    const createdAppt = apptRes.getData();
    createdAppointmentIds.push(createdAppt.id);

    // Verify scheduledAt in UTC
    assert(Boolean(createdAppt.scheduledAt), `scheduledAt generated: ${createdAppt.scheduledAt}`);
    const expectedUtcIso = '2026-11-20T06:30:00.000Z';
    assert(createdAppt.scheduledAt === expectedUtcIso, `scheduledAt matches exact UTC+8 PST offset: ${createdAppt.scheduledAt}`);
    assert(createdAppt.preferredDate === '2026-11-20', 'Backward-compatible preferredDate retained');
    assert(createdAppt.preferredTime === '02:30 PM', 'Backward-compatible preferredTime retained');

    // Direct Firestore check
    const apptDocSnap = await db.collection('appointments').doc(createdAppt.id).get();
    const apptDbData = apptDocSnap.data();
    assert(apptDbData.scheduledAt === expectedUtcIso, 'Firestore document stores canonical scheduledAt');

    // -------------------------------------------------------------
    // TEST SUITE 7: APPOINTMENT LISTING & BACKWARD COMPATIBILITY
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Appointment Listing with Normalizer Fallbacks ---');
    // Seed a legacy appointment with NO scheduledAt
    const legacyApptId = `APP_LEGACY_${Date.now()}`;
    createdAppointmentIds.push(legacyApptId);
    await db.collection('appointments').doc(legacyApptId).set({
      clientUid: 'client_maria_001',
      clientName: 'Legacy Appointment Client',
      clientPhone: '09170000000',
      preferredDate: '2026-12-15',
      preferredTime: '10:00 AM', // 10:00 PST -> 02:00 UTC
      serviceType: 'General Consultation',
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    const { req: apptListReq, res: apptListRes } = createMockReqRes({
      user: { uid: 'client_maria_001' },
      userDetails: { role: 'client' }
    });
    await getAppointments(apptListReq, apptListRes);
    assert(apptListRes.getStatusCode() === 200, 'getAppointments returned HTTP 200');
    const appts = apptListRes.getData();
    const legacyFound = appts.find(a => a.id === legacyApptId);
    assert(Boolean(legacyFound), 'Legacy appointment retrieved in list');
    assert(Boolean(legacyFound?.scheduledAt), `Legacy appointment dynamically enriched with scheduledAt: ${legacyFound?.scheduledAt}`);
    assert(legacyFound?.scheduledAt === '2026-12-15T02:00:00.000Z', 'Legacy appointment scheduledAt correctly computed from PST date/time');

    // -------------------------------------------------------------
    // TEST SUITE 8: FRANCHISE CONSULTATION APPOINTMENT SCHEDULING
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Franchise Consultation Appointment with scheduledAt & Collision Detection ---');
    const testAppId = `FRAN_APP_${Date.now()}`;
    createdFranchiseAppIds.push(testAppId);
    await db.collection('franchiseApplications').doc(testAppId).set({
      fullName: 'John Applicant',
      email: 'john@example.com',
      phoneNumber: '09181234567',
      preferredBranchLocation: 'Cebu Branch',
      status: 'pending_review'
    });

    const { req: franReq, res: franRes } = createMockReqRes({
      body: {
        franchiseApplicationId: testAppId,
        appointmentDate: '2026-11-25',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        notes: 'Interview notes'
      },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });

    await scheduleFranchiseAppointment(franReq, franRes);
    assert(franRes.getStatusCode() === 201, 'Franchise consultation scheduled with HTTP 201');
    const franApptData = franRes.getData();
    createdAppointmentIds.push(franApptData.id);

    assert(Boolean(franApptData.scheduledAt), `Franchise consultation scheduledAt: ${franApptData.scheduledAt}`);
    assert(Boolean(franApptData.scheduledEndAt), `Franchise consultation scheduledEndAt: ${franApptData.scheduledEndAt}`);
    assert(franApptData.scheduledAt === '2026-11-25T02:00:00.000Z', '10:00 AM PST converted to 02:00 UTC');
    assert(franApptData.scheduledEndAt === '2026-11-25T03:00:00.000Z', '11:00 AM PST converted to 03:00 UTC');

    // Verify collision detection blocks overlapping time
    const { req: colReq, res: colRes } = createMockReqRes({
      body: {
        franchiseApplicationId: testAppId,
        appointmentDate: '2026-11-25',
        startTime: '10:30 AM', // Overlaps with 10:00 - 11:00
        endTime: '11:30 AM'
      },
      user: { uid: 'admin_test_001' },
      userDetails: { role: 'admin', isSuperAdmin: true }
    });
    await scheduleFranchiseAppointment(colReq, colRes);
    assert(colRes.getStatusCode() === 409, 'Collision detected and strictly rejected with HTTP 409 Conflict');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Cleanup
    console.log('\n--- CLEANUP ---');
    for (const tId of createdTicketIds) {
      try {
        const subSnap = await db.collection('tickets').doc(tId).collection('messages').get();
        for (const doc of subSnap.docs) {
          await doc.ref.delete();
        }
        await db.collection('tickets').doc(tId).delete();
      } catch (e) {}
    }
    for (const aId of createdAppointmentIds) {
      try {
        await db.collection('appointments').doc(aId).delete();
      } catch (e) {}
    }
    for (const fId of createdFranchiseAppIds) {
      try {
        await db.collection('franchiseApplications').doc(fId).delete();
      } catch (e) {}
    }
    console.log('Test cleanup completed.');
  }

  console.log('\n================================================================');
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
