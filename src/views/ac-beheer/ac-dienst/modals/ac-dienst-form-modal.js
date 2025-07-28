import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { VISUALS } from '@constants';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import licenses from '@assets/licenses/licenses.json';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import clsx from 'clsx';
import _ from 'lodash';

const AcDienstFormModal = ({
  dienst,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
  /** the voorziening ID that is pre-selected in the modal */
  preSelectedVoorziening,
}) => {
  const modalRef = useRef(null);
  const formRef = useRef(null);

  const initialData = {
    voorziening: '',
    leverancier: '',
    productpagina: '',
    ondersteuningsopties: '',
    prijsmodel: '',
    certificeringen: '',
    ondersteundeStandaarden: '',
    licentie: '',
    contact: '',
  };

  const ondersteuningsoptiesOptions = [
    { label: 'Functioneel beheer', value: 'Functioneel beheer' },
    { label: 'Applicatiebeheer', value: 'Applicatiebeheer' },
    { label: 'Technisch beheer', value: 'Technisch beheer' },
    { label: 'Implementatieondersteuning', value: 'Implementatieondersteuning' },
    { label: 'Opleidingen', value: 'Opleidingen' },
    { label: 'Licentiereseller', value: 'Licentiereseller' },
  ];

  const [dienstFormData, setDienstFormData] = useState({});
  const [schema, setSchema] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const [voorzieningOptions, setVoorzieningOptions] = useState([]);
  const [voorzieningenLoading, setVoorzieningenLoading] = useState(false);
  const [leverancierOptions, setLeverancierOptions] = useState([]);
  const [leveranciersLoading, setLeveranciersLoading] = useState(false);
  const [contactpersonenOptions, setContactpersonenOptions] = useState([]);
  const [contactpersonenLoading, setContactpersonenLoading] = useState(false);

  const [licenseOptions, setLicenseOptions] = useState([]);
  useEffect(() => {
    setLicenseOptions(
      licenses.map((license) => ({
        label: license.name,
        value: license['SPDX ID'],
      }))
    );
  }, []);

  const nextcloud = useNextcloudRequests();

  //   fetch voorzieningen
  useEffect(() => {
    const fetchSchema = async () => {
      const response = await nextcloud.request(
        `openregister/api/schemas/voorzieningaanbod`
      );
      const data = response.data;
      setSchema(data);
    };

    const fetchVoorzieningen = async () => {
      try {
        setVoorzieningenLoading(true);
        const response = await nextcloud.request(
          `openregister/api/objects/voorzieningen/voorziening`
        );
        const data = response.data.results;
        const options = data.map((voorziening) => ({
          label: voorziening.naam,
          value: voorziening.id,
        }));
        setVoorzieningOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setVoorzieningenLoading(false);
      }
    };

    const fetchLeveranciers = async () => {
      try {
        setLeveranciersLoading(true);
        const response = await nextcloud.request(
          `openregister/api/objects/voorzieningen/organisatie`
        );
        const data = response.data.results;
        const options = data.map((leverancier) => ({
          label: leverancier.naam ?? leverancier.organisatienaam ?? leverancier.id,
          value: leverancier.id,
        }));
        setLeverancierOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLeveranciersLoading(false);
      }
    };

    const fetchContactpersonen = async () => {
      setContactpersonenLoading(true);
      const response = await nextcloud.request(
        `openregister/api/objects/voorzieningen/contactpersoon`
      ).finally(() => setContactpersonenLoading(false));

      const data = response.data.results;

      setContactpersonenOptions(
        data.map((item) => {
          const nameParts = [
            item.voornaam,
            item.tussenvoegsel,
            item.achternaam,
          ].filter(Boolean);

          return {
            value: item.username,
            label: nameParts.join(' '),
          };
        })
      );
    };

    if (showModal) {
      fetchSchema();
      fetchVoorzieningen();
      fetchLeveranciers();
      fetchContactpersonen();
    }
  }, [showModal]);

  useEffect(() => {
    // Set the form data in 1 go
    // This is a simple and compact way to conditionally set the form data
    // if preSelectedVoorziening is provided, set the voorziening to the preSelectedVoorziening
    // if dienst is provided, set the form data to the dienst data
    setDienstFormData({
      // initial data
      ..._.cloneDeep(initialData),
      // custom props and state
      ...(preSelectedVoorziening && { voorziening: preSelectedVoorziening }),
      // data to edit (only if data is provided and isEdit is true)
      ...(dienst &&
        isEdit && {
          ...dienst,
          voorziening: dienst.voorziening?.id ?? dienst.voorzieningId,
          leverancier: dienst.leverancier?.id ?? dienst.organisatieId,
          ondersteuningsopties: Array.isArray(dienst.ondersteuningsopties)
            ? dienst.ondersteuningsopties.join(', ')
            : dienst.ondersteuningsopties,
          certificeringen: Array.isArray(dienst.certificeringen)
            ? dienst.certificeringen.join(', ')
            : dienst.certificeringen,
          ondersteundeStandaarden: collapseExtendedObjects(
            dienst.ondersteundeStandaarden
          ),
          contact: collapseExtendedObjects(dienst.contact, 'username'),
        }),
    });
  }, [dienst, showModal]);

  const handleEditDienstOpenModal = () => modalRef?.current?.showModal();

  const handleEditDienstFieldChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setDienstFormData({
      ...dienstFormData,
      [field]: value,
    });
  };

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningaanbod';

  const handleSubmit = async () => {
    const baseUrl = endpoint;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${dienstFormData.id}` : baseUrl;

    try {
      const response = await nextcloud.request(url, {
        method: method,
        data: JSON.stringify({
          ...dienstFormData,
          voorziening: dienstFormData.voorziening,
          leverancier: dienstFormData.leverancier,
          ondersteuningsopties: smartSplit(dienstFormData.ondersteuningsopties),
          prijsmodel: dienstFormData.prijsmodel,
          certificeringen: smartSplit(dienstFormData.certificeringen),
          ondersteundeStandaarden: smartSplit(
            dienstFormData.ondersteundeStandaarden
          ),
        }),
      });

      if (response.ok) {
        onSuccess?.(response);
        modalRef?.current?.close();
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleEditDienstOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditDienstCloseModal = () => {
    setDienstFormData(_.cloneDeep(initialData));
    formRef.current?.reset();
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditDienstCloseModal);
  }, [modalRef.current]);

  const renderDienstFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-dienst-modal'
      title={isEdit ? 'Dienst bewerken' : 'Dienst toevoegen'}
      layoutClassName='wide-content'
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
      <AcGrid columns={2}>
        <ConDynamicSchemaForm
          ref={formRef}
          schema={schema}
          formData={{
            // Map schema properties to form data fields
            voorziening: dienstFormData.voorziening,
            leverancier: dienstFormData.leverancier,
            productpagina: dienstFormData.productpagina,
            ondersteuningsopties: dienstFormData.ondersteuningsopties,
            prijsmodel: dienstFormData.prijsmodel,
            certificeringen: dienstFormData.certificeringen,
            ondersteundeStandaarden: dienstFormData.ondersteundeStandaarden,
            licentie: dienstFormData.licentie,
            contact: dienstFormData.contact,
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              voorziening: 'voorziening',
              leverancier: 'leverancier',
              productpagina: 'productpagina',
              ondersteuningsopties: 'ondersteuningsopties',
              prijsmodel: 'prijsmodel',
              certificeringen: 'certificeringen',
              ondersteundeStandaarden: 'ondersteundeStandaarden',
              licentie: 'licentie',
              contact: 'contact',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setDienstFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          fieldConfigs={{
            // Hide fields that are not in the current form
            id: { visible: false },
            naam: { visible: false },
            status: { visible: false },
            laag: { visible: false },
            verklaringen: { visible: false },
            hosting: { visible: false },
            versies: { visible: false },
            omvat: { visible: false },
            // Disable voorziening field if preSelectedVoorziening is provided
            voorziening: {
              visible: true,
              disabled: preSelectedVoorziening,
            },
          }}
          optionsProviders={{
            voorziening: voorzieningOptions,
            leverancier: leverancierOptions,
            ondersteuningsopties: ondersteuningsoptiesOptions,
            licentie: licenseOptions,
            contact: contactpersonenOptions,
          }}
          loadingStates={{
            voorziening: voorzieningenLoading,
            leverancier: leveranciersLoading,
            contact: contactpersonenLoading,
          }}
          disabledStates={{}}
          getIsValid={handleFormValidCheck}
        />
      </AcGrid>
    </AcModal>
  );

  return renderDienstFormModal;
};

export default withStore(observer(AcDienstFormModal));
