const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { db } = require('../config/firebase');
const {
  createNotification,
  notifyBranch,
  notifyAdmins
} = require('../services/notificationService');
const { ID_PREFIXES } = require('../utils/idGenerator');
const { createSubmittedRequirementsRecord } = require('./submittedRequirementsController');
const { logFromRequest } = require('../services/operatorLoggerService');

const COLLECTIONS = {
  INQUIRIES: 'inquiries',
  QUOTATIONS: 'quotations',
  SERVICES: 'services',
  FORM_SCHEMAS: 'formSchemas',
  USERS: 'users',
  SUBMITTED_REQUIREMENTS: 'submitted_requirements'
};

const DEFAULT_INQUIRY_SCHEMA = {
  id: 'inquiry_default_v1',
  version: 1,
  title: 'FairFly Service Inquiry Intake Form',
  sections: [
    {
      id: 'client_info',
      title: 'Client Information',
      fields: [
        { id: 'clientName', label: 'Name of Client/Company', type: 'text', required: true, placeholder: 'e.g. Acme Corp' },
        { id: 'contactPerson', label: 'Contact Person', type: 'text', required: false, placeholder: 'e.g. Juan Dela Cruz' },
        { id: 'cellphone', label: 'Cellphone No.', type: 'tel', required: true, placeholder: '+63 912 345 6789' },
        { id: 'email', label: 'E-mail Address', type: 'email', required: false, placeholder: 'client@example.com' },
        { id: 'address', label: 'Address', type: 'text', required: true, placeholder: 'Complete address' },
        { id: 'telNo', label: 'Tel No.', type: 'text', required: false, placeholder: 'Telephone number' },
        { id: 'population', label: 'Population / Pax Count', type: 'text', required: false, placeholder: 'Number of persons/seats' },
        { id: 'contractNo', label: 'Contract No.', type: 'text', required: false, placeholder: 'Contract reference' },
        { id: 'isNo', label: 'I.S. No.', type: 'text', required: false, placeholder: 'I.S. reference' },
        { id: 'dateInquired', label: 'Date Inquired', type: 'date', required: true }
      ]
    },
    {
      id: 'signatures',
      title: 'Signatures & Authorizations',
      fields: [
        { id: 'agentName', label: 'Agent Name', type: 'text', required: true, placeholder: 'Agent / Operator Name' },
        { id: 'agentSignature', label: 'Agent Signature', type: 'text', required: false, placeholder: 'Digital signature / initials' },
        { id: 'acknowledgedBy', label: 'Acknowledged By', type: 'text', required: false, placeholder: 'Supervisor / Manager name' },
        { id: 'acknowledgedSignature', label: 'Supervisor Signature', type: 'text', required: false, placeholder: 'Digital signature' }
      ]
    }
  ]
};

/**
 * Submit a new client inquiry
 */
