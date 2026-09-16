/**
 * Advanced Self-Pruning Caching Service
 * 
 * Architecture:
 * - CacheCollection: Central static registry managing active cache lifecycles, retrieval, and pruning.
 * - Cache: Individual cache item managing its own TTL timeout, sliding expiration, and automatic self-pruning.
 */

class CacheCollection {
  /**
   * Static Map registry containing all active Cache instances.
   * Key: Cache identifier (e.g., 'user:123', 'route:GET:/api/services')
   * Value: Cache instance
   * @type {Map<string, Cache>}
   */
  static caches = new Map();

  /**
   * Store a value in the cache registry.
   * If a cache already exists for this key, its existing timer is cancelled
   * before replacing it with the new Cache entry.
   * 
   * @param {string} key - Unique identifier for the cache entry
   * @param {*} data - Payload to be cached
   * @param {number} [ttl=Cache.DEFAULT_TTL] - Time to live in milliseconds
   * @returns {Cache} The created Cache instance
   */
  static set(key, data, ttl = Cache.DEFAULT_TTL) {
    if (!key) {
      throw new Error('Cache key must be a non-empty string');
    }

    // Cancel existing timer if replacing an existing cache key
    const existing = this.caches.get(key);
    if (existing) {
      existing.destroy();
    }

    const cacheEntry = new Cache(ttl, key, data);
    this.caches.set(key, cacheEntry);
    return cacheEntry;
  }

  /**
   * Retrieve cached data by key.
   * Supports Sliding Expiration: when touch is true, resets the item's expiration timer.
   * 
   * @param {string} key - Cache identifier
   * @param {boolean} [touch=true] - Whether to refresh the TTL timer upon read
   * @returns {*|null} The cached data, or null if miss/expired
   */
  static get(key, touch = true) {
    const entry = this.caches.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired (defensive check against edge-case delays in event loop)
    if (Date.now() > entry.expiresAt) {
      this.prune(key);
      return null;
    }

    // Sliding expiration: extend lifecycle on access
    if (touch) {
      entry.refreshTimer();
    }

    return entry.data;
  }

  /**
   * Look up a cache entry and update its stale data and reset its timer.
   * Useful when database records are updated.
   * 
   * @param {string} key - Cache identifier
   * @param {*} newData - Fresh data from DB
   * @param {number} [newTtl] - Optional new TTL in milliseconds
   * @returns {boolean} True if found and updated, false if cache miss
   */
  static update(key, newData, newTtl) {
    const entry = this.caches.get(key);
    if (!entry) {
      return false;
    }

    entry.updateData(newData, newTtl);
    return true;
  }

  /**
   * Retrieve the underlying Cache entry object without modifying its timer.
   * Useful for inspecting metadata (createdAt, expiresAt, ttl).
   * 
   * @param {string} key 
   * @returns {Cache|null}
   */
  static getEntry(key) {
    return this.caches.get(key) || null;
  }

  /**
   * Prunes an entry from the registry, stopping its timer.
   * Unreferences the object so JS garbage collection reclaims it immediately.
   * 
   * @param {string} key 
   * @returns {boolean} True if an entry was removed
   */
  static prune(key) {
    const entry = this.caches.get(key);
    if (entry) {
      entry.destroy();
      return this.caches.delete(key);
    }
    return false;
  }

  /**
   * Explicit deletion (alias for prune).
   * Call this when a database record is deleted.
   * 
   * @param {string} key 
   * @returns {boolean}
   */
  static delete(key) {
    return this.prune(key);
  }

