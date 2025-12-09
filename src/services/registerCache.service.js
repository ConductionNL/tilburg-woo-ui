/**
 * Register Cache Service
 *
 * Simple cache for mapping register IDs to their slugs.
 * Populated by the object store when registers are fetched.
 *
 * Usage:
 *   registerCache.set(registerId, slug)  - Store a mapping
 *   registerCache.get(registerId)        - Get slug for ID (returns null if not found)
 */

/**
 * Simple cache storage: { [registerId]: slug }
 */
const cache = {};

/**
 * Sets a register ID -> slug mapping in the cache
 * @param {string} registerId - The register UUID
 * @param {string} slug - The register slug
 */
const set = (registerId, slug) => {
  if (!registerId || !slug) return;
  registerId = String(registerId);
  cache[registerId] = slug.toLowerCase();
  console.info(`📋 Register cache: ${registerId} -> ${slug.toLowerCase()}`);
};

/**
 * Gets a register slug from cache
 * @param {string} registerId - The register UUID
 * @returns {string|null} The register slug or null if not found
 */
const get = (registerId) => {
  if (!registerId) return null;
  registerId = String(registerId);
  return cache[registerId] || null;
};

/**
 * Gets all cached entries (for debugging)
 * @returns {Object} The entire cache
 */
const getAll = () => {
  return { ...cache };
};

/**
 * Clears the cache
 */
const clear = () => {
  Object.keys(cache).forEach((key) => delete cache[key]);
  console.info('🗑️ Register cache cleared');
};

// Export as a singleton service
export const registerCache = {
  set,
  get,
  getAll,
  clear,
};

export default registerCache;
