const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { 
  createNotification, 
  notifyBranch,
  notifyBranchOperators 
} = require('../services/notificationService');
const { ID_PREFIXES } = require('../utils/idGenerator');

const COLLECTIONS = {
  APPOINTMENTS: 'appointments',
  FRANCHISE_APPLICATIONS: 'franchiseApplications'
};

/**
 * Converts a time string (e.g. "10:00", "10:00 AM", "14:30") to minutes from midnight
 * @param {string} timeStr 
 * @returns {number|null}
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  // 24h format HH:mm or HH:mm:ss
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    return hours * 60 + mins;
  }
  // 12h format HH:mm AM/PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  return null;
}

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
    const resolvedBranchLocation = preferredBranchLocation || branchName || 'Main Branch';
    const resolvedBranchUid = branchUid || '';

    const newAppointment = {
      clientUid: req.user?.uid || clientUid || '',
      clientName: clientName.trim(),
      clientEmail: clientEmail ? clientEmail.trim() : (req.user?.email || ''),
      clientPhone: clientPhone.trim(),
      preferredBranchLocation: resolvedBranchLocation,
      branchUid: resolvedBranchUid,
      preferredDate: preferredDate,
      preferredTime: preferredTime || '10:00 AM',
      serviceType: serviceType || 'General Consultation',
      purpose: purpose || 'Consultation & Inquiry',
      status: 'Pending',
      createdAt: now,
      updatedAt: now
    };

    const docId = await addToDatabase(COLLECTIONS.APPOINTMENTS, newAppointment, ID_PREFIXES.APPOINTMENT);

    // 1. Dispatch branch notification strictly to the specific branch operator
    notifyBranch({
      branchUid: newAppointment.branchUid,
      branchName: resolvedBranchLocation,
      title: 'New Appointment Booking',
      message: `${newAppointment.clientName} booked for ${newAppointment.serviceType} on ${newAppointment.preferredDate} (${newAppointment.preferredTime})`,
      type: 'appointment',
      link: '/operator/appointments',
      metadata: { appointmentId: docId, clientName: newAppointment.clientName, serviceType: newAppointment.serviceType }
    }).catch(e => console.warn('Appointment branch notification warning:', e.message));

    // 2. Receipt notification to Client (if registered)
    if (newAppointment.clientUid) {
      createNotification({
        recipientUid: newAppointment.clientUid,
        recipientRole: 'client',
        title: 'Appointment Booking Pending',
        message: `Your appointment for ${newAppointment.serviceType} on ${newAppointment.preferredDate} (${newAppointment.preferredTime}) at ${resolvedBranchLocation} is pending operator confirmation.`,
        type: 'appointment',
        link: '/client/appointments',
        metadata: { appointmentId: docId, status: 'Pending' }
      }).catch(e => console.warn('Appointment client receipt notification warning:', e.message));
    }

    return res.status(201).json({
      id: docId,
      ...newAppointment,
      branchName: resolvedBranchLocation,
      operatorId: resolvedBranchUid,
      message: 'Appointment requested successfully'
    });
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
    const { status, limit, clientUid, startDate, endDate } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    const userRole = req.userDetails?.role || 'client';
    const isOperator = userRole === 'operator' || userRole === 'branch_operator';
    const isAdmin = userRole === 'admin';

    // Enforce strict multi-tenant data isolation:
    if (isOperator) {
      options.filters.push({ field: 'branchUid', operator: '==', value: req.user.uid });
    } else if (isAdmin) {
      if (clientUid) {
        options.filters.push({ field: 'clientUid', operator: '==', value: clientUid });
      }
    } else {
      // All clients are strictly restricted to their own appointments
      options.filters.push({ field: 'clientUid', operator: '==', value: req.user.uid });
    }

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }

    // Date range filtering for calendar view
    const isDateRangeQuery = Boolean(startDate || endDate);
    if (startDate) {
      options.filters.push({ field: 'preferredDate', operator: '>=', value: startDate });
    }
    if (endDate) {
      options.filters.push({ field: 'preferredDate', operator: '<=', value: endDate });
    }
    if (isDateRangeQuery) {
      options.orderBy = { field: 'preferredDate', direction: 'asc' };
    }

    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    let results;
    try {
      results = await queryDatabaseAdvanced(COLLECTIONS.APPOINTMENTS, options);
    } catch (queryErr) {
      // Resilient fallback for unindexed compound range queries (code 9 / FAILED_PRECONDITION)
      if (isDateRangeQuery && (queryErr.code === 9 || (queryErr.message && queryErr.message.includes('FAILED_PRECONDITION')))) {
        console.warn('[appointmentController] Compound index missing, falling back to base filter + in-memory date range filter');
        const fallbackOptions = {
          filters: options.filters.filter(f => f.field !== 'preferredDate'),
          orderBy: { field: 'createdAt', direction: 'desc' }
        };
        const rawResults = await queryDatabaseAdvanced(COLLECTIONS.APPOINTMENTS, fallbackOptions);
        results = rawResults.filter(app => {
          const d = app.preferredDate || app.date;
          if (!d) return false;
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        }).sort((a, b) => {
          const dateComp = (a.preferredDate || a.date || '').localeCompare(b.preferredDate || b.date || '');
          if (dateComp !== 0) return dateComp;
          return (a.preferredTime || a.time || '').localeCompare(b.preferredTime || b.time || '');
        });
      } else {
        throw queryErr;
      }
    }

    const normalizedResults = results.map(app => ({
      ...app,
      branchName: app.branchName || app.preferredBranchLocation || 'Main Branch',
      operatorId: app.operatorId || app.branchUid || ''
    }));
    return res.status(200).json(normalizedResults);
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

    const valid = ['Confirmed', 'Cancelled', 'Pending', 'Completed', 'confirmed', 'cancelled', 'pending', 'completed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Status must be Confirmed, Completed, Cancelled, or Pending' });
    }

    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const dbPath = `${COLLECTIONS.APPOINTMENTS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });

    const userRole = req.userDetails?.role;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((existing.branchUid && existing.branchUid === req.user?.uid) || (existing.operatorId && existing.operatorId === req.user?.uid));
    const isAdmin = userRole === 'admin';
    const isClientOwner = userRole === 'client' && existing.clientUid === req.user?.uid;

    if (userRole === 'client') {
      // Clients may ONLY cancel their own appointment
      if (!isClientOwner) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this appointment.' });
      }
      if (normalizedStatus !== 'Cancelled') {
        return res.status(403).json({ error: 'Forbidden: Clients may only cancel their appointments.' });
      }
    } else if (!isAdmin && !isAssignedOp) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to update appointment status.' });
    }

    await updateToDatabase(dbPath, {
      status: normalizedStatus,
      updatedAt: new Date().toISOString()
    });

    // Notify appropriate party based on who initiated the status change
    if (userRole === 'client' && normalizedStatus === 'Cancelled' && (existing.branchUid || existing.operatorId)) {
      notifyBranch({
        branchUid: existing.branchUid || existing.operatorId,
        branchName: existing.preferredBranchLocation || existing.branchName || 'Main Branch',
        title: 'Appointment Cancelled by Client',
        message: `${existing.clientName} cancelled their appointment for ${existing.serviceType} scheduled on ${existing.preferredDate}.`,
        type: 'appointment',
        link: '/operator/appointments',
        metadata: { appointmentId: id, status: 'Cancelled' }
      }).catch(e => console.warn('Appointment cancel operator notification warning:', e.message));
    } else if (existing.clientUid) {
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

/**
 * Schedule a Franchise Consultation Appointment with Server-Side Collision Detection (Admin only)
 */
