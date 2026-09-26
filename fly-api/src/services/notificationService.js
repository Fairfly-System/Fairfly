const { db } = require('../config/firebase');
const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');

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

    const notifId = generatePrefixedId(ID_PREFIXES.NOTIFICATION);
    const docRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc(notifId);
    await docRef.set(notifDoc);
    return { id: notifId, ...notifDoc };
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

/**
 * Notify all active operators across all branches
 */
const notifyAllOperators = async ({ title, message, type = 'system', link = '/operator', metadata = {} }) => {
  try {
    const opSnaps = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'operator')
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
    console.error('Error notifying all operators:', error);
    return [];
  }
};

/**
 * Notify a specific branch operator (by branchUid and/or branchName)
 * Targets the operator by branchUid and any operator users matching branchName without duplicates.
 * Falls back to notifying all active operators if no specific branch operator is found.
 */
const notifyBranch = async ({
  branchUid = null,
  branchName = null,
  title,
  message,
  type = 'system',
  link = '/operator',
  metadata = {}
}) => {
  try {
    const targetUids = new Set();

    if (branchUid) {
      targetUids.add(branchUid);
    }

    if (branchName) {
      const opSnaps = await db.collection(COLLECTIONS.USERS)
        .where('role', '==', 'operator')
        .where('branchName', '==', branchName)
        .get();

      opSnaps.docs.forEach(doc => targetUids.add(doc.id));
    }

    // If no operators found via UID or branchName, log warning instead of broadcasting
    if (targetUids.size === 0) {
      console.warn(`notifyBranch: No operator matched for branchUid "${branchUid}" or branchName "${branchName}". Skipping broadcast.`);
      return [];
    }

    const promises = Array.from(targetUids).map(uid =>
      createNotification({
        recipientUid: uid,
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
    console.error(`Error notifying branch (${branchUid || branchName}):`, error);
    return [];
  }
};

module.exports = {
  createNotification,
  notifyBranch,
  notifyAdmins,
  notifyBranchOperators,
  notifyAllOperators
};
