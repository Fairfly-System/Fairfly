class Cache {
  /**
   * @param {number} defaultTtl - Time to live in milliseconds (default 1 minute)
   * @param {number} pruneInterval - Check interval for cleanup in milliseconds (default 30 seconds)
   */
  constructor(defaultTtl = 60000, pruneInterval = 30000) {
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
    
    // Automatically prune expired keys at a regular interval to prevent memory leaks
    this.timer = setInterval(() => this.prune(), pruneInterval);
    if (this.timer.unref) {
      this.timer.unref(); // Prevent timer from keeping the node process alive
    }
  }

  /**
   * Set a value in the cache with a specific TTL.
   * @param {string} key 
   * @param {*} value 
   * @param {number} ttl 
   */
  set(key, value, ttl = this.defaultTtl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache. Returns null if key doesn't exist or is expired.
   * @param {string} key 
   * @returns {*}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a key from the cache.
   * @param {string} key 
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Alias for delete
   * @param {string} key 
   */
  del(key) {
    this.delete(key);
  }

  /**
   * Clear all items in the cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Prunes expired keys from memory.
   */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cleanup resource on close.
   */
  close() {
    clearInterval(this.timer);
  }
}

// Global cache instances for different domains
const userCache = new Cache(300000);      // Cache user roles/details for 5 minutes
const staticDataCache = new Cache(60000);  // Cache services, operators, quick links for 1 minute

module.exports = {
  Cache,
  userCache,
  staticDataCache
};
