const express = require('express');
const router = express.Router();
const { 
  getTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  bulkDeleteTemplates,
  getInstances,
  getInstanceById,
  createInstance,
  transitionStep
} = require('../controllers/workflowController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// Workflow Templates (Readable by logged-in users, editable by Admin)
router.get('/templates', performanceProfiler('GET /workflow/templates', verifyFirebaseToken, apiRateLimiter, getTemplates));
router.get('/templates/:id', performanceProfiler('GET /workflow/templates/:id', verifyFirebaseToken, apiRateLimiter, getTemplateById));
router.post('/templates', performanceProfiler('POST /workflow/templates', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createTemplate));
router.post('/templates/bulk-delete', performanceProfiler('POST /workflow/templates/bulk-delete', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkDeleteTemplates));
router.patch('/templates/:id', performanceProfiler('PATCH /workflow/templates/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateTemplate));
router.delete('/templates/:id', performanceProfiler('DELETE /workflow/templates/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteTemplate));

// Direct /workflows aliases
router.get('/', performanceProfiler('GET /workflows', verifyFirebaseToken, apiRateLimiter, getTemplates));
router.post('/bulk-delete', performanceProfiler('POST /workflows/bulk-delete', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, bulkDeleteTemplates));
router.post('/', performanceProfiler('POST /workflows', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createTemplate));
router.get('/:id', performanceProfiler('GET /workflows/:id', verifyFirebaseToken, apiRateLimiter, getTemplateById));
router.patch('/:id', performanceProfiler('PATCH /workflows/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateTemplate));
router.put('/:id', performanceProfiler('PUT /workflows/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateTemplate));
router.delete('/:id', performanceProfiler('DELETE /workflows/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteTemplate));

// Workflow Instances (Readable by Admin/Operator/Client, mutable by Admin/Operator)
router.get('/instances', performanceProfiler('GET /workflow/instances', verifyFirebaseToken, apiRateLimiter, getInstances));
router.get('/instances/:id', performanceProfiler('GET /workflow/instances/:id', verifyFirebaseToken, apiRateLimiter, getInstanceById));
router.post('/instances', performanceProfiler('POST /workflow/instances', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, createInstance));
router.post('/instances/:id/transition', performanceProfiler('POST /workflow/instances/:id/transition', verifyFirebaseToken, requireRole(['admin', 'operator']), apiRateLimiter, transitionStep));

module.exports = router;
