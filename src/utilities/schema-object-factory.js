/**
 * Schema Object Factory Utilities
 * 
 * Provides utility functions for creating default objects based on JSON schemas.
 * These utilities work with the ObjectStore's schema-based object creation methods
 * and provide convenient wrappers for common patterns in ac-forms components.
 */

/**
 * Creates form state structure for wizard-based forms using multiple schemas
 * @param {Object} store - The MobX store instance containing object.createDefaultObjectFromSchema
 * @param {Object} schemas - Object containing schema definitions keyed by type
 * @param {Object} options - Configuration options
 * @param {Object} options.overrides - Default value overrides per schema type
 * @param {Array<string>} options.requiredSchemas - Schema types that must be present
 * @param {boolean} options.strict - Whether to throw error if required schemas are missing
 * @returns {Object} Object containing default form state objects
 * 
 * @example
 * const formState = createWizardFormState(store, schemas, {
 *   overrides: {
 *     product: { naam: 'Default Product Name' },
 *     organisatie: { type: 'gemeente' }
 *   },
 *   requiredSchemas: ['product', 'organisatie'],
 *   strict: true
 * });
 * // Result: { product: {...}, organisatie: {...}, module: {...} }
 */
export const createWizardFormState = (store, schemas, options = {}) => {
  const {
    overrides = {},
    requiredSchemas = [],
    strict = false
  } = options;

  // Check for required schemas if strict mode is enabled
  if (strict) {
    const missingSchemas = requiredSchemas.filter(schemaType => !schemas[schemaType]);
    if (missingSchemas.length > 0) {
      throw new Error(`Required schemas missing: ${missingSchemas.join(', ')}`);
    }
  }

  // Create default objects using ObjectStore method
  return store.object.createDefaultObjectsFromSchemas(schemas, overrides);
};

/**
 * Creates a single default object with common ac-forms patterns
 * @param {Object} store - The MobX store instance
 * @param {Object} schema - The schema definition
 * @param {string} schemaType - The type of schema (for logging/debugging)
 * @param {Object} overrides - Property overrides
 * @returns {Object} Default object with ac-forms compatibility
 * 
 * @example
 * const defaultProduct = createDefaultFormObject(store, productSchema, 'product', {
 *   applicaties: {}, // Legacy compatibility
 *   status: 'draft'
 * });
 */
export const createDefaultFormObject = (store, schema, schemaType = 'unknown', overrides = {}) => {
  if (!schema) {
    console.warn(`createDefaultFormObject: No schema provided for type '${schemaType}'`);
    return { ...overrides };
  }

  return store.object.createDefaultObjectFromSchema(schema, overrides);
};

/**
 * Creates nested object structure for complex form wizards
 * @param {Object} store - The MobX store instance
 * @param {Object} config - Configuration object
 * @param {Object} config.schemas - Schema definitions
 * @param {Object} config.structure - Nested structure definition
 * @param {Object} config.defaults - Default values per object type
 * @returns {Object} Nested object structure
 * 
 * @example
 * const wizardState = createNestedFormStructure(store, {
 *   schemas: { product, module, organisatie },
 *   structure: {
 *     product: {
 *       modules: 'array', // Will create array of module objects
 *       aanbieder: 'organisatie' // Will create nested organisatie object
 *     }
 *   },
 *   defaults: {
 *     product: { status: 'concept' },
 *     module: { type: 'application' }
 *   }
 * });
 */
export const createNestedFormStructure = (store, config) => {
  const { schemas, structure, defaults = {} } = config;
  const result = {};

  Object.entries(structure).forEach(([parentType, childConfig]) => {
    const parentSchema = schemas[parentType];
    if (!parentSchema) {
      console.warn(`createNestedFormStructure: Schema for '${parentType}' not found`);
      return;
    }

    // Create parent object
    result[parentType] = store.object.createDefaultObjectFromSchema(
      parentSchema, 
      defaults[parentType] || {}
    );

    // Handle nested structures
    if (typeof childConfig === 'object') {
      Object.entries(childConfig).forEach(([childProperty, childType]) => {
        const childSchema = schemas[childType];
        if (!childSchema) {
          console.warn(`createNestedFormStructure: Schema for '${childType}' not found`);
          return;
        }

        if (childType === 'array') {
          result[parentType][childProperty] = [];
        } else {
          result[parentType][childProperty] = store.object.createDefaultObjectFromSchema(
            childSchema,
            defaults[childType] || {}
          );
        }
      });
    }
  });

  return result;
};

/**
 * Validates that all required schemas are available before form initialization
 * @param {Object} schemas - Available schemas
 * @param {Array<string>} requiredSchemas - Required schema types
 * @param {string} formName - Name of the form (for error messages)
 * @returns {boolean} True if all required schemas are available
 * @throws {Error} If required schemas are missing and strict validation is enabled
 */
export const validateRequiredSchemas = (schemas, requiredSchemas, formName = 'form') => {
  const missingSchemas = requiredSchemas.filter(schemaType => !schemas[schemaType]);
  
  if (missingSchemas.length > 0) {
    const errorMessage = `${formName}: Required schemas missing: ${missingSchemas.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return true;
};

/**
 * Creates application/module structure specifically for product wizards
 * @param {Object} store - The MobX store instance
 * @param {Object} moduleSchema - Module/application schema
 * @param {Object} options - Configuration options
 * @param {number} options.count - Number of default applications to create
 * @param {Object} options.defaults - Default values for applications
 * @returns {Object} Structure with applicaties property containing default applications
 * 
 * @example
 * const appStructure = createApplicationStructure(store, moduleSchema, {
 *   count: 1,
 *   defaults: {
 *     licentieType: '',
 *     licentie: '',
 *     hostingLocatie: '',
 *     hostingJurisdictie: ''
 *   }
 * });
 * // Result: { applicaties: { 0: { naam: '', beschrijving: '', ... } } }
 */
export const createApplicationStructure = (store, moduleSchema, options = {}) => {
  const { count = 1, defaults = {} } = options;
  const applicaties = {};

  for (let i = 0; i < count; i++) {
    applicaties[i] = store.object.createDefaultObjectFromSchema(moduleSchema, {
      ...defaults,
      // Add application-specific defaults
      licentieType: '',
      licentie: '',
      hostingLocatie: '',
      hostingJurisdictie: '',
      standaarden: [],
      referentieComponenten: [],
      koppelingen: [],
      isExisting: false, // Flag to distinguish new vs existing applications
    });
  }

  return { applicaties };
};

export default {
  createWizardFormState,
  createDefaultFormObject,
  createNestedFormStructure,
  validateRequiredSchemas,
  createApplicationStructure,
};
