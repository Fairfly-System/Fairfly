const express = require('express');
const router = express.Router();
const { 
  getActiveServices, 
  createActiveService, 
  updateStepStatus,
  cancelActiveService 
} = require('../controllers/activeServiceController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createActiveService);

router.get('/', performanceProfiler('GET /services/active', verifyFirebaseToken, apiRateLimiter, getActiveServices));
router.patch('/:id/step', performanceProfiler('PATCH /services/active/:id/step', verifyFirebaseToken, apiRateLimiter, updateStepStatus));
router.patch('/:id/cancel', performanceProfiler('PATCH /services/active/:id/cancel', verifyFirebaseToken, apiRateLimiter, cancelActiveService));

module.exports = router;
