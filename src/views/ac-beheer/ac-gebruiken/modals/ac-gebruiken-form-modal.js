import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcCheckbox, AcFormField } from '@src/molecules';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { collapseExtendedObjects } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';
import ReactSelect from 'react-select';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import clsx from 'clsx';
import { DateInput } from '@amsterdam/design-system-react';
import _ from 'lodash';

const AcGebruikenFormModal = ({
  gebruik,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
  preSelectedOrganisatieId = '',
  preSelectedVoorzieningId = '',
}) => {
  const modalRef = useRef(null);

  const initialData = {
    organisatieId: '',
    voorzieningId: '',
    versieId: '',
    // beheerder: {
    //   naam: '',
    //   email: '',
    //   telefoon: '',
    //   functie: '',
    // },
    beheerder: '',
    eigenaar: '',
    startDatum: '',
    status: '',
    bbnScore: '',
    ibpScore: '',
    bivClassificatie: {
      beschikbaarheid: '',
      integriteit: '',
      vertrouwelijkheid: '',
    },
    bedrijfsKritisch: false,
    privacyGevoelig: false,
    hosting: '',
    contact: '',
  };

  const hostingOptions = [
    { label: 'On-premises', value: 'on-premises' },
    { label: 'SaaS', value: 'SaaS' },
    { label: 'PaaS', value: 'PaaS' },
    { label: 'hybride', value: 'hybride' },
  ];

  const [gebruikFormData, setGebruikFormData] = useState({});
  const [schema, setSchema] = useState(null);

  const [organisatieOptions, setOrganisatieOptions] = useState([]);
  const [organisatieLoading, setOrganisatieLoading] = useState(false);
  const [voorzieningenOptions, setVoorzieningenOptions] = useState([]);
  const [voorzieningenLoading, setVoorzieningenLoading] = useState(false);
  const [versiesOptions, setVersiesOptions] = useState([]); // based on selected voorziening
  const [versiesLoading, setVersiesLoading] = useState(false);
  const [gebruikersOptions, setGebruikersOptions] = useState([]);
  const [gebruikersLoading, setGebruikersLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const { makeRequest } = useNextcloudRequests();

  useEffect(() => {
    const fetchOrganisaties = async () => {
      try {
        setOrganisatieLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie`
        );
        const data = response.data.results;
        setOrganisatieOptions(
          data.map((item) => ({
            label: item.naam ?? item.id,
            value: item.id,
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setOrganisatieLoading(false);
      }
    };

    const fetchVoorzieningen = async () => {
      try {
        setVoorzieningenLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorziening`
        );
        const data = response.data.results;
        const voorzieningenOptions = data.map((item) => ({
          label: item.naam,
          value: item.id,
        }));
        setVoorzieningenOptions(voorzieningenOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setVoorzieningenLoading(false);
      }
    };

    const fetchSchema = async () => {
      try {
        setSchemaLoading(true);
        const response = await makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/voorzieninggebruik`
        );
        const data = response.data;
        setSchema(data);
      } catch (error) {
        console.error(error);
      } finally {
        setSchemaLoading(false);
      }
    };

    const fetchGebruikers = async () => {
      setGebruikersLoading(true);
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/gebruiker`
      ).finally(() => setGebruikersLoading(false));

      const data = response.data.results;

      setGebruikersOptions(
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
      fetchOrganisaties();
      fetchVoorzieningen();
      fetchSchema();
      fetchGebruikers();
    }
  }, [showModal]);

  // get versies
  useEffect(async () => {
    try {
      setVersiesLoading(true);
      const aanbodResponse = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorzieningaanbod?voorziening=${gebruikFormData.voorzieningId}`
      );
      const data = aanbodResponse.data.results;
      const aanbodIds = data.map((item) => item.id);

      if (!aanbodIds.length) {
        setVersiesLoading(false);
        return;
      }

      const versieResponse = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/voorzieningversie`,
        aanbodIds.map((id) => ['voorzieningaanbod[]', id])
      );
      const versies = versieResponse.data.results;

      setVersiesOptions(
        versies.map((item) => ({
          label: item.versienummer,
          value: item.id,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setVersiesLoading(false);
    }
  }, [gebruikFormData.voorzieningId]);

  useEffect(() => {
    setGebruikFormData({
      ..._.cloneDeep(initialData),
      // set pre selected values
      organisatieId: preSelectedOrganisatieId,
      voorzieningId: preSelectedVoorzieningId,
      // if edit modal
      ...(gebruik &&
        isEdit && {
          ...gebruik,
          voorzieningId: collapseExtendedObjects(gebruik.voorzieningId),
          versieId: collapseExtendedObjects(gebruik.versieId),
          organisatieId: collapseExtendedObjects(gebruik.organisatieId),
          contact: collapseExtendedObjects(gebruik.contact, 'username'),
        }),
    });
  }, [gebruik, isEdit]);

  const handleEditGebruikOpenModal = () => modalRef?.current?.showModal();

  const handleEditGebruikFieldChange = (field) => (value) => {
    setGebruikFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieninggebruik';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${gebruikFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...gebruikFormData,
          ...(gebruikFormData.status &&
            gebruikFormData.status !== (gebruik?.status || initialData.status) && {
              [`startDatum${gebruikFormData.status}`]: new Date().toISOString(),
            }),
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
      handleEditGebruikOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditGebruikCloseModal = () => {
    setGebruikFormData(initialData);
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditGebruikCloseModal);
  }, [modalRef.current]);

  const renderGebruikFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-gebruik-modal'
      title={isEdit ? 'Gebruik bewerken' : 'Gebruik toevoegen'}
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
            <h4 className='utrecht-heading-4'>Organisatie</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een organisatie'
            className={clsx(
              'ac-beheer-select',
              preSelectedOrganisatieId && 'ac-beheer-select--disabled'
            )}
            value={organisatieOptions?.filter(
              (option) => gebruikFormData?.organisatieId === option.value
            )}
            onChange={(e) => {
              setGebruikFormData((prev) => ({
                ...prev,
                organisatieId: e?.value ?? e,
              }));
            }}
            isLoading={organisatieLoading}
            options={organisatieOptions}
            isDisabled={preSelectedOrganisatieId}
            {...(schema?.properties?.organisatie?.required && {
              required: true,
            })}
            {...(!schema?.properties?.organisatie?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Applicatie</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een applicatie'
            className={clsx(
              'ac-beheer-select',
              preSelectedVoorzieningId && 'ac-beheer-select--disabled'
            )}
            value={voorzieningenOptions?.filter(
              (option) => gebruikFormData?.voorzieningId === option.value
            )}
            onChange={(e) => {
              setGebruikFormData((prev) => ({
                ...prev,
                voorzieningId: e?.value ?? e,
              }));
            }}
            isLoading={voorzieningenLoading}
            options={voorzieningenOptions}
            isDisabled={preSelectedVoorzieningId}
            {...(schema?.properties?.voorzieningId?.required && {
              required: true,
            })}
            {...(!schema?.properties?.voorzieningId?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Status</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een status'
            className={clsx('ac-beheer-select')}
            value={
              gebruikFormData?.status &&
              schema?.properties?.status?.enum?.includes(
                gebruikFormData?.status
              ) && {
                label: gebruikFormData?.status,
                value: gebruikFormData?.status,
              }
            }
            onChange={(e) => {
              setGebruikFormData((prev) => ({
                ...prev,
                status: e?.value ?? e,
              }));
            }}
            isLoading={schemaLoading}
            options={(schema?.properties?.status?.enum || []).map((item) => ({
              label: item,
              value: item,
            }))}
            {...(schema?.properties?.status?.required && {
              required: true,
            })}
            {...(!schema?.properties?.status?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Versie</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een versie'
            className={clsx('ac-beheer-select')}
            value={versiesOptions?.filter(
              (option) => gebruikFormData?.versieId === option.value
            )}
            onChange={(e) => {
              setGebruikFormData((prev) => ({
                ...prev,
                versieId: e?.value ?? e,
              }));
            }}
            isLoading={versiesLoading}
            options={versiesOptions}
            isDisabled={!gebruikFormData.voorzieningId}
            {...(schema?.properties?.versieId?.required && {
              required: true,
            })}
            {...(!schema?.properties?.versieId?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Startdatum</h4>
          </label>
          <DateInput
            className='ac-beheer-date-input'
            onChange={(e) =>
              handleEditGebruikFieldChange('startDatum')(
                e.target.value && new Date(e.target.value).toISOString()
              )
            }
            {...(schema?.properties?.startDatum?.required && {
              required: true,
            })}
          />
        </div>
        <AcFormField
          label='BBN Score'
          type='text'
          onBlur={handleEditGebruikFieldChange('bbnScore')}
          value={gebruikFormData.bbnScore}
          {...(schema?.properties?.bbnScore?.required && {
            hasError: !gebruikFormData?.bbnScore,
            required: true,
          })}
        />
        <AcFormField
          label='IBP Score'
          type='text'
          onBlur={handleEditGebruikFieldChange('ibpScore')}
          value={gebruikFormData.ibpScore}
          {...(schema?.properties?.ibpScore?.required && {
            hasError: !gebruikFormData?.ibpScore,
            required: true,
          })}
        />
        <div className='ac-modal-grid-checkboxes'>
          <AcCheckbox
            label='BedrijfsKritisch'
            checked={gebruikFormData.bedrijfsKritisch}
            onChange={handleEditGebruikFieldChange('bedrijfsKritisch')}
          />
          <AcCheckbox
            label='Privacy Gevoelig'
            checked={gebruikFormData.privacyGevoelig}
            onChange={handleEditGebruikFieldChange('privacyGevoelig')}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Hosting</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een hosting'
            className={clsx('ac-beheer-select')}
            value={hostingOptions?.filter(
              (option) => gebruikFormData?.hosting === option.value
            )}
            onChange={(e) => {
              setGebruikFormData((prev) => ({
                ...prev,
                hosting: e?.value ?? e,
              }));
            }}
            isLoading={organisatieLoading}
            options={hostingOptions}
            {...(schema?.properties?.hosting?.required && {
              required: true,
            })}
            {...(!schema?.properties?.hosting?.required && {
              isClearable: true,
            })}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>
            <h4 className='utrecht-heading-4'>Contact</h4>
          </label>
          <ReactSelect
            placeholder='Selecteer een contact'
            value={gebruikersOptions?.find(
              (option) => option.value === gebruikFormData.contact
            )}
            className='ac-beheer-select'
            onChange={(e) => {
              setGebruikFormData((prev) => ({
                ...prev,
                contact: e?.value ?? e,
              }));
            }}
            loading={gebruikersLoading}
            options={gebruikersOptions}
            {...(schema?.properties?.contact?.required && {
              required: true,
            })}
            {...(!schema?.properties?.contact?.required && {
              isClearable: true,
            })}
          />
        </div>
        <AcFormField
          label='Beheerder'
          type='text'
          onBlur={handleEditGebruikFieldChange('beheerder')}
          value={gebruikFormData.beheerder}
          {...(schema?.properties?.beheerder?.required && {
            hasError: !gebruikFormData?.beheerder,
            required: true,
          })}
        />
        <AcFormField
          label='Eigenaar'
          type='text'
          onBlur={handleEditGebruikFieldChange('eigenaar')}
          value={gebruikFormData.eigenaar}
          {...(schema?.properties?.eigenaar?.required && {
            hasError: !gebruikFormData?.eigenaar,
            required: true,
          })}
        />
      </AcGrid>
    </AcModal>
  );

  return renderGebruikFormModal;
};

export default withStore(observer(AcGebruikenFormModal));
