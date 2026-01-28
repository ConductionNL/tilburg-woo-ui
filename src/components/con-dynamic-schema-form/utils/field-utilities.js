/**
 * Reusable field utilities extracted from ConDynamicSchemaForm
 * These utilities can be used by standalone schema-enhanced fields
 */

import { shouldShowFormField } from '@src/utilities/con-authentication-filters';
import { getFieldAuthorizationState } from '@utils/field-authorization';
import { validateArray, validateNumber, validateString } from './validation';

/**
 * Extracts the schema slug from a $ref value
 * @param {string} ref - The $ref value like "#/components/schemas/voorzieningmodule"
 * @returns {string} - The schema slug like "voorzieningmodule"
 */
export const extractSchemaSlugFromRef = (ref) => {
  if (!ref || typeof ref !== 'string') return null;
  const parts = ref.split('/');
  return parts[parts.length - 1]; // Get the last part
};

/**
 * Safely retrieves a nested value from an object using dot notation path.
 */
export const getNestedValue = (path, data) => {
  return path.split('.').reduce((obj, key) => obj?.[key], data);
};

/**
 * Sets a nested value in an object using dot notation path, creating intermediate objects as needed.
 */
export const setNestedValue = (path, data, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => {
    if (!obj[key]) obj[key] = {};
    return obj[key];
  }, data);
  target[lastKey] = value;
  return data;
};

/**
 * Determines if a field needs search functionality based on its schema
 * @param {Object} propertySchema - The field's schema definition
 * @returns {string|null} - The referenced schema slug if searchable, null otherwise
 */
export const getFieldRefSchemaSlug = (propertySchema) => {
  if (propertySchema.$ref) {
    const refMatch = propertySchema.$ref.match(/\/schemas\/([^/]+)$/);
    return refMatch?.[1] || null;
  }

  if (propertySchema?.type === 'array' && propertySchema.items?.$ref) {
    const refMatch = propertySchema.items.$ref.match(/\/schemas\/([^/]+)$/);
    return refMatch?.[1] || null;
  }

  return null;
};

/**
 * Generates field configuration for a property based on its schema and custom overrides.
 * @param {string} propertyPath - Dot notation path of the property
 * @param {object} propertySchema - The property's schema definition
 * @param {boolean} isRequired - Whether the field is required
 * @param {object} fieldConfigs - Custom field configurations
 * @param {object} optionsProviders - Options providers for select fields
 * @returns {object} Field configuration with type, component, label, placeholder, etc.
 */
