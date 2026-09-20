const { admin, db } = require('../config/firebase');

const COLLECTIONS = {
  USERS: 'users'
};

/**
 * Request password reset for client accounts only
 * Payload: { email }
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

    // If no record found in users collection
    if (userSnapshot.empty) {
      return res.status(404).json({
        error: 'No registered client account found with this email address. Please check your spelling or register for a new account.'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userRole = (userData.role || '').toLowerCase();

    // 2. Strict Role Check: Client accounts only
    if (userRole !== 'client') {
      return res.status(403).json({
        error: 'Password reset via this portal is only available for Client accounts. Franchise operators and Administrators must contact Head Office Support to recover account credentials.'
      });
    }

    // 3. Generate Firebase Password Reset Link / Verify Auth Record
    try {
      // Validate that user exists in Firebase Auth
      await admin.auth().getUserByEmail(normalizedEmail);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        return res.status(404).json({
          error: 'No authentication credentials found for this email. Please register for a client account.'
        });
      }
      console.warn('Firebase Auth user lookup warning:', authErr.message);
    }

    return res.status(200).json({
      success: true,
      email: normalizedEmail,
      message: 'Client verification confirmed. A password reset link will be sent to your email.'
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

