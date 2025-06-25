import React from 'react';
import clsx from 'clsx';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { sortPropertiesByOrder } from '@src/utilities/con-sort-properties-by-order';
import { Tooltip } from 'react-tooltip';
import { TOOLTIP_ID } from '@src/index.web';

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
 *     visible: true,
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
 *     name: { label: "Product Name" }
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
 *
 * @returns {React.ReactElement|null} The rendered dynamic form component or null if no schema properties exist.
 *
 * @note The component automatically capitalizes property names for labels if no custom label is provided.
 * @note Fields with `visible: false` in their configuration are not rendered.
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
}) => {
  if (!schema?.properties) return null;

  // Get field configuration for a specific property
  const getFieldConfig = (propertyName, propertySchema) => {
    // Use custom field config if provided
    if (fieldConfigs[propertyName]) {
      return fieldConfigs[propertyName];
    }

    const baseConfig = {
      label: propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
      required: propertySchema.required || false,
      visible: propertySchema.visible !== false,
      description: propertySchema.description,
    };

    // Handle different field types based on schema
    if (propertySchema.type === 'array') {
      return {
        ...baseConfig,
        type: 'multiSelect',
        component: 'ReactSelect',
        isMulti: true,
        closeMenuOnSelect: false,
        placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
      };
    }

    if (propertySchema.enum) {
      return {
        ...baseConfig,
        type: 'select',
        component: 'ReactSelect',
        options: propertySchema.enum.map((option) => ({
          value: option,
          label: option,
        })),
        placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
      };
    }

    // Check if options are provided externally for string fields
    if (
      propertySchema.type === 'string' &&
      optionsProviders[propertyName]?.length > 0
    ) {
      return {
        ...baseConfig,
        type: 'select',
        component: 'ReactSelect',
        placeholder: `Selecteer ${baseConfig.label.toLowerCase()}`,
      };
    }

    if (propertySchema.type === 'string') {
      return {
        ...baseConfig,
        type: 'text',
        component: 'AcFormField',
      };
    }

    return {
      ...baseConfig,
      type: 'text',
      component: 'AcFormField',
    };
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
    const hasError = isRequired && !value;

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
    if (!fieldConfig.visible) return null;

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

    if (fieldConfig.component === 'ReactSelect') {
      const selectValue = fieldConfig.isMulti
        ? options?.filter((option) => value?.includes(option.value)) || []
        : options?.find((option) => option.value === value);

      return (
        <div key={propertyName}>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>{fieldConfig.label}</h4>
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
