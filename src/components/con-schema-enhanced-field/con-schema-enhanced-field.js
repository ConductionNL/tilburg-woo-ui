/**
 * Schema-Enhanced Field Component
 * 
 * A standalone field component that automatically configures itself based on JSON schema properties
 * while maintaining full layout control. This component reuses the field rendering logic from
 * ConDynamicSchemaForm but allows for manual placement and custom styling.
 * 
 * **Key Features:**
 * - Automatic field configuration from JSON schema
 * - Manual component placement with custom layout control
 * - Reuses all field types from ConDynamicSchemaForm
 * - Supports all existing field types (text, select, date, markdown, etc.)
 * - Maintains custom styling and sizing
 * - Search functionality for $ref fields
 * - Validation and authorization support
 * 
 * **Usage Examples:**
 * ```jsx
 * // Simple text field
 * <ConSchemaEnhancedField
 *   schemaType="product"
 *   schemaProperty="naam"
 *   value={product.naam}
 *   onChange={(value) => setProduct({...product, naam: value})}
 *   className="my-custom-class"
 * />
 * 
 * // Select field with search
 * <ConSchemaEnhancedField
 *   schemaType="product"
 *   schemaProperty="aanbieder"
 *   value={product.aanbieder}
 *   onChange={(value) => setProduct({...product, aanbieder: value})}
 *   optionsProvider={aanbiedersOptions}
 *   isLoading={aanbiedersLoading}
 *   onSearch={handleAanbiedersSearch}
 * />
 * 
 * // Override schema defaults
 * <ConSchemaEnhancedField
 *   schemaType="product"
 *   schemaProperty="beschrijving"
 *   value={product.beschrijving}
 *   onChange={(value) => setProduct({...product, beschrijving: value})}
 *   customProps={{
 *     label: "Custom Label",
 *     placeholder: "Custom placeholder",
 *     component: "AcTextarea"
 *   }}
 * />
 * ```
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Import utilities
import { getDefaultValue } from '../con-dynamic-schema-form/utils/defaults';
// Import field renderer
import { renderField as utilRenderField } from '../con-dynamic-schema-form/utils/field-renderers';

/**
 * Schema-Enhanced Field Component
 * @param {Object} props - Component props
 * @param {string} props.schemaType - Schema type to look up (product, module, dienst, etc.)
 * @param {string} props.schemaProperty - Property name in the schema  
 * @param {*} props.value - Current field value
 * @param {function} props.onChange - Change handler function
 * @param {Object} props.schemas - Object containing loaded schema definitions
 * @param {Object} props.formData - Full form data object for context
 * @param {Object} props.customProps - Custom props to override schema defaults
 * @param {string} props.className - Custom CSS classes for styling
 * @param {Object} props.style - Custom inline styles
 * @param {Array} props.optionsProvider - Options array for select fields
 * @param {boolean} props.isLoading - Loading state for the field
 * @param {boolean} props.isDisabled - Disabled state override
 * @param {function} props.onSearch - Search handler for $ref fields
 * @param {Object} props.user - User object for authorization
 * @param {boolean} props.isCreateMode - Whether in create mode for authorization
 * @param {boolean} props.honorImmutable - Whether to respect immutable flag
 * @param {Object} props.context - Additional context for visibility functions
 */
const ConSchemaEnhancedField = ({
  schemaType,
  schemaProperty,
  value,
  onChange,
  schemas = {},
  formData = {},
  customProps = {},
  className = '',
  style = {},
  optionsProvider = [],
  isLoading = false,
  isDisabled = false,
  onSearch = null,
  user = null,
  isCreateMode = false,
  honorImmutable = false,
  context = {},
  ...otherProps
}) => {
  const [resetKey, setResetKey] = useState(0);

  // Get schema for the specified type
  const schema = schemas[schemaType];
  if (!schema) {
    console.warn(`Schema not found for type: ${schemaType}`);
    return <div className={`schema-field-loading ${className}`} style={style}>Schema laden...</div>;
  }

  // Get field schema - support nested properties with dot notation
  const getFieldFromSchema = (schemaType, fieldName) => {
    const schema = schemas[schemaType];
    if (!schema?.properties) return null;

    // Support nested field paths with dot notation (e.g., "bivClassificatie.beschikbaarheid")
    const fieldPath = fieldName.split('.');
    let currentSchema = schema.properties;

    for (const pathSegment of fieldPath) {
      if (!currentSchema[pathSegment]) return null;

      if (currentSchema[pathSegment].type === 'object' && currentSchema[pathSegment].properties) {
        currentSchema = currentSchema[pathSegment].properties;
      } else {
        return currentSchema[pathSegment];
      }
    }

    return null;
  };

  const propertySchema = getFieldFromSchema(schemaType, schemaProperty);
  if (!propertySchema) {
    console.warn(`Property not found in schema: ${schemaType}.${schemaProperty}`);
    return <div className={`schema-field-error ${className}`} style={style}>Property niet gevonden</div>;
  }

  // Apply default if undefined
  let fieldValue = value;
  if (fieldValue === undefined) {
    fieldValue = getDefaultValue(propertySchema);
  }

  // Create updated formData with current value for field renderer
  const updatedFormData = {
    ...formData,
    [schemaProperty]: fieldValue
  };

  // Use the reusable field renderer utility with custom onChange wrapper
  const fieldRenderer = utilRenderField({
    path: schemaProperty,
    propertySchema,
    required: propertySchema.required || false,
    formData: updatedFormData,
    fieldConfigs: { [schemaProperty]: customProps },
    customFieldComponents: {},
    optionsProviders: { [schemaProperty]: optionsProvider },
    loadingStates: { [schemaProperty]: isLoading },
    disabledStates: { [schemaProperty]: isDisabled },
    validationStates: {},
    onFieldChange: (field, value) => onChange(value), // Simple onChange wrapper
    userIsAuthenticated: true,
    context,
    user,
    isCreateMode,
    honorImmutable,
    onSearchHandlers: onSearch ? { handleSearch: onSearch } : {},
    resetKey,
    forceRenderKey: 0
  });

  // Apply custom className and style if needed
  if ((className || style) && fieldRenderer) {
    return (
      <div className={className} style={style}>
        {fieldRenderer}
      </div>
    );
  }

  return fieldRenderer;
};

ConSchemaEnhancedField.propTypes = {
  schemaType: PropTypes.string.isRequired,
  schemaProperty: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  schemas: PropTypes.object,
  formData: PropTypes.object,
  customProps: PropTypes.object,
  className: PropTypes.string,
  style: PropTypes.object,
  optionsProvider: PropTypes.array,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onSearch: PropTypes.func,
  user: PropTypes.object,
  isCreateMode: PropTypes.bool,
  honorImmutable: PropTypes.bool,
  context: PropTypes.object,
};

export default ConSchemaEnhancedField;
