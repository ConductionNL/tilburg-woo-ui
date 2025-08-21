// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import clsx from 'clsx';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { sortPropertiesByOrder } from '@src/utilities/con-sort-properties-by-order';
import { shouldShowFormField } from '@src/utilities/con-authentication-filters';
import {
  getFieldAuthorizationState,
  debugFieldAuthorization,
} from '@utils/field-authorization';
// Import reusable field utilities
import {
  getFieldConfig as utilGetFieldConfig,
  getFieldVisibility as utilGetFieldVisibility,
  getFieldOptions as utilGetFieldOptions,
  getFieldDisabled as utilGetFieldDisabled,
  getFieldValidation as utilGetFieldValidation,
  handleFieldChange as utilHandleFieldChange,
  getFieldSizeClass as utilGetFieldSizeClass,
  getNestedValue,
  setNestedValue,
  extractSchemaSlugFromRef,
  getFieldRefSchemaSlug
} from './utils/field-utilities';
// Import reusable field renderer
import { renderField as utilRenderField } from './utils/field-renderers';
import { Tooltip } from 'react-tooltip';
import { TOOLTIP_ID } from '@src/index.web';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

// ReactSelectWithGlobalHack is now imported in field-renderers.js

// Field components are now imported in field-renderers.js
import { validateArray, validateNumber, validateString } from './utils/validation';

