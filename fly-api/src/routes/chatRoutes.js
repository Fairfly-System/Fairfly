const express = require('express');
const router = express.Router();
const {
  getContacts,
  getOrCreateConversation,
  getUserConversations,
  postMessage,
  markConversationRead,
  getAnnouncements,
  postAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/chatController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// All chat endpoints require authentication
router.use(verifyFirebaseToken);

// Contact directory & conversations
router.get('/contacts', apiRateLimiter, getContacts);
router.get('/conversations', apiRateLimiter, getUserConversations);
router.post('/conversations', apiRateLimiter, getOrCreateConversation);
router.post('/conversations/:id/messages', apiRateLimiter, postMessage);
router.patch('/conversations/:id/read', apiRateLimiter, markConversationRead);

// Announcements
router.get('/announcements', apiRateLimiter, getAnnouncements);
router.post('/announcements', apiRateLimiter, postAnnouncement);
router.patch('/announcements/:id', apiRateLimiter, updateAnnouncement);
router.delete('/announcements/:id', apiRateLimiter, deleteAnnouncement);

// Legacy routes
router.post('/', apiRateLimiter, getOrCreateConversation);

module.exports = router;
