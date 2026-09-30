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

    const resolvedName = fullName || clientName;
    const resolvedPhone = (phoneNumber || cellphone || '').trim();
    const resolvedEmail = (email || '').trim();

    if (!resolvedName || (!resolvedPhone && !resolvedEmail)) {
      return res.status(400).json({ error: 'Client name and at least one contact method are required' });
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

    // Resolve client's specified requirements (What does the client want?)
    const resolvedSpecReqs = typeof specifiedRequirements === 'string'
      ? specifiedRequirements.trim()
      : (typeof requirements === 'string' ? requirements.trim() : (notes || ''));

    const rawReqsArray = Array.isArray(requirements) && requirements.length > 0
      ? requirements
      : (Array.isArray(req.body.submittedRequirements) && req.body.submittedRequirements.length > 0
        ? req.body.submittedRequirements
        : (resolvedSpecReqs ? [{ name: 'Specified Requirements of Client', value: resolvedSpecReqs, required: false }] : []));

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

    const newInquiry = {
      clientUid: effectiveClientUid,
      clientName: resolvedName.trim(),
      contactPerson: (contactPerson || '').trim(),
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
      notes: notes || remarks || resolvedSpecReqs || '',
      remarks: remarks || '',
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
    const { status, branchUid, clientUid, limit } = req.query;
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
      options.filters.push({ field: 'branchUid', operator: '==', value: req.user.uid });
    } else if (branchUid && branchUid !== 'all') {
      options.filters.push({ field: 'branchUid', operator: '==', value: branchUid });
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
        cellphone: phoneNumber
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
 * Delete an inquiry
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
      ((existing.branchUid && existing.branchUid === req.user?.uid) || (existing.operatorId && existing.operatorId === req.user?.uid));
    const isAdmin = userRole === 'admin';

    if (!isAdmin && !isAssignedOp) {
      return res.status(403).json({ error: 'Forbidden: Only administrators and the assigned branch operator can delete inquiries.' });
    }

    await deleteFromDatabase(dbPath);
    return res.status(200).json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
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

    // 3. Format Requirements as clean bullet points for Quotation
    const formattedReqsList = requirements.length > 0
      ? requirements.map(r => `• ${r.name || r.title || 'Requirement'}${r.file?.fileName ? ` (${r.file.fileName})` : ''}`).join('\n')
      : inquiry.notes || 'Standard Client Requirements';

    if (!resolvedReqId && requirements.length > 0) {
      try {
        resolvedReqId = await createSubmittedRequirementsRecord({
          submittedBy: inquiry.clientUid || req.user?.uid,
          requirements: requirements
        });
        await updateToDatabase(dbPath, {
          submittedRequirementsId: resolvedReqId
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
      submittedRequirementsId: resolvedReqId,
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
      quotationDate: now.split('T')[0],
      branchUid: branchUid,
      branchName: branchName,
      inquiryId: id,
      quoteNo: quoteNo,
      status: 'Draft',
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

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  confirmInquiry,
  getInquirySchema,
  saveInquirySchema
};
