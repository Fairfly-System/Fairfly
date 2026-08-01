const express = require('express');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const router = express.Router();
const { 
  createService, 
  updateService, 
  deleteService,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
} = require('../controllers/serviceController');
const { allowedFields } = require('../middleware/allowedFields');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const SERVICE_ALLOWED_FIELDS = [
  'id',
  'name',
  'price',
  'processingTime',
  'requirements',
  'workflowIds',
  'actions',
  'status'
];

// Services Routes
router.post('/', performanceProfiler('POST /services', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(SERVICE_ALLOWED_FIELDS), createService));
router.put('/:id', performanceProfiler('PUT /services/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(SERVICE_ALLOWED_FIELDS), updateService));
router.patch('/:id', performanceProfiler('PATCH /services/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(SERVICE_ALLOWED_FIELDS), updateService));
router.delete('/:id', performanceProfiler('DELETE /services/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteService));

// Quick Links Routes
router.get('/quicklinks', performanceProfiler('GET /services/quicklinks', apiRateLimiter, getQuickLinks));
router.post('/quicklinks', performanceProfiler('POST /services/quicklinks', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createQuickLink));
router.patch('/quicklinks/:id', performanceProfiler('PATCH /services/quicklinks/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateQuickLink));
router.delete('/quicklinks/:id', performanceProfiler('DELETE /services/quicklinks/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteQuickLink));

module.exports = router;
