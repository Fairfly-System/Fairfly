const express = require('express');
const router = express.Router();
const { 
  createInquiry, 
  getInquiries, 
  updateInquiry, 
  deleteInquiry 
} = require('../controllers/inquiryController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createInquiry);

router.get('/', performanceProfiler('GET /inquiries', verifyFirebaseToken, apiRateLimiter, getInquiries));
router.patch('/:id', performanceProfiler('PATCH /inquiries/:id', verifyFirebaseToken, apiRateLimiter, updateInquiry));
router.delete('/:id', performanceProfiler('DELETE /inquiries/:id', verifyFirebaseToken, apiRateLimiter, deleteInquiry));

module.exports = router;
