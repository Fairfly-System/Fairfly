const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); //Import the dotenv module to use environment variables

let db;
let auth;

const normalizeServiceAccount = (serviceAccount) => {
  if (!serviceAccount || !serviceAccount.private_key) {
    return serviceAccount;
  }

  return {
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n')
  };
};

const loadServiceAccountFromEnv = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      console.log('Loading Firebase Admin SDK credentials from environment variable.');
      return normalizeServiceAccount(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } catch (e) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON: ${e.message}`);
    }
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Loading Firebase Admin SDK credentials from individual environment variables.');
    return normalizeServiceAccount({
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY
    });
  }

  return null;
};

const loadServiceAccountFromFile = () => {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || path.join(__dirname, '../../service-account.json');
  const resolvedPath = path.resolve(keyPath);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  console.log(`Loading Firebase Admin SDK credentials from file: ${resolvedPath}`);
  return require(resolvedPath);
};

try {
  const serviceAccount = loadServiceAccountFromEnv() || loadServiceAccountFromFile();

  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK already initialized; reusing existing app.');
  } else if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn('WARNING: No service account configuration found. Initializing Firebase Admin SDK with default application credentials.');
    admin.initializeApp();
  }

  db = admin.firestore();
  auth = admin.auth();
  console.log('Firebase Admin SDK successfully initialized.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  throw error;
}

module.exports = {
  admin,
  db,
  auth
};
