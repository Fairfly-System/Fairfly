const { admin, db } = require('../config/firebase');
const { sendPasswordResetEmail } = require('../services/emailService');

const COLLECTIONS = {
  PASSWORD_RESET_REQUESTS: 'passwordResetRequests',
  USERS: 'users'
};

/**
 * Get all password reset requests (Super Admin only)
 * Optionally filter by status (?status=PENDING)
 */
const getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let queryRef = db.collection(COLLECTIONS.PASSWORD_RESET_REQUESTS);

    if (status && status !== 'all') {
      queryRef = queryRef.where('status', '==', status.toUpperCase());
    }

    const snapshot = await queryRef.get();
    const now = new Date();

    const requests = [];
    const expiredUpdates = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Auto-expire requests past their validity window
      if (data.status === 'PENDING' && data.expiresAt && new Date(data.expiresAt) < now) {
        data.status = 'EXPIRED';
        data.updatedAt = now.toISOString();
        expiredUpdates.push(doc.ref.update({ status: 'EXPIRED', updatedAt: now.toISOString() }));
      }
      requests.push({ id: doc.id, ...data });
    });

    if (expiredUpdates.length > 0) {
      await Promise.all(expiredUpdates).catch(err => console.warn('[PasswordReset] Expiration sync warning:', err.message));
    }

    // Sort newest first
    requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error in getPasswordResetRequests:', error);
    return res.status(500).json({ error: 'Failed to retrieve password reset requests: ' + error.message });
  }
};

/**
 * Get a single password reset request by ID (Super Admin only)
 */
const getPasswordResetRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Request ID is required' });

    const docRef = db.collection(COLLECTIONS.PASSWORD_RESET_REQUESTS).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Password reset request not found' });
    }

    const data = docSnap.data();

    // Fetch associated operator user doc to display verification factors
    let operatorProfile = null;
    if (data.operatorUid) {
      try {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(data.operatorUid).get();
        if (userDoc.exists) {
          const u = userDoc.data();
          operatorProfile = {
            fullName: u.fullName || u.name,
            email: u.email,
            branchName: u.branchName,
            status: u.status,
            role: u.role,
            isQualified: u.isQualified,
            createdAt: u.createdAt
          };
        }
      } catch (uErr) {
        console.warn('[PasswordReset] Failed to load operator profile details:', uErr.message);
      }
    }

    return res.status(200).json({
      id: docSnap.id,
      ...data,
      operatorProfile
    });
  } catch (error) {
    console.error('Error in getPasswordResetRequestById:', error);
    return res.status(500).json({ error: 'Failed to retrieve password reset request: ' + error.message });
  }
};

/**
 * Approve an operator password reset request (Super Admin only)
 * Generates Firebase Auth reset link and dispatches official email
 */
const approvePasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Request ID is required' });

    const docRef = db.collection(COLLECTIONS.PASSWORD_RESET_REQUESTS).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Password reset request not found' });
    }

    const requestData = docSnap.data();

    if (requestData.status !== 'PENDING') {
      return res.status(400).json({
        error: `Cannot approve request with status "${requestData.status}". Only PENDING requests can be approved.`
      });
    }

    const now = new Date();
    if (requestData.expiresAt && new Date(requestData.expiresAt) < now) {
      await docRef.update({ status: 'EXPIRED', updatedAt: now.toISOString() });
      return res.status(400).json({ error: 'This password reset request has expired and cannot be approved.' });
    }

    const operatorEmail = requestData.operatorEmail;
    if (!operatorEmail) {
      return res.status(400).json({ error: 'Request is missing operator email.' });
    }

    // 1. Verify user exists in Firebase Auth
    let authUser = null;
    try {
      authUser = await admin.auth().getUserByEmail(operatorEmail);
    } catch (authErr) {
      console.error(`[PasswordReset] Firebase Auth lookup failed for ${operatorEmail}:`, authErr);
      return res.status(400).json({
        error: `Firebase Auth account does not exist for email: ${operatorEmail}`
      });
    }

    // 2. Generate official Firebase Auth Password Reset Link
    const resetLink = await admin.auth().generatePasswordResetLink(operatorEmail);

    // 3. Send branded transactional email containing the reset link
    const recipientName = requestData.operatorName || authUser.displayName || 'Branch Operator';
    const emailResult = await sendPasswordResetEmail(operatorEmail, recipientName, resetLink);

    // 4. Update request document status to APPROVED
    const nowIso = now.toISOString();
    await docRef.update({
      status: 'APPROVED',
      resetLinkSent: true,
      emailDispatchMode: emailResult?.mode || 'sent',
      reviewedBy: req.user.uid,
      reviewedByName: req.userDetails?.name || req.userDetails?.fullName || 'Super Admin',
      reviewedAt: nowIso,
      updatedAt: nowIso
    });

    console.log(`[PasswordReset] Request ${id} approved by Super Admin ${req.user.uid}. Reset link sent to ${operatorEmail}`);

    return res.status(200).json({
      success: true,
      message: `Password reset request approved. Official reset link dispatched to ${operatorEmail}.`,
      requestId: id,
      operatorEmail
    });
  } catch (error) {
    console.error('Error in approvePasswordResetRequest:', error);
    return res.status(500).json({ error: 'Failed to approve password reset request: ' + error.message });
  }
};

/**
 * Reject an operator password reset request (Super Admin only)
 */
const rejectPasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) return res.status(400).json({ error: 'Request ID is required' });

    const docRef = db.collection(COLLECTIONS.PASSWORD_RESET_REQUESTS).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Password reset request not found' });
    }

    const requestData = docSnap.data();

    if (requestData.status !== 'PENDING') {
      return res.status(400).json({
        error: `Cannot reject request with status "${requestData.status}". Only PENDING requests can be rejected.`
      });
    }

    const nowIso = new Date().toISOString();
    const rejectionReason = (reason && typeof reason === 'string' ? reason.trim().slice(0, 500) : 'Identity verification could not be confirmed by Super Admin.');

    await docRef.update({
      status: 'REJECTED',
      reviewedBy: req.user.uid,
      reviewedByName: req.userDetails?.name || req.userDetails?.fullName || 'Super Admin',
      reviewedAt: nowIso,
      reviewNotes: rejectionReason,
      updatedAt: nowIso
    });

    console.log(`[PasswordReset] Request ${id} rejected by Super Admin ${req.user.uid}. Reason: ${rejectionReason}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset request has been rejected.',
      requestId: id
    });
  } catch (error) {
    console.error('Error in rejectPasswordResetRequest:', error);
    return res.status(500).json({ error: 'Failed to reject password reset request: ' + error.message });
  }
};

module.exports = {
  getPasswordResetRequests,
  getPasswordResetRequestById,
  approvePasswordResetRequest,
  rejectPasswordResetRequest
};
