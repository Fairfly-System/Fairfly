const express = require('express');
const router = express.Router();
const { 
  createQuotation, 
  getQuotations, 
  updateQuotationStatus, 
  deleteQuotation,
  updateQuotation
} = require('../controllers/quotationController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createQuotation);

router.get('/', performanceProfiler('GET /quotations', verifyFirebaseToken, apiRateLimiter, getQuotations));
router.patch('/:id/status', performanceProfiler('PATCH /quotations/:id/status', verifyFirebaseToken, apiRateLimiter, updateQuotationStatus));
router.patch('/:id', performanceProfiler('PATCH /quotations/:id', verifyFirebaseToken, apiRateLimiter, updateQuotation));
router.delete('/:id', performanceProfiler('DELETE /quotations/:id', verifyFirebaseToken, apiRateLimiter, deleteQuotation));

module.exports = router;
