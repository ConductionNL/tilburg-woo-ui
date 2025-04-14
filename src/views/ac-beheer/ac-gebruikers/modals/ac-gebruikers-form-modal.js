import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS, LANGUAGES } from '@constants';
import { AcFlex } from '@atoms';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';
import ReactSelect from 'react-select';
import _ from 'lodash';

const AcGebruikersFormModal = ({
  gebruiker,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [gebruikerFormData, setGebruikerFormData] = useState({
    username: '',
    email: '',
    voornaam: '',
    achternaam: '',
    functie: '',
    organisatie: '',
    telefoonnummer: '',
    rollen: '', // as array
    actief: true,
    laatsteInlogdatum: '', // as date
    aanmaakdatum: '', // as date
    wijzigingsdatum: '', // as date
    voorkeuren: { taal: '', thema: '' },
  });

  // load gebruiker data into the form
  useEffect(() => {
    if (gebruiker && isEdit) {
      setGebruikerFormData((prev) => ({
        ...prev,
        ...gebruiker,
        rollen: Array.isArray(gebruiker.rollen)
          ? gebruiker.rollen.join(', ')
          : gebruiker.rollen,
      }));
    }
    if (!gebruiker && !isEdit) {
      setGebruikerFormData(() => ({
        username: '',
        email: '',
        voornaam: '',
        achternaam: '',
        functie: '',
        organisatie: '',
        telefoonnummer: '',
        rollen: '',
        actief: true,
        laatsteInlogdatum: '',
        aanmaakdatum: '',
        wijzigingsdatum: '',
        voorkeuren: { taal: '', thema: '' },
      }));
    }
  }, [gebruiker, isEdit]);

  const handleEditGebruikerOpenModal = () => modalRef?.current?.showModal();

  const handleEditGebruikerFieldChange = (field) => (value) => {
    if (field.includes('.')) {
      // Handle nested object updates
      const parts = field.split('.');
      setGebruikerFormData((prev) => {
        let current = { ...prev };
        let temp = current;

        // Navigate through all but last part
        for (let i = 0; i < parts.length - 1; i++) {
          temp[parts[i]] = { ...temp[parts[i]] };
          temp = temp[parts[i]];
        }

        // Set value on deepest level
        temp[parts[parts.length - 1]] = value;

        return current;
      });
    } else {
      setGebruikerFormData((prev) => ({
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

    try {
      const baseUrl =
        'https://vng.accept.commonground.nu/apps/openconnector/api/endpoint/gebruikers';

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${baseUrl}/${gebruikerFormData.id}` : baseUrl;

      const response = await fetch(url, {
        method: method,
        body: JSON.stringify({
          ...gebruikerFormData,
          rollen: gebruikerFormData.rollen.trim().split(/ *, */g).filter(Boolean),
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
      handleEditGebruikerOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditGebruikerCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditGebruikerCloseModal);
  }, [modalRef.current]);

  const mapLanguageToValue = useCallback((language) => {
    if (!language) return LANGUAGES.find((language) => language.code === 'NL-nl');
    return {
      label: language.name,
      value: language.code,
    };
  }, []);

  const renderGebruikerFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-gebruiker-modal'
      title={isEdit ? 'Gebruiker bewerken' : 'Gebruiker toevoegen'}
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Gebruikersnaam'
          type='text'
          onBlur={handleEditGebruikerFieldChange('username')}
          value={gebruikerFormData.username}
        />
        <AcFormField
          label='E-mail'
          type='email'
          onBlur={handleEditGebruikerFieldChange('email')}
          value={gebruikerFormData.email}
        />
        <AcFormField
          label='Voornaam'
          type='text'
          onBlur={handleEditGebruikerFieldChange('voornaam')}
          value={gebruikerFormData.voornaam}
        />
        <AcFormField
          label='Achternaam'
          type='text'
          onBlur={handleEditGebruikerFieldChange('achternaam')}
          value={gebruikerFormData.achternaam}
        />
        <AcFormField
          label='Functie'
          type='text'
          onBlur={handleEditGebruikerFieldChange('functie')}
          value={gebruikerFormData.functie}
        />
        <AcFormField
          label='Organisatie'
          type='text'
          onBlur={handleEditGebruikerFieldChange('organisatie')}
          value={gebruikerFormData.organisatie}
        />
        <AcFormField
          label='Telefoonnummer'
          type='tel'
          onBlur={handleEditGebruikerFieldChange('telefoonnummer')}
          value={gebruikerFormData.telefoonnummer}
        />
        <AcFormField
          label='Rollen'
          type='text'
          onBlur={handleEditGebruikerFieldChange('rollen')}
          value={gebruikerFormData.rollen}
        />
        <AcCheckbox
          label='Actief'
          onChange={handleEditGebruikerFieldChange('actief')}
          checked={gebruikerFormData.actief}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Voorkeur</h4>
          </label>
          <label className='utrecht-form-label'>
            <h5 className='utrecht-heading-5'>Taal</h5>
          </label>
          <ReactSelect
            placeholder='Selecteer een taal'
            value={mapLanguageToValue(
              LANGUAGES?.find(
                (language) => language.code === gebruikerFormData.voorkeuren.taal
              )
            )}
            className='ac-beheer-select'
            onChange={(selectedOption) => {
              handleEditGebruikerFieldChange('voorkeuren.taal')(
                selectedOption?.value || ''
              );
            }}
            loading={LANGUAGES?.length === 0}
            options={LANGUAGES?.map(mapLanguageToValue)}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h5 className='utrecht-heading-5'>Thema</h5>
          </label>
          <ReactSelect
            placeholder='Selecteer een thema'
            value={{
              label: _.upperFirst(gebruikerFormData.voorkeuren.thema),
              value: gebruikerFormData.voorkeuren.thema,
            }}
            className='ac-beheer-select'
            onChange={(selectedOption) => {
              handleEditGebruikerFieldChange('voorkeuren.thema')(
                selectedOption?.value || ''
              );
            }}
            options={[
              { label: 'Licht', value: 'licht' },
              { label: 'Donker', value: 'donker' },
              { label: 'Systeem', value: 'systeem' },
            ]}
          />
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderGebruikerFormModal;
};

export default withStore(observer(AcGebruikersFormModal));
