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
import ConKoppelingStepGebruiksinformatie from './components/con-koppeling-step-gebruiksinformatie';
import ConKoppelingStepDeelnemers from './components/con-koppeling-step-deelnemers';
import { commongroundApiUrl } from '@src/config';
import { getActiveWizard } from '@src/constants/wizards.constants';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';
import { useDebouncedInput } from '@src/hooks';
import useStepper from '../../con-stepper';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * Koppeling Wizard (AcFormsKoppeling)
 *
 * This wizard allows users to register or edit koppelingen (connections) between applications.
 *
 * LEGACY NOTE: The initial "Soort koppeling" (type selection) step has been removed.
 * The koppeling type is now determined via URL parameter:
 * - ?type=aanbieden-koppeling - Gebruik beheerder flow (current implementation)
 * - ?type=eigen-organisatie - Aanbod beheerder flow (future implementation)
 *
 * If no type is provided, defaults to 'aanbieden-koppeling' (gebruik beheerder flow).
 *
 * This wizard is only accessible to Gemeente/Samenwerking. The applicatie dropdown
 * is limited to applications present in the organisation's gebruik (fetched with ?afnemer=).
 *
 * Current steps (gebruik beheerder flow - aanbieden-koppeling):
 * - Step 0: Een koppeling zoeken (Search for existing connections)
 * - Step 1: Toevoegen/Bewerken (Add/Edit connection details)
 * - Step 2: Controleren (Review and submit)
 */
