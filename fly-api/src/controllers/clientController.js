const crypto = require('crypto');
const admin = require('firebase-admin');
const { db } = require('../config/firebase');
const { 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { userCache } = require('../services/cacheService');
const { 
  sendAccountApprovedEmail, 
  sendAccountRejectedEmail 
} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173';

const COLLECTIONS = {
  USERS: 'users',
  ACTIVE_SERVICES: 'active_services',
  APPOINTMENTS: 'appointments',
  TICKETS: 'tickets'
};

/**
 * Get all client accounts (Admin only)
 */
const getClients = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'client')
      .get();

    const clients = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: doc.id,
        ...data,
        status: data.status || 'Active'
      };
    });

    // Sort by createdAt desc (newest first)
    clients.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json(clients);
  } catch (error) {
    console.error('Error in getClients:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Get single client details + related activity summary
 */
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Client ID is required' });

    const clientDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!clientDoc.exists) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const data = clientDoc.data();
    if (data.role !== 'client') {
      return res.status(400).json({ error: 'User is not a client account' });
    }

    // Fetch related client data summaries (Active Services, Appointments, Tickets)
    let activeServices = [];
    let appointments = [];
    let tickets = [];

    try {
      const [servicesSnap, apptsSnap, ticketsSnap] = await Promise.all([
        db.collection(COLLECTIONS.ACTIVE_SERVICES)
          .where('clientUid', '==', id)
          .limit(10)
          .get(),
        db.collection(COLLECTIONS.APPOINTMENTS)
          .where('clientUid', '==', id)
          .limit(10)
          .get(),
        db.collection(COLLECTIONS.TICKETS)
          .where('clientUid', '==', id)
          .limit(10)
          .get()
      ]);

      activeServices = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      appointments = apptsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (relErr) {
      console.warn('Could not fetch related client activity:', relErr.message);
    }

    return res.status(200).json({
      id: clientDoc.id,
      uid: clientDoc.id,
      ...data,
      status: data.status || 'Active',
      activeServices,
      appointments,
      tickets
    });
  } catch (error) {
    console.error('Error in getClientById:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Update client profile (Non-sensitive fields only: fullName, phone, status, address)
 * Admins CANNOT modify password, email, or role.
 */
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) return res.status(400).json({ error: 'Client ID is required' });

    const targetDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const currentData = targetDoc.data();
    if (currentData.role !== 'client') {
      return res.status(400).json({ error: 'User is not a client account' });
    }

    const sanitizedUpdates = {
      updatedAt: new Date().toISOString()
    };

    if (updates.fullName !== undefined) {
      const name = updates.fullName.trim();
      sanitizedUpdates.fullName = name;
      sanitizedUpdates.name = name; // maintain parity
    }
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone.trim();
    if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
    if (updates.address !== undefined) sanitizedUpdates.address = typeof updates.address === 'string' ? updates.address.trim() : updates.address;

    await updateToDatabase(`${COLLECTIONS.USERS}/${id}`, sanitizedUpdates);
    userCache.delete(id); // Invalidate cached user profile

    return res.status(200).json({ 
      message: 'Client updated successfully', 
      id, 
      ...sanitizedUpdates 
    });
  } catch (error) {
    console.error('Error in updateClient:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Delete client account (From Auth + Firestore)
 */
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Client ID is required' });

    const targetDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const targetData = targetDoc.data();
    if (targetData.role !== 'client') {
      return res.status(400).json({ error: 'User is not a client account' });
    }

    // 1. Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(id);
    } catch (authErr) {
      console.warn('Could not delete auth user (may already be removed):', authErr.message);
    }

    // 2. Delete from Firestore
    await deleteFromDatabase(`${COLLECTIONS.USERS}/${id}`);
    userCache.delete(id);

    return res.status(200).json({ message: 'Client deleted successfully', id });
  } catch (error) {
    console.error('Error in deleteClient:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Approve a client account and government ID (Admin only)
 */
const approveClient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Client ID is required' });

    const clientDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!clientDoc.exists) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientData = clientDoc.data();
    if (clientData.role !== 'client') {
      return res.status(400).json({ error: 'User is not a client account' });
    }

    const now = new Date().toISOString();
    const updates = {
      status: 'Active',
      approvalStatus: 'Approved',
      rejectionReason: null,
      reuploadToken: null,
      approvedAt: now,
      approvedBy: req.user?.uid || 'admin',
      updatedAt: now
    };

    await updateToDatabase(`${COLLECTIONS.USERS}/${id}`, updates);
    userCache.delete(id);

    // Send congratulatory approval email with direct login link
    const clientName = clientData.fullName || clientData.name || 'Valued Traveler';
    const loginUrl = `${CLIENT_BASE_URL}/login`;
    try {
      await sendAccountApprovedEmail(clientData.email, clientName, loginUrl);
    } catch (emailErr) {
      console.error('Error sending account approved email:', emailErr);
    }

    // In-app notification for client
    try {
      await createNotification({
        recipientUid: id,
        recipientRole: 'client',
        title: 'Account Approved! 🎉',
        message: 'Your government ID has been verified and your account is now fully active.',
        type: 'system',
        link: '/client'
      });
    } catch (notifErr) {
      console.warn('Could not dispatch client approval notification:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Client account approved successfully',
      id,
      ...updates
    });
  } catch (error) {
    console.error('Error in approveClient:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Reject client government ID with a reason and send re-upload email link (Admin only)
 */
const rejectClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) return res.status(400).json({ error: 'Client ID is required' });
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting the ID.' });
    }

    const clientDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!clientDoc.exists) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientData = clientDoc.data();
    if (clientData.role !== 'client') {
      return res.status(400).json({ error: 'User is not a client account' });
    }

    const now = new Date().toISOString();
    const reuploadToken = crypto.randomUUID();
    const trimmedReason = reason.trim();

    const updates = {
      status: 'Rejected',
      approvalStatus: 'Rejected',
      rejectionReason: trimmedReason,
      reuploadToken,
      rejectedAt: now,
      rejectedBy: req.user?.uid || 'admin',
      updatedAt: now
    };

    await updateToDatabase(`${COLLECTIONS.USERS}/${id}`, updates);
    userCache.delete(id);

    // Send rejection email with secure re-upload link
    const clientName = clientData.fullName || clientData.name || 'Valued Traveler';
    const reuploadUrl = `${CLIENT_BASE_URL}/reupload-id?email=${encodeURIComponent(clientData.email)}&token=${reuploadToken}`;
    try {
      await sendAccountRejectedEmail(clientData.email, clientName, trimmedReason, reuploadUrl);
    } catch (emailErr) {
      console.error('Error sending account rejected email:', emailErr);
    }

    // In-app notification for client
    try {
      await createNotification({
        recipientUid: id,
        recipientRole: 'client',
        title: 'Action Required: Government ID Verification',
        message: `Your ID verification could not be approved: ${trimmedReason}. Please re-upload a clear copy.`,
        type: 'system',
        link: '/reupload-id'
      });
    } catch (notifErr) {
      console.warn('Could not dispatch client rejection notification:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Client account rejected and notification email sent',
      id,
      ...updates
    });
  } catch (error) {
    console.error('Error in rejectClient:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Bulk update client status (Active / Deactivated)
 */
const bulkStatusClients = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: 'ids array and status are required' });
    }

    const validStatuses = ['Active', 'Deactivated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    await Promise.all(
      ids.map(async (id) => {
        await updateToDatabase(`${COLLECTIONS.USERS}/${id}`, {
          status,
          updatedAt: new Date().toISOString()
        });
        userCache.delete(id);
      })
    );

    return res.status(200).json({
      message: `${ids.length} client(s) updated to ${status} successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error in bulkStatusClients:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

/**
 * Bulk delete clients (From Auth + Firestore)
 */
const bulkDeleteClients = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await Promise.all(
      ids.map(async (id) => {
        try {
          await admin.auth().deleteUser(id);
        } catch (authErr) {
          console.warn(`Could not delete Auth user ${id}:`, authErr.message);
        }
        await deleteFromDatabase(`${COLLECTIONS.USERS}/${id}`);
        userCache.delete(id);
      })
    );

    return res.status(200).json({
      message: `${ids.length} client account(s) permanently deleted`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error in bulkDeleteClients:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

module.exports = {
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  approveClient,
  rejectClient,
  bulkStatusClients,
  bulkDeleteClients
};


