import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { AcCheckbox, ConAccordion, ConActiveFilters } from '@molecules';
import { withStore } from '@stores';
import { useFacetNameResolution } from '@hooks';
import { schemaCache } from '@services/schemaCache.service';

import { Heading, Textbox } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex, AcCard } from '@atoms';
import _ from 'lodash';
import { AcBuildURLSearchParams, ConFormatDutchNumber } from '@utils';

/**
 * ConFacetsFilters Component
 *
 * Renders dynamic facets filters with automatic UUID-to-name resolution.
 *
 * Features:
 * - Uses API-driven facet configuration (title, enabled status, etc.)
 * - Automatically resolves UUID labels to human-readable names
 * - Shows loading states during name resolution
 * - Provides tooltips with original UUIDs for debugging
 * - Integrates with the existing names cache system for performance
 *
 * @param {Object} store - MobX store containing publications and object stores
 */
const ConFacetsFilters = ({ store: { publications, object } }) => {
  const [, setSearchParams] = useSearchParams();

  // State to track filter queries for each facet
  const [facetFilters, setFacetFilters] = useState({});

  const {
    toggleSearchArrayValue,
    updateQuery,
    all_facets,
    is_loading,
    is_facets_loading,
  } = publications;

  // Use the name resolution hook to resolve UUIDs in facet labels
  const { resolvedFacets } = useFacetNameResolution(all_facets, object);

  // When any filter is selected, detect it (for disabling logic)
  const hasAnyFilterSelected = useMemo(() => {
    const query = publications.query;
    const filterKeys = Object.keys(query || {}).filter(
      (k) => !['_page', '_search', '_limit', '_order', 'extend'].includes(k)
    );
    for (const key of filterKeys) {
      const val = query[key];
      if (Array.isArray(val) && val.length > 0) return true;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const hasNested = Object.values(val).some(
          (v) => (Array.isArray(v) && v.length > 0) || (v != null && v !== '')
        );
        if (hasNested) return true;
      }
      if (val != null && val !== '') return true;
    }
    return false;
  }, [publications.query]);

  // Disable other filter options only while new results/facets are loading (re-enable when fetch completes)
  const shouldDisableUncheckedFilters =
    hasAnyFilterSelected && (is_loading || is_facets_loading);

  // When facets come back, remove any active filter whose bucket has count 0 so we never show raw IDs for 0-result filters
  useEffect(() => {
    if (is_facets_loading || !resolvedFacets || !publications.query) {
      return;
    }

    const query = publications.query;
    const facets = resolvedFacets;
    const reservedKeys = ['_page', '_search', '_limit', '_order', 'extend'];
    const filterKeys = Object.keys(query).filter((k) => !reservedKeys.includes(k));
    if (filterKeys.length === 0) return;

    let hasChanges = false;
    const cleanedQuery = { ...query };

    for (const key of filterKeys) {
      const val = query[key];

      if (key === '@self' && val && typeof val === 'object' && !Array.isArray(val)) {
        const nested = val;
        const cleanedNested = {};
        for (const [subKey, subVal] of Object.entries(nested)) {
          const buckets = facets[key]?.[subKey]?.buckets;
          if (!buckets) {
            cleanedNested[subKey] = subVal;
            continue;
          }
          const bucketByValue = new Map(
            buckets.map((b) => [String(b.value || b.key), b])
          );
          const arr = Array.isArray(subVal) ? subVal : [subVal].filter(Boolean);
          const kept = arr.filter((v) => {
            const b = bucketByValue.get(String(v));
            return b && (b.count || b.results || 0) > 0;
          });
          if (kept.length !== arr.length) hasChanges = true;
          if (kept.length > 0) cleanedNested[subKey] = kept;
        }
        if (Object.keys(cleanedNested).length === 0) {
          delete cleanedQuery[key];
        } else {
          cleanedQuery[key] = cleanedNested;
        }
        continue;
      }

      if (Array.isArray(val) && val.length > 0) {
        const buckets = facets[key]?.buckets;
        if (!buckets) continue;
        const bucketByValue = new Map(
          buckets.map((b) => [String(b.value || b.key), b])
        );
        const kept = val.filter((v) => {
          const b = bucketByValue.get(String(v));
          return b && (b.count || b.results || 0) > 0;
        });
        if (kept.length !== val.length) hasChanges = true;
        if (kept.length === 0) {
          delete cleanedQuery[key];
        } else {
          cleanedQuery[key] = kept;
        }
        continue;
      }

      if (val && typeof val === 'object') continue;
      if (val != null && val !== '') {
        const buckets = facets[key]?.buckets;
        if (buckets) {
          const b = buckets.find((x) => String(x.value || x.key) === String(val));
          if (!b || (b.count || b.results || 0) === 0) {
            hasChanges = true;
            delete cleanedQuery[key];
          }
        }
      }
    }

    if (hasChanges) {
      const withPageReset = { ...cleanedQuery, _page: 1 };
      const paramsString = AcBuildURLSearchParams(withPageReset);
      setSearchParams(new URLSearchParams(paramsString));
      updateQuery(withPageReset);
    }
  }, [
    is_facets_loading,
    resolvedFacets,
    publications.query,
    updateQuery,
    setSearchParams,
  ]);

  // Custom function to handle nested facet toggling
  const toggleNestedFacet = (facetKey, value) => {
    const { query } = publications;

    if (facetKey.includes('[') && facetKey.includes(']')) {
      const [mainKey, subKey] = facetKey.split('[');
      const cleanSubKey = subKey.replace(']', '');

      // Get current nested structure
      const currentNested = query[mainKey] || {};
      const currentArray = currentNested[cleanSubKey] || [];

      // Convert to array if it's a string
      const arrayToCheck = Array.isArray(currentArray)
        ? currentArray
        : [currentArray];

      // Toggle the value - always add if not present, remove if present
      let newArray;
      // Convert both to strings for comparison since URL params are strings
      const valueStr = String(value);
      const hasValue = arrayToCheck.some((item) => String(item) === valueStr);

      if (hasValue) {
        // Remove the value (keep original type in array)
        newArray = arrayToCheck.filter((item) => String(item) !== valueStr);
      } else {
        // Add the value (preserve original type)
        newArray = [...arrayToCheck, value];
      }

      // Update the query with the new nested structure
      const updatedQuery = {
        ...query,
        [mainKey]: {
          ...currentNested,
          [cleanSubKey]: newArray.length > 0 ? newArray : undefined, // Remove empty arrays
        },
      };

      // Clean up empty nested objects
      if (updatedQuery[mainKey] && Object.keys(updatedQuery[mainKey]).length === 0) {
        delete updatedQuery[mainKey];
      }

      // Reset to first page when filters change
      const withPageReset = { ...updatedQuery, _page: 1 };

      // Sync to URL first (source of truth)
      const paramsString = AcBuildURLSearchParams(withPageReset);
      setSearchParams(new URLSearchParams(paramsString));

      // Update store
      updateQuery(withPageReset);

      // Note: Facets fetch is triggered by URL change effect in AcSearch
      // No need to call fetchFacets() here to avoid duplicate API calls
    } else {
      // Use the existing function for regular keys
      toggleSearchArrayValue(facetKey, value);
      // Reset to first page when filters change and sync URL from current query
      const nextQuery = { ...publications.query, _page: 1 };
      const paramsString = AcBuildURLSearchParams(nextQuery);
      setSearchParams(new URLSearchParams(paramsString));

      // Note: Facets fetch is triggered by URL change effect in AcSearch
      // No need to call fetchFacets() here to avoid duplicate API calls
    }
  };

  // Handle toggling a non-aggregated facet: adds/removes both the facet value and _schema parameter.
  const toggleNonAggregatedFacet = (facetKey, value, schemaId) => {
    const { query } = publications;
    const isCurrentlyChecked = isFacetChecked(facetKey, value);

    // Toggle the facet value using existing logic.
    toggleSearchArrayValue(facetKey, value);

    // Build the next query state.
    const nextQuery = { ...publications.query, _page: 1 };

    if (isCurrentlyChecked) {
      // Deselecting: check if any values remain for this facet key.
      const remaining = nextQuery[facetKey];
      const hasRemaining = Array.isArray(remaining) ? remaining.length > 0 : (remaining != null && remaining !== '');
      if (!hasRemaining) {
        // No more values for this facet — remove _schema too.
        delete nextQuery._schema;
      }
    } else {
      // Selecting: add _schema parameter.
      nextQuery._schema = String(schemaId);
    }

    const paramsString = AcBuildURLSearchParams(nextQuery);
    setSearchParams(new URLSearchParams(paramsString));
    updateQuery(nextQuery);
  };

  // Generic function to check if a value is checked for any facet key
  const isFacetChecked = (facetKey, value) => {
    const { query } = publications;

    // Convert value to string for comparison (URL params are always strings)
    const valueStr = String(value);

    // Handle nested keys like @self[schema]
    if (facetKey.includes('[') && facetKey.includes(']')) {
      const [mainKey, subKey] = facetKey.split('[');
      const cleanSubKey = subKey.replace(']', '');

      // Check if the nested structure exists and contains the value
      const nestedValue = query[mainKey]?.[cleanSubKey];
      if (Array.isArray(nestedValue)) {
        return nestedValue.some((v) => String(v) === valueStr);
      } else if (nestedValue !== undefined) {
        return String(nestedValue) === valueStr;
      }
      return false;
    }

    // Handle regular keys
    const queryValue = query[facetKey];
    if (Array.isArray(queryValue)) {
      return queryValue.some((v) => String(v) === valueStr);
    } else if (queryValue !== undefined) {
      return String(queryValue) === valueStr;
    }
    return false;
  };

  // Helper function to ensure active buckets are included even if not in API response (count 0)
  const ensureActiveBucketsIncluded = (buckets, queryParameter) => {
    const { query } = publications;
    const activeBuckets = [];

    // Extract active values from the query for this facet
    let activeValues = [];

    // Handle nested keys like @self[schema]
    if (
      queryParameter &&
      queryParameter.includes('[') &&
      queryParameter.includes(']')
    ) {
      const [mainKey, subKey] = queryParameter.split('[');
      const cleanSubKey = subKey.replace(']', '');
      const nestedValue = query[mainKey]?.[cleanSubKey];
      if (Array.isArray(nestedValue)) {
        activeValues = nestedValue.map((v) => String(v));
      } else if (nestedValue !== undefined) {
        activeValues = [String(nestedValue)];
      }
    } else if (queryParameter) {
      // Handle regular keys
      const queryValue = query[queryParameter];
      if (Array.isArray(queryValue)) {
        activeValues = queryValue.map((v) => String(v));
      } else if (queryValue !== undefined) {
        activeValues = [String(queryValue)];
      }
    }

    // Find active values that are not in the current buckets
    const existingValues = new Set(
      buckets.map((bucket) => String(bucket.value || bucket.key))
    );
    const missingActiveValues = activeValues.filter(
      (value) => !existingValues.has(value)
    );

    // Create synthetic buckets for missing active values with count 0
    missingActiveValues.forEach((value) => {
      activeBuckets.push({
        value: value,
        key: value,
        count: 0,
        results: 0,
        label: value, // Will be resolved by name resolution hook if it's a UUID
        _isActiveSynthetic: true, // Flag to identify synthetic buckets
      });
    });

    // Merge original buckets with synthetic active buckets
    return [...buckets, ...activeBuckets];
  };

  // Helper function to filter buckets based on search query
  const filterBuckets = (buckets, filterQuery) => {
    if (!filterQuery || !filterQuery.trim()) {
      return buckets;
    }

    const query = filterQuery.toLowerCase().trim();
    return buckets.filter((bucket) => {
      const label = (bucket.label ?? bucket.value ?? bucket.key ?? '')
        .toString()
        .toLowerCase();
      return label.includes(query);
    });
  };

  // Helper function to update facet filter
  const updateFacetFilter = (facetKey, query) => {
    setFacetFilters((prev) => ({
      ...prev,
      [facetKey]: query,
    }));
  };

  const clearAllFilters = () => {
    // Preserve the current search term when clearing filters
    const currentSearch = publications.query._search;

    const newParams = new URLSearchParams();
    newParams.set('_page', '1');

    // Keep the search term if it exists
    if (currentSearch && currentSearch.trim()) {
      newParams.set('_search', currentSearch.trim());
    }

    setSearchParams(newParams, { replace: true });
  };

  // Helper to get bucket label
  const getBucketLabel = (facetKey, value) => {
    const facets = resolvedFacets || {};

    // Handle nested facets like @self[schema]
    if (facetKey.includes('[') && facetKey.includes(']')) {
      const [mainKey, subKey] = facetKey.split('[');
      const cleanSubKey = subKey.replace(']', '');
      const bucket = facets[mainKey]?.[cleanSubKey]?.buckets?.find(
        (b) => String(b.value || b.key) === String(value)
      );

      if (bucket?.label) {
        return bucket.label;
      }

      // Fallback: Check if this is a schema slug/ID and try to get the title from schemas in store
      if (cleanSubKey === 'schema' && object?.schemas) {
        console.log('🔍 Looking for schema label for value:', value);
        console.log('📚 Available schemas:', Object.keys(object.schemas));

        // First, try to convert ID to slug using schemaCache if value looks like an ID
        let searchValue = value;
        if (/^\d+$/.test(value)) {
          // Value is numeric - probably an ID, try to get slug
          const slug = schemaCache.get(value);
          console.log(`🔄 Converted ID ${value} to slug:`, slug);
          if (slug) {
            searchValue = slug;
          }
        }

        // Look through all schemas to find one that matches
        const schemaEntry = Object.values(object.schemas).find((schema) => {
          const matches =
            schema?.slug === searchValue ||
            schema?.name === searchValue ||
            String(schema?.id) === String(value) ||
            String(schema?.['@self']?.id) === String(value);

          if (matches) {
            console.log('✅ Found matching schema:', schema);
          }

          return matches;
        });

        if (schemaEntry?.title) {
          console.log('✅ Returning schema title:', schemaEntry.title);
          return schemaEntry.title;
        }

        console.log('❌ No schema title found, using value:', value);
      }

      return value;
    }

    // Handle regular facets
    const bucket = facets[facetKey]?.buckets?.find(
      (b) => String(b.value || b.key) === String(value)
    );
    return bucket?.label || value;
  };

  // Simple active filters - just label and id, with remove callback
  const activeFilters = Object.entries(publications.query)
    .filter(
      ([key]) => !['extend', '_limit', '_page', '_search', '_order'].includes(key)
    )
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((val) => {
          const label = getBucketLabel(key, val);
          return {
            id: `${key}-${val}`,
            label,
            onRemove: () => toggleNestedFacet(key, val),
          };
        });
      }
      if (value && typeof value === 'object') {
        // Handle nested like @self[schema]
        return Object.entries(value).flatMap(([subKey, subVal]) => {
          const vals = Array.isArray(subVal) ? subVal : [subVal];
          return vals.filter(Boolean).map((val) => {
            const facetKey = `${key}[${subKey}]`;
            const label = getBucketLabel(facetKey, val);
            return {
              id: `${facetKey}-${val}`,
              label,
              onRemove: () => toggleNestedFacet(facetKey, val),
            };
          });
        });
      }
      if (value) {
        const label = getBucketLabel(key, value);
        return [
          {
            id: `${key}-${value}`,
            label,
            onRemove: () => toggleNestedFacet(key, value),
          },
        ];
      }
      return [];
    });

  // Note: Initial facets fetch is triggered by ac-search.js on mount
  // Subsequent facets fetches are triggered by facet selection changes below
  // No need for useEffect here to avoid duplicate calls

  // Render skeleton loading cards for facets
  const renderSkeletonFacets = () => {
    return (
      <AcFlex column spacing='xs' className='ac-search-filters__subjects'>
        <AcCard skeleton style={{ minHeight: '1.5rem', marginLeft: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '1rem',
                height: '750px',
                backgroundColor: 'transparent',
              }}
            ></div>
            <div
              style={{ flex: 1, height: '1rem', backgroundColor: 'transparent' }}
            ></div>
          </div>
        </AcCard>
      </AcFlex>
    );
  };

  const facets = resolvedFacets;

  // Debug: Log facet data to see what labels are present
  if (facets && Object.keys(facets).length > 0) {
    console.group('🔍 DEBUG: Facet Labels');
    Object.entries(facets).forEach(([key, value]) => {
      if (key !== '@self' && value.buckets) {
        console.log(
          `Facet "${key}":`,
          value.buckets.map((b) => ({
            label: b.label,
            value: b.value,
            key: b.key,
          }))
        );
      }
    });
    console.groupEnd();
  }

  // Only show skeleton loading when:
  // We're loading facets AND don't have existing facets to show
  // Note: isResolving is NOT included - we show facets immediately even with UUIDs
  // DISABLED: Always false to prevent blocking on names resolution
  const shouldShowSkeleton = false;

  if (shouldShowSkeleton) {
    return <>{renderSkeletonFacets()}</>;
  }

  // Show message if no facets are available
  if (!facets || Object.keys(facets).length === 0) {
    return (
      <AcFlex column spacing='sm'>
        <Heading level={4}>Filters</Heading>
        <p>No filters available</p>
      </AcFlex>
    );
  }

  // Show helpful message when all facets are empty
  const hasAnyFacetData = Object.entries(facets).some(([key, value]) => {
    if (key === '@self') {
      return Object.values(value).some((v) => v.buckets && v.buckets.length > 0);
    }
    return value.buckets && value.buckets.length > 0;
  });

  // Filter out disabled and empty facets from the facets object.
  // For '@self' facets, only keep them if they have buckets and are enabled.
  // For all other facets, keep them if they have buckets and are enabled.
  // Also skip date histogram facets as they have a different structure
  // IMPORTANT: Always show facets that have active/checked values, even if count is 0
  const filteredFacets = Object.entries(facets).filter(([key, value]) => {
    if (key === '@self') {
      // Check if any @self sub-facets have buckets and are enabled
      return Object.entries(value).some(([subKey, subValue]) => {
        if (
          !subValue.buckets ||
          subValue.buckets.length === 0 ||
          subValue.enabled === false
        ) {
          return false;
        }

        // Always show if there are buckets with count > 0
        const hasDataWithCount = subValue.buckets.some(
          (bucket) => (bucket.count || bucket.results || 0) > 0
        );
        if (hasDataWithCount) {
          return true;
        }

        // Also show if any bucket is currently active/checked (prevents hiding active filters)
        const hasActiveBucket = subValue.buckets.some((bucket) =>
          isFacetChecked(
            subValue.queryParameter || `${key}[${subKey}]`,
            bucket.value || bucket.key
          )
        );

        return hasActiveBucket;
      });
    }
    // Skip date histogram facets (they have data.brackets instead of data.buckets)
    if (value.type === 'date_histogram') {
      return false;
    }

    // Must be enabled and have buckets
    if (!value.buckets || value.buckets.length === 0 || value.enabled === false) {
      return false;
    }

    // Always show if there are buckets with count > 0
    const hasDataWithCount = value.buckets.some(
      (bucket) => (bucket.count || bucket.results || 0) > 0
    );
    if (hasDataWithCount) {
      return true;
    }

    // Also show if any bucket is currently active/checked (prevents hiding active filters)
    const hasActiveBucket = value.buckets.some((bucket) =>
      isFacetChecked(value.queryParameter || key, bucket.value || bucket.key)
    );

    return hasActiveBucket;
  });

  // Sort facets by order field (numeric ascending), then alphabetically by title as tiebreaker.
  // For @self facets (grouped object), derive sort position from the minimum order of sub-facets.
  const sortedFacets = [...filteredFacets].sort(([keyA, valueA], [keyB, valueB]) => {
    const getOrder = (key, value) => {
      if (key === '@self') {
        const subOrders = Object.values(value)
          .map((v) => v.order)
          .filter((o) => o != null);
        return subOrders.length > 0 ? Math.min(...subOrders) : Infinity;
      }
      return value.order != null ? Number(value.order) : Infinity;
    };
    const orderA = getOrder(keyA, valueA);
    const orderB = getOrder(keyB, valueB);
    if (orderA !== orderB) return orderA - orderB;
    const titleA = (valueA.title || keyA).toLowerCase();
    const titleB = (valueB.title || keyB).toLowerCase();
    return titleA.localeCompare(titleB);
  });

  return (
    <>
      <ConActiveFilters
        activeFilters={activeFilters}
        onClearAllFilters={clearAllFilters}
      />
      {!hasAnyFacetData ? (
        <AcFlex column spacing='sm'>
          <p
            style={{
              color: '#6c757d',
              margin: '0 0 0.5rem 0',
              fontWeight: '500',
              textAlign: 'left',
            }}
          >
            Geen filters beschikbaar
          </p>
          <p
            style={{
              color: '#6c757d',
              fontSize: '0.9em',
              margin: '0',
              lineHeight: '1.4',
              textAlign: 'left',
            }}
          >
            Er zijn momenteel geen filteropties beschikbaar voor deze zoekopdracht.
            Dit kan komen doordat er geen publicaties zijn gevonden met faceteerbare
            gegevens.
          </p>
        </AcFlex>
      ) : (
        sortedFacets.map(([key, value]) => {
          return key === '@self' ? (
            <React.Fragment key={key}>
              {Object.entries(value)
                .sort(([_keyA, _valueA], [_keyB, _valueB]) => {
                  // Sort @self sub-facets by order (ascending), then alphabetically by title
                  const orderA = _valueA.order != null ? Number(_valueA.order) : Infinity;
                  const orderB = _valueB.order != null ? Number(_valueB.order) : Infinity;
                  if (orderA !== orderB) return orderA - orderB;
                  const titleA = (_valueA.title || _keyA).toLowerCase();
                  const titleB = (_valueB.title || _keyB).toLowerCase();
                  return titleA.localeCompare(titleB);
                })
                .map(([_key, _value]) => {
                  const hasData = _value.buckets && _value.buckets.length > 0;
                  // Only show enabled facets (filtering is now handled by backend configuration)
                  const shouldShowFacet = _value.enabled !== false;
                  const facetKey = `${key}[${_key}]`;
                  const shouldShowFilter =
                    _value.buckets && _value.buckets.length > 20;
                  const filterQuery = facetFilters[facetKey] || '';

                  return shouldShowFacet && hasData ? (
                    <AcFlex
                      key={`${key}-${_key}`}
                      column
                      spacing='xs'
                      className='ac-search-filters__subjects'
                    >
                      <ConAccordion.Item
                        header={`${_value.title || _.upperFirst(_key)} (${
                          _value.buckets.length
                        })`}
                        headerLevel={3}
                        headerTitle={_value.description || undefined}
                        headerStyle={{
                          fontSize: 'var(--utrecht-heading-4-font-size, revert)',
                        }}
                        defaultOpen={
                          _value.buckets.length > 7 ? false : _value.toggle ?? true
                        }
                      >
                        {shouldShowFilter && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <Textbox
                              type='text'
                              placeholder='Filter...'
                              value={filterQuery}
                              onChange={(e) =>
                                updateFacetFilter(facetKey, e.target.value)
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                        )}
                        {filterBuckets(
                          ensureActiveBucketsIncluded(
                            _value.buckets,
                            _value.queryParameter || facetKey
                          ),
                          filterQuery
                        )
                          .sort((a, b) => {
                            // Sort buckets alphabetically by label
                            const labelA = (a.label ?? a.value ?? a.key ?? '')
                              .toString()
                              .toLowerCase();
                            const labelB = (b.label ?? b.value ?? b.key ?? '')
                              .toString()
                              .toLowerCase();
                            return labelA.localeCompare(labelB);
                          })
                          .map((bucket) => {
                            const bucketValue = bucket.value || bucket.key;
                            const isChecked = isFacetChecked(
                              _value.queryParameter || facetKey,
                              bucketValue
                            );
                            return (
                              <AcCheckbox
                                key={bucketValue}
                                label={`${
                                  bucket.label ?? bucket.value ?? bucket.key
                                } (${ConFormatDutchNumber(
                                  bucket.count || bucket.results
                                )})`}
                                value={bucketValue}
                                checked={isChecked}
                                disabled={
                                  shouldDisableUncheckedFilters && !isChecked
                                }
                                onChange={() => {
                                  toggleNestedFacet(
                                    _value.queryParameter || facetKey,
                                    bucketValue
                                  );
                                }}
                                title={
                                  bucket.originalLabel
                                    ? `Origineel: ${bucket.originalLabel}`
                                    : bucket._isActiveSynthetic
                                    ? `Actieve filter (${
                                        bucket.count || bucket.results
                                      } resultaten)`
                                    : undefined
                                }
                              />
                            );
                          })}
                      </ConAccordion.Item>
                    </AcFlex>
                  ) : null;
                })}
            </React.Fragment>
          ) : (
            <AcFlex
              key={key}
              column
              spacing='xs'
              className='ac-search-filters__subjects'
            >
              {(() => {
                const shouldShowFilter = value.buckets && value.buckets.length > 20;
                const filterQuery = facetFilters[key] || '';

                return (
                  <ConAccordion.Item
                    header={`${value.title || _.upperFirst(key)} (${
                      value.buckets.length
                    })`}
                    headerLevel={4}
                    headerTitle={value.description || undefined}
                    defaultOpen={
                      value.buckets.length > 7 ? false : value.toggle ?? true
                    }
                  >
                    {shouldShowFilter && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <Textbox
                          type='text'
                          placeholder='Filter...'
                          value={filterQuery}
                          onChange={(e) => updateFacetFilter(key, e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}
                    {value.buckets && value.buckets.length > 0 ? (
                      filterBuckets(
                        ensureActiveBucketsIncluded(
                          value.buckets,
                          value.queryParameter || key
                        ),
                        filterQuery
                      )
                        .sort((a, b) => {
                          // Sort buckets alphabetically by label
                          const labelA = (a.label ?? a.value ?? a.key ?? '')
                            .toString()
                            .toLowerCase();
                          const labelB = (b.label ?? b.value ?? b.key ?? '')
                            .toString()
                            .toLowerCase();
                          return labelA.localeCompare(labelB);
                        })
                        .map((bucketValue) => {
                          const bVal = bucketValue.value || bucketValue.key;
                          const isChecked = isFacetChecked(
                            value.queryParameter || key,
                            bVal
                          );
                          return (
                            <AcCheckbox
                              key={bVal}
                              label={`${
                                bucketValue.label ??
                                bucketValue.value ??
                                bucketValue.key
                              } (${bucketValue.count || bucketValue.results})`}
                              value={bVal}
                              checked={isChecked}
                              disabled={
                                shouldDisableUncheckedFilters && !isChecked
                              }
                              onChange={() => {
                                if (value.schema != null) {
                                  // Non-aggregated facet: also manage _schema parameter.
                                  toggleNonAggregatedFacet(
                                    value.queryParameter || key,
                                    bVal,
                                    value.schema
                                  );
                                } else {
                                  toggleSearchArrayValue(
                                    value.queryParameter || key,
                                    bVal
                                  );
                                  const nextQuery = { ...publications.query, _page: 1 };
                                  const paramsString = AcBuildURLSearchParams(nextQuery);
                                  setSearchParams(new URLSearchParams(paramsString));
                                }

                                // Note: Facets fetch is triggered by URL change effect in AcSearch
                                // No need to call fetchFacets() here to avoid duplicate API calls
                              }}
                              title={
                                bucketValue.originalLabel
                                  ? `Origineel: ${bucketValue.originalLabel}`
                                  : bucketValue._isActiveSynthetic
                                  ? `Actieve filter (${
                                      bucketValue.count || bucketValue.results
                                    } resultaten)`
                                  : undefined
                              }
                            />
                          );
                        })
                    ) : (
                      <p
                        style={{
                          color: '#666',
                          fontStyle: 'italic',
                          fontSize: '0.9em',
                        }}
                      >
                        No options available
                      </p>
                    )}
                  </ConAccordion.Item>
                );
              })()}
            </AcFlex>
          );
        })
      )}
    </>
  );
};

export default withStore(observer(ConFacetsFilters));
