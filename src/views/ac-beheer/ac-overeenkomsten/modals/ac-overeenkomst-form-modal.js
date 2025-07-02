import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';

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

  const [schema, setSchema] = useState(null);

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

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setSchemaLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/contract`
        );
        const data = response.data;
        setSchema(data);
      } catch (error) {
        console.error(error);
      }
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

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

  const endpoint = 'openregister/api/objects/voorzieningen/contract';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

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
          label='Voorziening Aanbod'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('voorzieningAanbod')}
          value={overeenkomstFormData.voorzieningAanbod}
          {...(schema?.properties?.voorzieningAanbod?.required && {
            hasError: !overeenkomstFormData.voorzieningAanbod,
            required: true,
          })}
          placeholder={schema?.properties?.voorzieningAanbod?.example}
        />
        <AcFormField
          label='Voorziening Gebruik'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('voorzieningGebruik')}
          value={overeenkomstFormData.voorzieningGebruik}
          {...(schema?.properties?.voorzieningGebruik?.required && {
            hasError: !overeenkomstFormData.voorzieningGebruik,
            required: true,
          })}
          placeholder={schema?.properties?.voorzieningGebruik?.example}
        />
        <AcFormField
          label='Startdatum'
          type='date'
          onBlur={handleEditOvereenkomstFieldChange('startDatum')}
          value={overeenkomstFormData.startDatum}
          {...(schema?.properties?.startDatum?.required && {
            hasError: !overeenkomstFormData.startDatum,
            required: true,
          })}
          placeholder={schema?.properties?.startDatum?.example}
        />
        <AcFormField
          label='Einddatum'
          type='date'
          onBlur={handleEditOvereenkomstFieldChange('eindDatum')}
          value={overeenkomstFormData.eindDatum}
          {...(schema?.properties?.eindDatum?.required && {
            hasError: !overeenkomstFormData.eindDatum,
            required: true,
          })}
          placeholder={schema?.properties?.eindDatum?.example}
        />
        <AcFormField
          label='Contract Nummer'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('contractNummer')}
          value={overeenkomstFormData.contractNummer}
          {...(schema?.properties?.contractNummer?.required && {
            hasError: !overeenkomstFormData.contractNummer,
            required: true,
          })}
          placeholder={schema?.properties?.contractNummer?.example}
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
                contractType: e?.value ?? e,
              }));
            }}
            loading={contractTypes?.length === 0}
            options={contractTypes?.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
            {...(schema?.properties?.contractType?.required && {
              required: true,
            })}
            {...(!schema?.properties?.contractType?.required && {
              isClearable: true,
            })}
          />
        </div>
        <AcFormField
          label='Kosten'
          type='number'
          onBlur={handleEditOvereenkomstFieldChange('kosten')}
          value={overeenkomstFormData.kosten}
          {...(schema?.properties?.kosten?.required && {
            hasError: !overeenkomstFormData.kosten,
            required: true,
          })}
          placeholder={schema?.properties?.kosten?.example}
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
                kostenPeriode: e?.value ?? e,
              }));
            }}
            loading={kostenPeriodes?.length === 0}
            options={kostenPeriodes?.map((periode) => ({
              value: periode.id,
              label: periode.label,
            }))}
            {...(schema?.properties?.kostenPeriode?.required && {
              required: true,
            })}
            {...(!schema?.properties?.kostenPeriode?.required && {
              isClearable: true,
            })}
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
              {...(schema?.properties?.contactpersoonAanbieder?.naam?.required && {
                hasError: !overeenkomstFormData.contactpersoonAanbieder.naam,
                required: true,
              })}
              placeholder={schema?.properties?.contactpersoonAanbieder?.email?.example}
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
              {...(schema?.properties?.contactpersoonAanbieder?.email?.required && {
                hasError: !overeenkomstFormData.contactpersoonAanbieder.email,
                required: true,
              })}
              placeholder={schema?.properties?.contactpersoonAanbieder?.email?.example}
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
              {...(schema?.properties?.contactpersoonGebruiker?.naam?.required && {
                hasError: !overeenkomstFormData.contactpersoonGebruiker.naam,
                required: true,
              })}
              placeholder={schema?.properties?.contactpersoonGebruiker?.email?.example}
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
              {...(schema?.properties?.contactpersoonGebruiker?.email?.required && {
                hasError: !overeenkomstFormData.contactpersoonGebruiker.email,
                required: true,
              })}
              placeholder={schema?.properties?.contactpersoonGebruiker?.email?.example}
            />
          </AcFlex>
        </div>
        <AcFormField
          label='Document Referentie'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('documentReferentie')}
          value={overeenkomstFormData.documentReferentie}
          {...(schema?.properties?.documentReferentie?.required && {
            hasError: !overeenkomstFormData.documentReferentie,
            required: true,
          })}
          placeholder={schema?.properties?.documentReferentie?.example}
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
                status: e?.value ?? e,
              }));
            }}
            loading={statuses?.length === 0}
            options={statuses?.map((status) => ({
              value: status.id,
              label: status.label,
            }))}
            {...(schema?.properties?.status?.required && {
              required: true,
            })}
            {...(!schema?.properties?.status?.required && {
              isClearable: true,
            })}
          />
        </div>
        <AcFormField
          label='Opmerkingen'
          type='text'
          onBlur={handleEditOvereenkomstFieldChange('opmerkingen')}
          value={overeenkomstFormData.opmerkingen}
          {...(schema?.properties?.opmerkingen?.required && {
            hasError: !overeenkomstFormData.opmerkingen,
            required: true,
          })}
          placeholder={schema?.properties?.opmerkingen?.example}
        />
      </AcFlex>
    </AcModal>
  );

  return renderOvereenkomstFormModal;
};

export default withStore(observer(AcOvereenkomstFormModal));
