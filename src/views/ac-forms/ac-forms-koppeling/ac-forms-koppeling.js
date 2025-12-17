import { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn, AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import {
  Heading1,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import _ from 'lodash';
import ConKoppelingStageZoeken from './components/con-koppeling-stage-zoeken';
import ConKoppelingStageToevoegen from './components/con-koppeling-stage-toevoegen';
import ConKoppelingStageControleren from './components/con-koppeling-stage-controleren';
import ConKoppelingStageAanbieder from './components/con-koppeling-stage-aanbieder';
import { commongroundApiUrl } from '@src/config';
import { getActiveWizard } from '@src/constants/wizards.constants';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { useDebouncedInput } from '@src/hooks';

/**
 * Koppeling Wizard (AcFormsKoppeling)
 *
 * This wizard allows users to register or edit koppelingen (connections) between applications.
 *
 * LEGACY NOTE: The initial "Soort koppeling" (type selection) step has been removed.
 * The koppeling type is now determined via URL parameter:
 * - ?type=eigen-organisatie - For registering connections within own organization
 * - ?type=aanbieden-koppeling - For offering connections to other organizations
 *   → Automatically sets the user's organization as 'aanbieder'
 *
 * If no type is provided, defaults to 'eigen-organisatie'.
 *
 * Current steps:
 * - Step 0: Koppeling zoeken (Search for existing connections)
 * - Step 1: Toevoegen/Bewerken (Add/Edit connection details)
 * - Step 2: Controleren (Review and submit)
 */
const AcFormsKoppeling = ({ store }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const koppelingId = searchParams.get('id') || '';
  const typeFromUrl = searchParams.get('type') || '';
  const applicatieFromUrl = searchParams.get('applicatie') || ''; // Read applicatie parameter from URL
  const isEditMode = !!koppelingId;

  // Validate type from URL and use it if valid
  const validTypes = ['eigen-organisatie', 'aanbieden-koppeling'];
  const initialType = validTypes.includes(typeFromUrl) ? typeFromUrl : null;

  // LEGACY: Type selection step removed - type is now required via URL parameter
  // If type is not provided, default to 'eigen-organisatie'
  // When aanbieden-koppeling, add aanbieder step as step 0
  const getInitialStep = (type) => {
    const koppelingType = type || initialType || 'eigen-organisatie';
    if (isEditMode) {
      // In edit mode, skip aanbieder step (it's already set)
      return koppelingType === 'aanbieden-koppeling' ? 1 : 1;
    }
    // For new koppelingen, start at aanbieder step if type is aanbieden-koppeling
    return koppelingType === 'aanbieden-koppeling' ? 0 : 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep(initialType));
  const [loading, setLoading] = useState(false);
  const [koppelingsType, setKoppelingsType] = useState(
    initialType || 'eigen-organisatie'
  ); // Default to 'eigen-organisatie' if not specified

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step'
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

  // Schema management state
  const [schemas, setSchemas] = useState({});
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Fetch schemas on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setSchemasLoading(true);
      try {
        // Fetch koppeling schema
        let koppelingSchema = null;
        try {
          await store.object.fetchSchema('koppeling');
          koppelingSchema = store.object.getSchema('schema_koppeling');
        } catch (koppelingError) {
          console.error('Failed to fetch koppeling schema:', koppelingError);
        }

        // Fetch organisatie schema for organization form
        let organisatieSchema = null;
        try {
          await store.object.fetchSchema('organisatie');
          organisatieSchema = store.object.getSchema('schema_organisatie');
        } catch (orgError) {
          console.error('Failed to fetch organisatie schema:', orgError);
        }

        setSchemas({
          koppeling: koppelingSchema,
          organisatie: organisatieSchema,
        });
      } catch (error) {
        console.error('Failed to fetch schemas for koppeling form:', error);
        setSchemas({});
      } finally {
        setSchemasLoading(false);
      }
    };
    fetchSchemas();
  }, [store]);

  // Options for modules (applications)
  const [modulesOptions, setModulesOptions] = useState([]);
  // Options/loading specifically for the own-app searchable select
  const [ownAppOptions, setOwnAppOptions] = useState([]);
  const [ownAppLoading, setOwnAppLoading] = useState(false);
  const [applicatiePreloadLoading, setApplicatiePreloadLoading] = useState(false);

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [resolvedModulesFromResults, setResolvedModulesFromResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // "Your" application (optional anchor for adding/searching)
  const [ownApp, setOwnApp] = useState(null);

  // Standaarden options (fetched similarly to referentiecomponenten)
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenOptionsLoading, setStandaardenOptionsLoading] = useState(false);

  // Toevoegen state (rows-based like product KoppelingenForm), but using modules for A and B
  const [rows, setRows] = useState([0]);
  const [nextRowId, setNextRowId] = useState(1);
  const [selectedAppAByRow, setSelectedAppAByRow] = useState({});
  const [selectedAppBByRow, setSelectedAppBByRow] = useState({});
  const [directionByRow, setDirectionByRow] = useState({});
  const [typeByRow, setTypeByRow] = useState({});
  const [beschrijvingByRow, setBeschrijvingByRow] = useState({});
  const [statusByRow, setStatusByRow] = useState({});
  const [standaardenByRow, setStandaardenByRow] = useState([]);
  const [nameByRow, setNameByRow] = useState({});
  const [selectedModuleLabels, setSelectedModuleLabels] = useState({}); // id -> label
  const [koppelingIdByRow, setKoppelingIdByRow] = useState({}); // rowId -> koppeling id (for edit)

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // 'success' | 'error' | null
  const [saveErrors, setSaveErrors] = useState([]); // array of error messages
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [prefillLoading, setPrefillLoading] = useState(false);

  // Unsaved changes alert
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  // Add state for external facilities options
  const [buitengemeentelijkeOptions, setBuitengemeentelijkeOptions] = useState([]);
  const [buitengemeentelijkeOptionsLoading, setBuitengemeentelijkeOptionsLoading] =
    useState(false);

  // Aanbieder state (only for aanbieden-koppeling type)
  const [aanbieder, setAanbieder] = useState(null);
  const [aanbiederKeuze, setAanbiederKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [aanbiederOrganisatie, setAanbiederOrganisatie] = useState({
    naam: '',
    type: '',
    website: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    'e-mailadres': '',
    telefoonnummer: '',
    kvkNummer: '',
    logo: '',
  });

  // Organisatie options for aanbieder selection
  const [organisatieOptions, setOrganisatieOptions] = useState([]);
  const [organisatieLoading, setOrganisatieLoading] = useState(false);

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

  /**
   * Helper function to get the correct step index accounting for optional steps
   * Accounts for the optional Aanbieder step (only shown for aanbieden-koppeling)
   * @param {number} logicalStep - The logical step number
   * Logical steps: 0=Aanbieder, 1=Zoeken, 2=Toevoegen, 3=Controleren
   * @returns {number} The adjusted physical step index
   */
  const getAdjustedStepIndex = useCallback(
    (logicalStep) => {
      let index = logicalStep;

      // If Aanbieder step is not shown (not aanbieden-koppeling), adjust steps after it
      if (koppelingsType !== 'aanbieden-koppeling' && logicalStep > 0) {
        index -= 1;
      }

      return index;
    },
    [koppelingsType]
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

      // If Aanbieder step is not shown (not aanbieden-koppeling), skip logical step 0
      if (koppelingsType !== 'aanbieden-koppeling') {
        // If we're at or past where Aanbieder would be (logical step 0), add 1 to skip it
        if (logicalStep >= 0) {
          logicalStep += 1;
        }
      }

      return logicalStep;
    },
    [koppelingsType]
  );

  /**
   * Update function for aanbieder organization data
   * Used when creating a new organization for aanbieden-koppeling
   */
  const setAanbiederOrganisatieData = useCallback((key, value) => {
    setAanbiederOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch modules (applications) options on mount
  useEffect(() => {
    let isMounted = true;
    const fetchModules = async () => {
      try {
        setOwnAppLoading(true);
        const params = new URLSearchParams({
          _limit: '20',
          _page: '1',
          _published: 'false',
        });
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
          return {
            value: String(id),
            label: String(label),
            data: item,
            type: 'applicatie',
          };
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
      } finally {
        if (isMounted) setOwnAppLoading(false);
      }
    };

    fetchModules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Pre-select applicatie from URL parameter
  useEffect(() => {
    if (!applicatieFromUrl || isEditMode) return; // Skip if editing or no applicatie in URL

    const preSelectApplicatie = async () => {
      try {
        // Wait for modules to be loaded first
        if (modulesOptions.length === 0 && ownAppOptions.length === 0) return;

        // Check if the applicatie exists in options (check both modulesOptions and ownAppOptions)
        let applicatieOption =
          modulesOptions.find(
            (opt) => String(opt.value) === String(applicatieFromUrl)
          ) ||
          ownAppOptions.find(
            (opt) => String(opt.value) === String(applicatieFromUrl)
          );

        if (!applicatieOption) {
          // If applicatie not in initial list, fetch it directly using object store
          setApplicatiePreloadLoading(true);
          try {
            await store.object.fetchObject(
              'voorzieningen',
              'module',
              String(applicatieFromUrl),
              {
                '_extend[]': ['@self.schema'],
                _published: 'false',
              }
            );
            const fetched = store.object.getObject(
              'voorzieningen_module',
              String(applicatieFromUrl)
            );
            if (fetched) {
              const label =
                fetched?.naam ||
                fetched?.name ||
                fetched?.title ||
                fetched?.label ||
                fetched?.['@self']?.name ||
                String(applicatieFromUrl);
              const option = {
                value: String(applicatieFromUrl),
                label: String(label),
                data: fetched,
                type: 'applicatie',
              };
              // Add to both options lists first
              setModulesOptions((prev) => {
                const exists = prev.some((o) => o.value === option.value);
                if (exists) return prev;
                return [...prev, option];
              });
              setOwnAppOptions((prev) => {
                const exists = prev.some((o) => o.value === option.value);
                if (exists) return prev;
                return [...prev, option];
              });
              // Use the newly created option
              applicatieOption = option;
            }
          } catch (error) {
            console.error('Error pre-selecting applicatie from URL:', error);
            setApplicatiePreloadLoading(false);
            return;
          } finally {
            setApplicatiePreloadLoading(false);
          }
        }

        // Pre-select the applicatie (use the exact option object from the array)
        if (applicatieOption) {
          // Ensure the option is in ownAppOptions (ReactSelect needs it there)
          setOwnAppOptions((prev) => {
            const exists = prev.some(
              (o) => String(o.value) === String(applicatieOption.value)
            );
            if (exists) return prev;
            return [...prev, applicatieOption];
          });
          // Set ownApp using the exact option object
          setOwnApp({
            value: applicatieOption.value,
            label: applicatieOption.label,
          });
          setSelectedAppAByRow((prev) => ({ ...prev, [0]: applicatieOption.value }));
          setSelectedModuleLabels((prev) => ({
            ...prev,
            [applicatieOption.value]: applicatieOption.label,
          }));
        }
      } catch (error) {
        console.error('Error pre-selecting applicatie from URL:', error);
        setApplicatiePreloadLoading(false);
      }
    };

    preSelectApplicatie();
  }, [applicatieFromUrl, modulesOptions, ownAppOptions, isEditMode, store]);

  // Helper to ensure a module option exists and return its label
  const ensureModuleOptionAndGetLabel = async (id) => {
    if (!id) return '';
    const existing = (modulesOptions || []).find(
      (o) => String(o.value) === String(id)
    );
    if (existing) return existing.label || String(id);
    try {
      const res = await fetch(
        `/api/apps/openregister/api/objects/voorzieningen/module/${encodeURIComponent(
          String(id)
        )}?_published=false`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) return String(id);
      const item = await res.json();
      const label =
        item?.naam ||
        item?.name ||
        item?.title ||
        item?.label ||
        item?.['@self']?.name ||
        String(id);
      const option = {
        value: String(id),
        label: String(label),
        data: item,
        type: 'applicatie',
      };
      setModulesOptions((prev) => {
        const exists = (prev || []).some((o) => String(o.value) === String(id));
        return exists ? prev : [...(prev || []), option];
      });
      setOwnAppOptions((prev) => {
        const exists = (prev || []).some((o) => String(o.value) === String(id));
        return exists ? prev : [...(prev || []), option];
      });
      return String(label);
    } catch {
      return String(id);
    }
  };

  // Prefill in edit mode
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      // Jump to edit step (was step 2, now step 1 after removing type selection)
      setCurrentStep(1);
      setPrefillLoading(true);
      try {
        const url = `/api/apps/openregister/api/objects/voorzieningen/koppeling/${encodeURIComponent(
          koppelingId
        )}?_extend[]=@self.schema&_extend[]=@self.relations&_published=false`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const rels = data?.['@self']?.relations || {};
        const moduleAIdRaw = rels?.moduleA ?? data?.moduleA;
        const moduleBIdRaw = rels?.moduleB ?? data?.moduleB;
        const moduleAId = String(extractRelationId(moduleAIdRaw) || '');
        const moduleBId = String(extractRelationId(moduleBIdRaw) || '');

        const richting = data?.gegevensuitwisselingRichting || '';
        const soort = data?.type || '';
        const beschrijving = data?.beschrijvingKort || '';
        const status = data?.status || '';
        const naam = data?.naam || '';
        const standaarden = data?.standaardversies || [];
        // Resolve labels and ensure options exist
        const [labelA, labelB] = await Promise.all([
          ensureModuleOptionAndGetLabel(moduleAId),
          ensureModuleOptionAndGetLabel(moduleBId),
        ]);

        if (cancelled) return;

        setSelectedModuleLabels((prev) => ({
          ...prev,
          [moduleAId]: labelA || moduleAId,
          [moduleBId]: labelB || moduleBId,
        }));

        // Set own app to moduleA for anchor behavior
        if (moduleAId) {
          setOwnApp({ value: moduleAId, label: labelA || moduleAId });
        }

        // Prefill single row
        setRows([0]);
        setNextRowId(1);
        setSelectedAppAByRow({ 0: moduleAId });
        setSelectedAppBByRow({ 0: moduleBId });
        setDirectionByRow({ 0: richting });
        setTypeByRow({ 0: soort });
        setBeschrijvingByRow({ 0: beschrijving });
        setStatusByRow({ 0: status });
        setStandaardenByRow({ 0: standaarden });
        setNameByRow({ 0: naam });
        setKoppelingIdByRow({ 0: String(koppelingId) });

        // Default koppelings type so step 0 isn't blocking
        setKoppelingsType('eigen-organisatie');
      } catch (e) {
        if (!cancelled) console.error('Het laden van de koppeling is mislukt.');
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, koppelingId]);

  // Helper function to map module items to option format
  const mapModuleToOption = useCallback((item, index) => {
    const label =
      item?.['@self']?.name ||
      item?.naam ||
      item?.name ||
      item?.title ||
      item?.label ||
      `Applicatie ${index + 1}`;
    const value = item?.['@self']?.id || item?.id || item?.slug || label;
    return { value: String(value), label: String(label), data: item };
  }, []);

  // Server-side search for modules (used by ConSchemaEnhancedField)
  const searchModules = useCallback(
    async (query) => {
      try {
        setOwnAppLoading(true);
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
          'koppeling_form_search'
        );
        const collection = store.object.getCollection(
          'voorzieningen_module_koppeling_form_search'
        );
        const list = collection?.results || collection || [];
        const options = list.map(mapModuleToOption);

        // Merge with existing options to preserve selected items
        setOwnAppOptions((prevOptions) => {
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
        setOwnAppLoading(false);
      }
    },
    [store, mapModuleToOption]
  );

  // Debounced search function for modules
  const debouncedSearchModules = useDebouncedInput(searchModules, 250, {
    disableInstantValidation: true,
  });

  // Helper: extract relation id from various shapes (mirrors example.js)
  const extractRelationId = (rel) => {
    if (!rel) return '';
    if (typeof rel === 'string') return rel;
    if (typeof rel === 'object') {
      return String(rel.id || rel.value || rel?.['@self']?.id || '') || '';
    }
    return '';
  };

  // Resolve and cache application names for module ids present in searchResults
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setResultsLoading(true);
        // Collect all module ids from results (moduleA/moduleB/applicatie1/applicatie2/etc.)
        const ids = [];
        for (const k of searchResults || []) {
          const rels = k?.['@self']?.relations || {};
          const aRel =
            rels.moduleA ?? k.moduleA ?? k.applicatie1 ?? k.applicatieA ?? k.appA;
          const bRel =
            rels.moduleB ?? k.moduleB ?? k.applicatie2 ?? k.applicatieB ?? k.appB;
          const aId = String(extractRelationId(aRel));
          const bId = String(extractRelationId(bRel));
          if (aId) ids.push(aId);
          if (bId) ids.push(bId);
        }

        if (!ids.length) {
          if (!cancelled) setResolvedModulesFromResults([]);
          return;
        }

        const uniqueIds = Array.from(new Set(ids.map((v) => String(v))));

        // Build a local map from existing module options first
        const localMap = new Map();
        for (const opt of modulesOptions || []) {
          const key = String(opt?.value ?? '');
          if (key) localMap.set(key, String(opt?.label ?? key));
        }

        const resultMap = new Map();
        const missingIds = [];
        for (const id of uniqueIds) {
          if (localMap.has(id)) {
            resultMap.set(id, localMap.get(id));
          } else {
            missingIds.push(id);
          }
        }

        // Fetch missing module names in one batched call if any
        if (missingIds.length) {
          try {
            const params = new URLSearchParams({
              _limit: '100',
              _page: '1',
              _published: 'false',
            });
            for (const id of missingIds) params.append('_search', id);
            const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${params}`;
            const res = await fetch(endpoint, {
              headers: { Accept: 'application/json' },
            });
            if (res.ok) {
              const data = await res.json();
              const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                ? data.results
                : [];
              for (const item of list) {
                const id = String(
                  item?.id || item?.['@self']?.id || item?.uuid || item?.value || ''
                );
                if (!id) continue;
                const label = String(
                  item?.naam ||
                    item?.name ||
                    item?.title ||
                    item?.label ||
                    item?.uuid ||
                    id
                );
                resultMap.set(id, label);
              }
            }
          } catch {
            // ignore fetch errors; fallback below
          }
        }

        // Finalize array in input order with fallback label = id
        const resolved = uniqueIds.map((id) => ({
          value: id,
          label: String(resultMap.get(id) || id),
        }));

        if (!cancelled) setResolvedModulesFromResults(resolved);
      } catch {
        if (!cancelled) setResolvedModulesFromResults([]);
      } finally {
        if (!cancelled) setResultsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      setResultsLoading(false);
    };
  }, [searchResults, modulesOptions]);

  // Search koppelingen by selected module id (auto when ownApp changes)
  // Searches for koppelingen where the selected module is either moduleA or moduleB
  useEffect(() => {
    const moduleId = ownApp?.value ? String(ownApp.value) : '';
    let cancelled = false;
    const run = async () => {
      if (!moduleId) {
        setSearchResults([]);
        setResolvedModulesFromResults([]);
        setResultsLoading(false);
        return;
      }
      setLoading(true);
      setResultsLoading(true);
      try {
        // Fetch koppelingen where moduleA = moduleId
        const paramsA = new URLSearchParams({
          _limit: '20',
          _page: '1',
          _published: 'false',
        });
        paramsA.append('moduleA', moduleId);
        paramsA.append('_source', 'index');
        const endpointA = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${paramsA}`;

        // Fetch koppelingen where moduleB = moduleId
        const paramsB = new URLSearchParams({
          _limit: '20',
          _page: '1',
          _published: 'false',
        });
        paramsB.append('moduleB', moduleId);
        paramsB.append('_source', 'index');
        const endpointB = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${paramsB}`;

        // Execute both fetches in parallel
        const [resA, resB] = await Promise.all([
          fetch(endpointA, { headers: { Accept: 'application/json' } }),
          fetch(endpointB, { headers: { Accept: 'application/json' } }),
        ]);

        // Process results from moduleA search
        const listA = [];
        if (resA.ok) {
          const dataA = await resA.json();
          const extractedA = Array.isArray(dataA)
            ? dataA
            : Array.isArray(dataA?.results)
            ? dataA.results
            : [];
          listA.push(...extractedA);
        }

        // Process results from moduleB search
        const listB = [];
        if (resB.ok) {
          const dataB = await resB.json();
          const extractedB = Array.isArray(dataB)
            ? dataB
            : Array.isArray(dataB?.results)
            ? dataB.results
            : [];
          listB.push(...extractedB);
        }

        // Merge results and remove duplicates based on koppeling id
        const allResults = [...listA, ...listB];
        const uniqueResults = [];
        const seenIds = new Set();

        for (const item of allResults) {
          const itemId = item?.id || item?.['@self']?.id;
          if (itemId && !seenIds.has(itemId)) {
            seenIds.add(itemId);
            uniqueResults.push(item);
          } else if (!itemId) {
            // Include items without IDs (shouldn't happen but handle gracefully)
            uniqueResults.push(item);
          }
        }

        // Safety filter: ensure selected module is moduleA or moduleB
        const filtered = uniqueResults.filter((k) => {
          const rels = k?.['@self']?.relations || {};
          const aRel =
            rels.moduleA ?? k.moduleA ?? k.applicatie1 ?? k.applicatieA ?? k.appA;
          const bRel =
            rels.moduleB ?? k.moduleB ?? k.applicatie2 ?? k.applicatieB ?? k.appB;
          const aId = String(extractRelationId(aRel));
          const bId = String(extractRelationId(bRel));
          return aId === moduleId || bId === moduleId;
        });

        if (!cancelled) setSearchResults(filtered);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [ownApp?.value]);

  useEffect(() => {
    loadBuitengemeentelijkeVoorzieningen();
  }, []);

  // Server-side search for organisaties
  const searchOrganisaties = useCallback(
    async (query) => {
      try {
        setOrganisatieLoading(true);
        const q = String(query || '').trim();

        // Always fetch organizations - either with search query or initial load
        const params = {
          _limit: '50',
          _page: '1',
          _source: 'index',
          '_extend[]': '@self.schema',
          _published: 'false',
        };

        // Add search parameter if query is provided
        if (q) {
          params._search = q;
        }

        await store.object.fetchCollection('voorzieningen', 'organisatie', params);
        const collection = store.object.getCollection('voorzieningen_organisatie');
        const list = collection?.results || collection || [];

        const options = list.map((item, index) => {
          const label =
            item?.['@self']?.name ||
            item?.naam ||
            item?.name ||
            item?.title ||
            `Organisatie ${index + 1}`;
          const value = item?.['@self']?.id || item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        });
        setOrganisatieOptions(options);
      } catch (e) {
        setOrganisatieOptions([]);
      } finally {
        setOrganisatieLoading(false);
      }
    },
    [store]
  );

  // Debounced search function for organisaties
  const debouncedSearchOrganisaties = useDebouncedInput(searchOrganisaties, 500, {
    disableInstantValidation: true,
  });

  // Trigger initial organization search when switching to 'aanbieden-koppeling'
  useEffect(() => {
    if (koppelingsType === 'aanbieden-koppeling') {
      // Load initial organizations when switching to aanbieden-koppeling mode
      searchOrganisaties('');
    }
  }, [koppelingsType, searchOrganisaties]);

  useEffect(() => {
    const shouldLoadStandards =
      standaardenOptions.length === 0 && !standaardenOptionsLoading;

    if (shouldLoadStandards) {
      const tasks = [];
      if (shouldLoadStandards) tasks.push(loadStandaarden());
      Promise.all(tasks).catch(() => {});
    }
  }, []);

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

  // Build a detailed tooltip similar to ac-register when Next is disabled
  const getNextDisabledTooltip = () => {
    const logicalStep = getLogicalStepFromPhysical(currentStep);

    if (logicalStep === 0 && koppelingsType === 'aanbieden-koppeling') {
      // Aanbieder step validation
      if (aanbiederKeuze === 'bestaand') {
        if (!aanbieder) {
          return 'Selecteer een aanbieder';
        }
      } else {
        if (!aanbiederOrganisatie.naam || !aanbiederOrganisatie.naam.trim()) {
          return 'Vul de naam van de organisatie in';
        }
        if (!aanbiederOrganisatie.type || !aanbiederOrganisatie.type.trim()) {
          return 'Selecteer het type organisatie';
        }
        if (!aanbiederOrganisatie.website || !aanbiederOrganisatie.website.trim()) {
          return 'Vul de website van de organisatie in';
        }
        if (
          aanbiederOrganisatie.website &&
          !validateWebsite(String(aanbiederOrganisatie.website).trim())
        ) {
          return 'Website heeft een ongeldig formaat';
        }
      }
      return '';
    }

    if (logicalStep === 1) {
      // Step 1: Applicatie selectie is verplicht
      if (!ownApp?.value) {
        return 'Selecteer eerst een applicatie om door te gaan.';
      }
      return '';
    }
    if (logicalStep !== 2) return ''; // Updated: step 2 is now Toevoegen
    const messages = [];
    const missing = [];
    let missingA = false;
    let missingB = false;
    let missingR = false;
    for (let i = 0; i < rows.length; i++) {
      const rowId = rows[i];
      const appAId = selectedAppAByRow[rowId] || ownApp?.value;
      const appBId = selectedAppBByRow[rowId];
      const richting = directionByRow[rowId];
      if (!appAId) missingA = true;
      if (!appBId) missingB = true;
      if (!richting) missingR = true;
    }
    if (missingA) missing.push('Applicatie A');
    if (missingB) missing.push('Applicatie B');
    if (missingR) missing.push('Richting');
    if (missing.length > 0) {
      messages.push(`Verplichte velden nog niet ingevuld: ${missing.join(', ')}`);
    }
    return messages.join('\n');
  };

  const canGoNext = () => {
    const logicalStep = getLogicalStepFromPhysical(currentStep);

    // Aanbieder step (logical step 0) - only for 'aanbieden-koppeling' type
    if (logicalStep === 0 && koppelingsType === 'aanbieden-koppeling') {
      // If user selected "bestaand", check if aanbieder is selected
      if (aanbiederKeuze === 'bestaand') {
        return !!aanbieder && String(aanbieder).trim() !== '';
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
          return false;
        }
      }

      // All required fields must be filled
      return missingNewOrgFields.length === 0;
    }

    // Zoeken step (logical step 1)
    if (logicalStep === 1) {
      return !!ownApp?.value; // Applicatie selectie is verplicht
    }

    // Toevoegen step (logical step 2)
    if (logicalStep === 2) {
      if (!rows.length) return false;
      // Require Applicatie A, Applicatie B and Richting for all rows
      for (const rowId of rows) {
        const appAId = selectedAppAByRow[rowId] || ownApp?.value;
        const appBId = selectedAppBByRow[rowId];
        const richting = directionByRow[rowId];
        if (!appAId || !appBId || !richting) return false;
      }
      return true;
    }

    return true;
  };

  // (Removed) Previously triggered koppeling search from the own-app select input

  const addRow = () => {
    if (isEditMode) return; // In edit mode, limit to a single row
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
    setStandaardenByRow((prev) =>
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
        const standaarden = standaardenByRow[rowId] || [];
        const payload = {
          naam,
          moduleA: appAId,
          moduleB: appBId,
          gegevensuitwisselingRichting: richting,
          type: soort,
          beschrijvingKort: beschrijving,
          status,
          standaardversies: standaarden,
        };

        // For 'aanbieden-koppeling' type, use the selected aanbieder
        if (koppelingsType === 'aanbieden-koppeling' && aanbieder) {
          payload.aanbieder = String(aanbieder);
        }

        return payload;
      })
      .filter(Boolean);
  };

  const getStandaardenQueryParams = useCallback(() => {
    const baseParams = {
      _limit: '500', // Load 500 standaarden upfront
      _page: '1',
      _source: 'index',
    };

    // Force the correct type for standaarden, regardless of schema-provided params
    baseParams.gemmaType = 'Standaard';

    // Ensure we do not send schema-provided _extend for standards requests
    if (baseParams._extend) {
      delete baseParams._extend;
    }
    if (baseParams['_extend[]']) {
      delete baseParams['_extend[]'];
    }

    return baseParams;
  }, []);

  const loadStandaarden = useCallback(async () => {
    console.info('📋 Loading standaarden via object store cache...');
    setStandaardenOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
        '_extend[]': '@self.schema',
        _published: 'false',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const list = await response.json();

      const options = list.results
        .map((item, index) => {
          const label =
            item?.xml?.name?._value ||
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            `Standaard ${index + 1}`;
          const value = item?.value || item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        })
        .filter((o) => o.label && o.value);

      setStandaardenOptions(options);
      console.info(`✅ Loaded ${options.length} standaarden (cache-first)`);
    } catch (e) {
      console.error('Failed to load standaarden:', e);
      setStandaardenOptions([]);
    } finally {
      setStandaardenOptionsLoading(false);
    }
  }, [getStandaardenQueryParams, store]);

  // Add fetch function for buitengemeentelijke voorzieningen

  const loadBuitengemeentelijkeVoorzieningen = async () => {
    console.info('📋 Loading external facilities via object store cache...');
    setBuitengemeentelijkeOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Buitengemeentelijke voorziening',
        '_extend[]': '@self.schema',
        _published: 'false',
      });

      console.info('📋 Fetching external facilities from openconnector endpoint...');

      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const list = await response.json();

      const options = list.results
        .map((item, index) => {
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
        })
        .filter((o) => o.label && o.value);

      setBuitengemeentelijkeOptions(options);
      console.info(`✅ Loaded ${options.length} external facilities (cache-first)`);
    } catch (e) {
      console.error('Failed to load external facilities:', e);
      setBuitengemeentelijkeOptions([]);
    } finally {
      setBuitengemeentelijkeOptionsLoading(false);
    }
  };

  // Reset functions for form state
  const handleRetryForm = () => {
    setSaveResult(null);
    setSaveErrors([]);
  };

  const handleResetForm = () => {
    // Reset all form state to initial values
    setCurrentStep(getInitialStep(koppelingsType));
    // LEGACY: setKoppelingsType(null); - Type now comes from URL, reset to default
    setKoppelingsType(typeFromUrl || 'eigen-organisatie');
    setSearchResults([]);
    setResolvedModulesFromResults([]);
    setOwnApp(null);
    setRows([0]);
    setNextRowId(1);
    setSelectedAppAByRow({});
    setSelectedAppBByRow({});
    setDirectionByRow({});
    setTypeByRow({});
    setBeschrijvingByRow({});
    setStatusByRow({});
    setStandaardenByRow([]);
    setNameByRow({});
    setSelectedModuleLabels({});
    setKoppelingIdByRow({});
    setSaveResult(null);
    setSaveErrors([]);
    // Reset aanbieder state
    setAanbieder(null);
    setAanbiederKeuze('bestaand');
    setAanbiederOrganisatie({
      naam: '',
      type: '',
      website: '',
      beschrijvingKort: '',
      beschrijvingLang: '',
      'e-mailadres': '',
      telefoonnummer: '',
      kvkNummer: '',
      logo: '',
    });
  };

  const handleSave = async () => {
    const payloads = serializeRowsToPayload();
    if (!payloads.length) return;

    setSaveLoading(true);
    setSaveResult(null);
    setSaveErrors([]);

    try {
      let finalAanbieder = aanbieder;

      // ✅ For aanbieden-koppeling with new organization, create the organization first
      if (koppelingsType === 'aanbieden-koppeling' && aanbiederKeuze === 'nieuw') {
        try {
          const newOrganizationData = {
            naam: aanbiederOrganisatie.naam,
            type: aanbiederOrganisatie.type,
            website: aanbiederOrganisatie.website,
            beschrijvingKort: aanbiederOrganisatie.beschrijvingKort,
            beschrijvingLang: aanbiederOrganisatie.beschrijvingLang,
            'e-mailadres': aanbiederOrganisatie['e-mailadres'],
            telefoonnummer: aanbiederOrganisatie.telefoonnummer,
            kvkNummer: aanbiederOrganisatie.kvkNummer,
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
          setSaveErrors([
            'Er is een fout opgetreden bij het aanmaken van de organisatie. Probeer het opnieuw.',
          ]);
          setSaveLoading(false);
          return;
        }
      }

      // Update payloads with final aanbieder
      if (koppelingsType === 'aanbieden-koppeling' && finalAanbieder) {
        payloads.forEach((payload) => {
          payload.aanbieder = String(finalAanbieder);
        });
      }

      const endpoint = '/api/apps/openregister/api/objects/voorzieningen/koppeling';
      // Align payloads with rows to decide POST vs PUT per row
      const requests = rows
        .map((rowId, index) => {
          const body = payloads[index];
          if (!body) return null;
          const existingId = koppelingIdByRow[rowId];
          const url = existingId
            ? `${endpoint}/${encodeURIComponent(String(existingId))}`
            : endpoint;
          const method = existingId ? 'PUT' : 'POST';
          return fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(body),
          });
        })
        .filter(Boolean);

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

  // On success, show success on review screen; no auto-navigation
  useEffect(() => {
    if (saveResult === 'success') {
      setRedirectCountdown(0);
    }
    return undefined;
  }, [saveResult]);

  const renderStep = (step) => {
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        // Aanbieder step - only for aanbieden-koppeling
        return (
          <ConKoppelingStageAanbieder
            aanbieder={aanbieder}
            setAanbieder={setAanbieder}
            aanbiederOrganisatie={aanbiederOrganisatie}
            setAanbiederOrganisatieData={setAanbiederOrganisatieData}
            loading={loading || saveLoading || prefillLoading}
            schemas={schemas}
            schemasLoading={schemasLoading}
            aanbiederKeuze={aanbiederKeuze}
            setAanbiederKeuze={setAanbiederKeuze}
            organisatieOptions={organisatieOptions}
            organisatieLoading={organisatieLoading}
            searchOrganisaties={debouncedSearchOrganisaties}
          />
        );
      case 1: // Koppeling zoeken
        return (
          <ConKoppelingStageZoeken
            loading={loading}
            ownAppOptions={ownAppOptions}
            ownApp={ownApp}
            setOwnApp={setOwnApp}
            ownAppLoading={ownAppLoading || applicatiePreloadLoading}
            searchResults={searchResults}
            resolvedModulesFromResults={resolvedModulesFromResults}
            resultsLoading={resultsLoading}
            getArrowForDirection={getArrowForDirection}
            isEditMode={isEditMode}
            onSearchModules={debouncedSearchModules}
            schemas={schemas}
          />
        );

      case 2: // Toevoegen
        return (
          <ConKoppelingStageToevoegen
            rows={rows}
            addRow={addRow}
            removeRow={removeRow}
            modulesOptions={modulesOptions}
            setModulesOptions={setModulesOptions}
            buitengemeentelijkeOptions={buitengemeentelijkeOptions}
            setBuitengemeentelijkeOptions={setBuitengemeentelijkeOptions}
            buitengemeentelijkeOptionsLoading={buitengemeentelijkeOptionsLoading}
            setBuitengemeentelijkeOptionsLoading={
              setBuitengemeentelijkeOptionsLoading
            }
            setSelectedModuleLabels={setSelectedModuleLabels}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
            setStandaardenLoading={setStandaardenOptionsLoading}
            loading={loading}
            selectedAppAByRow={selectedAppAByRow}
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
            standaardenByRow={standaardenByRow}
            setStandaardenByRow={setStandaardenByRow}
            nameByRow={nameByRow}
            setNameByRow={setNameByRow}
            isEditMode={isEditMode}
          />
        );

      case 3: // Controleren
        return (
          <ConKoppelingStageControleren
            rows={rows}
            modulesOptions={modulesOptions}
            selectedModuleLabels={selectedModuleLabels}
            selectedAppAByRow={selectedAppAByRow}
            selectedAppBByRow={selectedAppBByRow}
            ownApp={ownApp}
            directionByRow={directionByRow}
            typeByRow={typeByRow}
            typeOptions={typeOptions}
            beschrijvingByRow={beschrijvingByRow}
            statusByRow={statusByRow}
            statusOptions={statusOptions}
            standaardenByRow={standaardenByRow}
            standaardenOptions={standaardenOptions}
            setStandaardenByRow={setStandaardenByRow}
            nameByRow={nameByRow}
            getArrowForDirection={getArrowForDirection}
            saveResult={saveResult}
            saveErrors={saveErrors}
            redirectCountdown={redirectCountdown}
            isEditMode={isEditMode}
            onRetryForm={handleRetryForm}
            onResetForm={handleResetForm}
            koppelingsType={koppelingsType}
            aanbieder={aanbieder}
            organisatieOptions={organisatieOptions}
            aanbiederKeuze={aanbiederKeuze}
            aanbiederOrganisatie={aanbiederOrganisatie}
          />
        );

      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        return 'Aanbieder';
      case 1:
        return 'Controleren op bestaande koppeling';
      case 2:
        return isEditMode ? 'Bewerken' : 'Koppelingen met andere applicaties';
      case 3:
        return 'Controleer uw gegevens';
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

  const {
    icon: Icon,
    name: wizardName,
    schema: wizardSchema,
  } = useMemo(() => getActiveWizard() || {}, [koppelingsType]);
  const capitalizedSchema = _.capitalize(wizardSchema);
  const editModeTitle = `${capitalizedSchema} updaten`;

  const wizardType = isEditMode
    ? 'update'
    : koppelingsType === 'aanbieden-koppeling'
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
              Uw {isEditMode ? editModeTitle : wizardName}
            </Heading1>
            <Paragraph>
              {(() => {
                switch (getAdjustedStepIndex(currentStep)) {
                  case 0:
                    return 'Vul dit formulier in om uw koppeling te registreren in de softwarecatalogus.';
                  default:
                    return 'Selecteer een applicatie uit uw eigen aanbod waarvoor u een koppeling wilt publiceren.';
                }
              })()}
            </Paragraph>
          </div>

          <div>
            {saveResult !== 'success' && saveResult !== 'error' && (
              <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
                {currentStepName(currentStep)}
              </h3>
            )}

            <div className='ac-register-container ac-forms-product'>
              {saveResult !== 'success' && saveResult !== 'error' && (
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps
                    steps={(() => {
                      const steps = [];

                      // Conditionally include Aanbieder step (only for aanbieden-koppeling)
                      if (koppelingsType === 'aanbieden-koppeling') {
                        steps.push({
                          id: 'grp-aanbieder',
                          marker: 1,
                          status: getStatus(currentStep, getAdjustedStepIndex(0)),
                          title: 'Aanbieder',
                        });
                      }

                      steps.push({
                        id: 'grp-koppeling',
                        marker: koppelingsType === 'aanbieden-koppeling' ? 2 : 1,
                        status: getStatusMulti(
                          currentStep,
                          getAdjustedStepIndex(1),
                          getAdjustedStepIndex(2)
                        ),
                        title: 'Koppeling zoeken',
                        steps: [
                          {
                            id: 'sub-toevoegen',
                            status: getStatus(currentStep, getAdjustedStepIndex(2)),
                            title: isEditMode ? 'Bewerken' : 'Toevoegen',
                          },
                        ],
                      });

                      steps.push({
                        id: 'grp-review',
                        marker: koppelingsType === 'aanbieden-koppeling' ? 3 : 2,
                        status: getStatus(currentStep, getAdjustedStepIndex(3)),
                        title: 'Controleren',
                      });

                      return steps;
                    })()}
                  />
                </div>
              )}

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
                            koppelingIdByRow,
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

                {saveResult !== 'success' && saveResult !== 'error' && (
                  <div
                    className={clsx('ac-register-form-buttons')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <AcFlex spacing='xs' style={{ width: 'fit-content' }}>
                      {currentStep !== 0 && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => setCurrentStep(currentStep - 1)}
                          disabled={loading || saveLoading || prefillLoading}
                        >
                          Vorige
                        </AcButton>
                      )}

                      {getLogicalStepFromPhysical(currentStep) === 0 &&
                        koppelingsType === 'aanbieden-koppeling' && (
                          <AcButton
                            style='button'
                            buttonType='secondary'
                            icon={
                              aanbiederKeuze === 'bestaand' ? (
                                <VISUALS.BUILDING />
                              ) : (
                                <VISUALS.ARROW_LEFT />
                              )
                            }
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

                      {getLogicalStepFromPhysical(currentStep) === 1 && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.CUBE />}
                          onClick={() => setShowUnsavedChangesAlert(true)}
                        >
                          Ik kan de gewenste applicatie niet vinden
                        </AcButton>
                      )}
                    </AcFlex>

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
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={
                              !canGoNext() ||
                              loading ||
                              saveLoading ||
                              prefillLoading
                            }
                            title={!canGoNext() ? getNextDisabledTooltip() : ''}
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
                        onClick={handleSave}
                        loading={saveLoading}
                        disabled={saveLoading || prefillLoading || !canSave()}
                      >
                        {saveLoading ? 'Bezig met opslaan...' : 'Opslaan'}
                      </AcButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
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
        message={`Je staat op het punt om de koppeling ${wizardType} wizard te verlaten om een applicatie aan te maken. Na het aanmaken van de applicatie word je teruggeleid naar dit formulier. Al je huidige wijzigingen zullen niet worden opgeslagen.`}
        confirmLabel='Verlaten'
        cancelLabel='Blijven'
        confirmIcon={<VISUALS.ARROW_RIGHT />}
        cancelIcon={<VISUALS.ARROW_LEFT />}
      />
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsKoppeling)));
