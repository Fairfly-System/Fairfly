const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  recordDownload
} = require('../controllers/resourceController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// All resource endpoints require authentication
router.use(verifyFirebaseToken);

// Accessible by Admins and Operators
router.get('/', performanceProfiler('GET /resources', requireRole(['admin', 'operator']), apiRateLimiter, getResources));
router.get('/:id', performanceProfiler('GET /resources/:id', requireRole(['admin', 'operator']), apiRateLimiter, getResourceById));
router.post('/:id/download', performanceProfiler('POST /resources/:id/download', requireRole(['admin', 'operator']), apiRateLimiter, recordDownload));

// Admin only mutations
router.post('/', requireRole(['admin']), performanceProfiler('POST /resources', apiRateLimiter, createResource));
router.patch('/:id', requireRole(['admin']), performanceProfiler('PATCH /resources/:id', apiRateLimiter, updateResource));
router.delete('/:id', requireRole(['admin']), performanceProfiler('DELETE /resources/:id', apiRateLimiter, deleteResource));

module.exports = router;
