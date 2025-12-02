import { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { createDefaultFormObject } from '@src/utilities/schema-object-factory';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn, AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import {
  Heading1,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import ConGebruikStepInformatie from './components/con-gebruik-step-informatie';
import ConGebruikStepProductApplicatie from './components/con-gebruik-step-product-applicatie';
import ConGebruikStepVersie from './components/con-gebruik-step-versie';
import ConGebruikStepOrganisatie from './components/con-gebruik-step-organisatie';
import ConGebruikStepReferentiecomponenten from './components/con-gebruik-step-referentiecomponenten';
import ConGebruikStepStandaarden from './components/con-gebruik-step-standaarden';
import ConGebruikStepKoppelingen from './components/con-gebruik-step-koppelingen';
import ConGebruikStepDiensten from './components/con-gebruik-step-diensten';
import ConGebruikStepReview from './components/con-gebruik-step-review';
import ConGebruikStepDeelnemers from './components/con-gebruik-step-deelnemers';
import { VISUALS } from '@src/constants';
import { useDebouncedInput } from '@src/hooks';
import { isUUID } from '@src/utilities/con-resolve-uuids-in-text';
import { getActiveWizard } from '@src/constants/wizards.constants';
import { getStatusMultiStep } from '@views/ac-forms/ac-forms-applicatie/utils/steps.utils';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { commongroundApiUrl } from '@config';
import _ from 'lodash';
import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';

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

const AcFormsGebruik = ({ store }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gebruikId = searchParams.get('id') || '';
  const typeFromUrl = searchParams.get('type') || '';
  const applicatieFromUrl = searchParams.get('applicatie') || '';
  const isEditMode = !!gebruikId;
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(isEditMode); // Track if we're in initial load phase for edit mode

  // Submission state management (following product wizard pattern)
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [error, setError] = useState({ message: null, errors: null });

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Helper to extract id string from various API reference shapes
  const getIdString = useCallback((ref) => {
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
  }, []);

  // Helper to determine gebruikType based on afnemer and current organization
  const determineGebruikType = useCallback(
    (afnemer, currentOrg) => {
      const currentOrgId = getIdString(currentOrg);
      const afnemerId = getIdString(afnemer);

      // If no afnemer or afnemer equals current organization, it's eigen-organisatie
      if (!afnemerId || (currentOrgId && afnemerId === currentOrgId)) {
        const result = 'eigen-organisatie';

        return result;
      }

      // If afnemer exists and is different from current organization, it's andere-organisatie
      const result = 'andere-organisatie';

      return result;
    },
    [getIdString]
  );

  // Map fetched gebruik object into the local state shape expected by this form
  const mapFetchedGebruikToLocalState = useCallback(
    (api) => {
      if (!api || typeof api !== 'object') return {};

      // Helper function to create contactpersoon object with display name
      const createContactpersoonObject = (contactpersoonData) => {
        if (!contactpersoonData) return '';

        // If it's already a string (ID), we'll return it as is for now
        // The component will handle resolving the display name when contactpersoonOptions are available
        if (typeof contactpersoonData === 'string') {
          return {
            id: contactpersoonData,
            _displayName: null, // Will be resolved later when options are loaded
          };
        }

        // If it's an object, extract ID and create display name
        const id = getIdString(contactpersoonData);
        if (!id) return '';

        // Try to build display name from available properties
        let displayName = '';
        if (contactpersoonData.voornaam || contactpersoonData.achternaam) {
          displayName = [
            contactpersoonData.voornaam,
            contactpersoonData.tussenvoegsel,
            contactpersoonData.achternaam,
          ]
            .filter(Boolean)
            .join(' ');
        } else {
          // Fallback to other name properties
          displayName =
            contactpersoonData?.['@self']?.name ||
            contactpersoonData?.naam ||
            contactpersoonData?.name ||
            contactpersoonData?.displayName ||
            contactpersoonData?.label ||
            id;
        }

        return {
          id: id,
          _displayName: displayName,
        };
      };

      const mapped = {
        id: api.id || api?.['@self']?.id || '',
        status: api.status || 'Verwerving',
        contactpersoon: createContactpersoonObject(
          api.contactpersoon || api?.['@self']?.relations?.contactpersoon
        ),
        // Keep full objects for entities used for labels in UI
        afnemer: (() => {
          const afnemerRef = api.afnemer || api?.['@self']?.relations?.afnemer;

          // If afnemer is already a string (UUID), return it directly
          if (typeof afnemerRef === 'string' && afnemerRef) {
            return afnemerRef;
          }

          // If afnemer is an object, extract the ID
          if (afnemerRef && typeof afnemerRef === 'object') {
            return getIdString(afnemerRef) || null;
          }

          return null;
        })(),
        product: api.product || api?.['@self']?.relations?.product || null,
        // Use string ids for fields used as identifiers in requests
        module: api.module || api?.['@self']?.relations?.module || null,
        moduleVersie:
          getIdString(
            api.moduleVersie ||
              api.moduleversie ||
              api?.['@self']?.relations?.moduleVersie
          ) || '',
        gebruiktVoorReferentiecomponenten: Array.isArray(
          api.gebruiktVoorReferentiecomponenten
        )
          ? api.gebruiktVoorReferentiecomponenten.map((x) => getIdString(x) || x)
          : [],
        deelnemers: Array.isArray(api.deelnemers) ? api.deelnemers : [],
        koppelingen: Array.isArray(api.koppelingen)
          ? api.koppelingen.map((k) => getIdString(k) || k)
          : [],
        diensten: Array.isArray(api.diensten)
          ? api.diensten
              .map((d) => getIdString(d))
              .filter((id) => typeof id === 'string' && id !== '')
          : [],
      };

      // Determine gebruikType based on afnemer vs current organization
      mapped.gebruikType = determineGebruikType(
        mapped.afnemer,
        store?.user?.activeOrganization
      );

      // map the date dependent on the status (it comes from the API as a string like `2025-09-10`)
      mapped.startDatumVerwerving = api.startDatumVerwerving || '';
      mapped.startDatumGepland = api.startDatumGepland || '';
      mapped.startDatumInProductie = api.startDatumInProductie || '';
      mapped.startDatumUitTeFaseren = api.startDatumUitTeFaseren || '';
      mapped.startDatumUitGefaseerd = api.startDatumUitGefaseerd || '';

      return mapped;
    },
    [getIdString, store?.user?.activeOrganization, determineGebruikType]
  );

  // Schema management
  const [schemas, setSchemas] = useState({});
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Gebruik object based on schema
  const [gebruik, setGebruik] = useState({});
  // Single source of truth updater
  const setGebruikData = (key, value) =>
    setGebruik((prev) => ({ ...prev, [key]: value }));

  /**
   * Update function for afnemer organization data
   * Used when creating a new organization for andere-organisatie usage
   */
  const setAfnemerOrganisatieData = useCallback((key, value) => {
    setAfnemerOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Helper function to check if afnemer is samenwerking
  const isAfnemerSamenwerking = useCallback(() => {
    const type = gebruik?.afnemer?.organisatieType || gebruik?.afnemer?.type || '';
    return String(type).toLowerCase() === 'samenwerking';
  }, [gebruik?.afnemer]);

  // Determine gebruikType from URL type parameter
  // When type=ontbrekend-organisatie, it means the user doesn't have an organization, so it's andere-organisatie
  const getGebruikTypeFromUrl = useCallback(() => {
    if (typeFromUrl === 'ontbrekend-organisatie') {
      return 'andere-organisatie';
    }
    // If no type specified, default to null (will be determined from afnemer in edit mode or set by user selection)
    return null;
  }, [typeFromUrl]);

  // Usage type selection state - determined from URL or from API data in edit mode
  const [gebruikType, setGebruikType] = useState(getGebruikTypeFromUrl()); // 'eigen-organisatie' or 'andere-organisatie'

  /**
   * Helper function to get the correct step index accounting for optional steps
   * Accounts for the optional Organisatie step (only shown for andere-organisatie)
   * and the optional Deelnemers step (only shown for samenwerking)
   * @param {number} logicalStep - The logical step number
   * Logical steps: 0=Applicatie, 1=Versie, 2=Organisatie, 3=Informatie, 4=Referentiecomponenten, 5=Standaarden, 6=Koppelingen, 7=Diensten, 8=Deelnemers, 9=Controleren
   * @returns {number} The adjusted physical step index
   */
  const getAdjustedStepIndex = useCallback(
    (logicalStep) => {
      let index = logicalStep;

      // If Organisatie step is not shown (not andere-organisatie), adjust steps after it
      if (gebruikType !== 'andere-organisatie' && logicalStep > 2) {
        index -= 1;
      }

      // If Deelnemers step is not shown and we're past it, adjust the index
      if (!isAfnemerSamenwerking() && logicalStep > 8) {
        index -= 1;
      }

      return index;
    },
    [isAfnemerSamenwerking, gebruikType]
  );

  /**
   * Convert physical step index to logical step number
   * Accounts for optional steps (Organisatie and Deelnemers)
   * @param {number} physicalStep - The physical step index
   * @returns {number} The logical step number
   */
  const getLogicalStepFromPhysical = useCallback(
    (physicalStep) => {
      // Start with physical step
      let logicalStep = physicalStep;

      // If Organisatie step is not shown (not andere-organisatie), skip logical step 2
      if (gebruikType !== 'andere-organisatie') {
        // If we're at or past where Organisatie would be (logical step 2), add 1 to skip it
        if (logicalStep >= 2) {
          logicalStep += 1;
        }
      }

      // If Deelnemers step is not shown, skip logical step 8
      if (!isAfnemerSamenwerking()) {
        // If we're at or past where Deelnemers would be (logical step 8), add 1 to skip it
        if (logicalStep >= 8) {
          logicalStep += 1;
        }
      }

      return logicalStep;
    },
    [isAfnemerSamenwerking, gebruikType]
  );

  /**
   * Generate a mapping of visual step indices to actual step indices
   * This must match the order in which ProcessSteps renders clickable elements
   * @returns {number[]} Array where index is visual position, value is actual step index
   */
  const generateStepIndexMapping = useCallback(() => {
    const mapping = [];

    // Main step 1 header (Applicatie selectie)
    mapping.push(getAdjustedStepIndex(0));
    // Sub-step: Applicatie
    mapping.push(getAdjustedStepIndex(0));
    // Sub-step: Applicatie versie
    mapping.push(getAdjustedStepIndex(1));

    // Conditionally include Organisatie step (only for andere-organisatie)
    if (gebruikType === 'andere-organisatie') {
      mapping.push(getAdjustedStepIndex(2)); // Organisatie
    }

    // Main step 2 header (Gebruik configuratie)
    mapping.push(getAdjustedStepIndex(3));
    // Sub-steps under Gebruik configuratie
    mapping.push(getAdjustedStepIndex(3)); // Gebruik informatie
    mapping.push(getAdjustedStepIndex(4)); // Referentiecomponenten
    mapping.push(getAdjustedStepIndex(5)); // Standaarden
    mapping.push(getAdjustedStepIndex(6)); // Koppelingen
    mapping.push(getAdjustedStepIndex(7)); // Diensten

    // Conditionally include Deelnemers step
    if (isAfnemerSamenwerking()) {
      mapping.push(getAdjustedStepIndex(8)); // Deelnemers
    }

    // Main step 3: Controleren
    mapping.push(getAdjustedStepIndex(9));

    return mapping;
  }, [getAdjustedStepIndex, isAfnemerSamenwerking, gebruikType]);

  /**
   * Handle step navigation from clickable process steps
   * Maps visual step indices to actual step numbers
   * @param {number} visualStepIndex - The index from the visual step representation
   */
  const handleStepNavigation = useCallback(
    (visualStepIndex) => {
      const mapping = generateStepIndexMapping();
      const targetStep = mapping[visualStepIndex];

      if (targetStep !== undefined) {
        setCurrentStep(targetStep);
      }
    },
    [generateStepIndexMapping]
  );

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;
    if (prefillLoading || prefillError) return;

    const addClickHandlers = () => {
      // Find all step elements in the DOM (headers and sub-steps)
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step .denhaag-process-steps__step-header, .denhaag-process-steps .denhaag-process-steps__step .denhaag-process-steps__sub-step'
      );

      // Generate the current mapping to know which visual steps are valid
      const mapping = generateStepIndexMapping();

      stepElements.forEach((stepEl, index) => {
        // Remove any existing click handlers first
        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        // Only make completed steps clickable if they have a valid mapping
        const targetStep = mapping[index];
        if (targetStep !== undefined && targetStep < currentStep) {
          stepEl.classList.add('ac-step-clickable');

          stepEl.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleStepNavigation(index);
          };
        }
      });
    };

    // Add handlers immediately
    addClickHandlers();

    // Also add handlers after a slight delay to handle async rendering
    const timeoutId = setTimeout(addClickHandlers, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    currentStep,
    prefillLoading,
    prefillError,
    generateStepIndexMapping,
    handleStepNavigation,
    gebruikType,
  ]);

  // State for afnemer selection (only for andere-organisatie)
  const [afnemerKeuze, setAfnemerKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'

  /**
   * Afnemer Organization State Object
   *
   * This object holds organization data for creating a new organization.
   * Only used when afnemerKeuze === 'nieuw' and gebruikType === 'andere-organisatie'
   */
  const [afnemerOrganisatie, setAfnemerOrganisatie] = useState({
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

  // Clear certain fields when gebruikType changes to 'andere-organisatie'
  useEffect(() => {
    if (gebruikType === 'andere-organisatie') {
      // Voor andere organisatie gebruik hoeven contactpersoon en referentiecomponenten niet getoond te worden
      // We wissen deze velden om verwarring te voorkomen
      setGebruikData('contactpersoon', '');
      setGebruikData('gebruiktVoorReferentiecomponenten', []);
      // Only clear afnemer if not during initial load in edit mode AND afnemer is not already set from API
      if (!(isEditMode && isInitialLoad) && !gebruik?.afnemer) {
        setGebruikData('afnemer', null);
      }
    }
  }, [gebruikType, isEditMode, isInitialLoad]);

  // When gebruikType is 'eigen-organisatie', ensure afnemer is the active organization UUID
  useEffect(() => {
    if (gebruikType !== 'eigen-organisatie') return;
    const org = store?.user?.activeOrganization;
    if (!org) return;

    // Extract UUID from organization object (following dienst wizard pattern)
    const orgUuid = String(org?.uuid || org?.id || org?.slug || '');

    // Only set afnemer if it's not already set (to avoid overwriting in edit mode) or if it's not during initial load
    if (orgUuid && (!(isEditMode && isInitialLoad) || !gebruik?.afnemer)) {
      setGebruikData('afnemer', orgUuid);
    }
  }, [gebruikType, isEditMode, isInitialLoad]);

  // Options state (UI-only)
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [applicatiePreloadLoading, setApplicatiePreloadLoading] = useState(false);
  // Version dropdown loading not used anymore (derived locally from module data)
  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [dienstOptions, setDienstOptions] = useState([]);

  // Deelnemers (organisaties) options
  const [organisatieOptions, setOrganisatieOptions] = useState([]);

  // Debug organisatieOptions changes
  const [organisatieLoading, setOrganisatieLoading] = useState(false);
  // Versies
  const [versionOptions, setVersionOptions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Referentiecomponenten
  const [refCompOptions, setRefCompOptions] = useState([]);
  // Referentiecomponenten options with search functionality
  const [referentieComponentenOptions, setReferentieComponentenOptions] = useState(
    []
  );
  const [referentieComponentenLoading, setReferentieComponentenLoading] =
    useState(false);

  // Separate array to track chosen referentieComponenten with their standards
  // Structure: [{ id, naam, aanbevolenStandaarden: [], verplichteStandaarden: [], gebruikId }]
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Standaarden options with search functionality
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenOptionsLoading, setStandaardenOptionsLoading] = useState(false);
  // Extra standards selected via multi-select (not from referentieComponenten)
  const [selectedExtraStandards, setSelectedExtraStandards] = useState([]);

  // Contactpersonen (filtered by organization for eigen-organisatie)
  const [contactpersoonOptions, setContactpersoonOptions] = useState([]);
  const [contactpersoonLoading, setContactpersoonLoading] = useState(false);

  // Unsaved changes alert
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  // Fetch schemas on component mount
  useEffect(() => {
    const fetchSchemaAndInit = async () => {
      try {
        // Fetch gebruik schema
        const gebruikResponse = await fetch(
          '/api/apps/openregister/api/schemas/gebruik'
        );
        let gebruikSchema = null;
        if (gebruikResponse.ok) {
          gebruikSchema = await gebruikResponse.json();
          const defaultGebruik = createDefaultFormObject(
            store,
            gebruikSchema,
            'gebruik',
            { status: 'Verwerving' }
          );
          if (!isEditMode) setGebruik((prev) => ({ ...defaultGebruik, ...prev }));
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
          gebruik: gebruikSchema,
          organisatie: organisatieSchema,
        });
        setSchemasLoading(false);
      } catch (error) {
        console.error('Failed to fetch schemas for gebruik form:', error);
        setSchemas({});
        setSchemasLoading(false);
      }
    };
    fetchSchemaAndInit();
  }, [store, isEditMode]);

  // Prefill for edit mode: fetch existing gebruik and map to local state; start at step 0
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      setCurrentStep(0);
      setPrefillLoading(true);
      setPrefillError(null);
      try {
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
        const apiObj = store.object.getObject(
          'voorzieningen_gebruik',
          String(gebruikId)
        );
        const mapped = mapFetchedGebruikToLocalState(apiObj);

        setGebruik(mapped);
        setGebruikType(mapped.gebruikType || null);
        // Mark initial load as complete after a brief delay to allow useEffects to run with the flag still true
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 100);
      } catch (e) {
        if (!cancelled) {
          setPrefillError(
            'Het laden van de gebruiksregistratie is mislukt. Probeer het opnieuw of start een nieuwe registratie.'
          );
        }
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, gebruikId, mapFetchedGebruikToLocalState, store]);

  // Update gebruikType when URL type parameter changes (for non-edit mode)
  useEffect(() => {
    if (!isEditMode) {
      const typeFromUrl = getGebruikTypeFromUrl();
      if (typeFromUrl) {
        setGebruikType(typeFromUrl);
      }
    }
  }, [isEditMode, getGebruikTypeFromUrl]);

  // Determine gebruikType from afnemer when it's not set from URL
  useEffect(() => {
    if (gebruikType !== null || isEditMode) return; // Skip if already set or in edit mode

    const afnemer = gebruik?.afnemer;
    if (afnemer) {
      const determinedType = determineGebruikType(
        afnemer,
        store?.user?.activeOrganization
      );
      if (determinedType) {
        setGebruikType(determinedType);
      }
    } else {
      // If no afnemer and user has an organization, default to eigen-organisatie
      if (store?.user?.activeOrganization) {
        setGebruikType('eigen-organisatie');
      }
    }
  }, [
    gebruik?.afnemer,
    store?.user?.activeOrganization,
    isEditMode,
    gebruikType,
    determineGebruikType,
  ]);

  // Preload all slow API calls at component mount (hotloading like in product form)
  useEffect(() => {
    let isMounted = true;

    const fetchOrganisaties = async () => {
      try {
        // For andere organisatie usage, we don't preload organizations
        // Instead, we rely on search-based loading to allow users to find any organization
        // This prevents loading too many organizations upfront and allows better search functionality
        if (isMounted) setOrganisatieOptions([]);
      } catch (e) {
        if (isMounted) setOrganisatieOptions([]);
      }
    };

    const fetchRefComps = async () => {
      try {
        // Use authenticated API client instead of raw fetch
        await store.object.fetchCollection('vng-gemma', 'element', {
          _limit: '500',
          _page: '1',
          _source: 'index',
          gemmaType: 'Referentiecomponent',
          '_extend[]': '@self.schema',
          _published: 'false',
        });
        const collection = store.object.getCollection('vng-gemma_element');
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            item?.xml?.name?._value ||
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            `Component ${index + 1}`;
          // Prioritize ID over value and never use label as value
          const value = item?.['@self']?.id || item?.id || item?.value || item?.slug;
          return { value: String(value), label: String(label), data: item };
        });
        if (isMounted) setRefCompOptions(options);
      } catch (e) {
        if (isMounted) setRefCompOptions([]);
      }
    };

    // Preload all APIs in parallel for better performance
    fetchOrganisaties();
    fetchRefComps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load all modules on component mount
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setModulesLoading(true);
      try {
        await store.object.fetchCollection(
          'voorzieningen',
          'module',
          {
            _limit: '50',
            _page: '1',
            '_extend[]': '@self.schema',
            _published: 'false',
          },
          null,
          'gebruik_form'
        );
        if (cancelled) return;

        const collection = store.object.getCollection(
          'voorzieningen_module_gebruik_form'
        );
        const list = collection?.results || collection || [];
        const options = list.map(mapToOption);
        setModulesOptions(options);
      } catch (_) {
        if (!cancelled) {
          setModulesOptions([]);
        }
      } finally {
        if (!cancelled) setModulesLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
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
          // Pre-select the applicatie (already in options, no fetch needed)
          setGebruikData('module', applicatieOption.value);
        } else {
          // If applicatie not in initial list, fetch it directly
          setApplicatiePreloadLoading(true);
          try {
            await store.object.fetchObject(
              'voorzieningen',
              'module',
              String(applicatieFromUrl),
              {
                '_extend[]': '@self.schema',
                _published: 'false',
              }
            );
            const fetched = store.object.getObject(
              'voorzieningen_module',
              String(applicatieFromUrl)
            );
            if (fetched) {
              const option = mapToOption(fetched, 0);
              setModulesOptions((prev) => {
                const exists = prev.some((o) => o.value === option.value);
                if (exists) return prev;
                return [...prev, option];
              });
              setGebruikData('module', option.value);
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
  }, [applicatieFromUrl, modulesOptions, isEditMode, store]);

  // Server-side search for modules (searches all modules)
  const searchModules = useCallback(
    async (query) => {
      try {
        setSearchLoading(true);
        const q = String(query || '').trim();

        const queryParams = {
          _limit: '50',
          _page: '1',
          '_extend[]': '@self.schema',
          _published: 'false',
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
          'gebruik_form_search'
        );
        const collection = store.object.getCollection(
          'voorzieningen_module_gebruik_form_search'
        );
        const list = collection?.results || collection || [];
        const options = list.map(mapToOption);

        // Merge with existing options to preserve selected items
        setModulesOptions((prevOptions) => {
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

        // Filter out the user's own organization for "andere organisatie" selection
        const currentOrgId = String(
          store?.user?.activeOrganization?.uuid ||
            store?.user?.activeOrganization?.id ||
            ''
        );
        const filteredList = list.filter((item) => {
          const orgId = String(item?.['@self']?.id || item?.id || '');
          return orgId !== currentOrgId;
        });

        const options = filteredList.map((item, index) => {
          const label =
            item?.['@self']?.name ||
            item?.naam ||
            item?.name ||
            item?.title ||
            `Organisatie ${index + 1}`;
          // Use same pattern as mapToOption function - @self.id first, then fallbacks
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

  // Trigger initial organization search when switching to 'andere-organisatie'
  useEffect(() => {
    if (gebruikType === 'andere-organisatie') {
      // Load initial organizations when switching to andere-organisatie mode
      searchOrganisaties('');
    }
  }, [gebruikType, searchOrganisaties]);

  // Server-side search for contactpersonen (filtered by organization for eigen-organisatie)
  const searchContactpersonen = useCallback(
    async (query) => {
      try {
        setContactpersoonLoading(true);
        const q = String(query || '').trim();

        // Always fetch contactpersonen - either with search query or initial load
        const params = {
          _limit: '50',
          _page: '1',
          _source: 'database',
          _published: 'false',
        };

        // Add search parameter if query is provided
        if (q) {
          params._search = q;
        }

        await store.object.fetchCollection(
          'voorzieningen',
          'contactpersoon',
          params
        );
        const collection = store.object.getCollection(
          'voorzieningen_contactpersoon'
        );
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            [item?.voornaam, item?.tussenvoegsel, item?.achternaam]
              .filter(Boolean)
              .join(' ') || `Contactpersoon ${index + 1}`;
          const value = item?.['@self']?.id || item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        });
        setContactpersoonOptions(options);
      } catch (e) {
        setContactpersoonOptions([]);
      } finally {
        setContactpersoonLoading(false);
      }
    },
    [store, gebruikType]
  );

  // Debounced search functions (500ms)
  const debouncedSearchModules = useDebouncedInput(searchModules, 250, {
    disableInstantValidation: true,
  });
  const debouncedSearchOrganisaties = useDebouncedInput(searchOrganisaties, 500, {
    disableInstantValidation: true,
  });
  const debouncedSearchContactpersonen = useDebouncedInput(
    searchContactpersonen,
    500,
    {
      disableInstantValidation: true,
    }
  );

  // Trigger initial contactperson search when switching to 'eigen-organisatie'
  useEffect(() => {
    if (gebruikType === 'eigen-organisatie') {
      // Load initial contactpersons when switching to eigen-organisatie mode
      searchContactpersonen('');
    }
  }, [gebruikType, searchContactpersonen]);

  // Function to load referentiecomponenten
  const loadReferentieComponenten = useCallback(async () => {
    console.info('📋 Loading referentiecomponenten...');
    setReferentieComponentenLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
        _published: 'false',
      });

      // Fetch referentiecomponenten from openconnector endpoint
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

      const mapToOption = (item, index) => {
        const label =
          item?.xml?.name?._value ||
          item?.naam ||
          item?.name ||
          item?.title ||
          item?.label ||
          `Component ${index + 1}`;
        const value = item?.value || item?.id || item?.slug || label;
        return {
          value: String(value),
          label: String(label),
          data: item, // Store the full API data for access to aanbevolenStandaarden, verplichteStandaarden
        };
      };

      const options = list.results
        .map(mapToOption)
        .filter((o) => o.label && o.value);

      setReferentieComponentenOptions(options);
      console.info(`✅ Loaded ${options.length} referentiecomponenten`);
    } catch (e) {
      console.error('Failed to load referentie componenten:', e);
      setReferentieComponentenOptions([]);
    } finally {
      setReferentieComponentenLoading(false);
    }
  }, []);

  // ✅ Load referentiecomponenten when component mounts
  useEffect(() => {
    // Only load if we haven't loaded yet and we're not currently loading
    const shouldLoadRefs =
      referentieComponentenOptions.length === 0 && !referentieComponentenLoading;

    if (shouldLoadRefs) {
      loadReferentieComponenten();
    }
  }, [
    loadReferentieComponenten,
    referentieComponentenOptions.length,
    referentieComponentenLoading,
  ]);

  // Function to load standaarden
  const loadStandaarden = useCallback(async () => {
    console.info('📋 Loading standaarden...');
    setStandaardenOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
        '_extend[]': '@self.schema',
        _published: 'false',
      });

      // Fetch standards from openconnector endpoint
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
      console.info(`✅ Loaded ${options.length} standaarden`);
    } catch (e) {
      console.error('Failed to load standaarden:', e);
      setStandaardenOptions([]);
    } finally {
      setStandaardenOptionsLoading(false);
    }
  }, []);

  // ✅ Load standaarden when component mounts
  useEffect(() => {
    // Only load if we haven't loaded yet and we're not currently loading
    const shouldLoadStandards =
      standaardenOptions.length === 0 && !standaardenOptionsLoading;

    if (shouldLoadStandards) {
      loadStandaarden();
    }
  }, [loadStandaarden, standaardenOptions.length, standaardenOptionsLoading]);

  // Initialize selectedExtraStandards from existing compliancy data
  useEffect(() => {
    if (standaardenOptions.length === 0) return;
    if (selectedExtraStandards.length > 0) return; // Already initialized

    const existingCompliancy = gebruik.compliancy || [];
    if (existingCompliancy.length === 0) return;

    // Get all standard IDs from referentieComponentenWithStandards
    const getAllStandardsFromRefs = () => {
      const standardsSet = new Set();
      referentieComponentenWithStandards.forEach((refComp) => {
        if (
          refComp.aanbevolenStandaarden &&
          Array.isArray(refComp.aanbevolenStandaarden)
        ) {
          refComp.aanbevolenStandaarden.forEach((standard) => {
            const id =
              standard?.id ||
              standard?.identifier ||
              standard?.value ||
              standard?.slug ||
              standard?.naam ||
              standard?.name;
            if (id) standardsSet.add(String(id));
          });
        }
        if (
          refComp.verplichteStandaarden &&
          Array.isArray(refComp.verplichteStandaarden)
        ) {
          refComp.verplichteStandaarden.forEach((standard) => {
            const id =
              standard?.id ||
              standard?.identifier ||
              standard?.value ||
              standard?.slug ||
              standard?.naam ||
              standard?.name;
            if (id) standardsSet.add(String(id));
          });
        }
      });
      return standardsSet;
    };

    const refStandardIds = getAllStandardsFromRefs();
    const extraStandardsInCompliancy = existingCompliancy
      .map((comp) => {
        const standardId = String(comp.standaardversie);
        // Check if this standard is NOT in referentieComponenten (i.e., it's an extra standard)
        if (!refStandardIds.has(standardId)) {
          // Find the option for this standard
          return standaardenOptions.find(
            (opt) =>
              String(
                opt.value || opt.data?.id || opt.data?.identifier || opt.data?.value
              ) === standardId
          );
        }
        return null;
      })
      .filter(Boolean);

    if (extraStandardsInCompliancy.length > 0) {
      setSelectedExtraStandards(extraStandardsInCompliancy);
    }
  }, [
    standaardenOptions,
    referentieComponentenWithStandards,
    gebruik.compliancy,
    selectedExtraStandards.length,
  ]);

  // Resolve contactpersoon display name when options become available
  useEffect(() => {
    if (
      contactpersoonOptions.length > 0 &&
      typeof gebruik?.contactpersoon === 'object' &&
      gebruik.contactpersoon !== null &&
      gebruik.contactpersoon.id &&
      !gebruik.contactpersoon._displayName
    ) {
      const option = contactpersoonOptions.find(
        (opt) => opt.value === gebruik.contactpersoon.id
      );
      if (option) {
        setGebruikData('contactpersoon', {
          id: gebruik.contactpersoon.id,
          _displayName: option.label,
        });
      }
    }
  }, [contactpersoonOptions, gebruik?.contactpersoon]);

  // Resolve selected module object whenever selection changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const mod = gebruik?.module;
      if (!mod) {
        return;
      }

      let modData =
        typeof mod === 'object'
          ? mod
          : modulesOptions.find((m) => String(m.value) === String(mod))?.data;

      const versiesArray =
        (modData && (modData.moduleVersies || modData.moduleversies)) || null;

      if (!modData || !Array.isArray(versiesArray) || versiesArray.length === 0) {
        try {
          await store.object.fetchObject('voorzieningen', 'module', String(mod), {
            '_extend[]': '@self.schema,@self.relations',
            _published: 'false',
          });
          if (cancelled) return;
          modData = store.object.getObject('voorzieningen_module', String(mod));
        } catch (e) {
          return;
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [gebruik?.module, modulesOptions]);

  // When selected module object changes, derive versions from module.moduleVersies (no external API)
  // When module changes, fetch moduleversies filtered by module id
  useEffect(() => {
    setVersionOptions([]);
    const mod = gebruik?.module;
    const moduleId = getIdString(mod);
    if (!moduleId) {
      // Don't clear moduleVersie in edit mode during initial load
      if (gebruik?.moduleVersie != null && !(isEditMode && isInitialLoad)) {
        setGebruikData('moduleVersie', null);
      }
      return;
    }

    let cancelled = false;
    const run = async () => {
      setVersionsLoading(true);
      try {
        await store.object.fetchCollection('voorzieningen', 'moduleversie', {
          module: String(moduleId),
          _limit: '100',
          _page: '1',
          _published: 'false',
        });
        if (cancelled) return;

        const type = store.object.getTypeFromParams('voorzieningen', 'moduleversie');
        const collection = store.object.getCollection(type);
        const list = collection?.results || collection || [];
        const options = list.map((v, idx) => {
          const label = v?.versie || v?.version || v?.nummer || `Versie ${idx + 1}`;
          const value = v?.id ?? label;
          return { value: String(value), label: String(label), data: v };
        });

        setVersionOptions(options);

        const current = String(gebruik?.moduleVersie || '');
        if (current && !options.some((o) => o.value === current)) {
          // Don't clear moduleVersie in edit mode during initial load
          if (!(isEditMode && isInitialLoad)) {
            setGebruikData('moduleVersie', null);
          }
        }
        if (options.length === 1 && current !== options[0].value) {
          setGebruikData('moduleVersie', options[0].value);
        }
      } catch (_) {
        if (!cancelled) setVersionOptions([]);
      } finally {
        if (!cancelled) setVersionsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [gebruik?.module, store]);

  // When module changes, fetch diensten filtered by module id and map options to dienst IDs
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const m = gebruik?.module;
      const moduleId = getIdString(m);

      if (!moduleId) {
        if (!cancelled) {
          setDienstOptions([]);
          // Don't clear diensten during initial load in edit mode
          if (
            Array.isArray(gebruik?.diensten) &&
            gebruik.diensten.length &&
            !(isEditMode && isInitialLoad)
          ) {
            setGebruikData('diensten', []);
          }
        }
        return;
      }

      try {
        await store.object.fetchCollection('voorzieningen', 'dienst', {
          modules: String(moduleId),
          _limit: '100',
          _page: '1',
          _published: 'false',
        });

        if (cancelled) return;

        const type = store.object.getTypeFromParams('voorzieningen', 'dienst');
        const collection = store.object.getCollection(type);
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            item?.['@self']?.name ||
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            `Dienst ${index + 1}`;
          const value = item?.id;
          return { value: String(value), label: String(label), data: item };
        });

        setDienstOptions(options);

        // Prune selected diensten to those still available for current module
        // But don't prune during initial load in edit mode to preserve existing selections
        // IMPORTANT: For "andere-organisatie" types, don't prune diensten as the user may not have
        // permission to see all available diensten, but should preserve existing ones
        if (
          Array.isArray(gebruik?.diensten) &&
          gebruik.diensten.length &&
          !(isEditMode && isInitialLoad) &&
          !(isEditMode && gebruikType === 'andere-organisatie') // Don't prune for andere-organisatie in edit mode
        ) {
          const allowed = new Set(options.map((o) => String(o.value)));
          const next = gebruik.diensten
            .map((d) => String(d))
            .filter((id) => allowed.has(id));
          if (next.length !== gebruik.diensten.length) {
            setGebruikData('diensten', next);
          }
        }
      } catch (_) {
        if (!cancelled) {
          setDienstOptions([]);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // React to module changes and edit mode state
  }, [gebruik?.module, isEditMode, isInitialLoad, gebruikType]);

  // Helper function to create koppeling option with proper labels
  const createKoppelingOption = async (item, index) => {
    let appAName = `A${index + 1}`;
    let appBName = `B${index + 1}`;

    // Try to get moduleA name - check relations first, then direct properties
    const moduleAId = item?.['@self']?.relations?.moduleA || item?.moduleA;

    if (item?.moduleA?.naam) {
      appAName = item.moduleA.naam;
    } else if (Array.isArray(item?.moduleA) && item.moduleA[0]?.naam) {
      appAName = item.moduleA[0].naam;
    } else if (moduleAId) {
      // ModuleA is a UUID, resolve it
      try {
        const resolvedName = await store.object.getNamesForSingleId(
          String(moduleAId)
        );
        appAName = resolvedName || String(moduleAId);
      } catch (e) {
        appAName = String(moduleAId) || `A${index + 1}`;
      }
    }

    // Try to get moduleB name - check relations first, then direct properties
    const moduleBId = item?.['@self']?.relations?.moduleB || item?.moduleB;

    if (item?.moduleB?.naam) {
      appBName = item.moduleB.naam;
    } else if (Array.isArray(item?.moduleB) && item.moduleB[0]?.naam) {
      appBName = item.moduleB[0].naam;
    } else if (moduleBId) {
      // ModuleB is a UUID, resolve it
      try {
        const resolvedName = await store.object.getNamesForSingleId(
          String(moduleBId)
        );
        appBName = resolvedName || String(moduleBId);
      } catch (e) {
        appBName = String(moduleBId) || `B${index + 1}`;
      }
    }

    const direction = item?.gegevensuitwisselingRichting;
    const arrow = direction === 'AnaarB' ? '→' : direction === 'BnaarA' ? '←' : '↔';

    // Get koppeling name
    const rawKoppelingName =
      item?.['@self']?.name ||
      item?.naam ||
      item?.name ||
      item?.title ||
      item?.label ||
      '';

    // Only show koppeling name if it's not a UUID
    const koppelingName =
      rawKoppelingName && !isUUID(rawKoppelingName) ? rawKoppelingName : '';

    // Create descriptive label
    const moduleConnection = `${appAName} ${arrow} ${appBName}`;
    const label = koppelingName
      ? `${koppelingName} (${moduleConnection})`
      : moduleConnection;

    // Use the koppeling's ID as the value
    const value = item?.id || item?.['@self']?.id || item?.value || String(index);
    return { value: String(value), label: String(label) };
  };

  // When module changes, fetch koppelingen where moduleA or moduleB equals the selected module
  useEffect(() => {
    const fetchKoppelingenByModule = async () => {
      try {
        const moduleId = getIdString(gebruik?.module);

        // If no module selected, fetch all koppelingen
        if (!moduleId) {
          try {
            await store.object.fetchCollection('voorzieningen', 'koppeling', {
              _limit: '100',
              _page: '1',
              _published: 'false',
            });
            const type = store.object.getTypeFromParams(
              'voorzieningen',
              'koppeling'
            );
            const collection = store.object.getCollection(type);
            const allKoppelingen = collection?.results || collection || [];

            const options = await Promise.all(
              allKoppelingen.map(async (item, index) => {
                return await createKoppelingOption(item, index);
              })
            );

            setKoppelingOptions(options);
          } catch (e) {
            setKoppelingOptions([]);
          }
          return;
        }

        // Make two separate API calls sequentially to avoid store conflicts
        let moduleAResults = [];
        let moduleBResults = [];

        try {
          // First fetch koppelingen where moduleA equals the selected module ID
          await store.object.fetchCollection('voorzieningen', 'koppeling', {
            _limit: '100',
            _page: '1',
            moduleA: moduleId,
            _published: 'false',
          });
          const typeA = store.object.getTypeFromParams('voorzieningen', 'koppeling');
          const collectionA = store.object.getCollection(typeA);
          moduleAResults = collectionA?.results || collectionA || [];
        } catch (e) {
          moduleAResults = [];
        }

        try {
          // Then fetch koppelingen where moduleB equals the selected module ID
          await store.object.fetchCollection('voorzieningen', 'koppeling', {
            _limit: '100',
            _page: '1',
            moduleB: moduleId,
            _published: 'false',
          });
          const typeB = store.object.getTypeFromParams('voorzieningen', 'koppeling');
          const collectionB = store.object.getCollection(typeB);
          moduleBResults = collectionB?.results || collectionB || [];
        } catch (e) {
          moduleBResults = [];
        }

        // Merge results and remove duplicates based on ID
        const allKoppelingen = [...moduleAResults, ...moduleBResults];
        const uniqueKoppelingen = allKoppelingen.filter(
          (item, index, self) =>
            index ===
            self.findIndex((k) => (k?.id || k?.value) === (item?.id || item?.value))
        );

        // If no koppelingen found for this module, don't search again - just set empty options
        if (uniqueKoppelingen.length === 0) {
          setKoppelingOptions([]);
          return;
        }

        const options = await Promise.all(
          uniqueKoppelingen.map(async (item, index) => {
            return await createKoppelingOption(item, index);
          })
        );

        setKoppelingOptions(options);
      } catch (e) {
        setKoppelingOptions([]);
      }
    };

    fetchKoppelingenByModule();
  }, [gebruik?.module, getIdString]);

  // When afnemer is samenwerking, organisaties are already preloaded - no additional API calls needed
  useEffect(() => {
    // Organisaties are now preloaded at component mount, so we don't need conditional fetching
    // The preloaded organisatie options are always available for both afnemer selection and deelnemers
    if (!isAfnemerSamenwerking()) {
      // Keep organisatie options available as they're also used for afnemer selection
      // No need to clear them as they're useful for the afnemer field
    }
  }, [gebruik?.afnemer]);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  // Submission handler (following product wizard pattern)
  const handleRegister = async () => {
    setLoading(true);
    try {
      let finalAfnemer = gebruik?.afnemer;

      // ✅ For andere-organisatie with new organization, create the organization first
      if (gebruikType === 'andere-organisatie' && afnemerKeuze === 'nieuw') {
        try {
          const newOrganizationData = {
            naam: afnemerOrganisatie.naam,
            type: afnemerOrganisatie.type,
            website: afnemerOrganisatie.website,
            beschrijvingKort: afnemerOrganisatie.beschrijvingKort,
            beschrijvingLang: afnemerOrganisatie.beschrijvingLang,
            'e-mailadres': afnemerOrganisatie['e-mailadres'],
            telefoonnummer: afnemerOrganisatie.telefoonnummer,
            kvkNummer: afnemerOrganisatie.kvkNummer,
            logo: afnemerOrganisatie.logo,
          };

          // Create the organization and get its ID
          const createdOrganization = await store.object.createObject(
            'voorzieningen',
            'organisatie',
            newOrganizationData
          );

          // Use the newly created organization ID as afnemer
          finalAfnemer =
            createdOrganization?.id || createdOrganization?.['@self']?.id;

          if (!finalAfnemer) {
            throw new Error('Organisatie aangemaakt maar geen ID ontvangen');
          }
        } catch (orgError) {
          console.error('Failed to create organization:', orgError);
          setRegisterCallBack('error');
          setError({
            message:
              'Er is een fout opgetreden bij het aanmaken van de organisatie. Probeer het opnieuw.',
            errors: null,
          });
          setLoading(false);
          return;
        }
      }

      // Strip any local IDs and prepare data for submission
      const gebruikData = {
        ...gebruik,
        // Ensure required fields are properly set
        contactpersoon: gebruik?.contactpersoon?.id,
        // Extract UUID from afnemer (should be UUID string for eigen-organisatie, object for andere-organisatie)
        afnemer: (() => {
          // Use finalAfnemer if we just created a new organization
          if (finalAfnemer) {
            return typeof finalAfnemer === 'string'
              ? finalAfnemer
              : finalAfnemer.uuid || finalAfnemer.id || finalAfnemer.value;
          }

          const afnemer = gebruik?.afnemer;
          if (!afnemer) return null;
          // If it's already a string (UUID), return it
          if (typeof afnemer === 'string') return afnemer;
          // If it's an object (from ConSchemaEnhancedField), try to extract UUID
          return afnemer.uuid || afnemer.id || afnemer.value || afnemer;
        })(),
        module: gebruik?.module,
        moduleVersie: gebruik?.moduleVersie,
        status: gebruik?.status || 'Verwerving',
      };

      // Submit to the gebruik endpoint using the object store
      if (isEditMode) {
        await store.object.updateObject(
          'voorzieningen',
          'gebruik',
          String(gebruikId),
          gebruikData
        );
      } else {
        await store.object.createObject('voorzieningen', 'gebruik', gebruikData);
      }

      // On success, show success page
      setRegisterCallBack('success');
    } catch (err) {
      setRegisterCallBack('error');
      setError({
        message: 'Er is een fout opgetreden bij het registreren van het gebruik.',
        errors: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const stepsList = (() => {
    const base = [
      'Applicatie',
      'Applicatie versie',
      'Gebruik informatie',
      'Referentiecomponenten',
      'Standaarden',
      'Koppelingen',
      'Diensten',
    ];
    if (isAfnemerSamenwerking()) base.push('Deelnemers');
    base.push('Controleren');
    return base;
  })();

  const currentStepName = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        return 'Applicatie';
      case 1:
        return 'Applicatie versie';
      case 2:
        return 'Afnemer';
      case 3:
        return 'Gebruik informatie';
      case 4:
        return 'Referentiecomponenten';
      case 5:
        return 'Standaarden';
      case 6:
        return 'Koppelingen';
      case 7:
        return 'Diensten';
      case 8:
        return 'Deelnemers';
      case 9:
        return 'Controleren';
      default:
        return stepsList[step] || '';
    }
  };

  const canGoNext = () => {
    const logicalStep = getLogicalStepFromPhysical(currentStep);

    if (logicalStep === 0) {
      return !!gebruik?.module; // Applicatie step
    }
    if (logicalStep === 1) {
      return true; // Versie step
    }
    if (logicalStep === 2) {
      // Organisatie step (only for andere-organisatie)
      if (gebruikType === 'andere-organisatie') {
        // Validate based on afnemerKeuze
        if (afnemerKeuze === 'bestaand') {
          // If selecting existing organization: only afnemer required
          return !!gebruik?.afnemer;
        } else {
          // If creating new organization: validate required fields
          const requiredNewOrgFields = ['naam', 'type', 'website'];
          const missingNewOrgFields = requiredNewOrgFields.filter(
            (field) =>
              !afnemerOrganisatie[field] || !String(afnemerOrganisatie[field]).trim()
          );

          // Validate website format if provided
          if (
            afnemerOrganisatie.website &&
            String(afnemerOrganisatie.website).trim()
          ) {
            const website = String(afnemerOrganisatie.website).trim();
            if (!validateWebsite(website)) {
              return false;
            }
          }

          // All required fields must be filled
          return missingNewOrgFields.length === 0;
        }
      }
      // This shouldn't happen, but if somehow we're on step 2 without andere-organisatie, allow progression
      return true;
    }
    if (logicalStep === 3) {
      // Gebruik informatie step - status required
      return !!gebruik?.status;
    }
    if (logicalStep === 4) {
      return true; // Referentiecomponenten optional
    }
    if (logicalStep === 5) {
      // Standaarden step: validate URLs in compliancy array
      if (Array.isArray(gebruik.compliancy)) {
        const invalidUrls = gebruik.compliancy.filter(
          (comp) =>
            comp.url &&
            String(comp.url).trim() &&
            !validateWebsite(String(comp.url).trim())
        );
        if (invalidUrls.length > 0) {
          return false; // Cannot proceed if there are invalid URLs
        }
      }
      return true; // Standaarden optional (but URLs must be valid if provided)
    }
    if (logicalStep === 6) {
      return true; // koppelingen optional
    }
    if (logicalStep === 7) {
      return true; // diensten optional
    }
    if (logicalStep === 8 && isAfnemerSamenwerking()) {
      return true; // deelnemers optional
    }
    return false;
  };

  const renderStep = (step) => {
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        return (
          <ConGebruikStepProductApplicatie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            moduleOptions={modulesOptions}
            modulesLoading={modulesLoading || applicatiePreloadLoading}
            searchLoading={searchLoading}
            searchModules={debouncedSearchModules}
            schemas={schemas}
          />
        );
      case 1:
        return (
          <ConGebruikStepVersie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            versionOptions={versionOptions}
            versionsLoading={versionsLoading}
            schemas={schemas}
          />
        );
      case 2:
        // Organisatie step (only for andere-organisatie)
        return (
          <ConGebruikStepOrganisatie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            loading={loading}
            organisatieOptions={organisatieOptions}
            organisatieLoading={organisatieLoading}
            searchOrganisaties={debouncedSearchOrganisaties}
            schemas={schemas}
            gebruikType={gebruikType}
            afnemerKeuze={afnemerKeuze}
            setAfnemerKeuze={setAfnemerKeuze}
            afnemerOrganisatie={afnemerOrganisatie}
            setAfnemerOrganisatieData={setAfnemerOrganisatieData}
          />
        );
      case 3:
        return (
          <ConGebruikStepInformatie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            loading={loading}
            contactpersoonOptions={contactpersoonOptions}
            contactpersoonLoading={contactpersoonLoading}
            searchContactpersonen={debouncedSearchContactpersonen}
            schemas={schemas}
            schemasLoading={schemasLoading}
            gebruikType={gebruikType}
          />
        );
      case 4:
        return (
          <ConGebruikStepReferentiecomponenten
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            referentieComponentenOptions={referentieComponentenOptions}
            setReferentieComponentenWithStandards={
              setReferentieComponentenWithStandards
            }
            loading={loading}
            referentieComponentenLoading={referentieComponentenLoading}
          />
        );
      case 5:
        return (
          <ConGebruikStepStandaarden
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
            selectedExtraStandards={selectedExtraStandards}
            setSelectedExtraStandards={setSelectedExtraStandards}
          />
        );
      case 6:
        return (
          <ConGebruikStepKoppelingen
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            koppelingOptions={koppelingOptions}
            schemas={schemas}
          />
        );
      case 7:
        return (
          <ConGebruikStepDiensten
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            dienstOptions={dienstOptions}
            schemas={schemas}
          />
        );
      case 8:
        if (isAfnemerSamenwerking()) {
          return (
            <ConGebruikStepDeelnemers
              gebruik={gebruik}
              setGebruikData={setGebruikData}
              organisatieOptions={organisatieOptions}
              schemas={schemas}
            />
          );
        }
      // fall through to review if not samenwerking
      case 9:
      default:
        return (
          <ConGebruikStepReview
            gebruik={gebruik}
            versionOptions={versionOptions}
            refCompOptions={refCompOptions}
            koppelingOptions={koppelingOptions}
            dienstOptions={dienstOptions}
            organisatieOptions={organisatieOptions}
            moduleOptions={modulesOptions}
            contactpersoonOptions={contactpersoonOptions}
            standaardenOptions={standaardenOptions}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
          />
        );
    }
  };

  const {
    icon: Icon,
    name: wizardName,
    schema: wizardSchema,
  } = useMemo(() => getActiveWizard() || {}, [gebruikType]);
  const capitalizedSchema = _.capitalize(wizardSchema);
  const editModeTitle = `${capitalizedSchema} updaten`;

  const wizardType = isEditMode
    ? 'update'
    : gebruikType === 'andere-organisatie'
    ? 'toevoegen'
    : 'registratie';

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {/* Main form - only show when not in success/error state */}
          {!registerCallBack && (
            <>
              <div>
                <Heading1
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Icon style={{ width: '1em', height: '1em' }} />
                  {isEditMode ? editModeTitle : wizardName}
                </Heading1>
                <Paragraph>
                  Selecteer een applicatie, vul aanvullende informatie aan en
                  controleer uw invoer.
                </Paragraph>
              </div>

              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName(currentStep)}
                </h3>

                <div className='ac-register-container ac-forms-product'>
                  <div ref={processStepsRef} className='ac-register-process-steps'>
                    <ProcessSteps
                      steps={[
                        {
                          id: 'applicatie-selectie-step',
                          marker: 1,
                          status: getStatusMultiStep(
                            currentStep,
                            getAdjustedStepIndex(0),
                            getAdjustedStepIndex(0),
                            getAdjustedStepIndex(1)
                          ),
                          title: 'Applicatie selectie',
                          steps: [
                            {
                              id: 'applicatie-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(0)
                              ),
                              title: 'Applicatie',
                            },
                            {
                              id: 'versie-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(1)
                              ),
                              title: 'Applicatie versie',
                            },
                          ],
                        },
                        // Conditionally include Organisatie step (only for andere-organisatie)
                        ...(gebruikType === 'andere-organisatie'
                          ? [
                              {
                                id: 'afnemer-step',
                                marker: 2,
                                status: getStatus(
                                  currentStep,
                                  getAdjustedStepIndex(2)
                                ),
                                title: 'Afnemer',
                              },
                            ]
                          : []),
                        {
                          id: 'gebruik-configuratie-step',
                          marker: gebruikType === 'andere-organisatie' ? 3 : 2,
                          status: getStatusMultiStep(
                            currentStep,
                            getAdjustedStepIndex(3),
                            getAdjustedStepIndex(3),
                            getAdjustedStepIndex(isAfnemerSamenwerking() ? 8 : 7)
                          ),
                          title: 'Gebruik configuratie',
                          steps: [
                            {
                              id: 'informatie-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(3)
                              ),
                              title: 'Gebruik informatie',
                            },
                            {
                              id: 'referentiecomponenten-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(4)
                              ),
                              title: 'Referentiecomponenten',
                            },
                            {
                              id: 'standaarden-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(5)
                              ),
                              title: 'Standaarden',
                            },
                            {
                              id: 'koppelingen-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(6)
                              ),
                              title: 'Koppelingen',
                            },
                            {
                              id: 'diensten-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(7)
                              ),
                              title: 'Diensten',
                            },
                            // Conditionally include Deelnemers step
                            ...(isAfnemerSamenwerking()
                              ? [
                                  {
                                    id: 'deelnemers-substep',
                                    status: getStatus(
                                      currentStep,
                                      getAdjustedStepIndex(8)
                                    ),
                                    title: 'Deelnemers',
                                  },
                                ]
                              : []),
                          ],
                        },
                        {
                          id: 'controleren-step',
                          marker: gebruikType === 'andere-organisatie' ? 4 : 3,
                          status: getStatus(currentStep, getAdjustedStepIndex(9)),
                          title: 'Controleren',
                        },
                      ]}
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
                            🐛 Debug: Gebruik Object (Click to expand)
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
                            {JSON.stringify(gebruik, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}

                    {renderStep(currentStep)}

                    <div
                      className={clsx(
                        'ac-register-form-buttons',
                        currentStep !== 0 &&
                          'ac-register-form-buttons-not-first-step'
                      )}
                    >
                      {currentStep !== 0 && (
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => setCurrentStep(currentStep - 1)}
                          disabled={loading || prefillLoading || !!prefillError}
                        >
                          Vorige
                        </AcButton>
                      )}

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
                        {getLogicalStepFromPhysical(currentStep) === 2 &&
                          gebruikType === 'andere-organisatie' && (
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={
                                afnemerKeuze === 'bestaand' ? (
                                  <VISUALS.BUILDING />
                                ) : (
                                  <VISUALS.ARROW_LEFT />
                                )
                              }
                              onClick={() =>
                                afnemerKeuze === 'bestaand'
                                  ? setAfnemerKeuze('nieuw')
                                  : setAfnemerKeuze('bestaand')
                              }
                            >
                              {afnemerKeuze === 'bestaand'
                                ? 'Ik kan de gewenste leverancier niet vinden'
                                : 'Bestaande leverancier selecteren'}
                            </AcButton>
                          )}

                        {getLogicalStepFromPhysical(currentStep) !== 9 && (
                          <div className='ac-register-button-wrapper'>
                            <AcButton
                              style='button'
                              icon={<VISUALS.ARROW_RIGHT />}
                              onClick={() => setCurrentStep(currentStep + 1)}
                              disabled={
                                !canGoNext() ||
                                loading ||
                                prefillLoading ||
                                !!prefillError
                              }
                            >
                              Volgende
                            </AcButton>
                          </div>
                        )}
                      </AcFlex>

                      {getLogicalStepFromPhysical(currentStep) === 9 && (
                        <AcButton
                          style='button'
                          buttonType='primary'
                          icon={
                            isEditMode ? (
                              <VISUALS.SAVE />
                            ) : (
                              <VISUALS.CLIPBOARD_CHECK />
                            )
                          }
                          onClick={handleRegister}
                          loading={loading}
                          disabled={loading || prefillLoading}
                        >
                          {isEditMode ? 'Gebruik updaten' : 'Gebruik registreren'}
                        </AcButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error Display */}
          {registerCallBack === 'error' && error.message && (
            <div>
              <Heading1>❌ Registratie mislukt</Heading1>
              <div style={{ marginTop: '1rem' }}>
                <div className='utrecht-alert utrecht-alert--error'>
                  <Paragraph>{error.message}</Paragraph>
                  {error.errors && (
                    <ul>
                      {Object.entries(error.errors).map(([field, messages]) => (
                        <li key={field}>
                          <strong>{field}:</strong>{' '}
                          {Array.isArray(messages) ? messages.join(', ') : messages}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <AcButton
                    style='button'
                    onClick={() => {
                      setRegisterCallBack(null);
                      setError({ message: null, errors: null });
                    }}
                  >
                    Probeer opnieuw
                  </AcButton>
                </div>
              </div>
            </div>
          )}

          {/* Success Page */}
          {registerCallBack === 'success' && (
            <div>
              <Heading1>
                {isEditMode
                  ? '🎉 Gebruik succesvol geüpdatet!'
                  : '🎉 Gebruik succesvol geregistreerd!'}
              </Heading1>

              <Alert type='ok'>
                <Paragraph>
                  <strong>
                    {isEditMode
                      ? 'Uw gebruik is succesvol bijgewerkt!'
                      : 'Uw gebruik is succesvol geregistreerd!'}
                  </strong>
                </Paragraph>
                <Paragraph>
                  Het gebruik van{' '}
                  {gebruik?.module?.naam || 'de geselecteerde applicatie'}
                  {gebruikType === 'eigen-organisatie'
                    ? ` door uw organisatie`
                    : ` door ${
                        gebruik?.afnemer?.naam || 'de geselecteerde organisatie'
                      }`}{' '}
                  is opgeslagen in de softwarecatalogus.
                </Paragraph>
                <Paragraph style={{ fontSize: '0.9rem', color: '#666' }}>
                  Type registratie:{' '}
                  {gebruikType === 'eigen-organisatie'
                    ? 'Gebruik voor eigen organisatie'
                    : 'Gebruik voor andere organisatie (klant)'}
                </Paragraph>
              </Alert>

              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <ul className='utrecht-unordered-list'>
                  {gebruikType === 'eigen-organisatie' ? (
                    <>
                      <li>Het gebruik wordt zichtbaar in de softwarecatalogus</li>
                      <li>
                        Andere organisaties kunnen zien welke applicaties u gebruikt
                      </li>
                      <li>
                        Dit helpt bij het delen van ervaringen en best practices
                      </li>
                      <li>U kunt het gebruik beheren via het beheer dashboard</li>
                    </>
                  ) : (
                    <>
                      <li>
                        De klantorganisatie wordt geïnformeerd over deze registratie
                      </li>
                      <li>
                        De klant moet het gebruik goedkeuren voordat het definitief
                        wordt
                      </li>
                      <li>
                        Na goedkeuring wordt het gebruik zichtbaar in de catalogus
                      </li>
                      <li>U kunt het gebruik beheren via het beheer dashboard</li>
                    </>
                  )}
                  <li>Eventuele wijzigingen kunnen later worden aangebracht</li>
                </ul>
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
                  buttonType='secondary'
                  icon={<VISUALS.CLIPBOARD_CHECK />}
                  onClick={() => {
                    setRegisterCallBack(null);
                    setCurrentStep(0);
                    setGebruik({
                      id: '',
                      status: 'Verwerving',
                      contactpersoon: '',
                      afnemer: null,
                      product: null,
                      module: '',
                      moduleVersie: '',
                      gebruiktVoorReferentiecomponenten: [],
                      deelnemers: [],
                      koppelingen: [],
                      diensten: [],
                      startDatumVerwerving: '',
                      startDatumGepland: '',
                      startDatumInProductie: '',
                      startDatumUitTeFaseren: '',
                      startDatumUitGefaseerd: '',
                    });
                    setGebruikType(getGebruikTypeFromUrl());
                    setError({ message: null, errors: null });
                  }}
                >
                  Nieuw gebruik registreren
                </AcButton>
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
        message={`Je staat op het punt om de gebruik ${wizardType} wizard te verlaten om een applicatie aan te maken. Na het aanmaken van de applicatie word je teruggeleid naar dit formulier. Al je huidige wijzigingen zullen niet worden opgeslagen.`}
        confirmLabel='Verlaten'
        cancelLabel='Blijven'
        confirmIcon={<VISUALS.ARROW_RIGHT />}
        cancelIcon={<VISUALS.ARROW_LEFT />}
      />
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsGebruik)));
