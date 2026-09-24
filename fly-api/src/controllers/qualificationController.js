const { 
  addToDatabase, 
  getFromDatabase, 
  queryDatabaseAdvanced, 
  updateToDatabase 
} = require('../services/firebaseService');
const { userCache } = require('../services/cacheService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const COLLECTIONS = {
  QUALIFICATION_APPLICATIONS: 'qualificationApplications',
  USERS: 'users'
};

/**
 * Submit a new qualification application (Operator only)
 */
const submitQualificationApplication = async (req, res) => {
  try {
    const operatorId = req.user.uid;
    const operatorData = req.userDetails || {};

    if (operatorData.role !== 'operator') {
      return res.status(403).json({ error: 'Only branch operators can apply for qualification' });
    }

    if (operatorData.isQualified) {
      return res.status(400).json({ error: 'Your branch account is already qualified to create services' });
    }

    const { reason, justification, experience, notes, documents } = req.body;
    const finalReason = (reason || justification || experience || notes || '').trim();

    if (!finalReason) {
      return res.status(400).json({ error: 'Please provide a justification or reason for your qualification request' });
    }

    // Validate documents (up to 5 documents allowed)
    let validatedDocuments = [];
    if (documents) {
      if (!Array.isArray(documents)) {
        return res.status(400).json({ error: 'Documents must be provided as an array' });
      }
      if (documents.length > 5) {
        return res.status(400).json({ error: 'You can upload a maximum of 5 supporting documents' });
      }

      for (let i = 0; i < documents.length; i++) {
        const docItem = documents[i];
        if (!docItem || typeof docItem !== 'object' || !docItem.url || typeof docItem.url !== 'string') {
          return res.status(400).json({ error: `Document #${i + 1} has an invalid or missing file URL` });
        }
        validatedDocuments.push({
          name: String(docItem.name || docItem.fileName || `document_${i + 1}`).substring(0, 150),
          url: docItem.url,
          size: Number(docItem.size || docItem.fileSize) || 0,
          type: String(docItem.type || docItem.contentType || 'application/octet-stream').substring(0, 100),
          storagePath: docItem.storagePath || '',
          uploadedAt: docItem.uploadedAt || new Date().toISOString()
        });
      }
    }

    // Check for existing pending application
    const existingPending = await queryDatabaseAdvanced(COLLECTIONS.QUALIFICATION_APPLICATIONS, {
      filters: [
        { field: 'operatorId', operator: '==', value: operatorId },
        { field: 'status', operator: '==', value: 'pending' }
      ]
    });

    if (existingPending && existingPending.length > 0) {
      return res.status(400).json({ error: 'You already have a pending qualification application currently under review' });
    }

    const now = new Date().toISOString();
    const branchName = operatorData.branchName || operatorData.name || 'Branch Operator';

    const applicationData = {
      operatorId,
      operatorName: operatorData.name || operatorData.fullName || branchName,
      branchName,
      email: req.user.email || operatorData.email || '',
      contactNumber: operatorData.contactNumber || operatorData.phone || '',
      address: operatorData.address || '',
      reason: finalReason,
      documents: validatedDocuments,
      status: 'pending',
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      adminNotes: '',
      createdAt: now,
      updatedAt: now
    };

    const docId = await addToDatabase(COLLECTIONS.QUALIFICATION_APPLICATIONS, applicationData);

    // Notify Super Admins
    const docCountText = validatedDocuments.length > 0 ? ` (${validatedDocuments.length} document${validatedDocuments.length !== 1 ? 's' : ''} attached)` : '';
    notifyAdmins({
      title: 'New Operator Qualification Request',
      message: `${branchName} applied to become a Qualified Operator for custom services${docCountText}`,
      type: 'qualification',
      link: `/admin/qualifications/${docId}`,
      metadata: { applicationId: docId, operatorId }
    }).catch(e => console.warn('Qualification notification warning:', e.message));

    return res.status(201).json({ id: docId, ...applicationData, message: 'Qualification application submitted successfully' });
  } catch (error) {
    console.error('Error submitting qualification application:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieve qualification applications (Admin only)
 */
const getQualificationApplications = async (req, res) => {
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

    const results = await queryDatabaseAdvanced(COLLECTIONS.QUALIFICATION_APPLICATIONS, options);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching qualification applications:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieve single qualification application by ID
 */
const getQualificationApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Application ID is required' });

    const appDoc = await getFromDatabase(`${COLLECTIONS.QUALIFICATION_APPLICATIONS}/${id}`);
    if (!appDoc) {
      return res.status(404).json({ error: 'Qualification application not found' });
    }

    const userRole = req.userDetails?.role;
    const isOwner = req.user?.uid === appDoc.operatorId;

    if (userRole !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    // Fetch Operator profile data and live stats
    let operatorProfile = null;
    if (appDoc.operatorId) {
      const opUser = await getFromDatabase(`${COLLECTIONS.USERS}/${appDoc.operatorId}`);
      if (opUser) {
        operatorProfile = {
          id: appDoc.operatorId,
          name: opUser.name || opUser.fullName || appDoc.operatorName,
          branchName: opUser.branchName || appDoc.branchName,
          email: opUser.email || appDoc.email,
          contactNumber: opUser.contactNumber || opUser.phone || appDoc.contactNumber,
          address: opUser.address || appDoc.address,
          status: opUser.status || 'Active',
          isQualified: opUser.isQualified || false,
          totalRevenue: Number(opUser.totalRevenue) || 0,
          completedServicesCount: Number(opUser.completedServicesCount) || 0,
          createdAt: opUser.createdAt || null
        };
      }
    }

    return res.status(200).json({
      id,
      ...appDoc,
      operatorProfile,
      documents: Array.isArray(appDoc.documents) ? appDoc.documents : []
    });
  } catch (error) {
    console.error('Error fetching qualification application by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Review/Approve/Reject qualification application (Super Admin only)
 */
const reviewQualificationApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "approved" or "rejected"' });
    }

    const appPath = `${COLLECTIONS.QUALIFICATION_APPLICATIONS}/${id}`;
    const application = await getFromDatabase(appPath);
    if (!application) {
      return res.status(404).json({ error: 'Qualification application not found' });
    }

    const now = new Date().toISOString();
    const isApproved = status === 'approved';

    // Update Application Record
    await updateToDatabase(appPath, {
      status,
      reviewedBy: req.user.uid,
      reviewedByName: req.userDetails?.name || req.userDetails?.displayName || 'Super Admin',
      reviewedAt: now,
      adminNotes: (adminNotes || '').trim(),
      updatedAt: now
    });

    // Update Operator User Document
    if (application.operatorId) {
      const userPath = `${COLLECTIONS.USERS}/${application.operatorId}`;
      const operatorDoc = await getFromDatabase(userPath);
      if (operatorDoc) {
        await updateToDatabase(userPath, {
          isQualified: isApproved,
          updatedAt: now
        });
        if (userCache) {
          userCache.del(application.operatorId);
        }
      }
    }

    // Notify Operator of qualification decision
    if (application.operatorId) {
      createNotification({
        recipientUid: application.operatorId,
        recipientRole: 'operator',
        title: isApproved ? 'Qualification Approved! 🎉' : 'Qualification Application Update',
        message: isApproved
          ? 'Congratulations! Your branch has been approved as a Qualified Operator. You can now create and manage custom services.'
          : `Your qualification application has been reviewed and was not approved at this time.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
        type: 'qualification',
        link: '/operator/services',
        metadata: { applicationId: id, status }
      }).catch(e => console.warn('Qualification decision notification warning:', e.message));
    }

    return res.status(200).json({
      message: `Qualification application marked as ${status}`,
      status,
      isQualified: isApproved
    });
  } catch (error) {
    console.error('Error reviewing qualification application:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  submitQualificationApplication,
  getQualificationApplications,
  getQualificationApplicationById,
  reviewQualificationApplication
};
