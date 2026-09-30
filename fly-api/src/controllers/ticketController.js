const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { ID_PREFIXES } = require('../utils/idGenerator');
const { userCache } = require('../services/cacheService');

const COLLECTIONS = {
  TICKETS: 'tickets'
};

/**
 * Dynamically resolve and enrich normalized operator data on read
 */
const enrichTicketsWithOperatorData = async (tickets) => {
  if (!Array.isArray(tickets) || tickets.length === 0) return tickets;
  const operatorIds = [...new Set(tickets.map(t => t.operatorId).filter(Boolean))];
  const opMap = new Map();
  await Promise.all(operatorIds.map(async (opId) => {
    try {
      const cached = userCache.get(opId);
      if (cached) {
        opMap.set(opId, cached);
        return;
      }
      const uDoc = await getFromDatabase(`users/${opId}`);
      if (uDoc) {
        opMap.set(opId, uDoc);
        userCache.set(opId, uDoc);
      }
    } catch (e) {
      console.warn('[Tickets] Operator profile resolution notice:', opId, e.message);
    }
  }));

  return tickets.map(ticket => {
    const op = opMap.get(ticket.operatorId) || {};
    return {
      ...ticket,
      operatorName: ticket.operatorName || op.branchName || op.name || op.fullName || 'Operator Branch',
      operatorEmail: ticket.operatorEmail || op.email || 'operator@fairfly.com'
    };
  });
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

    const userRole = req.userDetails?.role;
    if (userRole === 'client') {
      return res.status(403).json({ error: 'Client accounts cannot create operator tickets' });
    }

    // Authenticated Operator uses their own UID
    const opId = (userRole === 'operator' || userRole === 'branch_operator')
      ? req.user.uid
      : (operatorId || req.user?.uid);

    let opName = operatorName || req.userDetails?.branchName || req.userDetails?.name || 'Operator Account';
    let opEmail = operatorEmail || req.userDetails?.email || req.user?.email || 'operator@fairfly.com';

    // If opId is available, verify and enrich with Firestore users document
    if (opId) {
      try {
        const userDoc = await getFromDatabase(`users/${opId}`);
        if (userDoc) {
          opName = userDoc.branchName || userDoc.name || opName;
          opEmail = userDoc.email || opEmail;
        }
      } catch (err) {
        console.warn('User record lookup notice for operatorId:', opId, err.message);
      }
    }

    if (!opId) {
      return res.status(400).json({ error: 'Operator account UID is required to create a ticket' });
    }

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

    const docId = await addToDatabase(COLLECTIONS.TICKETS, newTicketData, ID_PREFIXES.TICKET);

    // Notify admins
    notifyAdmins({
      title: 'New Support Ticket',
      message: `${opName} submitted ticket: "${newTicketData.title}" (${newTicketData.priority})`,
      type: 'ticket',
      link: '/admin/tickets'
    }).catch(e => console.warn('Ticket notification warning:', e.message));

    return res.status(201).json({ id: docId, ...newTicketData, operatorName: opName, operatorEmail: opEmail, message: 'Ticket created successfully' });
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
    const { status, operatorId, limit, page } = req.query;
    const userRole = req.userDetails?.role;

    if (userRole === 'client') {
      return res.status(403).json({ error: 'Forbidden: Client accounts cannot access operator support tickets.' });
    }

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (userRole === 'operator' || userRole === 'branch_operator') {
      options.filters.push({ field: 'operatorId', operator: '==', value: req.user.uid });
    } else if (operatorId) {
      options.filters.push({ field: 'operatorId', operator: '==', value: operatorId });
    }

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }

    if (page) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const allResults = await queryDatabaseAdvanced(COLLECTIONS.TICKETS, options);
      const total = allResults.length;
      const paginated = allResults.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      const enrichedPaginated = await enrichTicketsWithOperatorData(paginated);
      return res.status(200).json({
        data: enrichedPaginated,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.TICKETS, options);
    const enrichedResults = await enrichTicketsWithOperatorData(results);
    return res.status(200).json(enrichedResults);
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

    const userRole = req.userDetails?.role;
    const isOwner = ticket.operatorId === req.user?.uid;
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this ticket.' });
    }

    let opName = ticket.operatorName;
    let opEmail = ticket.operatorEmail;
    if ((!opName || !opEmail) && ticket.operatorId) {
      try {
        const cached = userCache.get(ticket.operatorId);
        if (cached) {
          opName = opName || cached.branchName || cached.name || cached.fullName;
          opEmail = opEmail || cached.email;
        } else {
          const opUser = await getFromDatabase(`users/${ticket.operatorId}`);
          if (opUser) {
            opName = opName || opUser.branchName || opUser.name || opUser.fullName;
            opEmail = opEmail || opUser.email;
            userCache.set(ticket.operatorId, opUser);
          }
        }
      } catch (err) {}
    }

    return res.status(200).json({
      id,
      ...ticket,
      operatorName: opName || 'Operator Branch',
      operatorEmail: opEmail || 'operator@fairfly.com'
    });
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

    // Notify Operator of status change
    if (existing.operatorId) {
      createNotification({
        recipientUid: existing.operatorId,
        recipientRole: 'operator',
        title: 'Ticket Status Updated',
        message: `Your ticket "${existing.title}" is now marked as ${normalizedStatus}.`,
        type: 'ticket',
        link: '/operator/tickets',
        metadata: { ticketId: id, status: normalizedStatus }
      }).catch(e => console.warn('Ticket status operator notification warning:', e.message));
    }

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

    const userRole = req.userDetails?.role;
    const isOwner = existingTicket.operatorId === req.user?.uid;
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to post in this ticket thread.' });
    }

    if (existingTicket.status === 'Closed') {
      return res.status(400).json({ error: 'Cannot post message to a closed ticket thread' });
    }

    const now = new Date().toISOString();
    const activeRole = isAdmin ? 'admin' : 'operator';
    const activeName = req.userDetails?.branchName || req.userDetails?.name || req.userDetails?.fullName || (isAdmin ? 'Super Admin' : 'Operator');
    const activeId = req.user?.uid || (isAdmin ? 'admin' : 'operator');

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

    const isClosedByAdmin = req.userDetails?.role === 'admin';

    // If closed by admin, notify the operator
    if (isClosedByAdmin && existingTicket.operatorId) {
      createNotification({
        recipientUid: existingTicket.operatorId,
        recipientRole: 'operator',
        title: 'Ticket Closed',
        message: `Your ticket "${existingTicket.title}" has been closed by ${closedBy}.`,
        type: 'ticket',
        link: '/operator/tickets',
        metadata: { ticketId: id, status: 'Closed' }
      }).catch(e => console.warn('Ticket close operator notification warning:', e.message));
    } else if (!isClosedByAdmin) {
      // If closed by operator, notify admins
      notifyAdmins({
        title: 'Ticket Closed by Operator',
        message: `Ticket "${existingTicket.title}" was resolved and closed by ${closedBy}.`,
        type: 'ticket',
        link: '/admin/tickets',
        metadata: { ticketId: id, status: 'Closed' }
      }).catch(e => console.warn('Ticket close admin notification warning:', e.message));
    }

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
