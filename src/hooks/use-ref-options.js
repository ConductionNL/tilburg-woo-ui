import { useState, useEffect, useCallback, useRef } from 'react';
// will be imported in a later PR
// import { buildTypeSuffix } from '@views/ac-forms/wizard-utils/search-utils';

// will be removed in a later PRT
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
 * Custom hook for fetching options for $ref-based form fields
 *
 * @param {Object} store - The MobX store object containing object store
 * @param {string} currentRegister - The current register slug
 * @param {Object} schema - The form schema object
 * @param {Object} fieldConfigs - Field configurations
 * @returns {Object} - Object containing optionsProviders, loadingStates, and fetchOptions function
 */
// Global cache to store API results across all instances
const API_CACHE = new Map();

// HACK: Global state to force dropdown updates (TODO: Fix the actual re-render loop issue)
window.FORCE_DROPDOWN_UPDATE = window.FORCE_DROPDOWN_UPDATE || new Map();

// Helper function to clear cache (useful for development or when data changes)
export const clearRefOptionsCache = () => {
  API_CACHE.clear();
};

// Helper function to inspect cache (useful for debugging)
export const inspectRefOptionsCache = () => {
  return API_CACHE;
};

export const useRefOptions = (
  store,
  currentRegister,
  schema,
  // fieldConfigs = {},
  optimizations = {}
) => {
  const [optionsProviders, setOptionsProviders] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  const [disabledStates, setDisabledStates] = useState({});

  const { object } = store;
  const { preSelected = {}, preSelectedLabels = {} } = optimizations;

  // Initialization guard to prevent multiple runs during unstable schema phase
  const hasInitializedRef = useRef(false);

  // Track which fields are currently being fetched to prevent duplicate calls
  const fetchingFieldsRef = useRef(new Set());

  /**
   * Maps schema slugs to their correct register
   * Some schemas live in different registers than the default currentRegister
   */
  const SCHEMA_REGISTER_MAPPING = {
    contactpersoon: 'voorzieningen',
    organisatie: 'voorzieningen',
    product: 'voorzieningen',
    module: 'voorzieningen',
    moduleversie: 'voorzieningen',
    element: 'vng-gemma', // Referentiecomponenten live in vng-gemma register
    // Add more mappings as needed
    // By default, schemas without mapping use the currentRegister
  };

  /**
   * Extracts the schema slug from a $ref value
   */
  const extractSchemaSlugFromRef = (ref) => {
    if (!ref || typeof ref !== 'string') return null;
    const parts = ref.split('/');
    return parts[parts.length - 1];
  };

  /**
   * Gets the correct register for a schema slug
   */
  const getRegisterForSchema = (schemaSlug) => {
    const mappedRegister = SCHEMA_REGISTER_MAPPING[schemaSlug] || currentRegister;
    return mappedRegister;
  };

  /**
   * Convert a schema ref slug to the actual collection slug expected by the API.
   * Keep schema names (e.g., moduleVersie) in UI/schema, but fetch from 'moduleversies'.
   */
  const getCollectionSlugForRef = (refSchemaSlug) => {
    const mapping = {
      moduleVersie: 'moduleversie',
      moduleversie: 'moduleversie',
    };
    return mapping[refSchemaSlug] || refSchemaSlug;
  };

  /**
   * Finds all $ref fields in the schema
   */
  const findRefFields = useCallback((properties, parentPath = '') => {
    const refFields = [];

    Object.entries(properties).forEach(([key, propertySchema]) => {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;

      // Direct $ref
      if (propertySchema.$ref) {
        const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.$ref);
        refFields.push({
          path: fieldPath,
          refSchemaSlug,
          isArray: false,
        });
      }

      // Array of $ref
      if (propertySchema.type === 'array' && propertySchema.items?.$ref) {
        const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.items.$ref);
        refFields.push({
          path: fieldPath,
          refSchemaSlug,
          isArray: true,
        });
      }

      // Nested objects
      if (propertySchema.type === 'object' && propertySchema.properties) {
        refFields.push(...findRefFields(propertySchema.properties, fieldPath));
      }
    });

    return refFields;
  }, []);

  /**
   * Extracts query parameters from schema field configuration
   */
  const getQueryParamsFromSchema = useCallback(
    (fieldPath) => {
      if (!schema || !schema.properties) return {};

      // Navigate to the field in the schema
      const pathParts = fieldPath.split('.');
      let currentProperty = schema.properties;

      for (const part of pathParts) {
        if (currentProperty[part]) {
          currentProperty = currentProperty[part];
        } else {
          return {};
        }
      }

      // Check for query parameters in different locations
      let queryParamsString = '';

      // For array fields, check items.objectConfiguration.queryParams
      if (currentProperty.items?.objectConfiguration?.queryParams) {
        queryParamsString = currentProperty.items.objectConfiguration.queryParams;
      }
      // For direct object references, check objectConfiguration.queryParams
      else if (currentProperty.objectConfiguration?.queryParams) {
        queryParamsString = currentProperty.objectConfiguration.queryParams;
      }

      if (queryParamsString) {
        // Parse the queryParams string into an object
        const params = {};
        const urlParams = new URLSearchParams(queryParamsString);
        urlParams.forEach((value, key) => {
          params[key] = value;
        });
        // Strip schema-provided _extend if it tries to include standards for options fetches
        if (
          typeof params._extend === 'string' &&
          (params._extend.includes('aanbevolenStandaarden') ||
            params._extend.includes('verplichteStandaarden'))
        ) {
          delete params._extend;
        }
        if (Array.isArray(params._extend)) {
          const filtered = params._extend.filter(
            (v) =>
              typeof v === 'string' &&
              !v.includes('aanbevolenStandaarden') &&
              !v.includes('verplichteStandaarden')
          );
          if (filtered.length > 0) {
            params._extend = filtered;
          } else {
            delete params._extend;
          }
        }

        return params;
      }

      return {};
    },
    [schema]
  );

  /**
   * Fetches options for a specific $ref field
   */
  const fetchOptionsForField = useCallback(
    async (fieldPath, refSchemaSlug, searchQuery = '') => {
      if (!currentRegister || !refSchemaSlug || !object) {
        return;
      }

      // Get the correct register for this schema
      const targetRegister = getRegisterForSchema(refSchemaSlug);

      // Get query parameters from schema configuration
      const schemaQueryParams = getQueryParamsFromSchema(fieldPath);

      // Create a unique key for this fetch operation (include schema params in cache key)
      const collectionSlug = getCollectionSlugForRef(refSchemaSlug);
      const fetchKey = `${fieldPath}-${collectionSlug}-${searchQuery || 'initial'}`;

      // Build fetch params to check for distinguishing params in cache key
      const allQueryParams = {
        ...schemaQueryParams,
        ...(optimizations?.additionalQueryParams || {}),
      };

      const cacheKey = `${targetRegister}-${collectionSlug}-${
        searchQuery || 'initial'
      }-${JSON.stringify(allQueryParams)}`;

      // Check cache first - if we have cached results, use them immediately
      if (API_CACHE.has(cacheKey)) {
        const cachedOptions = API_CACHE.get(cacheKey);

        setOptionsProviders((prev) => ({
          ...prev,
          [fieldPath]: cachedOptions,
        }));

        // Don't auto-disable fields - users should always be able to clear/change selections
        setDisabledStates((prev) => ({
          ...prev,
          [fieldPath]: false,
        }));

        return;
      }

      // Prevent duplicate fetches for the same field/query combination
      if (fetchingFieldsRef.current.has(fetchKey)) {
        return;
      }

      // Mark this field as being fetched
      fetchingFieldsRef.current.add(fetchKey);

      // Optimization: If field is preselected and has a label, just use that single option
      const fieldPreselectedValue = preSelected[fieldPath];
      const fieldPreselectedLabel = preSelectedLabels[fieldPath];

      if (fieldPreselectedValue && fieldPreselectedLabel && !searchQuery) {
        // Handle both single values and arrays
        const isArray = Array.isArray(fieldPreselectedValue);
        const values = isArray ? fieldPreselectedValue : [fieldPreselectedValue];
        const labels = isArray ? fieldPreselectedLabel : [fieldPreselectedLabel];

        const options = values.map((value, index) => ({
          value: String(value),
          label: String(labels[index] || value),
          data: { id: value, name: labels[index] }, // Minimal data object
        }));

        setOptionsProviders((prev) => ({
          ...prev,
          [fieldPath]: options,
        }));

        // These fields will be disabled anyway, so no need to fetch more options
        setDisabledStates((prev) => ({
          ...prev,
          [fieldPath]: true, // Preselected fields are always disabled
        }));

        // Remove from fetching set
        fetchingFieldsRef.current.delete(fetchKey);
        return; // Skip API call
      }

      try {
        setLoadingStates((prev) => ({ ...prev, [fieldPath]: true }));

        // Use the object store's fetchCollection method to get the objects
        // Use 'options' suffix to separate from main list view collections
        const baseOptionsTypeSuffix = 'options';

        // Build fetch params - modules/applications should not be filtered by organisation
        const fetchParams = {
          _search: searchQuery || undefined,
          _limit: 50,
          _page: 1, // Always start from page 1 for form field options
          ...schemaQueryParams, // Add schema-defined query parameters
          ...(optimizations?.additionalQueryParams || {}), // Add additional query params from optimizations
        };

        // Only add _source filter for non-module schemas
        // Modules/applications should be visible across all organisations
        if (collectionSlug !== 'module' && collectionSlug !== 'moduleversie') {
          fetchParams._multi = true; // Enable multitenancy
        }

        // Build type suffix including distinguishing params (like gemmaType)
        // to prevent cancellation between different parameter combinations
        const optionsTypeSuffix = buildTypeSuffix(
          baseOptionsTypeSuffix,
          fetchParams
        );

        await object.fetchCollection(
          targetRegister,
          collectionSlug,
          fetchParams,
          false,
          optionsTypeSuffix
        );

        // Get the data from the store after fetching using the suffixed type
        // Use getTypeFromParams to match how fetchCollection constructs the type
        const collectionType = object.getTypeFromParams(
          targetRegister,
          collectionSlug,
          null,
          optionsTypeSuffix
        );

        const collection = object.getCollection(collectionType);

        if (collection && collection.results && collection.results.length > 0) {
          const options = collection.results
            .map((item) => {
              // Always use @self.id for the value
              const rawValue = item['@self']?.id;

              // Always use @self.name for the label
              const rawLabel = item['@self']?.name || 'Unnamed';

              // Skip items without @self.id
              if (!rawValue) {
                return null;
              }

              return {
                value: String(rawValue),
                label: String(rawLabel),
                data: item, // Store full object for reference
              };
            })
            .filter(Boolean); // Remove null entries

          // Cache the results for future use
          API_CACHE.set(cacheKey, options);

          setOptionsProviders((prev) => ({
            ...prev,
            [fieldPath]: options,
          }));

          // HACK: Store in global state for direct dropdown access (TODO: Fix the actual re-render loop issue)
          window.FORCE_DROPDOWN_UPDATE.set(fieldPath, options);

          // HACK: Trigger a custom event to notify dropdowns
          window.dispatchEvent(
            new CustomEvent('dropdownOptionsUpdate', {
              detail: { fieldPath, options },
            })
          );

          // Don't auto-disable fields based on search results
          // Users should be able to clear/change their selection even with 1 result
          setDisabledStates((prev) => ({
            ...prev,
            [fieldPath]: false,
          }));
        } else {
          // Cache empty results to prevent repeated calls
          API_CACHE.set(cacheKey, []);

          setOptionsProviders((prev) => ({
            ...prev,
            [fieldPath]: [],
          }));
        }
      } catch (error) {
        console.error(`❌ Failed to fetch options for ${fieldPath}:`, error);
        setOptionsProviders((prev) => ({
          ...prev,
          [fieldPath]: [],
        }));

        // Reset disabled state on error
        setDisabledStates((prev) => ({
          ...prev,
          [fieldPath]: false,
        }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, [fieldPath]: false }));
        // Remove from fetching set when done
        fetchingFieldsRef.current.delete(fetchKey);
      }
    },
    [
      currentRegister,
      object,
      preSelected,
      preSelectedLabels,
      getRegisterForSchema,
      getQueryParamsFromSchema,
    ]
  );

  /**
   * Handles search input for a specific field with improved debouncing and loop prevention
   */
  const handleSearch = useCallback(
    (fieldPath, refSchemaSlug, searchQuery) => {
      // Prevent search if already loading this field or if query is too short
      if (loadingStates[fieldPath] || !searchQuery || searchQuery.length < 2) {
        return;
      }

      // Prevent duplicate searches
      const currentQuery = searchQueries[fieldPath];
      if (currentQuery === searchQuery) {
        return;
      }

      setSearchQueries((prev) => ({ ...prev, [fieldPath]: searchQuery }));

      // Clear any existing timeout for this field
      if (window[`searchTimeout_${fieldPath}`]) {
        clearTimeout(window[`searchTimeout_${fieldPath}`]);
        delete window[`searchTimeout_${fieldPath}`];
      }

      // Debounce the search with field-specific timeouts
      const timeoutId = setTimeout(() => {
        fetchOptionsForField(fieldPath, refSchemaSlug, searchQuery);
        delete window[`searchTimeout_${fieldPath}`];
      }, 300);

      window[`searchTimeout_${fieldPath}`] = timeoutId;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [loadingStates, searchQueries]
  );

  /**
   * Initial fetch of options for all $ref fields (with initialization guard)
   */
  useEffect(() => {
    // Guard against multiple initializations during unstable phase
    if (!schema?.properties || !currentRegister || !object) return;
    if (hasInitializedRef.current) return;

    const refFields = findRefFields(schema.properties);

    if (refFields.length > 0) {
      // Check cache immediately for instant loading
      refFields.forEach(({ path, refSchemaSlug }) => {
        const cacheKey = `${currentRegister}-${refSchemaSlug}-initial`;
        if (API_CACHE.has(cacheKey)) {
          const cachedOptions = API_CACHE.get(cacheKey);

          setOptionsProviders((prev) => ({
            ...prev,
            [path]: cachedOptions,
          }));

          // Don't auto-disable based on option count
          setDisabledStates((prev) => ({
            ...prev,
            [path]: false,
          }));
        }
      });

      // Add a small delay to ensure schema is stable, then fetch missing data
      const timeoutId = setTimeout(() => {
        refFields.forEach(({ path, refSchemaSlug }) => {
          fetchOptionsForField(path, refSchemaSlug);
        });

        // Mark as initialized after starting the fetches
        hasInitializedRef.current = true;
      }, 100);

      // Cleanup timeout if effect is re-run
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema?.properties, schema?.slug, currentRegister, object]);

  // Reset the guard when schema changes (similar to modal pattern)
  useEffect(() => {
    hasInitializedRef.current = false;
    fetchingFieldsRef.current.clear(); // Clear fetching state
  }, [schema?.properties, schema?.slug, currentRegister]);

  // Cleanup effect to clear any pending search timeouts (only on unmount)
  useEffect(() => {
    return () => {
      // Clear all search timeouts on unmount by checking the global window object
      // We can't use searchQueries here because it would cause this effect to run on every query change
      for (const key in window) {
        if (key.startsWith('searchTimeout_')) {
          clearTimeout(window[key]);
          delete window[key];
        }
      }
      // Clear fetching state on unmount
      fetchingFieldsRef.current.clear();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    optionsProviders,
    loadingStates,
    disabledStates,
    searchQueries,
    handleSearch,
    fetchOptionsForField,
  };
};
