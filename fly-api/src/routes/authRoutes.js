const express = require('express');
const router = express.Router();
const { requestClientPasswordReset } = require('../controllers/authController');
const { publicRateLimiter } = require('../middleware/rateLimiter');

// Public route for requesting client password reset (rate-limited) with aliases
router.post('/client-forgot-password', publicRateLimiter, requestClientPasswordReset);
router.post('/forgot-password', publicRateLimiter, requestClientPasswordReset);
router.post('/reset-password', publicRateLimiter, requestClientPasswordReset);

module.exports = router;
