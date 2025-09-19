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
 *
 * // Override field width
 * <ConSchemaEnhancedField
 *   schemaType="product"
 *   schemaProperty="naam"
 *   value={product.naam}
 *   onChange={(value) => setProduct({...product, naam: value})}
 *   width="full" // Force full width instead of default half width
 * />
 * ```
 *
 * **ReactSelect labeling (getOptionLabel):**
 * For `$ref` select fields (and provided option arrays), you can override how option labels are rendered
 * by passing ReactSelect's native `getOptionLabel` in `customProps`. It receives the option object; when the
 * options come from `$ref`, the full object is available on `option.data`.
 *
 * ```jsx
 * <ConSchemaEnhancedField
 *   schemaType="product"
 *   schemaProperty="contactpersoon"
 *   value={product.contactpersoon}
 *   onChange={(v) => setProduct({...product, contactpersoon: v})}
 *   customProps={{
 *     getOptionLabel: (opt) => {
 *       const c = opt?.data ?? opt;
 *       return [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
 *         .filter(Boolean)
 *         .join(' ');
 *     },
 *   }}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

// Import utilities
import { getDefaultValue } from '../con-dynamic-schema-form/utils/defaults';
// Import field renderer and utilities
import { renderField as utilRenderField } from '../con-dynamic-schema-form/utils/field-renderers';
import { getFieldSizeClass as utilGetFieldSizeClass } from '../con-dynamic-schema-form/utils/field-utilities';
// Import useRefOptions hook for automatic $ref field handling
import { useRefOptions } from '../../hooks/use-ref-options';

/**
 * Schema-Enhanced Field Component
 * @param {Object} props - Component props
 * @param {string} props.schemaType - Schema type to look up (product, module, dienst, etc.) - OPTIONAL if schemaProperty is provided
 * @param {string|Object} props.schemaProperty - Property name in the schema OR the property schema object directly
 * @param {*} props.value - Current field value
 * @param {function} props.onChange - Change handler function
 * @param {Object} props.schemas - Object containing loaded schema definitions
 * @param {Object} props.formData - Full form data object for context
 * @param {Object} props.customProps - Custom props to override schema defaults
 * @param {string} props.className - Custom CSS classes for styling
 * @param {Object} props.style - Custom inline styles
 * @param {Array} props.optionsProvider - Options array for select fields (fallback if not $ref)
 * @param {boolean} props.isLoading - Loading state for the field (fallback if not $ref)
 * @param {boolean} props.isDisabled - Disabled state override
 * @param {function} props.onSearch - Search handler for $ref fields (fallback)
 * @param {Object} props.user - User object for authorization
 * @param {boolean} props.isCreateMode - Whether in create mode for authorization
 * @param {boolean} props.honorImmutable - Whether to respect immutable flag
 * @param {Object} props.context - Additional context for visibility functions
 * @param {string} props.width - Override field width: 'half' or 'full' - overrides automatic width detection
 * @param {boolean} props.showLabel - Whether to show the field label (default: true)
 * @param {Object} props.touched - Touched states by field path
 * @param {boolean} props.showDescription - Whether to show the field description/info (default: true)
 * @param {Object} props.store - MobX store (injected by withStore)
 */
const ConSchemaEnhancedField = ({
  schemaType,
  schemaProperty,
  value,
  onChange,
  onFieldChange = null,
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
  touched = null,
  width = null, // Override field width ('half' or 'full')
  showLabel = true, // NEW: Whether to show field label
  showDescription = true, // NEW: Whether to show field description/info
  store = null, // MobX store injected by withStore
}) => {
  const [resetKey] = useState(0);

  // Handle two usage patterns:
  // 1. schemaProperty is a string - look up in schema
  // 2. schemaProperty is an object - use it directly
  let propertySchema = null;
  let fieldName = '';

  if (typeof schemaProperty === 'object' && schemaProperty !== null) {
    // Direct schema property object provided
    propertySchema = schemaProperty;
    // Try to derive field name from context - for now just use a generic name
    // The parent component should pass a fieldName or we derive it from prop names used in formData
    fieldName =
      Object.keys(formData).find((key) => formData[key] === value) ||
      schemaProperty.title?.toLowerCase() ||
      'field';
  } else if (typeof schemaProperty === 'string') {
    // Property name provided - need to look up in schema
    // Note: early returns moved to bottom to avoid hook order issues

    // Get field schema - support nested properties with dot notation
    const getFieldFromSchema = (schemaType, fieldName) => {
      const schema = schemas[schemaType];
      if (!schema?.properties) return null;

      // Support nested field paths with dot notation (e.g., "bivClassificatie.beschikbaarheid")
      const fieldPath = fieldName.split('.');
      let currentSchema = schema.properties;

      for (const pathSegment of fieldPath) {
        if (!currentSchema[pathSegment]) return null;

        if (
          currentSchema[pathSegment].type === 'object' &&
          currentSchema[pathSegment].properties
        ) {
          currentSchema = currentSchema[pathSegment].properties;
        } else {
          return currentSchema[pathSegment];
        }
      }

      return null;
    };

    propertySchema = getFieldFromSchema(schemaType, schemaProperty);
    fieldName = schemaProperty;
  }

  const schemaNotFound = typeof schemaProperty === 'string' && !schemas[schemaType];
  const propertySchemaNotFound = !propertySchema;

  // Apply default if undefined
  let fieldValue = value;
  if (fieldValue === undefined) {
    fieldValue = getDefaultValue(propertySchema);
  }

  // Create updated formData with current value for field renderer
  const updatedFormData = {
    ...formData,
    [fieldName]: fieldValue,
  };

  // ✅ CONDITIONAL REF OPTIONS: Only use internal $ref system when NO custom search is provided
  const useCustomSearch = !!onSearch;

  // Create a mock schema for useRefOptions if we have a valid property schema AND no custom search
  const mockSchemaForRefOptions = useMemo(() => {
    if (!propertySchema || useCustomSearch) return null;

    return {
      properties: {
        [fieldName]: propertySchema,
      },
    };
  }, [fieldName, propertySchema, useCustomSearch]);

  // Use useRefOptions for automatic $ref field handling ONLY when no custom search is provided
  const shouldUseRefOptions =
    store && store.object && !useCustomSearch && mockSchemaForRefOptions;
  // Always call hook with safe defaults to keep hook order stable
  const safeStore = store || { object: null };
  const safeSchema = mockSchemaForRefOptions || { properties: {} };
  const refOptionsResult = useRefOptions(safeStore, 'voorzieningen', safeSchema, {
    [fieldName]: customProps,
  });

  // Debug RefOptions status
  if (process.env.NODE_ENV === 'development' && fieldName === 'modules') {
    console.info(`🔧 ConSchemaEnhancedField [${fieldName}] RefOptions:`, {
      useCustomSearch,
      hasCustomOnSearch: !!onSearch,
      shouldUseRefOptions,
      refOptionsActive: shouldUseRefOptions,
      mockSchemaExists: !!mockSchemaForRefOptions,
      storeProvided: !!store,
      hasStoreObject: !!(store && store.object),
    });
  }

  // Debug store structure
  if (
    process.env.NODE_ENV === 'development' &&
    (fieldName === 'contactpersoon' || fieldName === 'aanbieder')
  ) {
    console.info(`🏪 Store debug for [${fieldName}]:`, {
      hasStore: !!store,
      hasObject: !!store?.object,
      storeKeys: store ? Object.keys(store) : [],
      objectKeys: store?.object ? Object.keys(store.object) : [],
    });
  }

  // Extract options and loading state from useRefOptions if it's a $ref field
  const hasRefProperty =
    propertySchema?.$ref || (propertySchema?.items && propertySchema.items.$ref);

  // edited so that optionsProvider has priority, cuz why else would that prop even exist...
  const hasExternalOptionsProvider =
    Array.isArray(optionsProvider) && optionsProvider.length > 0;

  const effectiveOptionsProvider = hasExternalOptionsProvider
    ? optionsProvider
    : hasRefProperty && !useCustomSearch && shouldUseRefOptions
    ? refOptionsResult?.optionsProviders?.[fieldName] || []
    : optionsProvider;
  const effectiveIsLoading = hasExternalOptionsProvider
    ? isLoading
    : hasRefProperty && !useCustomSearch && shouldUseRefOptions
    ? refOptionsResult?.loadingStates?.[fieldName] || false
    : isLoading;

  // Debug logging
  if (
    process.env.NODE_ENV === 'development' &&
    (hasRefProperty ||
      fieldName === 'contactpersoon' ||
      fieldName === 'aanbieder' ||
      fieldName === 'modules')
  ) {
    console.info(`🔍 ConSchemaEnhancedField [${fieldName}]:`, {
      hasRefProperty,
      useCustomSearch,
      refProperty: propertySchema?.$ref,
      itemsRefProperty: propertySchema?.items?.$ref,
      optionsCount: effectiveOptionsProvider.length,
      isLoading: effectiveIsLoading,
      store: !!store,
      propertySchemaKeys: propertySchema ? Object.keys(propertySchema) : [],
      schemaType,
      propertyType: propertySchema?.type,
      options: effectiveOptionsProvider.slice(0, 2), // Show first 2 options for debugging
      customOnSearch: !!onSearch,
      internalRefDisabled: useCustomSearch,
    });
  }

  // Create search handler for $ref fields
  const effectiveOnSearchHandlers = useMemo(() => {
    // ✅ PRIORITY FIX: Always prefer custom onSearch over internal $ref search
    if (onSearch) {
      console.info(
        `🔍 ConSchemaEnhancedField: Using CUSTOM search handler for ${fieldName} (disabling internal $ref)`
      );
      return { handleSearch: onSearch };
    }

    // Fallback to internal $ref search if no custom handler
    if (!hasRefProperty || !refOptionsResult?.fetchOptions || !shouldUseRefOptions) {
      return {};
    }

    console.info(
      `🔍 ConSchemaEnhancedField: Using INTERNAL $ref search for ${fieldName}`
    );
    return {
      handleSearch: async (fieldPath, query) => {
        console.info(
          `🔍 ConSchemaEnhancedField: Internal search triggered for ${fieldPath}:`,
          query
        );
        if (refOptionsResult.fetchOptions) {
          await refOptionsResult.fetchOptions(fieldPath, query);
        }
      },
    };
  }, [onSearch, hasRefProperty, refOptionsResult?.fetchOptions, fieldName]);

  // Merge width override with customProps for field configuration

  const fieldConfig = {
    ...customProps,
    // Override size/width if provided
    ...(width && { size: width }),
    // Override label and description visibility
    ...(showLabel === false && { hideLabel: true }),
    ...(showDescription === false && { hideDescription: true }),
  };

  // Use the reusable field renderer utility with custom onChange wrapper
  const fieldRenderer = utilRenderField({
    path: fieldName,
    propertySchema,
    required: propertySchema?.required || false,
    touched: touched,
    formData: updatedFormData,
    fieldConfigs: { [fieldName]: fieldConfig },
    customFieldComponents: {},
    optionsProviders: { [fieldName]: effectiveOptionsProvider },
    loadingStates: { [fieldName]: effectiveIsLoading },
    disabledStates: { [fieldName]: isDisabled },
    validationStates: {},
    onFieldChange: (field, value) => {
      // Handle main field change
      if (field === fieldName) {
        onChange(value);
      }
      // Handle related field changes (like filename for file uploads)
      else if (onFieldChange) {
        onFieldChange(field, value);
      }
    },
    userIsAuthenticated: true,
    context,
    user,
    isCreateMode,
    honorImmutable,
    onSearchHandlers: effectiveOnSearchHandlers,
    resetKey,
    forceRenderKey: 0,
  });

  // Render early error/loading states after hooks to maintain order
  if (typeof schemaProperty === 'string') {
    if (!schemaType) {
      console.warn('schemaType is required when schemaProperty is a string');
      return (
        <div className={`schema-field-error ${className}`} style={style}>
          Schema type ontbreekt
        </div>
      );
    }

    if (schemaNotFound) {
      console.warn(`Schema not found for type: ${schemaType}`);
      return (
        <div className={`schema-field-loading ${className}`} style={style}>
          Schema laden...
        </div>
      );
    }
  }

  if (propertySchemaNotFound) {
    console.warn(`Property schema not available:`, { schemaType, schemaProperty });
    return (
      <div className={`schema-field-error ${className}`} style={style}>
        Schema eigenschap niet gevonden
      </div>
    );
  }

  // Apply size wrapper like ConDynamicSchemaForm does
  const sizeClass = utilGetFieldSizeClass(fieldName, propertySchema, fieldConfig);

  // Apply custom className and style if needed, combined with size wrapper
  const combinedClassName = [sizeClass, className].filter(Boolean).join(' ');

  return (
    <div className={`con-form-field-wrapper ${combinedClassName}`} style={style}>
      {fieldRenderer}
    </div>
  );
};

ConSchemaEnhancedField.propTypes = {
  schemaType: PropTypes.string, // Optional when schemaProperty is an object
  schemaProperty: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    .isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func, // For handling related field changes (like filename)
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
  width: PropTypes.oneOf(['half', 'full']), // Override field width
  showLabel: PropTypes.bool, // Whether to show field label (default: true)
  showDescription: PropTypes.bool, // Whether to show field description (default: true)
  store: PropTypes.object, // MobX store (injected by withStore)
};

export default withStore(observer(ConSchemaEnhancedField));
