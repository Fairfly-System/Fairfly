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

module.exports = {
  requestClientPasswordReset
};
