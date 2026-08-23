/**
 * Utility for converting technical backend, Firebase, and network error messages
 * into friendly, casual, and helpful user-facing notifications.
 */

const ERROR_MAP = {
  // Firebase Auth Errors
  'auth/wrong-password': "Oops! The password you entered is incorrect. Please double-check and try again.",
  'auth/invalid-credential': "The email or password you entered doesn't match our records. Please try again.",
  'auth/user-not-found': "We couldn't find an account with that email address. Please check for typos or register.",
  'auth/email-already-in-use': "An account with this email already exists. Try logging in instead.",
  'auth/weak-password': "Your password is too short. Please use at least 6 characters.",
  'auth/invalid-email': "Please enter a valid email address.",
  'auth/too-many-requests': "Too many attempts! Please take a quick breather and try again in a few moments.",
  'auth/network-request-failed': "Network hiccup! Please check your internet connection and try again.",
  'auth/user-disabled': "This account has been temporarily disabled. Please reach out to support for help.",

  // General & Network Errors
  'failed to fetch': "Unable to connect to the server. Please check your internet connection.",
  'network error': "Looks like you're offline or having connection issues. Please try again.",
  'unauthorized': "Your session expired. Please log in again to continue.",
  'forbidden': "You don't have permission to perform this action.",
  'not found': "The requested item or record could not be found.",
  'internal server error': "Something went wrong on our end. Please try again in a moment.",
  'invalid service data': "Please make sure all required service fields are filled out correctly.",
};

/**
 * Transforms any error object, string, or code into a clean, friendly message.
 * @param {Error|string|any} error - The error to format
 * @param {string} fallback - Optional custom fallback message
 * @returns {string} User-friendly message
 */
export function toFriendlyMessage(error, fallback = "Something went wrong. Please try again or contact support if the issue persists.") {
  if (!error) return fallback;

  let rawMessage = '';
  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error.code) {
    rawMessage = error.code;
  } else if (error.message) {
    rawMessage = error.message;
  } else {
    rawMessage = String(error);
  }

  const lower = rawMessage.toLowerCase();

  // 1. Direct code or string match
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      return friendly;
    }
  }

  // 2. Clean out technical Firebase prefixes: "Firebase: Error (auth/...)."
  const cleaned = rawMessage
    .replace(/^firebase:\s*error\s*\(([^)]+)\)\.?/i, (match, p1) => {
      return ERROR_MAP[p1] || p1;
    })
    .replace(/^error:\s*/i, '')
    .trim();

  // If cleaning produced a readable string without raw code artifacts, return it capitalized
  if (cleaned && !cleaned.includes('auth/') && !cleaned.includes('status code') && !cleaned.includes('TypeError')) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return fallback;
}

export default toFriendlyMessage;
