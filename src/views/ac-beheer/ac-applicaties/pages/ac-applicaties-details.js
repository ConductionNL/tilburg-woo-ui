import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection } from '@atoms';
import { useNavigate } from 'react-router';
import { AcSideNav, AcLoader } from '@components';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';

import AcApplicatiesFormModal from '../modals/ac-applicaties-form-modal';
import AcDeleteApplicatiesModal from '../modals/ac-delete-applicaties-modal';
import ConActionMenu from '../../con-action-menu';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import _ from 'lodash';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import AcGebruikenFormModal from '../../ac-gebruiken/modals/ac-gebruiken-form-modal';
import AcDienstFormModal from '../../ac-dienst/modals/ac-dienst-form-modal';

const AcBeheerApplicatiesDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [dataProperties, setDataProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const endpoint = 'openregister/api/objects/voorzieningen/voorziening';

  const schemaSlug = 'voorziening';

  const extend = [];

  const fetchData = async () => {
    try {
      setLoading(true);

      const [response, schemaResponse] = await Promise.all([
        makeRequest(
          `${BASE_URL}/apps/${endpoint}/${id}`,
          extend,
          null,
          `/beheer/applicaties/${id}`
        ),
        makeRequest(
          `${BASE_URL}/apps/openregister/api/schemas/${schemaSlug}`,
          null,
          null,
          `/beheer/applicaties/${id}`
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
                  <Heading>{data.naam}</Heading>

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
                        .filter(([key]) => !['id', 'naam'].includes(key))
                        .map(([key, schemaProperties]) => (
                          <div key={key}>
                            <strong>{_.startCase(key)}:</strong>
                            <Paragraph>
                              {formatBySchema(schemaProperties, data, key)}
                            </Paragraph>
                          </div>
                        ))}
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
                    const gebruik = await e.json();
                    navigate(`/beheer/gebruiken/${gebruik.id}`);
                  }}
                />

                <AcDienstFormModal
                  showModal={openModal === 'addDienst'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={async (e) => {
                    const data = await e.json();
                    navigate(`/beheer/diensten/${data.id}`);
                  }}
                  preSelectedVoorziening={data.id}
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
