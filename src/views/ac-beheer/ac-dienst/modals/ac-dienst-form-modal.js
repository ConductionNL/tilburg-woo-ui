import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { VISUALS } from '@constants';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

const AcDienstFormModal = ({
  dienst,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [dienstFormData, setDienstFormData] = useState({
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

  const { makeRequest } = useNextcloudRequests();

  useEffect(() => {
    if (dienst && isEdit) {
      setDienstFormData((prev) => ({
        ...prev,
        ...dienst,
        type: Array.isArray(dienst.type) ? dienst.type.join(', ') : dienst.type,
        hostingopties: Array.isArray(dienst.hostingopties)
          ? dienst.hostingopties.join(', ')
          : dienst.hostingopties,
        versies: Array.isArray(dienst.versies)
          ? dienst.versies.join(', ')
          : dienst.versies,
      }));
    }
    if (!dienst && !isEdit) {
      setDienstFormData(() => ({
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
  }, [dienst, isEdit]);

  const handleEditDienstOpenModal = () => modalRef?.current?.showModal();

  const handleEditDienstFieldChange = (field) => (event) => {
    setDienstFormData({
      ...dienstFormData,
      [field]: event.target.value,
    });
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const baseUrl =
      'https://vng.test.commonground.nu/apps/openregister/api/objects/voorzieningaanbod/voorzieningaanbod';
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${dienstFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...dienstFormData,
          type: dienstFormData.type.trim().split(/ *, */g).filter(Boolean),
          hostingopties: dienstFormData.hostingopties
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
          versies: dienstFormData.versies.trim().split(/ *, */g).filter(Boolean),
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
      handleEditDienstOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditDienstCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditDienstCloseModal);
  }, [modalRef.current]);

  const renderDienstFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-dienst-modal'
      title={isEdit ? 'Dienst bewerken' : 'Dienst toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditDienstFieldChange('naam')}
          value={dienstFormData.naam}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditDienstFieldChange('omschrijving')}
          value={dienstFormData.omschrijving}
        />
        <AcFormField
          label='Type'
          type='text'
          onBlur={handleEditDienstFieldChange('type')}
          value={dienstFormData.type}
        />
        <AcFormField
          label='Voorziening ID'
          type='text'
          onBlur={handleEditDienstFieldChange('voorzieningId')}
          value={dienstFormData.voorzieningId}
        />
        <AcFormField
          label='Organisatie ID'
          type='text'
          onBlur={handleEditDienstFieldChange('organisatieId')}
          value={dienstFormData.organisatieId}
        />
        <AcFormField
          label='Productpagina'
          type='text'
          onBlur={handleEditDienstFieldChange('productpagina')}
          value={dienstFormData.productpagina}
        />
        <AcFormField
          label='Ondersteuningsmodel'
          type='text'
          onBlur={handleEditDienstFieldChange('ondersteuningsmodel')}
          value={dienstFormData.ondersteuningsmodel}
        />
        <AcFormField
          label='Licentiemodel'
          type='text'
          onBlur={handleEditDienstFieldChange('licentiemodel')}
          value={dienstFormData.licentiemodel}
        />
        <AcFormField
          label='Hostingopties'
          type='text'
          onBlur={handleEditDienstFieldChange('hostingopties')}
          value={dienstFormData.hostingopties}
        />
        <AcFormField
          label='Versies'
          type='text'
          onBlur={handleEditDienstFieldChange('versies')}
          value={dienstFormData.versies}
        />
      </AcFlex>
    </AcModal>
  );

  return renderDienstFormModal;
};

export default withStore(observer(AcDienstFormModal));
