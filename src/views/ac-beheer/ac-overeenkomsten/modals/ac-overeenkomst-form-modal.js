import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

const AcOvereenkomstFormModal = ({
  overeenkomst,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [overeenkomstFormData, setOvereenkomstFormData] = useState({
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

  const { makeRequest } = useNextcloudRequests();

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

  // load overeenkomst (contract) data into the form
  useEffect(() => {
    if (overeenkomst && isEdit) {
      setOvereenkomstFormData((prev) => ({
        ...prev,
        provisionSupply: overeenkomst.voorzieningAanbod,
        provisionUse: overeenkomst.voorzieningGebruik,
        startDate: overeenkomst.startDatum,
        endDate: overeenkomst.eindDatum,
        contractNumber: overeenkomst.contractNummer,
        contractType: overeenkomst.contractType,
        costs: overeenkomst.kosten,
        costsPeriod: overeenkomst.kostenPeriode,
        contactPersonProvider: {
          name: overeenkomst.contactPersoonAanbieder.naam,
          email: overeenkomst.contactPersoonAanbieder.email,
        },
        contactPersonUser: {
          name: overeenkomst.contactPersoonGebruiker.naam,
          email: overeenkomst.contactPersoonGebruiker.email,
        },
        documentReference: overeenkomst.documentReferentie,
        status: overeenkomst.status,
        notes: overeenkomst.opmerkingen,
      }));
    }
    if (!overeenkomst && !isEdit) {
      setOvereenkomstFormData(() => ({
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
  }, [overeenkomst, isEdit]);

  const handleEditOvereenkomstOpenModal = () => modalRef?.current?.showModal();

  const handleEditOvereenkomstFieldChange = (field, subField) => (value) => {
    if (subField) {
      setOvereenkomstFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value,
        },
      }));
    } else {
      setOvereenkomstFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const baseUrl =
      'https://vng.test.commonground.nu/apps/openregister/api/objects/contract/contract';

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${overeenkomstFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          voorzieningAanbod: overeenkomstFormData.provisionSupply,
          voorzieningGebruik: overeenkomstFormData.provisionUse,
          startDatum: overeenkomstFormData.startDate,
          eindDatum: overeenkomstFormData.endDate,
          contractNummer: overeenkomstFormData.contractNumber,
          contractType: overeenkomstFormData.contractType,
          kosten: overeenkomstFormData.costs,
          kostenPeriode: overeenkomstFormData.costsPeriod,
          contactPersoonAanbieder: {
            naam: overeenkomstFormData.contactPersonProvider.name,
            email: overeenkomstFormData.contactPersonProvider.email,
          },
          contactPersoonGebruiker: {
            naam: overeenkomstFormData.contactPersonUser.name,
            email: overeenkomstFormData.contactPersonUser.email,
          },
          documentReferentie: overeenkomstFormData.documentReference,
          status: overeenkomstFormData.status,
          opmerkingen: overeenkomstFormData.notes,
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
      handleEditOvereenkomstOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditOvereenkomstCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditOvereenkomstCloseModal);
  }, [modalRef.current]);

  const renderOvereenkomstFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-overeenkomst-modal'
      title={isEdit ? 'Overeenkomst bewerken' : 'Overeenkomst toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Voorziening Aanbod'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('provisionSupply')}
          value={overeenkomstFormData.provisionSupply}
        />
        <AcFormField
          label='Voorziening Gebruik'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('provisionUse')}
          value={overeenkomstFormData.provisionUse}
        />
        <AcFormField
          label='Startdatum'
          type='date'
          onBlur={handleEditOvereenkomstFieldChange('startDate')}
          value={overeenkomstFormData.startDate}
        />
        <AcFormField
          label='Einddatum'
          type='date'
          onBlur={handleEditOvereenkomstFieldChange('endDate')}
          value={overeenkomstFormData.endDate}
        />
        <AcFormField
          label='Contract Nummer'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('contractNumber')}
          value={overeenkomstFormData.contractNumber}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contract type</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={contractTypes?.find(
              (option) => option.id === overeenkomstFormData.contractType
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setOvereenkomstFormData((prev) => ({
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
          onBlur={handleEditOvereenkomstFieldChange('costs')}
          value={overeenkomstFormData.costs}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Kosten periode</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={kostenPeriodes?.find(
              (option) => option.id === overeenkomstFormData.costsPeriod
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setOvereenkomstFormData((prev) => ({
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
              onBlur={handleEditOvereenkomstFieldChange(
                'contactPersonProvider',
                'name'
              )}
              value={overeenkomstFormData.contactPersonProvider.name}
            />
            <AcFormField
              headingLevel={5}
              label='Email'
              type='text'
              onBlur={handleEditOvereenkomstFieldChange(
                'contactPersonProvider',
                'email'
              )}
              value={overeenkomstFormData.contactPersonProvider.email}
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
              onBlur={handleEditOvereenkomstFieldChange('contactPersonUser', 'name')}
              value={overeenkomstFormData.contactPersonUser.name}
            />
            <AcFormField
              headingLevel={5}
              label='Email'
              type='text'
              onBlur={handleEditOvereenkomstFieldChange(
                'contactPersonUser',
                'email'
              )}
              value={overeenkomstFormData.contactPersonUser.email}
            />
          </AcFlex>
        </div>
        <AcFormField
          label='Document Referentie'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('documentReference')}
          value={overeenkomstFormData.documentReference}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Status</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={statuses?.find(
              (option) => option.id === overeenkomstFormData.status
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setOvereenkomstFormData((prev) => ({
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
          onBlur={handleEditOvereenkomstFieldChange('notes')}
          value={overeenkomstFormData.notes}
        />
      </AcFlex>
    </AcModal>
  );

  return renderOvereenkomstFormModal;
};

export default withStore(observer(AcOvereenkomstFormModal));
