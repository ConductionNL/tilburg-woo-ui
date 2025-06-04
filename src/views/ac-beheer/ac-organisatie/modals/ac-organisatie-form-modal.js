import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const AcOrganisatieFormModal = ({
  organisatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const [organisatieFormData, setOrganisatieFormData] = useState({
    'kvk-nummer': '',
    naam: '',
    contactgegevens: '',
    website: '',
    beschrijving: '',
  });
  const [schema, setSchema] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/organisatie';

  const extend = [['_extend[]', 'contactgegevens']];

  const [organisaties, setOrganisaties] = useState([]);
  useEffect(async () => {
    const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, extend);

    const data = response.data.results;
    setOrganisaties(data);
  }, []);

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/organisatie`
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
    if (organisatie && isEdit) {
      setOrganisatieFormData((prev) => ({
        ...prev,
        ...organisatie,
        contactgegevens: collapseExtendedObjects(organisatie.contactgegevens),
      }));
    }
    if (!organisatie && !isEdit) {
      setOrganisatieFormData(() => ({
        'kvk-nummer': '',
        naam: '',
        contactgegevens: '',
        website: '',
        beschrijving: '',
      }));
    }
  }, [organisatie, isEdit]);

  const handleEditOrganisatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditOrganisatieFieldChange = (field) => (value) => {
    setOrganisatieFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      const baseUrl = `${BASE_URL}/apps/${endpoint}`;

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${baseUrl}/${organisatieFormData.id}` : baseUrl;

      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...organisatieFormData,
          contactgegevens: smartSplit(organisatieFormData.contactgegevens),
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

  const renderOrganisatieFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-organisatie-modal'
      title={isEdit ? 'Organisatie bewerken' : 'Organisatie toevoegen'}
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
          label='KvK nummer'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('kvk-nummer')}
          value={organisatieFormData['kvk-nummer']}
          {...(schema?.properties?.kvkNummer?.required && {
            hasError: !organisatieFormData['kvk-nummer'],
            required: true,
          })}
        />
        <AcFormField
          label='naam'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('naam')}
          value={organisatieFormData.naam}
          {...(schema?.properties?.naam?.required && {
            hasError: !organisatieFormData.naam,
            required: true,
          })}
        />
        <AcFormField
          label='Contactgegevens'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('contactgegevens')}
          value={organisatieFormData.contactgegevens}
          {...(schema?.properties?.contactgegevens?.required && {
            hasError: !organisatieFormData.contactgegevens,
            required: true,
          })}
        />
        <AcFormField
          label='Website'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('website')}
          value={organisatieFormData.website}
          {...(schema?.properties?.website?.required && {
            hasError: !organisatieFormData.website,
            required: true,
          })}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('beschrijving')}
          value={organisatieFormData.beschrijving}
          {...(schema?.properties?.beschrijving?.required && {
            hasError: !organisatieFormData.beschrijving,
            required: true,
          })}
        />
      </AcFlex>
    </AcModal>
  );

  return renderOrganisatieFormModal;
};

export default withStore(observer(AcOrganisatieFormModal));
