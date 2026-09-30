/**
 * Firebase Cloud Functions entry point.
 *
 * This file is intentionally lightweight so the Firebase CLI can discover
 * exported functions within the 10-second analysis timeout.
 *
 * The heavy Express app (20+ routes, Firebase Admin SDK, multer, etc.)
 * is lazily loaded on first invocation, not during module discovery.
 */
const { onRequest } = require('firebase-functions/v2/https');

let app;

const getApp = () => {
  if (!app) {
    // Lazy-load the full Express app only when the function is actually called
    const serverModule = require('./src/server');
    app = serverModule.app;
  }
  return app;
};

exports.api = onRequest(
  {
    region: 'asia-southeast1',
    memory: '512MiB',
    timeoutSeconds: 60
  },
  (req, res) => {
    getApp()(req, res);
  }
);
