import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
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
  const [schema, setSchema] = useState(null);
  const [isValid, setIsValid] = useState(false);

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

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/kwetsbaarheid`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

  const handleEditKwetsbaarheidOpenModal = () => modalRef?.current?.showModal();

  const handleEditKwetsbaarheidFieldChange = (field) => (value) => {
    setKwetsbaarheidFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/kwetsbaarheid';

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
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'opslaan',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: !isValid,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        <ConDynamicSchemaForm
          schema={schema}
          formData={{
            // Map schema properties to form data fields
            voorzieningversieId: kwetsbaarheidFormData.voorzieningversieId,
            cveNummer: kwetsbaarheidFormData.cveNummer,
            titel: kwetsbaarheidFormData.titel,
            beschrijving: kwetsbaarheidFormData.beschrijving,
            ernst: kwetsbaarheidFormData.ernst,
            ontdektOp: kwetsbaarheidFormData.ontdektOp,
            gepubliceerdOp: kwetsbaarheidFormData.gepubliceerdOp,
            opgelostIn: kwetsbaarheidFormData.opgelostIn,
            mitigatie: kwetsbaarheidFormData.mitigatie,
            referenties: kwetsbaarheidFormData.referenties,
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              voorzieningversieId: 'voorzieningversieId',
              cveNummer: 'cveNummer',
              titel: 'titel',
              beschrijving: 'beschrijving',
              ernst: 'ernst',
              ontdektOp: 'ontdektOp',
              gepubliceerdOp: 'gepubliceerdOp',
              opgelostIn: 'opgelostIn',
              mitigatie: 'mitigatie',
              referenties: 'referenties',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setKwetsbaarheidFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          fieldConfigs={{
            // Hide fields that are not in the current form
            id: { visible: false },
          }}
          optionsProviders={{
            ernst: [
              { label: 'Laag', value: 'laag' },
              { label: 'Gemiddeld', value: 'gemiddeld' },
              { label: 'Hoog', value: 'hoog' },
              { label: 'Kritiek', value: 'kritiek' },
            ],
          }}
          loadingStates={{}}
          disabledStates={{}}
          getIsValid={handleFormValidCheck}
        />
      </AcFlex>
    </AcModal>
  );

  return renderKwetsbaarheidFormModal;
};

export default withStore(observer(AcKwetsbaarheidFormModal));
