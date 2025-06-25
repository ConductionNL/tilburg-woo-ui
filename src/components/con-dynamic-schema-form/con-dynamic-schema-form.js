import React from 'react';
import clsx from 'clsx';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { sortPropertiesByOrder } from '@src/utilities/con-sort-properties-by-order';
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
 * - Custom field configurations and overrides
 * - Dynamic options providers for select fields
 * - Loading and disabled states per field
 * - Built-in validation with custom validation support
 * - Property ordering support via the `sortPropertiesByOrder` utility
 * - Dynamic visibility support based on form data and external context
 *
 * **Automatic Field Type Detection:**
 * - **Arrays**: Automatically rendered as multi-select dropdowns
 * - **Enums**: Automatically rendered as single-select dropdowns
 * - **Strings**: Rendered as text input fields
 * - **Other types**: Default to text input fields
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
 * **Dynamic Visibility:**
 * The `visible` property can be a boolean or a function that receives the current form data and context:
 * ```jsx
 * fieldConfigs={{
 *   fieldName: {
 *     visible: (formData, context) => context.isEdit === false
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
 * @example
 * ```jsx
 * const schema = {
 *   properties: {
 *     name: { type: "string", required: true },
 *     category: {
 *       type: "string",
 *       enum: ["option1", "option2"],
 *       order: 1
 *     },
 *     tags: { type: "array", order: 2 }
 *   }
 * };
 *
 * <ConDynamicSchemaForm
 *   schema={schema}
 *   formData={{ name: "Test", category: "option1" }}
 *   onFieldChange={(field, value) => console.log(field, value)}
 *   fieldConfigs={{
 *     name: { label: "Product Name" },
 *     category: {
 *       visible: (formData) => formData.type === 'active'
 *     }
 *   }}
 *   optionsProviders={{
 *     tags: [
 *       { value: "tag1", label: "Tag 1" },
 *       { value: "tag2", label: "Tag 2" }
 *     ]
 *   }}
 *   loadingStates={{ tags: true }}
 *   disabledStates={{ category: true }}
 * />
 * ```
 *
 * @param {object} props - The component props.
 * @param {object} props.schema - The JSON schema defining the form structure. Must have a `properties` object.
 * @param {object} props.schema.properties - Object containing property definitions for form fields.
 * @param {object} props.formData - The current form data object containing field values.
 * @param {(fieldName: string, value: any) => void} props.onFieldChange - Callback function called when a field value changes.
 * @param {object} props.fieldConfigs - Custom field configurations to override automatic field generation.
 * @param {object} props.optionsProviders - Dynamic options for select fields, keyed by property name.
 * @param {object} props.loadingStates - Loading states for individual fields, keyed by property name.
 * @param {object|Function} props.disabledStates - Disabled states for individual fields. Can be boolean or function receiving formData.
 * @param {object} props.validationStates - Custom validation states for individual fields.
 * @param {number} props.columns - Number of columns for the form layout (currently not implemented).
 * @param {string} props.className - Additional CSS classes for the form container.
 * @param {object} props.context - Additional context object passed to visibility functions.
 *
 * @returns {React.ReactElement|null} The rendered dynamic form component or null if no schema properties exist.
 *
 * @note The component automatically capitalizes property names for labels if no custom label is provided.
 * @note Fields with `visible: false` or `visible: (formData) => false` in their configuration are not rendered.
 * @note Multi-select fields automatically convert selected values to arrays of values.
 * @note Required fields without values will show validation errors.
 * @note The `columns` prop is currently not implemented in the component.
 *
 * @author [Author Name]
 */
const ConDynamicSchemaForm = ({
  schema,
  formData,
  onFieldChange,
  fieldConfigs = {},
  optionsProviders = {},
  loadingStates = {},
  disabledStates = {},
  validationStates = {},
  columns = 2,
  className = '',
  context = {},
}) => {
  if (!schema?.properties) return null;

  // Get the top-level required array, default to []
  const topLevelRequired = Array.isArray(schema.required) ? schema.required : [];

  // Get field configuration for a specific property
  const getFieldConfig = (propertyName, propertySchema) => {
    // Check if this property is required at the top level
    const isRequired =
      topLevelRequired.includes(propertyName) || propertySchema.required === true;

    const baseConfig = {
      label: propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
      required: isRequired,
      visible: propertySchema.visible !== false,
      description: propertySchema.description,
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
    } else if (
      propertySchema.type === 'string' &&
      optionsProviders[propertyName]?.length > 0
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
    if (fieldConfigs[propertyName]) {
      return {
        ...schemaConfig,
        ...fieldConfigs[propertyName],
      };
    }

    return schemaConfig;
  };

  // Get visibility state for a field
  const getFieldVisibility = (propertyName, fieldConfig) => {
    if (typeof fieldConfig.visible === 'function') {
      return fieldConfig.visible(formData, context);
    }
    return fieldConfig.visible !== false;
  };

  // Get options for a field
  const getFieldOptions = (propertyName, propertySchema) => {
    // Priority 1: Schema enum takes highest priority
    if (propertySchema.enum) {
      return propertySchema.enum.map((option) => ({
        value: option,
        label: option,
      }));
    }

    // Priority 2: OptionsProviders if no enum in schema
    if (optionsProviders[propertyName]) {
      return optionsProviders[propertyName];
    }

    // Priority 3: No options
    return [];
  };

  // Get loading state for a field
  const getFieldLoading = (propertyName) => {
    return loadingStates[propertyName] || false;
  };

  // Get disabled state for a field
  const getFieldDisabled = (propertyName) => {
    if (typeof disabledStates[propertyName] === 'function') {
      return disabledStates[propertyName](formData);
    }
    return disabledStates[propertyName] || false;
  };

  // Get validation state for a field
  const getFieldValidation = (propertyName, fieldConfig) => {
    if (validationStates[propertyName]) {
      return validationStates[propertyName];
    }

    const isRequired = fieldConfig.required;
    const value = formData[propertyName];

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

  // Handle field change
  const handleFieldChange = (propertyName, fieldConfig) => (value) => {
    let processedValue = value;

    // Handle multi-select values
    if (fieldConfig.isMulti && Array.isArray(value)) {
      processedValue = value.map((item) => item.value);
    } else if (fieldConfig.component === 'ReactSelect' && !fieldConfig.isMulti) {
      processedValue = value?.value;
    }

    onFieldChange(propertyName, processedValue);
  };

  // Render individual field
  const renderField = (propertyName, propertySchema) => {
    const fieldConfig = getFieldConfig(propertyName, propertySchema);

    // Check visibility - support both boolean and function
    if (!getFieldVisibility(propertyName, fieldConfig)) return null;

    const value = formData[propertyName];
    const options = getFieldOptions(propertyName, propertySchema);
    const isLoading = getFieldLoading(propertyName);
    const isDisabled = getFieldDisabled(propertyName);
    const validation = getFieldValidation(propertyName, fieldConfig);

    if (fieldConfig.component === 'AcFormField') {
      return (
        <AcFormField
          tooltip={fieldConfig.description}
          key={propertyName}
          id={`dynamic-form-field-${propertyName}`}
          label={fieldConfig.label}
          type={fieldConfig.type}
          onBlur={handleFieldChange(propertyName, fieldConfig)}
          value={value || ''}
          {...validation}
        />
      );
    }

    if (fieldConfig.component === 'AcTextarea') {
      return (
        <AcFormField
          tooltip={fieldConfig.description}
          key={propertyName}
          inputClassName='textarea'
          id={`dynamic-form-field-${propertyName}`}
          label={fieldConfig.label}
          type={fieldConfig.type}
          onBlur={handleFieldChange(propertyName, fieldConfig)}
          value={value || ''}
          {...validation}
        />
      );
    }

    if (fieldConfig.component === 'ReactSelect') {
      const selectValue = fieldConfig.isMulti
        ? options?.filter((option) => value?.includes(option.value)) || []
        : options?.find((option) => option.value === value);

      return (
        <div key={propertyName}>
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
            placeholder={fieldConfig.placeholder}
            value={selectValue}
            className={clsx(
              'ac-beheer-select',
              isDisabled && 'ac-beheer-select--disabled'
            )}
            onChange={handleFieldChange(propertyName, fieldConfig)}
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

  // Sort properties by order using the utility
  const sortedProperties = sortPropertiesByOrder(schema.properties);

  return (
    <>
      {Object.entries(sortedProperties).map(([propertyName, propertySchema]) =>
        renderField(propertyName, propertySchema)
      )}
      {/* Tooltip needs to be rendered again because the dialog is rendered in a portal at #top-layer */}
      <Tooltip id={TOOLTIP_ID} className='ac-gemma-tooltip' />
    </>
  );
};

export default ConDynamicSchemaForm;
