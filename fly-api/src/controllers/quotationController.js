const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');
const { compileWorkflowStepsForService } = require('./activeServiceController');

const COLLECTIONS = {
  QUOTATIONS: 'quotations',
  INQUIRIES: 'inquiries',
  ACTIVE_SERVICES: 'activeServices'
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
      quotationDate,
      branchUid,
      branchName,
      inquiryId
    } = req.body;

    if (!clientName || (!serviceTitle && !serviceId)) {
      return res.status(400).json({ error: 'Client name and service title are required' });
    }

    const now = new Date().toISOString();
    const effectiveBranchUid = branchUid || req.userDetails?.branchUid || req.user?.uid || null;
    const effectiveBranchName = branchName || req.userDetails?.branchName || req.userDetails?.name || 'Branch Office';

    // If inquiryId is provided, fetch inquiry to inherit clientUid if missing
    let effectiveClientUid = clientUid || null;
    let linkedInquiry = null;

    if (inquiryId) {
      try {
        linkedInquiry = await getFromDatabase(`${COLLECTIONS.INQUIRIES}/${inquiryId}`);
        if (linkedInquiry && !effectiveClientUid) {
          effectiveClientUid = linkedInquiry.clientUid || null;
        }
      } catch (inqErr) {
        console.warn(`Could not load inquiry ${inquiryId} during quotation creation:`, inqErr);
      }
    }

    const newQuotation = {
      clientUid: effectiveClientUid,
      clientName: clientName.trim(),
      contactPerson: (contactPerson || '').trim(),
      clientEmail: clientEmail ? clientEmail.trim() : '',
      clientPhone: clientPhone ? clientPhone.trim() : '',
      serviceId: serviceId || null,
      serviceTitle: (serviceTitle || 'General Service').trim(),
      requirements: requirements || '',
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
      remarks: remarks || '',
      quotationDate: quotationDate || now.split('T')[0],
      branchUid: effectiveBranchUid,
      branchName: effectiveBranchName,
      inquiryId: inquiryId || null,
      quoteNo: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Draft',
      activeServiceId: null,
      createdAt: now,
      updatedAt: now,
      operatorId: req.user?.uid || 'operator_admin'
    };

    const docId = await addToDatabase(COLLECTIONS.QUOTATIONS, newQuotation);

    // If linked to an inquiry, update inquiry status to quotation_created
    if (inquiryId) {
      try {
        await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${inquiryId}`, {
          status: 'quotation_created',
          confirmedQuotationId: docId,
          updatedAt: now
        });
      } catch (upInqErr) {
        console.error(`Failed to update inquiry ${inquiryId} with quotation reference:`, upInqErr);
      }
    }

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
    const { status, branchUid, clientUid, inquiryId, limit } = req.query;
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

    if (inquiryId) {
      options.filters.push({ field: 'inquiryId', operator: '==', value: inquiryId });
    }
    if (status && status !== 'all') {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (branchUid && branchUid !== 'all') {
      options.filters.push({ field: 'branchUid', operator: '==', value: branchUid });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.QUOTATIONS, options);
    return res.status(200).json(results);
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

    const now = new Date().toISOString();
    await updateToDatabase(dbPath, {
      status,
      updatedAt: now
    });

    // Sync status back to originating inquiry if applicable
    if (existing.inquiryId) {
      let linkedInquiryStatus = null;
      if (status === 'Sent') linkedInquiryStatus = 'quotation_sent';
      else if (status === 'Rejected' || status === 'Cancelled') linkedInquiryStatus = 'rejected';

      if (linkedInquiryStatus) {
        try {
          await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${existing.inquiryId}`, {
            status: linkedInquiryStatus,
            updatedAt: now
          });
        } catch (inqErr) {
          console.error(`Failed to update inquiry status on quotation status change:`, inqErr);
        }
      }
    }

    return res.status(200).json({ message: `Quotation status updated to ${status}` });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Accept a quotation (called by Client online or Operator on-site)
 * Transitions status to Accepted and creates the linked Custom Service in activeServices.
 */
const acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    const quotationPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const quotation = await getFromDatabase(quotationPath);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    if (quotation.status === 'Accepted' && quotation.activeServiceId) {
      return res.status(200).json({ 
        message: 'Quotation is already accepted',
        activeServiceId: quotation.activeServiceId 
      });
    }

    const now = new Date().toISOString();
    const serviceTitle = quotation.serviceTitle || 'Custom Service';
    const totalAmountNum = Number(quotation.totalAmount || quotation.rate || 0);
    const servicePrice = totalAmountNum > 0 
      ? `₱${totalAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
      : 'Custom Quoted Price';

    // Compile workflow steps for this custom service
    const compiledSteps = await compileWorkflowStepsForService(quotation.serviceId, serviceTitle);

    // Build Custom Service record in activeServices
    const activeServicePayload = {
      clientUid: quotation.clientUid || req.user?.uid || null,
      clientName: quotation.clientName || 'Valued Client',
      clientEmail: quotation.clientEmail || '',
      clientPhone: quotation.clientPhone || '',
      serviceId: quotation.serviceId || null,
      serviceUID: quotation.serviceId || null,
      serviceType: serviceTitle,
      price: servicePrice,
      requirements: quotation.requirements ? [{ name: 'Client Specifications', value: quotation.requirements, required: false }] : [],
      submittedRequirements: [],
      priority: 'Normal Priority',
      priorityType: 'normal',
      status: 'Pending',
      currentStepIndex: 0,
      totalSteps: compiledSteps.length,
      startedAt: now,
      completedAt: null,
      steps: compiledSteps,
      operatorId: quotation.branchUid || quotation.operatorId || 'OP-ACCOUNT',
      branchUid: quotation.branchUid || quotation.operatorId || 'OP-ACCOUNT',
      branchName: quotation.branchName || 'Branch Office',
      additionalNotes: `Custom Service created from Quotation ${quotation.quoteNo || id}.\nTour Date: ${quotation.tourDates || 'N/A'}\nInclusions: ${quotation.inclusions || 'N/A'}\nExclusions: ${quotation.exclusions || 'N/A'}\nRemarks: ${quotation.remarks || 'N/A'}`,
      inquiryId: quotation.inquiryId || null,
      quotationId: id,
      isCustomService: true,
      createdAt: now,
      updatedAt: now
    };

    const activeServiceDocId = await addToDatabase(COLLECTIONS.ACTIVE_SERVICES, activeServicePayload);

    // Update Quotation record
    await updateToDatabase(quotationPath, {
      status: 'Accepted',
      activeServiceId: activeServiceDocId,
      acceptedAt: now,
      acceptedBy: req.user?.uid || 'client',
      updatedAt: now
    });

    // Update originating Inquiry record if present
    if (quotation.inquiryId) {
      try {
        await updateToDatabase(`${COLLECTIONS.INQUIRIES}/${quotation.inquiryId}`, {
          status: 'accepted',
          confirmedActiveServiceId: activeServiceDocId,
          confirmedQuotationId: id,
          updatedAt: now
        });
      } catch (inqErr) {
        console.error(`Failed to update inquiry ${quotation.inquiryId} on quotation acceptance:`, inqErr);
      }
    }

    return res.status(200).json({
      message: 'Quotation accepted successfully. Custom service created and active.',
      quotationId: id,
      activeServiceId: activeServiceDocId
    });
  } catch (error) {
    console.error('Error accepting quotation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Delete quotation
 */
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Quotation ID is required' });

    await deleteFromDatabase(`${COLLECTIONS.QUOTATIONS}/${id}`);
    return res.status(200).json({ message: 'Quotation deleted successfully' });
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

    // Handle number conversions if sent
    if (updates.rate !== undefined) updates.rate = Number(updates.rate) || 0;
    if (updates.taxAmount !== undefined) updates.taxAmount = Number(updates.taxAmount) || 0;
    if (updates.totalAmount !== undefined) updates.totalAmount = Number(updates.totalAmount) || 0;

    await updateToDatabase(dbPath, {
      ...updates,
      updatedAt: new Date().toISOString()
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
  updateQuotation
};

