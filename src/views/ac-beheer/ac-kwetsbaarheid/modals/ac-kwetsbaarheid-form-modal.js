import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';

const AcKwetsbaarheidFormModal = ({
  kwetsbaarheid,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const formRef = useRef(null);

  const nextcloud = useNextcloudRequests();

  const initialData = {
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
  };

  const [kwetsbaarheidFormData, setKwetsbaarheidFormData] = useState({});
  const [schema, setSchema] = useState(null);
  const [isValid, setIsValid] = useState(false);

  // load kwetsbaarheid data into the form
  useEffect(() => {
    setKwetsbaarheidFormData({
      ..._.cloneDeep(initialData),
      // if edit modal
      ...(kwetsbaarheid &&
        isEdit && {
          ...kwetsbaarheid,
          voorzieningversieId: collapseExtendedObjects(
            kwetsbaarheid.voorzieningversieId
          ),
          referenties: Array.isArray(kwetsbaarheid.referenties)
            ? kwetsbaarheid.referenties.join(', ')
            : kwetsbaarheid.referenties,
        }),
    });
  }, [kwetsbaarheid, isEdit]);

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await nextcloud.request(
        `openregister/api/schemas/kwetsbaarheid`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

  const handleEditKwetsbaarheidOpenModal = () => modalRef?.current?.showModal();

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/kwetsbaarheid';

  const handleSubmit = async () => {
    const baseUrl = endpoint;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${kwetsbaarheidFormData.id}` : baseUrl;

    try {
      const response = await nextcloud.request(url, {
        method: method,
        data: JSON.stringify({
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
    setKwetsbaarheidFormData(_.cloneDeep(initialData));
    formRef.current?.reset();
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
          ref={formRef}
          schema={schema}
          formData={kwetsbaarheidFormData}
          onFieldChange={(fieldName, value) =>
            setKwetsbaarheidFormData((prev) => ({
              ...prev,
              [fieldName]: value,
            }))
          }
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
