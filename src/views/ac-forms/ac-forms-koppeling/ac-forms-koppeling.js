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
import ConKoppelingStepGebruiksinformatie from './components/con-koppeling-step-gebruiksinformatie';
import { commongroundApiUrl } from '@src/config';
import { getActiveWizard } from '@src/constants/wizards.constants';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { useDebouncedInput } from '@src/hooks';
import useStepper from '../con-stepper';

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

  // Use the stepper hook for step management
  const stepper = useStepper();

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
        '.denhaag-process-steps .denhaag-process-steps__step-header, .denhaag-process-steps .denhaag-process-steps__sub-step'
      );

      stepElements.forEach((stepEl, index) => {
        // Adjust index to be 1-based for stepper
        const stepIndex = index + 1;

        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        if (stepIndex < stepper.getCurrentStep()) {
          stepEl.classList.add('ac-step-clickable');
          stepEl.onclick = (e) => {
            e.preventDefault();
            stepper.setCurrentStep(stepIndex);
          };
        }
      });
    };

    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [stepper.getCurrentStep()]);

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

        // Fetch gebruik schema for gebruiksinformatie step
        let gebruikSchema = null;
        try {
          await store.object.fetchSchema('gebruik');
          gebruikSchema = store.object.getSchema('schema_gebruik');
        } catch (gebruikError) {
          console.error('Failed to fetch gebruik schema:', gebruikError);
        }

        // Fetch module schema for new application creation
        let moduleSchema = null;
        try {
          await store.object.fetchSchema('module');
          moduleSchema = store.object.getSchema('schema_module');
        } catch (moduleError) {
          console.error('Failed to fetch module schema:', moduleError);
        }

        setSchemas({
          koppeling: koppelingSchema,
          organisatie: organisatieSchema,
          gebruik: gebruikSchema,
          module: moduleSchema,
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
  // Separate startdatum fields per status (like gebruik koppeling wizard)
  const [startDatumInProductieByRow, setStartDatumInProductieByRow] = useState({});
  const [startDatumGeplandByRow, setStartDatumGeplandByRow] = useState({});
  const [startDatumUitTeFaserenByRow, setStartDatumUitTeFaserenByRow] = useState({});
  const [startDatumUitGefaseerdByRow, setStartDatumUitGefaseerdByRow] = useState({});
  const [standaardenByRow, setStandaardenByRow] = useState([]);
  const [nameByRow, setNameByRow] = useState({});
  const [intermediairByRow, setIntermediairByRow] = useState({}); // rowId -> intermediair module id
  const [selectedModuleLabels, setSelectedModuleLabels] = useState({}); // id -> label
  const [koppelingIdByRow, setKoppelingIdByRow] = useState({}); // rowId -> koppeling id (for edit)

  // Intermediair options (applications with specific referentiecomponenten)
  const [intermediairOptions, setIntermediairOptions] = useState([]);
  const [intermediairOptionsLoading, setIntermediairOptionsLoading] =
    useState(false);

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

  // New application flow state for own app (Applicatie A) in zoeken step
  const [ownAppKeuze, setOwnAppKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [nieuweOwnApp, setNieuweOwnApp] = useState({
    naam: '',
    website: '',
    beschrijvingKort: '',
    leverancier: null,
  });
  const [ownAppLeverancierKeuze, setOwnAppLeverancierKeuze] = useState('bestaand');
  const [nieuweOwnAppLeverancier, setNieuweOwnAppLeverancier] = useState({
    naam: '',
    website: '',
    type: '',
  });

  // New application flow state (for creating applications that don't exist)
  // This is per-row: rowId -> 'bestaand' | 'nieuw'
  const [applicatieKeuzeByRow, setApplicatieKeuzeByRow] = useState({});
  const [nieuweApplicatieByRow, setNieuweApplicatieByRow] = useState({});
  const [leverancierKeuzeByRow, setLeverancierKeuzeByRow] = useState({});
  const [nieuweLeveancierByRow, setNieuweLeveancierByRow] = useState({});

  // Leverancier options for new application flow
  const [leverancierOptions, setLeverancierOptions] = useState([]);
  const [leverancierLoading, setLeverancierLoading] = useState(false);

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
   * Update function for aanbieder organization data
   * Used when creating a new organization for aanbieden-koppeling
   */
  const setAanbiederOrganisatieData = useCallback((key, value) => {
    setAanbiederOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Helper to update nieuweOwnApp data
   */
  const setNieuweOwnAppData = useCallback((key, value) => {
    setNieuweOwnApp((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Helper to update nieuweOwnAppLeverancier data
   */
  const setNieuweOwnAppLeverancierData = useCallback((key, value) => {
    setNieuweOwnAppLeverancier((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Helper to set applicatieKeuze for a specific row
   */
  const setApplicatieKeuzeForRow = useCallback((rowId, keuze) => {
    setApplicatieKeuzeByRow((prev) => ({ ...prev, [rowId]: keuze }));
  }, []);

  /**
   * Helper to update nieuweApplicatie data for a specific row
   */
  const setNieuweApplicatieDataForRow = useCallback((rowId, key, value) => {
    setNieuweApplicatieByRow((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {
          naam: '',
          website: '',
          beschrijvingKort: '',
          leverancier: null,
        }),
        [key]: value,
      },
    }));
  }, []);

  /**
   * Helper to set leverancierKeuze for a specific row
   */
  const setLeverancierKeuzeForRow = useCallback((rowId, keuze) => {
    setLeverancierKeuzeByRow((prev) => ({ ...prev, [rowId]: keuze }));
  }, []);

  /**
   * Helper to update nieuwe leverancier data for a specific row
   */
  const setNieuweLeverancierDataForRow = useCallback((rowId, key, value) => {
    setNieuweLeveancierByRow((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {
          naam: '',
          website: '',
          type: '',
        }),
        [key]: value,
      },
    }));
  }, []);

  /**
   * Search for leveranciers (organisations)
   */
  const searchLeveranciers = useCallback(async (query) => {
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
      // Jump to edit step - use stepper to set to koppeling-zoeken step
      stepper.setCurrentStepByLabel('koppeling-zoeken');
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

        // Extract dates based on status
        const datumInGebruik = data?.datumInGebruik || '';
        const datumInOntwikkeling = data?.datumInOntwikkeling || '';
        const datumEindeOndersteuning = data?.datumEindeOndersteuning || '';
        const datumTeruggetrokken = data?.datumTeruggetrokken || '';

        // Extract intermediair from relations first, then from data
        const intermediairIdRaw =
          rels?.gerealiseerdMetIntermediairModule ??
          data?.gerealiseerdMetIntermediairModule;
        const intermediairId = intermediairIdRaw
          ? String(extractRelationId(intermediairIdRaw) || '')
          : '';

        // Extract aanbieder from relations first, then from data
        const aanbiederIdRaw = rels?.aanbieder ?? data?.aanbieder;
        const existingAanbiederId = aanbiederIdRaw
          ? String(extractRelationId(aanbiederIdRaw) || '')
          : '';

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

        // Prefill dates based on status
        if (datumInGebruik) {
          setStartDatumInProductieByRow({ 0: datumInGebruik });
        }
        if (datumInOntwikkeling) {
          setStartDatumGeplandByRow({ 0: datumInOntwikkeling });
        }
        if (datumEindeOndersteuning) {
          setStartDatumUitTeFaserenByRow({ 0: datumEindeOndersteuning });
        }
        if (datumTeruggetrokken) {
          setStartDatumUitGefaseerdByRow({ 0: datumTeruggetrokken });
        }

        // Prefill intermediair
        if (intermediairId) {
          setIntermediairByRow({ 0: intermediairId });
        }

        // Prefill aanbieder from existing koppeling data
        if (existingAanbiederId) {
          setAanbieder(existingAanbiederId);
        }

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
      loadStandaardversies();
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
    const currentStepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    if (currentStepLabel === 'aanbieder') {
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

    if (currentStepLabel === 'koppeling-zoeken') {
      // Applicatie selectie is verplicht
      if (!ownApp?.value) {
        return 'Selecteer eerst een applicatie om door te gaan.';
      }
      return '';
    }

    if (currentStepLabel === 'koppeling') {
      const messages = [];
      const missing = [];
      let missingA = false;
      let missingB = false;
      let missingR = false;
      let missingN = false;
      for (let i = 0; i < rows.length; i++) {
        const rowId = rows[i];
        const appAId = selectedAppAByRow[rowId] || ownApp?.value;
        const appBId = selectedAppBByRow[rowId];
        const richting = directionByRow[rowId];
        const naam = nameByRow[rowId];
        if (!appAId) missingA = true;
        if (!appBId) missingB = true;
        if (!richting) missingR = true;
        if (!naam || !naam.trim()) missingN = true;
      }
      if (missingA) missing.push('Applicatie A');
      if (missingB) missing.push('Applicatie B');
      if (missingR) missing.push('Richting');
      if (missingN) missing.push('Naam');
      if (missing.length > 0) {
        messages.push(`Verplichte velden nog niet ingevuld: ${missing.join(', ')}`);
      }
      return messages.join('\n');
    }

    // Aanvullende informatie step - no validation required (all fields optional)
    if (currentStepLabel === 'aanvullende-informatie') {
      return '';
    }

    return '';
  };

  const canGoNext = () => {
    const currentStepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Aanbieder step - only for 'aanbieden-koppeling' type
    if (currentStepLabel === 'aanbieder') {
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

    // Zoeken step
    if (currentStepLabel === 'koppeling-zoeken') {
      // If using new application flow, validate new app fields
      if (ownAppKeuze === 'nieuw') {
        // Validate new application fields
        if (!nieuweOwnApp.naam || !String(nieuweOwnApp.naam).trim()) return false;
        if (!nieuweOwnApp.website || !String(nieuweOwnApp.website).trim())
          return false;

        // Validate website format
        if (nieuweOwnApp.website && String(nieuweOwnApp.website).trim()) {
          if (!validateWebsite(String(nieuweOwnApp.website).trim())) return false;
        }

        // Check leverancier
        if (ownAppLeverancierKeuze === 'nieuw') {
          // Validate new leverancier fields
          if (
            !nieuweOwnAppLeverancier.naam ||
            !String(nieuweOwnAppLeverancier.naam).trim()
          )
            return false;
          if (
            !nieuweOwnAppLeverancier.website ||
            !String(nieuweOwnAppLeverancier.website).trim()
          )
            return false;

          // Validate website format
          if (
            nieuweOwnAppLeverancier.website &&
            String(nieuweOwnAppLeverancier.website).trim()
          ) {
            if (!validateWebsite(String(nieuweOwnAppLeverancier.website).trim()))
              return false;
          }
        } else {
          // Existing leverancier must be selected
          if (!nieuweOwnApp.leverancier) return false;
        }

        return true;
      }

      // Existing application must be selected
      return !!ownApp?.value;
    }

    // Koppeling step (renamed from Toevoegen)
    if (currentStepLabel === 'koppeling') {
      if (!rows.length) return false;
      // Require Applicatie A, Applicatie B (or new app data), Richting, and Naam for all rows
      for (const rowId of rows) {
        // Use mock ID '__new_own_app__' when creating a new own app
        const appAId =
          selectedAppAByRow[rowId] ||
          (ownAppKeuze === 'nieuw' ? '__new_own_app__' : ownApp?.value);
        const richting = directionByRow[rowId];
        const naam = nameByRow[rowId];

        // Check if using new application flow for this row
        if (applicatieKeuzeByRow[rowId] === 'nieuw') {
          // Validate new application fields
          const nieuweApp = nieuweApplicatieByRow[rowId] || {};
          if (!nieuweApp.naam || !String(nieuweApp.naam).trim()) return false;
          if (!nieuweApp.website || !String(nieuweApp.website).trim()) return false;

          // Validate website format
          if (nieuweApp.website && String(nieuweApp.website).trim()) {
            if (!validateWebsite(String(nieuweApp.website).trim())) return false;
          }

          // Check leverancier
          if (leverancierKeuzeByRow[rowId] === 'nieuw') {
            // Validate new leverancier fields
            const nieuweLev = nieuweLeveancierByRow[rowId] || {};
            if (!nieuweLev.naam || !String(nieuweLev.naam).trim()) return false;
            if (!nieuweLev.website || !String(nieuweLev.website).trim())
              return false;

            // Validate website format
            if (nieuweLev.website && String(nieuweLev.website).trim()) {
              if (!validateWebsite(String(nieuweLev.website).trim())) return false;
            }
          } else {
            // Existing leverancier must be selected
            if (!nieuweApp.leverancier) return false;
          }
        } else {
          // Existing application must be selected
          const appBId = selectedAppBByRow[rowId];
          if (!appBId) return false;
        }

        if (!appAId || !richting || !naam || !naam.trim()) return false;
      }
      return true;
    }

    // Aanvullende informatie step (renamed from Gebruiksinformatie) - always can proceed (optional fields)
    if (currentStepLabel === 'aanvullende-informatie') {
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

  /**
   * Serialize form rows to API payload.
   *
   * Property mappings (UI field → API property):
   * - naam → naam
   * - Applicatie A → moduleA
   * - Applicatie B → moduleB
   * - Richting → gegevensuitwisselingRichting
   * - Transportprotocol (Soort) → type
   * - Korte beschrijving → beschrijvingKort
   * - Status → status
   * - Startdatum (based on status):
   *   - "in gebruik" → datumInGebruik
   *   - "in ontwikkeling" → datumInOntwikkeling
   *   - "einde ondersteuning" → datumEindeOndersteuning
   *   - "teruggetrokken" → datumTeruggetrokken
   * - Standaardversies → standaardversies
   * - Intermediair → gerealiseerdMetIntermediairModule
   * - Aanbieder (only for aanbieden-koppeling) → aanbieder
   */
  /**
   * Serialize rows to payload, with optional createdModuleIds for new applications
   * @param {Object} createdModuleIds - Optional object mapping rowId to created module ID
   * @param {string} createdOwnAppId - Optional ID of newly created own app (Applicatie A)
   */
  const serializeRowsToPayload = (createdModuleIds = {}, createdOwnAppId = null) => {
    return rows
      .map((rowId) => {
        let naam = (nameByRow[rowId] || '').trim();
        // Use created own app ID if available, otherwise use selected existing app
        const appAId = createdOwnAppId || selectedAppAByRow[rowId] || ownApp?.value;
        // Use created module ID if available, otherwise use selected existing app
        const appBId = createdModuleIds[rowId] || selectedAppBByRow[rowId];
        if (!appAId || !appBId) return null;
        const richting = directionByRow[rowId] || '';
        const soort = typeByRow[rowId] || '';
        const beschrijving = beschrijvingByRow[rowId] || '';
        const status = statusByRow[rowId] || '';
        const standaarden = standaardenByRow[rowId] || [];
        const intermediair = intermediairByRow[rowId] || '';

        // Generate default name if not provided: "AppA name → AppB name"
        if (!naam) {
          const appALabel =
            (ownAppKeuze === 'nieuw' ? nieuweOwnApp?.naam : null) ||
            selectedModuleLabels[appAId] ||
            modulesOptions.find((opt) => String(opt.value) === String(appAId))
              ?.label ||
            ownAppOptions.find((opt) => String(opt.value) === String(appAId))
              ?.label ||
            ownApp?.label ||
            appAId;
          const appBLabel =
            selectedModuleLabels[appBId] ||
            modulesOptions.find((opt) => String(opt.value) === String(appBId))
              ?.label ||
            ownAppOptions.find((opt) => String(opt.value) === String(appBId))
              ?.label ||
            appBId;
          const arrow = getArrowForDirection(richting);
          naam = `${appALabel} ${arrow} ${appBLabel}`;
        }

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

        // Add intermediair if selected (API property: gerealiseerdMetIntermediairModule)
        if (intermediair) {
          payload.gerealiseerdMetIntermediairModule = intermediair;
        }

        // Add ALL dates that have been set to maintain a trail of status changes
        // This allows tracking the history (e.g., from "in gebruik" to "teruggetrokken")
        if (startDatumInProductieByRow[rowId]) {
          payload.datumInGebruik = startDatumInProductieByRow[rowId];
        }
        if (startDatumGeplandByRow[rowId]) {
          payload.datumInOntwikkeling = startDatumGeplandByRow[rowId];
        }
        if (startDatumUitTeFaserenByRow[rowId]) {
          payload.datumEindeOndersteuning = startDatumUitTeFaserenByRow[rowId];
        }
        if (startDatumUitGefaseerdByRow[rowId]) {
          payload.datumTeruggetrokken = startDatumUitGefaseerdByRow[rowId];
        }

        // Helper function to extract ID from aanbieder (could be string, object, or have nested id)
        const extractAanbiederId = (value) => {
          if (!value) return null;
          if (typeof value === 'string') return value;
          if (typeof value === 'object') {
            return value.id || value.value || value?.['@self']?.id || null;
          }
          return null;
        };

        // Determine aanbieder in order of priority:
        // 1. For 'aanbieden-koppeling' type, use the selected aanbieder
        // 2. If editing (aanbieder state is set from existing data), use that
        // 3. Otherwise, use the current user's organization as aanbieder
        if (koppelingsType === 'aanbieden-koppeling' && aanbieder) {
          const aanbiederId = extractAanbiederId(aanbieder);
          if (aanbiederId) {
            payload.aanbieder = String(aanbiederId);
          }
        } else if (aanbieder) {
          // Use existing aanbieder from koppeling data (edit mode)
          const aanbiederId = extractAanbiederId(aanbieder);
          if (aanbiederId) {
            payload.aanbieder = String(aanbiederId);
          }
        } else if (store?.user?.activeOrganization) {
          // Fallback to current user's organization for new koppelingen
          const activeOrgId = extractAanbiederId(store.user.activeOrganization);
          if (activeOrgId) {
            payload.aanbieder = String(activeOrgId);
          }
        }

        return payload;
      })
      .filter(Boolean);
  };

  const loadStandaardversies = useCallback(async () => {
    console.info('📋 Loading standaardversies...');
    setStandaardenOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaardversie',
        '_extend[]': '@self.schema',
        _published: 'false',
      });

      console.info('📋 Fetching standaardversies from openconnector endpoint...');

      // Fetch standaardversies from openconnector endpoint using normal fetch
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
            `Standaardversie ${index + 1}`;
          // Use identifier first (id- prefixed format) to match what we store in standaardversies
          const value =
            item?.identifier || item?.value || item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        })
        .filter((o) => o.label && o.value);

      setStandaardenOptions(options);
      console.info(`✅ Loaded ${options.length} standaardversies`);
    } catch (e) {
      console.error('Failed to load standaardversies:', e);
      setStandaardenOptions([]);
    } finally {
      setStandaardenOptionsLoading(false);
    }
  }, []);

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

  /**
   * Load intermediair options - applications (modules) that have specific referentiecomponenten:
   * - Notificatierouteringcomponent
   * - Gemeentelijke servicebuscomponent
   * - Gegevensdistributiecomponent
   * - Gegevensmagazijncomponent
   *
   * First fetches all referentiecomponenten to get IDs of the target ones,
   * then fetches modules with those referentiecomponenten.
   */
  const loadIntermediairOptions = useCallback(async () => {
    setIntermediairOptionsLoading(true);

    try {
      // Target referentiecomponent names
      const targetRefCompNames = [
        'Notificatierouteringcomponent',
        'Gemeentelijke servicebuscomponent',
        'Gegevensdistributiecomponent',
        'Gegevensmagazijncomponent',
      ];

      // Step 1: Fetch all referentiecomponenten
      const refCompQueryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
        _published: 'false',
      });

      const refCompResponse = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${refCompQueryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!refCompResponse.ok) {
        throw new Error(`HTTP ${refCompResponse.status}`);
      }

      const refCompData = await refCompResponse.json();
      const allRefComps = Array.isArray(refCompData?.results)
        ? refCompData.results
        : [];

      // Step 2: Filter to get IDs of target referentiecomponenten
      const targetRefCompIds = allRefComps
        .filter((refComp) => {
          const name =
            refComp?.xml?.name?._value ||
            refComp?.naam ||
            refComp?.name ||
            refComp?.label ||
            '';
          return targetRefCompNames.some(
            (target) => name.toLowerCase() === target.toLowerCase()
          );
        })
        .map((refComp) => refComp?.value || refComp?.id || refComp?.slug)
        .filter(Boolean);

      if (targetRefCompIds.length === 0) {
        console.info('No matching referentiecomponenten found for intermediair');
        setIntermediairOptions([]);
        return;
      }

      // Step 3: Fetch modules with those referentiecomponenten
      // Build query params with referentieComponenten[]=id for each
      const moduleParams = new URLSearchParams({
        _limit: '100',
        _page: '1',
        _published: 'false',
      });

      // Add each referentiecomponent ID as a separate parameter
      targetRefCompIds.forEach((id) => {
        moduleParams.append('referentieComponenten[]', id);
      });

      const moduleEndpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${moduleParams}`;
      const moduleResponse = await fetch(moduleEndpoint, {
        headers: { Accept: 'application/json' },
      });

      if (!moduleResponse.ok) {
        throw new Error(`HTTP ${moduleResponse.status}`);
      }

      const moduleData = await moduleResponse.json();
      const modules = Array.isArray(moduleData)
        ? moduleData
        : Array.isArray(moduleData?.results)
        ? moduleData.results
        : [];

      // Step 4: Map to options
      const options = modules.map((item, index) => {
        const id = item?.id || item?.['@self']?.id || item?.uuid || index;
        const label =
          item?.naam ||
          item?.name ||
          item?.title ||
          item?.label ||
          `Applicatie ${index + 1}`;
        return {
          value: String(id),
          label: String(label),
          data: item,
        };
      });

      console.info(`✅ Loaded ${options.length} intermediair options`);
      setIntermediairOptions(options);
    } catch (error) {
      console.error('Failed to load intermediair options:', error);
      setIntermediairOptions([]);
    } finally {
      setIntermediairOptionsLoading(false);
    }
  }, []);

  // Load intermediair options on mount
  useEffect(() => {
    loadIntermediairOptions();
  }, [loadIntermediairOptions]);

  // Reset functions for form state
  const handleRetryForm = () => {
    setSaveResult(null);
    setSaveErrors([]);
  };

  const handleResetForm = () => {
    // Reset all form state to initial values
    stepper.resetCurrentStep();
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
    setStartDatumInProductieByRow({});
    setStartDatumGeplandByRow({});
    setStartDatumUitTeFaserenByRow({});
    setStartDatumUitGefaseerdByRow({});
    setStandaardenByRow([]);
    setNameByRow({});
    setIntermediairByRow({});
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
    setSaveLoading(true);
    setSaveResult(null);
    setSaveErrors([]);

    try {
      let finalAanbieder = aanbieder;
      const createdModuleIds = {}; // Track created modules per row

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

      // ✅ Create new own app (Applicatie A) if using new application flow
      let createdOwnAppId = null;
      if (ownAppKeuze === 'nieuw') {
        try {
          let finalOwnAppLeverancier = null;

          // Create new leverancier if needed
          if (ownAppLeverancierKeuze === 'nieuw') {
            const leverancierData = {
              naam: nieuweOwnAppLeverancier.naam,
              website: nieuweOwnAppLeverancier.website,
              type: nieuweOwnAppLeverancier.type || 'leverancier',
            };

            const createdLeverancier = await store.object.createObject(
              'voorzieningen',
              'organisatie',
              leverancierData
            );

            finalOwnAppLeverancier =
              createdLeverancier?.id || createdLeverancier?.['@self']?.id;

            if (!finalOwnAppLeverancier) {
              throw new Error('Leverancier aangemaakt maar geen ID ontvangen');
            }
          } else {
            // Use existing leverancier
            finalOwnAppLeverancier = nieuweOwnApp.leverancier;
          }

          // Create new application
          const applicatieData = {
            naam: nieuweOwnApp.naam,
            website: nieuweOwnApp.website,
            beschrijvingKort: nieuweOwnApp.beschrijvingKort || '',
            aanbieder: finalOwnAppLeverancier,
          };

          const createdModule = await store.object.createObject(
            'voorzieningen',
            'module',
            applicatieData
          );

          createdOwnAppId = createdModule?.id || createdModule?.['@self']?.id;

          if (!createdOwnAppId) {
            throw new Error('Applicatie aangemaakt maar geen ID ontvangen');
          }

          // Update ownApp so it can be used in serialization
          setOwnApp({
            value: createdOwnAppId,
            label: nieuweOwnApp.naam,
            data: createdModule,
          });

          // Also add to module options so it can be resolved in the UI
          const newOption = {
            value: String(createdOwnAppId),
            label: String(nieuweOwnApp.naam),
            data: createdModule,
            type: 'applicatie',
          };
          setModulesOptions((prev) => [...prev, newOption]);
          setOwnAppOptions((prev) => [...prev, newOption]);
          setSelectedModuleLabels((prev) => ({
            ...prev,
            [createdOwnAppId]: nieuweOwnApp.naam,
          }));
        } catch (appError) {
          console.error('Failed to create own application:', appError);
          setSaveResult('error');
          setSaveErrors([
            'Er is een fout opgetreden bij het aanmaken van uw applicatie. Probeer het opnieuw.',
          ]);
          setSaveLoading(false);
          return;
        }
      }

      // ✅ Create new applications for rows that have applicatieKeuze === 'nieuw'
      for (const rowId of rows) {
        if (applicatieKeuzeByRow[rowId] === 'nieuw') {
          try {
            let finalLeverancier = null;

            // Create new leverancier if needed
            if (leverancierKeuzeByRow[rowId] === 'nieuw') {
              const nieuweLev = nieuweLeveancierByRow[rowId] || {};
              const leverancierData = {
                naam: nieuweLev.naam,
                website: nieuweLev.website,
                type: nieuweLev.type || 'leverancier',
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
              finalLeverancier = nieuweApplicatieByRow[rowId]?.leverancier;
            }

            // Create new application
            const nieuweApp = nieuweApplicatieByRow[rowId] || {};
            const applicatieData = {
              naam: nieuweApp.naam,
              website: nieuweApp.website,
              beschrijvingKort: nieuweApp.beschrijvingKort || '',
              aanbieder: finalLeverancier,
            };

            const createdModule = await store.object.createObject(
              'voorzieningen',
              'module',
              applicatieData
            );

            const createdModuleId =
              createdModule?.id || createdModule?.['@self']?.id;

            if (!createdModuleId) {
              throw new Error('Applicatie aangemaakt maar geen ID ontvangen');
            }

            // Store the created module ID for this row
            createdModuleIds[rowId] = createdModuleId;

            // Also add to module options so it can be resolved in the UI
            const newOption = {
              value: String(createdModuleId),
              label: String(nieuweApp.naam),
              data: createdModule,
              type: 'applicatie',
            };
            setModulesOptions((prev) => [...prev, newOption]);
            setSelectedModuleLabels((prev) => ({
              ...prev,
              [createdModuleId]: nieuweApp.naam,
            }));
          } catch (appError) {
            console.error('Failed to create application:', appError);
            setSaveResult('error');
            setSaveErrors([
              `Er is een fout opgetreden bij het aanmaken van de applicatie voor koppeling ${
                rows.indexOf(rowId) + 1
              }. Probeer het opnieuw.`,
            ]);
            setSaveLoading(false);
            return;
          }
        }
      }

      // Now serialize payloads with created module IDs and own app ID
      const payloads = serializeRowsToPayload(createdModuleIds, createdOwnAppId);
      if (!payloads.length) {
        setSaveLoading(false);
        return;
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
    const currentStepLabel = stepper.getLabelFromStep(step);

    switch (currentStepLabel) {
      case 'aanbieder':
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
            editingKoppelingId={koppelingId}
            onSearchModules={debouncedSearchModules}
            schemas={schemas}
            ownAppKeuze={ownAppKeuze}
            nieuweOwnApp={nieuweOwnApp}
            setNieuweOwnAppData={setNieuweOwnAppData}
            ownAppLeverancierKeuze={ownAppLeverancierKeuze}
            setOwnAppLeverancierKeuze={setOwnAppLeverancierKeuze}
            nieuweOwnAppLeverancier={nieuweOwnAppLeverancier}
            setNieuweOwnAppLeverancierData={setNieuweOwnAppLeverancierData}
            leverancierOptions={leverancierOptions}
            leverancierLoading={leverancierLoading}
            searchLeveranciers={searchLeveranciers}
          />
        );

      case 'koppeling':
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
            loading={loading}
            selectedAppAByRow={selectedAppAByRow}
            ownApp={ownApp}
            selectedAppBByRow={selectedAppBByRow}
            setSelectedAppBByRow={setSelectedAppBByRow}
            directionOptions={directionOptions}
            directionByRow={directionByRow}
            setDirectionByRow={setDirectionByRow}
            statusOptions={statusOptions}
            statusByRow={statusByRow}
            setStatusByRow={setStatusByRow}
            startDatumInProductieByRow={startDatumInProductieByRow}
            setStartDatumInProductieByRow={setStartDatumInProductieByRow}
            startDatumGeplandByRow={startDatumGeplandByRow}
            setStartDatumGeplandByRow={setStartDatumGeplandByRow}
            startDatumUitTeFaserenByRow={startDatumUitTeFaserenByRow}
            setStartDatumUitTeFaserenByRow={setStartDatumUitTeFaserenByRow}
            startDatumUitGefaseerdByRow={startDatumUitGefaseerdByRow}
            setStartDatumUitGefaseerdByRow={setStartDatumUitGefaseerdByRow}
            nameByRow={nameByRow}
            setNameByRow={setNameByRow}
            isEditMode={isEditMode}
            schemas={schemas}
            applicatieKeuzeByRow={applicatieKeuzeByRow}
            setApplicatieKeuzeForRow={setApplicatieKeuzeForRow}
            nieuweApplicatieByRow={nieuweApplicatieByRow}
            setNieuweApplicatieDataForRow={setNieuweApplicatieDataForRow}
            leverancierKeuzeByRow={leverancierKeuzeByRow}
            setLeverancierKeuzeForRow={setLeverancierKeuzeForRow}
            nieuweLeveancierByRow={nieuweLeveancierByRow}
            setNieuweLeverancierDataForRow={setNieuweLeverancierDataForRow}
            leverancierOptions={leverancierOptions}
            leverancierLoading={leverancierLoading}
            searchLeveranciers={searchLeveranciers}
            ownAppKeuze={ownAppKeuze}
            nieuweOwnApp={nieuweOwnApp}
          />
        );

      case 'aanvullende-informatie':
        return (
          <ConKoppelingStepGebruiksinformatie
            beschrijvingByRow={beschrijvingByRow}
            setBeschrijvingByRow={setBeschrijvingByRow}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
            standaardenByRow={standaardenByRow}
            setStandaardenByRow={setStandaardenByRow}
            typeOptions={typeOptions}
            typeByRow={typeByRow}
            setTypeByRow={setTypeByRow}
            intermediairByRow={intermediairByRow}
            setIntermediairByRow={setIntermediairByRow}
            intermediairOptions={intermediairOptions}
            intermediairOptionsLoading={intermediairOptionsLoading}
            rows={rows}
            loading={loading}
            nameByRow={nameByRow}
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
            aanbieder={aanbieder}
            organisatieOptions={organisatieOptions}
            aanbiederKeuze={aanbiederKeuze}
            aanbiederOrganisatie={aanbiederOrganisatie}
            startDatumInProductieByRow={startDatumInProductieByRow}
            startDatumGeplandByRow={startDatumGeplandByRow}
            startDatumUitTeFaserenByRow={startDatumUitTeFaserenByRow}
            startDatumUitGefaseerdByRow={startDatumUitGefaseerdByRow}
            intermediairByRow={intermediairByRow}
            intermediairOptions={intermediairOptions}
            ownAppKeuze={ownAppKeuze}
            nieuweOwnApp={nieuweOwnApp}
            ownAppLeverancierKeuze={ownAppLeverancierKeuze}
            nieuweOwnAppLeverancier={nieuweOwnAppLeverancier}
            leverancierOptions={leverancierOptions}
          />
        );

      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    const currentStepLabel = stepper.getLabelFromStep(step);

    switch (currentStepLabel) {
      case 'aanbieder':
        return 'Aanbieder';
      case 'koppeling-zoeken':
        return 'Controleren op bestaande koppeling';
      case 'koppeling':
        return 'Koppelingen met andere applicaties';
      case 'aanvullende-informatie':
        return '      Aanvullende informatie over uw koppelingen';
      case 'controleren':
        return 'Controleer uw gegevens';
      default:
        return '';
    }
  };

  const canSave = () => {
    if (!rows.length) return false;
    // Require at least app A and app B for all rows
    for (const rowId of rows) {
      // Use mock ID when creating a new own app
      const appAId =
        selectedAppAByRow[rowId] ||
        (ownAppKeuze === 'nieuw' ? '__new_own_app__' : ownApp?.value);
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
                const currentStepLabel = stepper.getLabelFromStep(
                  stepper.getCurrentStep()
                );
                switch (currentStepLabel) {
                  case 'aanbieder':
                    return 'Selecteer een aanbieder of maak een nieuwe organisatie aan.';
                  case 'koppeling-zoeken':
                    return 'Selecteer een applicatie uit uw eigen aanbod waarvoor u een koppeling wilt publiceren.';
                  case 'koppeling':
                    return 'Vul dit formulier in om uw koppeling te registreren in de softwarecatalogus.';
                  case 'aanvullende-informatie':
                    return 'Vul dit formulier in om uw koppeling te registreren in de softwarecatalogus.';
                  default:
                    return 'Vul dit formulier in om uw koppeling te registreren in de softwarecatalogus.';
                }
              })()}
            </Paragraph>
          </div>

          <div>
            {saveResult !== 'success' && saveResult !== 'error' && (
              <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
                {currentStepName(stepper.getCurrentStep())}
              </h3>
            )}

            <div className='ac-register-container ac-forms-product'>
              {saveResult !== 'success' && saveResult !== 'error' && (
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps
                    steps={(() => {
                      const steps = [];
                      stepper.resetStepDefinitions('process-steps');
                      stepper.resetStepDefinitions('process-steps-status');

                      // Conditionally include Aanbieder step (only for aanbieden-koppeling)
                      if (koppelingsType === 'aanbieden-koppeling') {
                        const aanbiederMarker = stepper.defineStep(
                          'process-steps',
                          'aanbieder'
                        );
                        const aanbiederStatusMarker = stepper.defineStep(
                          'process-steps-status'
                        );
                        steps.push({
                          id: 'grp-aanbieder',
                          marker: aanbiederMarker,
                          status: getStatus(
                            stepper.getCurrentStep(),
                            aanbiederStatusMarker
                          ),
                          title: 'Aanbieder',
                        });
                      }

                      // Koppeling zoeken step with sub-steps
                      const koppelingZoekenMarker = stepper.defineStep(
                        'process-steps',
                        'koppeling-zoeken'
                      );
                      const firstMultiStepStatus = stepper.defineStep(
                        'process-steps-status',
                        'firstMultiStep'
                      );

                      // Define sub-steps
                      const koppelingMarker = stepper.defineStep(
                        'process-steps',
                        'koppeling'
                      );
                      const koppelingStatusMarker = stepper.defineStep(
                        'process-steps-status'
                      );

                      // Aanvullende informatie sub-step
                      const aanvullendeInfoMarker = stepper.defineStep(
                        'process-steps',
                        'aanvullende-informatie'
                      );
                      const aanvullendeInfoStatusMarker = stepper.defineStep(
                        'process-steps-status'
                      );

                      steps.push({
                        id: 'grp-koppeling',
                        marker: koppelingZoekenMarker,
                        status: getStatusMulti(
                          stepper.getCurrentStep(),
                          firstMultiStepStatus,
                          aanvullendeInfoStatusMarker
                        ),
                        title: 'Koppeling zoeken',
                        steps: [
                          {
                            id: 'sub-koppeling',
                            marker: koppelingMarker,
                            status: getStatus(
                              stepper.getCurrentStep(),
                              koppelingStatusMarker
                            ),
                            title: isEditMode ? 'Bewerken' : 'Koppeling',
                          },
                          {
                            id: 'sub-aanvullende-informatie',
                            marker: aanvullendeInfoMarker,
                            status: getStatus(
                              stepper.getCurrentStep(),
                              aanvullendeInfoStatusMarker
                            ),
                            title: 'Aanvullende informatie',
                          },
                        ],
                      });

                      // Controleren step
                      const controlerenMarker = stepper.defineStep(
                        'process-steps',
                        'controleren'
                      );
                      const controlerenStatusMarker = stepper.defineStep(
                        'process-steps-status'
                      );
                      steps.push({
                        id: 'grp-review',
                        marker: controlerenMarker,
                        status: getStatus(
                          stepper.getCurrentStep(),
                          controlerenStatusMarker
                        ),
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

                      {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                        'aanbieder' &&
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

                      {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                        'koppeling-zoeken' &&
                        ownAppKeuze === 'bestaand' &&
                        !isEditMode && (
                          <AcButton
                            style='button'
                            buttonType='secondary'
                            icon={<VISUALS.CUBE />}
                            onClick={() => {
                              setOwnAppKeuze('nieuw');
                              // Load initial leveranciers
                              searchLeveranciers('');
                            }}
                          >
                            Ik kan de gewenste applicatie niet vinden
                          </AcButton>
                        )}
                      {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                        'koppeling-zoeken' &&
                        ownAppKeuze === 'nieuw' && (
                          <AcButton
                            style='button'
                            buttonType='secondary'
                            icon={<VISUALS.ARROW_LEFT />}
                            onClick={() => setOwnAppKeuze('bestaand')}
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

                    {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                      'controleren' && (
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
