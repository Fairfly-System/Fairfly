const { db } = require('../config/firebase');
const { createNotification, notifyAllOperators } = require('../services/notificationService');
const { deleteRecordStorageFiles, extractStorageUrls, deleteFilesFromStorage } = require('../services/storageService');
const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');

const COLLECTIONS = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  ANNOUNCEMENTS: 'announcements'
};

/**
 * Helper to get user display name
 */
const getDisplayName = (userData, email) => {
  if (!userData) return email ? email.split('@')[0] : 'User';
  return userData.branchName || userData.name || userData.fullName || userData.username || (email ? email.split('@')[0] : 'User');
};

/**
 * GET /api/chats/contacts
 * Retrieve eligible contacts the logged-in user is permitted to chat with
 */
const getContacts = async (req, res) => {
  try {
    const currentUid = req.user.uid;
    const currentRole = req.userDetails?.role || 'client';

    let contacts = [];

    if (currentRole === 'client') {
      // Clients can only chat with Operators
      const opSnaps = await db.collection(COLLECTIONS.USERS)
        .where('role', '==', 'operator')
        .where('status', '==', 'Active')
        .get();

      contacts = opSnaps.docs
        .filter(doc => doc.id !== currentUid)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.branchName || data.name || data.fullName || 'Operator Branch',
            email: data.email,
            role: 'operator',
            branchName: data.branchName || null,
            status: data.status
          };
        });
    } else if (currentRole === 'operator') {
      // Operators can chat with Admins and Clients
      const adminSnaps = await db.collection(COLLECTIONS.USERS)
        .where('role', '==', 'admin')
        .where('status', '==', 'Active')
        .get();

      const adminContacts = adminSnaps.docs
        .filter(doc => doc.id !== currentUid)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.isSuperAdmin ? `${data.name || 'Admin'} (Super Admin)` : (data.name || 'Support Admin'),
            email: data.email,
            role: 'admin',
            isSuperAdmin: Boolean(data.isSuperAdmin),
            status: data.status
          };
        });

      // Also get clients who have existing conversations or active requests
      const clientSnaps = await db.collection(COLLECTIONS.USERS)
        .where('role', '==', 'client')
        .limit(30)
        .get();

      const clientContacts = clientSnaps.docs
        .filter(doc => doc.id !== currentUid)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.fullName || data.username || data.email?.split('@')[0],
            email: data.email,
            role: 'client',
            status: data.status || 'Active'
          };
        });

      contacts = [...adminContacts, ...clientContacts];
    } else if (currentRole === 'admin') {
      // Admins can chat with Admins and Operators (NOT clients)
      const usersSnaps = await db.collection(COLLECTIONS.USERS)
        .where('role', 'in', ['admin', 'operator'])
        .where('status', '==', 'Active')
        .get();

      contacts = usersSnaps.docs
        .filter(doc => doc.id !== currentUid)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.role === 'operator'
              ? (data.branchName || data.name || 'Operator Branch')
              : (data.isSuperAdmin ? `${data.name || 'Admin'} (Super Admin)` : (data.name || 'Admin')),
            email: data.email,
            role: data.role,
            branchName: data.branchName || null,
            isSuperAdmin: Boolean(data.isSuperAdmin),
            status: data.status
          };
        });
    }

    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
};

/**
 * POST /api/chats/conversations
 * Get or create a 1-to-1 conversation session
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const currentUid = req.user.uid;
    const currentRole = req.userDetails?.role || 'client';
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId is required' });
    }

    if (recipientId === currentUid) {
      return res.status(400).json({ error: 'Cannot create a chat conversation with yourself' });
    }

    // Fetch recipient details
    const recipientDoc = await db.collection(COLLECTIONS.USERS).doc(recipientId).get();
    if (!recipientDoc.exists) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    const recipientData = recipientDoc.data();
    const recipientRole = recipientData.role || 'client';

    // Channel validation rule:
    // Client <-> Admin is NOT allowed
    if (
      (currentRole === 'client' && recipientRole === 'admin') ||
      (currentRole === 'admin' && recipientRole === 'client')
    ) {
      return res.status(403).json({
        error: 'Direct messaging between Clients and Head Office Admins is not permitted. Please contact a Branch Operator.'
      });
    }

    // Check if conversation already exists between these 2 users (check array-contains for both users)
    const currentUidStr = String(currentUid).trim();
    const recipientIdStr = String(recipientId).trim();

    const existingSnaps = await db.collection(COLLECTIONS.CONVERSATIONS)
      .where('participants', 'array-contains', currentUidStr)
      .get();

    let existingConv = existingSnaps.docs.find(doc => {
      const data = doc.data();
      const parts = Array.isArray(data.participants) ? data.participants.map(p => String(p).trim()) : [];
      return parts.includes(recipientIdStr);
    });

    if (!existingConv) {
      const recipientSnaps = await db.collection(COLLECTIONS.CONVERSATIONS)
        .where('participants', 'array-contains', recipientIdStr)
        .get();

      existingConv = recipientSnaps.docs.find(doc => {
        const data = doc.data();
        const parts = Array.isArray(data.participants) ? data.participants.map(p => String(p).trim()) : [];
        return parts.includes(currentUidStr);
      });
    }

    if (existingConv) {
      return res.status(200).json({
        id: existingConv.id,
        ...existingConv.data(),
        isExisting: true
      });
    }

    // Create new conversation document
    const now = new Date().toISOString();
    const currentDisplayName = getDisplayName(req.userDetails, req.user.email);
    const recipientDisplayName = getDisplayName(recipientData, recipientData.email);

    const newConversationData = {
      type: 'direct',
      participants: [currentUid, recipientId],
      participantRoles: {
        [currentUid]: currentRole,
        [recipientId]: recipientRole
      },
      participantDetails: {
        [currentUid]: {
          uid: currentUid,
          name: currentDisplayName,
          email: req.user.email || '',
          role: currentRole,
          branchName: req.userDetails?.branchName || null
        },
        [recipientId]: {
          uid: recipientId,
          name: recipientDisplayName,
          email: recipientData.email || '',
          role: recipientRole,
          branchName: recipientData.branchName || null
        }
      },
      lastMessage: '',
      lastMessageAt: now,
      lastMessageSenderId: null,
      lastMessageSenderName: null,
      unreadCount: {
        [currentUid]: 0,
        [recipientId]: 0
      },
      createdAt: now,
      updatedAt: now
    };

    const convId = generatePrefixedId(ID_PREFIXES.CONVERSATION);
    const docRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(convId);
    await docRef.set(newConversationData);

    return res.status(201).json({
      id: docRef.id,
      ...newConversationData,
      isExisting: false
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
};

/**
 * GET /api/chats/conversations
 * Get all conversations for the authenticated user
 */
