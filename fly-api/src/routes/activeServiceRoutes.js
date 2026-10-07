const express = require('express');
const router = express.Router();
const { 
  getActiveServices, 
  createActiveService, 
  updateStepStatus,
  cancelActiveService 
} = require('../controllers/activeServiceController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

const { allowedFields } = require('../middleware/allowedFields');

const ACTIVE_SERVICE_ALLOWED_FIELDS = [
  'clientUid',
  'clientName',
  'clientEmail',
  'clientPhone',
  'serviceId',
  'serviceType',
  'priority',
  'workflowIds',
  'branchUid',
  'operatorId',
  'branchName',
  'additionalNotes',
  'operatorRemarks',
  'clientRemarks',
  'submittedRequirements',
  'submittedRequirementsId',
  'source',
  'status'
];

router.post(
  '/',
  publicRateLimiter,
  (req, res, next) => {
    if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
    next();
  },
  allowedFields(ACTIVE_SERVICE_ALLOWED_FIELDS),
  createActiveService
);

router.get('/', performanceProfiler('GET /services/active', verifyFirebaseToken, apiRateLimiter, getActiveServices));
router.patch('/:id/step', performanceProfiler('PATCH /services/active/:id/step', verifyFirebaseToken, requireRole(['admin', 'operator', 'branch_operator']), allowedFields(['stepIndex', 'newStatus']), apiRateLimiter, updateStepStatus));
router.patch('/:id/cancel', performanceProfiler('PATCH /services/active/:id/cancel', verifyFirebaseToken, allowedFields(['reason']), apiRateLimiter, cancelActiveService));

module.exports = router;
