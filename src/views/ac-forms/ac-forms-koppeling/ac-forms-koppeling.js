import { useState, useEffect, memo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { VISUALS } from '@src/constants';
import { useDebounce } from '@src/hooks/use-debounce.hook';
import _ from 'lodash';
// LEGACY: ConKoppelingStepSoort component no longer used - type selection removed
// Type is now determined via URL parameter (?type=eigen-organisatie or ?type=aanbieden-koppeling)
// import ConKoppelingStepSoort from './components/con-koppeling-step-soort';
import ConKoppelingStageZoeken from './components/con-koppeling-stage-zoeken';
import ConKoppelingStageToevoegen from './components/con-koppeling-stage-toevoegen';
import ConKoppelingStageControleren from './components/con-koppeling-stage-controleren';
import { commongroundApiUrl } from '@src/config';
import { getActiveWizard } from '@src/constants/wizards.constants';

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
  const initialStep = isEditMode ? 1 : 0; // Edit mode starts at step 1 (Toevoegen), otherwise step 0 (Zoeken)

  const [currentStep, setCurrentStep] = useState(initialStep);
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

  // (Removed) Schema management state

  // Options for modules (applications)
  const [modulesOptions, setModulesOptions] = useState([]);
  // Options/loading specifically for the own-app searchable select
  const [ownAppOptions, setOwnAppOptions] = useState([]);
  const [ownAppLoading, setOwnAppLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [resolvedModulesFromResults, setResolvedModulesFromResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // "Your" application (optional anchor for adding/searching)
  const [ownApp, setOwnApp] = useState(null);
  // Capture input typed into the select's search field (debounced)
  const [ownAppInput, setOwnAppInput] = useState('');
  const debouncedOwnAppInput = useDebounce(ownAppInput, 500);

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
        setOwnAppLoading(true);
        const params = new URLSearchParams({ _limit: '20', _page: '1' });
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
        if (modulesOptions.length === 0) return;

        // Check if the applicatie exists in options
        const applicatieOption = modulesOptions.find(
          (opt) => String(opt.value) === String(applicatieFromUrl)
        );

        if (applicatieOption) {
          // Pre-select the applicatie as "own app" (needs to be an object with value and label)
          setOwnApp({
            value: applicatieOption.value,
            label: applicatieOption.label,
          });
          setSelectedAppAByRow((prev) => ({ ...prev, [0]: applicatieOption.value }));
          setSelectedModuleLabels((prev) => ({
            ...prev,
            [applicatieOption.value]: applicatieOption.label,
          }));
        } else {
          // If applicatie not in initial list, fetch it directly
          const label = await ensureModuleOptionAndGetLabel(applicatieFromUrl);
          if (label) {
            setOwnApp({
              value: String(applicatieFromUrl),
              label: String(label),
            });
            setSelectedAppAByRow((prev) => ({ ...prev, [0]: applicatieFromUrl }));
            setSelectedModuleLabels((prev) => ({
              ...prev,
              [applicatieFromUrl]: label,
            }));
          }
        }
      } catch (error) {
        console.error('Error pre-selecting applicatie from URL:', error);
      }
    };

    preSelectApplicatie();
  }, [applicatieFromUrl, modulesOptions, isEditMode]);

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
        )}`,
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
      const option = { value: String(id), label: String(label), data: item };
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
        )}?_extend[]=@self.schema&_extend[]=@self.relations`;
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
        const params = new URLSearchParams({ _limit: '20', _page: '1' });
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
            const params = new URLSearchParams({ _limit: '100', _page: '1' });
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
        const paramsA = new URLSearchParams({ _limit: '20', _page: '1' });
        paramsA.append('moduleA', moduleId);
        paramsA.append('_source', 'database');
        const endpointA = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${paramsA}`;

        // Fetch koppelingen where moduleB = moduleId
        const paramsB = new URLSearchParams({ _limit: '20', _page: '1' });
        paramsB.append('moduleB', moduleId);
        paramsB.append('_source', 'database');
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
    if (currentStep !== 1) return ''; // Updated: step 1 is now Toevoegen (was step 2)
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
    // LEGACY: Step 0 (type selection) removed - type now comes from URL
    // if (currentStep === 0) return koppelingsType !== null; // type must be selected
    if (currentStep === 0) return true; // search is optional to proceed (was step 1)
    if (currentStep === 1) {
      // Toevoegen step (was step 2)
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

        // For 'aanbieden-koppeling' type, automatically set the user's organization as aanbieder
        if (
          koppelingsType === 'aanbieden-koppeling' &&
          store?.user?.activeOrganization
        ) {
          payload.aanbieder = store.user.activeOrganization.uuid;
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

  // Reset functions for form state
  const handleRetryForm = () => {
    setSaveResult(null);
    setSaveErrors([]);
  };

  const handleResetForm = () => {
    // Reset all form state to initial values
    setCurrentStep(0); // Step 0 is now Koppeling zoeken (was step 1)
    // LEGACY: setKoppelingsType(null); - Type now comes from URL, reset to default
    setKoppelingsType(typeFromUrl || 'eigen-organisatie');
    setSearchQuery('');
    setSearchResults([]);
    setResolvedModulesFromResults([]);
    setOwnApp(null);
    setOwnAppInput('');
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
  };

  const handleSave = async () => {
    const payloads = serializeRowsToPayload();
    if (!payloads.length) return;

    setSaveLoading(true);
    setSaveResult(null);
    setSaveErrors([]);

    try {
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
    switch (step) {
      // LEGACY: Step 0 (Soort koppeling) - Type selection removed, now comes from URL parameter
      // case 0:
      //   return (
      //     <ConKoppelingStepSoort
      //       koppelingsType={koppelingsType}
      //       setKoppelingsType={setKoppelingsType}
      //       isEditMode={isEditMode}
      //     />
      //   );
      case 0: // Koppeling zoeken (was step 1)
        return (
          <ConKoppelingStageZoeken
            loading={loading}
            ownAppOptions={ownAppOptions}
            ownApp={ownApp}
            setOwnApp={setOwnApp}
            ownAppLoading={ownAppLoading}
            setOwnAppInput={setOwnAppInput}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            resolvedModulesFromResults={resolvedModulesFromResults}
            resultsLoading={resultsLoading}
            getArrowForDirection={getArrowForDirection}
            isEditMode={isEditMode}
          />
        );

      case 1: // Toevoegen (was step 2)
        return (
          <ConKoppelingStageToevoegen
            rows={rows}
            addRow={addRow}
            removeRow={removeRow}
            modulesOptions={modulesOptions}
            setModulesOptions={setModulesOptions}
            setSelectedModuleLabels={setSelectedModuleLabels}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
            setStandaardenLoading={setStandaardenOptionsLoading}
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
            standaardenByRow={standaardenByRow}
            setStandaardenByRow={setStandaardenByRow}
            nameByRow={nameByRow}
            setNameByRow={setNameByRow}
            isEditMode={isEditMode}
          />
        );

      case 2: // Controleren (was step 3)
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
          />
        );

      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      // LEGACY: Step 0 was 'Soort koppeling' - now removed
      // case 0:
      //   return 'Soort koppeling';
      case 0: // Was step 1
        return 'Koppeling zoeken';
      case 1: // Was step 2
        return isEditMode ? 'Bewerken' : 'Toevoegen';
      case 2: // Was step 3
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
                : koppelingsType === 'aanbieden-koppeling'
                ? ' melden'
                : ' registreren'}
            </Heading1>
            <Paragraph>
              Zoek naar bestaande koppelingen, voeg nieuwe koppelingen toe en
              controleer uw invoer.
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
                      const steps = [
                        // LEGACY: Step 1 (Soort koppeling) - Type selection removed, now comes from URL
                        // {
                        //   id: 'grp-soort',
                        //   marker: 1,
                        //   status: getStatus(currentStep, 0),
                        //   title: 'Soort koppeling',
                        // },
                        {
                          id: 'grp-koppeling',
                          marker: 1, // Was marker 2
                          status: getStatusMulti(currentStep, 0, 1), // Was (1, 2)
                          title: 'Koppeling zoeken',
                          steps: [
                            {
                              id: 'sub-toevoegen',
                              status: getStatus(currentStep, 1), // Was step 2
                              title: isEditMode ? 'Bewerken' : 'Toevoegen',
                            },
                          ],
                        },
                        {
                          id: 'grp-review',
                          marker: 2, // Was marker 3
                          status: getStatus(currentStep, 2), // Was step 3
                          title: 'Controleren',
                        },
                      ];
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
                    className={clsx(
                      'ac-register-form-buttons',
                      currentStep !== 0 && 'ac-register-form-buttons-not-first-step'
                    )}
                  >
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

                    {currentStep !== 2 && ( // Was step 3
                      <div className='ac-register-button-wrapper'>
                        <AcButton
                          style='button'
                          className={clsx(
                            currentStep === 0 && 'ac-register-form-next-button'
                          )}
                          icon={<VISUALS.ARROW_RIGHT />}
                          onClick={() => setCurrentStep(currentStep + 1)}
                          disabled={
                            !canGoNext() || loading || saveLoading || prefillLoading
                          }
                          title={!canGoNext() ? getNextDisabledTooltip() : ''}
                        >
                          Volgende
                        </AcButton>
                      </div>
                    )}

                    {currentStep === 2 && ( // Was step 3
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
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsKoppeling)));
