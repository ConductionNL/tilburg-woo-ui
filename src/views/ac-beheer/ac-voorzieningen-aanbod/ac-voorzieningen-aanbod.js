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
import AcEditVoorzieningAanbodModal from './ac-edit-voorziening-aanbod-modal';
import AcDeleteVoorzieningAanbodModal from './ac-delete-voorziening-aanbod-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import AcSideNav from '@src/views/ac-mijn-omgeving/ac-side-nav';

const AcBeheerVoorzieningenAanbod = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/voorzieningaanboden'
      );
      const data = (await response.json()).results;
      setData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <AcSection spacing className='ac-mijn-omgeving-section'>
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
