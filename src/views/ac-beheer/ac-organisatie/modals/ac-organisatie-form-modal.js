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
    organisatienaam: '',
    contactgegevens: '',
    website: '',
    beschrijving: '',
  });

  const [organisaties, setOrganisaties] = useState([]);
  useEffect(async () => {
    const response = await makeRequest(
      `${BASE_URL}/apps/openregister/api/objects/organisatie/organisatie`,
      [['_extend[]', 'contactgegevens']]
    );

    const data = (await response.json()).results;
    setOrganisaties(data);
  }, []);

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
        organisatienaam: '',
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
      const baseUrl = `${BASE_URL}/apps/openregister/api/objects/organisatie/organisatie`;

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
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='KvK nummer'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('kvk-nummer')}
          value={organisatieFormData['kvk-nummer']}
        />
        <AcFormField
          label='Organisatienaam'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('organisatienaam')}
          value={organisatieFormData.organisatienaam}
        />
        <AcFormField
          label='Contactgegevens'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('contactgegevens')}
          value={organisatieFormData.contactgegevens}
        />
        <AcFormField
          label='Website'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('website')}
          value={organisatieFormData.website}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('beschrijving')}
          value={organisatieFormData.beschrijving}
        />
      </AcFlex>
    </AcModal>
  );

  return renderOrganisatieFormModal;
};

export default withStore(observer(AcOrganisatieFormModal));
