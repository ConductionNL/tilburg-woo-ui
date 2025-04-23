import { forwardRef, useRef, useState } from 'react';
import { AcDrawer } from '@components';
import { AcCheckbox } from '@src/molecules';
import AcColumn from '@src/atoms/ac-column/ac-column';

/**
 * A drawer component that displays a list of headers as checkboxes for filtering
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.headers - Array of header objects to display as checkboxes
 * @param {Array} props.defaultHeaders - Array of headers that should be checked by default
 * @param {Function} props.onChange - Callback function called when checkbox selection changes
 * @param {React.Ref} ref - Forwarded ref for the drawer
 * @param {() => void} ref.current.showModal - Method to open the drawer
 * @param {() => void} ref.current.close - Method to close the drawer
 */
const ConFilterHeadersDrawer = ({ headers, defaultHeaders = [], onChange }, ref) => {
  // Create unique symbols for header identification
  const headerSymbols = new WeakMap();

  /**
   * Gets or creates a unique symbol identifier for a header
   * @param {Object} header - Header object to get symbol for
   * @returns {Symbol} Unique symbol for the header
   */
  const getHeaderSymbol = (header) => {
    if (!headerSymbols.has(header)) {
      headerSymbols.set(header, Symbol('header'));
    }
    return headerSymbols.get(header);
  };

  // Initialize checked headers with default headers
  const [checkedHeaders, setCheckedHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(getHeaderSymbol(header)))
  );

  console.log(checkedHeaders);

  const toggleCheckedHeader = (header) => {
    setCheckedHeaders((prev) => {
      const headerSymbol = getHeaderSymbol(header);
      const isChecked = prev.some((h) => getHeaderSymbol(h) === headerSymbol);
      const newCheckedHeaders = isChecked
        ? prev.filter((h) => getHeaderSymbol(h) !== headerSymbol)
        : [...prev, header];

      // Notify parent of changes
      onChange?.(newCheckedHeaders);
      return newCheckedHeaders;
    });
  };

  return (
    <AcDrawer id='concepts-drawer' title='Voorzieningen' ref={ref}>
      <AcColumn gap='sm'>
        {headers.map((header) => {
          const headerSymbol = getHeaderSymbol(header);
          const headerLabel = header.label || header.key;

          return (
            <AcCheckbox
              key={headerSymbol.toString()}
              label={headerLabel}
              checked={checkedHeaders.some(
                (h) => getHeaderSymbol(h) === headerSymbol
              )}
              onChange={() => toggleCheckedHeader(header)}
            />
          );
        })}
      </AcColumn>
    </AcDrawer>
  );
};

export default forwardRef(ConFilterHeadersDrawer);
