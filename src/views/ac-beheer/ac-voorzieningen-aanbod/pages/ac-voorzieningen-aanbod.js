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

import CDTable from '../../cd-table';
import AcEditVoorzieningAanbodModal from '../modals/ac-edit-voorziening-aanbod-modal';
import AcDeleteVoorzieningAanbodModal from '../modals/ac-delete-voorziening-aanbod-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcSideNav } from '@components';

// TODO: remove test data
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

const AcBeheerVoorzieningenAanbod = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(testData);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/voorzieningaanboden'
      );
      const data = (await response.json()).results;

      const dataWithTestData = [...data, ...testData];

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
      label: 'Omschrijving',
      key: 'omschrijving',
    },
    {
      label: 'Type',
      key: 'type',
    },
    {
      label: 'Productpagina',
      key: 'productpagina',
    },
    {
      label: 'Ondersteuningsmodel',
      key: 'ondersteuningsmodel',
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
              navigate(
                NAVIGATE_TO.BEHEER_TYPE_DETAILS('voorzieningen-aanbod', row.id)
              );
            }}
          >
            Bekijken
          </button>
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
            <Heading>Beheer Voorzieningen Aanbod</Heading>

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

            <AcDeleteVoorzieningAanbodModal
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
          <Heading>Beheer Voorzieningen Aanbod</Heading>

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
          <AcEditVoorzieningAanbodModal
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

          <AcDeleteVoorzieningAanbodModal
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

export default withStore(observer(AcBeheerVoorzieningenAanbod));
