/**
 * Reusable field rendering utilities
 * Extracted from ConDynamicSchemaForm to enable code reuse in standalone schema-enhanced components
 */

import React from 'react';
import clsx from 'clsx';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import MDEditor from '@uiw/react-md-editor';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { TOOLTIP_ID } from '@src/index.web';

// Import field components
import JsonObjectField from '../inputs/json-object-field';
import BooleanField from '../inputs/boolean-field';
import NumberField from '../inputs/number-field';
import ArrayCommaListField from '../inputs/array-comma-list-field';
import ColorField from '../inputs/color-field';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';

import { getDefaultValue } from './defaults';
import {
  getNestedValue,
  getFieldRefSchemaSlug,
  getFieldConfig,
  getFieldVisibility,
  getFieldOptions,
  getFieldDisabled,
  getFieldValidation,
  handleFieldChange,
} from './field-utilities';

/**
 * HACK: Wrapper component for ReactSelect that listens to global options updates
 */
const ReactSelectWithGlobalHack = (props) => {
  const { fieldPath, options: propOptions, ...selectProps } = props;
  const [globalOptions, setGlobalOptions] = React.useState(propOptions || []);

  React.useEffect(() => {
    // Check if there are already options in global state
    const existingOptions = window.FORCE_DROPDOWN_UPDATE?.get(fieldPath);
    if (existingOptions && existingOptions.length > 0) {
      console.info(
        `🌍 HACK: Loading existing global options for ${fieldPath}:`,
        existingOptions
      );
      setGlobalOptions(existingOptions);
    }

    // Listen for global option updates
    const handleGlobalUpdate = (event) => {
      if (event.detail.fieldPath === fieldPath) {
        console.info(
          `🌍 HACK: Received global update for ${fieldPath}:`,
          event.detail.options
        );
        setGlobalOptions(event.detail.options);
      }
    };

    if (window.addEventListener) {
      window.addEventListener('dropdownOptionsUpdate', handleGlobalUpdate);
    }

    return () => {
      if (window.removeEventListener) {
        window.removeEventListener('dropdownOptionsUpdate', handleGlobalUpdate);
      }
    };
  }, [fieldPath]);

  // Use global options if available, otherwise fall back to prop options
  const effectiveOptions =
    globalOptions.length > 0 ? globalOptions : propOptions || [];

  return <ReactSelect {...selectProps} options={effectiveOptions} />;
};

/**
 * Renders a single form field based on its configuration and current state
 * @param {object} params - Rendering parameters
 * @param {string} params.path - Field path (dot notation for nested properties)
 * @param {object} params.propertySchema - Property schema definition
 * @param {boolean} params.required - Whether field is required
 * @param {object} params.formData - Current form data
 * @param {object} params.fieldConfigs - Custom field configurations
 * @param {object} params.customFieldComponents - Custom field components
 * @param {object} params.optionsProviders - Options providers for selects
 * @param {object} params.loadingStates - Loading states by field path
 * @param {object} params.disabledStates - Disabled states by field path
 * @param {object} params.validationStates - Validation states by field path
 * @param {function} params.onFieldChange - Field change handler
 * @param {boolean} params.userIsAuthenticated - User authentication status
 * @param {object} params.context - Additional context
 * @param {object} params.user - User object for authorization
 * @param {boolean} params.isCreateMode - Whether in create mode
 * @param {boolean} params.honorImmutable - Whether to honor immutable flags
 * @param {object} params.onSearchHandlers - Search handlers
 * @param {number} params.resetKey - Reset key for forcing re-renders
 * @param {number} params.forceRenderKey - Force render key for options updates
 * @param {object} params.touched - Touched states by field path
 * @returns {React.ReactElement|null} Rendered field or null if not visible
 */
