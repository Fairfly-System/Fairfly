const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  APPOINTMENTS: 'appointments'
};

/**
 * Request an appointment (Client or Operator)
 */
const createAppointment = async (req, res) => {
  try {
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      preferredBranchLocation, 
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
      clientName: clientName.trim(),
      clientEmail: clientEmail ? clientEmail.trim() : '',
      clientPhone: clientPhone.trim(),
      preferredBranchLocation: preferredBranchLocation || 'Main Branch',
      preferredDate: preferredDate,
      preferredTime: preferredTime || '10:00 AM',
      serviceType: serviceType || 'Passport Processing',
      purpose: purpose || 'Consultation & Inquiry',
      status: 'Pending',
      createdAt: now,
      updatedAt: now
    };

    const docId = await addToDatabase(COLLECTIONS.APPOINTMENTS, newAppointment);
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
    const { status, limit } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

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
