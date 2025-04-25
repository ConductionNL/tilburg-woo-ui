import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';
import ReactSelect from 'react-select';

const AcOrganisatieFormModal = ({
  organisatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [organisatieFormData, setOrganisatieFormData] = useState({
    naam: '',
    type: '',
    kvkNummer: '',
    oidn: '',
    moederOrganisatie: '',
    sector: '',
    organisatietype: '',
    website: '',
    adres: {
      straat: '',
      huisnummer: '',
      postcode: '',
      plaats: '',
      land: '',
    },
    contactgegevens: {
      telefoon: '',
      email: '',
      contactpersoon: '',
    },
    beschrijving: '',
    logo: '',
    voorzieningen: [],
    gebruik: [],
    deelnemerIn: [],
  });

  const [organisaties, setOrganisaties] = useState([]);
  useEffect(async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      setError('Geen toegangstoken gevonden');
      modalRef?.current?.close();
      return;
    }

    const response = await fetch(
      'https://vng.test.commonground.nu/apps/openregister/api/objects/9/16',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = (await response.json()).results;
    setOrganisaties(data);
  }, []);

  // load contract data into the form
  useEffect(() => {
    if (organisatie && isEdit) {
      setOrganisatieFormData((prev) => ({
        ...prev,
        ...organisatie,
        voorzieningen: Array.isArray(organisatie.voorzieningen)
          ? organisatie.voorzieningen.join(', ')
          : organisatie.voorzieningen,
        gebruik: Array.isArray(organisatie.gebruik)
          ? organisatie.gebruik.join(', ')
          : organisatie.gebruik,
        deelnemerIn: !Array.isArray(organisatie.deelnemerIn) // ensure deelnemerIn is an array for backwards compatibility
          ? organisatie.deelnemerIn.split(', ')
          : organisatie.deelnemerIn,
      }));
    }
    if (!organisatie && !isEdit) {
      setOrganisatieFormData(() => ({
        naam: '',
        type: '',
        kvkNummer: '',
        oidn: '',
        moederOrganisatie: '',
        sector: '',
        organisatietype: '',
        website: '',
        adres: {
          straat: '',
          huisnummer: '',
          postcode: '',
          plaats: '',
          land: '',
        },
        contactgegevens: {
          telefoon: '',
          email: '',
          contactpersoon: '',
        },
        beschrijving: '',
        logo: '',
        voorzieningen: [],
        gebruik: [],
        deelnemerIn: [],
      }));
    }
  }, [organisatie, isEdit]);

  const handleEditOrganisatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditOrganisatieFieldChange = (field) => (value) => {
    setOrganisatieFormData((prev) => ({
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
      const baseUrl =
        'https://vng.test.commonground.nu/apps/openregister/api/objects/9/16';

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${baseUrl}/${organisatieFormData.id}` : baseUrl;

      const response = await fetch(url, {
        method: method,
        body: JSON.stringify({
          ...organisatieFormData,
          voorzieningen: organisatieFormData.voorzieningen
            .trim()
            .split(/ *, */g)
            .filter(Boolean),
          gebruik: organisatieFormData.gebruik
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
      handleEditOrganisatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditOrganisatieCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditOrganisatieCloseModal);
  }, [modalRef.current]);

  const mapOrganisatieToValue = useCallback(
    (organisatie) => ({
      label: organisatie.naam,
      value: organisatie.id,
    }),
    []
  );

  const renderOrganisatieFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-organisatie-modal'
      title={isEdit ? 'Organisatie bewerken' : 'Organisatie toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('naam')}
          value={organisatieFormData.naam}
        />
        <AcFormField
          label='Type'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('type')}
          value={organisatieFormData.type}
        />
        <AcFormField
          label='KvK nummer'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('kvkNummer')}
          value={organisatieFormData.kvkNummer}
        />
        <AcFormField
          label='OIDN'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('oidn')}
          value={organisatieFormData.oidn}
        />
        <AcFormField
          label='Moeder Organisatie'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('moederOrganisatie')}
          value={organisatieFormData.moederOrganisatie}
        />
        <AcFormField
          label='Sector'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('sector')}
          value={organisatieFormData.sector}
        />
        <AcFormField
          label='Organisatietype'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('organisatietype')}
          value={organisatieFormData.organisatietype}
        />
        <AcFormField
          label='Website'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('website')}
          value={organisatieFormData.website}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('beschrijving')}
          value={organisatieFormData.beschrijving}
        />
        <AcFormField
          label='Logo'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('logo')}
          value={organisatieFormData.logo}
        />
        <AcFormField
          label='Voorzieningen'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('voorzieningen')}
          value={organisatieFormData.voorzieningen}
        />
        <AcFormField
          label='Gebruik'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('gebruik')}
          value={organisatieFormData.gebruik}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Deelnemer In</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een organisatie'
            value={organisaties
              .filter((organisatie) =>
                organisatieFormData.deelnemerIn.includes(organisatie.id)
              )
              .map(mapOrganisatieToValue)}
            isMulti
            className='ac-beheer-select'
            onChange={(selectedOptions) => {
              handleEditOrganisatieFieldChange('deelnemerIn')(
                selectedOptions ? selectedOptions.map((option) => option.value) : []
              );
            }}
            loading={organisaties?.length === 0}
            options={organisaties
              ?.filter((organisatie) => organisatie.id !== organisatieFormData?.id)
              ?.map(mapOrganisatieToValue)}
          />
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderOrganisatieFormModal;
};

export default withStore(observer(AcOrganisatieFormModal));
