/**
 * Schema Resolution Utilities
 *
 * Utilities for resolving schema IDs to slugs using the schema cache.
 * Provides reactive hooks that wait for cache warmup and re-render when cache is populated.
 */

import React from 'react';
import { schemaCache } from '@services/schemaCache.service';

/**
 * Hook that resolves a schema ID to its slug, waiting for cache warmup if needed
 * 
 * **Optimized behavior (waits for cache warmup):**
 * - Checks cache synchronously first for immediate display if available
 * - Waits for cache warmup using schemaCache.waitFor() if not found
 * - Re-renders component when cache is populated
 * 
 * @param {string|number} schemaId - Schema ID to resolve
 * @returns {{slug: string|null, isLoading: boolean}} Resolved slug and loading state
 */
export const useResolvedSchema = (schemaId) => {
  const [slug, setSlug] = React.useState(() => {
    // Initial check - if already in cache, use it immediately
    return schemaId ? schemaCache.get(schemaId) : null;
  });
  const [isLoading, setIsLoading] = React.useState(() => {
    // Start loading if schemaId exists but not in cache
    return Boolean(schemaId && !schemaCache.get(schemaId));
  });

  React.useEffect(() => {
    if (!schemaId) {
      setSlug(null);
      setIsLoading(false);
      return;
    }

    // Check cache synchronously first
    const cachedSlug = schemaCache.get(schemaId);
    if (cachedSlug) {
      setSlug(cachedSlug);
      setIsLoading(false);
      return;
    }

    // Not in cache - wait for it to be populated
    setIsLoading(true);
    schemaCache
      .waitFor(schemaId, 10000)
      .then((resolvedSlug) => {
        setSlug(resolvedSlug);
        setIsLoading(false);
      })
      .catch(() => {
        // On error/timeout, check cache one more time
        const finalSlug = schemaCache.get(schemaId);
        setSlug(finalSlug);
        setIsLoading(false);
      });
  }, [schemaId]);

  return { slug, isLoading };
};

export default {
  useResolvedSchema,
};