export const getFieldConfig = (
  propertyPath,
  propertySchema,
  isRequired,
  fieldConfigs = {},
  optionsProviders = {}
) => {
  const baseConfig = {
    label:
      propertySchema?.title ||
      propertyPath.split('.').pop().charAt(0).toUpperCase() +
        propertyPath.split('.').pop().slice(1),
    required: isRequired,
    visible: propertySchema?.visible !== false,
    description: propertySchema?.description,
    placeholder: propertySchema?.example || undefined,
  };

  // Handle different field types based on schema
  let schemaConfig = baseConfig;

  if (propertySchema?.type === 'array') {
    const arrayItemsRefSchemaSlug = propertySchema.items?.$ref
      ? extractSchemaSlugFromRef(propertySchema.items.$ref)
      : undefined;

    schemaConfig = {
      ...baseConfig,
      type: 'multiSelect',
      component: 'ReactSelect',
      isMulti: true,
      closeMenuOnSelect: false,
      placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
      ...(arrayItemsRefSchemaSlug && {
        refSchemaSlug: arrayItemsRefSchemaSlug,
        isSearchable: true,
      }),
    };
  } else if (propertySchema?.enum) {
    schemaConfig = {
      ...baseConfig,
      type: 'select',
      component: 'ReactSelect',
      options: propertySchema.enum.map((option) => ({
        value: option,
        label: option,
      })),
      placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
    };
  } else if (propertySchema?.$ref) {
    // Handle object references with $ref
    const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.$ref);
    schemaConfig = {
      ...baseConfig,
      type: 'select',
      component: 'ReactSelect',
      placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
      refSchemaSlug, // Store for options fetching
      isSearchable: true, // Enable search if more than 20 results
    };
  } else if (
    propertySchema?.type === 'string' &&
    optionsProviders[propertyPath]?.length > 0
  ) {
    schemaConfig = {
      ...baseConfig,
      type: 'select',
      component: 'ReactSelect',
      placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
    };
  } else if (propertySchema?.type === 'boolean') {
    schemaConfig = {
      ...baseConfig,
      type: 'boolean',
      component: 'Boolean',
    };
  } else if (
    propertySchema?.type === 'number' ||
    propertySchema?.type === 'integer'
  ) {
    schemaConfig = {
      ...baseConfig,
      type: 'number',
      component: 'Number',
      integer: propertySchema?.type === 'integer',
    };
  } else if (propertySchema?.type === 'object' && !propertySchema?.properties) {
    // Object without properties: JSON textarea
    schemaConfig = {
      ...baseConfig,
      type: 'json',
      component: 'JsonObject',
    };
  } else if (propertySchema?.type === 'string') {
    // Supported string formats only
    const format = propertySchema.format;

    // Color formats -> custom ColorField
    const colorFormats = [
      'color',
      'color-hex',
      'color-hex-alpha',
      'color-rgb',
      'color-rgba',
      'color-hsl',
      'color-hsla',
    ];

    if (format === 'text') {
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'AcTextarea',
      };
    } else if (format === 'date' || format === 'date-time' || format === 'time') {
      schemaConfig = {
        ...baseConfig,
        type: 'date',
        component: 'AcFormField',
        inputType:
          format === 'date-time'
            ? 'datetime-local'
            : format === 'time'
            ? 'time'
            : 'date',
      };
    } else if (format === 'markdown' || format === 'html') {
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'WysiwygMarkdown',
        isMarkdown: format === 'markdown',
      };
    } else if (format === 'base64' || format === 'binary' || format === 'byte') {
      // File upload fields with base64 encoding
      schemaConfig = {
        ...baseConfig,
        type: 'file',
        component: 'File',
        inputType: 'file',
        format: format,
      };
    } else if (['email', 'idn-email'].includes(format)) {
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'AcFormField',
        inputType: 'email',
      };
    } else if (
      ['url', 'uri', 'uri-reference', 'iri', 'iri-reference'].includes(format)
    ) {
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'AcFormField',
        inputType: 'url',
      };
    } else if (colorFormats.includes(format)) {
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'Color',
        colorFormat: format,
      };
    } else if (
      [
        'duration',
        'hostname',
        'idn-hostname',
        'ipv4',
        'ipv6',
        'uuid',
        'uri-template',
        'json-pointer',
        'relative-json-pointer',
        'regex',
      ].includes(format)
    ) {
      // No special widget: keep as simple text input
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'AcFormField',
      };
    } else {
      // Unknown or no format -> plain text
      schemaConfig = {
        ...baseConfig,
        type: 'text',
        component: 'AcFormField',
      };
    }
  } else {
    schemaConfig = {
      ...baseConfig,
      type: 'text',
      component: 'AcFormField',
    };
  }

  // Merge custom field config with schema config
  let finalConfig = schemaConfig;
  if (fieldConfigs[propertyPath]) {
    finalConfig = {
      ...schemaConfig,
      ...fieldConfigs[propertyPath],
    };
  }

  // Handle custom format overrides that might trigger file uploads
  if (finalConfig?.format === 'base64' || finalConfig?.inputType === 'file') {
    finalConfig.type = 'file';
    finalConfig.component = 'File';
    finalConfig.inputType = 'file';
    finalConfig.format = finalConfig.format || 'base64';
  }

  return finalConfig;
};

/**
 * Determines if a field should be visible based on its configuration
 */
export const getFieldVisibility = (
  propertyPath,
  fieldConfig,
  propertySchema,
  formData,
  userIsAuthenticated,
  context,
  user,
  isCreateMode
) => {
  // Apply hideOnForm unless config explicitly forces show
  if (propertySchema?.hideOnForm === true) {
    return false;
  }

  // Then check traditional visibility rules
  const isVisibleByConfig = shouldShowFormField(
    fieldConfig,
    formData,
    userIsAuthenticated,
    context
  );
  if (!isVisibleByConfig) {
    return false;
  }

  // Then check field-level authorization if user object is available
  if (user && propertySchema) {
    const authState = getFieldAuthorizationState(user, propertySchema, isCreateMode);

    return authState.visible;
  }

  // Fallback to traditional visibility if no user object or schema
  return isVisibleByConfig;
};

