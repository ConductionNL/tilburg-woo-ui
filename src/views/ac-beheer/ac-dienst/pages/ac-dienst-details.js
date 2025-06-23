import React, { useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader } from '@components';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

import AcEditDienstModal from '../modals/ac-dienst-form-modal';
import AcDeleteDienstModal from '../modals/ac-delete-dienst-modal';
import ConActionMenu from '../../con-action-menu';
import { BASE_URL } from '../../ac-beheer';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import _ from 'lodash';
import BeheerTable from '../../con-beheer-table/con-beheer-table';
import AcObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';
import { useLaterEffect } from '@src/hooks';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import { BEHEER_RENAMES } from '../../beheer-renames';

const AcBeheerDienstDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uses, setUses] = useState(null);
  const [usesLoading, setUsesLoading] = useState(false);
  const [dienstenByOrganisatie, setDienstenByOrganisatie] = useState(null);
  const [dienstenByOrganisatieLoading, setDienstenByOrganisatieLoading] =
    useState(false);

  const { makeRequest } = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'voorzieningaanbod';
  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const fetchData = async () => {
    try {
      setLoading(true);

      const extend = [
        // ['_extend[]', 'voorziening'],
        ['_extend[]', 'leverancier'],
        ['_extend[]', 'ondersteundeStandaarden'],
      ];

      const [response, schemaResponse] = await Promise.all([
        makeRequest(
          `${BASE_URL}/apps/${endpoint}/${id}`,
          extend,
          null,
          `/beheer/diensten/${id}`
        ),
        makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/${schemaSlug}`,
          null,
          null,
          `/beheer/diensten/${id}`
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

  const fetchUses = async () => {
    setUsesLoading(true);
    const response = await makeRequest(`${BASE_URL}/apps/${endpoint}/${id}/uses`, [
      ['_extend[]', '@self.schema'],
    ]);
    if (!response.ok) {
      console.error('Error fetching uses:', response.statusText);
      setUsesLoading(false);
      return;
    }
    const data = response.data;
    setUses(data.results);
    setUsesLoading(false);
  };

  const fetchDienstenByOrganisatie = async (organisatieId) => {
    if (!organisatieId) {
      setDienstenByOrganisatie([]);
      return;
    }

    setDienstenByOrganisatieLoading(true);
    const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, [
      ['leverancier', organisatieId],
      ['_extend[]', 'voorziening'],
      ['_extend[]', 'leverancier'],
      ['_extend[]', 'ondersteundeStandaarden'],
    ]);
    if (!response.ok) {
      console.error('Error fetching diensten by organisatie:', response.statusText);
      setDienstenByOrganisatieLoading(false);
      return;
    }
    const data = response.data?.results || [];
    setDienstenByOrganisatie(data);
    setDienstenByOrganisatieLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchUses();
  }, []);

  useLaterEffect(() => {
    // disabled due to lack of backend organisation support
    // This is supposed to get diensted by organisatie, based on the organisatie from the logged in user
    // fetchDienstenByOrganisatie(data?.leverancier);
  }, [data?.id]);

  const [tabIndex, setTabIndex] = useState(0);
  const [openModal, setOpenModal] = useState(null);

  const tableRefs = useRef({});

  // Custom header overrides for special cases
  const dienstenTableCustomHeaders = useMemo(
    () => ({
      voorziening: {
        id: 'voorzieningName',
        label: 'Voorziening naam',
        key: 'voorziening',
        customContent: (row) => {
          return row?.voorziening?.naam || '-';
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;

          const nameA = a?.voorziening?.naam || '';
          const nameB = b?.voorziening?.naam || '';

          return ConSorterLogic(nameA, nameB, direction);
        },
      },
      leverancier_naam: {
        id: 'leverancier',
        label: 'Leverancier',
        key: '',
        customContent: (row) => {
          return (
            <AcColumn key={row.id}>
              <span>{row?.leverancier?.naam ?? '-'}</span>
            </AcColumn>
          );
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;

          const idA = a?.leverancier?.id || '';
          const idB = b?.leverancier?.id || '';

          return ConSorterLogic(idA, idB, direction);
        },
      },
      leverancier_email: {
        id: 'email',
        label: 'Email',
        key: '',
        customContent: (row) => {
          return row?.leverancier?.contactgegevens?.email || '-';
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;

          const emailA = a?.leverancier?.contactgegevens?.email || '';
          const emailB = b?.leverancier?.contactgegevens?.email || '';

          return ConSorterLogic(emailA, emailB, direction);
        },
      },
    }),
    []
  );

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  if (loading) {
    return <AcLoader />;
  }

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
                  <Heading>{data.voorziening.naam}</Heading>

                  <ConActionMenu>
                    <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Menu position='right'>
                      <ConActionMenu.Button
                        icon={<VISUALS.PENCIL />}
                        onClick={() => setOpenModal('edit')}
                      >
                        Bijwerken
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

                <AcColumn gap='md'>
                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      {Object.entries(dataProperties)
                        .filter(
                          ([key]) =>
                            ![
                              'id',
                              'naam',
                              'versies',
                              'voorziening',
                              'leverancier',
                              'ondersteundeStandaarden',
                            ].includes(key)
                        )
                        .map(([key, schemaProperties]) => (
                          <div key={key}>
                            <strong>{_.startCase(key)}:</strong>
                            <Paragraph>
                              {(() => {
                                try {
                                  return formatBySchema(
                                    schemaProperties,
                                    data,
                                    key,
                                    {
                                      include: ['naam'],
                                      includeUnknown: true,
                                      inline: true,
                                    }
                                  );
                                } catch (error) {
                                  console.error('Error formatting value:', error);
                                  return <span>Error displaying value</span>;
                                }
                              })()}
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
                          <AcTab selected={tabIndex === 0}>Versies</AcTab>
                          <AcTab selected={tabIndex === 1}>Bestanden</AcTab>
                          {/* <AcTab selected={tabIndex === 2}>Diensten</AcTab> */}

                          {uses && uses.length > 0 && (
                            <>
                              {uses &&
                                // show unique headers
                                _.uniqBy(uses, (use) => use['@self'].schema.id)
                                  .filter(
                                    (use) => use['@self'].schema.slug !== 'standaard'
                                  )
                                  .map((use, idx) => (
                                    <AcTab selected={tabIndex === idx + 3}>
                                      <span>
                                        {_.upperFirst(
                                          BEHEER_RENAMES[use['@self'].schema.slug] ||
                                            use['@self'].schema.title
                                        )}
                                      </span>
                                    </AcTab>
                                  ))}
                            </>
                          )}
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          {data.versies?.map((versie, index) => (
                            <Paragraph key={index}>{versie}</Paragraph>
                          ))}
                        </AcTabPanel>

                        <AcTabPanel selected={tabIndex === 1}>
                          <AcObjectUploadFiles
                            register={registerSlug}
                            schema={schemaSlug}
                            id={data.id}
                          />
                        </AcTabPanel>

                        {/* <AcTabPanel selected={tabIndex === 2}>
                          {dienstenByOrganisatieLoading ? (
                            <AcLoader style={{ height: '100px' }} />
                          ) : (
                            <BeheerTable
                              type={schemaSlug}
                              data={dienstenByOrganisatie}
                              dataProperties={dataProperties}
                              headerOverrides={dienstenTableCustomHeaders}
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
                          )}
                        </AcTabPanel> */}

                        {uses && uses.length > 0 && (
                          <>
                            {uses &&
                              _.uniqBy(uses, (use) => use['@self'].schema.id)
                                .filter(
                                  (use) => use['@self'].schema.slug !== 'standaard'
                                )
                                .map((use) => use['@self'])
                                .map((metadata, idx) => {
                                  const schemaId = metadata.schema.id;
                                  const schemaSlug = metadata.schema.slug;
                                  const schemaProperties =
                                    metadata.schema.properties;

                                  return (
                                    <AcTabPanel selected={tabIndex === idx + 3}>
                                      <BeheerTable
                                        type={schemaSlug}
                                        metadata={metadata}
                                        data={uses.filter(
                                          (use) =>
                                            use['@self'].schema.id === schemaId
                                        )}
                                        dataProperties={schemaProperties}
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
                                                  onClick={() =>
                                                    config.navigateView(row.id)
                                                  }
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
                          </>
                        )}
                      </AcTabs>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcEditDienstModal
                  dienst={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteDienstModal
                  diensten={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/diensten');
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

export default withStore(observer(AcBeheerDienstDetails));
