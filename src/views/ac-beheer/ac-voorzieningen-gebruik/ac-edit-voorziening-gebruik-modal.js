import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { LABELS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import {
  PrimaryActionButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';
import config from '@src/config';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

const AcEditVoorzieningGebruikModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
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
    if (voorziening) {
      setVoorzieningGebruikFormData((prev) => ({
        ...prev,
        ...voorziening,
      }));
    }
  }, [voorziening]);

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

    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          `/openconnector/api/endpoint/voorzieninggebruiken/${voorzieningGebruikFormData.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(voorzieningGebruikFormData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

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

  const renderEditVoorzieningModal = (
    <AcModal
      ref={modalRef}
      id='edit-voorziening-modal'
      title='Voorziening bewerken'
      buttons={[{ label: 'opslaan', onClick: handleSubmit }]}
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

  return renderEditVoorzieningModal;
};

export default withStore(observer(AcEditVoorzieningGebruikModal));
