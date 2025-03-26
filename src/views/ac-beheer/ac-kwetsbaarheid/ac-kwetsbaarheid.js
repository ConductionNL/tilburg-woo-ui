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
import AcEditKwetsbaarheidModal from './ac-edit-kwetsbaarheid-modal';
import AcDeleteKwetsbaarheidModal from './ac-delete-kwetsbaarheid-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import AcSideNav from '@src/views/ac-mijn-omgeving/ac-side-nav';

const AcBeheerKwetsbaarheden = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    {
      '@self': {
        id: null,
        uuid: '8e5d2f34-c267-4b99-af43-e82d56f90c3d',
        uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/8e5d2f34-c267-4b99-af43-e82d56f90c3d',
        version: null,
        register: '3',
        schema: '23',
        files: [],
        relations: [],
        locked: null,
        owner: null,
        updated: null,
        created: null,
        folder:
          'Open Registers/Software Catalogus Register/Kwetsbaarheid/8e5d2f34-c267-4b99-af43-e82d56f90c3d',
      },
      voorzieningversieId: '7b9c3d45-a182-4d76-b894-53b5fc8de97a',
      cveNummer: 'CVE-2024-28456',
      titel: 'XSS kwetsbaarheid in DigiD koppelvlak',
      beschrijving:
        'Een cross-site scripting (XSS) kwetsbaarheid in het DigiD koppelvlak maakt het mogelijk voor aanvallers om kwaadaardige scripts te injecteren via onvoldoende gevalideerde gebruikersinvoer in het BSN-veld.',
      ernst: 'kritiek',
      ontdektOp: '2024-02-15',
      gepubliceerdOp: '2024-02-28',
      opgelostIn: '2.3.5',
      mitigatie:
        'Implementeer HTML encoding voor alle gebruikersinvoer en pas content security policy (CSP) headers toe. Update naar versie 2.3.5 of hoger zodra beschikbaar.',
      referenties: [
        'https://nvd.nist.gov/vuln/detail/CVE-2024-28456',
        'https://www.ncsc.nl/actueel/advisories/NCSC-2024-0234',
      ],
      id: '8e5d2f34-c267-4b99-af43-e82d56f90c3d',
    },
  ]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/kwetsbaarheden'
      );
      const data = (await response.json())?.results;

      const dataWithTestData = [
        ...data,
        {
          '@self': {
            id: null,
            uuid: '8e5d2f34-c267-4b99-af43-e82d56f90c3d',
            uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/8e5d2f34-c267-4b99-af43-e82d56f90c3d',
            version: null,
            register: '3',
            schema: '23',
            files: [],
            relations: [],
            locked: null,
            owner: null,
            updated: null,
            created: null,
            folder:
              'Open Registers/Software Catalogus Register/Kwetsbaarheid/8e5d2f34-c267-4b99-af43-e82d56f90c3d',
          },
          voorzieningversieId: '7b9c3d45-a182-4d76-b894-53b5fc8de97a',
          cveNummer: 'CVE-2024-28456',
          titel: 'XSS kwetsbaarheid in DigiD koppelvlak',
          beschrijving:
            'Een cross-site scripting (XSS) kwetsbaarheid in het DigiD koppelvlak maakt het mogelijk voor aanvallers om kwaadaardige scripts te injecteren via onvoldoende gevalideerde gebruikersinvoer in het BSN-veld.',
          ernst: 'kritiek',
          ontdektOp: '2024-02-15',
          gepubliceerdOp: '2024-02-28',
          opgelostIn: '2.3.5',
          mitigatie:
            'Implementeer HTML encoding voor alle gebruikersinvoer en pas content security policy (CSP) headers toe. Update naar versie 2.3.5 of hoger zodra beschikbaar.',
          referenties: [
            'https://nvd.nist.gov/vuln/detail/CVE-2024-28456',
            'https://www.ncsc.nl/actueel/advisories/NCSC-2024-0234',
          ],
          id: '8e5d2f34-c267-4b99-af43-e82d56f90c3d',
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
      label: 'Titel',
      key: 'titel',
    },
    {
      label: 'Beschrijving',
      key: 'beschrijving',
    },
    {
      label: 'Ernst',
      key: 'ernst',
    },
    {
      label: 'CVE nummer',
      key: 'cveNummer',
    },
    {
      label: 'Ontdekt op',
      key: 'ontdektOp',
      customContent: (row) =>
        row.ontdektOp
          ? !isNaN(new Date(row.ontdektOp).getTime())
            ? new Date(row.ontdektOp).toLocaleDateString()
            : row.ontdektOp
          : '-',
    },
    {
      label: 'Voorziening versie ID',
      key: 'voorzieningversieId',
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
            <Heading>Beheer Kwetsbaarheden</Heading>

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
            <AcEditKwetsbaarheidModal
              kwetsbaarheid={singleSelectedRow}
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

            <AcDeleteKwetsbaarheidModal
              kwetsbaarheden={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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
          <Heading>Beheer Kwetsbaarheden</Heading>

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
          <AcEditKwetsbaarheidModal
            kwetsbaarheid={singleSelectedRow}
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

          <AcDeleteKwetsbaarheidModal
            kwetsbaarheden={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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

export default withStore(observer(AcBeheerKwetsbaarheden));
