const { 
  addToDatabase, 
  addToDocumentWithId,
  getFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase, 
  queryDatabaseAdvanced 
} = require('../services/firebaseService');
const { generatePrefixedId, ID_PREFIXES } = require('../utils/idGenerator');
const { deleteRecordStorageFiles } = require('../services/storageService');

const COLLECTIONS = {
  SUBMITTED_REQUIREMENTS: 'submitted_requirements',
  INQUIRIES: 'inquiries',
  QUOTATIONS: 'quotations',
  ACTIVE_SERVICES: 'activeServices',
  USERS: 'users'
};

/**
 * Normalizes and sanitizes a requirements array before storing
 * @param {Array} rawReqs 
 * @returns {Array} Sanitized requirements list
 */
function sanitizeRequirementsArray(rawReqs) {
  if (!Array.isArray(rawReqs)) return [];

  return rawReqs.map((req, idx) => {
    if (typeof req === 'string') {
      return {
        id: `req_${idx}`,
        name: req.trim(),
        inputType: 'text',
        required: true,
        value: '',
        file: null
      };
    }

    if (typeof req === 'object' && req !== null) {
      const name = (req.name || req.title || `Requirement ${idx + 1}`).trim();
      const inputType = req.inputType || req.type || 'text';
      const required = req.required !== false;
      const value = typeof req.value === 'string' ? req.value.trim() : (typeof req.textValue === 'string' ? req.textValue.trim() : '');

      let fileObj = null;
      if (req.file && typeof req.file === 'object' && req.file.url) {
        fileObj = {
          url: req.file.url,
          fileName: req.file.fileName || req.file.name || 'attachment',
          fileSize: Number(req.file.fileSize || req.file.size || 0),
          storagePath: req.file.storagePath || '',
          contentType: req.file.contentType || 'application/octet-stream'
        };
      } else if (typeof req.file === 'string' && req.file.startsWith('http')) {
        fileObj = {
          url: req.file,
          fileName: req.fileName || 'attachment',
          fileSize: 0,
          storagePath: '',
          contentType: 'application/octet-stream'
        };
      }

      return {
        id: req.id || `req_${idx}`,
        name,
        inputType,
        required,
        value,
        file: fileObj
      };
    }

    return {
      id: `req_${idx}`,
      name: `Requirement ${idx + 1}`,
      inputType: 'text',
      required: false,
      value: String(req || ''),
      file: null
    };
  });
}

/**
 * Service Helper: Creates a new submitted_requirements document in Firestore.
 * Stores strictly the requirements array, single submitter UID (submittedBy), and timestamps.
 * The Firestore document ID serves as the record's identity — no redundant `id` field stored.
 * 
 * @param {Object} params
 * @param {string} params.submittedBy - UID of the user who submitted the requirements
 * @param {Array} params.requirements - Raw requirements array to sanitize and store
 * @returns {Promise<string>} The document ID (e.g. "REQ-...")
 */
async function createSubmittedRequirementsRecord({
  submittedBy = null,
  requirements = []
}) {
  const sanitized = sanitizeRequirementsArray(requirements);
  const now = new Date().toISOString();
  const docId = generatePrefixedId(ID_PREFIXES.SUBMITTED_REQUIREMENTS);

  const payload = {
    requirements: sanitized,
    submittedBy: submittedBy || null,
    createdAt: now,
    updatedAt: now
  };

  await addToDocumentWithId(COLLECTIONS.SUBMITTED_REQUIREMENTS, docId, payload);
  return docId;
}

/**
 * GET /api/submitted-requirements/:id
 * Retrieve a single submitted requirements record by ID (Targeted fetch)
 */
const getSubmittedRequirementsById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Requirement ID is required.' });
    }

    const docPath = `${COLLECTIONS.SUBMITTED_REQUIREMENTS}/${id}`;
    const record = await getFromDatabase(docPath);
    if (!record) {
      return res.status(404).json({ error: 'Submitted requirements record not found.' });
    }

    // Role & Ownership Verification (BOLA Defense)
    const userRole = req.userDetails?.role;
    const submitterUid = record.submittedBy;
    const isOwnerClient = userRole === 'client' && submitterUid === req.user?.uid;
    const isStaff = userRole === 'operator' || userRole === 'branch_operator' || userRole === 'admin';

    if (!isStaff && !isOwnerClient && submitterUid) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this requirement record.' });
    }

    return res.status(200).json({ id, ...record });
  } catch (error) {
    console.error('Error fetching submitted requirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * PATCH /api/submitted-requirements/:id
 * Update/re-upload requirement items in the single source of truth document
 */
const updateSubmittedRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Requirement ID is required.' });
    }

    const docPath = `${COLLECTIONS.SUBMITTED_REQUIREMENTS}/${id}`;
    const existing = await getFromDatabase(docPath);
    if (!existing) {
      return res.status(404).json({ error: 'Submitted requirements record not found.' });
    }

    // Role & Ownership Verification
    const userRole = req.userDetails?.role;
    const submitterUid = existing.submittedBy;
    const isOwnerClient = userRole === 'client' && submitterUid === req.user?.uid;
    const isStaff = userRole === 'operator' || userRole === 'branch_operator' || userRole === 'admin';

    if (!isStaff && !isOwnerClient && submitterUid) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify these requirements.' });
    }

    const now = new Date().toISOString();
    const updates = { updatedAt: now };

    if (req.body.requirements && Array.isArray(req.body.requirements)) {
      updates.requirements = sanitizeRequirementsArray(req.body.requirements);
    }

    await updateToDatabase(docPath, updates);

    return res.status(200).json({ 
      id, 
      message: 'Submitted requirements updated successfully',
      ...updates 
    });
  } catch (error) {
    console.error('Error updating submitted requirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * POST /api/submitted-requirements
 * Standalone endpoint to submit requirements
 */
const createSubmittedRequirements = async (req, res) => {
  try {
    const { submittedBy, requirements } = req.body;

    const userRole = req.userDetails?.role;
    const effectiveSubmitter = userRole === 'client' ? req.user?.uid : (submittedBy || req.user?.uid || null);

    const docId = await createSubmittedRequirementsRecord({
      submittedBy: effectiveSubmitter,
      requirements: requirements || []
    });

    const created = await getFromDatabase(`${COLLECTIONS.SUBMITTED_REQUIREMENTS}/${docId}`);
    return res.status(201).json({ id: docId, ...created, message: 'Requirements submitted successfully' });
  } catch (error) {
    console.error('Error creating submitted requirements:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  COLLECTIONS,
  sanitizeRequirementsArray,
  createSubmittedRequirementsRecord,
  getSubmittedRequirementsById,
  updateSubmittedRequirements,
  createSubmittedRequirements
};
