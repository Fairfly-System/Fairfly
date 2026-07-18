const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  FRANCHISE_APPLICATIONS: 'franchiseApplications'
};

/**
 * Submit a new franchise application (Public endpoint)
 */
const submitApplication = async (req, res) => {
  try {
    const applicationData = req.body;
    if (!applicationData) {
      return res.status(400).json({ error: 'Application data is required' });
    }

    const requiredFields = ['fullName', 'phoneNumber', 'email', 'preferredBranchLocation'];
    for (const field of requiredFields) {
      if (!applicationData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const sanitizedData = {
      ...applicationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      // Store the creator's UID if logged in, otherwise default to anonymous
      userId: req.user?.uid || 'anonymous'
    };

    const docId = await addToDatabase(COLLECTIONS.FRANCHISE_APPLICATIONS, sanitizedData);
    return res.status(201).json({ id: docId, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error submitting franchise application:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieve franchise applications (Admin only)
 */
const getApplications = async (req, res) => {
  try {
    const { status, limit, startDate, endDate } = req.query;

    const options = {
      filters: [],
      orderBy: { field: 'createdAt', direction: 'desc' }
    };

    if (status) {
      options.filters.push({ field: 'status', operator: '==', value: status });
    }
    if (startDate) {
      options.filters.push({ field: 'createdAt', operator: '>=', value: startDate });
    }
    if (endDate) {
      options.filters.push({ field: 'createdAt', operator: '<=', value: endDate });
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const results = await queryDatabaseAdvanced(COLLECTIONS.FRANCHISE_APPLICATIONS, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error getting franchise applications:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieve a specific franchise application by ID
 */
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    const data = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${id}`);
    if (!data) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Authorization check: Only Admin, Operator or the Creator user themselves can view
    const userRole = req.userDetails?.role;
    const isCreator = req.user && data.userId === req.user.uid;
    const isAuthorized = userRole === 'admin' || userRole === 'operator' || isCreator;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this application' });
    }

    return res.status(200).json({ id, ...data });
  } catch (error) {
    console.error('Error getting franchise application by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update application status (Admin only)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'in-review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const dbPath = `${COLLECTIONS.FRANCHISE_APPLICATIONS}/${id}`;
    const existing = await getFromDatabase(dbPath);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await updateToDatabase(dbPath, {
      status,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ message: `Application status updated to ${status}` });
  } catch (error) {
    console.error('Error updating franchise application status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus
};