export const renderField = ({
  path,
  propertySchema,
  required,
  formData = {},
  fieldConfigs = {},
  customFieldComponents = {},
  optionsProviders = {},
  loadingStates = {},
  disabledStates = {},
  validationStates = {},
  onFieldChange,
  userIsAuthenticated = false,
  context = {},
  user = null,
  isCreateMode = false,
  honorImmutable = false,
  onSearchHandlers = {},
  resetKey = 0,
  forceRenderKey = 0,
  touched = {},
}) => {
  // Generate field configuration
  const fieldConfig = {
    ...getFieldConfig(
      path,
      propertySchema,
      required,
      fieldConfigs,
      optionsProviders
    ),
    schema: propertySchema,
  };

  // Check visibility
  const isVisible = getFieldVisibility(
    path,
    fieldConfig,
    propertySchema,
    formData,
    userIsAuthenticated,
    context,
    user,
    isCreateMode
  );

  if (!isVisible) return null;

  // Get field value with default fallback
  let value = getNestedValue(path, formData);
  if (value === undefined) {
    value = getDefaultValue(propertySchema);
  }

  // Get field state
  const options = getFieldOptions(path, propertySchema, optionsProviders, formData);
  const isLoading = loadingStates[path] || false;
  const isDisabled = getFieldDisabled(
    path,
    propertySchema,
    fieldConfig,
    disabledStates,
    honorImmutable,
    user,
    isCreateMode,
    formData
  );
  const validation = getFieldValidation(
    path,
    fieldConfig,
    formData,
    validationStates,
    value
  );

  // Create field change handler
  const handleChange = handleFieldChange(path, fieldConfig, onFieldChange, formData);

  // Extract search handler
  const { handleSearch } = onSearchHandlers;

  // Check for custom component first
  const CustomComponent = customFieldComponents[path];
  if (CustomComponent) {
    return (
      <CustomComponent
        // Password manager prevention attributes
        data-1p-ignore='true'
        data-op-ignore='true'
        data-lpignore='true'
        data-protonpass-ignore='true'
        data-form-type='other'
        data-bwignore='true'
        autocomplete='off'
        key={path}
        fieldConfig={fieldConfig}
        value={value}
        onChange={handleChange}
        validation={validation}
        isLoading={isLoading}
        isDisabled={isDisabled}
        options={options}
        propertyName={path}
        context={context}
      />
    );
  }

  // Handle file upload fields (triggered by type="file" or format="base64" etc.)
  if (
    propertySchema.type === 'file' ||
    fieldConfig.type === 'file' ||
    fieldConfig.component === 'File' ||
    fieldConfig.inputType === 'file' ||
    propertySchema.format === 'base64' ||
    (propertySchema.type === 'string' &&
      (propertySchema.format === 'binary' || propertySchema.format === 'byte'))
  ) {
    // Extract filename field from path (assume fieldname + "Filename")
    const filenamePath = path + 'Filename';
    const filenameValue = getNestedValue(filenamePath, formData);

    return (
      <LogoUploadField
        key={path}
        fieldConfig={{
          label: fieldConfig.label,
          description: fieldConfig.description,
          filename: filenameValue,
          required: validation.required,
        }}
        _value={value}
        onChange={(dataUrl) => {
          handleChange(dataUrl);
        }}
        onChangeFileName={(filename) => {
          // Update filename field if it exists in formData structure
          if (onFieldChange) {
            onFieldChange(filenamePath, filename);
          }
        }}
        onClear={() => {
          handleChange('');
          if (onFieldChange) {
            onFieldChange(filenamePath, '');
          }
        }}
        validation={validation}
        propertyName={path}
        isDisabled={isDisabled}
        placeholder={fieldConfig.placeholder}
      />
    );
  }

  // Render based on component type
  if (fieldConfig.component === 'Boolean') {
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
        <BooleanField
          key={path}
          label="Ja/Nee"
          value={!!value}
          onChange={handleChange}
          disabled={isDisabled}
        />
      </div>
    );
  }

  if (fieldConfig.component === 'Number') {
    return (
      <NumberField
        key={path}
        path={path}
        label={fieldConfig.label}
        value={value}
        onChange={handleChange}
        placeholder={fieldConfig.placeholder}
        disabled={isDisabled}
        required={validation.required}
        schema={propertySchema}
        integer={fieldConfig.integer}
        validation={validation}
      />
    );
  }

  if (fieldConfig.component === 'Color') {
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
        <ColorField
          key={path}
          path={path}
          label={fieldConfig.label}
          value={value}
          onChange={handleChange}
          placeholder={fieldConfig.placeholder}
          disabled={isDisabled}
          required={validation.required}
          colorFormat={fieldConfig.colorFormat}
        />
      </div>
    );
  }

  if (fieldConfig.component === 'JsonObject') {
    return (
      <JsonObjectField
        key={path}
        path={path}
        label={fieldConfig.label}
        value={value}
        onChange={handleChange}
        placeholder={fieldConfig.placeholder}
        disabled={isDisabled}
      />
    );
  }

  if (fieldConfig.component === 'WysiwygMarkdown') {
    return (
      <div key={`${path}-${resetKey}`} className='con-wysiwyg-markdown-field'>
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
              <span
                data-tooltip-id={TOOLTIP_ID}
                data-tooltip-content={fieldConfig.description}
                className='info-indicator'
                role='img'
                aria-label={fieldConfig.description}
              >
                <VISUALS.INFO />
              </span>
            )}
          </Heading>
        </label>
        <MDEditor
          value={value || ''}
          onChange={(val) => handleChange(val || '')}
          data-color-mode='light'
          visibleDragBar={false}
          preview='live'
          hideToolbar={isDisabled}
          // Stops the toolbar from being focused when tabbing through the form
          commandsFilter={(cmd) => ({
            ...cmd,
            buttonProps: { ...(cmd.buttonProps || {}), tabIndex: -1 },
          })}
        />
      </div>
    );
  }

  if (fieldConfig.component === 'AcFormField') {
    return (
      <AcFormField
        // Password manager prevention attributes
        data-1p-ignore='true'
        data-op-ignore='true'
        data-lpignore='true'
        data-protonpass-ignore='true'
        data-form-type='other'
        data-bwignore='true'
        autocomplete='off'
        tooltip={fieldConfig.description}
        key={path}
        id={`dynamic-form-field-${path}`}
        label={fieldConfig.label}
        type={fieldConfig.type}
        inputType={fieldConfig.inputType || 'text'}
        onChange={handleChange}
        value={value ?? ''}
        placeholder={fieldConfig.placeholder}
        disabled={isDisabled}
        touched={touched}
        touchedKey={path}
        minLength={propertySchema?.minLength ?? undefined}
        maxLength={propertySchema?.maxLength ?? undefined}
        pattern={propertySchema?.pattern || undefined}
        {...validation}
      />
    );
  }

  if (fieldConfig.component === 'AcTextarea') {
    return (
      <AcFormField
        // Password manager prevention attributes
        data-1p-ignore='true'
        data-op-ignore='true'
        data-lpignore='true'
        data-protonpass-ignore='true'
        data-form-type='other'
        data-bwignore='true'
        autocomplete='off'
        tooltip={fieldConfig.description}
        key={path}
        inputClassName='textarea'
        id={`dynamic-form-field-${path}`}
        label={fieldConfig.label}
        type={fieldConfig.type}
        onChange={handleChange}
        value={value || ''}
        placeholder={fieldConfig.placeholder}
        disabled={isDisabled}
        touched={touched}
        touchedKey={path}
        {...validation}
      />
    );
  }

  // Array comma list fallback when array has no enum/optionsProviders
  if (propertySchema.type === 'array') {
    const fieldOptions = getFieldOptions(
      path,
      propertySchema,
      optionsProviders,
      formData
    );
    if (!propertySchema.items?.$ref && fieldOptions.length === 0) {
      const itemsType = propertySchema.items?.type;
      return (
        <ArrayCommaListField
          key={path}
          path={path}
          label={fieldConfig.label}
          value={value}
          onChange={handleChange}
          placeholder={fieldConfig.placeholder}
          disabled={isDisabled}
          itemsType={itemsType}
        />
      );
    }
  }

  if (fieldConfig.component === 'ReactSelect') {
    const selectValue = fieldConfig.isMulti
      ? options?.filter((option) => value?.includes(option.value)) || []
      : options?.find((option) => option.value === value);

    // Automatically enable search for $ref fields
    const isRefField = getFieldRefSchemaSlug(propertySchema) !== null;
    const shouldBeSearchable = isRefField || fieldConfig.isSearchable;

    return (
      <div key={`${path}-${resetKey}`}>
        {!fieldConfig.hideLabel && (
          <label className='utrecht-form-label'>
            <Heading
              level={4}
              className={clsx({
                'ac-form-field-header-info':
                  fieldConfig.description && !fieldConfig.hideDescription,
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
              {!fieldConfig.hideDescription && fieldConfig.description && (
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
        )}
        <ReactSelectWithGlobalHack
          key={`${path}-${resetKey}-${forceRenderKey}`}
          fieldPath={path}
          placeholder={fieldConfig.placeholder}
          value={selectValue}
          className={clsx(
            'ac-beheer-select',
            isDisabled && 'ac-beheer-select--disabled'
          )}
          onChange={handleChange}
          options={options}
          isLoading={isLoading}
          isDisabled={isDisabled}
          isMulti={fieldConfig.isMulti}
          closeMenuOnSelect={fieldConfig.closeMenuOnSelect}
          isSearchable={shouldBeSearchable}
          onInputChange={
            handleSearch && getFieldRefSchemaSlug(propertySchema)
              ? (inputValue, actionMeta) => {
                  // Only trigger search for user input
                  if (
                    actionMeta.action === 'input-change' &&
                    inputValue &&
                    inputValue.length > 1 &&
                    !isLoading
                  ) {
                    const refSchemaSlug = getFieldRefSchemaSlug(propertySchema);
                    handleSearch(path, refSchemaSlug, inputValue);
                  }
                }
              : undefined
          }
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
