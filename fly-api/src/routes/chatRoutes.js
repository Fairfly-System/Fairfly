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
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { allowedFields } = require('../middleware/allowedFields');

const ANNOUNCEMENT_ALLOWED_FIELDS = ['title', 'content', 'priority', 'photos'];
const MESSAGE_ALLOWED_FIELDS = ['content', 'messageType', 'fileMetadata'];

// All chat endpoints require authentication
router.use(verifyFirebaseToken);

// Contact directory & conversations
router.get('/contacts', apiRateLimiter, getContacts);
router.get('/conversations', apiRateLimiter, getUserConversations);
router.post('/conversations', apiRateLimiter, allowedFields(['participantId', 'recipientId', 'targetUserId', 'recipientUid', 'otherUserId']), getOrCreateConversation);
router.post('/conversations/:id/messages', allowedFields(MESSAGE_ALLOWED_FIELDS), apiRateLimiter, postMessage);
router.patch('/conversations/:id/read', apiRateLimiter, markConversationRead);

// Announcements (Viewable by authenticated users, manageable by Admin only)
router.get('/announcements', apiRateLimiter, getAnnouncements);
router.post('/announcements', requireRole('admin'), allowedFields(ANNOUNCEMENT_ALLOWED_FIELDS), apiRateLimiter, postAnnouncement);
router.patch('/announcements/:id', requireRole('admin'), allowedFields(ANNOUNCEMENT_ALLOWED_FIELDS), apiRateLimiter, updateAnnouncement);
router.delete('/announcements/:id', requireRole('admin'), apiRateLimiter, deleteAnnouncement);

// Legacy routes
router.post('/', apiRateLimiter, getOrCreateConversation);

module.exports = router;
