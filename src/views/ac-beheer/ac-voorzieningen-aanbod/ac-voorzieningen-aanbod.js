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
        const data = await response.json();
        setData(data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
      }
    };

    fetchData();
  }, []);

  //   TODO: remove false
  if (false && error) {
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

  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    setSelectedAll(selectedRows.length === testData.length);
  }, [selectedRows]);

  const tableHeaders = [
    {
      label: '',
      key: '',
      customHeader: (
        <input
          checked={selectedAll}
          onChange={(e) => {
            setSelectedAll(e.target.checked);
            setSelectedRows(e.target.checked ? testData.map((row) => row.id) : []);
          }}
          type='checkbox'
        />
      ),
      customContent: (row) => (
        <input
          checked={selectedRows.includes(row.id)}
          onChange={(e) => {
            setSelectedRows(
              e.target.checked
                ? [...selectedRows, row.id]
                : selectedRows.filter((id) => id !== row.id)
            );
          }}
          type='checkbox'
        />
      ),
    },
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

  const renderCustomElement = (element, row) => {
    if (React.isValidElement(element)) {
      return element;
    }
    if (typeof element === 'function') {
      return element(row);
    }
    return element;
  };

  const handleMultipleDelete = () => {
    console.log('handleMultipleDelete');
    console.log('ids to delete', selectedRows);
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

            <Table>
              <thead>
                <TableRow>
                  {tableHeaders.map((header, index) => (
                    <TableCell key={index}>
                      {header.customHeader ? (
                        renderCustomElement(header.customHeader)
                      ) : (
                        <b>{header.label}</b>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </thead>
              <TableBody>
                {testData.map((row, index) => (
                  <TableRow key={index}>
                    {tableHeaders.map((header, headerIndex) => (
                      <TableCell key={headerIndex}>
                        {header.customContent
                          ? renderCustomElement(header.customContent, row)
                          : row[header.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerVoorzieningenAanbod));
