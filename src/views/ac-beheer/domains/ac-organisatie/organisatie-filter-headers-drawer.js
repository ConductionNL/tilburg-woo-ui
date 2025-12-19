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
 * @param {string} props.type - Type identifier for session storage key
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
      type,
    },
    ref
  ) => {
    const drawerRef = useRef(null);
    const touchedRef = useRef(false);
    const storageKey = type ? `filter-headers-${type}` : 'filter-headers-default';

    // Load from session storage or use defaultHeaders
    const getInitialCheckedIds = (
      currentType,
      currentDefaultHeaders,
      currentStorageKey
    ) => {
      if (!currentType) return new Set(currentDefaultHeaders);

      try {
        const stored = sessionStorage.getItem(currentStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return new Set(parsed);
        }
      } catch (error) {
        // If parsing fails, fall back to defaultHeaders
      }

      return new Set(currentDefaultHeaders);
    };

    const [checkedIds, setCheckedIds] = useState(() =>
      getInitialCheckedIds(type, defaultHeaders, storageKey)
    );
    const [selectedBeoordeling, setSelectedBeoordeling] = useState(null);
    const isInitialMount = useRef(true);
    const isSavingToStorage = useRef(false);

    // Notify parent component with initial checked headers from session storage
    useEffect(() => {
      if (isInitialMount.current && headers.length > 0) {
        isInitialMount.current = false;
        onChange?.(headers.filter((h) => checkedIds.has(h.id)));
      }
    }, [headers]);

    // Save to session storage whenever checkedIds changes
    useEffect(() => {
      if (isInitialMount.current) {
        return;
      }

      if (isSavingToStorage.current) {
        isSavingToStorage.current = false;
        return;
      }

      if (type) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(Array.from(checkedIds)));
        } catch (error) {
          // Session storage might be disabled or full
        }
      }
    }, [checkedIds, type, storageKey]);

    // Update checkedIds when defaultHeaders changes and component hasn't been touched
    useEffect(() => {
      if (!touchedRef.current) {
        isSavingToStorage.current = true;
        const initialIds = getInitialCheckedIds(type, defaultHeaders, storageKey);
        setCheckedIds(initialIds);
      }
    }, [defaultHeaders, type, storageKey]);

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
      touchedRef.current = true;
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    useEffect(() => {
      if (isInitialMount.current) {
        return;
      }
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
