const express = require('express');
const router = express.Router();
const { 
  createInquiry, 
  getInquiries, 
  getInquiryById,
  updateInquiry, 
  deleteInquiry,
  confirmInquiry,
  getInquirySchema,
  saveInquirySchema
} = require('../controllers/inquiryController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

// Dynamic Form Schema routes
router.get('/schema', performanceProfiler('GET /inquiries/schema', publicRateLimiter, getInquirySchema));
router.put('/schema', performanceProfiler('PUT /inquiries/schema', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, saveInquirySchema));

// Inquiries CRUD & Confirmation routes
router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createInquiry);

router.get('/', performanceProfiler('GET /inquiries', verifyFirebaseToken, apiRateLimiter, getInquiries));
router.get('/:id', performanceProfiler('GET /inquiries/:id', verifyFirebaseToken, apiRateLimiter, getInquiryById));
router.patch('/:id', performanceProfiler('PATCH /inquiries/:id', verifyFirebaseToken, apiRateLimiter, updateInquiry));
router.delete('/:id', performanceProfiler('DELETE /inquiries/:id', verifyFirebaseToken, apiRateLimiter, deleteInquiry));

// Confirm Inquiry -> creates Quotation and initializes Active Service
router.post('/:id/confirm', performanceProfiler('POST /inquiries/:id/confirm', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, confirmInquiry));

module.exports = router;
