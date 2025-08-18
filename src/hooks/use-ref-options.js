import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching options for $ref-based form fields
 * 
 * @param {Object} store - The MobX store object containing object store
 * @param {string} currentRegister - The current register slug
 * @param {Object} schema - The form schema object
 * @param {Object} fieldConfigs - Field configurations
 * @returns {Object} - Object containing optionsProviders, loadingStates, and fetchOptions function
 */
export const useRefOptions = (store, currentRegister, schema, fieldConfigs = {}) => {
  const [optionsProviders, setOptionsProviders] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  const [disabledStates, setDisabledStates] = useState({});

  const { object } = store;

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

    try {
      setLoadingStates(prev => ({ ...prev, [fieldPath]: true }));

      // Use the object store's fetchCollection method to get the objects
      await object.fetchCollection(currentRegister, refSchemaSlug, {
        _search: searchQuery || undefined,
        _limit: 50,
      });
      
      // Get the data from the store after fetching
      const collectionType = `${currentRegister}_${refSchemaSlug}`;
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
  }, [currentRegister, object]);

  /**
   * Handles search input for a specific field
   */
  const handleSearch = useCallback((fieldPath, refSchemaSlug, searchQuery) => {
    setSearchQueries(prev => ({ ...prev, [fieldPath]: searchQuery }));
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      fetchOptionsForField(fieldPath, refSchemaSlug, searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchOptionsForField]);

  /**
   * Initial fetch of options for all $ref fields
   */
  useEffect(() => {
    if (!schema?.properties || !currentRegister || !object) return;

    const refFields = findRefFields(schema.properties);
    
    refFields.forEach(({ path, refSchemaSlug }) => {
      fetchOptionsForField(path, refSchemaSlug);
    });
  }, [schema, currentRegister, object, findRefFields, fetchOptionsForField]);

  return {
    optionsProviders,
    loadingStates,
    disabledStates,
    searchQueries,
    handleSearch,
    fetchOptionsForField
  };
};
