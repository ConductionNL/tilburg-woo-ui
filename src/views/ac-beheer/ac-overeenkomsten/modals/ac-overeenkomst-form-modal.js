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
    voorzieningAanbod: '', // extended object, as id
    voorzieningGebruik: '', // extended object, as id
    startDatum: '',
    eindDatum: '',
    contractNummer: '',
    contractType: '',
    kosten: 0,
    kostenPeriode: '',
    contactpersoonAanbieder: {
      id: '',
      naam: '',
      email: '',
    },
    contactpersoonGebruiker: {
      id: '',
      naam: '',
      email: '',
    },
    documentReferentie: '',
    status: '',
    opmerkingen: '',
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
        ...overeenkomst,
        id: overeenkomst.id,
        // === convert extended objects to ids ================
        voorzieningAanbod: overeenkomst.voorzieningAanbod?.id,
        voorzieningGebruik: overeenkomst.voorzieningGebruik?.id,
        // ====================================================
        startDatum: overeenkomst.startDatum,
        eindDatum: overeenkomst.eindDatum,
        contractNummer: overeenkomst.contractNummer,
        contractType: overeenkomst.contractType,
        kosten: overeenkomst.kosten,
        kostenPeriode: overeenkomst.kostenPeriode,
        contactpersoonAanbieder: {
          id: overeenkomst.contactPersoonAanbieder?.id,
          naam: overeenkomst.contactPersoonAanbieder?.naam,
          email: overeenkomst.contactPersoonAanbieder?.email,
        },
        contactpersoonGebruiker: {
          id: overeenkomst.contactPersoonGebruiker?.id,
          naam: overeenkomst.contactPersoonGebruiker?.naam,
          email: overeenkomst.contactPersoonGebruiker?.email,
        },
        documentReferentie: overeenkomst.documentReferentie,
        status: overeenkomst.status,
        opmerkingen: overeenkomst.opmerkingen,
      }));
    }
    if (!overeenkomst && !isEdit) {
      setOvereenkomstFormData(() => ({
        voorzieningAanbod: '',
        voorzieningGebruik: '',
        startDatum: '',
        eindDatum: '',
        contractNummer: '',
        contractType: '',
        kosten: 0,
        kostenPeriode: '',
        contactpersoonAanbieder: {
          id: '',
          naam: '',
          email: '',
        },
        contactpersoonGebruiker: {
          id: '',
          naam: '',
          email: '',
        },
        documentReferentie: '',
        status: '',
        opmerkingen: '',
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
          voorzieningAanbod: overeenkomstFormData.voorzieningAanbod,
          voorzieningGebruik: overeenkomstFormData.voorzieningGebruik,
          startDatum: overeenkomstFormData.startDatum,
          eindDatum: overeenkomstFormData.eindDatum,
          contractNummer: overeenkomstFormData.contractNummer,
          contractType: overeenkomstFormData.contractType,
          kosten: overeenkomstFormData.kosten,
          kostenPeriode: overeenkomstFormData.kostenPeriode,
          contactPersoonAanbieder: {
            id: overeenkomstFormData.contactpersoonAanbieder.id,
            naam: overeenkomstFormData.contactpersoonAanbieder.naam,
            email: overeenkomstFormData.contactpersoonAanbieder.email,
          },
          contactPersoonGebruiker: {
            id: overeenkomstFormData.contactpersoonGebruiker.id,
            naam: overeenkomstFormData.contactpersoonGebruiker.naam,
            email: overeenkomstFormData.contactpersoonGebruiker.email,
          },
          documentReferentie: overeenkomstFormData.documentReferentie,
          status: overeenkomstFormData.status,
          opmerkingen: overeenkomstFormData.opmerkingen,
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
          onBlur={handleEditOvereenkomstFieldChange('voorzieningAanbod')}
          value={overeenkomstFormData.voorzieningAanbod}
        />
        <AcFormField
          label='Voorziening Gebruik'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('voorzieningGebruik')}
          value={overeenkomstFormData.voorzieningGebruik}
        />
        <AcFormField
          label='Startdatum'
          type='date'
          onBlur={handleEditOvereenkomstFieldChange('startDatum')}
          value={overeenkomstFormData.startDatum}
        />
        <AcFormField
          label='Einddatum'
          type='date'
          onBlur={handleEditOvereenkomstFieldChange('eindDatum')}
          value={overeenkomstFormData.eindDatum}
        />
        <AcFormField
          label='Contract Nummer'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('contractNummer')}
          value={overeenkomstFormData.contractNummer}
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
          onBlur={handleEditOvereenkomstFieldChange('kosten')}
          value={overeenkomstFormData.kosten}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Kosten periode</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contract type'
            value={kostenPeriodes?.find(
              (option) => option.id === overeenkomstFormData.kostenPeriode
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setOvereenkomstFormData((prev) => ({
                ...prev,
                kostenPeriode: e.value,
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
                'contactpersoonAanbieder',
                'naam'
              )}
              value={overeenkomstFormData.contactpersoonAanbieder.naam}
            />
            <AcFormField
              headingLevel={5}
              label='Email'
              type='text'
              onBlur={handleEditOvereenkomstFieldChange(
                'contactpersoonAanbieder',
                'email'
              )}
              value={overeenkomstFormData.contactpersoonAanbieder.email}
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
              onBlur={handleEditOvereenkomstFieldChange(
                'contactpersoonGebruiker',
                'naam'
              )}
              value={overeenkomstFormData.contactpersoonGebruiker.naam}
            />
            <AcFormField
              headingLevel={5}
              label='Email'
              type='text'
              onBlur={handleEditOvereenkomstFieldChange(
                'contactpersoonGebruiker',
                'email'
              )}
              value={overeenkomstFormData.contactpersoonGebruiker.email}
            />
          </AcFlex>
        </div>
        <AcFormField
          label='Document Referentie'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('documentReferentie')}
          value={overeenkomstFormData.documentReferentie}
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
          onBlur={handleEditOvereenkomstFieldChange('opmerkingen')}
          value={overeenkomstFormData.opmerkingen}
        />
      </AcFlex>
    </AcModal>
  );

  return renderOvereenkomstFormModal;
};

export default withStore(observer(AcOvereenkomstFormModal));
