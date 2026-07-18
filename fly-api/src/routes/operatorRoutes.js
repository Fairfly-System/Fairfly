const express = require('express');
const router = express.Router();
const { 
  getOperators, 
  createOperator, 
  updateOperator, 
  deleteOperator 
} = require('../controllers/operatorController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

router.post('/', verifyFirebaseToken, requireRole('admin'), allowedFields(['branchName', 'email', 'password', 'address', 'contactNumber']), apiRateLimiter, createOperator);
router.patch('/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateOperator);
router.delete('/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteOperator);

module.exports = router;
