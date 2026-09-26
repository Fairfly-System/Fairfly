const { db } = require('../config/firebase');

/**
 * Standard prefix definitions for all record types in Fairfly
 */
const ID_PREFIXES = {
  // User types
  CLIENT: 'USR-CLT',
  OPERATOR: 'USR-OPR',
  ADMIN: 'USR-ADM',
  SUPER_ADMIN: 'USR-SUA',

  // Core workflows & operations
  INQUIRY: 'INQ',
  QUOTATION: 'QTN',
  ACTIVE_SERVICE: 'SVC',

  // Catalog & templates
  SERVICE: 'CAT',
  WORKFLOW_TEMPLATE: 'WFL',
  WORKFLOW_INSTANCE: 'WFI',
  QUICK_LINK: 'QLK',

  // Customer support & communications
  TICKET: 'TKT',
  APPOINTMENT: 'APT',
  RESOURCE: 'RES',
  NOTIFICATION: 'NTF',
  CONVERSATION: 'CNV',
  MESSAGE: 'MSG',
  ANNOUNCEMENT: 'ANN',

  // Applications & external intake
  QUALIFICATION: 'QAP',
  FRANCHISE: 'FRA',

  // System & logs
  FAQ: 'FAQ',
  ADMIN_LOG: 'LOG'
};

/**
 * Generates a Firestore-compatible auto-generated ID prepended with the specified prefix.
 * Example: generatePrefixedId(ID_PREFIXES.INQUIRY) => 'INQ-7Bnyoyr4ttavLdppjJ8n'
 *
 * @param {string} prefix - The prefix constant (e.g., 'INQ', 'USR-CLT')
 * @returns {string} The prefixed document ID
 */
const generatePrefixedId = (prefix) => {
  const autoId = db.collection('_dummy').doc().id;
  return prefix ? `${prefix}-${autoId}` : autoId;
};

/**
 * Extracts the prefix from a prefixed ID string.
 * Supports composite prefixes like 'USR-OPR' or simple prefixes like 'INQ'.
 *
 * @param {string} id - The ID string (e.g., 'USR-OPR-abc123' or 'INQ-xyz789')
 * @returns {string|null} The extracted prefix or null if none found
 */
const parsePrefix = (id) => {
  if (!id || typeof id !== 'string') return null;

  // Check against known multi-segment prefixes first
  for (const p of Object.values(ID_PREFIXES)) {
    if (id.startsWith(`${p}-`)) {
      return p;
    }
  }

  // Fallback to splitting by the first hyphen
  const parts = id.split('-');
  return parts.length > 1 ? parts[0] : null;
};

/**
 * Strips the prefix from a prefixed ID, returning the raw Firestore auto-ID.
 *
 * @param {string} id - The prefixed ID
 * @returns {string} The raw ID without prefix
 */
const getRawId = (id) => {
  if (!id || typeof id !== 'string') return id;
  const prefix = parsePrefix(id);
  if (prefix && id.startsWith(`${prefix}-`)) {
    return id.slice(prefix.length + 1);
  }
  return id;
};

/**
 * Checks if an ID string starts with a specific prefix.
 *
 * @param {string} id - The ID string
 * @param {string} prefix - The prefix to check against
 * @returns {boolean}
 */
const hasPrefix = (id, prefix) => {
  if (!id || typeof id !== 'string') return false;
  return id.startsWith(`${prefix}-`);
};

module.exports = {
  ID_PREFIXES,
  generatePrefixedId,
  parsePrefix,
  getRawId,
  hasPrefix
};
