import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { AcDrawer } from '@components';
import { AcCheckbox } from '@src/molecules';
import AcColumn from '@src/atoms/ac-column/ac-column';

/**
 * A drawer component that displays a list of headers as checkboxes for filtering
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array<{id: string, label?: string, key?: string}>} props.headers - Array of header objects
 * @param {string[]} props.defaultHeaders - Array of header IDs that should be checked by default
 * @param {(selected: Array<Object>) => void} props.onChange - Callback when selection changes
 * @param {React.Ref} ref - Forwarded ref to control the drawer
 */
const ConFilterHeadersDrawer = forwardRef(({ headers, defaultHeaders = [], onChange }, ref) => {
  // Track checked header IDs
  const [checkedIds, setCheckedIds] = useState(() => new Set(defaultHeaders));

  // Expose show/close methods of the underlying AcDrawer
  useImperativeHandle(ref, () => ({
    showModal: () => ref.current?.showModal(),
    close: () => ref.current?.close(),
  }), [ref]);

  // Toggle a header by its ID
  const toggleHeader = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Notify parent with full header objects
      const selected = headers.filter(h => next.has(h.id));
      onChange?.(selected);
      return next;
    });
  };

  return (
    <AcDrawer removeBackdrop id="concepts-drawer" title="Header filters" ref={ref}>
      <AcColumn gap="sm">
        {headers.map(({ id, label, key }) => (
          <AcCheckbox
            key={id}
            label={label || key}
            checked={checkedIds.has(id)}
            onChange={() => toggleHeader(id)}
          />
        ))}
      </AcColumn>
    </AcDrawer>
  );
});

export default ConFilterHeadersDrawer;
