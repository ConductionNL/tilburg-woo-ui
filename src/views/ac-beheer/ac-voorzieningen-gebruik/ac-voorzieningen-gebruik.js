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
import AcEditVoorzieningGebruikModal from './ac-edit-voorziening-gebruik-modal';
import AcDeleteVoorzieningGebruikModal from './ac-delete-voorziening-gebruik-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import { AcSideNav } from '@components';

const AcBeheerVoorzieningenGebruik = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    {
      '@self': {
        id: null,
        uuid: 'f5e9c234-a781-4d92-b31c-8de456f89a12',
        uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/f5e9c234-a781-4d92-b31c-8de456f89a12',
        version: null,
        register: '3',
        schema: '18',
        files: [],
        relations: [],
        locked: null,
        owner: null,
        updated: null,
        created: null,
        folder:
          'Open Registers/Software Catalogus Register/VoorzieningGebruik/f5e9c234-a781-4d92-b31c-8de456f89a12',
      },
      organisatieId: 'b7c9d234-e561-42f8-a912-3de456f89b23',
      voorzieningId: 'a8b7c345-d672-53e9-b023-4ef567g90c34',
      versieId: 'c9d8e456-f783-64fa-c134-5fg678h01d45',
      beheerder: {
        naam: 'Willem van der Molen',
        email: 'w.vandermolen@gemeente.nl',
        telefoon: '06-12345678',
        functie: 'Technisch Applicatiebeheerder',
      },
      startDatum: '2024-01-01',
      eindDatum: null,
      status: 'In gebruik',
      opmerkingen: 'MijnGemeente Portaal - Fase 2',
      bbnScore: 4,
      ibpScore: 3,
      bivClassificatie: {
        beschikbaarheid: 'Hoog',
        integriteit: 'Hoog',
        vertrouwelijkheid: 'Midden',
      },
      bedrijfsKritisch: true,
      privacyGevoelig: true,
      contactpersoon: {
        naam: 'Marieke de Boer',
        email: 'm.deboer@gemeente.nl',
        telefoonnummer: '06-98765432',
        functie: 'Functioneel Beheerder',
      },
      referentieComponenten: ['id-7a23cdf4-9eb0-11e4-89ab-0060569b4157'],
      id: 'f5e9c234-a781-4d92-b31c-8de456f89a12',
    },
  ]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/voorzieninggebruiken'
      );
      const data = (await response.json()).results;

      const dataWithTestData = [
        ...data,
        {
          '@self': {
            id: null,
            uuid: 'f5e9c234-a781-4d92-b31c-8de456f89a12',
            uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/f5e9c234-a781-4d92-b31c-8de456f89a12',
            version: null,
            register: '3',
            schema: '18',
            files: [],
            relations: [],
            locked: null,
            owner: null,
            updated: null,
            created: null,
            folder:
              'Open Registers/Software Catalogus Register/VoorzieningGebruik/f5e9c234-a781-4d92-b31c-8de456f89a12',
          },
          organisatieId: 'b7c9d234-e561-42f8-a912-3de456f89b23',
          voorzieningId: 'a8b7c345-d672-53e9-b023-4ef567g90c34',
          versieId: 'c9d8e456-f783-64fa-c134-5fg678h01d45',
          beheerder: {
            naam: 'Willem van der Molen',
            email: 'w.vandermolen@gemeente.nl',
            telefoon: '06-12345678',
            functie: 'Technisch Applicatiebeheerder',
          },
          startDatum: '2024-01-01',
          eindDatum: null,
          status: 'In gebruik',
          opmerkingen: 'MijnGemeente Portaal - Fase 2',
          bbnScore: 4,
          ibpScore: 3,
          bivClassificatie: {
            beschikbaarheid: 'Hoog',
            integriteit: 'Hoog',
            vertrouwelijkheid: 'Midden',
          },
          bedrijfsKritisch: true,
          privacyGevoelig: true,
          contactpersoon: {
            naam: 'Marieke de Boer',
            email: 'm.deboer@gemeente.nl',
            telefoonnummer: '06-98765432',
            functie: 'Functioneel Beheerder',
          },
          referentieComponenten: ['id-7a23cdf4-9eb0-11e4-89ab-0060569b4157'],
          id: 'f5e9c234-a781-4d92-b31c-8de456f89a12',
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
      label: 'Id',
      key: 'id',
    },
    {
      label: 'Versie Id',
      key: 'versieId',
    },
    {
      label: 'Status',
      key: 'status',
    },
    {
      label: 'Opmerkingen',
      key: 'opmerkingen',
    },
    {
      label: 'BBN Score',
      key: 'bbnScore',
    },
    {
      label: 'IBP Score',
      key: 'ibpScore',
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
            <Heading>Beheer Voorzieningen Gebruik</Heading>

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
            <AcEditVoorzieningGebruikModal
              voorziening={singleSelectedRow}
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

            <AcDeleteVoorzieningGebruikModal
              voorzieningen={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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
          <Heading>Beheer Voorzieningen Gebruik</Heading>

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
          <AcEditVoorzieningGebruikModal
            voorziening={singleSelectedRow}
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

          <AcDeleteVoorzieningGebruikModal
            voorzieningen={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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

export default withStore(observer(AcBeheerVoorzieningenGebruik));
