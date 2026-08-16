const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const COLLECTIONS = {
  TICKETS: 'tickets'
};

/**
 * Create a new support ticket (Operator or Admin testing)
 */
const createTicket = async (req, res) => {
  try {
    const { 
      operatorId, 
      operatorName, 
      operatorEmail, 
      title, 
      category, 
      priority, 
      initialMessage 
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Ticket title/subject is required' });
    }

    const opId = operatorId || req.user?.uid || `OP-${Date.now().toString().slice(-6)}`;
    const opName = operatorName || req.userDetails?.name || 'Operator Account';
    const opEmail = operatorEmail || req.user?.email || 'operator@fairfly.com';
    const firstMsgText = initialMessage && initialMessage.trim() ? initialMessage.trim() : title.trim();
    const now = new Date().toISOString();

    const initialMessageObj = {
      id: `msg_${Date.now()}_1`,
      senderId: opId,
      senderName: opName,
      senderRole: 'operator',
      message: firstMsgText,
      createdAt: now
    };

    const newTicketData = {
      operatorId: opId,
      operatorName: opName,
      operatorEmail: opEmail,
      title: title.trim(),
      category: category || 'General',
      priority: priority || 'Medium',
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      closedBy: null,
      lastMessage: firstMsgText,
      messages: [initialMessageObj]
    };

    const docId = await addToDatabase(COLLECTIONS.TICKETS, newTicketData);

    // Notify admins
    notifyAdmins({
      title: 'New Support Ticket',
      message: `${newTicketData.operatorName} submitted ticket: "${newTicketData.title}" (${newTicketData.priority})`,
      type: 'ticket',
      link: '/admin/tickets'
    }).catch(e => console.warn('Ticket notification warning:', e.message));

    return res.status(201).json({ id: docId, ...newTicketData, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List support tickets with optional status & operatorId filtering
 */
const getTickets = async (req, res) => {
  try {
    const { status, operatorId, limit } = req.query;

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (operatorId) {
      options.filters.push({ field: 'operatorId', operator: '==', value: operatorId });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.TICKETS, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving support tickets:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get ticket details and thread by ID
 */
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    const ticket = await getFromDatabase(`${COLLECTIONS.TICKETS}/${id}`);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(200).json({ id, ...ticket });
  } catch (error) {
    console.error('Error retrieving ticket by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update ticket status (Pending, Ongoing, Closed)
 */
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Pending', 'Ongoing', 'Closed', 'pending', 'ongoing', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: Pending, Ongoing, Closed` });
    }

    // Normalize casing to Title Case: Pending, Ongoing, Closed
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const dbPath = `${COLLECTIONS.TICKETS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    const updateData = {
      status: normalizedStatus,
      updatedAt: now
    };

    if (normalizedStatus === 'Closed') {
      updateData.closedAt = now;
      updateData.closedBy = req.userDetails?.name || 'Admin';
    } else {
      updateData.closedAt = null;
      updateData.closedBy = null;
    }

    await updateToDatabase(dbPath, updateData);
    return res.status(200).json({ message: `Ticket status updated to ${normalizedStatus}` });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Add a new response message to a ticket support thread
 */
const addMessageToThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, senderId, senderName, senderRole } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    const dbPath = `${COLLECTIONS.TICKETS}/${id}`;
    const existingTicket = await getFromDatabase(dbPath);
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (existingTicket.status === 'Closed') {
      return res.status(400).json({ error: 'Cannot post message to a closed ticket thread' });
    }

    const now = new Date().toISOString();
    const activeRole = senderRole || (req.userDetails?.role === 'admin' ? 'admin' : 'operator');
    const activeName = senderName || req.userDetails?.name || (activeRole === 'admin' ? 'Super Admin' : 'Operator');
    const activeId = senderId || req.user?.uid || activeRole;

    const newMessageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: activeId,
      senderName: activeName,
      senderRole: activeRole,
      message: message.trim(),
      createdAt: now
    };

    const updatedMessages = [...(existingTicket.messages || []), newMessageObj];
    
    // Automatically transition Pending tickets to Ongoing when a reply is posted
    const newStatus = existingTicket.status === 'Pending' ? 'Ongoing' : existingTicket.status;

    await updateToDatabase(dbPath, {
      messages: updatedMessages,
      lastMessage: message.trim(),
      status: newStatus,
      updatedAt: now
    });

    // Notify the other party
    if (activeRole === 'admin' && existingTicket.operatorId) {
      createNotification({
        recipientUid: existingTicket.operatorId,
        title: 'Support Ticket Reply',
        message: `${activeName} replied on: "${existingTicket.title}"`,
        type: 'ticket',
        link: '/operator/tickets',
        metadata: { ticketId: id }
      }).catch(e => console.warn('Ticket reply notification warning:', e.message));
    } else if (activeRole === 'operator') {
      notifyAdmins({
        title: 'Operator Ticket Reply',
        message: `${activeName} replied on ticket: "${existingTicket.title}"`,
        type: 'ticket',
        link: '/admin/tickets',
        metadata: { ticketId: id }
      }).catch(e => console.warn('Admin ticket notification warning:', e.message));
    }

    return res.status(200).json({ 
      message: 'Message added to ticket thread successfully', 
      newMessage: newMessageObj,
      status: newStatus
    });
  } catch (error) {
    console.error('Error adding message to ticket thread:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Close a ticket thread (Admin or Operator)
 */
const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    const dbPath = `${COLLECTIONS.TICKETS}/${id}`;
    const existingTicket = await getFromDatabase(dbPath);
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    const closedBy = req.userDetails?.name || 'Admin';

    await updateToDatabase(dbPath, {
      status: 'Closed',
      closedAt: now,
      closedBy: closedBy,
      updatedAt: now
    });

    return res.status(200).json({ message: 'Ticket thread has been closed', closedAt: now, closedBy });
  } catch (error) {
    console.error('Error closing ticket thread:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addMessageToThread,
  closeTicket
};
