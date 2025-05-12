import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { VISUALS } from '@constants';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcDienstFormModal = ({
  dienst,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
  baseUrl,
}) => {
  const modalRef = useRef(null);
  const [dienstFormData, setDienstFormData] = useState({
    voorziening: '',
    leverancier: '',
    productpagina: '',
    ondersteuningsopties: '',
    prijsmodel: '',
    certificeringen: '',
    ondersteundeStandaarden: '',
  });

  const { makeRequest } = useNextcloudRequests();

  useEffect(() => {
    if (dienst && isEdit) {
      setDienstFormData((prev) => ({
        ...prev,
        ...dienst,
        voorziening: dienst.voorziening?.id ?? dienst.voorzieningId,
        leverancier: dienst.leverancier?.id ?? dienst.organisatieId,
        ondersteuningsopties: Array.isArray(dienst.ondersteuningsopties)
          ? dienst.ondersteuningsopties.join(', ')
          : dienst.ondersteuningsopties,
        certificeringen: Array.isArray(dienst.certificeringen)
          ? dienst.certificeringen.join(', ')
          : dienst.certificeringen,
        ondersteundeStandaarden: collapseExtendedObjects(
          dienst.ondersteundeStandaarden
        ),
      }));
    }
    if (!dienst && !isEdit) {
      setDienstFormData(() => ({
        voorziening: '',
        leverancier: '',
        productpagina: '',
        ondersteuningsopties: '',
        prijsmodel: '',
        certificeringen: '',
        ondersteundeStandaarden: '',
      }));
    }
  }, [dienst, isEdit]);

  const handleEditDienstOpenModal = () => modalRef?.current?.showModal();

  const handleEditDienstFieldChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setDienstFormData({
      ...dienstFormData,
      [field]: value,
    });
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningaanbod';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${dienstFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...dienstFormData,
          voorziening: dienstFormData.voorziening,
          leverancier: dienstFormData.leverancier,
          ondersteuningsopties: smartSplit(dienstFormData.ondersteuningsopties),
          prijsmodel: dienstFormData.prijsmodel,
          certificeringen: smartSplit(dienstFormData.certificeringen),
          ondersteundeStandaarden: smartSplit(
            dienstFormData.ondersteundeStandaarden
          ),
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
          label='Voorziening'
          type='text'
          onBlur={handleEditDienstFieldChange('voorziening')}
          value={dienstFormData.voorziening}
        />
        <AcFormField
          label='Leverancier'
          type='text'
          onBlur={handleEditDienstFieldChange('leverancier')}
          value={dienstFormData.leverancier}
        />
        <AcFormField
          label='Productpagina'
          type='text'
          onBlur={handleEditDienstFieldChange('productpagina')}
          value={dienstFormData.productpagina}
        />
        <AcFormField
          label='Ondersteuningsopties'
          type='text'
          onBlur={handleEditDienstFieldChange('ondersteuningsopties')}
          value={dienstFormData.ondersteuningsopties}
        />
        <AcFormField
          label='Prijsmodel'
          type='text'
          onBlur={handleEditDienstFieldChange('prijsmodel')}
          value={dienstFormData.prijsmodel}
        />
        <AcFormField
          label='Certificeringen'
          type='text'
          onBlur={handleEditDienstFieldChange('certificeringen')}
          value={dienstFormData.certificeringen}
        />
        <AcFormField
          label='Ondersteunde standaarden'
          type='text'
          onBlur={handleEditDienstFieldChange('ondersteundeStandaarden')}
          value={dienstFormData.ondersteundeStandaarden}
        />
      </AcFlex>
    </AcModal>
  );

  return renderDienstFormModal;
};

export default withStore(observer(AcDienstFormModal));
