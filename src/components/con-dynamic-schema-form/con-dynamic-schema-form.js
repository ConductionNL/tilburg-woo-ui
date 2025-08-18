import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import clsx from 'clsx';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { sortPropertiesByOrder } from '@src/utilities/con-sort-properties-by-order';
import { shouldShowFormField } from '@src/utilities/con-authentication-filters';
import { getFieldAuthorizationState, debugFieldAuthorization } from '@utils/field-authorization';
import { Tooltip } from 'react-tooltip';
import { TOOLTIP_ID } from '@src/index.web';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
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
 *     placeholder: "Custom placeholder"
 *   }
 * }}
 * ```
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
    },
    ref
  ) => {
    const [resetKey, setResetKey] = React.useState(0);

    // Expose reset function through ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        setResetKey((prev) => prev + 1);
      },
    }));

    if (!schema?.properties) return null;

    // Get the top-level required array, default to []
    const topLevelRequired = Array.isArray(schema.required) ? schema.required : [];

    /**
     * Extracts the schema slug from a $ref value
     * @param {string} ref - The $ref value like "#/components/schemas/voorzieningmodule"
     * @returns {string} - The schema slug like "voorzieningmodule"
     */
    const extractSchemaSlugFromRef = (ref) => {
      if (!ref || typeof ref !== 'string') return null;
      const parts = ref.split('/');
      return parts[parts.length - 1]; // Get the last part
    };

    /**
     * Safely retrieves a nested value from an object using dot notation path.
     */
    const getNestedValue = (path, data) => {
      return path.split('.').reduce((obj, key) => obj?.[key], data);
    };

    /**
     * Sets a nested value in an object using dot notation path, creating intermediate objects as needed.
     */
    const setNestedValue = (path, data, value) => {
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
     * Generates field configuration for a property based on its schema and custom overrides.
     * Used by renderField() to determine field type, component, validation, and display options.
     *
     * @param {string} propertyPath - Dot notation path of the property (e.g., "bivClassificatie.beschikbaarheid")
     * @param {object} propertySchema - The property's schema definition
     * @param {boolean} isRequired - Whether the field is required
     * @returns {object} Field configuration with type, component, label, placeholder, etc.
     *
     * @example
     * getFieldConfig("bivClassificatie.beschikbaarheid", { type: "string", enum: ["Laag", "Midden", "Hoog"] }, true)
     * // Returns: { type: "select", component: "ReactSelect", label: "Beschikbaarheid", required: true, ... }
     */
    const getFieldConfig = (propertyPath, propertySchema, isRequired) => {
      const baseConfig = {
        label:
          propertySchema.title ||
          propertyPath.split('.').pop().charAt(0).toUpperCase() +
            propertyPath.split('.').pop().slice(1),
        required: isRequired,
        visible: propertySchema.visible !== false,
        description: propertySchema.description,
        placeholder: propertySchema.example || undefined,
      };

      // Handle different field types based on schema
      let schemaConfig = baseConfig;

      if (propertySchema.type === 'array') {
        schemaConfig = {
          ...baseConfig,
          type: 'multiSelect',
          component: 'ReactSelect',
          isMulti: true,
          closeMenuOnSelect: false,
          placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
        };
      } else if (propertySchema.enum) {
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
      } else if (propertySchema.$ref) {
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
      } else if (propertySchema.type === 'array' && propertySchema.items?.$ref) {
        // Handle array of object references
        const refSchemaSlug = extractSchemaSlugFromRef(propertySchema.items.$ref);
        schemaConfig = {
          ...baseConfig,
          type: 'multiSelect',
          component: 'ReactSelect',
          isMulti: true,
          closeMenuOnSelect: false,
          placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
          refSchemaSlug, // Store for options fetching
          isSearchable: true, // Enable search if more than 20 results
        };
      } else if (
        propertySchema.type === 'string' &&
        optionsProviders[propertyPath]?.length > 0
      ) {
        schemaConfig = {
          ...baseConfig,
          type: 'select',
          component: 'ReactSelect',
          placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
        };
      } else if (
        propertySchema.type === 'string' &&
        propertySchema.format === 'text'
      ) {
        schemaConfig = {
          ...baseConfig,
          type: 'text',
          component: 'AcTextarea',
        };
      } else if (
        propertySchema.type === 'string' &&
        (propertySchema.format === 'date' || propertySchema.format === 'date-time')
      ) {
        // Handle date and datetime fields
        schemaConfig = {
          ...baseConfig,
          type: 'date',
          component: 'AcFormField',
          inputType:
            propertySchema.format === 'date-time' ? 'datetime-local' : 'date',
        };
      } else if (propertySchema.type === 'string') {
        schemaConfig = {
          ...baseConfig,
          type: 'text',
          component: 'AcFormField',
        };
      } else {
        schemaConfig = {
          ...baseConfig,
          type: 'text',
          component: 'AcFormField',
        };
      }

      // Merge custom field config with schema config
      if (fieldConfigs[propertyPath]) {
        return {
          ...schemaConfig,
          ...fieldConfigs[propertyPath],
        };
      }

      return schemaConfig;
    };

    /**
     * Determines if a field should be visible based on its configuration, current form data, authentication state,
     * and field-level authorization.
     * Used by renderField() and validateForm() to conditionally show/hide fields.
     *
     * @example
     * getFieldVisibility("status", { visible: (formData) => formData.type === 'active' }, propertySchema)
     * // Returns: true/false based on formData.type value, authentication state, and field authorization
     */
    const getFieldVisibility = (propertyPath, fieldConfig, propertySchema) => {
      // First check traditional visibility rules
      const isVisibleByConfig = shouldShowFormField(fieldConfig, formData, userIsAuthenticated, context);
      if (!isVisibleByConfig) {
        return false;
      }

      // Then check field-level authorization if user object is available
      if (user && propertySchema) {
        const authState = getFieldAuthorizationState(user, propertySchema, isCreateMode);
        
        // Enable debug logging for development
        if (process.env.NODE_ENV === 'development') {
          debugFieldAuthorization(user, propertySchema, propertyPath, isCreateMode);
        }
        
        return authState.visible;
      }

      // Fallback to traditional visibility if no user object or schema
      return isVisibleByConfig;
    };

    /**
     * Gets the options array for select/multi-select fields based on schema enum, $ref, or optionsProviders.
     *
     * @example
     * getFieldOptions("bivClassificatie.beschikbaarheid", { enum: ["Laag", "Midden", "Hoog"] })
     * // Returns: [{ value: "Laag", label: "Laag" }, { value: "Midden", label: "Midden" }, ...]
     */
    const getFieldOptions = (propertyPath, propertySchema) => {
      // Priority 1: Schema enum takes highest priority
      if (propertySchema.enum) {
        return propertySchema.enum.map((option) => ({
          value: option,
          label: option,
        }));
      }

      // Priority 2: $ref-based options from optionsProviders
      // The parent component should populate optionsProviders with fetched data for $ref fields
      if (optionsProviders[propertyPath]) {
        return optionsProviders[propertyPath];
      }

      // Priority 3: No options
      return [];
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
     * Gets the disabled state for a specific field from the disabledStates prop and field-level authorization.
     *
     * @example
     * getFieldDisabled("status", propertySchema, { disabled: true })
     * // Returns: true if fieldConfig.disabled is true, or from disabledStates, or from authorization
     */
    const getFieldDisabled = (propertyPath, propertySchema, fieldConfig) => {
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
     *
     * @example
     * getFieldValidation("name", { required: true })
     * // Returns: { hasError: true, required: true } if name is empty
     */
    const getFieldValidation = (propertyPath, fieldConfig) => {
      if (validationStates[propertyPath]) {
        return validationStates[propertyPath];
      }

      const isRequired = fieldConfig.required;
      const value = getNestedValue(propertyPath, formData);

      // Better validation logic that handles different value types
      let hasError = false;
      if (isRequired) {
        if (fieldConfig.isMulti) {
          // For multi-select, check if array exists and has items
          hasError = !Array.isArray(value) || value.length === 0;
        } else {
          // For single select and text fields, check if value exists and is not empty
          hasError = value === undefined || value === null || value === '';
        }
      }

      return {
        hasError,
        required: isRequired,
      };
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

        // Skip validation for invisible fields
        if (!getFieldVisibility(property.path, fieldConfig)) continue;

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
     * Handles field value changes and updates the form data accordingly.
     *
     * @example
     * handleFieldChange("bivClassificatie.beschikbaarheid", { isMulti: false })("Midden")
     * // Calls onFieldChange("bivClassificatie", { beschikbaarheid: "Midden", ... })
     */
    const handleFieldChange = (propertyPath, fieldConfig) => (value) => {
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
     * Renders a single form field based on its configuration and current state.returns {React.ReactElement|null} The rendered field component or null if field is not visible
     *
     * @example
     * renderField({ path: "bivClassificatie.beschikbaarheid", schema: {...}, required: true })
     * // Returns: ReactSelect component with proper configuration and validation
     */
    const renderField = (property) => {
      const { path, schema: propertySchema, required } = property;
      const fieldConfig = getFieldConfig(path, propertySchema, required);

      // Check visibility - support both boolean and function
      if (!getFieldVisibility(path, fieldConfig, propertySchema)) return null;

      const value = getNestedValue(path, formData);

      const options = getFieldOptions(path, propertySchema);
      const isLoading = getFieldLoading(path);
      const isDisabled = getFieldDisabled(path, propertySchema, fieldConfig);
      const validation = getFieldValidation(path, fieldConfig);

      // Check if there's a custom component for this field
      const CustomComponent = customFieldComponents[path];
      if (CustomComponent) {
        return (
          <CustomComponent
            // stop password managers (certain fields are called 'username' or 'email', causing unwanted interference from password managers)
            data-1p-ignore='true' // 1Password
            data-op-ignore='true' // 1Password
            data-lpignore='true' // LastPass
            data-protonpass-ignore='true' // ProtonPass
            // KeepassXC does not support it - https://github.com/keepassxreboot/keepassxc-browser/issues/1921
            data-form-type='other' // Dashlane (stops only prefilling)
            data-bwignore='true' // Bitwarden
            autocomplete='off' // rest
            // =============
            key={path}
            fieldConfig={fieldConfig}
            value={value}
            onChange={handleFieldChange(path, fieldConfig)}
            validation={validation}
            isLoading={isLoading}
            isDisabled={isDisabled}
            options={options}
            propertyName={path}
            context={context}
          />
        );
      }

      if (fieldConfig.component === 'AcFormField') {
        return (
          <AcFormField
            // stop password managers (certain fields are called 'username' or 'email', causing unwanted interference from password managers)
            data-1p-ignore='true' // 1Password
            data-op-ignore='true' // 1Password
            data-lpignore='true' // LastPass
            data-protonpass-ignore='true' // ProtonPass
            // KeepassXC does not support it - https://github.com/keepassxreboot/keepassxc-browser/issues/1921
            data-form-type='other' // Dashlane (stops only prefilling)
            data-bwignore='true' // Bitwarden
            autocomplete='off' // rest
            // =============
            tooltip={fieldConfig.description}
            key={path}
            id={`dynamic-form-field-${path}`}
            label={fieldConfig.label}
            type={fieldConfig.type}
            inputType={fieldConfig.inputType || 'text'} // Support for HTML5 input types like date, datetime-local
            onChange={handleFieldChange(path, fieldConfig)}
            value={value || ''}
            placeholder={fieldConfig.placeholder}
            disabled={isDisabled}
            {...validation}
          />
        );
      }

      if (fieldConfig.component === 'AcTextarea') {
        return (
          <AcFormField
            // stop password managers (certain fields are called 'username' or 'email', causing unwanted interference from password managers)
            data-1p-ignore='true' // 1Password
            data-op-ignore='true' // 1Password
            data-lpignore='true' // LastPass
            data-protonpass-ignore='true' // ProtonPass
            // KeepassXC does not support it - https://github.com/keepassxreboot/keepassxc-browser/issues/1921
            data-form-type='other' // Dashlane (stops only prefilling)
            data-bwignore='true' // Bitwarden
            autocomplete='off' // rest
            // =============
            tooltip={fieldConfig.description}
            key={path}
            inputClassName='textarea'
            id={`dynamic-form-field-${path}`}
            label={fieldConfig.label}
            type={fieldConfig.type}
            onChange={handleFieldChange(path, fieldConfig)}
            value={value || ''}
            placeholder={fieldConfig.placeholder}
            disabled={isDisabled}
            {...validation}
          />
        );
      }

      if (fieldConfig.component === 'ReactSelect') {
        const selectValue = fieldConfig.isMulti
          ? options?.filter((option) => value?.includes(option.value)) || []
          : options?.find((option) => option.value === value);

        return (
          <div key={`${path}-${resetKey}`}>
            <label className='utrecht-form-label'>
              <Heading
                level={4}
                className={clsx({
                  'ac-form-field-header-info': fieldConfig.description,
                })}
              >
                <div>
                  {fieldConfig.label}
                  {validation.required && (
                    <>
                      <span className='required-indicator' aria-hidden='true'>
                        *
                      </span>
                      <span className='sr-only'>(verplicht)</span>
                    </>
                  )}
                </div>
                {fieldConfig.description && (
                  <>
                    <span
                      data-tooltip-id={TOOLTIP_ID}
                      data-tooltip-content={fieldConfig.description}
                      className='info-indicator'
                      role='img'
                      aria-label={fieldConfig.description}
                    >
                      <VISUALS.INFO />
                    </span>
                  </>
                )}
              </Heading>
            </label>
            <ReactSelect
              key={`${path}-${resetKey}`}
              placeholder={fieldConfig.placeholder}
              value={selectValue}
              className={clsx(
                'ac-beheer-select',
                isDisabled && 'ac-beheer-select--disabled'
              )}
              onChange={handleFieldChange(path, fieldConfig)}
              options={options}
              isLoading={isLoading}
              isDisabled={isDisabled}
              isMulti={fieldConfig.isMulti}
              closeMenuOnSelect={fieldConfig.closeMenuOnSelect}
              {...(validation.required && {
                required: true,
              })}
              {...(!validation.required && {
                isClearable: true,
              })}
            />
          </div>
        );
      }

      return null;
    };

    // Sort top-level properties using the custom sorting logic, then flatten
    const sortedProperties = sortPropertiesByOrder(schema.properties);
    const flattenedProperties = flattenProperties(
      sortedProperties,
      '',
      topLevelRequired
    );

    /**
     * Main render section that processes and renders all form fields.
     *
     * Process:
     * 1. Sort top-level properties using custom sortPropertiesByOrder logic
     * 2. Flatten nested object properties into individual fields with dot notation paths
     * 3. Render each field using renderField() function
     * 4. Include tooltip component for field descriptions
     *
     * The flattened properties maintain the original order from the sorted top-level properties,
     * with nested properties appearing in their original order within their parent object.
     */
    return (
      <>
        {flattenedProperties.map((property) => renderField(property))}
        {/* Tooltip needs to be rendered again because the dialog is rendered in a portal at #top-layer */}
        <Tooltip id={TOOLTIP_ID} className='ac-gemma-tooltip' />
      </>
    );
  }
);

ConDynamicSchemaForm.displayName = 'ConDynamicSchemaForm';

export default ConDynamicSchemaForm;
