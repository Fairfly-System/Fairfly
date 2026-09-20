const crypto = require('crypto');
const { admin, db } = require('../config/firebase');
const { sendVerificationCodeEmail } = require('./emailService');

const COLLECTIONS = {
  USERS: 'users',
  PENDING_REGISTRATIONS: 'pending_registrations'
};

const EXPIRY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;                  // 5 attempts allowed before invalidating code
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds cooldown between resends

/**
 * Hash a code using SHA-256
 */
const hashCode = (code) => {
  return crypto.createHash('sha256').update(code.toString().trim()).digest('hex');
};

/**
 * Generate a cryptographically secure 6-digit numeric verification code
 */
const generateSecure6DigitCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Initiate registration and send 6-character code
 */
const createPendingRegistration = async ({ fullName, email, phone, password }) => {
  // 1. Validation
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return { status: 400, error: 'Name must be at least 2 characters long.' };
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return { status: 400, error: 'Please provide a valid email address.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { status: 400, error: 'Please enter a valid email address format.' };
  }

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { status: 400, error: 'Please provide a valid phone number.' };
  }

  const phoneRegex = /^[0-9+\s-]{8,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return { status: 400, error: 'Please enter a valid phone number format (8-15 digits).' };
  }

  if (!password || typeof password !== 'string') {
    return { status: 400, error: 'Password is required.' };
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return { status: 400, error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.' };
  }

  // 2. Check if user already exists in Firebase Auth or Firestore
  try {
    const existingAuthUser = await admin.auth().getUserByEmail(normalizedEmail);
    if (existingAuthUser) {
      return { status: 400, error: 'An account with this email address already exists. Please sign in.' };
    }
  } catch (err) {
    // auth/user-not-found is expected for new registration
    if (err.code !== 'auth/user-not-found') {
      console.error('Error checking existing Firebase Auth user:', err);
    }
  }

  const existingDocSnapshot = await db.collection(COLLECTIONS.USERS)
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!existingDocSnapshot.empty) {
    return { status: 400, error: 'An account with this email address already exists. Please sign in.' };
  }

  // 3. Check for existing pending registration cooldown
  const docId = Buffer.from(normalizedEmail).toString('base64url');
  const pendingDocRef = db.collection(COLLECTIONS.PENDING_REGISTRATIONS).doc(docId);
  const pendingSnapshot = await pendingDocRef.get();

  if (pendingSnapshot.exists) {
    const existingPending = pendingSnapshot.data();
    if (existingPending.resendCooldownUntil && Date.now() < existingPending.resendCooldownUntil) {
      const waitSeconds = Math.ceil((existingPending.resendCooldownUntil - Date.now()) / 1000);
      return {
        status: 429,
        error: `A verification code was recently sent. Please wait ${waitSeconds}s before requesting a new code.`
      };
    }
  }

  // 4. Generate 6-digit code and store hashed record
  const code = generateSecure6DigitCode();
  const codeHash = hashCode(code);
  const now = Date.now();

  const pendingData = {
    fullName: fullName.trim(),
    name: fullName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password, // temporary server-side storage until verification completes
    codeHash,
    attemptsLeft: MAX_ATTEMPTS,
    expiresAt: now + EXPIRY_WINDOW_MS,
    resendCooldownUntil: now + RESEND_COOLDOWN_MS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await pendingDocRef.set(pendingData);

  // 5. Send verification email
  await sendVerificationCodeEmail(normalizedEmail, fullName.trim(), code);

  return {
    status: 200,
    success: true,
    message: 'Verification code sent to your email. Please enter the 6-digit code to complete registration.',
    email: normalizedEmail,
    expiresInSeconds: Math.floor(EXPIRY_WINDOW_MS / 1000)
  };
};

/**
 * Verify code and complete user registration with auto sign-in token
 */
