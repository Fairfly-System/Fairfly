const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  INQUIRIES: 'inquiries'
};

/**
 * Submit a new client inquiry
 */
const createInquiry = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      serviceType, 
      preferredBranchLocation, 
      notes, 
      formNo, 
      controlNo 
    } = req.body;

    if (!fullName || !phoneNumber) {
      return res.status(400).json({ error: 'Client full name and phone number are required' });
    }

    const now = new Date().toISOString();
    const newInquiry = {
      fullName: fullName.trim(),
      email: email ? email.trim() : '',
      phoneNumber: phoneNumber.trim(),
      serviceType: serviceType || 'General Inquiry',
      preferredBranchLocation: preferredBranchLocation || 'Main Branch',
      notes: notes || '',
      formNo: formNo || `SAF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      controlNo: controlNo || `CTRL-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      operatorId: req.user?.uid || 'operator_admin'
    };

    const docId = await addToDatabase(COLLECTIONS.INQUIRIES, newInquiry);
    return res.status(201).json({ id: docId, ...newInquiry, message: 'Inquiry form created successfully' });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * List inquiries
 */
const getInquiries = async (req, res) => {
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

    const results = await queryDatabaseAdvanced(COLLECTIONS.INQUIRIES, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error listing inquiries:', error);
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

module.exports = {
  createInquiry,
  getInquiries,
  updateInquiry,
  deleteInquiry
};
