import { useState, useEffect, memo, useRef, useCallback } from 'react';
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

// Stage components
import ConFormDienstInformatieStage from './components/con-form-dienst-informatie-stage';
// import ConFormProductenStage from './components/con-form-producten-stage';
import ConFormApplicatiesStage from './components/con-form-applicaties-stage';
import ConFormControlerenStage from './components/con-form-controleren-stage';
import ConFormDienstAanbiederInformatieStage from './components/con-form-dienst-aanbieder-informatie-stage';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';
import { getActiveWizard } from '@src/constants/wizards.constants';
// Legacy stages
// import ConFormSoortDienstStage from './components/con-form-soort-dienst-stage';
// import ConFormKoppelingenStage from './components/con-form-koppelingen-stage';

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

const ConFormsDienst = ({ store, userStore }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dienstId = searchParams.get('id') || '';
  const formType = searchParams.get('type') || '';
  const isEditMode = !!dienstId;
  const [currentStep, setCurrentStep] = useState(0);
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
    type: '',
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

  // Options/state
  // Product-related states commented out
  // const [productOptions, setProductOptions] = useState([]);
  // const [selectedProductOptions, setSelectedProductOptions] = useState([]);
  // const [productsLoading, setProductsLoading] = useState(false);
  // const [selectedProductIds, setSelectedProductIds] = useState([]);
  // const [productLabels, setProductLabels] = useState({});

  // productId -> module options derived from product details
  const [productToModulesLookup, setProductToModulesLookup] = useState({});
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);

  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [selectedKoppelingIds, setSelectedKoppelingIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

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
        // Skip to step 0 in edit mode (Applicaties)
        setCurrentStep(0);
        await store.object.fetchObject('voorzieningen', 'dienst', String(dienstId), {
          _extend: ['@self.schema'],
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
        // mapLabel commented out - only used in product prefill code
        // const mapLabel = (item, fallback) => {
        //   if (!item || typeof item !== 'object') return fallback || '';
        //   return String(
        //     item.naam || item.name || item.title || item.label || fallback || ''
        //   );
        // };

        // Product-related prefill commented out
        // const prefilledProductIds = Array.isArray(fetched.producten)
        //   ? fetched.producten.map((p) => mapId(p)).filter(Boolean)
        //   : [];
        const prefilledModuleIds = Array.isArray(fetched.modules)
          ? fetched.modules.map((m) => mapId(m)).filter(Boolean)
          : [];
        const prefilledKoppelingIds = Array.isArray(fetched.koppelingen)
          ? fetched.koppelingen.map((k) => mapId(k)).filter(Boolean)
          : [];

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
          type: fetched.type || '',
          producten: [], // Producten prefill commented out
          modules: prefilledModuleIds,
          koppelingen: prefilledKoppelingIds,
        }));

        // Initialize dienstType from API or default to 'eigen-organisatie'
        setDienstType(
          (typeof fetched.dienstType === 'string' && fetched.dienstType) ||
            'eigen-organisatie'
        );

        // Prefill selections and labels/options for UI components
        // Product-related prefill commented out
        // setSelectedProductIds(prefilledProductIds);
        setSelectedModuleIds(prefilledModuleIds);
        setSelectedKoppelingIds(prefilledKoppelingIds);

        // Product options prefill commented out
        // // Ensure selected product options exist so chips/inputs can render labels
        // const productOptionsFromFetched = (
        //   Array.isArray(fetched.producten) ? fetched.producten : []
        // )
        //   .map((p, idx) => ({
        //     value: mapId(p),
        //     label: mapLabel(p, `Product ${idx + 1}`),
        //     data: p,
        //   }))
        //   .filter((o) => o.value && o.label);
        // if (productOptionsFromFetched.length > 0) {
        //   setSelectedProductOptions(productOptionsFromFetched);
        //   const labels = {};
        //   productOptionsFromFetched.forEach((o) => {
        //     labels[o.value] = o.label;
        //   });
        //   setProductLabels((prev) => ({ ...prev, ...labels }));
        // }
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

  // Ensure /me is refreshed when the wizard mounts (so stages can read active organisation)
  useEffect(() => {
    if (typeof userStore?.fetchUserProfile === 'function') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
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

  // Auto-set aanbieder from active org
  // TODO: Initialize aanbieder to active organization ID
  // useEffect(() => {
  //   const actualUserStore = userStore || store?.user;
  //   if (actualUserStore?.activeOrganization && !dienst.aanbieder) {
  //     const orgId = actualUserStore.activeOrganization.uuid ||
  //                  actualUserStore.activeOrganization.id ||
  //                  actualUserStore.activeOrganization.slug;
  //     setDienstData('aanbieder', orgId || '');
  //   }
  // }, [userStore, store?.user, dienst.aanbieder]);

  // Product-related search and ref commented out
  // // Use ref to avoid dependency issues
  // const selectedProductOptionsRef = useRef(selectedProductOptions);
  // selectedProductOptionsRef.current = selectedProductOptions;

  // // Search/fetch products
  // const performProductsSearch = useCallback(async (term = '') => {
  //   setProductsLoading(true);
  //   try {
  //     const params = new URLSearchParams({ _limit: '20', _page: '1' });
  //     if (term && term.trim()) params.set('_search', term.trim());

  //     // TODO: Filter by own organization when dienst type is 'eigen-organisatie'
  //     // Use @self[organisation] parameter to filter products by organization
  //     // const actualUserStore = userStore || store?.user;
  //     // if (dienstType === 'eigen-organisatie' && actualUserStore?.activeOrganization) {
  //     //   const orgId = actualUserStore.activeOrganization.uuid ||
  //     //                actualUserStore.activeOrganization.id ||
  //     //                actualUserStore.activeOrganization.slug;
  //     //   if (orgId) {
  //     //     params.set('@self[organisation]', String(orgId));
  //     //   }
  //     // }

  //     const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product?${params}`;
  //     const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //     const data = await res.json();
  //     const list = Array.isArray(data)
  //       ? data
  //       : Array.isArray(data?.results)
  //       ? data.results
  //       : [];
  //     const mapped = list.map((item, index) => ({
  //       value: String(
  //         item?.id || item?.['@self']?.id || item?.value || item?.slug || index
  //       ),
  //       label: String(
  //         item?.naam || item?.name || item?.title || `Product ${index + 1}`
  //       ),
  //       data: item,
  //     }));
  //     // Always include currently selected options so selected values remain available
  //     const currentSelectedOptions = selectedProductOptionsRef.current || [];
  //     const selectedById = new Set(currentSelectedOptions.map((o) => o.value));
  //     const merged = [
  //       ...currentSelectedOptions,
  //       ...mapped.filter((o) => !selectedById.has(o.value)),
  //     ];
  //     setProductOptions(merged);
  //   } catch {
  //     setProductOptions([]);
  //   } finally {
  //     setProductsLoading(false);
  //   }
  // }, []);

  // // Initial load of products
  // useEffect(() => {
  //   performProductsSearch('');
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // // TODO: Reload products when dienst type changes to apply organization filtering
  // // useEffect(() => {
  // //   if (dienstType) {
  // //     // Clear current selections as available products will change
  // //     setSelectedProductIds([]);
  // //     setSelectedProductOptions([]);
  // //     setSelectedModuleIds([]);
  // //     // Reload products with new filtering
  // //     performProductsSearch('');
  // //   }
  // // }, [dienstType]);

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
      setModuleOptions(options);
      // Store as a flat list for backward compatibility
      setProductToModulesLookup({ all: options });
    } catch {
      setModuleOptions([]);
      setProductToModulesLookup({ all: [] });
    } finally {
      setModulesLoading(false);
    }
  };

  // Load modules on mount (step 0 is now Applicaties)
  useEffect(() => {
    loadAllModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        // Merge with existing options to preserve selected items
        setModuleOptions((prevOptions) => {
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

  // Legacy: Fetch helpers that can be invoked when transitioning to the next step (commented out)
  // const loadModulesForProducts = async () => {
  //   setModulesLoading(true);
  //   try {
  //     if (!selectedProductIds || selectedProductIds.length === 0) {
  //       setProductToModulesLookup({});
  //       return;
  //     }

  //     const perProductTasks = selectedProductIds.map(async (prodId) => {
  //       const productEndpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product/${prodId}`;

  //       const productItem = await fetch(productEndpoint, {
  //         headers: { Accept: 'application/json' },
  //       })
  //         .then((r) => (r.ok ? r.json() : null))
  //         .catch(() => null);

  //       // Determine label using multiple fallbacks
  //       const fromDetail = productItem
  //         ? String(
  //             productItem?.naam ||
  //               productItem?.name ||
  //               productItem?.title ||
  //               productItem?.label ||
  //               ''
  //           )
  //         : '';
  //       const fromSelected =
  //         (selectedProductOptions || []).find((p) => p.value === prodId)?.label ||
  //         '';
  //       const fromOptions =
  //         (productOptions || []).find((p) => p.value === prodId)?.label || '';
  //       const label = fromDetail || fromSelected || fromOptions || String(prodId);

  //       // Use modules array on product to fetch each module individually
  //       // The modules array contains UUID strings directly, not objects
  //       const moduleIds = Array.isArray(productItem?.modules)
  //         ? productItem.modules
  //             .map((m) => {
  //               // Handle both string UUIDs and object formats
  //               if (typeof m === 'string' && m.trim()) {
  //                 return m.trim();
  //               } else if (typeof m === 'object' && m !== null) {
  //                 return String(
  //                   m?.id || m?.value || m?.uuid || m?.slug || m?.['@self']?.id || ''
  //                 );
  //               }
  //               return '';
  //             })
  //             .filter(Boolean)
  //         : [];

  //       const moduleFetches = moduleIds.map((id) =>
  //         fetch(`${BASE_URL}/openregister/api/objects/voorzieningen/module/${id}`, {
  //           headers: { Accept: 'application/json' },
  //         })
  //           .then((r) => (r.ok ? r.json() : null))
  //           .catch(() => null)
  //       );

  //       const moduleResults = await Promise.allSettled(moduleFetches);

  //       const normalized = moduleResults
  //         .map((res, idx) => {
  //           if (res.status !== 'fulfilled' || !res.value) return null;
  //           const m = res.value;
  //           const id = String(
  //             m?.id || m?.value || m?.uuid || m?.slug || moduleIds[idx] || ''
  //           );
  //           if (!id) return null;
  //           const mLabel = String(
  //             m?.naam || m?.name || m?.title || `Applicatie ${idx + 1}`
  //           );
  //           return { value: id, label: mLabel, data: m };
  //         })
  //         .filter(Boolean);

  //       return { prodId, label, normalized };
  //     });

  //     const settled = await Promise.allSettled(perProductTasks);
  //     const lookup = {};
  //     const labels = {};
  //     settled.forEach((res) => {
  //       if (res.status !== 'fulfilled') return;
  //       const { prodId, label, normalized } = res.value || {};
  //       if (!prodId) return;
  //       lookup[prodId] = Array.isArray(normalized) ? normalized : [];
  //       if (label) labels[prodId] = label;
  //     });

  //     setProductToModulesLookup(lookup);
  //     setProductLabels((prev) => ({ ...prev, ...labels }));
  //   } finally {
  //     setModulesLoading(false);
  //   }
  // };

  // Product-related sync commented out
  // // Keep dienst.producten in sync with current selection
  // useEffect(() => {
  //   setDienstData('producten', selectedProductIds);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedProductIds]);

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
        fetch(`${BASE_URL}/openregister/api/objects/voorzieningen/module/${id}`, {
          headers: { Accept: 'application/json' },
        })
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
        fetch(`${BASE_URL}/openregister/api/objects/voorzieningen/koppeling/${id}`, {
          headers: { Accept: 'application/json' },
        })
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

  /**
   * Helper function to get the correct step index accounting for optional steps
   * Accounts for the optional Aanbieder step (only shown for ontbrekend-dienst)
   * @param {number} logicalStep - The logical step number
   * Logical steps: 0=Applicaties, 1=Aanbieder, 2=Dienst informatie, 3=Controleren
   * @returns {number} The adjusted physical step index
   */
  const getAdjustedStepIndex = useCallback(
    (logicalStep) => {
      let index = logicalStep;

      // If Aanbieder step is not shown and we're past it, adjust the index
      if (formType !== 'ontbrekend-dienst' && logicalStep > 1) {
        index -= 1;
      }

      return index;
    },
    [formType]
  );

  /**
   * Convert physical step index to logical step number
   * Accounts for optional Aanbieder step
   * @param {number} physicalStep - The physical step index
   * @returns {number} The logical step number
   */
  const getLogicalStepFromPhysical = useCallback(
    (physicalStep) => {
      // Start with physical step
      let logicalStep = physicalStep;

      // If Aanbieder step is not shown, add 1 to account for skipped step
      if (formType !== 'ontbrekend-dienst') {
        // If we're at or past where Aanbieder would be (logical step 1), add 1 to skip it
        if (logicalStep >= 1) {
          logicalStep += 1;
        }
      }

      return logicalStep;
    },
    [formType]
  );

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
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      // Legacy step 0 - ConFormSoortDienstStage (commented out)
      // case 0:
      //   return (
      //     <ConFormSoortDienstStage
      //       dienstType={dienstType}
      //       setDienstType={setDienstType}
      //       loading={schemasLoading}
      //       dienst={dienst}
      //     />
      //   );
      case 0:
        return (
          <ConFormApplicatiesStage
            // Product-related props commented out
            // productToModulesLookup={productToModulesLookup}
            // selectedProductIds={selectedProductIds}
            // selectedProductOptions={selectedProductOptions}
            // productOptions={productOptions}
            // productLabels={productLabels}
            selectedModuleIds={selectedModuleIds}
            setSelectedModuleIds={setSelectedModuleIds}
            loadingModules={modulesLoading}
            searchLoading={searchLoading}
            moduleOptions={moduleOptions}
            searchModules={debouncedSearchModules}
            schemas={schemas}
            dienstType={dienstType}
          />
        );
      case 1:
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
      // Producten stage commented out
      // case 1:
      //   return (
      //     <ConFormProductenStage
      //       selectedProductIds={selectedProductIds}
      //       setSelectedProductIds={setSelectedProductIds}
      //       setSelectedProductOptions={setSelectedProductOptions}
      //       productOptions={productOptions}
      //       productsLoading={productsLoading}
      //       searchProducts={performProductsSearch}
      //       dienstType={dienstType}
      //     />
      //   );
      case 2:
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
      // Legacy step - ConFormKoppelingenStage (commented out)
      // case 4:
      //   return (
      //     <ConFormKoppelingenStage
      //       selectedModuleIds={selectedModuleIds}
      //       productToModulesLookup={productToModulesLookup}
      //       koppelingOptions={koppelingOptions}
      //       selectedKoppelingIds={selectedKoppelingIds}
      //       setSelectedKoppelingIds={setSelectedKoppelingIds}
      //       dienstType={dienstType}
      //     />
      //   );
      case 3:
        return (
          <ConFormControlerenStage
            dienst={dienst}
            // Product-related props commented out
            // selectedProductIds={selectedProductIds}
            // productOptions={productOptions}
            selectedModuleIds={selectedModuleIds}
            moduleOptionsByProduct={productToModulesLookup}
            selectedKoppelingIds={selectedKoppelingIds}
            koppelingOptions={koppelingOptions}
            userStore={userStore}
            dienstType={dienstType}
            formType={formType}
            aanbiederKeuze={aanbiederKeuze}
            aanbiederOrganisatie={aanbiederOrganisatie}
          />
        );
      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        return 'Applicaties';
      case 1:
        return 'Aanbieder';
      // Producten step commented out
      // case 1:
      //   return 'Producten';
      case 2:
        return 'Dienst informatie';
      case 3:
        return 'Controleer uw gegevens';
      // Legacy step names (commented out)
      // case 0: return 'Soort dienst';
      // case 4: return 'Koppelingen';
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

  // Validation mirroring product form style
  const getDisabledStatus = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    if (logicalStep === 0) {
      // Applicaties: at least one applicatie selected
      return selectedModuleIds.length === 0;
    }
    if (logicalStep === 1 && formType === 'ontbrekend-dienst') {
      // Aanbieder step validation
      // If user selected "bestaand", check if aanbieder is selected
      if (aanbiederKeuze === 'bestaand') {
        return !dienst.aanbieder || !String(dienst.aanbieder).trim();
      }

      // If user selected "nieuw", check if all required fields are filled
      const requiredNewOrgFields = ['naam', 'type', 'website'];
      const missingNewOrgFields = requiredNewOrgFields.filter(
        (field) =>
          !aanbiederOrganisatie[field] || !String(aanbiederOrganisatie[field]).trim()
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
    // Producten step validation commented out
    // if (logicalStep === 1) {
    //   // Producten: at least one product selected
    //   return selectedProductIds.length === 0;
    // }
    if (logicalStep === 2) {
      // Dienst informatie: Respect schema requiredness
      const naamRequired = isSchemaFieldRequired('dienst', 'naam');
      const websiteRequired = isSchemaFieldRequired('dienst', 'website');
      const soortRequired = isSchemaFieldRequired('dienst', 'type');
      const missingSoort = soortRequired && (!dienst.type || !dienst.type.trim());

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
    // Legacy validation (commented out)

    // if (logicalStep === 4) {
    //   // Koppelingen: no strict validation (optional)
    //   return false;
    // }
    // Controleren: no strict validation
    return false;
  };

  const getDisabledTooltip = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    if (logicalStep === 0) {
      return selectedModuleIds.length === 0
        ? 'Selecteer minimaal één applicatie'
        : '';
    }
    if (logicalStep === 1 && formType === 'ontbrekend-dienst') {
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
        if (!aanbiederOrganisatie.website || !aanbiederOrganisatie.website.trim()) {
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
    }
    // Producten step tooltip commented out
    // if (logicalStep === 1) {
    //   return selectedProductIds.length === 0 ? 'Selecteer minimaal één product' : '';
    // }
    if (logicalStep === 2) {
      // Dienst informatie validation messages
      const messages = [];
      const naamRequired = isSchemaFieldRequired('dienst', 'naam');
      const websiteRequired = isSchemaFieldRequired('dienst', 'website');
      const soortRequired = isSchemaFieldRequired('dienst', 'type');

      if (naamRequired && (!dienst.naam || !dienst.naam.trim())) {
        messages.push('Dienstnaam is verplicht');
      }
      if (soortRequired && (!dienst.type || !dienst.type.trim())) {
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
    // Legacy tooltips (commented out)
    return '';
  };

  const handleSaveDienst = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      let finalAanbieder = dienst.aanbieder;

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
          setSaveResult('error');
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...dienst,
        aanbieder: finalAanbieder,
        producten: [], // Producten selection commented out
        modules: selectedModuleIds,
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
    } catch (e) {
      setSaveResult('error');
    } finally {
      setSaving(false);
    }
  };

  const { icon: Icon, schema } = getActiveWizard();

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <Heading1
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Icon style={{ width: '1em', height: '1em' }} />
              {_.capitalize(schema)}
              {isEditMode
                ? ' updaten'
                : formType === 'ontbrekend-dienst'
                ? ' melden'
                : ' registreren'}
            </Heading1>
            <Paragraph>
              {isEditMode
                ? 'Werk uw dienstgegevens bij in onze catalogus.'
                : 'Voer de gegevens van de dienst in, selecteer relevante applicaties en controleer uw invoer.'}
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
                    setCurrentStep(0);
                    setDienst({
                      naam: '',
                      beschrijvingKort: '',
                      beschrijvingLang: '',
                      website: '',
                      logo: '',
                      contactpersoon: null,
                      aanbieder: '',
                      type: '',
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
                  {currentStepName(currentStep)}
                </h3>
              </div>

              <div className='ac-register-container ac-forms-product'>
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps
                    steps={(() => {
                      const baseSteps = [
                        {
                          id: 'a9p0p1l2-i3c4-a5t6-i7e8-s9t0a1g2e3f4',
                          marker: 1,
                          status: getStatus(currentStep, getAdjustedStepIndex(0)),
                          title: 'Applicaties',
                        },
                      ];

                      // Only add Aanbieder step for ontbrekend-dienst
                      if (formType === 'ontbrekend-dienst') {
                        baseSteps.push({
                          id: 'a1a2n3b4-i5e6-d7e8-r9i0-n1f2o3r4m5a6t7i8e9',
                          marker: 2,
                          status: getStatus(currentStep, getAdjustedStepIndex(1)),
                          title: 'Aanbieder',
                        });
                      }

                      // Legacy nested steps structure (commented out)
                      // {
                      //   id: 'p7r8o9d0-u1c2-t3e4-n5a6-p7p8l9i0c1a2',
                      //   marker: 2,
                      //   status:
                      //     currentStep >= 1 && currentStep <= 2
                      //       ? 'current'
                      //       : currentStep < 1
                      //       ? 'not-checked'
                      //       : 'checked',
                      //   title: 'Producten en applicaties',
                      //   steps: [
                      //     {
                      //       id: 'p3r4o5d6-u7c8-t9e0-n1s2-t3a4g5e6f7g8',
                      //       status: getStatus(currentStep, 1),
                      //       title: 'Producten',
                      //     },
                      //     {
                      //       id: 'a9p0p1l2-i3c4-a5t6-i7e8-s9t0a1g2e3f4',
                      //       status: getStatus(currentStep, 2),
                      //       title: 'Applicaties',
                      //     },
                      //   ],
                      // },

                      baseSteps.push(
                        {
                          id: 'd1e2n3s4-t5i6-n7f8-o9r0-m1a2t3i4e5f6',
                          marker: formType === 'ontbrekend-dienst' ? 3 : 2,
                          status: getStatus(currentStep, getAdjustedStepIndex(2)),
                          title: 'Dienst informatie',
                        },
                        {
                          id: 'c5o6n7t8-r9o0-l1e2-r3e4-n5s6t7a8g9e0',
                          marker: formType === 'ontbrekend-dienst' ? 4 : 3,
                          status: getStatus(currentStep, getAdjustedStepIndex(3)),
                          title: 'Controleren',
                        }
                      );

                      return baseSteps;
                    })()}
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
                          🐛 Debug: Dienst Object (Click to expand)
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
                          {JSON.stringify(dienst, null, 2)}
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

                      {currentStep === getAdjustedStepIndex(1) &&
                        formType === 'ontbrekend-dienst' && (
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
                      {getLogicalStepFromPhysical(currentStep) !== 3 && (
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

                    {getLogicalStepFromPhysical(currentStep) === 3 && (
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
        onConfirm={() => navigate('/forms/applicatie')}
        title='Waarschuwing'
        message='Je staat op het punt om de dienstregistratie te verlaten. Al je wijzigingen zullen niet worden opgeslagen.'
        confirmLabel='Verlaten'
        cancelLabel='Blijven'
        confirmIcon={<VISUALS.ARROW_RIGHT />}
        cancelIcon={<VISUALS.ARROW_LEFT />}
      />
    </AcSection>
  );
};

export default memo(withStore(observer(ConFormsDienst)));
