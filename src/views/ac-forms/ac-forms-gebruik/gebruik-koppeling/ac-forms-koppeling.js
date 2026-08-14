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
import useStepper, {
  addStepperClickHandlers,
  generateSteps,
} from '../../con-stepper';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import {
  useSchemaFetcher,
  createModuleMapper,
  createOrganisatieMapper,
  createBuitengemeentelijkeMapper,
  createModuleSearchConfig,
  createOrganisatieSearchConfig,
  createEntitySearchConfig,
  useEntitySearch,
  fetchMissingEntities,
  fetchModuleIdsFromGebruikByAfnemer,
  mapId,
  useFullOrganization,
} from '../../wizard-utils';

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

  // Schema management using wizard-utils
  const { schemas } = useSchemaFetcher(store, [
    'koppeling',
    'gebruik',
    'organisatie',
    'dienst',
  ]);

  /**
   * This wizard is only for Gemeente/Samenwerking. Applicatie dropdown is limited to
   * applications in the organisation's gebruik (afnemer). null = not loaded, [] = none, string[] = allowed ids.
   */
  const [allowedModuleIdsFromGebruik, setAllowedModuleIdsFromGebruik] =
    useState(null);

  // Options for modules (applications) - using wizard-utils
  const moduleMapper = useMemo(() => createModuleMapper({ type: 'applicatie' }), []);
  const moduleSearchConfig = useMemo(
    () =>
      createModuleSearchConfig(store, {
        useCacheFirst: true,
        mapToOption: moduleMapper,
        cacheKey: 'koppeling_form_search',
        // Only an actual id list narrows the results; 'ORGANISATION_OWNED' is a
        // marker for Leverancier/Community and is applied as an organisation
        // filter in queryParamsBuilder instead.
        allowedIds: Array.isArray(allowedModuleIdsFromGebruik)
          ? allowedModuleIdsFromGebruik
          : undefined,
        queryParamsBuilder: (searchTerm, additionalParams = {}) => {
          const params = {
            _limit: '50',
            _page: '1',
            _published: 'false',
            ...(searchTerm && searchTerm.trim()
              ? { _search: searchTerm.trim() }
              : {}),
            ...additionalParams,
          };

          // Leverancier/Community: show only modules owned by the organisation
          if (allowedModuleIdsFromGebruik === 'ORGANISATION_OWNED') {
            const activeOrg = store?.user?.activeOrganization;
            const activeOrgId = activeOrg?.uuid || activeOrg?.id;
            if (activeOrgId) {
              params.organisation = String(activeOrgId);
            }
          }

          return params;
        },
      }),
    [store, moduleMapper, allowedModuleIdsFromGebruik]
  );
  const {
    search: searchModules,
    loading: modulesLoading,
    options: modulesOptions,
    setOptions: setModulesOptions,
  } = useEntitySearch(moduleSearchConfig, {
    debounceDelay: 250,
    mergeStrategy: 'preserve-existing',
  });

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

  // Buitengemeentelijke voorzieningen options with search functionality - using wizard-utils
  const buitengemeentelijkeMapper = useMemo(
    () => createBuitengemeentelijkeMapper(),
    []
  );
  const buitengemeentelijkeSearchConfig = useMemo(
    () =>
      createEntitySearchConfig(store, 'element', {
        collectionKey: 'vng-gemma',
        mapToOption: buitengemeentelijkeMapper,
        queryParamsBuilder: (searchTerm, additionalParams = {}) => ({
          _limit: '500',
          _page: '1',
          _published: 'false',
          gemmaType: 'Buitengemeentelijke voorziening',
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
          ...additionalParams,
        }),
        extendParams: ['@self.schema'],
      }),
    [store, buitengemeentelijkeMapper]
  );
  const {
    search: searchBuitengemeentelijkeVoorzieningen,
    loading: buitengemeentelijkeOptionsLoading,
    options: buitengemeentelijkeOptions,
    setOptions: setBuitengemeentelijkeOptions,
  } = useEntitySearch(buitengemeentelijkeSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });

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
  // Leverancier (organisatie) options with search functionality - using wizard-utils
  const organisatieMapper = useMemo(() => createOrganisatieMapper(), []);
  const organisatieSearchConfig = useMemo(
    () =>
      createOrganisatieSearchConfig(store, {
        mapToOption: organisatieMapper,
        source: 'index',
        queryParamsBuilder: (searchTerm, additionalParams = {}) => ({
          _limit: '50',
          _page: '1',
          _source: 'index',
          '_extend[]': '_schema',
          _published: 'false',
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
          ...additionalParams,
        }),
      }),
    [store, organisatieMapper]
  );
  const {
    search: searchOrganisaties,
    loading: leverancierLoading,
    options: leverancierOptions,
  } = useEntitySearch(organisatieSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });

  // Load initial leveranciers and buitengemeentelijke voorzieningen when switching to 'nieuw' koppeling flow
  // Note: module options are already loaded via searchModules, so no need to load separately
  useEffect(() => {
    if (koppelingKeuze === 'nieuw') {
      searchOrganisaties('');
      searchBuitengemeentelijkeVoorzieningen('');
    }
  }, [koppelingKeuze, searchOrganisaties, searchBuitengemeentelijkeVoorzieningen]);

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
    const activeOrgId =
      store?.user?.activeOrganization?.uuid ||
      store?.user?.activeOrganization?.id;
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

    fetchModuleIdsFromGebruikByAfnemer(commongroundApiUrl(), activeOrgId)
      .then((ids) => {
        if (isMounted) setAllowedModuleIdsFromGebruik(ids);
      })
      .catch(() => {
        if (isMounted) setAllowedModuleIdsFromGebruik([]);
      });
    return () => {
      isMounted = false;
    };
  }, [
    store?.user?.activeOrganization?.uuid,
    store?.user?.activeOrganization?.id,
    store,
    fullActiveOrganisation,
  ]);

  // Load or clear module options once the strategy is resolved:
  // - 'ORGANISATION_OWNED': modules owned by the active organisation (Leverancier/Community)
  // - Array of IDs: those specific modules (Gemeente/Samenwerking with gebruik records)
  // - Empty array: no modules available
  useEffect(() => {
    if (allowedModuleIdsFromGebruik === null) return;
    // 'ORGANISATION_OWNED' is a marker, not a list of ids — the search config
    // turns it into an organisation filter, so only guard on a real empty list.
    if (
      Array.isArray(allowedModuleIdsFromGebruik) &&
      allowedModuleIdsFromGebruik.length === 0
    ) {
      setModulesOptions([]);
      return;
    }
    searchModules('');
  }, [allowedModuleIdsFromGebruik, searchModules]);

  // Pre-select applicatie from URL parameter
  useEffect(() => {
    if (!applicatieFromUrl || isEditMode) return; // Skip if editing or no applicatie in URL

    const preSelectApplicatie = async () => {
      try {
        // Wait for modules to be loaded first
        if (modulesOptions.length === 0) return;

        // Check if the applicatie exists in options
        let applicatieOption = modulesOptions.find(
          (opt) => String(opt.value) === String(applicatieFromUrl)
        );

        if (!applicatieOption) {
          // If applicatie not in initial list, fetch it using fetchMissingEntities
          setApplicatiePreloadLoading(true);
          try {
            const newOptions = await fetchMissingEntities(
              store,
              [applicatieFromUrl],
              modulesOptions,
              moduleMapper,
              setModulesOptions,
              { extendParams: ['@self.schema'], source: 'index' }
            );
            if (newOptions.length > 0) {
              applicatieOption = newOptions[0];
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
          // Ensure the option is in modulesOptions (ReactSelect needs it there)
          setModulesOptions((prev) => {
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
  }, [applicatieFromUrl, modulesOptions, isEditMode, store]);

  // Helper to ensure a module option exists and return its label
  const ensureModuleOptionAndGetLabel = async (id) => {
    if (!id) return '';
    const existing = (modulesOptions || []).find(
      (o) => String(o.value) === String(id)
    );
    if (existing) return existing.label || String(id);
    try {
      const newOptions = await fetchMissingEntities(
        store,
        [id],
        modulesOptions,
        moduleMapper,
        setModulesOptions,
        { extendParams: ['@self.schema'], source: 'index' }
      );
      if (newOptions.length > 0) {
        return newOptions[0].label || String(id);
      }
      return String(id);
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
          ? koppelingenSource.map((k) => mapId(k)).filter(Boolean)
          : [];

        // Extract module (applicatie) ID from the gebruik object
        // First try fetched.module, if null fallback to @self.relations.module
        const moduleId = mapId(
          fetched.module || fetched['@self']?.relations?.module
        );

        // Extract deelnemers from the gebruik object
        const deelnemersIds = Array.isArray(fetched.deelnemers)
          ? fetched.deelnemers.map((d) => mapId(d)).filter(Boolean)
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
        if (koppelingenIds.length > 0 && !cancelled) {
          try {
            const koppelingFetches = koppelingenIds.map((id) =>
              store.object
                .fetchObject('voorzieningen', 'koppeling', String(id), {
                  '_extend[]': ['@self.schema', '@self.relations'],
                  _published: 'false',
                })
                .then(() =>
                  store.object.getObject('voorzieningen_koppeling', String(id))
                )
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
          const aId = String(mapId(aRel));
          const bId = String(mapId(bRel));
          if (aId) ids.push(aId);
          if (bId) ids.push(bId);
        }

        if (!ids.length) {
          if (!cancelled) setResolvedModulesFromResults([]);
          return;
        }

        const uniqueIds = Array.from(new Set(ids.map((v) => String(v))));

        // Fetch missing entities using wizard-utils
        const newOptions = await fetchMissingEntities(
          store,
          uniqueIds,
          modulesOptions,
          moduleMapper,
          setModulesOptions,
          { extendParams: ['@self.schema'], source: 'index' }
        );

        if (cancelled) return;

        // Build resolved array from existing and newly fetched options
        const allOptions = [...modulesOptions, ...newOptions];
        const resolved = uniqueIds.map((id) => {
          const option = allOptions.find((opt) => String(opt.value) === String(id));
          return {
            value: id,
            label: option?.label || id,
          };
        });

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
  }, [searchResults, modulesOptions, store, moduleMapper, setModulesOptions]);

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
          const aId = String(mapId(aRel));
          const bId = String(mapId(bRel));
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
          const url = `/api/apps/openregister/api/objects/voorzieningen/koppeling/${encodeURIComponent(
            koppelingIdFromUrl
          )}?_extend[]=@self.schema&_extend[]=@self.relations&_published=false`;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) return;
          const data = await res.json();

          const rels = data?.['@self']?.relations || {};
          const moduleAIdRaw = rels?.moduleA ?? data?.moduleA;
          const moduleAId = String(mapId(moduleAIdRaw) || '');

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
  const {
    fullActiveOrganisation,
    deelnemerOptions,
    loading: deelnemersLoading,
  } = useFullOrganization(store, {
    extend: ['_schema', 'deelnemers'],
    processDeelnemers: true,
    deelnemerOrgTypes: ['Samenwerking'],
  });

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
      const endpoint = '/api/apps/openregister/api/objects/voorzieningen/koppeling';
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
            ownAppOptions={modulesOptions}
            ownApp={ownApp}
            setOwnApp={setOwnApp}
            ownAppLoading={modulesLoading || applicatiePreloadLoading}
            searchResults={searchResults}
            resolvedModulesFromResults={resolvedModulesFromResults}
            resultsLoading={resultsLoading}
            getArrowForDirection={getArrowForDirection}
            isEditMode={isEditMode}
            onSearchModules={searchModules}
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
            searchLeveranciers={searchOrganisaties}
            // Module B options (reusing main module search)
            moduleBOptions={modulesOptions}
            moduleBLoading={modulesLoading}
            searchModuleB={searchModules}
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

  // ProcessSteps configuration - must be created early to define steps with stepper
  const processStepsConfig = useMemo(() => {
    if (koppelingsType === 'aanbieden-koppeling') {
      return generateSteps(stepper, [
        {
          title: 'Een koppeling zoeken',
          stepLabel: 'koppeling-zoeken',
          substeps: [
            { title: 'Gebruiksinformatie', stepLabel: 'gebruiksinformatie' },
            {
              title: 'Deelnemers toevoegen',
              stepLabel: 'deelnemers',
              condition: needsDeelnemersStep,
            },
          ],
        },
        { title: 'Controleren', stepLabel: 'controleren' },
      ]);
    } else {
      // eigen-organisatie flow
      return generateSteps(stepper, [
        {
          title: 'Een koppeling zoeken',
          stepLabel: 'koppeling-zoeken',
          substeps: [
            { title: isEditMode ? 'Bewerken' : 'Toevoegen', stepLabel: 'toevoegen' },
          ],
        },
        { title: 'Controleren', stepLabel: 'controleren' },
      ]);
    }
  }, [stepper.getCurrentStep(), koppelingsType, needsDeelnemersStep, isEditMode]);

  // Add click handlers to steps
  useEffect(() => {
    return addStepperClickHandlers({
      processStepsRef,
      processStepsConfig,
      stepper,
      skipIfLoading: prefillLoading,
    });
  }, [
    stepper.getCurrentStep(),
    prefillLoading,
    stepper,
    processStepsConfig,
  ]);

  const currentStepName = () => {
    const logicalStep = stepper.getLabelFromStep(stepper.getCurrentStep());

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
                {currentStepName()}
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
                  {currentStepName()}
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
