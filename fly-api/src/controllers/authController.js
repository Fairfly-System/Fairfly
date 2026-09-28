const { admin, db } = require('../config/firebase');
const { sendPasswordResetEmail } = require('../services/emailService');

const COLLECTIONS = {
  USERS: 'users'
};

const GENERIC_RESET_SUCCESS_MESSAGE = 'If an account associated with this email is eligible, a password reset link has been sent.';

/**
 * Request password reset for client accounts only
 * Payload: { email }
 *
 * Security requirements:
 * 1. Generates and sends reset password link ONLY if account role === 'client'
 * 2. If account is admin, operator, or unregistered: returns generic 200 success without sending email (prevents account & role enumeration)
 */
const requestClientPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address format.' });
    }

    // 1. Query Firestore users collection for matching email
    let userSnapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    // Fallback search with original casing if not found
    if (userSnapshot.empty && normalizedEmail !== email.trim()) {
      userSnapshot = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email.trim())
        .limit(1)
        .get();
    }

    // If no record found in users collection, return generic success (prevents account enumeration)
    if (userSnapshot.empty) {
      console.log(`[Auth] Password reset requested for non-existent email: ${normalizedEmail}. Email suppressed.`);
      return res.status(200).json({
        success: true,
        message: GENERIC_RESET_SUCCESS_MESSAGE
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userRole = (userData.role || '').toLowerCase();

    // 2. Strict Role Check: Privileged accounts (admin, operator, etc.) are silently suppressed
    if (userRole !== 'client') {
      console.log(`[Auth] Password reset requested for privileged account (${userRole}): ${normalizedEmail}. Reset email suppressed for security.`);
      return res.status(200).json({
        success: true,
        message: GENERIC_RESET_SUCCESS_MESSAGE
      });
    }

    // 3. Client account verification and reset link dispatch
    let authUser = null;
    try {
      authUser = await admin.auth().getUserByEmail(normalizedEmail);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        console.warn(`[Auth] Client Firestore record exists for ${normalizedEmail}, but no corresponding Firebase Auth user found.`);
        return res.status(200).json({
          success: true,
          message: GENERIC_RESET_SUCCESS_MESSAGE
        });
      }
      console.error('[Auth] Firebase Auth lookup error:', authErr);
      throw authErr;
    }

    // 4. Generate official Firebase Auth Password Reset Link
    const resetLink = await admin.auth().generatePasswordResetLink(normalizedEmail);

    // 5. Send branded transactional email containing the reset link via Nodemailer
    const recipientName = userData.fullName || userData.name || authUser?.displayName || 'Valued Traveler';
    await sendPasswordResetEmail(normalizedEmail, recipientName, resetLink);

    console.log(`[Auth] Password reset link generated and emailed to client: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: GENERIC_RESET_SUCCESS_MESSAGE
    });
  } catch (error) {
    console.error('Error in requestClientPasswordReset:', error);
    return res.status(500).json({
      error: 'Failed to process password reset request: ' + error.message
    });
  }
};

const GENERIC_OPERATOR_RESET_MESSAGE = 'If an active Operator account matching these details exists, your password reset request has been securely submitted for Super Admin review.';

/**
 * Request password reset for Operator accounts
 * Payload: { email, branchName, reason }
 * 
 * Security & Verification Requirements:
 * 1. Checks account existence in Firestore `users` collection where role is 'operator' or 'branch_operator'
 * 2. Verifies account status is 'Active' (not disabled or deleted)
 * 3. Verifies account exists in Firebase Auth
 * 4. Anti-enumeration: Returns generic success message on all invalid / non-operator inputs
 * 5. Throttling / Duplicate Guard: If an active PENDING or APPROVED request was created within the last 24h, suppresses duplicate creation
 * 6. Creates record in `passwordResetRequests` with status 'PENDING' and 48-hour expiration
 * 7. Dispatches security notification to Super Admins
 */
const requestOperatorPasswordReset = async (req, res) => {
  try {
    const { email, branchName, reason } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address format.' });
    }

    // 1. Query Firestore users collection for operator account
    let userSnapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (userSnapshot.empty && normalizedEmail !== email.trim()) {
      userSnapshot = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email.trim())
        .limit(1)
        .get();
    }

    // If no record found, return generic success (prevents account enumeration)
    if (userSnapshot.empty) {
      console.log(`[Auth] Operator password reset requested for non-existent email: ${normalizedEmail}. Request suppressed.`);
      return res.status(200).json({
        success: true,
        message: GENERIC_OPERATOR_RESET_MESSAGE
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userRole = (userData.role || '').toLowerCase();

    // 2. Strict Role Check: Must be operator or branch_operator
    if (userRole !== 'operator' && userRole !== 'branch_operator') {
      console.log(`[Auth] Operator password reset requested for non-operator role (${userRole}): ${normalizedEmail}. Suppressed.`);
      return res.status(200).json({
        success: true,
        message: GENERIC_OPERATOR_RESET_MESSAGE
      });
    }

    // 3. Status Check: Must be Active
    if (userData.status && userData.status.toLowerCase() !== 'active') {
      console.log(`[Auth] Operator password reset requested for inactive account (${userData.status}): ${normalizedEmail}. Suppressed.`);
      return res.status(200).json({
        success: true,
        message: GENERIC_OPERATOR_RESET_MESSAGE
      });
    }

    // 4. Firebase Auth Account Existence Check
    try {
      await admin.auth().getUserByEmail(normalizedEmail);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        console.warn(`[Auth] Operator Firestore record exists for ${normalizedEmail}, but no corresponding Firebase Auth user found.`);
        return res.status(200).json({
          success: true,
          message: GENERIC_OPERATOR_RESET_MESSAGE
        });
      }
      console.error('[Auth] Firebase Auth lookup error:', authErr);
      throw authErr;
    }

    // 5. Throttling / Duplicate Guard: Check for existing PENDING or APPROVED request within last 24h
    const existingRequestsSnapshot = await db.collection('passwordResetRequests')
      .where('operatorEmail', '==', normalizedEmail)
      .get();

    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const hasActiveRecentRequest = existingRequestsSnapshot.docs.some(doc => {
      const data = doc.data();
      if (data.status === 'PENDING' || data.status === 'APPROVED') {
        const createdMs = new Date(data.createdAt || 0).getTime();
        return (nowMs - createdMs) < twentyFourHoursMs;
      }
      return false;
    });

    if (hasActiveRecentRequest) {
      console.log(`[Auth] Duplicate active operator reset request throttled for: ${normalizedEmail}`);
      return res.status(200).json({
        success: true,
        message: GENERIC_OPERATOR_RESET_MESSAGE
      });
    }

    // 6. Generate and save Password Reset Request in Firestore
    const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');
    const { notifyAdmins } = require('../services/notificationService');
    const requestId = generatePrefixedId(ID_PREFIXES.PASSWORD_RESET);
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(nowMs + 48 * 60 * 60 * 1000).toISOString(); // 48-hour validity

    const newRequestDoc = {
      id: requestId,
      operatorUid: userDoc.id,
      operatorEmail: normalizedEmail,
      operatorName: userData.fullName || userData.name || userData.branchName || 'Operator',
      branchUid: userData.branchUid || userDoc.id,
      branchName: userData.branchName || branchName || 'Branch Office',
      reason: (reason && typeof reason === 'string' ? reason.trim().slice(0, 500) : 'Operator account password reset request'),
      status: 'PENDING',
      resetLinkSent: false,
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNotes: null,
      completedAt: null,
      expiresAt: expiresAtIso,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await db.collection('passwordResetRequests').doc(requestId).set(newRequestDoc);

    // 7. Notify Admins/Super Admins
    notifyAdmins({
      title: 'Operator Password Reset Request',
      message: `Operator ${newRequestDoc.operatorName} (${newRequestDoc.branchName}) requested a password reset. Review required.`,
      type: 'security',
      link: '/admin/operators',
      metadata: { requestId, operatorEmail: normalizedEmail, branchName: newRequestDoc.branchName }
    }).catch(err => console.warn('[Auth] Notification to admins failed:', err.message));

    console.log(`[Auth] Operator password reset request created: ${requestId} for ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: GENERIC_OPERATOR_RESET_MESSAGE
    });
  } catch (error) {
    console.error('Error in requestOperatorPasswordReset:', error);
    return res.status(500).json({
      error: 'Failed to process operator password reset request: ' + error.message
    });
  }
};

