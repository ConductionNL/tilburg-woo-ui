import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';
import AcGrid from '@src/atoms/ac-grid/ac-grid';

const createOption = (label) => ({
  label,
  value: label,
});

const AcOrganisatieFormModal = ({
  organisatie,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const initialFormData = {
    contactgegevens: '',
    website: '',
    links: '',
    oin: '',
    status: '',
    logo: '',
    cbs: '',
    telefoonnummer: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    contactpersonen: '',
    samenwerkingen: '',
    verklaringen: '',
    id: '',
    naam: '',
    type: '',
    kvkNummer: '',
    'e-mailadres': '',
  };

  const [organisatieFormData, setOrganisatieFormData] = useState({});
  const [schema, setSchema] = useState(null);

  const [linksOptions, setLinksOptions] = useState([]);
  const [verklaringenOptions, setVerklaringenOptions] = useState([]);
  const [contactpersonenOptions, setContactpersonenOptions] = useState([]);

  const { makeRequest } = useNextcloudRequests();

  const endpoint = 'openregister/api/objects/voorzieningen/organisatie';

  const extend = [['_extend[]', 'contactgegevens']];

  const [organisaties, setOrganisaties] = useState([]);
  const samenwerkingenData = useMemo(() => {
    return organisaties
      .filter((organisatie) => organisatie?.type?.toLowerCase() === 'samenwerking')
      .filter((organisatie) => organisatie.id !== organisatieFormData?.id);
  }, [organisaties]);

  useEffect(async () => {
    const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, extend);

    const data = response.data.results;
    setOrganisaties(data);
  }, []);

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/organisatie`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchSchema();
    }
  }, [showModal]);

  // load organisatie data into the form
  useEffect(() => {
    setOrganisatieFormData({
      // initial data
      ...initialFormData,
      // data to edit (only if data is provided and isEdit is true)
      ...(organisatie &&
        isEdit && {
          ...organisatie,
          contactgegevens: collapseExtendedObjects(organisatie.contactgegevens),
        }),
    });
  }, [organisatie, showModal]);

  const handleEditOrganisatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditOrganisatieFieldChange = (field) => (value) => {
    setOrganisatieFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      const baseUrl = `${BASE_URL}/apps/${endpoint}`;

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${baseUrl}/${organisatieFormData.id}` : baseUrl;

      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...organisatieFormData,
          contactgegevens: smartSplit(organisatieFormData.contactgegevens),
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

  const handleCreateLinkOption = (inputValue) => {
    const newOption = createOption(inputValue);
    setLinksOptions((prev) => [...prev, newOption]);
    setOrganisatieFormData((prev) => ({
      ...prev,
      links: [...prev.links, inputValue],
    }));
  };

  const handleCreateVerklaringOption = (inputValue) => {
    const newOption = createOption(inputValue);
    setVerklaringenOptions((prev) => [...prev, newOption]);
    setOrganisatieFormData((prev) => ({
      ...prev,
      verklaringen: [...prev.verklaringen, inputValue],
    }));
  };

  const handleCreateContactpersoonOption = (inputValue) => {
    const newOption = createOption(inputValue);
    setContactpersonenOptions((prev) => [...prev, newOption]);
    setOrganisatieFormData((prev) => ({
      ...prev,
      contactpersonen: [...prev.contactpersonen, inputValue],
    }));
  };

  const renderOrganisatieFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-organisatie-modal'
      title={isEdit ? 'Organisatie bewerken' : 'Organisatie toevoegen'}
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
          label='Naam'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('naam')}
          value={organisatieFormData.naam}
          {...(schema?.properties?.naam?.required && {
            hasError: !organisatieFormData.naam,
            required: true,
          })}
        />
        <AcFormField
          label='Contactgegevens'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('contactgegevens')}
          value={organisatieFormData.contactgegevens}
          {...(schema?.properties?.contactgegevens?.required && {
            hasError: !organisatieFormData.contactgegevens,
            required: true,
          })}
        />
        <AcFormField
          label='Website'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('website')}
          value={organisatieFormData.website}
          {...(schema?.properties?.website?.required && {
            hasError: !organisatieFormData.website,
            required: true,
          })}
        />
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Links</h4>
          </label>
          <CreatableSelect
            placeholder='Voeg een link toe'
            className='ac-beheer-select'
            isMulti
            closeMenuOnSelect={false}
            value={(organisatieFormData?.links || []).map((link) => ({
              value: link,
              label: link,
            }))}
            onChange={(e) => {
              setOrganisatieFormData((prev) => ({
                ...prev,
                links: e.map((item) => item.value),
              }));
            }}
            onCreateOption={handleCreateLinkOption}
            options={linksOptions}
            {...(schema?.properties?.links?.required && {
              required: true,
            })}
            {...(!schema?.properties?.links?.required && {
              isClearable: true,
            })}
          />
        </div>
        <AcFormField
          label='OIN'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('oin')}
          value={organisatieFormData.oin}
          {...(schema?.properties?.oin?.required && {
            hasError: !organisatieFormData.oin,
            required: true,
          })}
        />
        <AcFormField
          label='Status'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('status')}
          value={organisatieFormData.status}
          {...(schema?.properties?.status?.required && {
            hasError: !organisatieFormData.status,
            required: true,
          })}
        />
        <AcFormField
          label='Logo'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('logo')}
          value={organisatieFormData.logo}
          {...(schema?.properties?.logo?.required && {
            hasError: !organisatieFormData.logo,
            required: true,
          })}
        />
        <AcFormField
          label='CBS'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('cbs')}
          value={organisatieFormData.cbs}
          {...(schema?.properties?.cbs?.required && {
            hasError: !organisatieFormData.cbs,
            required: true,
          })}
        />
        <AcFormField
          label='Telefoonnummer'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('telefoonnummer')}
          value={organisatieFormData.telefoonnummer}
          {...(schema?.properties?.telefoonnummer?.required && {
            hasError: !organisatieFormData.telefoonnummer,
            required: true,
          })}
          autocomplete='off'
        />
        <AcFormField
          label='Beschrijving kort'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('beschrijvingKort')}
          value={organisatieFormData.beschrijvingKort}
          {...(schema?.properties?.beschrijvingKort?.required && {
            hasError: !organisatieFormData.beschrijvingKort,
            required: true,
          })}
        />
        <AcFormField
          label='Beschrijving lang'
          type='text'
          onChange={handleEditOrganisatieFieldChange('beschrijvingLang')}
          value={organisatieFormData.beschrijvingLang}
          {...(schema?.properties?.beschrijvingLang?.required && {
            hasError: !organisatieFormData.beschrijvingLang,
            required: true,
          })}
        />
        {/* <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contactpersonen</h4>
          </label>
          <CreatableSelect
            placeholder='Voeg een contactpersoon toe'
            className='ac-beheer-select'
            isMulti
            closeMenuOnSelect={false}
            value={(organisatieFormData?.contactpersonen || []).map(
              (contactpersoon) => ({
                value: contactpersoon,
                label: contactpersoon,
              })
            )}
            onChange={(e) => {
              setOrganisatieFormData((prev) => ({
                ...prev,
                contactpersonen: e.map((item) => item.value),
              }));
            }}
            onCreateOption={handleCreateContactpersoonOption}
            options={contactpersonenOptions}
            {...(schema?.properties?.contactpersonen?.required && {
              required: true,
            })}
            {...(!schema?.properties?.contactpersonen?.required && {
              isClearable: true,
            })}
          />
        </div> */}
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Samenwerkingen</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een samenwerking'
            className='ac-beheer-select'
            isMulti
            closeMenuOnSelect={false}
            value={(organisatieFormData?.samenwerkingen || []).map(
              (samenwerkingId) => {
                const samenwerking = samenwerkingenData.find(
                  (org) => org.id === samenwerkingId
                );
                if (!samenwerking) return;
                return {
                  value: samenwerking.id,
                  label: samenwerking.naam,
                };
              }
            )}
            onChange={(e) => {
              setOrganisatieFormData((prev) => ({
                ...prev,
                samenwerkingen: e.map((item) => item.value),
              }));
            }}
            options={samenwerkingenData?.map((organisatie) => ({
              value: organisatie.id,
              label: organisatie.naam,
            }))}
            {...(schema?.properties?.samenwerkingen?.required && {
              required: true,
            })}
            {...(!schema?.properties?.samenwerkingen?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Verklaringen</h4>
          </label>
          <CreatableSelect
            placeholder='Voeg een verklaring toe'
            className='ac-beheer-select'
            isMulti
            closeMenuOnSelect={false}
            value={(organisatieFormData?.verklaringen || []).map((verklaring) => ({
              value: verklaring,
              label: verklaring,
            }))}
            onChange={(e) => {
              setOrganisatieFormData((prev) => ({
                ...prev,
                verklaringen: e.map((item) => item.value),
              }));
            }}
            onCreateOption={handleCreateVerklaringOption}
            options={verklaringenOptions}
            {...(schema?.properties?.verklaringen?.required && {
              required: true,
            })}
            {...(!schema?.properties?.verklaringen?.required && {
              isClearable: true,
            })}
          />
        </div>
        <AcFormField
          label='Type'
          type='text'
          onChange={handleEditOrganisatieFieldChange('type')}
          value={organisatieFormData.type}
          {...(schema?.properties?.type?.required && {
            hasError: !organisatieFormData.type,
            required: true,
          })}
        />
        <AcFormField
          label='KvK nummer'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('kvkNummer')}
          value={organisatieFormData.kvkNummer}
          {...(schema?.properties?.kvkNummer?.required && {
            hasError: !organisatieFormData.kvkNummer,
            required: true,
          })}
        />
        <AcFormField
          label='E-mailadres'
          type='text'
          onChange={handleEditOrganisatieFieldChange('e-mailadres')}
          value={organisatieFormData['e-mailadres']}
          {...(schema?.properties?.['e-mailadres']?.required && {
            hasError: !organisatieFormData['e-mailadres'],
            required: true,
          })}
          autocomplete='off'
        />
      </AcGrid>
    </AcModal>
  );

  return renderOrganisatieFormModal;
};

export default withStore(observer(AcOrganisatieFormModal));
