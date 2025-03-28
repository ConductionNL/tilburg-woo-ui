import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { PrimaryActionButton } from '@utrecht/component-library-react';
import config from '@src/config';

import CDTable from '../cd-table';
import AcEditOrganisatieModal from './ac-edit-organisatie-modal';
import AcDeleteOrganisatieModal from './ac-delete-organisatie-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import { AcSideNav } from '@components';

const AcBeheerOrganisaties = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    {
      '@self': {
        id: null,
        uuid: '31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
        uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
        version: null,
        register: '3',
        schema: '16',
        files: [],
        relations: [],
        locked: null,
        owner: null,
        updated: null,
        created: null,
        folder:
          'Open Registers/Software Catalogus Register/Organisatie/31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
      },
      naam: 'Gemeente Bosendaal',
      type: 'overheid',
      kvkNummer: '68750110',
      oidn: '0123-4567',
      moederOrganisatie: '',
      sector: 'Publieke sector',
      organisatietype: 'Gemeente',
      website: 'https://www.bosendaal.nl',
      adres: {
        straat: 'Raadhuisplein',
        huisnummer: '1',
        plaats: 'Bosendaal',
        postcode: '4731 GK',
        land: 'Nederland',
      },
      contactgegevens: {
        telefoon: '+31-14-0123456',
        email: 'gemeente@bosendaal.nl',
        contactpersoon: 'Petra de Vries',
      },
      beschrijving:
        'Gemeente Bosendaal is een groene gemeente in het zuiden van Nederland met ongeveer 45.000 inwoners. De gemeente staat bekend om haar innovatieve aanpak van duurzaamheid en digitale dienstverlening.',
      logo: 'https://cdn.example.org/logos/gemeente_bosendaal.png',
      voorzieningen: [
        '82b4e5f1-2c93-4d78-ae56-9b31c7d84f2a',
        '95c7d6e8-3f12-4a89-bc45-6d78e9f12a3b',
      ],
      gebruik: ['d9e8f7c6-5b4a-3c2d-1e0f-9a8b7c6d5e4f'],
      deelnemerIn: [],
      id: '31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
    },
  ]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/organisaties'
      );
      const data = (await response.json())?.results;

      const dataWithTestData = [
        ...data,
        {
          '@self': {
            id: null,
            uuid: '31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
            uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
            version: null,
            register: '3',
            schema: '16',
            files: [],
            relations: [],
            locked: null,
            owner: null,
            updated: null,
            created: null,
            folder:
              'Open Registers/Software Catalogus Register/Organisatie/31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
          },
          naam: 'Gemeente Bosendaal',
          type: 'overheid',
          kvkNummer: '68750110',
          oidn: '0123-4567',
          moederOrganisatie: '',
          sector: 'Publieke sector',
          organisatietype: 'Gemeente',
          website: 'https://www.bosendaal.nl',
          adres: {
            straat: 'Raadhuisplein',
            huisnummer: '1',
            plaats: 'Bosendaal',
            postcode: '4731 GK',
            land: 'Nederland',
          },
          contactgegevens: {
            telefoon: '+31-14-0123456',
            email: 'gemeente@bosendaal.nl',
            contactpersoon: 'Petra de Vries',
          },
          beschrijving:
            'Gemeente Bosendaal is een groene gemeente in het zuiden van Nederland met ongeveer 45.000 inwoners. De gemeente staat bekend om haar innovatieve aanpak van duurzaamheid en digitale dienstverlening.',
          logo: 'https://cdn.example.org/logos/gemeente_bosendaal.png',
          voorzieningen: [
            '82b4e5f1-2c93-4d78-ae56-9b31c7d84f2a',
            '95c7d6e8-3f12-4a89-bc45-6d78e9f12a3b',
          ],
          gebruik: ['d9e8f7c6-5b4a-3c2d-1e0f-9a8b7c6d5e4f'],
          deelnemerIn: [],
          id: '31e68bc4-9f23-47aa-b5d2-c8e9d1f45a16',
        },
      ];

      setData(dataWithTestData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  const tableRef = useRef(null);

  const tableHeaders = [
    {
      label: 'Naam',
      key: 'naam',
    },
    {
      label: 'Beschrijving',
      key: 'beschrijving',
    },
    {
      label: 'Type',
      key: 'type',
    },
    {
      label: 'KvK nummer',
      key: 'kvkNummer',
    },
    {
      label: 'OIDN',
      key: 'oidn',
    },
    {
      label: 'Moeder Organisatie',
      key: 'moederOrganisatie',
    },
    {
      label: 'Acties',
      key: '',
      customContent: (row) => (
        <AcFlex column spacing='xs'>
          <button
            className='utrecht-button slim'
            variant='secondary'
            onClick={() => {
              setSingleSelectedRow(row);
              setOpenModal('edit');
            }}
          >
            bewerken
          </button>
          <button
            className='utrecht-button slim'
            variant='secondary'
            onClick={() => {
              setSingleSelectedRow(row);
              setOpenModal('delete');
            }}
          >
            verwijderen
          </button>
        </AcFlex>
      ),
    },
  ];

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return (
      // <AcSection spacing className='ac-mijn-omgeving-section'>
      //   <AcFlex spacing='xl'>
      //     <AcSideNav />
      //     <AcColumn gap='sm'>
      //       <Heading level={1}>Er is een fout opgetreden</Heading>
      //       <Paragraph>
      //         Er kon geen verbinding worden gemaakt met de server. Probeer het later
      //         opnieuw.
      //       </Paragraph>
      //       <Paragraph>{error.message}</Paragraph>
      //     </AcColumn>
      //   </AcFlex>
      // </AcSection>
      <AcSection spacing className='ac-mijn-omgeving-section'>
        <AcFlex spacing='xl'>
          <AcSideNav />
          <AcColumn gap='sm'>
            <Heading>Beheer Organisaties</Heading>

            <AcFlex spacing='sm' justifyContent='end'>
              <PrimaryActionButton
                disabled={selectedRows.length === 0}
                onClick={handleMultipleDelete}
              >
                Delete {selectedRows.length}{' '}
                {selectedRows.length === 1 ? 'item' : 'items'}
              </PrimaryActionButton>
            </AcFlex>

            <CDTable
              data={data}
              tableHeaders={tableHeaders}
              getSelectedRows={setSelectedRows}
              renderSelectRowButtons
              ref={tableRef}
              truncateLines={2}
            />

            {/* modals */}
            <AcEditOrganisatieModal
              organisatie={singleSelectedRow}
              showModal={openModal === 'edit'}
              onClose={() => {
                setOpenModal(null);
                setSingleSelectedRow(null);
              }}
              onSuccess={() => {
                tableRef.current.resetSelectedRows();
                fetchData();
              }}
            />

            <AcDeleteOrganisatieModal
              organisaties={singleSelectedRow ? [singleSelectedRow] : selectedRows}
              showModal={openModal === 'delete'}
              onClose={() => {
                setOpenModal(null);
                setSingleSelectedRow(null);
              }}
              onSuccess={() => {
                tableRef.current.resetSelectedRows();
                fetchData();
              }}
            />
          </AcColumn>
        </AcFlex>
      </AcSection>
    );
  }

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />
        <AcColumn gap='sm'>
          <Heading>Beheer Organisaties</Heading>

          <AcFlex spacing='sm' justifyContent='end'>
            <PrimaryActionButton
              disabled={selectedRows.length === 0}
              onClick={handleMultipleDelete}
            >
              Delete {selectedRows.length}{' '}
              {selectedRows.length === 1 ? 'item' : 'items'}
            </PrimaryActionButton>
          </AcFlex>

          <CDTable
            data={data}
            tableHeaders={tableHeaders}
            getSelectedRows={setSelectedRows}
            renderSelectRowButtons
            ref={tableRef}
            truncateLines={2}
          />

          {/* modals */}
          <AcEditOrganisatieModal
            organisatie={singleSelectedRow}
            showModal={openModal === 'edit'}
            onClose={() => {
              setOpenModal(null);
              setSingleSelectedRow(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
              fetchData();
            }}
          />

          <AcDeleteOrganisatieModal
            organisaties={singleSelectedRow ? [singleSelectedRow] : selectedRows}
            showModal={openModal === 'delete'}
            onClose={() => {
              setOpenModal(null);
              setSingleSelectedRow(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
              fetchData();
            }}
          />
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerOrganisaties));