const createInquiry = async (req, res) => {
  try {
    const { 
      clientType,
      companyName,
      firstName,
      middleInitial,
      lastName,
      contactPersonFirstName,
      contactPersonMiddleInitial,
      contactPersonLastName,
      fullName,
      clientName,
      contactPerson,
      email, 
      phoneNumber,
      cellphone,
      telNo,
      address,
      population,
      contractNo,
      isNo,
      dateInquired,
      serviceId,
      serviceType, 
      servicePrice,
      servicesOffered,
      specifiedRequirements,
      requirements,
      notes, 
      remarks,
      clientRemarks,
      agentName,
      agentSignature,
      acknowledgedBy,
      acknowledgedSignature,
      branchUid,
      branchName,
      formNo, 
      controlNo,
      customFields,
      clientUid,
      status
    } = req.body;

    const isCompany = clientType === 'company';
    const contactParts = [contactPersonFirstName, contactPersonMiddleInitial, contactPersonLastName]
      .filter(Boolean)
      .map(s => String(s).trim())
      .filter(Boolean)
      .join(' ');
    const indivParts = [firstName, middleInitial, lastName]
      .filter(Boolean)
      .map(s => String(s).trim())
      .filter(Boolean)
      .join(' ');

    let resolvedName = '';
    let resolvedContactPerson = '';

    if (isCompany) {
      resolvedName = (companyName || clientName || fullName || '').trim();
      resolvedContactPerson = (contactPerson || contactParts || '').trim();
    } else {
      resolvedName = (clientName || fullName || indivParts || '').trim();
      resolvedContactPerson = (contactPerson || resolvedName).trim();
    }

    const resolvedPhone = (phoneNumber || cellphone || '').trim();
    const resolvedEmail = (email || '').trim().toLowerCase();

    if (!resolvedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      return res.status(400).json({ error: 'A valid email address is mandatory for all inquiries.' });
    }

    if (!resolvedName) {
      return res.status(400).json({ error: (isCompany ? 'Company name' : 'Client name') + ' is required.' });
    }

    if (!resolvedPhone) {
      return res.status(400).json({ error: 'Cellphone / contact number is required.' });
    }

    const now = new Date().toISOString();
    const userRole = req.userDetails?.role;
    const isStaff = userRole === 'operator' || userRole === 'branch_operator' || userRole === 'admin';
    const isOperatorUser = userRole === 'operator' || userRole === 'branch_operator';
    let effectiveBranchUid = branchUid || req.userDetails?.branchUid || (isOperatorUser ? req.user?.uid : null);
    let effectiveBranchName = branchName || req.userDetails?.branchName || null;

    if (effectiveBranchUid && !effectiveBranchName) {
      try {
        const branchUser = await getFromDatabase(`users/${effectiveBranchUid}`);
        if (branchUser) {
          effectiveBranchName = branchUser.branchName || branchUser.name || 'Branch Office';
        }
      } catch (err) {}
    }
    effectiveBranchName = effectiveBranchName || 'Branch Office';

    // Derive effectiveClientUid securely:
    // If an authenticated client is submitting their own inquiry, bind directly to their UID.
    // If staff (operator/admin) is recording a walk-in intake, DO NOT bind to staff UID.
    // Look up client by email to link to their genuine registered account.
    let effectiveClientUid = null;
    if (!isStaff && userRole === 'client') {
      effectiveClientUid = req.user?.uid || null;
    } else {
      // 1. If clientUid was provided and does not match the staff member's own UID, verify it exists as a client
      if (clientUid && clientUid !== req.user?.uid) {
        try {
          const clientDoc = await getFromDatabase(`${COLLECTIONS.USERS}/${clientUid}`);
          if (clientDoc && clientDoc.role === 'client') {
            effectiveClientUid = clientUid;
          }
        } catch (cErr) {
          console.warn('[Inquiry] Error verifying provided clientUid:', cErr.message);
        }
      }

      // 2. Authoritative server-side lookup: Match client by registered email if still unresolved
      if (!effectiveClientUid && resolvedEmail) {
        try {
          const normalizedEmail = resolvedEmail.toLowerCase();
          const clientSnap = await db.collection(COLLECTIONS.USERS)
            .where('email', '==', normalizedEmail)
            .where('role', '==', 'client')
            .limit(1)
            .get();

          if (!clientSnap.empty) {
            effectiveClientUid = clientSnap.docs[0].id;
          } else if (resolvedEmail !== normalizedEmail) {
            const rawSnap = await db.collection(COLLECTIONS.USERS)
              .where('email', '==', resolvedEmail)
              .where('role', '==', 'client')
              .limit(1)
              .get();
            if (!rawSnap.empty) {
              effectiveClientUid = rawSnap.docs[0].id;
            }
          }
        } catch (lookupErr) {
          console.warn('[Inquiry] Error looking up client account by email:', lookupErr.message);
        }
      }
    }

    // Resolve services offered array
    let resolvedServices = [];
    if (Array.isArray(servicesOffered) && servicesOffered.length > 0) {
      resolvedServices = servicesOffered;
    } else if (serviceType) {
      resolvedServices = [serviceType];
    } else {
      resolvedServices = ['General Inquiry'];
    }

    // Resolve client's specified requirements (What does the client want from the service?)
    const resolvedSpecReqs = typeof specifiedRequirements === 'string'
      ? specifiedRequirements.trim()
      : (typeof requirements === 'string' ? requirements.trim() : (notes || ''));

    // Resolve actual document requirements submitted by client (e.g. file attachments or required checklist items)
    // Note: "Specified Requirements of Client" is what the client wants from the agency, NOT an agency document requirement.
    let rawReqsArray = [];
    if (Array.isArray(requirements) && requirements.length > 0) {
      rawReqsArray = requirements;
    } else if (Array.isArray(req.body.submittedRequirements) && req.body.submittedRequirements.length > 0) {
      rawReqsArray = req.body.submittedRequirements;
    }

    // Never add or treat "Specified Requirements of Client" as a document requirement
    rawReqsArray = rawReqsArray.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });

    let effectiveSubmittedReqId = req.body.submittedRequirementsId || null;
    if (rawReqsArray.length > 0) {
      try {
        effectiveSubmittedReqId = await createSubmittedRequirementsRecord({
          submittedBy: effectiveClientUid || req.user?.uid || null,
          requirements: rawReqsArray
        });
      } catch (err) {
        console.warn('[Inquiry] Could not create submitted_requirements document:', err.message);
      }
    }

    // Workflow determination:
    // When submitted through client portal (or !isStaff), it strictly defaults to online workflow.
    // Staff/operator can record a walk-in intake with isWalkIn === true.
    const isWalkIn = isStaff ? (req.body.isWalkIn === true) : false;
    const workflow = isWalkIn ? 'walk_in' : 'online';

    const newInquiry = {
      clientUid: effectiveClientUid,
      isWalkIn: isWalkIn,
      workflow: workflow,
      clientType: isCompany ? 'company' : 'individual',
      companyName: isCompany ? (companyName || resolvedName).trim() : '',
      clientName: resolvedName.trim(),
      firstName: (firstName || contactPersonFirstName || '').trim(),
      middleInitial: (middleInitial || contactPersonMiddleInitial || '').trim(),
      lastName: (lastName || contactPersonLastName || '').trim(),
      contactPerson: (resolvedContactPerson || resolvedName).trim(),
      contactPersonFirstName: (contactPersonFirstName || firstName || '').trim(),
      contactPersonMiddleInitial: (contactPersonMiddleInitial || middleInitial || '').trim(),
      contactPersonLastName: (contactPersonLastName || lastName || '').trim(),
      email: resolvedEmail,
      phoneNumber: resolvedPhone,
      telNo: telNo || '',
      address: address || '',
      population: population || '',
      contractNo: contractNo || '',
      isNo: isNo || '',
      dateInquired: dateInquired || now.split('T')[0],
      serviceId: serviceId || null,
      serviceType: serviceType || resolvedServices[0] || 'General Inquiry',
      servicesOffered: resolvedServices,
      servicePrice: servicePrice || '',
      specifiedRequirements: resolvedSpecReqs,
      submittedRequirementsId: effectiveSubmittedReqId,
      notes: notes || remarks || clientRemarks || resolvedSpecReqs || '',
      remarks: remarks || clientRemarks || '',
      clientRemarks: clientRemarks || remarks || '',
      agentName: agentName || (isOperatorUser ? req.userDetails?.name : 'Online Intake'),
      agentSignature: agentSignature || '',
      agentContact: req.userDetails?.phone || req.userDetails?.phoneNumber || '',
      acknowledgedBy: acknowledgedBy || '',
      acknowledgedSignature: acknowledgedSignature || '',
      branchUid: effectiveBranchUid,
      branchName: effectiveBranchName,
      formNo: formNo || 'SAF-01-002',
      controlNo: controlNo || `23-${Math.floor(100 + Math.random() * 900)}`,
      customFields: customFields || {},
      status: status || 'submitted',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      createdAt: now,
      updatedAt: now,
      operatorId: effectiveBranchUid || (isOperatorUser ? req.user?.uid : 'system_intake'),
      confirmedQuotationId: null,
      confirmedActiveServiceId: null
    };

    const docId = await addToDatabase(COLLECTIONS.INQUIRIES, newInquiry, ID_PREFIXES.INQUIRY);



    // 1. Notify Assigned Branch Operator(s)
    notifyBranch({
      branchUid: effectiveBranchUid,
      branchName: effectiveBranchName,
      title: 'New Client Inquiry Intake',
      message: `${resolvedName} submitted an inquiry for ${newInquiry.serviceType} (Form: ${newInquiry.formNo}, Control No: ${newInquiry.controlNo})`,
      type: 'inquiry',
      link: '/operator/inquiry-forms',
      metadata: { inquiryId: docId, controlNo: newInquiry.controlNo, clientName: resolvedName }
    }).catch(err => console.warn('Branch operator inquiry notification warning:', err.message));

    // 2. Notify Admins
    notifyAdmins({
      title: 'New Client Inquiry Intake',
      message: `${resolvedName} submitted inquiry for branch "${effectiveBranchName}" (${newInquiry.serviceType})`,
      type: 'inquiry',
      link: '/admin/inquiry-history',
      metadata: { inquiryId: docId, branchName: effectiveBranchName }
    }).catch(err => console.warn('Admin inquiry notification warning:', err.message));

    // 3. Receipt notification for Client (if registered)
    if (effectiveClientUid) {
      createNotification({
        recipientUid: effectiveClientUid,
        recipientRole: 'client',
        title: 'Inquiry Received',
        message: `Your inquiry for ${newInquiry.serviceType} has been received by ${effectiveBranchName}. Our operators are reviewing your specifications.`,
        type: 'inquiry',
        link: '/client/tracking',
        metadata: { inquiryId: docId, controlNo: newInquiry.controlNo }
      }).catch(err => console.warn('Client inquiry receipt notification warning:', err.message));
    }

    await logFromRequest(req, {
      action: 'CREATE_INQUIRY',
      entityType: 'inquiry',
      entityId: docId,
      description: `Recorded Walk-in Inquiry (${newInquiry.controlNo || newInquiry.formNo}) for ${resolvedName} (${newInquiry.serviceType})`,
      metadata: { controlNo: newInquiry.controlNo, clientName: resolvedName, serviceType: newInquiry.serviceType }
    });

    return res.status(201).json({ id: docId, ...newInquiry, message: 'Inquiry form created successfully' });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List inquiries with optional branch & status filtering
 */
