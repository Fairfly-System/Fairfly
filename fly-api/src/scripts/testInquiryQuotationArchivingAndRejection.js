/**
 * testInquiryQuotationArchivingAndRejection.js
 * Comprehensive Verification Suite for:
 * 1. Asymmetric Cascading Archive (Inquiry -> Quotations)
 * 2. Independent Quotation Archival (Leaves Inquiry Active)
 * 3. Parent Inquiry Guard on Quotation Restoration (Prevents Orphaned Quotations)
 * 4. Selective Inquiry Restoration (Restores only cascading quotations, preserves manual archives)
 * 5. Permanent Deletion Disabled (Returns 400 with archival guidance, documents preserved)
 * 6. Client Quotation Rejection Lifecycle (BOLA check, status update, audit fields, notification, blocks re-acceptance)
 * 7. Query Archival Filtering (Active vs Archived queries)
 */

const assert = require('assert');
const { db } = require('../config/firebase');
const {
  archiveInquiry,
  restoreInquiry,
  deleteInquiry,
  getInquiries
} = require('../controllers/inquiryController');
const {
  archiveQuotation,
  restoreQuotation,
  deleteQuotation,
  rejectQuotation,
  acceptQuotation,
  getQuotations
} = require('../controllers/quotationController');

function createMockReqRes(options = {}) {
  const req = {
    params: options.params || {},
    body: options.body || {},
    user: options.user || { uid: 'operator_123', email: 'operator@example.com' },
    userDetails: options.userDetails || { role: 'operator', branchUid: 'branch_1', branchName: 'Main Branch' },
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

async function runArchivingAndRejectionTests() {
  console.log('\n================================================================');
  console.log('STARTING INQUIRY & QUOTATION ARCHIVING + REJECTION TEST SUITE');
  console.log('================================================================\n');

  const testBranchUid = 'test_branch_' + Date.now();
  const testClientUid = 'test_client_' + Date.now();
  const createdDocRefs = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Asymmetric Cascading Archive (Inquiry -> Quotations)
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Testing asymmetric cascading archival from Inquiry to Quotations...');

    const inq1Ref = await db.collection('inquiries').add({
      controlNo: 'INQ-TEST-001',
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'submitted',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(inq1Ref);

    const quote1aRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-001A',
      inquiryId: inq1Ref.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Sent',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quote1aRef);

    const quote1bRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-001B',
      inquiryId: inq1Ref.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Draft',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quote1bRef);

    // Call archiveInquiry
    const { req: req1, res: res1, getStatus: status1 } = createMockReqRes({
      params: { id: inq1Ref.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });

    await archiveInquiry(req1, res1);
    assert.strictEqual(status1(), 200, 'archiveInquiry should return 200');

    // Verify parent inquiry in Firestore
    const inq1Snap = await inq1Ref.get();
    assert.strictEqual(inq1Snap.data().archived, true, 'Inquiry should be marked archived: true');
    assert.strictEqual(inq1Snap.data().archivedBy, 'op_user_1', 'Inquiry archivedBy should match user');
    assert.ok(inq1Snap.data().archivedAt, 'Inquiry should have archivedAt timestamp');

    // Verify linked quotations were cascade-archived
    const q1aSnap = await quote1aRef.get();
    assert.strictEqual(q1aSnap.data().archived, true, 'Quote 1a should be cascade-archived');
    assert.strictEqual(q1aSnap.data().archivedReason, 'inquiry_archived', 'Quote 1a reason should be inquiry_archived');

    const q1bSnap = await quote1bRef.get();
    assert.strictEqual(q1bSnap.data().archived, true, 'Quote 1b should be cascade-archived');
    assert.strictEqual(q1bSnap.data().archivedReason, 'inquiry_archived', 'Quote 1b reason should be inquiry_archived');

    console.log('✓ PASS: Asymmetric cascade archive successfully archived inquiry and linked quotations with inquiry_archived reason.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Independent Quotation Archival (Leaves Inquiry Active)
    // -------------------------------------------------------------------------
    console.log('[TEST 2] Testing independent quotation archival leaving parent inquiry active...');

    const inq2Ref = await db.collection('inquiries').add({
      controlNo: 'INQ-TEST-002',
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'submitted',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(inq2Ref);

    const quote2aRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-002A',
      inquiryId: inq2Ref.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Draft',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quote2aRef);

    const quote2bRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-002B',
      inquiryId: inq2Ref.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Sent',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quote2bRef);

    // Call archiveQuotation for Quote 2a
    const { req: req2, res: res2, getStatus: status2 } = createMockReqRes({
      params: { id: quote2aRef.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });

    await archiveQuotation(req2, res2);
    assert.strictEqual(status2(), 200, 'archiveQuotation should return 200');

    // Verify Quote 2a is archived
    const q2aSnap = await quote2aRef.get();
    assert.strictEqual(q2aSnap.data().archived, true, 'Quote 2a should be archived');
    assert.strictEqual(q2aSnap.data().archivedReason, 'manual_archive', 'Quote 2a should have manual_archive reason');

    // Verify parent Inquiry 2 and sibling Quote 2b remain active
    const inq2Snap = await inq2Ref.get();
    assert.strictEqual(inq2Snap.data().archived, false, 'Parent Inquiry 2 must remain active');

    const q2bSnap = await quote2bRef.get();
    assert.strictEqual(q2bSnap.data().archived, false, 'Sibling Quote 2b must remain active');

    console.log('✓ PASS: Quotation archived independently while parent inquiry and sibling quotation remained active.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Parent Inquiry Guard on Quotation Restoration
    // -------------------------------------------------------------------------
    console.log('[TEST 3] Testing parent inquiry guard on quotation restoration...');

    // Archive Inquiry 2 now
    await inq2Ref.update({
      archived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: 'op_user_1'
    });

    // Attempt to restore Quote 2a while Inquiry 2 is archived
    const { req: req3Fail, res: res3Fail, getStatus: status3Fail, getData: data3Fail } = createMockReqRes({
      params: { id: quote2aRef.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });

    await restoreQuotation(req3Fail, res3Fail);
    assert.strictEqual(status3Fail(), 400, 'Should reject quotation restoration with 400 when parent inquiry is archived');
    assert.ok(data3Fail().error.toLowerCase().includes('parent inquiry'), 'Error message should explain parent inquiry must be restored first');

    // Now restore Inquiry 2
    await inq2Ref.update({
      archived: false,
      archivedAt: null,
      archivedBy: null
    });

    // Attempt to restore Quote 2a again -> should now succeed
    const { req: req3Success, res: res3Success, getStatus: status3Success } = createMockReqRes({
      params: { id: quote2aRef.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });

    await restoreQuotation(req3Success, res3Success);
    assert.strictEqual(status3Success(), 200, 'Restoring quotation should succeed when parent inquiry is active');

    const q2aRestoredSnap = await quote2aRef.get();
    assert.strictEqual(q2aRestoredSnap.data().archived, false, 'Quote 2a should now be restored');

    console.log('✓ PASS: Parent inquiry guard correctly blocked quotation restoration until parent inquiry was active.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Selective Inquiry Restoration (Preserves Manual Archives)
    // -------------------------------------------------------------------------
    console.log('[TEST 4] Testing selective inquiry restoration preserving manually archived quotations...');

    const inq4Ref = await db.collection('inquiries').add({
      controlNo: 'INQ-TEST-004',
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'submitted',
      archived: false,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(inq4Ref);

    // Quote 4a was manually archived BEFORE inquiry archive
    const quote4aRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-004A',
      inquiryId: inq4Ref.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Draft',
      archived: true,
      archivedReason: 'manual_archive',
      archivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quote4aRef);

    // Quote 4b was active
    const quote4bRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-004B',
      inquiryId: inq4Ref.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Sent',
      archived: false,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quote4bRef);

    // Archive Inquiry 4
    const { req: req4Arch, res: res4Arch } = createMockReqRes({
      params: { id: inq4Ref.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await archiveInquiry(req4Arch, res4Arch);

    // Verify Quote 4b got inquiry_archived, Quote 4a retained manual_archive
    const q4aAfterInqArch = await quote4aRef.get();
    const q4bAfterInqArch = await quote4bRef.get();
    assert.strictEqual(q4aAfterInqArch.data().archivedReason, 'manual_archive');
    assert.strictEqual(q4bAfterInqArch.data().archivedReason, 'inquiry_archived');

    // Now restore Inquiry 4
    const { req: req4Rest, res: res4Rest, getStatus: status4Rest } = createMockReqRes({
      params: { id: inq4Ref.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await restoreInquiry(req4Rest, res4Rest);
    assert.strictEqual(status4Rest(), 200, 'restoreInquiry should return 200');

    // Check results: Quote 4b should be restored, Quote 4a MUST remain archived
    const q4aFinal = await quote4aRef.get();
    const q4bFinal = await quote4bRef.get();
    assert.strictEqual(q4bFinal.data().archived, false, 'Quote 4b (cascade) should be restored');
    assert.strictEqual(q4aFinal.data().archived, true, 'Quote 4a (manual) must remain archived');

    console.log('✓ PASS: Selective restoration revived only cascading quotations and kept manually archived quotations intact.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Permanent Deletion Disabled (Returns 400 with Archival Guidance)
    // -------------------------------------------------------------------------
    console.log('[TEST 5] Testing disabled permanent deletion endpoints...');

    const { req: reqDelInq, res: resDelInq, getStatus: statusDelInq, getData: dataDelInq } = createMockReqRes({
      params: { id: inq1Ref.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await deleteInquiry(reqDelInq, resDelInq);
    assert.strictEqual(statusDelInq(), 400, 'deleteInquiry should return 400');
    assert.ok(dataDelInq().error.toLowerCase().includes('permanent deletion'), 'Error should state permanent deletion is disabled');

    const inqStillExists = await inq1Ref.get();
    assert.ok(inqStillExists.exists, 'Inquiry document must still exist in Firestore');

    const { req: reqDelQuote, res: resDelQuote, getStatus: statusDelQuote, getData: dataDelQuote } = createMockReqRes({
      params: { id: quote1aRef.id },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await deleteQuotation(reqDelQuote, resDelQuote);
    assert.strictEqual(statusDelQuote(), 400, 'deleteQuotation should return 400');
    assert.ok(dataDelQuote().error.toLowerCase().includes('permanent deletion'), 'Error should state permanent deletion is disabled');

    const quoteStillExists = await quote1aRef.get();
    assert.ok(quoteStillExists.exists, 'Quotation document must still exist in Firestore');

    console.log('✓ PASS: Permanent deletion endpoints safely return 400 and documents remain intact.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Client Quotation Rejection Lifecycle
    // -------------------------------------------------------------------------
    console.log('[TEST 6] Testing client quotation rejection lifecycle...');

    const inqRejRef = await db.collection('inquiries').add({
      controlNo: 'INQ-TEST-REJ',
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'quotation_sent',
      archived: false,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(inqRejRef);

    const quoteRejRef = await db.collection('quotations').add({
      quoteNo: 'Q-TEST-REJ',
      inquiryId: inqRejRef.id,
      clientUid: testClientUid,
      branchUid: testBranchUid,
      status: 'Sent',
      archived: false,
      createdAt: new Date().toISOString()
    });
    createdDocRefs.push(quoteRejRef);

    // 6a: BOLA Prevention - another user attempts rejection
    const { req: reqBola, res: resBola, getStatus: statusBola } = createMockReqRes({
      params: { id: quoteRejRef.id },
      user: { uid: 'attacker_uid_999' },
      userDetails: { role: 'client' },
      body: { reason: 'Sneaky attack' }
    });
    await rejectQuotation(reqBola, resBola);
    assert.strictEqual(statusBola(), 403, 'Should reject unauthorized user rejection with 403');

    // 6b: Legitimate Client Rejection
    const { req: reqRejSuccess, res: resRejSuccess, getStatus: statusRejSuccess } = createMockReqRes({
      params: { id: quoteRejRef.id },
      user: { uid: testClientUid },
      userDetails: { role: 'client' },
      body: { reason: 'Budget exceeds expectations for travel package' }
    });
    await rejectQuotation(reqRejSuccess, resRejSuccess);
    assert.strictEqual(statusRejSuccess(), 200, 'Legitimate client rejection should return 200');

    // Verify Quotation document state
    const quoteRejSnap = await quoteRejRef.get();
    const quoteData = quoteRejSnap.data();
    assert.strictEqual(quoteData.status, 'Rejected', 'Quotation status must be "Rejected"');
    assert.strictEqual(quoteData.rejectedBy, testClientUid, 'Quotation rejectedBy must match client');
    assert.strictEqual(quoteData.rejectionReason, 'Budget exceeds expectations for travel package');
    assert.ok(quoteData.rejectedAt, 'Quotation must have rejectedAt timestamp');

    // Verify parent inquiry status updated
    const inqRejSnap = await inqRejRef.get();
    assert.strictEqual(inqRejSnap.data().status, 'rejected', 'Inquiry status should be synchronized to "rejected"');

    // 6c: Idempotency / Double Rejection blocked
    const { req: reqDoubleRej, res: resDoubleRej, getStatus: statusDoubleRej } = createMockReqRes({
      params: { id: quoteRejRef.id },
      user: { uid: testClientUid },
      userDetails: { role: 'client' },
      body: { reason: 'Trying again' }
    });
    await rejectQuotation(reqDoubleRej, resDoubleRej);
    assert.strictEqual(statusDoubleRej(), 400, 'Cannot reject an already rejected quotation');

    // 6d: Cannot accept a rejected quotation
    const { req: reqAcceptRej, res: resAcceptRej, getStatus: statusAcceptRej } = createMockReqRes({
      params: { id: quoteRejRef.id },
      user: { uid: testClientUid },
      userDetails: { role: 'client' }
    });
    await acceptQuotation(reqAcceptRej, resAcceptRej);
    assert.strictEqual(statusAcceptRej(), 400, 'Cannot accept a rejected quotation');

    console.log('✓ PASS: Client quotation rejection successfully enforced BOLA, updated status and audit fields, synchronized inquiry, and prevented re-acceptance.\n');

    // -------------------------------------------------------------------------
    // TEST 7: Query Archival Filtering (Active vs Archived)
    // -------------------------------------------------------------------------
    console.log('[TEST 7] Testing query filtering for active vs archived records...');

    // Fetch active inquiries
    const { req: reqActiveInq, res: resActiveInq, getStatus: statusActiveInq, getData: dataActiveInq } = createMockReqRes({
      query: { archived: 'false' },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await getInquiries(reqActiveInq, resActiveInq);
    assert.strictEqual(statusActiveInq(), 200);
    const activeInqList = Array.isArray(dataActiveInq()) ? dataActiveInq() : (dataActiveInq().inquiries || []);
    assert.ok(activeInqList.every(i => !i.archived), 'Active inquiries query must return only non-archived inquiries');

    // Fetch archived inquiries
    const { req: reqArchInq, res: resArchInq, getStatus: statusArchInq, getData: dataArchInq } = createMockReqRes({
      query: { archived: 'true' },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await getInquiries(reqArchInq, resArchInq);
    assert.strictEqual(statusArchInq(), 200);
    const archInqList = Array.isArray(dataArchInq()) ? dataArchInq() : (dataArchInq().inquiries || []);
    assert.ok(archInqList.every(i => i.archived === true), 'Archived inquiries query must return only archived inquiries');

    // Fetch active quotations
    const { req: reqActiveQuote, res: resActiveQuote, getStatus: statusActiveQuote, getData: dataActiveQuote } = createMockReqRes({
      query: { archived: 'false' },
      user: { uid: 'op_user_1' },
      userDetails: { role: 'operator', branchUid: testBranchUid }
    });
    await getQuotations(reqActiveQuote, resActiveQuote);
    assert.strictEqual(statusActiveQuote(), 200);
    const activeQuoteList = Array.isArray(dataActiveQuote()) ? dataActiveQuote() : (dataActiveQuote().quotations || []);
    assert.ok(activeQuoteList.every(q => !q.archived), 'Active quotations query must return only non-archived quotations');

    console.log('✓ PASS: Query endpoints correctly segregate active and archived records at database query level.\n');

    console.log('================================================================');
    console.log('ALL 7 ARCHIVING & REJECTION TESTS PASSED PERFECTLY!');
    console.log('================================================================\n');

  } finally {
    // Clean up created test documents
    console.log('Cleaning up test documents...');
    for (const ref of createdDocRefs) {
      try {
        await ref.delete();
      } catch (err) {
        // ignore cleanup errors
      }
    }
    console.log('Cleanup complete.');
  }
}

runArchivingAndRejectionTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED WITH ERROR:', err);
  process.exit(1);
});
