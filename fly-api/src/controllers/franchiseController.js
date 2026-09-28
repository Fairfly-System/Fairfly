const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { ID_PREFIXES } = require('../utils/idGenerator');

const COLLECTIONS = {
  FRANCHISE_APPLICATIONS: 'franchiseApplications',
  FORM_SCHEMAS: 'formSchemas'
};

const DEFAULT_FRANCHISE_SCHEMA = {
  id: 'franchise_application_default_v1',
  version: 1,
  title: 'FairFly Franchise Application Form',
  sections: [
    {
      id: 'applicant_info',
      title: 'Applicant Information',
      fields: [
        { id: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
        { id: 'middleInitial', label: 'Middle Initial', type: 'text', required: false, placeholder: 'M.I.' },
        { id: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
        { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'email@example.com' },
        { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true, placeholder: '+63 912 345 6789' }
      ]
    },
    {
      id: 'preferred_location',
      title: 'Preferred Branch Location',
      fields: [
        { id: 'province', label: 'Province', type: 'text', required: true, placeholder: 'Select province' },
        { id: 'municipality', label: 'Municipality / City', type: 'text', required: true, placeholder: 'Select municipality' },
        { id: 'barangay', label: 'Barangay', type: 'text', required: true, placeholder: 'Select barangay' },
        { id: 'building', label: 'Building / Street', type: 'text', required: false, placeholder: 'Building / House No. / Street' }
      ]
    },
    {
      id: 'business_background',
      title: 'Business Background & Meeting Preference',
      fields: [
        { id: 'businessExperience', label: 'Business Experience', type: 'text', required: true, placeholder: 'Select experience level' },
        { id: 'investmentCapacity', label: 'Investment Capacity', type: 'text', required: true, placeholder: 'Select investment range' },
        { id: 'preferredMeetingDate', label: 'Preferred Meeting Date', type: 'date', required: true },
        { id: 'preferredMeetingTime', label: 'Preferred Meeting Time', type: 'text', required: true },
        { id: 'additionalMessage', label: 'Additional Information', type: 'textarea', required: false, placeholder: 'Tell us more about your background...' }
      ]
    },
    {
      id: 'custom_fields',
      title: 'Custom Franchise Specifications',
      fields: []
    }
  ]
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

    // Support both legacy fullName and new split firstName/lastName fields
    const derivedFullName = applicationData.fullName ||
      [applicationData.firstName, applicationData.middleInitial, applicationData.lastName]
        .filter(Boolean).join(' ').trim();

    if (!derivedFullName) {
      return res.status(400).json({ error: 'Missing required field: name (fullName or firstName/lastName)' });
    }
    if (!applicationData.phoneNumber) {
      return res.status(400).json({ error: 'Missing required field: phoneNumber' });
    }
    if (!applicationData.email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }
    if (!applicationData.preferredBranchLocation) {
      return res.status(400).json({ error: 'Missing required field: preferredBranchLocation' });
    }

    const sanitizedData = {
      ...applicationData,
      fullName: derivedFullName, // always store canonical fullName for backward compatibility
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      // Store the creator's UID if logged in, otherwise default to anonymous
      userId: req.user?.uid || 'anonymous'
    };

    const docId = await addToDatabase(COLLECTIONS.FRANCHISE_APPLICATIONS, sanitizedData, ID_PREFIXES.FRANCHISE);

    // Notify admins
    notifyAdmins({
      title: 'New Franchise Application',
      message: `${sanitizedData.fullName} submitted an application for ${sanitizedData.preferredBranchLocation}`,
      type: 'franchise',
      link: '/admin/franchise-apps',
      metadata: { applicationId: docId }
    }).catch(e => console.warn('Franchise notification warning:', e.message));

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
    const { status, limit, offset, search } = req.query;

    const filters = [];
    if (status && status !== 'all') {
      filters.push({ field: 'status', operator: '==', value: status.toLowerCase() });
    }

    let applications = await queryDatabaseAdvanced(
      COLLECTIONS.FRANCHISE_APPLICATIONS,
      filters,
      { field: 'createdAt', direction: 'desc' }
    );

    // In-memory text search if requested
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      applications = applications.filter(app => 
        (app.fullName && app.fullName.toLowerCase().includes(q)) ||
        (app.email && app.email.toLowerCase().includes(q)) ||
        (app.preferredBranchLocation && app.preferredBranchLocation.toLowerCase().includes(q)) ||
        (app.phoneNumber && app.phoneNumber.includes(q))
      );
    }

    const total = applications.length;

    // Optional pagination
    const parsedOffset = parseInt(offset, 10) || 0;
    const parsedLimit = parseInt(limit, 10);
    const paginated = !isNaN(parsedLimit) && parsedLimit > 0
      ? applications.slice(parsedOffset, parsedOffset + parsedLimit)
      : applications;

    return res.status(200).json({
      total,
      applications: paginated
    });
  } catch (error) {
    console.error('Error fetching franchise applications:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieve a single franchise application by ID
 */
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    const application = await getFromDatabase(`${COLLECTIONS.FRANCHISE_APPLICATIONS}/${id}`);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Role check: Only the applicant themselves or an admin may view it
    const isOwner = req.user?.uid && application.userId === req.user.uid;
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Update the status of a franchise application (Admin only)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
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

    // Notify applicant if registered user
    if (existing.userId && existing.userId !== 'anonymous') {
      createNotification({
        recipientUid: existing.userId,
        recipientRole: 'client',
        title: 'Franchise Application Update',
        message: `Your franchise application for ${existing.preferredBranchLocation} has been marked as ${status}.`,
        type: 'franchise',
        link: '/client',
        metadata: { applicationId: id, status }
      }).catch(e => console.warn('Franchise applicant notification warning:', e.message));
    }

    return res.status(200).json({ message: `Application status updated to ${status}` });
  } catch (error) {
    console.error('Error updating franchise application status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get franchise application form schema (Admin read)
 */
const getFranchiseApplicationSchema = async (req, res) => {
  try {
    const schema = await getFromDatabase(`${COLLECTIONS.FORM_SCHEMAS}/franchiseApplication`);
    if (!schema || !Array.isArray(schema.sections) || schema.sections.length === 0) {
      return res.status(200).json(DEFAULT_FRANCHISE_SCHEMA);
    }

    // Ensure custom_fields section is always present
    const sections = [...schema.sections];
    if (!sections.some((s) => s.id === 'custom_fields')) {
      sections.push({
        id: 'custom_fields',
        title: 'Custom Franchise Specifications',
        fields: []
      });
    }

    return res.status(200).json({ ...schema, sections });
  } catch (error) {
    console.error('Error getting franchise application schema:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Save franchise application form schema (Admin only)
 */
const saveFranchiseApplicationSchema = async (req, res) => {
  try {
    const { sections, title } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'sections array is required' });
    }

    const updatedSchema = {
      id: 'franchise_application_schema',
      title: title || 'FairFly Franchise Application Form',
      sections,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'admin'
    };

    await updateToDatabase(`${COLLECTIONS.FORM_SCHEMAS}/franchiseApplication`, updatedSchema);
    return res.status(200).json({ message: 'Franchise application form schema saved successfully', schema: updatedSchema });
  } catch (error) {
    console.error('Error saving franchise application schema:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  getFranchiseApplicationSchema,
  saveFranchiseApplicationSchema
};
