import { useCallback, useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LANGUAGES, VISUALS } from '@constants';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader } from '@components';
import {
  Alert,
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import { BASE_URL } from '../../ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

import AcContactpersonenFormModal from '../modals/ac-contactpersonen-form-modal';
import AcDeleteContactpersonenModal from '../modals/ac-delete-contactpersonen-modal';
import ConActionMenu from '../../con-action-menu';
import _ from 'lodash';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import AcPublishDepublishContactpersoonModal from '../modals/ac-publish-depublish-contactpersoon';
import { TOOLTIP_ID } from '@src/index.web';
import BeheerTable from '../../con-beheer-table/con-beheer-table';

const AcBeheerContactpersoonDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [usedBy, setUsedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  const nextcloud = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'contactpersoon';

  const fetchData = async () => {
    try {
      setLoading(true);

      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

      const [response, schemaResponse] = await Promise.all([
        nextcloud.request(
          `${endpoint}/${id}`,
          { redirectPath: `/beheer/contactpersonen/${id}` }
        ),
        nextcloud.request(
          `openregister/api/schemas/${schemaSlug}`,
          { redirectPath: `/beheer/contactpersonen/${id}` }
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

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  const [openModal, setOpenModal] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('nl-NL');
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
                <AcFlex spacing='sm' justifyContent='between'>
                  <Heading>{`${data.voornaam} ${data.achternaam}`}</Heading>

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
                    <AcFlex column spacing='sm' style={{ marginBottom: '1rem' }}>
                      {!data.gebruiker && (
                        <Alert type='info'>
                          <AcFlex spacing='sm'>
                            <VISUALS.INFO_BLUE />
                            <AcFlex column spacing='xs'>
                              <Paragraph>
                                Deze contactpersoon heeft geen gebruiker.
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
                              <Paragraph>
                                Deze contactpersoon is nog niet gepubliceerd.
                              </Paragraph>
                            </AcFlex>
                          </AcFlex>
                        </Alert>
                      )}
                    </AcFlex>

                    <div className='ac-beheer-details--grid'>
                      {Object.entries(dataProperties)
                        .filter(
                          ([key]) => !['id', 'voornaam', 'achternaam'].includes(key)
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
                          {uniqueUsedBySchemas.map((schema) => (
                            <AcTab key={schema.id} selected={tabIndex === schema.id}>
                              {schema.title || schema.id}
                            </AcTab>
                          ))}
                        </AcTabList>

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
              </AcFlex>
            )}

            {/* modals */}
            <AcContactpersonenFormModal
              contactpersoon={data}
              showModal={openModal === 'edit' || openModal === 'add'}
              isEdit={openModal === 'edit'}
              onClose={() => {
                setOpenModal(null);
              }}
              onSuccess={() => {
                fetchData();
              }}
            />

            <AcDeleteContactpersonenModal
              contactpersonen={[data]}
              showModal={openModal === 'delete'}
              onClose={() => {
                setOpenModal(null);
              }}
              onSuccess={() => {
                navigate('/beheer/contactpersonen');
              }}
            />

            <AcPublishDepublishContactpersoonModal
              contactpersoon={data}
              publish={openModal === 'publish'}
              showModal={openModal === 'publish' || openModal === 'depublish'}
              onClose={() => {
                setOpenModal(null);
              }}
              onSuccess={() => {
                fetchData();
              }}
            />
          </AcColumn>
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerContactpersoonDetails));
