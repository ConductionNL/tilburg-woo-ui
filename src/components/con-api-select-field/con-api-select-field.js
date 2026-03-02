/**
 * API-Coupled Select Field Component
 * 
 * A select field that directly connects to API endpoints with configurable query parameters.
 * Perfect for dynamic dropdowns that need real-time data from specific API endpoints.
 * 
 * **Key Features:**
 * - Direct API endpoint coupling with custom query parameters
 * - Built-in search functionality with debouncing
 * - Loading and error states
 * - Pagination support (_limit, _page parameters)
 * - Flexible data mapping (value/label configuration)
 * - Integration with existing form validation
 * - Caching support for performance
 * 
 * **Usage Examples:**
 * ```jsx
 * // Simple API select
 * <ConApiSelectField
 *   label="Organisatie"
 *   apiEndpoint="/api/apps/openregister/api/objects/organisatie"
 *   value={selectedOrganisatie}
 *   onChange={setSelectedOrganisatie}
 *   valueField="id"
 *   labelField="naam"
 * />
 * 
 * // With search and query parameters
 * <ConApiSelectField
 *   label="Producten"
 *   apiEndpoint="/api/apps/openregister/api/objects/voorzieningen/product"
 *   queryParams={{
 *     categorie: "software",
 *     status: "actief"
 *   }}
 *   searchParam="_search"
 *   value={selectedProduct}
 *   onChange={setSelectedProduct}
 *   valueField="id"
 *   labelField="naam"
 *   placeholder="Zoek product..."
 *   isSearchable={true}
 * />
 * 
 * // Multi-select with custom data mapping
 * <ConApiSelectField
 *   label="Tags"
 *   apiEndpoint="/api/tags"
 *   isMulti={true}
 *   value={selectedTags}
 *   onChange={setSelectedTags}
 *   mapData={(item) => ({
 *     value: item.slug,
 *     label: `${item.name} (${item.count})`
 *   })}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { TOOLTIP_ID } from '@src/index.web';

const ConApiSelectField = ({
  label,
  apiEndpoint,
  queryParams = {},
  searchParam = '_search',
  value,
  onChange,
  valueField = 'id',
  labelField = 'name', 
  mapData = null,
  placeholder = 'Selecteer...',
  isSearchable = false,
  isMulti = false,
  isDisabled = false,
  required = false,
  description = null,
  className = '',
  style = {},
  limit = 50,
  enablePagination = true,
  cacheResults = true,
  debounceMs = 300,
  ...otherProps
}) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Refs for managing async operations
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  /**
   * Build complete API URL with query parameters
   */
  const buildApiUrl = useCallback((searchTerm = '', pageNum = 1) => {
    const url = new URL(apiEndpoint, window.location.origin);
    
    // Add base query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    // Add search parameter if searching
    if (searchTerm && searchParam) {
      url.searchParams.set(searchParam, searchTerm);
    }

    // Add pagination parameters
    if (enablePagination) {
      url.searchParams.set('_limit', limit.toString());
      url.searchParams.set('_page', pageNum.toString());
    }

    return url.toString();
  }, [apiEndpoint, queryParams, searchParam, limit, enablePagination]);

  /**
   * Transform API data to select options
   */
  const transformData = useCallback((data) => {
    if (!Array.isArray(data)) {
      console.warn('ConApiSelectField: API response is not an array', data);
      return [];
    }

    return data.map(item => {
      if (mapData) {
        return mapData(item);
      }
      
      return {
        value: item[valueField],
        label: item[labelField] || item[valueField] || 'Unnamed'
      };
    });
  }, [mapData, valueField, labelField]);

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async (searchTerm = '', pageNum = 1, append = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create cache key
    const cacheKey = `${buildApiUrl(searchTerm, pageNum)}`;
    
    // Check cache first
    if (cacheResults && cacheRef.current.has(cacheKey)) {
      const cachedData = cacheRef.current.get(cacheKey);
      if (append) {
        setOptions(prev => [...prev, ...cachedData.options]);
      } else {
        setOptions(cachedData.options);
      }
      setHasMore(cachedData.hasMore);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(buildApiUrl(searchTerm, pageNum), {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const transformedOptions = transformData(data);
      
      // Determine if there are more results
      const hasMoreResults = enablePagination && transformedOptions.length === limit;
      
      // Cache results
      if (cacheResults) {
        cacheRef.current.set(cacheKey, {
          options: transformedOptions,
          hasMore: hasMoreResults
        });
      }

      // Update state
      if (append) {
        setOptions(prev => [...prev, ...transformedOptions]);
      } else {
        setOptions(transformedOptions);
      }
      setHasMore(hasMoreResults);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('ConApiSelectField fetch error:', err);
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl, transformData, cacheResults, limit, enablePagination]);

  /**
   * Handle search input with debouncing
   */
  const handleSearch = useCallback((inputValue) => {
    setSearchQuery(inputValue);
    setPage(1);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      fetchData(inputValue, 1, false);
    }, debounceMs);
  }, [fetchData, debounceMs]);

  /**
   * Load more results for pagination
   */
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && enablePagination) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(searchQuery, nextPage, true);
    }
  }, [fetchData, searchQuery, page, isLoading, hasMore, enablePagination]);

  /**
   * Handle select value change
   */
  const handleChange = useCallback((selectedOption) => {
    onChange(selectedOption);
  }, [onChange]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup timeouts and abort controllers
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Error display
  if (error) {
    return (
      <div className={`con-api-select-error ${className}`} style={style}>
        <div className="error-message">
          Fout bij laden van opties: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`con-api-select-field ${className}`} style={style}>
      {label && (
        <label className='utrecht-form-label'>
          <Heading
            level={4}
            className={clsx({
              'ac-form-field-header-info': description,
            })}
          >
            <div>
              {label}
              {required && (
                <>
                  <span className='required-indicator' aria-hidden='true'>*</span>
                  <span className='sr-only'>(verplicht)</span>
                </>
              )}
            </div>
            {description && (
              <span
                data-tooltip-id={TOOLTIP_ID}
                data-tooltip-content={description}
                className='info-indicator'
                role='img'
                aria-label={description}
              >
                <VISUALS.INFO />
              </span>
            )}
          </Heading>
        </label>
      )}
      
      <ReactSelect
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        options={options}
        isLoading={isLoading}
        isDisabled={isDisabled}
        isMulti={isMulti}
        isSearchable={isSearchable}
        className={clsx(
          'ac-beheer-select',
          isDisabled && 'ac-beheer-select--disabled'
        )}
        onInputChange={isSearchable ? handleSearch : undefined}
        onMenuScrollToBottom={enablePagination ? loadMore : undefined}
        closeMenuOnSelect={!isMulti}
        {...(required && {
          required: true,
        })}
        {...(!required && {
          isClearable: true,
        })}
        {...otherProps}
      />
      
      {isLoading && options.length === 0 && (
        <div className="loading-indicator">Laden...</div>
      )}
    </div>
  );
};

ConApiSelectField.propTypes = {
  label: PropTypes.string,
  apiEndpoint: PropTypes.string.isRequired,
  queryParams: PropTypes.object,
  searchParam: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onChange: PropTypes.func.isRequired,
  valueField: PropTypes.string,
  labelField: PropTypes.string,
  mapData: PropTypes.func,
  placeholder: PropTypes.string,
  isSearchable: PropTypes.bool,
  isMulti: PropTypes.bool,
  isDisabled: PropTypes.bool,
  required: PropTypes.bool,
  description: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  limit: PropTypes.number,
  enablePagination: PropTypes.bool,
  cacheResults: PropTypes.bool,
  debounceMs: PropTypes.number,
};

export default ConApiSelectField;
