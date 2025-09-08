/**
 * Utility functions for detecting and resolving object references to names
 * 
 * This system automatically detects when properties contain UUIDs that should be
 * displayed as names instead of raw UUIDs for better user experience.
 */

/**
 * Checks if a property value looks like a UUID
 * @param {any} value - The value to check
 * @returns {boolean} True if value appears to be a UUID
 */
export const isUUID = (value) => {
  if (typeof value !== 'string') return false;
  
  // UUID v4 pattern: 8-4-4-4-12 hexadecimal digits
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
};

/**
 * Checks if a property should be resolved to a name based on schema and value
 * @param {Object} property - Schema property definition
 * @param {any} value - The actual value
 * @returns {boolean} True if this property should be resolved to a name
 */
export const shouldResolveToName = (property, value) => {
  if (!property || !value) return false;
  
  // If schema says it's an object but value is a string UUID, it's a reference
  if (property.type === 'object' && typeof value === 'string' && isUUID(value)) {
    return true;
  }
  
  // If property has $ref (JSON Schema reference), it's likely an object reference
  if (property.$ref && typeof value === 'string' && isUUID(value)) {
    return true;
  }
  
  // If property format is uuid and it's a string UUID
  if (property.format === 'uuid' && typeof value === 'string' && isUUID(value)) {
    return true;
  }
  
  // Check for common reference field naming patterns
  const propertyKey = property.key || '';
  const isReferenceField = propertyKey.endsWith('Id') || 
                          propertyKey.endsWith('Ref') || 
                          propertyKey.includes('organisatie') ||
                          propertyKey.includes('schema') ||
                          propertyKey.includes('register');
                          
  if (isReferenceField && typeof value === 'string' && isUUID(value)) {
    return true;
  }
  
  return false;
};

/**
 * Extracts all reference IDs from an object that should be resolved to names
 * @param {Object} obj - The object to scan for reference IDs
 * @param {Object} schema - The schema definition for the object
 * @returns {string[]} Array of UUIDs that should be resolved to names
 */
export const extractReferenceIds = (obj, schema) => {
  if (!obj || !schema?.properties) return [];
  
  const referenceIds = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const property = schema.properties[key];
    if (property && shouldResolveToName(property, value)) {
      referenceIds.push(value);
    }
  });
  
  return referenceIds;
};

/**
 * Extracts reference IDs from a collection of objects
 * @param {Object[]} objects - Array of objects to scan
 * @param {Object} schema - The schema definition for the objects
 * @returns {string[]} Array of unique UUIDs that should be resolved to names
 */
export const extractReferenceIdsFromCollection = (objects, schema) => {
  if (!Array.isArray(objects) || !schema) return [];
  
  const allIds = [];
  
  objects.forEach(obj => {
    const ids = extractReferenceIds(obj, schema);
    allIds.push(...ids);
  });
  
  // Return unique IDs only
  return [...new Set(allIds)];
};

/**
 * Resolves object properties to names using the provided name mappings
 * @param {Object} obj - The object to process
 * @param {Object} schema - The schema definition
 * @param {{[id: string]: string}} nameMap - Map of ID to name
 * @returns {Object} New object with reference IDs replaced by names
 */
export const resolveObjectReferencesToNames = (obj, schema, nameMap = {}) => {
  if (!obj || !schema?.properties || !nameMap) return obj;
  
  const resolved = { ...obj };
  
  Object.entries(obj).forEach(([key, value]) => {
    const property = schema.properties[key];
    if (property && shouldResolveToName(property, value) && nameMap[value]) {
      resolved[key] = nameMap[value];
      // Optionally keep the original ID in a separate field
      resolved[`${key}_original`] = value;
    }
  });
  
  return resolved;
};

/**
 * Resolves a collection of objects, replacing reference IDs with names
 * @param {Object[]} objects - Array of objects to process
 * @param {Object} schema - The schema definition
 * @param {{[id: string]: string}} nameMap - Map of ID to name
 * @returns {Object[]} Array of objects with references resolved to names
 */
export const resolveCollectionReferencesToNames = (objects, schema, nameMap = {}) => {
  if (!Array.isArray(objects) || !schema || !nameMap) return objects;
  
  return objects.map(obj => resolveObjectReferencesToNames(obj, schema, nameMap));
};

/**
 * Gets display value for a property, resolving to name if it's a reference
 * @param {any} value - The property value
 * @param {Object} property - Schema property definition
 * @param {{[id: string]: string}} nameMap - Map of ID to name
 * @returns {any} Display value (name if reference, original value otherwise)
 */
export const getDisplayValue = (value, property, nameMap = {}) => {
  if (shouldResolveToName(property, value) && nameMap[value]) {
    return nameMap[value];
  }
  return value;
};

/**
 * Creates a helper object for easy reference resolution
 * @param {Object} objectStore - Reference to the ObjectStore instance
 * @returns {Object} Helper object with resolution methods
 */
export const createReferenceResolver = (objectStore) => {
  return {
    /**
     * Resolves a single ID to a name
     * @param {string} id - The ID to resolve
     * @returns {Promise<string>} The resolved name
     */
    async resolveSingle(id) {
      return await objectStore.getNamesForSingleId(id);
    },
    
    /**
     * Resolves multiple IDs to names
     * @param {string[]} ids - Array of IDs to resolve
     * @returns {Promise<{[id: string]: string}>} Map of ID to name
     */
    async resolveMultiple(ids) {
      return await objectStore.getNamesForMultipleIds(ids);
    },
    
    /**
     * Processes a collection and resolves all reference IDs
     * @param {Object[]} objects - Array of objects
     * @param {Object} schema - Schema definition
     * @returns {Promise<Object[]>} Array of objects with references resolved
     */
    async processCollection(objects, schema) {
      const referenceIds = extractReferenceIdsFromCollection(objects, schema);
      if (referenceIds.length === 0) return objects;
      
      const nameMap = await this.resolveMultiple(referenceIds);
      return resolveCollectionReferencesToNames(objects, schema, nameMap);
    },
    
    /**
     * Processes a single object and resolves reference IDs  
     * @param {Object} obj - The object to process
     * @param {Object} schema - Schema definition
     * @returns {Promise<Object>} Object with references resolved
     */
    async processObject(obj, schema) {
      const referenceIds = extractReferenceIds(obj, schema);
      if (referenceIds.length === 0) return obj;
      
      const nameMap = await this.resolveMultiple(referenceIds);
      return resolveObjectReferencesToNames(obj, schema, nameMap);
    }
  };
};
