/**
 * Search Utilities for Forms
 *
 * Provides hooks and utilities for entity searching with debouncing, loading states, and option merging.
 */

import { useState, useCallback, useMemo } from 'react';
import { useDebouncedInput } from '@src/hooks';
import { useLoadingState } from './loading-utils';
import { filterValidOptions, mapId } from './mapping-utils';

/**
 * Builds a type suffix that includes distinguishing query parameters
 * to prevent request cancellation between different parameter combinations
 * @param {string} baseSuffix - Base suffix (e.g., 'module_search')
 * @param {Object} queryParams - Query parameters
 * @returns {string} Suffix with distinguishing params included
 */
export const buildTypeSuffix = (baseSuffix, queryParams) => {
  const distinguishingParams = [];

  // Include gemmaType in suffix to prevent cancellation between different gemmaType fetches
  if (queryParams?.gemmaType) {
    distinguishingParams.push(`gemmaType-${queryParams.gemmaType}`);
  }

  if (distinguishingParams.length > 0) {
    return baseSuffix
      ? `${baseSuffix}_${distinguishingParams.join('_')}`
      : distinguishingParams.join('_');
  }

  return baseSuffix;
};

/**
 * Merges search options with existing options
 *
 * RESULT IS NOT MEMOIZED
 *
 * @param {Array<Object>} prevOptions - Previous options array
 * @param {Array<Object>} newOptions - New options from search
 * @param {string} strategy - Merge strategy: 'preserve-existing' (default), 'replace-existing', or 'update-existing'
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

  if (strategy === 'update-existing') {
    // Preserve all existing options (maintains order), add new ones, and update existing ones with new data
    const existingOptionsMap = new Map(
      prevOptions.map((opt) => [String(opt.value), opt])
    );
    const newOptionsMap = new Map(newOptions.map((opt) => [String(opt.value), opt]));

    // Start with all existing options (preserves order)
    const mergedOptions = [...prevOptions];

    // Process new options
    newOptionsMap.forEach((newOpt, value) => {
      const stringValue = String(value);
      if (!existingOptionsMap.has(stringValue)) {
        // Add new options that don't exist
        mergedOptions.push(newOpt);
      } else {
        // Update existing option with new data (in case it changed)
        const index = mergedOptions.findIndex(
          (opt) => String(opt.value) === stringValue
        );
        if (index !== -1) {
          mergedOptions[index] = newOpt;
        }
      }
    });

    return mergedOptions;
  }

  // Default: preserve-existing - keep all existing, add new ones (don't update existing)
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
 *
 * RESULT IS NOT MEMOIZED
 *
 * @param {Object} store - The MobX store instance
 * @param {Object} options - Configuration options
 * @param {string} options.collectionKey - Collection key for storing results (default: 'voorzieningen_module')
 * @param {string} options.cacheKey - Cache key suffix (default: 'search')
 * @param {Function} options.queryParamsBuilder - Function to build query params (receives searchTerm)
 * @param {Function} options.mapToOption - Function to map items to options
 * @param {string} options.source - Source type: 'index' or 'database' (default: 'index')
 * @param {boolean} options.useCacheFirst - Use fetchModulesCacheFirst instead of fetchCollection (default: false)
 * @param {Function} options.filterByOrg - Function to add org filter to query params
 * @param {Array<string>|null} options.allowedIds - When set, filter fetched results to only items whose id is in this array (e.g. module IDs from organisation's gebruik)
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
    allowedIds,
  } = options;

  const baseFetchMethod = useCacheFirst
    ? async (queryParams) => {
        return await store.object.fetchModulesCacheFirst(queryParams);
      }
    : async (queryParams) => {
        const typeSuffix = buildTypeSuffix(`module_${cacheKey}`, queryParams);
        await store.object.fetchCollection(
          collectionKey,
          'module',
          queryParams,
          null,
          typeSuffix
        );
        const collectionType = store.object.getTypeFromParams(
          collectionKey,
          'module',
          null,
          typeSuffix
        );
        const collection = store.object.getCollection(collectionType);
        return collection?.results || collection || [];
      };

  // When allowedIds is set: filter search results and fetch any allowed IDs not in the (limit 50) result
  const fetchMethod =
    allowedIds != null && allowedIds.length > 0
      ? async (queryParams) => {
          const list = await baseFetchMethod(queryParams);
          const allowedSet = new Set(allowedIds.map((id) => String(id)));
          const filteredList = list.filter((item) => {
            const id = String(
              mapId(item) || (item?.['@self']?.id ?? item?.id ?? item?.uuid ?? '')
            );
            return id && allowedSet.has(id);
          });
          const existingIds = new Set(
            filteredList.map((item) =>
              String(
                mapId(item) || (item?.['@self']?.id ?? item?.id ?? item?.uuid ?? '')
              )
            )
          );
          const missingIds = allowedIds.filter(
            (id) => id && !existingIds.has(String(id))
          );
          if (missingIds.length === 0) return filteredList;
          const fetched = await fetchEntitiesByIds(
            store,
            missingIds,
            { extendParams: ['@self.schema'], source }
          );
          return [...filteredList, ...fetched];
        }
      : baseFetchMethod;

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
    fetchMethod,
  };
};

/**
 * Creates a generic entity search configuration for any entity type
 *
 * RESULT IS NOT MEMOIZED
 *
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
      // Build type suffix including distinguishing params (like gemmaType)
      // to prevent cancellation between different parameter combinations
      const typeSuffix = buildTypeSuffix(`${entityType}_${cacheKey}`, queryParams);

      await store.object.fetchCollection(
        collectionKey,
        entityType,
        queryParams,
        null,
        typeSuffix
      );
      const collectionType = store.object.getTypeFromParams(
        collectionKey,
        entityType,
        null,
        typeSuffix
      );
      const collection = store.object.getCollection(collectionType);
      return collection?.results || collection || [];
    },
  };
};

/**
 * Creates an organisatie search configuration
 *
 * RESULT IS NOT MEMOIZED
 *
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
  // Merge extendParams if provided, otherwise use default
  const defaultExtendParams = ['@self.schema'];
  const extendParams = options.extendParams
    ? [...new Set([...defaultExtendParams, ...options.extendParams])]
    : defaultExtendParams;

  return createEntitySearchConfig(store, 'organisatie', {
    ...options,
    extendParams,
    source: options.source || 'database',
  });
};

/**
 * Fetches entities by ID and returns them as raw entity objects (not options).
 * Used when a search returns a limited list (e.g. _limit=50) but we need to ensure
 * specific IDs (e.g. allowedIds from gebruik) are included in the result.
 *
 * @param {Object} store - The MobX store instance
 * @param {string} collectionKey - Collection key (e.g., 'voorzieningen')
 * @param {string} entityType - Entity type (e.g., 'module')
 * @param {Array<string>} ids - Entity IDs to fetch
 * @param {Object} fetchOptions - Optional fetch options
 * @param {Array<string>} fetchOptions.extendParams - Extend parameters (default: ['@self.schema'])
 * @param {string} fetchOptions.source - Source type: 'index' or 'database' (default: 'index')
 * @returns {Promise<Array<Object>>} Array of fetched entity objects (nulls omitted)
 */
