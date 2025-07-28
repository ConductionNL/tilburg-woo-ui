import React, { useEffect, useRef, useState, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader, ConMarkdown } from '@components';
import { AcBeheerError } from '@views/ac-beheer';
import { BASE_URL } from '../../ac-beheer';
import { sortPropertiesByOrder } from '@src/utilities';
import { AcCheckbox, AcFormField } from '@molecules';
import { ConFileDropZone } from '../../import-modal/con-file-dropzone';
import {
  Heading,
  Paragraph,
  SecondaryActionButton,
  PrimaryActionButton,
  Button,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@utrecht/component-library-react';
import AcColumn from '@atoms/ac-column/ac-column';
import AcApplicatiesFormModal from '../modals/ac-applicaties-form-modal';
import AcDeleteApplicatiesModal from '../modals/ac-delete-applicaties-modal';
import ConActionMenu from '../../con-action-menu';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import _ from 'lodash';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import AcGebruikenFormModal from '../../ac-gebruiken/modals/ac-gebruiken-form-modal';
import AcDienstFormModal from '../../ac-dienst/modals/ac-dienst-form-modal';
import ConObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';
import AcVoorzieningVersieFormModal from '../../ac-voorzieningen-versie/modals/ac-voorziening-versie-form-modal';
import { BEHEER_RENAMES } from '../../beheer-renames';
import BeheerTable from '../../con-beheer-table/con-beheer-table';
import { TOOLTIP_ID } from '@src/index.web';

const AcBeheerApplicatiesDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [files, setFiles] = useState([]);
  const [usedBy, setUsedBy] = useState(null);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [standardsDataProperties, setStandardsDataProperties] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [isEditingKort, setIsEditingKort] = useState(false);
  const [isEditingLang, setIsEditingLang] = useState(false);
  const [tempBeschrijvingKort, setTempBeschrijvingKort] = useState('');
  const [tempBeschrijvingLang, setTempBeschrijvingLang] = useState('');
  const [charCountKort, setCharCountKort] = useState(0);
  const [charCountLang, setCharCountLang] = useState(0);

  const uniqueUsedBySchemas = useMemo(() => {
    if (!usedBy) return [];
    // get a list of unique usedBy based on the schema id
    const uniqueUsedBy = _.uniqBy(usedBy, (item) => item['@self'].schema.id);
    // return the schema object for each unique usedBy
    return uniqueUsedBy.map((item) => item['@self'].schema);
  }, [usedBy]);

  // sort schemas based on their id
  const sortedSchemas = useMemo(() => {
    return (uniqueUsedBySchemas || []).sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
  }, [uniqueUsedBySchemas]);

  // Memoize the data for each schema to prevent unnecessary re-renders
  const memoizedSchemaData = useMemo(() => {
    if (!usedBy || !sortedSchemas) return new Map();

    const dataMap = new Map();
    sortedSchemas.forEach((schema) => {
      const schemaData = usedBy.filter(
        (item) => item['@self'].schema.id === schema.id
      );
      dataMap.set(schema.id, schemaData);
    });

    return dataMap;
  }, [usedBy, sortedSchemas]);

  const nextcloud = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'voorziening';

  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const extend = [
    ['_extend[]', 'standaarden'],
    ['_extend[]', 'standaarden.@self.schema'],
    ['_extend[]', 'referentieComponenten'],
    ['_extend[]', 'organisatie'],
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      const [response, schemaResponse] = await Promise.all([
        nextcloud.request(
          `${endpoint}/${id}`,
          { params: extend, redirectPath: `/beheer/applicaties/${id}` }
        ),
        nextcloud.request(
          `openregister/api/schemas/${schemaSlug}`,
          { redirectPath: `/beheer/applicaties/${id}` }
        ),
      ]);

      if (!response.ok || !schemaResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const jsonResponse = response.data;
      const schemaJsonResponse = schemaResponse.data;

      const data = jsonResponse;
      const dataProperties = schemaJsonResponse.properties;
      const standardsDataProperties =
        response.data.standaarden?.[0]?.['@self']?.schema?.properties;

      setData(data);
      setDataProperties(sortPropertiesByOrder(dataProperties));
      setStandardsDataProperties(sortPropertiesByOrder(standardsDataProperties));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      setVersionsLoading(true);
      const response = await nextcloud.request(
        `openregister/api/objects/voorzieningen/voorzieningversie`,
        { params: [['voorziening', id]] }
      );

      if (response.ok) {
        const versionsData = response.data.results || [];
        setVersions(versionsData);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setVersionsLoading(false);
    }
  };

  const fetchUsedBy = async () => {
    const usedByResponse = await nextcloud.request(
      `openregister/api/objects/${registerSlug}/${schemaSlug}/${id}/used`,
      {
        params: [
          ['_extend[]', '@self.schema'],
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'leverancier'],
        ],
        redirectPath: `/beheer/contactpersonen/${id}`,
      }
    );
    const usedByData = usedByResponse?.data;
    setUsedBy(usedByData?.results);
  };

  useEffect(() => {
    fetchData();
    fetchUsedBy();
  }, []);

  useEffect(() => {
    if (data?.id) {
      fetchVersions();
      setCharCountKort(data.beschrijvingKort?.length || 0);
      setCharCountLang(data.beschrijvingLang?.length || 0);
    }
  }, [data?.id]);

  const handleSaveDescription = async (type) => {
    try {
      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}/${id}`;
      const field = type === 'kort' ? 'beschrijvingKort' : 'beschrijvingLang';
      const value = type === 'kort' ? tempBeschrijvingKort : tempBeschrijvingLang;

      const response = await nextcloud.request(endpoint, {
        method: 'PATCH',
        data: JSON.stringify({
          [field]: type === 'kort' ? value : JSON.stringify(value),
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      // Update local state
      setData((prev) => ({
        ...prev,
        [field]: type === 'kort' ? value : JSON.stringify(value),
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

  const tableRef = useRef(null);

  const defaultHeaders = ['naam', 'beschrijving', 'standaardtype', 'versie'];

  const headers = useMemo(() => {
    if (!standardsDataProperties) return [];

    return Object.entries(standardsDataProperties)
      .filter(([key, value]) => value.visible !== false)
      .map(([key, value]) => {
        // Generate standard header from schema
        return {
          id: key,
          label: _.upperFirst(key),
          key: key,
        };
      });
  }, [standardsDataProperties]);

  useEffect(() => {
    if (headers.length > 0) {
      setTableHeaders(
        headers.filter((header) => defaultHeaders.includes(header.id))
      );
    }
  }, [headers]);

  const [versionTabIndex, setVersionTabIndex] = useState(0);

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  const [openModal, setOpenModal] = useState(null);

  // Get maxLength from schema for beschrijvingKort
  const beschrijvingKortMaxLength = useMemo(() => {
    return dataProperties?.beschrijvingKort?.maxLength || 255;
  }, [dataProperties]);

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
                <AcFlex spacing='sm' justifyContent='between'>
                  <Heading>{data.naam}</Heading>

                  <ConActionMenu>
                    <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Menu position='right'>
                      <ConActionMenu.Button
                        icon={<VISUALS.EYE />}
                        onClick={() => {
                          window.open(`/publicatie/${data.id}`, '_blank');
                        }}
                      >
                        Bekijk in catalogus
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.PENCIL />}
                        onClick={() => setOpenModal('edit')}
                      >
                        Bijwerken
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.CLOUD />}
                        onClick={() => setOpenModal('addGebruik')}
                      >
                        Gebruiken aanmaken
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.HAND_HOLDING />}
                        onClick={() => setOpenModal('addDienst')}
                      >
                        Dienst toevoegen
                      </ConActionMenu.Button>
                      <ConActionMenu.Button
                        icon={<VISUALS.INFO />}
                        onClick={() => setOpenModal('addVersion')}
                      >
                        Versie toevoegen
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
                </AcFlex>

                <AcFlex column spacing='sm'>
                  <AcFlex spacing='sm' alignItems='center'>
                    {isEditingKort ? (
                      <div className='ac-organisatie-detail-form ac-organisatie-detail-form--full'>
                        <AcFormField
                          fullWidth={true}
                          inputType='textarea'
                          label='Korte beschrijving'
                          placeholder='Een korte beschrijving van de applicatie'
                          tooltip='Een korte beschrijving van de applicatie'
                          value={tempBeschrijvingKort}
                          onChange={handleBeschrijvingKortChange}
                          disabled={loading}
                          maxLength={beschrijvingKortMaxLength}
                          className='textarea-with-dimensions'
                        />
                        <span className='character-count'>
                          {beschrijvingKortMaxLength - charCountKort} karakters over
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
                              setTempBeschrijvingKort(data.beschrijvingKort || '');
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
                            setTempBeschrijvingKort(data.beschrijvingKort || '');
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
                              Uitgebreide beschrijving
                              <span
                                className='ac-form-field__tooltip'
                                title='Een uitgebreide beschrijving van de applicatie'
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
                                placeholder='Een uitgebreide beschrijving van de applicatie'
                              />
                            </div>
                            <div className='ac-organisatie-detail-form-preview'>
                              <Heading level={4}>Preview</Heading>
                              <div className='ac-organisatie-detail-preview markdown-preview'>
                                <ConMarkdown>{tempBeschrijvingLang}</ConMarkdown>
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
                                <ConMarkdown>
                                  {JSON.parse(data.beschrijvingLang)}
                                </ConMarkdown>
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
                                        JSON.parse(data.beschrijvingLang)?.length ||
                                        0
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

                <AcColumn gap='md'>
                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      {Object.entries(dataProperties)
                        .filter(
                          ([key]) =>
                            ![
                              'id',
                              'naam',
                              'standaarden',
                              'referentieComponent',
                              'beschrijvingKort',
                              'beschrijvingLang',
                            ].includes(key)
                        )
                        .map(([key, schemaProperties]) => (
                          <div key={key}>
                            <strong
                              {...(schemaProperties?.description
                                ? {
                                    'data-tooltip-id': TOOLTIP_ID,
                                    'data-tooltip-content':
                                      schemaProperties.description,
                                  }
                                : {})}
                            >
                              {_.startCase(key)}:
                            </strong>
                            <Paragraph>
                              {formatBySchema(schemaProperties, data, key, {
                                profile: {
                                  organisatie: {
                                    include: ['naam'],
                                    includeUnknown: true,
                                    inline: true,
                                  },
                                },
                              })}
                            </Paragraph>
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
                          <AcTab selected={tabIndex === 1}>Versies</AcTab>
                          <AcTab selected={tabIndex === 2}>Standaarden</AcTab>

                          {sortedSchemas.map((schema) => (
                            <AcTab key={schema.id} selected={tabIndex === schema.id}>
                              {_.upperFirst(
                                BEHEER_RENAMES[schema.slug] ||
                                  schema.title ||
                                  schema.id
                              )}
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
                          {versionsLoading ? (
                            <AcLoader />
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableCell>Versie Nummer</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Release Datum</TableCell>
                                  <TableCell>Release Notes</TableCell>
                                  <TableCell>Acties</TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {versions.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5}>
                                      Geen versies gevonden voor deze applicatie
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  versions.map((version) => (
                                    <TableRow
                                      className='ac-applicaties-details--table-row'
                                      key={version.id}
                                    >
                                      <TableCell>{version.versienummer}</TableCell>
                                      <TableCell>{version.status}</TableCell>
                                      <TableCell>
                                        {(() => {
                                          if (!version.releaseDatum) return '-';
                                          return !isNaN(
                                            new Date(version.releaseDatum).getTime()
                                          )
                                            ? new Date(
                                                version.releaseDatum
                                              ).toLocaleDateString()
                                            : '-';
                                        })()}
                                      </TableCell>
                                      <TableCell>{version.releaseNotes}</TableCell>
                                      <TableCell>
                                        <SecondaryActionButton
                                          onClick={() =>
                                            navigate(
                                              `/beheer/voorzieningen-versie/${version.id}`
                                            )
                                          }
                                        >
                                          <VISUALS.EYE className='ac-button__icon' />
                                          Bekijk
                                        </SecondaryActionButton>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          )}
                        </AcTabPanel>
                        <AcTabPanel selected={tabIndex === 2}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableCell>Naam</TableCell>
                                <TableCell>ReferentieComponent</TableCell>
                                <TableCell>Compliancy</TableCell>
                                <TableCell>Testrapport</TableCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.standaarden.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4}>
                                    Geen standaarden gevonden voor deze applicatie
                                  </TableCell>
                                </TableRow>
                              ) : (
                                data.standaarden.map((standard) => (
                                  <TableRow
                                    className='ac-applicaties-details--table-row'
                                    key={standard.id}
                                  >
                                    <TableCell>{standard.naam}</TableCell>
                                    <TableCell>
                                      {data.referentieComponenten[0].name}
                                    </TableCell>
                                    <TableCell className='ac-applicaties-details--compliance-checkbox'>
                                      <AcCheckbox />
                                    </TableCell>
                                    <TableCell>
                                      <ConFileDropZone
                                        className='ac-applicaties-details--file-dropzone'
                                        disabled={true}
                                        files={[]}
                                        onFilesChange={() => {}}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </AcTabPanel>

                        {sortedSchemas.map((schema) => {
                          const data = memoizedSchemaData.get(schema.id) || [];
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
                <AcApplicatiesFormModal
                  applicatie={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteApplicatiesModal
                  applicaties={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/applicaties');
                  }}
                />

                <AcGebruikenFormModal
                  preSelectedVoorzieningId={data.id}
                  showModal={openModal === 'addGebruik'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={async (e) => {
                    const gebruik = e.data;
                    navigate(`/beheer/gebruiken/${gebruik.id}`);
                  }}
                />

                <AcDienstFormModal
                  showModal={openModal === 'addDienst'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={async (e) => {
                    const data = e.data;
                    navigate(`/beheer/diensten/${data.id}`);
                  }}
                  preSelectedVoorziening={data.id}
                />

                <AcVoorzieningVersieFormModal
                  voorziening={{ id: data?.id, naam: data?.naam }}
                  showModal={openModal === 'addVersion'}
                  isEdit={false}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchVersions();
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

export default withStore(observer(AcBeheerApplicatiesDetails));
