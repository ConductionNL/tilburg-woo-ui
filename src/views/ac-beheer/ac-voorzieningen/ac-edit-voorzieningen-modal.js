import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import config from '@src/config';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

const AcEditVoorzieningModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const [voorzieningFormData, setVoorzieningFormData] = useState({
    naam: '',
    beschrijving: '',
    voorzieningstypeId: '',
    categorie: '',
    functionaliteiten: '',
    doelgroep: '',
    referentieComponenten: '',
    standaarden: '',
  });

  // load contract data into the form
  useEffect(() => {
    if (voorziening) {
      setVoorzieningFormData((prev) => ({
        ...prev,
        ...voorziening,
        functionaliteiten: Array.isArray(voorziening.referenties)
          ? voorziening.referenties.join(', ')
          : voorziening.referenties,
        doelgroep: Array.isArray(voorziening.doelgroep)
          ? voorziening.doelgroep.join(', ')
          : voorziening.doelgroep,
        referentieComponenten: Array.isArray(voorziening.referentieComponenten)
          ? voorziening.referentieComponenten.join(', ')
          : voorziening.referentieComponenten,
        standaarden: Array.isArray(voorziening.standaarden)
          ? voorziening.standaarden.join(', ')
          : voorziening.standaarden,
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
          `/openconnector/api/endpoint/voorziening/${voorzieningFormData.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...voorzieningFormData,
            functionaliteiten: voorzieningFormData.functionaliteiten
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            doelgroep: voorzieningFormData.doelgroep
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            referentieComponenten: voorzieningFormData.referentieComponenten
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            standaarden: voorzieningFormData.standaarden
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
          }),
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
          label='Beschrijving'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('beschrijving')}
          value={voorzieningFormData.beschrijving}
        />
        <AcFormField
          label='Categorie'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('categorie')}
          value={voorzieningFormData.categorie}
        />
        <AcFormField
          label='Voorzienings type ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('voorzieningstypeId')}
          value={voorzieningFormData.voorzieningstypeId}
        />
        <AcFormField
          label='Functionaliteiten'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('functionaliteiten')}
          value={voorzieningFormData.functionaliteiten}
        />
        <AcFormField
          label='Doelgroep'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('doelgroep')}
          value={voorzieningFormData.doelgroep}
        />
        <AcFormField
          label='Referentie componenten'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('referentieComponenten')}
          value={voorzieningFormData.referentieComponenten}
        />
        <AcFormField
          label='Standaarden'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('standaarden')}
          value={voorzieningFormData.standaarden}
        />
        <AcFormField
          label='Referenties'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('referenties')}
          value={voorzieningFormData.referenties}
        />
        <AcFormField
          label='Referenties'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('referenties')}
          value={voorzieningFormData.referenties}
        />
      </AcFlex>
    </AcModal>
  );

  return renderEditVoorzieningModal;
};

export default withStore(observer(AcEditVoorzieningModal));
