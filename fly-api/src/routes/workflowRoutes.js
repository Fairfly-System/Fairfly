const express = require('express');
const router = express.Router();
const { 
  getTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  getInstances,
  getInstanceById,
  createInstance,
  transitionStep
} = require('../controllers/workflowController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// Workflow Templates (Readable by logged-in users, editable by Admin)
router.get('/templates', verifyFirebaseToken, apiRateLimiter, getTemplates);
router.get('/templates/:id', verifyFirebaseToken, apiRateLimiter, getTemplateById);
router.post('/templates', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createTemplate);
router.patch('/templates/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateTemplate);
router.delete('/templates/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteTemplate);

// Workflow Instances (Readable by Admin/Operator/Client, mutable by Admin/Operator)
router.get('/instances', verifyFirebaseToken, apiRateLimiter, getInstances);
router.get('/instances/:id', verifyFirebaseToken, apiRateLimiter, getInstanceById);
router.post('/instances', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, createInstance);
router.post('/instances/:id/transition', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, transitionStep);

module.exports = router;
