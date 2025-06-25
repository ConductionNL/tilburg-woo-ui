import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import {
  AcFlex,
  AcGrid,
  AcSection,
  AcTab,
  AcTabList,
  AcTabPanel,
  AcTabs,
} from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader } from '@components';
import { AcBeheerError } from '@views/ac-beheer';
import { AcFormField, AcLink } from '@molecules';
import { BASE_URL } from '../../ac-beheer';
import { ConHorizontalOverflowWrapper } from '@components';
import {
  Heading,
  Paragraph,
  Button,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
  Link,
  Alert,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import _ from 'lodash';
import AcColumn from '@atoms/ac-column/ac-column';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import AcOrganisatieFormModal from '../modals/ac-organisatie-form-modal';
import AcDeleteOrganisatieModal from '../modals/ac-delete-organisatie-modal';
import ConActionMenu from '../../con-action-menu';
import AcAcceptOrganizationModal from '../modals/ac-accept-organisation';
import ConObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';
import ConLogoPreview from '../../../ac-register/con-logo-preview';
import ReactMarkdown from 'react-markdown';
import AcPublishDepublishOrganizationModal from '../modals/ac-publish-depublish-organisation';
import BeheerTable from '../../con-beheer-table/con-beheer-table';
import AcAddDeelnameModal from '../modals/ac-add-deelname';
import AcContactPersonForm from '../modals/ac-contact-person-form';

const AcBeheerOrganisatieDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usedBy, setUsedBy] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [isEditingKort, setIsEditingKort] = useState(false);
  const [isEditingLang, setIsEditingLang] = useState(false);
  const [tempBeschrijvingKort, setTempBeschrijvingKort] = useState('');
  const [tempBeschrijvingLang, setTempBeschrijvingLang] = useState('');
  const [charCountKort, setCharCountKort] = useState(0);
  const [charCountLang, setCharCountLang] = useState(0);
  const [selectedContactPerson, setSelectedContactPerson] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  // Memoized contact persons with UUIDs
  const contactPersons = useMemo(() => {
    if (!data?.contactpersonen) return [];

    return data.contactpersonen.map((contact) => ({
      ...contact,
      uuid: contact.uuid || crypto.randomUUID(),
    }));
  }, [data?.contactpersonen]);

  const uniqueUsedBySchemas = useMemo(() => {
    if (!usedBy) return [];
    // get a list of unique usedBy based on the schema id
    const uniqueUsedBy = _.uniqBy(usedBy, (item) => item['@self'].schema.id);
    // return the schema object for each unique usedBy
    return uniqueUsedBy.map((item) => item['@self'].schema);
  }, [usedBy]);

  const getUsedByFromSchemaId = useCallback(
    (schemaId) => {
      if (!usedBy) return [];
      return usedBy.filter((item) => item['@self'].schema.id === schemaId);
    },
    [usedBy]
  );

  const { makeRequest } = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'organisatie';

  const fetchData = async () => {
    try {
      setLoading(true);

      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

      const extend = [
        ['_extend[]', 'contactgegevens'],
        ['_extend[]', 'deelnames'],
      ];

      const [response, schemaResponse] = await Promise.all([
        makeRequest(
          `${BASE_URL}/apps/${endpoint}/${id}`,
          extend,
          null,
          `/beheer/organisaties/${id}`
        ),
        makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/${schemaSlug}`,
          null,
          null,
          `/beheer/organisaties/${id}`
        ),
      ]);

      if (!response.ok || !schemaResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const jsonResponse = response.data;
      const schemaJsonResponse = schemaResponse.data;

      const data = jsonResponse;
      const dataProperties = schemaJsonResponse.properties;

      setData(data);
      setDataProperties(dataProperties);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const excludePropertiesBasedOnType = () => {
    if (!data?.type) {
      return [];
    }

    const type = data.type.toLowerCase();

    switch (type) {
      case 'leverancier':
        return ['oin', 'cbs'];
      case 'samenwerking':
      case 'community':
        return ['kvkNummer', 'oin', 'cbs'];
      case 'gemeente':
        return ['kvkNummer'];
      default:
        return [];
    }
  };

  const fetchUsedBy = async (registerSlug, schemaSlug, id) => {
    const response = await makeRequest(
      `${BASE_URL}/apps/openregister/api/objects/${registerSlug}/${schemaSlug}/${id}/used`,
      [['_extend[]', '@self.schema']],
      null,
      `/beheer/organisaties/${id}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch used by');
    }

    setUsedBy(response.data.results);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      fetchUsedBy(registerSlug, schemaSlug, id);
      setCharCountKort(data.beschrijvingKort?.length || 0);
      setCharCountLang(data.beschrijvingLang?.length || 0);
    }
  }, [data]);

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  const handleSaveDescription = async (type) => {
    try {
      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}/${id}`;
      const field = type === 'kort' ? 'beschrijvingKort' : 'beschrijvingLang';
      const value = type === 'kort' ? tempBeschrijvingKort : tempBeschrijvingLang;

      const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: JSON.stringify(value) }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      // Update local state
      setData((prev) => ({
        ...prev,
        [field]: JSON.stringify(value),
      }));

      // Reset edit mode
      if (type === 'kort') {
        setIsEditingKort(false);
      } else {
        setIsEditingLang(false);
      }
    } catch (err) {
      console.error('Error updating description:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleBeschrijvingKortChange = (value) => {
    setTempBeschrijvingKort(value);
    setCharCountKort(value.length);
  };

  const handleBeschrijvingLangChange = (value) => {
    setTempBeschrijvingLang(value);
    setCharCountLang(value.length);
  };

  const handleDeleteContactPerson = async (contactPersonUuid) => {
    try {
      // Remove the contact person from the contactPersons array
      const updatedContactPersons = contactPersons.filter(
        (contact) => contact.uuid !== contactPersonUuid
      );

      // Remove UUIDs from the array before sending to API
      const contactPersonsForApi = updatedContactPersons.map(
        ({ uuid, ...contact }) => contact
      );

      // Update the organization with PATCH request
      const endpoint = `openregister/api/objects/voorzieningen/organisatie/${id}`;
      const updateResponse = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        null,
        {
          method: 'PATCH',
          body: JSON.stringify({
            contactpersonen: contactPersonsForApi,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to delete contact person');
      }

      // Update local state instead of refetching
      setData((prev) => ({
        ...prev,
        contactpersonen: contactPersonsForApi,
      }));
    } catch (err) {
      console.error('Error deleting contact person:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteDeelname = async (deelnameId) => {
    try {
      // Remove the deelname from the deelnames array
      const updatedDeelnames = data.deelnames.filter(
        (deelname) => deelname.id !== deelnameId
      );

      // Update the organization with PATCH request
      const endpoint = `openregister/api/objects/voorzieningen/organisatie/${id}`;
      const updateResponse = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        null,
        {
          method: 'PATCH',
          body: JSON.stringify({
            deelnames: updatedDeelnames.map((deelname) => deelname.id),
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to delete deelname');
      }

      // Update local state instead of refetching
      setData((prev) => ({
        ...prev,
        deelnames: updatedDeelnames,
      }));
    } catch (err) {
      console.error('Error deleting deelname:', err);
      // You might want to show an error message to the user here
    }
  };

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />
        <div className='ac-beheer-details--100-width'>
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && (
              <AcFlex column spacing='xl'>
                <AcFlex column spacing='md'>
                  <div className='ac-header-row'>
                    <AcFlex spacing='sm' className='ac-header-row__logo-container'>
                      {data.logo && (
                        <ConLogoPreview
                          logoUrl={data.logo}
                          className='ac-register-review__logo'
                          style={{ margin: 0 }}
                        />
                      )}
                      <Heading>{data.naam ?? data.id}</Heading>
                    </AcFlex>
                    <ConActionMenu>
                      <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                        Acties
                      </ConActionMenu.Trigger>

                      <ConActionMenu.Menu position='right'>
                        <ConActionMenu.Button icon={<VISUALS.PLUS />}>
                          Toevoegen
                        </ConActionMenu.Button>
                        <ConActionMenu.Button
                          icon={<VISUALS.PENCIL />}
                          onClick={() => setOpenModal('edit')}
                        >
                          Bewerken
                        </ConActionMenu.Button>
                        {data.status !== 'Actief' && (
                          <ConActionMenu.Button
                            icon={<VISUALS.CHECK />}
                            onClick={() => setOpenModal('accept')}
                          >
                            Accepteren
                          </ConActionMenu.Button>
                        )}
                        {!data['@self'].published && (
                          <ConActionMenu.Button
                            icon={<VISUALS.PUBLISH />}
                            onClick={() => setOpenModal('publish')}
                          >
                            Publiceren
                          </ConActionMenu.Button>
                        )}
                        {data['@self'].published && (
                          <ConActionMenu.Button
                            icon={<VISUALS.PUBLISH_OFF />}
                            onClick={() => setOpenModal('depublish')}
                          >
                            Depubliceren
                          </ConActionMenu.Button>
                        )}
                        <ConActionMenu.Button
                          icon={<VISUALS.PLUS />}
                          onClick={() => setOpenModal('addDeelname')}
                        >
                          Deelname toevoegen
                        </ConActionMenu.Button>

                        <ConActionMenu.Divider />

                        <ConActionMenu.Button
                          icon={<VISUALS.TRASHCAN />}
                          onClick={() => setOpenModal('delete')}
                        >
                          Verwijderen
                        </ConActionMenu.Button>
                      </ConActionMenu.Menu>
                    </ConActionMenu>
                  </div>

                  <div>
                    {data.status === 'concept' && (
                      <Alert type='info'>
                        <AcFlex spacing='sm'>
                          <VISUALS.INFO_BLUE />
                          <AcFlex column spacing='xs'>
                            <Paragraph>
                              Deze organisatie bevindt zich nog in de conceptfase en
                              moet eerst door VNG worden goedgekeurd voordat deze
                              zichtbaar wordt voor anderen.
                            </Paragraph>
                          </AcFlex>
                        </AcFlex>
                      </Alert>
                    )}

                    {!data['@self'].published && (
                      <Alert type='warning'>
                        <AcFlex spacing='sm'>
                          <VISUALS.TRIANGLE_EXCLAMATION />
                          <AcFlex column spacing='xs'>
                            <Paragraph className='ac-organisatie-details-alert-paragraph'>
                              Deze organisatie is nog niet gepubliceerd en dus niet
                              zichtbaar voor anderen.
                            </Paragraph>
                          </AcFlex>
                        </AcFlex>
                      </Alert>
                    )}
                  </div>

                  <AcFlex column spacing='sm'>
                    <AcFlex spacing='sm' alignItems='center'>
                      {isEditingKort ? (
                        <div className='ac-organisatie-detail-form ac-organisatie-detail-form--full'>
                          <AcFormField
                            fullWidth={true}
                            inputType='textarea'
                            label='Korte beschrijving'
                            placeholder='Een korte beschrijving van de organisatie'
                            tooltip='Een korte beschrijving van de organisatie'
                            value={tempBeschrijvingKort}
                            onChange={handleBeschrijvingKortChange}
                            disabled={loading}
                            maxLength={255}
                            className='textarea-with-dimensions'
                          />
                          <span className='character-count'>
                            {255 - charCountKort} karakters over
                          </span>
                          <div className='ac-organisatie-detail-form-buttons'>
                            <PrimaryActionButton
                              onClick={() => handleSaveDescription('kort')}
                            >
                              <VISUALS.SAVE className='ac-button__icon' /> Opslaan
                            </PrimaryActionButton>
                            <SecondaryActionButton
                              onClick={() => {
                                setIsEditingKort(false);
                                setTempBeschrijvingKort(data.beschrijvingKort);
                                setCharCountKort(data.beschrijvingKort?.length || 0);
                              }}
                            >
                              <VISUALS.CLOSE className='ac-button__icon' /> Annuleren
                            </SecondaryActionButton>
                          </div>
                        </div>
                      ) : (
                        <div className='ac-description-row'>
                          {data.beschrijvingKort ? (
                            <p>{data.beschrijvingKort}</p>
                          ) : (
                            <span className='ac-description-row-empty'>
                              Geen korte beschrijving
                            </span>
                          )}
                          <Button
                            className='ac-description-edit-btn'
                            appearance='subtle-button'
                            onClick={() => {
                              setIsEditingKort(true);
                              setTempBeschrijvingKort(data.beschrijvingKort);
                              setCharCountKort(data.beschrijvingKort?.length || 0);
                            }}
                          >
                            <VISUALS.PENCIL className='ac-button__icon' /> Bewerken
                          </Button>
                        </div>
                      )}
                    </AcFlex>

                    <AcFlex spacing='sm' alignItems='center'>
                      {isEditingLang ? (
                        <div className='ac-organisatie-detail-form-wrapper'>
                          <div className='ac-organisatie-detail-form'>
                            <div className='ac-organisatie-detail-form-label-row'>
                              <Heading
                                level={3}
                                className='ac-form-field__label-with-icon'
                              >
                                Lange beschrijving
                                <span
                                  className='ac-form-field__tooltip'
                                  title='Een uitgebreide beschrijving van de organisatie'
                                >
                                  <VISUALS.INFO />
                                </span>
                              </Heading>
                            </div>
                            <div className='ac-organisatie-detail-form-flex'>
                              <div className='ac-organisatie-detail-form-textarea'>
                                <AcFormField
                                  label='Invoerveld'
                                  fullWidth={true}
                                  inputType='textarea'
                                  value={tempBeschrijvingLang}
                                  onChange={handleBeschrijvingLangChange}
                                  disabled={loading}
                                  maxLength={2000}
                                  className='ac-organisatie-detail-textarea'
                                  placeholder='Een uitgebreide beschrijving van de organisatie'
                                />
                              </div>
                              <div className='ac-organisatie-detail-form-preview'>
                                <Heading level={4}>Preview</Heading>
                                <div className='ac-organisatie-detail-preview markdown-preview'>
                                  <ReactMarkdown>
                                    {tempBeschrijvingLang}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                            <span className='character-count'>
                              {2000 - charCountLang} karakters over
                            </span>
                            <div className='ac-organisatie-detail-form-buttons'>
                              <PrimaryActionButton
                                onClick={() => handleSaveDescription('lang')}
                              >
                                <VISUALS.SAVE className='ac-button__icon' /> Opslaan
                              </PrimaryActionButton>
                              <SecondaryActionButton
                                onClick={() => {
                                  setIsEditingLang(false);
                                  setTempBeschrijvingLang(data.beschrijvingLang);
                                  setCharCountLang(
                                    data.beschrijvingLang?.length || 0
                                  );
                                }}
                              >
                                <VISUALS.CLOSE className='ac-button__icon' />
                                Annuleren
                              </SecondaryActionButton>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className='ac-description-row'>
                          <div>
                            {(() => {
                              try {
                                return (
                                  <ReactMarkdown>
                                    {JSON.parse(data.beschrijvingLang)}
                                  </ReactMarkdown>
                                );
                              } catch {
                                return (
                                  <span className='ac-description-row-empty'>
                                    Geen uitgebreide beschrijving
                                  </span>
                                );
                              }
                            })()}
                          </div>
                          <Button
                            className='ac-description-edit-btn'
                            appearance='subtle-button'
                            onClick={() => {
                              setIsEditingLang(true);
                              setTempBeschrijvingLang(
                                data.beschrijvingLang
                                  ? (() => {
                                      try {
                                        return JSON.parse(data.beschrijvingLang);
                                      } catch {
                                        return '';
                                      }
                                    })()
                                  : ''
                              );
                              setCharCountLang(
                                data.beschrijvingLang
                                  ? (() => {
                                      try {
                                        return (
                                          JSON.parse(data.beschrijvingLang)
                                            ?.length || 0
                                        );
                                      } catch {
                                        return 0;
                                      }
                                    })()
                                  : 0
                              );
                            }}
                          >
                            <VISUALS.PENCIL className='ac-button__icon' /> Bewerken
                          </Button>
                        </div>
                      )}
                    </AcFlex>
                  </AcFlex>
                </AcFlex>

                {data.contactgegevens && (
                  <div className='ac-organisatie-contactgegevens__container'>
                    <div className='ac-organisatie-contactgegevens__content'>
                      <Heading level={3}>Contactgegevens</Heading>
                      <Paragraph>
                        {[
                          data.contactgegevens.voornaam,
                          data.contactgegevens.tussenvoegsel,
                          data.contactgegevens.achternaam,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </Paragraph>
                      <AcFlex justifyContent='between' className='meta'>
                        <AcGrid
                          columns={2}
                          className='ac-organisatie-contactgegevens__grid'
                        >
                          {data.contactgegevens.email && (
                            <>
                              <span className='ac-organisatie-contactgegevens__label'>
                                Email:
                              </span>
                              <AcLink href={`mailto:${data.contactgegevens.email}`}>
                                {data.contactgegevens.email}
                              </AcLink>
                            </>
                          )}
                          {data.contactgegevens.telefoon && (
                            <>
                              <span className='ac-organisatie-contactgegevens__label'>
                                Telefoon:
                              </span>
                              <AcLink href={`tel:${data.contactgegevens.telefoon}`}>
                                {data.contactgegevens.telefoon}
                              </AcLink>
                            </>
                          )}
                        </AcGrid>
                      </AcFlex>
                    </div>
                  </div>
                )}

                <AcColumn gap='md'>
                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      {Object.entries(dataProperties)
                        .filter(
                          ([key]) =>
                            ![
                              'id',
                              'naam',
                              'beschrijvingKort',
                              'beschrijvingLang',
                              'contactgegevens',
                              'contactpersonen',
                              'deelnames',
                              'logo',
                              ...excludePropertiesBasedOnType(),
                            ].includes(key)
                        )
                        .map(([key, schemaProperties]) => (
                          <div key={key}>
                            <strong>{_.startCase(key)}:</strong>
                            {key === 'logo' ? (
                              <ConLogoPreview
                                logoUrl={data[key]}
                                className='ac-register-review__logo'
                              />
                            ) : (
                              <Paragraph>
                                {formatBySchema(schemaProperties, data, key, {
                                  exclude: ['@self'],
                                  includeUnknown: true,
                                  profile: {
                                    deelnames: {
                                      include: ['naam'],
                                      includeUnknown: true,
                                      inline: true,
                                    },
                                  },
                                })}
                              </Paragraph>
                            )}
                          </div>
                        ))}
                    </div>

                    <div>
                      <AcTabs
                        selectedIndex={tabIndex}
                        onSelect={(index) => setTabIndex(index)}
                      >
                        <AcTabList>
                          <AcTab selected={tabIndex === 0}>Bestanden</AcTab>
                          <AcTab selected={tabIndex === 1}>Contactpersonen</AcTab>
                          <AcTab selected={tabIndex === 2}>Deelnames</AcTab>

                          {uniqueUsedBySchemas.map((schema) => (
                            <AcTab key={schema.id} selected={tabIndex === schema.id}>
                              {schema.title || schema.id}
                            </AcTab>
                          ))}
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          <ConObjectUploadFiles
                            register={registerSlug}
                            schema={schemaSlug}
                            id={data.id}
                          />
                        </AcTabPanel>
                        <AcTabPanel selected={tabIndex === 1}>
                          <AcFlex
                            justifyContent='between'
                            className='ac-organisatie-tab-header'
                          >
                            <Heading level={3}>Contactpersonen</Heading>
                            <PrimaryActionButton
                              onClick={() => setOpenModal('addContact')}
                            >
                              <VISUALS.PLUS className='ac-button__icon' /> Toevoegen
                            </PrimaryActionButton>
                          </AcFlex>
                          <ConHorizontalOverflowWrapper
                            ariaLabels={{
                              scrollLeftButton: 'Scroll left',
                              scrollRightButton: 'Scroll right',
                            }}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableCell>Naam</TableCell>
                                  <TableCell>Email</TableCell>
                                  <TableCell>Telefoonnummer</TableCell>
                                  <TableCell>Functie</TableCell>
                                  <TableCell>Acties</TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {contactPersons?.map?.((contact) => (
                                  <TableRow key={contact.uuid}>
                                    <TableCell>
                                      {contact.voornaam} {contact.tussenvoegsel}{' '}
                                      {contact.achternaam}
                                    </TableCell>
                                    <TableCell>
                                      <Link href={`mailto:${contact.email}`}>
                                        {contact.email}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <Link href={`tel:${contact.telefoon}`}>
                                        {contact.telefoon}
                                      </Link>
                                    </TableCell>
                                    <TableCell>{contact.functie}</TableCell>
                                    <TableCell>
                                      <ConActionMenu>
                                        <ConActionMenu.Trigger
                                          buttonType='secondary'
                                          style='buttonSlim'
                                          icon={<VISUALS.ELLIPSIS />}
                                        >
                                          Acties
                                        </ConActionMenu.Trigger>

                                        <ConActionMenu.Menu position='right'>
                                          <ConActionMenu.Button
                                            icon={<VISUALS.PENCIL />}
                                            onClick={() => {
                                              setSelectedContactPerson(contact);
                                              setOpenModal('editContact');
                                            }}
                                          >
                                            Bewerken
                                          </ConActionMenu.Button>
                                          <ConActionMenu.Button
                                            icon={<VISUALS.TRASHCAN />}
                                            onClick={() => {
                                              handleDeleteContactPerson(
                                                contact.uuid
                                              );
                                            }}
                                          >
                                            Verwijderen
                                          </ConActionMenu.Button>
                                        </ConActionMenu.Menu>
                                      </ConActionMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ConHorizontalOverflowWrapper>
                        </AcTabPanel>
                        <AcTabPanel selected={tabIndex === 2}>
                          <AcFlex
                            justifyContent='between'
                            className='ac-organisatie-tab-header'
                          >
                            <Heading level={3}>Deelnames</Heading>
                            <PrimaryActionButton
                              onClick={() => setOpenModal('addDeelname')}
                            >
                              <VISUALS.PLUS className='ac-button__icon' /> Toevoegen
                            </PrimaryActionButton>
                          </AcFlex>
                          <ConHorizontalOverflowWrapper
                            ariaLabels={{
                              scrollLeftButton: 'Scroll left',
                              scrollRightButton: 'Scroll right',
                            }}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableCell>Deelname</TableCell>
                                  <TableCell>Website</TableCell>
                                  <TableCell>Contactpersonen</TableCell>
                                  <TableCell>Acties</TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data?.deelnames?.map?.((deelname) => (
                                  <TableRow key={deelname.id}>
                                    <TableCell>{deelname.naam}</TableCell>
                                    <TableCell>
                                      <Link href={deelname.website}>
                                        {deelname.website}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      {deelname?.contactpersonen?.length > 0
                                        ? deelname.contactpersonen.map((contact) => (
                                            <div key={contact.id}>
                                              {contact.voornaam}{' '}
                                              {contact.tussenvoegsel}{' '}
                                              {contact.achternaam}
                                            </div>
                                          ))
                                        : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <ConActionMenu>
                                        <ConActionMenu.Trigger
                                          buttonType='secondary'
                                          style='buttonSlim'
                                          icon={<VISUALS.ELLIPSIS />}
                                        >
                                          Acties
                                        </ConActionMenu.Trigger>

                                        <ConActionMenu.Menu position='right'>
                                          <ConActionMenu.Button
                                            icon={<VISUALS.TRASHCAN />}
                                            onClick={() => {
                                              handleDeleteDeelname(deelname.id);
                                            }}
                                          >
                                            Verwijderen
                                          </ConActionMenu.Button>
                                        </ConActionMenu.Menu>
                                      </ConActionMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ConHorizontalOverflowWrapper>
                        </AcTabPanel>

                        {uniqueUsedBySchemas.map((schema) => {
                          const data = getUsedByFromSchemaId(schema.id);
                          const metadata = data?.[0]?.['@self'];

                          // this should not trigger, if it does call a dev to fix it.
                          if (!metadata) {
                            return (
                              <AcTabPanel
                                key={schema.id}
                                selected={tabIndex === schema.id}
                              >
                                <Alert type='error'>
                                  Er is een fout opgetreden bij het laden van deze
                                  gegevens.
                                </Alert>
                              </AcTabPanel>
                            );
                          }

                          return (
                            <AcTabPanel
                              key={schema.id}
                              selected={tabIndex === schema.id}
                            >
                              <BeheerTable
                                type={schema.slug}
                                metadata={metadata}
                                data={data}
                                dataProperties={schema.properties}
                                actionButtons={(config) =>
                                  // check if all necessary properties for the actions are defined.
                                  !!config.navigateView && {
                                    id: 'actions',
                                    label: 'Acties',
                                    key: '',
                                    customContent: (row) => (
                                      <AcFlex column spacing='xs'>
                                        <button
                                          className='utrecht-button slim'
                                          variant='secondary'
                                          onClick={() => config.navigateView(row.id)}
                                        >
                                          <VISUALS.EYE className='ac-button__icon' />{' '}
                                          Bekijken
                                        </button>
                                      </AcFlex>
                                    ),
                                  }
                                }
                                tableProps={{
                                  renderSelectRowButtons: false,
                                  truncateLines: 1,
                                }}
                              />
                            </AcTabPanel>
                          );
                        })}
                      </AcTabs>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcOrganisatieFormModal
                  organisatie={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcAcceptOrganizationModal
                  organization={data}
                  showModal={openModal === 'accept'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteOrganisatieModal
                  organisaties={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/organisaties');
                  }}
                />

                <AcPublishDepublishOrganizationModal
                  organization={data}
                  showModal={openModal === 'publish' || openModal === 'depublish'}
                  publish={openModal === 'publish'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcAddDeelnameModal
                  organization={data}
                  showModal={openModal === 'addDeelname'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcContactPersonForm
                  organizationId={data.id}
                  contactPersons={contactPersons}
                  selectedContactPersonUuid={selectedContactPerson?.uuid}
                  showModal={
                    openModal === 'addContact' || openModal === 'editContact'
                  }
                  isEdit={openModal === 'editContact'}
                  onClose={() => {
                    setOpenModal(null);
                    setSelectedContactPerson(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />
              </AcFlex>
            )}
          </AcColumn>
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerOrganisatieDetails));
