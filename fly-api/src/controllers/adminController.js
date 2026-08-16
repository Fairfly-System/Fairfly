const admin = require('firebase-admin');
const { db } = require('../config/firebase');
const { 
  addToDocumentWithId, 
  updateToDatabase, 
  deleteFromDatabase, 
  queryDatabaseAdvanced 
} = require('../services/firebaseService');
const { userCache } = require('../services/cacheService');

const COLLECTIONS = {
  USERS: 'users',
  ADMIN_LOGS: 'adminLogs'
};

/**
 * Create a new Support Admin (Super Admin only)
 * Payload: { email, password, username, fullName, phone }
 */
const createAdmin = async (req, res) => {
  let uid;

  try {
    const { email, password, username, fullName, phone, assignedOperators } = req.body;

    if (!email || !password || (!username && !fullName)) {
      return res.status(400).json({ error: 'Email, password, and username/name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const displayName = (fullName || username || '').trim();

    try {
      const userRecord = await admin.auth().createUser({
        email: email.trim(),
        password: password,
        displayName: displayName
      });
      uid = userRecord.uid;
    } catch (authError) {
      console.error('Error creating admin Auth user:', authError);
      return res.status(400).json({ error: 'Failed to create auth user: ' + authError.message });
    }

    const now = new Date().toISOString();
    const adminDoc = {
      email: email.trim().toLowerCase(),
      fullName: displayName,
      username: (username || displayName).trim(),
      name: displayName,
      phone: phone ? phone.trim() : '',
      role: 'admin',
      isSuperAdmin: false,
      status: 'Active',
      assignedOperators: Array.isArray(assignedOperators) ? assignedOperators : [],
      createdBySuperAdmin: req.user?.uid || 'superadmin',
      createdByName: req.userDetails?.fullName || req.userDetails?.name || 'Super Admin',
      createdAt: now,
      updatedAt: now
    };

    await addToDocumentWithId(COLLECTIONS.USERS, uid, adminDoc);

    return res.status(201).json({
      id: uid,
      ...adminDoc,
      message: 'Support Administrator created successfully'
    });
  } catch (error) {
    console.error('Error in createAdmin:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Get all admin accounts (Super Admin only)
 */
const getAdmins = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'admin')
      .get();

    const admins = snapshot.docs.map(doc => {
      const data = doc.data();
      const isSuper = data.isSuperAdmin === true || data.email === 'admin@gmail.com';
      return {
        id: doc.id,
        uid: doc.id,
        ...data,
        isSuperAdmin: isSuper
      };
    });

    // Sort Super Admin first, then newest
    admins.sort((a, b) => {
      if (a.isSuperAdmin && !b.isSuperAdmin) return -1;
      if (!a.isSuperAdmin && b.isSuperAdmin) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return res.status(200).json(admins);
  } catch (error) {
    console.error('Error in getAdmins:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Get single admin details + metrics + recent actions
 */
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Admin ID is required' });

    const adminDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!adminDoc.exists) {
      return res.status(404).json({ error: 'Administrator not found' });
    }

    const data = adminDoc.data();
    if (data.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an administrator' });
    }

    const isSuper = data.isSuperAdmin === true || data.email === 'admin@gmail.com';

    // Fetch recent actions performed by this admin from adminLogs
    let recentActions = [];
    try {
      const logsSnap = await db.collection(COLLECTIONS.ADMIN_LOGS)
        .where('adminId', '==', id)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

      recentActions = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (logErr) {
      console.warn('Could not fetch adminLogs (index may be building):', logErr.message);
    }

    return res.status(200).json({
      id: adminDoc.id,
      uid: adminDoc.id,
      ...data,
      isSuperAdmin: isSuper,
      recentActions
    });
  } catch (error) {
    console.error('Error in getAdminById:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Update admin account details / status
 */
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) return res.status(400).json({ error: 'Admin ID is required' });

    const targetDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: 'Administrator not found' });
    }

    const currentData = targetDoc.data();

    // Prevent demoting or disabling the main Super Admin account
    if ((currentData.email === 'admin@gmail.com' || currentData.isSuperAdmin === true) && updates.status === 'Inactive') {
      return res.status(400).json({ error: 'Cannot disable the primary Super Administrator account.' });
    }

    const sanitizedUpdates = {
      updatedAt: new Date().toISOString()
    };

    if (updates.fullName !== undefined) sanitizedUpdates.fullName = updates.fullName.trim();
    if (updates.username !== undefined) sanitizedUpdates.username = updates.username.trim();
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name.trim();
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone.trim();
    if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
    if (updates.assignedOperators !== undefined) sanitizedUpdates.assignedOperators = updates.assignedOperators;

    await updateToDatabase(COLLECTIONS.USERS, id, sanitizedUpdates);
    userCache.del(id); // Clear cache

    return res.status(200).json({ message: 'Administrator updated successfully', id, ...sanitizedUpdates });
  } catch (error) {
    console.error('Error in updateAdmin:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Delete support admin account (Cannot delete Super Admin)
 */
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Admin ID is required' });

    const targetDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: 'Administrator not found' });
    }

    const targetData = targetDoc.data();
    if (targetData.email === 'admin@gmail.com' || targetData.isSuperAdmin === true) {
      return res.status(400).json({ error: 'The primary Super Administrator account cannot be deleted.' });
    }

    // Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(id);
    } catch (authErr) {
      console.warn('Could not delete auth user:', authErr.message);
    }

    // Delete Firestore document
    await deleteFromDatabase(COLLECTIONS.USERS, id);
    userCache.del(id);

    return res.status(200).json({ message: 'Administrator deleted successfully', id });
  } catch (error) {
    console.error('Error in deleteAdmin:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

module.exports = {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};
