/**
 * ID generator for client-side requirement and record pre-allocations
 */

export function generateRequirementId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REQ-${autoId}`;
}

export default {
  generateRequirementId
};
