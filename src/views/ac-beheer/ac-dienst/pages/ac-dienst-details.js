import React, { useEffect, useRef, useState } from 'react';
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

const AcBeheerDienstDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uses, setUses] = useState(null);
  const [usesLoading, setUsesLoading] = useState(false);

  const { makeRequest } = useNextcloudRequests();

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningaanbod';
  const schemaSlug = 'voorzieningaanbod';

  const fetchData = async () => {
    try {
      setLoading(true);

      const extend = [
        ['_extend[]', 'voorziening'],
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

      const [jsonResponse, schemaJsonResponse] = await Promise.all([
        response.json(),
        schemaResponse.json(),
      ]);

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
      ['_extend[]', 'all'],
    ]);
    if (!response.ok) {
      console.error('Error fetching uses:', response.statusText);
      setUsesLoading(false);
      return;
    }
    const data = await response.json();
    setUses(data.results);
    setUsesLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchUses();
  }, []);

  const [tabIndex, setTabIndex] = useState(0);
  const [openModal, setOpenModal] = useState(null);

  const tableRefs = useRef({});

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
                      <ConActionMenu.Button icon={<VISUALS.PLUS />}>
                        Toevoegen
                      </ConActionMenu.Button>
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
                        .filter(([key]) => !['id', 'naam', 'versies'].includes(key))
                        .map(([key, schemaProperties]) => (
                          <div key={key}>
                            <strong>{_.startCase(key)}:</strong>
                            <Paragraph>
                              {formatBySchema(schemaProperties, data, key, {
                                include: ['naam'],
                                includeUnknown: true,
                                inline: true,
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
                          <AcTab selected={tabIndex === 0}>Versies</AcTab>

                          {uses && uses.length > 0 && (
                            <>
                              {uses &&
                                // show unique headers
                                _.uniqBy(uses, (use) => use['@self'].schema.id).map(
                                  (use, idx) => (
                                    <AcTab selected={tabIndex === idx + 1}>
                                      <span>{use['@self'].schema.title}</span>
                                    </AcTab>
                                  )
                                )}
                            </>
                          )}
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          {data.versies?.map((versie, index) => (
                            <Paragraph key={index}>{versie}</Paragraph>
                          ))}
                        </AcTabPanel>

                        {uses && uses.length > 0 && (
                          <>
                            {uses &&
                              _.uniqBy(uses, (use) => use['@self'].schema.id)
                                .map((use) => use['@self'])
                                .map((metadata, idx) => {
                                  const schemaId = metadata.schema.id;
                                  const schemaSlug = metadata.schema.slug;
                                  const schemaProperties =
                                    metadata.schema.properties;

                                  return (
                                    <AcTabPanel selected={tabIndex === idx + 1}>
                                      <BeheerTable
                                        type={schemaSlug}
                                        metadata={metadata}
                                        data={uses.filter(
                                          (use) =>
                                            use['@self'].schema.id === schemaId
                                        )}
                                        dataProperties={schemaProperties}
                                        actionButtons={(config) => ({
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
                                        })}
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
