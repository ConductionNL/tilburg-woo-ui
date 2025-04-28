import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';
import ReactSelect from 'react-select';

const AcContractFormModal = ({
  contract,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [contractFormData, setContractFormData] = useState({
    provisionSupply: '',
    provisionUse: '',
    startDate: '',
    endDate: '',
    contractNumber: '',
    contractType: '',
    costs: 0,
    costsPeriod: '',
    contactPersonProvider: {
      name: '',
      email: '',
    },
    contactPersonUser: {
      name: '',
      email: '',
    },
    documentReference: '',
    status: '',
    notes: '',
  });

  const contractTypes = [
    { id: 'SLA', label: 'SLA' },
    { id: 'Licentie', label: 'Licentie' },
    { id: 'Onderhoud', label: 'Onderhoud' },
  ];
  const kostenPeriodes = [
    { id: 'Maandelijks', label: 'Maandelijks' },
    { id: 'Jaarlijks', label: 'Jaarlijks' },
    { id: 'Eenmalig', label: 'Eenmalig' },
  ];
  const statuses = [
    { id: 'Actief', label: 'Actief' },
    { id: 'Verlopen', label: 'Verlopen' },
    { id: 'Inonderhandeling', label: 'Inonderhandeling' },
  ];

  // load contract data into the form
  useEffect(() => {
    if (contract && isEdit) {
      setContractFormData((prev) => ({
        ...prev,
        provisionSupply: contract.voorzieningAanbod,
        provisionUse: contract.voorzieningGebruik,
        startDate: contract.startDatum,
        endDate: contract.eindDatum,
        contractNumber: contract.contractNummer,
        contractType: contract.contractType,
        costs: contract.kosten,
        costsPeriod: contract.kostenPeriode,
        contactPersonProvider: {
          name: contract.contactPersoonAanbieder.naam,
          email: contract.contactPersoonAanbieder.email,
        },
        contactPersonUser: {
          name: contract.contactPersoonGebruiker.naam,
          email: contract.contactPersoonGebruiker.email,
        },
        documentReference: contract.documentReferentie,
        status: contract.status,
        notes: contract.opmerkingen,
      }));
    }
    if (!contract && !isEdit) {
      setContractFormData(() => ({
        provisionSupply: '',
        provisionUse: '',
        startDate: '',
        endDate: '',
        contractNumber: '',
        contractType: '',
        costs: 0,
        costsPeriod: '',
        contactPersonProvider: {
          name: '',
          email: '',
        },
        contactPersonUser: {
          name: '',
          email: '',
        },
        documentReference: '',
        status: '',
        notes: '',
      }));
    }
  }, [contract, isEdit]);

  const handleEditContractOpenModal = () => modalRef?.current?.showModal();

  const handleEditContractFieldChange = (field, subField) => (value) => {
    if (subField) {
      setContractFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value,
        },
      }));
    } else {
      setContractFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
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
      'https://vng.test.commonground.nu/apps/openregister/api/objects/contract/contract';

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${contractFormData.id}` : baseUrl;

    try {
      const response = await fetch(url, {
        method: method,
        body: JSON.stringify({
          voorzieningAanbod: contractFormData.provisionSupply,
          voorzieningGebruik: contractFormData.provisionUse,
          startDatum: contractFormData.startDate,
          eindDatum: contractFormData.endDate,
          contractNummer: contractFormData.contractNumber,
          contractType: contractFormData.contractType,
          kosten: contractFormData.costs,
          kostenPeriode: contractFormData.costsPeriod,
          contactPersoonAanbieder: {
            naam: contractFormData.contactPersonProvider.name,
            email: contractFormData.contactPersonProvider.email,
          },
          contactPersoonGebruiker: {
            naam: contractFormData.contactPersonUser.name,
            email: contractFormData.contactPersonUser.email,
          },
          documentReferentie: contractFormData.documentReference,
          status: contractFormData.status,
          opmerkingen: contractFormData.notes,
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
      handleEditContractOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditContractCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditContractCloseModal);
  }, [modalRef.current]);

  const renderContractFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-contract-modal'
      title={isEdit ? 'Contract bewerken' : 'Contract toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Voorziening Aanbod'
          type='text'
          onBlur={handleEditContractFieldChange('provisionSupply')}
          value={contractFormData.provisionSupply}
        />
        <AcFormField
          label='Voorziening Gebruik'
          type='text'
          onBlur={handleEditContractFieldChange('provisionUse')}
          value={contractFormData.provisionUse}
        />
        <AcFormField
          label='Startdatum'
          type='date'
          onBlur={handleEditContractFieldChange('startDate')}
          value={contractFormData.startDate}
        />
        <AcFormField
          label='Einddatum'
          type='date'
          onBlur={handleEditContractFieldChange('endDate')}
          value={contractFormData.endDate}
        />
        <AcFormField
          label='Contract Nummer'
          type='text'
          onBlur={handleEditContractFieldChange('contractNumber')}
          value={contractFormData.contractNumber}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contract type</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={contractTypes?.find(
              (option) => option.id === contractFormData.contractType
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setContractFormData((prev) => ({
                ...prev,
                contractType: e.value,
              }));
            }}
            loading={contractTypes?.length === 0}
            options={contractTypes?.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
          />
        </div>
        <AcFormField
          label='Kosten'
          type='number'
          onBlur={handleEditContractFieldChange('costs')}
          value={contractFormData.costs}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Kosten periode</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={kostenPeriodes?.find(
              (option) => option.id === contractFormData.costsPeriod
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setContractFormData((prev) => ({
                ...prev,
                costsPeriod: e.value,
              }));
            }}
            loading={kostenPeriodes?.length === 0}
            options={kostenPeriodes?.map((periode) => ({
              value: periode.id,
              label: periode.label,
            }))}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contactpersoon Aanbieder</h4>
          </label>
          <AcFlex column spacing='sm'>
            <AcFormField
              headingLevel={5}
              label='Naam'
              type='text'
              onBlur={handleEditContractFieldChange('contactPersonProvider', 'name')}
              value={contractFormData.contactPersonProvider.name}
            />
            <AcFormField
              headingLevel={5}
              label='Email'
              type='text'
              onBlur={handleEditContractFieldChange(
                'contactPersonProvider',
                'email'
              )}
              value={contractFormData.contactPersonProvider.email}
            />
          </AcFlex>
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contactpersoon Gebruiker</h4>
          </label>
          <AcFlex column spacing='sm'>
            <AcFormField
              headingLevel={5}
              label='Naam'
              type='text'
              onBlur={handleEditContractFieldChange('contactPersonUser', 'name')}
              value={contractFormData.contactPersonUser.name}
            />
            <AcFormField
              headingLevel={5}
              label='Email'
              type='text'
              onBlur={handleEditContractFieldChange('contactPersonUser', 'email')}
              value={contractFormData.contactPersonUser.email}
            />
          </AcFlex>
        </div>
        <AcFormField
          label='Document Referentie'
          type='text'
          onBlur={handleEditContractFieldChange('documentReference')}
          value={contractFormData.documentReference}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Status</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={statuses?.find((option) => option.id === contractFormData.status)}
            className='ac-beheer-select'
            onChange={(e) => {
              setContractFormData((prev) => ({
                ...prev,
                status: e.value,
              }));
            }}
            loading={statuses?.length === 0}
            options={statuses?.map((status) => ({
              value: status.id,
              label: status.label,
            }))}
          />
        </div>
        <AcFormField
          label='Opmerkingen'
          type='text'
          onBlur={handleEditContractFieldChange('notes')}
          value={contractFormData.notes}
        />
      </AcFlex>
    </AcModal>
  );

  return renderContractFormModal;
};

export default withStore(observer(AcContractFormModal));
