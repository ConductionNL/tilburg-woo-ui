import { useState, useEffect } from 'react';
import { isUUID } from '../utilities';
import { withStore } from '@stores';

/**
 * Hook to resolve UUID labels in facet buckets to human-readable names
 * 
 * @param {Object} facets - The facets object from the store
 * @param {Object} objectStore - The object store for name resolution
 * @returns {Object} - Facets object with resolved names for UUID labels
 */
export const useFacetNameResolution = (facets, objectStore) => {
  const [resolvedFacets, setResolvedFacets] = useState(facets);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!facets || !objectStore || Object.keys(facets).length === 0) {
      setResolvedFacets(facets);
      return;
    }

    const resolveFacetNames = async () => {
      setIsResolving(true);
      
      try {
        // Collect all UUIDs from all facet buckets
        const uuidsToResolve = new Set();
        
        const collectUUIDs = (facetsObj) => {
          Object.entries(facetsObj).forEach(([key, value]) => {
            if (key === '@self') {
              // Handle nested @self facets
              Object.values(value).forEach((subValue) => {
                if (subValue.buckets) {
                  subValue.buckets.forEach((bucket) => {
                    const bucketValue = bucket.value || bucket.key;
                    if (typeof bucketValue === 'string' && isUUID(bucketValue)) {
                      uuidsToResolve.add(bucketValue);
                    }
                  });
                }
              });
            } else {
              // Handle regular facets
              if (value.buckets) {
                value.buckets.forEach((bucket) => {
                  const bucketValue = bucket.value || bucket.key;
                  if (typeof bucketValue === 'string' && isUUID(bucketValue)) {
                    uuidsToResolve.add(bucketValue);
                  }
                });
              }
            }
          });
        };

        collectUUIDs(facets);

        if (uuidsToResolve.size === 0) {
          setResolvedFacets(facets);
          setIsResolving(false);
          return;
        }

        console.info(`🔍 Resolving ${uuidsToResolve.size} UUIDs in facet labels`);

        // Resolve all UUIDs in bulk for better performance
        const uuidArray = Array.from(uuidsToResolve);
        const nameMap = await objectStore.getNamesForMultipleIds(uuidArray);

        // Create resolved facets with updated labels
        const resolvedFacetsObj = JSON.parse(JSON.stringify(facets)); // Deep clone

        const resolveFacetLabels = (facetsObj) => {
          Object.entries(facetsObj).forEach(([key, value]) => {
            if (key === '@self') {
              // Handle nested @self facets
              Object.entries(value).forEach(([subKey, subValue]) => {
                if (subValue.buckets) {
                  subValue.buckets.forEach((bucket) => {
                    const bucketValue = bucket.value || bucket.key;
                    if (typeof bucketValue === 'string' && isUUID(bucketValue) && nameMap[bucketValue]) {
                      // Update the label but keep the original value for filtering
                      bucket.label = nameMap[bucketValue];
                      bucket.originalLabel = bucket.label !== nameMap[bucketValue] ? bucket.label : bucketValue;
                    }
                  });
                }
              });
            } else {
              // Handle regular facets
              if (value.buckets) {
                value.buckets.forEach((bucket) => {
                  const bucketValue = bucket.value || bucket.key;
                  if (typeof bucketValue === 'string' && isUUID(bucketValue) && nameMap[bucketValue]) {
                    // Update the label but keep the original value for filtering
                    bucket.label = nameMap[bucketValue];
                    bucket.originalLabel = bucket.label !== nameMap[bucketValue] ? bucket.label : bucketValue;
                  }
                });
              }
            }
          });
        };

        resolveFacetLabels(resolvedFacetsObj);

        console.info(`✅ Resolved ${Object.keys(nameMap).length} facet labels`);
        setResolvedFacets(resolvedFacetsObj);

      } catch (error) {
        console.warn('Failed to resolve facet names:', error);
        setResolvedFacets(facets); // Fallback to original facets
      } finally {
        setIsResolving(false);
      }
    };

    resolveFacetNames();
  }, [facets, objectStore]);

  return { resolvedFacets, isResolving };
};

/**
 * HOC version that injects the object store
 */
export const useResolvedFacets = withStore((props) => {
  const { store: { object }, facets } = props;
  return useFacetNameResolution(facets, object);
});

export default useFacetNameResolution;
