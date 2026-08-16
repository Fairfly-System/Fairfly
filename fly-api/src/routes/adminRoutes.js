const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
} = require('../controllers/adminController');
const { verifyFirebaseToken, requireSuperAdmin, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

// List admins & view admin profile — any admin can view list/details, mutations require Super Admin
router.get('/', performanceProfiler('GET /admins', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getAdmins));
router.get('/:id', performanceProfiler('GET /admins/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getAdminById));

// Create, Update, Delete admins — Super Admin ONLY
router.post(
  '/',
  performanceProfiler(
    'POST /admins',
    verifyFirebaseToken,
    requireSuperAdmin,
    allowedFields(['email', 'password', 'username', 'fullName', 'phone', 'assignedOperators']),
    apiRateLimiter,
    createAdmin
  )
);
router.patch(
  '/:id',
  performanceProfiler(
    'PATCH /admins/:id',
    verifyFirebaseToken,
    requireSuperAdmin,
    allowedFields(['fullName', 'username', 'name', 'phone', 'status', 'assignedOperators']),
    apiRateLimiter,
    updateAdmin
  )
);
router.delete('/:id', performanceProfiler('DELETE /admins/:id', verifyFirebaseToken, requireSuperAdmin, apiRateLimiter, deleteAdmin));

module.exports = router;
