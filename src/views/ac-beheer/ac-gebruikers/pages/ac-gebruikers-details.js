import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LANGUAGES, VISUALS } from '@constants';
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

import AcGebruikersFormModal from '../modals/ac-gebruikers-form-modal';
import AcDeleteGebruikersModal from '../modals/ac-delete-gebruikers-modal';
import ConActionMenu from '../../con-action-menu';
import _ from 'lodash';

const AcBeheerGebruikerDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const hostname = window.location.hostname;
      const baseUrl =
        hostname === 'vng.test.opencatalogi.nl'
          ? 'https://vng.test.commonground.nu/apps'
          : 'https://vng.accept.commonground.nu/apps';
      const response = await fetch(
        baseUrl + `/openconnector/api/endpoint/gebruikers/${id}`
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
                        <strong>Gebruikersnaam:</strong>
                        <Paragraph>{data.username || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>E-mail:</strong>
                        <Paragraph>{data.email || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Functie:</strong>
                        <Paragraph>{data.functie || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Organisatie:</strong>
                        <Paragraph>{data.organisatie || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Telefoonnummer:</strong>
                        <Paragraph>{data.telefoonnummer || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Rollen:</strong>
                        <Paragraph>{data.rollen?.join(', ') || '-'}</Paragraph>
                      </div>

                      <div>
                        <strong>Status:</strong>
                        <Paragraph>{data.actief ? 'Actief' : 'Inactief'}</Paragraph>
                      </div>

                      <div>
                        <strong>Laatste inlog:</strong>
                        <Paragraph>{formatDate(data.laatsteInlogdatum)}</Paragraph>
                      </div>

                      <div>
                        <strong>Aangemaakt op:</strong>
                        <Paragraph>{formatDate(data.aanmaakdatum)}</Paragraph>
                      </div>

                      <div>
                        <strong>Laatst gewijzigd:</strong>
                        <Paragraph>{formatDate(data.wijzigingsdatum)}</Paragraph>
                      </div>

                      <div>
                        <strong>Voorkeuren:</strong>
                        <Paragraph>
                          Taal:{' '}
                          {LANGUAGES.find(
                            (language) => language.code === data.voorkeuren?.taal
                          )?.name || '-'}
                          <br />
                          Thema: {_.upperFirst(data.voorkeuren?.thema) || '-'}
                        </Paragraph>
                      </div>
                    </div>
                  </AcFlex>
                </AcColumn>

                {/* modals */}
                <AcGebruikersFormModal
                  gebruiker={data}
                  showModal={openModal === 'edit' || openModal === 'add'}
                  isEdit={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteGebruikersModal
                  gebruikers={[data]}
                  showModal={openModal === 'delete'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    navigate('/beheer/gebruikers');
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

export default withStore(observer(AcBeheerGebruikerDetails));
