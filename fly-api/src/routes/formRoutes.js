const express = require('express');
const router = express.Router();
const {
  listForms,
  getForm,
  resolveForm,
  getAssignments,
  createForm,
  updateForm,
  deleteForm,
  saveAssignments
} = require('../controllers/formController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { performanceProfiler } = require('../middleware/performanceProfiler');

router.get('/', performanceProfiler('GET /forms', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, listForms));
router.get('/assignments', performanceProfiler('GET /forms/assignments', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getAssignments));
router.get('/resolve/:actionKey', performanceProfiler('GET /forms/resolve/:actionKey', apiRateLimiter, resolveForm));
router.get('/:id', performanceProfiler('GET /forms/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, getForm));

router.post('/', performanceProfiler('POST /forms', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, createForm));
router.put('/assignments', performanceProfiler('PUT /forms/assignments', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, saveAssignments));
router.patch('/:id', performanceProfiler('PATCH /forms/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, updateForm));
router.delete('/:id', performanceProfiler('DELETE /forms/:id', verifyFirebaseToken, requireRole('admin'), apiRateLimiter, deleteForm));

module.exports = router;