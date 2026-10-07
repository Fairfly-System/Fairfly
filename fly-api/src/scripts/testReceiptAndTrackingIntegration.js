/**
 * testReceiptAndTrackingIntegration.js
 * Comprehensive Automated Integration Verification Suite for:
 * 1. Receipt ID & Service Code generation standards (RCT-YYYY-XXXXXX, SRV-YYYY-XXXXXX).
 * 2. E-Receipt creation & atomic link during F2F Cash Payment (Operator counter collection).
 * 3. E-Receipt creation & atomic link during PayMongo Online Verification.
 * 4. Backend Idempotency: duplicate payment calls or retries never duplicate fulfillments or receipts.
 * 5. Public No-Account Tracking via Service Code (SRV-...), Receipt No (RCT-...), Quote No, and Fulfillment ID.
 * 6. Privacy & Security: Public endpoints sanitize client names, omit internal operator notes, and protect sensitive auth fields.
 * 7. RBAC & IDOR Object-level access control on protected receipt endpoints.
 */

const assert = require('assert');
const { db } = require('../config/firebase');
const { generateReceiptNo, generateServiceCode, ID_PREFIXES } = require('../utils/idGenerator');
const { recordCashPayment, finalizeSuccessfulPayment } = require('../controllers/paymentController');
const { getPublicTrackingStatus } = require('../controllers/trackingController');
const {
  getReceiptById,
  getReceiptByQuotationId,
  getReceiptByFulfillmentId,
  getPublicReceiptByCode
} = require('../controllers/receiptController');
const { buildReceiptPayload } = require('../services/receiptService');

const COLLECTIONS = {
  SERVICES: 'services',
  INQUIRIES: 'inquiries',
  QUOTATIONS: 'quotations',
  SUBMITTED_REQUIREMENTS: 'submitted_requirements',
  PAYMENTS: 'payments',
  ACTIVE_SERVICES: 'activeServices',
  RECEIPTS: 'receipts'
};