const scheduleFranchiseAppointment = async (req, res) => {
  try {
    const {
      franchiseApplicationId,
      appointmentDate,
      preferredDate,
      startTime,
      endTime,
      notes,
      location
    } = req.body;

    const resolvedDate = appointmentDate || preferredDate;
    if (!franchiseApplicationId) {
      return res.status(400).json({ error: 'Franchise application ID is required.' });
    }
    if (!resolvedDate) {
      return res.status(400).json({ error: 'Appointment date is required.' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Both start time and end time are required.' });
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:mm or HH:mm AM/PM (e.g., 10:00 or 10:00 AM).' });
    }

    if (startMinutes >= endMinutes) {
      return res.status(400).json({ error: 'Start time must be strictly before end time.' });
    }

    // 1. Fetch franchise application
    const appDoc = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${franchiseApplicationId}`);
    if (!appDoc) {
      return res.status(404).json({ error: 'Franchise application not found.' });
    }

    // 2. Query active/confirmed appointments on requested date for collision check
    const existingAppointments = await queryDatabaseAdvanced(COLLECTIONS.APPOINTMENTS, {
      filters: [
        { field: 'preferredDate', operator: '==', value: resolvedDate }
      ]
    });

    // 3. Collision Detection: max(startA, startB) < min(endA, endB)
    for (const existing of existingAppointments) {
      const existingStatus = (existing.status || '').toLowerCase();
      if (existingStatus === 'cancelled') continue;

      let exStart = timeToMinutes(existing.startTime);
      let exEnd = timeToMinutes(existing.endTime);

      if (exStart === null && existing.preferredTime) {
        const parts = existing.preferredTime.split(/\s*[-–—]\s*/);
        if (parts.length === 2) {
          exStart = timeToMinutes(parts[0]);
          exEnd = timeToMinutes(parts[1]);
        } else {
          exStart = timeToMinutes(parts[0]);
          if (exStart !== null) exEnd = exStart + 60;
        }
      }

      if (exStart !== null && exEnd !== null) {
        // Interval overlap detection: newStart < existingEnd && newEnd > existingStart
        if (startMinutes < exEnd && endMinutes > exStart) {
          const conflictStart = existing.startTime || existing.preferredTime?.split('-')[0]?.trim() || 'Unknown';
          const conflictEnd = existing.endTime || existing.preferredTime?.split('-')[1]?.trim() || 'Unknown';
          return res.status(409).json({
            error: `Appointment collision: The selected time slot (${startTime} - ${endTime}) overlaps with an existing appointment (${conflictStart} - ${conflictEnd}${existing.clientName ? ' for ' + existing.clientName : ''}).`,
            conflictingAppointment: {
              id: existing.id,
              clientName: existing.clientName,
              startTime: conflictStart,
              endTime: conflictEnd,
              date: resolvedDate
            }
          });
        }
      }
    }

    // 4. Create consultation appointment
    const applicantName = appDoc.fullName || [appDoc.firstName, appDoc.lastName].filter(Boolean).join(' ') || 'Applicant';
    const now = new Date().toISOString();

    const newAppointment = {
      type: 'franchise_consultation',
      franchiseApplicationId,
      clientName: applicantName,
      clientEmail: appDoc.email || '',
      clientPhone: appDoc.phoneNumber || appDoc.phone || '',
      preferredBranchLocation: appDoc.preferredBranchLocation || 'Main Office',
      preferredDate: resolvedDate,
      appointmentDate: resolvedDate,
      preferredTime: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      serviceType: 'Franchise Consultation',
      purpose: 'Franchise Application Interview & Capability Review',
      status: 'Confirmed',
      notes: notes || '',
      location: location || appDoc.preferredBranchLocation || 'Head Office / Online',
      proofOfCapability: appDoc.proofOfCapability || [],
      scheduledBy: req.user?.uid || 'admin',
      createdAt: now,
      updatedAt: now
    };

    const appointmentId = await addToDatabase(COLLECTIONS.APPOINTMENTS, newAppointment, ID_PREFIXES.APPOINTMENT);

    // 5. Update Franchise Application state
    await updateToDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${franchiseApplicationId}`, {
      status: 'appointment_scheduled',
      consultationAppointmentId: appointmentId,
      scheduledAppointmentDate: resolvedDate,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      updatedAt: now
    });

    return res.status(201).json({
      id: appointmentId,
      ...newAppointment,
      message: 'Franchise consultation appointment scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling franchise appointment:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  scheduleFranchiseAppointment
};
