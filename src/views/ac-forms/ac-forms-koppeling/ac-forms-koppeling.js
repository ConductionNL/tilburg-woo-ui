import { useState, useEffect, memo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import {
  Heading1,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { useDebounce } from '@src/hooks/use-debounce.hook';
import ConKoppelingStepSoort from './components/con-koppeling-step-soort';
import ConKoppelingStageZoeken from './components/con-koppeling-stage-zoeken';
import ConKoppelingStageToevoegen from './components/con-koppeling-stage-toevoegen';
import ConKoppelingStageControleren from './components/con-koppeling-stage-controleren';

const AcFormsKoppeling = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [koppelingsType, setKoppelingsType] = useState(null); // 'eigen-organisatie' or 'aanbieden-koppeling'

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '[class*="process-step"], [role="button"], [role="tab"], .step'
      );

      stepElements.forEach((stepEl, index) => {
        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        if (index < currentStep) {
          stepEl.classList.add('ac-step-clickable');
          stepEl.onclick = (e) => {
            e.preventDefault();
            setCurrentStep(index);
          };
        }
      });
    };

    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  // (Removed) Schema management state

  // Options for modules (applications)
  const [modulesOptions, setModulesOptions] = useState([]);
  // Options/loading specifically for the own-app searchable select
  const [ownAppOptions, setOwnAppOptions] = useState([]);
  const [ownAppLoading, setOwnAppLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // "Your" application (optional anchor for adding/searching)
  const [ownApp, setOwnApp] = useState(null);
  // Capture input typed into the select's search field (debounced)
  const [ownAppInput, setOwnAppInput] = useState('');
  const debouncedOwnAppInput = useDebounce(ownAppInput, 500);

  // Toevoegen state (rows-based like product KoppelingenForm), but using modules for A and B
  const [rows, setRows] = useState([0]);
  const [nextRowId, setNextRowId] = useState(1);
  const [selectedAppAByRow, setSelectedAppAByRow] = useState({});
  const [selectedAppBByRow, setSelectedAppBByRow] = useState({});
  const [directionByRow, setDirectionByRow] = useState({});
  const [typeByRow, setTypeByRow] = useState({});
  const [beschrijvingByRow, setBeschrijvingByRow] = useState({});
  const [statusByRow, setStatusByRow] = useState({});
  const [nameByRow, setNameByRow] = useState({});

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // 'success' | 'error' | null
  const [saveErrors, setSaveErrors] = useState([]); // array of error messages
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const directionOptions = [
    { value: 'AnaarB', label: 'A → B' },
    { value: 'BnaarA', label: 'B → A' },
    { value: 'bi-directioneel', label: '↔ Bi-directioneel' },
  ];

  const typeOptions = [
    { value: 'n.v.t', label: 'N.v.t' },
    { value: 'bestandsoverdracht', label: 'Bestandsoverdracht' },
    { value: 'digikoppeling', label: 'Digikoppeling' },
    { value: 'message que', label: 'Message queue' },
    { value: 'upload naar portaal', label: 'Upload naar portaal' },
    { value: 'webservices', label: 'Webservices' },
    { value: 'api', label: 'API' },
  ];

  const statusOptions = [
    { value: 'in ontwikkeling', label: 'In ontwikkeling' },
    { value: 'in gebruik', label: 'In gebruik' },
    { value: 'einde ondersteuning', label: 'Einde ondersteuning' },
    { value: 'teruggetrokken', label: 'Teruggetrokken' },
  ];

  const getArrowForDirection = (dir) => {
    if (dir === 'AnaarB') return '→';
    if (dir === 'BnaarA') return '←';
    if (dir === 'bi-directioneel') return '↔';
    return '↔';
  };

  // (Removed) Fetch schemas effect

  // Fetch modules (applications) options on mount
  useEffect(() => {
    let isMounted = true;
    const fetchModules = async () => {
      try {
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${params}`;
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : [];
        const options = list.map((item, index) => {
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
        if (isMounted) {
          setModulesOptions(options);
          setOwnAppOptions(options);
        }
      } catch (e) {
        if (isMounted) {
          setModulesOptions([]);
          setOwnAppOptions([]);
        }
      }
    };

    fetchModules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced server-side search on modules for the own-app select only
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const q = (debouncedOwnAppInput || '').trim();
      if (!q) {
        // Reset to base options when input is cleared
        setOwnAppOptions(modulesOptions);
        return;
      }
      setOwnAppLoading(true);
      try {
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
        params.set('_search', q);
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${params}`;
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : [];
        const options = list.map((item, index) => {
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
        if (!cancelled) setOwnAppOptions(options);
      } catch {
        if (!cancelled) setOwnAppOptions([]);
      } finally {
        if (!cancelled) setOwnAppLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedOwnAppInput, modulesOptions]);

  // Search koppelingen by app name (client + server tolerant)
  const handleSearch = async (qOverride) => {
    const raw = (qOverride ?? searchQuery) || '';
    const trimmed = raw.trim();

    // When empty, clear results and skip network calls
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = [];

      // Attempt server search on koppelingen endpoint
      const params = new URLSearchParams({
        _limit: '20',
        _page: '1',
        _extend: '@self.schema',
      });
      params.set('_search', trimmed);
      const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${params}`;

      let list = [];
      try {
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          list = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
            ? data.results
            : [];
        }
      } catch {
        // ignore and keep list empty
      }

      // Client-side filter further by app name if needed
      const q = trimmed.toLowerCase();
      const filtered = list.filter((k) => {
        const a =
          k?.applicatie1 ||
          k?.applicatieA ||
          k?.appA ||
          k?.bronApplicatie ||
          k?.source ||
          '';
        const b =
          k?.applicatie2 ||
          k?.applicatieB ||
          k?.appB ||
          k?.doelApplicatie ||
          k?.target ||
          '';
        return (
          String(a).toLowerCase().includes(q) || String(b).toLowerCase().includes(q)
        );
      });

      results.push(...filtered);
      setSearchResults(results);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const getStatusMulti = (active, first, last) => {
    if (active >= first && active <= last) return 'current';
    if (active < first) return 'not-checked';
    return 'checked';
  };

  const canGoNext = () => {
    if (currentStep === 0) return koppelingsType !== null; // type must be selected
    if (currentStep === 1) return true; // search is optional to proceed
    if (currentStep === 2) return rows.length > 0; // at least one row exists
    return true;
  };

  // (Removed) Previously triggered koppeling search from the own-app select input

  const addRow = () => {
    setRows((prev) => [...prev, nextRowId]);
    setNextRowId((n) => n + 1);
  };

  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((id) => id !== rowId));
    setSelectedAppAByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
    setSelectedAppBByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
    setDirectionByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
    setTypeByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
    setBeschrijvingByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
    setStatusByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
    setNameByRow((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => Number(k) !== rowId))
    );
  };

  const serializeRowsToPayload = () => {
    return rows
      .map((rowId) => {
        const naam = (nameByRow[rowId] || '').trim();
        const appAId = selectedAppAByRow[rowId] || ownApp?.value;
        const appBId = selectedAppBByRow[rowId];
        if (!appAId || !appBId) return null;
        const richting = directionByRow[rowId] || '';
        const soort = typeByRow[rowId] || '';
        const beschrijving = beschrijvingByRow[rowId] || '';
        const status = statusByRow[rowId] || '';
        return {
          naam,
          moduleA: appAId,
          moduleB: appBId,
          gegevensuitwisselingRichting: richting,
          type: soort,
          beschrijvingKort: beschrijving,
          status,
        };
      })
      .filter(Boolean);
  };

  const handleSave = async () => {
    const payloads = serializeRowsToPayload();
    if (!payloads.length) return;

    setSaveLoading(true);
    setSaveResult(null);
    setSaveErrors([]);

    try {
      const endpoint = '/api/apps/openregister/api/objects/voorzieningen/koppeling';
      const requests = payloads.map((body) =>
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        })
      );

      const responses = await Promise.all(requests);
      const failures = [];
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        if (!res.ok) {
          try {
            const data = await res.json();
            failures.push(
              data?.message || `Request ${i + 1} failed (${res.status})`
            );
          } catch {
            failures.push(`Request ${i + 1} failed (${res.status})`);
          }
        }
      }

      if (failures.length) {
        setSaveResult('error');
        setSaveErrors(failures);
      } else {
        setSaveResult('success');
      }
    } catch (e) {
      setSaveResult('error');
      setSaveErrors([e?.message || 'Onbekende fout bij opslaan']);
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    if (saveResult === 'success') {
      setRedirectCountdown(3);
      const intervalId = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            window.location.assign('/beheer/koppeling');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [saveResult]);

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ConKoppelingStepSoort
            koppelingsType={koppelingsType}
            setKoppelingsType={setKoppelingsType}
          />
        );
      case 1:
        return (
          <ConKoppelingStageZoeken
            loading={loading}
            ownAppOptions={ownAppOptions}
            ownApp={ownApp}
            setOwnApp={setOwnApp}
            ownAppLoading={ownAppLoading}
            setOwnAppInput={setOwnAppInput}
            handleSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
          />
        );

      case 2:
        return (
          <ConKoppelingStageToevoegen
            rows={rows}
            addRow={addRow}
            removeRow={removeRow}
            modulesOptions={modulesOptions}
            loading={loading}
            selectedAppAByRow={selectedAppAByRow}
            setSelectedAppAByRow={setSelectedAppAByRow}
            ownApp={ownApp}
            typeOptions={typeOptions}
            typeByRow={typeByRow}
            setTypeByRow={setTypeByRow}
            selectedAppBByRow={selectedAppBByRow}
            setSelectedAppBByRow={setSelectedAppBByRow}
            beschrijvingByRow={beschrijvingByRow}
            setBeschrijvingByRow={setBeschrijvingByRow}
            directionOptions={directionOptions}
            directionByRow={directionByRow}
            setDirectionByRow={setDirectionByRow}
            statusOptions={statusOptions}
            statusByRow={statusByRow}
            setStatusByRow={setStatusByRow}
            nameByRow={nameByRow}
            setNameByRow={setNameByRow}
          />
        );

      case 3:
        return (
          <ConKoppelingStageControleren
            rows={rows}
            modulesOptions={modulesOptions}
            selectedAppAByRow={selectedAppAByRow}
            selectedAppBByRow={selectedAppBByRow}
            ownApp={ownApp}
            directionByRow={directionByRow}
            typeByRow={typeByRow}
            typeOptions={typeOptions}
            beschrijvingByRow={beschrijvingByRow}
            statusByRow={statusByRow}
            statusOptions={statusOptions}
            nameByRow={nameByRow}
            getArrowForDirection={getArrowForDirection}
            saveResult={saveResult}
            saveErrors={saveErrors}
            redirectCountdown={redirectCountdown}
          />
        );

      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      case 0:
        return 'Soort koppeling';
      case 1:
        return 'Koppeling zoeken';
      case 2:
        return 'Toevoegen';
      case 3:
        return 'Controleren';
      default:
        return '';
    }
  };

  const canSave = () => {
    if (!rows.length) return false;
    // Require at least app A and app B for all rows
    for (const rowId of rows) {
      const appAId = selectedAppAByRow[rowId] || ownApp?.value;
      const appBId = selectedAppBByRow[rowId];
      if (!appAId || !appBId) return false;
    }
    return true;
  };

  // Determine page title based on koppelings type
  const getPageTitle = () => {
    if (koppelingsType === 'eigen-organisatie') {
      return 'Koppeling registreren voor eigen organisatie';
    }
    if (koppelingsType === 'aanbieden-koppeling') {
      return 'Koppeling aanbieden';
    }
    return 'Koppeling registreren';
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <Heading1>{getPageTitle()}</Heading1>
            <Paragraph>
              Zoek naar bestaande koppelingen, voeg nieuwe koppelingen toe en
              controleer uw invoer.
            </Paragraph>
          </div>

          <div>
            <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
              {currentStepName(currentStep)}
            </h3>

            <div className='ac-register-container ac-forms-product'>
              <div ref={processStepsRef} className='ac-register-process-steps'>
                <ProcessSteps
                  steps={(() => {
                    const steps = [
                      {
                        id: 'grp-soort',
                        marker: 1,
                        status: getStatus(currentStep, 0),
                        title: 'Soort koppeling',
                      },
                      {
                        id: 'grp-koppeling',
                        marker: 2,
                        status: getStatusMulti(currentStep, 1, 2),
                        title: 'Koppeling zoeken',
                        steps: [
                          {
                            id: 'sub-toevoegen',
                            status: getStatus(currentStep, 2),
                            title: 'Toevoegen',
                          },
                        ],
                      },
                      {
                        id: 'grp-review',
                        marker: 3,
                        status: getStatus(currentStep, 3),
                        title: 'Controleren',
                      },
                    ];
                    return steps;
                  })()}
                />
              </div>

              <div className='ac-register-form-container'>
                <div
                  className='sr-only'
                  role='status'
                  aria-live='polite'
                  id='form-status'
                >
                  {currentStepName(currentStep)}
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div
                    style={{
                      marginBottom: '2rem',
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <details>
                      <summary
                        style={{
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem',
                        }}
                      >
                        🐛 Debug: Koppeling Data (Click to expand)
                      </summary>
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: '300px',
                          overflow: 'auto',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '2px',
                        }}
                      >
                        {JSON.stringify(
                          {
                            koppelingsType,
                            ownApp,
                            rows,
                            selectedAppAByRow,
                            selectedAppBByRow,
                            directionByRow,
                            typeByRow,
                            payloads: serializeRowsToPayload(),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  </div>
                )}

                {renderStep(currentStep)}

                <div
                  className={clsx(
                    'ac-register-form-buttons',
                    currentStep !== 0 && 'ac-register-form-buttons-not-first-step'
                  )}
                >
                  {currentStep !== 0 && (
                    <AcButton
                      style='button'
                      buttonType='secondary'
                      onClick={() => setCurrentStep(currentStep - 1)}
                      disabled={loading || saveLoading}
                    >
                      Vorige
                    </AcButton>
                  )}

                  {currentStep !== 3 && (
                    <div className='ac-register-button-wrapper'>
                      <AcButton
                        style='button'
                        className={clsx(
                          currentStep === 0 && 'ac-register-form-next-button'
                        )}
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!canGoNext() || loading || saveLoading}
                      >
                        Volgende
                      </AcButton>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <AcButton
                      style='button'
                      buttonType='primary'
                      onClick={handleSave}
                      disabled={saveLoading || !canSave()}
                    >
                      {saveLoading ? 'Bezig met opslaan...' : 'Opslaan'}
                    </AcButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsKoppeling)));
