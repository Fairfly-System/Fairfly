const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { 
  getBranches,
  createOperator, 
  updateOperator, 
  deleteOperator,
  bulkStatusOperators,
  bulkDeleteOperators
} = require('../controllers/operatorController');
const { verifyFirebaseToken, requireRole, requireSuperAdmin } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

router.get('/branches', performanceProfiler('GET /operators/branches', apiRateLimiter, getBranches));
router.post('/', performanceProfiler('POST /operators', verifyFirebaseToken, requireSuperAdmin, allowedFields(['branchName', 'email', 'password', 'address', 'contactNumber']), apiRateLimiter, createOperator));
router.post('/bulk-status', performanceProfiler('POST /operators/bulk-status', verifyFirebaseToken, requireSuperAdmin, apiRateLimiter, bulkStatusOperators));
router.post('/bulk-delete', performanceProfiler('POST /operators/bulk-delete', verifyFirebaseToken, requireSuperAdmin, apiRateLimiter, bulkDeleteOperators));
router.patch('/:id', performanceProfiler('PATCH /operators/:id', verifyFirebaseToken, requireSuperAdmin, apiRateLimiter, updateOperator));
router.delete('/:id', performanceProfiler('DELETE /operators/:id', verifyFirebaseToken, requireSuperAdmin, apiRateLimiter, deleteOperator));

module.exports = router;

