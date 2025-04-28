import React, {
  forwardRef,
  useCallback,
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
import { ConSorter, AcUUID } from '@src/utilities';
import { TOOLTIP_ID } from '@src/index.web';
import { ConHorizontalOverflowWrapper } from '@components';
import { VISUALS } from '@src/constants';
import clsx from 'clsx';

/**
 * A versatile and highly customizable Conduction table component for displaying and managing tabular data.
 *
 * **Key Features:**
 * - Row selection with checkboxes
 * - Customizable headers and cell content
 * - Text truncation for lengthy content
 * - Automatic handling of common data types (arrays, objects, primitives)
 * - Communication with parent components via refs
 * - Column sorting with ascending/descending/none states
 *
 * **Automatic Data Handling:**
 * - Arrays: joined with commas
 * - Objects: converted to JSON strings
 * - Primitives: displayed as-is
 * - Booleans: displayed as 'Ja' or 'Nee'
 * - Cells with no data will display a `-`
 * - Custom content (if provided) overrides automatic handling and the `-` for empty cells
 *
 * **Sorting:**
 * - Enable sorting by setting `showSortButtons` prop to true
 * - Sort buttons only appear for headers that have a `key` property defined
 * - Click cycle: ascending -> descending -> no sort
 * - Default sorting handles different data types appropriately:
 *   - Strings: alphabetical order
 *   - Numbers / booleans: numerical order
 *   - Arrays: joined and compared as strings
 *   - Objects: compared by number of keys
 *   - Null/undefined/empty strings: sorted to end/start based on direction
 * - Custom sorting can be defined per header using the `sortComparator` property:
 *   ```jsx
 *   {
 *     label: "Custom Sort",
 *     key: "myKey",
 *     sortComparator: (a, b, direction) => {
 *       // direction: true = ascending, false = descending, null = no sort
 *       if (direction === null) return 0;
 *       return ConSorterLogic(a.myKey, b.myKey, direction);
 *       // or custom logic
 *     }
 *   }
 *   ```
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
 *    - Overrides automatic data type handling and the `-` for empty cells
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
 * <ConTable
 *   data={[{ name: "John", age: 30 }]}
 *   tableHeaders={[
 *     {
 *       id: "name",
 *       label: "Name",
 *       key: "name"
 *     },
 *     {
 *       id: "age",
 *       label: "", // not needed with a customHeader
 *       key: "age",
 *       customHeader: <div className="age-header">Age (years)</div>
 *     },
 *     {
 *       id: "actions",
 *       label: "Actions",
 *       key: "", // not needed with a customContent
 *       customContent: (row) => <button onClick={() => edit(row)}>Edit</button>
 *     }
 *   ]}
 *   renderSelectRowButtons
 *   getSelectedRows={(selected) => console.log(selected)}
 *   truncateLines={2}
 *   showSortButtons
 * />
 * ```
 *
 * @param {object} props - The component props.
 * @param {Array} props.data - The data to display in the table.
 * @param {boolean} props.renderSelectRowButtons - Whether to render the select row buttons.
 * @param {number} props.truncateLines - The number of lines to truncate the text to. Default is 0 (no truncation).
 * @param {(selectedRows: any[]) => void} props.getSelectedRows - The function to call when the selected rows change.
 * @param {{
 *      id: string,
 *      label?: string,
 *      key?: string,
 *      customHeader?: React.ReactElement | string | (() => React.ReactElement | string),
 *      customContent?: React.ReactElement | string | ((row: any) => React.ReactElement | string),
 *      sortComparator?: (a: any, b: any, direction: boolean | null) => number
 * }[]} props.tableHeaders - The headers to display in the table. (array of objects)
 * @param props.tableHeaders.id - The unique identifier for the header. Required.
 * @param props.tableHeaders.label - The label to display in the table header.
 * @param props.tableHeaders.key - The key to get from the data object to display in the table cell. Required for sorting functionality.
 * @param props.tableHeaders.customHeader - The custom header to display in the table cell.
 * @param props.tableHeaders.customContent - The custom content to display in the table cell.
 * @param props.tableHeaders.sortComparator - The custom sort function to display in the table cell. for direction true = ascending, false = descending, null = no sort
 * @param {boolean} props.showSortButtons - Whether to show the header sort buttons. Sort buttons only appear for headers with a key property. (default: false)
 * @param {React.Ref} ref - The components ref. Can be used to trigger functions from the parent like `resetSelectedRows()`.
 * @param {Function} ref.resetSelectedRows - The function to reset the selected rows.
 *
 * @returns {React.ReactElement} The rendered table component.
 *
 * @note Row selection state is not preserved when new data is provided, even if it contains some of the same records.
 * @note Keys referencing deeply nested objects can not be used. e.g. `{ a: { b: 'test' } }` `key: 'a.b'` will not work.
 *
 * @author Thijn Douwma
 *
 * SSBoYXZlIHdvcmtlZCB3YXkgdG9vIGhhcmQgb24gdGhpcywgYW5kIG5vIG9uZSBpcyBldmVuIGdvaW5nIHRvIGtub3cgaXQgZXhpc3RzIPCfmKI=
 */
const ConTable = (
  {
    data: _data,
    tableHeaders,
    renderSelectRowButtons,
    getSelectedRows,
    truncateLines = 0,
    showSortButtons = false,
  },
  ref
) => {
  /**
   * Header sort state.
   * Holds an array of two values:
   * - The first value is the header id to sort by.
   * - The second value is the direction to sort by.
   * - The key associated with the header id is used to sort the data.
   * - If the first or second value is null, the data is not sorted.
   * - If the second value is true, the data is sorted in ascending order.
   * - If the second value is false, the data is sorted in descending order.
   */
  const [headerSort, setHeaderSort] = useState([null, null]);

  // make a deepclone of the data to avoid mutating the original data
  const data = useMemo(() => JSON.parse(JSON.stringify(_data)), [_data]);
  const sortedData = useMemo(() => {
    // if no id is set, do not sort
    if (!headerSort[0]) return data;

    const h = tableHeaders.find((h) => h.id === headerSort[0]);

    // if a sort comparator is set, use it
    if (h?.sortComparator && typeof h.sortComparator === 'function') {
      return [...data].sort((a, b) => h.sortComparator(a, b, headerSort[1]));
    }

    // if no sort comparator is set, use the default sort comparator
    return ConSorter(data, h.key, headerSort[1]);
  }, [data, headerSort]);

  // list of selected rows as a full data object
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedAll, setSelectedAll] = useState(false);

  /**
   * A unique symbol used as the primary ID for each row.
   * This is then used to check if a row is selected.
   */
  const uniqueSymbol = useMemo(() => Symbol(), []);

  // add the unique symbol to each row as the key, which then contains a unique id
  // this should take place before the data is sorted
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
    setSelectedAll(
      selectedRows.length === sortedData.length && sortedData.length > 0
    );
  }, [selectedRows, sortedData.length]);

  const renderCustomElement = useMemo(() => {
    return (element, row) => {
      if (React.isValidElement(element)) {
        return element;
      }
      if (typeof element === 'function') {
        return element(removeUniqueSymbol(row));
      }
      return element;
    };
  }, []);

  const handleSelectAll = useMemo(() => {
    return (e) => {
      setSelectedAll(e.target.checked);
      setSelectedRows(e.target.checked ? sortedData : []);
    };
  }, [sortedData]);

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

  const isTextClamped = (elm) => elm && elm.scrollHeight > elm.clientHeight;

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

  const handleDataCellRender = useCallback(
    (header, row) => {
      if (header.customContent) {
        return renderCustomElement(header.customContent, row);
      }

      if (!row[header.key]) {
        return '-';
      }

      if (Array.isArray(row[header.key])) {
        return row[header.key].join(', ') || '-';
      }

      if (typeof row[header.key] === 'object') {
        return JSON.stringify(row[header.key]);
      }

      if (typeof row[header.key] === 'boolean') {
        return row[header.key] ? 'Ja' : 'Nee';
      }

      return row[header.key];
    },
    [renderCustomElement, removeUniqueSymbol]
  );

  const tableHeader = useMemo(() => {
    return (
      <thead>
        <TableRow>
          {renderSelectRowButtons && (
            <TableCell>
              <input
                disabled={sortedData.length === 0}
                checked={selectedAll}
                onChange={handleSelectAll}
                type='checkbox'
              />
            </TableCell>
          )}
          {tableHeaders.map((header, index) => {
            // Do not render headers without an id, a lot of functionality depends on it
            if (!header.id) {
              console.error(
                `[ConTable::tableHeader] Header at index ${index} (label: ${header.label}) is missing required 'id' property`
              );
              return null;
            }

            const isSortable =
              header.key ||
              (!!header.sortComparator &&
                typeof header.sortComparator === 'function');

            return (
              <TableCell key={header.id}>
                <div
                  className={clsx(
                    'con-table-header-content',
                    isSortable &&
                      showSortButtons &&
                      'con-table-header-content-sortable'
                  )}
                  onClick={() => {
                    if (!isSortable || !showSortButtons) return;

                    if (headerSort[0] !== header.id || headerSort[1] === null) {
                      setHeaderSort([header.id, true]);
                    } else if (headerSort[1] === true) {
                      setHeaderSort([header.id, false]);
                    } else {
                      setHeaderSort([header.id, null]);
                    }
                  }}
                >
                  <span>
                    {header.customHeader ? (
                      renderCustomElement(header.customHeader)
                    ) : (
                      <b>{header.label}</b>
                    )}
                  </span>
                  {showSortButtons && isSortable && (
                    <span className='con-table-header-content__sort-button-container'>
                      {(headerSort[0] !== header.id || headerSort[1] === null) && (
                        <VISUALS.SORT className='con-table-sort-icon-non' />
                      )}
                      {headerSort[0] === header.id && headerSort[1] === true && (
                        <VISUALS.SORT_UP className='con-table-sort-icon-asc' />
                      )}
                      {headerSort[0] === header.id && headerSort[1] === false && (
                        <VISUALS.SORT_DOWN className='con-table-sort-icon-desc' />
                      )}
                    </span>
                  )}
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      </thead>
    );
  }, [
    renderSelectRowButtons,
    selectedAll,
    headerSort,
    handleSelectAll,
    tableHeaders,
    renderCustomElement,
  ]);

  const tableRows = useMemo(() => {
    if (sortedData.length === 0) {
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

    return sortedData.map((row, index) => (
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
        {tableHeaders.map((header, headerIndex) => {
          // Do not render headers content where header does not have an id
          if (!header.id) return null;

          return (
            <TableCell
              data-tooltip-id={
                isTextClamped(document.getElementById(`table-cell-${headerIndex}`))
                  ? TOOLTIP_ID
                  : null
              }
              data-tooltip-content={
                isTextClamped(document.getElementById(`table-cell-${headerIndex}`))
                  ? row[header.key]
                  : null
              }
              key={header.id}
            >
              <div id={`table-cell-${headerIndex}`} style={getTruncateStyle()}>
                {handleDataCellRender(header, row)}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    ));
  }, [
    sortedData,
    tableHeaders,
    renderSelectRowButtons,
    selectedRows,
    handleSelectRow,
    renderCustomElement,
    handleDataCellRender,
  ]);

  return (
    <ConHorizontalOverflowWrapper
      ariaLabels={{
        scrollLeftButton: 'Scroll left',
        scrollRightButton: 'Scroll right',
      }}
    >
      <Table>
        {tableHeader}
        <TableBody>{tableRows}</TableBody>
      </Table>
    </ConHorizontalOverflowWrapper>
  );
};

export default forwardRef(ConTable);
