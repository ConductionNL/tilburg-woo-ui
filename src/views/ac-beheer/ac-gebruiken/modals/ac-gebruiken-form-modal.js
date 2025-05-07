import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcCheckbox, AcFormField } from '@src/molecules';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcGebruikenFormModal = ({
  gebruik,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
  baseUrl,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const [gebruikFormData, setGebruikFormData] = useState({
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
    if (gebruik && isEdit) {
      setGebruikFormData((prev) => ({
        ...prev,
        ...gebruik,
        voorzieningId: collapseExtendedObjects(gebruik.voorzieningId),
        versieId: collapseExtendedObjects(gebruik.versieId),
        organisatieId: collapseExtendedObjects(gebruik.organisatieId),
      }));
    }

    if (!gebruik && !isEdit) {
      setGebruikFormData(() => ({
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
  }, [gebruik, isEdit]);

  const handleEditGebruikOpenModal = () => modalRef?.current?.showModal();

  const handleEditGebruikFieldChange = (field) => (value) => {
    setGebruikFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/openregister/api/objects/voorzieninggebruik/voorzieninggebruik`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${gebruikFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify(gebruikFormData),
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
      handleEditGebruikOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditGebruikCloseModal = () => {
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
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Organisatie Id'
          type='text'
          onBlur={handleEditGebruikFieldChange('organisatieId')}
          value={gebruikFormData.organisatieId}
        />
        <AcFormField
          label='Voorziening ID'
          type='text'
          onBlur={handleEditGebruikFieldChange('voorzieningId')}
          value={gebruikFormData.voorzieningId}
        />
        <AcFormField
          label='Versie ID'
          type='text'
          onBlur={handleEditGebruikFieldChange('versieId')}
          value={gebruikFormData.versieId}
        />
        <AcFormField
          label='Startdatum'
          type='text'
          onBlur={handleEditGebruikFieldChange('startDatum')}
          value={gebruikFormData.startDatum}
        />
        <AcFormField
          label='Einddatum'
          type='text'
          onBlur={handleEditGebruikFieldChange('eindDatum')}
          value={gebruikFormData.eindDatum}
        />
        <AcFormField
          label='Status'
          type='text'
          onBlur={handleEditGebruikFieldChange('status')}
          value={gebruikFormData.status}
        />
        <AcFormField
          label='Opmerkingen'
          type='text'
          onBlur={handleEditGebruikFieldChange('opmerkingen')}
          value={gebruikFormData.opmerkingen}
        />
        <AcFormField
          label='BBN Score'
          type='text'
          onBlur={handleEditGebruikFieldChange('bbnScore')}
          value={gebruikFormData.bbnScore}
        />
        <AcFormField
          label='IBP Score'
          type='text'
          onBlur={handleEditGebruikFieldChange('ibpScore')}
          value={gebruikFormData.ibpScore}
        />
        <AcCheckbox
          label='BedrijfsKritisch'
          checked={gebruikFormData.bedrijfsKritisch}
          onChange={handleEditGebruikFieldChange('bedrijfsKritisch')}
        />
        <AcCheckbox
          label='Privacy Gevoelig'
          checked={gebruikFormData.privacyGevoelig}
          onChange={handleEditGebruikFieldChange('privacyGevoelig')}
        />
      </AcFlex>
    </AcModal>
  );

  return renderGebruikFormModal;
};

export default withStore(observer(AcGebruikenFormModal));
