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

/**
 * Legacy registerClient endpoint - delegates to initiateRegistration for secure verification flow
 */
const registerClient = initiateRegistration;

module.exports = {
  requestClientPasswordReset,
  registerClient,
  initiateRegistration,
  verifyRegistrationCode: verifyRegistrationCodeController,
  resendRegistrationCode: resendRegistrationCodeController
};

