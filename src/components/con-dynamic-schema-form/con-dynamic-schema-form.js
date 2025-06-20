import React from 'react';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { sortPropertiesByOrder } from '@src/utilities/con-sort-properties-by-order';

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
  const getFieldOptions = (propertyName) => {
    if (optionsProviders[propertyName]) {
      return optionsProviders[propertyName];
    }
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
    const options = getFieldOptions(propertyName);
    const isLoading = getFieldLoading(propertyName);
    const isDisabled = getFieldDisabled(propertyName);
    const validation = getFieldValidation(propertyName, fieldConfig);

    if (fieldConfig.component === 'AcFormField') {
      return (
        <AcFormField
          key={propertyName}
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
            className='ac-beheer-select'
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
    </>
  );
};

export default ConDynamicSchemaForm;
