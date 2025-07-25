import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { buildPublicationsSearchQuery } from '@stores/publications.store';
import { AcCheckbox } from '@molecules';
import { LABELS } from '@constants';
import { withStore } from '@stores';
import { AcLoader } from '@components';
import { AcBuildURLSearchParams } from '@utils';
import { BASE_URL } from '@views/ac-beheer/ac-beheer';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@atoms';
import _ from 'lodash';

const ConFacetsFilters = ({ store: { publications } }) => {
  const [facets, setFacets] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleSearchArrayValue, updateQuery } = publications;

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
    } else {
      // Use the existing function for regular keys
      toggleSearchArrayValue(facetKey, value);
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

  // Function to build facetsQueries from available facets
  const buildFacetsQueries = (availableFacets) => {
    const queries = [];

    // Handle @self facets
    if (availableFacets['@self']) {
      Object.entries(availableFacets['@self']).forEach(([key, config]) => {
        if (config.facet_types && config.facet_types.includes('terms')) {
          queries.push([['@self', key], 'terms']);
        }
      });
    }

    // Handle object_fields facets
    if (availableFacets.object_fields) {
      Object.entries(availableFacets.object_fields).forEach(([key, config]) => {
        if (config.facet_types && config.facet_types.includes('terms')) {
          queries.push([key, 'terms']);
        }
      });
    }

    return queries;
  };

      const fetchAvailableFacets = async () => {
      const response = await fetch(
        `${BASE_URL}/opencatalogi/api/publications?_facetable=true`
      );
    const data = await response.json();
    return data.facetable;
  };

  const fetchFacets = async () => {
    setIsLoading(true);
    try {
      const availableFacets = await fetchAvailableFacets();

      // Build dynamic facetsQueries
      const dynamicFacetsQueries = buildFacetsQueries(availableFacets);

      const queryParams = dynamicFacetsQueries
        .map(([key, value]) => {
          if (Array.isArray(key)) {
            const brackets = key.map((val) => `[${val}]`).join('');
            return `_facets${brackets}=${value}`;
          } else {
            return `_facets[${key}]=${value}`;
          }
        })
        .join('&');

      // Get the current search query from the store (same as fetchPublications uses)
      const currentSearchQuery = publications.search_query;

      // Build the enhanced search query (same as fetchPublications does)
      const enhancedSearchQuery = buildPublicationsSearchQuery(currentSearchQuery);

      // Convert the enhanced search query to URL parameters
      const searchQueryParams = AcBuildURLSearchParams(enhancedSearchQuery);

              const response = await fetch(
          `${BASE_URL}/opencatalogi/api/publications?_facetable=true&${queryParams}&${searchQueryParams}`
        );

      if (!response.ok) {
        console.error('Error fetching facets:', response.statusText);
        return;
      }

      const data = await response.json();

      // Add titles to facets from available facets
      const facetsWithTitles = {};
      for (const [key, value] of Object.entries(data.facets)) {
        if (key === '@self') {
          facetsWithTitles[key] = {};
          for (const [subKey, subValue] of Object.entries(value)) {
            facetsWithTitles[key][subKey] = {
              ...subValue,
              title: availableFacets?.object_fields?.[subKey]?.title || subKey,
            };
          }
        } else {
          facetsWithTitles[key] = {
            ...value,
            title: availableFacets?.object_fields?.[key]?.title || key,
          };
        }
      }

      setFacets(facetsWithTitles);
    } catch (error) {
      console.error('Error fetching facets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacets();
  }, [publications.search_query]); // Add dependency on search_query

  if (isLoading) {
    return <AcLoader style={{ height: '200px' }} />;
  }

  return (
    <>
      {facets &&
        Object.keys(facets).length > 0 &&
        Object.entries(facets).map(([key, value]) => {
          return key === '@self' ? (
            <>
              {Object.entries(value).map(
                ([_key, _value]) =>
                  _value.buckets.length > 0 &&
                  // Filter out specific facets: Registers, Directory, Catalogs
                  !['register', 'directory', 'catalogs'].includes(
                    _key.toLowerCase()
                  ) && (
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
                      {_value.buckets.map((bucket) => (
                        <AcCheckbox
                          key={bucket.key}
                          label={`${bucket.label ?? bucket.key} (${bucket.results})`}
                          value={bucket.key}
                          checked={isFacetChecked(`${key}[${_key}]`, bucket.key)}
                          onChange={() => {
                            toggleNestedFacet(`${key}[${_key}]`, bucket.key);
                            fetchFacets();
                          }}
                        />
                      ))}
                    </AcFlex>
                  )
              )}
            </>
          ) : (
            value.buckets.length > 0 && (
              <AcFlex
                key={key}
                column
                spacing='xs'
                className='ac-search-filters__subjects'
              >
                <Heading level={4}>{_.upperFirst(value.title ?? key)}</Heading>
                {value.buckets.map((value) => (
                  <AcCheckbox
                    key={value.key}
                    label={`${value.label ?? value.key} (${value.results})`}
                    value={value.key}
                    checked={isFacetChecked(key, value.key)}
                    onChange={() => {
                      toggleSearchArrayValue(key, value.key);
                      fetchFacets();
                    }}
                  />
                ))}
              </AcFlex>
            )
          );
        })}
    </>
  );
};

export default withStore(observer(ConFacetsFilters));
