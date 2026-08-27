const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const {
  getClients,
  getClientById,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

// List all clients & view single client — any Admin can access
router.get(
  '/',
  performanceProfiler('GET /clients', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getClients)
);

router.get(
  '/:id',
  performanceProfiler('GET /clients/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getClientById)
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
