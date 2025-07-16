import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS } from '@constants';
import { AcCheckbox, AcFormField } from '@src/molecules';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';
import ReactSelect from 'react-select';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import clsx from 'clsx';
import { DateInput } from '@amsterdam/design-system-react';
import _ from 'lodash';

const AcGebruikenFormModal = ({
  gebruik,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
  preSelectedOrganisatieId = '',
  preSelectedVoorzieningId = '',
}) => {
  const modalRef = useRef(null);

  const initialData = {
    organisatieId: '',
    voorzieningId: '',
    versieId: '',
    // beheerder: {
    //   naam: '',
    //   email: '',
    //   telefoon: '',
    //   functie: '',
    // },
    beheerder: '',
    eigenaar: '',
    startDatum: '',
    status: '',
    bbnScore: '',
    ibpScore: '',
    bivClassificatie: {
      beschikbaarheid: '',
      integriteit: '',
      vertrouwelijkheid: '',
    },
    bedrijfsKritisch: false,
    privacyGevoelig: false,
    hosting: '',
    contact: '',
  };

  const hostingOptions = [
    { label: 'On-premises', value: 'on-premises' },
    { label: 'SaaS', value: 'SaaS' },
    { label: 'PaaS', value: 'PaaS' },
    { label: 'hybride', value: 'hybride' },
  ];

  const [gebruikFormData, setGebruikFormData] = useState({});
  const [schema, setSchema] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const [organisatieOptions, setOrganisatieOptions] = useState([]);
  const [organisatieLoading, setOrganisatieLoading] = useState(false);
  const [voorzieningenOptions, setVoorzieningenOptions] = useState([]);
  const [voorzieningenLoading, setVoorzieningenLoading] = useState(false);
  const [versiesOptions, setVersiesOptions] = useState([]); // based on selected voorziening
  const [versiesLoading, setVersiesLoading] = useState(false);
  const [contactpersonenOptions, setContactpersonenOptions] = useState([]);
  const [contactpersonenLoading, setContactpersonenLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const { makeRequest } = useNextcloudRequests();

  useEffect(() => {
    const fetchOrganisaties = async () => {
      try {
        setOrganisatieLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie`
        );
        const data = response.data.results;
        setOrganisatieOptions(
          data.map((item) => ({
            label: item.naam ?? item.id,
            value: item.id,
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setOrganisatieLoading(false);
      }
    };

    const fetchVoorzieningen = async () => {
      try {
        setVoorzieningenLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorziening`
        );
        const data = response.data.results;
        const voorzieningenOptions = data.map((item) => ({
          label: item.naam,
          value: item.id,
        }));
        setVoorzieningenOptions(voorzieningenOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setVoorzieningenLoading(false);
      }
    };

    const fetchSchema = async () => {
      try {
        setSchemaLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/voorzieninggebruik`
        );
        const data = response.data;
        setSchema(data);
      } catch (error) {
        console.error(error);
      } finally {
        setSchemaLoading(false);
      }
    };

    const fetchContactpersonen = async () => {
      setContactpersonenLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/contactpersoon`
      ).finally(() => setContactpersonenLoading(false));

      const data = response.data.results;

      setContactpersonenOptions(
        data.map((item) => {
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

    if (showModal) {
      fetchOrganisaties();
      fetchVoorzieningen();
      fetchSchema();
      fetchContactpersonen();
    }
  }, [showModal]);

  // get versies
  useEffect(async () => {
    try {
      setVersiesLoading(true);
      const aanbodResponse = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorzieningaanbod?voorziening=${gebruikFormData.voorzieningId}`
      );
      const data = aanbodResponse.data.results;
      const aanbodIds = data.map((item) => item.id);

      if (!aanbodIds.length) {
        setVersiesLoading(false);
        return;
      }

      const versieResponse = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorzieningversie`,
        aanbodIds.map((id) => ['voorzieningaanbod[]', id])
      );
      const versies = versieResponse.data.results;

      setVersiesOptions(
        versies.map((item) => ({
          label: item.versienummer,
          value: item.id,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setVersiesLoading(false);
    }
  }, [gebruikFormData.voorzieningId]);

  useEffect(() => {
    setGebruikFormData({
      ..._.cloneDeep(initialData),
      // set pre selected values
      organisatieId: preSelectedOrganisatieId,
      voorzieningId: preSelectedVoorzieningId,
      // if edit modal
      ...(gebruik &&
        isEdit && {
          ...gebruik,
          voorzieningId: collapseExtendedObjects(gebruik.voorzieningId),
          versieId: collapseExtendedObjects(gebruik.versieId),
          organisatieId: collapseExtendedObjects(gebruik.organisatieId),
          contact: collapseExtendedObjects(gebruik.contact, 'username'),
        }),
    });
  }, [gebruik, isEdit]);

  const handleEditGebruikOpenModal = () => modalRef?.current?.showModal();

  const handleEditGebruikFieldChange = (field) => (value) => {
    setGebruikFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieninggebruik';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${gebruikFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...gebruikFormData,
          ...(gebruikFormData.status &&
            gebruikFormData.status !== (gebruik?.status || initialData.status) && {
              [`startDatum${gebruikFormData.status}`]: new Date().toISOString(),
            }),
        }),
      });

      if (response.ok) {
        onSuccess?.(response);
        modalRef?.current?.close();
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleEditGebruikOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditGebruikCloseModal = () => {
    setGebruikFormData(initialData);
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditGebruikCloseModal);
  }, [modalRef.current]);

  const renderGebruikFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-gebruik-modal'
      title={isEdit ? 'Gebruik bewerken' : 'Gebruik toevoegen'}
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'opslaan',
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
          schema={schema}
          formData={{
            // Map schema properties to form data fields
            organisatieId: gebruikFormData.organisatieId,
            voorzieningId: gebruikFormData.voorzieningId,
            versieId: gebruikFormData.versieId,
            beheerder: gebruikFormData.beheerder,
            eigenaar: gebruikFormData.eigenaar,
            startDatum: gebruikFormData.startDatum,
            status: gebruikFormData.status,
            bbnScore: gebruikFormData.bbnScore,
            ibpScore: gebruikFormData.ibpScore,
            bivClassificatie: gebruikFormData.bivClassificatie,
            bedrijfsKritisch: gebruikFormData.bedrijfsKritisch,
            privacyGevoelig: gebruikFormData.privacyGevoelig,
            hosting: gebruikFormData.hosting,
            contact: gebruikFormData.contact,
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              organisatieId: 'organisatieId',
              voorzieningId: 'voorzieningId',
              versieId: 'versieId',
              beheerder: 'beheerder',
              eigenaar: 'eigenaar',
              startDatum: 'startDatum',
              status: 'status',
              bbnScore: 'bbnScore',
              ibpScore: 'ibpScore',
              bivClassificatie: 'bivClassificatie',
              bedrijfsKritisch: 'bedrijfsKritisch',
              privacyGevoelig: 'privacyGevoelig',
              hosting: 'hosting',
              contact: 'contact',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setGebruikFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          fieldConfigs={{
            // Hide fields that are not in the current form
            id: { visible: false },
            deelneming: { visible: false },
            startDatumActief: { visible: false },
            startDatumGepland: { visible: false },
            startDatumBeëindigd: { visible: false },
            interneAantekening: { visible: false },
            // Disable organisatieId field if preSelectedOrganisatieId is provided
            organisatieId: {
              visible: true,
              disabled: preSelectedOrganisatieId,
            },
            // Disable voorzieningId field if preSelectedVoorzieningId is provided
            voorzieningId: {
              visible: true,
              disabled: preSelectedVoorzieningId,
            },
            // Disable versieId field if no voorzieningId is selected
            versieId: {
              visible: true,
              disabled: !gebruikFormData.voorzieningId,
            },
          }}
          optionsProviders={{
            organisatieId: organisatieOptions,
            voorzieningId: voorzieningenOptions,
            versieId: versiesOptions,
            status: (schema?.properties?.status?.enum || []).map((item) => ({
              label: item,
              value: item,
            })),
            hosting: hostingOptions,
            contact: contactpersonenOptions,
            'bivClassificatie.beschikbaarheid': [
              { label: 'Laag', value: 'Laag' },
              { label: 'Midden', value: 'Midden' },
              { label: 'Hoog', value: 'Hoog' },
            ],
            'bivClassificatie.integriteit': [
              { label: 'Laag', value: 'Laag' },
              { label: 'Midden', value: 'Midden' },
              { label: 'Hoog', value: 'Hoog' },
            ],
            'bivClassificatie.vertrouwelijkheid': [
              { label: 'Laag', value: 'Laag' },
              { label: 'Midden', value: 'Midden' },
              { label: 'Hoog', value: 'Hoog' },
            ],
          }}
          loadingStates={{
            organisatieId: organisatieLoading,
            voorzieningId: voorzieningenLoading,
            versieId: versiesLoading,
            status: schemaLoading,
            contact: contactpersonenLoading,
          }}
          disabledStates={{}}
          getIsValid={handleFormValidCheck}
        />
      </AcGrid>
    </AcModal>
  );

  return renderGebruikFormModal;
};

export default withStore(observer(AcGebruikenFormModal));
