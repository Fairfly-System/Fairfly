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
      clientEmail, 
      clientPhone, 
      serviceTitle, 
      tourDates, 
      inclusions, 
      exclusions, 
      rate, 
      totalAmount, 
      preparedBy, 
      remarks 
    } = req.body;

    if (!clientName || !serviceTitle || rate === undefined) {
      return res.status(400).json({ error: 'Client name, service title, and rate are required' });
    }

    const now = new Date().toISOString();
    const newQuotation = {
      clientName: clientName.trim(),
      clientEmail: clientEmail ? clientEmail.trim() : '',
      clientPhone: clientPhone ? clientPhone.trim() : '',
      serviceTitle: serviceTitle.trim(),
      tourDates: tourDates || 'N/A',
      inclusions: inclusions || 'As requested',
      exclusions: exclusions || 'Personal expenses',
      rate: Number(rate) || 0,
      totalAmount: Number(totalAmount || rate) || 0,
      preparedBy: preparedBy || req.userDetails?.name || 'Operator',
      remarks: remarks || '',
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

module.exports = {
  createQuotation,
  getQuotations,
  updateQuotationStatus,
  deleteQuotation
};
