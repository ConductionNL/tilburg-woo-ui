import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
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
  const formRef = useRef(null);
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
  const [isValid, setIsValid] = useState(false);

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

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
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
    setOvereenkomstFormData(_.cloneDeep(initialData));
    formRef.current?.reset();
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
          formData={{
            // Map schema properties to form data fields
            voorzieningAanbod: overeenkomstFormData.voorzieningAanbod,
            voorzieningGebruik: overeenkomstFormData.voorzieningGebruik,
            startDatum: overeenkomstFormData.startDatum,
            eindDatum: overeenkomstFormData.eindDatum,
            contractNummer: overeenkomstFormData.contractNummer,
            contractType: overeenkomstFormData.contractType,
            kosten: overeenkomstFormData.kosten,
            kostenPeriode: overeenkomstFormData.kostenPeriode,
            contactpersoonAanbieder: overeenkomstFormData.contactpersoonAanbieder,
            contactpersoonGebruiker: overeenkomstFormData.contactpersoonGebruiker,
            documentReferentie: overeenkomstFormData.documentReferentie,
            status: overeenkomstFormData.status,
            opmerkingen: overeenkomstFormData.opmerkingen,
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              voorzieningAanbod: 'voorzieningAanbod',
              voorzieningGebruik: 'voorzieningGebruik',
              startDatum: 'startDatum',
              eindDatum: 'eindDatum',
              contractNummer: 'contractNummer',
              contractType: 'contractType',
              kosten: 'kosten',
              kostenPeriode: 'kostenPeriode',
              contactpersoonAanbieder: 'contactpersoonAanbieder',
              contactpersoonGebruiker: 'contactpersoonGebruiker',
              documentReferentie: 'documentReferentie',
              status: 'status',
              opmerkingen: 'opmerkingen',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setOvereenkomstFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          fieldConfigs={{
            // Hide fields that are not in the current form
            id: { visible: false },
          }}
          optionsProviders={{
            contractType: contractTypes.map((type) => ({
              value: type.id,
              label: type.label,
            })),
            kostenPeriode: kostenPeriodes.map((periode) => ({
              value: periode.id,
              label: periode.label,
            })),
            status: statuses.map((status) => ({
              value: status.id,
              label: status.label,
            })),
          }}
          loadingStates={{}}
          disabledStates={{}}
          getIsValid={handleFormValidCheck}
        />
      </AcFlex>
    </AcModal>
  );

  return renderOvereenkomstFormModal;
};

export default withStore(observer(AcOvereenkomstFormModal));
