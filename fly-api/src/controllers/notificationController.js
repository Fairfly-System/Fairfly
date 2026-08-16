const { db } = require('../config/firebase');

const COLLECTIONS = {
  NOTIFICATIONS: 'notifications'
};

/**
 * Get notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
  try {
    const userUid = req.user.uid;
    const userRole = req.userDetails?.role || 'client';

    // Query notifications directed to this user UID or role broadcast
    const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('recipientUid', '==', userUid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Notification ID is required' });

    const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc(id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Ensure the notification belongs to this user or role
    const data = doc.data();
    if (data.recipientUid && data.recipientUid !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to modify this notification' });
    }

    await notifRef.update({
      read: true,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ message: 'Notification marked as read', id });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = async (req, res) => {
  try {
    const userUid = req.user.uid;

    const unreadSnap = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('recipientUid', '==', userUid)
      .where('read', '==', false)
      .get();

    if (unreadSnap.empty) {
      return res.status(200).json({ message: 'No unread notifications' });
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    unreadSnap.docs.forEach(doc => {
      batch.update(doc.ref, { read: true, updatedAt: now });
    });

    await batch.commit();

    return res.status(200).json({
      message: 'All notifications marked as read',
      count: unreadSnap.size
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Notification ID is required' });

    const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc(id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const data = doc.data();
    if (data.recipientUid && data.recipientUid !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to delete this notification' });
    }

    await notifRef.delete();
    return res.status(200).json({ message: 'Notification deleted successfully', id });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