  /**
   * Check if an active, non-expired cache exists for key.
   * 
   * @param {string} key 
   * @returns {boolean}
   */
  static has(key) {
    const entry = this.caches.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.prune(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all active caches and cancel all running timers.
   */
  static clear() {
    for (const [key, entry] of this.caches.entries()) {
      if (entry) {
        entry.destroy();
      }
    }
    this.caches.clear();
  }

  /**
   * Returns current count of cached items in memory.
   * @returns {number}
   */
  static size() {
    return this.caches.size;
  }

  /**
   * Standardized cache key generator helper.
   * 
   * @param {string} namespace - e.g. 'user', 'route', 'service'
   * @param {string|number} identifier - Primary ID or endpoint path
   * @param {Object} [options] - Additional parameters (query params, user context)
   * @returns {string}
   */
  static createKey(namespace, identifier, options = {}) {
    let key = `${namespace}:${identifier}`;
    if (options.params && Object.keys(options.params).length > 0) {
      const sortedQuery = Object.keys(options.params)
        .sort()
        .map(k => `${k}=${encodeURIComponent(options.params[k])}`)
        .join('&');
      key += `?${sortedQuery}`;
    }
    if (options.userId) {
      key += `:uid_${options.userId}`;
    }
    return key;
  }
}

class Cache {
  static DEFAULT_TTL = 60000; // 1 minute in milliseconds

  static SECONDS(s) { return s * 1000; }
  static MINUTES(m) { return m * 60 * 1000; }
  static HOURS(h) { return h * 60 * 60 * 1000; }

  /**
   * Create a new Cache entry.
   * Automatically starts its self-prune timeout and registers with CacheCollection.
   * 
   * @param {number} ttl - Time to live in milliseconds
   * @param {string} uid - Unique cache key identifier
   * @param {*} data - Data to cache
   */
  constructor(ttl, uid, data) {
    if (!uid) {
      throw new Error('Cache uid/key must be provided');
    }

    this.ttl = Number(ttl) > 0 ? Number(ttl) : Cache.DEFAULT_TTL;
    this.uid = String(uid);
    this.data = data;
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + this.ttl;
    this.timer = null;

    // Register with CacheCollection static registry
    if (CacheCollection.caches.get(this.uid) !== this) {
      CacheCollection.caches.set(this.uid, this);
    }

    // Start self-pruning timer
    this.refreshTimer();
  }

  /**
   * Refreshes or resets the self-pruning timer.
   * Used for sliding expiration (refresh on read) or TTL extension.
   * 
   * @param {number} [newTtl] - Optional new TTL in milliseconds
   */
  refreshTimer(newTtl) {
    this.clearTimer();

    if (newTtl && Number(newTtl) > 0) {
      this.ttl = Number(newTtl);
    }

    this.expiresAt = Date.now() + this.ttl;

    this.timer = setTimeout(() => {
      CacheCollection.prune(this.uid);
    }, this.ttl);

    // Prevent active cache timers from blocking process termination
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  /**
   * Update cached payload with new data and restart expiration timer.
   * 
   * @param {*} newData 
   * @param {number} [newTtl] 
   */
  updateData(newData, newTtl) {
    this.data = newData;
    this.refreshTimer(newTtl);
  }

  /**
   * Cancels the active timeout safely.
   */
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Prepares the entry for garbage collection.
   */
  destroy() {
    this.clearTimer();
    this.data = null;
  }
}

/**
 * ============================================================================
 * Backward-Compatible Domain Adapters
 * ============================================================================
 * Preserves compatibility for existing controllers and middleware:
 * - auth.js (userCache.get, userCache.set)
 * - adminController.js (userCache.delete)
 * - clientController.js (userCache.delete)
 * - operatorController.js (userCache.delete)
 * - qualificationController.js (userCache.delete)
 * - serviceController.js (staticDataCache.get, staticDataCache.set, staticDataCache.delete, clear)
 */

const userCache = {
  get(uid, touch = true) {
    return CacheCollection.get(`user:${uid}`, touch);
  },
  set(uid, data, ttl = Cache.MINUTES(5)) {
    return CacheCollection.set(`user:${uid}`, data, ttl);
  },
  update(uid, data, ttl = Cache.MINUTES(5)) {
    return CacheCollection.update(`user:${uid}`, data, ttl);
  },
  delete(uid) {
    return CacheCollection.delete(`user:${uid}`);
  },
  del(uid) {
    return this.delete(uid);
  },
  has(uid) {
    return CacheCollection.has(`user:${uid}`);
  },
  clear() {
    for (const key of CacheCollection.caches.keys()) {
      if (key.startsWith('user:')) {
        CacheCollection.delete(key);
      }
    }
  }
};

const staticDataCache = {
  get(key, touch = true) {
    return CacheCollection.get(`static:${key}`, touch);
  },
  set(key, data, ttl = Cache.MINUTES(1)) {
    // Gracefully handle seconds if small number passed (e.g. 300 -> 300,000ms)
    const normalizedTtl = (typeof ttl === 'number' && ttl > 0 && ttl <= 1000)
      ? ttl * 1000
      : ttl;
    return CacheCollection.set(`static:${key}`, data, normalizedTtl);
  },
  update(key, data, ttl = Cache.MINUTES(1)) {
    const normalizedTtl = (typeof ttl === 'number' && ttl > 0 && ttl <= 1000)
      ? ttl * 1000
      : ttl;
    return CacheCollection.update(`static:${key}`, data, normalizedTtl);
  },
  delete(key) {
    return CacheCollection.delete(`static:${key}`);
  },
  del(key) {
    return this.delete(key);
  },
  has(key) {
    return CacheCollection.has(`static:${key}`);
  },
  clear() {
    for (const key of CacheCollection.caches.keys()) {
      if (key.startsWith('static:')) {
        CacheCollection.delete(key);
      }
    }
  }
};

module.exports = {
  CacheCollection,
  Cache,
  userCache,
  staticDataCache
};
