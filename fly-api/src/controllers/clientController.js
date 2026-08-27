const admin = require('firebase-admin');
const { db } = require('../config/firebase');
const { 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { userCache } = require('../services/cacheService');

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

module.exports = {
  getClients,
  getClientById,
  updateClient,
  deleteClient
};