export const fetchEntitiesByIds = async (
  store,
  ids,
  fetchOptions = {}
) => {
  if (!ids || ids.length === 0) return [];

  const { extendParams = ['@self.schema'], source = 'index' } = fetchOptions;

  let results;
  try {
    const fetchParams = {
      _published: 'false',
      _source: source,
    };
    if (extendParams.length > 0) {
      fetchParams['_extend[]'] = extendParams;
    }
    results = await store.object.fetchObjects(ids, fetchParams);
  } catch (error) {
    console.error(`Failed to fetch entities`, ids, error);
    return null;
  }

  return results;
};

/**
 * Fetches missing entities and adds them to options.
 * 
 * @param {Object} store - The MobX store instance
 * @param {string} collectionKey - Collection key (e.g., 'voorzieningen')
 * @param {string} entityType - Entity type (e.g., 'module', 'dienst')
 * @param {Array<string>} ids - Array of entity IDs to fetch
 * @param {Array<Object>} currentOptions - Current options array to check against
 * @param {Function} mapper - Function to map fetched items to options
 * @param {Function} setOptions - Function to update options state
 * @param {Object} fetchOptions - Additional fetch options
 * @param {Array<string>} fetchOptions.extendParams - Extend parameters for fetch
 * @param {string} fetchOptions.source - Source type: 'index' or 'database' (default: 'index')
 * @param {function}   filterMissing - filter out missing ID's based on a condition (accepts function that gets passed into `.filter()`)
 * @returns {Promise<Array<Object>>} Array of newly fetched and mapped options
 */
export const fetchMissingEntities = async (
  store,
  ids,
  currentOptions,
  mapper,
  setOptions,
  fetchOptions = {},
  filterMissing = () => true
) => {
  if (!ids || ids.length === 0) return [];

  // Find which IDs are missing from current options
  const existingValues = new Set(currentOptions.map((opt) => String(opt.value)));
  const missingIds = ids
    .filter((id) => !existingValues.has(String(id)))
    .filter(filterMissing);

  if (missingIds.length === 0) return [];

  // Fetch missing entities
  const results = await fetchEntitiesByIds(store, missingIds, fetchOptions)

  const newOptions = results
    .map((result, index) => {
      return mapper(result, index);
    })
    .filter(Boolean)
    .filter((opt) => opt.label && opt.value);

  // Add new options to state
  if (newOptions.length > 0) {
    setOptions((prev) => {
      const existingValuesSet = new Set(prev.map((opt) => String(opt.value)));
      const uniqueNewOptions = newOptions.filter(
        (opt) => !existingValuesSet.has(String(opt.value))
      );
      return [...prev, ...uniqueNewOptions];
    });
  }

  return newOptions;
};

