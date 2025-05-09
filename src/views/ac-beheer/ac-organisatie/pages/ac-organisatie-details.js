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
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcDrawer } from '@components';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

import AcOrganisatieFormModal from '../modals/ac-organisatie-form-modal';
import AcDeleteOrganisatieModal from '../modals/ac-delete-organisatie-modal';
import ConActionMenu from '../../con-action-menu';
import { getCookie } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcBeheerOrganisatieDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const fetchData = async () => {
    try {
      setLoading(true);


      const endpoint =
      BASE_URL.includes('test')
        ? 'openregister/api/objects/voorzieningen/organisatie'
        : 'openconnector/api/endpoint/organisaties';
  
    const extend =
      BASE_URL.includes('test')
        ? [['_extend[]', 'contactgegevens']]
        : [];
      const response = await makeRequest(
        `${BASE_URL}/apps/${endpoint}/${id}`,
        extend,
        null,
        `/beheer/organisaties/${id}`
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
                        <strong>Type:</strong>
                        <Paragraph>{data.type || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>KvK nummer:</strong>
                        <Paragraph>{data.kvkNummer || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>OIDN:</strong>
                        <Paragraph>{data.oidn || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Moeder organisatie:</strong>
                        <Paragraph>{data.moederOrganisatie || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Sector:</strong>
                        <Paragraph>{data.sector || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Organisatietype:</strong>
                        <Paragraph>{data.organisatietype || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Website:</strong>
                        <Paragraph>{data.website || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Adres:</strong>
                        <Paragraph>
                          {data.adres?.straat} {data.adres?.huisnummer}
                        </Paragraph>
                        <Paragraph>
                          {data.adres?.postcode} {data.adres?.plaats}
                        </Paragraph>
                        <Paragraph>{data.adres?.land}</Paragraph>
                      </div>

                      <div>
                        <strong>Contactgegevens:</strong>
                        <Paragraph>{data.contactgegevens?.contactpersoon}</Paragraph>
                        <Paragraph>{data.contactgegevens?.telefoon}</Paragraph>
                        <Paragraph>{data.contactgegevens?.email}</Paragraph>
                      </div>

                      <div>
                        <strong>Beschrijving:</strong>
                        <Paragraph>{data.beschrijving || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Logo:</strong>
                        <Paragraph>{data.logo || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Voorzieningen:</strong>
                        <Paragraph>
                          {data.voorzieningen?.join(', ') || '-'}
                        </Paragraph>
                      </div>

                      <div>
                        <strong>Gebruik:</strong>
                        <Paragraph>{data.gebruik?.join(', ') || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Deelnemer in:</strong>
                        <Paragraph>{data.deelnemerIn?.join(', ') || '-'}</Paragraph>
                      </div>
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
              </AcFlex>
            )}
          </AcColumn>
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerOrganisatieDetails));
