const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const {
  getConfig,
  updateConfig,
  getFaqs,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} = require('../controllers/chatbotController');

router.get('/config', performanceProfiler('GET /chatbot/config', apiRateLimiter, getConfig));
router.put('/config', verifyFirebaseToken, requireRole('admin'), performanceProfiler('PUT /chatbot/config', apiRateLimiter, updateConfig));
router.get('/faqs', performanceProfiler('GET /chatbot/faqs', apiRateLimiter, getFaqs));
router.get('/faqs/manage', verifyFirebaseToken, requireRole('admin'), performanceProfiler('GET /chatbot/faqs/manage', apiRateLimiter, getAllFaqs));
router.post('/faqs', verifyFirebaseToken, requireRole('admin'), performanceProfiler('POST /chatbot/faqs', apiRateLimiter, createFaq));
router.patch('/faqs/:id', verifyFirebaseToken, requireRole('admin'), performanceProfiler('PATCH /chatbot/faqs/:id', apiRateLimiter, updateFaq));
router.delete('/faqs/:id', verifyFirebaseToken, requireRole('admin'), performanceProfiler('DELETE /chatbot/faqs/:id', apiRateLimiter, deleteFaq));

module.exports = router;