/**
 * Creates a function to fetch related entities based on filter criteria and resolve their labels
 * @param {Object} store - The MobX store instance
 * @param {string} collectionKey - Collection key (e.g., 'voorzieningen')
 * @param {string} entityType - Entity type to fetch (e.g., 'dienst')
 * @param {string} filterField - Field to filter by (e.g., 'modules')
 * @param {string} relatedEntityType - Related entity type for label resolution (e.g., 'module')
 * @param {Function} relatedMapper - Mapper function for related entities
 * @param {Function} getRelatedIds - Function to extract related IDs from fetched entities
 * @param {Object} options - Additional options
 * @param {Array<string>} options.extendParams - Extend parameters for fetch
 * @param {string} options.source - Source type: 'index' or 'database' (default: 'index')
 * @returns {Function} Function that accepts filterIds and returns { entities, resolvedLabels }
 */
export const createRelatedEntitiesFetcher = (
  store,
  collectionKey,
  entityType,
  filterField,
  relatedEntityType,
  relatedMapper,
  getRelatedIds,
  options = {}
) => {
  const { extendParams = ['@self.schema'], source = 'index' } = options;

  return async (filterIds, currentRelatedOptions = []) => {
    if (!filterIds || filterIds.length === 0) {
      return { entities: [], resolvedLabels: [] };
    }

    // Collect all entities for all filter IDs
    const allEntities = [];
    const seenEntityIds = new Set();

    for (const filterId of filterIds) {
      // Query entities where filterField array contains filter ID
      const params = {
        _limit: '50',
        _page: '1',
        _published: 'false',
        _source: source,
      };

      if (extendParams.length > 0) {
        params['_extend[]'] = extendParams;
      }

      // Add filter field (e.g., modules=filterId)
      params[filterField] = String(filterId);

      const baseCacheKey = `${entityType}_for_${filterField}_${filterId}`;
      // Build type suffix including distinguishing params (like gemmaType)
      // to prevent cancellation between different parameter combinations
      const typeSuffix = buildTypeSuffix(baseCacheKey, params);

      await store.object.fetchCollection(
        collectionKey,
        entityType,
        params,
        null,
        typeSuffix
      );

      const collectionType = store.object.getTypeFromParams(
        collectionKey,
        entityType,
        null,
        typeSuffix
      );
      const collection = store.object.getCollection(collectionType);
      const list = collection?.results || collection || [];

      // Add unique entities
      list.forEach((entityItem) => {
        const entityId = entityItem?.id || entityItem?.['@self']?.id || '';
        if (entityId && !seenEntityIds.has(entityId)) {
          seenEntityIds.add(entityId);
          allEntities.push(entityItem);
        }
      });
    }

    // Collect related entity IDs from fetched entities for resolution
    const relatedIds = new Set();
    allEntities.forEach((entityItem) => {
      const relatedIdsFromEntity = getRelatedIds(entityItem);
      relatedIdsFromEntity.forEach((id) => {
        if (id) relatedIds.add(String(id));
      });
    });

    // Resolve related entity labels
    const resolvedLabels = [];
    const relatedIdsArray = Array.from(relatedIds);

    for (const relatedId of relatedIdsArray) {
      // Check if already in current related options
      const existing = currentRelatedOptions.find(
        (opt) => String(opt.value) === String(relatedId)
      );
      if (existing) {
        resolvedLabels.push({ value: relatedId, label: existing.label });
      } else {
        // Try to fetch if not available
        try {
          const fetchParams = {
            '_extend[]': ['@self.schema'],
            _published: 'false',
            _source: source,
          };
          await store.object.fetchObject(
            collectionKey,
            relatedEntityType,
            String(relatedId),
            fetchParams
          );
          const relatedData = store.object.getObject(
            `${collectionKey}_${relatedEntityType}`,
            String(relatedId)
          );
          if (relatedData) {
            const mapped = relatedMapper(relatedData, 0);
            const label =
              mapped?.label ||
              relatedData?.naam ||
              relatedData?.name ||
              relatedData?.['@self']?.name ||
              relatedId;
            resolvedLabels.push({ value: relatedId, label });
          }
        } catch {
          // If fetch fails, use ID as label
          resolvedLabels.push({ value: relatedId, label: relatedId });
        }
      }
    }

    return { entities: allEntities, resolvedLabels };
  };
};

/**
 * Custom hook for entity searching
 *
 * RESULT IS MEMOIZED
 *
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

  /* memoize results based on params.
   * config should be memoized externally if implementation was done correctly.
   * e.g. 
   * ```js
    const organisatieMapper = useMemo(() => createOrganisatieMapper(), []);
    const organisatieSearchConfig = useMemo(
        () => createOrganisatieSearchConfig(store, {
            mapToOption: organisatieMapper,
            source: 'index',
        }
    ), [store, organisatieMapper]);

    const {
        search: searchOrganisaties,
        loading: organisatieSearchLoading,
        options: organisatieSearchOptions,
    } = useEntitySearch(organisatieSearchConfig, {
        debounceDelay: 500,
        mergeStrategy: 'preserve-existing',
    });
   ```
   */
  const returnValue = useMemo(
    () => ({
      search,
      loading,
      options: optionsState,
      setOptions: setOptionsState,
    }),
    [config, JSON.stringify(options), optionsState, loading]
  );

  return returnValue;
};
