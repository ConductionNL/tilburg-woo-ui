import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

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
    functionalities: '',
    targetGroups: [],
    referenceComponents: [],
    standards: [],
    voorzieningstype: '',
    contact: '',
  };

  const [applicatieFormData, setApplicatieFormData] = useState({});

  const modalRef = useRef(null);

  const [referentieComponentenOptions, setReferentieComponentenOptions] = useState(
    []
  );
  const [referentieComponentenLoading, setReferentieComponentenLoading] =
    useState(false);
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenLoading, setStandaardenLoading] = useState(false);
  const [gebruikersOptions, setGebruikersOptions] = useState([]);
  const [gebruikersLoading, setGebruikersLoading] = useState(false);

  const { makeRequest } = useNextcloudRequests();

  // get referentie componenten when modal is opened
  useEffect(() => {
    const fetchVoorzieningsTypes = async () => {
      setReferentieComponentenLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/vng-gemma/element?properties.value=Referentiecomponent&_limit=1000`
      ).finally(() => setReferentieComponentenLoading(false));

      const data = await response.json();

      setReferentieComponentenOptions(
        data.results.map((item) => ({
          value: item.identifier,
          label: item.name,
        }))
      );
    };

    const fetchGebruikers = async () => {
      setGebruikersLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/gebruiker`
      ).finally(() => setGebruikersLoading(false));

      const data = await response.json();

      setGebruikersOptions(
        data.results.map((item) => ({
          value: item.username,
          label: item.username,
        }))
      );
    };

    if (showModal) {
      fetchVoorzieningsTypes();
      fetchGebruikers();
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
    const voorzieningData = (await voorzieningResponse.json()).results;

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

    const standaardenData = (await standaardenResponse.json()).results;

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

  // load applicatie data into the form
  useEffect(() => {
    setApplicatieFormData({
      // initial data
      ...initialData,
      // data to edit (only if data is provided and isEdit is true)
      ...(applicatie &&
        isEdit && {
          ...applicatie,
          id: applicatie.id,
          name: applicatie.naam,
          description: applicatie.beschrijving,
          category: applicatie.categorie,
          functionalities: Array.isArray(applicatie.functionaliteiten)
            ? applicatie.functionaliteiten.join(', ')
            : applicatie.functionaliteiten,
          targetGroups: applicatie.doelgroep,
          referenceComponents: smartSplit(
            collapseExtendedObjects(applicatie.referentieComponenten)
          ),
          standards: smartSplit(collapseExtendedObjects(applicatie.standaarden)),
          voorzieningstype: applicatie.voorzieningstype,
          contact: collapseExtendedObjects(applicatie.gebruikers, 'username'),
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
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...applicatieFormData,
          naam: applicatieFormData.name,
          beschrijving: applicatieFormData.description,
          categorie: applicatieFormData.category,
          functionaliteiten: smartSplit(applicatieFormData.functionalities),
          doelgroep: applicatieFormData.targetGroups,
          referentieComponenten: applicatieFormData.referenceComponents,
          standaarden: applicatieFormData.standards,
          voorzieningstype: applicatieFormData.voorzieningstype,
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
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditApplicatieFieldChange('name')}
          value={applicatieFormData.name}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditApplicatieFieldChange('description')}
          value={applicatieFormData.description}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Applicatie type</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een applicatie type'
            value={voorzieningsTypes?.find(
              (option) => option.id === applicatieFormData?.voorzieningstype
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
                ...prev,
                voorzieningstype: e.value,
              }));
            }}
            loading={voorzieningsTypes?.length === 0}
            options={voorzieningsTypes?.map((voorzieningstype) => ({
              value: voorzieningstype.id,
              label: voorzieningstype.label,
            }))}
          />
        </div>
        <AcFormField
          label='Categorie'
          type='text'
          onBlur={handleEditApplicatieFieldChange('category')}
          value={applicatieFormData.category}
        />
        <AcFormField
          label='Functionaliteiten'
          type='text'
          onBlur={handleEditApplicatieFieldChange('functionalities')}
          value={applicatieFormData.functionalities}
        />

        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Doelgroepen</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een doelgroep'
            className='ac-beheer-select'
            isMulti
            value={applicatieFormData?.targetGroups?.map((targetGroup) => ({
              value: targetGroup,
              label: targetGroup,
            }))}
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
                ...prev,
                targetGroups: e.map((item) => item.value),
              }));
            }}
            loading={targetGroups?.length === 0}
            options={targetGroups?.map((targetGroup) => ({
              value: targetGroup,
              label: targetGroup,
            }))}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Referentie componenten</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een referentie component'
            className='ac-beheer-select'
            value={referentieComponentenOptions?.filter((option) =>
              applicatieFormData?.referenceComponents?.includes(option.value)
            )}
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
                ...prev,
                referenceComponents: e.map((item) => item.value),
              }));
            }}
            isLoading={referentieComponentenLoading}
            options={referentieComponentenOptions}
            closeMenuOnSelect={false}
            isMulti
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Standaarden</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een standaard'
            className='ac-beheer-select'
            value={standaardenOptions?.filter((option) =>
              applicatieFormData?.standards?.includes(option.value)
            )}
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
                ...prev,
                standards: e.map((item) => item.value),
              }));
            }}
            isLoading={standaardenLoading}
            options={standaardenOptions}
            isDisabled={!applicatieFormData?.referenceComponents?.length}
            closeMenuOnSelect={false}
            isMulti
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contact</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contact'
            value={gebruikersOptions?.find(
              (option) => option.value === applicatieFormData.contact
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
                ...prev,
                contact: e.value,
              }));
            }}
            loading={gebruikersLoading}
            options={gebruikersOptions}
          />
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderApplicatiesFormModal;
};

export default withStore(observer(AcApplicatiesFormModal));
