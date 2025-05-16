import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import { VISUALS } from '@constants';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';
import licenses from '@assets/licenses/licenses.json';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import clsx from 'clsx';
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

  const initialData = {
    voorziening: '',
    leverancier: '',
    productpagina: '',
    ondersteuningsopties: '',
    prijsmodel: '',
    certificeringen: '',
    ondersteundeStandaarden: '',
    licentie: '',
  };

  const [dienstFormData, setDienstFormData] = useState({});

  const [voorzieningOptions, setVoorzieningOptions] = useState([]);
  const [voorzieningenLoading, setVoorzieningenLoading] = useState(false);
  const [leverancierOptions, setLeverancierOptions] = useState([]);
  const [leveranciersLoading, setLeveranciersLoading] = useState(false);

  const [licenseOptions, setLicenseOptions] = useState([]);
  useEffect(() => {
    setLicenseOptions(
      licenses.map((license) => ({
        label: license.name,
        value: license['SPDX ID'],
      }))
    );
  }, []);

  const { makeRequest } = useNextcloudRequests();

  //   fetch voorzieningen
  useEffect(() => {
    const fetchVoorzieningen = async () => {
      try {
        setVoorzieningenLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorziening`
        );
        const data = (await response.json()).results;
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
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie`
        );
        const data = (await response.json()).results;
        const options = data.map((leverancier) => ({
          label: leverancier.organisatienaam,
          value: leverancier.id,
        }));
        setLeverancierOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLeveranciersLoading(false);
      }
    };

    if (showModal) {
      fetchVoorzieningen();
      fetchLeveranciers();
    }
  }, [showModal]);

  useEffect(() => {
    // Set the form data in 1 go
    // This is a simple and compact way to conditionally set the form data
    // if preSelectedVoorziening is provided, set the voorziening to the preSelectedVoorziening
    // if dienst is provided, set the form data to the dienst data
    setDienstFormData({
      // initial data
      ...initialData,
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

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningaanbod';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${dienstFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
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
    setDienstFormData(initialData);
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
      <AcGrid columns={2}>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Voorziening</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een voorziening'
            className={clsx(
              'ac-beheer-select',
              preSelectedVoorziening && 'ac-beheer-select--disabled'
            )}
            value={voorzieningOptions?.filter(
              (option) => dienstFormData?.voorziening === option.value
            )}
            onChange={(e) => {
              setDienstFormData((prev) => ({
                ...prev,
                voorziening: e.value,
              }));
            }}
            isLoading={voorzieningenLoading}
            options={voorzieningOptions}
            isDisabled={preSelectedVoorziening}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Leverancier</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een leverancier'
            className='ac-beheer-select'
            value={leverancierOptions?.filter(
              (option) => dienstFormData?.leverancier === option.value
            )}
            onChange={(e) => {
              setDienstFormData((prev) => ({
                ...prev,
                leverancier: e.value,
              }));
            }}
            isLoading={leveranciersLoading}
            options={leverancierOptions}
          />
        </div>
        <AcFormField
          label='Productpagina'
          type='text'
          onBlur={handleEditDienstFieldChange('productpagina')}
          value={dienstFormData.productpagina}
        />
        <AcFormField
          label='Ondersteuningsopties'
          type='text'
          onBlur={handleEditDienstFieldChange('ondersteuningsopties')}
          value={dienstFormData.ondersteuningsopties}
        />
        <AcFormField
          label='Ondersteunde standaarden'
          type='text'
          onBlur={handleEditDienstFieldChange('ondersteundeStandaarden')}
          value={dienstFormData.ondersteundeStandaarden}
        />
        <AcFormField
          label='Certificeringen'
          type='text'
          onBlur={handleEditDienstFieldChange('certificeringen')}
          value={dienstFormData.certificeringen}
        />
        <AcFormField
          label='Prijsmodel'
          type='text'
          onBlur={handleEditDienstFieldChange('prijsmodel')}
          value={dienstFormData.prijsmodel}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>licentie</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een licentie'
            className='ac-beheer-select'
            value={licenseOptions?.filter(
              (option) => dienstFormData?.licentie === option.value
            )}
            onChange={(e) => {
              setDienstFormData((prev) => ({
                ...prev,
                licentie: e.value,
              }));
            }}
            options={licenseOptions}
          />
        </div>
      </AcGrid>
    </AcModal>
  );

  return renderDienstFormModal;
};

export default withStore(observer(AcDienstFormModal));
