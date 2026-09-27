/**
 * Comprehensive Automated Security & Penetration Testing Verification Suite
 * Tests all remediated vulnerabilities, RBAC barriers, BOLA/IDOR checks, and edge cases.
 */

const assert = require('assert');
const { db } = require('../config/firebase');

// In-memory mock document store for unit testing
const mockDocStore = {};

// Intercept db.doc
const originalDoc = db.doc.bind(db);
db.doc = (path) => {
  if (mockDocStore[path]) {
    return {
      get: async () => ({
        exists: true,
        data: () => ({ ...mockDocStore[path] }),
        id: path.split('/').pop()
      }),
      update: async () => {},
      delete: async () => {},
      set: async () => {}
    };
  }
  return originalDoc(path);
};

// Intercept db.collection
const originalCollection = db.collection.bind(db);
db.collection = (name) => {
  const coll = originalCollection(name);
  const origDoc = coll.doc.bind(coll);
  coll.doc = (id) => {
    const fullPath = id ? `${name}/${id}` : name;
    if (mockDocStore[fullPath]) {
      return {
        get: async () => ({
          exists: true,
          data: () => ({ ...mockDocStore[fullPath] }),
          id
        }),
        update: async () => {},
        delete: async () => {},
        set: async () => {},
        collection: coll.collection ? coll.collection.bind(coll) : () => ({})
      };
    }
    return origDoc(id);
  };
  return coll;
};

// Mock response helper for controller unit testing
const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    }
  };
  return res;
};

// Mock next helper
const createMockNext = () => {
  let called = false;
  const next = () => {
    called = true;
  };
  next.isCalled = () => called;
  return next;
};

