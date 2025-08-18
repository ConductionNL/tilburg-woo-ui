// eslint-disable-next-line import/no-unresolved
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS } from '@constants';
import { AcGrid, AcFlex } from '@atoms';
// eslint-disable-next-line import/no-unresolved
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';

import { collapseExtendedObjects } from '@src/utilities';
import FormModalConfigFactory from '@views/ac-beheer/core/factories/con-form-modal-config-factory.js';
import { useRefOptions } from '@src/hooks/use-ref-options';
import _ from 'lodash';

const DEFAULT_CONFIG_OVERRIDES = {};
const DEFAULT_PRE_SELECTED = {};

/**
 * Generic Form Modal Component
 * This component can handle all form modal types through configuration
 *
 * Key Features:
 * - Uses FormModalConfigFactory for type-specific configurations
 * - Automatically constructs API endpoints from beheer page config
 * - Supports dynamic options loading and field dependencies
 * - Handles field mappings between schema and internal form state
 * - Integrates with object store for schema management
 *
 * @param {Object} props - Component props
 * @param {string} props.type - The form type (e.g., 'applicaties', 'organisaties')
 * @param {Object} props.data - The data object to edit (for edit mode)
 * @param {boolean} props.showModal - Controls modal visibility
 * @param {function} props.onClose - Called when modal closes
 * @param {function} props.onSuccess - Called on successful submission
 * @param {boolean} props.isEdit - Whether this is an edit operation
 * @param {Object} props.preSelected - Pre-selected values for the form
 * @param {Object} props.configOverrides - Configuration overrides
 */
