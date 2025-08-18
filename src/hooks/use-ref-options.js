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
export const useRefOptions = (store, currentRegister, schema, fieldConfigs = {}, optimizations = {}) => {
  const [optionsProviders, setOptionsProviders] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  const [disabledStates, setDisabledStates] = useState({});

  const { object } = store;
  const { preSelected = {}, preSelectedLabels = {} } = optimizations;

  // Initialization guard to prevent multiple runs during unstable schema phase
  const hasInitializedRef = useRef(false);

  /**
   * Extracts the schema slug from a $ref value
   */
  const extractSchemaSlugFromRef = (ref) => {
    if (!ref || typeof ref !== 'string') return null;
    const parts = ref.split('/');
    return parts[parts.length - 1];
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
        refFields.push({
          path: fieldPath,
          refSchemaSlug: extractSchemaSlugFromRef(propertySchema.$ref),
          isArray: false
        });
      }
      
      // Array of $ref
      if (propertySchema.type === 'array' && propertySchema.items?.$ref) {
        refFields.push({
          path: fieldPath,
          refSchemaSlug: extractSchemaSlugFromRef(propertySchema.items.$ref),
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
    if (!currentRegister || !refSchemaSlug || !object) return;

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

      return; // Skip API call
    }

    try {
      setLoadingStates(prev => ({ ...prev, [fieldPath]: true }));

      // Use the object store's fetchCollection method to get the objects
      // Use 'options' suffix to separate from main list view collections
      const optionsTypeSuffix = 'options';
      await object.fetchCollection(currentRegister, refSchemaSlug, {
        _search: searchQuery || undefined,
        _limit: 50,
        _page: 1, // Always start from page 1 for form field options
      }, false, optionsTypeSuffix);
      
      // Get the data from the store after fetching using the suffixed type
      const collectionType = `${currentRegister}_${refSchemaSlug}_${optionsTypeSuffix}`;
      const collection = object.getCollection(collectionType);

      if (collection && collection.results) {
        const options = collection.results.map(item => ({
          value: item['@self']?.id || item.id || item.uuid || item._id,
          label: item['@self']?.name || item.name || item.title || item.naam || item.titel || item['@self']?.id || item.id || 'Unnamed',
          data: item // Store full object for reference
        }));

        setOptionsProviders(prev => ({
          ...prev,
          [fieldPath]: options
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
      }
    } catch (error) {
      console.error(`Failed to fetch options for ${fieldPath}:`, error);
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
  }, [fetchOptionsForField, loadingStates, searchQueries]);

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
      }
      
      refFields.forEach(({ path, refSchemaSlug }) => {
        fetchOptionsForField(path, refSchemaSlug);
      });
      
      // Mark as initialized after starting the fetches
      hasInitializedRef.current = true;
    }
  }, [schema?.properties, currentRegister, object, findRefFields, fetchOptionsForField]);

  // Reset the guard when schema changes (similar to modal pattern)
  useEffect(() => {
    hasInitializedRef.current = false;
    // Reset initialization guard for schema change
  }, [schema?.title, schema?.version, currentRegister]);

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
    };
  }, [searchQueries]);

  return {
    optionsProviders,
    loadingStates,
    disabledStates,
    searchQueries,
    handleSearch,
    fetchOptionsForField
  };
};