/**
 * A dynamic form component that automatically generates form fields based on a JSON schema.
 *
 * **Key Features:**
 * - Automatic field generation from JSON schema properties
 * - Support for multiple field types (text, select, multi-select)
 * - Support for nested object properties with recursive field generation
 * - Custom field configurations and overrides
 * - Custom field components for special cases (file uploads, etc.)
 * - Dynamic options providers for select fields
 * - Loading and disabled states per field
 * - Built-in validation with custom validation support
 * - Property ordering support via the `sortPropertiesByOrder` utility
 * - Dynamic visibility support based on form data and external context
 * - **Field-level authorization**: Automatic field visibility and editability based on user groups and schema authorization rules
 *
 * **Automatic Field Type Detection:**
 * - **Arrays**: Automatically rendered as multi-select dropdowns
 * - **Enums**: Automatically rendered as single-select dropdowns
 * - **Objects**: Recursively rendered as individual fields for each nested property
 * - **Strings**: Rendered as text input fields
 * - **Date fields**: Strings with `format: "date"` rendered as HTML5 date input
 * - **DateTime fields**: Strings with `format: "date-time"` rendered as HTML5 datetime-local input
 * - **Other types**: Default to text input fields
 *
 * **Nested Object Support:**
 * When a property has `type: "object"` and contains a `properties` object, the component
 * will recursively generate form fields for each nested property. The field names will
 * use dot notation (e.g., "parent.child") for nested paths.
 *
 * **Field Configuration:**
 * Each field can be customized through the `fieldConfigs` prop:
 * ```jsx
 * fieldConfigs={{
 *   propertyName: {
 *     label: "Custom Label",
 *     required: true,
 *     visible: true, // or function: (formData) => boolean
 *     description: "Field description",
 *     type: "text|select|multiSelect",
 *     component: "AcFormField|ReactSelect",
 *     options: [{ value: "option1", label: "Option 1" }],
 *     isMulti: false,
 *     closeMenuOnSelect: true,
 *     placeholder: "Custom placeholder",
 *     size: "half|full" // Controls field width: half (50%) or full (100%)
 *   }
 * }}
 * ```
 *
 * **Flexible Field Layout System:**
 * The form uses a flexible layout with floating divs that automatically adjust field sizes based on content:
 *
 * **Automatic Sizing Rules:**
 * - **Full Width (100%)**: Markdown/HTML fields, JSON objects, large text (maxLength > 100), multi-select arrays
 * - **Half Width + Double Height**: Text areas, description fields, fields with maxLength > 50
 * - **Half Width + Normal Height**: Default for most fields (text inputs, selects, numbers, etc.)
 *
 * **Manual Size Override:**
 * ```jsx
 * fieldConfigs={{
 *   description: { size: "full" },        // Force full width
 *   shortText: { size: "half" }           // Force half width
 * }}
 * ```
 *
 * **Responsive Behavior:**
 * - Desktop: Fields respect their size classes (50%/100% width)
 * - Tablet (≤1024px): Half-width fields become full width
 * - Mobile (≤768px): All fields become full width for better usability
 *
 * **Custom Field Components:**
 * For special cases like file uploads, you can provide custom React components:
 * ```jsx
 * customFieldComponents={{
 *   propertyName: ({ fieldConfig, value, onChange, validation, isLoading, isDisabled }) => (
 *     <CustomFileUpload
 *       value={value}
 *       onChange={onChange}
 *       label={fieldConfig.label}
 *       required={fieldConfig.required}
 *       {...validation}
 *     />
 *   )
 * }}
 * ```
 *
 * **Dynamic Visibility:**
 * The `visible` property can be a boolean or a function that receives the current form data and context:
 * ```jsx
 * fieldConfigs={{
 *   fieldName: {
 *     visible: (formData) => context.isEdit === false
 *   }
 * }}
 * ```
 *
 * **Options Providers:**
 * Dynamic options for select fields can be provided via the `optionsProviders` prop:
 * ```jsx
 * optionsProviders={{
 *   propertyName: [
 *     { value: "option1", label: "Option 1" },
 *     { value: "option2", label: "Option 2" }
 *   ]
 * }}
 * ```
 *
 * **Loading and Disabled States:**
 * Individual fields can have loading or disabled states:
 * ```jsx
 * loadingStates={{
 *   propertyName: true // Shows loading spinner in select
 * }}
 *
 * disabledStates={{
 *   propertyName: true, // Static disabled state
 *   propertyName: (formData) => !formData.otherField // Dynamic disabled state
 * }}
 * ```
 *
 * **Validation:**
 * Built-in required field validation with support for custom validation:
 * ```jsx
 * validationStates={{
 *   propertyName: {
 *     hasError: true,
 *     required: true,
 *     errorMessage: "Custom error message"
 *   }
 * }}
 * ```
 *
 * **Field-Level Authorization:**
 * Fields can be automatically hidden or disabled based on user permissions:
 * ```jsx
 * // Schema with authorization rules
 * const schema = {
 *   properties: {
 *     sensitiveField: {
 *       type: "string",
 *       authorization: {
 *         read: ["admin", "editor"],    // Only admins and editors can see this field
 *         create: ["admin"],            // Only admins can create values
 *         update: ["admin", "editor"]   // Admins and editors can edit
 *       }
 *     }
 *   }
 * };
 *
 * <ConDynamicSchemaForm
 *   schema={schema}
 *   user={userStore}              // Pass user object with groups
 *   isCreateMode={true}           // Affects create vs update permissions
 *   // ... other props
 * />
 * ```
 *
 * **Authorization Rules:**
 * - If `authorization` is not defined or empty: field is visible and editable
 * - If `read` groups are defined: field is only visible to users with those groups
 * - If `create`/`update` groups are defined: field is only editable by users with those groups
 * - If no read groups are defined: field is hidden
 * - If no create/update groups are defined: field is disabled (read-only)
 *
 * @example
 * ```jsx
 * const formRef = useRef();
 *
 * const handleModalClose = () => {
 *   formRef.current?.reset(); // Reset all select fields
 *   // ... other close logic
 * };
 *
 * const schema = {
 *   properties: {
 *     name: { type: "string", required: true },
 *     category: {
 *       type: "string",
 *       enum: ["option1", "option2"],
 *       order: 1
 *     },
 *     tags: { type: "array", order: 2 },
 *     logo: { type: "string", order: 3, immutable: true },
 *     biv: {
 *       type: "object",
 *       properties: {
 *         beschikbaarheid: {
 *           type: "string",
 *           enum: ["Laag", "Midden", "Hoog"]
 *         },
 *         integriteit: {
 *           type: "string",
 *           enum: ["Laag", "Midden", "Hoog"],
 *           immutable: true
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * <ConDynamicSchemaForm
 *   ref={formRef}
 *   schema={schema}
 *   formData={{ name: "Test", category: "option1", biv: { beschikbaarheid: "Midden" } }}
 *   onFieldChange={(field, value) => console.log(field, value)}
 *   fieldConfigs={{
 *     name: { label: "Product Name" },
 *     category: {
 *       visible: (formData) => formData.type === 'active'
 *     }
 *   }}
 *   customFieldComponents={{
 *     logo: ({ fieldConfig, value, onChange, validation }) => (
 *       <FileUpload
 *         value={value}
 *         onChange={onChange}
 *         label={fieldConfig.label}
 *         required={fieldConfig.required}
 *         {...validation}
 *       />
 *     )
 *   }}
 *   optionsProviders={{
 *     tags: [
 *       { value: "tag1", label: "Tag 1" },
 *       { value: "tag2", label: "Tag 2" }
 *     ]
 *   }}
 *   loadingStates={{ tags: true }}
 *   disabledStates={{ category: true }}
 *   honorImmutable={true}
 * />
 * ```
 *
 * @param {object} props - The component props.
 * @param {object} props.schema - The JSON schema defining the form structure. Must have a `properties` object.
 * @param {object} props.schema.properties - Object containing property definitions for form fields.
 * @param {object} props.formData - The current form data object containing field values.
 * @param {(fieldName: string, value: any) => void} props.onFieldChange - Callback function called when a field value changes.
 * @param {object} props.fieldConfigs - Custom field configurations to override automatic field generation.
 * @param {object} props.customFieldComponents - Custom React components for specific fields, keyed by property name.
 * @param {object} props.optionsProviders - Dynamic options for select fields, keyed by property name.
 * @param {object} props.loadingStates - Loading states for individual fields, keyed by property name.
 * @param {object|Function} props.disabledStates - Disabled states for individual fields. Can be boolean or function receiving formData.
 * @param {object} props.validationStates - Custom validation states for individual fields.
 * @param {number} props.columns - Number of columns for the form layout (currently not implemented).
 * @param {string} props.className - Additional CSS classes for the form container.
 * @param {object} props.context - Additional context object passed to visibility functions.
 * @param {(isValid: boolean) => void} props.getIsValid - Callback function that receives the form validation state.
 * @param {boolean} props.honorImmutable - When true, fields with `immutable: true` in their schema will be disabled.
 * @param {boolean} props.userIsAuthenticated - Whether the current user is authenticated (for authentication-based field visibility).
 * @param {object} props.user - Full user object with groups for field-level authorization checks.
 * @param {boolean} props.isCreateMode - Whether this form is in create mode (affects authorization checks).
 * @param {object} props.onSearchHandlers - Object containing search handlers for dynamic option loading. Should include handleSearch function.
 * @param {React.Ref} ref - Ref object that exposes a `reset()` method to reset all ReactSelect components.
 *
 * @returns {React.ReactElement|null} The rendered dynamic form component or null if no schema properties exist.
 *
 * @note The component automatically capitalizes property names for labels if no custom label is provided.
 * @note Fields with `visible: false` or `visible: (formData) => false` in their configuration are not rendered.
 * @note Multi-select fields automatically convert selected values to arrays of values.
 * @note Required fields without values will show validation errors.
 * @note The `columns` prop is currently not implemented in the component.
 * @note Custom field components receive all necessary props and should handle their own value changes.
 * @note Nested object properties are flattened into individual form fields with dot notation paths.
 * @note When `honorImmutable` is true, fields with `immutable: true` in their schema will be automatically disabled.
 * @note The component exposes a `reset()` method through ref to force ReactSelect components to re-render and clear their internal state.
 *
 * @author [Author Name]
 */
