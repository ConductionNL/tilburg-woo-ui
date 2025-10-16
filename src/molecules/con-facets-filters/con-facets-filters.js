// eslint-disable-next-line import/no-unresolved
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { AcCheckbox, AcButton, ConAccordion } from '@molecules';
import { withStore } from '@stores';
import { useFacetNameResolution } from '@hooks';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
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
  const {
    toggleSearchArrayValue,
    updateQuery,
    // fetchPublications,
    // fetchFacets,
    all_facets,
    is_facets_loading,
  } = publications;

  // Use the name resolution hook to resolve UUIDs in facet labels
  const { resolvedFacets, isResolving } = useFacetNameResolution(all_facets, object);

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

      // Trigger facets fetch to update counts with new filters
      publications.fetchFacets();

      // Fetch is triggered by URL change effect in AcSearch
    } else {
      // Use the existing function for regular keys
      toggleSearchArrayValue(facetKey, value);
      // Reset to first page when filters change and sync URL from current query
      const nextQuery = { ...publications.query, _page: 1 };
      const paramsString = AcBuildURLSearchParams(nextQuery);
      setSearchParams(new URLSearchParams(paramsString));

      // Trigger facets fetch to update counts with new filters
      publications.fetchFacets();

      // Fetch is triggered by URL change effect in AcSearch
    }
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

  const hasActiveFilters = () => {
    const { query } = publications;

    // Check for other filters (excluding default query params and search)
    const filterKeys = Object.keys(query).filter(
      (key) => !['extend', '_limit', '_page', '_search'].includes(key)
    );

    return filterKeys.some((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((v) =>
          Array.isArray(v) ? v.length > 0 : Boolean(v)
        );
      }
      return Boolean(value);
    });
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

  useEffect(() => {
    // Trigger initial facets fetch when component mounts
    // Subsequent facets fetches are triggered by facet selection changes
    publications.fetchFacets();
  }, []); // Only run once on mount

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

  // Only show skeleton loading when:
  // We're loading facets AND don't have existing facets to show, OR we're resolving names
  const shouldShowSkeleton =
    (is_facets_loading && (!facets || Object.keys(facets).length === 0)) ||
    isResolving;

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

  if (!hasAnyFacetData) {
    return (
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
          Er zijn momenteel geen filteropties beschikbaar voor deze zoekopdracht. Dit
          kan komen doordat er geen publicaties zijn gevonden met faceteerbare
          gegevens.
        </p>
      </AcFlex>
    );
  }

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

  return (
    <>
      <AcFlex spacing='sm' style={{ marginBottom: '1rem' }}>
        <AcButton
          style='buttonSlim'
          buttonType='primary'
          onClick={clearAllFilters}
          disabled={!hasActiveFilters()}
          aria-label='Wis alle filters'
        >
          Wis alle filters
        </AcButton>
        {isResolving && (
          <span style={{ fontSize: '0.8em', color: '#666', alignSelf: 'center' }}>
            Namen ophalen...
          </span>
        )}
      </AcFlex>
      {filteredFacets.map(([key, value]) => {
        return key === '@self' ? (
          <React.Fragment key={key}>
            {Object.entries(value).map(([_key, _value]) => {
              const hasData = _value.buckets && _value.buckets.length > 0;
              // Only show enabled facets (filtering is now handled by backend configuration)
              const shouldShowFacet = _value.enabled !== false;

              return shouldShowFacet && hasData ? (
                <AcFlex
                  key={`${key}-${_key}`}
                  column
                  spacing='xs'
                  className='ac-search-filters__subjects'
                >
                  <ConAccordion.Item
                    header={
                      <Heading level={4} title={_value.description || undefined}>
                        {_value.title || _.upperFirst(_key)} ({_value.buckets.length}
                        )
                      </Heading>
                    }
                    defaultOpen={_value.toggle ?? true}
                  >
                    {ensureActiveBucketsIncluded(
                      _value.buckets,
                      _value.queryParameter || `${key}[${_key}]`
                    ).map((bucket) => (
                      <AcCheckbox
                        key={bucket.value || bucket.key}
                        label={`${
                          bucket.label ?? bucket.value ?? bucket.key
                        } (${ConFormatDutchNumber(bucket.count || bucket.results)})`}
                        value={bucket.value || bucket.key}
                        checked={isFacetChecked(
                          _value.queryParameter || `${key}[${_key}]`,
                          bucket.value || bucket.key
                        )}
                        onChange={() => {
                          toggleNestedFacet(
                            _value.queryParameter || `${key}[${_key}]`,
                            bucket.value || bucket.key
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
                    ))}
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
            <ConAccordion.Item
              header={
                <Heading level={4} title={value.description || undefined}>
                  {value.title || _.upperFirst(key)} ({value.buckets.length})
                </Heading>
              }
              defaultOpen={value.toggle ?? true}
            >
              {value.buckets && value.buckets.length > 0 ? (
                ensureActiveBucketsIncluded(
                  value.buckets,
                  value.queryParameter || key
                ).map((bucketValue) => (
                  <AcCheckbox
                    key={bucketValue.value || bucketValue.key}
                    label={`${
                      bucketValue.label ?? bucketValue.value ?? bucketValue.key
                    } (${bucketValue.count || bucketValue.results})`}
                    value={bucketValue.value || bucketValue.key}
                    checked={isFacetChecked(
                      value.queryParameter || key,
                      bucketValue.value || bucketValue.key
                    )}
                    onChange={() => {
                      toggleSearchArrayValue(
                        value.queryParameter || key,
                        bucketValue.value || bucketValue.key
                      );
                      const nextQuery = { ...publications.query, _page: 1 };
                      const paramsString = AcBuildURLSearchParams(nextQuery);
                      setSearchParams(new URLSearchParams(paramsString));

                      // Trigger facets fetch to update counts with new filters
                      publications.fetchFacets();

                      // Fetch is triggered by URL change effect in AcSearch
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
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9em' }}>
                  No options available
                </p>
              )}
            </ConAccordion.Item>
          </AcFlex>
        );
      })}
    </>
  );
};

export default withStore(observer(ConFacetsFilters));
