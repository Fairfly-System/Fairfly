const express = require('express');
const router = express.Router();
const { 
  requestClientPasswordReset, 
  registerClient,
  initiateRegistration,
  verifyRegistrationCode,
  resendRegistrationCode,
  reuploadId
} = require('../controllers/authController');
const { publicRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');
const { performanceProfiler } = require('../middleware/performanceProfiler');

const REGISTER_ALLOWED_FIELDS = [
  'fullName',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'idType',
  'idFrontUrl',
  'idBackUrl',
  'idFrontName',
  'idBackName'
];

// Public route for client registration initiation (rate-limited, protected fields)
router.post(
  '/register',
  performanceProfiler(
    'POST /auth/register',
    publicRateLimiter,
    allowedFields(REGISTER_ALLOWED_FIELDS),
    initiateRegistration
  )
);

router.post(
  '/register-initiate',
  performanceProfiler(
    'POST /auth/register-initiate',
    publicRateLimiter,
    allowedFields(REGISTER_ALLOWED_FIELDS),
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

// Public route for re-uploading ID document for rejected client (token-protected)
router.post(
  '/reupload-id',
  performanceProfiler(
    'POST /auth/reupload-id',
    publicRateLimiter,
    allowedFields(['email', 'token', 'idType', 'idFrontUrl', 'idBackUrl', 'idFrontName', 'idBackName']),
    reuploadId
  )
);

// Public route for requesting client password reset (rate-limited, protected fields) with aliases
router.post(
  '/client-forgot-password',
  performanceProfiler('POST /auth/client-forgot-password', publicRateLimiter, allowedFields(['email']), requestClientPasswordReset)
);
router.post(
  '/forgot-password',
  performanceProfiler('POST /auth/forgot-password', publicRateLimiter, allowedFields(['email']), requestClientPasswordReset)
);
router.post(
  '/reset-password',
  performanceProfiler('POST /auth/reset-password', publicRateLimiter, allowedFields(['email']), requestClientPasswordReset)
);

module.exports = router;

