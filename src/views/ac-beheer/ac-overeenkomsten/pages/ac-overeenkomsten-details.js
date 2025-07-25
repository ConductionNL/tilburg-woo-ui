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

import AcOvereenkomstFormModal from '../modals/ac-overeenkomst-form-modal';
import AcDeleteOvereenkomstenModal from '../modals/ac-delete-overeenkomsten-modal';
import ConActionMenu from '../../con-action-menu';
import { BASE_URL } from '../../ac-beheer';
import ConObjectUploadFiles from '../../con-object-upload-files/con-object-upload-files';
import { TOOLTIP_ID } from '@src/index.web';

const AcBeheerOvereenkomstenDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  const { makeRequest } = useNextcloudRequests();

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'contract';

  const fetchData = async () => {
    try {
      setLoading(true);

      const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

      const extend = [
        ['_extend[]', 'voorzieningAanbod'],
        ['_extend[]', 'voorzieningGebruik'],
      ];

      const [response, schemaResponse] = await Promise.all([
        makeRequest(
          `${BASE_URL}/${endpoint}/${id}`,
          extend,
          null,
          `/beheer/contracten/${id}`
        ),
        makeRequest(
          `openregister/api/schemas/${schemaSlug}`,
          null,
          null,
          `/beheer/contracten/${id}`
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

  const [versionTabIndex, setVersionTabIndex] = useState(0);

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
                  <Heading>{data.contractNummer}</Heading>

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
                        .filter(([key]) => !['id', 'contractNummer'].includes(key))
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
                                include: ['naam'],
                                inline: true,
                                profile: {
                                  voorzieningAanbod: {
                                    includeUnknown: true,
                                    include: ['id'],
                                    inline: true,
                                  },
                                  voorzieningGebruik: {
                                    includeUnknown: true,
                                    include: ['id'],
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
                <AcOvereenkomstFormModal
                  overeenkomst={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteOvereenkomstenModal
                  overeenkomsten={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/overeenkomsten');
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

export default withStore(observer(AcBeheerOvereenkomstenDetails));
