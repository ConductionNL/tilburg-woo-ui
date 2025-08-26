import { useState, useEffect, memo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { createDefaultFormObject } from '@src/utilities/schema-object-factory';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import ReactSelect from 'react-select';
import {
  Heading1,
  Paragraph,
  UnorderedList,
  UnorderedListItem,
  Separator,
  Textbox,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';

const AcFormsKoppeling = ({ store }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

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

  // Schema management
  const [schemas, setSchemas] = useState({});
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Koppeling object based on schema
  const [koppeling, setKoppeling] = useState({});

  // Options for modules (applications)
  const [modulesOptions, setModulesOptions] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // "Your" application (optional anchor for adding/searching)
  const [ownApp, setOwnApp] = useState(null);

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

  // Fetch schemas on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setSchemasLoading(true);
      try {
        // Fetch 'koppeling' schema for this form
        const response = await fetch('/api/apps/openregister/api/schemas/koppeling');
        if (response.ok) {
          const koppelingSchema = await response.json();
          const fetchedSchemas = { koppeling: koppelingSchema };
          setSchemas(fetchedSchemas);

          // Initialize default koppeling object based on schema
          const defaultKoppeling = createDefaultFormObject(
            store,
            koppelingSchema,
            'koppeling',
            {
              // Add any specific defaults for koppeling form
              status: 'concept',
              richting: '',
              type: '',
              beschrijving: '',
            }
          );
          setKoppeling(defaultKoppeling);
        }
      } catch (error) {
        console.error('Failed to fetch schemas for koppeling form:', error);
      } finally {
        setSchemasLoading(false);
      }
    };

    fetchSchemas();
  }, [store]);

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
          const label =
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            `Module ${index + 1}`;
          const value = item?.value || item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        });
        if (isMounted) setModulesOptions(options);
      } catch (e) {
        if (isMounted) setModulesOptions([]);
      }
    };

    fetchModules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Search koppelingen by app name (client + server tolerant)
  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = [];

      // Attempt server search on koppelingen endpoint
      const params = new URLSearchParams({
        _limit: '20',
        _page: '1',
        _extend: '@self.schema',
      });
      if (searchQuery) params.set('_search', searchQuery);
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

      // Fallback: if no server results, keep list empty; we'll still show nothing
      // Client-side filter further by app name if needed
      const q = (searchQuery || '').toLowerCase();
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
    if (currentStep === 0) return true; // search is optional to proceed
    if (currentStep === 1) return rows.length > 0; // at least one row exists
    return true;
  };

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
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='koppeling-zoek-title'
          >
            <h2 id='koppeling-zoek-title' className='sr-only'>
              Koppeling zoeken
            </h2>

            <Paragraph>
              Vul de naam van uw applicatie in om te controleren of er al koppelingen
              bestaan.
            </Paragraph>

            <div className='ac-register-form-grid'>
              <div style={{ gridColumn: 'span 2' }}>
                <label className='utrecht-form-label'>
                  Uw applicatie (optioneel)
                </label>
                <ReactSelect
                  className={clsx(
                    'ac-beheer-select',
                    loading && 'ac-beheer-select--disabled'
                  )}
                  options={modulesOptions}
                  value={ownApp}
                  onChange={setOwnApp}
                  isDisabled={loading}
                  placeholder='Selecteer uw applicatie...'
                  isClearable
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className='utrecht-form-label'>Zoek op applicatienaam</label>
                <Textbox
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value || '')}
                  placeholder='Bijv. OpenWoo'
                  id='koppeling-zoek-input'
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <AcButton style='button' onClick={handleSearch} disabled={loading}>
                Zoeken
              </AcButton>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
                Zoekresultaten
              </h3>
              {searchResults.length ? (
                <UnorderedList>
                  {searchResults.map((k, i) => (
                    <UnorderedListItem key={k?.id || i}>
                      {k?.applicatie1 || k?.applicatieA || k?.appA || 'Onbekend'} ↔{' '}
                      {k?.applicatie2 || k?.applicatieB || k?.appB || 'Onbekend'}
                    </UnorderedListItem>
                  ))}
                </UnorderedList>
              ) : (
                <Paragraph>Geen koppelingen gevonden.</Paragraph>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='koppeling-toevoegen-title'
          >
            <h2 id='koppeling-toevoegen-title' className='sr-only'>
              Toevoegen
            </h2>

            <TableContainer className='con-form-wizard-table-container'>
              <Table>
                <TableBody>
                  {rows.map((rowId) => (
                    <TableRow key={`row-${rowId}`}>
                      <TableCell>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <div>
                            <label className='utrecht-form-label'>Naam</label>
                            <Textbox
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <div>
                            <label className='utrecht-form-label'>
                              Applicatie A
                            </label>
                            <ReactSelect
                              className={clsx(
                                'ac-beheer-select',
                                loading && 'ac-beheer-select--disabled'
                              )}
                              options={modulesOptions}
                              value={
                                selectedAppAByRow[rowId] != null
                                  ? modulesOptions.find(
                                      (o) => o.value === selectedAppAByRow[rowId]
                                    ) || null
                                  : ownApp || null
                              }
                              onChange={(opt) =>
                                setSelectedAppAByRow((prev) => ({
                                  ...prev,
                                  [rowId]: opt?.value,
                                }))
                              }
                              placeholder='Selecteer applicatie A'
                            />
                          </div>
                          <div>
                            <label className='utrecht-form-label'>Soort</label>
                            <ReactSelect
                              className={clsx(
                                'ac-beheer-select',
                                loading && 'ac-beheer-select--disabled'
                              )}
                              options={typeOptions}
                              value={
                                typeByRow[rowId]
                                  ? typeOptions.find(
                                      (o) => o.value === typeByRow[rowId]
                                    )
                                  : null
                              }
                              onChange={(opt) =>
                                setTypeByRow((prev) => ({
                                  ...prev,
                                  [rowId]: opt?.value,
                                }))
                              }
                              placeholder='Soort'
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <div>
                            <label className='utrecht-form-label'>
                              Applicatie B
                            </label>
                            <ReactSelect
                              className={clsx(
                                'ac-beheer-select',
                                loading && 'ac-beheer-select--disabled'
                              )}
                              options={modulesOptions}
                              value={
                                selectedAppBByRow[rowId] != null
                                  ? modulesOptions.find(
                                      (o) => o.value === selectedAppBByRow[rowId]
                                    ) || null
                                  : null
                              }
                              onChange={(opt) =>
                                setSelectedAppBByRow((prev) => ({
                                  ...prev,
                                  [rowId]: opt?.value,
                                }))
                              }
                              placeholder='Selecteer applicatie B'
                            />
                          </div>
                          <div>
                            <label className='utrecht-form-label'>
                              Beschrijving
                            </label>
                            <Textbox
                              value={beschrijvingByRow[rowId] || ''}
                              onChange={(e) =>
                                setBeschrijvingByRow((prev) => ({
                                  ...prev,
                                  [rowId]: e?.target?.value || '',
                                }))
                              }
                              placeholder='Korte beschrijving'
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <div>
                            <label className='utrecht-form-label'>Richting</label>
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
                                setDirectionByRow((prev) => ({
                                  ...prev,
                                  [rowId]: opt?.value,
                                }))
                              }
                              placeholder='Richting'
                            />
                          </div>
                          <div>
                            <label className='utrecht-form-label'>Status</label>
                            <ReactSelect
                              className={clsx(
                                'ac-beheer-select',
                                loading && 'ac-beheer-select--disabled'
                              )}
                              options={statusOptions}
                              value={
                                statusByRow[rowId]
                                  ? statusOptions.find(
                                      (o) => o.value === statusByRow[rowId]
                                    )
                                  : null
                              }
                              onChange={(opt) =>
                                setStatusByRow((prev) => ({
                                  ...prev,
                                  [rowId]: opt?.value,
                                }))
                              }
                              placeholder='Status'
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell
                        style={{ verticalAlign: 'middle', textAlign: 'center' }}
                      >
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          onClick={() => removeRow(rowId)}
                          disabled={rows.length === 1}
                        >
                          Verwijderen
                        </AcButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div style={{ marginTop: '1rem' }}>
              <AcButton style='button' onClick={addRow}>
                Rij toevoegen
              </AcButton>
            </div>
          </div>
        );

      case 2:
        return (
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='koppeling-review-title'
          >
            <h2 id='koppeling-review-title' className='sr-only'>
              Controleren
            </h2>

            {saveResult === 'success' && (
              <div className='ac-register-form-alert'>
                {/* Note: Styling for the 'ok' alert has not yet been implemented. */}
                <Alert type='info'>
                  <Paragraph>
                    Koppelingen succesvol opgeslagen. U wordt doorgestuurd naar het
                    beheer-overzicht in {redirectCountdown} seconden…
                  </Paragraph>
                  <Paragraph>
                    Of ga direct naar{' '}
                    <a
                      className='ac-register-form-alert-link'
                      href='/beheer/koppeling'
                    >
                      /beheer/koppeling
                    </a>
                    .
                  </Paragraph>
                </Alert>
              </div>
            )}

            {saveResult === 'error' && (
              <Alert type='error'>
                <Paragraph>Opslaan mislukt:</Paragraph>
                {saveErrors.length > 0 && (
                  <UnorderedList>
                    {saveErrors.map((msg, idx) => (
                      <UnorderedListItem key={idx}>{msg}</UnorderedListItem>
                    ))}
                  </UnorderedList>
                )}
              </Alert>
            )}

            <div className='ac-register-review'>
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <h3 className='utrecht-heading-4'>Overzicht koppelingen</h3>
                </div>
                <Separator className='con-form-wizard-review-header__separator' />

                {!rows.length ? (
                  <Paragraph>Geen toegevoegde koppelingen.</Paragraph>
                ) : (
                  <UnorderedList>
                    {rows.map((rowId) => {
                      const naam = (nameByRow[rowId] || '').trim();
                      const appA =
                        modulesOptions.find(
                          (o) => o.value === selectedAppAByRow[rowId]
                        )?.label ||
                        ownApp?.label ||
                        '-';
                      const appB =
                        modulesOptions.find(
                          (o) => o.value === selectedAppBByRow[rowId]
                        )?.label || '-';
                      const richting = directionByRow[rowId] || '';
                      const soortVal = typeByRow[rowId] || '';
                      const soortLabel =
                        (soortVal &&
                          (typeOptions.find((o) => o.value === soortVal)?.label ||
                            soortVal)) ||
                        '-';
                      const beschrijving = beschrijvingByRow[rowId] || '-';
                      const statusVal = statusByRow[rowId] || '';
                      const statusLabel =
                        (statusVal &&
                          (statusOptions.find((o) => o.value === statusVal)?.label ||
                            statusVal)) ||
                        '-';
                      const dirArrow = getArrowForDirection(richting);
                      return (
                        <UnorderedListItem key={rowId}>
                          {naam ? (
                            <div style={{ marginBottom: '0.25rem' }}>
                              <strong>{naam}</strong>
                            </div>
                          ) : null}
                          {appA} {dirArrow} {appB}
                          <div>
                            <small>
                              <strong>Beschrijving:</strong> {beschrijving}
                            </small>
                          </div>
                          <div>
                            <small>
                              <strong>Soort:</strong> {soortLabel}
                            </small>
                          </div>
                          <div>
                            <small>
                              <strong>Status:</strong> {statusLabel}
                            </small>
                          </div>
                        </UnorderedListItem>
                      );
                    })}
                  </UnorderedList>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      case 0:
        return 'Koppeling zoeken';
      case 1:
        return 'Toevoegen';
      case 2:
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

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <Heading1>Koppeling Aanmelden</Heading1>
            <Paragraph>
              Zoek naar bestaande koppelingen, voeg nieuwe koppelingen toe en
              controleer uw invoer.
            </Paragraph>
          </div>

          <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
            {currentStepName(currentStep)}
          </h3>

          <div className='ac-register-container ac-forms-product'>
            <div ref={processStepsRef} className='ac-register-process-steps'>
              <ProcessSteps
                steps={(() => {
                  const steps = [
                    {
                      id: 'grp-koppeling',
                      marker: 1,
                      status: getStatusMulti(currentStep, 0, 1),
                      title: 'Koppeling zoeken',
                      steps: [
                        {
                          id: 'sub-toevoegen',
                          status: getStatus(currentStep, 1),
                          title: 'Toevoegen',
                        },
                      ],
                    },
                    {
                      id: 'grp-review',
                      marker: 2,
                      status: getStatus(currentStep, 2),
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

                {currentStep !== 2 && (
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

                {currentStep === 2 && (
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
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsKoppeling)));