const ConDynamicSchemaForm = forwardRef(
  (
    {
      schema,
      formData,
      onFieldChange,
      fieldConfigs = {},
      customFieldComponents = {},
      optionsProviders = {},
      loadingStates = {},
      disabledStates = {},
      validationStates = {},
      columns = 2,
      className = '',
      context = {},
      getIsValid = () => {},
      honorImmutable = false,
      userIsAuthenticated = false,
      user = null,
      isCreateMode = false,
      onSearchHandlers = {},
    },
    ref
  ) => {
    const [resetKey, setResetKey] = React.useState(0);

    // HACK: Force re-render when options change (TODO: Fix the actual re-render loop issue)
    const [forceRenderKey, setForceRenderKey] = useState(0);
    const prevOptionsRef = useRef({});

    // Debug logging disabled to reduce console noise
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔍 ConDynamicSchemaForm: Received props:', {
    //     schemaTitle: schema?.title,
    //     optionsProvidersKeys: Object.keys(optionsProviders),
    //     loadingStatesKeys: Object.keys(loadingStates),
    //     disabledStatesKeys: Object.keys(disabledStates)
    //   });
    // }

    // HACK: Force re-render when options change (TODO: Fix the actual re-render loop issue)
    useEffect(() => {
      // Check if any options have changed from empty to having data
      let hasNewOptions = false;
      
      Object.keys(optionsProviders).forEach(key => {
        const currentOptions = optionsProviders[key];
        const prevOptions = prevOptionsRef.current[key];
        
        // If we now have options but didn't before, force re-render
        if (Array.isArray(currentOptions) && currentOptions.length > 0 && 
            (!prevOptions || prevOptions.length === 0)) {
          hasNewOptions = true;
          console.log(`🔧 HACK: Force re-render for new options in ${key}:`, currentOptions);
        }
      });
      
      if (hasNewOptions) {
        // Force re-render after a short delay to ensure DOM is ready
        setTimeout(() => {
          setForceRenderKey(prev => prev + 1);
        }, 100);
      }
      
      // Update previous options reference
      prevOptionsRef.current = { ...optionsProviders };
    }, [optionsProviders]);

    // Debug effect disabled to reduce console noise
    // const prevOptionsKeysRef = useRef([]);
    // useEffect(() => {
    //   if (process.env.NODE_ENV === 'development') {
    //     const currentKeys = Object.keys(optionsProviders).sort();
    //     const prevKeys = prevOptionsKeysRef.current;
    //     
    //     // Only log if keys actually changed
    //     if (JSON.stringify(currentKeys) !== JSON.stringify(prevKeys)) {
    //       console.log('🔍 ConDynamicSchemaForm: optionsProviders keys changed:', currentKeys);
    //       console.log('🔍 ConDynamicSchemaForm: optionsProviders content:', optionsProviders);
    //       prevOptionsKeysRef.current = currentKeys;
    //     }
    //   }
    // }, [optionsProviders]);

    // Extract search handler
    const { handleSearch } = onSearchHandlers;

    // Expose reset function through ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        setResetKey((prev) => prev + 1);
      },
    }));

    // getFieldRefSchemaSlug is now imported from utilities

    if (!schema?.properties) return null;

    // Get the top-level required array, default to []
    const topLevelRequired = Array.isArray(schema.required) ? schema.required : [];

    // extractSchemaSlugFromRef is now imported from utilities

    // getNestedValue and setNestedValue are now imported from utilities

    /**
     * Recursively flattens nested object properties into a flat list with dot notation paths.
     * Used by validateForm() and the main render loop to process all form fields including nested ones.
     *
     * @param {object} properties - Object containing property definitions
     * @param {string} parentPath - Current parent path for nested properties (default: '')
     * @param {string[]} parentRequired - Array of required property names from parent (default: [])
     * @returns {Array} Array of flattened property objects with path, name, schema, required, and parentPath
     *
     * @example
     * Input: `{ bivClassificatie: { type: "object", properties: { beschikbaarheid: {...} } } }`
     * Output: `[{ path: "bivClassificatie.beschikbaarheid", name: "beschikbaarheid", schema: {...}, required: false, parentPath: "bivClassificatie" }]`
     */
    const flattenProperties = (properties, parentPath = '', parentRequired = []) => {
      const flattened = [];

      for (const [propertyName, propertySchema] of Object.entries(properties)) {
        const currentPath = parentPath
          ? `${parentPath}.${propertyName}`
          : propertyName;
        const isRequired =
          parentRequired.includes(propertyName) || propertySchema.required === true;

        if (propertySchema.type === 'object' && propertySchema.properties) {
          // Recursively flatten nested object properties
          const nestedRequired = Array.isArray(propertySchema.required)
            ? propertySchema.required
            : [];
          const nestedFlattened = flattenProperties(
            propertySchema.properties,
            currentPath,
            nestedRequired
          );
          flattened.push(...nestedFlattened);
        } else {
          // Add the property with its full path
          flattened.push({
            path: currentPath,
            name: propertyName,
            schema: propertySchema,
            required: isRequired,
            parentPath,
          });
        }
      }

      return flattened;
    };

    /**
     * Generate field configuration using the reusable utility
     */
    const getFieldConfig = (propertyPath, propertySchema, isRequired) => {
      return utilGetFieldConfig(propertyPath, propertySchema, isRequired, fieldConfigs, optionsProviders);
    };

    /**
     * Determine field visibility using the reusable utility
     */
    const getFieldVisibility = (propertyPath, fieldConfig, propertySchema) => {
      return utilGetFieldVisibility(propertyPath, fieldConfig, propertySchema, formData, userIsAuthenticated, context, user, isCreateMode);
    };

    /**
     * Get field options using the reusable utility
     */
    const getFieldOptions = (propertyPath, propertySchema) => {
      return utilGetFieldOptions(propertyPath, propertySchema, optionsProviders, formData);
    };

    /**
     * Gets the loading state for a specific field from the loadingStates prop.
     *
     * @example
     * getFieldLoading("bivClassificatie.beschikbaarheid")
     * // Returns: true if loadingStates["bivClassificatie.beschikbaarheid"] is true
     */
    const getFieldLoading = (propertyPath) => {
      return loadingStates[propertyPath] || false;
    };

    /**
     * Get field disabled state using the reusable utility
     */
    const getFieldDisabled = (propertyPath, propertySchema, fieldConfig) => {
      return utilGetFieldDisabled(propertyPath, propertySchema, fieldConfig, disabledStates, honorImmutable, user, isCreateMode, formData);
    };

    /**
     * Get field validation using the reusable utility
     */
    const getFieldValidation = (propertyPath, fieldConfig, valueOverride) => {
      return utilGetFieldValidation(propertyPath, fieldConfig, formData, validationStates, valueOverride);
    };

    /**
     * Validates all visible required fields in the form.
     *
     * @example
     * validateForm()
     * // Returns: false if any required field is empty or invalid
     */
    const validateForm = () => {
      const sortedProperties = sortPropertiesByOrder(schema.properties);
      const flattenedProperties = flattenProperties(
        sortedProperties,
        '',
        topLevelRequired
      );

      for (const property of flattenedProperties) {
        const fieldConfig = getFieldConfig(
          property.path,
          property.schema,
          property.required
        );

        // Skip validation for invisible fields (including auth-based visibility)
        if (!getFieldVisibility(property.path, fieldConfig, property.schema))
          continue;

        // Skip validation for disabled fields
        if (getFieldDisabled(property.path, property.schema, fieldConfig)) continue;

        const validation = getFieldValidation(property.path, fieldConfig);
        if (validation.hasError) {
          return false;
        }
      }
      return true;
    };

    // Update form validity whenever form data changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      getIsValid?.(validateForm());
    }, [formData]);

    /**
     * Handle field changes using the reusable utility
     */
    const handleFieldChange = (propertyPath, fieldConfig) => {
      return utilHandleFieldChange(propertyPath, fieldConfig, onFieldChange, formData);
    };

    /**
     * Render a field using the reusable field renderer utility
     */
    const renderField = (property) => {
      const { path, schema: propertySchema, required } = property;
      
      return utilRenderField({
        path,
        propertySchema,
        required,
        formData,
        fieldConfigs,
        customFieldComponents,
        optionsProviders,
        loadingStates,
        disabledStates,
        validationStates,
        onFieldChange,
        userIsAuthenticated,
        context,
        user,
        isCreateMode,
        honorImmutable,
        onSearchHandlers,
        resetKey,
        forceRenderKey
      });
    };

    // Sort top-level properties using the custom sorting logic, then flatten
    const sortedProperties = sortPropertiesByOrder(schema.properties);
    const flattenedProperties = flattenProperties(
      sortedProperties,
      '',
      topLevelRequired
    );

    /**
     * Get field size class using the reusable utility
     */
    const getFieldSizeClass = (path, propertySchema, fieldConfig) => {
      return utilGetFieldSizeClass(path, propertySchema, fieldConfig);
    };

    /**
     * Wraps a field with appropriate sizing container
     * @param {React.ReactElement} fieldElement - The rendered field element
     * @param {string} path - The property path
     * @param {object} propertySchema - The property schema
     * @param {object} fieldConfig - The field configuration
     * @returns {React.ReactElement} Wrapped field element
     */
    const wrapFieldWithSize = (fieldElement, path, propertySchema, fieldConfig) => {
      if (!fieldElement) return null;

      const sizeClass = getFieldSizeClass(path, propertySchema, fieldConfig);

      return (
        <div key={path} className={`con-form-field-wrapper ${sizeClass}`}>
          {fieldElement}
        </div>
      );
    };

    /**
     * Enhanced render field function that includes size wrapping
     */
    const renderFieldWithSize = (property) => {
      const { path, schema: propertySchema, required } = property;
      const fieldConfig = getFieldConfig(path, propertySchema, required);

      // Check visibility first
      if (!getFieldVisibility(path, fieldConfig, propertySchema)) {
        return null;
      }

      // Render the actual field
      const fieldElement = renderField(property);

      // Wrap with size container
      return wrapFieldWithSize(fieldElement, path, propertySchema, fieldConfig);
    };

    /**
     * Main render section that processes and renders all form fields.
     *
     * Process:
     * 1. Sort top-level properties using custom sortPropertiesByOrder logic
     * 2. Flatten nested object properties into individual fields with dot notation paths
     * 3. Render each field using renderField() function with size wrapping
     * 4. Include tooltip component for field descriptions
     *
     * The flattened properties maintain the original order from the sorted top-level properties,
     * with nested properties appearing in their original order within their parent object.
     */
    return (
      <div 
        className='con-form-fields-container'
        key={`form-${resetKey}-${forceRenderKey}`} // HACK: Include forceRenderKey to force re-render when options change
      >
        {flattenedProperties.map((property) => renderFieldWithSize(property))}
        {/* Tooltip needs to be rendered again because the dialog is rendered in a portal at #top-layer */}
        <Tooltip id={TOOLTIP_ID} className='ac-gemma-tooltip' />
      </div>
    );
  }
);

ConDynamicSchemaForm.displayName = 'ConDynamicSchemaForm';

export default ConDynamicSchemaForm;
