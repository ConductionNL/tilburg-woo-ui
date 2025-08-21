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
   * Extracts the schema slug from a $ref value
   */
  const extractSchemaSlugFromRef = (ref) => {
    if (!ref || typeof ref !== 'string') return null;
    const parts = ref.split('/');
    const slug = parts[parts.length - 1];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 extractSchemaSlugFromRef: ${ref} -> ${slug}`);
    }
    
    return slug;
  };

  /**
   * Finds all $ref fields in the schema
   */
  const findRefFields = useCallback((properties, parentPath = '') => {
    const refFields = [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 findRefFields: Scanning properties for ${parentPath || 'root'}:`, Object.keys(properties));
    }
    
    Object.entries(properties).forEach(([key, propertySchema]) => {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      
      // Direct $ref
      if (propertySchema.$ref) {
        const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.$ref);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 findRefFields: Found $ref field ${fieldPath} -> ${refSchemaSlug}`);
        }
        refFields.push({
          path: fieldPath,
          refSchemaSlug,
          isArray: false
        });
      }
      
      // Array of $ref
      if (propertySchema.type === 'array' && propertySchema.items?.$ref) {
        const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.items.$ref);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 findRefFields: Found array $ref field ${fieldPath} -> ${refSchemaSlug}`);
        }
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 findRefFields: Total ref fields found for ${parentPath || 'root'}:`, refFields.length);
    }
    
    return refFields;
  }, []);

  /**
   * Fetches options for a specific $ref field
   */
  const fetchOptionsForField = useCallback(async (fieldPath, refSchemaSlug, searchQuery = '') => {
    if (!currentRegister || !refSchemaSlug || !object) {
      console.log(`❌ fetchOptionsForField: Missing required params for ${fieldPath}:`, { currentRegister, refSchemaSlug, object: !!object });
      return;
    }

    // Create a unique key for this fetch operation
    const fetchKey = `${fieldPath}-${refSchemaSlug}-${searchQuery || 'initial'}`;
    const cacheKey = `${currentRegister}-${refSchemaSlug}-${searchQuery || 'initial'}`;
    
    // Check cache first - if we have cached results, use them immediately
    if (API_CACHE.has(cacheKey)) {
      const cachedOptions = API_CACHE.get(cacheKey);
      // console.log(`🚀 fetchOptionsForField: Using cached options for ${fieldPath}:`, cachedOptions.length);
      
      setOptionsProviders(prev => ({
        ...prev,
        [fieldPath]: cachedOptions
      }));

      // Disable field if only one option is available
      setDisabledStates(prev => ({
        ...prev,
        [fieldPath]: cachedOptions.length === 1
      }));
      
      return;
    }
    
    // Prevent duplicate fetches for the same field/query combination
    if (fetchingFieldsRef.current.has(fetchKey)) {
      console.log(`🔄 fetchOptionsForField: Already fetching ${fieldPath}, skipping duplicate call`);
      return;
    }

    // Mark this field as being fetched
    fetchingFieldsRef.current.add(fetchKey);

    // Optimization: If field is preselected and has a label, just use that single option
    const fieldPreselectedValue = preSelected[fieldPath];
    const fieldPreselectedLabel = preSelectedLabels[fieldPath];
    
    if (fieldPreselectedValue && fieldPreselectedLabel && !searchQuery) {
      console.log(`🚀 Optimizing ${fieldPath}: Using preselected option instead of fetching`);
      
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
      console.log(`🔍 fetchOptionsForField: Starting fetch for ${fieldPath} (${refSchemaSlug})`);
      setLoadingStates(prev => ({ ...prev, [fieldPath]: true }));

      // Use the object store's fetchCollection method to get the objects
      // Use 'options' suffix to separate from main list view collections
      const optionsTypeSuffix = 'options';
      const fetchParams = {
        _search: searchQuery || undefined,
        _limit: 50,
        _page: 1, // Always start from page 1 for form field options
      };
      
      console.log(`🔍 fetchOptionsForField: Fetching with params:`, fetchParams);
      await object.fetchCollection(currentRegister, refSchemaSlug, fetchParams, false, optionsTypeSuffix);
      
      // Get the data from the store after fetching using the suffixed type
      const collectionType = `${currentRegister}_${refSchemaSlug}_${optionsTypeSuffix}`;
      const collection = object.getCollection(collectionType);

      console.log(`🔍 fetchOptionsForField: Collection result for ${fieldPath}:`, collection);
      console.log(`🔍 fetchOptionsForField: Collection results array for ${fieldPath}:`, collection?.results);
      console.log(`🔍 fetchOptionsForField: Collection results length:`, collection?.results?.length);

      if (collection && collection.results && collection.results.length > 0) {
        console.log(`🔍 fetchOptionsForField: Raw results for ${fieldPath}:`, collection.results);
        console.log(`🔍 fetchOptionsForField: First item structure:`, collection.results[0]);
        
        const options = collection.results.map((item, index) => {
          // Always use @self.id for the value
          const value = item['@self']?.id;
          
          // Always use @self.name for the label
          const label = item['@self']?.name || 'Unnamed';
          
          console.log(`🔍 Mapping item ${index} for ${fieldPath}:`, {
            hasAtSelf: !!item['@self'],
            atSelfKeys: item['@self'] ? Object.keys(item['@self']) : 'N/A',
            extractedValue: value,
            extractedLabel: label,
            fullItem: item
          });
          
          // Skip items without @self.id
          if (!value) {
            console.warn(`⚠️ Skipping item ${index} for ${fieldPath}: no @self.id found`);
            return null;
          }
          
          return {
            value,
            label,
            data: item // Store full object for reference
          };
        }).filter(Boolean); // Remove null entries

        console.log(`🔍 fetchOptionsForField: Generated options for ${fieldPath}:`, options);

        // Cache the results for future use
        API_CACHE.set(cacheKey, options);

        setOptionsProviders(prev => ({
          ...prev,
          [fieldPath]: options
        }));

        // HACK: Store in global state for direct dropdown access (TODO: Fix the actual re-render loop issue)
        window.FORCE_DROPDOWN_UPDATE.set(fieldPath, options);
        console.log(`🌍 HACK: Stored ${options.length} options globally for ${fieldPath}`);

        // HACK: Trigger a custom event to notify dropdowns
        window.dispatchEvent(new CustomEvent('dropdownOptionsUpdate', { 
          detail: { fieldPath, options } 
        }));

        // Disable field if only one option is available
        setDisabledStates(prev => ({
          ...prev,
          [fieldPath]: options.length === 1
        }));

        // Enable search if there are more results available  
        const hasMoreResults = collection.total > collection.results.length;
        if (hasMoreResults) {
          // Field should be searchable - this is handled in the field config
        }
      } else {
        console.warn(`⚠️ fetchOptionsForField: No collection or results for ${fieldPath}`);
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

    console.log(`📝 Scheduling search for ${fieldPath}:`, searchQuery);
    setSearchQueries(prev => ({ ...prev, [fieldPath]: searchQuery }));
    
    // Clear any existing timeout for this field
    if (window[`searchTimeout_${fieldPath}`]) {
      clearTimeout(window[`searchTimeout_${fieldPath}`]);
    }
    
    // Debounce the search with field-specific timeouts
    window[`searchTimeout_${fieldPath}`] = setTimeout(() => {
      console.log(`🎯 Executing search for ${fieldPath}:`, searchQuery);
      fetchOptionsForField(fieldPath, refSchemaSlug, searchQuery);
      delete window[`searchTimeout_${fieldPath}`];
    }, 300);
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
      // Development debug for initialization
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 useRefOptions: Initializing for schema:', schema?.title || 'Unknown');
        console.log('🎯 useRefOptions: Found ref fields:', refFields.map(f => `${f.path} -> ${f.refSchemaSlug}`));
      }
      
      // Check cache immediately for instant loading
      refFields.forEach(({ path, refSchemaSlug }) => {
        const cacheKey = `${currentRegister}-${refSchemaSlug}-initial`;
        if (API_CACHE.has(cacheKey)) {
          const cachedOptions = API_CACHE.get(cacheKey);
          // console.log(`🚀 useRefOptions: Loading cached options for ${path}:`, cachedOptions.length);
          
          setOptionsProviders(prev => ({
            ...prev,
            [path]: cachedOptions
          }));

          setDisabledStates(prev => ({
            ...prev,
            [path]: cachedOptions.length === 1
          }));
        }
      });

      // Add a small delay to ensure schema is stable, then fetch missing data
      const timeoutId = setTimeout(() => {
        refFields.forEach(({ path, refSchemaSlug }) => {
          console.log(`🎯 useRefOptions: Fetching options for ${path} (${refSchemaSlug})`);
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
    // Reset initialization guard for schema change
    console.log('🔄 useRefOptions: Schema changed, resetting initialization guard');
  }, [schema?.slug, currentRegister]);

  // Cleanup effect to clear any pending search timeouts
  useEffect(() => {
    return () => {
      // Clear all search timeouts on unmount
      Object.keys(searchQueries).forEach(fieldPath => {
        if (window[`searchTimeout_${fieldPath}`]) {
          clearTimeout(window[`searchTimeout_${fieldPath}`]);
          delete window[`searchTimeout_${fieldPath}`];
        }
      });
      // Clear fetching state on unmount
      fetchingFieldsRef.current.clear();
    };
  }, [searchQueries]);

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
