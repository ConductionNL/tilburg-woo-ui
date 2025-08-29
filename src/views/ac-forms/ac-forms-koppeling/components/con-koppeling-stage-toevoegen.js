import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Textbox,
  Textarea,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

const ConKoppelingStageToevoegen = ({
  rows,
  addRow,
  removeRow,
  modulesOptions,
  setModulesOptions,
  setSelectedModuleLabels,
  loading,
  selectedAppAByRow,
  setSelectedAppAByRow,
  ownApp,
  typeOptions,
  typeByRow,
  setTypeByRow,
  selectedAppBByRow,
  setSelectedAppBByRow,
  beschrijvingByRow,
  setBeschrijvingByRow,
  directionOptions,
  directionByRow,
  setDirectionByRow,
  statusOptions,
  statusByRow,
  setStatusByRow,
  nameByRow,
  setNameByRow,
}) => {
  const [appAOptionsByRow, setAppAOptionsByRow] = useState({});
  const [appBOptionsByRow, setAppBOptionsByRow] = useState({});
  const [appALoadingByRow, setAppALoadingByRow] = useState({});
  const [appBLoadingByRow, setAppBLoadingByRow] = useState({});
  const debounceTimersRef = useRef({});
  const abortControllersRef = useRef({});

  const upsertModuleOption = (opt) => {
    if (!opt) return;
    setModulesOptions((prev) => {
      const exists = prev.some((o) => String(o.value) === String(opt.value));
      return exists ? prev : [...prev, opt];
    });
    setSelectedModuleLabels((prev) => ({
      ...prev,
      [String(opt.value)]: String(opt.label),
    }));
  };

  const fetchModuleOptions = async (q, signal) => {
    try {
      const params = new URLSearchParams({ _limit: '20', _page: '1' });
      if (q) params.set('_search', q);
      const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${params}`;
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      const mapped = list.map((item, index) => {
        const id =
          item?.id ||
          item?.['@self']?.id ||
          item?.uuid ||
          item?.value ||
          item?.slug ||
          index;
        const label =
          item?.naam ||
          item?.name ||
          item?.title ||
          item?.label ||
          item?.uuid ||
          item?.id ||
          item?.value ||
          item?.slug ||
          `Applicatie ${index + 1}`;
        return { value: String(id), label: String(label), data: item };
      });
      // also upsert into shared pools for persistence
      mapped.forEach((o) => upsertModuleOption(o));
      return mapped;
    } catch (e) {
      if (e?.name === 'AbortError') return null;
      return [];
    }
  };

  const debounceFetchForRow = (rowId, which, q) => {
    const key = `${which}-${rowId}`;
    if (debounceTimersRef.current[key]) clearTimeout(debounceTimersRef.current[key]);
    debounceTimersRef.current[key] = setTimeout(async () => {
      // Abort any previous in-flight fetch for this key
      try {
        const prev = abortControllersRef.current[key];
        if (prev && typeof prev.abort === 'function') prev.abort();
      } catch (e) {
        // swallow
      }
      const controller = new AbortController();
      abortControllersRef.current[key] = controller;
      if (which === 'A') setAppALoadingByRow((p) => ({ ...p, [rowId]: true }));
      if (which === 'B') setAppBLoadingByRow((p) => ({ ...p, [rowId]: true }));
      const opts = q
        ? await fetchModuleOptions(q, controller.signal)
        : modulesOptions;
      // If another fetch started after this one, skip applying results
      if (abortControllersRef.current[key] !== controller) return;
      if (which === 'A') {
        if (Array.isArray(opts))
          setAppAOptionsByRow((p) => ({ ...p, [rowId]: opts }));
        setAppALoadingByRow((p) => ({ ...p, [rowId]: false }));
      } else {
        if (Array.isArray(opts))
          setAppBOptionsByRow((p) => ({ ...p, [rowId]: opts }));
        setAppBLoadingByRow((p) => ({ ...p, [rowId]: false }));
      }
    }, 400);
  };

  React.useEffect(() => {
    return () => {
      const ctrls = abortControllersRef.current || {};
      Object.values(ctrls).forEach((c) => {
        try {
          if (c && typeof c.abort === 'function') c.abort();
        } catch (e) {
          // swallow
        }
      });
    };
  }, []);

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-toevoegen-title'
    >
      <h2 id='koppeling-toevoegen-title' className='sr-only'>
        Toevoegen
      </h2>

      <div className='con-form-wizard-rows'>
        {rows.map((rowId) => {
          const beschrijving = beschrijvingByRow[rowId] || '';
          const maxLen = 255;
          const charsLeft = Math.max(0, maxLen - beschrijving.length);

          const appAId = `koppeling-appA-${rowId}`;
          const appBId = `koppeling-appB-${rowId}`;
          const soortId = `koppeling-soort-${rowId}`;
          const richtingId = `koppeling-richting-${rowId}`;
          const statusId = `koppeling-status-${rowId}`;

          return (
            <div
              key={`row-${rowId}`}
              className='ac-register-form-section'
              style={{
                padding: '1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              {/* Row 1: Applicatie A - Applicatie B */}
              <div
                className='ac-register-form-grid'
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={appAId}
                    style={{ display: 'block' }}
                  >
                    Applicatie A
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <ReactSelect
                    isClearable
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    options={appAOptionsByRow[rowId] || modulesOptions}
                    value={(() => {
                      const options = appAOptionsByRow[rowId] || modulesOptions;
                      const selectedValue =
                        selectedAppAByRow[rowId] != null
                          ? String(selectedAppAByRow[rowId])
                          : ownApp?.value != null
                          ? String(ownApp.value)
                          : null;
                      const found = selectedValue
                        ? options.find((o) => String(o.value) === selectedValue)
                        : null;
                      if (found) return found;
                      if (selectedAppAByRow[rowId] == null && ownApp)
                        return { value: String(ownApp.value), label: ownApp.label };
                      return null;
                    })()}
                    onChange={(opt) => {
                      setSelectedAppAByRow((prev) => ({
                        ...prev,
                        [rowId]: opt?.value,
                      }));
                      if (opt) upsertModuleOption(opt);
                    }}
                    placeholder='Selecteer applicatie A'
                    inputId={appAId}
                    aria-required='true'
                    isOptionDisabled={(opt) =>
                      String(opt?.value) === String(selectedAppBByRow[rowId] || '')
                    }
                    onInputChange={(input, { action }) => {
                      if (action === 'input-change')
                        debounceFetchForRow(rowId, 'A', input || '');
                      return input;
                    }}
                    isLoading={!!appALoadingByRow[rowId]}
                    loadingMessage={() => 'Bezig met laden…'}
                    getOptionLabel={(opt) => {
                      const base = opt?.label ?? '';
                      return String(opt?.value) ===
                        String(selectedAppBByRow[rowId] || '')
                        ? `${base} (al gekozen bij B)`
                        : base;
                    }}
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={appBId}
                    style={{ display: 'block' }}
                  >
                    Applicatie B
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    isClearable
                    options={appBOptionsByRow[rowId] || modulesOptions}
                    value={(() => {
                      const options = appBOptionsByRow[rowId] || modulesOptions;
                      const selectedValue =
                        selectedAppBByRow[rowId] != null
                          ? String(selectedAppBByRow[rowId])
                          : null;
                      const found = selectedValue
                        ? options.find((o) => String(o.value) === selectedValue)
                        : null;
                      return found || null;
                    })()}
                    onChange={(opt) => {
                      setSelectedAppBByRow((prev) => ({
                        ...prev,
                        [rowId]: opt?.value,
                      }));
                      if (opt) upsertModuleOption(opt);
                    }}
                    placeholder='Selecteer applicatie B'
                    inputId={appBId}
                    aria-required='true'
                    isOptionDisabled={(opt) =>
                      String(opt?.value) ===
                      String(selectedAppAByRow[rowId] || ownApp?.value || '')
                    }
                    onInputChange={(input, { action }) => {
                      if (action === 'input-change')
                        debounceFetchForRow(rowId, 'B', input || '');
                      return input;
                    }}
                    isLoading={!!appBLoadingByRow[rowId]}
                    loadingMessage={() => 'Bezig met laden…'}
                    getOptionLabel={(opt) => {
                      const base = opt?.label ?? '';
                      const aSel = selectedAppAByRow[rowId] || ownApp?.value || '';
                      return String(opt?.value) === String(aSel)
                        ? `${base} (al gekozen bij A)`
                        : base;
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Richting - Soort */}
              <div
                className='ac-register-form-grid'
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={richtingId}
                    style={{ display: 'block' }}
                  >
                    Richting
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    options={directionOptions}
                    value={
                      directionByRow[rowId]
                        ? directionOptions.find(
                            (o) => o.value === directionByRow[rowId]
                          )
                        : null
                    }
                    onChange={(opt) =>
                      setDirectionByRow((prev) => ({ ...prev, [rowId]: opt?.value }))
                    }
                    placeholder='Richting'
                    inputId={richtingId}
                    aria-required='true'
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={soortId}
                    style={{ display: 'block' }}
                  >
                    Soort
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    options={typeOptions}
                    isClearable
                    value={
                      typeByRow[rowId]
                        ? typeOptions.find((o) => o.value === typeByRow[rowId])
                        : null
                    }
                    onChange={(opt) =>
                      setTypeByRow((prev) => ({ ...prev, [rowId]: opt?.value }))
                    }
                    placeholder='Soort'
                    inputId={soortId}
                  />
                </div>
              </div>

              <Separator
                className='ac-register-review-header__separator'
                style={{ marginBlock: '24px' }}
              />

              {/* Row 3: Naam - Status */}
              <div
                className='ac-register-form-grid'
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={`koppeling-naam-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    Naam
                  </label>
                  <Textbox
                    id={`koppeling-naam-${rowId}`}
                    value={nameByRow[rowId] || ''}
                    onChange={(e) =>
                      setNameByRow((prev) => ({
                        ...prev,
                        [rowId]: e?.target?.value || '',
                      }))
                    }
                    placeholder='Naam van de koppeling'
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={statusId}
                    style={{ display: 'block' }}
                  >
                    Status
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    options={statusOptions}
                    isClearable
                    value={
                      statusByRow[rowId]
                        ? statusOptions.find((o) => o.value === statusByRow[rowId])
                        : null
                    }
                    onChange={(opt) =>
                      setStatusByRow((prev) => ({ ...prev, [rowId]: opt?.value }))
                    }
                    placeholder='Status'
                    inputId={statusId}
                  />
                </div>
              </div>

              {/* Korte beschrijving (full width) */}
              <div style={{ marginTop: '1rem' }}>
                <label
                  className='utrecht-form-label'
                  htmlFor={`koppeling-beschrijving-${rowId}`}
                  style={{ display: 'block' }}
                >
                  Korte beschrijving
                </label>
                <Textarea
                  id={`koppeling-beschrijving-${rowId}`}
                  value={beschrijving}
                  maxLength={maxLen}
                  onChange={(e) =>
                    setBeschrijvingByRow((prev) => ({
                      ...prev,
                      [rowId]: e?.target?.value || '',
                    }))
                  }
                  placeholder='Korte beschrijving van de koppeling (max 255 tekens)'
                />
                <Paragraph
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.875rem',
                    color: '#666',
                  }}
                >
                  {charsLeft} tekens resterend
                </Paragraph>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '0.75rem',
                }}
              >
                <AcButton
                  style='button'
                  buttonType='secondary'
                  onClick={() => removeRow(rowId)}
                  disabled={rows.length === 1}
                  icon={<VISUALS.TRASHCAN />}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AcButton style='button' onClick={addRow} icon={<VISUALS.PLUS />}>
          Nieuwe koppeling toevoegen
        </AcButton>
      </div>
    </div>
  );
};

export default ConKoppelingStageToevoegen;
