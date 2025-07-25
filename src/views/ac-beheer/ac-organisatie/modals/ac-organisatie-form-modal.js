import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS } from '@constants';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import { ConFileDropZone } from '../../import-modal/con-file-dropzone';
import { AcFlex } from '@src/atoms';
import _ from 'lodash';

const createOption = (label) => ({
  label,
  value: label,
});

const AcOrganisatieFormModal = ({
  organisatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const initialFormData = {
    contactgegevens: '',
    website: '',
    oin: '',
    beoordeling: '',
    logo: '',
    cbs: '',
    telefoonnummer: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    contactpersonen: '',
    samenwerkingen: '',
    verklaringen: '',
    id: '',
    naam: '',
    type: '',
    kvkNummer: '',
    'e-mailadres': '',
  };

  const [organisatieFormData, setOrganisatieFormData] = useState({});
  const [schema, setSchema] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const formRef = useRef();

  const [verklaringenOptions, setVerklaringenOptions] = useState([]);
  const [contactpersonenOptions, setContactpersonenOptions] = useState([]);

  const { makeRequest } = useNextcloudRequests();

  const endpoint = 'openregister/api/objects/voorzieningen/organisatie';

  const extend = [['_extend[]', 'contactgegevens']];

  const [organisaties, setOrganisaties] = useState([]);
  const samenwerkingenData = useMemo(() => {
    return organisaties
      .filter((organisatie) => organisatie?.type?.toLowerCase() === 'samenwerking')
      .filter((organisatie) => organisatie.id !== organisatieFormData?.id);
  }, [organisaties]);

  useEffect(async () => {
    const response = await makeRequest(endpoint, extend);

    const data = response.data.results;
    setOrganisaties(data);
  }, []);

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `openregister/api/schemas/organisatie`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

  // load organisatie data into the form
  useEffect(() => {
    setOrganisatieFormData({
      // initial data
      ..._.cloneDeep(initialFormData),
      // data to edit (only if data is provided and isEdit is true)
      ...(organisatie &&
        isEdit && {
          ...organisatie,
          contactgegevens: collapseExtendedObjects(organisatie.contactgegevens),
        }),
    });
  }, [organisatie, showModal]);

  const handleEditOrganisatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditOrganisatieFieldChange = (field) => (value) => {
    setOrganisatieFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      const baseUrl = endpoint;

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${baseUrl}/${organisatieFormData.id}` : baseUrl;

      // Handle logo file conversion
      let logoValue = organisatieFormData.logo || null;
      if (
        organisatieFormData.logo &&
        typeof organisatieFormData.logo.getDataUrl === 'function'
      ) {
        logoValue = await organisatieFormData.logo.getDataUrl();
      }

      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...organisatieFormData,
          contactgegevens: smartSplit(organisatieFormData.contactgegevens),
          logo: logoValue || null,
        }),
      });

      if (response.ok) {
        onSuccess?.();
        modalRef?.current?.close();
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleEditOrganisatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditOrganisatieCloseModal = () => {
    setOrganisatieFormData({
      ..._.cloneDeep(initialFormData),
    });
    setVerklaringenOptions([]);
    setContactpersonenOptions([]);
    setIsValid(false);
    setError(null);
    formRef.current?.reset(); // Reset form using ref
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditOrganisatieCloseModal);
  }, [modalRef.current]);

  const mapOrganisatieToValue = useCallback(
    (organisatie) => ({
      label: organisatie.naam,
      value: organisatie.id,
    }),
    []
  );

  const handleCreateVerklaringOption = (inputValue) => {
    const newOption = createOption(inputValue);
    setVerklaringenOptions((prev) => [...prev, newOption]);
    setOrganisatieFormData((prev) => ({
      ...prev,
      verklaringen: [...prev.verklaringen, inputValue],
    }));
  };

  const handleCreateContactpersoonOption = (inputValue) => {
    const newOption = createOption(inputValue);
    setContactpersonenOptions((prev) => [...prev, newOption]);
    setOrganisatieFormData((prev) => ({
      ...prev,
      contactpersonen: [...prev.contactpersonen, inputValue],
    }));
  };

  const renderOrganisatieFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-organisatie-modal'
      title={isEdit ? 'Organisatie bewerken' : 'Organisatie toevoegen'}
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'Opslaan',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: !isValid,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcGrid columns={2}>
        <ConDynamicSchemaForm
          ref={formRef}
          schema={schema}
          formData={{
            // Map schema properties to form data fields
            naam: organisatieFormData.naam,
            contactgegevens: organisatieFormData.contactgegevens,
            website: organisatieFormData.website,
            telefoonnummer: organisatieFormData.telefoonnummer,
            samenwerkingen: Array.isArray(organisatieFormData.samenwerkingen)
              ? organisatieFormData.samenwerkingen.map((s) => s.id || s)
              : [],
            verklaringen: organisatieFormData.verklaringen,
            'e-mailadres': organisatieFormData['e-mailadres'],
            type: organisatieFormData.type, // Include type in formData
            logo: organisatieFormData.logo, // Include logo in formData
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              naam: 'naam',
              contactgegevens: 'contactgegevens',
              website: 'website',
              telefoonnummer: 'telefoonnummer',
              samenwerkingen: 'samenwerkingen',
              verklaringen: 'verklaringen',
              'e-mailadres': 'e-mailadres',
              type: 'type',
              logo: 'logo',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setOrganisatieFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          fieldConfigs={{
            // Only hide the fields we don't want to show
            id: { visible: false },
            beschrijvingKort: { visible: false },
            beschrijvingLang: { visible: false },
            type: { visible: !isEdit }, // Only show type field when adding new organisation
            links: { visible: false },
            oin: { visible: false },
            rol: { visible: false },
            cbs: { visible: organisatieFormData.type?.toLowerCase() === 'gemeente' },
            samenwerkingen: {
              visible: false,
            },
            deelnames: {
              visible: false,
            },
            deelnemers: {
              visible: false,
            },
            kvkNummer: {
              visible: organisatieFormData.type?.toLowerCase() === 'leverancier',
            },
            contactpersonen: { visible: false },
            verklaringen: { visible: false },
          }}
          customFieldComponents={{
            logo: LogoUploadField,
          }}
          optionsProviders={{
            samenwerkingen: samenwerkingenData?.map((organisatie) => ({
              value: organisatie.id,
              label: organisatie.naam,
            })),
            verklaringen: verklaringenOptions,
            contactpersonen: contactpersonenOptions,
          }}
          loadingStates={{}}
          disabledStates={{}}
          getIsValid={handleFormValidCheck}
        />
      </AcGrid>
    </AcModal>
  );

  return renderOrganisatieFormModal;
};

export default withStore(observer(AcOrganisatieFormModal));

// Custom Logo Upload Component
export const LogoUploadField = ({
  fieldConfig,
  value,
  onChange,
  validation,
  propertyName,
}) => {
  const [logoFile, setLogoFile] = useState(null);

  const handleLogoFileSelect = (e) => {
    if (!e.target.files.length) {
      setLogoFile(null);
      onChange(null);
      return;
    }

    const file = e.target.files[0];
    file.getDataUrl = async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    };

    setLogoFile(file);
    onChange(file);
  };

  return (
    <AcFlex column>
      <label className='utrecht-form-label'>
        <h4 className='utrecht-heading-4'>
          {fieldConfig.label}
          {validation.required && (
            <>
              <span className='required-indicator' aria-hidden='true'>
                *
              </span>
              <span className='sr-only'>(verplicht)</span>
            </>
          )}
        </h4>
      </label>

      <input
        id={`fileInput-${propertyName}`}
        type='file'
        accept={[
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/svg+xml',
        ].join(',')}
        multiple={false}
        onChange={handleLogoFileSelect}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid var(--utrecht-textbox-border-color)',
          borderRadius: 'var(--utrecht-select-border-radius)',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '1em',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#f0f0f0',
            borderColor: 'var(--utrecht-button-primary-action-border-color)',
          },
        }}
      />

      <small
        style={{
          display: 'block',
          marginTop: '0.5em',
          color: 'var(--utrecht-paragraph-color)',
          fontSize: '0.85em',
          fontStyle: 'italic',
          opacity: 0.85,
          userSelect: 'none',
        }}
      >
        Toegestane bestandstypen: png, jpeg, jpg, webp, svg
      </small>
    </AcFlex>
  );
};
