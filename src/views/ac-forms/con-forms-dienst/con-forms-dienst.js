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
import _ from 'lodash';
import {
  Heading1,
  Paragraph,
  Alert,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';
import useStepper from '../con-stepper';

// Stage components
import ConFormDienstInformatieStage from './components/con-form-dienst-informatie-stage';
// import ConFormProductenStage from './components/con-form-producten-stage';
import ConFormApplicatiesStage from './components/con-form-applicaties-stage';
import ConFormControlerenStage from './components/con-form-controleren-stage';
import ConFormDienstAanbiederInformatieStage from './components/con-form-dienst-aanbieder-informatie-stage';
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

/**
 * Helper function to normalize dienst type field
 * Fixes issue where type comes as a string containing a JSON array
 * @param {string|array} rawType - The raw type value from API
 * @returns {array} - Normalized array of type IDs
 */
const normalizeDienstType = (rawType) => {
  // If it's already an array, return it
  if (Array.isArray(rawType)) {
    return rawType;
  }

  // If it's a string that looks like a JSON array, parse it
  if (typeof rawType === 'string' && rawType.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawType);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse dienst type as JSON array:', e);
    }
  }

  // If it's a single value (string), wrap it in an array
  if (rawType) {
    return [rawType];
  }

  // Default to empty array
  return [];
};

