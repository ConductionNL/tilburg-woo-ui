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
        // ALWAYS apply schema label transformations first (synchronous)
        const resolvedFacetsObj = JSON.parse(JSON.stringify(facets)); // Deep clone

        // Apply schema label transformations immediately
        const applySchemaTransformations = (facetsObj) => {
          if (facetsObj['@self']?.schema?.buckets) {
            facetsObj['@self'].schema.buckets.forEach((bucket) => {
              if (bucket.label === 'Module') {
                bucket.label = 'Applicatie';
              }
              if (bucket.label === 'Module Versie') {
                bucket.label = 'Applicatie versie';
              }
            });
          }
        };

        applySchemaTransformations(resolvedFacetsObj);

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
          // Schema transformations already applied above
          setResolvedFacets(resolvedFacetsObj);
          setIsResolving(false);
          return;
        }

        console.info(`🔍 Resolving ${uuidsToResolve.size} UUIDs in facet labels`);

        // Resolve all UUIDs in bulk for better performance
        const uuidArray = Array.from(uuidsToResolve);
        const nameMap = await objectStore.getNamesForMultipleIds(uuidArray);

        const resolveFacetLabels = (facetsObj) => {
          Object.entries(facetsObj).forEach(([key, value]) => {
            if (key === '@self') {
              // Handle nested @self facets
              Object.entries(value).forEach(([, subValue]) => {
                const buckets = subValue.buckets || subValue.data?.buckets;
                if (buckets) {
                  buckets.forEach((bucket) => {
                    const bucketValue = bucket.value || bucket.key;
                    if (
                      typeof bucketValue === 'string' &&
                      isUUID(bucketValue) &&
                      nameMap[bucketValue]
                    ) {
                      // Update the label but keep the original value for filtering
                      bucket.label = nameMap[bucketValue];
                      bucket.originalLabel =
                        bucket.label !== nameMap[bucketValue]
                          ? bucket.label
                          : bucketValue;
                    }
                  });
                }
              });
            } else {
              // Handle regular facets
              const buckets = value.buckets || value.data?.buckets;
              if (buckets) {
                buckets.forEach((bucket) => {
                  const bucketValue = bucket.value || bucket.key;
                  if (
                    typeof bucketValue === 'string' &&
                    isUUID(bucketValue) &&
                    nameMap[bucketValue]
                  ) {
                    // Update the label but keep the original value for filtering
                    bucket.label = nameMap[bucketValue];
                    bucket.originalLabel =
                      bucket.label !== nameMap[bucketValue]
                        ? bucket.label
                        : bucketValue;
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
  const {
    store: { object },
    facets,
  } = props;
  return useFacetNameResolution(facets, object);
});

export default useFacetNameResolution;
