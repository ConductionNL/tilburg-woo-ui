import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS, LANGUAGES } from '@constants';
import { AcCheckbox, AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import _ from 'lodash';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import clsx from 'clsx';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import AcColumn from '@src/atoms/ac-column/ac-column';
import { AcFlex } from '@src/atoms';
import { Switch } from '@amsterdam/design-system-react';

// create option for creatable select
const createOption = (label) => ({
  label,
  value: label.toLowerCase().replace(/\W/g, ''),
});

const AcGebruikersFormModal = ({
  gebruiker,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const initialData = {
    username: '',
    email: '',
    voornaam: '',
    achternaam: '',
    functie: '',
    organisatie: '',
    telefoonnummer: '',
    rollen: [], // as array
    actief: true,
    laatsteInlogdatum: '', // as date
    aanmaakdatum: '', // as date
    wijzigingsdatum: '', // as date
    voorkeuren: { taal: '', thema: '' },
  };

  const rollenOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
  ];

  // form data
  const [gebruikerFormData, setGebruikerFormData] = useState({});
  const [schema, setSchema] = useState(null);

  // nextcloud requests
  const { makeRequest } = useNextcloudRequests();

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/gebruiker`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

  useEffect(() => {
    // Set the form data in 1 go
    // This is a simple and compact way to conditionally set the form data
    // if preSelectedVoorziening is provided, set the voorziening to the preSelectedVoorziening
    // if dienst is provided, set the form data to the dienst data
    setGebruikerFormData({
      // initial data
      ..._.cloneDeep(initialData),
      // data to edit (only if data is provided and isEdit is true)
      ...(gebruiker &&
        isEdit && {
          ...gebruiker,
        }),
    });
  }, [gebruiker, showModal]);

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

  const endpoint = 'openregister/api/objects/voorzieningen/gebruiker';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${gebruikerFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...gebruikerFormData,
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
        <AcFormField
          label='Gebruikersnaam'
          type='text'
          onBlur={handleEditGebruikerFieldChange('username')}
          value={gebruikerFormData.username}
          {...(schema?.properties?.username?.required && {
            hasError: !gebruikerFormData?.username,
            required: true,
          })}
        />
        <AcFormField
          label='E-mail'
          type='email'
          onBlur={handleEditGebruikerFieldChange('email')}
          value={gebruikerFormData.email}
          {...(schema?.properties?.email?.required && {
            hasError: !gebruikerFormData?.email,
            required: true,
          })}
        />
        <AcFormField
          label='Voornaam'
          type='text'
          onBlur={handleEditGebruikerFieldChange('voornaam')}
          value={gebruikerFormData.voornaam}
          {...(schema?.properties?.voornaam?.required && {
            hasError: !gebruikerFormData?.voornaam,
            required: true,
          })}
        />
        <AcFormField
          label='Achternaam'
          type='text'
          onBlur={handleEditGebruikerFieldChange('achternaam')}
          value={gebruikerFormData.achternaam}
          {...(schema?.properties?.achternaam?.required && {
            hasError: !gebruikerFormData?.achternaam,
            required: true,
          })}
        />
        <AcFormField
          label='Functie'
          type='text'
          onBlur={handleEditGebruikerFieldChange('functie')}
          value={gebruikerFormData.functie}
          {...(schema?.properties?.functie?.required && {
            hasError: !gebruikerFormData?.functie,
            required: true,
          })}
        />
        <AcFormField
          label='Organisatie'
          type='text'
          onBlur={handleEditGebruikerFieldChange('organisatie')}
          value={gebruikerFormData.organisatie}
          {...(schema?.properties?.organisatie?.required && {
            hasError: !gebruikerFormData?.organisatie,
            required: true,
          })}
        />
        <AcFormField
          label='Telefoonnummer'
          type='tel'
          onBlur={handleEditGebruikerFieldChange('telefoonnummer')}
          value={gebruikerFormData.telefoonnummer}
          {...(schema?.properties?.telefoonnummer?.required && {
            hasError: !gebruikerFormData?.telefoonnummer,
            required: true,
          })}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Rollen</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer of maak een rol aan'
            className={clsx('ac-beheer-select')}
            value={rollenOptions.filter((option) =>
              gebruikerFormData?.rollen?.includes(option.value)
            )}
            onChange={(e) => {
              setGebruikerFormData((prev) => ({
                ...prev,
                rollen: e.map((option) => option.value),
              }));
            }}
            options={rollenOptions}
            closeMenuOnSelect={false}
            isMulti
            {...(schema?.properties?.rollen?.required && {
              required: true,
            })}
            {...(!schema?.properties?.rollen?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Voorkeur</h4>
          </label>
          <AcGrid columns={2}>
            <div>
              <label className='utrecht-form-label'>
                <h5 className='utrecht-heading-5'>Taal</h5>
              </label>
              <ReactSelect
                placeholder='Selecteer een taal'
                value={mapLanguageToValue(
                  LANGUAGES?.find(
                    (language) =>
                      language.code === gebruikerFormData?.voorkeuren?.taal
                  )
                )}
                className='ac-beheer-select'
                onChange={(e) => {
                  handleEditGebruikerFieldChange('voorkeuren.taal')(e?.value ?? e);
                }}
                loading={LANGUAGES?.length === 0}
                options={LANGUAGES?.map(mapLanguageToValue)}
                {...(schema?.properties?.voorkeuren?.taal?.required && {
                  required: true,
                })}
                {...(!schema?.properties?.voorkeuren?.taal?.required && {
                  isClearable: true,
                })}
              />
            </div>
            <div>
              <label className='utrecht-form-label'>
                <h5 className='utrecht-heading-5'>Thema</h5>
              </label>
              <ReactSelect
                placeholder='Selecteer een thema'
                value={{
                  label: _.upperFirst(gebruikerFormData?.voorkeuren?.thema),
                  value: gebruikerFormData?.voorkeuren?.thema,
                }}
                className='ac-beheer-select'
                onChange={(e) => {
                  handleEditGebruikerFieldChange('voorkeuren.thema')(e?.value ?? e);
                }}
                options={[
                  { label: 'Licht', value: 'licht' },
                  { label: 'Donker', value: 'donker' },
                  { label: 'Systeem', value: 'systeem' },
                ]}
                {...(schema?.properties?.voorkeuren?.thema?.required && {
                  required: true,
                })}
                {...(!schema?.properties?.voorkeuren?.thema?.required && {
                  isClearable: true,
                })}
              />
            </div>
          </AcGrid>
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Actief</h4>
          </label>
          <AcCheckbox
            // label='Actief'
            onChange={handleEditGebruikerFieldChange('actief')}
            checked={gebruikerFormData.actief}
          />
        </div>
      </AcGrid>
    </AcModal>
  );

  return renderGebruikerFormModal;
};

export default withStore(observer(AcGebruikersFormModal));
