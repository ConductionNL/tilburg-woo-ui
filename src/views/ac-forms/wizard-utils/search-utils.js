/**
 * Search Utilities for Forms
 *
 * Provides hooks and utilities for entity searching with debouncing, loading states, and option merging.
 */

import { useState, useCallback } from 'react';
import { useDebouncedInput } from '@src/hooks';
import { useLoadingState } from './loading-utils';
import { filterValidOptions } from './mapping-utils';

/**
 * Merges search options with existing options
 * @param {Array<Object>} prevOptions - Previous options array
 * @param {Array<Object>} newOptions - New options from search
 * @param {string} strategy - Merge strategy: 'preserve-existing' (default) or 'replace-existing'
 * @returns {Array<Object>} Merged options array
 */
export const mergeSearchOptions = (
  prevOptions = [],
  newOptions = [],
  strategy = 'preserve-existing'
) => {
  if (strategy === 'replace-existing') {
    // Replace existing options with new ones, but preserve any that aren't in new results
    const newOptionsMap = new Map(newOptions.map((opt) => [opt.value, opt]));
    const mergedOptions = [...newOptionsMap.values()];

    // Add existing options that aren't in new results
    prevOptions.forEach((opt) => {
      if (!newOptionsMap.has(opt.value)) {
        mergedOptions.push(opt);
      }
    });

    return mergedOptions;
  }

  // Default: preserve-existing - keep all existing, add new ones
  const existingValuesSet = new Set(prevOptions.map((opt) => String(opt.value)));
  const mergedOptions = [...prevOptions];

  newOptions.forEach((newOpt) => {
    const newValue = String(newOpt.value);
    if (!existingValuesSet.has(newValue)) {
      mergedOptions.push(newOpt);
      existingValuesSet.add(newValue);
    }
  });

  return mergedOptions;
};

/**
 * Creates a module search configuration
 * @param {Object} store - The MobX store instance
 * @param {Object} options - Configuration options
 * @param {string} options.collectionKey - Collection key for storing results (default: 'voorzieningen_module')
 * @param {string} options.cacheKey - Cache key suffix (default: 'search')
 * @param {Function} options.queryParamsBuilder - Function to build query params (receives searchTerm)
 * @param {Function} options.mapToOption - Function to map items to options
 * @param {string} options.source - Source type: 'index' or 'database' (default: 'index')
 * @param {boolean} options.useCacheFirst - Use fetchModulesCacheFirst instead of fetchCollection (default: false)
 * @param {Function} options.filterByOrg - Function to add org filter to query params
 * @returns {Object} Search configuration object
 */
export const createModuleSearchConfig = (store, options = {}) => {
  const {
    collectionKey = 'voorzieningen',
    cacheKey = 'search',
    queryParamsBuilder,
    mapToOption,
    source = 'index',
    useCacheFirst = false,
    filterByOrg,
  } = options;

  return {
    entityType: 'module',
    collectionKey,
    cacheKey,
    queryParamsBuilder:
      queryParamsBuilder ||
      ((searchTerm, additionalParams = {}) => {
        const params = {
          _limit: '50',
          _page: '1',
          _published: 'false',
          ...additionalParams,
        };

        if (source === 'index') {
          params._source = 'index';
        }

        if (searchTerm && searchTerm.trim()) {
          params._search = searchTerm.trim();
        }

        if (filterByOrg) {
          const orgFilter = filterByOrg();
          if (orgFilter) {
            Object.assign(params, orgFilter);
          }
        }

        return params;
      }),
    mapToOption,
    useCacheFirst,
    fetchMethod: useCacheFirst
      ? async (queryParams) => {
          return await store.object.fetchModulesCacheFirst(queryParams);
        }
      : async (queryParams) => {
          await store.object.fetchCollection(
            collectionKey,
            'module',
            queryParams,
            null,
            `module_${cacheKey}`
          );
          const collection = store.object.getCollection(
            `${collectionKey}_module_${cacheKey}`
          );
          return collection?.results || collection || [];
        },
  };
};

/**
 * Creates a generic entity search configuration for any entity type
 * @param {Object} store - The MobX store instance
 * @param {string} entityType - Entity type (e.g., 'contactpersoon', 'organisatie', 'module')
 * @param {Object} options - Configuration options
 * @param {string} options.collectionKey - Collection key (default: 'voorzieningen')
 * @param {string} options.cacheKey - Cache key suffix (default: 'search')
 * @param {Function} options.queryParamsBuilder - Function to build query params
 * @param {Function} options.mapToOption - Function to map items to options
 * @param {string} options.source - Source type: 'index' or 'database' (default: 'database')
 * @param {Array<string>} options.extendParams - Additional extend parameters (default: [])
 * @returns {Object} Search configuration object
 */
