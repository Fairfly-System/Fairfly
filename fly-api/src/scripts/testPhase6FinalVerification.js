/**
 * FairFly Database Schema & Optimization — Phase 6 System-Wide Verification Suite
 * 
 * Comprehensive end-to-end regression testing across:
 * 1. Global Schema Integrity: Audits all existing Firestore collections for 0 canonical contract violations.
 * 2. Client Self-Service Flow: SAF-01-002 inquiry intake, scheduledAt UTC appointment booking, canonical fields.
 * 3. Operator Processing & Conversion: Quotation creation, approval, cash recording, e-receipt issuance.
 * 4. Support Ticketing Architecture: Subcollection messages isolation, root metadata, lightweight listing.
 * 5. Public No-Account Tracker & Dynamic QR Code: Strict service tracking code resolution, e-receipt viewer.
 * 6. Storage & Bandwidth Benchmark: Measurement of Firestore document sizes and optimization ratio.
 */

const assert = require('assert');
const { db } = require('../config/firebase');
const { 
  createInquiry, 
  getInquiryById 
} = require('../controllers/inquiryController');
const {
  createAppointment,
  getAppointmentById
} = require('../controllers/appointmentController');
const {
  createQuotation
} = require('../controllers/quotationController');
const {
  recordCashPayment
} = require('../controllers/paymentController');
const {
  createTicket,
  getTickets,
  getTicketMessages,
  addMessageToThread
} = require('../controllers/ticketController');
const {
  getPublicTrackingStatus
} = require('../controllers/trackingController');
const {
  getPublicReceiptByCode
} = require('../controllers/receiptController');

// Test tracking IDs for cleanup
const cleanupRegistry = {
  services: [],
  inquiries: [],
  appointments: [],
  quotations: [],
  payments: [],
  activeServices: [],
  receipts: [],
  tickets: []
};

const TEST_BRANCH_UID = 'BRANCH-P6-VERIFY-001';
const TEST_CLIENT_UID = 'CLIENT-P6-VERIFY-001';
const TEST_SERVICE_ID = 'SVC-P6-VERIFY-001';