const AcFormsKoppeling = ({ store }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gebruikId = searchParams.get('id') || ''; // For edit mode - we edit the gebruik object
  const koppelingIdFromUrl = searchParams.get('koppelingId') || ''; // For preselection
  const typeFromUrl = searchParams.get('type') || '';
  const applicatieFromUrl = searchParams.get('applicatie') || ''; // Read applicatie parameter from URL
  const isEditMode = !!gebruikId;

  // Validate type from URL and use it if valid
  const validTypes = ['eigen-organisatie', 'aanbieden-koppeling'];
  const initialType = validTypes.includes(typeFromUrl) ? typeFromUrl : null;

  const stepper = useStepper();

  const [loading, setLoading] = useState(false);
  const [koppelingsType, setKoppelingsType] = useState(
    initialType || 'aanbieden-koppeling'
  ); // Default to 'aanbieden-koppeling' (gebruik beheerder flow) if not specified

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step-header, .denhaag-process-steps .denhaag-process-steps__sub-step'
      );

      stepElements.forEach((stepEl, index) => {
        index++;

        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        if (index < stepper.getCurrentStep()) {
          stepEl.classList.add('ac-step-clickable');
          stepEl.onclick = (e) => {
            e.preventDefault();
            stepper.setCurrentStep(index);
          };
        }
      });
    };

    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [stepper.getCurrentStep()]);

  // Schema management state
  const [schemas, setSchemas] = useState({});

  // Fetch schemas on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        // Fetch koppeling schema
        let koppelingSchema = null;
        try {
          await store.object.fetchSchema('koppeling');
          koppelingSchema = store.object.getSchema('schema_koppeling');
        } catch (koppelingError) {
          console.error('Failed to fetch koppeling schema:', koppelingError);
        }

        // Fetch gebruik schema (for gebruik-beheerders flow)
        let gebruikSchema = null;
        try {
          await store.object.fetchSchema('gebruik');
          gebruikSchema = store.object.getSchema('schema_gebruik');
        } catch (gebruikError) {
          console.error('Failed to fetch gebruik schema:', gebruikError);
        }

        // Fetch organisatie schema (for leverancier creation)
        let organisatieSchema = null;
        try {
          await store.object.fetchSchema('organisatie');
          organisatieSchema = store.object.getSchema('schema_organisatie');
        } catch (organisatieError) {
          console.error('Failed to fetch organisatie schema:', organisatieError);
        }

        // Fetch dienst schema (for leverancier field reference)
        let dienstSchema = null;
        try {
          await store.object.fetchSchema('dienst');
          dienstSchema = store.object.getSchema('schema_dienst');
        } catch (dienstError) {
          console.error('Failed to fetch dienst schema:', dienstError);
        }

        setSchemas({
          koppeling: koppelingSchema,
          gebruik: gebruikSchema,
          organisatie: organisatieSchema,
          dienst: dienstSchema,
        });
      } catch (error) {
        console.error('Failed to fetch schemas for koppeling form:', error);
        setSchemas({});
      }
    };
    fetchSchemas();
  }, [store]);

  // Options for modules (applications)
  const [modulesOptions, setModulesOptions] = useState([]);
  // Options/loading specifically for the own-app searchable select
  const [ownAppOptions, setOwnAppOptions] = useState([]);
  const [ownAppLoading, setOwnAppLoading] = useState(false);

  /**
   * This wizard is only for Gemeente/Samenwerking. Applicatie dropdown is limited to
   * applications in the organisation's gebruik (afnemer). null = not loaded, [] = none, string[] = allowed ids.
   */
  const [allowedModuleIdsFromGebruik, setAllowedModuleIdsFromGebruik] =
    useState(null);
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

  // Gebruik state (for gebruik beheerder flow - aanbieden-koppeling)
  const [gebruik, setGebruik] = useState({
    selectedKoppelingId: null,
    status: '',
    startDatumInProductie: '',
    startDatumGepland: '',
    startDatumUitTeFaseren: '',
    startDatumUitGefaseerd: '',
    startDatumVerwerving: '',
    interneAantekening: '',
    deelnemers: [],
  });

  // Helper function to update gebruik state
  const setGebruikData = (key, value) => {
    setGebruik((prev) => ({ ...prev, [key]: value }));
  };
  const [deelnemerOptions, setDeelnemerOptions] = useState([]);
  const [deelnemersLoading, setDeelnemersLoading] = useState(false);

  // State for the full organization data (needed to get the type for deelnemers step visibility)
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);

  // New koppeling creation state
  const [koppelingKeuze, setKoppelingKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [nieuweKoppeling, setNieuweKoppeling] = useState({
    moduleB: null,
    richting: '',
    naam: '',
    leverancier: null,
  });
  const setNieuweKoppelingData = (key, value) => {
    setNieuweKoppeling((prev) => ({ ...prev, [key]: value }));
  };

  // Leverancier creation state (for new koppeling flow)
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

  // Module B options for new koppeling (target application)
  const [moduleBOptions, setModuleBOptions] = useState([]);
  const [moduleBLoading, setModuleBLoading] = useState(false);

  const directionOptions = [
    { value: 'AnaarB', label: 'A → B' },
    { value: 'BnaarA', label: 'B → A' },
    { value: 'bi-directioneel', label: '↔ Bi-directioneel' },
  ];

  const typeOptions = [
    { value: 'n.v.t.', label: 'N.v.t.' },
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
   * Fetch allowed module IDs for the applicatie dropdown.
   *
   * For Gemeente/Samenwerking: fetch gebruik records (afnemer) and derive allowed module IDs.
   * For Leverancier/Community: set 'ORGANISATION_OWNED' marker so the module fetch
   * will load modules owned by the organisation instead.
   */
  useEffect(() => {
    const activeOrg = store?.user?.activeOrganization;
    const activeOrgId = activeOrg?.uuid || activeOrg?.id;
    if (!activeOrgId) {
      setAllowedModuleIdsFromGebruik([]);
      return;
    }

    // Wait for fullActiveOrganisation to be loaded before deciding the fetch strategy
    if (fullActiveOrganisation === null) return;

    const orgType = fullActiveOrganisation?.type || '';
    const isSupplierOrCommunity = orgType === 'Leverancier' || orgType === 'Community';

    let isMounted = true;
    setAllowedModuleIdsFromGebruik(null);

    if (isSupplierOrCommunity) {
      // Leverancier/Community: show only modules owned by the organisation
      // Use special marker 'ORGANISATION_OWNED' to signal the module fetch effect
      setAllowedModuleIdsFromGebruik('ORGANISATION_OWNED');
      return;
    }

    const fetchGebruik = async () => {
      try {
        const url = `${commongroundApiUrl()}/softwarecatalog/api/gebruik?afnemer=${encodeURIComponent(
          String(activeOrgId)
        )}&_limit=1000&_extend[]=_schema`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const ids = new Set();
        for (const item of results) {
          const rel = item?.['@self']?.relations?.module ?? item?.module;
          if (rel == null) continue;
          const id =
            typeof rel === 'string'
              ? rel.trim()
              : String(rel?.id ?? rel?.value ?? rel?.['@self']?.id ?? '').trim();
          if (id) ids.add(id);
        }
        if (isMounted) setAllowedModuleIdsFromGebruik(Array.from(ids));
      } catch (e) {
        if (isMounted) setAllowedModuleIdsFromGebruik([]);
      }
    };

    fetchGebruik();
    return () => {
      isMounted = false;
    };
  }, [
    store?.user?.activeOrganization?.uuid,
    store?.user?.activeOrganization?.id,
    store,
    fullActiveOrganisation,
  ]);

  // Fetch modules (applications) based on the resolved strategy:
  // - 'ORGANISATION_OWNED': fetch modules owned by the active organisation (for Leverancier/Community)
  // - Array of IDs: fetch those specific modules (for Gemeente/Samenwerking with gebruik records)
  // - Empty array: no modules available
  useEffect(() => {
    let isMounted = true;
    if (allowedModuleIdsFromGebruik === null) return;

    const run = async () => {
      try {
        setOwnAppLoading(true);

        // Leverancier/Community: fetch modules owned by the organisation
        if (allowedModuleIdsFromGebruik === 'ORGANISATION_OWNED') {
          const activeOrg = store?.user?.activeOrganization;
          const activeOrgId = activeOrg?.uuid || activeOrg?.id;
          const params = new URLSearchParams({
            _limit: '40',
            _page: '1',
          });
          if (activeOrgId) {
            params.append('organisation', String(activeOrgId));
          }
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
          return;
        }

        // Gemeente/Samenwerking: fetch specific modules from gebruik records
        if (allowedModuleIdsFromGebruik.length === 0) {
          if (isMounted) {
            setModulesOptions([]);
            setOwnAppOptions([]);
          }
          setOwnAppLoading(false);
          return;
        }
        const options = [];
        for (const moduleId of allowedModuleIdsFromGebruik) {
          try {
            await store.object.fetchObject(
              'voorzieningen',
              'module',
              String(moduleId),
              { '_extend[]': ['_schema'], _published: 'false' }
            );
            const item = store.object.getObject(
              'voorzieningen_module',
              String(moduleId)
            );
            if (!item || !isMounted) continue;
            const id =
              item?.id ??
              item?.['@self']?.id ??
              item?.uuid ??
              item?.value ??
              moduleId;
            const label =
              item?.naam ||
              item?.name ||
              item?.title ||
              item?.label ||
              item?.uuid ||
              item?.id ||
              item?.value ||
              String(moduleId);
            options.push({
              value: String(id),
              label: String(label),
              data: item,
              type: 'applicatie',
            });
          } catch {
            // Skip single module fetch failure
          }
        }
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

    run();
    return () => {
      isMounted = false;
    };
  }, [allowedModuleIdsFromGebruik, store]);

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
                '_extend[]': ['_schema'],
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
        `/api/openregister/api/objects/voorzieningen/module/${encodeURIComponent(
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

  // Prefill gebruik data when editing (not koppeling - we edit the gebruik object)
  // The flow is the same as creating, but with all fields pre-filled
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      // Start at the first step (same as create flow)
      stepper.resetCurrentStep();
      setPrefillLoading(true);
      try {
        // Fetch the gebruik object (not the koppeling)
        await store.object.fetchObject(
          'voorzieningen',
          'gebruik',
          String(gebruikId),
          {
            '_extend[]': ['_schema'],
            _published: 'false',
          }
        );
        if (cancelled) return;

        const fetched = store.object.getObject(
          'voorzieningen_gebruik',
          String(gebruikId)
        );
        if (!fetched) return;

        // Extract koppelingen IDs from the gebruik object
        // First try fetched.koppelingen, if null/empty fallback to @self.relations.koppelingen
        const koppelingenSource =
          Array.isArray(fetched.koppelingen) && fetched.koppelingen.length > 0
            ? fetched.koppelingen
            : fetched['@self']?.relations?.koppelingen;
        const koppelingenIds = Array.isArray(koppelingenSource)
          ? koppelingenSource.map((k) => extractRelationId(k)).filter(Boolean)
          : [];

        // Extract module (applicatie) ID from the gebruik object
        // First try fetched.module, if null fallback to @self.relations.module
        const moduleId =
          extractRelationId(fetched.module) ||
          extractRelationId(fetched['@self']?.relations?.module);

        // Extract deelnemers from the gebruik object
        const deelnemersIds = Array.isArray(fetched.deelnemers)
          ? fetched.deelnemers.map((d) => extractRelationId(d)).filter(Boolean)
          : [];

        // Update gebruik state with the fetched data (same fields as create flow)
        setGebruik({
          selectedKoppelingId: koppelingenIds.length > 0 ? koppelingenIds[0] : null,
          status: fetched.status || '',
          startDatumInProductie: fetched.startDatumInProductie || '',
          startDatumGepland: fetched.startDatumGepland || '',
          startDatumUitTeFaseren: fetched.startDatumUitTeFaseren || '',
          startDatumUitGefaseerd: fetched.startDatumUitGefaseerd || '',
          startDatumVerwerving: fetched.startDatumVerwerving || '',
          interneAantekening: fetched.interneAantekening || '',
          deelnemers: deelnemersIds,
        });

        // If we have a module (applicatie), fetch and set it for the first step
        if (moduleId) {
          try {
            const label = await ensureModuleOptionAndGetLabel(moduleId);
            // Set the selected applicatie (pre-fills the first step)
            setOwnApp({ value: moduleId, label: label || moduleId });
          } catch (moduleError) {
            console.error('Error fetching module for edit mode:', moduleError);
          }
        }

        // Fetch koppelingen to populate the search results for display
        if (koppelingenIds.length > 0) {
          try {
            const koppelingFetches = koppelingenIds.map((id) =>
              fetch(
                `/api/openregister/api/objects/voorzieningen/koppeling/${encodeURIComponent(
                  id
                )}?_extend[]=@self.schema&_extend[]=@self.relations&_published=false`,
                { headers: { Accept: 'application/json' } }
              )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null)
            );
            const koppelingResults = await Promise.allSettled(koppelingFetches);
            const fetchedKoppelingen = koppelingResults
              .map((result) => (result.status === 'fulfilled' ? result.value : null))
              .filter(Boolean);

            if (fetchedKoppelingen.length > 0 && !cancelled) {
              // Add the fetched koppelingen to the results so they show up as selected
              setSearchResults((prev) => {
                const existingIds = new Set(
                  prev.map((k) => k?.id || k?.['@self']?.id)
                );
                const newKoppelingen = fetchedKoppelingen.filter(
                  (k) => !existingIds.has(k?.id || k?.['@self']?.id)
                );
                return [...prev, ...newKoppelingen];
              });
            }
          } catch (koppelingenError) {
            console.error(
              'Error fetching koppelingen for edit mode:',
              koppelingenError
            );
          }
        }

        // Default koppelings type to aanbieden-koppeling (gebruik beheerder flow)
        setKoppelingsType('aanbieden-koppeling');
      } catch (e) {
        if (!cancelled)
          console.error('Het laden van de gebruiksregistratie is mislukt.');
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, gebruikId, store]);

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
        };

        // Add search parameter if provided
        if (q) {
          queryParams._search = q;
        }

        // For Leverancier/Community: filter by organisation to show only own modules
        if (allowedModuleIdsFromGebruik === 'ORGANISATION_OWNED') {
          const activeOrg = store?.user?.activeOrganization;
          const activeOrgId = activeOrg?.uuid || activeOrg?.id;
          if (activeOrgId) {
            queryParams.organisation = String(activeOrgId);
          }
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
        let list = collection?.results || collection || [];

        // For Gemeente/Samenwerking: filter by allowed IDs from gebruik records
        if (
          allowedModuleIdsFromGebruik !== null &&
          allowedModuleIdsFromGebruik !== 'ORGANISATION_OWNED' &&
          Array.isArray(allowedModuleIdsFromGebruik)
        ) {
          const allowedSet = new Set(
            allowedModuleIdsFromGebruik.map((id) => String(id))
          );
          list = list.filter((item) => {
            const id = String(
              item?.['@self']?.id ?? item?.id ?? item?.uuid ?? item?.value ?? ''
            );
            return id && allowedSet.has(id);
          });
        }

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
    [store, mapModuleToOption, allowedModuleIdsFromGebruik]
  );

  // Debounced search function for modules
  const debouncedSearchModules = useDebouncedInput(searchModules, 250, {
    disableInstantValidation: true,
  });

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
          '_extend[]': '_schema',
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

  // Server-side search for module B (target application in new koppeling)
  // Uses the same cache-first approach as applicatie publiceren form
  const searchModuleB = useCallback(
    async (query) => {
      try {
        setModuleBLoading(true);
        const q = String(query || '').trim();

        const queryParams = {
          _limit: '50',
          _page: '1',
          _published: 'false',
        };

        if (q) {
          queryParams._search = q;
        }

        // Use cache-first method like applicatie publiceren form
        const list = await store.object.fetchModulesCacheFirst(queryParams);
        const options = list.map(mapModuleToOption);

        setModuleBOptions((prevOptions) => {
          const newOptionsMap = new Map(options.map((opt) => [opt.value, opt]));
          const mergedOptions = [...newOptionsMap.values()];
          prevOptions.forEach((opt) => {
            if (!newOptionsMap.has(opt.value)) {
              mergedOptions.push(opt);
            }
          });
          return mergedOptions;
        });
      } catch (e) {
        console.error('Module B search failed:', e);
      } finally {
        setModuleBLoading(false);
      }
    },
    [store, mapModuleToOption]
  );

  // Debounced search for module B
  const debouncedSearchModuleB = useDebouncedInput(searchModuleB, 250, {
    disableInstantValidation: true,
  });

  // Function to load buitengemeentelijke voorzieningen
  const loadBuitengemeentelijkeVoorzieningen = useCallback(async () => {
    setBuitengemeentelijkeOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Buitengemeentelijke voorziening',
        '_extend[]': '_schema',
        _published: 'false',
      });

      const response = await fetch(
        `${commongroundApiUrl()}/openregister/api/objects/vng-gemma/element?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const list = await response.json();

      const options = (list.results || [])
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
    } catch (e) {
      console.error('Failed to load external facilities:', e);
      setBuitengemeentelijkeOptions([]);
    } finally {
      setBuitengemeentelijkeOptionsLoading(false);
    }
  }, []);

  // Load initial leveranciers, module B options, and buitengemeentelijke voorzieningen when switching to 'nieuw' koppeling flow
  useEffect(() => {
    if (koppelingKeuze === 'nieuw') {
      searchOrganisaties('', setLeverancierOptions, setLeverancierLoading);
      searchModuleB('');
      loadBuitengemeentelijkeVoorzieningen();
    }
  }, [
    koppelingKeuze,
    searchOrganisaties,
    searchModuleB,
    loadBuitengemeentelijkeVoorzieningen,
  ]);

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
            rels.moduleB ?? k.moduleB ?? rels.buitengemeentelijkVoorziening ?? k.buitengemeentelijkVoorziening ?? k.applicatie2 ?? k.applicatieB ?? k.appB;
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
  // Note: We use a ref to track the last fetched moduleId to avoid unnecessary refetches
  const lastFetchedModuleIdRef = useRef(null);

  useEffect(() => {
    const moduleId = ownApp?.value ? String(ownApp.value) : '';
    let cancelled = false;

    const run = async () => {
      if (!moduleId) {
        setSearchResults([]);
        setResolvedModulesFromResults([]);
        setResultsLoading(false);
        lastFetchedModuleIdRef.current = null;
        return;
      }

      // Skip refetch if we already fetched for this moduleId
      if (lastFetchedModuleIdRef.current === moduleId) {
        return;
      }

      setLoading(true);
      setResultsLoading(true);
      try {
        // Fetch koppelingen where moduleA = moduleId
        const paramsA = new URLSearchParams({
          _limit: '40',
          _page: '1',
        });
        paramsA.append('moduleA', moduleId);
        const endpointA = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${paramsA}`;

        // Fetch koppelingen where moduleB = moduleId
        const paramsB = new URLSearchParams({
          _limit: '40',
          _page: '1',
        });
        paramsB.append('moduleB', moduleId);
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
            rels.moduleB ?? k.moduleB ?? rels.buitengemeentelijkVoorziening ?? k.buitengemeentelijkVoorziening ?? k.applicatie2 ?? k.applicatieB ?? k.appB;
          const aId = String(extractRelationId(aRel));
          const bId = String(extractRelationId(bRel));
          return aId === moduleId || bId === moduleId;
        });

        if (!cancelled) {
          lastFetchedModuleIdRef.current = moduleId;
          setSearchResults(filtered);
        }
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

  // Reset selected koppeling when application changes (but not on initial load)
  const prevOwnAppValueRef = useRef(ownApp?.value);
  useEffect(() => {
    // Only reset if ownApp value actually changed (not on initial mount)
    if (
      prevOwnAppValueRef.current !== undefined &&
      prevOwnAppValueRef.current !== ownApp?.value
    ) {
      setGebruikData('selectedKoppelingId', null);
    }
    prevOwnAppValueRef.current = ownApp?.value;
  }, [ownApp?.value]);

  // Reset selected koppeling when switching to 'nieuw' koppeling mode
  useEffect(() => {
    if (koppelingKeuze === 'nieuw') {
      setGebruikData('selectedKoppelingId', null);
    }
  }, [koppelingKeuze]);

  // Preselect koppeling from URL parameter (when coming from details page)
  useEffect(() => {
    if (koppelingIdFromUrl && !isEditMode) {
      setGebruikData('selectedKoppelingId', koppelingIdFromUrl);

      // Fetch the koppeling to get its applicaties and ensure it's in search results
      const fetchKoppelingForPreselection = async () => {
        try {
          const url = `/api/openregister/api/objects/voorzieningen/koppeling/${encodeURIComponent(
            koppelingIdFromUrl
          )}?_extend[]=@self.schema&_extend[]=@self.relations&_published=false`;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) return;
          const data = await res.json();

          const rels = data?.['@self']?.relations || {};
          const moduleAIdRaw = rels?.moduleA ?? data?.moduleA;
          const moduleAId = String(extractRelationId(moduleAIdRaw) || '');

          // If ownApp is not set, set it to moduleA
          if (!ownApp?.value && moduleAId) {
            const labelA = await ensureModuleOptionAndGetLabel(moduleAId);
            setOwnApp({ value: moduleAId, label: labelA || moduleAId });
          }

          // Add koppeling to search results if not already present
          setSearchResults((prev) => {
            const exists = prev.some(
              (k) =>
                String(k?.id || k?.['@self']?.id || '') ===
                String(koppelingIdFromUrl)
            );
            if (exists) return prev;
            return [data, ...prev];
          });
        } catch (error) {
          console.error('Failed to fetch koppeling for preselection:', error);
        }
      };

      fetchKoppelingForPreselection();
    }
  }, [koppelingIdFromUrl, isEditMode]);

  // Fetch full organization data to get the type and deelnemers (for gebruik beheerder flow)
  useEffect(() => {
    const fetchFullOrganisationData = async () => {
      const activeOrg = store?.user?.activeOrganization;
      const organisationId = activeOrg?.uuid || activeOrg?.id;

      if (!organisationId) return;

      try {
        setDeelnemersLoading(true);
        await store.object.fetchObject(
          'voorzieningen',
          'organisatie',
          organisationId,
          {
            '_extend[]': ['_schema', 'deelnemers'],
          }
        );

        const fullOrgData = store.object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );

        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);

          // Process deelnemers into options if organization is Samenwerking
          const orgType = fullOrgData?.type || '';
          if (orgType === 'Samenwerking') {
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
        }
      } catch (error) {
        console.error('Error fetching full organization data:', error);
        setDeelnemerOptions([]);
      } finally {
        setDeelnemersLoading(false);
      }
    };

    fetchFullOrganisationData();
  }, [store?.user?.activeOrganization?.uuid, store?.user?.activeOrganization?.id]);

  // Check if we need to show the deelnemers step (only when organization type is Samenwerking)
  const organizationType = fullActiveOrganisation?.type || '';
  const needsDeelnemersStep = organizationType === 'Samenwerking';

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
    const logicalStep = stepper.getLabelFromStep(stepper.getCurrentStep());

    if (logicalStep === 'koppeling-zoeken') {
      const messages = [];
      if (!ownApp?.value) {
        messages.push('Selecteer een applicatie');
      }
      if (koppelingKeuze === 'nieuw') {
        // New koppeling validation messages
        if (leverancierKeuze === 'bestaand') {
          if (!nieuweKoppeling.leverancier) {
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
        if (!nieuweKoppeling.richting) {
          messages.push('Selecteer een richting');
        }
        if (!nieuweKoppeling.moduleB) {
          messages.push('Selecteer applicatie B');
        }
        if (!nieuweKoppeling.naam?.trim()) {
          messages.push('Koppeling naam is verplicht');
        }
      } else {
        // Existing koppeling validation
        if (!gebruik.selectedKoppelingId) {
          messages.push('Selecteer een koppeling');
        }
      }
      return messages.join('\n');
    }

    if (logicalStep !== 'toevoegen') return ''; // Step 1 is Toevoegen/Bewerken

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
    const logicalStep = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Zoeken step (logical step 0)
    if (logicalStep === 'koppeling-zoeken') {
      // Applicatie selectie is verplicht
      if (!ownApp?.value) return false;

      if (koppelingKeuze === 'nieuw') {
        // New koppeling validation
        // Require leverancier (either selected or new with naam+website)
        if (leverancierKeuze === 'bestaand') {
          if (!nieuweKoppeling.leverancier) return false;
        } else {
          // Creating new leverancier - require naam and website
          if (!leverancierOrganisatie.naam?.trim()) return false;
          if (!leverancierOrganisatie.website?.trim()) return false;
          if (!validateWebsite(leverancierOrganisatie.website.trim())) return false;
        }
        // Require koppeling richting, moduleB and naam
        if (!nieuweKoppeling.richting) return false;
        if (!nieuweKoppeling.moduleB) return false;
        if (!nieuweKoppeling.naam?.trim()) return false;
        return true;
      }

      // Existing koppeling - require selection
      return !!gebruik.selectedKoppelingId;
    }

    // Gebruiksinformatie step (for gebruik beheerder flow)
    if (logicalStep === 'gebruiksinformatie') {
      // Require status to be selected
      return !!gebruik.status;
    }

    // Toevoegen step (logical step 1)
    if (logicalStep === 'toevoegen') {
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
    const payloads = rows
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

        // Check if the selected App B is a buitengemeentelijke voorziening
        // by checking if it exists in buitengemeentelijkeOptions (source of truth for BGV items)
        const isBuitengemeentelijk = buitengemeentelijkeOptions.some(
          (o) => String(o.value) === String(appBId)
        );

        const payload = {
          naam,
          moduleA: appAId,
          moduleB: isBuitengemeentelijk ? null : appBId,
          buitengemeentelijkVoorziening: isBuitengemeentelijk ? appBId : null,
          gegevensuitwisselingRichting: richting,
          type: soort,
          beschrijvingKort: beschrijving,
          status,
          standaardversies: standaarden,
        };

        return payload;
      })
      .filter(Boolean);

    return payloads;
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
        '_extend[]': '_schema',
        _published: 'false',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
      const response = await fetch(
        `${commongroundApiUrl()}/openregister/api/objects/vng-gemma/element?${queryParams}`,
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
        .filter((o) => o.label && o.value)
        .sort((a, b) => a.label.localeCompare(b.label));

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
    stepper.resetCurrentStep(); // reset the stepper to the first step
    // LEGACY: setKoppelingsType(null); - Type now comes from URL, reset to default
    setKoppelingsType(typeFromUrl || 'aanbieden-koppeling');
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
    // Reset gebruik state
    setGebruik({
      selectedKoppelingId: null,
      status: '',
      startDatumInProductie: '',
      startDatumGepland: '',
      startDatumUitTeFaseren: '',
      startDatumUitGefaseerd: '',
      startDatumVerwerving: '',
      interneAantekening: '',
      deelnemers: [],
    });
  };

  // Save function for gebruik-beheerders flow (aanbieden-koppeling)
  const handleSaveGebruik = async () => {
    // Common validation
    if (!gebruik.status) {
      setSaveResult('error');
      setSaveErrors(['Status is verplicht']);
      return;
    }

    const activeOrg = store?.user?.activeOrganization;
    const afnemerId = activeOrg?.uuid || activeOrg?.id;
    if (!afnemerId) {
      setSaveResult('error');
      setSaveErrors(['Geen actieve organisatie gevonden']);
      return;
    }

    if (!ownApp?.value) {
      setSaveResult('error');
      setSaveErrors(['Geen applicatie geselecteerd']);
      return;
    }

    setSaveLoading(true);
    setSaveResult(null);
    setSaveErrors([]);

    try {
      let finalKoppelingId = gebruik.selectedKoppelingId;

      // If creating a new koppeling, we need to create it first
      if (koppelingKeuze === 'nieuw') {
        let finalLeverancierId = nieuweKoppeling.leverancier;

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
            setSaveResult('error');
            setSaveErrors([
              'Er is een fout opgetreden bij het aanmaken van de leverancier. Probeer het opnieuw.',
            ]);
            setSaveLoading(false);
            return;
          }
        }

        // Step 2: Create the new koppeling
        try {
          // Check if the selected module B is a buitengemeentelijke voorziening
          const isBuitengemeentelijk = buitengemeentelijkeOptions.some(
            (o) => String(o.value) === String(nieuweKoppeling.moduleB)
          );

          const newKoppelingData = {
            naam: nieuweKoppeling.naam,
            moduleA: ownApp.value,
            moduleB: isBuitengemeentelijk ? null : nieuweKoppeling.moduleB,
            buitengemeentelijkVoorziening: isBuitengemeentelijk ? nieuweKoppeling.moduleB : null,
            gegevensuitwisselingRichting: nieuweKoppeling.richting,
            aanbieder: finalLeverancierId,
          };

          const createdKoppeling = await store.object.createObject(
            'voorzieningen',
            'koppeling',
            newKoppelingData
          );

          finalKoppelingId = createdKoppeling?.id || createdKoppeling?.['@self']?.id;

          if (!finalKoppelingId) {
            throw new Error('Koppeling aangemaakt maar geen ID ontvangen');
          }
        } catch (koppelingError) {
          console.error('Failed to create koppeling:', koppelingError);
          setSaveResult('error');
          setSaveErrors([
            'Er is een fout opgetreden bij het aanmaken van de koppeling. Probeer het opnieuw.',
          ]);
          setSaveLoading(false);
          return;
        }
      } else {
        // Using existing koppeling - validate it's selected
        if (!finalKoppelingId) {
          setSaveResult('error');
          setSaveErrors(['Geen koppeling geselecteerd']);
          setSaveLoading(false);
          return;
        }
      }

      // Step 3: Build payload for gebruik object
      const payload = {
        koppelingen: [finalKoppelingId],
        status: gebruik.status,
        interneAantekening: gebruik.interneAantekening || '',
        deelnemers: Array.isArray(gebruik.deelnemers) ? gebruik.deelnemers : [],
        afnemer: afnemerId,
        module: ownApp.value,
      };

      // Add the relevant date field based on status
      switch (gebruik.status) {
        case 'In productie':
          if (gebruik.startDatumInProductie) {
            payload.startDatumInProductie = gebruik.startDatumInProductie;
          }
          break;
        case 'Gepland':
          if (gebruik.startDatumGepland) {
            payload.startDatumGepland = gebruik.startDatumGepland;
          }
          break;
        case 'Uit te faseren':
          if (gebruik.startDatumUitTeFaseren) {
            payload.startDatumUitTeFaseren = gebruik.startDatumUitTeFaseren;
          }
          break;
        case 'Uitgefaseerd':
          if (gebruik.startDatumUitGefaseerd) {
            payload.startDatumUitGefaseerd = gebruik.startDatumUitGefaseerd;
          }
          break;
        case 'Verwerving':
          if (gebruik.startDatumVerwerving) {
            payload.startDatumVerwerving = gebruik.startDatumVerwerving;
          }
          break;
      }

      // Step 4: Create or update the gebruik object
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
    } catch (e) {
      setSaveResult('error');
      setSaveErrors([e?.message || 'Onbekende fout bij opslaan']);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSave = async () => {
    // Route to gebruik save for gebruik-beheerders flow
    if (koppelingsType === 'aanbieden-koppeling') {
      handleSaveGebruik();
      return;
    }

    // Existing logic for aanbod-beheerders flow
    const payloads = serializeRowsToPayload();
    if (!payloads.length) return;

    setSaveLoading(true);
    setSaveResult(null);
    setSaveErrors([]);

    try {
      const endpoint = '/api/openregister/api/objects/voorzieningen/koppeling';
      // Build requests for all payloads
      const requests = payloads.map((body, index) => {
        if (!body) return null;

        // Determine koppeling ID: use row-based ID
        const rowId = rows[index];
        const existingId =
          rowId !== undefined && koppelingIdByRow[rowId]
            ? koppelingIdByRow[rowId]
            : null;

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
      });

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
    const logicalStep = stepper.getLabelFromStep(step);

    switch (logicalStep) {
      case 'koppeling-zoeken':
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
            selectedKoppelingId={gebruik.selectedKoppelingId}
            setSelectedKoppelingId={(id) =>
              setGebruikData('selectedKoppelingId', id)
            }
            // New koppeling creation props
            koppelingKeuze={koppelingKeuze}
            setKoppelingKeuze={setKoppelingKeuze}
            nieuweKoppeling={nieuweKoppeling}
            setNieuweKoppelingData={setNieuweKoppelingData}
            // Leverancier props
            leverancierKeuze={leverancierKeuze}
            setLeverancierKeuze={setLeverancierKeuze}
            leverancierOrganisatie={leverancierOrganisatie}
            setLeverancierOrganisatieData={setLeverancierOrganisatieData}
            leverancierOptions={leverancierOptions}
            leverancierLoading={leverancierLoading}
            searchLeveranciers={debouncedSearchLeveranciers}
            // Module B options
            moduleBOptions={moduleBOptions}
            moduleBLoading={moduleBLoading}
            searchModuleB={debouncedSearchModuleB}
            // Buitengemeentelijke voorzieningen
            buitengemeentelijkeOptions={buitengemeentelijkeOptions}
            buitengemeentelijkeOptionsLoading={buitengemeentelijkeOptionsLoading}
          />
        );

      case 'toevoegen':
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

      case 'gebruiksinformatie':
        return (
          <ConKoppelingStepGebruiksinformatie
            status={gebruik.status}
            setStatus={(value) => setGebruikData('status', value)}
            startDatumInProductie={gebruik.startDatumInProductie}
            setStartDatumInProductie={(value) =>
              setGebruikData('startDatumInProductie', value)
            }
            startDatumGepland={gebruik.startDatumGepland}
            setStartDatumGepland={(value) =>
              setGebruikData('startDatumGepland', value)
            }
            startDatumUitTeFaseren={gebruik.startDatumUitTeFaseren}
            setStartDatumUitTeFaseren={(value) =>
              setGebruikData('startDatumUitTeFaseren', value)
            }
            startDatumUitGefaseerd={gebruik.startDatumUitGefaseerd}
            setStartDatumUitGefaseerd={(value) =>
              setGebruikData('startDatumUitGefaseerd', value)
            }
            startDatumVerwerving={gebruik.startDatumVerwerving}
            setStartDatumVerwerving={(value) =>
              setGebruikData('startDatumVerwerving', value)
            }
            interneAantekening={gebruik.interneAantekening}
            setInterneAantekening={(value) =>
              setGebruikData('interneAantekening', value)
            }
            loading={loading}
            schemas={schemas}
            isEditMode={isEditMode}
          />
        );

      case 'deelnemers':
        return (
          <ConKoppelingStepDeelnemers
            deelnemers={gebruik.deelnemers}
            setDeelnemers={(value) => setGebruikData('deelnemers', value)}
            loading={loading}
            deelnemerOptions={deelnemerOptions}
            deelnemersLoading={deelnemersLoading}
          />
        );

      case 'controleren':
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
            selectedKoppelingId={gebruik.selectedKoppelingId}
            statusGebruiksinformatie={gebruik.status}
            datumInGebruik={gebruik.startDatumInProductie}
            datumInOntwikkeling={gebruik.startDatumGepland}
            datumEindeOndersteuning={gebruik.startDatumUitTeFaseren}
            datumTeruggetrokken={gebruik.startDatumUitGefaseerd}
            datumVerwerving={gebruik.startDatumVerwerving}
            interneAantekening={gebruik.interneAantekening}
            deelnemers={gebruik.deelnemers}
            deelnemerOptions={deelnemerOptions}
            searchResults={searchResults}
            // New koppeling creation props
            koppelingKeuze={koppelingKeuze}
            nieuweKoppeling={nieuweKoppeling}
            leverancierKeuze={leverancierKeuze}
            leverancierOrganisatie={leverancierOrganisatie}
            buitengemeentelijkeOptions={buitengemeentelijkeOptions}
          />
        );

      default:
        return null;
    }
  };

  // steps configuration for the process steps component
  const processStepsConfig = useMemo(() => {
    const steps = [];

    stepper.resetStepDefinitions('process-steps');
    stepper.resetStepDefinitions('process-steps-status');

    if (koppelingsType === 'aanbieden-koppeling') {
      // Define the main step first (koppeling-zoeken)
      const koppelingZoekenMarker = stepper.defineStep(
        'process-steps',
        'koppeling-zoeken'
      );
      const firstMultiStepStatus = stepper.defineStep(
        'process-steps-status',
        'firstMultiStep'
      );

      // Build sub-steps for aanbieden-koppeling flow (define after main step)
      const subSteps = [
        {
          id: 'sub-gebruiksinformatie',
          marker: stepper.defineStep('process-steps', 'gebruiksinformatie'),
          status: getStatus(
            stepper.getCurrentStep(),
            stepper.defineStep('process-steps-status')
          ),
          title: 'Gebruiksinformatie',
        },
      ];

      // Only add deelnemers step if organization type is Samenwerking
      if (needsDeelnemersStep) {
        subSteps.push({
          id: 'sub-deelnemers',
          marker: stepper.defineStep('process-steps', 'deelnemers'),
          status: getStatus(
            stepper.getCurrentStep(),
            stepper.defineStep('process-steps-status')
          ),
          title: 'Deelnemers toevoegen',
        });
      }

      steps.push({
        id: 'grp-koppeling',
        marker: koppelingZoekenMarker,
        status: getStatusMulti(
          // get the current step from the stepper
          stepper.getCurrentStep(),
          // get process step status index
          firstMultiStepStatus,
          // get the index of the labeled step + [amount of sub-steps]
          stepper.getStepFromLabel('firstMultiStep') + subSteps.length
        ),
        title: 'Een koppeling zoeken',
        steps: subSteps,
      });
    } else if (koppelingsType === 'eigen-organisatie') {
      steps.push({
        id: 'grp-koppeling',
        marker: stepper.defineStep('process-steps', 'koppeling-zoeken'),
        status: getStatusMulti(
          // get the current step from the stepper
          stepper.getCurrentStep(),
          // get process step status index + define multi step label
          stepper.defineStep('process-steps-status', 'firstMultiStep'),
          // get the index of the labeled step + [amount of sub-steps]
          stepper.getStepFromLabel('firstMultiStep') + 1
        ),
        title: 'Een koppeling zoeken',
        steps: [
          {
            id: 'sub-toevoegen',
            marker: stepper.defineStep('process-steps', 'toevoegen'),
            status: getStatus(
              stepper.getCurrentStep(),
              stepper.defineStep('process-steps-status')
            ),
            title: isEditMode ? 'Bewerken' : 'Toevoegen',
          },
        ],
      });
    }

    steps.push({
      id: 'grp-review',
      marker: stepper.defineStep('process-steps', 'controleren'),
      status: getStatus(
        stepper.getCurrentStep(),
        stepper.defineStep('process-steps-status')
      ),
      title: 'Controleren',
    });

    return steps;
  }, [isEditMode, stepper, koppelingsType, needsDeelnemersStep]);

  const currentStepName = (step) => {
    const logicalStep = stepper.getLabelFromStep(step);

    switch (logicalStep) {
      case 'koppeling-zoeken':
        return 'Een koppeling zoeken';
      case 'gebruiksinformatie':
        return 'Gebruiksinformatie';
      case 'controleren':
        return 'Controleren';
      // @TODO fix
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
    // For gebruik-beheerders flow, validate gebruik-specific fields
    if (koppelingsType === 'aanbieden-koppeling') {
      // Check if we're creating a new koppeling or selecting an existing one
      if (koppelingKeuze === 'nieuw') {
        // Validate new koppeling fields
        if (leverancierKeuze === 'bestaand') {
          if (!nieuweKoppeling.leverancier) return false;
        } else {
          // New leverancier validation
          if (!leverancierOrganisatie.naam?.trim()) return false;
          if (!leverancierOrganisatie.website?.trim()) return false;
          if (!validateWebsite(leverancierOrganisatie.website.trim())) return false;
        }
        if (!nieuweKoppeling.richting) return false;
        if (!nieuweKoppeling.moduleB) return false;
        if (!nieuweKoppeling.naam?.trim()) return false;
      } else {
        // Existing koppeling - must have selected one
        if (!gebruik.selectedKoppelingId) return false;
      }

      // Common validation for both new and existing koppeling
      if (!gebruik.status) return false;
      if (!ownApp?.value) return false;
      const activeOrg = store?.user?.activeOrganization;
      if (!activeOrg?.uuid && !activeOrg?.id) return false;
      return true;
    }

    // For aanbod-beheerders flow, validate koppeling rows
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
          {saveResult !== 'success' && (
            <div>
              <Heading1
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Icon style={{ width: '1em', height: '1em' }} />
                Uw {isEditMode ? editModeTitle : wizardName}
              </Heading1>
              <Paragraph>
                {(() => {
                  switch (stepper.getCurrentStep()) {
                    case 1:
                      return 'Selecteer een applicatie uit uw eigen aanbod waarvoor u een koppeling wilt publiceren.';
                    default:
                      return 'Vul dit formulier in om uw koppeling te registreren in de softwarecatalogus.';
                  }
                })()}
              </Paragraph>
            </div>
          )}

          <div>
            {saveResult !== 'success' && saveResult !== 'error' && (
              <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
                {currentStepName(stepper.getCurrentStep())}
              </h3>
            )}

            <div className='ac-register-container ac-forms-product'>
              {saveResult !== 'success' && saveResult !== 'error' && (
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps steps={processStepsConfig} />
                </div>
              )}

              <div className='ac-register-form-container'>
                <div
                  className='sr-only'
                  role='status'
                  aria-live='polite'
                  id='form-status'
                >
                  {currentStepName(stepper.getCurrentStep())}
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
                    0
                  </div>
                )}

                {renderStep(stepper.getCurrentStep())}

                {saveResult !== 'success' && saveResult !== 'error' && (
                  <div
                    className={clsx('ac-register-form-buttons')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <AcFlex spacing='xs' style={{ width: 'fit-content' }}>
                      {/* show previous button on all steps except first step */}
                      {stepper.getCurrentStep() > 1 && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => stepper.previous()}
                          disabled={loading || saveLoading || prefillLoading}
                        >
                          Vorige
                        </AcButton>
                      )}

                      {/* "Ik kan de gewenste koppeling niet vinden" / "Bestaande koppeling selecteren" button */}
                      {stepper.getStepFromLabel('koppeling-zoeken') ===
                        stepper.getCurrentStep() &&
                        !isEditMode && (
                          <AcButton
                            style='button'
                            buttonType='secondary'
                            icon={
                              koppelingKeuze === 'bestaand' ? (
                                <VISUALS.LINK />
                              ) : (
                                <VISUALS.ARROW_LEFT />
                              )
                            }
                            onClick={() =>
                              setKoppelingKeuze(
                                koppelingKeuze === 'bestaand' ? 'nieuw' : 'bestaand'
                              )
                            }
                            disabled={
                              koppelingKeuze === 'bestaand' &&
                              (!ownApp?.value || loading)
                            }
                            title={
                              koppelingKeuze === 'bestaand' && !ownApp?.value
                                ? 'Selecteer eerst een applicatie'
                                : ''
                            }
                          >
                            {koppelingKeuze === 'bestaand'
                              ? 'Ik kan de gewenste koppeling niet vinden'
                              : 'Bestaande koppeling selecteren'}
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
                      {/* show next button on all steps except controleren (last step) */}
                      {stepper.getHighestStep('process-steps') !==
                        stepper.getCurrentStep() && (
                        <div className='ac-register-button-wrapper'>
                          <AcButton
                            style='button'
                            icon={<VISUALS.ARROW_RIGHT />}
                            onClick={() => stepper.next()}
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

                    {/* show save button on controleren step (last step) */}
                    {stepper.getHighestStep('process-steps') ===
                      stepper.getCurrentStep() && (
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
