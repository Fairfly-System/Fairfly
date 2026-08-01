const { db } = require('../config/firebase');

const COLLECTION = 'admin-logs';

/**
 * Maps HTTP method → human-readable action type.
 */
const METHOD_ACTION_MAP = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Ordered from most-specific to least-specific so that
 * `/api/services/quicklinks` matches before `/api/services`.
 */
const RESOURCE_PATTERNS = [
  { pattern: '/api/services/quicklinks', type: 'quicklink' },
  { pattern: '/api/services', type: 'service' },
  { pattern: '/api/operators', type: 'operator' },
  { pattern: '/api/workflow/templates', type: 'workflowTemplate' },
  { pattern: '/api/workflow/instances', type: 'workflowInstance' },
  { pattern: '/api/franchise', type: 'franchiseApplication' },
  { pattern: '/api/chats', type: 'chat' },
];

/**
 * Parse the resource type and resource ID from the request URL.
 * @param {string} url - req.originalUrl (e.g. "/api/services/abc123")
 * @returns {{ resourceType: string, resourceId: string|null }}
 */
function parseResource(url) {
  // Strip query string
  const path = url.split('?')[0];

  for (const { pattern, type } of RESOURCE_PATTERNS) {
    if (path.startsWith(pattern)) {
      // Everything after the pattern prefix, split by "/"
      const remainder = path.slice(pattern.length).replace(/^\//, '');
      const segments = remainder ? remainder.split('/') : [];
      // First segment is likely the resource ID (if it exists and isn't a sub-action keyword)
      const resourceId = segments[0] || null;
      return { resourceType: type, resourceId };
    }
  }

  return { resourceType: 'unknown', resourceId: null };
}

/**
 * Express middleware that logs successful CUD operations to Firestore.
 *
 * Attach this BEFORE route mounting in server.js — it hooks into
 * `res.on('finish')` so the actual write happens AFTER the response
 * has been fully sent to the client. It never blocks or delays responses.
 *
 * Current scope: admin-role only.
 * Designed to be extended to other roles by changing the role check below.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function adminLogger(req, res, next) {
  // Only intercept mutating methods
  if (!METHOD_ACTION_MAP[req.method]) {
    return next();
  }

  res.on('finish', () => {
    try {
      // Only log successful responses (2xx)
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      // Only log authenticated requests (req.user is set by verifyFirebaseToken)
      if (!req.user) return;

      // Current scope: admin-only. Change this check to expand to other roles later.
      const role = req.userDetails?.role;
      if (role !== 'admin') return;

      const { resourceType, resourceId } = parseResource(req.originalUrl);

      const logEntry = {
        adminUid: req.user.uid,
        adminEmail: req.user.email || req.userDetails?.email || 'unknown',
        method: req.method,
        path: req.originalUrl,
        resourceType,
        resourceId,
        statusCode: res.statusCode,
        actionType: METHOD_ACTION_MAP[req.method],
        timestamp: new Date().toISOString(),
      };

      // Fire-and-forget write — never throw from here
      db.collection(COLLECTION)
        .add(logEntry)
        .catch((err) => {
          console.error('[adminLogger] Failed to write log entry:', err.message);
        });
    } catch (err) {
      // Safety net — logging should never crash the server
      console.error('[adminLogger] Unexpected error in finish handler:', err.message);
    }
  });

  next();
}

module.exports = { adminLogger };
