import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';

/**
 * A highly customizable Conduction table component that can be used to display data in a table.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data to display in the table.
 * @param {boolean} props.renderSelectRowButtons - Whether to render the select row buttons.
 * @param {(selectedRows: any[]) => void} props.getSelectedRows - The function to call when the selected rows change.
 * @param {{ label?: string, key?: string, customHeader?: React.ReactElement | (() => React.ReactElement), customContent?: React.ReactElement | ((row: any) => React.ReactElement) }[]} props.tableHeaders - The headers to display in the table.
 * @param {string} props.tableHeaders.label - The label to display in the table header.
 * @param {string} props.tableHeaders.key - The key to display in the table cell.
 * @param {React.ReactElement | (() => React.ReactElement)} props.tableHeaders.customHeader - The custom header to display in the table cell.
 * @param {React.ReactElement | ((row: any) => React.ReactElement)} props.tableHeaders.customContent - The custom content to display in the table cell.
 * @returns {React.ReactElement} The rendered table component.
 *
 * @author Thijn Douwma
 * 
 * SSBoYXZlIHdvcmtlZCB3YXkgdG9vIGhhcmQgb24gdGhpcywgYW5kIG5vIG9uZSBpcyBldmVuIGdvaW5nIHRvIGtub3cgaXQgZXhpc3RzIPCfmKI=
 */
const CDTable = ({
  data,
  tableHeaders,
  renderSelectRowButtons,
  getSelectedRows,
}) => {
  // list of selected rows as a full data object
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedAll, setSelectedAll] = useState(false);

  useEffect(() => {
    setSelectedAll(selectedRows.length === data.length && data.length > 0);
  }, [selectedRows, data.length]);

  const renderCustomElement = useMemo(() => {
    return (element, row) => {
      if (React.isValidElement(element)) {
        return element;
      }
      if (typeof element === 'function') {
        return element(row);
      }
      return element;
    };
  }, []);

  const handleSelectAll = useMemo(() => {
    return (e) => {
      setSelectedAll(e.target.checked);
      setSelectedRows(e.target.checked ? data : []);
    };
  }, [data]);

  const handleSelectRow = useMemo(() => {
    return (e, row) => {
      setSelectedRows(
        e.target.checked
          ? [...selectedRows, row]
          : selectedRows.filter((selectedRow) => selectedRow.id !== row.id)
      );
    };
  }, [selectedRows]);

  useEffect(() => {
    if (typeof getSelectedRows === 'function') {
      getSelectedRows(selectedRows);
    }
  }, [selectedRows, getSelectedRows]);

  const tableHeader = useMemo(() => {
    return (
      <thead>
        <TableRow>
          {renderSelectRowButtons && (
            <TableCell>
              <input
                checked={selectedAll}
                onChange={handleSelectAll}
                type='checkbox'
              />
            </TableCell>
          )}
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
    );
  }, [renderSelectRowButtons, selectedAll, handleSelectAll, tableHeaders, renderCustomElement]);

  const tableRows = useMemo(() => {
    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={tableHeaders.length}>
            Geen data gevonden
          </TableCell>
        </TableRow>
      );
    }

    return data.map((row, index) => (
      <TableRow key={index}>
        {renderSelectRowButtons && (
          <TableCell>
            <input
              checked={
                selectedRows.find(
                  (selectedRow) => selectedRow.id === row.id
                ) || false
              }
              onChange={(e) => handleSelectRow(e, row)}
              type='checkbox'
            />
          </TableCell>
        )}
        {tableHeaders.map((header, headerIndex) => (
          <TableCell key={headerIndex}>
            {header.customContent
              ? renderCustomElement(header.customContent, row)
              : row[header.key]}
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [data, tableHeaders, renderSelectRowButtons, selectedRows, handleSelectRow, renderCustomElement]);

  return (
    <Table>
      {tableHeader}
      <TableBody>
        {tableRows}
      </TableBody>
    </Table>
  );
};

export default CDTable;
