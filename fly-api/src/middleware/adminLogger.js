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
  { pattern: '/api/services/active', type: 'activeService' },
  { pattern: '/api/services', type: 'service' },
  { pattern: '/api/operators', type: 'operator' },
  { pattern: '/api/workflow/templates', type: 'workflowTemplate' },
  { pattern: '/api/workflows/templates', type: 'workflowTemplate' },
  { pattern: '/api/workflow/instances', type: 'workflowInstance' },
  { pattern: '/api/workflows/instances', type: 'workflowInstance' },
  { pattern: '/api/workflows', type: 'workflowTemplate' },
  { pattern: '/api/workflow', type: 'workflowTemplate' },
  { pattern: '/api/franchise', type: 'franchiseApplication' },
  { pattern: '/api/tickets', type: 'ticket' },
  { pattern: '/api/inquiries', type: 'inquiry' },
  { pattern: '/api/quotations', type: 'quotation' },
  { pattern: '/api/appointments', type: 'appointment' },
  { pattern: '/api/chats', type: 'chat' },
  { pattern: '/api/upload', type: 'upload' },
];

/**
 * Parse the resource type and resource ID from the request URL.
 * @param {string} url - req.originalUrl (e.g. "/api/services/abc123" or "/api/services")
 * @returns {{ resourceType: string, resourceId: string|null }}
 */
function parseResource(url) {
  // Strip query string
  const path = url.split('?')[0]; // Gets the url path without the query string, e.g "/api/services/abc123?limit=10" -> "/api/services/abc123"

  // 1. Early return for exact pattern match (e.g. POST /api/services) — no slicing or segment parsing required
  for (const { pattern, type } of RESOURCE_PATTERNS) {
    if (path === pattern) {
      return { resourceType: type, resourceId: null };
    }
  }

  // 2. Return when resource ID is provided or sub-action/bulk endpoint (e.g. PATCH /api/services/abc123 or POST /api/services/bulk-delete)
  for (const { pattern, type } of RESOURCE_PATTERNS) {
    if (path.startsWith(pattern + '/')) {
      const remainder = path.slice(pattern.length + 1); // Everything after pattern and trailing slash
      const segments = remainder ? remainder.split('/') : []; // Splits remainder by "/"

      const SUB_ACTION_KEYWORDS = ['bulk-delete', 'bulk-status', 'messages', 'status', 'step'];
      let resourceId = segments[0] || null; // Gets the first segment (e.g. "abc123")

      if (resourceId && SUB_ACTION_KEYWORDS.includes(resourceId)) { // Checks if the first segment is a sub-action keyword
        resourceId = null; // Sets resource ID to null if it is a sub-action keyword
      }

      return { resourceType: type, resourceId }; // Returns resource type and resource ID (or null for bulk actions)
    }
  }

  // 3. Fallback return if no pattern matches
  return { resourceType: 'unknown', resourceId: null }; // Returns "unknown" if no pattern matches
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

  //On finish of the request (Will be added/executed on the last middleware automatically after all other middleware finishes (or the controller finishes))
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

  next(); //Calls next middleware function (or the controller if this is the last middleware)
}

module.exports = { adminLogger };
