import { useState, useEffect, useCallback, useRef } from 'react';

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
  console.log('🧹 API cache cleared');
};

// Helper function to inspect cache (useful for debugging)
export const inspectRefOptionsCache = () => {
  console.log('🔍 API cache contents:', Array.from(API_CACHE.entries()));
  return API_CACHE;
};

export const useRefOptions = (store, currentRegister, schema, fieldConfigs = {}, optimizations = {}) => {
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
    'contactpersoon': 'voorzieningen',
    'organisatie': 'voorzieningen',
    'module': 'voorzieningen',
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
    return SCHEMA_REGISTER_MAPPING[schemaSlug] || currentRegister;
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
          isArray: false
        });
      }
      
      // Array of $ref
      if (propertySchema.type === 'array' && propertySchema.items?.$ref) {
        const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.items.$ref);
        refFields.push({
          path: fieldPath,
          refSchemaSlug,
          isArray: true
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
   * Fetches options for a specific $ref field
   */
  const fetchOptionsForField = useCallback(async (fieldPath, refSchemaSlug, searchQuery = '') => {
    if (!currentRegister || !refSchemaSlug || !object) {
      return;
    }

    // Get the correct register for this schema
    const targetRegister = getRegisterForSchema(refSchemaSlug);

    // Create a unique key for this fetch operation
    const fetchKey = `${fieldPath}-${refSchemaSlug}-${searchQuery || 'initial'}`;
    const cacheKey = `${targetRegister}-${refSchemaSlug}-${searchQuery || 'initial'}`;
    
    // Check cache first - if we have cached results, use them immediately
    if (API_CACHE.has(cacheKey)) {
      const cachedOptions = API_CACHE.get(cacheKey);
      
      setOptionsProviders(prev => ({
        ...prev,
        [fieldPath]: cachedOptions
      }));

      // Don't auto-disable fields - users should always be able to clear/change selections
      setDisabledStates(prev => ({
        ...prev,
        [fieldPath]: false
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
        value: value,
        label: labels[index] || value,
        data: { id: value, name: labels[index] } // Minimal data object
      }));

      setOptionsProviders(prev => ({
        ...prev,
        [fieldPath]: options
      }));

      // These fields will be disabled anyway, so no need to fetch more options
      setDisabledStates(prev => ({
        ...prev,
        [fieldPath]: true // Preselected fields are always disabled
      }));

      // Remove from fetching set
      fetchingFieldsRef.current.delete(fetchKey);
      return; // Skip API call
    }

    try {
      setLoadingStates(prev => ({ ...prev, [fieldPath]: true }));

      // Use the object store's fetchCollection method to get the objects
      // Use 'options' suffix to separate from main list view collections
      const optionsTypeSuffix = 'options';
      const fetchParams = {
        _search: searchQuery || undefined,
        _limit: 50,
        _page: 1, // Always start from page 1 for form field options
      };
      
      await object.fetchCollection(targetRegister, refSchemaSlug, fetchParams, false, optionsTypeSuffix);
      
      // Get the data from the store after fetching using the suffixed type
      const collectionType = `${targetRegister}_${refSchemaSlug}_${optionsTypeSuffix}`;

      console.log(`🔍 useRefOptions: Fetching from ${targetRegister}/${refSchemaSlug} for field ${fieldPath}`);
      const collection = object.getCollection(collectionType);

      if (collection && collection.results && collection.results.length > 0) {
        
        const options = collection.results.map((item, index) => {
          // Always use @self.id for the value
          const value = item['@self']?.id;
          
          // Always use @self.name for the label
          const label = item['@self']?.name || 'Unnamed';
          
          // Skip items without @self.id
          if (!value) {
            return null;
          }
          
          return {
            value,
            label,
            data: item // Store full object for reference
          };
        }).filter(Boolean); // Remove null entries

        // Cache the results for future use
        API_CACHE.set(cacheKey, options);

        setOptionsProviders(prev => ({
          ...prev,
          [fieldPath]: options
        }));

        // HACK: Store in global state for direct dropdown access (TODO: Fix the actual re-render loop issue)
        window.FORCE_DROPDOWN_UPDATE.set(fieldPath, options);

        // HACK: Trigger a custom event to notify dropdowns
        window.dispatchEvent(new CustomEvent('dropdownOptionsUpdate', { 
          detail: { fieldPath, options } 
        }));

        // Don't auto-disable fields based on search results
        // Users should be able to clear/change their selection even with 1 result
        setDisabledStates(prev => ({
          ...prev,
          [fieldPath]: false
        }));
      } else {
        // Cache empty results to prevent repeated calls
        API_CACHE.set(cacheKey, []);
        
        setOptionsProviders(prev => ({
          ...prev,
          [fieldPath]: []
        }));
      }
    } catch (error) {
      console.error(`❌ Failed to fetch options for ${fieldPath}:`, error);
      setOptionsProviders(prev => ({
        ...prev,
        [fieldPath]: []
      }));
      
      // Reset disabled state on error
      setDisabledStates(prev => ({
        ...prev,
        [fieldPath]: false
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [fieldPath]: false }));
      // Remove from fetching set when done
      fetchingFieldsRef.current.delete(fetchKey);
    }
  }, [currentRegister, object, preSelected, preSelectedLabels]);

  /**
   * Handles search input for a specific field with improved debouncing and loop prevention
   */
  const handleSearch = useCallback((fieldPath, refSchemaSlug, searchQuery) => {
    // Prevent search if already loading this field or if query is too short
    if (loadingStates[fieldPath] || !searchQuery || searchQuery.length < 2) {
      return;
    }

    // Prevent duplicate searches
    const currentQuery = searchQueries[fieldPath];
    if (currentQuery === searchQuery) {
      return;
    }

    setSearchQueries(prev => ({ ...prev, [fieldPath]: searchQuery }));
    
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
  }, [loadingStates, searchQueries]);

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
          
          setOptionsProviders(prev => ({
            ...prev,
            [path]: cachedOptions
          }));

          // Don't auto-disable based on option count
          setDisabledStates(prev => ({
            ...prev,
            [path]: false
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
  }, [schema?.slug, currentRegister, object]);

  // Reset the guard when schema changes (similar to modal pattern)
  useEffect(() => {
    hasInitializedRef.current = false;
    fetchingFieldsRef.current.clear(); // Clear fetching state
  }, [schema?.slug, currentRegister]);

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

  // Debug effect disabled to prevent infinite loops
  // const prevRefOptionsKeysRef = useRef([]);
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     const currentKeys = Object.keys(optionsProviders).sort();
  //     const prevKeys = prevRefOptionsKeysRef.current;
      
  //     // Only log if keys actually changed or if any array has items
  //     const hasData = Object.values(optionsProviders).some(arr => Array.isArray(arr) && arr.length > 0);
  //     if (JSON.stringify(currentKeys) !== JSON.stringify(prevKeys) || hasData) {
  //       console.log('🔍 useRefOptions: optionsProviders updated:', currentKeys);
  //       if (hasData) {
  //         console.log('🔍 useRefOptions: Data loaded for fields:', 
  //           Object.entries(optionsProviders)
  //             .filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
  //             .map(([key]) => key)
  //         );
  //         console.log('🔍 useRefOptions: Final options for aanbieder:', optionsProviders.aanbieder);
  //         console.log('🔍 useRefOptions: All final options:', optionsProviders);
  //       }
  //       prevRefOptionsKeysRef.current = currentKeys;
  //     }
  //   }
  // }, [optionsProviders]);

  // Debug logging disabled to prevent loops
  // if (optionsProviders.aanbieder && optionsProviders.aanbieder.length > 0) {
  //   console.log('🔍 Hook: Returning optionsProviders.aanbieder:', optionsProviders.aanbieder);
  // }

  return {
    optionsProviders,
    loadingStates,
    disabledStates,
    searchQueries,
    handleSearch,
    fetchOptionsForField
  };
};
