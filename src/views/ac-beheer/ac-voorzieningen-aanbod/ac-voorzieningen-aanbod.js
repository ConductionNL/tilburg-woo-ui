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

const AcBeheerVoorzieningenAanbod = () => {
  const testData = [
    {
      id: 1,
      title: 'title1',
      summary: 'summary1',
      status: 'status1',
      createdAt: 'createdAt1',
      updatedAt: 'updatedAt1',
    },
    {
      id: 2,
      title: 'title2',
      summary: 'summary2',
      status: 'status2',
      createdAt: 'createdAt2',
      updatedAt: 'updatedAt2',
    },
  ];

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
      label: 'Titel',
      key: 'title',
    },
    {
      label: 'Samenvatting',
      key: 'summary',
    },
    {
      label: 'Status',
      key: 'status',
    },
    {
        label: '',
        key: '',
        customHeader: (
          <b>Acties</b>
        ),
        customContent: (row) => (
          <button>
            test
          </button>
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

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.BEHEER_VOORZIENINGEN_AANBOD}</Heading>

            <AcFlex spacing='sm' justifyContent='end'>
              <PrimaryActionButton>do something</PrimaryActionButton>
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
