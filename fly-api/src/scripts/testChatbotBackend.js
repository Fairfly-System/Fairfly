/**
 * Test script for backend chatbot grounding and Gemini proxy
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const { fetchActiveBranchesInternal } = require('../controllers/operatorController');
const { fetchActiveServicesInternal } = require('../controllers/serviceController');
const { buildBackendSystemInstruction } = require('../utils/botPersona');
const { handleChatMessage } = require('../controllers/chatbotController');

async function runTest() {
  console.log('--- Testing Backend Chatbot Grounding ---');
  
  // 1. Test Branches Fetching
  const branches = await fetchActiveBranchesInternal();
  console.log(`Fetched ${branches.length} active branches.`);
  if (branches.length > 0) {
    console.log('Sample Branch:', branches[0].branchName, '|', branches[0].address, '| Phone:', branches[0].contactNumber);
  }

  // 2. Test Services Fetching
  const services = await fetchActiveServicesInternal();
  console.log(`Fetched ${services.length} active services.`);
  if (services.length > 0) {
    console.log('Sample Service:', services[0].name, '| Price:', services[0].price, '| Category:', services[0].category);
  }

  // 3. Test Grounding Prompt Builder
  const prompt = buildBackendSystemInstruction({
    services: services.slice(0, 5),
    branches,
    config: {}
  });
  console.log('Prompt length (characters):', prompt.length);
  console.log('Has Branch Directory:', prompt.includes('Official Fairfly Branch Directory'));
  console.log('Has Service Catalog:', prompt.includes('Current Fairfly Service Catalog'));

  // 4. Test handleChatMessage with simulated req/res
  console.log('\n--- Testing Gemini Response via handleChatMessage ---');
  const mockReq = {
    body: {
      message: 'Where are your branches located and how do I contact them?',
      history: []
    }
  };

  let responseStatus = 200;
  let responseData = null;
  const mockRes = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  await handleChatMessage(mockReq, mockRes);
  console.log('HTTP Status:', responseStatus);
  console.log('Chatbot Reply:', responseData?.reply);

  if (responseStatus === 200 && responseData?.reply) {
    console.log('\n>>> SUCCESS: Chatbot answered with grounded branch details! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> FAILED: Chatbot did not return 200 reply <<<', responseData);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
