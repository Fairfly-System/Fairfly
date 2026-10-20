const express = require('express');
const router = express.Router();
const { 
  requestClientPasswordReset, 
  requestOperatorPasswordReset,
  registerClient,
  initiateRegistration,
  verifyRegistrationCode,
  resendRegistrationCode,
  reuploadId,
  checkAccountStatusForLogin,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');
const { verifyFirebaseToken } = require('../middleware/auth');
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

// Public route for requesting Operator password reset (rate-limited, protected fields, Super Admin review queue)
router.post(
  '/operator-forgot-password',
  performanceProfiler('POST /auth/operator-forgot-password', publicRateLimiter, allowedFields(['email', 'branchName', 'reason']), requestOperatorPasswordReset)
);
router.post(
  '/operator-reset-request',
  performanceProfiler('POST /auth/operator-reset-request', publicRateLimiter, allowedFields(['email', 'branchName', 'reason']), requestOperatorPasswordReset)
);

// Public route for checking account status before completing login (rate-limited, protected fields)
router.post(
  '/login-check',
  performanceProfiler(
    'POST /auth/login-check',
    publicRateLimiter,
    allowedFields(['email']),
    checkAccountStatusForLogin
  )
);

// Authenticated user profile routes (JWT identity verified, rate-limited)
router.get(
  '/profile',
  performanceProfiler('GET /auth/profile', verifyFirebaseToken, apiRateLimiter, getProfile)
);

const PROFILE_ALLOWED_FIELDS = ['fullName', 'name', 'branchName', 'phone', 'contactNumber', 'address'];

router.patch(
  '/profile',
  performanceProfiler(
    'PATCH /auth/profile',
    verifyFirebaseToken,
    apiRateLimiter,
    allowedFields(PROFILE_ALLOWED_FIELDS),
    updateProfile
  )
);

// Dedicated Change Password route (fresh reauthentication verified, rate-limited)
router.post(
  '/change-password',
  performanceProfiler(
    'POST /auth/change-password',
    verifyFirebaseToken,
    apiRateLimiter,
    allowedFields(['newPassword', 'confirmPassword']),
    changePassword
  )
);

module.exports = router;

