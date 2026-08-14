import { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn, AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { useDebouncedInput } from '@src/hooks';
import _ from 'lodash';
import {
  Heading1,
  Paragraph,
  Alert,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';

// Stage components
import ConFormSuiteInformatieStage from './components/con-form-suite-informatie-stage';
import ConFormApplicatiesStage from './components/con-form-applicaties-stage';
import ConFormControlerenStage from './components/con-form-controleren-stage';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';
import { getActiveWizard } from '@src/constants/wizards.constants';

const mapToOption = (item, index) => {
  const label =
    item?.['@self']?.name ||
    item?.naam ||
    item?.name ||
    item?.title ||
    item?.label ||
    `Applicatie ${index + 1}`;
  const value = item?.['@self']?.id || item?.id || item?.slug || label;
  return { value: String(value), label: String(label), data: item };
};

const ConFormsSuite = ({ store, userStore }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const suiteId = searchParams.get('id') || '';
  const formType = searchParams.get('type') || '';
  const applicatieFromUrl = searchParams.get('applicatie') || '';
  const isEditMode = !!suiteId;
  const [currentStep, setCurrentStep] = useState(0);
  const processStepsRef = useRef(null);

  // Schemas
  const [schemas, setSchemas] = useState({
    suite: null,
    module: null,
    organisatie: null,
  });
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Edit-mode prefill state
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);
  const [prefillRetry, setPrefillRetry] = useState(0);

  // Suite object (schema-compliant)
  const [suite, setSuite] = useState({
    naam: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    website: '',
    logo: '',
    contactpersoon: null,
    applicaties: [],
  });

  const [touched, setTouched] = useState({});

  // State for applicaties selection
  const [selectedApplicatieIds, setSelectedApplicatieIds] = useState([]);
  const [applicatiesLoading, setApplicatiesLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [applicatiePreloadLoading, setApplicatiePreloadLoading] = useState(false);
  const [applicatieOptions, setApplicatieOptions] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Unsaved changes alert
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  const setSuiteData = (key, value) => {
    setSuite((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // Prefill suite data when editing
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        // Skip to step 0 in edit mode (Applicaties)
        setCurrentStep(0);
        await store.object.fetchObject('voorzieningen', 'suite', String(suiteId), {
          _extend: ['@self.schema'],
        });
        if (cancelled) return;

        const fetched = store.object.getObject(
          'voorzieningen_suite',
          String(suiteId)
        );
        if (!fetched) return;

        // Map fetched suite to local state shape
        const mapId = (item) =>
          item && typeof item === 'object'
            ? String(item.id || item.value || item.uuid || item.slug || '')
            : String(item || '');

        const prefilledApplicatieIds = Array.isArray(fetched.applicaties)
          ? fetched.applicaties.map((a) => mapId(a)).filter(Boolean)
          : [];

        // Update main suite object
        setSuite((prev) => ({
          ...prev,
          naam: fetched.naam || '',
          beschrijvingKort: fetched.beschrijvingKort || '',
          beschrijvingLang: fetched.beschrijvingLang || '',
          website: fetched.website || '',
          logo: fetched.logo || '',
          contactpersoon: fetched.contactpersoon || null,
          applicaties: prefilledApplicatieIds,
        }));

        // Prefill selections
        setSelectedApplicatieIds(prefilledApplicatieIds);
      } catch (e) {
        setPrefillError(
          'Het laden van de suite is mislukt. Probeer het opnieuw of start een nieuwe suite.'
        );
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, suiteId, prefillRetry, store]);

  // Clickable previous steps
  useEffect(() => {
    if (!processStepsRef.current) return;
    if (prefillLoading || prefillError) return;
    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step'
      );
      stepElements.forEach((el, index) => {
        el.style.cursor = '';
        el.onclick = null;
        el.classList.remove('ac-step-clickable');
        if (index < currentStep) {
          el.classList.add('ac-step-clickable');
          el.onclick = (e) => {
            e.preventDefault();
            setCurrentStep(index);
          };
        }
      });
    };
    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [currentStep, prefillLoading, prefillError]);

  // Ensure /me is refreshed when the wizard mounts
  useEffect(() => {
    if (typeof userStore?.fetchUserProfile === 'function') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('ConFormsSuite - refreshing /me via userStore.fetchUserProfile');
      }
      userStore.fetchUserProfile();
    }
  }, [userStore]);

  // Load schemas through object store (auth-aware)
  useEffect(() => {
    const load = async () => {
      setSchemasLoading(true);
      const types = ['suite', 'module', 'organisatie'];
      const fetched = {};
      try {
        await Promise.all(
          types.map(async (t) => {
            try {
              await store.object.fetchSchema(t);
              fetched[t] = store.object.getSchema(`schema_${t}`);
            } catch {
              fetched[t] = null;
            }
          })
        );
        setSchemas(fetched);
      } finally {
        setSchemasLoading(false);
      }
    };
    load();
  }, [store]);

  // Fetch all modules (applicaties)
  const loadAllApplicaties = async () => {
    setApplicatiesLoading(true);
    try {
      await store.object.fetchCollection(
        'voorzieningen',
        'module',
        {
          _limit: '50',
          _page: '1',
        },
        null,
        'suite_form'
      );
      const collection = store.object.getCollection(
        'voorzieningen_module_suite_form'
      );
      const list = collection?.results || collection || [];
      const options = list.map(mapToOption);
      setApplicatieOptions(options);
    } catch {
      setApplicatieOptions([]);
    } finally {
      setApplicatiesLoading(false);
    }
  };

  // Load applicaties on mount (step 0 is Applicaties)
  useEffect(() => {
    loadAllApplicaties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure all applicaties from suite are loaded in edit mode
  // This handles cases where applicaties aren't in the initial limit
  useEffect(() => {
    if (!isEditMode || !selectedApplicatieIds.length || applicatiesLoading) return;

    const loadMissingApplicaties = async () => {
      // Get current options to check what's missing
      const currentOptionIds = new Set(applicatieOptions.map((opt) => opt.value));
      const missingIds = selectedApplicatieIds.filter(
        (id) => !currentOptionIds.has(String(id))
      );

      // Fetch missing applicaties individually
      if (missingIds.length > 0) {
        setApplicatiePreloadLoading(true);
        try {
          const fetchPromises = missingIds.map((id) =>
            store.object
              .fetchObject('voorzieningen', 'module', String(id), {
                _extend: ['@self.schema'],
              })
              .then(() => {
                const fetchedModule = store.object.getObject(
                  'voorzieningen_module',
                  String(id)
                );
                return fetchedModule ? mapToOption(fetchedModule, 0) : null;
              })
              .catch(() => null)
          );

          const fetchedOptions = await Promise.all(fetchPromises);
          const validOptions = fetchedOptions.filter(Boolean);

          // Add missing applicaties to options
          if (validOptions.length > 0) {
            setApplicatieOptions((prev) => {
              const existingIds = new Set(prev.map((opt) => opt.value));
              const newOptions = validOptions.filter(
                (opt) => !existingIds.has(opt.value)
              );
              return [...prev, ...newOptions];
            });
          }
        } catch (error) {
          console.error('Error loading missing applicaties in edit mode:', error);
        } finally {
          setApplicatiePreloadLoading(false);
        }
      }
    };

    loadMissingApplicaties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEditMode,
    selectedApplicatieIds,
    applicatieOptions,
    applicatiesLoading,
    store,
  ]);

  // Pre-select applicatie from URL parameter
  useEffect(() => {
    if (!applicatieFromUrl || isEditMode) return; // Skip if editing or no applicatie in URL

    const preSelectApplicatie = async () => {
      try {
        // Wait for applicaties to be loaded first
        if (applicatieOptions.length === 0) return;

        // Check if the applicatie exists in options
        const applicatieOption = applicatieOptions.find(
          (opt) => String(opt.value) === String(applicatieFromUrl)
        );

        if (applicatieOption) {
          // Pre-select the applicatie (already in options, no fetch needed)
          setSelectedApplicatieIds((prev) => {
            if (prev.includes(applicatieOption.value)) return prev;
            return [...prev, applicatieOption.value];
          });
        } else {
          // If applicatie not in initial list, fetch it directly
          setApplicatiePreloadLoading(true);
          try {
            await store.object.fetchObject(
              'voorzieningen',
              'module',
              String(applicatieFromUrl),
              {
                _extend: ['@self.schema'],
              }
            );
            const fetched = store.object.getObject(
              'voorzieningen_module',
              String(applicatieFromUrl)
            );
            if (fetched) {
              const option = mapToOption(fetched, 0);
              setApplicatieOptions((prev) => {
                const exists = prev.some((o) => o.value === option.value);
                if (exists) return prev;
                return [...prev, option];
              });
              setSelectedApplicatieIds((prev) => {
                if (prev.includes(option.value)) return prev;
                return [...prev, option.value];
              });
            }
          } catch (error) {
            console.error('Error pre-selecting applicatie from URL:', error);
          } finally {
            setApplicatiePreloadLoading(false);
          }
        }
      } catch (error) {
        console.error('Error pre-selecting applicatie from URL:', error);
        setApplicatiePreloadLoading(false);
      }
    };

    preSelectApplicatie();
  }, [applicatieFromUrl, applicatieOptions, isEditMode, store]);

  // Server-side search for modules (applicaties)
  const searchApplicaties = useCallback(
    async (query) => {
      try {
        setSearchLoading(true);
        const q = String(query || '').trim();

        const queryParams = {
          _limit: '50',
          _page: '1',
        };

        // Add search parameter if provided
        if (q) {
          queryParams._search = q;
        }

        await store.object.fetchCollection(
          'voorzieningen',
          'module',
          queryParams,
          null,
          'suite_form_search'
        );
        const collection = store.object.getCollection(
          'voorzieningen_module_suite_form_search'
        );
        const list = collection?.results || collection || [];
        const options = list.map(mapToOption);

        // Merge with existing options to preserve selected items
        setApplicatieOptions((prevOptions) => {
          const newOptionsMap = new Map(options.map((opt) => [opt.value, opt]));

          // Combine existing and new options, preferring new data for existing items
          const mergedOptions = [...newOptionsMap.values()];

          // Add any existing options that aren't in the new results
          // This preserves previously selected items that might not match the current search
          prevOptions.forEach((opt) => {
            if (!newOptionsMap.has(opt.value)) {
              mergedOptions.push(opt);
            }
          });

          return mergedOptions;
        });
      } catch (e) {
        // Don't clear options on error to preserve existing selections
        console.error('Applicatie search failed:', e);
      } finally {
        setSearchLoading(false);
      }
    },
    [store]
  );

  // Debounced search function
  const debouncedSearchApplicaties = useDebouncedInput(searchApplicaties, 250, {
    disableInstantValidation: true,
  });

  // Keep suite.applicaties in sync with current selection
  useEffect(() => {
    setSuiteData('applicaties', selectedApplicatieIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApplicatieIds]);

  const handleNextStep = async () => {
    const next = currentStep + 1;
    setCurrentStep(next);
  };

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ConFormApplicatiesStage
            selectedApplicatieIds={selectedApplicatieIds}
            setSelectedApplicatieIds={setSelectedApplicatieIds}
            loadingApplicaties={applicatiesLoading || applicatiePreloadLoading}
            searchLoading={searchLoading}
            applicatieOptions={applicatieOptions}
            searchApplicaties={debouncedSearchApplicaties}
            schemas={schemas}
          />
        );
      case 1:
        return (
          <ConFormSuiteInformatieStage
            suite={suite}
            setSuiteData={setSuiteData}
            loading={schemasLoading}
            touched={touched}
            schemas={schemas}
            userStore={userStore}
          />
        );
      case 2:
        return (
          <ConFormControlerenStage
            suite={suite}
            selectedApplicatieIds={selectedApplicatieIds}
            applicatieOptions={applicatieOptions}
            userStore={userStore}
            formType={formType}
            store={store}
          />
        );
      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      case 0:
        return 'Applicaties';
      case 1:
        return 'Suite informatie';
      case 2:
        return 'Controleer uw gegevens';
      default:
        return '';
    }
  };

  // Check if a field is required according to loaded schema
  const isSchemaFieldRequired = (schemaType, fieldName) => {
    const schema = schemas?.[schemaType];
    if (!schema) return false;
    // Property-level required flag
    const prop = schema.properties?.[fieldName];
    if (prop && prop.required) return true;
    // Parent-level required array per JSON Schema
    if (Array.isArray(schema.required)) {
      return schema.required.includes(fieldName);
    }
    return false;
  };

  // Validation
  const getDisabledStatus = (step) => {
    if (step === 0) {
      // Applicaties: at least one applicatie selected
      return selectedApplicatieIds.length === 0;
    }
    if (step === 1) {
      // Suite informatie: Respect schema requiredness
      const naamRequired = isSchemaFieldRequired('suite', 'naam');
      const beschrijvingKortRequired = isSchemaFieldRequired(
        'suite',
        'beschrijvingKort'
      );
      const websiteRequired = isSchemaFieldRequired('suite', 'website');

      const missingNaam = naamRequired && (!suite.naam || !suite.naam.trim());
      const missingBeschrijvingKort =
        beschrijvingKortRequired &&
        (!suite.beschrijvingKort || !suite.beschrijvingKort.trim());
      const missingWebsite =
        websiteRequired && (!suite.website || !suite.website.trim());
      if (missingNaam || missingBeschrijvingKort || missingWebsite) return true;

      // If website is provided, validate its format; if empty and not required, it's allowed
      if (suite.website && suite.website.trim()) {
        const website = suite.website.trim();
        if (!validateWebsite(website)) return true;
      }
      return false;
    }
    // Controleren: no strict validation
    return false;
  };

  const getDisabledTooltip = (step) => {
    if (step === 0) {
      return selectedApplicatieIds.length === 0
        ? 'Selecteer minimaal één applicatie'
        : '';
    }
    if (step === 1) {
      // Suite informatie validation messages
      const messages = [];
      const naamRequired = isSchemaFieldRequired('suite', 'naam');
      const beschrijvingKortRequired = isSchemaFieldRequired(
        'suite',
        'beschrijvingKort'
      );
      const websiteRequired = isSchemaFieldRequired('suite', 'website');

      if (naamRequired && (!suite.naam || !suite.naam.trim())) {
        messages.push('Suiteraam is verplicht');
      }
      if (
        beschrijvingKortRequired &&
        (!suite.beschrijvingKort || !suite.beschrijvingKort.trim())
      ) {
        messages.push('Korte beschrijving is verplicht');
      }
      if (websiteRequired && (!suite.website || !suite.website.trim())) {
        messages.push('Website is verplicht');
      } else if (suite.website && suite.website.trim()) {
        const website = suite.website.trim();
        if (!validateWebsite(website)) {
          messages.push(
            'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)'
          );
        }
      }
      return messages.join('\n');
    }
    return '';
  };

  const handleSaveSuite = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const payload = {
        ...suite,
        applicaties: selectedApplicatieIds,
      };
      if (isEditMode) {
        await store.object.updateObject(
          'voorzieningen',
          'suite',
          String(suiteId),
          payload
        );
      } else {
        await store.object.createObject('voorzieningen', 'suite', payload);
      }
      setSaveResult('success');
    } catch (e) {
      setSaveResult('error');
    } finally {
      setSaving(false);
    }
  };

  const {
    icon: Icon,
    name: wizardName,
    schema: wizardSchema,
  } = useMemo(() => getActiveWizard() || {}, [formType]);
  const capitalizedSchema = _.capitalize(wizardSchema);
  const editModeTitle = `${capitalizedSchema} updaten`;

  const wizardType = isEditMode
    ? 'update'
    : formType === 'ontbrekend-suite'
    ? 'toevoegen'
    : 'publicatie';

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <Heading1
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Icon style={{ width: '1em', height: '1em' }} />
              {isEditMode ? editModeTitle : wizardName}
            </Heading1>
            <Paragraph>
              {isEditMode
                ? 'Werk uw suitegegevens bij in onze catalogus.'
                : 'Voer de gegevens van de suite in, selecteer relevante applicaties en controleer uw invoer.'}
            </Paragraph>
          </div>

          {/* End header block */}

          {saveResult === 'success' ? (
            <div>
              <Heading1>
                {isEditMode
                  ? '🎉 Suite succesvol geüpdatet!'
                  : '🎉 Suite succesvol aangemeld!'}
              </Heading1>
              <Alert type='ok'>
                <Paragraph>
                  <strong>
                    {isEditMode
                      ? 'Uw suite is succesvol bijgewerkt!'
                      : 'Uw suite is succesvol geregistreerd!'}
                  </strong>
                </Paragraph>
                <Paragraph>
                  De suite {suite.naam || 'Onbekende suite'} en de geselecteerde
                  applicaties zijn opgeslagen in de catalogus.
                </Paragraph>
              </Alert>
              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <UnorderedList>
                  <UnorderedListItem>
                    De suite wordt zichtbaar in de softwarecatalogus
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Organisaties kunnen de suite bekijken en beoordelen
                  </UnorderedListItem>
                  <UnorderedListItem>
                    U kunt de suite beheren via het beheer dashboard
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Eventuele wijzigingen kunnen later worden aangebracht
                  </UnorderedListItem>
                </UnorderedList>
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.HOUSE />}
                  onClick={() => navigate('/beheer')}
                >
                  Terug naar beheer dashboard
                </AcButton>
                <AcButton
                  style='button'
                  variant='secondary'
                  icon={<VISUALS.CUBES />}
                  onClick={() => {
                    setSaveResult(null);
                    setCurrentStep(0);
                    setSuite({
                      naam: '',
                      beschrijvingKort: '',
                      beschrijvingLang: '',
                      website: '',
                      logo: '',
                      contactpersoon: null,
                      applicaties: [],
                    });
                  }}
                  sx={{ marginLeft: '1rem' }}
                >
                  Nieuwe suite aanmelden
                </AcButton>
              </div>
            </div>
          ) : (
            <div>
              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName(currentStep)}
                </h3>
              </div>

              <div className='ac-register-container ac-forms-product'>
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps
                    steps={[
                      {
                        id: 'a9p0p1l2-i3c4-a5t6-i7e8-s9t0a1g2e3f4',
                        marker: 1,
                        status: getStatus(currentStep, 0),
                        title: 'Applicaties',
                      },
                      {
                        id: 's1u2i3t4-e5i6-n7f8-o9r0-m1a2t3i4e5f6',
                        marker: 2,
                        status: getStatus(currentStep, 1),
                        title: 'Suite informatie',
                      },
                      {
                        id: 'c5o6n7t8-r9o0-l1e2-r3e4-n5s6t7a8g9e0',
                        marker: 3,
                        status: getStatus(currentStep, 2),
                        title: 'Controleren',
                      },
                    ]}
                  />
                </div>

                <div className='ac-register-form-container'>
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
                          🐛 Debug: Suite Object (Click to expand)
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
                          {JSON.stringify(suite, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {saveResult === 'error' && (
                    <Alert type='error'>
                      Er is een fout opgetreden bij het opslaan.
                    </Alert>
                  )}

                  {/* Prefill error UI */}
                  {prefillError && (
                    <Alert type='error'>
                      <Paragraph>{prefillError}</Paragraph>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <AcButton
                          style='button'
                          icon={<VISUALS.ARROW_RIGHT />}
                          onClick={() => {
                            // Retry prefill by re-running effect
                            setPrefillError(null);
                            setPrefillRetry((n) => n + 1);
                          }}
                        >
                          Opnieuw proberen
                        </AcButton>
                      </div>
                    </Alert>
                  )}

                  {!prefillError && renderStep(currentStep)}

                  <div
                    className={clsx(
                      'ac-register-form-buttons',
                      currentStep !== 0 && 'ac-register-form-buttons-not-first-step'
                    )}
                  >
                    <AcFlex spacing='xs' style={{ width: 'fit-content' }}>
                      {currentStep !== 0 && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => setCurrentStep(currentStep - 1)}
                          disabled={saving || schemasLoading}
                        >
                          Vorige
                        </AcButton>
                      )}
                    </AcFlex>

                    {currentStep === 0 && (
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.CUBE />}
                        onClick={() => setShowUnsavedChangesAlert(true)}
                      >
                        Ik kan de gewenste applicatie niet vinden
                      </AcButton>
                    )}

                    <AcFlex
                      spacing='xs'
                      style={{ width: 'fit-content' }}
                      className={clsx(
                        currentStep === 0 && 'ac-register-form-next-button'
                      )}
                    >
                      {currentStep !== 2 && (
                        <div className='ac-register-button-wrapper'>
                          <AcButton
                            style='button'
                            icon={<VISUALS.ARROW_RIGHT />}
                            onClick={handleNextStep}
                            disabled={
                              getDisabledStatus(currentStep) ||
                              prefillLoading ||
                              saving ||
                              schemasLoading
                            }
                            title={
                              getDisabledStatus(currentStep)
                                ? getDisabledTooltip(currentStep)
                                : ''
                            }
                          >
                            Volgende
                          </AcButton>
                        </div>
                      )}
                    </AcFlex>

                    {currentStep === 2 && (
                      <AcButton
                        style='button'
                        buttonType='primary'
                        icon={<VISUALS.CLIPBOARD_CHECK />}
                        onClick={handleSaveSuite}
                        loading={saving}
                        disabled={saving || prefillLoading}
                      >
                        {saving
                          ? 'Bezig met opslaan...'
                          : isEditMode
                          ? 'Suite updaten'
                          : 'Suite registreren'}
                      </AcButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </AcColumn>
      </AcContainer>

      <ConUnsavedChangesAlertModal
        key='unsaved-changes-alert-modal'
        showModal={showUnsavedChangesAlert}
        onClose={() => setShowUnsavedChangesAlert(false)}
        onConfirm={() => {
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          const encodedRedirect = encodeURIComponent(currentUrl);
          navigate(
            `/forms/applicatie?type=ontbrekend-applicatie&redirect=${encodedRedirect}`
          );
        }}
        title='Waarschuwing'
        message={`Je staat op het punt om de suite ${wizardType} wizard te verlaten om een applicatie aan te maken. Na het aanmaken van de applicatie word je teruggeleid naar dit formulier. Al je huidige wijzigingen zullen niet worden opgeslagen.`}
        confirmLabel='Verlaten'
        cancelLabel='Blijven'
        confirmIcon={<VISUALS.ARROW_RIGHT />}
        cancelIcon={<VISUALS.ARROW_LEFT />}
      />
    </AcSection>
  );
};

export default memo(withStore(observer(ConFormsSuite)));
