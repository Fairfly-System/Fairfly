const express = require('express');
const router = express.Router();
const { 
  getPasswordResetRequests,
  getPasswordResetRequestById,
  approvePasswordResetRequest,
  rejectPasswordResetRequest
} = require('../controllers/passwordResetController');
const { verifyFirebaseToken, requireSuperAdmin } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');
const { performanceProfiler } = require('../middleware/performanceProfiler');

// All routes in this router require authentication and Super Administrator authority
router.use(verifyFirebaseToken);
router.use(requireSuperAdmin);

// List all password reset requests (supports ?status=PENDING)
router.get(
  '/',
  performanceProfiler('GET /admin/password-resets', apiRateLimiter, getPasswordResetRequests)
);

// Get single request details by ID
router.get(
  '/:id',
  performanceProfiler('GET /admin/password-resets/:id', apiRateLimiter, getPasswordResetRequestById)
);

// Approve password reset request (generates Firebase Auth reset link & sends transactional email)
router.post(
  '/:id/approve',
  performanceProfiler('POST /admin/password-resets/:id/approve', apiRateLimiter, approvePasswordResetRequest)
);

// Reject password reset request with optional reason
router.post(
  '/:id/reject',
  performanceProfiler('POST /admin/password-resets/:id/reject', allowedFields(['reason']), apiRateLimiter, rejectPasswordResetRequest)
);

module.exports = router;
