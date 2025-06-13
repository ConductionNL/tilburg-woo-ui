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

const AcVoorzieningVersieFormModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const [voorzieningFormData, setVoorzieningFormData] = useState({
    voorzieningaanbod: '',
    versienummer: '',
    releaseNotes: '',
    releaseDatum: '',
    eindDatumOndersteuning: '',
    systeemvereisten: '',
    kwetsbaarheden: '',
  });

  const [schema, setSchema] = useState(null);

  useEffect(() => {
    if (voorziening && isEdit) {
      setVoorzieningFormData((prev) => ({
        ...prev,
        ...voorziening,
        voorzieningaanbod: collapseExtendedObjects(voorziening.voorzieningaanbod),
        kwetsbaarheden: collapseExtendedObjects(voorziening.kwetsbaarheden),
      }));
    }

    if (!voorziening && !isEdit) {
      setVoorzieningFormData(() => ({
        voorzieningaanbod: '',
        versienummer: '',
        releaseNotes: '',
        releaseDatum: '',
        eindDatumOndersteuning: '',
        systeemvereisten: '',
        kwetsbaarheden: '',
      }));
    }
  }, [voorziening, isEdit]);

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/voorzieningversie`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

  const handleEditVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const handleEditVoorzieningFieldChange = (field) => (value) => {
    setVoorzieningFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningversie';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${voorzieningFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...voorzieningFormData,
          kwetsbaarheden: smartSplit(voorzieningFormData.kwetsbaarheden),
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

  const renderVoorzieningVersieFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-voorziening-versie-modal'
      title={isEdit ? 'Applicatie versie bewerken' : 'Applicatie versie toevoegen'}
      buttons={[
        { label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit },
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
      ]}
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Voorziening Aanbod ID'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('voorzieningaanbod')}
          value={voorzieningFormData.voorzieningaanbod}
          {...(schema?.properties?.voorzieningaanbod?.required && {
            hasError: !voorzieningFormData?.voorzieningaanbod,
            required: true,
          })}
        />
        <AcFormField
          label='Versie Nummer'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('versienummer')}
          value={voorzieningFormData.versienummer}
          {...(schema?.properties?.versienummer?.required && {
            hasError: !voorzieningFormData?.versienummer,
            required: true,
          })}
        />
        <AcFormField
          label='Release Notes'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('releaseNotes')}
          value={voorzieningFormData.releaseNotes}
          {...(schema?.properties?.releaseNotes?.required && {
            hasError: !voorzieningFormData?.releaseNotes,
            required: true,
          })}
        />
        <AcFormField
          label='Release Datum'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('releaseDatum')}
          value={voorzieningFormData.releaseDatum}
          {...(schema?.properties?.releaseDatum?.required && {
            hasError: !voorzieningFormData?.releaseDatum,
            required: true,
          })}
        />
        <AcFormField
          label='Eind Datum Ondersteuning'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('eindDatumOndersteuning')}
          value={voorzieningFormData.eindDatumOndersteuning}
          {...(schema?.properties?.eindDatumOndersteuning?.required && {
            hasError: !voorzieningFormData?.eindDatumOndersteuning,
            required: true,
          })}
        />
            
      </AcFlex>
    </AcModal>
  );

  return renderVoorzieningVersieFormModal;
};

export default withStore(observer(AcVoorzieningVersieFormModal));
