const express = require('express');
const router = express.Router();
const { 
  submitApplication, 
  getApplications, 
  getApplicationById, 
  updateApplicationStatus 
} = require('../controllers/franchiseController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

// Public route to submit an application (with optional token identification)
router.post('/applications', publicRateLimiter, (req, res, next) => {
  // If authorization header is provided, run verifyFirebaseToken middleware.
  // Otherwise, allow anonymous submission (the controller handles it).
  if (req.headers.authorization) {
    return verifyFirebaseToken(req, res, next);
  }
  next();
}, submitApplication);

// Admin-only route to list all applications
router.get('/applications', performanceProfiler('GET /franchise/applications', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getApplications));

// Authenticated route to view a specific application (auth check is inside controller)
router.get('/applications/:id', performanceProfiler('GET /franchise/applications/:id', verifyFirebaseToken, apiRateLimiter, getApplicationById));

// Admin-only route to update application status
router.patch('/applications/:id/status', performanceProfiler('PATCH /franchise/applications/:id/status', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateApplicationStatus));

module.exports = router;
