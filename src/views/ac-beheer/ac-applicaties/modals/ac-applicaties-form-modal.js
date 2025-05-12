import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcApplicatiesFormModal = ({
  applicatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const types = [
    { id: '270f7176-2bdc-4702-a037-0684b2487ab8', label: 'Voorziening' },
  ];
  const voorzieningsTypes = [
    { id: 'Toepassing', label: 'Toepassing' },
    { id: 'Platform', label: 'Platform' },
    { id: 'GeneriekComponent', label: 'GeneriekComponent' },
    { id: 'Service', label: 'Service' },
    { id: 'Anders', label: 'Anders' },
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

  const [applicatieFormData, setApplicatieFormData] = useState({
    name: '',
    description: '',
    category: '',
    functionalities: '',
    targetGroups: [],
    referenceComponents: [],
    standards: '',
    voorzieningstype: '',
  });

  // load applicatie data into the form
  useEffect(() => {
    if (applicatie && isEdit) {
      setApplicatieFormData((prev) => ({
        ...prev,
        ...applicatie,
        id: applicatie.id,
        name: applicatie.naam,
        description: applicatie.beschrijving,
        category: applicatie.categorie,
        functionalities: Array.isArray(applicatie.functionaliteiten)
          ? applicatie.functionaliteiten.join(', ')
          : applicatie.functionaliteiten,
        targetGroups: applicatie.doelgroep,
        referenceComponents: Array.isArray(applicatie.referentieComponenten)
          ? applicatie.referentieComponenten.join(', ')
          : applicatie.referentieComponenten,
        standards: collapseExtendedObjects(applicatie.standaarden),
        voorzieningstype: applicatie.voorzieningstype,
      }));
    }
    if (!applicatie && !isEdit) {
      setApplicatieFormData(() => ({
        name: '',
        description: '',
        category: '',
        functionalities: '',
        targetGroups: [],
        referenceComponents: [],
        standards: '',
        voorzieningstype: '',
      }));
    }
  }, [applicatie, isEdit]);

  const handleEditApplicatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditApplicatieFieldChange = (field) => (value) => {
    setApplicatieFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorziening';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${applicatieFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          naam: applicatieFormData.name,
          beschrijving: applicatieFormData.description,
          categorie: applicatieFormData.category,
          functionaliteiten: smartSplit(applicatieFormData.functionalities),
          doelgroep: applicatieFormData.targetGroups,
          referentieComponenten: smartSplit(applicatieFormData.referenceComponents),
          standaarden: smartSplit(applicatieFormData.standards),
          voorzieningstype: applicatieFormData.voorzieningstype,
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
      handleEditApplicatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditApplicatieCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditApplicatieCloseModal);
  }, [modalRef.current]);

  const renderApplicatiesFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-applicatie-modal'
      title={isEdit ? 'Applicatie bewerken' : 'Applicatie toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditApplicatieFieldChange('name')}
          value={applicatieFormData.name}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditApplicatieFieldChange('description')}
          value={applicatieFormData.description}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Applicatie type</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een applicatie type'
            value={voorzieningsTypes?.find(
              (option) => option.id === applicatieFormData.voorzieningstype
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
                ...prev,
                voorzieningstype: e.value,
              }));
            }}
            loading={voorzieningsTypes?.length === 0}
            options={voorzieningsTypes?.map((voorzieningstype) => ({
              value: voorzieningstype.id,
              label: voorzieningstype.label,
            }))}
          />
        </div>
        <AcFormField
          label='Categorie'
          type='text'
          onBlur={handleEditApplicatieFieldChange('category')}
          value={applicatieFormData.category}
        />
        <AcFormField
          label='Functionaliteiten'
          type='text'
          onBlur={handleEditApplicatieFieldChange('functionalities')}
          value={applicatieFormData.functionalities}
        />

        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Doelgroepen</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een doelgroep'
            className='ac-beheer-select'
            isMulti
            value={applicatieFormData.targetGroups.map((targetGroup) => ({
              value: targetGroup,
              label: targetGroup,
            }))}
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
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
          onBlur={handleEditApplicatieFieldChange('referenceComponents')}
          value={applicatieFormData.referenceComponents}
        />
        <AcFormField
          label='Standaarden'
          type='text'
          onBlur={handleEditApplicatieFieldChange('standards')}
          value={applicatieFormData.standards}
        />
      </AcFlex>
    </AcModal>
  );

  return renderApplicatiesFormModal;
};

export default withStore(observer(AcApplicatiesFormModal));
