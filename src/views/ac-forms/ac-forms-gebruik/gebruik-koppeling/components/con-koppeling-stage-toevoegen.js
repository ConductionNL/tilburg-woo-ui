import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Textbox,
  Textarea,
  Separator,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { TOOLTIP_ID } from '@src/index.web';
import { commongroundApiUrl } from '@src/config';

const ConKoppelingStageToevoegen = ({
  rows,
  addRow,
  removeRow,
  modulesOptions,
  setModulesOptions,
  buitengemeentelijkeOptions,
  setSelectedModuleLabels,
  loading,
  selectedAppAByRow,
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
  isEditMode,
  standaardenOptions,
  standaardenOptionsLoading,
  standaardenByRow,
  setStandaardenByRow,
}) => {
  const [appBOptionsByRow, setAppBOptionsByRow] = useState({});
  const [appBLoadingByRow, setAppBLoadingByRow] = useState({});
  const debounceTimersRef = useRef({});
  const abortControllersRef = useRef({});

  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    // Check if alert was previously closed in this session
    return !sessionStorage.getItem('koppeling-toevoegen-info-alert-closed');
  });

  // Handle closing the alert and remember the choice
  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-toevoegen-info-alert-closed', 'true');
  };

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

  const getMergedOptions = () => {
    const merged = [...modulesOptions];
    buitengemeentelijkeOptions.forEach((buitenOpt) => {
      const exists = merged.some((o) => String(o.value) === String(buitenOpt.value));
      if (!exists) {
        merged.push(buitenOpt);
      }
    });
    return merged;
  };

  const fetchModuleOptions = async (q, signal) => {
    try {
      const params = new URLSearchParams({
        _limit: '20',
        _page: '1',
        _published: 'false',
      });
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
        return {
          value: String(id),
          label: String(label),
          data: item,
          type: 'applicatie',
        };
      });
      // also upsert into shared pools for persistence
      mapped.forEach((o) => upsertModuleOption(o));
      return mapped;
    } catch (e) {
      if (e?.name === 'AbortError') return null;
      return [];
    }
  };

  const fetchBuitengemeentelijkeOptions = async (q, signal) => {
    try {
      const queryParams = new URLSearchParams({
        _limit: '50',
        _page: '1',
        gemmaType: 'Buitengemeentelijke voorziening',
        '_extend[]': '@self.schema',
        _published: 'false',
      });
      if (q) queryParams.set('_search', q);
      const endpoint = `${commongroundApiUrl()}/openregister/api/objects/vng-gemma/element?${queryParams}`;
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data?.results) ? data.results : [];
      return list.map((item, index) => {
        const label =
          item?.xml?.name?._value ||
          item?.naam ||
          item?.name ||
          item?.title ||
          item?.label ||
          `Facility ${index + 1}`;
        const value = item?.value || item?.id || item?.slug || label;
        return {
          value: String(value),
          label: String(label),
          data: item,
          type: 'buitengemeentelijke',
        };
      });
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
      if (which === 'B') setAppBLoadingByRow((p) => ({ ...p, [rowId]: true }));

      let opts;
      if (q) {
        // When searching, fetch both modules and external facilities in parallel
        const [moduleResults, buitengemeentelijkeResults] = await Promise.all([
          fetchModuleOptions(q, controller.signal),
          fetchBuitengemeentelijkeOptions(q, controller.signal),
        ]);
        // Merge results from both searches
        const merged = [];
        if (Array.isArray(moduleResults)) merged.push(...moduleResults);
        if (Array.isArray(buitengemeentelijkeResults))
          merged.push(...buitengemeentelijkeResults);
        opts = merged;
      } else {
        // When no query, use merged options from already loaded data
        opts = which === 'B' ? getMergedOptions() : modulesOptions;
      }

      // If another fetch started after this one, skip applying results
      if (abortControllersRef.current[key] !== controller) return;
      if (which === 'B') {
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

  // Helper function to create colored dot style
  const dot = (color = 'transparent') => ({
    alignItems: 'center',
    display: 'flex',
    ':before': {
      backgroundColor: color,
      borderRadius: 10,
      content: '" "',
      display: 'block',
      marginRight: 8,
      height: 10,
      width: 10,
      flex: 'none',
    },
  });

  // Custom styles for ReactSelect with colored dots
  const getSelectStyles = () => ({
    option: (styles, { data }) => {
      const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
      return {
        ...styles,
        ...dot(color),
      };
    },
    singleValue: (styles, { data }) => {
      const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
      return {
        ...styles,
        ...dot(color),
      };
    },
    multiValue: (styles, { data }) => {
      const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
      return {
        ...styles,
        ...dot(color),
      };
    },
    placeholder: (styles) => ({
      ...styles,
      ...dot('#ccc'),
    }),
  });

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-toevoegen-title'
    >
      <h2 id='koppeling-toevoegen-title' className='sr-only'>
        Toevoegen
      </h2>

      <Paragraph>
        Geef aan met welke applicaties uw oplossing gegevens kan uitwisselen en
        beschrijf de koppeling. Zo kunnen gemeenten zien hoe uw applicatie past in
        hun applicatielandschap.
      </Paragraph>

      {/* Closeable info alert about updating koppeling details later */}
      {showInfoAlert && (
        <Alert severity='info' className='ac-forms-product-info-alert'>
          <button
            onClick={handleCloseAlert}
            className='ac-forms-product-info-alert__close-button'
            title='Sluiten'
            aria-label='Alert sluiten'
          >
            <VISUALS.CLOSE />
          </button>
          <div className='ac-forms-product-info-alert__content'>
            <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
            <div>
              <strong>Koppeling informatie aanpassen</strong>
              <br />
              <span className='ac-forms-product-info-alert__text'>
                Vul per koppeling in met welke applicaties u koppelt en welke
                applicatie de gegevens verzendt en welke deze ontvangt.
                <br />
                Vervolgens kunt u aanvullende informatie invullen, zoals het
                transportprotocol (bijvoorbeeld API, bestand of bericht).
                <br />
                Bestaat de applicatie waarmee u wilt koppelen nog niet, dan kunt u de
                leverancier vragen zich aan te melden bij de softwarecatalogus.
              </span>
            </div>
          </div>
        </Alert>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          <span style={{ fontSize: '0.875rem' }}>Applicatie</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }}
          />
          <span style={{ fontSize: '0.875rem' }}>
            Buiten Gemeentelijke Voorziening
          </span>
        </div>
      </div>

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
              {/* Row 1: Applicatie A - Richting - Applicatie B */}
              <div
                className='ac-register-form-grid'
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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
                    isDisabled
                    className={clsx(
                      'ac-beheer-select',
                      'ac-beheer-select--disabled'
                    )}
                    value={ownApp || null}
                    placeholder='Selecteer applicatie A'
                    inputId={appAId}
                    aria-required='true'
                  />
                </div>
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
                    htmlFor={appBId}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    Applicatie B of BGV
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                    <VISUALS.INFO
                      style={{ marginLeft: '0.5em' }}
                      data-tooltip-id={TOOLTIP_ID}
                      data-tooltip-content='Applicatie B kan ook een buiten gemeentelijke voorziening zijn.'
                    />
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    isClearable
                    options={appBOptionsByRow[rowId] || getMergedOptions()}
                    value={(() => {
                      const options = appBOptionsByRow[rowId] || getMergedOptions();
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
                    styles={getSelectStyles()}
                  />
                </div>
              </div>

              {/* Row 2: Soort - Naam - Status */}
              <div
                className='ac-register-form-grid'
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
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

              <Separator
                className='ac-register-review-header__separator'
                style={{ marginBlock: '24px' }}
              />

              <div className='con-koppeling-standaarden-field'>
                <label
                  className='utrecht-form-label'
                  htmlFor={statusId}
                  style={{ display: 'block' }}
                >
                  Standaarden
                </label>
                <ReactSelect
                  className={clsx(
                    'ac-beheer-select',
                    'con-koppeling-standaarden-select',
                    loading && 'ac-beheer-select--disabled'
                  )}
                  isClearable
                  value={
                    standaardenByRow[rowId]
                      ? standaardenOptions.filter((o) =>
                          standaardenByRow[rowId].includes(o.value)
                        )
                      : null
                  }
                  onChange={(opt) => {
                    const standaarden = opt ? opt.map((o) => o.value) : [];
                    setStandaardenByRow((prev) => {
                      const updated = { ...prev };
                      updated[rowId] = standaarden;
                      return updated;
                    });
                  }}
                  options={standaardenOptions}
                  placeholder={
                    standaardenOptionsLoading ? 'Laden...' : 'Selecteer standaarden'
                  }
                  isMulti={true}
                  isSearchable={true}
                  isLoading={standaardenOptionsLoading}
                  closeMenuOnSelect={false}
                  isDisabled={loading}
                />
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
                  className='con-koppeling-beschrijving'
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

                {!isEditMode && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isEditMode && (
        <div style={{ marginTop: '1rem' }}>
          <AcButton
            style='button'
            disabled={isEditMode}
            onClick={addRow}
            icon={<VISUALS.PLUS />}
          >
            Nieuwe koppeling toevoegen
          </AcButton>
        </div>
      )}
    </div>
  );
};

export default ConKoppelingStageToevoegen;
