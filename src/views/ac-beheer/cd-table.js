import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';
import { AcUUID } from '@src/utilities';

/**
 * A versatile and highly customizable Conduction table component for displaying and managing tabular data.
 *
 * **Key Features:**
 * - Row selection with checkboxes
 * - Customizable headers and cell content
 * - Text truncation for lengthy content
 * - Automatic handling of common data types (arrays, objects, primitives)
 * - Communication with parent components via refs
 *
 * **Automatic Data Handling:**
 * - Arrays: joined with commas
 * - Objects: converted to JSON strings
 * - Primitives: displayed as-is
 * - Custom content (if provided) overrides automatic handling
 *
 * **Custom Headers and Content:**
 * 1. **Custom Headers**
 *    - Accepts either a React element or a function returning a React element
 *    - Takes precedence over the default header
 *    ```jsx
 *    // As an element
 *    customHeader: <div className="custom-header">Name</div>
 *
 *    // As a function
 *    customHeader: () => <div className="custom-header">Name</div>
 *    ```
 *
 * 2. **Custom Content**
 *    - Accepts either a React element or a function that receives the row data
 *    - Overrides automatic data type handling
 *    ```jsx
 *    // As an element
 *    customContent: <button>Click me</button>
 *
 *    // As a function with row data
 *    customContent: (row) => <button onClick={() => alert(row.name)}>Edit {row.name}</button>
 *    ```
 *
 * @example
 * ```jsx
 * <CDTable
 *   data={[{ name: "John", age: 30 }]}
 *   tableHeaders={[
 *     {
 *       label: "Name",
 *       key: "name"
 *     },
 *     {
 *       label: "Age",
 *       key: "age",
 *       customHeader: <div className="age-header">Age (years)</div>
 *     },
 *     {
 *       label: "Actions",
 *       key: "",
 *       customContent: (row) => <button onClick={() => edit(row)}>Edit</button>
 *     }
 *   ]}
 *   renderSelectRowButtons
 *   getSelectedRows={(selected) => console.log(selected)}
 *   truncateLines={2}
 * />
 * ```
 * @param {object} props - The component props.
 * @param {Array} props.data - The data to display in the table.
 * @param {boolean} props.renderSelectRowButtons - Whether to render the select row buttons.
 * @param {number} props.truncateLines - The number of lines to truncate the text to. Default is 0 (no truncation).
 * @param {(selectedRows: any[]) => void} props.getSelectedRows - The function to call when the selected rows change.
 * @param {{ label?: string, key?: string, customHeader?: React.ReactElement | (() => React.ReactElement), customContent?: React.ReactElement | ((row: any) => React.ReactElement) }[]} props.tableHeaders - The headers to display in the table. (array of objects)
 * @param {string} props.tableHeaders.label - The label to display in the table header.
 * @param {string} props.tableHeaders.key - The key to get from the data object to display in the table cell.
 * @param {React.ReactElement | (() => React.ReactElement)} props.tableHeaders.customHeader - The custom header to display in the table cell.
 * @param {React.ReactElement | ((row: any) => React.ReactElement)} props.tableHeaders.customContent - The custom content to display in the table cell.
 * @param {React.Ref} ref - The components ref. Can be used to trigger functions from the parent like `resetSelectedRows()`.
 * @param {Function} ref.resetSelectedRows - The function to reset the selected rows.
 *
 * @returns {React.ReactElement} The rendered table component.
 *
 * @note Row selection state is not preserved when new data is provided, even if it contains some of the same records.
 *
 * @author Thijn Douwma
 *
 * SSBoYXZlIHdvcmtlZCB3YXkgdG9vIGhhcmQgb24gdGhpcywgYW5kIG5vIG9uZSBpcyBldmVuIGdvaW5nIHRvIGtub3cgaXQgZXhpc3RzIPCfmKI=
 */
const CDTable = (
  {
    data: _data,
    tableHeaders,
    renderSelectRowButtons,
    getSelectedRows,
    truncateLines = 0,
  },
  ref
) => {
  // make a deepclone of the data to avoid mutating the original data
  const data = useMemo(() => JSON.parse(JSON.stringify(_data)), [_data]);

  // list of selected rows as a full data object
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedAll, setSelectedAll] = useState(false);

  /**
   * A unique symbol used as the primary ID for each row.
   * This is then used to check if a row is selected.
   */
  const uniqueSymbol = useMemo(() => Symbol(), []);

  // add the unique symbol to each row as the key, which then contains a unique id
  useEffect(() => {
    data.forEach((row) => {
      row[uniqueSymbol] = AcUUID('CD');
    });
  }, [data]);

  const removeUniqueSymbol = useMemo(
    () => (row) => {
      const { [uniqueSymbol]: removed, ...cleanRow } = row;
      return cleanRow;
    },
    [uniqueSymbol]
  );

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
          : selectedRows.filter(
              (selectedRow) => selectedRow[uniqueSymbol] !== row[uniqueSymbol]
            )
      );
    };
  }, [selectedRows]);

  const resetSelectedRows = useMemo(() => {
    return () => {
      setSelectedRows([]);
    };
  }, [setSelectedRows]);

  useEffect(() => {
    if (typeof getSelectedRows === 'function') {
      // Remove the unique symbol from selected rows before passing them
      const cleanSelectedRows = selectedRows.map(removeUniqueSymbol);
      getSelectedRows(cleanSelectedRows);
    }
  }, [selectedRows, getSelectedRows]);

  // control what the parent sees when it uses the child's ref.
  useImperativeHandle(
    ref,
    () => ({
      resetSelectedRows,
    }),
    [resetSelectedRows]
  );

  const getTruncateStyle = useMemo(() => {
    return () => {
      if (!truncateLines) {
        return {};
      }

      return {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        WebkitLineClamp: truncateLines,
      };
    };
  }, [truncateLines]);

  const handleDataCellRender = useMemo(() => {
    return (header, row) => {
      if (header.customContent) {
        return renderCustomElement(header.customContent, removeUniqueSymbol(row));
      }

      if (Array.isArray(row[header.key])) {
        return row[header.key].join(', ');
      }

      if (typeof row[header.key] === 'object') {
        return JSON.stringify(row[header.key]);
      }

      return row[header.key];
    };
  }, [renderCustomElement, removeUniqueSymbol]);

  const tableHeader = useMemo(() => {
    return (
      <thead>
        <TableRow>
          {renderSelectRowButtons && (
            <TableCell>
              <input
                disabled={data.length === 0}
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
  }, [
    renderSelectRowButtons,
    selectedAll,
    handleSelectAll,
    tableHeaders,
    renderCustomElement,
  ]);

  const tableRows = useMemo(() => {
    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={tableHeaders.length + Number(!!renderSelectRowButtons)}
          >
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
                  (selectedRow) => selectedRow[uniqueSymbol] === row[uniqueSymbol]
                ) || false
              }
              onChange={(e) => handleSelectRow(e, row)}
              type='checkbox'
            />
          </TableCell>
        )}
        {tableHeaders.map((header, headerIndex) => (
          <TableCell key={headerIndex}>
            <div style={getTruncateStyle()}>{handleDataCellRender(header, row)}</div>
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [
    data,
    tableHeaders,
    renderSelectRowButtons,
    selectedRows,
    handleSelectRow,
    renderCustomElement,
    handleDataCellRender,
  ]);

  return (
    <Table>
      {tableHeader}
      <TableBody>{tableRows}</TableBody>
    </Table>
  );
};

export default forwardRef(CDTable);
