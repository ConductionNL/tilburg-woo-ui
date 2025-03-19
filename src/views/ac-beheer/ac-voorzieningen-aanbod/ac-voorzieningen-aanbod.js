import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { LABELS, VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import {
  PrimaryActionButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';
import config from '@src/config';

import { testData } from './testData';
import CDTable from '../cd-table';
import AcEditVoorzieningAanbodModal from './ac-edit-voorziening-aanbod-modal';
import { getCookie } from '@src/utilities';
import AcDeleteVoorzieningAanbodModall from './ac-delete-voorziening-aanbod-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';

const AcBeheerVoorzieningenAanbod = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, []);

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
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='sm'>
          <AcLink href='/mijn-omgeving'>
            <VISUALS.ARROW_LEFT />
            Terug naar mijn omgeving
          </AcLink>

          <Heading>{LABELS.BEHEER_VOORZIENINGEN_AANBOD}</Heading>

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
          />

          {/* modals */}
          <AcEditVoorzieningAanbodModal
            voorziening={singleSelectedRow}
            showModal={openModal === 'edit'}
            onClose={() => {
              setOpenModal(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
            }}
          />

          <AcDeleteVoorzieningAanbodModall
            voorzieningen={singleSelectedRow ? [singleSelectedRow] : selectedRows}
            showModal={openModal === 'delete'}
            onClose={() => {
              setOpenModal(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
            }}
          />
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerVoorzieningenAanbod));
