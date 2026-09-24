const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const {
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  approveClient,
  rejectClient,
  bulkStatusClients,
  bulkDeleteClients
} = require('../controllers/clientController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

// List all clients & view single client — any Admin can access
router.get(
  '/',
  performanceProfiler('GET /clients', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getClients)
);

// Bulk operations (Must be defined before /:id)
router.patch(
  '/bulk-status',
  performanceProfiler('PATCH /clients/bulk-status', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkStatusClients)
);

router.post(
  '/bulk-delete',
  performanceProfiler('POST /clients/bulk-delete', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkDeleteClients)
);

router.get(
  '/:id',
  performanceProfiler('GET /clients/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getClientById)
);

// Approve client account & valid ID — Admin only
router.post(
  '/:id/approve',
  performanceProfiler('POST /clients/:id/approve', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, approveClient)
);

// Reject client account ID with reason & trigger re-upload email link — Admin only
router.post(
  '/:id/reject',
  performanceProfiler('POST /clients/:id/reject', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, rejectClient)
);

// Update client profile — Non-sensitive fields only
router.patch(
  '/:id',
  performanceProfiler(
    'PATCH /clients/:id',
    verifyFirebaseToken,
    requireRole('admin'),
    allowedFields(['fullName', 'phone', 'status', 'address']),
    apiRateLimiter,
    updateClient
  )
);

// Delete client account — Admin only
router.delete(
  '/:id',
  performanceProfiler('DELETE /clients/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteClient)
);

module.exports = router;

