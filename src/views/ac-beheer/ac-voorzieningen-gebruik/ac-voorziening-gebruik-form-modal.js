import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

const AcVoorzieningGebruikFormModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [voorzieningGebruikFormData, setVoorzieningGebruikFormData] = useState({
    organisatieId: '',
    voorzieningId: '',
    versieId: '',
    beheerder: {
      naam: '',
      email: '',
      telefoon: '',
      functie: '',
    },
    startDatum: '',
    eindDatum: '',
    status: '',
    opmerkingen: '',
    bbnScore: '',
    ibpScore: '',
    bivClassificatie: {
      beschikbaarheid: '',
      integriteit: '',
      vertrouwelijkheid: '',
    },
    bedrijfsKritisch: false,
    privacyGevoelig: false,
  });

  useEffect(() => {
    if (voorziening && isEdit) {
      setVoorzieningGebruikFormData((prev) => ({
        ...prev,
        ...voorziening,
      }));
    }

    if (!voorziening && !isEdit) {
      setVoorzieningGebruikFormData(() => ({
        organisatieId: '',
        voorzieningId: '',
        versieId: '',
        beheerder: {
          naam: '',
          email: '',
          telefoon: '',
          functie: '',
        },
        startDatum: '',
        eindDatum: '',
        status: '',
        opmerkingen: '',
        bbnScore: '',
        ibpScore: '',
        bivClassificatie: {
          beschikbaarheid: '',
          integriteit: '',
          vertrouwelijkheid: '',
        },
        bedrijfsKritisch: false,
        privacyGevoelig: false,
      }));
    }
  }, [voorziening, isEdit]);

  const handleEditVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const handleEditVoorzieningFieldChange = (field) => (value) => {
    setVoorzieningGebruikFormData((prev) => ({
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
      'https://vng.accept.commonground.nu/apps/openconnector/api/endpoint/voorzieninggebruiken';

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${voorzieningGebruikFormData.id}` : baseUrl;

    try {
      const response = await fetch(url, {
        method: method,
        body: JSON.stringify(voorzieningGebruikFormData),
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

  const renderVoorzieningGebruikFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-voorziening-modal'
      title={isEdit ? 'Voorziening bewerken' : 'Voorziening toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Organisatie Id'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('organisatieId')}
          value={voorzieningGebruikFormData.organisatieId}
        />
        <AcFormField
          label='Voorziening ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('voorzieningId')}
          value={voorzieningGebruikFormData.voorzieningId}
        />
        <AcFormField
          label='Versie ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('versieId')}
          value={voorzieningGebruikFormData.versieId}
        />
        <AcFormField
          label='Startdatum'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('startDatum')}
          value={voorzieningGebruikFormData.startDatum}
        />
        <AcFormField
          label='Einddatum'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('eindDatum')}
          value={voorzieningGebruikFormData.eindDatum}
        />
        <AcFormField
          label='Status'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('status')}
          value={voorzieningGebruikFormData.status}
        />
        <AcFormField
          label='Opmerkingen'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('opmerkingen')}
          value={voorzieningGebruikFormData.opmerkingen}
        />
        <AcFormField
          label='BBN Score'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('bbnScore')}
          value={voorzieningGebruikFormData.bbnScore}
        />
        <AcFormField
          label='IBP Score'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('ibpScore')}
          value={voorzieningGebruikFormData.ibpScore}
        />
        <AcCheckbox
          label='BedrijfsKritisch'
          checked={voorzieningGebruikFormData.bedrijfsKritisch}
          onChange={handleEditVoorzieningFieldChange('bedrijfsKritisch')}
        />
        <AcCheckbox
          label='Privacy Gevoelig'
          checked={voorzieningGebruikFormData.privacyGevoelig}
          onChange={handleEditVoorzieningFieldChange('privacyGevoelig')}
        />
      </AcFlex>
    </AcModal>
  );

  return renderVoorzieningGebruikFormModal;
};

export default withStore(observer(AcVoorzieningGebruikFormModal));
