// eslint-disable-next-line import/no-unresolved
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { AcCheckbox } from '@molecules';
import { withStore } from '@stores';
import { AcLoader } from '@components';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex, AcCard } from '@atoms';
import _ from 'lodash';

const ConFacetsFilters = ({ store: { publications } }) => {
  const { 
    toggleSearchArrayValue, 
    updateQuery, 
    fetchPublications, 
    fetchFacets, 
    all_facets, 
    is_facets_loading, 
    is_facets_config_loaded,
    facetsConfig 
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

      updateQuery(updatedQuery);
      // Trigger search results update - facets will reload automatically via config system
      fetchPublications();
    } else {
      // Use the existing function for regular keys
      toggleSearchArrayValue(facetKey, value);
      // Trigger search results update - facets will reload automatically via config system
      fetchPublications();
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
      { title: 'Type', items: 3 },
      { title: 'Organisatie', items: 4 },
      { title: 'Status', items: 2 },
      { title: 'Categorie', items: 5 }
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
          <AcCard key={`skeleton-item-${itemIndex}`} skeleton style={{ minHeight: '1.5rem', marginLeft: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '1rem', height: '1rem', backgroundColor: 'transparent' }}></div>
              <div style={{ flex: 1, height: '1rem', backgroundColor: 'transparent' }}></div>
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
  const shouldShowSkeleton = (
    !is_facets_config_loaded || 
    (is_facets_loading && (!facets || Object.keys(facets).length === 0))
  );

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
      return Object.values(value).some(v => v.buckets && v.buckets.length > 0);
    }
    return value.buckets && value.buckets.length > 0;
  });

  if (!hasAnyFacetData) {
    return (
      <AcFlex column spacing='sm'>
        <p style={{ 
          color: '#6c757d', 
          margin: '0 0 0.5rem 0',
          fontWeight: '500',
          textAlign: 'left'
        }}>
          Geen filters beschikbaar
        </p>
        <p style={{ 
          color: '#6c757d', 
          fontSize: '0.9em',
          margin: '0',
          lineHeight: '1.4',
          textAlign: 'left'
        }}>
          Er zijn momenteel geen filteropties beschikbaar voor deze zoekopdracht. 
          Dit kan komen doordat er geen publicaties zijn gevonden met faceteerbare gegevens.
        </p>
      </AcFlex>
    );
  }

  return (
    <>
      {Object.entries(facets).map(([key, value]) => {
        return key === '@self' ? (
          <React.Fragment key={key}>
            {Object.entries(value).map(([_key, _value]) => {
              const hasData = _value.buckets && _value.buckets.length > 0;
              const shouldShowFacet = !['register', 'directory', 'catalogs', 'organisation', 'name'].includes(_key.toLowerCase());
              
              return shouldShowFacet ? (
                <AcFlex
                  key={`${key}-${_key}`}
                  column
                  spacing='xs'
                  className='ac-search-filters__subjects'
                >
                  <Heading level={4}>
                    {_key === 'schema'
                      ? 'Type'
                      : _.upperFirst(_value.title ?? _key)}
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
                    <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9em' }}>
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
                  label={`${bucketValue.label ?? bucketValue.key} (${bucketValue.results})`}
                  value={bucketValue.key}
                  checked={isFacetChecked(key, bucketValue.key)}
                  onChange={() => {
                    toggleSearchArrayValue(key, bucketValue.key);
                    fetchPublications();
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
