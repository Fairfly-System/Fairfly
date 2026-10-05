const { db } = require('../config/firebase');
const { ID_PREFIXES, generatePrefixedId } = require('../utils/idGenerator');

const COLLECTION = 'operator-logs';
const DEFAULT_RETENTION_DAYS = 90;

/**
 * Logs an operator action with human-readable description and retention metadata.
 *
 * @param {Object} params
 * @param {string} params.operatorId - The operator's user UID
 * @param {string} [params.operatorEmail] - Operator email address
 * @param {string} [params.branchName] - Branch name / location identifier
 * @param {string} params.action - Categorical action code (e.g. 'CREATE_QUOTATION')
 * @param {string} params.entityType - Target resource type ('quotation', 'inquiry', 'activeService', etc.)
 * @param {string} params.entityId - Primary identifier of the affected entity
 * @param {string} params.description - Verbose, human-understandable explanation (e.g. "Made a Quotation QTN-1029...")
 * @param {Object} [params.metadata] - Optional additional details (amounts, client reference, step names)
 * @returns {Promise<Object|null>} The created log entry or null if failed
 */
async function logOperatorAction({
  operatorId,
  operatorEmail = '',
  branchName = '',
  action,
  entityType,
  entityId,
  description,
  metadata = {}
}) {
  try {
    if (!operatorId || !action || !description) {
      console.warn('[operatorLogger] Missing required fields for operator log:', { operatorId, action, description });
      return null;
    }

    const now = new Date();
    const retentionExpiresAt = new Date(now.getTime() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const logId = generatePrefixedId(ID_PREFIXES.OPERATOR_LOG);

    const logEntry = {
      id: logId,
      operatorId,
      operatorEmail: operatorEmail || 'unknown',
      branchName: branchName || 'Branch Office',
      action,
      entityType: entityType || 'general',
      entityId: entityId || '',
      description,
      timestamp: now.toISOString(),
      isArchived: false,
      retentionExpiresAt: retentionExpiresAt.toISOString(),
      metadata: metadata || {}
    };

    await db.collection(COLLECTION).doc(logId).set(logEntry);
    return logEntry;
  } catch (error) {
    // Non-blocking safety net: logging should never fail the parent business mutation
    console.error('[operatorLogger] Failed to write operator log entry:', error.message);
    return null;
  }
}

/**
 * Helper to log an action directly from an Express request context.
 * Automatically resolves operatorId, email, and branch name from req.user and req.userDetails.
 *
 * @param {import('express').Request} req
 * @param {Object} details
 * @param {string} details.action
 * @param {string} details.entityType
 * @param {string} details.entityId
 * @param {string} details.description
 * @param {Object} [details.metadata]
 */
async function logFromRequest(req, { action, entityType, entityId, description, metadata }) {
  if (!req?.user?.uid) return null;

  // Only log if user is an operator or branch operator
  const role = req.userDetails?.role || req.user?.role;
  if (role !== 'operator' && role !== 'branch_operator') {
    return null;
  }

  const operatorId = req.user.uid;
  const operatorEmail = req.user.email || req.userDetails?.email || '';
  const branchName = req.userDetails?.branchName || req.userDetails?.name || 'Branch';

  return logOperatorAction({
    operatorId,
    operatorEmail,
    branchName,
    action,
    entityType,
    entityId,
    description,
    metadata
  });
}

/**
 * Retrieves paginated operator logs for a specific operator.
 * Supports cursor pagination (startAfter doc id) and retention filter.
 *
 * @param {Object} options
 * @param {string} options.operatorId - Filter by operator UID
 * @param {number} [options.limitCount=5] - Number of logs to retrieve
 * @param {string} [options.startAfterId] - Cursor ID for subsequent page fetches
 * @param {boolean} [options.onlyActive=true] - If true, excludes archived records
 */
async function getOperatorLogs({ operatorId, limitCount = 5, startAfterId = null, onlyActive = true }) {
  try {
    let q = db.collection(COLLECTION).where('operatorId', '==', operatorId);

    if (onlyActive) {
      q = q.where('isArchived', '==', false);
    }

    q = q.orderBy('timestamp', 'desc');

    if (startAfterId) {
      const cursorDoc = await db.collection(COLLECTION).doc(startAfterId).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    const snap = await q.limit(Number(limitCount) || 5).get();
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const lastVisibleId = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null;
    const hasMore = snap.docs.length === Number(limitCount);

    return {
      logs,
      lastVisibleId,
      hasMore,
      count: logs.length
    };
  } catch (error) {
    console.error('[operatorLogger] Error in getOperatorLogs:', error.message);
    throw error;
  }
}

module.exports = {
  COLLECTION,
  logOperatorAction,
  logFromRequest,
  getOperatorLogs
};
