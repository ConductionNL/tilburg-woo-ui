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
import AcEditContractModal from './ac-edit-contract-modal';
import AcDeleteContractenModal from './ac-delete-contracten-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import { AcSideNav } from '@components';

const AcBeheerContracten = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    {
      '@self': {
        id: null,
        uuid: '9b3e247c-d156-4a88-be32-f91c45d78e2a',
        uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/9b3e247c-d156-4a88-be32-f91c45d78e2a',
        version: null,
        register: '3',
        schema: '19',
        files: [],
        relations: [],
        locked: null,
        owner: null,
        updated: null,
        created: null,
        folder:
          'Open Registers/Software Catalogus Register/Contract/9b3e247c-d156-4a88-be32-f91c45d78e2a',
      },
      naam: 'MijnOverheid Zaakportaal',
      beschrijving:
        'Een centraal zakenportaal waar burgers en ondernemers hun lopende aanvragen bij overheidsinstanties kunnen indienen, inzien en de voortgang kunnen volgen. Het portaal biedt tevens mogelijkheden voor het uploaden van documenten en het ontvangen van statusupdates.',
      voorzieningstypeId: '31d4b892-af23-4c67-bb45-ef8d23a91c56',
      categorie: 'E-dienstverlening',
      functionaliteiten: [
        'e13f72a5-fg91-5885-af7g-f393bbc71235',
        'd24e83b6-hi02-6996-bg8h-g4a4ccd82346',
      ],
      doelgroep: ['Gemeente', 'Provincie', 'Waterschap', 'Rijksoverheid'],
      referentieComponenten: ['7cd25ef7-jk13-7aa7-ci9j-h5b5dde93457'],
      standaarden: ['8de36fg8-kl24-8bb8-dj0k-i6c6eef04568'],
      id: '9b3e247c-d156-4a88-be32-f91c45d78e2a',
    },
  ]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/contracts'
      );
      const data = (await response.json())?.results;

      const dataWithTestData = [
        ...data,
        {
          '@self': {
            id: null,
            uuid: '9b3e247c-d156-4a88-be32-f91c45d78e2a',
            uri: 'https://vng.accept.commonground.nu/apps/openregister/api/objects/9b3e247c-d156-4a88-be32-f91c45d78e2a',
            version: null,
            register: '3',
            schema: '19',
            files: [],
            relations: [],
            locked: null,
            owner: null,
            updated: null,
            created: null,
            folder:
              'Open Registers/Software Catalogus Register/Contract/9b3e247c-d156-4a88-be32-f91c45d78e2a',
          },
          naam: 'MijnOverheid Zaakportaal',
          beschrijving:
            'Een centraal zakenportaal waar burgers en ondernemers hun lopende aanvragen bij overheidsinstanties kunnen indienen, inzien en de voortgang kunnen volgen. Het portaal biedt tevens mogelijkheden voor het uploaden van documenten en het ontvangen van statusupdates.',
          voorzieningstypeId: '31d4b892-af23-4c67-bb45-ef8d23a91c56',
          categorie: 'E-dienstverlening',
          functionaliteiten: [
            'e13f72a5-fg91-5885-af7g-f393bbc71235',
            'd24e83b6-hi02-6996-bg8h-g4a4ccd82346',
          ],
          doelgroep: ['Gemeente', 'Provincie', 'Waterschap', 'Rijksoverheid'],
          referentieComponenten: ['7cd25ef7-jk13-7aa7-ci9j-h5b5dde93457'],
          standaarden: ['8de36fg8-kl24-8bb8-dj0k-i6c6eef04568'],
          id: '9b3e247c-d156-4a88-be32-f91c45d78e2a',
        },
      ];
      setData(dataWithTestData || []);
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
      label: 'Categorie',
      key: 'categorie',
    },
    {
      label: 'Doelgroep',
      key: 'doelgroep',
    },
    {
      label: 'Referentie Componenten',
      key: 'referentieComponenten',
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
            <Heading>Beheer Contracten</Heading>

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
            <AcEditContractModal
              contract={singleSelectedRow}
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

            <AcDeleteContractenModal
              contracten={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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
          <Heading>Beheer Contracten</Heading>

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
          <AcEditContractModal
            contract={singleSelectedRow}
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

          <AcDeleteContractenModal
            contracten={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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

export default withStore(observer(AcBeheerContracten));
