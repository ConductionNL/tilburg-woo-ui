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
import clsx from 'clsx';

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
    voorziening: '',
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
  const [voorzieningOptions, setVoorzieningOptions] = useState([]);
  const [voorzieningAanbodOptions, setVoorzieningAanbodOptions] = useState([]);
  const [voorzieningenLoading, setVoorzieningenLoading] = useState(false);
  const [voorzieningAanbodLoading, setVoorzieningAanbodLoading] = useState(false);

  useEffect(() => {
    setVoorzieningFormData({
      ..._.cloneDeep(initialData),
      ...(voorziening && {
        ...voorziening,
        voorziening: isEdit
          ? collapseExtendedObjects(voorziening.voorziening)
          : voorziening.id,
        voorzieningaanbod: isEdit
          ? collapseExtendedObjects(voorziening.voorzieningaanbod)
          : voorziening.voorzieningaanbod || '',
      }),
    });
  }, [voorziening, showModal, isEdit]);

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/voorzieningversie`
      );
      const data = response.data;
      setSchema(data);
    };

    const fetchVoorzieningen = async () => {
      try {
        setVoorzieningenLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorziening`
        );
        const data = response.data.results;
        const options = data.map((voorziening) => ({
          label: voorziening.naam,
          value: voorziening.id,
        }));
        setVoorzieningOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setVoorzieningenLoading(false);
      }
    };

    const fetchVoorzieningAanbod = async () => {
      try {
        setVoorzieningAanbodLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorzieningaanbod`
        );
        const data = response.data.results;
        const options = data.map((aanbod) => ({
          label: aanbod.naam || aanbod.id,
          value: aanbod.id,
        }));
        setVoorzieningAanbodOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setVoorzieningAanbodLoading(false);
      }
    };

    if (showModal) {
      fetchSchema();
      fetchVoorzieningen();
      fetchVoorzieningAanbod();
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
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Applicatie</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een applicatie'
            className={clsx('ac-beheer-select', {
              'ac-beheer-select--disabled': !isEdit && voorziening?.id,
            })}
            value={voorzieningOptions?.filter(
              (option) => voorzieningFormData?.voorziening === option.value
            )}
            onChange={(e) => {
              setVoorzieningFormData((prev) => ({
                ...prev,
                voorziening: e && e.value,
              }));
            }}
            options={voorzieningOptions}
            isLoading={voorzieningenLoading}
            isDisabled={!isEdit && voorziening?.id}
            {...(schema?.properties?.voorziening?.required && {
              required: true,
            })}
            {...(!schema?.properties?.voorziening?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Aanbod</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een aanbod'
            className='ac-beheer-select'
            value={voorzieningAanbodOptions?.filter(
              (option) => voorzieningFormData?.voorzieningaanbod === option.value
            )}
            onChange={(e) => {
              setVoorzieningFormData((prev) => ({
                ...prev,
                voorzieningaanbod: e && e.value,
              }));
            }}
            options={voorzieningAanbodOptions}
            isLoading={voorzieningAanbodLoading}
            {...(schema?.properties?.voorzieningaanbod?.required && {
              required: true,
            })}
            {...(!schema?.properties?.voorzieningaanbod?.required && {
              isClearable: true,
            })}
          />
        </div>
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
