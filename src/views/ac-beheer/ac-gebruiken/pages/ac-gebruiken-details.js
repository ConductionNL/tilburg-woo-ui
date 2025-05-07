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

import AcGebruikenFormModal from '../modals/ac-gebruiken-form-modal';
import AcDeleteGebruikenModal from '../modals/ac-delete-gebruiken-modal';
import ConActionMenu from '../../con-action-menu';
import { getCookie } from '@src/utilities';
import { BASE_URL } from '../../ac-beheer';

const AcBeheerGebruikenDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieninggebruik/voorzieninggebruik/${id}`,
        null,
        null,
        `/beheer/voorzieningen-gebruik/${id}`
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
                        <strong>Status:</strong>
                        <Paragraph>{data.status}</Paragraph>
                      </div>

                      <div>
                        <strong>Opmerkingen:</strong>
                        <Paragraph>{data.opmerkingen}</Paragraph>
                      </div>

                      <div>
                        <strong>BBN Score:</strong>
                        <Paragraph>{data.bbnScore}</Paragraph>
                      </div>

                      <div>
                        <strong>IBP Score:</strong>
                        <Paragraph>{data.ibpScore}</Paragraph>
                      </div>

                      <div>
                        <strong>Versie ID:</strong>
                        <Paragraph>{data.versieId}</Paragraph>
                      </div>

                      <div>
                        <strong>Organisatie ID:</strong>
                        <Paragraph>{data.organisatieId}</Paragraph>
                      </div>

                      <div>
                        <strong>Voorziening ID:</strong>
                        <Paragraph>{data.voorzieningId}</Paragraph>
                      </div>

                      <div>
                        <strong>Beheerder:</strong>
                        <Paragraph>
                          {data.beheerder?.naam}
                          <br />
                          {data.beheerder?.email}
                          <br />
                          {data.beheerder?.telefoon}
                          <br />
                          {data.beheerder?.functie}
                        </Paragraph>
                      </div>

                      <div>
                        <strong>Start Datum:</strong>
                        <Paragraph>{data.startDatum}</Paragraph>
                      </div>

                      <div>
                        <strong>Eind Datum:</strong>
                        <Paragraph>{data.eindDatum}</Paragraph>
                      </div>

                      <div>
                        <strong>BIV Classificatie:</strong>
                        <Paragraph>
                          Beschikbaarheid: {data.bivClassificatie?.beschikbaarheid}
                          <br />
                          Integriteit: {data.bivClassificatie?.integriteit}
                          <br />
                          Vertrouwelijkheid:{' '}
                          {data.bivClassificatie?.vertrouwelijkheid}
                        </Paragraph>
                      </div>

                      <div>
                        <strong>Bedrijfs Kritisch:</strong>
                        <Paragraph>{data.bedrijfsKritisch ? 'Ja' : 'Nee'}</Paragraph>
                      </div>

                      <div>
                        <strong>Privacy Gevoelig:</strong>
                        <Paragraph>{data.privacyGevoelig ? 'Ja' : 'Nee'}</Paragraph>
                      </div>
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
              </AcFlex>
            )}
          </AcColumn>
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerGebruikenDetails));
