class RateLimitService {
  /**
   * @param {number} limit - Maximum requests allowed within the window
   * @param {number} windowMs - Time window in milliseconds (default 15 minutes)
   * @param {number} pruneInterval - Background cleanup frequency in milliseconds (default 1 minute)
   */
  constructor(limit = 100, windowMs = 900000, pruneInterval = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.requests = new Map(); // key (IP/UID) -> Array of timestamps

    // Background timer to remove inactive keys and keep memory clean
    this.timer = setInterval(() => this.prune(), pruneInterval);
    if (this.timer.unref) {
      this.timer.unref(); // Prevent keeping the Node process alive
    }
  }

  /**
   * Checks if a key has exceeded its rate limit. Appends timestamp if allowed.
   * @param {string} key - Unique identifier (e.g. user ID or IP address)
   * @param {number} limit - Override default limit
   * @param {number} windowMs - Override default window size
   * @returns {boolean} - true if allowed, false if rate limited
   */
  isAllowed(key, limit = this.limit, windowMs = this.windowMs) {
    const now = Date.now();
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const timestamps = this.requests.get(key);
    // Filter timestamps falling inside the window
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

    if (validTimestamps.length < limit) {
      validTimestamps.push(now);
      this.requests.set(key, validTimestamps);
      return true;
    }

    // Keep the timestamps list pruned even when blocked
    this.requests.set(key, validTimestamps);
    return false;
  }

  /**
   * Resets rate limit data for a key.
   * @param {string} key 
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Cleans up keys with no active requests to prevent memory leaks.
   */
  prune() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  /**
   * Cleanup timer resources on close.
   */
  close() {
    clearInterval(this.timer);
  }
}

// Instantiate specific limiters:
// High-Capacity / Presentation Limits (configured high to prevent any 429 errors during live demonstrations and testing):
// 1. Tracker / Public Read Limiter: 10,000 requests per 1 minute (supports real-time tracking, background polling, sample tests)
const trackerLimit = parseInt(process.env.TRACKER_RATE_LIMIT, 10) || 10000;
const trackerLimiter = new RateLimitService(trackerLimit, 60000);

// 2. Public Limiter: 5,000 requests per 1 minute (for landing page forms, public inquiries, appointments)
const publicLimit = parseInt(process.env.PUBLIC_RATE_LIMIT, 10) || 5000;
const publicLimiter = new RateLimitService(publicLimit, 60000);

// 3. API Limiter: 20,000 requests per 1 minute (for authenticated client/operator/admin actions and dashboard operations)
const apiLimit = parseInt(process.env.API_RATE_LIMIT, 10) || 20000;
const apiLimiter = new RateLimitService(apiLimit, 60000);

module.exports = {
  RateLimitService,
  trackerLimiter,
  publicLimiter,
  apiLimiter
};

