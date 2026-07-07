/**
 * RateLimiter utility to prevent spamming and griefing of database operations.
 * Implements a sliding window approach to track requests.
 */

class RateLimiter {
  constructor(limit = 5, interval = 60000) {
    this.limit = limit; // Max number of requests
    this.interval = interval; // Time window in milliseconds (default 1 minute)
    this.requests = new Map(); // Stores timestamps for each action/user key
  }

  /**
   * Checks if a specific action is allowed based on the rate limit.
   * @param {string} key - A unique key for the action (e.g., 'submit-application', 'update-profile')
   * @returns {boolean} - True if request is allowed, false otherwise.
   */
  
  isAllowed(key) {
    const now = Date.now();
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const timestamps = this.requests.get(key);

    // Eliminate the expired timestamps
    // Filter out timestamps that are outside the current window
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.interval);

    //Checks if the number of valid requests is less than the allowed limit
    if (validTimestamps.length < this.limit) {
      validTimestamps.push(now); //If not, add the current timestamp
      this.requests.set(key, validTimestamps);
      return true;
    }

    return false;
  }

  /**
   * Clears the rate limit for a specific key.
   * @param {string} key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Wraps an async function with rate limiting logic.
   * @param {Function} fn - The async function to wrap.
   * @param {string} key - The key to track for this function.
   * @param {number} limit - Override default limit.
   * @param {number} interval - Override default interval.
   * @returns {Function} - The wrapped function.
   */
  wrap(fn, key, limit = this.limit, interval = this.interval) {
    const localLimiter = new RateLimiter(limit, interval);

    return async (...args) => {
      if (!localLimiter.isAllowed(key)) {
        throw new Error(`Too many requests. Please wait a moment before trying again.`);
      }
      return await fn(...args);
    };
  }
}

// Export a singleton instance for global use, or the class for custom instances
export const globalRateLimiter = new RateLimiter();
export default RateLimiter;