async function runTests() {
  console.log('================================================================');
  console.log('Starting Automated Security & Edge-Case Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Network & Middleware Level Controls
  // --------------------------------------------------------------------------
  console.log('--- Group 1: Middleware & Network Level Security Controls ---');

  const { requireRole } = require('../middleware/auth');
  const { allowedFields } = require('../middleware/allowedFields');

  test('requireRole blocks clients when role is operator', () => {
    const middleware = requireRole(['operator']);
    const req = { userDetails: { role: 'client' } };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert.strictEqual(res.statusCode, 403, 'Should return HTTP 403 for client role');
    assert.strictEqual(next.isCalled(), false, 'Next should not be called');
  });

  test('requireRole supports branch_operator alias when operator is allowed', () => {
    const middleware = requireRole(['operator']);
    const req = { userDetails: { role: 'branch_operator' } };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert.strictEqual(next.isCalled(), true, 'Next should be called for branch_operator');
  });

  test('allowedFields rejects unexpected injection fields', () => {
    const middleware = allowedFields(['name', 'status']);
    const req = { body: { name: 'Valid', status: 'Pending', maliciousField: 'hack' } };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert.strictEqual(res.statusCode, 400, 'Should return HTTP 400 for unexpected fields');
    assert.strictEqual(next.isCalled(), false, 'Next should not be called');
  });

  test('allowedFields passes when only permitted fields are present', () => {
    const middleware = allowedFields(['name', 'status']);
    const req = { body: { name: 'Valid', status: 'Pending' } };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert.strictEqual(next.isCalled(), true, 'Next should be called when fields match');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 2: File Upload Defense (Magic Bytes & Malicious Payloads)
  // --------------------------------------------------------------------------
  console.log('\n--- Group 2: File Security & Malicious Upload Verification ---');

  const { validateUploadMetadata, verifyFileContent } = require('../utils/fileSecurity');

  test('Rejects dangerous executable extensions (.exe, .sh, .php, .bat)', () => {
    const badFiles = ['exploit.exe', 'script.sh', 'shell.php', 'virus.bat', 'hack.vbs', 'run.cmd'];
    for (const file of badFiles) {
      const res = validateUploadMetadata(file, 'application/octet-stream');
      assert.strictEqual(res.valid, false, `File ${file} must be rejected`);
    }
  });

  test('Rejects double-extension attacks (e.g. invoice.pdf.exe)', () => {
    const res = validateUploadMetadata('invoice.pdf.exe', 'application/pdf');
    assert.strictEqual(res.valid, false, 'Double extension must be rejected');
  });

  test('Rejects spoofed MIME types matching executable payloads', () => {
    // Windows PE executable header MZ
    const mzBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00]);
    const res = verifyFileContent(mzBuffer, '.pdf');
    assert.strictEqual(res.valid, false, 'MZ executable disguised as PDF must be rejected');
  });

  test('Accepts authentic PDF buffer with valid %PDF- magic bytes', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 header contents and streams', 'utf-8');
    const res = verifyFileContent(pdfBuffer, '.pdf');
    assert.strictEqual(res.valid, true, 'Valid PDF buffer must be accepted');
    assert.strictEqual(res.canonicalMime, 'application/pdf');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Active Service Step Escalation & Cancellation Controls
  // --------------------------------------------------------------------------
  console.log('\n--- Group 3: Active Service Privilege Escalation Defenses ---');

  const activeServiceController = require('../controllers/activeServiceController');

  await asyncTest('updateStepStatus blocks client from advancing service steps', async () => {
    mockDocStore['activeServices/srv_test_123'] = {
      id: 'srv_test_123',
      operatorId: 'operator_uid_branch_a',
      clientUid: 'client_uid_1',
      steps: [{ title: 'Intake', status: 'Pending' }]
    };

    const req = {
      params: { id: 'srv_test_123' },
      body: { stepIndex: 0, newStatus: 'Completed' },
      user: { uid: 'client_uid_1' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await activeServiceController.updateStepStatus(req, res);
    assert.strictEqual(res.statusCode, 403, 'Client must be forbidden from updating service steps');
  });

  await asyncTest('updateStepStatus blocks unassigned operator from advancing other branch steps', async () => {
    mockDocStore['activeServices/srv_test_123'] = {
      id: 'srv_test_123',
      operatorId: 'operator_uid_branch_a',
      branchUid: 'operator_uid_branch_a',
      clientUid: 'client_uid_1',
      steps: [{ title: 'Intake', status: 'Pending' }]
    };

    const req = {
      params: { id: 'srv_test_123' },
      body: { stepIndex: 0, newStatus: 'Completed' },
      user: { uid: 'operator_uid_branch_b' },
      userDetails: { role: 'operator' }
    };
    const res = createMockRes();

    await activeServiceController.updateStepStatus(req, res);
    assert.strictEqual(res.statusCode, 403, 'Unassigned operator must be forbidden');
  });

  await asyncTest('cancelActiveService prevents unauthorized client from cancelling other client service', async () => {
    mockDocStore['activeServices/srv_test_123'] = {
      id: 'srv_test_123',
      operatorId: 'operator_uid_branch_a',
      clientUid: 'victim_client_uid',
      status: 'Pending',
      currentStepIndex: 0
    };

    const req = {
      params: { id: 'srv_test_123' },
      body: { reason: 'Malicious cancellation' },
      user: { uid: 'attacker_client_uid' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await activeServiceController.cancelActiveService(req, res);
    assert.strictEqual(res.statusCode, 403, 'Non-owner client must be forbidden from cancelling');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Quotation Authorization & Ownership (BOLA)
  // --------------------------------------------------------------------------
  console.log('\n--- Group 4: Quotation Authorization & BOLA Defenses ---');

  const quotationController = require('../controllers/quotationController');

  await asyncTest('acceptQuotation forbids client from accepting another client quotation', async () => {
    mockDocStore['quotations/qt_123'] = {
      id: 'qt_123',
      clientUid: 'victim_client_uid',
      branchUid: 'op_branch_1',
      status: 'Sent'
    };

    const req = {
      params: { id: 'qt_123' },
      user: { uid: 'attacker_client_uid' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await quotationController.acceptQuotation(req, res);
    assert.strictEqual(res.statusCode, 403, 'Client cannot accept another client quote');
  });

  await asyncTest('updateQuotationStatus forbids operator from modifying other branch quotation', async () => {
    mockDocStore['quotations/qt_123'] = {
      id: 'qt_123',
      branchUid: 'legit_op_branch',
      operatorId: 'legit_op_branch',
      status: 'Draft'
    };

    const req = {
      params: { id: 'qt_123' },
      body: { status: 'Accepted' },
      user: { uid: 'rogue_op_uid' },
      userDetails: { role: 'operator' }
    };
    const res = createMockRes();

    await quotationController.updateQuotationStatus(req, res);
    assert.strictEqual(res.statusCode, 403, 'Operator cannot alter another branch quotation');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Appointment Status Modification Defense
  // --------------------------------------------------------------------------
  console.log('\n--- Group 5: Appointment Modification & Status Protections ---');

  const appointmentController = require('../controllers/appointmentController');

  await asyncTest('updateAppointmentStatus forbids client from setting Confirmed status', async () => {
    mockDocStore['appointments/apt_123'] = {
      id: 'apt_123',
      clientUid: 'client_uid_1',
      branchUid: 'op_branch_1',
      status: 'Pending'
    };

    const req = {
      params: { id: 'apt_123' },
      body: { status: 'Confirmed' },
      user: { uid: 'client_uid_1' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await appointmentController.updateAppointmentStatus(req, res);
    assert.strictEqual(res.statusCode, 403, 'Client must not be able to confirm appointment');
  });

  await asyncTest('updateAppointmentStatus forbids client from cancelling another client appointment', async () => {
    mockDocStore['appointments/apt_123'] = {
      id: 'apt_123',
      clientUid: 'victim_client_uid',
      branchUid: 'op_branch_1',
      status: 'Pending'
    };

    const req = {
      params: { id: 'apt_123' },
      body: { status: 'Cancelled' },
      user: { uid: 'attacker_client_uid' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await appointmentController.updateAppointmentStatus(req, res);
    assert.strictEqual(res.statusCode, 403, 'Client cannot cancel someone elses appointment');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Inquiry Access Control & BOLA
  // --------------------------------------------------------------------------
  console.log('\n--- Group 6: Inquiry Ownership & CRUD Controls ---');

  const inquiryController = require('../controllers/inquiryController');

  await asyncTest('getInquiryById forbids unauthorized client from reading other client inquiry', async () => {
    mockDocStore['inquiries/inq_123'] = {
      id: 'inq_123',
      clientUid: 'legit_client_uid',
      branchUid: 'branch_a'
    };

    const req = {
      params: { id: 'inq_123' },
      user: { uid: 'attacker_client_uid' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await inquiryController.getInquiryById(req, res);
    assert.strictEqual(res.statusCode, 403, 'Unauthorized client must be forbidden');
  });

  await asyncTest('deleteInquiry forbids unauthorized operator from deleting other branch inquiry', async () => {
    mockDocStore['inquiries/inq_123'] = {
      id: 'inq_123',
      branchUid: 'authorized_branch_op',
      operatorId: 'authorized_branch_op'
    };

    const req = {
      params: { id: 'inq_123' },
      user: { uid: 'unauthorized_op' },
      userDetails: { role: 'operator' }
    };
    const res = createMockRes();

    await inquiryController.deleteInquiry(req, res);
    assert.strictEqual(res.statusCode, 403, 'Unauthorized operator must be forbidden');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Support Ticket & Thread Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Group 7: Support Ticket Data Isolation ---');

  const ticketController = require('../controllers/ticketController');

  await asyncTest('getTickets blocks client accounts from viewing operator support tickets', async () => {
    const req = {
      query: {},
      user: { uid: 'client_uid' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await ticketController.getTickets(req, res);
    assert.strictEqual(res.statusCode, 403, 'Client accounts must be forbidden from tickets');
  });

  await asyncTest('getTicketById forbids operator from viewing another operators ticket', async () => {
    mockDocStore['tickets/tkt_123'] = {
      id: 'tkt_123',
      operatorId: 'operator_a',
      title: 'Confidential Ticket'
    };

    const req = {
      params: { id: 'tkt_123' },
      user: { uid: 'operator_b' },
      userDetails: { role: 'operator' }
    };
    const res = createMockRes();

    await ticketController.getTicketById(req, res);
    assert.strictEqual(res.statusCode, 403, 'Operator cannot view another operator ticket');
  });

  await asyncTest('addMessageToThread forbids injection by unassociated operator', async () => {
    mockDocStore['tickets/tkt_123'] = {
      id: 'tkt_123',
      operatorId: 'ticket_owner_op',
      status: 'Ongoing'
    };

    const req = {
      params: { id: 'tkt_123' },
      body: { message: 'Injected reply' },
      user: { uid: 'unauthorized_op' },
      userDetails: { role: 'operator' }
    };
    const res = createMockRes();

    await ticketController.addMessageToThread(req, res);
    assert.strictEqual(res.statusCode, 403, 'Unassociated user cannot reply to ticket');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Notification Deletion Protections
  // --------------------------------------------------------------------------
  console.log('\n--- Group 8: Notification Deletion Protections ---');

  const notificationController = require('../controllers/notificationController');

  await asyncTest('deleteNotification forbids user from deleting another users notification', async () => {
    mockDocStore['notifications/notif_123'] = {
      id: 'notif_123',
      recipientUid: 'victim_user',
      title: 'Confidential Notice'
    };

    const req = {
      params: { id: 'notif_123' },
      user: { uid: 'attacker_user' },
      userDetails: { role: 'client' }
    };
    const res = createMockRes();

    await notificationController.deleteNotification(req, res);
    assert.strictEqual(res.statusCode, 403, 'User cannot delete another users notification');
  });

  await asyncTest('deleteNotification forbids non-admin from deleting broadcast notification', async () => {
    mockDocStore['notifications/notif_broadcast'] = {
      id: 'notif_broadcast',
      recipientUid: null, // broadcast notice
      title: 'System Wide Maintenance'
    };

    const req = {
      params: { id: 'notif_broadcast' },
      user: { uid: 'attacker_user' },
      userDetails: { role: 'operator' }
    };
    const res = createMockRes();

    await notificationController.deleteNotification(req, res);
    assert.strictEqual(res.statusCode, 403, 'Non-admin cannot delete broadcast notification');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 9: Live HTTP Endpoint & Security Headers Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Group 9: Live HTTP Endpoint & Security Headers Verification ---');

  await asyncTest('Live API emits proper security headers and hides X-Powered-By', async () => {
    const res = await fetch('http://localhost:5001/health');
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200');

    const headers = Object.fromEntries(res.headers);
    assert.strictEqual(headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
    assert.strictEqual(headers['x-frame-options'], 'DENY', 'X-Frame-Options must be DENY');
    assert.strictEqual(headers['x-xss-protection'], '1; mode=block', 'X-XSS-Protection must be 1; mode=block');
    assert.ok(headers['strict-transport-security'], 'Strict-Transport-Security must be configured');
    assert.strictEqual(headers['x-powered-by'], undefined, 'X-Powered-By should be removed');
  });

  await asyncTest('Live API resolves /api/services/quicklinks correctly (Route Shadowing Fix)', async () => {
    const res = await fetch('http://localhost:5001/api/services/quicklinks');
    assert.strictEqual(res.status, 200, 'Quicklinks endpoint should return 200, not 404');
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Quicklinks response must be an array');
  });

  console.log('\n================================================================');
  console.log(`Test Execution Completed: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
