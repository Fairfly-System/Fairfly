const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const {
  submitQualificationApplication,
  getQualificationApplications,
  getQualificationApplicationById,
  reviewQualificationApplication
} = require('../controllers/qualificationController');
const { verifyFirebaseToken, requireRole, requireSuperAdmin } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

// Operator routes
router.post(
  '/',
  performanceProfiler(
    'POST /qualifications',
    verifyFirebaseToken,
    requireRole('operator'),
    allowedFields(['reason', 'justification', 'experience', 'notes']),
    apiRateLimiter,
    submitQualificationApplication
  )
);

// Admin routes
router.get(
  '/',
  performanceProfiler(
    'GET /qualifications',
    verifyFirebaseToken,
    requireRole('admin'),
    apiRateLimiter,
    getQualificationApplications
  )
);

router.get(
  '/:id',
  performanceProfiler(
    'GET /qualifications/:id',
    verifyFirebaseToken,
    apiRateLimiter,
    getQualificationApplicationById
  )
);

// Super Admin approval route
router.patch(
  '/:id/review',
  performanceProfiler(
    'PATCH /qualifications/:id/review',
    verifyFirebaseToken,
    requireSuperAdmin,
    allowedFields(['status', 'adminNotes']),
    apiRateLimiter,
    reviewQualificationApplication
  )
);

module.exports = router;
