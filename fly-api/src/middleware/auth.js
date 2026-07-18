const { auth, db } = require('../config/firebase');
const { userCache } = require('../services/cacheService');

/**
 * Middleware to verify the Firebase ID token in Authorization header
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) { //Check if the authorization header is present and starts with Bearer
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const idToken = authHeader.split('Bearer ')[1]; //Get the token from the authorization header upon splitting the string

    // Verify the JWT with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken); //Verify the token from firebase server
    const uid = decodedToken.uid; //Get the uid from the decoded token

    // Check if user details/role are in local cache
    let userDetails = userCache.get(uid); //get the user details from the cache using the uid as the key

    if (!userDetails) { //If miss, query Firestore for user details
      console.log(`Cache miss for user details: ${uid}. Querying Firestore.`);
      // Fetch user details from users collection in Firestore
      const userDocRef = db.doc(`users/${uid}`);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) { //If exists in firestore
        userDetails = { id: userDoc.id, ...userDoc.data() };
        // Cache user details for 5 minutes (Store in RAM so we don't have to query Firestore every time)
        userCache.set(uid, userDetails);
      } else {
        // Fallback if auth exists but firestore user document is not created yet
        userDetails = { id: uid, email: decodedToken.email, role: 'client' };
      }
    } else {
      console.log(`Cache hit for user details: ${uid}`);
    }

    //Pass the decoded token and user details to the next middleware or route handler
    req.user = decodedToken;
    req.userDetails = userDetails;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID Token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * Middleware to enforce role-based access control (RBAC)
 * @param {string|string[]} allowedRoles - Role or array of roles allowed to access
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userDetails || !req.userDetails.role) {
      return res.status(403).json({ error: 'Forbidden: Missing role details' });
    }

    const userRole = req.userDetails.role; //Get the role of the user from the request object
    const isAllowed = Array.isArray(allowedRoles)
      ? allowedRoles.includes(userRole)
      : allowedRoles === userRole;

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
};

module.exports = {
  verifyFirebaseToken,
  requireRole
};
