import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcKwetsbaarheidFormModal = ({
  kwetsbaarheid,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

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

  // load kwetsbaarheid data into the form
  useEffect(() => {
    if (kwetsbaarheid && isEdit) {
      setKwetsbaarheidFormData((prev) => ({
        ...prev,
        ...kwetsbaarheid,
        voorzieningversieId: collapseExtendedObjects(
          kwetsbaarheid.voorzieningversieId
        ),
        referenties: Array.isArray(kwetsbaarheid.referenties)
          ? kwetsbaarheid.referenties.join(', ')
          : kwetsbaarheid.referenties,
      }));
    }

    if (!kwetsbaarheid && !isEdit) {
      setKwetsbaarheidFormData(() => ({
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
      }));
    }
  }, [kwetsbaarheid, isEdit]);

  const handleEditKwetsbaarheidOpenModal = () => modalRef?.current?.showModal();

  const handleEditKwetsbaarheidFieldChange = (field) => (value) => {
    setKwetsbaarheidFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const endpoint = BASE_URL.includes('test')
    ? 'openregister/api/objects/voorzieningen/kwetsbaarheid'
    : 'openconnector/api/endpoint/kwetsbaarheden';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${kwetsbaarheidFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...kwetsbaarheidFormData,
          referenties: smartSplit(kwetsbaarheidFormData.referenties),
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

  const renderKwetsbaarheidFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-kwetsbaarheid-modal'
      title={isEdit ? 'Kwetsbaarheid bewerken' : 'Kwetsbaarheid toevoegen'}
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

  return renderKwetsbaarheidFormModal;
};

export default withStore(observer(AcKwetsbaarheidFormModal));
