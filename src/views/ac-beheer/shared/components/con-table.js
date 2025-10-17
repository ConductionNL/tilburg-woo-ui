import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  // eslint-disable-next-line import/no-unresolved
} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';
import { AcUUID, shouldResolveToName, getDisplayValue } from '@src/utilities';
import { TOOLTIP_ID } from '@src/index.web';
import {
  ConHorizontalOverflowWrapper,
  ConTableSearch,
  ConUuidResolver,
} from '@components';
import { VISUALS } from '@src/constants';
import clsx from 'clsx';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { AcCheckbox } from '@molecules';
import { extractUUIDs } from '@src/utilities/con-resolve-uuids-in-text';

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
 * - Overflow wrapper for horizontal scrolling
 * - Header search functionality with debounced callbacks
 * - Multiple simultaneous header searches
 * - Enum support with dropdown selects from schema properties
 * - Toggleable search interface
 * - Static column styling for action columns via `static: true` on a header
 *
 * **Automatic Data Handling:**
 * - Arrays: joined with commas
 * - Objects: converted to JSON strings
 * - Primitives: displayed as-is
 * - Booleans: displayed as 'Ja' or 'Nee'
 * - Cells with no data will display a `-`
 * - Custom content (if provided) overrides automatic handling and the `-` for empty cells
 *
 * **UUID Resolution:**
 * - When `schema` and `objectStore` are provided, reference fields (single or array) are resolved to names using the names cache and displayed; the original ID(s) are available as a tooltip.
 * - For generic string and array values (not declared as references in `schema`), any UUIDs present in the text are resolved via a lightweight cache lookup at render time.
 * - If a UUID is not present in the cache yet, the original value is shown until the cache is populated.
 *
 * **Sorting:**
 * - Enable sorting by setting `showSortButtons` prop to true
 * - Sort buttons only appear for headers that have a `key` property defined
 * - Click cycle: ascending -> descending -> no sort
 * - Sorting prefers resolved names when available (using `schema` and the names cache); otherwise falls back to original values.
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
 * **Table Search:**
 * - A dedicated search component is rendered above the table when `onHeaderSearch` is provided and `showSearch` is true
 * - Dropdown to select which table field to search on
 * - Text input for search query with debounced updates
 * - Visual tags showing active searches with removal capability
 * - Automatic enum support for dropdown fields
 * - Callback receives search parameters: `onHeaderSearch({ fieldKey1: value1, fieldKey2: value2 })`
 *
 * **Enum Support:**
 * - Fields with enum values in dataProperties automatically show dropdown selects
 * - Enum values are automatically detected from `dataProperties[fieldKey].enum`
 * - Dropdowns are searchable and clearable
 * - Values are debounced just like text inputs
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
 *   data={[{ name: "John", age: 30, status: "active" }]}
 *   dataProperties={{
 *     name: { type: "string" },
 *     age: { type: "number" },
 *     status: { type: "string", enum: ["active", "inactive", "pending"] }
 *   }}
 *   tableHeaders={[
 *     {
 *       id: "name",
 *       label: "Name",
 *       key: "name"
 *     },
 *     {
 *       id: "age",
 *       label: "Age",
 *       key: "age"
 *     },
 *     {
 *       id: "status",
 *       label: "Status",
 *       key: "status"
 *     }
 *   ]}
 *   renderSelectRowButtons
 *   getSelectedRows={(selected) => console.log(selected)}
 *   truncateLines={2}
 *   showSortButtons
 *   showSearch={true}
 *   onHeaderSearch={(searchValues) => {
 *     // searchValues will be: { name: "John", status: "active" } if both headers are searching
 *     // The status header will show a dropdown with ["active", "inactive", "pending"] options
 *     fetchData(searchValues);
 *   }}
 * />
 * ```
 *
 * @param {object} props - The component props.
 * @param {Array} props.data - The data to display in the table.
 * @param {boolean} props.renderSelectRowButtons - Whether to render the select row buttons.
 * @param {number} props.truncateLines - The number of lines to truncate the text to. Default is 0 (no truncation).
 * @param {(selectedRows: any[]) => void} props.getSelectedRows - The function to call when the selected rows change.
 * @param {boolean} props.removeOverflowWrapper - Whether to remove the overflow wrapper. (default: false)
 * @param {{
 *      id: string,
 *      label?: string,
 *      key?: string,
 *      customHeader?: React.ReactElement | string | (() => React.ReactElement | string),
 *      customContent?: React.ReactElement | string | ((row: any) => React.ReactElement | string),
 *      sortComparator?: (a: any, b: any, direction: boolean | null) => number,
 *      doNotTruncate?: boolean,
 *      static?: boolean
 * }[]} props.tableHeaders - The headers to display in the table. (array of objects)
 * @param props.tableHeaders.id - The unique identifier for the header. Required.
 * @param props.tableHeaders.label - The label to display in the table header.
 * @param props.tableHeaders.key - The key to get from the data object to display in the table cell. Required for sorting functionality.
 * @param props.tableHeaders.customHeader - The custom header to display in the table cell.
 * @param props.tableHeaders.customContent - The custom content to display in the table cell.
 * @param props.tableHeaders.sortComparator - The custom sort function to display in the table cell. for direction true = ascending, false = descending, null = no sort
 * @param props.tableHeaders.doNotTruncate - Whether to not truncate the text in the table cell. (default: false)
 * @param props.tableHeaders.static - When true, apply static column styling (e.g., actions column). Adds class `con-table-actions-column` and omits default header label styling.
 * @param {Object} props.dataProperties - Schema properties object containing field definitions with enum values.
 * @param {boolean} props.showSortButtons - Whether to show the header sort buttons. Sort buttons only appear for headers with a key property. (default: false)
 * @param {boolean} props.showSearch - Whether to show the search interface above the table. (default: false)
 * @param {Object} [props.objectStore] - Optional ObjectStore instance used for resolving UUIDs to names via the names cache.
 * @param {Object} [props.schema] - Optional JSON schema for the data set. When provided together with `objectStore`, reference fields are resolved to names and shown with a tooltip containing the original ID(s).
 * @param {React.Ref} ref - The components ref. Can be used to trigger functions from the parent like `resetSelectedRows()`.
 * @param {Function} ref.resetSelectedRows - The function to reset the selected rows.
 * @param {boolean} props.loading - Whether to show a loading state.
 * @param {(searchValues: { [headerId: string]: string }) => void} props.onHeaderSearch - Callback function called when any header search value changes. Receives an object with all current search values as parameters.
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
    loading = false,
    removeOverflowWrapper = false,
    onHeaderSearch,
    dataProperties = {},
    showSearch = false,
    // Names resolution props
    objectStore = null,
    schema = null,
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
  const data = useMemo(() => {
    if (!_data || !Array.isArray(_data)) return [];
    return JSON.parse(JSON.stringify(_data));
  }, [_data]);
  const sortedData = useMemo(() => {
    // if no id is set, do not sort
    if (!headerSort[0]) return data;

    const h = tableHeaders.find((h) => h.id === headerSort[0]);

    // if a sort comparator is set, use it
    if (h?.sortComparator && typeof h.sortComparator === 'function') {
      return [...data].sort((a, b) => h.sortComparator(a, b, headerSort[1]));
    }

    // on third click (direction === null), reset to default (unsorted)
    if (headerSort[1] === null) {
      return data;
    }

    // Build a local names map from the object store cache (sync)
    const localNamesMap = (() => {
      const cache = objectStore?.namesCache;
      if (!cache) return {};
      const map = {};
      Object.entries(cache).forEach(([id, { name }]) => {
        map[id] = name;
      });
      return map;
    })();

    // Helper to replace UUIDs in a string using the local cache only (sync)
    const resolveTextWithNamesMap = (text) => {
      if (typeof text !== 'string') return text;
      const uuids = extractUUIDs(text);
      if (!uuids?.length) return text;
      let out = text;
      uuids.forEach((uuid) => {
        const name = localNamesMap[uuid];
        if (name) {
          out = out.replace(new RegExp(uuid, 'g'), name);
        }
      });
      return out;
    };

    // Normalize values for sorting, preferring resolved names when available
    const normalizeForSort = (val) => {
      // Use schema-based resolution when applicable
      if (h?.key && schema?.properties?.[h.key]) {
        const property = { ...schema.properties[h.key], key: h.key };
        if (shouldResolveToName(property, val)) {
          const display = getDisplayValue(val, property, localNamesMap);
          if (Array.isArray(display)) return display.join(', ');
          return display != null ? String(display) : '';
        }
      }

      // Generic fallback: try to resolve UUIDs in strings/arrays using cache
      if (Array.isArray(val)) {
        return val
          .map((item) =>
            typeof item === 'string' ? resolveTextWithNamesMap(item) : String(item)
          )
          .join(', ');
      }
      if (typeof val === 'string') return resolveTextWithNamesMap(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (val == null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    const sorted = [...data].sort((a, b) => {
      const aVal = normalizeForSort(h?.key ? a[h.key] : a);
      const bVal = normalizeForSort(h?.key ? b[h.key] : b);
      const cmp = String(aVal).localeCompare(String(bVal), 'nl', {
        sensitivity: 'base',
        numeric: true,
      });
      return headerSort[1] ? cmp : -cmp;
    });

    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, headerSort, schema, objectStore?.namesCache, tableHeaders]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const removeUniqueSymbol = useMemo(
    () => (row) => {
      // eslint-disable-next-line no-unused-vars
      const { [uniqueSymbol]: removed, ...cleanRow } = row;
      return cleanRow;
    },
    [uniqueSymbol]
  );

  // When the data changes, drop selections that no longer exist and announce via getSelectedRows
  useEffect(() => {
    if (!selectedRows.length) return;
    const stillSelected = sortedData.filter((row) =>
      selectedRows.some((sel) => sel[uniqueSymbol] === row[uniqueSymbol])
    );
    if (stillSelected.length !== selectedRows.length) {
      setSelectedRows(stillSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedData, selectedRows, uniqueSymbol]);

  // when the data changes, update the selected all state based on the selected rows
  useEffect(() => {
    const allSelected =
      sortedData.length > 0 &&
      sortedData.every((row) =>
        selectedRows.some(
          (selectedRow) => selectedRow[uniqueSymbol] === row[uniqueSymbol]
        )
      );
    setSelectedAll(allSelected);
  }, [selectedRows, sortedData, uniqueSymbol]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectAll = useMemo(() => {
    return (checked) => {
      setSelectedAll(checked);
      setSelectedRows(checked ? sortedData : []);
    };
  }, [sortedData]);

  const handleSelectRow = useMemo(() => {
    return (checked, row) => {
      setSelectedRows(
        checked
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Removed cache-derived namesMap to prevent re-renders on cache churn

  const handleDataCellRender = useCallback(
    (header, row) => {
      if (header.customContent) {
        return renderCustomElement(header.customContent, row);
      }

      if (!row[header.key] || row[header.key] === 'null') {
        return '-';
      }

      if (header.key === 'logo') {
        return (
          <ConLogoPreview
            logoUrl={row[header.key]}
            className='ac-register-review__logo'
          />
        );
      }

      // Schema-declared references: render with tooltip of original ID(s) and allow async resolution via ConUuidResolver
      if (schema?.properties?.[header.key] && objectStore) {
        const property = { ...schema.properties[header.key], key: header.key };
        if (shouldResolveToName(property, row[header.key])) {
          const originalValue = Array.isArray(row[header.key])
            ? `Original IDs: ${row[header.key].join(', ')}`
            : `Original ID: ${row[header.key]}`;

          if (Array.isArray(row[header.key])) {
            const items = row[header.key].filter(Boolean);
            if (items.length === 0) return '-';
            return (
              <span
                title={originalValue}
                data-tooltip-id={TOOLTIP_ID}
                style={{ cursor: 'help' }}
              >
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    <ConUuidResolver>{String(item)}</ConUuidResolver>
                    {index < items.length - 1 ? ', ' : ''}
                  </React.Fragment>
                ))}
              </span>
            );
          }

          return (
            <span
              title={originalValue}
              data-tooltip-id={TOOLTIP_ID}
              style={{ cursor: 'help' }}
            >
              <ConUuidResolver>{String(row[header.key])}</ConUuidResolver>
            </span>
          );
        }
      }

      // Generic array handler (only for non-reference arrays)
      if (Array.isArray(row[header.key])) {
        const items = row[header.key].filter(Boolean);
        if (items.length === 0) return '-';
        return (
          <span>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <ConUuidResolver>{String(item)}</ConUuidResolver>
                {index < items.length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
          </span>
        );
      }

      if (typeof row[header.key] === 'object') {
        return JSON.stringify(row[header.key]);
      }

      if (typeof row[header.key] === 'boolean') {
        return row[header.key] ? 'Ja' : 'Nee';
      }

      return <ConUuidResolver>{String(row[header.key])}</ConUuidResolver>;
    },
    // Keep dependencies minimal to avoid unnecessary recalculations
    [renderCustomElement, schema]
  );

  const tableHeader = useMemo(() => {
    return (
      <thead>
        <TableRow>
          {renderSelectRowButtons && (
            <TableCell>
              <div className='con-table-checkbox'>
                <AcCheckbox
                  id='select-all'
                  checked={selectedAll}
                  onChange={handleSelectAll}
                  disabled={sortedData.length === 0}
                />
              </div>
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
              <TableCell
                key={header.id}
                className={header.static ? 'con-table-actions-column' : undefined}
              >
                <div className={clsx('con-table-header-content')}>
                  <div className={clsx('con-table-header-content-label')}>
                    <span
                      className={
                        !header.static
                          ? 'con-table-header-content__label'
                          : undefined
                      }
                    >
                      <b>{header.label}</b>
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'con-table-header-sort-button-container',
                      isSortable &&
                        showSortButtons &&
                        'con-table-header-sort-button-container-sortable'
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
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      </thead>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    renderSelectRowButtons,
    selectedAll,
    headerSort,
    handleSelectAll,
    tableHeaders,
    showSortButtons,
  ]);

  const tableRows = useMemo(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell
            className='con-table-cell'
            colSpan={tableHeaders.length + Number(!!renderSelectRowButtons)}
          >
            Loading...
          </TableCell>
        </TableRow>
      );
    }

    if (sortedData.length === 0) {
      return (
        <TableRow>
          <TableCell
            className='con-table-cell'
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
          <TableCell className={clsx('con-table-cell', 'con-table-checkbox-cell')}>
            <div className='con-table-checkbox'>
              <AcCheckbox
                id={`select-row-${row[uniqueSymbol]}`}
                checked={
                  selectedRows.find(
                    (selectedRow) => selectedRow[uniqueSymbol] === row[uniqueSymbol]
                  ) || false
                }
                onChange={(checked) => handleSelectRow(checked, row)}
              />
            </div>
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
              className={clsx(
                'con-table-cell',
                header.static ? 'con-table-actions-column' : undefined
              )}
            >
              <div
                id={`table-cell-${headerIndex}`}
                style={header?.doNotTruncate ? {} : getTruncateStyle()}
              >
                {handleDataCellRender(header, row)}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <>
      {/* Search Component */}
      {onHeaderSearch && (
        // this is being done inside the component as to not lose state.
        <ConTableSearch
          show={showSearch}
          dataProperties={dataProperties}
          onSearch={onHeaderSearch}
        />
      )}

      {/* Table */}
      {!removeOverflowWrapper ? (
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
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table>
            {tableHeader}
            <TableBody>{tableRows}</TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default forwardRef(ConTable);
