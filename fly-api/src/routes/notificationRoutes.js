const express = require('express');
const router = express.Router();
const { performanceProfiler } = require('../middleware/performanceProfiler');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// All notification endpoints require authentication
router.use(verifyFirebaseToken);

router.get('/', performanceProfiler('GET /notifications', apiRateLimiter, getNotifications));
router.post('/mark-all-read', performanceProfiler('POST /notifications/mark-all-read', apiRateLimiter, markAllAsRead));
router.patch('/:id/read', performanceProfiler('PATCH /notifications/:id/read', apiRateLimiter, markAsRead));
router.delete('/:id', performanceProfiler('DELETE /notifications/:id', apiRateLimiter, deleteNotification));

module.exports = router;
