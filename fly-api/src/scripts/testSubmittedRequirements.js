/**
 * Verification test for Normalized Submitted Requirements & Clean Schema
 */

const { db } = require('../config/firebase');
const { sanitizeFolder } = require('../utils/fileSecurity');

async function testSubmittedRequirements() {
  console.log('================================================================');
  console.log('Testing Submitted Requirements Clean Schema & References');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Test Folder Sanitization & Subfolder support
  console.log('--- Test 1: Multi-Segment Folder Hierarchy Validation ---');
  const sanitized1 = sanitizeFolder('service_requirements/REQ-123456');
  assert(sanitized1 === 'service_requirements/REQ-123456', 'Allows clean nested service_requirements/REQ-xxx folder path');

  const sanitized2 = sanitizeFolder('client_ids/USR-CLT-789');
  assert(sanitized2 === 'client_ids/USR-CLT-789', 'Allows clean nested client_ids folder path');

  const sanitized3 = sanitizeFolder('chat_attachments/CNV-999');
  assert(sanitized3 === 'chat_attachments/CNV-999', 'Allows clean nested chat_attachments folder path');

  const sanitized4 = sanitizeFolder('../../../etc/passwd');
  assert(sanitized4 === 'uploads', 'Rejects path traversal and falls back to safe default');

  // 2. Test Submitted Requirements Schema Cleanliness
  console.log('\n--- Test 2: Submitted Requirements Lean Document Schema ---');
  const reqSnap = await db.collection('submitted_requirements').limit(1).get();
  if (!reqSnap.empty) {
    const docData = reqSnap.docs[0].data();
    console.log('  Sample submitted_requirements document keys:', Object.keys(docData).join(', '));
    
    assert(docData.requirements !== undefined, 'Contains requirements array');
    assert(docData.submittedBy !== undefined, 'Contains submittedBy UID');
    assert(docData.clientUid === undefined, 'Eliminated redundant clientUid (strictly keeping submittedBy)');
    assert(docData.createdAt !== undefined, 'Contains createdAt timestamp');
    assert(docData.serviceTitle === undefined, 'Eliminated redundant serviceTitle from submitted_requirements');
    assert(docData.clientName === undefined, 'Eliminated redundant clientName from submitted_requirements');
    assert(docData.branchName === undefined, 'Eliminated redundant branchName from submitted_requirements');
  }

  // 3. Test Inquiries Cleanliness (Single Reference & No Bloated Array)
  console.log('\n--- Test 3: Inquiries Clean Single Reference & No Bloated Array ---');
  const inqSnap = await db.collection('inquiries').limit(5).get();
  if (!inqSnap.empty) {
    for (const doc of inqSnap.docs) {
      const data = doc.data();
      assert(data.submitted_requirements === undefined, `Inquiry ${doc.id} does not have redundant submitted_requirements field`);
      if (data.submittedRequirementsId) {
        assert(data.requirements === undefined, `Inquiry ${doc.id} with submittedRequirementsId has stripped bloated requirements array`);
      }
    }
  }

  console.log('\n================================================================');
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testSubmittedRequirements()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
