const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  QUOTATIONS: 'quotations'
};

/**
 * Create a new service quotation
 */
const createQuotation = async (req, res) => {
  try {
    const { 
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

    const newQuotation = {
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
      createdAt: now,
      updatedAt: now,
      operatorId: req.user?.uid || 'operator_admin'
    };

    const docId = await addToDatabase(COLLECTIONS.QUOTATIONS, newQuotation);
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

    const results = await queryDatabaseAdvanced(COLLECTIONS.QUOTATIONS, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error listing quotations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update quotation status (Draft, Sent, Confirmed, Cancelled)
 */
const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Quotation ID and status are required' });

    const dbPath = `${COLLECTIONS.QUOTATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });

    await updateToDatabase(dbPath, {
      status,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ message: `Quotation status updated to ${status}` });
  } catch (error) {
    console.error('Error updating quotation status:', error);
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
  deleteQuotation,
  updateQuotation
};
