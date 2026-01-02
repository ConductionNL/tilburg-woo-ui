import { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn, AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { useDebouncedInput } from '@src/hooks';
import {
  Heading1,
  Paragraph,
  Alert,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';
import useStepper from '../../con-stepper';

// Stage components
import ConFormDienstInformatieStage from './components/con-form-dienst-informatie-stage';
// import ConFormProductenStage from './components/con-form-producten-stage';
import ConFormApplicatiesStage from './components/con-form-applicaties-stage';
import ConFormControlerenStage from './components/con-form-controleren-stage';
import ConFormDienstZoekenStage from './components/con-form-dienst-zoeken-stage';
import ConFormGebruiksinformatieStage from './components/con-form-gebruiksinformatie-stage';
import ConFormDeelnemersStage from './components/con-form-deelnemers-stage';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';
import { getActiveWizard } from '@src/constants/wizards.constants';
import { ConDebugViewer } from '@src/components';

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

const ConFormsDienst = ({ store }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gebruikId = searchParams.get('id') || ''; // For edit mode - we edit the gebruik object
  const formType = searchParams.get('type') || '';
  const applicatieFromUrl = searchParams.get('applicatie') || '';
  const dienstFromUrl = searchParams.get('dienst') || ''; // For redirect from Aanbod-beheerders flow
  const isEditMode = !!gebruikId;
  // In edit mode (when we have a gebruikId), we're always in gebruik beheerder flow
  // because we're editing a gebruik object, not a dienst object
  const isGebruikBeheerdersFlow = isEditMode || formType === 'ontbrekend-dienst';

  const stepper = useStepper();
  const processStepsRef = useRef(null);

  // Schemas
  const [schemas, setSchemas] = useState({
    dienst: null,
    product: null,
    module: null,
    koppeling: null,
    organisatie: null,
  });
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Edit-mode prefill state
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);
  const [prefillRetry, setPrefillRetry] = useState(0);

  // Dienst object (schema-compliant)
  const [dienst, setDienst] = useState({
    naam: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    website: '',
    logo: '',
    contactpersoon: null,
    aanbieder: '',
    type: [],
    producten: [],
    modules: [],
    koppelingen: [],
  });

  const [touched, setTouched] = useState({});

  // Service type selection state - default to 'eigen-organisatie' since selection stage is disabled
  const [dienstType] = useState('eigen-organisatie'); // 'eigen-organisatie' or 'andere-organisatie'

  const setDienstData = (key, value) => {
    setDienst((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // productId -> module options derived from product details
  const [productToModulesLookup, setProductToModulesLookup] = useState({});
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [applicatiePreloadLoading, setApplicatiePreloadLoading] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);
  const moduleOptionsRef = useRef([]);

  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [selectedKoppelingIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Unsaved changes alert
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  // Gebruik-beheerders flow state (ontbrekend-dienst)
  const [selectedApplicatie, setSelectedApplicatie] = useState(null); // Single applicatie option object
  const [dienstenResults, setDienstenResults] = useState([]); // Array of dienst objects
  const [dienstenResultsLoading, setDienstenResultsLoading] = useState(false);
  const [resolvedModulesFromDiensten, setResolvedModulesFromDiensten] = useState([]);
  const [ownAppOptions, setOwnAppOptions] = useState([]); // Options for applicatie select in Dienst zoeken
  const [ownAppLoading, setOwnAppLoading] = useState(false);

  // New dienst creation state
  const [dienstKeuze, setDienstKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [nieuweDienst, setNieuweDienst] = useState({
    naam: '',
    website: '',
    type: '',
    leverancier: null,
  });
  const setNieuweDienstData = (key, value) => {
    setNieuweDienst((prev) => ({ ...prev, [key]: value }));
  };

  // Leverancier creation state (for new dienst flow)
  const [leverancierKeuze, setLeverancierKeuze] = useState('bestaand');
  const [leverancierOrganisatie, setLeverancierOrganisatie] = useState({
    naam: '',
    website: '',
  });
  const setLeverancierOrganisatieData = (key, value) => {
    setLeverancierOrganisatie((prev) => ({ ...prev, [key]: value }));
  };
  const [leverancierOptions, setLeverancierOptions] = useState([]);
  const [leverancierLoading, setLeverancierLoading] = useState(false);

  // Dienst type options
  const [dienstTypeOptions, setDienstTypeOptions] = useState([]);

  // State for full organization data (to check type for conditional Deelnemers step)
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);

  // Deelnemers options and loading state
  const [deelnemerOptions, setDeelnemerOptions] = useState([]);
  const [deelnemersLoading, setDeelnemersLoading] = useState(false);

  // Gebruik state (for gebruik beheerder flow - ontbrekend-dienst)
  const [gebruik, setGebruik] = useState({
    diensten: [],
    status: '',
    interneAantekening: '',
    deelnemers: [],
  });

  // Helper function to update gebruik state
  const setGebruikData = (key, value) => {
    setGebruik((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to extract id string from various API reference shapes
  const getIdString = (ref) => {
    if (!ref) return '';
    if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
    return (
      String(
        ref.uuid ||
          ref.id ||
          ref.value ||
          ref?.['@self']?.id ||
          ref?.['@self']?.value ||
          ref.slug ||
          ''
      ) || ''
    );
  };

  // Prefill gebruik data when editing (not dienst - we edit the gebruik object)
  // The flow is the same as creating, but with all fields pre-filled
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        // Start at the first step (same as create flow)
        stepper.resetCurrentStep();

        // Fetch the gebruik object (not the dienst)
        await store.object.fetchObject(
          'voorzieningen',
          'gebruik',
          String(gebruikId),
          {
            '_extend[]': ['@self.schema'],
            _published: 'false',
          }
        );
        if (cancelled) return;

        const fetched = store.object.getObject(
          'voorzieningen_gebruik',
          String(gebruikId)
        );
        if (!fetched) return;

        // Extract diensten IDs from the gebruik object
        // First try fetched.diensten, if null/empty fallback to @self.relations.diensten
        const dienstenSource =
          Array.isArray(fetched.diensten) && fetched.diensten.length > 0
            ? fetched.diensten
            : fetched['@self']?.relations?.diensten;
        const dienstenIds = Array.isArray(dienstenSource)
          ? dienstenSource.map((d) => getIdString(d)).filter(Boolean)
          : [];

        // Extract module (applicatie) ID from the gebruik object
        // First try fetched.module, if null fallback to @self.relations.module
        const moduleId =
          getIdString(fetched.module) ||
          getIdString(fetched['@self']?.relations?.module);

        // Extract deelnemers from the gebruik object
        const deelnemersIds = Array.isArray(fetched.deelnemers)
          ? fetched.deelnemers.map((d) => getIdString(d)).filter(Boolean)
          : [];

        // Update gebruik state with the fetched data (same fields as create flow)
        setGebruik({
          diensten: dienstenIds,
          status: fetched.status || '',
          interneAantekening: fetched.interneAantekening || '',
          deelnemers: deelnemersIds,
        });

        // If we have a module (applicatie), fetch and set it for the first step
        if (moduleId) {
          try {
            await store.object.fetchObject('voorzieningen', 'module', moduleId, {
              '_extend[]': ['@self.schema'],
              _published: 'false',
              _source: 'index',
            });
            const moduleData = store.object.getObject(
              'voorzieningen_module',
              moduleId
            );
            if (moduleData) {
              const applicatieOption = mapToOption(moduleData, 0);
              // Add to options if not already present
              setOwnAppOptions((prev) => {
                const exists = prev.some((o) => o.value === applicatieOption.value);
                return exists ? prev : [...prev, applicatieOption];
              });
              // Set the selected applicatie (pre-fills the first step)
              setSelectedApplicatie(applicatieOption);

              // Trigger loading diensten for the selected applicatie
              // This will populate the search results in the first step
              if (!cancelled) {
                fetchDienstenForApplicatie(moduleId);
              }
            }
          } catch (moduleError) {
            console.error('Error fetching module for edit mode:', moduleError);
          }
        }

        // Fetch diensten to populate the search results for display
        if (dienstenIds.length > 0) {
          try {
            const dienstFetches = dienstenIds.map((id) =>
              store.object
                .fetchObject('voorzieningen', 'dienst', id, {
                  '_extend[]': ['@self.schema'],
                  _published: 'false',
                })
                .then(() => store.object.getObject('voorzieningen_dienst', id))
                .catch(() => null)
            );
            const dienstResults = await Promise.allSettled(dienstFetches);
            const fetchedDiensten = dienstResults
              .map((result) => (result.status === 'fulfilled' ? result.value : null))
              .filter(Boolean);

            if (fetchedDiensten.length > 0 && !cancelled) {
              // Add the fetched diensten to the results so they show up as selected
              setDienstenResults((prev) => {
                const existingIds = new Set(
                  prev.map((d) => d?.id || d?.['@self']?.id)
                );
                const newDiensten = fetchedDiensten.filter(
                  (d) => !existingIds.has(d?.id || d?.['@self']?.id)
                );
                return [...prev, ...newDiensten];
              });
            }
          } catch (dienstenError) {
            console.error('Error fetching diensten for edit mode:', dienstenError);
          }
        }
      } catch (e) {
        setPrefillError(
          'Het laden van de gebruiksregistratie is mislukt. Probeer het opnieuw of start een nieuwe registratie.'
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
  }, [isEditMode, gebruikId, prefillRetry, store]);

  // Clickable previous steps
  useEffect(() => {
    if (!processStepsRef.current) return;
    if (prefillLoading || prefillError) return;
    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step-header, .denhaag-process-steps .denhaag-process-steps__sub-step'
      );
      stepElements.forEach((el, index) => {
        const stepNumber = index + 1;
        el.style.cursor = '';
        el.onclick = null;
        el.classList.remove('ac-step-clickable');
        if (stepNumber < stepper.getCurrentStep()) {
          el.classList.add('ac-step-clickable');
          el.onclick = (e) => {
            e.preventDefault();
            stepper.setCurrentStep(stepNumber);
          };
        }
      });
    };
    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [stepper.getCurrentStep(), prefillLoading, prefillError, stepper]);

  // Ensure /me is refreshed when the wizard mounts (so stages can read active organisation)
  useEffect(() => {
    if (typeof store?.user?.fetchUserProfile === 'function') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          'ConFormsDienst - refreshing /me via store.user.fetchUserProfile'
        );
      }
      store.user.fetchUserProfile();
    }
  }, [store]);

  // Load schemas through object store (auth-aware)
  useEffect(() => {
    const load = async () => {
      setSchemasLoading(true);
      const types = [
        'dienst',
        'product',
        'module',
        'koppeling',
        'organisatie',
        'gebruik',
      ];
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

  // Fetch all modules (not product-based anymore)
  const loadAllModules = async () => {
    setModulesLoading(true);
    try {
      await store.object.fetchCollection(
        'voorzieningen',
        'module',
        {
          _limit: '50',
          _page: '1',
          _published: 'false',
          _source: 'index',
        },
        null,
        'dienst_form'
      );
      const collection = store.object.getCollection(
        'voorzieningen_module_dienst_form'
      );
      const list = collection?.results || collection || [];
      const options = list.map(mapToOption);

      // Merge with existing options to preserve search results and manually fetched modules
      setModuleOptions((prevOptions) => {
        const existingOptionsMap = new Map(
          prevOptions.map((opt) => [opt.value, opt])
        );
        const newOptionsMap = new Map(options.map((opt) => [opt.value, opt]));

        // Start with existing options
        const mergedOptions = [...prevOptions];

        // Add new options that don't already exist
        newOptionsMap.forEach((newOpt, value) => {
          if (!existingOptionsMap.has(value)) {
            mergedOptions.push(newOpt);
          } else {
            // Update existing option with new data (in case it changed)
            const index = mergedOptions.findIndex((opt) => opt.value === value);
            if (index !== -1) {
              mergedOptions[index] = newOpt;
            }
          }
        });

        // Store as a flat list for backward compatibility
        setProductToModulesLookup({ all: mergedOptions });

        return mergedOptions;
      });
    } catch {
      setModuleOptions([]);
      setProductToModulesLookup({ all: [] });
    } finally {
      setModulesLoading(false);
    }
  };

  // Keep ref in sync with moduleOptions state
  useEffect(() => {
    moduleOptionsRef.current = moduleOptions;
  }, [moduleOptions]);

  // Load modules on mount (step 0 is now Applicaties)
  useEffect(() => {
    loadAllModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize ownAppOptions with moduleOptions for Gebruik-beheerders flow
  useEffect(() => {
    if (isGebruikBeheerdersFlow && moduleOptions.length > 0) {
      setOwnAppOptions((prev) => {
        if (prev.length === 0) {
          return [...moduleOptions];
        }
        // Merge with existing options
        const existingMap = new Map(prev.map((opt) => [opt.value, opt]));
        moduleOptions.forEach((opt) => {
          if (!existingMap.has(opt.value)) {
            existingMap.set(opt.value, opt);
          }
        });
        return Array.from(existingMap.values());
      });
    }
  }, [moduleOptions, isGebruikBeheerdersFlow]);

  // Pre-select applicatie from URL parameter
  useEffect(() => {
    if (!applicatieFromUrl || isEditMode) return; // Skip if editing or no applicatie in URL

    const preSelectApplicatie = async () => {
      try {
        // Wait for modules to be loaded first
        if (moduleOptions.length === 0) return;

        // Check if the applicatie exists in options
        const applicatieOption = moduleOptions.find(
          (opt) => String(opt.value) === String(applicatieFromUrl)
        );

        if (applicatieOption) {
          // Pre-select the applicatie (already in options, no fetch needed)
          setSelectedModuleIds((prev) => {
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
                '_extend[]': ['@self.schema'],
                _published: 'false',
                _source: 'index',
              }
            );
            const fetched = store.object.getObject(
              'voorzieningen_module',
              String(applicatieFromUrl)
            );
            if (fetched) {
              const option = mapToOption(fetched, 0);
              setModuleOptions((prev) => {
                const exists = prev.some((o) => o.value === option.value);
                if (exists) return prev;
                return [...prev, option];
              });
              setSelectedModuleIds((prev) => {
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
  }, [applicatieFromUrl, moduleOptions, isEditMode, store]);

  // Generic server-side search for modules
  const createModuleSearch = useCallback(
    (collectionSuffix, setOptions, setLoading) => {
      return async (query) => {
        try {
          setLoading(true);
          const q = String(query || '').trim();

          const queryParams = {
            _limit: '50',
            _page: '1',
            _published: 'false',
            _source: 'index',
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
            collectionSuffix
          );
          const collection = store.object.getCollection(
            `voorzieningen_module_${collectionSuffix}`
          );
          const list = collection?.results || collection || [];
          const options = list.map(mapToOption);

          // Merge with existing options (don't replace, merge)
          setOptions((prevOptions) => {
            const existingOptionsMap = new Map(
              prevOptions.map((opt) => [opt.value, opt])
            );
            const newOptionsMap = new Map(options.map((opt) => [opt.value, opt]));

            // Start with existing options
            const mergedOptions = [...prevOptions];

            // Add new search results that don't already exist
            newOptionsMap.forEach((newOpt, value) => {
              if (!existingOptionsMap.has(value)) {
                mergedOptions.push(newOpt);
              } else {
                // Update existing option with new data (in case it changed)
                const index = mergedOptions.findIndex((opt) => opt.value === value);
                if (index !== -1) {
                  mergedOptions[index] = newOpt;
                }
              }
            });

            return mergedOptions;
          });
        } catch (e) {
          // Don't clear options on error to preserve existing selections
          console.error('Module search failed:', e);
        } finally {
          setLoading(false);
        }
      };
    },
    [store]
  );

  // Server-side search for modules (searches all modules)
  const searchModules = useCallback(
    createModuleSearch('dienst_form_search', setModuleOptions, setSearchLoading),
    [createModuleSearch]
  );

  // Debounced search function
  const debouncedSearchModules = useDebouncedInput(searchModules, 250, {
    disableInstantValidation: true,
  });

  // Server-side search for modules (for Dienst zoeken step)
  const searchModulesForDienstZoeken = useCallback(
    createModuleSearch('dienst_zoeken_search', setOwnAppOptions, setOwnAppLoading),
    [createModuleSearch]
  );

  // Debounced search function for Dienst zoeken step
  const debouncedSearchModulesForDienstZoeken = useDebouncedInput(
    searchModulesForDienstZoeken,
    250,
    {
      disableInstantValidation: true,
    }
  );

  // Fetch diensten for a selected applicatie (Gebruik-beheerders flow)
  const fetchDienstenForApplicatie = useCallback(
    async (applicatieId) => {
      if (!applicatieId) {
        setDienstenResults([]);
        setResolvedModulesFromDiensten([]);
        return;
      }

      setDienstenResultsLoading(true);
      try {
        // Query diensten where modules array contains applicatie ID
        const params = new URLSearchParams({
          _limit: '50',
          _page: '1',
          _published: 'false',
          _source: 'index',
        });
        params.append('modules', String(applicatieId));

        await store.object.fetchCollection(
          'voorzieningen',
          'dienst',
          Object.fromEntries(params),
          null,
          'dienst_zoeken_results'
        );
        const collection = store.object.getCollection(
          'voorzieningen_dienst_dienst_zoeken_results'
        );
        const list = collection?.results || collection || [];

        // Merge with any pre-selected diensten (from edit mode) that might not be in search results
        setDienstenResults((prev) => {
          // Get the selected diensten IDs if any
          const selectedIds = gebruik.diensten || [];
          if (selectedIds.length === 0) return list;

          // Find selected diensten that are not in the new list
          const listIds = new Set(
            list.map((d) => String(d?.id || d?.['@self']?.id || ''))
          );
          const missingDiensten = prev.filter((d) => {
            const dienstId = String(d?.id || d?.['@self']?.id || '');
            return selectedIds.includes(dienstId) && !listIds.has(dienstId);
          });

          if (missingDiensten.length > 0) {
            return [...missingDiensten, ...list];
          }

          return list;
        });

        // Collect module IDs from diensten for resolution
        const moduleIds = new Set();
        list.forEach((dienst) => {
          const modules = Array.isArray(dienst.modules) ? dienst.modules : [];
          modules.forEach((m) => {
            const id =
              typeof m === 'string'
                ? m
                : String(m?.id || m?.value || m?.['@self']?.id || '');
            if (id) moduleIds.add(id);
          });
        });

        // Resolve module labels
        const resolved = [];
        for (const moduleId of Array.from(moduleIds)) {
          // Check if already in ownAppOptions
          const existing = ownAppOptions.find(
            (opt) => String(opt.value) === String(moduleId)
          );
          if (existing) {
            resolved.push({ value: moduleId, label: existing.label });
          } else {
            // Try to fetch if not available
            try {
              await store.object.fetchObject(
                'voorzieningen',
                'module',
                String(moduleId),
                {
                  '_extend[]': ['@self.schema'],
                  _published: 'false',
                  _source: 'index',
                }
              );
              const moduleData = store.object.getObject(
                'voorzieningen_module',
                String(moduleId)
              );
              if (moduleData) {
                const label =
                  moduleData?.naam ||
                  moduleData?.name ||
                  moduleData?.['@self']?.name ||
                  moduleId;
                resolved.push({ value: moduleId, label });
              }
            } catch {
              // If fetch fails, use ID as label
              resolved.push({ value: moduleId, label: moduleId });
            }
          }
        }
        setResolvedModulesFromDiensten(resolved);
      } catch (e) {
        console.error('Failed to fetch diensten:', e);
        setDienstenResults([]);
        setResolvedModulesFromDiensten([]);
      } finally {
        setDienstenResultsLoading(false);
      }
    },
    [store, ownAppOptions]
  );

  // Server-side search for leveranciers (organisaties)
  const searchOrganisaties = useCallback(
    async (query, setOptions, setLoading) => {
      try {
        setLoading(true);
        const q = String(query || '').trim();

        const params = {
          _limit: '50',
          _page: '1',
          _source: 'index',
          '_extend[]': '@self.schema',
          _published: 'false',
        };

        if (q) {
          params['_search'] = q;
        }

        await store.object.fetchCollection(
          'voorzieningen',
          'organisatie',
          params,
          null,
          'leverancier_search'
        );
        const collection = store.object.getCollection(
          'voorzieningen_organisatie_leverancier_search'
        );
        const list = collection?.results || collection || [];
        const options = list.map((org, i) => ({
          value: org?.['@self']?.id || org?.id || String(i),
          label: org?.naam || org?.name || `Organisatie ${i + 1}`,
          data: org,
        }));
        setOptions(options);
      } catch (e) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [store]
  );

  // Debounced search for leveranciers
  const debouncedSearchLeveranciers = useDebouncedInput(
    (query) =>
      searchOrganisaties(query, setLeverancierOptions, setLeverancierLoading),
    500,
    { disableInstantValidation: true }
  );

  // Fetch dienst type options from schema
  useEffect(() => {
    const fetchDienstTypeOptions = async () => {
      try {
        const dienstSchema = schemas?.dienst;
        if (dienstSchema?.properties?.type?.enum) {
          const options = dienstSchema.properties.type.enum.map((value) => ({
            value,
            label: value,
          }));
          setDienstTypeOptions(options);
        }
      } catch (e) {
        console.error('Failed to fetch dienst type options:', e);
      }
    };
    fetchDienstTypeOptions();
  }, [schemas]);

  // Load initial leveranciers when switching to 'nieuw' dienst flow
  useEffect(() => {
    if (dienstKeuze === 'nieuw') {
      searchOrganisaties('', setLeverancierOptions, setLeverancierLoading);
    }
  }, [dienstKeuze, searchOrganisaties]);

  // Fetch full organisation data to check type (for conditional Deelnemers step)
  useEffect(() => {
    const fetchFullOrganisationData = async () => {
      const activeOrg = store?.user?.activeOrganization;
      const organisationId = activeOrg?.uuid || activeOrg?.id;

      if (!organisationId || !isGebruikBeheerdersFlow) return;

      try {
        await store.object.fetchObject(
          'voorzieningen',
          'organisatie',
          organisationId,
          {
            '_extend[]': ['@self.schema'],
          }
        );

        const fullOrgData = store.object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );

        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);
        }
      } catch (error) {
        console.error('Error fetching full organization data:', error);
      }
    };

    fetchFullOrganisationData();
  }, [
    store?.user?.activeOrganization?.uuid,
    store?.user?.activeOrganization?.id,
    store,
    isGebruikBeheerdersFlow,
  ]);

  // Fetch deelnemers from current logged-in organization (for gebruik beheerder flow)
  useEffect(() => {
    const fetchDeelnemers = async () => {
      const activeOrg = store?.user?.activeOrganization;
      const organisationId = activeOrg?.uuid || activeOrg?.id;

      if (!organisationId || !isGebruikBeheerdersFlow) return;

      try {
        setDeelnemersLoading(true);
        await store.object.fetchObject(
          'voorzieningen',
          'organisatie',
          organisationId,
          {
            '_extend[]': ['@self.schema', 'deelnemers'],
          }
        );

        const fullOrgData = store.object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );

        if (fullOrgData) {
          // Process deelnemers into options format
          const deelnemers = Array.isArray(fullOrgData?.deelnemers)
            ? fullOrgData.deelnemers
            : [];

          // Map deelnemers to options format
          const options = deelnemers
            .filter((deelnemer) => {
              // Filter out invalid deelnemers
              const id =
                typeof deelnemer === 'object'
                  ? deelnemer?.id || deelnemer?.['@self']?.id
                  : deelnemer;
              return id && id !== 'undefined' && id !== 'null';
            })
            .map((deelnemer) => {
              // Handle both object format and string (UUID) format
              if (typeof deelnemer === 'object') {
                const id = deelnemer?.id || deelnemer?.['@self']?.id;
                const label =
                  deelnemer?.naam ||
                  deelnemer?.['@self']?.name ||
                  deelnemer?.name ||
                  id;
                return {
                  value: String(id),
                  label: String(label),
                  data: deelnemer,
                };
              }
              // If it's just a string (UUID), use it as both value and label
              return {
                value: String(deelnemer),
                label: String(deelnemer),
                data: null,
              };
            });

          setDeelnemerOptions(options);
        }
      } catch (error) {
        console.error('Error fetching deelnemers from organization:', error);
        setDeelnemerOptions([]);
      } finally {
        setDeelnemersLoading(false);
      }
    };

    fetchDeelnemers();
  }, [
    store?.user?.activeOrganization?.uuid,
    store?.user?.activeOrganization?.id,
    store,
    isGebruikBeheerdersFlow,
  ]);

  // Fetch diensten when applicatie is selected (Gebruik-beheerders flow)
  useEffect(() => {
    if (!isGebruikBeheerdersFlow) return;
    const applicatieId = selectedApplicatie?.value;
    if (applicatieId) {
      fetchDienstenForApplicatie(applicatieId);
    } else {
      setDienstenResults([]);
      setResolvedModulesFromDiensten([]);
    }
  }, [selectedApplicatie, isGebruikBeheerdersFlow, fetchDienstenForApplicatie]);

  // Handle redirect from Aanbod-beheerders flow (Gebruik-beheerders flow)
  useEffect(() => {
    if (!isGebruikBeheerdersFlow || !dienstFromUrl || isEditMode) return;

    const handleRedirect = async () => {
      try {
        // Fetch the dienst that was just created
        await store.object.fetchObject(
          'voorzieningen',
          'dienst',
          String(dienstFromUrl),
          {
            '_extend[]': ['@self.schema'],
            _published: 'false',
          }
        );
        const fetchedDienst = store.object.getObject(
          'voorzieningen_dienst',
          String(dienstFromUrl)
        );

        if (fetchedDienst) {
          // Get the applicatie from the dienst's modules array
          const modules = Array.isArray(fetchedDienst.modules)
            ? fetchedDienst.modules
            : [];
          const applicatieId =
            modules.length > 0
              ? String(
                  typeof modules[0] === 'object'
                    ? modules[0]?.id ||
                        modules[0]?.value ||
                        modules[0]?.['@self']?.id ||
                        ''
                    : modules[0] || ''
                )
              : null;

          if (applicatieId) {
            // Fetch applicatie and add to options
            try {
              await store.object.fetchObject(
                'voorzieningen',
                'module',
                applicatieId,
                {
                  '_extend[]': ['@self.schema'],
                  _published: 'false',
                  _source: 'index',
                }
              );
              const applicatieData = store.object.getObject(
                'voorzieningen_module',
                applicatieId
              );
              if (applicatieData) {
                const applicatieOption = mapToOption(applicatieData, 0);
                setOwnAppOptions((prev) => {
                  const exists = prev.some(
                    (o) => o.value === applicatieOption.value
                  );
                  return exists ? prev : [...prev, applicatieOption];
                });
                setSelectedApplicatie(applicatieOption);
              }
            } catch (error) {
              console.error('Error fetching applicatie for redirect:', error);
            }
          }

          // Auto-select the dienst
          setGebruikData('diensten', [String(dienstFromUrl)]);

          // Auto-advance to next step (Gebruiksinformatie)
          stepper.setCurrentStepByLabel('gebruiksinformatie');
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
      }
    };

    handleRedirect();
  }, [dienstFromUrl, isGebruikBeheerdersFlow, isEditMode, store, stepper]);

  // Keep dienst.modules in sync with current selection
  useEffect(() => {
    setDienstData('modules', selectedModuleIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleIds]);

  // Keep dienst.koppelingen in sync with current selection
  useEffect(() => {
    setDienstData('koppelingen', selectedKoppelingIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKoppelingIds]);

  // TODO: remove eslint-disable if koppelingen are needed
  // eslint-disable-next-line no-unused-vars
  const loadKoppelingenForModules = async () => {
    try {
      if (!selectedModuleIds || selectedModuleIds.length === 0) {
        setKoppelingOptions([]);
        return;
      }

      // Fetch each selected module to read its koppelingen array
      const moduleFetches = selectedModuleIds.map((id) =>
        fetch(
          `${BASE_URL}/openregister/api/objects/voorzieningen/module/${id}?_published=false`,
          {
            headers: { Accept: 'application/json' },
          }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
      const moduleResults = await Promise.allSettled(moduleFetches);

      // Collect koppeling UUIDs from all modules (duplicates may exist)
      const collectedKoppelingIds = [];
      moduleResults.forEach((res) => {
        const mod = res.status === 'fulfilled' ? res.value : null;
        const ids = Array.isArray(mod?.koppelingen) ? mod.koppelingen : [];
        ids.forEach((k) => {
          // Handle both string UUIDs and object formats
          let id = '';
          if (typeof k === 'string' && k.trim()) {
            id = k.trim();
          } else if (typeof k === 'object' && k !== null) {
            id = String(
              k?.id || k?.value || k?.uuid || k?.slug || k?.['@self']?.id || ''
            );
          }
          if (id) collectedKoppelingIds.push(id);
        });
      });

      if (collectedKoppelingIds.length === 0) {
        setKoppelingOptions([]);
        return;
      }

      // Deduplicate and fetch each koppeling by ID
      const uniqueKoppelingIds = Array.from(new Set(collectedKoppelingIds));
      const koppelingFetches = uniqueKoppelingIds.map((id) =>
        fetch(
          `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling/${id}?_published=false`,
          {
            headers: { Accept: 'application/json' },
          }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
      const koppelingResults = await Promise.allSettled(koppelingFetches);

      const seen = new Map();
      koppelingResults.forEach((res, idx) => {
        const item = res.status === 'fulfilled' ? res.value : null;
        if (!item) return;
        const id = String(
          item?.id || item?.['@self']?.id || uniqueKoppelingIds[idx] || ''
        );
        if (!id || seen.has(id)) return;
        const moduleA = item?.['@self']?.relations?.moduleA || item?.moduleA || '-';
        const moduleB = item?.['@self']?.relations?.moduleB || item?.moduleB || '-';
        const label = String(item?.naam || `${moduleA} ↔ ${moduleB}`);
        seen.set(id, { value: id, label, data: item });
      });

      setKoppelingOptions(Array.from(seen.values()));
    } catch (e) {
      setKoppelingOptions([]);
    }
  };

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const renderStep = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Gebruik-beheerders flow (ontbrekend-dienst)
    if (isGebruikBeheerdersFlow) {
      switch (stepLabel) {
        case 'dienst-zoeken':
          return (
            <ConFormDienstZoekenStage
              loading={prefillLoading || schemasLoading}
              ownAppOptions={ownAppOptions}
              ownApp={selectedApplicatie}
              setOwnApp={setSelectedApplicatie}
              ownAppLoading={ownAppLoading}
              searchResults={dienstenResults}
              resolvedModulesFromResults={resolvedModulesFromDiensten}
              resultsLoading={dienstenResultsLoading}
              isEditMode={isEditMode}
              onSearchModules={debouncedSearchModulesForDienstZoeken}
              schemas={schemas}
              selectedDienstIds={gebruik.diensten}
              setSelectedDienstIds={(ids) => setGebruikData('diensten', ids)}
              // New dienst creation props
              dienstKeuze={dienstKeuze}
              setDienstKeuze={setDienstKeuze}
              nieuweDienst={nieuweDienst}
              setNieuweDienstData={setNieuweDienstData}
              // Leverancier props
              leverancierKeuze={leverancierKeuze}
              setLeverancierKeuze={setLeverancierKeuze}
              leverancierOrganisatie={leverancierOrganisatie}
              setLeverancierOrganisatieData={setLeverancierOrganisatieData}
              leverancierOptions={leverancierOptions}
              leverancierLoading={leverancierLoading}
              searchLeveranciers={debouncedSearchLeveranciers}
              // Type options
              dienstTypeOptions={dienstTypeOptions}
            />
          );
        case 'gebruiksinformatie':
          return (
            <ConFormGebruiksinformatieStage
              status={gebruik.status}
              setStatus={(value) => setGebruikData('status', value)}
              interneAantekening={gebruik.interneAantekening}
              setInterneAantekening={(value) =>
                setGebruikData('interneAantekening', value)
              }
              loading={prefillLoading || schemasLoading}
              schemas={schemas}
              isEditMode={isEditMode}
            />
          );
        case 'deelnemers':
          return (
            <ConFormDeelnemersStage
              deelnemers={gebruik.deelnemers}
              setDeelnemers={(value) => setGebruikData('deelnemers', value)}
              loading={prefillLoading || schemasLoading}
              deelnemerOptions={deelnemerOptions}
              deelnemersLoading={deelnemersLoading}
            />
          );
        case 'controleren':
          return (
            <ConFormControlerenStage
              isGebruikBeheerdersFlow={true}
              gebruik={gebruik}
              dienstenResults={dienstenResults}
              deelnemerOptions={deelnemerOptions}
              dienst={dienst}
              selectedModuleIds={selectedModuleIds}
              moduleOptionsByProduct={productToModulesLookup}
              selectedKoppelingIds={selectedKoppelingIds}
              koppelingOptions={koppelingOptions}
              userStore={store.user}
              dienstType={dienstType}
              formType={formType}
              // New dienst creation props
              dienstKeuze={dienstKeuze}
              nieuweDienst={nieuweDienst}
              leverancierKeuze={leverancierKeuze}
              leverancierOrganisatie={leverancierOrganisatie}
              ownApp={selectedApplicatie}
            />
          );
        default:
          return null;
      }
    }

    // Aanbod-beheerders flow (dienst) - existing flow
    switch (stepLabel) {
      case 'applicaties':
        return (
          <ConFormApplicatiesStage
            selectedModuleIds={selectedModuleIds}
            setSelectedModuleIds={setSelectedModuleIds}
            loadingModules={modulesLoading || applicatiePreloadLoading}
            searchLoading={searchLoading}
            moduleOptions={moduleOptions}
            searchModules={debouncedSearchModules}
            schemas={schemas}
            dienstType={dienstType}
          />
        );
      case 'dienst-informatie':
        return (
          <ConFormDienstInformatieStage
            dienst={dienst}
            setDienstData={setDienstData}
            loading={schemasLoading}
            touched={touched}
            schemas={schemas}
            userStore={store.user}
            dienstType={dienstType}
          />
        );
      case 'controleren':
        return (
          <ConFormControlerenStage
            dienst={dienst}
            selectedModuleIds={selectedModuleIds}
            moduleOptionsByProduct={productToModulesLookup}
            selectedKoppelingIds={selectedKoppelingIds}
            koppelingOptions={koppelingOptions}
            userStore={store.user}
            dienstType={dienstType}
            formType={formType}
          />
        );
      default:
        return null;
    }
  };

  const currentStepName = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'dienst-zoeken':
        return 'Dienst zoeken';
      case 'gebruiksinformatie':
        return 'Gebruiksinformatie';
      case 'deelnemers':
        return 'Deelnemers';
      case 'applicaties':
        return 'Applicaties';
      case 'dienst-informatie':
        return 'Dienst informatie';
      case 'controleren':
        return 'Controleer uw gegevens';
      default:
        return '';
    }
  };

  // Check if we need to show the deelnemers step (when organization type is Samenwerking)
  const organizationType = fullActiveOrganisation?.type || '';
  const needsDeelnemersStep =
    isGebruikBeheerdersFlow && organizationType === 'Samenwerking';

  // ProcessSteps configuration
  const processStepsConfig = useMemo(() => {
    const steps = [];

    stepper.resetStepDefinitions('process-steps');
    stepper.resetStepDefinitions('process-steps-status');

    if (isGebruikBeheerdersFlow) {
      // Gebruik-beheerders flow steps
      steps.push({
        id: 'dienst-zoeken-step',
        marker: stepper.defineStep('process-steps', 'dienst-zoeken'),
        status: getStatus(
          stepper.getCurrentStep(),
          stepper.defineStep('process-steps-status')
        ),
        title: 'Dienst zoeken',
      });

      steps.push({
        id: 'gebruiksinformatie-step',
        marker: stepper.defineStep('process-steps', 'gebruiksinformatie'),
        status: getStatus(
          stepper.getCurrentStep(),
          stepper.defineStep('process-steps-status')
        ),
        title: 'Gebruiksinformatie',
      });

      // Conditionally add Deelnemers step
      if (needsDeelnemersStep) {
        steps.push({
          id: 'deelnemers-step',
          marker: stepper.defineStep('process-steps', 'deelnemers'),
          status: getStatus(
            stepper.getCurrentStep(),
            stepper.defineStep('process-steps-status')
          ),
          title: 'Deelnemers',
        });
      }

      steps.push({
        id: 'controleren-step',
        marker: stepper.defineStep('process-steps', 'controleren'),
        status: getStatus(
          stepper.getCurrentStep(),
          stepper.defineStep('process-steps-status')
        ),
        title: 'Controleren',
      });
    } else {
      // Aanbod-beheerders flow steps (existing flow)
      const currentStepNum = stepper.getCurrentStep();

      steps.push({
        id: 'a9p0p1l2-i3c4-a5t6-i7e8-s9t0a1g2e3f4',
        marker: stepper.defineStep('process-steps', 'applicaties'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Applicaties',
      });

      steps.push({
        id: 'd1e2n3s4-t5i6-n7f8-o9r0-m1a2t3i4e5f6',
        marker: stepper.defineStep('process-steps', 'dienst-informatie'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Dienst informatie',
      });

      steps.push({
        id: 'c5o6n7t8-r9o0-l1e2-r3e4-n5s6t7a8g9e0',
        marker: stepper.defineStep('process-steps', 'controleren'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Controleren',
      });
    }

    return steps;
  }, [stepper, isGebruikBeheerdersFlow, needsDeelnemersStep]);

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

  // Validation mirroring product form style
  const getDisabledStatus = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'dienst-zoeken':
        // If creating a new dienst, check required fields
        if (dienstKeuze === 'nieuw') {
          // Require applicatie
          if (!selectedApplicatie?.value) return true;
          // Require leverancier (either selected or new with naam+website)
          if (leverancierKeuze === 'bestaand') {
            if (!nieuweDienst.leverancier) return true;
          } else {
            // Creating new leverancier - require naam and website
            if (!leverancierOrganisatie.naam?.trim()) return true;
            if (!leverancierOrganisatie.website?.trim()) return true;
            if (!validateWebsite(leverancierOrganisatie.website.trim())) return true;
          }
          // Require dienst naam and type
          if (!nieuweDienst.naam?.trim()) return true;
          if (!nieuweDienst.type) return true;
          // Website is optional but validate if provided
          if (
            nieuweDienst.website?.trim() &&
            !validateWebsite(nieuweDienst.website.trim())
          )
            return true;
          return false;
        }
        // Existing dienst flow: require applicatie and at least one dienst selection
        return (
          !selectedApplicatie?.value ||
          !gebruik.diensten ||
          gebruik.diensten.length === 0
        );
      case 'applicaties':
        // Applicaties: at least one applicatie selected
        return selectedModuleIds.length === 0;
      case 'dienst-informatie': {
        // Dienst informatie: Respect schema requiredness
        const naamRequired = isSchemaFieldRequired('dienst', 'naam');
        const websiteRequired = isSchemaFieldRequired('dienst', 'website');
        const soortRequired = isSchemaFieldRequired('dienst', 'type');
        const missingSoort =
          soortRequired && (!Array.isArray(dienst.type) || dienst.type.length === 0);

        const missingNaam = naamRequired && (!dienst.naam || !dienst.naam.trim());
        const missingWebsite =
          websiteRequired && (!dienst.website || !dienst.website.trim());
        if (missingNaam || missingWebsite || missingSoort) return true;

        // If website is provided, validate its format; if empty and not required, it's allowed
        if (dienst.website && dienst.website.trim()) {
          const website = dienst.website.trim();
          if (!validateWebsite(website)) return true;
        }
        return false;
      }
      case 'gebruiksinformatie':
        // Require status to be selected
        return !gebruik.status;
      case 'deelnemers':
      case 'controleren':
        // Other steps validation to be added when stages are implemented
        return false;
      default:
        return false;
    }
  };

  const getDisabledTooltip = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'dienst-zoeken': {
        const messages = [];
        if (!selectedApplicatie?.value) {
          messages.push('Selecteer een applicatie');
        }
        if (dienstKeuze === 'nieuw') {
          // New dienst validation messages
          if (leverancierKeuze === 'bestaand') {
            if (!nieuweDienst.leverancier) {
              messages.push('Selecteer een leverancier');
            }
          } else {
            if (!leverancierOrganisatie.naam?.trim()) {
              messages.push('Leverancier naam is verplicht');
            }
            if (!leverancierOrganisatie.website?.trim()) {
              messages.push('Leverancier website is verplicht');
            } else if (!validateWebsite(leverancierOrganisatie.website.trim())) {
              messages.push('Leverancier website heeft een ongeldig formaat');
            }
          }
          if (!nieuweDienst.naam?.trim()) {
            messages.push('Dienst naam is verplicht');
          }
          if (!nieuweDienst.type) {
            messages.push('Dienst type is verplicht');
          }
          if (
            nieuweDienst.website?.trim() &&
            !validateWebsite(nieuweDienst.website.trim())
          ) {
            messages.push('Dienst website heeft een ongeldig formaat');
          }
        } else {
          // Existing dienst validation
          if (!gebruik.diensten || gebruik.diensten.length === 0) {
            messages.push('Selecteer minimaal één dienst');
          }
        }
        return messages.join('\n');
      }
      case 'applicaties':
        return selectedModuleIds.length === 0
          ? 'Selecteer minimaal één applicatie'
          : '';
      case 'dienst-informatie': {
        const messages = [];
        const naamRequired = isSchemaFieldRequired('dienst', 'naam');
        const websiteRequired = isSchemaFieldRequired('dienst', 'website');
        const soortRequired = isSchemaFieldRequired('dienst', 'type');

        if (naamRequired && (!dienst.naam || !dienst.naam.trim())) {
          messages.push('Dienstnaam is verplicht');
        }
        if (
          soortRequired &&
          (!Array.isArray(dienst.type) || dienst.type.length === 0)
        ) {
          messages.push('Soort dienst is verplicht');
        }
        if (websiteRequired && (!dienst.website || !dienst.website.trim())) {
          messages.push('Website is verplicht');
        } else if (dienst.website && dienst.website.trim()) {
          const website = dienst.website.trim();
          if (!validateWebsite(website)) {
            messages.push(
              'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)'
            );
          }
        }
        return messages.join('\n');
      }
      case 'gebruiksinformatie': {
        const messages = [];
        if (!gebruik.status) {
          messages.push('Status is verplicht');
        }
        return messages.join('\n');
      }
      case 'deelnemers':
      case 'controleren':
        // Other steps validation messages to be added when stages are implemented
        return '';
      default:
        return '';
    }
  };

  const handleSaveDienst = async () => {
    setSaving(true);
    setSaveResult(null);
    setSaveErrorMessage('');
    try {
      // Handle Gebruik-beheerders flow (save gebruik object)
      if (isGebruikBeheerdersFlow) {
        // Common validation
        if (!gebruik.status) {
          setSaveErrorMessage('Status is verplicht.');
          setSaveResult('error');
          return;
        }

        const activeOrg = store?.user?.activeOrganization;
        const afnemerId = activeOrg?.uuid || activeOrg?.id;
        if (!afnemerId) {
          setSaveErrorMessage('Geen actieve organisatie gevonden. Log opnieuw in.');
          setSaveResult('error');
          return;
        }

        if (!selectedApplicatie?.value) {
          setSaveErrorMessage('Selecteer een applicatie.');
          setSaveResult('error');
          return;
        }

        let finalDienstIds = gebruik.diensten || [];

        // If creating a new dienst, we need to create it first
        if (dienstKeuze === 'nieuw') {
          let finalLeverancierId = nieuweDienst.leverancier;

          // Step 1: Create new leverancier if needed
          if (leverancierKeuze === 'nieuw') {
            try {
              const newLeverancierData = {
                naam: leverancierOrganisatie.naam,
                website: leverancierOrganisatie.website,
              };

              const createdLeverancier = await store.object.createObject(
                'voorzieningen',
                'organisatie',
                newLeverancierData
              );

              finalLeverancierId =
                createdLeverancier?.id || createdLeverancier?.['@self']?.id;

              if (!finalLeverancierId) {
                throw new Error('Leverancier aangemaakt maar geen ID ontvangen');
              }
            } catch (leverancierError) {
              console.error('Failed to create leverancier:', leverancierError);
              setSaveErrorMessage(
                'Er is een fout opgetreden bij het aanmaken van de leverancier. Probeer het opnieuw.'
              );
              setSaveResult('error');
              return;
            }
          }

          // Step 2: Create the new dienst
          try {
            const newDienstData = {
              naam: nieuweDienst.naam,
              website: nieuweDienst.website || '',
              type: nieuweDienst.type,
              aanbieder: finalLeverancierId,
            };

            const createdDienst = await store.object.createObject(
              'voorzieningen',
              'dienst',
              newDienstData
            );

            const newDienstId = createdDienst?.id || createdDienst?.['@self']?.id;

            if (!newDienstId) {
              throw new Error('Dienst aangemaakt maar geen ID ontvangen');
            }

            // Use the newly created dienst ID
            finalDienstIds = [newDienstId];
          } catch (dienstError) {
            console.error('Failed to create dienst:', dienstError);
            setSaveErrorMessage(
              'Er is een fout opgetreden bij het aanmaken van de dienst. Probeer het opnieuw.'
            );
            setSaveResult('error');
            return;
          }
        } else {
          // Using existing dienst(en) - validate at least one is selected
          if (!finalDienstIds || finalDienstIds.length === 0) {
            setSaveErrorMessage('Selecteer minimaal één dienst.');
            setSaveResult('error');
            return;
          }
        }

        // Step 3: Build payload for gebruik object
        const payload = {
          diensten: finalDienstIds,
          status: gebruik.status,
          interneAantekening: gebruik.interneAantekening || '',
          deelnemers: Array.isArray(gebruik.deelnemers) ? gebruik.deelnemers : [],
          afnemer: afnemerId,
          module: selectedApplicatie.value,
        };

        if (isEditMode) {
          // Update existing gebruik object
          await store.object.updateObject(
            'voorzieningen',
            'gebruik',
            String(gebruikId),
            payload
          );
        } else {
          // Create new gebruik object
          await store.object.createObject('voorzieningen', 'gebruik', payload);
        }
        setSaveResult('success');
        return;
      }

      // Handle Aanbod-beheerders flow (save dienst object)
      // Note: In this file (gebruik-dienst), we only create new diensten, never edit them
      // Editing diensten is done in the separate aanbod-beheerder dienst form
      let finalAanbieder = dienst.aanbieder;

      const payload = {
        ...dienst,
        aanbieder: finalAanbieder,
        producten: [], // Producten selection commented out
        modules: selectedModuleIds,
        koppelingen: selectedKoppelingIds,
        // Include service type for processing
        dienstType: dienstType,
      };

      await store.object.createObject('voorzieningen', 'dienst', payload);
      setSaveResult('success');
    } catch (error) {
      console.error('Error saving dienst:', error);
      // Extract error message from the error object
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Onbekende fout bij het opslaan.';
      setSaveErrorMessage(errorMessage);
      setSaveResult('error');
    } finally {
      setSaving(false);
    }
  };

  const { icon: Icon, name: wizardName } = useMemo(
    () => getActiveWizard() || {},
    [dienstType]
  );

  const wizardType = isEditMode
    ? 'update'
    : dienstType === 'ontbrekend-dienst'
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
              {isEditMode
                ? 'Gebruik bewerken'
                : isGebruikBeheerdersFlow
                ? 'Toevoegen dienst'
                : `Een ${wizardName}`}
            </Heading1>
            <Paragraph>
              {isEditMode
                ? 'Werk uw gebruiksregistratie bij. U kunt de geselecteerde diensten, status en andere gegevens aanpassen.'
                : isGebruikBeheerdersFlow
                ? 'Zoek naar diensten die op de applicaties in uw applicatielandschap worden uitgevoerd. Zoek op de naam van de betrokken applicatie.\n\nAlle relevante diensten die relevant zijn voor uw eigen applicaties worden weergegeven.\nBestaat de dienst nog niet, dan kunt u deze toevoegen.\n\nNa het selecteren van de gewenste dienst kunt u in de volgende stappen aanvullende informatie opvoeren.'
                : 'Voer de gegevens van de dienst in, selecteer relevante applicaties en controleer uw invoer.'}
            </Paragraph>
          </div>

          {/* End header block */}

          {saveResult === 'success' ? (
            <div>
              <Heading1>
                {isEditMode
                  ? '🎉 Gebruik succesvol geüpdatet!'
                  : '🎉 Gebruik succesvol aangemeld!'}
              </Heading1>
              <Alert type='ok'>
                <Paragraph>
                  <strong>
                    {isEditMode
                      ? 'Uw gebruiksregistratie is succesvol bijgewerkt!'
                      : 'Uw gebruiksregistratie is succesvol aangemaakt!'}
                  </strong>
                </Paragraph>
                <Paragraph>
                  De geselecteerde diensten en gebruiksinformatie zijn opgeslagen.
                </Paragraph>
              </Alert>
              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <UnorderedList>
                  <UnorderedListItem>
                    De dienst wordt zichtbaar in de softwarecatalogus
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Organisaties kunnen de dienst bekijken en beoordelen
                  </UnorderedListItem>
                  <UnorderedListItem>
                    U kunt de dienst beheren via het beheer dashboard
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
                  icon={<VISUALS.HAND_SHAKE />}
                  onClick={() => {
                    setSaveResult(null);
                    stepper.resetCurrentStep();
                    setDienst({
                      naam: '',
                      beschrijvingKort: '',
                      beschrijvingLang: '',
                      website: '',
                      logo: '',
                      contactpersoon: null,
                      aanbieder: '',
                      type: [],
                      producten: [],
                      modules: [],
                      koppelingen: [],
                    });
                  }}
                  sx={{ marginLeft: '1rem' }}
                >
                  Nieuwe dienst aanmelden
                </AcButton>
              </div>
            </div>
          ) : (
            <div>
              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName()}
                </h3>
              </div>

              <div className='ac-register-container ac-forms-product'>
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps steps={processStepsConfig} />
                </div>

                <div className='ac-register-form-container'>
                  {!isGebruikBeheerdersFlow && (
                    <ConDebugViewer data={dienst} title='Dienst object' />
                  )}
                  {isGebruikBeheerdersFlow && (
                    <ConDebugViewer data={gebruik} title='Gebruik object' />
                  )}

                  {saveResult === 'error' && (
                    <Alert type='error'>
                      Er is een fout opgetreden bij het opslaan.
                      {saveErrorMessage && (
                        <Paragraph style={{ marginTop: '0.5rem' }}>
                          <strong>Details:</strong> {saveErrorMessage}
                        </Paragraph>
                      )}
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

                  {!prefillError && renderStep()}

                  <div
                    className={clsx(
                      'ac-register-form-buttons',
                      stepper.getCurrentStep() !== 1 &&
                        'ac-register-form-buttons-not-first-step'
                    )}
                  >
                    <AcFlex spacing='xs' style={{ width: 'fit-content' }}>
                      {stepper.getCurrentStep() !== 1 && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => stepper.previous()}
                          disabled={saving || schemasLoading}
                        >
                          Vorige
                        </AcButton>
                      )}
                    </AcFlex>

                    {/* "Ik kan de gewenste dienst niet vinden" / "Bestaande dienst selecteren" button for Gebruik-beheerders flow */}
                    {stepper.getStepFromLabel('dienst-zoeken') ===
                      stepper.getCurrentStep() &&
                      !isEditMode && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={
                            dienstKeuze === 'bestaand' ? (
                              <VISUALS.CUBE />
                            ) : (
                              <VISUALS.ARROW_LEFT />
                            )
                          }
                          onClick={() =>
                            setDienstKeuze(
                              dienstKeuze === 'bestaand' ? 'nieuw' : 'bestaand'
                            )
                          }
                          disabled={
                            dienstKeuze === 'bestaand' && !selectedApplicatie?.value
                          }
                          title={
                            dienstKeuze === 'bestaand' && !selectedApplicatie?.value
                              ? 'Selecteer eerst een applicatie'
                              : ''
                          }
                        >
                          {dienstKeuze === 'bestaand'
                            ? 'Ik kan de gewenste dienst niet vinden'
                            : 'Bestaande dienst selecteren'}
                        </AcButton>
                      )}

                    {/* "Ik kan de gewenste applicatie niet vinden" button for Aanbod-beheerders flow */}
                    {stepper.getStepFromLabel('applicaties') ===
                      stepper.getCurrentStep() && (
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
                        stepper.getCurrentStep() === 1 &&
                          'ac-register-form-next-button'
                      )}
                    >
                      {stepper.getLabelFromStep(stepper.getCurrentStep()) !==
                        'controleren' && (
                        <div className='ac-register-button-wrapper'>
                          <AcButton
                            style='button'
                            icon={<VISUALS.ARROW_RIGHT />}
                            onClick={() => stepper.next()}
                            disabled={
                              getDisabledStatus() ||
                              prefillLoading ||
                              saving ||
                              schemasLoading
                            }
                            title={getDisabledStatus() ? getDisabledTooltip() : ''}
                          >
                            Volgende
                          </AcButton>
                        </div>
                      )}
                    </AcFlex>

                    {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                      'controleren' && (
                      <AcButton
                        style='button'
                        buttonType='primary'
                        icon={<VISUALS.CLIPBOARD_CHECK />}
                        onClick={handleSaveDienst}
                        loading={saving}
                        disabled={saving || prefillLoading}
                      >
                        {saving
                          ? 'Bezig met opslaan...'
                          : isEditMode
                          ? 'Gebruik updaten'
                          : 'Gebruik registreren'}
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
        message={`Je staat op het punt om de dienst ${wizardType} wizard te verlaten om een applicatie aan te maken. Na het aanmaken van de applicatie word je teruggeleid naar dit formulier. Al je huidige wijzigingen zullen niet worden opgeslagen.`}
        confirmLabel='Verlaten'
        cancelLabel='Blijven'
        confirmIcon={<VISUALS.ARROW_RIGHT />}
        cancelIcon={<VISUALS.ARROW_LEFT />}
      />
    </AcSection>
  );
};

export default memo(withStore(observer(ConFormsDienst)));
