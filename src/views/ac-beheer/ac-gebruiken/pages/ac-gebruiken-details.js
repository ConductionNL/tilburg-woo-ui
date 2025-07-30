import React, { useEffect, useState } from 'react';
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
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import _ from 'lodash';

import AcGebruikenFormModal from '../modals/ac-gebruiken-form-modal';
import AcDeleteGebruikenModal from '../modals/ac-delete-gebruiken-modal';
import ConActionMenu from '../../con-action-menu';
import ConObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';
import { TOOLTIP_ID } from '@src/index.web';
import AcGebruikKoppelenModal from '../modals/ac-gebruik-koppelen';

const AcBeheerGebruikenDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tabIndex, setTabIndex] = useState(0);

  const nextcloud = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'voorzieninggebruik';
  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const fetchData = async () => {
    try {
      setLoading(true);

      const extend = [
        ['_extend[]', 'voorzieningId'],
        ['_extend[]', 'organisatieId'],
      ];

      const [response, schemaResponse] = await Promise.all([
        nextcloud.request(`${endpoint}/${id}`, {
          params: extend,
          redirectPath: `/beheer/gebruiken/${id}`,
        }),
        nextcloud.request(`openregister/api/schemas/${schemaSlug}`, {
          redirectPath: `/beheer/gebruiken/${id}`,
        }),
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

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  const [openModal, setOpenModal] = useState(null);

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
                  <Heading>{data.id}</Heading>

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

                      <ConActionMenu.Button
                        icon={<VISUALS.LINK />}
                        onClick={() => setOpenModal('koppelen')}
                      >
                        Koppelen
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
                              'ibpScore',
                              'bbnScore',
                              'interneAantekening',
                            ].includes(key)
                        )
                        .map(([key, schemaProperties]) => {
                          // Custom label mapping
                          let label = _.startCase(key);
                          if (key === 'voorzieningId') {
                            label = 'Applicatie';
                          } else if (key === 'organisatieId') {
                            label = 'Organisatie';
                          }

                          return (
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
                                {label}:
                              </strong>
                              <Paragraph>
                                {key === 'voorzieningId' || key === 'organisatieId'
                                  ? data[key]?.naam || '-'
                                  : formatBySchema(schemaProperties, data, key, {
                                      include: ['naam'],
                                      inline: true,
                                    })}
                              </Paragraph>
                            </div>
                          );
                        })}
                    </div>

                    <div>
                      <AcTabs
                        selectedIndex={tabIndex}
                        onSelect={(index) => setTabIndex(index)}
                      >
                        <AcTabList>
                          <AcTab selected={tabIndex === 0}>Bestanden</AcTab>
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          <ConObjectUploadFiles
                            register={registerSlug}
                            schema={schemaSlug}
                            id={data.id}
                          />
                        </AcTabPanel>
                      </AcTabs>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcGebruikenFormModal
                  gebruik={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteGebruikenModal
                  gebruiken={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/gebruiken');
                  }}
                />

                <AcGebruikKoppelenModal
                  gebruik={data}
                  showModal={openModal === 'koppelen'}
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

export default withStore(observer(AcBeheerGebruikenDetails));
