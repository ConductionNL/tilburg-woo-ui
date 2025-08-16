/**
 * Authentication-based filtering utilities for content, forms, and entities
 * 
 * These utilities provide consistent filtering logic across all content types
 * based on authentication state and visibility properties.
 */

/**
 * Determines if content should be visible based on authentication state
 * @param {Object} item - The content item to check
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @returns {boolean} - Whether the item should be visible
 */
export const shouldShowContent = (item, userIsAuthenticated) => {
  if (!item) return false;
  
  // Check visibility properties
  const hideBeforeLogin = item.hideBeforeLogin === true;
  const hideAfterLogin = item.hideAfterLogin === true;
  
  if (userIsAuthenticated) {
    // User is logged in - don't show if hideAfterLogin is true
    return !hideAfterLogin;
  } else {
    // User is not logged in - don't show if hideBeforeLogin is true
    return !hideBeforeLogin;
  }
};

/**
 * Filters an array of content items based on authentication state
 * @param {Array} items - Array of content items to filter
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @returns {Array} - Filtered array of items
 */
export const filterContentItems = (items, userIsAuthenticated) => {
  if (!Array.isArray(items)) return items;
  
  return items.filter(item => shouldShowContent(item, userIsAuthenticated));
};

/**
 * Determines if a form field should be visible based on authentication state
 * @param {Object} fieldConfig - The field configuration
 * @param {Object} formData - Current form data
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @param {Object} context - Additional context (includes authentication info)
 * @returns {boolean} - Whether the field should be visible
 */
export const shouldShowFormField = (fieldConfig, formData, userIsAuthenticated, context = {}) => {
  // First check existing visibility function/boolean
  if (typeof fieldConfig.visible === 'function') {
    const functionResult = fieldConfig.visible(formData, { ...context, userIsAuthenticated });
    if (functionResult === false) return false;
  } else if (fieldConfig.visible === false) {
    return false;
  }
  
  // Then check authentication-based visibility
  return shouldShowContent(fieldConfig, userIsAuthenticated);
};

/**
 * Filters form field configurations based on authentication state
 * @param {Object} fieldConfigs - Object containing field configurations
 * @param {Object} formData - Current form data
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @param {Object} context - Additional context
 * @returns {Object} - Filtered field configurations
 */
export const filterFormFieldConfigs = (fieldConfigs, formData, userIsAuthenticated, context = {}) => {
  if (!fieldConfigs || typeof fieldConfigs !== 'object') return fieldConfigs;
  
  const filteredConfigs = {};
  
  Object.keys(fieldConfigs).forEach(fieldName => {
    const fieldConfig = fieldConfigs[fieldName];
    if (shouldShowFormField(fieldConfig, formData, userIsAuthenticated, context)) {
      filteredConfigs[fieldName] = fieldConfig;
    }
  });
  
  return filteredConfigs;
};

/**
 * Determines if a section/block should be visible based on authentication state
 * @param {Object} section - The section/block to check
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @returns {boolean} - Whether the section should be visible
 */
export const shouldShowSection = (section, userIsAuthenticated) => {
  if (!section) return false;
  
  // Check section-level visibility
  if (!shouldShowContent(section, userIsAuthenticated)) {
    return false;
  }
  
  // Check section data visibility if it exists
  if (section.data && !shouldShowContent(section.data, userIsAuthenticated)) {
    return false;
  }
  
  return true;
};

/**
 * Filters page sections based on authentication state
 * @param {Array} sections - Array of page sections
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @returns {Array} - Filtered sections
 */
export const filterPageSections = (sections, userIsAuthenticated) => {
  if (!Array.isArray(sections)) return sections;
  
  return sections.filter(section => shouldShowSection(section, userIsAuthenticated));
};

/**
 * Determines if a publication/entity property should be visible based on authentication state
 * @param {Object} property - The property configuration
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @returns {boolean} - Whether the property should be visible
 */
export const shouldShowProperty = (property, userIsAuthenticated) => {
  if (!property) return true; // Default to visible if no property config
  
  // Check if property has authentication-based visibility rules
  return shouldShowContent(property, userIsAuthenticated);
};

/**
 * Filters publication/entity data properties based on authentication state
 * @param {Object} data - The data object containing properties
 * @param {Object} schema - The schema defining property configurations
 * @param {boolean} userIsAuthenticated - Whether the user is authenticated
 * @returns {Object} - Filtered data object
 */
export const filterEntityData = (data, schema, userIsAuthenticated) => {
  if (!data || !schema) return data;
  
  const filteredData = { ...data };
  const properties = schema.properties || {};
  
  // Filter properties based on authentication state
  Object.keys(properties).forEach(propertyName => {
    const property = properties[propertyName];
    if (!shouldShowProperty(property, userIsAuthenticated)) {
      delete filteredData[propertyName];
    }
  });
  
  return filteredData;
};

export default {
  shouldShowContent,
  filterContentItems,
  shouldShowFormField,
  filterFormFieldConfigs,
  shouldShowSection,
  filterPageSections,
  shouldShowProperty,
  filterEntityData
};