export const createEntitySearchConfig = (store, entityType, options = {}) => {
  const {
    collectionKey = 'voorzieningen',
    cacheKey = 'search',
    queryParamsBuilder,
    mapToOption,
    source = 'database',
    extendParams = [],
  } = options;

  return {
    entityType,
    collectionKey,
    cacheKey,
    queryParamsBuilder:
      queryParamsBuilder ||
      ((searchTerm, additionalParams = {}) => {
        const params = {
          _limit: '50',
          _page: '1',
          _source: source,
          ...additionalParams,
        };

        // Add extend parameters if provided
        if (extendParams.length > 0) {
          extendParams.forEach((param) => {
            if (!params['_extend[]']) {
              params['_extend[]'] = [];
            }
            if (Array.isArray(params['_extend[]'])) {
              params['_extend[]'].push(param);
            }
          });
        }

        if (searchTerm && searchTerm.trim()) {
          params._search = searchTerm.trim();
        }

        return params;
      }),
    mapToOption,
    useCacheFirst: false,
    fetchMethod: async (queryParams) => {
      await store.object.fetchCollection(
        collectionKey,
        entityType,
        queryParams
      );
      const collection = store.object.getCollection(
        `${collectionKey}_${entityType}`
      );
      return collection?.results || collection || [];
    },
  };
};

/**
 * Creates an organisatie search configuration
 * @param {Object} store - The MobX store instance
 * @param {Object} options - Configuration options
 * @param {string} options.collectionKey - Collection key (default: 'voorzieningen')
 * @param {string} options.cacheKey - Cache key suffix (default: 'search')
 * @param {Function} options.queryParamsBuilder - Function to build query params
 * @param {Function} options.mapToOption - Function to map items to options
 * @param {string} options.source - Source type: 'index' or 'database' (default: 'database')
 * @returns {Object} Search configuration object
 */
export const createOrganisatieSearchConfig = (store, options = {}) => {
  return createEntitySearchConfig(store, 'organisatie', {
    ...options,
    extendParams: ['@self.schema'],
    source: options.source || 'database',
  });
};

/**
 * Custom hook for entity searching
 * @param {Object} config - Search configuration (from createModuleSearchConfig, etc.)
 * @param {Object} options - Hook options
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 500)
 * @param {string} options.mergeStrategy - Merge strategy (default: 'preserve-existing')
 * @param {Array} options.initialOptions - Initial options array
 * @returns {Object} Object with search function, loading state, options, and setOptions
 */
export const useEntitySearch = (config, options = {}) => {
  const {
    debounceDelay = 500,
    mergeStrategy = 'preserve-existing',
    initialOptions = [],
  } = options;

  const { loading, setLoading } = useLoadingState(false);
  const [optionsState, setOptionsState] = useState(initialOptions);

  const performSearch = useCallback(
    async (searchTerm = '', additionalParams = {}) => {
      if (!config?.fetchMethod || !config?.mapToOption) {
        console.error('useEntitySearch: Invalid config provided');
        return;
      }

      setLoading(true);

      try {
        const queryParams = config.queryParamsBuilder
          ? config.queryParamsBuilder(searchTerm, additionalParams)
          : { _search: searchTerm };

        const list = await config.fetchMethod(queryParams);
        const mappedOptions = list.map((item, index) =>
          config.mapToOption(item, index)
        );
        const validOptions = filterValidOptions(mappedOptions);

        setOptionsState((prevOptions) =>
          mergeSearchOptions(prevOptions, validOptions, mergeStrategy)
        );
      } catch (e) {
        console.error('Entity search failed:', e);
        // Don't clear options on error to preserve existing selections
      } finally {
        setLoading(false);
      }
    },
    [config, mergeStrategy, setLoading]
  );

  const debouncedSearch = useDebouncedInput(performSearch, debounceDelay, {
    disableInstantValidation: true,
  });

  const search = useCallback(
    (searchTerm = '', additionalParams = {}) => {
      debouncedSearch(searchTerm, additionalParams);
    },
    [debouncedSearch]
  );

  return {
    search,
    loading,
    options: optionsState,
    setOptions: setOptionsState,
  };
};
