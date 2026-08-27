const express = require('express');
const router = express.Router();
const { requestClientPasswordReset, registerClient } = require('../controllers/authController');
const { publicRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');
const { performanceProfiler } = require('../middleware/performanceProfiler');

// Public route for client registration (rate-limited, protected fields)
router.post(
  '/register',
  performanceProfiler(
    'POST /auth/register',
    publicRateLimiter,
    allowedFields(['fullName', 'email', 'phone', 'password', 'confirmPassword']),
    registerClient
  )
);

// Public route for requesting client password reset (rate-limited) with aliases
router.post('/client-forgot-password', performanceProfiler('POST /auth/client-forgot-password', publicRateLimiter, requestClientPasswordReset));
router.post('/forgot-password', performanceProfiler('POST /auth/forgot-password', publicRateLimiter, requestClientPasswordReset));
router.post('/reset-password', performanceProfiler('POST /auth/reset-password', publicRateLimiter, requestClientPasswordReset));

module.exports = router;