const { addToDocumentWithId } = require('../services/firebaseService');
const {
  createPendingRegistration,
  verifyRegistrationCode,
  resendVerificationCode
} = require('../services/verificationService');

/**
 * Initiate registration: Validates fields and generates/sends 6-character code
 * Payload: { fullName, email, phone, password }
 */
const initiateRegistration = async (req, res) => {
  try {
    const result = await createPendingRegistration(req.body);
    return res.status(result.status || 200).json(result);
  } catch (error) {
    console.error('Error in initiateRegistration:', error);
    return res.status(500).json({ error: 'Failed to initiate registration: ' + error.message });
  }
};

/**
 * Verify 6-character registration code and sign in
 * Payload: { email, code }
 */
const verifyRegistrationCodeController = async (req, res) => {
  try {
    const result = await verifyRegistrationCode(req.body);
    return res.status(result.status || 200).json(result);
  } catch (error) {
    console.error('Error in verifyRegistrationCodeController:', error);
    return res.status(500).json({ error: 'Failed to verify registration code: ' + error.message });
  }
};

/**
 * Resend 6-character registration code
 * Payload: { email }
 */
const resendRegistrationCodeController = async (req, res) => {
  try {
    const result = await resendVerificationCode(req.body);
    return res.status(result.status || 200).json(result);
  } catch (error) {
    console.error('Error in resendRegistrationCodeController:', error);
    return res.status(500).json({ error: 'Failed to resend registration code: ' + error.message });
  }
};