/**
 * Gets the options array for select/multi-select fields
 *
 * Priority Order:
 * 1. Schema enum (highest priority) - Always use if available
 * 2. Apply enumFilter to schema enum if configured
 * 3. Custom optionsProviders only if NO schema enum exists
 *
 * Enum Filtering (only works when schema has enum):
 * - Include mode: { enumFilter: 'include', values: ['value1', 'value2'] } - Only show these enum values
 * - Exclude mode: { enumFilter: 'exclude', values: ['value1', 'value2'] } - Hide these enum values
 * - Values can be an array or a function that returns an array: values: (formData, context) => [...]
 */
export const getFieldOptions = (
  propertyPath,
  propertySchema,
  optionsProviders = {},
  formData = {},
  context = {}
) => {
  // Priority 1: Check if we have enum options from schema (ALWAYS FIRST)
  let baseEnumOptions = null;
  if (propertySchema?.enum) {
    baseEnumOptions = propertySchema.enum.map((option) => ({
      value: option,
      label: option,
    }));
  } else if (propertySchema?.type === 'array' && propertySchema?.items?.enum) {
    baseEnumOptions = propertySchema.items.enum.map((option) => ({
      value: option,
      label: option,
    }));
  }

  // If we have enum from schema, optionally apply filter
  if (baseEnumOptions) {
    const optionConfig = optionsProviders[propertyPath];

    // Check if there's an enum filter configuration
    if (optionConfig?.enumFilter) {
      // Support both static arrays and dynamic functions for filter values
      let filterValues = optionConfig.values || [];
      if (typeof filterValues === 'function') {
        filterValues = filterValues(formData, context);
      }

      // If filterValues is null or undefined, show all enum values (no filter)
      if (filterValues === null || filterValues === undefined) {
        return baseEnumOptions;
      }

      if (optionConfig.enumFilter === 'include') {
        // Include mode: Only show enum options that are in the filter values
        return baseEnumOptions.filter((option) =>
          filterValues.includes(option.value)
        );
      } else if (optionConfig.enumFilter === 'exclude') {
        // Exclude mode: Show all enum options except those in the filter values
        return baseEnumOptions.filter(
          (option) => !filterValues.includes(option.value)
        );
      }
    }

    // No filter configured, return all enum options
    return baseEnumOptions;
  }

  // Priority 2: Only use custom optionsProviders if NO enum exists in schema
  const optionConfig = optionsProviders[propertyPath];
  if (optionConfig) {
    const provided =
      typeof optionConfig === 'function' ? optionConfig(formData) : optionConfig;

    // If it's an array, return it directly
    if (Array.isArray(provided)) {
      return provided;
    }
  }

  // Priority 3: No options available
  return [];
};

/**
 * Gets the disabled state for a specific field
 */
export const getFieldDisabled = (
  propertyPath,
  propertySchema,
  fieldConfig,
  disabledStates = {},
  honorImmutable = false,
  user = null,
  isCreateMode = false,
  formData = {}
) => {
  // Priority 1: Check fieldConfig.disabled first (highest priority)
  if (fieldConfig?.disabled !== undefined) {
    return fieldConfig.disabled;
  }

  // Priority 2: Check if field should be disabled due to immutable property
  if (honorImmutable && propertySchema?.immutable === true) {
    return true;
  }

  // Priority 3: Check field-level authorization if user object is available
  if (user && propertySchema) {
    const authState = getFieldAuthorizationState(user, propertySchema, isCreateMode);
    
    if (!authState.editable) {
      return true;
    }
  }

  // Priority 4: Check custom disabled states
  if (typeof disabledStates[propertyPath] === 'function') {
    return disabledStates[propertyPath](formData);
  }
  return disabledStates[propertyPath] || false;
};

/**
 * Validates a field based on its configuration and current value.
 */
