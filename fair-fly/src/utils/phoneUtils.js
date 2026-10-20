/**
 * Philippine Mobile Phone Number Utilities
 * Standard Philippine Mobile Numbers are 11 digits starting with "09" (e.g. 09171234567).
 */

export const PH_PHONE_REGEX = /^09\d{9}$/;
export const PH_PHONE_MAX_LENGTH = 11;

/**
 * Validates whether a phone number strictly matches the 11-digit Philippine mobile format (09XXXXXXXXX)
 * @param {string} val 
 * @returns {boolean}
 */
export function isValidPhilippinePhone(val) {
  if (!val || typeof val !== 'string') return false;
  const digits = val.replace(/\D/g, '');
  return PH_PHONE_REGEX.test(digits);
}

/**
 * Sanitizes and enforces Philippine mobile format during typing.
 * - Extracts only numeric digits
 * - Automatically prepends '09' or ensures leading '09'
 * - Restricts input length to 11 digits max
 * @param {string} val 
 * @returns {string} Formatted digits
 */
export function sanitizePhilippinePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');

  // If user entered numbers starting with 9 (without 0), prepend 0
  if (digits.startsWith('9')) {
    digits = '0' + digits;
  } else if (digits.startsWith('639')) {
    // International format without +
    digits = '0' + digits.slice(2);
  }

  // Ensure leading '09' if at least 2 digits entered
  if (digits.length >= 2 && !digits.startsWith('09')) {
    digits = '09' + digits.slice(2);
  }

  return digits.slice(0, PH_PHONE_MAX_LENGTH);
}

/**
 * Formats an 11-digit Philippine phone number for clean readability: 09XX-XXX-XXXX
 * @param {string} val 
 * @returns {string}
 */
export function formatPhilippinePhoneDisplay(val) {
  if (!val) return 'N/A';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return val;
}
