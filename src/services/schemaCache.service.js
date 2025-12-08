/**
 * Schema Cache Service
 *
 * Simple cache for mapping schema IDs to their slugs.
 * Populated by the object store when schemas are fetched.
 *
 * Usage:
 *   schemaCache.set(schemaId, slug)  - Store a mapping
 *   schemaCache.get(schemaId)        - Get slug for ID (returns null if not found)
 */

/**
 * Simple cache storage: { [schemaId]: slug }
 */
const cache = {};

/**
 * Sets a schema ID -> slug mapping in the cache
 * @param {string} schemaId - The schema UUID
 * @param {string} slug - The schema slug
 */
const set = (schemaId, slug) => {
  if (!schemaId || !slug) return;
  cache[schemaId] = slug.toLowerCase();
  console.info(`📋 Schema cache: ${schemaId} -> ${slug.toLowerCase()}`);
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
  clear,
};

export default schemaCache;