const getInquiries = async (req, res) => {
  try {
    const { status, branchUid, clientUid, limit, archived } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    // If client user is calling, restrict to their own inquiries
    if (req.userDetails?.role === 'client') {
      options.filters.push({ field: 'clientUid', operator: '==', value: req.user.uid });
    } else if (clientUid) {
      options.filters.push({ field: 'clientUid', operator: '==', value: clientUid });
    }

    // If operator user is calling, restrict to their branch inquiries
    if (req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator') {
      options.filters.push({ field: 'branchUid', operator: '==', value: req.userDetails?.branchUid || req.user.uid });
    } else if (branchUid && branchUid !== 'all') {
      options.filters.push({ field: 'branchUid', operator: '==', value: branchUid });
    }

    // Archive visibility filtering
    if (archived === 'true') {
      options.filters.push({ field: 'archived', operator: '==', value: true });
    } else if (archived !== 'all') {
      options.filters.push({ field: 'archived', operator: '==', value: false });
    }

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.INQUIRIES, options);
    const normalizedResults = results.map(inq => {
      const clientName = inq.clientName || inq.fullName || '';
      const phoneNumber = inq.phoneNumber || inq.cellphone || '';
      return {
        ...inq,
        clientName,
        phoneNumber,
        fullName: clientName,
        cellphone: phoneNumber,
        archived: inq.archived === true,
        archivedAt: inq.archivedAt || null,
        archivedBy: inq.archivedBy || null,
        archivedReason: inq.archivedReason || null
      };
    });
    return res.status(200).json(normalizedResults);
  } catch (error) {
    console.error('Error listing inquiries:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get inquiry by ID
 */
const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });

    const inquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${id}`);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const userRole = req.userDetails?.role;
    const isOwnerClient = userRole === 'client' && inquiry.clientUid === req.user?.uid;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((inquiry.branchUid && inquiry.branchUid === req.user?.uid) || (inquiry.operatorId && inquiry.operatorId === req.user?.uid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp && !isOwnerClient) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this inquiry.' });
    }

    const clientName = inquiry.clientName || inquiry.fullName || '';
    const phoneNumber = inquiry.phoneNumber || inquiry.cellphone || '';

    return res.status(200).json({
      id,
      ...inquiry,
      clientName,
      phoneNumber,
      fullName: clientName,
      cellphone: phoneNumber
    });
  } catch (error) {
    console.error('Error getting inquiry by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update an inquiry
 */
const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Inquiry not found' });

    const userRole = req.userDetails?.role;
    const isOwnerClient = userRole === 'client' && existing.clientUid === req.user?.uid;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((existing.branchUid && existing.branchUid === req.user?.uid) || (existing.operatorId && existing.operatorId === req.user?.uid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp && !isOwnerClient) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this inquiry.' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Normalize duplicate contact fields to canonical keys
    if (updateData.fullName) {
      if (!updateData.clientName) updateData.clientName = updateData.fullName;
      delete updateData.fullName;
    }
    if (updateData.cellphone) {
      if (!updateData.phoneNumber) updateData.phoneNumber = updateData.cellphone;
      delete updateData.cellphone;
    }

    await updateToDatabase(dbPath, updateData);
    return res.status(200).json({ message: 'Inquiry updated successfully' });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Archive an inquiry and cascadingly archive all associated quotations
 */
const archiveInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Inquiry not found' });

    const userRole = req.userDetails?.role;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((existing.branchUid && existing.branchUid === req.user?.uid) ||
       (existing.operatorId && existing.operatorId === req.user?.uid) ||
       (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp) {
      return res.status(403).json({ error: 'Forbidden: Only administrators and the assigned branch operator can archive inquiries.' });
    }

    const now = new Date().toISOString();
    await updateToDatabase(dbPath, {
      archived: true,
      archivedAt: now,
      archivedBy: req.user.uid,
      archivedReason: 'user_action',
      updatedAt: now
    });

    // Asymmetric cascading archive: archive all associated quotations with reason 'inquiry_archived'
    let associatedQuotations = [];
    try {
      const quotesSnap = await db.collection(COLLECTIONS.QUOTATIONS)
        .where('inquiryId', '==', id)
        .get();

      const batch = db.batch();
      quotesSnap.docs.forEach(qDoc => {
        const qData = qDoc.data();
        if (!qData.archived) {
          batch.update(qDoc.ref, {
            archived: true,
            archivedAt: now,
            archivedBy: req.user.uid,
            archivedReason: 'inquiry_archived',
            updatedAt: now
          });
          associatedQuotations.push(qDoc.id);
        }
      });

      if (existing.confirmedQuotationId && !associatedQuotations.includes(existing.confirmedQuotationId)) {
        const confRef = db.collection(COLLECTIONS.QUOTATIONS).doc(existing.confirmedQuotationId);
        const confSnap = await confRef.get();
        if (confSnap.exists && !confSnap.data().archived) {
          batch.update(confRef, {
            archived: true,
            archivedAt: now,
            archivedBy: req.user.uid,
            archivedReason: 'inquiry_archived',
            updatedAt: now
          });
          associatedQuotations.push(existing.confirmedQuotationId);
        }
      }

      if (associatedQuotations.length > 0) {
        await batch.commit();
      }
    } catch (quoteArchiveErr) {
      console.warn('[Inquiry] Error cascading archive to quotations:', quoteArchiveErr.message);
    }

    await logFromRequest(req, {
      action: 'ARCHIVE_INQUIRY',
      entityType: 'inquiry',
      entityId: id,
      description: `Archived Inquiry (${existing.controlNo || existing.formNo || id}) and cascaded to ${associatedQuotations.length} quotation(s)`,
      metadata: { inquiryId: id, controlNo: existing.controlNo, clientName: existing.clientName, cascadedQuotations: associatedQuotations }
    });

    return res.status(200).json({
      message: 'Inquiry and associated quotations archived successfully',
      id,
      archived: true,
      cascadedQuotationsCount: associatedQuotations.length
    });
  } catch (error) {
    console.error('Error archiving inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Restore an inquiry and cascadingly restore ONLY quotations archived because of the inquiry
 */
const restoreInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Inquiry not found' });

    const userRole = req.userDetails?.role;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((existing.branchUid && existing.branchUid === req.user?.uid) ||
       (existing.operatorId && existing.operatorId === req.user?.uid) ||
       (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp) {
      return res.status(403).json({ error: 'Forbidden: Only administrators and the assigned branch operator can restore inquiries.' });
    }

    const now = new Date().toISOString();
    await updateToDatabase(dbPath, {
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      restoredAt: now,
      restoredBy: req.user.uid,
      updatedAt: now
    });

    // Cascading restore: ONLY restore quotations where archivedReason === 'inquiry_archived'
    let restoredQuotations = [];
    try {
      const quotesSnap = await db.collection(COLLECTIONS.QUOTATIONS)
        .where('inquiryId', '==', id)
        .get();

      const batch = db.batch();
      quotesSnap.docs.forEach(qDoc => {
        const qData = qDoc.data();
        if (qData.archived === true && qData.archivedReason === 'inquiry_archived') {
          batch.update(qDoc.ref, {
            archived: false,
            archivedAt: null,
            archivedBy: null,
            archivedReason: null,
            restoredAt: now,
            restoredBy: req.user.uid,
            updatedAt: now
          });
          restoredQuotations.push(qDoc.id);
        }
      });

      if (existing.confirmedQuotationId && !restoredQuotations.includes(existing.confirmedQuotationId)) {
        const confRef = db.collection(COLLECTIONS.QUOTATIONS).doc(existing.confirmedQuotationId);
        const confSnap = await confRef.get();
        if (confSnap.exists) {
          const confData = confSnap.data();
          if (confData.archived === true && confData.archivedReason === 'inquiry_archived') {
            batch.update(confRef, {
              archived: false,
              archivedAt: null,
              archivedBy: null,
              archivedReason: null,
              restoredAt: now,
              restoredBy: req.user.uid,
              updatedAt: now
            });
            restoredQuotations.push(existing.confirmedQuotationId);
          }
        }
      }

      if (restoredQuotations.length > 0) {
        await batch.commit();
      }
    } catch (quoteRestoreErr) {
      console.warn('[Inquiry] Error restoring cascaded quotations:', quoteRestoreErr.message);
    }

    await logFromRequest(req, {
      action: 'RESTORE_INQUIRY',
      entityType: 'inquiry',
      entityId: id,
      description: `Restored Inquiry (${existing.controlNo || existing.formNo || id}) and ${restoredQuotations.length} cascadingly archived quotation(s)`,
      metadata: { inquiryId: id, controlNo: existing.controlNo, clientName: existing.clientName, restoredQuotations }
    });

    return res.status(200).json({
      message: 'Inquiry restored successfully',
      id,
      archived: false,
      restoredQuotationsCount: restoredQuotations.length
    });
  } catch (error) {
    console.error('Error restoring inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Permanent deletion is disabled in favor of the archival system
 */
const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Inquiry not found' });

    const userRole = req.userDetails?.role;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((existing.branchUid && existing.branchUid === req.user?.uid) ||
       (existing.operatorId && existing.operatorId === req.user?.uid) ||
       (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp) {
      return res.status(403).json({ error: 'Forbidden: Only administrators and the assigned branch operator can manage inquiries.' });
    }

    // Permanent delete is strictly disabled
    return res.status(400).json({
      error: 'Permanent deletion of inquiries has been disabled to preserve historical business records. Please use the archive feature instead.',
      archivalRecommended: true
    });
  } catch (error) {
    console.error('Error in deleteInquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Confirm an inquiry: Validates requirement uploads, automatically creates formatted Quotation,
 * and initializes an Ongoing Active Service in the branch.
 */
const confirmInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const inquiry = await getFromDatabase(dbPath);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    if (inquiry.confirmedQuotationId || inquiry.status === 'confirmed') {
      return res.status(200).json({ 
        message: 'A quotation has already been created for this inquiry',
        quotationId: inquiry.confirmedQuotationId,
        activeServiceId: inquiry.confirmedActiveServiceId
      });
    }

    // 1. Mandatory Requirements Validation
    let requirements = Array.isArray(inquiry.requirements) ? inquiry.requirements : [];
    let resolvedReqId = inquiry.submittedRequirementsId || null;

    if (requirements.length === 0 && resolvedReqId) {
      try {
        const reqDoc = await getFromDatabase(`${COLLECTIONS.SUBMITTED_REQUIREMENTS}/${resolvedReqId}`);
        if (reqDoc && Array.isArray(reqDoc.requirements)) {
          requirements = reqDoc.requirements;
        }
      } catch (rErr) {
        console.warn('[Inquiry] Error fetching submitted_requirements in confirmInquiry:', rErr.message);
      }
    }

    // Filter out any pseudo-requirement entries ("Specified Requirements of Client" is what client wants, not an agency doc requirement)
    requirements = requirements.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });

    const missingReqs = requirements.filter((r) => {
      if (r.required !== false) {
        // Must have uploaded file URL or filled value
        const hasFile = r.file && r.file.url;
        const hasVal = typeof r.value === 'string' && r.value.trim().length > 0;
        return !hasFile && !hasVal;
      }
      return false;
    });

    if (missingReqs.length > 0) {
      const missingNames = missingReqs.map(r => r.name || r.title || 'Required Document').join(', ');
      return res.status(400).json({
        error: `Cannot confirm inquiry: Mandatory requirement(s) missing uploads: ${missingNames}`
      });
    }

    const now = new Date().toISOString();
    const branchUid = inquiry.branchUid || req.user?.uid || 'OP-ACCOUNT';
    const branchName = inquiry.branchName || req.userDetails?.branchName || 'Branch Office';

    // 2. Fetch Service details if attached
    let adminService = null;
    if (inquiry.serviceId) {
      adminService = await getFromDatabase(`${COLLECTIONS.SERVICES}/${inquiry.serviceId}`);
    }

    const serviceTitle = inquiry.serviceType || adminService?.name || 'General Service';
    const serviceFeeNum = Number(String(inquiry.servicePrice || adminService?.price || '0').replace(/[^0-9.]/g, '')) || 0;

    // 3. Format Requirements as clean bullet points for Quotation (Agency document requirements needed from client)
    const formattedReqsList = requirements.length > 0
      ? requirements.map(r => `• ${r.name || r.title || 'Requirement'}${r.file?.fileName ? ` (${r.file.fileName})` : ''}`).join('\n')
      : (adminService?.requirements
          ? (Array.isArray(adminService.requirements)
              ? adminService.requirements.map(r => `• ${typeof r === 'string' ? r : (r.name || r.title || 'Requirement')}`).join('\n')
              : String(adminService.requirements))
          : '- Valid Government Issued ID\n- Completed Application Form');

    const effectiveQuoteReqId = requirements.length > 0 ? resolvedReqId : null;

    if (!effectiveQuoteReqId && requirements.length > 0) {
      try {
        const createdReqId = await createSubmittedRequirementsRecord({
          submittedBy: inquiry.clientUid || req.user?.uid,
          requirements: requirements
        });
        await updateToDatabase(dbPath, {
          submittedRequirementsId: createdReqId
        });
      } catch (err) {
        console.warn('[Inquiry] Could not auto-create submitted_requirements in confirm:', err.message);
      }
    }

    // 4. Auto-create Quotation in quotations collection
    const quoteNo = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const quotationPayload = {
      clientUid: inquiry.clientUid || null,
      clientName: inquiry.clientName || inquiry.fullName,
      contactPerson: inquiry.contactPerson || inquiry.clientName || inquiry.fullName,
      clientEmail: inquiry.email || '',
      clientPhone: inquiry.phoneNumber || inquiry.cellphone || '',
      serviceId: inquiry.serviceId || null,
      serviceTitle: serviceTitle,
      submittedRequirementsId: effectiveQuoteReqId,
      tourDates: inquiry.dateInquired || now.split('T')[0],
      inclusions: adminService?.description ? `- Standard ${serviceTitle} inclusions` : '- Standard package inclusions',
      exclusions: '- Toll fees, personal expenses, and incidental items',
      rate: serviceFeeNum,
      taxAmount: 0,
      totalAmount: serviceFeeNum,
      rateBreakdown: serviceFeeNum > 0 ? `Php ${serviceFeeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Standard Rate',
      preparedByName: inquiry.agentName || req.userDetails?.name || 'Emmanuel Manlapig',
      preparedByTitle: req.userDetails?.role === 'admin' ? 'Business Head' : 'Branch Operator',
      preparedByContact: inquiry.agentContact || req.userDetails?.phone || '0997 4763844',
      preparedBy: inquiry.agentName || req.userDetails?.name || 'Operator',
      remarks: `- Initial payment upon confirmation\n- Reference Inquiry Form No: ${inquiry.formNo || 'N/A'}`,
      operatorRemarks: `- Initial payment upon confirmation\n- Reference Inquiry Form No: ${inquiry.formNo || 'N/A'}`,
      clientRemarks: inquiry.remarks || inquiry.clientRemarks || inquiry.notes || '',
      quotationDate: now.split('T')[0],
      branchUid: branchUid,
      branchName: branchName,
      inquiryId: id,
      quoteNo: quoteNo,
      status: 'Draft',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      operatorId: branchUid
    };

    const quotationDocId = await addToDatabase(COLLECTIONS.QUOTATIONS, quotationPayload, ID_PREFIXES.QUOTATION);

    await updateToDatabase(dbPath, {
      status: 'quotation_created',
      confirmedAt: now,
      confirmedQuotationId: quotationDocId,
      confirmedActiveServiceId: null,
      submittedRequirementsId: resolvedReqId,
      updatedAt: now
    });

    // Notify Client of confirmation and quotation readiness
    if (inquiry.clientUid) {
      createNotification({
        recipientUid: inquiry.clientUid,
        recipientRole: 'client',
        title: 'Inquiry Reviewed & Quotation Ready',
        message: `Your inquiry (${inquiry.formNo || inquiry.controlNo}) has been confirmed by ${branchName}. Quotation ${quoteNo} is ready for your review.`,
        type: 'quotation',
        link: '/client/tracking',
        metadata: { inquiryId: id, quotationId: quotationDocId }
      }).catch(err => console.warn('Client inquiry confirmation notification warning:', err.message));
    }

    // Notify Admins of confirmation
    notifyAdmins({
      title: 'Inquiry Confirmed by Branch',
      message: `${branchName} reviewed the inquiry for ${inquiry.clientName || inquiry.fullName} and generated Quotation ${quoteNo}.`,
      type: 'inquiry',
      link: '/admin/inquiry-history',
      metadata: { inquiryId: id, quotationId: quotationDocId, branchName }
    }).catch(err => console.warn('Admin inquiry confirm notification warning:', err.message));

    await logFromRequest(req, {
      action: 'CONFIRM_INQUIRY',
      entityType: 'inquiry',
      entityId: id,
      description: `Confirmed Inquiry (${inquiry.controlNo || inquiry.formNo || id}) for ${inquiry.clientName || inquiry.fullName || 'Client'} and generated Quotation ${quoteNo}`,
      metadata: { inquiryId: id, controlNo: inquiry.controlNo, quotationId: quotationDocId, quoteNo }
    });

    return res.status(200).json({
      message: 'Inquiry confirmed successfully. Quotation created and ready for client approval.',
      quotationId: quotationDocId
    });
  } catch (error) {
    console.error('Error confirming inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get Dynamic Form Schema for Inquiry Form
 */
const getInquirySchema = async (req, res) => {
  try {
    const schema = await getFromDatabase(`${COLLECTIONS.FORM_SCHEMAS}/inquiry`);
    if (!schema) {
      return res.status(200).json(DEFAULT_INQUIRY_SCHEMA);
    }
    return res.status(200).json(schema);
  } catch (error) {
    console.error('Error getting inquiry schema:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Save / Update Dynamic Form Schema for Inquiry Form (Admin only)
 */
const saveInquirySchema = async (req, res) => {
  try {
    const { sections, title } = req.body;
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: 'sections array is required' });
    }

    const updatedSchema = {
      id: 'inquiry_schema',
      title: title || 'FairFly Service Inquiry Intake Form',
      sections,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'admin'
    };

    await updateToDatabase(`${COLLECTIONS.FORM_SCHEMAS}/inquiry`, updatedSchema);
    return res.status(200).json({ message: 'Inquiry form schema saved successfully', schema: updatedSchema });
  } catch (error) {
    console.error('Error saving inquiry schema:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Attach a catalog service to an inquiry
 * POST /api/inquiries/:id/attach-service
 * 
 * Rules:
 * - Operator / Admin only
 * - Operator can only modify inquiries belonging to their branch
 * - If isWalkIn === true:
 *   Service is attached for walk-in client; operator completes requirements on site during quotation creation.
 * - If online client (isWalkIn === false):
 *   Inquiry transitions to 'pending_requirements', requirements schema is attached, and client is notified to submit.
 */
const attachServiceToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId, isWalkIn: bodyIsWalkIn } = req.body;

    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });
    if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const inquiry = await getFromDatabase(dbPath);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    // Authorization: Assigned operator or Admin
    const userRole = req.userDetails?.role;
    const isAssignedOp = (userRole === 'operator' || userRole === 'branch_operator') &&
      ((inquiry.branchUid && inquiry.branchUid === req.user?.uid) || (inquiry.operatorId && inquiry.operatorId === req.user?.uid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to attach a service to this inquiry.' });
    }

    if (inquiry.confirmedQuotationId || inquiry.status === 'confirmed' || inquiry.status === 'paid') {
      return res.status(400).json({ error: 'Cannot attach service: Quotation or service order has already been finalized.' });
    }

    // Fetch the target service from catalog
    const serviceDoc = await getFromDatabase(`${COLLECTIONS.SERVICES}/${serviceId}`);
    if (!serviceDoc) {
      return res.status(404).json({ error: 'Service catalog item not found.' });
    }

    if (!Array.isArray(serviceDoc.workflowIds) || serviceDoc.workflowIds.length === 0) {
      return res.status(400).json({ error: 'Cannot attach service: This service has no operational workflow configured.' });
    }

    // Extract requirements schema from the service
    let serviceReqs = Array.isArray(serviceDoc.requirements)
      ? serviceDoc.requirements
      : (Array.isArray(serviceDoc.actions) ? serviceDoc.actions : []);

    // Filter out pseudo-requirements
    serviceReqs = serviceReqs.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });

    const now = new Date().toISOString();
    const servicePrice = serviceDoc.price || (serviceDoc.baseFee ? String(serviceDoc.baseFee) : '');
    const serviceTitle = serviceDoc.name || 'Custom Service';
    const isWalkIn = req.body.isWalkIn !== undefined ? Boolean(req.body.isWalkIn) : Boolean(inquiry.isWalkIn);

    const updates = {
      serviceId: serviceDoc.id,
      serviceType: serviceTitle,
      servicesOffered: [serviceTitle],
      servicePrice: servicePrice,
      status: 'submitted',
      isWalkIn: isWalkIn,
      workflow: isWalkIn ? 'walk_in' : 'online',
      serviceAttachedAt: now,
      serviceAttachedBy: req.user.uid,
      updatedAt: now
    };

    await updateToDatabase(dbPath, updates);

    if (!isWalkIn && inquiry.clientUid) {
      createNotification({
        recipientUid: inquiry.clientUid,
        recipientRole: 'client',
        title: 'Service Selected for Your Inquiry',
        message: `The branch operator has assigned "${serviceTitle}" to your inquiry (${inquiry.controlNo || inquiry.formNo || id}). We are now preparing your official quotation.`,
        type: 'inquiry',
        link: '/client/tracking',
        metadata: { inquiryId: id, serviceId: serviceDoc.id, status: 'submitted' }
      }).catch(err => console.warn('[Inquiry] Notification error for service attached:', err.message));
    }

    await logFromRequest(req, {
      action: 'ATTACH_SERVICE_INQUIRY',
      entityType: 'inquiry',
      entityId: id,
      description: `Configured Service "${serviceTitle}" (${isWalkIn ? 'Walk-in' : 'Online'} Workflow) for Inquiry (${inquiry.controlNo || inquiry.formNo || id}) - ${inquiry.clientName || inquiry.fullName || 'Client'}`,
      metadata: { inquiryId: id, serviceId: serviceDoc.id, serviceTitle, isWalkIn: Boolean(isWalkIn), status: 'submitted' }
    });

    return res.status(200).json({
      success: true,
      isWalkIn: Boolean(isWalkIn),
      workflow: isWalkIn ? 'walk_in' : 'online',
      status: 'submitted',
      message: `Service "${serviceTitle}" attached. Inquiry ready for quotation preparation.`,
      service: {
        id: serviceDoc.id,
        name: serviceTitle,
        price: servicePrice
      }
    });
  } catch (error) {
    console.error('Error attaching service to inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Client submits service requirements for an inquiry in pending_requirements status
 * POST /api/inquiries/:id/submit-requirements
 * 
 * Rules:
 * - Client authentication required
 * - Client must own the inquiry (IDOR protection)
 * - Inquiry must be in 'pending_requirements' (or 'submitted')
 * - Mandatory requirements must be satisfied (file uploaded or text entered)
 * - Atomically stores requirements in submitted_requirements collection and transitions inquiry back to operator queue ('submitted')
 */
const submitInquiryRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    const { requirements } = req.body;

    if (!id) return res.status(400).json({ error: 'Inquiry ID is required' });
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({ error: 'requirements array is required' });
    }

    const dbPath = `${COLLECTIONS.INQUIRIES}/${id}`;
    const inquiry = await getFromDatabase(dbPath);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    // IDOR verification: Client must own this inquiry
    if (inquiry.clientUid && inquiry.clientUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to submit requirements for this inquiry.' });
    }

    if (inquiry.confirmedQuotationId || inquiry.status === 'confirmed' || inquiry.status === 'paid') {
      return res.status(400).json({ error: 'Cannot modify requirements for an inquiry that already has a quotation or active service.' });
    }

    // Filter out pseudo-requirements
    const cleanReqs = requirements.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });

    // Validate mandatory requirements
    const missingReqs = cleanReqs.filter((r) => {
      if (r.required !== false) {
        const hasFile = r.file && r.file.url;
        const hasVal = typeof r.value === 'string' && r.value.trim().length > 0;
        return !hasFile && !hasVal;
      }
      return false;
    });

    if (missingReqs.length > 0) {
      const missingNames = missingReqs.map(r => r.name || r.title || 'Required Document').join(', ');
      return res.status(400).json({
        error: `Incomplete submission: Mandatory requirement(s) missing uploads or values: ${missingNames}`
      });
    }

    const now = new Date().toISOString();

    // Persist in submitted_requirements collection
    const createdReqId = await createSubmittedRequirementsRecord({
      submittedBy: req.user.uid,
      requirements: cleanReqs
    });

    // Transition inquiry back to operator processing queue ('submitted')
    const inquiryUpdates = {
      status: 'submitted',
      submittedRequirementsId: createdReqId,
      requirements: cleanReqs,
      requirementsSubmittedAt: now,
      updatedAt: now
    };

    await updateToDatabase(dbPath, inquiryUpdates);

    // Notify Branch Operator that requirements have been submitted
    if (inquiry.branchUid || inquiry.operatorId) {
      notifyBranch({
        branchUid: inquiry.branchUid || inquiry.operatorId,
        branchName: inquiry.branchName || 'Branch Office',
        title: 'Requirements Submitted by Client',
        message: `${inquiry.clientName || 'Client'} has submitted the required documents for inquiry ${inquiry.controlNo || inquiry.formNo || id} (${inquiry.serviceType || 'Custom Service'}). Ready for quotation preparation.`,
        type: 'inquiry',
        link: '/operator/inquiry-forms',
        metadata: { inquiryId: id, controlNo: inquiry.controlNo, status: 'submitted' }
      }).catch(err => console.warn('[Inquiry] Operator notification error for submitted requirements:', err.message));
    }

    return res.status(200).json({
      success: true,
      status: 'submitted',
      submittedRequirementsId: createdReqId,
      message: 'Requirements submitted successfully! Your inquiry is now with our operators for quotation preparation.'
    });
  } catch (error) {
    console.error('Error in submitInquiryRequirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  archiveInquiry,
  restoreInquiry,
  confirmInquiry,
  getInquirySchema,
  saveInquirySchema,
  attachServiceToInquiry,
  submitInquiryRequirements
};
