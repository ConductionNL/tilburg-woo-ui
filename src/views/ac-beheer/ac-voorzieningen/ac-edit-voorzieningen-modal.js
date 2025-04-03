import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';
import ReactSelect from 'react-select';

const AcEditVoorzieningModal = ({
  voorziening,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const types = [
    { id: '270f7176-2bdc-4702-a037-0684b2487ab8', label: 'Voorziening' },
  ];
  const targetGroups = [
    'Gemeente',
    'Waterschap',
    'Provincie',
    'Ministerie',
    'Uitvoeringsorganisatie',
    'Samenwerkingsverband',
    'Leverancier',
  ];

  const [voorzieningFormData, setVoorzieningFormData] = useState({
    name: '',
    description: '',
    type: '',
    category: '',
    functionalities: '',
    targetGroups: [],
    referenceComponents: [],
    standards: '',
  });

  // load voorziening data into the form
  useEffect(() => {
    if (voorziening) {
      setVoorzieningFormData((prev) => ({
        ...prev,
        id: voorziening.id,
        name: voorziening.naam,
        description: voorziening.beschrijving,
        type: voorziening.voorzieningstypeId,
        category: voorziening.categorie,
        functionalities: Array.isArray(voorziening.functionaliteiten)
          ? voorziening.functionaliteiten.join(', ')
          : voorziening.functionaliteiten,
        targetGroups: voorziening.doelgroep,
        referenceComponents: Array.isArray(voorziening.referentieComponenten)
          ? voorziening.referentieComponenten.join(', ')
          : voorziening.referentieComponenten,
        standards: Array.isArray(voorziening.standaarden)
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
            naam: voorzieningFormData.name,
            beschrijving: voorzieningFormData.description,
            voorzieningstypeId: voorzieningFormData.type,
            categorie: voorzieningFormData.category,
            functionaliteiten: voorzieningFormData.functionalities
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            doelgroep: voorzieningFormData.targetGroups,
            referentieComponenten: voorzieningFormData.referenceComponents
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            standaarden: voorzieningFormData.standards
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
          onBlur={handleEditVoorzieningFieldChange('name')}
          value={voorzieningFormData.name}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('description')}
          value={voorzieningFormData.description}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Voorziening type</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een voorzieningsType'
            value={types?.find((option) => option.id === voorzieningFormData.type)}
            className='ac-beheer-select'
            onChange={(e) => {
              setAddVoorzieningFormData((prev) => ({
                ...prev,
                type: e.value,
              }));
            }}
            loading={types?.length === 0}
            options={types?.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
          />
        </div>
        <AcFormField
          label='Categorie'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('category')}
          value={voorzieningFormData.category}
        />
        <AcFormField
          label='Functionaliteiten'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('functionalities')}
          value={voorzieningFormData.functionalities}
        />

        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Doelgroepen</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een doelgroep'
            className='ac-beheer-select'
            isMulti
            value={voorzieningFormData.targetGroups.map((targetGroup) => ({
              value: targetGroup,
              label: targetGroup,
            }))}
            onChange={(e) => {
              setVoorzieningFormData((prev) => ({
                ...prev,
                targetGroups: e.map((item) => item.value),
              }));
            }}
            loading={targetGroups?.length === 0}
            options={targetGroups?.map((targetGroup) => ({
              value: targetGroup,
              label: targetGroup,
            }))}
          />
        </div>
        <AcFormField
          label='Referentie componenten'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('referenceComponents')}
          value={voorzieningFormData.referenceComponents}
        />
        <AcFormField
          label='Standaarden'
          type='text'
          onBlur={handleEditVoorzieningFieldChange('standards')}
          value={voorzieningFormData.standards}
        />
      </AcFlex>
    </AcModal>
  );

  return renderEditVoorzieningModal;
};

export default withStore(observer(AcEditVoorzieningModal));