const ConFormsDienst = ({ store, userStore }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dienstId = searchParams.get('id') || '';
  const formType = searchParams.get('type') || '';
  const applicatieFromUrl = searchParams.get('applicatie') || '';
  const isEditMode = !!dienstId;

  const stepper = useStepper();
  const processStepsRef = useRef(null);

  // Schemas
  const [schemas, setSchemas] = useState({
    dienst: null,
    suite: null,
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
  const [dienstType, setDienstType] = useState('eigen-organisatie'); // 'eigen-organisatie' or 'andere-organisatie'

  // State for aanbieder selection
  const [aanbiederKeuze, setAanbiederKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'

  /**
   * Aanbieder Organization State Object
   *
   * This object holds organization data for creating a new organization.
   * Only used when aanbiederKeuze === 'nieuw'
   */
  const [aanbiederOrganisatie, setAanbiederOrganisatie] = useState({
    naam: '',
    type: '',
    website: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    'e-mailadres': '',
    telefoonnummer: '',
    logo: '',
  });

  const setDienstData = (key, value) => {
    setDienst((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const setAanbiederOrganisatieData = useCallback((key, value) => {
    setAanbiederOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Helper to update nieuwe applicatie data
   */
  const setNieuweApplicatieData = useCallback((key, value) => {
    setNieuweApplicatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Helper to update nieuwe leverancier data
   */
  const setNieuweLeverancierData = useCallback((key, value) => {
    setNieuweLeverancier((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Search for leveranciers (organisations)
   */
  const searchLeveranciers = useCallback(
    async (query) => {
      setLeverancierLoading(true);
      try {
        const params = new URLSearchParams({
          _limit: '20',
          _page: '1',
          _published: 'false',
        });
        if (query) params.set('_search', query);
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/organisatie?${params}`;
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
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
            `Organisatie ${index + 1}`;
          return {
            value: String(id),
            label: String(label),
            data: item,
          };
        });
        setLeverancierOptions(options);
      } catch (error) {
        console.error('Failed to search leveranciers:', error);
        setLeverancierOptions([]);
      } finally {
        setLeverancierLoading(false);
      }
    },
    []
  );

  // productId -> module options derived from product details
  const [productToModulesLookup, setProductToModulesLookup] = useState({});
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [applicatiePreloadLoading, setApplicatiePreloadLoading] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);
  const moduleOptionsRef = useRef([]);

  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [selectedKoppelingIds, setSelectedKoppelingIds] = useState([]);

  // New application flow state (for creating applications that don't exist)
  const [showNewApplicatieForm, setShowNewApplicatieForm] = useState(false);
  const [nieuweApplicatie, setNieuweApplicatie] = useState({
    naam: '',
    website: '',
    beschrijvingKort: '',
    leverancier: null,
  });
  const [leverancierKeuze, setLeverancierKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [nieuweLeverancier, setNieuweLeverancier] = useState({
    naam: '',
    website: '',
    type: '',
  });

  // Leverancier options for new application flow
  const [leverancierOptions, setLeverancierOptions] = useState([]);
  const [leverancierLoading, setLeverancierLoading] = useState(false);

  // Diensten display state (for showing diensten related to selected applicaties)
  const [dienstenResults, setDienstenResults] = useState([]);
  const [dienstenResultsLoading, setDienstenResultsLoading] = useState(false);
  const [resolvedModulesFromDiensten, setResolvedModulesFromDiensten] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Unsaved changes alert
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  // Prefill dienst data when editing
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        await store.object.fetchObject('voorzieningen', 'dienst', String(dienstId), {
          '_extend[]': ['_schema'],
        });
        if (cancelled) return;

        const fetched = store.object.getObject(
          'voorzieningen_dienst',
          String(dienstId)
        );
        if (!fetched) return;

        // Map fetched dienst to local state shape
        const mapId = (item) =>
          item && typeof item === 'object'
            ? String(item.id || item.value || item.uuid || item.slug || '')
            : String(item || '');

        const prefilledModuleIds = Array.isArray(fetched.modules)
          ? fetched.modules.map((m) => mapId(m)).filter(Boolean)
          : [];
        const prefilledKoppelingIds = Array.isArray(fetched.koppelingen)
          ? fetched.koppelingen.map((k) => mapId(k)).filter(Boolean)
          : [];

        // Fetch missing modules from edit data and add to options
        if (prefilledModuleIds.length > 0) {
          const currentModuleOptions = moduleOptionsRef.current;
          const existingModuleIds = new Set(
            currentModuleOptions.map((opt) => opt.value)
          );
          const missingModuleIds = prefilledModuleIds.filter(
            (id) => !existingModuleIds.has(id)
          );

          if (missingModuleIds.length > 0 && !cancelled) {
            const moduleFetches = missingModuleIds.map((id) =>
              store.object
                .fetchObject('voorzieningen', 'module', String(id), {
                  '_extend[]': ['_schema'],
                })
                .then(() => {
                  if (cancelled) return null;
                  return store.object.getObject('voorzieningen_module', String(id));
                })
                .catch(() => null)
            );

            const moduleResults = await Promise.allSettled(moduleFetches);
            if (!cancelled) {
              const newOptions = moduleResults
                .map((result, index) => {
                  if (result.status === 'fulfilled' && result.value) {
                    return mapToOption(result.value, index);
                  }
                  return null;
                })
                .filter(Boolean);

              if (newOptions.length > 0) {
                setModuleOptions((prev) => {
                  const existingValues = new Set(prev.map((opt) => opt.value));
                  const uniqueNewOptions = newOptions.filter(
                    (opt) => !existingValues.has(opt.value)
                  );
                  return [...prev, ...uniqueNewOptions];
                });
              }
            }
          }
        }

        // Normalize type field - handle case where it's a string containing JSON array
        const prefilledType = normalizeDienstType(fetched.type);

        // Update main dienst object
        setDienst((prev) => ({
          ...prev,
          naam: fetched.naam || '',
          beschrijvingKort: fetched.beschrijvingKort || '',
          beschrijvingLang: fetched.beschrijvingLang || '',
          website: fetched.website || '',
          logo: fetched.logo || '',
          contactpersoon: fetched.contactpersoon || null,
          aanbieder: fetched.aanbieder || '',
          type: prefilledType,
          producten: [], // Producten prefill commented out
          modules: prefilledModuleIds,
          koppelingen: prefilledKoppelingIds,
        }));

        // Initialize dienstType from API or default to 'eigen-organisatie'
        setDienstType(
          (typeof fetched.dienstType === 'string' && fetched.dienstType) ||
            'eigen-organisatie'
        );

        setSelectedModuleIds(prefilledModuleIds);
        setSelectedKoppelingIds(prefilledKoppelingIds);
      } catch (e) {
        setPrefillError(
          'Het laden van de dienst is mislukt. Probeer het opnieuw of start een nieuwe dienst.'
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
  }, [isEditMode, dienstId, prefillRetry, store]);

  // Ensure /me is refreshed when the wizard mounts (so stages can read active organisation)
  useEffect(() => {
    if (typeof userStore?.fetchUserProfile === 'function') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info(
          'ConFormsDienst - refreshing /me via userStore.fetchUserProfile'
        );
      }
      userStore.fetchUserProfile();
    }
  }, [userStore]);

  // Load schemas through object store (auth-aware)
  useEffect(() => {
    const load = async () => {
      setSchemasLoading(true);
      const types = ['dienst', 'product', 'module', 'koppeling', 'organisatie'];
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
                '_extend[]': ['_schema'],
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

  // Server-side search for modules (searches all modules)
  const searchModules = useCallback(
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
          'dienst_form_search'
        );
        const collection = store.object.getCollection(
          'voorzieningen_module_dienst_form_search'
        );
        const list = collection?.results || collection || [];
        const options = list.map(mapToOption);

        // Add search results to existing options (don't replace, merge)
        setModuleOptions((prevOptions) => {
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
        setSearchLoading(false);
      }
    },
    [store]
  );

  // Debounced search function
  const debouncedSearchModules = useDebouncedInput(searchModules, 250, {
    disableInstantValidation: true,
  });

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

  // Fetch diensten for the selected applicaties (to display as read-only cards)
  const fetchDienstenForApplicaties = useCallback(
    async (applicatieIds) => {
      if (!applicatieIds || applicatieIds.length === 0) {
        setDienstenResults([]);
        setResolvedModulesFromDiensten([]);
        return;
      }

      setDienstenResultsLoading(true);
      try {
        // Collect all diensten for all selected applicaties
        const allDiensten = [];
        const seenDienstIds = new Set();

        for (const applicatieId of applicatieIds) {
          // Query diensten where modules array contains applicatie ID
          const params = new URLSearchParams({
            _limit: '50',
            _page: '1',
          });
          params.append('modules', String(applicatieId));

          await store.object.fetchCollection(
            'voorzieningen',
            'dienst',
            Object.fromEntries(params),
            null,
            `dienst_for_app_${applicatieId}`
          );
          const collection = store.object.getCollection(
            `voorzieningen_dienst_dienst_for_app_${applicatieId}`
          );
          const list = collection?.results || collection || [];

          // Add unique diensten
          list.forEach((dienstItem) => {
            const dienstId = dienstItem?.id || dienstItem?.['@self']?.id || '';
            if (dienstId && !seenDienstIds.has(dienstId)) {
              seenDienstIds.add(dienstId);
              allDiensten.push(dienstItem);
            }
          });
        }

        setDienstenResults(allDiensten);

        // Collect module IDs from diensten for resolution
        const moduleIds = new Set();
        allDiensten.forEach((dienstItem) => {
          const modules = Array.isArray(dienstItem.modules)
            ? dienstItem.modules
            : [];
          modules.forEach((m) => {
            const id =
              typeof m === 'string'
                ? m
                : String(m?.id || m?.value || m?.['@self']?.id || '');
            if (id) moduleIds.add(id);
          });
        });

        // Resolve module labels using current moduleOptionsRef
        const currentModuleOptions = moduleOptionsRef.current;
        const resolved = [];
        for (const moduleId of Array.from(moduleIds)) {
          // Check if already in moduleOptions
          const existing = currentModuleOptions.find(
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
                  '_extend[]': ['_schema'],
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
    [store]
  );

  // Fetch diensten when applicaties selection changes
  useEffect(() => {
    if (selectedModuleIds.length > 0) {
      fetchDienstenForApplicaties(selectedModuleIds);
    } else {
      setDienstenResults([]);
      setResolvedModulesFromDiensten([]);
    }
  }, [selectedModuleIds]);

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

  // Add click handlers to ProcessSteps for navigation
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step-header, .denhaag-process-steps .denhaag-process-steps__sub-step'
      );

      stepElements.forEach((stepEl, index) => {
        const stepNumber = index + 1;

        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        if (stepNumber < stepper.getCurrentStep()) {
          stepEl.classList.add('ac-step-clickable');
          stepEl.onclick = (e) => {
            e.preventDefault();
            stepper.setCurrentStep(stepNumber);
          };
        }
      });
    };

    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [stepper.getCurrentStep()]);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const renderStep = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

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
            dienstenResults={dienstenResults}
            dienstenResultsLoading={dienstenResultsLoading}
            resolvedModulesFromDiensten={resolvedModulesFromDiensten}
            showNewApplicatieForm={showNewApplicatieForm}
            nieuweApplicatie={nieuweApplicatie}
            setNieuweApplicatieData={setNieuweApplicatieData}
            leverancierKeuze={leverancierKeuze}
            setLeverancierKeuze={setLeverancierKeuze}
            nieuweLeverancier={nieuweLeverancier}
            setNieuweLeverancierData={setNieuweLeverancierData}
            leverancierOptions={leverancierOptions}
            leverancierLoading={leverancierLoading}
            searchLeveranciers={searchLeveranciers}
          />
        );
      case 'aanbieder':
        // Aanbieder - only for ontbrekend-dienst
        return (
          <ConFormDienstAanbiederInformatieStage
            dienst={dienst}
            setDienstData={setDienstData}
            aanbiederOrganisatie={aanbiederOrganisatie}
            setAanbiederOrganisatieData={setAanbiederOrganisatieData}
            loading={schemasLoading}
            schemas={schemas}
            aanbiederKeuze={aanbiederKeuze}
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
            userStore={userStore}
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
            userStore={userStore}
            dienstType={dienstType}
            formType={formType}
            aanbiederKeuze={aanbiederKeuze}
            aanbiederOrganisatie={aanbiederOrganisatie}
            dienstenResults={dienstenResults}
            resolvedModulesFromDiensten={resolvedModulesFromDiensten}
            showNewApplicatieForm={showNewApplicatieForm}
            nieuweApplicatie={nieuweApplicatie}
            leverancierKeuze={leverancierKeuze}
            nieuweLeverancier={nieuweLeverancier}
            leverancierOptions={leverancierOptions}
          />
        );
      default:
        return null;
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

  // Validation mirroring product form style
  const getDisabledStatus = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'applicaties':
        // Applicaties: at least one applicatie selected OR new applicatie form filled
        if (showNewApplicatieForm) {
          // Validate new application fields
          if (!nieuweApplicatie.naam || !String(nieuweApplicatie.naam).trim())
            return true;
          if (!nieuweApplicatie.website || !String(nieuweApplicatie.website).trim())
            return true;

          // Validate website format
          if (nieuweApplicatie.website && String(nieuweApplicatie.website).trim()) {
            if (!validateWebsite(String(nieuweApplicatie.website).trim()))
              return true;
          }

          // Check leverancier
          if (leverancierKeuze === 'nieuw') {
            // Validate new leverancier fields
            if (
              !nieuweLeverancier.naam ||
              !String(nieuweLeverancier.naam).trim()
            )
              return true;
            if (
              !nieuweLeverancier.website ||
              !String(nieuweLeverancier.website).trim()
            )
              return true;

            // Validate website format
            if (
              nieuweLeverancier.website &&
              String(nieuweLeverancier.website).trim()
            ) {
              if (!validateWebsite(String(nieuweLeverancier.website).trim()))
                return true;
            }
          } else {
            // Existing leverancier must be selected
            if (!nieuweApplicatie.leverancier) return true;
          }

          return false;
        }

        // If not using new applicatie form, check if at least one applicatie is selected
        return selectedModuleIds.length === 0;
      case 'aanbieder': {
        // Aanbieder step validation
        // If user selected "bestaand", check if aanbieder is selected
        if (aanbiederKeuze === 'bestaand') {
          return !dienst.aanbieder || !String(dienst.aanbieder).trim();
        }

        // If user selected "nieuw", check if all required fields are filled
        const requiredNewOrgFields = ['naam', 'type', 'website'];
        const missingNewOrgFields = requiredNewOrgFields.filter(
          (field) =>
            !aanbiederOrganisatie[field] ||
            !String(aanbiederOrganisatie[field]).trim()
        );

        // Validate website format if provided
        if (
          aanbiederOrganisatie.website &&
          String(aanbiederOrganisatie.website).trim()
        ) {
          const website = String(aanbiederOrganisatie.website).trim();
          if (!validateWebsite(website)) {
            return true;
          }
        }

        return missingNewOrgFields.length > 0;
      }
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
      case 'controleren':
      default:
        // Controleren: no strict validation
        return false;
    }
  };

  const getDisabledTooltip = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'applicaties':
        if (showNewApplicatieForm) {
          // Validate new application fields
          const messages = [];
          if (!nieuweApplicatie.naam || !String(nieuweApplicatie.naam).trim()) {
            messages.push('Vul de naam van de applicatie in');
          }
          if (
            !nieuweApplicatie.website ||
            !String(nieuweApplicatie.website).trim()
          ) {
            messages.push('Vul de website van de applicatie in');
          }
          if (
            nieuweApplicatie.website &&
            !validateWebsite(String(nieuweApplicatie.website).trim())
          ) {
            messages.push('Website heeft een ongeldig formaat');
          }

          // Check leverancier
          if (leverancierKeuze === 'nieuw') {
            if (
              !nieuweLeverancier.naam ||
              !String(nieuweLeverancier.naam).trim()
            ) {
              messages.push('Vul de naam van de leverancier in');
            }
            if (
              !nieuweLeverancier.website ||
              !String(nieuweLeverancier.website).trim()
            ) {
              messages.push('Vul de website van de leverancier in');
            }
            if (
              nieuweLeverancier.website &&
              !validateWebsite(String(nieuweLeverancier.website).trim())
            ) {
              messages.push('Website leverancier heeft een ongeldig formaat');
            }
          } else {
            if (!nieuweApplicatie.leverancier) {
              messages.push('Selecteer een leverancier');
            }
          }

          return messages.join('\n');
        }

        return selectedModuleIds.length === 0
          ? 'Selecteer minimaal één applicatie'
          : '';
      case 'aanbieder': {
        // Aanbieder step validation messages
        if (aanbiederKeuze === 'bestaand') {
          if (!dienst.aanbieder || !String(dienst.aanbieder).trim()) {
            return 'Selecteer een aanbieder';
          }
        } else {
          const messages = [];
          if (!aanbiederOrganisatie.naam || !aanbiederOrganisatie.naam.trim()) {
            messages.push('Vul de naam van de organisatie in');
          }
          if (!aanbiederOrganisatie.type || !aanbiederOrganisatie.type.trim()) {
            messages.push('Selecteer het type organisatie');
          }
          if (
            !aanbiederOrganisatie.website ||
            !aanbiederOrganisatie.website.trim()
          ) {
            messages.push('Vul de website van de organisatie in');
          }
          if (
            aanbiederOrganisatie.website &&
            !validateWebsite(String(aanbiederOrganisatie.website).trim())
          ) {
            messages.push('Website heeft een ongeldig formaat');
          }
          return messages.join('\n');
        }
        return '';
      }
      case 'dienst-informatie': {
        // Dienst informatie validation messages
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
      case 'controleren':
      default:
        return '';
    }
  };

  const handleSaveDienst = async () => {
    setSaving(true);
    setSaveResult(null);
    setSaveErrorMessage('');
    try {
      let finalAanbieder = dienst.aanbieder;
      let finalModuleIds = [...selectedModuleIds];

      // ✅ Create new application if user filled in the new application form
      if (showNewApplicatieForm) {
        try {
          let finalLeverancier = null;

          // Create new leverancier if needed
          if (leverancierKeuze === 'nieuw') {
            const leverancierData = {
              naam: nieuweLeverancier.naam,
              website: nieuweLeverancier.website,
              type: nieuweLeverancier.type || 'Leverancier',
            };

            const createdLeverancier = await store.object.createObject(
              'voorzieningen',
              'organisatie',
              leverancierData
            );

            finalLeverancier =
              createdLeverancier?.id || createdLeverancier?.['@self']?.id;

            if (!finalLeverancier) {
              throw new Error('Leverancier aangemaakt maar geen ID ontvangen');
            }
          } else {
            // Use existing leverancier
            finalLeverancier = nieuweApplicatie.leverancier;
          }

          // Create new application
          const applicatieData = {
            naam: nieuweApplicatie.naam,
            website: nieuweApplicatie.website,
            beschrijvingKort: nieuweApplicatie.beschrijvingKort || '',
            aanbieder: finalLeverancier,
          };

          const createdModule = await store.object.createObject(
            'voorzieningen',
            'module',
            applicatieData
          );

          const createdModuleId = createdModule?.id || createdModule?.['@self']?.id;

          if (!createdModuleId) {
            throw new Error('Applicatie aangemaakt maar geen ID ontvangen');
          }

          // Add the newly created module to the selection
          finalModuleIds = [...finalModuleIds, createdModuleId];

          // Also add to module options so it can be displayed in review
          const newOption = {
            value: String(createdModuleId),
            label: String(nieuweApplicatie.naam),
            data: createdModule,
            type: 'applicatie',
          };
          setModuleOptions((prev) => [...prev, newOption]);
        } catch (appError) {
          console.error('Failed to create application:', appError);
          const errorMessage =
            appError?.response?.data?.message ||
            appError?.response?.data?.error ||
            appError?.message ||
            'Fout bij het aanmaken van de applicatie.';
          setSaveErrorMessage(errorMessage);
          setSaveResult('error');
          setSaving(false);
          return;
        }
      }

      // ✅ For new organization, create the organization first (only for ontbrekend-dienst)
      if (formType === 'ontbrekend-dienst' && aanbiederKeuze === 'nieuw') {
        try {
          const newOrganizationData = {
            naam: aanbiederOrganisatie.naam,
            type: aanbiederOrganisatie.type,
            website: aanbiederOrganisatie.website,
            beschrijvingKort: aanbiederOrganisatie.beschrijvingKort,
            beschrijvingLang: aanbiederOrganisatie.beschrijvingLang,
            'e-mailadres': aanbiederOrganisatie['e-mailadres'],
            telefoonnummer: aanbiederOrganisatie.telefoonnummer,
            logo: aanbiederOrganisatie.logo,
          };

          // Create the organization and get its ID
          const createdOrganization = await store.object.createObject(
            'voorzieningen',
            'organisatie',
            newOrganizationData
          );

          // Use the newly created organization ID as aanbieder
          finalAanbieder =
            createdOrganization?.id || createdOrganization?.['@self']?.id;

          if (!finalAanbieder) {
            throw new Error('Organisatie aangemaakt maar geen ID ontvangen');
          }
        } catch (orgError) {
          console.error('Failed to create organization:', orgError);
          const errorMessage =
            orgError?.response?.data?.message ||
            orgError?.response?.data?.error ||
            orgError?.message ||
            'Fout bij het aanmaken van de organisatie.';
          setSaveErrorMessage(errorMessage);
          setSaveResult('error');
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...dienst,
        aanbieder: finalAanbieder,
        producten: [], // Producten selection commented out
        modules: finalModuleIds,
        koppelingen: selectedKoppelingIds,
        // Include service type for processing
        dienstType: dienstType,
      };
      if (isEditMode) {
        await store.object.updateObject(
          'voorzieningen',
          'dienst',
          String(dienstId),
          payload
        );
      } else {
        await store.object.createObject('voorzieningen', 'dienst', payload);
      }
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

  const currentStepName = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'applicaties':
        return 'Zoek de applicatie voor uw diensten';
      case 'aanbieder':
        return 'Aanbieder';
      case 'dienst-informatie':
        return 'Dienstverlening op uw applicaties';
      case 'controleren':
        return 'Controleer uw gegevens';
      default:
        return '';
    }
  };

  // ProcessSteps configuration using stepper
  const processStepsConfig = useMemo(() => {
    const steps = [];
    const currentStepNum = stepper.getCurrentStep();

    stepper.resetStepDefinitions('process-steps');
    stepper.resetStepDefinitions('process-steps-status');

    // Step 1: Applicaties (always shown)
    steps.push({
      id: 'a9p0p1l2-i3c4-a5t6-i7e8-s9t0a1g2e3f4',
      marker: stepper.defineStep('process-steps', 'applicaties'),
      status: getStatus(currentStepNum, stepper.defineStep('process-steps-status')),
      title: 'Applicaties',
    });

    // Step 2: Aanbieder (only for ontbrekend-dienst)
    if (formType === 'ontbrekend-dienst') {
      steps.push({
        id: 'a1a2n3b4-i5e6-d7e8-r9i0-n1f2o3r4m5a6t7i8e9',
        marker: stepper.defineStep('process-steps', 'aanbieder'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Aanbieder',
      });
    }

    // Step 3: Dienst informatie
    steps.push({
      id: 'd1e2n3s4-t5i6-n7f8-o9r0-m1a2t3i4e5f6',
      marker: stepper.defineStep('process-steps', 'dienst-informatie'),
      status: getStatus(currentStepNum, stepper.defineStep('process-steps-status')),
      title: 'Dienst informatie',
    });

    // Step 4: Controleren
    steps.push({
      id: 'c5o6n7t8-r9o0-l1e2-r3e4-n5s6t7a8g9e0',
      marker: stepper.defineStep('process-steps', 'controleren'),
      status: getStatus(currentStepNum, stepper.defineStep('process-steps-status')),
      title: 'Controleren',
    });

    return steps;
  }, [stepper, formType]);

  const {
    icon: Icon,
    name: wizardName,
    schema: wizardSchema,
  } = useMemo(() => getActiveWizard() || {}, [dienstType]);
  const capitalizedSchema = _.capitalize(wizardSchema);
  const editModeTitle = `${capitalizedSchema} updaten`;

  const newWizardName = (() => {
    var a = wizardName.split(' ');
    a[0] += '(en)';
    return a.join(' ');
  })();

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
              Uw {isEditMode ? editModeTitle : newWizardName}
            </Heading1>
            <Paragraph>
              {isEditMode
                ? 'Werk uw dienstgegevens bij in onze catalogus.'
                : 'Vul dit formulier in om een dienst voor uw en andere applicaties te registreren en vindbaar te maken in de softwarecatalogus.'}
            </Paragraph>
          </div>

          {/* End header block */}

          {saveResult === 'success' ? (
            <div>
              <Heading1>
                {isEditMode
                  ? '🎉 Dienst succesvol geüpdatet!'
                  : '🎉 Dienst succesvol aangemeld!'}
              </Heading1>
              <Alert type='ok'>
                <Paragraph>
                  <strong>
                    {isEditMode
                      ? 'Uw dienst is succesvol bijgewerkt!'
                      : 'Uw dienst is succesvol geregistreerd!'}
                  </strong>
                </Paragraph>
                <Paragraph>
                  De dienst {dienst.naam || 'Onbekende dienst'} en de geselecteerde
                  applicaties zijn opgeslagen in de catalogus.
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
                    setSelectedModuleIds([]);
                    setShowNewApplicatieForm(false);
                    setNieuweApplicatie({
                      naam: '',
                      website: '',
                      beschrijvingKort: '',
                      leverancier: null,
                    });
                    setLeverancierKeuze('bestaand');
                    setNieuweLeverancier({
                      naam: '',
                      website: '',
                      type: '',
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
                  <ConDebugViewer data={dienst} title='Dienst object' />

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

                      {stepper.getStepFromLabel('aanbieder') ===
                        stepper.getCurrentStep() && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.BUILDING />}
                          onClick={() =>
                            aanbiederKeuze === 'bestaand'
                              ? setAanbiederKeuze('nieuw')
                              : setAanbiederKeuze('bestaand')
                          }
                        >
                          {aanbiederKeuze === 'bestaand'
                            ? 'Ik kan de gewenste leverancier niet vinden'
                            : 'Bestaande leverancier selecteren'}
                        </AcButton>
                      )}

                      {/* Toggle between existing/new applicatie form */}
                      {stepper.getStepFromLabel('applicaties') ===
                        stepper.getCurrentStep() &&
                        !showNewApplicatieForm && (
                          <AcButton
                            style='button'
                            buttonType='secondary'
                            icon={<VISUALS.CUBE />}
                            onClick={() => {
                              setShowNewApplicatieForm(true);
                              // Load initial leveranciers when switching to new applicatie form
                              searchLeveranciers('');
                            }}
                          >
                            Ik kan de gewenste applicatie niet vinden
                          </AcButton>
                        )}
                      {stepper.getStepFromLabel('applicaties') ===
                        stepper.getCurrentStep() &&
                        showNewApplicatieForm && (
                          <AcButton
                            style='button'
                            buttonType='secondary'
                            icon={<VISUALS.ARROW_LEFT />}
                            onClick={() => setShowNewApplicatieForm(false)}
                          >
                            Bestaande applicatie selecteren
                          </AcButton>
                        )}
                    </AcFlex>

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
                          ? 'Dienst updaten'
                          : 'Dienst registreren'}
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