const { notifyAdmins } = require('../services/notificationService');
const { updateToDatabase } = require('../services/firebaseService');
const { userCache } = require('../services/cacheService');

/**
 * Re-upload government ID for rejected client account
 * Payload: { email, token, idType, idFrontUrl, idBackUrl, idFrontName, idBackName }
 */
const reuploadIdController = async (req, res) => {
  try {
    const { email, token, idType, idFrontUrl, idBackUrl, idFrontName, idBackName } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'Security token is missing or invalid. Please click the link sent to your email.' });
    }

    if (!idType || typeof idType !== 'string' || !idType.trim()) {
      return res.status(400).json({ error: 'Please select an accepted Government ID type.' });
    }

    if (!idFrontUrl || typeof idFrontUrl !== 'string' || !idFrontUrl.trim()) {
      return res.status(400).json({ error: 'Please upload the front copy of your valid Government ID.' });
    }

    if (!idBackUrl || typeof idBackUrl !== 'string' || !idBackUrl.trim()) {
      return res.status(400).json({ error: 'Please upload the back copy of your valid Government ID.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userSnapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'No account found matching this email address.' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.role !== 'client') {
      return res.status(403).json({ error: 'Only client accounts can submit ID documents.' });
    }

    if (userData.reuploadToken !== token.trim()) {
      return res.status(401).json({ error: 'Invalid or expired re-upload link. Please check your email for the latest link or contact support.' });
    }

    const now = new Date().toISOString();
    const updates = {
      status: 'Pending',
      approvalStatus: 'Pending',
      idType: idType.trim(),
      idFrontUrl: idFrontUrl.trim(),
      idBackUrl: idBackUrl.trim(),
      idFrontName: idFrontName ? idFrontName.trim() : null,
      idBackName: idBackName ? idBackName.trim() : null,
      rejectionReason: null,
      reuploadToken: null,
      idSubmittedAt: now,
      updatedAt: now
    };

    await updateToDatabase(`${COLLECTIONS.USERS}/${userDoc.id}`, updates);
    userCache.delete(userDoc.id);

    // Notify administrators of resubmission
    try {
      await notifyAdmins({
        title: 'Client Re-submitted ID for Review',
        message: `${userData.fullName || userData.name || 'Client'} has re-uploaded their valid government ID (${idType.trim()}) for review.`,
        type: 'system',
        link: `/admin/clients/${userDoc.id}`,
        metadata: {
          clientUid: userDoc.id,
          fullName: userData.fullName || userData.name,
          email: normalizedEmail,
          idType: idType.trim()
        }
      });
    } catch (notifErr) {
      console.error('Error notifying admins on ID re-upload:', notifErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Your government ID has been re-submitted successfully! An administrator will review your application shortly.'
    });
  } catch (error) {
    console.error('Error in reuploadIdController:', error);
    return res.status(500).json({ error: 'Failed to re-upload ID: ' + error.message });
  }
};

/**
 * Legacy registerClient endpoint - delegates to initiateRegistration for secure verification flow
 */
const registerClient = initiateRegistration;

module.exports = {
  requestClientPasswordReset,
  requestOperatorPasswordReset,
  registerClient,
  initiateRegistration,
  verifyRegistrationCode: verifyRegistrationCodeController,
  resendRegistrationCode: resendRegistrationCodeController,
  reuploadId: reuploadIdController
};


