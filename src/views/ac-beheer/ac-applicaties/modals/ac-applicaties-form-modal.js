import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';
import ReactSelect from 'react-select';

const AcApplicatiesFormModal = ({
  applicatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
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

  const [applicatieFormData, setApplicatieFormData] = useState({
    name: '',
    description: '',
    type: '',
    category: '',
    functionalities: '',
    targetGroups: [],
    referenceComponents: [],
    standards: '',
  });

  // load applicatie data into the form
  useEffect(() => {
    if (applicatie && isEdit) {
      setApplicatieFormData((prev) => ({
        ...prev,
        id: applicatie.id,
        name: applicatie.naam,
        description: applicatie.beschrijving,
        type: applicatie.voorzieningstypeId,
        category: applicatie.categorie,
        functionalities: Array.isArray(applicatie.functionaliteiten)
          ? applicatie.functionaliteiten.join(', ')
          : applicatie.functionaliteiten,
        targetGroups: applicatie.doelgroep,
        referenceComponents: Array.isArray(applicatie.referentieComponenten)
          ? applicatie.referentieComponenten.join(', ')
          : applicatie.referentieComponenten,
        standards: Array.isArray(applicatie.standaarden)
          ? applicatie.standaarden.join(', ')
          : applicatie.standaarden,
      }));
    }
    if (!applicatie && !isEdit) {
      setApplicatieFormData(() => ({
        name: '',
        description: '',
        type: '',
        category: '',
        functionalities: '',
        targetGroups: [],
        referenceComponents: [],
        standards: '',
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

  const handleSubmit = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      setError('Geen toegangstoken gevonden');
      modalRef?.current?.close();
      return;
    }

    const baseUrl =
      'https://vng.test.commonground.nu/apps/openregister/api/objects/voorzieningen/voorziening';

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${applicatieFormData.id}` : baseUrl;

    try {
      const response = await fetch(url, {
        method: method,
        body: JSON.stringify({
          naam: applicatieFormData.name,
          beschrijving: applicatieFormData.description,
          voorzieningstypeId: applicatieFormData.type,
          categorie: applicatieFormData.category,
          functionaliteiten: applicatieFormData.functionalities
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
          doelgroep: applicatieFormData.targetGroups,
          referentieComponenten: applicatieFormData.referenceComponents
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
          standaarden: applicatieFormData.standards
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
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
            placeholder='Selecteer een applicatieType'
            value={types?.find((option) => option.id === applicatieFormData.type)}
            className='ac-beheer-select'
            onChange={(e) => {
              setApplicatieFormData((prev) => ({
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
