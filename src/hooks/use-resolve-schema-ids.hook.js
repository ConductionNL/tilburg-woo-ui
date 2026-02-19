import { useCallback, useEffect, useState } from 'react';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';

/**
 * Hook that resolves schema IDs (numeric strings like "15") to full schema
 * objects with slugs. This is needed because the /uses and /used endpoints
 * return items with `@self.schema` as a string ID, without including
 * `@self.schemas` metadata to look them up.
 *
 * Fetches all schemas once from /openregister/api/schemas, populates both
 * the global schemaCache and the returned aggregatedSchemas state.
 *
 * @param {Array} items - Array of items from uses/used endpoints
 * @returns {{ aggregatedSchemas: Object, schemasLoading: boolean }}
 */
export const useResolveSchemaIds = (items) => {
  const [aggregatedSchemas, setAggregatedSchemas] = useState({});
  const [schemasLoading, setSchemasLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const resolveSchemaIds = useCallback(async (allItems) => {
    if (!allItems?.length || fetched) return;

    // Check if any items have unresolved schema IDs
    const hasUnresolved = allItems.some((item) => {
      const sid = item?.['@self']?.schema;
      return sid && typeof sid !== 'object' && !schemaCache.get(String(sid));
    });

    if (!hasUnresolved) return;

    setSchemasLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/openregister/api/schemas?_limit=100`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const data = await response.json();
      const allSchemas = data.results || [];

      const schemasById = {};
      allSchemas.forEach((s) => {
        const sid = String(s.id);
        schemasById[sid] = s;
        if (s.slug) schemaCache.set(sid, s.slug);
      });

      setAggregatedSchemas((prev) => ({ ...prev, ...schemasById }));
      setFetched(true);
    } catch (error) {
      console.error('Error fetching schemas for resolution:', error);
    } finally {
      setSchemasLoading(false);
    }
  }, [fetched]);

  useEffect(() => {
    if (items?.length > 0) {
      resolveSchemaIds(items);
    }
  }, [items, resolveSchemaIds]);

  return { aggregatedSchemas, setAggregatedSchemas, schemasLoading };
};
