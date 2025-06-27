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
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';

// create option for creatable select
const createOption = (label) => ({
  label,
  value: label.toLowerCase().replace(/\W/g, ''),
});

const AcContactpersoonFormModal = ({
  contactpersoon,
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
    voorkeuren: { taal: 'NL-nl', thema: 'licht' },
    aanspreekPunt: false,
  };

  const rollenOptions = [
    // { label: 'Admin', value: 'admin' },
    // { label: 'Editor', value: 'editor' },
    // { label: 'Viewer', value: 'viewer' },
    { label: 'Aanbod-beheerder', value: 'aanbod-beheerder' },
    { label: 'Gebruik-beheerder', value: 'gebruik-beheerder' },
    { label: 'Gebruik-raadpleger', value: 'gebruik-raadpleger' },
    { label: 'Functioneel beheerder', value: 'functioneel beheerder' },
    { label: 'VNG-raadpleger', value: 'VNG-raadpleger' },
    { label: 'Bezoeker', value: 'Bezoeker' },
  ];

  // form data
  const [contactpersoonFormData, setContactpersoonFormData] = useState({});
  const [schema, setSchema] = useState(null);

  const [userInfo, setUserInfo] = useState(null);

  // nextcloud requests
  const { makeRequest, getUser } = useNextcloudRequests();

  const fetchUserInfo = async () => {
    const user = await getUser();
    setUserInfo(user.data);
  };

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/contactpersoon`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
      fetchUserInfo();
    }
  }, [showModal]);

  useEffect(() => {
    // Set the form data in 1 go
    // This is a simple and compact way to conditionally set the form data
    // if preSelectedVoorziening is provided, set the voorziening to the preSelectedVoorziening
    // if dienst is provided, set the form data to the dienst data
    setContactpersoonFormData({
      // initial data
      ..._.cloneDeep(initialData),
      // data to edit (only if data is provided and isEdit is true)
      ...(contactpersoon &&
        isEdit && {
          ...contactpersoon,
        }),
    });
  }, [contactpersoon, showModal]);

  const handleEditContactpersoonOpenModal = () => modalRef?.current?.showModal();

  const handleEditContactpersoonFieldChange = (field) => (value) => {
    if (field.includes('.')) {
      // Handle nested object updates
      const parts = field.split('.');
      setContactpersoonFormData((prev) => {
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
      setContactpersoonFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${contactpersoonFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...contactpersoonFormData,
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
      handleEditContactpersoonOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditContactpersoonCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditContactpersoonCloseModal);
  }, [modalRef.current]);

  const mapLanguageToValue = useCallback((language) => {
    if (!language) return LANGUAGES.find((language) => language.code === 'NL-nl');
    return {
      label: language.name,
      value: language.code,
    };
  }, []);

  const validateRequiredFields = useCallback(() => {
    if (!schema?.properties) return true;

    // Check each property in the schema
    for (const [field, value] of Object.entries(schema.properties)) {
      if (value?.required) {
        // Handle nested properties like voorkeuren.taal
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!contactpersoonFormData?.[parent]?.[child]) {
            return false;
          }
        } else {
          // Handle top level properties
          if (!contactpersoonFormData?.[field]) {
            return false;
          }
        }
      }
    }

    // Special case - telefoon required if aanspreekPunt is true
    if (contactpersoonFormData.aanspreekPunt && !contactpersoonFormData.telefoonnummer) {
      return false;
    }

    return true;
  }, [schema?.properties, contactpersoonFormData]);

  const renderContactpersoonFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-contactpersoon-modal'
      title={isEdit ? 'Contactpersoon bewerken' : 'Contactpersoon toevoegen'}
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
          disabled: !validateRequiredFields(),
        },
      ]}
      disableDefaultButton
    >
      <div className='ac-contactpersonen-form-modal__alert'>
        <Alert type='info'>
          <AcFlex spacing='sm'>
            <VISUALS.INFO_BLUE />
            <Paragraph>
              Verplichte gegevens zijn zichtbaar voor andere contactpersonen.
            </Paragraph>
          </AcFlex>
        </Alert>
      </div>
      <AcGrid columns={2}>
        <AcFormField
          label='Gebruikersnaam'
          type='text'
          onBlur={handleEditContactpersoonFieldChange('username')}
          value={contactpersoonFormData.username}
          {...(schema?.properties?.username?.required && {
            hasError: !contactpersoonFormData?.username,
            required: true,
          })}
        />
        <AcFormField
          label='E-mail'
          type='email'
          onBlur={handleEditContactpersoonFieldChange('email')}
          value={contactpersoonFormData.email}
          {...(schema?.properties?.email?.required && {
            hasError: !contactpersoonFormData?.email,
            required: true,
          })}
        />
        <AcFormField
          label='Voornaam'
          type='text'
          onBlur={handleEditContactpersoonFieldChange('voornaam')}
          value={contactpersoonFormData.voornaam}
          {...(schema?.properties?.voornaam?.required && {
            hasError: !contactpersoonFormData?.voornaam,
            required: true,
          })}
        />
        <AcFormField
          label='Achternaam'
          type='text'
          onBlur={handleEditContactpersoonFieldChange('achternaam')}
          value={contactpersoonFormData.achternaam}
          {...(schema?.properties?.achternaam?.required && {
            hasError: !contactpersoonFormData?.achternaam,
            required: true,
          })}
        />
        <AcFormField
          label='Functie'
          type='text'
          onBlur={handleEditContactpersoonFieldChange('functie')}
          value={contactpersoonFormData.functie}
          {...(schema?.properties?.functie?.required && {
            hasError: !contactpersoonFormData?.functie,
            required: true,
          })}
        />
        <AcFormField
          disabled={userInfo ? !userInfo?.groups?.includes('admin') : true}
          label='Organisatie'
          type='text'
          onBlur={handleEditContactpersoonFieldChange('organisatie')}
          value={contactpersoonFormData.organisatie}
          {...(schema?.properties?.organisatie?.required && {
            hasError: !contactpersoonFormData?.organisatie,
            required: true,
          })}
        />
        <AcFormField
          label='Telefoonnummer'
          type='tel'
          onBlur={handleEditContactpersoonFieldChange('telefoonnummer')}
          value={contactpersoonFormData.telefoonnummer}
          {...((schema?.properties?.telefoonnummer?.required ||
            contactpersoonFormData.aanspreekPunt) && {
            hasError: !contactpersoonFormData?.telefoonnummer,
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
              contactpersoonFormData?.rollen?.includes(option.value)
            )}
            onChange={(e) => {
              setContactpersoonFormData((prev) => ({
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
        {/* <div style={{ gridColumn: 'span 2' }}>
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
                      language.code === contactpersoonFormData?.voorkeuren?.taal
                  )
                )}
                className='ac-beheer-select'
                onChange={(e) => {
                  handleEditContactpersoonFieldChange('voorkeuren.taal')(e?.value ?? e);
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
                  label: _.upperFirst(contactpersoonFormData?.voorkeuren?.thema),
                  value: contactpersoonFormData?.voorkeuren?.thema,
                }}
                className='ac-beheer-select'
                onChange={(e) => {
                  handleEditContactpersoonFieldChange('voorkeuren.thema')(e?.value ?? e);
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
        </div> */}
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Actief</h4>
          </label>
          <AcCheckbox
            // label='Actief'
            onChange={handleEditContactpersoonFieldChange('actief')}
            checked={contactpersoonFormData.actief}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>AanspreekPunt</h4>
          </label>
          <AcCheckbox
            checked={contactpersoonFormData.aanspreekPunt}
            onChange={handleEditContactpersoonFieldChange('aanspreekPunt')}
          />
        </div>
      </AcGrid>
    </AcModal>
  );

  return renderContactpersoonFormModal;
};

export default withStore(observer(AcContactpersoonFormModal));
