import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import AcModal from '@components/ac-modal/ac-modal';
import { VISUALS } from '@constants';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import ConDynamicSchemaForm from '@components/con-dynamic-schema-form/con-dynamic-schema-form';
import FormModalConfigFactory from '@views/ac-beheer/core/factories/con-form-modal-config-factory.js';
import { useRefOptions } from '@src/hooks/use-ref-options';
import _ from 'lodash';
import {
  collapseExtendedObjects,
  uploadFileToObject,
  isDataUrlNeedingUpload,
} from '@src/utilities';
import { AcFlex } from '@atoms';

const DEFAULT_CONFIG_OVERRIDES = {};
const DEFAULT_PRE_SELECTED = {};

const AcMyAccountDynamicModal = ({
  store: { object, user },
  showModal = false,
  onClose,
  onSuccess,
  data = null,
  //   formData: initialFormData,
  type,
  configOverrides = DEFAULT_CONFIG_OVERRIDES,
  isEdit = false,
  preSelected = DEFAULT_PRE_SELECTED,
  metadata = {},
}) => {
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

  const [formData, setFormData] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [showSuccessCountdown, setShowSuccessCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);

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

  // Generate disabled states for pre-selected fields
  const preSelectedDisabledStates = useMemo(() => {
    const disabledStates = {};

    // Automatically disable any pre-selected fields to prevent user modification
    Object.keys(preSelected || {}).forEach((fieldName) => {
      disabledStates[fieldName] = true;
    });

    return disabledStates;
  }, [preSelected]);

  // Use the ref options hook for $ref-based fields (after schema is defined)
  const {
    optionsProviders: refOptionsProviders,
    loadingStates: refLoadingStates,
    disabledStates: refDisabledStates,
    handleSearch,
  } = useRefOptions(
    { object, user },
    currentRegister,
    schema,
    config?.fieldConfigs,
    {
      preSelected,
      preSelectedLabels: metadata?.preSelectedLabels || {},
    }
  );

  // Merge pre-selected disabled states with ref disabled states
  const combinedDisabledStates = useMemo(
    () => ({
      ...refDisabledStates,
      ...preSelectedDisabledStates,
    }),
    [refDisabledStates, preSelectedDisabledStates]
  );

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
    },
    [object]
  );

  // Load all static and collection-based options when modal opens
  useEffect(() => {
    // Only run when modal is actually opened and type is not 'init'
    if (!showModal || !config || type === 'init') {
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
  }, [showModal, config?.beheerConfig?.schemaSlug, type]);

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
    if (!config || !showModal || hasInitializedRef.current || type === 'init')
      return;
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
      // Ensure UI-only fields are preserved (logoFilename, logoAccessUrl, etc.)
      // These might be overwritten by server data which doesn't have them
      ...(isEdit && {
        logoFilename: data?.logoFilename || '',
        logoAccessUrl: data?.logoAccessUrl || '',
      }),
    };

    setFormData(initialFormData);
    hasInitializedRef.current = true;

    // Fetch logo file metadata if editing and logo exists
    if (isEdit && data?.logo && data?.id && !isDataUrlNeedingUpload(data.logo)) {
      (async () => {
        try {
          const filesResponse = await fetch(
            `${window.location.origin}/api/apps/openregister/api/objects/${config.beheerConfig.registerSlug}/${config.beheerConfig.schemaSlug}/${data.id}/files`
          );
          if (filesResponse.ok) {
            const filesData = await filesResponse.json();
            const files = filesData.results || [];
            // Find the logo file
            const logoFile = files.find(
              (f) =>
                f.title?.toLowerCase().includes('logo') ||
                f.name?.toLowerCase().includes('logo')
            );
            if (logoFile) {
              setFormData((prev) => ({
                ...prev,
                logoFilename: logoFile.title || logoFile.name || 'logo.png',
                logoAccessUrl: logoFile.accessUrl || null,
              }));
            }
          }
        } catch (error) {
          console.warn('Failed to fetch logo metadata:', error);
        }
      })();
    }
  }, [
    showModal,
    config?.initialData,
    preSelected,
    schemaLoading,
    schema?.properties,
    type,
  ]);

  // Reset the guard when closing or changing type
  useEffect(() => {
    if (!showModal) hasInitializedRef.current = false;
  }, [showModal]);

  // Handle additional effects when form data changes
  const previousFormDataRef = useRef({}); // Track previous form data for dependency comparison
  useEffect(() => {
    // Only run additional effects when modal is open and type is not 'init'
    if (
      !showModal ||
      !config?.additionalEffects?.length ||
      !formData ||
      type === 'init'
    ) {
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
  }, [showModal, config?.additionalEffects, formData, type]);

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

  // Merge options providers to prevent unnecessary re-renders
  const combinedOptionsProviders = useMemo(
    () => ({
      ...optionsProviders,
      ...refOptionsProviders,
    }),
    [optionsProviders, refOptionsProviders]
  );

  // Merge loading states to prevent unnecessary re-renders
  const combinedLoadingStates = useMemo(
    () => ({
      ...loadingStates,
      ...refLoadingStates,
    }),
    [loadingStates, refLoadingStates]
  );

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
    if (!config || !isValid || type === 'init') return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform data before submission (if needed)
      let submitData = config.transformSubmitData
        ? config.transformSubmitData(formData)
        : formData;

      // Check if logo field contains a data URL (base64) that needs to be uploaded
      const hasLogoDataUrl = isDataUrlNeedingUpload(submitData.logo);

      let response;

      if (isEdit) {
        // Step 1: If logo is a data URL, upload it first via filesMultipart
        let logoDownloadUrl = null;
        if (hasLogoDataUrl) {
          const uploadResult = await uploadFileToObject(
            submitData.logo,
            config.beheerConfig.registerSlug,
            config.beheerConfig.schemaSlug,
            data.id,
            'logo',
            submitData.logoFilename || 'logo.png'
          );

          // Get the download URL from the upload response (use downloadUrl for images)
          if (uploadResult && uploadResult.fileData?.downloadUrl) {
            logoDownloadUrl = uploadResult.fileData.downloadUrl;
          }
        }

        // Step 2: Prepare update payload with all form data
        const updatePayload = { ...submitData };

        // Remove logo from payload if it was uploaded (don't send base64)
        if (hasLogoDataUrl) {
          delete updatePayload.logo;
        }

        // Always strip UI-only fields
        delete updatePayload.logoFilename;
        delete updatePayload.logoAccessUrl;

        // Step 3: Send the PATCH to update the object
        response = await object.updateObject(
          config.beheerConfig.registerSlug,
          config.beheerConfig.schemaSlug,
          data.id,
          updatePayload
        );

        // Step 4: Update with downloadUrl if logo was uploaded
        if (logoDownloadUrl) {
          await object.updateObject(
            config.beheerConfig.registerSlug,
            config.beheerConfig.schemaSlug,
            data.id,
            { logo: logoDownloadUrl }
          );
        }
      } else {
        // Step 1: Create new object without logo
        const createData = hasLogoDataUrl
          ? { ...submitData, logo: undefined }
          : submitData;

        // Always strip UI-only fields
        delete createData.logoFilename;
        delete createData.logoAccessUrl;

        response = await object.createObject(
          config.beheerConfig.registerSlug,
          config.beheerConfig.schemaSlug,
          createData
        );

        // Step 2: Upload logo if it's a data URL and we got a response with an ID
        // The backend will automatically link the file to the logo field
        if (hasLogoDataUrl && response?.id) {
          const uploadResult = await uploadFileToObject(
            submitData.logo,
            config.beheerConfig.registerSlug,
            config.beheerConfig.schemaSlug,
            response.id,
            'logo',
            submitData.logoFilename || 'logo.png'
          );

          // If we got a downloadUrl, update the object with the logo URL
          if (uploadResult && uploadResult.fileData?.downloadUrl) {
            await object.updateObject(
              config.beheerConfig.registerSlug,
              config.beheerConfig.schemaSlug,
              response.id,
              { logo: uploadResult.fileData.downloadUrl }
            );
          }
        }
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

      // Handle outgoing relationship updates
      if (
        !isEdit &&
        metadata?.isOutgoing &&
        metadata?.currentObjectId &&
        metadata?.relationshipField
      ) {
        try {
          // Get the current object to update - use the CURRENT object's register/schema, not the target's
          const currentObjectRegister =
            metadata.currentObjectRegister || config.beheerConfig.registerSlug;
          const currentObjectSchema = metadata.currentObjectSchema || 'voorziening'; // fallback for products

          // Try different type suffixes to find the object in the store
          const possibleTypes = [
            object.getTypeFromParams(
              currentObjectRegister,
              currentObjectSchema,
              metadata.currentObjectId,
              null
            ), // details page
            object.getTypeFromParams(
              currentObjectRegister,
              currentObjectSchema,
              null,
              'list'
            ), // list page
            object.getTypeFromParams(
              currentObjectRegister,
              currentObjectSchema,
              null,
              null
            ), // generic
            `${currentObjectRegister}_${currentObjectSchema}`, // simple format
          ];

          let currentObject = null;

          for (const objectType of possibleTypes) {
            currentObject = object.getObject(objectType, metadata.currentObjectId);
            if (currentObject) {
              break;
            }
          }

          // If object not found in store, try to fetch it fresh
          if (!currentObject) {
            try {
              await object.fetchObject(
                currentObjectRegister,
                currentObjectSchema,
                metadata.currentObjectId
              );
              // Try to find it again after fetching
              for (const objectType of possibleTypes) {
                currentObject = object.getObject(
                  objectType,
                  metadata.currentObjectId
                );
                if (currentObject) {
                  break;
                }
              }
            } catch (fetchError) {
              console.warn('Failed to fetch current object:', fetchError);
            }
          }

          if (currentObject) {
            const currentFieldValue = currentObject[metadata.relationshipField];
            let updatedFieldValue;

            // Helper function to extract ID from value (handle both objects and strings)
            const extractId = (value) => {
              if (typeof value === 'string') return value;
              if (typeof value === 'object' && value?.id) return value.id;
              if (typeof value === 'object' && value?.['@self']?.id)
                return value['@self'].id;
              return value;
            };

            if (Array.isArray(currentFieldValue)) {
              // Convert existing extended objects to IDs and add new ID
              const existingIds = currentFieldValue.map(extractId).filter(Boolean);
              updatedFieldValue = [...existingIds, response.id];
            } else if (
              currentFieldValue === null ||
              currentFieldValue === undefined
            ) {
              // Initialize as array with new item
              updatedFieldValue = [response.id];
            } else {
              // Field exists but not array - convert to array with extracted ID
              const existingId = extractId(currentFieldValue);
              updatedFieldValue = existingId
                ? [existingId, response.id]
                : [response.id];
            }

            // Update the current object using PATCH (partial update)
            // Create a clean object with ONLY the field we want to update
            const patchData = {};
            patchData[metadata.relationshipField] = updatedFieldValue;

            await object.patchObject(
              currentObjectRegister,
              currentObjectSchema,
              metadata.currentObjectId,
              patchData
            );

            // Refresh the current object to get the updated relationship
            await object.fetchObject(
              currentObjectRegister,
              currentObjectSchema,
              metadata.currentObjectId,
              { '_extend[]': ['@self.schema'] }
            );

            // Also refresh the related data (uses/used) to show the new item in tabs
            await object.setActiveObject(
              currentObjectRegister,
              currentObjectSchema,
              {
                id: metadata.currentObjectId,
              }
            );
          } else {
            console.error(
              '❌ Could not find current object in store after all attempts:',
              {
                searchedTypes: possibleTypes,
                currentObjectId: metadata.currentObjectId,
                register: currentObjectRegister,
                schema: currentObjectSchema,
              }
            );
          }
        } catch (relationshipError) {
          console.error(
            '❌ Failed to update outgoing relationship:',
            relationshipError
          );
          // Don't fail the entire operation if relationship update fails
        }
      }

      setSubmitSuccess(
        isEdit ? 'Gegevens succesvol bijgewerkt' : 'Gegevens succesvol toegevoegd'
      );

      // Show success countdown instead of just timeout
      setShowSuccessCountdown(true);
      setCountdownSeconds(3);

      // Call success callback
      onSuccess?.(response);
    } catch (err) {
      console.error('Error submitting form:', err);
      setSubmitError(err.message || 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setIsSubmitting(false);
    }
  }, [config, isValid, formData, isEdit, data, type, object, onSuccess]);

  // Countdown effect for success state
  useEffect(() => {
    if (showSuccessCountdown && countdownSeconds > 0) {
      const timer = setTimeout(() => {
        setCountdownSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessCountdown && countdownSeconds === 0) {
      modalRef?.current?.close();
    }
  }, [showSuccessCountdown, countdownSeconds]);

  // Generate modal buttons based on current state
  const getModalButtons = () => {
    // If success countdown is active, show countdown button
    if (showSuccessCountdown) {
      const plural = countdownSeconds === 1 ? '' : 'n';
      return [
        {
          label: `Formulier sluit over ${countdownSeconds} seconde${plural}`,
          icon: <VISUALS.CHECK />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'primary',
          disabled: false,
        },
      ];
    }

    // Default form buttons
    return [
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
    ];
  };

  // Handle modal close
  const handleModalClose = () => {
    if (!config) return;

    setFormData(_.cloneDeep(config.initialData));
    setIsValid(false);
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowSuccessCountdown(false);
    setCountdownSeconds(3);
    setOptions({});
    setOptionsLoading({});
    formRef.current?.reset();
    onClose?.();
  };

  // Add event listener for modal close
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener('close', handleModalClose);
      return () => modal.removeEventListener('close', handleModalClose);
    }
  }, [modalRef.current]);

  // Generate title - prefer schema title over type slug
  const schemaTitle = schema?.title || type.charAt(0).toUpperCase() + type.slice(1);
  const title = isEdit ? `${schemaTitle} bewerken` : `${schemaTitle} toevoegen`;

  useEffect(() => {
    if (showModal) {
      setFormData(data);
      modalRef?.current?.showModal();
    }
  }, [showModal, data]);

  return (
    <AcModal
      ref={modalRef}
      id={`${type}-form-modal`}
      title={title}
      layoutClassName='wide-content'
      buttons={getModalButtons()}
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

      {/* Form content - hide during success countdown */}
      {!showSuccessCountdown && (
        <div className='con-dynamic-form-container'>
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
              optionsProviders={combinedOptionsProviders}
              loadingStates={combinedLoadingStates}
              disabledStates={combinedDisabledStates}
              getIsValid={handleFormValidCheck}
              honorImmutable={isEdit}
              userIsAuthenticated={user.isAuthenticated}
              user={user}
              isCreateMode={!isEdit}
              onSearchHandlers={{ handleSearch }}
            />
          ) : (
            <div>
              Schema kon niet worden geladen. Controleer of het schema bestaat.
            </div>
          )}
        </div>
      )}
    </AcModal>
  );
};

export default withStore(observer(AcMyAccountDynamicModal));
