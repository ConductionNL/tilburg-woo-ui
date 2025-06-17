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
import ReactSelect from 'react-select';
import _ from 'lodash';

const AcVoorzieningVersieFormModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const statusOptions = [
    { label: 'Ontwikkeling', value: 'ontwikkeling' },
    { label: 'Actief', value: 'actief' },
    { label: 'Onderhoud', value: 'onderhoud' },
    { label: 'Einde Ondersteuning', value: 'einde-ondersteuning' },
  ];

  const { makeRequest } = useNextcloudRequests();

  const initialData = {
    voorzieningaanbod: '',
    versienummer: '',
    releaseNotes: '',
    releaseDatum: '',
    eindDatumOndersteuning: '',
    status: '',
    inDatumOntwikkeling: '',
    uitDatumOntwikkeling: '',
    inDatumActief: '',
    uitDatumActief: '',
    inDatumEindeOndersteuning: '',
    uitDatumEindeOndersteuning: '',
    inDatumOnderhoud: '',
    uitDatumOnderhoud: '',
  };

  const [voorzieningFormData, setVoorzieningFormData] = useState({});

  const [schema, setSchema] = useState(null);

  useEffect(() => {
    setVoorzieningFormData({
      ..._.cloneDeep(initialData),
      ...(voorziening &&
        isEdit && {
          ...voorziening,
          voorzieningaanbod: collapseExtendedObjects(voorziening.voorzieningaanbod),
        }),
    });
  }, [voorziening, showModal]);

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
      const currentDate = new Date().toISOString();

      // Initialize with existing dates from voorzieningFormData
      const statusDates = {
        inDatumActief: voorzieningFormData.inDatumActief || null,
        uitDatumActief: voorzieningFormData.uitDatumActief || null,
        inDatumEindeOndersteuning:
          voorzieningFormData.inDatumEindeOndersteuning || null,
        uitDatumEindeOndersteuning:
          voorzieningFormData.uitDatumEindeOndersteuning || null,
        inDatumOnderhoud: voorzieningFormData.inDatumOnderhoud || null,
        uitDatumOnderhoud: voorzieningFormData.uitDatumOnderhoud || null,
        inDatumOntwikkeling: voorzieningFormData.inDatumOntwikkeling || null,
        uitDatumOntwikkeling: voorzieningFormData.uitDatumOntwikkeling || null,
      };

      // if status has changed from a previously defined status, set the end date of the old status to the current date
      if (voorziening?.status && voorziening.status !== voorzieningFormData.status) {
        switch (voorziening.status) {
          case 'actief':
            statusDates.uitDatumActief = currentDate;
            break;
          case 'einde-ondersteuning':
            statusDates.uitDatumEindeOndersteuning = currentDate;
            break;
          case 'onderhoud':
            statusDates.uitDatumOnderhoud = currentDate;
            break;
          case 'ontwikkeling':
            statusDates.uitDatumOntwikkeling = currentDate;
            break;
        }
      }

      // if status has changed to a new status, set the start date of the new status to the current date
      if (
        voorzieningFormData.status &&
        voorzieningFormData.status !== (voorziening?.status || initialData?.status)
      ) {
        switch (voorzieningFormData.status) {
          case 'actief':
            statusDates.inDatumActief = currentDate;
            break;
          case 'einde-ondersteuning':
            statusDates.inDatumEindeOndersteuning = currentDate;
            break;
          case 'onderhoud':
            statusDates.inDatumOnderhoud = currentDate;
            break;
          case 'ontwikkeling':
            statusDates.inDatumOntwikkeling = currentDate;
            break;
        }
      }

      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...voorzieningFormData,
          ...statusDates,
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
    setVoorzieningFormData(initialData);
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
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Status</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een status'
            className='ac-beheer-select'
            value={statusOptions?.filter(
              (option) => voorzieningFormData?.status === option.value
            )}
            onChange={(e) => {
              setVoorzieningFormData((prev) => ({
                ...prev,
                status: e && e.value,
              }));
            }}
            options={statusOptions}
            {...(schema?.properties?.status?.required && {
              required: true,
            })}
            {...(!schema?.properties?.status?.required && {
              isClearable: true,
            })}
          />
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderVoorzieningVersieFormModal;
};

export default withStore(observer(AcVoorzieningVersieFormModal));
