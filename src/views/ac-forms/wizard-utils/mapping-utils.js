/**
 * Mapping Utilities for Form Options
 *
 * Provides standardized functions for mapping API objects to select option format
 * used across ac-forms components.
 */

/**
 * Generic mapping function to convert API objects to select options format
 * @param {Object} item - The API object to map
 * @param {number} index - Index of the item (for fallback labels)
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.labelFields - Array of field paths to try for label (in order)
 * @param {Array<string>} options.valueFields - Array of field paths to try for value (in order)
 * @param {string} options.dataField - Field name to store full data (default: 'data')
 * @param {string} options.type - Optional type to include in result
 * @param {string} options.fallbackLabel - Fallback label template (default: 'Item {index}')
 * @returns {Object} Option object with { value, label, data, type? }
 */
export const mapToOption = (item, index = 0, options = {}) => {
  const {
    labelFields = ['naam', '@self.name', 'name', 'title', 'label'],
    valueFields = ['value', 'id', 'slug'],
    dataField = 'data',
    type,
    fallbackLabel = `Item ${index + 1}`,
  } = options;

  // Extract label
  let label = null;
  for (const field of labelFields) {
    if (field.includes('.')) {
      // Handle nested paths like '@self.name' or 'xml.name._value'
      const parts = field.split('.');
      let value = item;
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      if (value !== undefined && value !== null) {
        label = String(value);
        break;
      }
    } else {
      if (item?.[field] !== undefined && item?.[field] !== null) {
        label = String(item[field]);
        break;
      }
    }
  }

  // Fallback to ID-based label if no label found
  if (!label && item?.id) {
    label = String(item.id);
  }

  // Final fallback
  if (!label) {
    label = fallbackLabel.replace('{index}', index + 1);
  }

  // Extract value
  let value = null;
  for (const field of valueFields) {
    if (field.includes('.')) {
      const parts = field.split('.');
      let fieldValue = item;
      for (const part of parts) {
        if (fieldValue && typeof fieldValue === 'object') {
          fieldValue = fieldValue[part];
        } else {
          fieldValue = undefined;
          break;
        }
      }
      if (fieldValue !== undefined && fieldValue !== null) {
        value = String(fieldValue);
        break;
      }
    } else {
      if (item?.[field] !== undefined && item?.[field] !== null) {
        value = String(item[field]);
        break;
      }
    }
  }

  // Fallback value to label if no value found
  if (!value) {
    value = label;
  }

  const result = {
    value: String(value),
    label: String(label),
    [dataField]: item,
  };

  if (type) {
    result.type = type;
  }

  return result;
};

/**
 * Creates a module-specific mapper function
 * @param {Object} options - Configuration options (same as mapToOption)
 * @returns {Function} Mapper function for modules/applicaties
 */
export const createModuleMapper = (options = {}) => {
  return (item, index) => {
    return mapToOption(item, index, {
      labelFields: ['naam', '@self.name', 'name', 'title', 'label'],
      valueFields: ['value', 'id', 'slug'],
      fallbackLabel: `Applicatie ${index + 1}`,
      ...options,
    });
  };
};

/**
 * Creates an organisatie-specific mapper function
 * @param {Object} options - Configuration options (same as mapToOption)
 * @returns {Function} Mapper function for organisaties
 */
export const createOrganisatieMapper = (options = {}) => {
  return (item, index) => {
    return mapToOption(item, index, {
      labelFields: ['@self.name', 'naam', 'name', 'title', 'label'],
      valueFields: ['@self.id', 'id', 'slug'],
      fallbackLabel: `Organisatie ${index + 1}`,
      ...options,
    });
  };
};

/**
 * Creates a referentiecomponent-specific mapper function
 * @param {Object} options - Configuration options (same as mapToOption)
 * @returns {Function} Mapper function for referentiecomponenten
 */
export const createReferentieComponentMapper = (options = {}) => {
  return (item, index) => {
    return mapToOption(item, index, {
      labelFields: [
        '@self.name',
        'xml.name._value',
        'naam',
        'name',
        'title',
        'label',
      ],
      valueFields: ['value', 'id', 'slug'],
      fallbackLabel: `Component ${index + 1}`,
      ...options,
    });
  };
};

/**
 * Filters options to ensure they have valid label and value
 * @param {Array<Object>} options - Array of option objects
 * @returns {Array<Object>} Filtered options
 */
export const filterValidOptions = (options) => {
  return options.filter((o) => o && o.label && o.value);
};
