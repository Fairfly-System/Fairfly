const express = require('express');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const router = express.Router();
const { 
  createService, 
  updateService, 
  deleteService,
  bulkStatusServices,
  bulkDeleteServices,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  bulkDeleteQuickLinks,
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

const activeServiceRoutes = require('./activeServiceRoutes');

// Active Services Routes
router.use('/active', activeServiceRoutes);

// Services Routes
router.post('/', performanceProfiler('POST /services', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(SERVICE_ALLOWED_FIELDS), createService));
router.post('/bulk-status', performanceProfiler('POST /services/bulk-status', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkStatusServices));
router.post('/bulk-delete', performanceProfiler('POST /services/bulk-delete', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkDeleteServices));
router.put('/:id', performanceProfiler('PUT /services/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(SERVICE_ALLOWED_FIELDS), updateService));
router.patch('/:id', performanceProfiler('PATCH /services/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, allowedFields(SERVICE_ALLOWED_FIELDS), updateService));
router.delete('/:id', performanceProfiler('DELETE /services/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteService));

// Quick Links Routes
router.get('/quicklinks', performanceProfiler('GET /services/quicklinks', apiRateLimiter, getQuickLinks));
router.post('/quicklinks', performanceProfiler('POST /services/quicklinks', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createQuickLink));
router.post('/quicklinks/bulk-delete', performanceProfiler('POST /services/quicklinks/bulk-delete', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkDeleteQuickLinks));
router.patch('/quicklinks/:id', performanceProfiler('PATCH /services/quicklinks/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateQuickLink));
router.delete('/quicklinks/:id', performanceProfiler('DELETE /services/quicklinks/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteQuickLink));

module.exports = router;
