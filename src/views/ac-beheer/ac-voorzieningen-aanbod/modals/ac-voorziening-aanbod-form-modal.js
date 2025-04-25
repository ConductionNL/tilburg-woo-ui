import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';
import { VISUALS } from '@constants';

const AcVoorzieningAanbodFormModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [voorzieningAanbodFormData, setVoorzieningAanbodFormData] = useState({
    naam: '',
    omschrijving: '',
    type: '',
    voorzieningId: '',
    organisatieId: '',
    productpagina: '',
    ondersteuningsmodel: '',
    licentiemodel: '',
    hostingopties: '',
    versies: [],
  });

  useEffect(() => {
    if (voorziening && isEdit) {
      setVoorzieningAanbodFormData((prev) => ({
        ...prev,
        ...voorziening,
        type: Array.isArray(voorziening.type)
          ? voorziening.type.join(', ')
          : voorziening.type,
        hostingopties: Array.isArray(voorziening.hostingopties)
          ? voorziening.hostingopties.join(', ')
          : voorziening.hostingopties,
        versies: Array.isArray(voorziening.versies)
          ? voorziening.versies.join(', ')
          : voorziening.versies,
      }));
    }
    if (!voorziening && !isEdit) {
      setVoorzieningAanbodFormData(() => ({
        naam: '',
        omschrijving: '',
        type: '',
        voorzieningId: '',
        organisatieId: '',
        productpagina: '',
        ondersteuningsmodel: '',
        licentiemodel: '',
        hostingopties: '',
        versies: [],
      }));
    }
  }, [voorziening, isEdit]);

  const handleEditVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const handleEditVoorzieningFieldChange = (field) => (value) => {
    setVoorzieningAanbodFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      setError('Geen toegangstoken gevonden');
      modalRef?.current?.close();
      return;
    }

    const baseUrl =
      'https://vng.test.commonground.nu/apps/openregister/api/objects/5/12';
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${voorzieningAanbodFormData.id}` : baseUrl;

    try {
      const response = await fetch(url, {
        method: method,
        body: JSON.stringify({
          ...voorzieningAanbodFormData,
          type: voorzieningAanbodFormData.type
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
          hostingopties: voorzieningAanbodFormData.hostingopties
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
          versies: voorzieningAanbodFormData.versies
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
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

  const renderVoorzieningAanbodFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-voorziening-modal'
      title={isEdit ? 'Voorziening bewerken' : 'Voorziening toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('naam')}
          value={voorzieningAanbodFormData.naam}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('omschrijving')}
          value={voorzieningAanbodFormData.omschrijving}
        />
        <AcFormField
          label='Type'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('type')}
          value={voorzieningAanbodFormData.type}
        />
        <AcFormField
          label='Voorziening ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('voorzieningId')}
          value={voorzieningAanbodFormData.voorzieningId}
        />
        <AcFormField
          label='Organisatie ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('organisatieId')}
          value={voorzieningAanbodFormData.organisatieId}
        />
        <AcFormField
          label='Productpagina'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('productpagina')}
          value={voorzieningAanbodFormData.productpagina}
        />
        <AcFormField
          label='Ondersteuningsmodel'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('ondersteuningsmodel')}
          value={voorzieningAanbodFormData.ondersteuningsmodel}
        />
        <AcFormField
          label='Licentiemodel'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('licentiemodel')}
          value={voorzieningAanbodFormData.licentiemodel}
        />
        <AcFormField
          label='Hostingopties'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('hostingopties')}
          value={voorzieningAanbodFormData.hostingopties}
        />
        <AcFormField
          label='Versies'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('versies')}
          value={voorzieningAanbodFormData.versies}
        />
      </AcFlex>
    </AcModal>
  );

  return renderVoorzieningAanbodFormModal;
};

export default withStore(observer(AcVoorzieningAanbodFormModal));
