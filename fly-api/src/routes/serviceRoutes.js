const express = require('express');
const router = express.Router();
const { 
  createService, 
  updateService, 
  deleteService,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink
} = require('../controllers/serviceController');
const { allowedFields } = require('../middleware/allowedFields');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// Services Routes
router.post('/', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(['name', 'price', 'processingTime']), createService);
router.patch('/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(['name', 'price', 'processingTime']), updateService);
router.delete('/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteService);

// Quick Links Routes
router.get('/quicklinks', apiRateLimiter, getQuickLinks);
router.post('/quicklinks', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createQuickLink);
router.patch('/quicklinks/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateQuickLink);
router.delete('/quicklinks/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteQuickLink);

module.exports = router;
