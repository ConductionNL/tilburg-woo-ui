import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { LABELS, VISUALS } from '@constants';
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

const AcEditKwetsbaarheidModal = ({
  kwetsbaarheid,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const [kwetsbaarheidFormData, setKwetsbaarheidFormData] = useState({
    voorzieningversieId: '',
    cveNummer: '',
    titel: '',
    beschrijving: '',
    ernst: '',
    ontdektOp: '',
    gepubliceerdOp: '',
    opgelostIn: '',
    mitigatie: '',
    referenties: '',
  });

  // load contract data into the form
  useEffect(() => {
    if (kwetsbaarheid) {
      setKwetsbaarheidFormData((prev) => ({
        ...prev,
        ...kwetsbaarheid,
        referenties: Array.isArray(kwetsbaarheid.referenties)
          ? kwetsbaarheid.referenties.join(', ')
          : kwetsbaarheid.referenties,
      }));
    }
  }, [kwetsbaarheid]);

  const handleEditKwetsbaarheidOpenModal = () => modalRef?.current?.showModal();

  const handleEditKwetsbaarheidFieldChange = (field) => (value) => {
    setKwetsbaarheidFormData((prev) => ({
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
          `/openconnector/api/endpoint/kwetsbaarheden/${kwetsbaarheidFormData.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...kwetsbaarheidFormData,
            referenties: kwetsbaarheidFormData.referenties
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
      handleEditKwetsbaarheidOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditKwetsbaarheidCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditKwetsbaarheidCloseModal);
  }, [modalRef.current]);

  const renderEditKwetsbaarheidModal = (
    <AcModal
      ref={modalRef}
      id='edit-kwetsbaarheid-modal'
      title='Kwetsbaarheid bewerken'
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Voorziening versie ID'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('voorzieningversieId')}
          value={kwetsbaarheidFormData.voorzieningversieId}
        />
        <AcFormField
          label='CVE nummer'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('cveNummer')}
          value={kwetsbaarheidFormData.cveNummer}
        />
        <AcFormField
          label='Titel'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('titel')}
          value={kwetsbaarheidFormData.titel}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('beschrijving')}
          value={kwetsbaarheidFormData.beschrijving}
        />
        <AcFormField
          label='Ernst'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('ernst')}
          value={kwetsbaarheidFormData.ernst}
        />
        <AcFormField
          label='Ontdekt op'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('ontdektOp')}
          value={kwetsbaarheidFormData.ontdektOp}
        />
        <AcFormField
          label='Gepubliceerd op'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('gepubliceerdOp')}
          value={kwetsbaarheidFormData.gepubliceerdOp}
        />
        <AcFormField
          label='Opgelost in'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('opgelostIn')}
          value={kwetsbaarheidFormData.opgelostIn}
        />
        <AcFormField
          label='Mitigatie'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('mitigatie')}
          value={kwetsbaarheidFormData.mitigatie}
        />
        <AcFormField
          label='Referenties'
          type='text'
          onBlur={handleEditKwetsbaarheidFieldChange('referenties')}
          value={kwetsbaarheidFormData.referenties}
        />
      </AcFlex>
    </AcModal>
  );

  return renderEditKwetsbaarheidModal;
};

export default withStore(observer(AcEditKwetsbaarheidModal));