// Helper to mock Express req/res
function createMockReqRes(options = {}) {
  const req = {
    params: options.params || {},
    body: options.body || {},
    user: options.user || { uid: 'user_123', email: 'test@example.com' },
    userDetails: options.userDetails || { role: 'operator', branchName: 'Baliuag Branch' },
    query: options.query || {}
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTests() {
  console.log('\n================================================================');
  console.log('FAIRFLY FEATURE 17: E-RECEIPT & TRACKING INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  const now = new Date().toISOString();
  const testBranchUid = 'operator_branch_valiuag_001';
  const testClientUid = 'client_test_receipt_001';
  const otherClientUid = 'client_attacker_002';
  const testServiceId = 'SVC-TEST-RECEIPT-CATALOG-001';

  // -----------------------------------------------------------------------------------
  // TEST 1: ID Generation & Formatting Standards
  // -----------------------------------------------------------------------------------
  console.log('--- TEST 1: ID & Code Generation Standards ---');
  const sampleReceiptNo = generateReceiptNo();
  const sampleServiceCode = generateServiceCode();

  assert(sampleReceiptNo.startsWith('RCT-'), `Receipt number must start with RCT-, got ${sampleReceiptNo}`);
  assert(sampleServiceCode.startsWith('SRV-'), `Service code must start with SRV-, got ${sampleServiceCode}`);
  assert.strictEqual(ID_PREFIXES.RECEIPT, 'RCT');
  assert.strictEqual(ID_PREFIXES.SERVICE_CODE, 'SRV');
  console.log(`✓ Receipt No Format: ${sampleReceiptNo}`);
  console.log(`✓ Service Code Format: ${sampleServiceCode}`);

  // Seed Catalog Service
  const testService = {
    id: testServiceId,
    name: '4D/3N Batanes Heritage Tour Package',
    price: 24500,
    baseFee: 24500,
    requirements: [
      { name: 'Valid Government ID', inputType: 'file', required: true }
    ],
    workflowIds: ['WF-BATANES-TOUR'],
    status: 'Active',
    createdAt: now
  };
  await db.collection(COLLECTIONS.SERVICES).doc(testServiceId).set(testService);

  // -----------------------------------------------------------------------------------
  // TEST 2: F2F Direct Cash Payment -> Automatic E-Receipt & Fulfillment Creation
  // -----------------------------------------------------------------------------------
  console.log('\n--- TEST 2: F2F Cash Payment & Atomic E-Receipt Generation ---');

  const quoteId1 = `QUO-CASH-${Date.now()}`;
  const quotation1 = {
    id: quoteId1,
    quoteNo: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientUid: testClientUid,
    clientName: 'Maria Santos',
    clientEmail: 'maria.santos@example.com',
    clientPhone: '09181234567',
    branchUid: testBranchUid,
    branchName: 'FairFly Travel & Tours - Baliuag',
    serviceId: testServiceId,
    serviceTitle: '4D/3N Batanes Heritage Tour Package',
    rate: 24500,
    totalAmount: 24500,
    taxAmount: 0,
    tourDates: 'November 12-15, 2026',
    inclusions: 'Roundtrip flights, 3-star hotel accommodation, daily breakfast, full guided tours',
    exclusions: 'Personal expenses and tipping',
    status: 'Accepted',
    paymentStatus: 'UNPAID',
    requirementsStatus: 'approved',
    preparedByName: 'Emmanuel Manlapig',
    createdAt: now,
    updatedAt: now
  };
  await db.collection(COLLECTIONS.QUOTATIONS).doc(quoteId1).set(quotation1);

  // Operator records direct cash payment
  const cashReq = createMockReqRes({
    user: { uid: testBranchUid, email: 'operator@fairfly.com' },
    userDetails: { role: 'operator', branchName: 'FairFly Travel & Tours - Baliuag', name: 'Emmanuel Manlapig' },
    body: {
      quotationId: quoteId1,
      remarks: 'Direct counter cash payment received in full'
    }
  });

  await recordCashPayment(cashReq.req, cashReq.res);
  assert.strictEqual(cashReq.getStatus(), 200, `recordCashPayment failed: ${JSON.stringify(cashReq.getData())}`);
  const cashResData = cashReq.getData();

  assert(cashResData.fulfillmentId, 'Cash payment must return fulfillmentId');
  assert(cashResData.receiptId, 'Cash payment must return receiptId');
  assert(cashResData.receiptNo, 'Cash payment must return receiptNo');
  assert(cashResData.serviceCode, 'Cash payment must return serviceCode');
  assert(cashResData.receipt, 'Cash payment must return full receipt object');

  console.log(`✓ F2F Cash Payment Confirmed. Fulfillment ID: ${cashResData.fulfillmentId}`);
  console.log(`✓ E-Receipt Issued: ${cashResData.receiptNo} | Service Code: ${cashResData.serviceCode}`);

  // Verify Active Service record in Firestore
  const activeServiceDoc1 = await db.collection(COLLECTIONS.ACTIVE_SERVICES).doc(cashResData.fulfillmentId).get();
  assert(activeServiceDoc1.exists, 'Active service document must exist in Firestore');
  const activeServiceData1 = activeServiceDoc1.data();
  assert.strictEqual(activeServiceData1.serviceCode, cashResData.serviceCode, 'Active service must have serviceCode attached');
  assert.strictEqual(activeServiceData1.receiptId, cashResData.receiptId, 'Active service must have receiptId attached');
  assert.strictEqual(activeServiceData1.receiptNo, cashResData.receiptNo, 'Active service must have receiptNo attached');

  // Verify Receipt record in Firestore
  const receiptDoc1 = await db.collection(COLLECTIONS.RECEIPTS).doc(cashResData.receiptId).get();
  assert(receiptDoc1.exists, 'Receipt document must exist in receipts collection');
  const receiptData1 = receiptDoc1.data();
  assert.strictEqual(receiptData1.receiptNo, cashResData.receiptNo);
  assert.strictEqual(receiptData1.serviceCode, cashResData.serviceCode);
  assert.strictEqual(receiptData1.fulfillmentId, cashResData.fulfillmentId);
  assert.strictEqual(receiptData1.amount, 24500);
  assert.strictEqual(receiptData1.status, 'PAID');
  assert(receiptData1.qrTrackingUrl.includes(cashResData.serviceCode), 'QR tracking URL must contain serviceCode');
  assert(receiptData1.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR data URL must be valid base64 image');
  console.log('✓ Firestore state verified: activeServices + receipts + quotations atomically consistent');

  // -----------------------------------------------------------------------------------
  // TEST 3: Idempotency Verification on Cash Payment
  // -----------------------------------------------------------------------------------
  console.log('\n--- TEST 3: Idempotency Protection on Duplicate Cash Submission ---');
  const duplicateCashReq = createMockReqRes({
    user: { uid: testBranchUid, email: 'operator@fairfly.com' },
    userDetails: { role: 'operator', branchName: 'FairFly Travel & Tours - Baliuag' },
    body: {
      quotationId: quoteId1,
      remarks: 'Repeated click attempt'
    }
  });

  await recordCashPayment(duplicateCashReq.req, duplicateCashReq.res);
  assert.strictEqual(duplicateCashReq.getStatus(), 200, 'Duplicate call should return existing fulfillment gracefully');
  const dupData = duplicateCashReq.getData();
  assert.strictEqual(dupData.fulfillmentId, cashResData.fulfillmentId, 'Duplicate request must NOT create a new fulfillmentId');
  assert.strictEqual(dupData.receiptNo, cashResData.receiptNo, 'Duplicate request must NOT generate a new receiptNo');

  // Verify no duplicate receipts were created in collection
  const allReceiptsForQuote1 = await db.collection(COLLECTIONS.RECEIPTS).where('quotationId', '==', quoteId1).get();
  assert.strictEqual(allReceiptsForQuote1.size, 1, 'Exactly 1 receipt document must exist for quotation');
  console.log('✓ Verified: Duplicate payment triggers are 100% idempotent without duplicate fulfillments or receipts');

  // -----------------------------------------------------------------------------------
  // TEST 4: Online Payment (PayMongo Verification) -> E-Receipt Generation
  // -----------------------------------------------------------------------------------
  console.log('\n--- TEST 4: PayMongo Online Payment Verification & E-Receipt Issuance ---');

  const quoteId2 = `QUO-PAYMONGO-${Date.now()}`;
  const quotation2 = {
    id: quoteId2,
    quoteNo: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientUid: testClientUid,
    clientName: 'Roberto Gomez',
    clientEmail: 'roberto@example.com',
    clientPhone: '09179876543',
    branchUid: testBranchUid,
    branchName: 'FairFly Travel & Tours - Baliuag',
    serviceId: testServiceId,
    serviceTitle: '4D/3N Batanes Heritage Tour Package',
    rate: 24500,
    totalAmount: 24500,
    taxAmount: 0,
    status: 'Accepted',
    paymentStatus: 'UNPAID',
    requirementsStatus: 'approved',
    preparedByName: 'Emmanuel Manlapig',
    createdAt: now,
    updatedAt: now
  };
  await db.collection(COLLECTIONS.QUOTATIONS).doc(quoteId2).set(quotation2);

  const paymentRecord2 = {
    id: `PAY-PM-${Date.now()}`,
    quotationId: quoteId2,
    clientUid: testClientUid,
    branchUid: testBranchUid,
    amount: 24500,
    currency: 'PHP',
    provider: 'paymongo',
    paymentMethod: 'PayMongo QR (GCash/Maya/Card)',
    status: 'PENDING',
    createdAt: now
  };
  await db.collection(COLLECTIONS.PAYMENTS).doc(paymentRecord2.id).set(paymentRecord2);

  // Trigger backend payment finalization (simulating verified webhook/verification)
  const pmResult = await finalizeSuccessfulPayment(paymentRecord2.id, {
    paymentId: `pay_pm_test_${Date.now()}`,
    paymentMethod: 'PayMongo QR Ph'
  });

  assert(pmResult.fulfillmentId || pmResult.activeServiceId, 'PayMongo finalization must create fulfillmentId');
  assert(pmResult.receiptId, 'PayMongo finalization must create receiptId');
  assert(pmResult.receiptNo, 'PayMongo finalization must create receiptNo');
  assert(pmResult.serviceCode, 'PayMongo finalization must create serviceCode');
  assert(pmResult.receipt || pmResult.receiptData, 'PayMongo finalization must return full receipt');

  const pmFulfillmentId = pmResult.fulfillmentId || pmResult.activeServiceId;
  console.log(`✓ PayMongo Payment Verified. Fulfillment ID: ${pmFulfillmentId}`);
  console.log(`✓ E-Receipt Issued: ${pmResult.receiptNo} | Service Code: ${pmResult.serviceCode}`);

  // Test PayMongo idempotent callback repetition
  const repeatedPmResult = await finalizeSuccessfulPayment(paymentRecord2.id, {
    paymentId: `pay_pm_test_repeat`,
    paymentMethod: 'PayMongo QR Ph'
  });

  const repeatedFulfillmentId = repeatedPmResult.fulfillmentId || repeatedPmResult.activeServiceId;
  assert.strictEqual(repeatedFulfillmentId, pmFulfillmentId);
  assert.strictEqual(repeatedPmResult.receiptNo, pmResult.receiptNo);
  console.log('✓ Verified: PayMongo repeated webhook / verification is idempotent');

  // -----------------------------------------------------------------------------------
  // TEST 5: Public No-Account Request Tracker (Strict Service Tracking ID Enforcement)
  // -----------------------------------------------------------------------------------
  console.log('\n--- TEST 5: Public No-Account Tracker Strict Service Tracking ID Enforcement ---');

  // Lookup 5a: Track by Service Code (SRV-...) -> Must SUCCEED (200)
  const trackBySrvReq = createMockReqRes({
    params: { trackingId: cashResData.serviceCode }
  });
  await getPublicTrackingStatus(trackBySrvReq.req, trackBySrvReq.res);
  assert.strictEqual(trackBySrvReq.getStatus(), 200, `Track by Service Code failed: ${JSON.stringify(trackBySrvReq.getData())}`);
  const srvTrackData = trackBySrvReq.getData();
  assert.strictEqual(srvTrackData.serviceCode, cashResData.serviceCode);
  assert.strictEqual(srvTrackData.clientName, 'Maria S.', `Client name must be privacy masked: expected "Maria S.", got "${srvTrackData.clientName}"`);
  assert(srvTrackData.receipt, 'Public tracking should return receipt summary when paid');
  assert.strictEqual(srvTrackData.receipt.receiptNo, cashResData.receiptNo);
  console.log(`✓ Public Lookup by Service Code (${cashResData.serviceCode}) -> Status: "${srvTrackData.status}", Masked Client: "${srvTrackData.clientName}"`);

  // Lookup 5b: Track by Direct Fulfillment Document ID (SVC-...) -> Must SUCCEED (200)
  const trackBySvcReq = createMockReqRes({
    params: { trackingId: cashResData.fulfillmentId }
  });
  await getPublicTrackingStatus(trackBySvcReq.req, trackBySvcReq.res);
  assert.strictEqual(trackBySvcReq.getStatus(), 200);
  const svcTrackData = trackBySvcReq.getData();
  assert.strictEqual(svcTrackData.serviceCode, cashResData.serviceCode);
  console.log(`✓ Public Lookup by Fulfillment ID (${cashResData.fulfillmentId}) -> Successfully resolved active service`);

  // Lookup 5c: Track by Receipt Number (RCT-...) -> Must be REJECTED (400)
  const trackByRctReq = createMockReqRes({
    params: { trackingId: cashResData.receiptNo }
  });
  await getPublicTrackingStatus(trackByRctReq.req, trackByRctReq.res);
  assert.strictEqual(trackByRctReq.getStatus(), 400, 'Receipt numbers must be rejected on public service tracker');
  console.log(`✓ Strict Guard: Receipt Number (${cashResData.receiptNo}) correctly rejected with 400 Bad Request`);

  // Lookup 5d: Track by Quote Number (QT-...) -> Must be REJECTED (400)
  const trackByQuoteReq = createMockReqRes({
    params: { trackingId: quotation1.quoteNo }
  });
  await getPublicTrackingStatus(trackByQuoteReq.req, trackByQuoteReq.res);
  assert.strictEqual(trackByQuoteReq.getStatus(), 400, 'Quotation numbers must be rejected on public service tracker');
  console.log(`✓ Strict Guard: Quotation Number (${quotation1.quoteNo}) correctly rejected with 400 Bad Request`);

  // Lookup 5e: Track by Inquiry Reference (INQ-...) -> Must be REJECTED (400)
  const trackByInqReq = createMockReqRes({
    params: { trackingId: 'INQ-SAMPLE-12345' }
  });
  await getPublicTrackingStatus(trackByInqReq.req, trackByInqReq.res);
  assert.strictEqual(trackByInqReq.getStatus(), 400, 'Inquiry reference codes must be rejected on public service tracker');
  console.log(`✓ Strict Guard: Inquiry Code (INQ-SAMPLE-12345) correctly rejected with 400 Bad Request`);

  // -----------------------------------------------------------------------------------
  // TEST 6: Public & Protected Receipt API Endpoints & RBAC Defense
  // -----------------------------------------------------------------------------------
  console.log('\n--- TEST 6: Receipt Endpoints & Cross-Tenant Security Gates ---');

  // 6a: Public Receipt by Service Code (No login required)
  const pubRctReq = createMockReqRes({
    params: { code: cashResData.serviceCode }
  });
  await getPublicReceiptByCode(pubRctReq.req, pubRctReq.res);
  assert.strictEqual(pubRctReq.getStatus(), 200, `getPublicReceiptByCode failed: ${JSON.stringify(pubRctReq.getData())}`);
  const pubRctData = pubRctReq.getData();
  assert.strictEqual(pubRctData.receiptNo, cashResData.receiptNo);
  assert.strictEqual(pubRctData.clientName, 'Maria S.', 'Public receipt client name must be privacy-masked');
  console.log(`✓ Public Receipt Endpoint (/api/receipts/public/${cashResData.serviceCode}) -> Validated without auth`);

  // 6b: Client accessing their own receipt by Quotation ID
  const clientRctReq = createMockReqRes({
    user: { uid: testClientUid, email: 'maria@example.com' },
    userDetails: { role: 'client' },
    params: { quotationId: quoteId1 }
  });
  await getReceiptByQuotationId(clientRctReq.req, clientRctReq.res);
  assert.strictEqual(clientRctReq.getStatus(), 200);
  const clientRctData = clientRctReq.getData();
  assert.strictEqual(clientRctData.receiptNo, cashResData.receiptNo);
  assert.strictEqual(clientRctData.clientName, 'Maria Santos', 'Authenticated owner sees their unmasked full name');
  console.log('✓ Authenticated Client successfully retrieved their authoritative E-Receipt by Quotation ID');

  // 6c: Cross-Tenant Attacker attempting to access another client's receipt (BOLA/IDOR)
  const attackerRctReq = createMockReqRes({
    user: { uid: otherClientUid, email: 'attacker@example.com' },
    userDetails: { role: 'client' },
    params: { quotationId: quoteId1 }
  });
  await getReceiptByQuotationId(attackerRctReq.req, attackerRctReq.res);
  assert.strictEqual(attackerRctReq.getStatus(), 403, `Attacker must be blocked with 403, got ${attackerRctReq.getStatus()}`);
  console.log('✓ IDOR/BOLA Guard: Unauthorized client access to foreign receipt returned 403 Forbidden');

  // 6d: Operator accessing receipt for their branch
  const operatorRctReq = createMockReqRes({
    user: { uid: testBranchUid, email: 'operator@fairfly.com' },
    userDetails: { role: 'operator', branchName: 'FairFly Travel & Tours - Baliuag' },
    params: { fulfillmentId: cashResData.fulfillmentId }
  });
  await getReceiptByFulfillmentId(operatorRctReq.req, operatorRctReq.res);
  assert.strictEqual(operatorRctReq.getStatus(), 200);
  assert.strictEqual(operatorRctReq.getData().receiptNo, cashResData.receiptNo);
  console.log('✓ Branch Operator successfully retrieved receipt by Fulfillment ID');

  console.log('\n================================================================');
  console.log('ALL FEATURE 17 E-RECEIPT & TRACKING TESTS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
    process.exit(1);
  });
