const express = require('express');
const router = express.Router();
const { getAdminAnalytics } = require('../controllers/adminAnalyticsController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

router.get('/', performanceProfiler(
  'GET /admin/analytics',
  verifyFirebaseToken,
  requireRole('admin'),
  apiRateLimiter,
  getAdminAnalytics
));

module.exports = router;