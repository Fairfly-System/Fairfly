const { db } = require('../config/firebase');

const COLLECTIONS = {
  NOTIFICATIONS: 'notifications',
  USERS: 'users'
};

/**
 * Create a single in-app notification in Firestore
 * @param {Object} params
 * @param {string} params.recipientUid - Target user's UID (or 'broadcast')
 * @param {string} [params.recipientRole] - Optional target role ('admin' | 'operator' | 'client')
 * @param {string} params.title - Notification headline
 * @param {string} params.message - Detailed body text
 * @param {string} [params.type='system'] - 'service' | 'appointment' | 'message' | 'ticket' | 'franchise' | 'resource' | 'system'
 * @param {string} [params.link=''] - Destination frontend URL
 * @param {Object} [params.metadata={}] - Arbitrary context details
 */
const createNotification = async ({
  recipientUid,
  recipientRole = null,
  title,
  message,
  type = 'system',
  link = '',
  metadata = {}
}) => {
  try {
    if (!recipientUid && !recipientRole) {
      console.warn('Cannot create notification: missing recipientUid and recipientRole');
      return null;
    }

    const now = new Date().toISOString();
    const notifDoc = {
      recipientUid: recipientUid || null,
      recipientRole: recipientRole || null,
      title: title || 'Notification',
      message: message || '',
      type,
      link,
      metadata,
      read: false,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection(COLLECTIONS.NOTIFICATIONS).add(notifDoc);
    return { id: docRef.id, ...notifDoc };
  } catch (error) {
    console.error('Error creating notification in notificationService:', error);
    return null;
  }
};

/**
 * Notify all administrators
 */
const notifyAdmins = async ({ title, message, type = 'system', link = '/admin', metadata = {} }) => {
  try {
    const adminSnaps = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'admin')
      .get();

    const promises = adminSnaps.docs.map(doc =>
      createNotification({
        recipientUid: doc.id,
        recipientRole: 'admin',
        title,
        message,
        type,
        link,
        metadata
      })
    );

    return await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying admins:', error);
    return [];
  }
};

/**
 * Notify operators belonging to a branch
 */
const notifyBranchOperators = async ({ branchName, title, message, type = 'system', link = '/operator', metadata = {} }) => {
  try {
    if (!branchName) return [];

    const opSnaps = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'operator')
      .where('branchName', '==', branchName)
      .get();

    const promises = opSnaps.docs.map(doc =>
      createNotification({
        recipientUid: doc.id,
        recipientRole: 'operator',
        title,
        message,
        type,
        link,
        metadata
      })
    );

    return await Promise.all(promises);
  } catch (error) {
    console.error(`Error notifying operators of branch ${branchName}:`, error);
    return [];
  }
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyBranchOperators
};