const ConGenericFormModal = ({
  store: { object, user },
  type,
  data = null,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
  preSelected = DEFAULT_PRE_SELECTED,
  configOverrides = DEFAULT_CONFIG_OVERRIDES,
  onMounted,
}) => {
  // Signal to parent that this modal component has mounted
  useEffect(() => {
    onMounted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modalRef = useRef(null);
  const formRef = useRef(null);

  // Get configuration for this form type
  const config = useMemo(() => {
    try {
      const baseConfig = FormModalConfigFactory.createConfig(type);
      // Only merge if configOverrides has actual properties
      const hasOverrides =
        configOverrides && Object.keys(configOverrides).length > 0;
      const finalConfig = hasOverrides
        ? { ...baseConfig, ...configOverrides }
        : baseConfig;
      return finalConfig;
    } catch (err) {
      console.error(`No configuration found for form type: ${type}`, err);
      return null;
    }
  }, [type, configOverrides]);

  // Form state
  const [formData, setFormData] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Options state
  const [options, setOptions] = useState({});
  const [optionsLoading, setOptionsLoading] = useState({});

  // Get current register from beheer config
  const currentRegister = config?.beheerConfig?.registerSlug;

  // Get schema type identifier
  const schemaType = config?.beheerConfig?.schemaSlug
    ? object.getSchemaType(config.beheerConfig.schemaSlug, 'form')
    : null;

  // Get schema from object store (read directly to enable MobX tracking)
  const schema = schemaType ? object.getSchema(schemaType) : null;

  // Use the ref options hook for $ref-based fields (after schema is defined)
  const {
    optionsProviders: refOptionsProviders,
    loadingStates: refLoadingStates,
    disabledStates: refDisabledStates,
    handleSearch,
  } = useRefOptions({ object, user }, currentRegister, schema, config?.fieldConfigs);

  const schemaLoading = schemaType ? object.isSchemaLoading(schemaType) : false;

  // Helper function to set options for a specific field
  const setFieldOptions = useCallback((fieldName, fieldOptions) => {
    setOptions((prev) => {
      // Check if options actually changed to prevent unnecessary updates
      const currentOptions = prev[fieldName];
      const newOptions = fieldOptions || [];

      // Compare arrays by length and content
      if (currentOptions && currentOptions.length === newOptions.length) {
        const hasChanged = !currentOptions.every(
          (item, index) => JSON.stringify(item) === JSON.stringify(newOptions[index])
        );
        if (!hasChanged) {
          return prev;
        }
      }

      return {
        ...prev,
        [fieldName]: fieldOptions,
      };
    });
  }, []);

  // Helper function to set loading state for a specific field
  const setFieldOptionsLoading = useCallback((fieldName, loading) => {
    setOptionsLoading((prev) => ({
      ...prev,
      [fieldName]: loading,
    }));
  }, []);

  // Load options for a field based on its configuration
  const loadFieldOptions = useCallback(
    async (fieldName, optionConfig) => {
      if (typeof optionConfig === 'function') {
        // Static options from function

        setFieldOptions(fieldName, optionConfig());
        return;
      }

      if (optionConfig.type === 'collection') {
        // Dynamic options from API collection

        setFieldOptionsLoading(fieldName, true);

        try {
          await object.fetchCollection(
            optionConfig.register,
            optionConfig.schema,
            { ...optionConfig.params, page: 1, limit: 9999 },
            false,
            'form-options'
          );

          const objectType = object.getTypeFromParams(
            optionConfig.register,
            optionConfig.schema,
            null,
            'form-options'
          );

          const collection = object.getCollection(objectType);
          let results = collection.results || [];

          // Apply filter if provided
          if (optionConfig.filter && typeof optionConfig.filter === 'function') {
            results = results.filter((item) => optionConfig.filter(item, formData));
          }

          // Map results to options format
          const fieldOptions = results.map((item) => ({
            value:
              typeof optionConfig.valueField === 'function'
                ? optionConfig.valueField(item)
                : item[optionConfig.valueField],
            label:
              typeof optionConfig.labelField === 'function'
                ? optionConfig.labelField(item)
                : item[optionConfig.labelField],
          }));

          setFieldOptions(fieldName, fieldOptions);
        } catch (error) {
          console.error(`Error loading options for ${fieldName}:`, error);
          setFieldOptions(fieldName, []);
        } finally {
          setFieldOptionsLoading(fieldName, false);
        }
      }
    },
    [object]
  );

  // Load all static and collection-based options when modal opens
  useEffect(() => {
    // Only run when modal is actually opened
    if (!showModal || !config) {
      return;
    }

    // Fetch schema using object store
    if (config.beheerConfig?.schemaSlug) {
      object
        .fetchSchema(config.beheerConfig.schemaSlug, null, 'form')
        .catch((error) => {
          console.error('Schema fetch failed:', error);
          setSubmitError(
            `Schema kon niet worden geladen: ${error.message || error}`
          );
        });
    }

    // Load options
    Object.entries(config.optionsProviders || {}).forEach(
      ([fieldName, optionConfig]) => {
        if (optionConfig.type !== 'dynamic') {
          loadFieldOptions(fieldName, optionConfig);
        }
      }
    );
  }, [showModal, config?.beheerConfig?.schemaSlug]);

  // Helper function to generate initial data from schema properties
  // This automatically creates form defaults based on API schema definitions
  const generateInitialDataFromSchema = useCallback((schema) => {
    if (!schema?.properties) return {};

    const schemaInitialData = {};

    Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
      // Use default value from schema if available
      if (
        fieldSchema.default !== undefined &&
        fieldSchema.default !== null &&
        fieldSchema.default !== ''
      ) {
        schemaInitialData[fieldName] = fieldSchema.default;
        return;
      }

      // Generate appropriate default based on field type
      switch (fieldSchema.type) {
        case 'string':
          schemaInitialData[fieldName] = '';
          break;
        case 'number':
        case 'integer':
          schemaInitialData[fieldName] = 0;
          break;
        case 'boolean':
          schemaInitialData[fieldName] = false;
          break;
        case 'array':
          schemaInitialData[fieldName] = [];
          break;
        case 'object':
          schemaInitialData[fieldName] = {};
          break;
        default:
          // For unknown types or null, use empty string
          schemaInitialData[fieldName] = '';
      }
    });

    return schemaInitialData;
  }, []);

  // Initialize form data when modal opens or data changes
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!config || !showModal || hasInitializedRef.current) return;
    if (schemaLoading || !schema?.properties) return; // wait for stable schema

    const schemaInitialData = generateInitialDataFromSchema(schema);

    const initialFormData = {
      // Start with schema-generated initial data
      ...schemaInitialData,
      // Override with explicit initial data from config (allows custom defaults)
      ..._.cloneDeep(config.initialData),
      // Apply pre-selected values
      ...preSelected,
      // If editing, apply the data directly (no field mappings needed)
      ...(data &&
        isEdit &&
        (() => {
          const mappedData = { ...data };

          // Handle extended objects
          Object.keys(mappedData).forEach((key) => {
            if (
              mappedData[key] &&
              typeof mappedData[key] === 'object' &&
              mappedData[key].id
            ) {
              mappedData[key] = collapseExtendedObjects(mappedData[key]);
            }
          });

          return mappedData;
        })()),
    };

    setFormData(initialFormData);
    hasInitializedRef.current = true;
  }, [
    showModal,
    config?.initialData,
    preSelected,
    schemaLoading,
    schema?.properties,
  ]);

  // Reset the guard when closing or changing type
  useEffect(() => {
    if (!showModal) hasInitializedRef.current = false;
  }, [showModal]);

  // Handle additional effects when form data changes
  const previousFormDataRef = useRef({}); // Track previous form data for dependency comparison
  useEffect(() => {
    // Only run additional effects when modal is open
    if (!showModal || !config?.additionalEffects?.length || !formData) {
      return;
    }

    config.additionalEffects.forEach((effect) => {
      const dependencies = effect.dependencies || [];

      // Check if any dependency actually changed
      const hasChangedDependency = dependencies.some((dep) => {
        const currentValue = formData[dep];
        const previousValue = previousFormDataRef.current[dep];
        return !_.isEqual(currentValue, previousValue);
      });

      if (hasChangedDependency) {
        effect.effect(formData, {
          objectStore: object,
          setOptions: setFieldOptions,
          setOptionsLoading: setFieldOptionsLoading,
        });
      }
    });

    // Update previous form data reference
    previousFormDataRef.current = { ...formData };
  }, [showModal, config?.additionalEffects, formData]);

  // Generate options providers for ConDynamicSchemaForm
  const optionsProviders = useMemo(() => {
    const providers = {};

    // Priority 1: Manual options from config
    Object.keys(config?.optionsProviders || {}).forEach((fieldName) => {
      providers[fieldName] = options[fieldName] || [];
    });

    // Priority 2: Schema-based enum options
    if (schema?.properties) {
      Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
        if (fieldSchema.enum && !providers[fieldName]) {
          providers[fieldName] = fieldSchema.enum.map((value) => ({
            value,
            label: value,
          }));
        }
      });
    }

    // Priority 3: $ref-based options from the hook
    Object.keys(refOptionsProviders || {}).forEach((fieldName) => {
      if (!providers[fieldName]) {
        providers[fieldName] = refOptionsProviders[fieldName] || [];
      }
    });

    return providers;
  }, [config, options, schema, refOptionsProviders]);

  // Generate loading states for ConDynamicSchemaForm
  const loadingStates = useMemo(() => {
    return {
      ...optionsLoading,
      ...refLoadingStates,
    };
  }, [optionsLoading, refLoadingStates]);

  // Generate field configurations for ConDynamicSchemaForm
  const fieldConfigs = useMemo(() => {
    if (!config?.fieldConfigs) return {};

    const configs = {};

    Object.entries(config.fieldConfigs).forEach(([fieldName, fieldConfig]) => {
      configs[fieldName] = {};

      // Handle dynamic configurations
      Object.entries(fieldConfig).forEach(([configKey, configValue]) => {
        if (typeof configValue === 'function') {
          configs[fieldName][configKey] = configValue(formData, isEdit);
        } else {
          configs[fieldName][configKey] = configValue;
        }
      });
    });

    return configs;
  }, [config, formData, isEdit]);

  // Handle field changes
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  // Handle form validation
  const handleFormValidCheck = useCallback((valid) => {
    setIsValid(valid);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!config || !isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform data before submission (if needed)
      const submitData = config.transformSubmitData
        ? config.transformSubmitData(formData)
        : formData;

      let response;

      if (isEdit) {
        // Update existing object using object store
        response = await object.updateObject(
          config.beheerConfig.registerSlug,
          config.beheerConfig.schemaSlug,
          data.id,
          submitData
        );
      } else {
        // Create new object using object store
        response = await object.createObject(
          config.beheerConfig.registerSlug,
          config.beheerConfig.schemaSlug,
          submitData
        );
      }

      // Handle specific logic for applicaties (creating initial version)
      if (!isEdit && type === 'applicaties') {
        try {
          const applicatieData = response;
          const currentDate = new Date().toISOString();

          // Create version 0.0.1 for the new application using object store
          await object.createObject('voorzieningen', 'voorzieningversie', {
            voorziening: applicatieData.id,
            versienummer: '0.0.1',
            releaseDatum: currentDate,
            status: applicatieData.status,
            inDatumOntwikkeling: currentDate,
          });
        } catch (versionError) {
          console.warn(
            'Failed to create initial version for application:',
            versionError
          );
          // Don't fail the entire operation if version creation fails
        }
      }

      setSubmitSuccess(
        isEdit ? 'Gegevens succesvol bijgewerkt' : 'Gegevens succesvol toegevoegd'
      );

      // Call success callback
      onSuccess?.(response);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        modalRef?.current?.close();
      }, 2000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setSubmitError(err.message || 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setIsSubmitting(false);
    }
  }, [config, isValid, formData, isEdit, data, type, object, onSuccess]);

  // Handle modal open
  const handleModalOpen = () => modalRef?.current?.showModal();

  // Handle modal close
  const handleModalClose = () => {
    if (!config) return;

    setFormData(_.cloneDeep(config.initialData));
    setIsValid(false);
    setSubmitError(null);
    setSubmitSuccess(null);
    setOptions({});
    setOptionsLoading({});
    formRef.current?.reset();
    onClose?.();
  };

  // Open modal when showModal prop changes
  useEffect(() => {
    if (showModal) {
      handleModalOpen();
    }
  }, [showModal]);

  // Add event listener for modal close
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener('close', handleModalClose);
      return () => modal.removeEventListener('close', handleModalClose);
    }
  }, [modalRef.current]);

  // Don't render if no configuration
  if (!config) {
    console.error(`No configuration found for form type: ${type}`);
    return null;
  }

  // Don't render if modal should not be shown
  if (!showModal) {
    return null;
  }

  // Generate title
  const title = isEdit
    ? `${type.charAt(0).toUpperCase() + type.slice(1)} bewerken`
    : `${type.charAt(0).toUpperCase() + type.slice(1)} toevoegen`;

  return (
    <AcModal
      ref={modalRef}
      id={`${type}-form-modal`}
      title={title}
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: isSubmitting,
        },
        {
          label: 'Opslaan',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: !isValid || isSubmitting,
          loading: isSubmitting,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      {/* Status messages */}
      {(submitError || submitSuccess) && (
        <AcFlex column spacing='sm' style={{ marginBottom: '1rem' }}>
          {submitError && (
            <Alert type='error'>
              <AcFlex spacing='sm'>
                <VISUALS.CIRCLE_EXCLAMATION />
                <Paragraph>{submitError}</Paragraph>
              </AcFlex>
            </Alert>
          )}
          {submitSuccess && (
            <Alert type='info'>
              <AcFlex spacing='sm'>
                <VISUALS.INFO_BLUE />
                <Paragraph>{submitSuccess}</Paragraph>
              </AcFlex>
            </Alert>
          )}
        </AcFlex>
      )}

      {/* Form content */}
      <AcGrid columns={2}>
        {schemaLoading ? (
          <div>Schema wordt geladen...</div>
        ) : schema ? (
          <ConDynamicSchemaForm
            ref={formRef}
            schema={schema}
            formData={formData}
            onFieldChange={handleFieldChange}
            fieldConfigs={fieldConfigs}
            customFieldComponents={config.customComponents || {}}
            optionsProviders={optionsProviders}
            loadingStates={loadingStates}
            disabledStates={refDisabledStates}
            getIsValid={handleFormValidCheck}
            honorImmutable={isEdit}
            userIsAuthenticated={user.isAuthenticated}
          />
        ) : (
          <div>
            Schema kon niet worden geladen. Controleer of het schema bestaat.
          </div>
        )}
      </AcGrid>
    </AcModal>
  );
};

export default withStore(observer(ConGenericFormModal));
