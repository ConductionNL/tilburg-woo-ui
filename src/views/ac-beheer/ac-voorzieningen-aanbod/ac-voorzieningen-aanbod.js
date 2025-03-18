import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { LABELS } from '@constants';
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
import CDTable from './cd-table';

const AcBeheerVoorzieningenAanbod = () => {
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
        // const data = testData;
        setData(data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
      }
    };

    fetchData();
  }, []);

  //   TODO: remove false
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
          <button className='utrecht-button slim' variant='secondary'>
            bewerken
          </button>
          <button className='utrecht-button slim' variant='secondary'>
            verwijderen
          </button>
        </AcFlex>
      ),
    },
  ];

  const handleMultipleDelete = () => {
    console.log('handleMultipleDelete');
    // console.log('ids to delete', selectedRows);
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.BEHEER_VOORZIENINGEN_AANBOD}</Heading>

            <AcFlex spacing='sm' justifyContent='end'>
              <PrimaryActionButton disabled={selectedRows.length === 0} onClick={handleMultipleDelete}>
                Delete {selectedRows.length}{' '}
                {selectedRows.length === 1 ? 'item' : 'items'}
              </PrimaryActionButton>
            </AcFlex>

            <CDTable data={testData} tableHeaders={tableHeaders} getSelectedRows={setSelectedRows} renderSelectRowButtons />
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerVoorzieningenAanbod));
