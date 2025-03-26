import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { VISUALS } from '@constants';
import {
  AcContainer,
  AcFlex,
  AcSection,
  AcTab,
  AcTabList,
  AcTabPanel,
  AcTabs,
} from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { PrimaryActionButton } from '@utrecht/component-library-react';
import config from '@src/config';

import AcEditVoorzieningAanbodModal from '../modals/ac-edit-voorziening-aanbod-modal';
import AcDeleteVoorzieningAanbodModall from '../modals/ac-delete-voorziening-aanbod-modal';
import { useNavigate } from 'react-router';
import { AcButton, AcLink } from '@src/molecules';
import { AcLoader } from '@src/components';
import AcSideNav from '@src/views/ac-mijn-omgeving/ac-side-nav';

const testData = [
  {
    '@self': {
      id: null,
      uuid: '8f3b5671-a294-4c84-9e4a-b2c654d89f12',
      uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/8f3b5671-a294-4c84-9e4a-b2c654d89f12',
      version: null,
      register: '3',
      schema: '17',
      files: [],
      relations: [],
      locked: null,
      owner: null,
      updated: null,
      created: null,
      folder:
        'Open Registers/Software Catalogus Register/VoorzieningAanbod/8f3b5671-a294-4c84-9e4a-b2c654d89f12',
    },
    id: '8f3b5671-a294-4c84-9e4a-b2c654d89f12',
    naam: 'eHerkenning Machtigingenregister',
    omschrijving:
      'Het eHerkenning Machtigingenregister is een centrale voorziening voor het beheren en valideren van digitale machtigingen voor bedrijven en organisaties. Hiermee kunnen gebruikers anderen machtigen om namens hun organisatie digitaal zaken te doen met overheidsinstanties en andere aangesloten dienstverleners.',
    type: 'Authenticatie',
    voorzieningId: '9d4e8f23-7c16-42a5-b391-d85f12e67890',
    organisatieId: '45c67d89-ab12-4e56-8f90-123456789abc',
    productpagina: 'https://www.eherkenning.nl/machtigingenregister',
    ondersteuningsmodel:
      'Beheerde dienst met zakelijke SLA en helpdesk tijdens kantooruren',
    licentiemodel: 'Jaarlijks abonnement op basis van organisatiegrootte',
    hostingopties: 'Private cloud',
    versies: [
      '9d4e8f23-7c16-42a5-b391-d85f12e67890',
      '45c67d89-ab12-4e56-8f90-123456789abc',
      '67890abc-def1-2345-6789-012345678901',
      '34567890-bcde-f123-4567-890123456789',
    ],
  },
];

const AcBeheerVoorzieningenAanbodDetails = ({ id }) => {
  const navigate = useNavigate();
  //   const [data, setData] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          `/openconnector/api/endpoint/voorzieningaanboden/${id}`
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
    // show test data if id is in testData list
    if (testData.map((item) => item.id).includes(id)) {
      setData(testData.find((item) => item.id === id));
      setLoading(false);
      return;
    }

    fetchData();
  }, []);

  const [versionTabIndex, setVersionTabIndex] = useState(0);

  if (error) {
    return (
      <AcSection>
        <AcContainer>
          <AcFlex column spacing='sm'>
            <Heading level={1}>Er is een fout opgetreden</Heading>
            <Paragraph>
              Er kon geen verbinding worden gemaakt met de server. Probeer het later
              opnieuw.
            </Paragraph>
            <Paragraph>{error.message}</Paragraph>
          </AcFlex>
        </AcContainer>
      </AcSection>
    );
  }

  const [openModal, setOpenModal] = useState(null);

  return (
    <AcSection spacing>
      <AcContainer>
        <AcFlex spacing='xl'>
          <AcSideNav />
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && (
              <AcFlex column spacing='xl'>
                <AcFlex spacing='sm' justifyContent='between'>
                  <Heading>{data.naam}</Heading>

                  <AcFlex className='ac-beheer-details--remove-width' spacing='xs'>
                    <AcButton
                      style='button'
                      icon={<VISUALS.PENCIL />}
                      onClick={() => setOpenModal('edit')}
                    >
                      Bijwerken
                    </AcButton>
                    <AcButton
                      style='button'
                      icon={<VISUALS.TRASHCAN />}
                      onClick={() => setOpenModal('delete')}
                    >
                      Verwijderen
                    </AcButton>
                    <AcButton style='button' icon={<VISUALS.PLUS />}>
                      Toevoegen
                    </AcButton>
                  </AcFlex>
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
                <AcEditVoorzieningAanbodModal
                  voorziening={data}
                  showModal={openModal === 'edit'}
                  onClose={() => {
                    setOpenModal(null);
                  }}
                  onSuccess={() => {
                    fetchData();
                  }}
                />

                <AcDeleteVoorzieningAanbodModall
                  voorzieningen={[data]}
                  showModal={openModal === 'delete'}
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
        </AcFlex>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerVoorzieningenAanbodDetails));
