import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { useNavigate } from 'react-router';
import { AcButton } from '@src/molecules';
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
import { getCookie } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcBeheerDienstDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningaanbod/voorzieningaanbod/${id}`,
        [
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'leverancier'],
        ],
        null,
        `/beheer/voorzieningen-aanbod/${id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setData(data);
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
  const [openModal, setOpenModal] = useState(null);

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
                      <div>
                        <strong>Omschrijving:</strong>
                        <Paragraph>{data.omschrijving}</Paragraph>
                      </div>

                      <div>
                        <strong>Type:</strong>
                        <Paragraph>{data.type}</Paragraph>
                      </div>

                      <div>
                        <strong>Voorziening ID:</strong>
                        <Paragraph>{data.voorzieningId}</Paragraph>
                      </div>

                      <div>
                        <strong>Organisatie ID:</strong>
                        <Paragraph>{data.organisatieId}</Paragraph>
                      </div>

                      <div>
                        <strong>Productpagina:</strong>
                        <Paragraph>
                          <a
                            href={data.productpagina}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {data.productpagina}
                          </a>
                        </Paragraph>
                      </div>

                      <div>
                        <strong>Ondersteuningsmodel:</strong>
                        <Paragraph>{data.ondersteuningsmodel}</Paragraph>
                      </div>

                      <div>
                        <strong>Licentiemodel:</strong>
                        <Paragraph>{data.licentiemodel}</Paragraph>
                      </div>

                      <div>
                        <strong>Hostingopties:</strong>
                        <Paragraph>{data.hostingopties}</Paragraph>
                      </div>
                    </div>

                    <div>
                      <AcTabs
                        selectedIndex={versionTabIndex}
                        onSelect={(index) => setVersionTabIndex(index)}
                      >
                        <AcTabList>
                          <AcTab selected={versionTabIndex === 0}>Versies</AcTab>
                        </AcTabList>

                        <AcTabPanel selected={versionTabIndex === 0}>
                          {data.versies.map((versie, index) => (
                            <Paragraph key={index}>{versie}</Paragraph>
                          ))}
                        </AcTabPanel>
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
