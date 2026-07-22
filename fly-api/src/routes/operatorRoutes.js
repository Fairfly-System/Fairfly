const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { 
  getOperators, 
  createOperator, 
  updateOperator, 
  deleteOperator 
} = require('../controllers/operatorController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

router.post('/', performanceProfiler('POST /operators', verifyFirebaseToken, requireRole('admin'), allowedFields(['branchName', 'email', 'password', 'address', 'contactNumber']), apiRateLimiter, createOperator));
router.patch('/:id', performanceProfiler('PATCH /operators/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateOperator));
router.delete('/:id', performanceProfiler('DELETE /operators/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteOperator));

module.exports = router;
