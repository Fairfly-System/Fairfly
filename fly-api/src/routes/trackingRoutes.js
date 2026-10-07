const express = require('express');
const router = express.Router();
const { getPublicTrackingStatus } = require('../controllers/trackingController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { trackerRateLimiter } = require('../middleware/rateLimiter');

// Public tracking lookup route (Supports Quotation ID/Number, Inquiry ID/Control Number, Active Service ID)
router.get(
  '/public/:trackingId',
  performanceProfiler('GET /tracking/public/:trackingId', trackerRateLimiter, getPublicTrackingStatus)
);

module.exports = router;
