const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  scheduleFranchiseAppointment
} = require('../controllers/appointmentController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

const { allowedFields } = require('../middleware/allowedFields');

const SCHEDULE_FRANCHISE_ALLOWED_FIELDS = [
  'franchiseApplicationId',
  'appointmentDate',
  'preferredDate',
  'startTime',
  'endTime',
  'notes',
  'location',
  'scheduledAt'
];

const APPOINTMENT_ALLOWED_FIELDS = [
  'clientUid',
  'clientName',
  'clientEmail',
  'clientPhone',
  'preferredBranchLocation',
  'branchUid',
  'branchName',
  'preferredDate',
  'preferredTime',
  'scheduledAt',
  'serviceType',
  'purpose',
  'status'
];

router.post(
  '/',
  publicRateLimiter,
  (req, res, next) => {
    if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
    next();
  },
  allowedFields(APPOINTMENT_ALLOWED_FIELDS),
  createAppointment
);

// Admin-only: Schedule franchise consultation appointment with collision detection
router.post(
  '/schedule-franchise',
  performanceProfiler(
    'POST /appointments/schedule-franchise',
    verifyFirebaseToken,
    requireRole('admin'),
    allowedFields(SCHEDULE_FRANCHISE_ALLOWED_FIELDS),
    apiRateLimiter,
    scheduleFranchiseAppointment
  )
);

router.get('/', performanceProfiler('GET /appointments', verifyFirebaseToken, apiRateLimiter, getAppointments));
router.get('/:id', performanceProfiler('GET /appointments/:id', verifyFirebaseToken, apiRateLimiter, getAppointmentById));
router.patch('/:id/status', performanceProfiler('PATCH /appointments/:id/status', verifyFirebaseToken, allowedFields(['status']), apiRateLimiter, updateAppointmentStatus));

module.exports = router;
