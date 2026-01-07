/**
 * Schema Cache Service
 *
 * Simple cache for mapping schema IDs to their slugs.
 * Populated by the object store when schemas are fetched.
 *
 * Usage:
 *   schemaCache.set(schemaId, slug)  - Store a mapping
 *   schemaCache.get(schemaId)        - Get slug for ID (returns null if not found)
 *   schemaCache.waitFor(schemaId)    - Wait for a specific schema to be cached
 *   schemaCache.isReady()            - Check if cache has any entries
 *   schemaCache.waitUntilReady()     - Wait until cache has at least one entry
 */

/**
 * Simple cache storage: { [schemaId]: slug }
 */
const cache = {};

/**
 * Pending waiters for specific schema IDs: { [schemaId]: [{ resolve, reject, timeoutId }] }
 */
const waiters = {};

/**
 * Pending waiters for general readiness
 */
let readinessWaiters = [];

/**
 * Sets a schema ID -> slug mapping in the cache
 * @param {string} schemaId - The schema UUID
 * @param {string} slug - The schema slug
 */
const set = (schemaId, slug) => {
  if (!schemaId || !slug) return;
  cache[schemaId] = slug.toLowerCase();
  console.info(`📋 Schema cache: ${schemaId} -> ${slug.toLowerCase()}`);

  // Resolve any waiters for this specific schema ID
  if (waiters[schemaId]) {
    waiters[schemaId].forEach(({ resolve, timeoutId }) => {
      clearTimeout(timeoutId);
      resolve(slug.toLowerCase());
    });
    delete waiters[schemaId];
  }

  // Resolve any general readiness waiters (first entry added)
  if (readinessWaiters.length > 0) {
    readinessWaiters.forEach(({ resolve, timeoutId }) => {
      clearTimeout(timeoutId);
      resolve(true);
    });
    readinessWaiters = [];
  }
};

/**
 * Gets a schema slug from cache
 * @param {string} schemaId - The schema UUID
 * @returns {string|null} The schema slug or null if not found
 */
const get = (schemaId) => {
  if (!schemaId) return null;
  return cache[schemaId] || null;
};

/**
 * Gets all cached entries (for debugging)
 * @returns {Object} The entire cache
 */
const getAll = () => {
  return { ...cache };
};

/**
 * Checks if the cache has any entries
 * @returns {boolean} True if cache has at least one entry
 */
const isReady = () => {
  return Object.keys(cache).length > 0;
};

/**
 * Waits for a specific schema ID to be available in the cache
 * @param {string} schemaId - The schema UUID to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<string|null>} Resolves with the schema slug or null on timeout
 */
const waitFor = (schemaId, timeout = 10000) => {
  if (!schemaId) return Promise.resolve(null);

  // If already cached, return immediately
  const existing = cache[schemaId];
  if (existing) return Promise.resolve(existing);

  // Otherwise, wait for it to be set
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      // Remove this waiter on timeout
      if (waiters[schemaId]) {
        waiters[schemaId] = waiters[schemaId].filter(
          (waiter) => waiter.timeoutId !== timeoutId
        );
        if (waiters[schemaId].length === 0) {
          delete waiters[schemaId];
        }
      }
      resolve(null); // Resolve with null on timeout instead of rejecting
    }, timeout);

    if (!waiters[schemaId]) {
      waiters[schemaId] = [];
    }
    waiters[schemaId].push({ resolve, timeoutId });
  });
};

/**
 * Waits until the cache has at least one entry
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<boolean>} Resolves with true when ready, false on timeout
 */
const waitUntilReady = (timeout = 10000) => {
  // If already has entries, return immediately
  if (Object.keys(cache).length > 0) return Promise.resolve(true);

  // Otherwise, wait for the first entry
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      // Remove this waiter on timeout
      readinessWaiters = readinessWaiters.filter(
        (waiter) => waiter.timeoutId !== timeoutId
      );
      resolve(false); // Resolve with false on timeout instead of rejecting
    }, timeout);

    readinessWaiters.push({ resolve, timeoutId });
  });
};

/**
 * Clears the cache
 */
const clear = () => {
  Object.keys(cache).forEach((key) => delete cache[key]);
  console.info('🗑️ Schema cache cleared');
};

// Export as a singleton service
export const schemaCache = {
  set,
  get,
  getAll,
  isReady,
  waitFor,
  waitUntilReady,
  clear,
};

export default schemaCache;
