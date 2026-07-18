const { publicLimiter, apiLimiter } = require('../services/rateLimitService');

/**
 * Rate limiting middleware for public endpoints (uses IP address)
 */
const publicRateLimiter = (req, res, next) => {
  const key = `ip-${req.ip}`;
  if (!publicLimiter.isAllowed(key)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down and try again later.' });
  }
  next();
};

/**
 * Rate limiting middleware for authenticated/standard API routes
 * uses user ID if authenticated, falling back to IP address.
 */
const apiRateLimiter = (req, res, next) => {
  // Identify by user ID or fallback to IP
  const identifier = req.userDetails?.id || req.user?.uid || `ip-${req.ip}`;
  const key = `api-${identifier}`;
  
  if (!apiLimiter.isAllowed(key)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down and try again later.' });
  }
  next();
};

module.exports = {
  publicRateLimiter,
  apiRateLimiter
};