const getUserConversations = async (req, res) => {
  try {
    const currentUid = req.user.uid;
    const snaps = await db.collection(COLLECTIONS.CONVERSATIONS)
      .where('participants', 'array-contains', currentUid)
      .get();

    const list = snaps.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return res.status(200).json(list);
  } catch (error) {
    console.error('Error getting conversations:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
};

/**
 * POST /api/chats/conversations/:id/messages
 * Send a message within a conversation
 */
const postMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUid = req.user.uid;
    const currentRole = req.userDetails?.role || 'client';
    const { content, messageType = 'text', fileMetadata = null } = req.body;

    if (!id) return res.status(400).json({ error: 'Conversation ID is required' });
    if (!content && !fileMetadata) {
      return res.status(400).json({ error: 'Message content or attachment is required' });
    }

    const convRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(id);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const convData = convDoc.data();
    const participants = convData.participants || [];

    if (!participants.includes(currentUid)) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const recipientId = participants.find(uid => uid !== currentUid);
    const now = new Date().toISOString();
    const senderDisplayName = getDisplayName(req.userDetails, req.user.email);

    const messagePayload = {
      senderId: currentUid,
      senderName: senderDisplayName,
      senderRole: currentRole,
      content: content || (fileMetadata ? `Shared a file: ${fileMetadata.fileName}` : ''),
      messageType, // 'text' | 'file' | 'image'
      fileMetadata: fileMetadata || null,
      read: false,
      timestamp: now,
      createdAt: now
    };

    // Add to subcollection: conversations/{id}/messages
    const msgId = generatePrefixedId(ID_PREFIXES.MESSAGE);
    const msgRef = convRef.collection(COLLECTIONS.MESSAGES).doc(msgId);
    await msgRef.set(messagePayload);

    // Update parent conversation
    const currentUnread = convData.unreadCount || {};
    const newRecipientUnread = (currentUnread[recipientId] || 0) + 1;

    await convRef.update({
      updatedAt: now,
      lastMessage: messagePayload.content.substring(0, 120),
      lastMessageAt: now,
      lastMessageSenderId: currentUid,
      lastMessageSenderName: senderDisplayName,
      [`unreadCount.${recipientId}`]: newRecipientUnread
    });

    // In-app notification for the recipient
    if (recipientId) {
      const recipientRole = convData.participantRoles?.[recipientId] || 'client';
      createNotification({
        recipientUid: recipientId,
        recipientRole,
        title: `Message from ${senderDisplayName}`,
        message: messagePayload.content.substring(0, 80),
        type: 'message',
        link: `/${recipientRole}/messages`,
        metadata: { conversationId: id, senderId: currentUid }
      }).catch(err => console.warn('Message notification failed:', err));
    }

    return res.status(201).json({
      id: msgRef.id,
      ...messagePayload,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error posting message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * PATCH /api/chats/conversations/:id/read
 * Mark conversation as read for current user
 */
const markConversationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUid = req.user.uid;

    if (!id) return res.status(400).json({ error: 'Conversation ID is required' });

    const convRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(id);
    await convRef.update({
      [`unreadCount.${currentUid}`]: 0
    });

    return res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
};

/**
 * GET /api/chats/announcements
 * Retrieve head office announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const snaps = await db.collection(COLLECTIONS.ANNOUNCEMENTS)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const list = snaps.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json(list);
  } catch (error) {
    console.error('Error retrieving announcements:', error);
    return res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
};

/**
 * POST /api/chats/announcements
 * Broadcast a new announcement (Admin Only)
 */
const postAnnouncement = async (req, res) => {
  try {
    const currentRole = req.userDetails?.role;
    if (currentRole !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can post announcements' });
    }

    const { title, content, priority = 'Normal', photos = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: 'photos must be an array' });
    }
    if (photos.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 photos can be attached to an announcement' });
    }

    // Sanitize photos array
    const sanitizedPhotos = photos.map((p, idx) => {
      if (typeof p === 'string') {
        return { url: p, name: `Photo ${idx + 1}` };
      }
      return {
        url: p.url || '',
        name: p.name || p.fileName || `Photo ${idx + 1}`,
        size: Number(p.size || p.fileSize) || 0,
        type: p.type || 'image',
        storagePath: p.storagePath || null
      };
    }).filter(p => p.url);

    const now = new Date().toISOString();
    const authorName = getDisplayName(req.userDetails, req.user.email);

    const announcementData = {
      title: title.trim(),
      content: content.trim(),
      priority, // 'Normal' | 'Important' | 'Urgent'
      photos: sanitizedPhotos,
      authorUid: req.user.uid,
      authorName,
      createdAt: now,
      updatedAt: now
    };

    const annId = generatePrefixedId(ID_PREFIXES.ANNOUNCEMENT);
    const docRef = db.collection(COLLECTIONS.ANNOUNCEMENTS).doc(annId);
    await docRef.set(announcementData);

    // Broadcast in-app notification to all operators
    notifyAllOperators({
      title: `Announcement: ${announcementData.title}`,
      message: announcementData.content.substring(0, 100),
      type: 'system',
      link: '/operator/announcements',
      metadata: { announcementId: annId, priority }
    }).catch(err => console.warn('Announcement broadcast notification failed:', err));

    return res.status(201).json({
      id: annId,
      ...announcementData,
      message: 'Announcement broadcasted successfully'
    });
  } catch (error) {
    console.error('Error posting announcement:', error);
    return res.status(500).json({ error: 'Failed to post announcement' });
  }
};

/**
 * PATCH /api/chats/announcements/:id
 * Update an announcement with storage photo diffing (Admin Only)
 */
const updateAnnouncement = async (req, res) => {
  try {
    const currentRole = req.userDetails?.role;
    if (currentRole !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can edit announcements' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Announcement ID is required' });

    const docRef = db.collection(COLLECTIONS.ANNOUNCEMENTS).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const existing = { id: docSnap.id, ...docSnap.data() };
    const { title, content, priority, photos } = req.body;

    const sanitizedUpdates = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty' });
      sanitizedUpdates.title = title.trim();
    }
    if (content !== undefined) {
      if (!content.trim()) return res.status(400).json({ error: 'Content cannot be empty' });
      sanitizedUpdates.content = content.trim();
    }
    if (priority !== undefined) {
      sanitizedUpdates.priority = priority;
    }

    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return res.status(400).json({ error: 'photos must be an array' });
      }
      if (photos.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 photos can be attached to an announcement' });
      }

      sanitizedUpdates.photos = photos.map((p, idx) => {
        if (typeof p === 'string') {
          return { url: p, name: `Photo ${idx + 1}` };
        }
        return {
          url: p.url || '',
          name: p.name || p.fileName || `Photo ${idx + 1}`,
          size: Number(p.size || p.fileSize) || 0,
          type: p.type || 'image',
          storagePath: p.storagePath || null
        };
      }).filter(p => p.url);

      // Perform storage file diffing cleanup
      const existingStorageUrls = extractStorageUrls(existing);
      const updatedStorageUrls = extractStorageUrls(sanitizedUpdates);
      const removedStorageUrls = existingStorageUrls.filter((url) => !updatedStorageUrls.includes(url));

      if (removedStorageUrls.length > 0) {
        console.log(`[StorageDiff] Detected ${removedStorageUrls.length} removed photo(s) on announcement update (${id}). Cleaning up from Firebase Storage...`, removedStorageUrls);
        await deleteFilesFromStorage(removedStorageUrls);
      }
    }

    await docRef.update(sanitizedUpdates);

    return res.status(200).json({
      id,
      ...existing,
      ...sanitizedUpdates,
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ error: 'Failed to update announcement' });
  }
};

/**
 * DELETE /api/chats/announcements/:id
 * Delete an announcement and clean up all attached photos from Firebase Storage (Admin Only)
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const currentRole = req.userDetails?.role;
    if (currentRole !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can delete announcements' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Announcement ID is required' });

    const docRef = db.collection(COLLECTIONS.ANNOUNCEMENTS).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const existing = { id: docSnap.id, ...docSnap.data() };

    await docRef.delete();

    // Clean up all attached photos from Firebase Storage
    console.log(`[StorageCleanup] Deleting all attached files for announcement ${id}...`);
    await deleteRecordStorageFiles(existing);

    return res.status(200).json({ message: 'Announcement and attached photos deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

module.exports = {
  getContacts,
  getOrCreateConversation,
  getUserConversations,
  postMessage,
  markConversationRead,
  getAnnouncements,
  postAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
