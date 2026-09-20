const express = require('express');
const router = express.Router();
const { 
  requestClientPasswordReset, 
  registerClient,
  initiateRegistration,
  verifyRegistrationCode,
  resendRegistrationCode
} = require('../controllers/authController');
const { publicRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');
const { performanceProfiler } = require('../middleware/performanceProfiler');

// Public route for client registration initiation (rate-limited, protected fields)
router.post(
  '/register',
  performanceProfiler(
    'POST /auth/register',
    publicRateLimiter,
    allowedFields(['fullName', 'email', 'phone', 'password', 'confirmPassword']),
    initiateRegistration
  )
);

router.post(
  '/register-initiate',
  performanceProfiler(
    'POST /auth/register-initiate',
    publicRateLimiter,
    allowedFields(['fullName', 'email', 'phone', 'password', 'confirmPassword']),
    initiateRegistration
  )
);

// Public route for verifying 6-character registration code (rate-limited, protected fields)
router.post(
  '/register-verify',
  performanceProfiler(
    'POST /auth/register-verify',
    publicRateLimiter,
    allowedFields(['email', 'code']),
    verifyRegistrationCode
  )
);

// Public route for resending 6-character registration code (rate-limited, protected fields)
router.post(
  '/register-resend',
  performanceProfiler(
    'POST /auth/register-resend',
    publicRateLimiter,
    allowedFields(['email']),
    resendRegistrationCode
  )
);

// Public route for requesting client password reset (rate-limited) with aliases
router.post('/client-forgot-password', performanceProfiler('POST /auth/client-forgot-password', publicRateLimiter, requestClientPasswordReset));
router.post('/forgot-password', performanceProfiler('POST /auth/forgot-password', publicRateLimiter, requestClientPasswordReset));
router.post('/reset-password', performanceProfiler('POST /auth/reset-password', publicRateLimiter, requestClientPasswordReset));

module.exports = router;