function createMockReqRes({ body = {}, params = {}, query = {}, user = {}, userDetails = {} } = {}) {
  const req = {
    body,
    params,
    query,
    user: { uid: TEST_BRANCH_UID, email: 'operator@fairfly.com', ...user },
    userDetails: { role: 'operator', branchUid: TEST_BRANCH_UID, branchName: 'FairFly Main', fullName: 'Carlos Operator', ...userDetails }
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

let passedCount = 0;
let failedCount = 0;

function pass(desc) {
  console.log(`  [PASS] ${desc}`);
  passedCount++;
}

function fail(desc, err) {
  console.error(`  [FAIL] ${desc}:`, err?.message || err);
  failedCount++;
}

async function runPhase6Tests() {
  console.log('================================================================');
  console.log('FAIRFLY PHASE 6: SYSTEM-WIDE REGRESSION & FINAL VERIFICATION');
  console.log('================================================================\n');

  // Seed Catalog Service for the workflow tests
  const now = new Date().toISOString();
  await db.collection('services').doc(TEST_SERVICE_ID).set({
    name: 'Passport Expedited Assistance',
    title: 'Passport Expedited Assistance',
    price: 8500,
    baseFee: 8500,
    workflowIds: ['WF-STANDARD-DOCS'],
    requirements: [
      { name: 'PSA Birth Certificate', inputType: 'file', required: true }
    ],
    status: 'Active',
    createdAt: now
  });
  cleanupRegistry.services.push(TEST_SERVICE_ID);

  // -------------------------------------------------------------------------
  // SUITE 1: Global Schema Integrity & Canonical Contract Audit
  // -------------------------------------------------------------------------
  console.log('--- SUITE 1: Global Schema Integrity & Canonical Contract Audit ---');
  try {
    // 1. Tickets
    const ticketSnap = await db.collection('tickets').get();
    let ticketViolations = 0;
    for (const d of ticketSnap.docs) {
      if (d.data().messages !== undefined) ticketViolations++;
    }
    assert.strictEqual(ticketViolations, 0, 'Found ticket documents with legacy root messages array');
    pass(`All ${ticketSnap.size} ticket documents strictly decoupled from root messages array`);

    // 2. Appointments
    const apptSnap = await db.collection('appointments').get();
    let apptViolations = 0;
    for (const d of apptSnap.docs) {
      const scheduledAt = d.data().scheduledAt;
      if (!scheduledAt || isNaN(new Date(scheduledAt).getTime())) apptViolations++;
    }
    assert.strictEqual(apptViolations, 0, 'Found appointment documents lacking valid scheduledAt ISO timestamp');
    pass(`All ${apptSnap.size} appointment documents contain canonical scheduledAt ISO timestamp`);

    // 3. Receipts
    const rctSnap = await db.collection('receipts').get();
    let rctViolations = 0;
    for (const d of rctSnap.docs) {
      const data = d.data();
      if (data.id || data.receiptId || data.qrCodeDataUrl || data.businessName || data.businessTagline || data.legalNotice || data.formNo || data.amountInCentavos) {
        rctViolations++;
      }
    }
    assert.strictEqual(rctViolations, 0, 'Found receipt documents with pruned legacy or Base64 fields');
    pass(`All ${rctSnap.size} receipt documents adhere strictly to lightweight payload contract (0 Base64 / 0 redundant IDs)`);

    // 4. Payments
    const paySnap = await db.collection('payments').get();
    let payViolations = 0;
    for (const d of paySnap.docs) {
      const data = d.data();
      if (data.id || data.amountInCentavos || data.isWalkInCash) payViolations++;
    }
    assert.strictEqual(payViolations, 0, 'Found payment documents with redundant fields');
    pass(`All ${paySnap.size} payment documents adhere to canonical contract (0 self-referencing IDs / 0 centavos duplicates)`);

    // 5. Active Services
    const svcSnap = await db.collection('activeServices').get();
    let svcViolations = 0;
    for (const d of svcSnap.docs) {
      const data = d.data();
      if (data.id || data.serviceUID || data.totalSteps || (data.operatorId && data.branchUid)) svcViolations++;
    }
    assert.strictEqual(svcViolations, 0, 'Found active service documents with redundant fields');
    pass(`All ${svcSnap.size} activeServices documents adhere to canonical contract`);

    // 6. Inquiries
    const inqSnap = await db.collection('inquiries').get();
    let inqViolations = 0;
    for (const d of inqSnap.docs) {
      const data = d.data();
      if ((data.workflow && data.isWalkIn !== undefined) || data.firstName || data.lastName || (data.operatorId && data.branchUid) || (data.remarks && data.clientRemarks)) {
        inqViolations++;
      }
    }
    assert.strictEqual(inqViolations, 0, 'Found inquiry documents with redundant fields');
    pass(`All ${inqSnap.size} inquiry documents adhere to canonical contract`);

    // 7. Quotations
    const qtnSnap = await db.collection('quotations').get();
    let qtnViolations = 0;
    for (const d of qtnSnap.docs) {
      const data = d.data();
      if ((data.preparedBy && data.preparedByName) || (data.operatorId && data.branchUid) || (data.remarks && data.operatorRemarks)) {
        qtnViolations++;
      }
    }
    assert.strictEqual(qtnViolations, 0, 'Found quotation documents with redundant fields');
    pass(`All ${qtnSnap.size} quotation documents adhere to canonical contract`);

    // 8. Workflow Templates
    const wflSnap = await db.collection('workflowTemplates').get();
    let wflViolations = 0;
    for (const d of wflSnap.docs) {
      if (d.data().type && d.data().serviceType) wflViolations++;
    }
    assert.strictEqual(wflViolations, 0, 'Found workflow template documents with redundant type alias');
    pass(`All ${wflSnap.size} workflow template documents adhere to canonical serviceType contract`);
  } catch (err) {
    fail('Global Schema Integrity Audit', err);
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Client Self-Service Flow (Inquiry & Appointments)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Client Self-Service Intake (Inquiries & Appointments) ---');
  let testInquiryId = null;
  let testAppointmentId = null;

  try {
    // 1. Client creates online inquiry SAF-01-002
    const clientUser = { uid: TEST_CLIENT_UID, email: 'maria.client@example.com' };
    const clientDetails = { role: 'client', fullName: 'Maria Clara Santos' };

    const inqReq = {
      body: {
        clientName: 'Maria Clara Santos',
        contactPerson: 'Maria Clara Santos',
        email: 'maria.client@example.com',
        cellphone: '09171234567',
        isWalkIn: false,
        servicesOffered: 'Passport Expedited Assistance',
        serviceId: TEST_SERVICE_ID,
        serviceType: 'Documentation',
        clientRemarks: 'Please schedule for afternoon processing if possible.',
        branchUid: TEST_BRANCH_UID
      },
      user: clientUser,
      userDetails: clientDetails
    };
    const { req: iReq, res: iRes } = createMockReqRes(inqReq);
    await createInquiry(iReq, iRes);

    assert.strictEqual(iRes.getStatusCode(), 201, 'Inquiry creation must return 201');
    const createdInq = iRes.getData().inquiry || iRes.getData();
    testInquiryId = createdInq.id || createdInq.inquiryId;
    cleanupRegistry.inquiries.push(testInquiryId);

    // Verify stored inquiry in Firestore
    const storedInqDoc = await db.collection('inquiries').doc(testInquiryId).get();
    const storedInq = storedInqDoc.data();
    assert.strictEqual(storedInq.isWalkIn, false);
    assert.strictEqual(storedInq.clientRemarks, 'Please schedule for afternoon processing if possible.');
    assert.strictEqual(storedInq.remarks, undefined, 'Redundant remarks should not exist');
    assert.strictEqual(storedInq.workflow, undefined, 'Redundant workflow string should not exist');
    assert.strictEqual(storedInq.firstName, undefined, 'Fragmented name should not exist');
    pass(`Online client inquiry created cleanly without schema bloat (ID: ${testInquiryId})`);

    // 2. Client schedules an appointment with scheduledAt
    const apptReq = {
      body: {
        clientName: 'Maria Clara Santos',
        clientPhone: '09171234567',
        branchUid: TEST_BRANCH_UID,
        scheduledAt: '2026-11-28T06:00:00.000Z', // 2:00 PM PST (UTC+8)
        purpose: 'Passport Application Review',
        notes: 'Bringing original PSA certificate'
      },
      user: clientUser,
      userDetails: clientDetails
    };
    const { req: aReq, res: aRes } = createMockReqRes(apptReq);
    await createAppointment(aReq, aRes);

    assert.strictEqual(aRes.getStatusCode(), 201, 'Appointment creation must return 201');
    const createdAppt = aRes.getData().appointment || aRes.getData();
    testAppointmentId = createdAppt.id || createdAppt.appointmentId;
    cleanupRegistry.appointments.push(testAppointmentId);

    // Verify stored appointment in Firestore
    const storedApptDoc = await db.collection('appointments').doc(testAppointmentId).get();
    const storedAppt = storedApptDoc.data();
    assert.strictEqual(storedAppt.scheduledAt, '2026-11-28T06:00:00.000Z');
    assert.strictEqual(storedAppt.preferredDate, '2026-11-28', 'Backward-compatible preferredDate populated');
    assert.strictEqual(storedAppt.preferredTime, '02:00 PM', 'Backward-compatible preferredTime populated');
    pass(`Appointment created with canonical scheduledAt UTC timestamp (ID: ${testAppointmentId})`);

    // Verify retrieval by ID
    const { req: gaReq, res: gaRes } = createMockReqRes({ params: { id: testAppointmentId }, user: clientUser, userDetails: clientDetails });
    await getAppointmentById(gaReq, gaRes);
    assert.strictEqual(gaRes.getStatusCode(), 200);
    assert.strictEqual(gaRes.getData().scheduledAt, '2026-11-28T06:00:00.000Z');
    pass('Appointment successfully retrieved by ID with canonical scheduledAt');
  } catch (err) {
    fail('Client Self-Service Intake Suite', err);
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Operator Processing, Quotation, Cash Recording & E-Receipt
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Operator Processing, Cash Recording & E-Receipt Issuance ---');
  let testQuotationId = null;
  let testReceiptDocId = null;
  let testReceiptId = null;
  let testFulfillmentId = null;
  let testServiceCode = null;

  try {
    // 1. Operator creates quotation for the inquiry
    const quoteReq = {
      body: {
        inquiryId: testInquiryId,
        clientUid: TEST_CLIENT_UID,
        clientName: 'Maria Clara Santos',
        clientEmail: 'maria.client@example.com',
        serviceId: TEST_SERVICE_ID,
        serviceTitle: 'Passport Expedited Assistance',
        serviceType: 'Documentation',
        branchUid: TEST_BRANCH_UID,
        preparedByName: 'Carlos Operator',
        operatorRemarks: 'Payment terms: Full advance payment required for DFA slot reservation.',
        rate: 8500,
        totalAmount: 8500,
        inclusions: ['DFA Slot Booking', 'Document Pre-check'],
        exclusions: ['Courier fee']
      }
    };
    const { req: qReq, res: qRes } = createMockReqRes(quoteReq);
    await createQuotation(qReq, qRes);

    assert.strictEqual(qRes.getStatusCode(), 201, 'Quotation creation must return 201');
    const createdQtn = qRes.getData().quotation || qRes.getData();
    testQuotationId = createdQtn.id || createdQtn.quotationId;
    cleanupRegistry.quotations.push(testQuotationId);

    // Verify stored quotation
    const storedQtnDoc = await db.collection('quotations').doc(testQuotationId).get();
    const storedQtn = storedQtnDoc.data();
    assert.strictEqual(storedQtn.operatorRemarks, 'Payment terms: Full advance payment required for DFA slot reservation.');
    assert.strictEqual(storedQtn.preparedByName, 'Carlos Operator');
    assert.strictEqual(storedQtn.preparedBy, undefined, 'Redundant preparedBy should not exist');
    assert.strictEqual(storedQtn.remarks, undefined, 'Redundant duplicate remarks should not exist');
    assert.strictEqual(storedQtn.operatorId, undefined, 'Redundant duplicate operatorId should not exist');
    pass(`Quotation created with canonical fields (ID: ${testQuotationId})`);

    // Advance quotation state so cash payment can be recorded
    await db.collection('quotations').doc(testQuotationId).update({
      status: 'Accepted',
      requirementsStatus: 'approved'
    });

    // 2. Operator records walk-in cash payment -> triggers atomic fulfillment + e-receipt
    const cashReq = {
      body: {
        quotationId: testQuotationId,
        remarks: 'Paid in full cash at counter'
      }
    };
    const { req: cReq, res: cRes } = createMockReqRes(cashReq);
    await recordCashPayment(cReq, cRes);

    assert.strictEqual(cRes.getStatusCode(), 200, 'Cash payment recording must return 200');
    const cashData = cRes.getData();
    const paymentId = cashData.paymentId;
    testFulfillmentId = cashData.fulfillmentId;
    testReceiptDocId = cashData.receiptId;
    testReceiptId = cashData.receiptNo;
    testServiceCode = cashData.serviceCode;

    if (paymentId) cleanupRegistry.payments.push(paymentId);
    if (testFulfillmentId) cleanupRegistry.activeServices.push(testFulfillmentId);
    if (testReceiptDocId) cleanupRegistry.receipts.push(testReceiptDocId);

    // Verify stored active service
    const storedSvcDoc = await db.collection('activeServices').doc(testFulfillmentId).get();
    const storedSvc = storedSvcDoc.data();
    assert.strictEqual(storedSvc.id, undefined, 'activeService must not contain self-referencing id');
    assert.strictEqual(storedSvc.serviceUID, undefined, 'activeService must not contain dead serviceUID');
    assert.strictEqual(storedSvc.totalSteps, undefined, 'activeService totalSteps must be derived dynamically');
    assert.strictEqual(storedSvc.priorityType, 'normal', 'activeService priorityType must default to normal');
    pass(`Fulfillment activeService atomically created with clean schema (ID: ${testFulfillmentId})`);

    // Verify stored receipt
    const storedRctDoc = await db.collection('receipts').doc(testReceiptDocId).get();
    const storedRct = storedRctDoc.data();
    assert.ok(storedRct, 'Receipt document must exist in Firestore');
    assert.strictEqual(storedRct.id, undefined, 'receipt must not contain self-referencing id');
    assert.strictEqual(storedRct.receiptId, undefined, 'receipt must not contain self-referencing receiptId');
    assert.strictEqual(storedRct.qrCodeDataUrl, undefined, 'receipt must not store heavy Base64 qrCodeDataUrl');
    assert.strictEqual(storedRct.amountInCentavos, undefined, 'receipt must not store redundant amountInCentavos');
    assert.strictEqual(storedRct.businessName, undefined, 'receipt must not store static boilerplate businessName');
    assert.ok(storedRct.qrTrackingUrl, 'receipt must provide dynamic qrTrackingUrl');
    pass(`E-Receipt atomically issued with clean, lightweight payload (Receipt No: ${testReceiptId})`);
  } catch (err) {
    fail('Operator Processing & E-Receipt Suite', err);
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Support Ticketing Architecture (Subcollection Messages)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Support Ticketing Subcollection Architecture ---');
  let testTicketId = null;

  try {
    // 1. Operator creates support ticket
    const ticketReq = {
      body: {
        title: 'Printer connectivity issue at Bulacan branch',
        category: 'Hardware',
        priority: 'Normal',
        initialMessage: 'The receipt printer loses USB connection every 30 minutes.'
      }
    };
    const { req: tReq, res: tRes } = createMockReqRes(ticketReq);
    await createTicket(tReq, tRes);

    assert.strictEqual(tRes.getStatusCode(), 201, 'Ticket creation must return 201');
    testTicketId = tRes.getData().ticket?.id || tRes.getData().id;
    cleanupRegistry.tickets.push(testTicketId);

    // Verify root ticket doc
    const storedTicketDoc = await db.collection('tickets').doc(testTicketId).get();
    const storedTicket = storedTicketDoc.data();
    assert.strictEqual(storedTicket.messages, undefined, 'Root ticket must not store messages array');
    assert.strictEqual(storedTicket.messageCount, 1, 'Root ticket messageCount must be 1');
    assert.strictEqual(storedTicket.lastMessage, 'The receipt printer loses USB connection every 30 minutes.');
    pass(`Ticket root document stores only metadata with 0 messages array bloat (ID: ${testTicketId})`);

    // Verify subcollection
    const subMessagesSnap = await db.collection('tickets').doc(testTicketId).collection('messages').get();
    assert.strictEqual(subMessagesSnap.size, 1, 'Subcollection must contain 1 initial message');
    pass('Initial message saved directly into tickets/{id}/messages subcollection');

    // 2. Super Admin replies to thread
    const adminUser = { uid: 'USR-ADMIN-001', email: 'admin@fairfly.com' };
    const adminDetails = { role: 'admin', isSuperAdmin: true, fullName: 'Super Admin' };
    const replyReq = {
      params: { id: testTicketId },
      body: { message: 'Please update the USB driver and test with the alternate port.' },
      user: adminUser,
      userDetails: adminDetails
    };
    const { req: rReq, res: rRes } = createMockReqRes(replyReq);
    await addMessageToThread(rReq, rRes);

    assert.strictEqual(rRes.getStatusCode(), 200, 'Ticket reply must return 200');
    
    // Verify updated subcollection and root metadata
    const updatedSubSnap = await db.collection('tickets').doc(testTicketId).collection('messages').get();
    assert.strictEqual(updatedSubSnap.size, 2, 'Subcollection must now contain 2 messages');

    const updatedRootDoc = await db.collection('tickets').doc(testTicketId).get();
    assert.strictEqual(updatedRootDoc.data().messageCount, 2, 'Root messageCount updated to 2');
    assert.strictEqual(updatedRootDoc.data().lastMessage, 'Please update the USB driver and test with the alternate port.');
    assert.strictEqual(updatedRootDoc.data().messages, undefined, 'Root document still has NO messages array');
    pass('Subcollection message reply appended & root metadata updated');

    // 3. Direct subcollection endpoint GET /api/tickets/:id/messages
    const { req: mReq, res: mRes } = createMockReqRes({ params: { id: testTicketId } });
    await getTicketMessages(mReq, mRes);
    assert.strictEqual(mRes.getStatusCode(), 200);
    assert.strictEqual(mRes.getData().messages.length, 2, 'getTicketMessages must return all 2 subcollection messages');
    pass('Direct subcollection endpoint GET /api/tickets/:id/messages successfully queried');

    // 4. Lightweight Ticket Listing
    const { req: lReq, res: lRes } = createMockReqRes();
    await getTickets(lReq, lRes);
    assert.strictEqual(lRes.getStatusCode(), 200);
    const ticketsList = lRes.getData().tickets || lRes.getData();
    const foundTicket = ticketsList.find(t => t.id === testTicketId);
    assert.ok(foundTicket, 'Created ticket must be in listing');
    assert.strictEqual(foundTicket.messages, undefined, 'Listing must omit heavy messages array');
    assert.strictEqual(foundTicket.messageCount, 2, 'Listing must provide messageCount metadata');
    pass('Lightweight ticket list excludes messages array and includes messageCount metadata');
  } catch (err) {
    fail('Support Ticketing Subcollection Architecture Suite', err);
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Public No-Account Tracker & Dynamic QR Code Resolution
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Public No-Account Tracker & Dynamic QR Code Resolution ---');
  try {
    assert.ok(testServiceCode, 'Must have serviceCode from Suite 3');
    
    // 1. Unauthenticated public tracking lookup by serviceCode
    const { req: trReq, res: trRes } = createMockReqRes({ params: { trackingId: testServiceCode } });
    await getPublicTrackingStatus(trReq, trRes);

    assert.strictEqual(trRes.getStatusCode(), 200, 'Public tracker lookup must return 200');
    const trackData = trRes.getData();
    assert.strictEqual(trackData.serviceCode, testServiceCode);
    assert.strictEqual(trackData.clientName, 'Maria S.');
    assert.ok(trackData.status, 'Tracking must provide status');
    assert.ok(Array.isArray(trackData.steps), 'Tracking must provide steps');
    pass(`Public tracking lookup by service code resolved cleanly with client name masking (Code: ${testServiceCode})`);

    // 2. Strict ID Enforcement: Receipt No lookup rejected with 400
    const { req: rBadReq, res: rBadRes } = createMockReqRes({ params: { trackingId: testReceiptId } });
    await getPublicTrackingStatus(rBadReq, rBadRes);
    assert.strictEqual(rBadRes.getStatusCode(), 400, 'Receipt No tracking lookup must be rejected with 400');
    pass('Strict Tracking Guard correctly rejects Receipt Number lookup with 400 Bad Request');

    // 3. Public E-Receipt Endpoint lookup by code
    const { req: prReq, res: prRes } = createMockReqRes({ params: { code: testServiceCode } });
    await getPublicReceiptByCode(prReq, prRes);
    assert.strictEqual(prRes.getStatusCode(), 200, 'Public receipt lookup must return 200');
    const publicReceipt = prRes.getData().receipt || prRes.getData();
    assert.strictEqual(publicReceipt.receiptNo, testReceiptId);
    assert.ok(!publicReceipt.qrCodeDataUrl, 'Public receipt must not contain stored Base64 QR');
    pass(`Public E-Receipt successfully retrieved by service code without auth (Receipt No: ${testReceiptId})`);
  } catch (err) {
    fail('Public Tracker & Dynamic QR Code Suite', err);
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Document Size & Bandwidth Benchmark
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 6: Storage & Bandwidth Optimization Benchmark ---');
  try {
    assert.ok(testReceiptDocId, 'Must have testReceiptDocId from Suite 3');
    
    // Benchmark 1: Receipt document size comparison
    const canonicalReceiptDoc = await db.collection('receipts').doc(testReceiptDocId).get();
    const canonicalSize = JSON.stringify(canonicalReceiptDoc.data()).length;

    // Simulate legacy receipt payload (which had ~55KB Base64 data URL + static boilerplates)
    const simulatedLegacyReceipt = {
      ...canonicalReceiptDoc.data(),
      id: testReceiptDocId,
      receiptId: testReceiptDocId,
      businessName: 'FairFly Travel & Tours Inc.',
      businessTagline: 'Your Trusted Partner in Seamless Global Journeys',
      legalNotice: 'OFFICIAL RECEIPT / ELECTRONIC TRANSACTION RECORD. Generated under the authority of Republic Act No. 8792 (Electronic Commerce Act of 2000).',
      formNo: 'FF-OR-2026-V1',
      paymentStatus: 'PAID',
      paymentMethodType: 'Cash',
      amountInCentavos: 850000,
      description: canonicalReceiptDoc.data().serviceTitle,
      qrCodeDataUrl: 'data:image/png;base64,' + 'A'.repeat(55000) // Realistic ~55KB Base64 QR code
    };
    const legacySize = JSON.stringify(simulatedLegacyReceipt).length;
    const sizeReductionPercent = (((legacySize - canonicalSize) / legacySize) * 100).toFixed(1);

    console.log(`  [BENCHMARK] Legacy Receipt Document Size:    ${(legacySize / 1024).toFixed(2)} KB`);
    console.log(`  [BENCHMARK] Canonical Receipt Document Size: ${(canonicalSize / 1024).toFixed(2)} KB`);
    console.log(`  [BENCHMARK] Payload Size Reduction:          ${sizeReductionPercent}%`);

    assert.ok(canonicalSize < 1500, 'Canonical receipt should be under 1.5 KB');
    assert.ok(parseFloat(sizeReductionPercent) > 95, 'Size reduction should exceed 95%');
    pass(`Receipt storage & transfer payload reduced by ${sizeReductionPercent}% (From ~${(legacySize / 1024).toFixed(0)} KB to ${(canonicalSize / 1024).toFixed(2)} KB)`);

    // Benchmark 2: Tickets list query size comparison
    const allTicketsSnap = await db.collection('tickets').get();
    let totalLightweightListSize = 0;
    for (const d of allTicketsSnap.docs) {
      const { messages, ...lightweight } = d.data();
      totalLightweightListSize += JSON.stringify(lightweight).length;
    }
    const avgTicketSize = (totalLightweightListSize / allTicketsSnap.size / 1024).toFixed(2);
    pass(`Lightweight ticket list payload: Average ${avgTicketSize} KB per ticket document across ${allTicketsSnap.size} tickets`);
  } catch (err) {
    fail('Storage & Bandwidth Optimization Benchmark', err);
  }

  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------
  console.log('\n--- CLEANING UP TEST ARTIFACTS ---');
  try {
    for (const svcId of cleanupRegistry.services) {
      await db.collection('services').doc(svcId).delete().catch(() => {});
    }
    for (const inqId of cleanupRegistry.inquiries) {
      await db.collection('inquiries').doc(inqId).delete().catch(() => {});
    }
    for (const apptId of cleanupRegistry.appointments) {
      await db.collection('appointments').doc(apptId).delete().catch(() => {});
    }
    for (const qtnId of cleanupRegistry.quotations) {
      await db.collection('quotations').doc(qtnId).delete().catch(() => {});
    }
    for (const payId of cleanupRegistry.payments) {
      await db.collection('payments').doc(payId).delete().catch(() => {});
    }
    for (const svcId of cleanupRegistry.activeServices) {
      await db.collection('activeServices').doc(svcId).delete().catch(() => {});
    }
    for (const rctId of cleanupRegistry.receipts) {
      await db.collection('receipts').doc(rctId).delete().catch(() => {});
    }
    for (const tktId of cleanupRegistry.tickets) {
      // Delete subcollection messages first
      const subMsgs = await db.collection('tickets').doc(tktId).collection('messages').get();
      for (const m of subMsgs.docs) {
        await m.ref.delete().catch(() => {});
      }
      await db.collection('tickets').doc(tktId).delete().catch(() => {});
    }
    console.log('  [CLEANUP] Successfully removed all temporary test documents and subcollections.');
  } catch (err) {
    console.error('  [CLEANUP WARNING] Error during cleanup:', err.message);
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`PHASE 6 FINAL VERIFICATION SUMMARY`);
  console.log(`TOTAL PASSED: ${passedCount} | TOTAL FAILED: ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase6Tests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[FATAL] Phase 6 Verification Test Suite encountered unhandled error:', err);
    process.exit(1);
  });
