const express = require('express');
const router = express.Router();
const { 
  createAppointment, 
  getAppointments, 
  updateAppointmentStatus 
} = require('../controllers/appointmentController');
const { performanceProfiler } = require('../middleware/performanceProfiler');
const { verifyFirebaseToken } = require('../middleware/auth');
const { publicRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');

router.post('/', publicRateLimiter, (req, res, next) => {
  if (req.headers.authorization) return verifyFirebaseToken(req, res, next);
  next();
}, createAppointment);

router.get('/', performanceProfiler('GET /appointments', verifyFirebaseToken, apiRateLimiter, getAppointments));
router.patch('/:id/status', performanceProfiler('PATCH /appointments/:id/status', verifyFirebaseToken, apiRateLimiter, updateAppointmentStatus));

module.exports = router;
