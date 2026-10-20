/**
 * Comprehensive payment method and channel formatting utilities.
 * Ensures consistent, professional payment channel descriptions and prevents
 * substring misclassifications (e.g., 'gcash' containing 'cash').
 */

/**
 * Determines whether a given payment method or provider represents direct physical cash.
 * Guarantees that mobile wallets like 'gcash' are NEVER misclassified as cash.
 * 
 * @param {string} method - Raw payment method string (e.g., 'cash', 'gcash', 'Direct Cash (Counter Receipt)')
 * @param {string} [provider] - Provider name (e.g., 'cash', 'paymongo')
 * @returns {boolean}
 */
export function isCashPayment(method, provider) {
  if (provider === 'cash') return true;
  if (!method || typeof method !== 'string') return false;

  const s = method.toLowerCase().trim();
  // Absolute guard: GCash is a mobile wallet, never physical counter cash
  if (s === 'gcash' || s.includes('gcash')) {
    return false;
  }

  return (
    s === 'cash' ||
    s.startsWith('direct cash') ||
    s.startsWith('cash ') ||
    s === 'counter' ||
    s.includes('counter receipt')
  );
}

/**
 * Formats a payment channel for official documents, E-Receipts, and detail views.
 * 
 * @param {string} method - Raw payment method or channel (e.g., 'gcash', 'paymaya', 'card', 'qrph', 'cash')
 * @param {string} [provider] - Provider name (e.g., 'cash', 'paymongo')
 * @returns {string} Formatted human-readable payment channel
 */
export function formatPaymentChannel(method, provider) {
  if (isCashPayment(method, provider)) {
    return 'Direct Cash (Counter Receipt)';
  }

  if (!method) {
    return provider === 'paymongo' ? 'PayMongo Online' : 'Online Payment Gateway';
  }

  const s = String(method).toLowerCase().trim();

  // 1. Electronic Wallets
  if (s === 'gcash' || s.includes('gcash')) {
    return 'GCash (PayMongo)';
  }
  if (s === 'paymaya' || s === 'maya' || s.includes('maya')) {
    return 'Maya (PayMongo)';
  }
  if (s === 'grab_pay' || s === 'grabpay' || s.includes('grab')) {
    return 'GrabPay (PayMongo)';
  }

  // 2. National QR & Cards
  if (s === 'qrph' || s === 'qr_ph' || s.includes('qrph')) {
    return 'QR Ph (PayMongo)';
  }
  if (s === 'card' || s.includes('card') || s === 'credit_card' || s === 'debit_card') {
    return 'Credit / Debit Card (PayMongo)';
  }

  // 3. Buy Now Pay Later & Banking
  if (s === 'billease' || s.includes('billease')) {
    return 'BillEase (PayMongo)';
  }
  if (s === 'dob' || s.includes('online banking') || s.includes('direct online banking')) {
    return 'Direct Online Banking (PayMongo)';
  }

  // 4. Fallbacks
  if (s === 'online' || s === 'paymongo') {
    return 'PayMongo Online';
  }

  return method;
}

/**
 * Formats a concise payment method label for compact table badges and pills.
 * 
 * @param {string} method - Raw payment method or channel
 * @param {string} [provider] - Provider name
 * @returns {string} Short badge label (e.g., 'Cash (Counter)', 'GCash', 'Maya', 'QR Ph', 'Card')
 */
export function formatPaymentMethodPill(method, provider) {
  if (isCashPayment(method, provider)) {
    return 'Cash (Counter)';
  }

  if (!method) {
    return 'Online QR';
  }

  const s = String(method).toLowerCase().trim();

  if (s === 'gcash' || s.includes('gcash')) return 'GCash';
  if (s === 'paymaya' || s === 'maya' || s.includes('maya')) return 'Maya';
  if (s === 'qrph' || s === 'qr_ph' || s.includes('qrph')) return 'QR Ph';
  if (s === 'card' || s.includes('card')) return 'Card';
  if (s === 'grab_pay' || s === 'grabpay' || s.includes('grab')) return 'GrabPay';
  if (s === 'billease' || s.includes('billease')) return 'BillEase';
  if (s === 'dob') return 'Online Banking';

  return method;
}
