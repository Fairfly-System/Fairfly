const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { createNotification, notifyAdmins, notifyTicketAdmins } = require('../services/notificationService');
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
 * Helper to determine if authenticated user is Super Admin
 */
const checkIsSuperAdmin = (req) => {
  return req.userDetails?.isSuperAdmin === true || 
    req.userDetails?.email === 'admin@gmail.com' || 
    req.user?.email === 'admin@gmail.com';
};

/**
 * Create a new support ticket (Operator or Admin testing)
 */
const createTicket = async (req, res) => {
  try {
    const { 
      operatorId, 
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

    if (!opId) {
      return res.status(400).json({ error: 'Operator account UID is required to create a ticket' });
    }

    // Resolve operator name dynamically for notifications
    let opName = req.userDetails?.branchName || req.userDetails?.name || 'Branch Operator';
    try {
      const userDoc = userCache.get(opId) || await getFromDatabase(`users/${opId}`);
      if (userDoc) {
        opName = userDoc.branchName || userDoc.name || opName;
        userCache.set(opId, userDoc);
      }
    } catch (err) {
      console.warn('User record lookup notice for operatorId:', opId, err.message);
    }

    const firstMsgText = initialMessage && initialMessage.trim() ? initialMessage.trim() : title.trim();
    const now = new Date().toISOString();

    const initialMessageObj = {
      id: `msg_${Date.now()}_1`,
      senderId: opId,
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
      lastMessage: firstMsgText,
      messages: [initialMessageObj]
    };

    const docId = await addToDatabase(COLLECTIONS.TICKETS, newTicketData, ID_PREFIXES.TICKET);

    // Notify assigned admins and super admins
    notifyTicketAdmins({
      operatorId: opId,
      title: 'New Support Ticket',
      message: `${opName} submitted ticket: "${newTicketData.title}" (${newTicketData.priority})`,
      type: 'ticket',
      link: '/admin/tickets',
      metadata: { ticketId: docId, operatorId: opId }
    }).catch(e => console.warn('Ticket notification warning:', e.message));

    return res.status(201).json({ id: docId, ...newTicketData, operatorName: opName, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List support tickets with optional status & operatorId filtering
 * Support Admins only see tickets for their assigned branch operators. Super Admins see all tickets.
 */
const getTickets = async (req, res) => {
  try {
    const { status, operatorId, limit, page } = req.query;
    const userRole = req.userDetails?.role;

    if (userRole === 'client') {
      return res.status(403).json({ error: 'Forbidden: Client accounts cannot access operator support tickets.' });
    }

    const isSuperAdmin = checkIsSuperAdmin(req);
    const assignedOperators = Array.isArray(req.userDetails?.assignedOperators) ? req.userDetails.assignedOperators : [];

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (userRole === 'operator' || userRole === 'branch_operator') {
      options.filters.push({ field: 'operatorId', operator: '==', value: req.user.uid });
    } else if (operatorId) {
      // If regular admin requested specific operatorId, ensure it's assigned to them
      if (userRole === 'admin' && !isSuperAdmin && !assignedOperators.includes(operatorId)) {
        if (page) {
          const pageNum = parseInt(page, 10) || 1;
          const limitNum = parseInt(limit, 10) || 10;
          return res.status(200).json({ data: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
        }
        return res.status(200).json([]);
      }
      options.filters.push({ field: 'operatorId', operator: '==', value: operatorId });
    }

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }

    let allResults = await queryDatabaseAdvanced(COLLECTIONS.TICKETS, options);

    // Filter by assigned operators for Support Admins (non-super admins)
    if (userRole === 'admin' && !isSuperAdmin) {
      const assignedSet = new Set(assignedOperators);
      allResults = allResults.filter(t => assignedSet.has(t.operatorId));
    }

    if (page) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
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
      allResults = allResults.slice(0, parseInt(limit, 10));
    }

    const enrichedResults = await enrichTicketsWithOperatorData(allResults);
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
    const isSuperAdmin = checkIsSuperAdmin(req);
    const assignedOperators = Array.isArray(req.userDetails?.assignedOperators) ? req.userDetails.assignedOperators : [];

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this ticket.' });
    }

    // Support admin check: verify operator is assigned to them
    if (isAdmin && !isSuperAdmin && !assignedOperators.includes(ticket.operatorId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view tickets for this operator branch.' });
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

    // Resolve participants map for thread senders & operator
    const participants = {};
    if (ticket.operatorId) {
      participants[ticket.operatorId] = {
        id: ticket.operatorId,
        name: opName || 'Operator Branch',
        email: opEmail || 'operator@fairfly.com',
        role: 'operator'
      };
    }

    const senderIds = [...new Set((ticket.messages || []).map(m => m.senderId).filter(Boolean))];
    for (const sId of senderIds) {
      if (!participants[sId]) {
        let sUser = userCache.get(sId);
        if (!sUser) {
          try {
            sUser = await getFromDatabase(`users/${sId}`);
            if (sUser) userCache.set(sId, sUser);
          } catch (e) {}
        }
        if (sUser) {
          participants[sId] = {
            id: sId,
            name: sUser.branchName || sUser.name || sUser.fullName || (sUser.role === 'admin' ? 'Super Admin' : 'Branch Operator'),
            role: sUser.role || (sId === ticket.operatorId ? 'operator' : 'admin'),
            email: sUser.email || ''
          };
        } else {
          participants[sId] = {
            id: sId,
            name: sId === ticket.operatorId ? (opName || 'Operator') : 'Admin',
            role: sId === ticket.operatorId ? 'operator' : 'admin'
          };
        }
      }
    }

    return res.status(200).json({
      id,
      ...ticket,
      operatorName: opName || 'Operator Branch',
      operatorEmail: opEmail || 'operator@fairfly.com',
      participants
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

    const isSuperAdmin = checkIsSuperAdmin(req);
    const assignedOperators = Array.isArray(req.userDetails?.assignedOperators) ? req.userDetails.assignedOperators : [];

    if (!isSuperAdmin && !assignedOperators.includes(existing.operatorId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update tickets for this operator branch.' });
    }

    const now = new Date().toISOString();
    const updateData = {
      status: normalizedStatus,
      updatedAt: now
    };

    if (normalizedStatus === 'Closed') {
      updateData.closedAt = now;
    } else {
      updateData.closedAt = null;
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
    const { message } = req.body;

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
    const isSuperAdmin = checkIsSuperAdmin(req);
    const assignedOperators = Array.isArray(req.userDetails?.assignedOperators) ? req.userDetails.assignedOperators : [];

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to post in this ticket thread.' });
    }

    if (isAdmin && !isSuperAdmin && !assignedOperators.includes(existingTicket.operatorId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to post in tickets for this operator branch.' });
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
      senderRole: activeRole,
      senderName: activeName,
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
      notifyTicketAdmins({
        operatorId: existingTicket.operatorId,
        title: 'Operator Ticket Reply',
        message: `${activeName} replied on ticket: "${existingTicket.title}"`,
        type: 'ticket',
        link: '/admin/tickets',
        metadata: { ticketId: id, operatorId: existingTicket.operatorId }
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

    const isSuperAdmin = checkIsSuperAdmin(req);
    const assignedOperators = Array.isArray(req.userDetails?.assignedOperators) ? req.userDetails.assignedOperators : [];
    const isClosedByAdmin = req.userDetails?.role === 'admin';

    if (isClosedByAdmin && !isSuperAdmin && !assignedOperators.includes(existingTicket.operatorId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to close tickets for this operator branch.' });
    }

    const now = new Date().toISOString();
    const closedByName = req.userDetails?.name || 'Admin';

    await updateToDatabase(dbPath, {
      status: 'Closed',
      closedAt: now,
      updatedAt: now
    });

    // If closed by admin, notify the operator
    if (isClosedByAdmin && existingTicket.operatorId) {
      createNotification({
        recipientUid: existingTicket.operatorId,
        recipientRole: 'operator',
        title: 'Ticket Closed',
        message: `Your ticket "${existingTicket.title}" has been closed by ${closedByName}.`,
        type: 'ticket',
        link: '/operator/tickets',
        metadata: { ticketId: id, status: 'Closed' }
      }).catch(e => console.warn('Ticket close operator notification warning:', e.message));
    } else if (!isClosedByAdmin) {
      // If closed by operator, notify assigned admins & super admins
      notifyTicketAdmins({
        operatorId: existingTicket.operatorId,
        title: 'Ticket Closed by Operator',
        message: `Ticket "${existingTicket.title}" was resolved and closed by ${closedByName}.`,
        type: 'ticket',
        link: '/admin/tickets',
        metadata: { ticketId: id, status: 'Closed', operatorId: existingTicket.operatorId }
      }).catch(e => console.warn('Ticket close admin notification warning:', e.message));
    }

    return res.status(200).json({ message: 'Ticket thread has been closed', closedAt: now });
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