const verifyRegistrationCode = async ({ email, code }) => {
  if (!email || typeof email !== 'string') {
    return { status: 400, error: 'Email address is required.' };
  }

  if (!code || typeof code !== 'string') {
    return { status: 400, error: 'Please enter the 6-digit verification code.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (trimmedCode.length !== 6) {
    return { status: 400, error: 'Verification code must be exactly 6 characters.' };
  }

  const docId = Buffer.from(normalizedEmail).toString('base64url');
  const pendingDocRef = db.collection(COLLECTIONS.PENDING_REGISTRATIONS).doc(docId);
  const docSnapshot = await pendingDocRef.get();

  if (!docSnapshot.exists) {
    return {
      status: 404,
      error: 'No pending registration found for this email address. Please register again.'
    };
  }

  const pendingData = docSnapshot.data();

  // 1. Check expiration
  if (Date.now() > pendingData.expiresAt) {
    return {
      status: 400,
      code: 'EXPIRED',
      error: 'Verification code has expired. Please click Resend Code to receive a new one.'
    };
  }

  // 2. Check remaining attempts
  const currentAttempts = pendingData.attemptsLeft !== undefined ? pendingData.attemptsLeft : MAX_ATTEMPTS;
  if (currentAttempts <= 0) {
    await pendingDocRef.delete();
    return {
      status: 429,
      code: 'LOCKOUT',
      error: 'Too many incorrect attempts. For your security, this verification code has been invalidated. Please register again.'
    };
  }

  // 3. Verify code hash
  const inputHash = hashCode(trimmedCode);
  if (inputHash !== pendingData.codeHash) {
    const updatedAttempts = currentAttempts - 1;

    if (updatedAttempts <= 0) {
      await pendingDocRef.delete();
      return {
        status: 429,
        code: 'LOCKOUT',
        error: 'Too many incorrect attempts. For your security, this verification code has been invalidated. Please register again.',
        attemptsLeft: 0
      };
    }

    await pendingDocRef.update({
      attemptsLeft: updatedAttempts,
      updatedAt: new Date().toISOString()
    });

    return {
      status: 400,
      code: 'INVALID_CODE',
      error: `Incorrect verification code. You have ${updatedAttempts} attempt${updatedAttempts === 1 ? '' : 's'} remaining.`,
      attemptsLeft: updatedAttempts
    };
  }

  // 4. Code verified! Create Auth user & Firestore user profile
  let uid = null;
  try {
    const userRecord = await admin.auth().createUser({
      email: pendingData.email,
      password: pendingData.password,
      displayName: pendingData.fullName,
      emailVerified: true
    });
    uid = userRecord.uid;
  } catch (authError) {
    console.error('Error creating Auth user after verification:', authError);
    if (authError.code === 'auth/email-already-exists') {
      await pendingDocRef.delete();
      return { status: 400, error: 'An account with this email already exists.' };
    }
    return { status: 500, error: 'Failed to create user credentials: ' + authError.message };
  }

  const now = new Date().toISOString();
  const userProfile = {
    fullName: pendingData.fullName,
    name: pendingData.fullName,
    email: pendingData.email,
    phone: pendingData.phone,
    role: 'client',
    status: 'Active',
    emailVerified: true,
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).set(userProfile);
  } catch (dbError) {
    console.error('Error saving user doc in Firestore after verification:', dbError);
    if (uid) {
      try {
        await admin.auth().deleteUser(uid);
      } catch (delErr) {
        console.error('Error deleting Auth user during rollback:', delErr);
      }
    }
    return { status: 500, error: 'Failed to initialize client profile. Please try again.' };
  }

  // 5. Clean up pending registration record
  await pendingDocRef.delete();

  // 6. Generate Firebase Custom Token for seamless automatic sign-in
  let customToken = null;
  try {
    customToken = await admin.auth().createCustomToken(uid);
  } catch (tokenErr) {
    console.warn('Warning: Could not create custom token for auto-login:', tokenErr.message);
  }

  return {
    status: 200,
    success: true,
    message: 'Email verified successfully! Welcome to FairFly.',
    userId: uid,
    customToken
  };
};

/**
 * Resend verification code with cooldown enforcement
 */
const resendVerificationCode = async ({ email }) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { status: 400, error: 'Email address is required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const docId = Buffer.from(normalizedEmail).toString('base64url');
  const pendingDocRef = db.collection(COLLECTIONS.PENDING_REGISTRATIONS).doc(docId);
  const docSnapshot = await pendingDocRef.get();

  if (!docSnapshot.exists) {
    return {
      status: 404,
      error: 'No pending registration found for this email. Please register again.'
    };
  }

  const pendingData = docSnapshot.data();

  // Check cooldown timer
  if (pendingData.resendCooldownUntil && Date.now() < pendingData.resendCooldownUntil) {
    const waitSeconds = Math.ceil((pendingData.resendCooldownUntil - Date.now()) / 1000);
    return {
      status: 429,
      error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
      cooldownSeconds: waitSeconds
    };
  }

  // Generate new code, reset attempts and expiry
  const newCode = generateSecure6DigitCode();
  const newCodeHash = hashCode(newCode);
  const now = Date.now();

  await pendingDocRef.update({
    codeHash: newCodeHash,
    attemptsLeft: MAX_ATTEMPTS,
    expiresAt: now + EXPIRY_WINDOW_MS,
    resendCooldownUntil: now + RESEND_COOLDOWN_MS,
    updatedAt: new Date().toISOString()
  });

  // Dispatch new email
  await sendVerificationCodeEmail(normalizedEmail, pendingData.fullName, newCode);

  return {
    status: 200,
    success: true,
    message: 'A fresh 6-digit verification code has been sent to your email.',
    expiresInSeconds: Math.floor(EXPIRY_WINDOW_MS / 1000)
  };
};

module.exports = {
  createPendingRegistration,
  verifyRegistrationCode,
  resendVerificationCode
};