export const getFieldValidation = (
  propertyPath,
  fieldConfig,
  formData = {},
  validationStates = {},
  valueOverride
) => {
  if (validationStates[propertyPath]) {
    return validationStates[propertyPath];
  }

  // Support required as boolean or function(formData)
  let isRequired = fieldConfig.required;
  if (typeof isRequired === 'function') {
    try {
      isRequired = isRequired(formData);
    } catch (_) {
      isRequired = false;
    }
  }
  const value =
    valueOverride !== undefined
      ? valueOverride
      : getNestedValue(propertyPath, formData);

  let errors = [];
  if (isRequired) {
    const normalizedValue = typeof value === 'string' ? value.trim() : value;
    const isEmpty =
      normalizedValue === undefined ||
      normalizedValue === null ||
      (typeof normalizedValue === 'string' && normalizedValue === '') ||
      (Array.isArray(normalizedValue) && normalizedValue.length === 0);
    if (isEmpty) errors.push('Dit veld is verplicht');
  }

  // Type-specific validations
  if (fieldConfig.component === 'Number') {
    errors = errors.concat(validateNumber(value, fieldConfig.schema || {}));
  } else if (fieldConfig.component === 'ReactSelect' && fieldConfig.isMulti) {
    errors = errors.concat(validateArray(value, fieldConfig.schema || {}));
  } else if (
    typeof value === 'string' ||
    fieldConfig.component === 'AcFormField' ||
    fieldConfig.component === 'AcTextarea' ||
    fieldConfig.component === 'WysiwygMarkdown'
  ) {
    // If a custom validator is provided, use its outcome instead of validateString
    const customValidator = fieldConfig.validation?.custom;
    if (typeof customValidator === 'function') {
      try {
        const result = customValidator(value, formData, fieldConfig);
        if (Array.isArray(result)) {
          errors = errors.concat(result);
        } else if (result === false) {
          errors.push(
            fieldConfig.validation?.customErrorMessage || 'Ongeldige waarde'
          );
        } else if (typeof result === 'string') {
          errors.push(result);
        }
        // If result is true/undefined/null, treat as no errors
      } catch (_) {
        errors.push(
          fieldConfig.validation?.customErrorMessage || 'Ongeldige waarde'
        );
      }
    } else {
      errors = errors.concat(
        validateString(
          value,
          fieldConfig.schema || {},
          fieldConfig.validation?.customErrorMessage
        )
      );
    }
  }

  return {
    hasError: errors.length > 0,
    required: isRequired,
    errorMessage: errors[0],
  };
};

/**
 * Handles field value changes for nested properties
 */
export const handleFieldChange =
  (propertyPath, fieldConfig, onFieldChange, formData = {}) =>
  (value) => {
    let processedValue = value;

    // Handle multi-select values
    if (fieldConfig.isMulti && Array.isArray(value)) {
      processedValue = value.map((item) => item.value);
    } else if (fieldConfig.component === 'ReactSelect' && !fieldConfig.isMulti) {
      processedValue = value?.value;
    }

    // For nested properties, we need to handle the update differently
    if (propertyPath.includes('.')) {
      // Extract the top-level property name and the nested path
      const [topLevelProperty, ...nestedPath] = propertyPath.split('.');

      // Get the current value of the top-level property
      const currentTopLevelValue = formData[topLevelProperty] || {};

      // Create a new object with the updated nested value
      const updatedTopLevelValue = { ...currentTopLevelValue };
      let current = updatedTopLevelValue;

      // Navigate to the parent of the target property
      for (let i = 0; i < nestedPath.length - 1; i++) {
        if (!current[nestedPath[i]]) {
          current[nestedPath[i]] = {};
        }
        current = current[nestedPath[i]];
      }

      // Set the final value
      current[nestedPath[nestedPath.length - 1]] = processedValue;

      // Call onFieldChange with the top-level property name and the updated object
      onFieldChange(topLevelProperty, updatedTopLevelValue);
    } else {
      // For non-nested properties, use the original behavior
      onFieldChange(propertyPath, processedValue);
    }
  };

/**
 * Determines the size class for a field based on its type and format
 */
export const getFieldSizeClass = (propertyPath, propertySchema, fieldConfig) => {
  // Check for explicit size configuration first - these ALWAYS take priority
  if (fieldConfig.size === 'full') return 'field-size-full';
  if (fieldConfig.size === 'half') return 'field-size-half';

  // Business rules for automatic sizing based on type/format
  const format = propertySchema.format;
  const component = fieldConfig.component;

  // Markdown fields get special treatment: full width + double height (unless overridden above)
  if (component === 'WysiwygMarkdown' || format === 'markdown') {
    return 'field-size-full field-height-double';
  }

  // File upload fields: half width by default (unless overridden by explicit size above)
  if (
    component === 'File' ||
    fieldConfig.type === 'file' ||
    propertySchema?.type === 'file' ||
    format === 'base64' ||
    format === 'binary' ||
    format === 'byte'
  ) {
    return 'field-size-half';
  }

  // Everything else: half width, normal height
  return 'field-size-half';
};
