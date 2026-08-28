const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { compileWorkflowStepsForService } = require('./activeServiceController');

const COLLECTIONS = {
  INQUIRIES: 'inquiries',
  QUOTATIONS: 'quotations',
  ACTIVE_SERVICES: 'activeServices',
  SERVICES: 'services',
  FORM_SCHEMAS: 'formSchemas'
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
      customFields
    } = req.body;

    const resolvedName = fullName || clientName;
    const resolvedPhone = phoneNumber || cellphone;

    if (!resolvedName || !resolvedPhone) {
      return res.status(400).json({ error: 'Client full name and phone/cellphone number are required' });
    }

    const now = new Date().toISOString();
    const effectiveBranchUid = branchUid || req.userDetails?.branchUid || req.user?.uid || null;
    const effectiveBranchName = branchName || req.userDetails?.branchName || req.userDetails?.name || 'Branch Office';

    const newInquiry = {
      fullName: resolvedName.trim(),
      clientName: resolvedName.trim(),
      contactPerson: (contactPerson || '').trim(),
      email: email ? email.trim() : '',
      phoneNumber: resolvedPhone.trim(),
      cellphone: resolvedPhone.trim(),
      telNo: telNo || '',
      address: address || '',
      population: population || '',
      contractNo: contractNo || '',
      isNo: isNo || '',
      dateInquired: dateInquired || now.split('T')[0],
      serviceId: serviceId || null,
      serviceType: serviceType || 'General Inquiry',
      servicePrice: servicePrice || '',
      requirements: Array.isArray(requirements) ? requirements : [],
      notes: notes || remarks || '',
      remarks: remarks || notes || '',
      agentName: agentName || req.userDetails?.name || 'Operator',
      agentSignature: agentSignature || '',
      agentContact: req.userDetails?.phone || req.userDetails?.phoneNumber || '',
      acknowledgedBy: acknowledgedBy || '',
      acknowledgedSignature: acknowledgedSignature || '',
      branchUid: effectiveBranchUid,
      branchName: effectiveBranchName,
      formNo: formNo || `SAF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      controlNo: controlNo || `CTRL-${Math.floor(1000 + Math.random() * 9000)}`,
      customFields: customFields || {},
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      operatorId: req.user?.uid || 'operator_admin',
      confirmedQuotationId: null,
      confirmedActiveServiceId: null
    };

    const docId = await addToDatabase(COLLECTIONS.INQUIRIES, newInquiry);
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
    const { status, branchUid, limit } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (branchUid && branchUid !== 'all') {
      options.filters.push({ field: 'branchUid', operator: '==', value: branchUid });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.INQUIRIES, options);
    return res.status(200).json(results);
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

    return res.status(200).json({ id, ...inquiry });
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

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

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

    await deleteFromDatabase(`${COLLECTIONS.INQUIRIES}/${id}`);
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

    if (inquiry.status === 'confirmed') {
      return res.status(200).json({ 
        message: 'Inquiry is already confirmed',
        quotationId: inquiry.confirmedQuotationId,
        activeServiceId: inquiry.confirmedActiveServiceId
      });
    }

    // 1. Mandatory Requirements Validation
    const requirements = Array.isArray(inquiry.requirements) ? inquiry.requirements : [];
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

    // 4. Auto-create Quotation in quotations collection
    const quoteNo = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const quotationPayload = {
      clientName: inquiry.clientName || inquiry.fullName,
      contactPerson: inquiry.contactPerson || inquiry.clientName || inquiry.fullName,
      clientEmail: inquiry.email || '',
      clientPhone: inquiry.phoneNumber || inquiry.cellphone || '',
      serviceId: inquiry.serviceId || null,
      serviceTitle: serviceTitle,
      requirements: formattedReqsList,
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

    const quotationDocId = await addToDatabase(COLLECTIONS.QUOTATIONS, quotationPayload);

    // 5. Auto-initialize Ongoing Active Service with workflow steps in activeServices collection
    const compiledSteps = await compileWorkflowStepsForService(inquiry.serviceId, serviceTitle, adminService?.workflowIds);
    const activeServicePayload = {
      clientUid: null,
      clientName: inquiry.clientName || inquiry.fullName,
      clientEmail: inquiry.email || '',
      clientPhone: inquiry.phoneNumber || inquiry.cellphone || '',
      serviceId: inquiry.serviceId || null,
      serviceUID: inquiry.serviceId || null,
      serviceType: serviceTitle,
      price: inquiry.servicePrice || adminService?.price || (serviceFeeNum > 0 ? `₱${serviceFeeNum.toLocaleString()}` : 'Standard Fee'),
      requirements: requirements,
      submittedRequirements: requirements,
      priority: 'Normal Priority',
      priorityType: 'normal',
      status: 'Pending',
      currentStepIndex: 0,
      totalSteps: compiledSteps.length,
      startedAt: now,
      completedAt: null,
      steps: compiledSteps,
      operatorId: branchUid,
      branchUid: branchUid,
      branchName: branchName,
      additionalNotes: `Initialized from Confirmed Inquiry Form: ${inquiry.formNo || id}`,
      inquiryId: id,
      quotationId: quotationDocId
    };

    const activeServiceDocId = await addToDatabase(COLLECTIONS.ACTIVE_SERVICES, activeServicePayload);

    // 6. Update Inquiry with confirmation status and cross references
    await updateToDatabase(dbPath, {
      status: 'confirmed',
      confirmedAt: now,
      confirmedQuotationId: quotationDocId,
      confirmedActiveServiceId: activeServiceDocId,
      updatedAt: now
    });

    return res.status(200).json({
      message: 'Inquiry confirmed successfully. Quotation created and Active Service initialized.',
      quotationId: quotationDocId,
      activeServiceId: activeServiceDocId
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
