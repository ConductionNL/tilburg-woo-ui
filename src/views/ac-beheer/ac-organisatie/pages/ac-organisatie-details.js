import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import {
  AcCard,
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
import { AcFormField } from '@molecules';
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
} from '@utrecht/component-library-react/dist/css-module';
import _ from 'lodash';
import AcColumn from '@atoms/ac-column/ac-column';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import AcOrganisatieFormModal from '../modals/ac-organisatie-form-modal';
import AcDeleteOrganisatieModal from '../modals/ac-delete-organisatie-modal';
import ConActionMenu from '../../con-action-menu';
import AcAcceptOrganizationModal from '../modals/ac-accept-organisation';
import AcObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';
import ConLogoPreview from '../../../ac-register/con-logo-preview';
import ReactMarkdown from 'react-markdown';
import AcPublishOrganizationModal from '../modals/ac-publish-organisation';

const AcBeheerOrganisatieDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [isEditingKort, setIsEditingKort] = useState(false);
  const [isEditingLang, setIsEditingLang] = useState(false);
  const [tempBeschrijvingKort, setTempBeschrijvingKort] = useState('');
  const [tempBeschrijvingLang, setTempBeschrijvingLang] = useState('');
  const [charCountKort, setCharCountKort] = useState(0);
  const [charCountLang, setCharCountLang] = useState(0);

  const { makeRequest } = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'organisatie';

  const fetchData = async () => {
    try {
      setLoading(true);

      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

      const extend = [
        ['_extend[]', 'contactgegevens'],
        ['_extend[]', 'samenwerkingen'],
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setCharCountKort(data.beschrijvingKort?.length || 0);
      setCharCountLang(data.beschrijvingLang?.length || 0);
    }
  }, [data]);

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  const [openModal, setOpenModal] = useState(null);

  const handleSaveDescription = async (type) => {
    try {
      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}/${id}`;
      const field = type === 'kort' ? 'beschrijvingKort' : 'beschrijvingLang';
      const value = type === 'kort' ? tempBeschrijvingKort : tempBeschrijvingLang;

      const response = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        null,
        { [field]: JSON.stringify(value) },
        `/beheer/organisaties/${id}`,
        'PATCH'
      );

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      // Update local state
      setData((prev) => ({
        ...prev,
        [field]: value,
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

  const infoStyle = {
    backgroundColor:
      'color-mix(in srgb, var(--utrecht-form-field-info-message-color, #004699) 5%, #ffffff)',
    border: '1px solid var(--utrecht-form-field-info-message-color, #004699)',
    borderRadius: '4px',
    color: 'var(--utrecht-form-field-info-message-color, #004699)',
    fontSize: 'var(--utrecht-form-field-info-message-font-size, 1rem)',
    fontWeight: 'var(--utrecht-form-field-info-message-font-weight, 400)',
    padding: '1rem',
    margin: '0 0 1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--utrecht-form-field-info-message-font-family)',
  };

  const warningStyle = {
    backgroundColor:
      'color-mix(in srgb, var(--utrecht-form-field-warning-message-color, #FFB612) 2%, #ffffff)',
    border: '1px solid var(--utrecht-form-field-warning-message-color, #FFB612)',
    borderRadius: '4px',
    color: 'var(--utrecht-form-field-warning-message-color, #FFB612)',
    fontSize: 'var(--utrecht-form-field-warning-message-font-size, 1rem)',
    fontWeight: 'var(--utrecht-form-field-warning-message-font-weight, 400)',
    padding: '1rem',
    margin: '0 0 1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--utrecht-form-field-warning-message-font-family)',
  };

  const contactgegevensStyles = {
    container: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor:
        'var(--tilburg-search-card-background-color, var(--tilburg-color-white))',
      borderRadius:
        'var(--tilburg-search-card-border-radius, var(--tilburg-border-radius-md))',
      border:
        'var(--tilburg-search-card-border-width, 2px) var(--tilburg-search-card-border-style, solid) var(--tilburg-search-card-border-color, #e5e7eb)',
      paddingInlineStart: 'var(--tilburg-search-card-padding-inline-start)',
      paddingInlineEnd: 'var(--tilburg-search-card-padding-inline-end)',
      paddingBlockStart: 'var(--tilburg-search-card-padding-block-start)',
      paddingBlockEnd: 'var(--tilburg-search-card-padding-block-end)',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--tilburg-search-card-content-gap, var(--tilburg-space-block-snail))',
      padding:
        'var(--tilburg-search-card-padding-md, var(--tilburg-space-block-rabbit))',
    },
    grid: {
      gridTemplateColumns: 'min-content 1fr',
      gap: '0.5rem',
    },
    label: {
      fontWeight: '500',
    },
    link: {
      color: '#004699',
      textDecoration: 'none',
      ':hover': {
        textDecoration: 'underline',
      },
    },
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
                    <Heading>{data.naam ?? data.id}</Heading>
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
                          Bijwerken
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
                            icon={<VISUALS.PAPER_PLANE />}
                            onClick={() => setOpenModal('publish')}
                          >
                            Publiceren
                          </ConActionMenu.Button>
                        )}
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
                      <div style={infoStyle}>
                        <div style={{ flexShrink: 0 }}>
                          <VISUALS.INFO />
                        </div>
                        <span>
                          Deze organisatie bevindt zich nog in de conceptfase en moet
                          eerst door VNG worden goedgekeurd voordat deze zichtbaar
                          wordt voor anderen.
                        </span>
                      </div>
                    )}

                    {!data['@self'].published && (
                      <div style={warningStyle}>
                        <div style={{ flexShrink: 0 }}>
                          <VISUALS.TRIANGLE_EXCLAMATION />
                        </div>
                        <span>Deze organisatie is nog niet gepubliceerd.</span>
                      </div>
                    )}
                  </div>

                  {data.contactgegevens && (
                    <div style={contactgegevensStyles.container}>
                      <div style={contactgegevensStyles.content}>
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
                          <AcGrid columns={2} style={contactgegevensStyles.grid}>
                            {data.contactgegevens.email && (
                              <>
                                <span style={contactgegevensStyles.label}>
                                  Email:
                                </span>
                                <a
                                  href={`mailto:${data.contactgegevens.email}`}
                                  style={contactgegevensStyles.link}
                                >
                                  {data.contactgegevens.email}
                                </a>
                              </>
                            )}
                            {data.contactgegevens.telefoon && (
                              <>
                                <span style={contactgegevensStyles.label}>
                                  Telefoon:
                                </span>
                                <a
                                  href={`tel:${data.contactgegevens.telefoon}`}
                                  style={contactgegevensStyles.link}
                                >
                                  {data.contactgegevens.telefoon}
                                </a>
                              </>
                            )}
                          </AcGrid>
                        </AcFlex>
                      </div>
                    </div>
                  )}

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
                            <Button
                              appearance='primary-action-button'
                              onClick={() => handleSaveDescription('kort')}
                            >
                              Opslaan
                            </Button>
                            <Button
                              appearance='secondary-action-button'
                              onClick={() => {
                                setIsEditingKort(false);
                                setTempBeschrijvingKort(data.beschrijvingKort);
                                setCharCountKort(data.beschrijvingKort?.length || 0);
                              }}
                            >
                              Annuleren
                            </Button>
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
                            <VISUALS.PENCIL />
                          </Button>
                        </div>
                      )}
                    </AcFlex>

                    <AcFlex spacing='sm' alignItems='center'>
                      {isEditingLang ? (
                        <div className='ac-organisatie-detail-form-wrapper'>
                          <div className='ac-organisatie-detail-form'>
                            <div className='ac-organisatie-detail-form-label-row'>
                              <span className='ac-form-field__label-with-icon'>
                                Lange beschrijving
                                <span
                                  className='ac-form-field__tooltip'
                                  title='Een uitgebreide beschrijving van de organisatie'
                                >
                                  <VISUALS.INFO />
                                </span>
                              </span>
                            </div>
                            <div className='ac-organisatie-detail-form-flex'>
                              <div className='ac-organisatie-detail-form-textarea'>
                                <AcFormField
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
                              <div className='ac-organisatie-detail-preview markdown-preview'>
                                <ReactMarkdown>{tempBeschrijvingLang}</ReactMarkdown>
                              </div>
                            </div>
                            <span className='character-count'>
                              {2000 - charCountLang} karakters over
                            </span>
                            <div className='ac-organisatie-detail-form-buttons'>
                              <Button
                                appearance='primary-action-button'
                                onClick={() => handleSaveDescription('lang')}
                              >
                                Opslaan
                              </Button>
                              <Button
                                appearance='secondary-action-button'
                                onClick={() => {
                                  setIsEditingLang(false);
                                  setTempBeschrijvingLang(data.beschrijvingLang);
                                  setCharCountLang(
                                    data.beschrijvingLang?.length || 0
                                  );
                                }}
                              >
                                Annuleren
                              </Button>
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
                            <VISUALS.PENCIL />
                          </Button>
                        </div>
                      )}
                    </AcFlex>
                  </AcFlex>
                </AcFlex>

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
                          <AcTab selected={tabIndex === 2}>
                            Mijn samenwerkingen
                          </AcTab>
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          <AcObjectUploadFiles
                            register={registerSlug}
                            schema={schemaSlug}
                            id={data.id}
                          />
                        </AcTabPanel>
                        <AcTabPanel selected={tabIndex === 1}>
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
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data?.contactpersonen?.map((contact) => (
                                  <TableRow key={contact.id}>
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
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ConHorizontalOverflowWrapper>
                        </AcTabPanel>
                        <AcTabPanel selected={tabIndex === 2}>
                          <ConHorizontalOverflowWrapper
                            ariaLabels={{
                              scrollLeftButton: 'Scroll left',
                              scrollRightButton: 'Scroll right',
                            }}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableCell>Samenwerking</TableCell>
                                  <TableCell>Website</TableCell>
                                  <TableCell>Contactpersonen</TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data?.samenwerkingen?.map((samenwerking) => (
                                  <TableRow key={samenwerking.id}>
                                    <TableCell>{samenwerking.naam}</TableCell>
                                    <TableCell>
                                      <Link href={samenwerking.website}>
                                        {samenwerking.website}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      {samenwerking.contactpersonen.map(
                                        (contact) => (
                                          <div key={contact.id}>
                                            {contact.voornaam}{' '}
                                            {contact.tussenvoegsel}{' '}
                                            {contact.achternaam}
                                          </div>
                                        )
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ConHorizontalOverflowWrapper>
                        </AcTabPanel>
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

                <AcPublishOrganizationModal
                  organization={data}
                  showModal={openModal === 'publish'}
                  onClose={() => {
                    setOpenModal(null);
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
