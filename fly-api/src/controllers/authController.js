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

/**
 * Register a new Client account
 * Payload: { fullName, email, phone, password }
 */
const registerClient = async (req, res) => {
  let uid = null;
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address format.' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ error: 'Please enter a valid phone number format (8-15 digits).' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.' });
    }

    // 1. Create Firebase Auth user
    try {
      const userRecord = await admin.auth().createUser({
        email: normalizedEmail,
        password: password,
        displayName: fullName.trim()
      });
      uid = userRecord.uid;
    } catch (authError) {
      console.error('Error creating Auth user during registration:', authError);
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(400).json({ error: 'Failed to create account: ' + authError.message });
    }

    // 2. Create Firestore User Document with hardcoded role 'client'
    const now = new Date().toISOString();
    const userDoc = {
      fullName: fullName.trim(),
      name: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role: 'client',
      status: 'Active',
      createdAt: now,
      updatedAt: now
    };

    try {
      await addToDocumentWithId(COLLECTIONS.USERS, uid, userDoc);
    } catch (dbError) {
      console.error('Error saving user doc in Firestore, rolling back Auth user:', dbError);
      if (uid) {
        try {
          await admin.auth().deleteUser(uid);
        } catch (delErr) {
          console.error('Error deleting Auth user during rollback:', delErr);
        }
      }
      return res.status(500).json({ error: 'Failed to complete registration profile. Please try again.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please sign in.',
      userId: uid
    });
  } catch (error) {
    console.error('Error in registerClient:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

module.exports = {
  requestClientPasswordReset,
  registerClient
};
