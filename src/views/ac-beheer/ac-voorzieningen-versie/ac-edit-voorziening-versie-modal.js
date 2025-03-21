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

const AcEditVoorzieningVersieModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
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
    if (voorziening) {
      setVoorzieningFormData((prev) => ({
        ...prev,
        ...voorziening,
      }));
    }
  }, [voorziening]);

  const handleEditVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const handleEditVoorzieningFieldChange = (field) => (value) => {
    setVoorzieningFormData((prev) => ({
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
          `/openconnector/api/endpoint/voorzieningversies/${voorzieningFormData.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(voorzieningFormData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        onSuccess?.();
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
      id='edit-voorziening-versie-modal'
      title='Voorziening versie bewerken'
      buttons={[{ label: 'opslaan', onClick: handleSubmit }]}
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

  return renderEditVoorzieningModal;
};

export default withStore(observer(AcEditVoorzieningVersieModal));
