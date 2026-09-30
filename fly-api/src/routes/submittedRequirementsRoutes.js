const express = require('express');
const router = express.Router();
const {
  getSubmittedRequirementsById,
  updateSubmittedRequirements,
  createSubmittedRequirements
} = require('../controllers/submittedRequirementsController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

const SUBMITTED_REQUIREMENTS_ALLOWED_FIELDS = [
  'submittedBy',
  'requirements',
  'createdAt',
  'updatedAt'
];

router.post(
  '/',
  performanceProfiler(
    'POST /submitted-requirements',
    (req, res, next) => {
      if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
      next();
    },
    allowedFields(SUBMITTED_REQUIREMENTS_ALLOWED_FIELDS),
    apiRateLimiter,
    createSubmittedRequirements
  )
);

router.get(
  '/:id',
  performanceProfiler(
    'GET /submitted-requirements/:id',
    verifyFirebaseToken,
    apiRateLimiter,
    getSubmittedRequirementsById
  )
);

router.patch(
  '/:id',
  performanceProfiler(
    'PATCH /submitted-requirements/:id',
    verifyFirebaseToken,
    allowedFields(SUBMITTED_REQUIREMENTS_ALLOWED_FIELDS),
    apiRateLimiter,
    updateSubmittedRequirements
  )
);

module.exports = router;
