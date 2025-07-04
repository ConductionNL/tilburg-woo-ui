import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS } from '@constants';
import { AcFlex, AcGrid } from '@atoms';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';
import _ from 'lodash';
import licenses from '@assets/licenses/licenses.json';
import { LogoUploadField } from '../../ac-organisatie/modals/ac-organisatie-form-modal';

const AcApplicatiesFormModal = ({
  applicatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const initialData = {
    name: '',
    description: '',
    category: '',
    referenceComponents: [],
    standards: [],
    voorzieningstype: '',
    contact: '',
    laag: '',
  };

  const [applicatieFormData, setApplicatieFormData] = useState({});
  const [schema, setSchema] = useState(null);

  const modalRef = useRef(null);

  const [referentieComponentenOptions, setReferentieComponentenOptions] = useState(
    []
  );
  const [referentieComponentenLoading, setReferentieComponentenLoading] =
    useState(false);
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenLoading, setStandaardenLoading] = useState(false);
  const [contactpersonenOptions, setContactpersonenOptions] = useState([]);
  const [contactpersonenLoading, setContactpersonenLoading] = useState(false);
  const [organisatiesOptions, setOrganisatiesOptions] = useState([]);
  const [organisatiesLoading, setOrganisatiesLoading] = useState(false);
  const [licenseOptions, setLicenseOptions] = useState([]);
  useEffect(() => {
    setLicenseOptions(
      licenses.map((license) => ({
        label: license.name,
        value: license['SPDX ID'],
      }))
    );
  }, []);

  const { makeRequest } = useNextcloudRequests();

  // get referentie componenten when modal is opened
  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/voorziening`
      );
      const data = await response.data;
      setSchema(data);
    };

    const fetchVoorzieningsTypes = async () => {
      setReferentieComponentenLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/vng-gemma/element?properties.value=Referentiecomponent&_limit=1000`
      ).finally(() => setReferentieComponentenLoading(false));

      const data = await response.data;

      setReferentieComponentenOptions(
        data.results.map((item) => ({
          value: item.identifier,
          label: item.name,
        }))
      );
    };

    const fetchContactpersonen = async () => {
      setContactpersonenLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/contactpersoon`
      ).finally(() => setContactpersonenLoading(false));

      const data = await response.data;

      setContactpersonenOptions(
        data.results.map((item) => {
          const nameParts = [
            item.voornaam,
            item.tussenvoegsel,
            item.achternaam,
          ].filter(Boolean);

          return {
            value: item.username,
            label: nameParts.join(' '),
          };
        })
      );
    };

    const fetchOrganisaties = async () => {
      setOrganisatiesLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie`
      ).finally(() => setOrganisatiesLoading(false));

      const data = await response.data;

      setOrganisatiesOptions(
        data.results.map((item) => ({
          value: item.id,
          label: item.naam || item.id,
        }))
      );
    };

    if (showModal) {
      fetchSchema();
      fetchVoorzieningsTypes();
      fetchContactpersonen();
      fetchOrganisaties();
    }
  }, [showModal]);

  // get standards when reference components are selected
  useEffect(async () => {
    if (!applicatieFormData?.referenceComponents?.length) {
      setStandaardenOptions([]);
      setStandaardenLoading(false);
      return;
    }

    setStandaardenLoading(true);

    // create query params for the voorzieningen request
    const voorzieningQueryParams = applicatieFormData.referenceComponents.map(
      (component) => ['referentieComponenten', component]
    );

    // get the voorziening with the selected reference components in the data
    const voorzieningResponse = await makeRequest(
      `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorziening`,
      voorzieningQueryParams
    );

    const voorzieningData = voorzieningResponse.data.results;

    // flatten the voorziening standaarden array
    const voorzieningStandaarden = [
      ...new Set(voorzieningData.flatMap((voorziening) => voorziening.standaarden)),
    ];

    // create query params for the standaarden request
    const standaardenQueryParams = voorzieningStandaarden.map((standaard) => [
      'id',
      standaard,
    ]);

    // if no standards are found, set the loading to false and return
    if (standaardenQueryParams.length === 0) {
      setStandaardenLoading(false);
      return;
    }

    // get the standaarden with the same id as the voorziening standaarden
    const standaardenResponse = await makeRequest(
      `${BASE_URL}/apps/openregister/api/objects/voorzieningen/standaard`,
      standaardenQueryParams
    ).finally(() => setStandaardenLoading(false));

    const standaardenData = standaardenResponse.data.results;

    // set the standaarden options
    setStandaardenOptions(
      standaardenData.map((standaard) => ({
        value: standaard.id,
        label: standaard.naam,
      }))
    );
  }, [applicatieFormData.referenceComponents]);

  const types = [
    { id: '270f7176-2bdc-4702-a037-0684b2487ab8', label: 'Voorziening' },
  ];
  const voorzieningsTypes = [
    { id: 'Toepassing', label: 'Toepassing' },
    { id: 'Platform', label: 'Platform' },
    { id: 'GeneriekComponent', label: 'GeneriekComponent' },
    { id: 'Service', label: 'Service' },
    { id: 'Anders', label: 'Anders' },
  ];
  const targetGroups = [
    'Gemeente',
    'Waterschap',
    'Provincie',
    'Ministerie',
    'Uitvoeringsorganisatie',
    'Samenwerkingsverband',
    'Leverancier',
  ];
  const laagOptions = [
    { label: '(0) Hosting', value: 'Hosting' },
    { label: '(1) Data', value: 'Data' },
    { label: '(2) Services', value: 'Services' },
    { label: '(3) Integratie', value: 'Integratie' },
    { label: '(4) Processen', value: 'Processen' },
    { label: '(5) Interactie', value: 'Interactie' },
  ];

  // load applicatie data into the form
  useEffect(() => {
    setApplicatieFormData({
      // initial data
      ..._.cloneDeep(initialData),
      // data to edit (only if data is provided and isEdit is true)
      ...(applicatie &&
        isEdit && {
          ...applicatie,
          id: applicatie.id,
          name: applicatie.naam,
          description: applicatie.beschrijving,
          category: applicatie.categorie,
          referenceComponents: smartSplit(
            collapseExtendedObjects(applicatie.referentieComponenten)
          ),
          standards: smartSplit(collapseExtendedObjects(applicatie.standaarden)),
          voorzieningstype: applicatie.voorzieningstype,
          contact: collapseExtendedObjects(applicatie.contact, 'username'),
          organisatie: collapseExtendedObjects(applicatie.organisatie, 'id'),
        }),
    });
  }, [applicatie, showModal]);

  const handleEditApplicatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditApplicatieFieldChange = (field) => (value) => {
    setApplicatieFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorziening';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${applicatieFormData.id}` : baseUrl;

    try {
      // Handle logo file conversion
      let logoValue = applicatieFormData.logo || null;
      if (
        applicatieFormData.logo &&
        typeof applicatieFormData.logo.getDataUrl === 'function'
      ) {
        logoValue = await applicatieFormData.logo.getDataUrl();
      } else {
        logoValue = null;
      }

      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...applicatieFormData,
          naam: applicatieFormData.name,
          beschrijving: applicatieFormData.description,
          categorie: applicatieFormData.category,
          referentieComponenten: applicatieFormData.referenceComponents,
          standaarden: applicatieFormData.standards,
          voorzieningstype: applicatieFormData.voorzieningstype,
          logo: logoValue || null,
        }),
      });

      if (response.ok) {
        // If this is a new application (not edit), create a version automatically
        if (!isEdit) {
          try {
            const applicatieData = await response.data;
            const currentDate = new Date().toISOString();

            // Create version 0.0.1 for the new application
            const versionResponse = await makeRequest(
              `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorzieningversie`,
              null,
              {
                method: 'POST',
                body: JSON.stringify({
                  voorziening: applicatieData.id,
                  versienummer: '0.0.1',
                  releaseDatum: currentDate,
                  status: applicatieData.status,
                  inDatumOntwikkeling: currentDate,
                }),
              }
            );

            if (!versionResponse.ok) {
              console.warn(
                'Failed to create initial version for application:',
                versionResponse
              );
            }
          } catch (versionError) {
            console.error('Error creating initial version:', versionError);
            // Don't fail the entire operation if version creation fails
          }
        }

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
      handleEditApplicatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditApplicatieCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditApplicatieCloseModal);
  }, [modalRef.current]);

  const renderApplicatiesFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-applicatie-modal'
      title={isEdit ? 'Applicatie bewerken' : 'Applicatie toevoegen'}
      layoutClassName='wide-content'
      buttons={[
        { label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit },
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
      ]}
      disableDefaultButton
    >
      <AcGrid columns={2}>
        <ConDynamicSchemaForm
          schema={schema}
          formData={{
            // Map schema properties to form data fields
            naam: applicatieFormData.name,
            beschrijving: applicatieFormData.description,
            voorzieningstype: applicatieFormData.voorzieningstype,
            referentieComponenten: applicatieFormData.referenceComponents,
            standaarden: applicatieFormData.standards,
            contact: applicatieFormData.contact,
            diensten: applicatieFormData.diensten,
            omvat: applicatieFormData.omvat,
            organisatie: applicatieFormData.organisatie,
            rol: applicatieFormData.rol,
            logo: applicatieFormData.logo,
            licentietype: applicatieFormData.licentietype,
            licentie: applicatieFormData.licentie,
            hosting: applicatieFormData.hosting,
            status: applicatieFormData.status,
          }}
          fieldConfigs={{
            licentie: {
              visible: (formData) => formData.licentietype === 'Open Source',
            },
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              naam: 'name',
              beschrijving: 'description',
              voorzieningstype: 'voorzieningstype',
              referentieComponenten: 'referenceComponents',
              standaarden: 'standards',
              contact: 'contact',
              diensten: 'diensten',
              omvat: 'omvat',
              organisatie: 'organisatie',
              rol: 'rol',
              logo: 'logo',
              licentietype: 'licentietype',
              hosting: 'hosting',
              status: 'status',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setApplicatieFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          customFieldComponents={{
            logo: LogoUploadField,
          }}
          optionsProviders={{
            voorzieningstype: voorzieningsTypes?.map((type) => ({
              value: type.id,
              label: type.label,
            })),
            licentie: licenseOptions,
            referentieComponenten: referentieComponentenOptions,
            standaarden: standaardenOptions,
            contact: contactpersonenOptions,
            organisatie: organisatiesOptions,
            diensten: [
              'Functioneel beheer',
              'Applicatie beheer',
              'Technisch beheer',
              'Implementatieondersteuning',
              'Opleidingen',
              'Reseller',
            ].map((service) => ({
              value: service,
              label: service,
            })),
            omvat: [], // This would need to be populated with available applications
          }}
          loadingStates={{
            referentieComponenten: referentieComponentenLoading,
            standaarden: standaardenLoading,
            contact: contactpersonenLoading,
            organisatie: organisatiesLoading,
          }}
          disabledStates={{
            standaarden: (formData) => !formData?.referentieComponenten?.length,
          }}
        />
      </AcGrid>
    </AcModal>
  );

  return renderApplicatiesFormModal;
};

export default withStore(observer(AcApplicatiesFormModal));
