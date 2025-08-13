import React, {
  forwardRef,
  useState,
  useEffect,
  useImperativeHandle,
  useRef,
  // eslint-disable-next-line import/no-unresolved
} from 'react';
import { AcDrawer, AcLoader } from '@components';
import { AcCheckbox } from '@src/molecules';
import AcColumn from '@src/atoms/ac-column/ac-column';
import ReactSelect from 'react-select';
import clsx from 'clsx';

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
const OrganisatieFilterHeadersDrawer = forwardRef(
  (
    {
      headers,
      defaultHeaders = [],
      onChange,
      loading = false,
      getBeoordeling = () => {},
    },
    ref
  ) => {
    const drawerRef = useRef(null);
    const [touched, setTouched] = useState(false);
    const [checkedIds, setCheckedIds] = useState(() => new Set(defaultHeaders));
    const [selectedBeoordeling, setSelectedBeoordeling] = useState(null);

    // Update checkedIds when defaultHeaders changes and component hasn't been touched
    useEffect(() => {
      if (!touched) setCheckedIds(new Set(defaultHeaders));
    }, [defaultHeaders, touched]);

    useImperativeHandle(
      ref,
      () => ({
        showModal: () => drawerRef.current?.showModal(),
        close: () => drawerRef.current?.close(),
        getCheckedHeaders: () => headers.filter((h) => checkedIds.has(h.id)),
        getCheckedIds: () => Array.from(checkedIds),
      }),
      [headers, checkedIds]
    );

    const toggleHeader = (id) => {
      setTouched(true);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    useEffect(() => {
      onChange?.(headers.filter((h) => checkedIds.has(h.id)));
    }, [Array.from(checkedIds).join(',')]);

    if (loading)
      return (
        <AcDrawer
          removeBackdrop
          id='concepts-drawer'
          title='Kolommen'
          ref={drawerRef}
        >
          <AcLoader />
        </AcDrawer>
      );

    return (
      <AcDrawer removeBackdrop id='concepts-drawer' title='Kolommen' ref={drawerRef}>
        <AcColumn gap='tiger'>
          <div>
            <label className='utrecht-form-label'>
              <h4 className='utrecht-heading-4'>Beoordeling</h4>
            </label>
            <ReactSelect
              placeholder='Selecteer een beoordeling'
              className={clsx('ac-beheer-select')}
              value={selectedBeoordeling}
              onChange={(e) => {
                setSelectedBeoordeling(e);
                getBeoordeling?.(e?.value ?? e);
              }}
              options={[
                { label: 'Concept', value: 'Concept' },
                { label: 'Actief', value: 'Actief' },
              ]}
              isClearable
            />
          </div>

          <AcColumn gap='sm'>
            {headers.map(({ id, label, key }) => (
              <AcCheckbox
                key={id}
                label={label || key}
                checked={checkedIds.has(id)}
                onChange={() => toggleHeader(id)}
              />
            ))}
          </AcColumn>
        </AcColumn>
      </AcDrawer>
    );
  }
);

OrganisatieFilterHeadersDrawer.displayName = 'OrganisatieFilterHeadersDrawer';

export default OrganisatieFilterHeadersDrawer;
