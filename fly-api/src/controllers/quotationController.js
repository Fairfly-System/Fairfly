const {
  addToDatabase,
  getFromDatabase,
  queryDatabaseAdvanced,
  updateToDatabase,
  deleteFromDatabase
} = require('../services/firebaseService');
const { db } = require('../config/firebase');
const { compileWorkflowStepsForService } = require('./activeServiceController');
const {
  createNotification,
  notifyBranch,
  notifyAdmins
} = require('../services/notificationService');
const { ID_PREFIXES } = require('../utils/idGenerator');
const { createSubmittedRequirementsRecord, sanitizeRequirementsArray } = require('./submittedRequirementsController');
const { logFromRequest } = require('../services/operatorLoggerService');

const COLLECTIONS = {
  QUOTATIONS: 'quotations',
  INQUIRIES: 'inquiries',
  ACTIVE_SERVICES: 'activeServices',
  USERS: 'users',
  SUBMITTED_REQUIREMENTS: 'submitted_requirements',
  SERVICES: 'services'
};

/**
 * Create a new service quotation
 */
const createQuotation = async (req, res) => {
  try {
    const {
      clientUid,
      clientName,
      contactPerson,
      clientEmail,
      clientPhone,
      serviceId,
      serviceTitle,
      requirements,
      submittedRequirements,
      tourDates,
      inclusions,
      exclusions,
      rateBreakdown,
      rate,
      taxAmount,
      totalAmount,
      preparedByName,
      preparedByTitle,
      preparedByContact,
      preparedBy,
      remarks,
      operatorRemarks,
      clientRemarks,
      quotationDate,
      branchUid,
      branchName,
      inquiryId
    } = req.body;

    if (!clientName || (!serviceTitle && !serviceId)) {
      return res.status(400).json({ error: 'Client name and service title are required' });
    }

    const now = new Date().toISOString();
    const isOperatorUser = req.userDetails?.role === 'operator' || req.userDetails?.role === 'branch_operator';
    let effectiveBranchUid = branchUid || req.userDetails?.branchUid || (isOperatorUser ? req.user?.uid : null);
    let effectiveBranchName = branchName || req.userDetails?.branchName || null;

    // If inquiryId is provided, fetch inquiry to inherit clientUid and branchUid if missing
    let effectiveClientUid = clientUid || null;
    let linkedInquiry = null;

    if (inquiryId) {
      try {
        linkedInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${inquiryId}`);
        if (linkedInquiry) {
          if (!effectiveClientUid) {
            effectiveClientUid = linkedInquiry.clientUid || null;
          }
          if (!effectiveBranchUid) {
            effectiveBranchUid = linkedInquiry.branchUid || linkedInquiry.operatorId || null;
          }
          if (!effectiveBranchName) {
            effectiveBranchName = linkedInquiry.branchName || null;
          }
        }
      } catch (inqErr) {
        console.warn(`Could not load inquiry ${inquiryId} during quotation creation:`, inqErr);
      }
    }

    // A catalog service is strictly required for creating a quotation
    const effectiveServiceId = serviceId || linkedInquiry?.serviceId || null;
    if (!effectiveServiceId) {
      return res.status(400).json({
        error: 'Cannot create quotation: A catalog service must be linked to the inquiry before creating a quotation.'
      });
    }

    if (!effectiveBranchUid && isOperatorUser) {
      effectiveBranchUid = req.user?.uid;
    }
    if (!effectiveBranchName) {
      effectiveBranchName = req.userDetails?.branchName || req.userDetails?.name || 'Branch Office';
    }

    // Security Check: If effectiveClientUid matches the operator's/branch's UID, discard it!
    // An operator can never be the client for their own branch quotation.
    if (effectiveClientUid && (effectiveClientUid === req.user?.uid || effectiveClientUid === effectiveBranchUid)) {
      effectiveClientUid = null;
    }

    // Authoritative lookup: Link to client account by registered email if effectiveClientUid is not set
    const targetEmail = (clientEmail || linkedInquiry?.email || '').trim().toLowerCase();
    if (targetEmail) {
      try {
        const clientSnap = await db.collection(COLLECTIONS.USERS)
          .where('email', '==', targetEmail)
          .where('role', '==', 'client')
          .limit(1)
          .get();

        if (!clientSnap.empty) {
          effectiveClientUid = clientSnap.docs[0].id;
        } else {
          const rawEmail = (clientEmail || linkedInquiry?.email || '').trim();
          if (rawEmail && rawEmail !== targetEmail) {
            const rawSnap = await db.collection(COLLECTIONS.USERS)
              .where('email', '==', rawEmail)
              .where('role', '==', 'client')
              .limit(1)
              .get();
            if (!rawSnap.empty) {
              effectiveClientUid = rawSnap.docs[0].id;
            }
          }
        }
      } catch (lookupErr) {
        console.warn('[Quotation] Error looking up client account by email:', lookupErr.message);
      }
    }

    let effectiveSubmittedReqs = Array.isArray(submittedRequirements) && submittedRequirements.length > 0
      ? submittedRequirements
      : (Array.isArray(linkedInquiry?.requirements) && linkedInquiry.requirements.length > 0
        ? linkedInquiry.requirements
        : (Array.isArray(linkedInquiry?.submittedRequirements) ? linkedInquiry.submittedRequirements : []));

    // Filter out any pseudo-requirements ("Specified Requirements of Client" is what client wants, not an agency doc requirement)
    effectiveSubmittedReqs = effectiveSubmittedReqs.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
        name !== 'client specified requirements' &&
        name !== 'specified requirements of the client' &&
        name !== 'specified requirements';
    });

    let effectiveSubmittedReqId = req.body.submittedRequirementsId || null;
    if (linkedInquiry?.submittedRequirementsId && !effectiveSubmittedReqId && effectiveSubmittedReqs.length > 0) {
      effectiveSubmittedReqId = linkedInquiry.submittedRequirementsId;
    }

    // Inspect catalog service to check whether legal/document requirements apply
    let serviceHasMandatoryReqs = false;
    let cleanServiceReqs = [];
    try {
      const serviceDoc = await getFromDatabase(`${COLLECTIONS.SERVICES}/${effectiveServiceId}`);
      if (serviceDoc) {
        const serviceReqs = Array.isArray(serviceDoc.requirements)
          ? serviceDoc.requirements
          : (Array.isArray(serviceDoc.actions) ? serviceDoc.actions : []);

        cleanServiceReqs = serviceReqs.filter((r) => {
          const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
          return name !== 'specified requirements of client' &&
            name !== 'client specified requirements' &&
            name !== 'specified requirements of the client' &&
            name !== 'specified requirements';
        });

        const mandatory = cleanServiceReqs.filter(r => (typeof r === 'object' ? r.required !== false : true));
        serviceHasMandatoryReqs = mandatory.length > 0;
      }
    } catch (svcErr) {
      console.warn('[Quotation] Warning checking catalog service requirements:', svcErr.message);
    }

    // Determine initial requirement workflow status:
    // If the service has mandatory requirements, it requires client submission ('pending').
    // If requirements are provided on-site (e.g. walk-in assisted by operator) and satisfy mandatory items, mark 'submitted'.
    // If the service has 0 mandatory requirements, requirements are 'not_required'.
    let initialRequirementsStatus = serviceHasMandatoryReqs ? 'pending' : 'not_required';

    if (serviceHasMandatoryReqs && effectiveSubmittedReqs.length > 0) {
      // If effectiveSubmittedReqs is empty but we have an ID, load from database
      if (effectiveSubmittedReqs.length === 0 && effectiveSubmittedReqId) {
        try {
          const reqDoc = await getFromDatabase(`${COLLECTIONS.SUBMITTED_REQUIREMENTS}/${effectiveSubmittedReqId}`);
          if (reqDoc && Array.isArray(reqDoc.requirements)) {
            effectiveSubmittedReqs = reqDoc.requirements;
          }
        } catch (e) { }
      }

      const mandatoryServiceReqs = cleanServiceReqs.filter(r => (typeof r === 'object' ? r.required !== false : true));
      const allProvided = mandatoryServiceReqs.every(mReq => {
        const mName = (typeof mReq === 'string' ? mReq : (mReq.name || mReq.title || '')).trim().toLowerCase();
        const provided = effectiveSubmittedReqs.find(pReq => {
          const pName = (typeof pReq === 'string' ? pReq : (pReq.name || pReq.title || '')).trim().toLowerCase();
          return pName === mName;
        });
        if (!provided) return false;
        const hasFile = provided.file && (provided.file.url || provided.file.storagePath);
        const hasVal = typeof provided.value === 'string' && provided.value.trim().length > 0;
        return hasFile || hasVal;
      });

      if (allProvided) {
        initialRequirementsStatus = 'submitted';
      }
    }

    if (effectiveSubmittedReqs.length > 0 && !effectiveSubmittedReqId) {
      try {
        effectiveSubmittedReqId = await createSubmittedRequirementsRecord({
          submittedBy: effectiveClientUid || req.user?.uid,
          requirements: effectiveSubmittedReqs
        });
      } catch (err) {
        console.warn('[Quotation] Could not create submitted_requirements in createQuotation:', err.message);
      }
    }

    const newQuotation = {
      clientUid: effectiveClientUid,
      clientName: clientName.trim(),
      contactPerson: (contactPerson || '').trim(),
      clientEmail: clientEmail ? clientEmail.trim() : '',
      clientPhone: clientPhone ? clientPhone.trim() : '',
      serviceId: effectiveServiceId,
      serviceTitle: (serviceTitle || linkedInquiry?.serviceType || 'General Service').trim(),
      submittedRequirementsId: effectiveSubmittedReqId,
      requirementsStatus: initialRequirementsStatus,
      requirementsApprovedAt: null,
      requirementsApprovedBy: null,
      requirementsRejectionReason: null,
      requirementsSubmittedAt: (effectiveSubmittedReqId && initialRequirementsStatus === 'submitted') ? now : null,
      paymentStatus: 'UNPAID',
      tourDates: tourDates || '',
      inclusions: inclusions || '',
      exclusions: exclusions || '',
      rateBreakdown: rateBreakdown || '',
      rate: Number(rate) || 0,
      taxAmount: Number(taxAmount) || 0,
      totalAmount: Number(totalAmount || rate) || 0,
      preparedByName: preparedByName || preparedBy || req.userDetails?.name || 'Operator',
      preparedByTitle: preparedByTitle || req.userDetails?.title || (req.userDetails?.role === 'admin' ? 'Business Head' : 'Branch Operator'),
      preparedByContact: preparedByContact || req.userDetails?.phoneNumber || req.userDetails?.phone || '',
      preparedBy: preparedByName || preparedBy || req.userDetails?.name || 'Operator',
      remarks: (operatorRemarks !== undefined && operatorRemarks !== null ? String(operatorRemarks) : String(remarks || '')).trim(),
      operatorRemarks: (operatorRemarks !== undefined && operatorRemarks !== null ? String(operatorRemarks) : String(remarks || '')).trim(),
      clientRemarks: (clientRemarks !== undefined && clientRemarks !== null ? String(clientRemarks) : (linkedInquiry?.clientRemarks || linkedInquiry?.remarks || linkedInquiry?.notes || '')).trim(),
      quotationDate: quotationDate || now.split('T')[0],
      branchUid: effectiveBranchUid,
      branchName: effectiveBranchName,
      inquiryId: inquiryId || null,
      quoteNo: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: req.body.status || 'Sent',
      archived: false,
      archivedAt: null,
      archivedBy: null,
      archivedReason: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      activeServiceId: null,
      createdAt: now,
      updatedAt: now,
      operatorId: effectiveBranchUid || (isOperatorUser ? req.user?.uid : 'operator_admin')
    };

    const docId = await addToDatabase(COLLECTIONS.QUOTATIONS, newQuotation, ID_PREFIXES.QUOTATION);

    // If linked to an inquiry, update inquiry status to quotation_created and sync clientUid
    if (inquiryId) {
      try {
        const inquiryUpdates = {
          status: 'quotation_created',
          confirmedQuotationId: docId,
          updatedAt: now
        };
        if (effectiveSubmittedReqId) {
          inquiryUpdates.submittedRequirementsId = effectiveSubmittedReqId;
        }
        // Heal linked inquiry clientUid if it was missing or mistakenly set to operator UID
        if (effectiveClientUid && (!linkedInquiry?.clientUid || linkedInquiry.clientUid === req.user?.uid || linkedInquiry.clientUid === effectiveBranchUid)) {
          inquiryUpdates.clientUid = effectiveClientUid;
        }
        await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${inquiryId}`, inquiryUpdates);
      } catch (upInqErr) {
        console.error(`Failed to update inquiry ${inquiryId} with quotation reference:`, upInqErr);
      }
    }

    // Notify Client of new quotation
    if (effectiveClientUid) {
      createNotification({
        recipientUid: effectiveClientUid,
        recipientRole: 'client',
        title: 'New Quotation Available',
        message: `${effectiveBranchName} prepared a quotation for "${newQuotation.serviceTitle}" (${newQuotation.quoteNo}) - ${newQuotation.rateBreakdown || '₱' + newQuotation.totalAmount}`,
        type: 'quotation',
        link: '/client/tracking',
        metadata: { quotationId: docId, quoteNo: newQuotation.quoteNo }
      }).catch(err => console.warn('Client quotation notification warning:', err.message));
    }

    // Log operator activity
    await logFromRequest(req, {
      action: 'CREATE_QUOTATION',
      entityType: 'quotation',
      entityId: docId,
      description: `Created Quotation ${newQuotation.quoteNo} for Client ${newQuotation.clientName} (${newQuotation.serviceTitle} - ₱${Number(newQuotation.totalAmount).toLocaleString()})`,
      metadata: { quoteNo: newQuotation.quoteNo, clientName: newQuotation.clientName, serviceTitle: newQuotation.serviceTitle, totalAmount: newQuotation.totalAmount }
    });

    return res.status(201).json({ id: docId, ...newQuotation, message: 'Quotation created successfully' });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List quotations
 */
const getQuotations = async (req, res) => {
  try {
    const { status, branchUid, clientUid, inquiryId, limit, archived } = req.query;
    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    // If client user is calling, restrict to their own quotations
    if (req.userDetails?.role === 'client') {
      options.filters.push({ field: 'clientUid', operator: '==', value: req.user.uid });
    } else if (clientUid) {
      options.filters.push({ field: 'clientUid', operator: '==', value: clientUid });
    }

    // If operator user is calling, restrict to their branch quotations
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

    if (inquiryId) {
      options.filters.push({ field: 'inquiryId', operator: '==', value: inquiryId });
    }
    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.QUOTATIONS, options);
    const normalized = results.map(q => ({
      ...q,
      archived: q.archived === true,
      archivedAt: q.archivedAt || null,
      archivedBy: q.archivedBy || null,
      archivedReason: q.archivedReason || null,
      rejectedAt: q.rejectedAt || null,
      rejectedBy: q.rejectedBy || null,
      rejectionReason: q.rejectionReason || null
    }));
    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Error listing quotations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update quotation status (Draft, Sent, Accepted, Rejected, Cancelled)
 */
const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Quotation ID and status are required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });

    const userRole = req.userDetails?.role;
    if (userRole === 'operator' || userRole === 'branch_operator') {
      const isBranchMatch = (existing.branchUid && existing.branchUid === req.user.uid) ||
        (existing.operatorId && existing.operatorId === req.user.uid) ||
        (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid);
      if (!isBranchMatch) {
        return res.status(403).json({ error: 'Forbidden: You can only update quotations for your branch.' });
      }
    }

    if (existing.status === 'PAID' || existing.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot change status of a quotation that has already been paid and activated.' });
    }

    // Zero-Trust Verification: Prevent sending to client or accepting if requirements are not approved
    if (status === 'Sent' || status === 'Accepted') {
      const reqStatus = (existing.requirementsStatus || '').toLowerCase();
      if (reqStatus !== 'approved' && reqStatus !== 'not_required') {
        const actionVerb = status === 'Sent' ? 'send quotation to client' : 'mark quotation as accepted';
        return res.status(400).json({
          error: `Cannot ${actionVerb}: Service requirements must be verified and approved first by the branch operator.`,
          requirementsStatus: existing.requirementsStatus || 'pending'
        });
      }
    }

    const now = new Date().toISOString();
    let clientUidToNotify = existing.clientUid;

    // Self-heal: If existing quotation has no clientUid or has operator UID, look up registered client by email
    const isCorruptedClientUid = !clientUidToNotify || clientUidToNotify === req.user?.uid || clientUidToNotify === existing.branchUid || clientUidToNotify === existing.operatorId;
    if (isCorruptedClientUid && existing.clientEmail) {
      try {
        const normalizedEmail = existing.clientEmail.trim().toLowerCase();
        const clientSnap = await db.collection(COLLECTIONS.USERS)
          .where('email', '==', normalizedEmail)
          .where('role', '==', 'client')
          .limit(1)
          .get();

        if (!clientSnap.empty) {
          clientUidToNotify = clientSnap.docs[0].id;
        }
      } catch (e) {
        console.warn('[Quotation] Could not resolve clientUid on status update:', e.message);
      }
    }

    const quotationUpdates = {
      status,
      updatedAt: now
    };
    if (clientUidToNotify && clientUidToNotify !== existing.clientUid) {
      quotationUpdates.clientUid = clientUidToNotify;
    }

    await updateToDatabase(dbPath, quotationUpdates);

    // Sync status back to originating inquiry if applicable
    if (existing.inquiryId) {
      let linkedInquiryStatus = null;
      if (status === 'Sent') linkedInquiryStatus = 'quotation_sent';
      else if (status === 'Rejected' || status === 'Cancelled') linkedInquiryStatus = 'rejected';

      if (linkedInquiryStatus) {
        try {
          const inquirySync = {
            status: linkedInquiryStatus,
            updatedAt: now
          };
          if (clientUidToNotify) {
            inquirySync.clientUid = clientUidToNotify;
          }
          await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${existing.inquiryId}`, inquirySync);
        } catch (inqErr) {
          console.error(`Failed to update inquiry status on quotation status change:`, inqErr);
        }
      }
    }

    // Notify Client when quotation is marked Sent
    if (status === 'Sent' && clientUidToNotify) {
      createNotification({
        recipientUid: clientUidToNotify,
        recipientRole: 'client',
        title: 'Quotation Ready for Review',
        message: `Quotation ${existing.quoteNo} for "${existing.serviceTitle}" is ready for your review.`,
        type: 'quotation',
        link: '/client/tracking',
        metadata: { quotationId: id, quoteNo: existing.quoteNo }
      }).catch(err => console.warn('Quotation sent notification warning:', err.message));
    }

    // Notify Operator when quotation is Rejected or Cancelled
    if ((status === 'Rejected' || status === 'Cancelled') && (existing.branchUid || existing.operatorId)) {
      notifyBranch({
        branchUid: existing.branchUid || existing.operatorId,
        branchName: existing.branchName,
        title: `Quotation ${status}`,
        message: `Quotation ${existing.quoteNo} for ${existing.clientName} was ${status.toLowerCase()}.`,
        type: 'quotation',
        link: '/operator/quotations',
        metadata: { quotationId: id, quoteNo: existing.quoteNo, status }
      }).catch(err => console.warn('Quotation status operator notification warning:', err.message));
    }

    await logFromRequest(req, {
      action: 'UPDATE_QUOTATION_STATUS',
      entityType: 'quotation',
      entityId: id,
      description: `Updated Quotation ${existing.quoteNo || id} status to "${status}" for ${existing.clientName || 'Client'}`,
      metadata: { quoteNo: existing.quoteNo, status, clientName: existing.clientName }
    });

    return res.status(200).json({ message: `Quotation status updated to ${status}` });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Helper to construct an Active Service Fulfillment document payload from server-side quotation and payment data
 */
const buildFulfillmentPayload = async (quotation, payment, activeServiceDocId, options = {}) => {
  const now = new Date().toISOString();
  const serviceTitle = quotation.serviceTitle || 'Custom Service';
  const totalAmountNum = Number(quotation.totalAmount || quotation.rate || 0);
  const servicePrice = totalAmountNum > 0
    ? `₱${totalAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : 'Custom Quoted Price';

  // Compile workflow steps for this custom service
  const compiledSteps = await compileWorkflowStepsForService(quotation.serviceId, serviceTitle);

  let assignedOperatorId = quotation.branchUid || quotation.operatorId || null;
  let assignedBranchName = quotation.branchName || null;
  let originatingInquiry = null;

  if (quotation.inquiryId) {
    try {
      originatingInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${quotation.inquiryId}`);
      if (originatingInquiry) {
        if (!assignedOperatorId) assignedOperatorId = originatingInquiry.branchUid || originatingInquiry.operatorId || null;
        if (!assignedBranchName) assignedBranchName = originatingInquiry.branchName || null;
      }
    } catch (err) {
      console.warn('[Quotation] Could not inspect originating inquiry for branch:', err.message);
    }
  }

  assignedOperatorId = assignedOperatorId || 'OP-ACCOUNT';
  assignedBranchName = assignedBranchName || 'Branch Office';

  let resolvedSubmittedReqId = quotation.submittedRequirementsId || quotation.submitted_requirements || originatingInquiry?.submittedRequirementsId || originatingInquiry?.submitted_requirements || null;

  const resolvedSubmittedReqs = Array.isArray(quotation.submittedRequirements)
    ? quotation.submittedRequirements
    : (Array.isArray(originatingInquiry?.requirements) ? originatingInquiry.requirements : []);

  if (!resolvedSubmittedReqId && resolvedSubmittedReqs.length > 0) {
    try {
      resolvedSubmittedReqId = await createSubmittedRequirementsRecord({
        submittedBy: quotation.clientUid || (payment ? payment.clientUid : null),
        requirements: resolvedSubmittedReqs
      });
    } catch (err) {
      console.warn('[Quotation] Could not create submitted_requirements in fulfillment:', err.message);
    }
  }

  return {
    id: activeServiceDocId,
    serviceCode: options.serviceCode || quotation.serviceCode || null,
    receiptId: options.receiptId || quotation.receiptId || null,
    receiptNo: options.receiptNo || quotation.receiptNo || null,
    clientUid: quotation.clientUid || (payment ? payment.clientUid : null),
    clientName: quotation.clientName || 'Valued Client',
    clientEmail: quotation.clientEmail || '',
    clientPhone: quotation.clientPhone || '',
    serviceId: quotation.serviceId || null,
    serviceUID: quotation.serviceId || null,
    serviceType: serviceTitle,
    price: servicePrice,
    submittedRequirementsId: resolvedSubmittedReqId,
    priority: 'Normal Priority',
    priorityType: 'normal',
    status: 'Pending',
    currentStepIndex: 0,
    totalSteps: compiledSteps.length,
    startedAt: now,
    completedAt: null,
    steps: compiledSteps,
    operatorId: assignedOperatorId,
    branchUid: assignedOperatorId,
    branchName: assignedBranchName,
    additionalNotes: `Custom Service created from Quotation ${quotation.quoteNo || quotation.id || ''}.\nTour Date: ${quotation.tourDates || 'N/A'}\nInclusions: ${quotation.inclusions || 'N/A'}\nExclusions: ${quotation.exclusions || 'N/A'}\nOperator Remarks: ${quotation.operatorRemarks || quotation.remarks || 'N/A'}${quotation.clientRemarks ? `\nClient Remarks: ${quotation.clientRemarks}` : ''}`,
    operatorRemarks: quotation.operatorRemarks || quotation.remarks || '',
    clientRemarks: quotation.clientRemarks || '',
    inquiryId: quotation.inquiryId || null,
    quotationId: quotation.id || quotation.quotationId || payment?.quotationId || null,
    paymentId: payment?.id || quotation.paymentId || null,
    paymentStatus: 'PAID',
    isCustomService: true,
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Submit service requirements for a quotation (Client online or Operator on-site)
 * POST /api/quotations/:id/submit-requirements
 * 
 * Rules:
 * - Client (owner) or Branch Operator/Admin (on behalf of client)
 * - Quotation must not be in 'PAID' status
 * - Validates mandatory requirements against catalog service schema
 * - Creates/updates document in submitted_requirements
 * - Updates quotation: submittedRequirementsId, requirementsStatus: 'submitted', requirementsSubmittedAt
 * - Notifies branch operator if submitted by client
 * - Syncs submittedRequirementsId to linked inquiry if present
 */
const submitQuotationRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    const { requirements } = req.body;

    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({ error: 'requirements array is required' });
    }

    const quotationPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const quotation = await getFromDatabase(quotationPath);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    if (quotation.status === 'PAID' || quotation.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot submit requirements for a paid quotation.' });
    }

    // Role & Ownership Verification (BOLA / IDOR Defense)
    const userRole = req.userDetails?.role;
    const isClient = userRole === 'client';
    const isOperator = userRole === 'operator' || userRole === 'branch_operator';
    const isAdmin = userRole === 'admin';

    if (isClient) {
      if (quotation.clientUid && quotation.clientUid !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: You cannot submit requirements for another client\'s quotation.' });
      }
    } else if (isOperator) {
      const isBranchMatch = (quotation.branchUid && quotation.branchUid === req.user.uid) ||
        (quotation.operatorId && quotation.operatorId === req.user.uid);
      if (!isBranchMatch && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: You can only submit requirements for quotations assigned to your branch.' });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }

    // Clean out any pseudo-requirements
    const cleanReqs = requirements.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
        name !== 'client specified requirements' &&
        name !== 'specified requirements of the client' &&
        name !== 'specified requirements';
    });

    // Validate against catalog service schema if serviceId is present
    if (quotation.serviceId) {
      try {
        const serviceDoc = await getFromDatabase(`${COLLECTIONS.SERVICES}/${quotation.serviceId}`);
        if (serviceDoc) {
          const serviceReqs = Array.isArray(serviceDoc.requirements)
            ? serviceDoc.requirements
            : (Array.isArray(serviceDoc.actions) ? serviceDoc.actions : []);

          const mandatoryServiceReqs = serviceReqs.filter(r => (typeof r === 'object' ? r.required !== false : true));

          const missing = mandatoryServiceReqs.filter(mReq => {
            const mName = (typeof mReq === 'string' ? mReq : (mReq.name || mReq.title || '')).trim().toLowerCase();
            const provided = cleanReqs.find(pReq => {
              const pName = (typeof pReq === 'string' ? pReq : (pReq.name || pReq.title || '')).trim().toLowerCase();
              return pName === mName;
            });

            if (!provided) return true;
            const hasFile = provided.file && (provided.file.url || provided.file.storagePath);
            const hasVal = typeof provided.value === 'string' && provided.value.trim().length > 0;
            return !hasFile && !hasVal;
          });

          if (missing.length > 0) {
            const missingNames = missing.map(m => typeof m === 'string' ? m : (m.name || m.title || 'Required Document')).join(', ');
            return res.status(400).json({
              error: `Missing mandatory requirement(s): ${missingNames}`
            });
          }
        }
      } catch (err) {
        console.warn('[Quotation] Error validating service schema:', err.message);
      }
    }

    const now = new Date().toISOString();
    let effectiveSubmittedReqId = quotation.submittedRequirementsId || null;

    if (effectiveSubmittedReqId) {
      // Update existing record
      await updateToDatabase(`${COLLECTIONS.SUBMITTED_REQUIREMENTS}/${effectiveSubmittedReqId}`, {
        requirements: sanitizeRequirementsArray(cleanReqs),
        updatedAt: now
      });
    } else {
      // Create new record
      effectiveSubmittedReqId = await createSubmittedRequirementsRecord({
        submittedBy: isClient ? req.user.uid : (quotation.clientUid || req.user.uid),
        requirements: cleanReqs
      });
    }

    const quotationUpdates = {
      submittedRequirementsId: effectiveSubmittedReqId,
      requirementsStatus: 'submitted',
      requirementsSubmittedAt: now,
      requirementsRejectionReason: null,
      updatedAt: now
    };

    await updateToDatabase(quotationPath, quotationUpdates);

    // Sync to linked inquiry if applicable
    if (quotation.inquiryId) {
      try {
        await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${quotation.inquiryId}`, {
          submittedRequirementsId: effectiveSubmittedReqId,
          requirementsSubmittedAt: now,
          updatedAt: now
        });
      } catch (e) {
        console.warn('[Quotation] Could not sync submittedRequirementsId to inquiry:', e.message);
      }
    }

    // If client submitted, notify branch operator
    if (isClient) {
      notifyBranch({
        branchUid: quotation.branchUid || quotation.operatorId,
        branchName: quotation.branchName,
        title: 'Requirements Submitted for Review',
        message: `${quotation.clientName || 'Client'} submitted requirements for Quotation ${quotation.quoteNo || id}. Please inspect and verify.`,
        type: 'quotation',
        link: `/operator/quotations/${id}`,
        metadata: { quotationId: id, quoteNo: quotation.quoteNo }
      }).catch(err => console.warn('Operator notification warning:', err.message));
    } else {
      // Operator uploaded on client's behalf
      await logFromRequest(req, {
        action: 'SUBMIT_CLIENT_REQUIREMENTS',
        entityType: 'quotation',
        entityId: id,
        description: `Completed requirements for Quotation ${quotation.quoteNo || id} on behalf of ${quotation.clientName}`,
        metadata: { quotationId: id, quoteNo: quotation.quoteNo }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service requirements submitted successfully. Awaiting operator review.',
      submittedRequirementsId: effectiveSubmittedReqId,
      requirementsStatus: 'submitted'
    });
  } catch (error) {
    console.error('Error submitting quotation requirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Review submitted requirements for a quotation (Operator / Admin)
 * POST /api/quotations/:id/review-requirements
 * 
 * Body: { action: 'approve' | 'request_changes', remarks?: string, reason?: string }
 */
const reviewQuotationRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks, reason } = req.body;

    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });
    if (!['approve', 'request_changes'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'request_changes'." });
    }

    const quotationPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const quotation = await getFromDatabase(quotationPath);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    // Operator branch authorization check
    const userRole = req.userDetails?.role;
    const isOperator = userRole === 'operator' || userRole === 'branch_operator';
    const isAdmin = userRole === 'admin';

    if (isOperator) {
      const isBranchMatch = (quotation.branchUid && quotation.branchUid === req.user.uid) ||
        (quotation.operatorId && quotation.operatorId === req.user.uid);
      if (!isBranchMatch) {
        return res.status(403).json({ error: 'Forbidden: You can only review quotations for your branch.' });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }

    if (quotation.status === 'PAID' || quotation.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot modify requirements for a paid quotation.' });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const quotationUpdates = {
        requirementsStatus: 'approved',
        requirementsApprovedAt: now,
        requirementsApprovedBy: req.user.uid,
        requirementsRemarks: remarks || '',
        requirementsRejectionReason: null,
        updatedAt: now
      };

      await updateToDatabase(quotationPath, quotationUpdates);

      // Notify client
      if (quotation.clientUid) {
        createNotification({
          recipientUid: quotation.clientUid,
          recipientRole: 'client',
          title: 'Requirements Approved · Ready to Accept',
          message: `Your submitted requirements for Quotation ${quotation.quoteNo || id} have been approved! You can now accept the quotation and proceed to payment.`,
          type: 'quotation',
          link: '/client/tracking',
          metadata: { quotationId: id, quoteNo: quotation.quoteNo }
        }).catch(err => console.warn('Client notification warning:', err.message));
      }

      await logFromRequest(req, {
        action: 'APPROVE_REQUIREMENTS',
        entityType: 'quotation',
        entityId: id,
        description: `Approved requirements for Quotation ${quotation.quoteNo || id} (${quotation.clientName})`,
        metadata: { quotationId: id, quoteNo: quotation.quoteNo }
      });

      return res.status(200).json({
        success: true,
        message: 'Requirements approved successfully. Client can now accept the quotation.',
        requirementsStatus: 'approved'
      });
    } else {
      // request_changes
      const rejectionNote = (remarks || reason || '').trim();
      if (!rejectionNote) {
        return res.status(400).json({ error: 'Please provide remarks or details for the requested changes.' });
      }

      const quotationUpdates = {
        requirementsStatus: 'changes_requested',
        requirementsRejectionReason: rejectionNote,
        requirementsRejectedAt: now,
        updatedAt: now
      };

      await updateToDatabase(quotationPath, quotationUpdates);

      // Notify client
      if (quotation.clientUid) {
        createNotification({
          recipientUid: quotation.clientUid,
          recipientRole: 'client',
          title: 'Action Needed: Requirements Correction Requested',
          message: `The operator requested corrections for Quotation ${quotation.quoteNo || id}: "${rejectionNote}". Please update your requirements.`,
          type: 'quotation',
          link: '/client/tracking',
          metadata: { quotationId: id, quoteNo: quotation.quoteNo, reason: rejectionNote }
        }).catch(err => console.warn('Client notification warning:', err.message));
      }

      await logFromRequest(req, {
        action: 'REJECT_REQUIREMENTS',
        entityType: 'quotation',
        entityId: id,
        description: `Requested requirements corrections for Quotation ${quotation.quoteNo || id} (${quotation.clientName}): "${rejectionNote}"`,
        metadata: { quotationId: id, quoteNo: quotation.quoteNo, remarks: rejectionNote }
      });

      return res.status(200).json({
        success: true,
        message: 'Changes requested. Client notified to correct requirements.',
        requirementsStatus: 'changes_requested'
      });
    }
  } catch (error) {
    console.error('Error reviewing quotation requirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Accept a quotation (called by Client online or Operator on-site)
 * Transitions status to Accepted and paymentStatus to UNPAID.
 * Service fulfillment is deferred until authoritative payment confirmation.
 */
const acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const quotationPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const quotation = await getFromDatabase(quotationPath);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    const userRole = req.userDetails?.role;
    const isClient = userRole === 'client';
    const isOperator = userRole === 'operator' || userRole === 'branch_operator';
    const isAdmin = userRole === 'admin';

    if (isClient) {
      if (quotation.clientUid && quotation.clientUid !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: You cannot accept a quotation prepared for another client.' });
      }
    } else if (isOperator) {
      const isBranchMatch = (quotation.branchUid && quotation.branchUid === req.user.uid) ||
        (quotation.operatorId && quotation.operatorId === req.user.uid);
      if (!isBranchMatch && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: You can only accept quotations for your branch.' });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to accept this quotation.' });
    }

    if (quotation.status === 'PAID' || quotation.paymentStatus === 'PAID') {
      return res.status(400).json({
        error: 'Quotation has already been paid and converted to an active service.',
        quotationId: id,
        activeServiceId: quotation.activeServiceId
      });
    }

    if (quotation.status === 'Accepted') {
      return res.status(200).json({
        message: 'Quotation has already been accepted. Please proceed to payment to activate service.',
        quotationId: id,
        quoteNo: quotation.quoteNo,
        totalAmount: Number(quotation.totalAmount || quotation.rate || 0),
        paymentStatus: quotation.paymentStatus || 'UNPAID'
      });
    }

    // Zero-Trust Check: Service Requirements must be approved prior to acceptance
    const reqStatus = (quotation.requirementsStatus || '').toLowerCase();
    if (reqStatus !== 'approved' && reqStatus !== 'not_required') {
      return res.status(400).json({
        error: 'Cannot accept quotation: Service requirements must be verified and approved by the branch operator before acceptance.',
        requirementsStatus: quotation.requirementsStatus || 'pending'
      });
    }

    const now = new Date().toISOString();

    // Update Quotation record to Accepted and UNPAID (fulfillment is created only upon confirmed payment)
    await updateToDatabase(quotationPath, {
      status: 'Accepted',
      paymentStatus: 'UNPAID',
      acceptedAt: now,
      acceptedBy: req.user?.uid || 'client',
      updatedAt: now
    });

    // Update originating Inquiry record if present
    if (quotation.inquiryId) {
      try {
        await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${quotation.inquiryId}`, {
          status: 'accepted',
          confirmedQuotationId: id,
          updatedAt: now
        });
      } catch (inqErr) {
        console.error(`Failed to update inquiry ${quotation.inquiryId} on quotation acceptance:`, inqErr);
      }
    }

    // 1. Notify Branch Operator
    notifyBranch({
      branchUid: quotation.branchUid || quotation.operatorId,
      branchName: quotation.branchName,
      title: 'Quotation Accepted by Client',
      message: `${quotation.clientName} accepted Quotation ${quotation.quoteNo} for "${quotation.serviceTitle || 'Service'}". Awaiting client payment.`,
      type: 'quotation',
      link: '/operator/quotations',
      metadata: { quotationId: id, quoteNo: quotation.quoteNo, status: 'Accepted' }
    }).catch(err => console.warn('Operator quotation accepted notification warning:', err.message));

    // 2. Notify Admins
    notifyAdmins({
      title: 'Quotation Accepted',
      message: `${quotation.clientName} accepted Quotation ${quotation.quoteNo} at ${quotation.branchName || 'Branch'}. Awaiting payment.`,
      type: 'quotation',
      link: '/admin/inquiry-history',
      metadata: { quotationId: id, branchName: quotation.branchName }
    }).catch(err => console.warn('Admin quotation accepted notification warning:', err.message));

    await logFromRequest(req, {
      action: 'ACCEPT_QUOTATION',
      entityType: 'quotation',
      entityId: id,
      description: `Accepted Quotation ${quotation.quoteNo || id} on behalf of Client ${quotation.clientName || 'Client'}`,
      metadata: { quoteNo: quotation.quoteNo, clientName: quotation.clientName, totalAmount: quotation.totalAmount }
    });

    return res.status(200).json({
      message: 'Quotation accepted successfully. Please complete payment to activate your service fulfillment.',
      quotationId: id,
      quoteNo: quotation.quoteNo,
      totalAmount: Number(quotation.totalAmount || quotation.rate || 0),
      paymentStatus: 'UNPAID'
    });
  } catch (error) {
    console.error('Error accepting quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Archive a quotation (does NOT archive the parent inquiry)
 */
const archiveQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });

    const userRole = req.userDetails?.role;
    if (userRole === 'operator' || userRole === 'branch_operator') {
      const isBranchMatch = (existing.branchUid && existing.branchUid === req.user.uid) ||
        (existing.operatorId && existing.operatorId === req.user.uid) ||
        (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid);
      if (!isBranchMatch) {
        return res.status(403).json({ error: 'Forbidden: You can only archive quotations for your branch.' });
      }
    }

    const now = new Date().toISOString();
    await updateToDatabase(dbPath, {
      archived: true,
      archivedAt: now,
      archivedBy: req.user.uid,
      archivedReason: req.body?.archivedReason || 'manual_archive',
      updatedAt: now
    });

    await logFromRequest(req, {
      action: 'ARCHIVE_QUOTATION',
      entityType: 'quotation',
      entityId: id,
      description: `Archived Quotation ${existing.quoteNo || id} for ${existing.clientName || 'Client'}`,
      metadata: { quoteNo: existing.quoteNo, clientName: existing.clientName }
    });

    return res.status(200).json({
      message: 'Quotation archived successfully',
      id,
      archived: true
    });
  } catch (error) {
    console.error('Error archiving quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Restore an archived quotation (verifies parent inquiry is active)
 */
const restoreQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });

    const userRole = req.userDetails?.role;
    if (userRole === 'operator' || userRole === 'branch_operator') {
      const isBranchMatch = (existing.branchUid && existing.branchUid === req.user.uid) ||
        (existing.operatorId && existing.operatorId === req.user.uid) ||
        (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid);
      if (!isBranchMatch) {
        return res.status(403).json({ error: 'Forbidden: You can only restore quotations for your branch.' });
      }
    }

    // Check parent Inquiry: if parent inquiry is archived, prevent restore
    if (existing.inquiryId) {
      try {
        const parentInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${existing.inquiryId}`);
        if (parentInquiry && parentInquiry.archived === true) {
          return res.status(400).json({
            error: 'Cannot restore quotation: The parent inquiry is currently archived. Please restore the parent inquiry first.',
            parentInquiryId: existing.inquiryId,
            parentInquiryArchived: true
          });
        }
      } catch (inqErr) {
        console.warn('[Quotation] Error verifying parent inquiry archival state:', inqErr.message);
      }
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

    await logFromRequest(req, {
      action: 'RESTORE_QUOTATION',
      entityType: 'quotation',
      entityId: id,
      description: `Restored Quotation ${existing.quoteNo || id} for ${existing.clientName || 'Client'}`,
      metadata: { quoteNo: existing.quoteNo, clientName: existing.clientName }
    });

    return res.status(200).json({
      message: 'Quotation restored successfully',
      id,
      archived: false
    });
  } catch (error) {
    console.error('Error restoring quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Client rejects quotation (or operator on behalf of client)
 * POST /api/quotations/:id/reject
 */
const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const quotation = await getFromDatabase(dbPath);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    const userRole = req.userDetails?.role;
    const isClient = userRole === 'client';
    const isOperator = userRole === 'operator' || userRole === 'branch_operator';
    const isAdmin = userRole === 'admin';

    // Role & Ownership Verification (BOLA defense)
    if (isClient) {
      if (quotation.clientUid && quotation.clientUid !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: You cannot reject a quotation prepared for another client.' });
      }
    } else if (isOperator) {
      const isBranchMatch = (quotation.branchUid && quotation.branchUid === req.user.uid) ||
        (quotation.operatorId && quotation.operatorId === req.user.uid);
      if (!isBranchMatch && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: You can only reject quotations for your branch.' });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to reject this quotation.' });
    }

    // State validation
    if (quotation.archived === true) {
      return res.status(400).json({ error: 'Cannot reject an archived quotation.' });
    }

    if (quotation.status === 'PAID' || quotation.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot reject a quotation that has already been paid and processed.' });
    }

    if (quotation.status === 'Accepted') {
      return res.status(400).json({ error: 'Quotation has already been accepted and cannot be rejected.' });
    }

    if (quotation.status === 'Rejected') {
      return res.status(400).json({ error: 'Quotation has already been rejected.' });
    }

    if (quotation.status === 'Cancelled') {
      return res.status(400).json({ error: 'Quotation has already been cancelled.' });
    }

    const now = new Date().toISOString();
    const reason = (req.body.rejectionReason || req.body.reason || '').trim();

    const updates = {
      status: 'Rejected',
      rejectedAt: now,
      rejectedBy: req.user.uid,
      rejectionReason: reason || null,
      updatedAt: now
    };

    await updateToDatabase(dbPath, updates);

    // Sync to linked inquiry if applicable
    if (quotation.inquiryId) {
      try {
        await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${quotation.inquiryId}`, {
          status: 'rejected',
          rejectionReason: reason || null,
          updatedAt: now
        });
      } catch (inqErr) {
        console.warn('[Quotation] Failed to sync rejection to originating inquiry:', inqErr.message);
      }
    }

    // 1. Notify Branch Operator
    if (quotation.branchUid || quotation.operatorId) {
      notifyBranch({
        branchUid: quotation.branchUid || quotation.operatorId,
        branchName: quotation.branchName,
        title: 'Quotation Rejected by Client',
        message: `${quotation.clientName || 'Client'} has rejected Quotation ${quotation.quoteNo || id}.${reason ? ` Reason: "${reason}"` : ''}`,
        type: 'quotation',
        link: `/operator/quotations/${id}`,
        metadata: { quotationId: id, quoteNo: quotation.quoteNo, status: 'Rejected', reason }
      }).catch(err => console.warn('Operator notification error on quotation reject:', err.message));
    }

    // 2. Notify Admins
    notifyAdmins({
      title: 'Quotation Rejected',
      message: `Quotation ${quotation.quoteNo || id} for ${quotation.clientName || 'Client'} at ${quotation.branchName || 'Branch'} was rejected by the client.`,
      type: 'quotation',
      link: '/admin/inquiry-history',
      metadata: { quotationId: id, branchName: quotation.branchName, status: 'Rejected', reason }
    }).catch(err => console.warn('Admin notification error on quotation reject:', err.message));

    await logFromRequest(req, {
      action: 'REJECT_QUOTATION',
      entityType: 'quotation',
      entityId: id,
      description: `Quotation ${quotation.quoteNo || id} rejected by ${isClient ? 'Client' : req.userDetails?.name || 'Staff'}${reason ? `: "${reason}"` : ''}`,
      metadata: { quoteNo: quotation.quoteNo, clientName: quotation.clientName, reason }
    });

    return res.status(200).json({
      message: 'Quotation rejected successfully.',
      quotationId: id,
      quoteNo: quotation.quoteNo,
      status: 'Rejected',
      rejectedAt: now,
      rejectionReason: reason || null
    });
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Permanent deletion of quotations is disabled in favor of archiving
 */
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });

    const userRole = req.userDetails?.role;
    if (userRole === 'operator' || userRole === 'branch_operator') {
      const isBranchMatch = (existing.branchUid && existing.branchUid === req.user.uid) ||
        (existing.operatorId && existing.operatorId === req.user.uid) ||
        (existing.branchUid && req.userDetails?.branchUid && existing.branchUid === req.userDetails?.branchUid);
      if (!isBranchMatch) {
        return res.status(403).json({ error: 'Forbidden: You can only delete quotations for your branch.' });
      }
    }

    // Permanent delete is disabled
    return res.status(400).json({
      error: 'Permanent deletion of quotations has been disabled to preserve historical business records. Please use the archive feature instead.',
      archivalRecommended: true
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update quotation details
 */
const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });

    if (existing.status === 'PAID' || existing.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot modify a quotation that has already been paid and activated.' });
    }
    if (existing.status === 'Accepted') {
      return res.status(400).json({ error: 'Cannot modify a quotation that has already been accepted.' });
    }

    const userRole = req.userDetails?.role;
    if (userRole === 'operator' || userRole === 'branch_operator') {
      const isBranchMatch = (existing.branchUid && existing.branchUid === req.user.uid) ||
        (existing.operatorId && existing.operatorId === req.user.uid);
      if (!isBranchMatch) {
        return res.status(403).json({ error: 'Forbidden: You can only update quotations for your branch.' });
      }
    }

    // Handle number conversions if sent
    if (updates.rate !== undefined) updates.rate = Number(updates.rate) || 0;
    if (updates.taxAmount !== undefined) updates.taxAmount = Number(updates.taxAmount) || 0;
    if (updates.totalAmount !== undefined) updates.totalAmount = Number(updates.totalAmount) || 0;

    if (updates.remarks !== undefined || updates.operatorRemarks !== undefined) {
      const opRemarks = updates.operatorRemarks !== undefined ? updates.operatorRemarks : updates.remarks;
      updates.remarks = opRemarks;
      updates.operatorRemarks = opRemarks;
    }

    // Edge Case: If serviceId changes, reset requirements approval state and re-evaluate
    if (updates.serviceId && updates.serviceId !== existing.serviceId) {
      try {
        const newServiceDoc = await getFromDatabase(`${COLLECTIONS.SERVICES}/${updates.serviceId}`);
        if (newServiceDoc) {
          const serviceReqs = Array.isArray(newServiceDoc.requirements)
            ? newServiceDoc.requirements
            : (Array.isArray(newServiceDoc.actions) ? newServiceDoc.actions : []);
          const mandatory = serviceReqs.filter(r => (typeof r === 'object' ? r.required !== false : true));
          if (mandatory.length > 0) {
            updates.requirementsStatus = 'pending';
            updates.requirementsApprovedAt = null;
            updates.requirementsApprovedBy = null;
            updates.requirementsRejectionReason = null;
          } else {
            updates.requirementsStatus = 'not_required';
          }
        }
      } catch (e) {
        console.warn('[Quotation] Error re-evaluating service change in updateQuotation:', e.message);
      }
    }

    await updateToDatabase(dbPath, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    await logFromRequest(req, {
      action: 'UPDATE_QUOTATION',
      entityType: 'quotation',
      entityId: id,
      description: `Modified details/pricing on Quotation ${existing.quoteNo || id} for ${existing.clientName || 'Client'}`,
      metadata: { quoteNo: existing.quoteNo, clientName: existing.clientName }
    });

    return res.status(200).json({ message: 'Quotation updated successfully' });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  updateQuotationStatus,
  acceptQuotation,
  deleteQuotation,
  archiveQuotation,
  restoreQuotation,
  rejectQuotation,
  updateQuotation,
  submitQuotationRequirements,
  reviewQuotationRequirements,
  buildFulfillmentPayload
};

