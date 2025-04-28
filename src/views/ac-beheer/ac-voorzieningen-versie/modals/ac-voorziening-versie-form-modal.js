import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

const AcVoorzieningVersieFormModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const [voorzieningFormData, setVoorzieningFormData] = useState({
    naam: '',
    omschrijving: '',
    releaseNotes: '',
    nummer: '',
    voorzieningaanbodId: '',
    productieDatum: '',
    eindeDatum: '',
    status: '',
  });

  useEffect(() => {
    if (voorziening && isEdit) {
      setVoorzieningFormData((prev) => ({
        ...prev,
        ...voorziening,
      }));
    }

    if (!voorziening && !isEdit) {
      setVoorzieningFormData(() => ({
        naam: '',
        omschrijving: '',
        releaseNotes: '',
        nummer: '',
        voorzieningaanbodId: '',
        productieDatum: '',
        eindeDatum: '',
        status: '',
      }));
    }
  }, [voorziening, isEdit]);

  const handleEditVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const handleEditVoorzieningFieldChange = (field) => (value) => {
    setVoorzieningFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const baseUrl =
      'https://vng.test.commonground.nu/apps/openregister/api/objects/voorzieningversie/voorzieningversie';

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${voorzieningFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify(voorzieningFormData),
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
      handleEditVoorzieningOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditVoorzieningCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditVoorzieningCloseModal);
  }, [modalRef.current]);

  const renderVoorzieningVersieFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-voorziening-versie-modal'
      title={isEdit ? 'Voorziening versie bewerken' : 'Voorziening versie toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('naam')}
          value={voorzieningFormData.naam}
        />
        <AcFormField
          label='Omschrijving'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('omschrijving')}
          value={voorzieningFormData.omschrijving}
        />
        <AcFormField
          label='Versie ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('releaseNotes')}
          value={voorzieningFormData.releaseNotes}
        />
        <AcFormField
          label='Nummer'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('nummer')}
          value={voorzieningFormData.nummer}
        />
        <AcFormField
          label='Voorziening Aanbod ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('voorzieningaanbodId')}
          value={voorzieningFormData.voorzieningaanbodId}
        />
        <AcFormField
          label='Productie Datum'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('productieDatum')}
          value={voorzieningFormData.productieDatum}
        />
        <AcFormField
          label='Einde Datum'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('eindeDatum')}
          value={voorzieningFormData.eindeDatum}
        />
        <AcFormField
          label='Status'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('status')}
          value={voorzieningFormData.status}
        />
      </AcFlex>
    </AcModal>
  );

  return renderVoorzieningVersieFormModal;
};

export default withStore(observer(AcVoorzieningVersieFormModal));
