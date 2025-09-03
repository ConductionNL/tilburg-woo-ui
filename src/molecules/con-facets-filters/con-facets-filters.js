// eslint-disable-next-line import/no-unresolved
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { AcCheckbox } from '@molecules';
import { withStore } from '@stores';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex, AcCard } from '@atoms';
import _ from 'lodash';
import { AcBuildURLSearchParams } from '@utils';

const ConFacetsFilters = ({ store: { publications } }) => {
  const [, setSearchParams] = useSearchParams();
  const {
    toggleSearchArrayValue,
    updateQuery,
    // fetchPublications,
    // fetchFacets,
    all_facets,
    is_facets_loading,
    is_facets_config_loaded,
    facetsConfig,
  } = publications;

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

      // Toggle the value
      let newArray;
      if (arrayToCheck.includes(value)) {
        newArray = arrayToCheck.filter((item) => item !== value);
      } else {
        newArray = [...arrayToCheck, value];
      }

      // Update the query with the new nested structure
      const updatedQuery = {
        ...query,
        [mainKey]: {
          ...currentNested,
          [cleanSubKey]: newArray,
        },
      };

      // Reset to first page when filters change
      const withPageReset = { ...updatedQuery, _page: 1 };

      // Sync to URL first (source of truth)
      const paramsString = AcBuildURLSearchParams(withPageReset);
      setSearchParams(new URLSearchParams(paramsString));

      // Update store
      updateQuery(withPageReset);

      // Fetch is triggered by URL change effect in AcSearch
    } else {
      // Use the existing function for regular keys
      toggleSearchArrayValue(facetKey, value);
      // Reset to first page when filters change and sync URL from current query
      const nextQuery = { ...publications.query, _page: 1 };
      const paramsString = AcBuildURLSearchParams(nextQuery);
      setSearchParams(new URLSearchParams(paramsString));

      // Fetch is triggered by URL change effect in AcSearch
    }
  };

  // Generic function to check if a value is checked for any facet key
  const isFacetChecked = (facetKey, value) => {
    const { query } = publications;

    // Handle nested keys like @self[schema]
    if (facetKey.includes('[') && facetKey.includes(']')) {
      const [mainKey, subKey] = facetKey.split('[');
      const cleanSubKey = subKey.replace(']', '');

      // Check if the nested structure exists and contains the value
      const nestedValue = query[mainKey]?.[cleanSubKey];
      if (Array.isArray(nestedValue)) {
        return nestedValue.includes(value);
      } else if (typeof nestedValue === 'string') {
        return nestedValue === value;
      }
      return false;
    }

    // Handle regular keys
    return query[facetKey]?.includes(value) || false;
  };

  useEffect(() => {
    // Only trigger facets fetch when config is loaded and search query changes
    // The config change will automatically trigger facets reload via triggerFacetsReload
    if (is_facets_config_loaded && facetsConfig) {
      // Don't call fetchFacets here - it's handled by triggerFacetsReload in the store
      // This prevents continuous loading animations
    }
  }, [publications.search_query, is_facets_config_loaded, facetsConfig]); // Track config loaded state

  // Render skeleton loading cards for facets
  const renderSkeletonFacets = () => {
    const skeletonFacets = [
      { title: 'Type', items: 1 },
      { title: 'Organisatie', items: 1 },
      { title: 'Status', items: 1 },
      { title: 'Categorie', items: 1 },
    ];

    return skeletonFacets.map((facet, index) => (
      <AcFlex
        key={`skeleton-${index}`}
        column
        spacing='xs'
        className='ac-search-filters__subjects'
      >
        <AcCard skeleton>
          <Heading level={4}>{facet.title}</Heading>
        </AcCard>
        {Array.from({ length: facet.items }).map((_, itemIndex) => (
          <AcCard
            key={`skeleton-item-${itemIndex}`}
            skeleton
            style={{ minHeight: '1.5rem', marginLeft: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '1rem',
                  height: '1rem',
                  backgroundColor: 'transparent',
                }}
              ></div>
              <div
                style={{ flex: 1, height: '1rem', backgroundColor: 'transparent' }}
              ></div>
            </div>
          </AcCard>
        ))}
      </AcFlex>
    ));
  };

  const facets = all_facets;

  // Only show skeleton loading when:
  // 1. Config is not loaded yet, OR
  // 2. We're loading facets AND don't have existing facets to show
  const shouldShowSkeleton =
    !is_facets_config_loaded ||
    (is_facets_loading && (!facets || Object.keys(facets).length === 0));

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

  // Filter out empty facets from the facets object. For '@self' facets, only keep them if they have schema buckets.
  // For all other facets, keep them if they have any buckets. This ensures we only show facets that have actual filter options.
  const filteredFacets = Object.entries(facets).filter(([key, value]) => {
    if (key === '@self') {
      return value.schema?.buckets && value.schema.buckets.length > 0;
    }
    return value.buckets && value.buckets.length > 0;
  });

  return (
    <>
      {filteredFacets.map(([key, value]) => {
        return key === '@self' ? (
          <React.Fragment key={key}>
            {Object.entries(value).map(([_key, _value]) => {
              const hasData = _value.buckets && _value.buckets.length > 0;
              const shouldShowFacet = ![
                'register',
                'directory',
                'catalogs',
                'organisation',
                'name',
              ].includes(_key.toLowerCase());

              return shouldShowFacet ? (
                <AcFlex
                  key={`${key}-${_key}`}
                  column
                  spacing='xs'
                  className='ac-search-filters__subjects'
                >
                  <Heading level={4}>
                    {_key === 'schema' ? 'Type' : _.upperFirst(_value.title ?? _key)}
                  </Heading>
                  {hasData ? (
                    _value.buckets.map((bucket) => (
                      <AcCheckbox
                        key={bucket.key}
                        label={`${bucket.label ?? bucket.key} (${bucket.results})`}
                        value={bucket.key}
                        checked={isFacetChecked(`${key}[${_key}]`, bucket.key)}
                        onChange={() => {
                          toggleNestedFacet(`${key}[${_key}]`, bucket.key);
                        }}
                      />
                    ))
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
            <Heading level={4}>{_.upperFirst(value.title ?? key)}</Heading>
            {value.buckets && value.buckets.length > 0 ? (
              value.buckets.map((bucketValue) => (
                <AcCheckbox
                  key={bucketValue.key}
                  label={`${bucketValue.label ?? bucketValue.key} (${
                    bucketValue.results
                  })`}
                  value={bucketValue.key}
                  checked={isFacetChecked(key, bucketValue.key)}
                  onChange={() => {
                    toggleSearchArrayValue(key, bucketValue.key);
                    const nextQuery = { ...publications.query, _page: 1 };
                    const paramsString = AcBuildURLSearchParams(nextQuery);
                    setSearchParams(new URLSearchParams(paramsString));
                    // Fetch is triggered by URL change effect in AcSearch
                  }}
                />
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9em' }}>
                No options available
              </p>
            )}
          </AcFlex>
        );
      })}
    </>
  );
};

export default withStore(observer(ConFacetsFilters));
