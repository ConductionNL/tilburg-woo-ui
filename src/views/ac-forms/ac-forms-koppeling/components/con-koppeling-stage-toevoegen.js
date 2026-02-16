import React, { useRef, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Textbox,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { TOOLTIP_ID } from '@src/index.web';
import { commongroundApiUrl } from '@src/config';
import { ConSchemaEnhancedField } from '@src/components';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * Maps status value to corresponding date property name.
 * @param {string} status - The status value (e.g., 'in gebruik', 'in ontwikkeling', etc.)
 * @returns {string|null} - The property name or null if no mapping exists
 */
const getStartDatumPropertyName = (status) => {
  const statusToPropertyMap = {
    'in gebruik': 'startDatumInProductie',
    'in ontwikkeling': 'startDatumGepland',
    'einde ondersteuning': 'startDatumUitTeFaseren',
    teruggetrokken: 'startDatumUitGefaseerd',
  };
  return statusToPropertyMap[status] || null;
};

/**
 * Gets the label for the start date field based on the selected status.
 * @param {string} status - The status value
 * @returns {string} - The label for the date field
 */
const getStartDatumLabel = (status) => {
  const statusToLabelMap = {
    'in gebruik': 'Startdatum In gebruik',
    'in ontwikkeling': 'Startdatum In ontwikkeling',
    'einde ondersteuning': 'Startdatum Einde ondersteuning',
    teruggetrokken: 'Startdatum Teruggetrokken',
  };
  return statusToLabelMap[status] || 'Startdatum status';
};

/**
 * Gets today's date in YYYY-MM-DD format for date input fields.
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * Koppeling Stage Component (renamed from Toevoegen)
 *
 * This stage handles the core koppeling details:
 * - Applicatie A (pre-filled from ownApp)
 * - Richting (direction)
 * - Applicatie B or BGV
 * - Naam (required)
 * - Status
 * - Startdatum status (dynamic based on selected status)
 */
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
  selectedAppBByRow,
  setSelectedAppBByRow,
  directionOptions,
  directionByRow,
  setDirectionByRow,
  statusOptions,
  statusByRow,
  setStatusByRow,
  startDatumInProductieByRow,
  setStartDatumInProductieByRow,
  startDatumGeplandByRow,
  setStartDatumGeplandByRow,
  startDatumUitTeFaserenByRow,
  setStartDatumUitTeFaserenByRow,
  startDatumUitGefaseerdByRow,
  setStartDatumUitGefaseerdByRow,
  nameByRow,
  setNameByRow,
  isEditMode,
  schemas,
  applicatieKeuzeByRow,
  setApplicatieKeuzeForRow,
  nieuweApplicatieByRow,
  setNieuweApplicatieDataForRow,
  leverancierKeuzeByRow,
  setLeverancierKeuzeForRow,
  nieuweLeveancierByRow,
  setNieuweLeverancierDataForRow,
  leverancierOptions,
  leverancierLoading,
  searchLeveranciers,
  ownAppKeuze = 'bestaand', // Whether own app (Applicatie A) is existing or new
  nieuweOwnApp = {}, // New own app data when ownAppKeuze === 'nieuw'
}) => {
  const [appBOptionsByRow, setAppBOptionsByRow] = useState({});
  const [appBLoadingByRow, setAppBLoadingByRow] = useState({});
  const debounceTimersRef = useRef({});
  const abortControllersRef = useRef({});

  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('koppeling-toevoegen-info-alert-closed');
  });

  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-toevoegen-info-alert-closed', 'true');
  };

  // Get current date value based on status for a specific row
  const getCurrentDateValue = useCallback(
    (rowId, status) => {
      const propertyName = getStartDatumPropertyName(status);
      if (!propertyName) return '';
      switch (propertyName) {
        case 'startDatumInProductie':
          return startDatumInProductieByRow[rowId] || '';
        case 'startDatumGepland':
          return startDatumGeplandByRow[rowId] || '';
        case 'startDatumUitTeFaseren':
          return startDatumUitTeFaserenByRow[rowId] || '';
        case 'startDatumUitGefaseerd':
          return startDatumUitGefaseerdByRow[rowId] || '';
        default:
          return '';
      }
    },
    [
      startDatumInProductieByRow,
      startDatumGeplandByRow,
      startDatumUitTeFaserenByRow,
      startDatumUitGefaseerdByRow,
    ]
  );

  // Set date value based on status for a specific row
  const setCurrentDateValue = useCallback(
    (rowId, status, value) => {
      const propertyName = getStartDatumPropertyName(status);
      if (!propertyName) return;
      switch (propertyName) {
        case 'startDatumInProductie':
          setStartDatumInProductieByRow((prev) => ({ ...prev, [rowId]: value }));
          break;
        case 'startDatumGepland':
          setStartDatumGeplandByRow((prev) => ({ ...prev, [rowId]: value }));
          break;
        case 'startDatumUitTeFaseren':
          setStartDatumUitTeFaserenByRow((prev) => ({ ...prev, [rowId]: value }));
          break;
        case 'startDatumUitGefaseerd':
          setStartDatumUitGefaseerdByRow((prev) => ({ ...prev, [rowId]: value }));
          break;
      }
    },
    [
      setStartDatumInProductieByRow,
      setStartDatumGeplandByRow,
      setStartDatumUitTeFaserenByRow,
      setStartDatumUitGefaseerdByRow,
    ]
  );

  // Handle status change - clears other date fields and sets today's date for new status
  const handleStatusChange = useCallback(
    (rowId, newStatus) => {
      const newStartDatumProperty = getStartDatumPropertyName(newStatus);

      // Get current date value for the new status before clearing
      let currentDateValue = '';
      if (newStartDatumProperty) {
        switch (newStartDatumProperty) {
          case 'startDatumInProductie':
            currentDateValue = startDatumInProductieByRow[rowId] || '';
            break;
          case 'startDatumGepland':
            currentDateValue = startDatumGeplandByRow[rowId] || '';
            break;
          case 'startDatumUitTeFaseren':
            currentDateValue = startDatumUitTeFaserenByRow[rowId] || '';
            break;
          case 'startDatumUitGefaseerd':
            currentDateValue = startDatumUitGefaseerdByRow[rowId] || '';
            break;
        }
      }

      // Set the new status
      setStatusByRow((prev) => ({ ...prev, [rowId]: newStatus }));

      if (!isEditMode) {
        // In create mode: clear all other date fields, only keep the one for current status
        const allProperties = [
          'startDatumInProductie',
          'startDatumGepland',
          'startDatumUitTeFaseren',
          'startDatumUitGefaseerd',
        ];
        allProperties.forEach((property) => {
          if (property !== newStartDatumProperty) {
            switch (property) {
              case 'startDatumInProductie':
                setStartDatumInProductieByRow((prev) => ({ ...prev, [rowId]: '' }));
                break;
              case 'startDatumGepland':
                setStartDatumGeplandByRow((prev) => ({ ...prev, [rowId]: '' }));
                break;
              case 'startDatumUitTeFaseren':
                setStartDatumUitTeFaserenByRow((prev) => ({ ...prev, [rowId]: '' }));
                break;
              case 'startDatumUitGefaseerd':
                setStartDatumUitGefaseerdByRow((prev) => ({ ...prev, [rowId]: '' }));
                break;
            }
          }
        });
      }

      // Set the corresponding date to today if not already set
      if (newStartDatumProperty && !currentDateValue) {
        switch (newStartDatumProperty) {
          case 'startDatumInProductie':
            setStartDatumInProductieByRow((prev) => ({
              ...prev,
              [rowId]: getTodayDateString(),
            }));
            break;
          case 'startDatumGepland':
            setStartDatumGeplandByRow((prev) => ({
              ...prev,
              [rowId]: getTodayDateString(),
            }));
            break;
          case 'startDatumUitTeFaseren':
            setStartDatumUitTeFaserenByRow((prev) => ({
              ...prev,
              [rowId]: getTodayDateString(),
            }));
            break;
          case 'startDatumUitGefaseerd':
            setStartDatumUitGefaseerdByRow((prev) => ({
              ...prev,
              [rowId]: getTodayDateString(),
            }));
            break;
        }
      }
    },
    [
      isEditMode,
      startDatumInProductieByRow,
      startDatumGeplandByRow,
      startDatumUitTeFaserenByRow,
      startDatumUitGefaseerdByRow,
      setStatusByRow,
      setStartDatumInProductieByRow,
      setStartDatumGeplandByRow,
      setStartDatumUitTeFaserenByRow,
      setStartDatumUitGefaseerdByRow,
    ]
  );

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

  // In edit mode, ensure moduleB option is available in the select
  useEffect(() => {
    if (!isEditMode) return;
    
    // Check if row 0 has a selectedAppB but no options yet
    const selectedModuleBId = selectedAppBByRow[0];
    if (!selectedModuleBId) return;
    
    // Check if the option already exists in modulesOptions
    const existingOption = modulesOptions.find(
      (opt) => String(opt.value) === String(selectedModuleBId)
    );
    
    if (existingOption) {
      // Option exists in modulesOptions, make sure it's also in appBOptionsByRow for row 0
      setAppBOptionsByRow((prev) => {
        const rowOptions = prev[0] || [];
        const hasOption = rowOptions.some(
          (opt) => String(opt.value) === String(selectedModuleBId)
        );
        
        if (hasOption) return prev;
        
        return {
          ...prev,
          0: [...rowOptions, existingOption],
        };
      });
    } else {
      // Option doesn't exist yet in modulesOptions, fetch it directly
      const fetchModuleB = async () => {
        try {
          const res = await fetch(
            `/api/apps/openregister/api/objects/voorzieningen/module/${encodeURIComponent(
              String(selectedModuleBId)
            )}`,
            { headers: { Accept: 'application/json' } }
          );
          if (!res.ok) return;
          const item = await res.json();
          const label =
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            item?.['@self']?.name ||
            String(selectedModuleBId);
          const option = {
            value: String(selectedModuleBId),
            label: String(label),
            data: item,
            type: 'applicatie',
          };
          
          // Add to modulesOptions
          setModulesOptions((prev) => {
            const exists = (prev || []).some(
              (o) => String(o.value) === String(selectedModuleBId)
            );
            return exists ? prev : [...(prev || []), option];
          });
          
          // Add to appBOptionsByRow for row 0
          setAppBOptionsByRow((prev) => ({
            ...prev,
            0: [...(prev[0] || []), option],
          }));
          
          // Also update selected module labels
          setSelectedModuleLabels((prev) => ({
            ...prev,
            [String(selectedModuleBId)]: String(label),
          }));
        } catch (error) {
          console.error('Error fetching moduleB:', error);
        }
      };
      
      fetchModuleB();
    }
  }, [isEditMode, selectedAppBByRow, modulesOptions, setModulesOptions, setSelectedModuleLabels]);

  const fetchModuleOptions = async (q, signal) => {
    try {
      const params = new URLSearchParams({
        _limit: '20',
        _page: '1',
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
        '_extend[]': '_schema',
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
      try {
        const prev = abortControllersRef.current[key];
        if (prev && typeof prev.abort === 'function') prev.abort();
      } catch {
        // swallow
      }
      const controller = new AbortController();
      abortControllersRef.current[key] = controller;
      if (which === 'B') setAppBLoadingByRow((p) => ({ ...p, [rowId]: true }));

      let opts;
      if (q) {
        const [moduleResults, buitengemeentelijkeResults] = await Promise.all([
          fetchModuleOptions(q, controller.signal),
          fetchBuitengemeentelijkeOptions(q, controller.signal),
        ]);
        const merged = [];
        if (Array.isArray(moduleResults)) merged.push(...moduleResults);
        if (Array.isArray(buitengemeentelijkeResults))
          merged.push(...buitengemeentelijkeResults);
        opts = merged;
      } else {
        opts = which === 'B' ? getMergedOptions() : modulesOptions;
      }

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
        } catch {
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
      aria-labelledby='koppeling-title'
    >
      <h2 id='koppeling-title' className='sr-only'>
        Koppelingen met andere applicaties
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Geef aan met welke applicaties uw oplossing gegevens kan uitwisselen en
        beschrijf de koppeling. Zo kunnen gemeenten zien hoe uw applicatie past in
        hun applicatielandschap.
      </Paragraph>

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
                leverancier vragen zich aan te melden bij de Softwarecatalogus.
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
        {rows.map((rowId, index) => {
          const appAId = `koppeling-appA-${rowId}`;
          const appBId = `koppeling-appB-${rowId}`;
          const richtingId = `koppeling-richting-${rowId}`;
          const statusId = `koppeling-status-${rowId}`;

          return (
            <div
              key={`row-${rowId}`}
              style={{
                padding: '1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              {/* Row 1: Applicatie A - Richting - Applicatie B */}
              <div
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
                    value={
                      ownAppKeuze === 'nieuw' && nieuweOwnApp?.naam
                        ? { value: '__new_own_app__', label: nieuweOwnApp.naam }
                        : ownApp || null
                    }
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
                  {/* Show existing application select or new application form */}
                  {applicatieKeuzeByRow[rowId] !== 'nieuw' ? (
                    <>
                      <ReactSelect
                        className={clsx(
                          'ac-beheer-select',
                          loading && 'ac-beheer-select--disabled'
                        )}
                        isClearable
                        options={appBOptionsByRow[rowId] || getMergedOptions()}
                        value={(() => {
                          const options =
                            appBOptionsByRow[rowId] || getMergedOptions();
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
                          const aSel =
                            selectedAppAByRow[rowId] || ownApp?.value || '';
                          return String(opt?.value) === String(aSel)
                            ? `${base} (al gekozen bij A)`
                            : base;
                        }}
                        styles={getSelectStyles()}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '1rem',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                        }}
                      >
                        <strong>Nieuwe applicatie aanmaken</strong>
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          small
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => {
                            setApplicatieKeuzeForRow(rowId, 'bestaand');
                            // Clear new application data
                            setSelectedAppBByRow((prev) => ({
                              ...prev,
                              [rowId]: null,
                            }));
                          }}
                        >
                          Bestaande applicatie selecteren
                        </AcButton>
                      </div>

                      {/* Leverancier section */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4
                          className='utrecht-heading-4'
                          style={{ marginBottom: '0.5rem' }}
                        >
                          {leverancierKeuzeByRow[rowId] === 'nieuw'
                            ? 'Leverancier aanmaken'
                            : 'Leverancier selecteren'}
                        </h4>

                        {leverancierKeuzeByRow[rowId] !== 'nieuw' ? (
                          <>
                            <ConSchemaEnhancedField
                              schemaType='module'
                              schemaProperty='aanbieder'
                              value={
                                nieuweApplicatieByRow[rowId]?.leverancier || null
                              }
                              onChange={(value) => {
                                const nextId =
                                  (value &&
                                    value.data &&
                                    (value.data.id || value.data.value)) ||
                                  (value && value.value) ||
                                  value;
                                setNieuweApplicatieDataForRow(
                                  rowId,
                                  'leverancier',
                                  nextId
                                );
                              }}
                              isDisabled={loading}
                              isLoading={leverancierLoading}
                              width='full'
                              schemas={schemas}
                              optionsProvider={leverancierOptions}
                              onSearch={(_path, _refSlug, query) =>
                                searchLeveranciers && searchLeveranciers(query || '')
                              }
                              customProps={{
                                label: 'Leverancier',
                                isClearable: true,
                                placeholder: 'Zoek en selecteer leverancier',
                                required: true,
                              }}
                            />
                            <div style={{ marginTop: '0.5rem' }}>
                              <AcButton
                                style='button'
                                buttonType='secondary'
                                small
                                icon={<VISUALS.BUILDING />}
                                onClick={() =>
                                  setLeverancierKeuzeForRow(rowId, 'nieuw')
                                }
                              >
                                Leverancier niet gevonden? Maak een nieuwe aan
                              </AcButton>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <ConSchemaEnhancedField
                                schemaType='organisatie'
                                schemaProperty='naam'
                                value={nieuweLeveancierByRow[rowId]?.naam || ''}
                                onChange={(value) =>
                                  setNieuweLeverancierDataForRow(
                                    rowId,
                                    'naam',
                                    value
                                  )
                                }
                                isDisabled={loading}
                                width='full'
                                schemas={schemas}
                                customProps={{
                                  required: true,
                                  placeholder: 'Naam van de leverancier',
                                }}
                              />
                              <ConSchemaEnhancedField
                                schemaType='organisatie'
                                schemaProperty='website'
                                value={nieuweLeveancierByRow[rowId]?.website || ''}
                                onChange={(value) =>
                                  setNieuweLeverancierDataForRow(
                                    rowId,
                                    'website',
                                    value
                                  )
                                }
                                isDisabled={loading}
                                width='full'
                                schemas={schemas}
                                customProps={{
                                  inputType: 'text',
                                  required: true,
                                  placeholder: 'Website van de leverancier',
                                  validation: {
                                    custom: (value) => {
                                      if (!value || value.trim() === '') return true;
                                      return validateWebsite(value.trim());
                                    },
                                    customErrorMessage:
                                      'Website heeft een ongeldig formaat (bijv. conduction.nl)',
                                  },
                                }}
                              />
                            </div>
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              small
                              icon={<VISUALS.ARROW_LEFT />}
                              onClick={() =>
                                setLeverancierKeuzeForRow(rowId, 'bestaand')
                              }
                            >
                              Bestaande leverancier selecteren
                            </AcButton>
                          </>
                        )}
                      </div>

                      {/* Applicatie fields */}
                      <div>
                        <h4
                          className='utrecht-heading-4'
                          style={{ marginBottom: '0.5rem' }}
                        >
                          Applicatie
                        </h4>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '1rem',
                          }}
                        >
                          <ConSchemaEnhancedField
                            schemaType='module'
                            schemaProperty='naam'
                            value={nieuweApplicatieByRow[rowId]?.naam || ''}
                            onChange={(value) =>
                              setNieuweApplicatieDataForRow(rowId, 'naam', value)
                            }
                            isDisabled={loading}
                            width='full'
                            schemas={schemas}
                            customProps={{
                              required: true,
                              placeholder: 'Naam van de applicatie',
                            }}
                          />
                          <ConSchemaEnhancedField
                            schemaType='module'
                            schemaProperty='website'
                            value={nieuweApplicatieByRow[rowId]?.website || ''}
                            onChange={(value) =>
                              setNieuweApplicatieDataForRow(rowId, 'website', value)
                            }
                            isDisabled={loading}
                            width='full'
                            schemas={schemas}
                            customProps={{
                              inputType: 'text',
                              required: true,
                              placeholder: 'Website van de applicatie',
                              validation: {
                                custom: (value) => {
                                  if (!value || String(value).trim() === '')
                                    return true;
                                  return validateWebsite(String(value).trim());
                                },
                                customErrorMessage:
                                  'Website heeft een ongeldig formaat (bijv. conduction.nl)',
                              },
                            }}
                          />
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                          <ConSchemaEnhancedField
                            schemaType='module'
                            schemaProperty='beschrijvingKort'
                            value={
                              nieuweApplicatieByRow[rowId]?.beschrijvingKort || ''
                            }
                            onChange={(value) =>
                              setNieuweApplicatieDataForRow(
                                rowId,
                                'beschrijvingKort',
                                value
                              )
                            }
                            isDisabled={loading}
                            width='full'
                            schemas={schemas}
                            customProps={{
                              description:
                                'Een korte beschrijving van de applicatie',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Naam - Status - Startdatum status */}
              <div
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
                    htmlFor={`koppeling-naam-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    Naam
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
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
                    required
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
                    onChange={(opt) => handleStatusChange(rowId, opt?.value)}
                    placeholder='Status'
                    inputId={statusId}
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={`koppeling-startdatum-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    {statusByRow[rowId]
                      ? getStartDatumLabel(statusByRow[rowId])
                      : 'Startdatum status'}
                  </label>
                  <Textbox
                    id={`koppeling-startdatum-${rowId}`}
                    type='date'
                    value={
                      statusByRow[rowId]
                        ? getCurrentDateValue(rowId, statusByRow[rowId])
                        : ''
                    }
                    onChange={(e) => {
                      if (statusByRow[rowId]) {
                        setCurrentDateValue(
                          rowId,
                          statusByRow[rowId],
                          e?.target?.value || ''
                        );
                      }
                    }}
                    disabled={loading || !statusByRow[rowId]}
                    style={{ height: '40px' }}
                    placeholder={
                      !statusByRow[rowId] ? 'Selecteer eerst een status' : ''
                    }
                  />
                </div>
              </div>

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
                    sr={`Rij ${index+1} verwijderen`}
                  />
                </div>
              )}
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
