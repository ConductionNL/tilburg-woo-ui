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
        if (resolvedFacetsObj['@self']?.schema?.buckets) {
          resolvedFacetsObj['@self'].schema.buckets.forEach((bucket) => {
            if (bucket.label === 'Module') {
              bucket.label = 'Applicatie';
            }
            if (bucket.label === 'Module Versie') {
              bucket.label = 'Applicatieversie';
            }
          });
        }

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

        // OPTIMIZATION: Show facets IMMEDIATELY with UUIDs
        setResolvedFacets(resolvedFacetsObj);
        // Keep isResolving true initially so component knows we're still working
        // but facets are already visible

        if (uuidsToResolve.size === 0) {
          console.info('No UUIDs to resolve in facets');
          setIsResolving(false);
          return;
        }

        console.info(`🔄 Resolving ${uuidsToResolve.size} UUIDs in background for facets...`);

        // Set to false immediately after showing initial facets - names will update progressively
        setIsResolving(false);

        // Resolve all UUIDs in bulk for better performance (non-blocking now!)
        const uuidArray = Array.from(uuidsToResolve);
        const nameMap = await objectStore.getNamesForMultipleIds(uuidArray);

        // Clone again for the update with resolved names
        const updatedFacetsObj = JSON.parse(JSON.stringify(resolvedFacetsObj));

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

        resolveFacetLabels(updatedFacetsObj);

        console.info(`✅ Updated ${Object.keys(nameMap).length} facet labels in background`);
        setResolvedFacets(updatedFacetsObj);
      } catch (error) {
        console.warn('Failed to resolve facet names:', error);
        // Don't reset to original facets - keep the already displayed ones
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
