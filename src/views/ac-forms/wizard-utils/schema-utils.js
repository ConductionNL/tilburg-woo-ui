/**
 * Schema Utilities for Forms
 *
 * Provides hooks and utilities for fetching schemas and applying schema-based defaults.
 */

import { useEffect, useState } from 'react';
import { useLoadingState } from './loading-utils';

/**
 * Fetches multiple schemas using the object store
 * @param {Object} store - The MobX store instance
 * @param {Array<string>|Object} schemaTypes - Array of schema type names, or object with schema types as keys
 * @returns {Promise<Object>} Object with schemas keyed by type
 */
export const fetchSchemas = async (store, schemaTypes) => {
  const fetchedSchemas = {};
  const typesArray = Array.isArray(schemaTypes)
    ? schemaTypes
    : Object.keys(schemaTypes);

  const schemaPromises = typesArray.map(async (schemaType) => {
    try {
      await store.object.fetchSchema(schemaType);
      const schema = store.object.getSchema(`schema_${schemaType}`);
      return { schemaType, schema };
    } catch (error) {
      console.error(`Failed to fetch schema for ${schemaType}:`, error);
      return { schemaType, schema: null };
    }
  });

  const results = await Promise.all(schemaPromises);
  results.forEach(({ schemaType, schema }) => {
    fetchedSchemas[schemaType] = schema;
  });

  return fetchedSchemas;
};

/**
 * Custom hook for fetching schemas
 * @param {Object} store - The MobX store instance
 * @param {Array<string>|Object} schemaTypes - Array of schema type names, or object with schema types as keys
 * @param {Object} options - Configuration options
 * @param {Function} options.onSchemasLoaded - Callback when schemas are loaded
 * @param {Array} options.dependencies - Dependencies for useEffect (default: [store])
 * @returns {Object} Object with schemas, loading state, and error
 */
export const useSchemaFetcher = (store, schemaTypes, options = {}) => {
  const { onSchemasLoaded, dependencies = [store] } = options;
  const { loading, setLoading } = useLoadingState(true);
  const [schemas, setSchemas] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchemasData = async () => {
      if (!store?.object) {
        setError('Store or object store not available');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedSchemas = await fetchSchemas(store, schemaTypes);
        setSchemas(fetchedSchemas);

        if (onSchemasLoaded) {
          onSchemasLoaded(fetchedSchemas);
        }
      } catch (err) {
        console.error('Failed to fetch schemas:', err);
        setError(err);
        setSchemas({});
      } finally {
        setLoading(false);
      }
    };

    fetchSchemasData();
  }, dependencies);

  return {
    schemas,
    loading,
    error,
  };
};

/**
 * Applies schema-based defaults to an object if it's empty
 * @param {Object} store - The MobX store instance
 * @param {Object} currentObject - Current object state
 * @param {Object} schema - Schema to use for defaults
 * @param {Function} isEmptyCheck - Function to check if object is empty
 * @param {Object} overrides - Additional overrides to apply
 * @returns {Object} Updated object with defaults, or original if not empty
 */
export const applySchemaDefaults = (
  store,
  currentObject,
  schema,
  isEmptyCheck,
  overrides = {}
) => {
  if (!schema || !isEmptyCheck(currentObject)) {
    return currentObject;
  }

  const defaultObject = store.object.createDefaultObjectFromSchema(schema);
  return { ...defaultObject, ...overrides };
};

/**
 * Creates a function to check if an object is empty based on specified fields
 * @param {Array<string>} fields - Array of field names to check
 * @returns {Function} Function that checks if object is empty
 */
export const createIsEmptyCheck = (fields) => {
  return (obj) => {
    return fields.every((field) => {
      const value = obj?.[field];
      return value === undefined || value === null || value === '';
    });
  };
};
