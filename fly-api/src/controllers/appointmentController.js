const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { 
  createNotification, 
  notifyAdmins, 
  notifyBranchOperators 
} = require('../services/notificationService');

const COLLECTIONS = {
  APPOINTMENTS: 'appointments'
};

/**
 * Request an appointment (Client or Operator)
 */
const createAppointment = async (req, res) => {
  try {
    const { 
      clientUid,
      clientName, 
      clientEmail, 
      clientPhone, 
      preferredBranchLocation, 
      branchUid,
      branchName,
      preferredDate, 
      preferredTime, 
      serviceType, 
      purpose 
    } = req.body;

    if (!clientName || !clientPhone || !preferredDate) {
      return res.status(400).json({ error: 'Client name, phone number, and preferred date are required' });
    }

    const now = new Date().toISOString();
    const newAppointment = {
      clientUid: req.user?.uid || clientUid || '',
      clientName: clientName.trim(),
      clientEmail: clientEmail ? clientEmail.trim() : (req.user?.email || ''),
      clientPhone: clientPhone.trim(),
      preferredBranchLocation: preferredBranchLocation || branchName || 'Main Branch',
      branchUid: branchUid || '',
      branchName: branchName || preferredBranchLocation || 'Main Branch',
      preferredDate: preferredDate,
      preferredTime: preferredTime || '10:00 AM',
      serviceType: serviceType || 'General Consultation',
      purpose: purpose || 'Consultation & Inquiry',
      status: 'Pending',
      createdAt: now,
      updatedAt: now
    };

    const docId = await addToDatabase(COLLECTIONS.APPOINTMENTS, newAppointment);

    // Dispatch background notifications
    notifyBranchOperators({
      branchName: newAppointment.branchName,
      title: 'New Appointment Booking',
      message: `${newAppointment.clientName} booked for ${newAppointment.serviceType} on ${newAppointment.preferredDate} (${newAppointment.preferredTime})`,
      type: 'appointment',
      link: '/operator/appointments'
    }).catch(e => console.warn('Appointment notification warning:', e.message));

    return res.status(201).json({ id: docId, ...newAppointment, message: 'Appointment requested successfully' });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List appointments
 */
const getAppointments = async (req, res) => {
  try {
    const { status, limit, clientUid } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    // If client user is querying, enforce their clientUid
    if (req.user?.role === 'client') {
      options.filters.push({ field: 'clientUid', operator: '==', value: req.user.uid });
    } else if (clientUid) {
      options.filters.push({ field: 'clientUid', operator: '==', value: clientUid });
    }

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.APPOINTMENTS, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error listing appointments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Confirm or Cancel an appointment (Operator action)
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Appointment ID and status are required' });

    const valid = ['Confirmed', 'Cancelled', 'Pending', 'confirmed', 'cancelled', 'pending'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Status must be Confirmed, Cancelled, or Pending' });
    }

    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const dbPath = `${COLLECTIONS.APPOINTMENTS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });

    await updateToDatabase(dbPath, {
      status: normalizedStatus,
      updatedAt: new Date().toISOString()
    });

    // Notify client if clientUid exists
    if (existing.clientUid) {
      createNotification({
        recipientUid: existing.clientUid,
        title: `Appointment ${normalizedStatus}`,
        message: `Your appointment for ${existing.serviceType} on ${existing.preferredDate} has been ${normalizedStatus.toLowerCase()}.`,
        type: 'appointment',
        link: '/client/appointments',
        metadata: { appointmentId: id, status: normalizedStatus }
      }).catch(e => console.warn('Appointment status notification warning:', e.message));
    }

    return res.status(200).json({ message: `Appointment status updated to ${normalizedStatus}` });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
