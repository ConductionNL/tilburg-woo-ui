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
import ConGebruikStepReferentiecomponenten from './components/con-gebruik-step-referentiecomponenten';
import ConGebruikStepDeelnemers from './components/con-gebruik-step-deelnemers';
import ConGebruikStepReview from './components/con-gebruik-step-review';
import ConGebruikStepAanbieder from './components/con-gebruik-step-aanbieder';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { VISUALS } from '@src/constants';
import { useDebouncedInput } from '@src/hooks';
import { getActiveWizard } from '@src/constants/wizards.constants';
import { getStatusMultiStep } from '@views/ac-forms/ac-forms-applicatie/utils/steps.utils';
import { commongroundApiUrl } from '@config';
import _ from 'lodash';
import { ConDebugViewer } from '@src/components';
// Commented out - modal no longer used
// import ConUnsavedChangesAlertModal from '@src/components/con-unsaved-changes-alert-modal/con-unsaved-changes-alert-modal';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(isEditMode); // Track if we're in initial load phase for edit mode

  // Submission state management (following product wizard pattern)
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [error, setError] = useState({ message: null, errors: null });

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);
  // Ref to track previous module value to detect changes
  const previousModuleRef = useRef(null);

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
        // Check relations if module is just an ID string
        module: (() => {
          const moduleRef = api.module || api?.['@self']?.relations?.module;
          if (!moduleRef) return null;
          // If it's already a string ID, return it directly
          if (typeof moduleRef === 'string') return moduleRef;
          // If it's an object, extract the ID
          return getIdString(moduleRef) || null;
        })(),
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
        interneAantekening: api.interneAantekening || '',
        cloudDienstverleningsmodel: api.cloudDienstverleningsmodel || '',
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

  // Determine gebruikType from URL type parameter
  // When type=ontbrekend-organisatie, it means the user doesn't have an organization, so it's andere-organisatie
  const getGebruikTypeFromUrl = useCallback(() => {
    if (typeFromUrl === 'ontbrekend-organisatie') {
      return 'andere-organisatie';
    }
    // If no type specified, default to null (will be determined from afnemer in edit mode or set by user selection)
    return null;
  }, [typeFromUrl]);

  // Check if we need to show the aanbieder step (when type is ontbrekend-organisatie)
  const needsAanbiederStep = typeFromUrl === 'ontbrekend-organisatie';

  // State for the full organization data (needed to get the type)
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);

  // Fetch full organization data to get the type and deelnemers
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
            '_extend[]': ['@self.schema', 'deelnemers'],
          }
        );

        const fullOrgData = store.object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );

        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);

          // Process deelnemers into options if organization is Samenwerking or Community
          const orgType = fullOrgData?.type || '';
          if (orgType === 'Samenwerking' || orgType === 'Community') {
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
      } finally {
        setDeelnemersLoading(false);
      }
    };

    fetchFullOrganisationData();
  }, [store?.user?.activeOrganization?.uuid, store?.user?.activeOrganization?.id]);

  // Check if we need to show the deelnemers step (when organization type is Samenwerking or Community)
  const organizationType = fullActiveOrganisation?.type || '';
  const needsDeelnemersStep =
    organizationType === 'Samenwerking' || organizationType === 'Community';

  // Usage type selection state - determined from URL or from API data in edit mode
  const [gebruikType, setGebruikType] = useState(getGebruikTypeFromUrl()); // 'eigen-organisatie' or 'andere-organisatie'

  /**
   * Helper function to get the correct step index accounting for optional steps
   * Accounts for the optional Aanbieder step (only shown for ontbrekend-organisatie)
   * Accounts for the optional Deelnemers step (only shown for Samenwerking/Community)
   * @param {number} logicalStep - The logical step number
   * When Deelnemers is NOT shown:
   *   Logical steps: -1=Aanbieder (optional), 0=Applicatie, 1=Informatie, 2=Versie, 3=Referentiecomponenten, 4=Controleren
   * When Deelnemers IS shown:
   *   Logical steps: -1=Aanbieder (optional), 0=Applicatie, 1=Informatie, 2=Versie, 3=Referentiecomponenten, 4=Deelnemers, 5=Controleren
   * @returns {number} The adjusted physical step index
   */
  const getAdjustedStepIndex = useCallback(
    (logicalStep) => {
      let index = logicalStep;

      // If Aanbieder step is shown, add 1 to all logical steps >= 0
      if (needsAanbiederStep && logicalStep >= 0) {
        index += 1;
      }

      // Note: Deelnemers step doesn't require adjustment here because it's inserted
      // at logical step 4 and the physical steps naturally follow

      return index;
    },
    [needsAanbiederStep]
  );

  /**
   * Convert physical step index to logical step number
   * Accounts for optional Aanbieder step and optional Deelnemers step
   * @param {number} physicalStep - The physical step index
   * @returns {number} The logical step number (-1 for Aanbieder, 0+ for others)
   */
  const getLogicalStepFromPhysical = useCallback(
    (physicalStep) => {
      // If Aanbieder step is shown, physical step 0 is Aanbieder (logical -1)
      if (needsAanbiederStep && physicalStep === 0) {
        return -1;
      }

      // Adjust for Aanbieder step if present
      const adjustedStep = needsAanbiederStep ? physicalStep - 1 : physicalStep;

      // The logical step is the same as adjusted step
      // Deelnemers (if shown) is logical step 4, Controleren is logical step 4 or 5
      return adjustedStep;
    },
    [needsAanbiederStep]
  );

  /**
   * Generate a mapping of visual step indices to actual step indices
   * This must match the order in which ProcessSteps renders clickable elements
   * @returns {number[]} Array where index is visual position, value is actual step index
   */
  const generateStepIndexMapping = useCallback(() => {
    const mapping = [];

    // Conditionally include Aanbieder step (only for ontbrekend-organisatie)
    if (needsAanbiederStep) {
      // Aanbieder step (logical step -1, physical step 0)
      mapping.push(0);
    }

    // Main step 1 header (Applicatie selectie) - no sub-steps
    mapping.push(getAdjustedStepIndex(0));

    // Main step 2 header (Gebruik configuratie)
    mapping.push(getAdjustedStepIndex(1));
    // Sub-steps under Gebruik configuratie
    mapping.push(getAdjustedStepIndex(1)); // Gebruik informatie
    mapping.push(getAdjustedStepIndex(2)); // Applicatie versie
    mapping.push(getAdjustedStepIndex(3)); // Referentiecomponenten

    // Conditionally include Deelnemers step (only for Samenwerking/Community)
    if (needsDeelnemersStep) {
      mapping.push(getAdjustedStepIndex(4)); // Deelnemers
    }

    // Main step 3: Controleren (logical step 5 if Deelnemers shown, 4 otherwise)
    const controlerenLogicalStep = needsDeelnemersStep ? 5 : 4;
    mapping.push(getAdjustedStepIndex(controlerenLogicalStep));

    return mapping;
  }, [getAdjustedStepIndex, needsAanbiederStep, needsDeelnemersStep]);

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
    needsDeelnemersStep,
  ]);

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

  // Deelnemers (organisaties) options - for andere organisatie flow
  const [organisatieOptions, setOrganisatieOptions] = useState([]);
  // Deelnemers options - for Samenwerking/Community organizations
  const [deelnemerOptions, setDeelnemerOptions] = useState([]);
  const [deelnemersLoading, setDeelnemersLoading] = useState(false);
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

  const [selectedReferentieComponenten, setSelectedReferentieComponenten] = useState(
    []
  );

  // Contactpersonen (filtered by organization for eigen-organisatie)
  const [contactpersoonOptions, setContactpersoonOptions] = useState([]);
  const [contactpersoonLoading, setContactpersoonLoading] = useState(false);

  // Flow management state
  const [applicatieKeuze, setApplicatieKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [leverancierKeuze, setLeverancierKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'
  const [afnemerKeuze, setAfnemerKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw' - for ontbrekend-organisatie type

  // New applicatie state object for non-existing application flow
  const [nieuweApplicatie, setNieuweApplicatie] = useState({
    naam: '',
    website: '',
    beschrijvingKort: '',
    leverancier: null,
    moduleVersies: [
      {
        versie: '1.0.0',
        status: 'in gebruik',
      },
    ],
    cloudDienstverleningsmodel: [],
  });

  // Single source of truth updater for nieuweApplicatie
  const setNieuweApplicatieData = (key, value) =>
    setNieuweApplicatie((prev) => ({ ...prev, [key]: value }));

  // Afnemer Organization State Object - for andere-organisatie gebruik
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

  // Update function for leverancier organization data
  const setAfnemerOrganisatieData = useCallback((key, value) => {
    setAfnemerOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Leverancier Organization State Object - for nieuwe-applicatie
  const [leverancierOrganisatie, setLeverancierOrganisatie] = useState({
    naam: '',
    type: 'Leverancier',
    website: '',
  });

  // Update function for leverancier organization data
  const setLeverancierOrganisatieData = useCallback((key, value) => {
    setLeverancierOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Leverancier options state
  const [leverancierOptions, setLeverancierOptions] = useState([]);
  const [leverancierLoading, setLeverancierLoading] = useState(false);
  // Afnemer options state
  const [afnemerOptions, setAfnemerOptions] = useState([]);
  const [afnemerLoading, setAfnemerLoading] = useState(false);

  // Selected applicatie data (for existing flow - to get hosting and referentieComponenten)
  const [selectedApplicatieData, setSelectedApplicatieData] = useState(null);

  // Enhanced leverancier options that includes manually created aanbieder as first option
  const enhancedLeverancierOptions = useMemo(() => {
    const options = [...leverancierOptions];

    // If there's a manually created aanbieder (from Aanbieder step), add it as first option
    if (
      needsAanbiederStep &&
      afnemerKeuze === 'nieuw' &&
      afnemerOrganisatie?.naam &&
      String(afnemerOrganisatie.naam).trim()
    ) {
      const aanbiederOption = {
        value: `__manually_created_aanbieder__${afnemerOrganisatie.naam}`,
        label: afnemerOrganisatie.naam,
        data: {
          ...afnemerOrganisatie,
          _isManuallyCreatedAanbieder: true,
        },
        _isManuallyCreatedAanbieder: true,
      };

      // Remove it if it already exists (to avoid duplicates)
      const filteredOptions = options.filter(
        (opt) => !opt._isManuallyCreatedAanbieder
      );

      // Add as first option
      return [aanbiederOption, ...filteredOptions];
    }

    return options;
  }, [leverancierOptions, needsAanbiederStep, afnemerKeuze, afnemerOrganisatie]);

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
            {
              status: 'Verwerving',
              startDatumVerwerving: new Date().toISOString().split('T')[0],
            }
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

        // Fetch module schema for applicatie form
        let moduleSchema = null;
        try {
          await store.object.fetchSchema('module');
          moduleSchema = store.object.getSchema('schema_module');
        } catch (moduleError) {
          console.error('Failed to fetch module schema:', moduleError);
        }

        // Fetch moduleversie schema for versie form
        let moduleversieSchema = null;
        try {
          await store.object.fetchSchema('moduleversie');
          moduleversieSchema = store.object.getSchema('schema_moduleversie');
        } catch (moduleversieError) {
          console.error('Failed to fetch moduleversie schema:', moduleversieError);
        }

        setSchemas({
          gebruik: gebruikSchema,
          organisatie: organisatieSchema,
          module: moduleSchema,
          moduleversie: moduleversieSchema,
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
        // Initialize previous module ref to prevent clearing hosting on initial load
        previousModuleRef.current = mapped.module;
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
  }, [isEditMode, gebruikId, mapFetchedGebruikToLocalState, store, getIdString]);

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
            '_extend[]': ['@self.schema', 'moduleVersies'],
            _published: 'false',
            _source: 'index', // Use index to get applications from all tenants
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
        // Merge with existing options to preserve modules added by edit mode fetch
        setModulesOptions((prev) => {
          const existingMap = new Map(prev.map((opt) => [opt.value, opt]));
          // Add new options, preferring existing ones if they exist
          options.forEach((opt) => {
            if (!existingMap.has(opt.value)) {
              existingMap.set(opt.value, opt);
            }
          });
          return Array.from(existingMap.values());
        });
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
                '_extend[]': ['@self.schema', 'moduleVersies'],
                _published: 'false',
                _source: 'index', // Use index to get applications from all tenants
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
          '_extend[]': ['@self.schema', 'moduleVersies'],
          _published: 'false',
          _source: 'index', // Use index to get applications from all tenants
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

  // Server-side search for leveranciers (similar to searchOrganisaties)
  const searchOrganisaties = useCallback(
    async (query, setOptions, setLoading) => {
      try {
        setLoading(true);
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
            `Leverancier ${index + 1}`;
          // Use same pattern as mapToOption function - @self.id first, then fallbacks
          const value = item?.['@self']?.id || item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        });
        setOptions(options);
      } catch (e) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [store]
  );

  // Trigger initial leverancier search when switching to 'nieuw' applicatie flow
  useEffect(() => {
    if (applicatieKeuze === 'nieuw') {
      // Load initial leveranciers when switching to nieuwe applicatie mode
      searchOrganisaties('', setLeverancierOptions, setLeverancierLoading);
    }
  }, [applicatieKeuze, searchOrganisaties]);

  // Trigger initial afnemer search when switching to 'nieuw' afnemer flow (for ontbrekend-organisatie)
  useEffect(() => {
    if (needsAanbiederStep) {
      // Load initial afnemers when switching to nieuwe afnemer mode
      searchOrganisaties('', setAfnemerOptions, setAfnemerLoading);
    }
  }, [needsAanbiederStep]);

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
  const debouncedSearchAfnemers = useDebouncedInput(
    (query) => searchOrganisaties(query, setAfnemerOptions, setAfnemerLoading),
    500,
    {
      disableInstantValidation: true,
    }
  );
  const debouncedSearchLeveranciers = useDebouncedInput(
    (query) =>
      searchOrganisaties(query, setLeverancierOptions, setLeverancierLoading),
    500,
    {
      disableInstantValidation: true,
    }
  );
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
    loadReferentieComponenten();
  }, []);

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
      const currentModuleId = getIdString(mod);
      const previousModuleId = getIdString(previousModuleRef.current);

      // Clear hosting when module changes from one value to another (not during initial load in edit mode)
      if (
        previousModuleId &&
        currentModuleId &&
        previousModuleId !== currentModuleId &&
        !(isEditMode && isInitialLoad)
      ) {
        setGebruikData('cloudDienstverleningsmodel', '');
      }

      if (!mod) {
        setSelectedApplicatieData(null);
        previousModuleRef.current = null;
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
            '_extend[]': ['@self.schema', '@self.relations', 'moduleVersies'],
            _published: 'false',
            _source: 'index', // Use index to get applications from all tenants
          });
          if (cancelled) return;
          modData = store.object.getObject('voorzieningen_module', String(mod));
        } catch (e) {
          return;
        }
      }

      // Store full applicatie data for hosting and referentieComponenten filtering
      if (modData && !cancelled) {
        setSelectedApplicatieData(modData);
        previousModuleRef.current = mod;
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    gebruik?.module,
    modulesOptions,
    store,
    isEditMode,
    isInitialLoad,
    getIdString,
  ]);

  // Add module to options when it becomes available (for edit mode)
  useEffect(() => {
    if (!isEditMode || !gebruik?.module) return;

    const moduleId = getIdString(gebruik.module);
    if (!moduleId) return;

    // Already in options? Skip
    const alreadyInOptions = modulesOptions.some(
      (opt) => String(opt.value) === String(moduleId)
    );
    if (alreadyInOptions) return;

    // Try to find module from various sources
    let moduleData = null;

    // Check selectedApplicatieData (set by module resolution useEffect)
    if (
      selectedApplicatieData &&
      String(getIdString(selectedApplicatieData)) === String(moduleId)
    ) {
      moduleData = selectedApplicatieData;
    }

    // Check collection
    if (!moduleData) {
      const collection = store.object.getCollection(
        'voorzieningen_module_gebruik_form'
      );
      const list = collection?.results || collection || [];
      moduleData = list.find(
        (item) => String(getIdString(item)) === String(moduleId)
      );
    }

    // Check store (module might have been fetched by the resolution useEffect)
    if (!moduleData) {
      moduleData = store.object.getObject('voorzieningen_module', String(moduleId));
    }

    // Add to options if found
    if (moduleData) {
      const option = mapToOption(moduleData, 0);
      setModulesOptions((prev) => {
        const exists = prev.some((o) => String(o.value) === String(option.value));
        return exists ? prev : [...prev, option];
      });
    }
  }, [
    isEditMode,
    gebruik?.module,
    modulesOptions,
    selectedApplicatieData,
    store,
    getIdString,
  ]);

  // When selected module object changes, derive versions from module.moduleVersies (no external API)
  // Use moduleVersies property from selectedApplicatieData
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

    // Wait for selectedApplicatieData to be available
    if (!selectedApplicatieData) {
      setVersionsLoading(true);
      return;
    }

    const versiesArray =
      selectedApplicatieData.moduleVersies ||
      selectedApplicatieData.moduleversies ||
      [];

    if (!Array.isArray(versiesArray) || versiesArray.length === 0) {
      setVersionsLoading(false);
      setVersionOptions([]);
      // Don't clear moduleVersie in edit mode during initial load
      if (gebruik?.moduleVersie != null && !(isEditMode && isInitialLoad)) {
        setGebruikData('moduleVersie', null);
      }
      return;
    }

    // Map moduleVersies to options format
    // Filter out items without IDs and use ID as value
    const options = versiesArray
      .filter((v) => v?.id) // Filter out items without IDs
      .map((v, idx) => {
        const label = v?.versie || v?.version || v?.nummer || `Versie ${idx + 1}`;
        // Use ID as value since moduleVersies now have IDs
        const value = v?.id;
        return { value: String(value), label: String(label), data: v };
      });

    setVersionOptions(options);
    setVersionsLoading(false);

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
  }, [
    gebruik?.module,
    selectedApplicatieData,
    isEditMode,
    isInitialLoad,
    getIdString,
  ]);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  // Submission handler (following product wizard pattern)
  const handleRegister = async () => {
    setLoading(true);
    try {
      let finalModule = gebruik?.module;
      let createdVersieId = null;
      let finalLeverancier = null;
      let finalAfnemer = gebruik?.afnemer;

      // ✅ For ontbrekend-organisatie flow, create afnemer organization first if needed
      if (needsAanbiederStep && afnemerKeuze === 'nieuw') {
        try {
          const newAfnemerData = {
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

          const createdAfnemer = await store.object.createObject(
            'voorzieningen',
            'organisatie',
            newAfnemerData
          );

          finalAfnemer = createdAfnemer?.id || createdAfnemer?.['@self']?.id;

          if (!finalAfnemer) {
            throw new Error('Aanbieder aangemaakt maar geen ID ontvangen');
          }
        } catch (afnemerError) {
          console.error('Failed to create aanbieder:', afnemerError);
          setRegisterCallBack('error');
          setError({
            message:
              'Er is een fout opgetreden bij het aanmaken van de aanbieder. Probeer het later opnieuw.',
            errors: null,
          });
          setLoading(false);
          return;
        }
      }

      // ✅ For nieuwe applicatie flow, create leverancier and applicatie first
      if (applicatieKeuze === 'nieuw') {
        try {
          // Check if manually created aanbieder was selected as leverancier
          if (
            nieuweApplicatie.leverancier &&
            typeof nieuweApplicatie.leverancier === 'string' &&
            nieuweApplicatie.leverancier.startsWith(
              '__manually_created_aanbieder__'
            ) &&
            finalAfnemer
          ) {
            // If manually created aanbieder was selected as leverancier,
            // use the created aanbieder as leverancier
            finalLeverancier = finalAfnemer;
          } else {
            finalLeverancier = nieuweApplicatie.leverancier;

            // Create leverancier organization first (if new)
            if (leverancierKeuze === 'nieuw') {
              const newLeverancierData = {
                naam: leverancierOrganisatie.naam,
                type: leverancierOrganisatie.type,
                website: leverancierOrganisatie.website,
                beschrijvingKort: leverancierOrganisatie.beschrijvingKort,
                beschrijvingLang: leverancierOrganisatie.beschrijvingLang,
                'e-mailadres': leverancierOrganisatie['e-mailadres'],
                telefoonnummer: leverancierOrganisatie.telefoonnummer,
                kvkNummer: leverancierOrganisatie.kvkNummer,
                logo: leverancierOrganisatie.logo,
              };

              const createdLeverancier = await store.object.createObject(
                'voorzieningen',
                'organisatie',
                newLeverancierData
              );

              finalLeverancier =
                createdLeverancier?.id || createdLeverancier?.['@self']?.id;

              if (!finalLeverancier) {
                throw new Error('Leverancier aangemaakt maar geen ID ontvangen');
              }
            }

            // Extract leverancier ID if it's an object
            if (finalLeverancier && typeof finalLeverancier !== 'string') {
              finalLeverancier =
                finalLeverancier.uuid ||
                finalLeverancier.id ||
                finalLeverancier.value;
            }
          }

          // Create new applicatie with versies
          const applicatieData = {
            naam: nieuweApplicatie.naam,
            website: nieuweApplicatie.website,
            beschrijvingKort: nieuweApplicatie.beschrijvingKort,
            aanbieder: finalLeverancier,
            cloudDienstverleningsmodel:
              nieuweApplicatie.cloudDienstverleningsmodel || [],
          };

          const createdApplicatie = await store.object.createObject(
            'voorzieningen',
            'module',
            applicatieData
          );

          finalModule = createdApplicatie?.id || createdApplicatie?.['@self']?.id;

          if (!finalModule) {
            throw new Error('Applicatie aangemaakt maar geen ID ontvangen');
          }

          // Create versie for the new applicatie (only one versie allowed)
          if (
            Array.isArray(nieuweApplicatie.moduleVersies) &&
            nieuweApplicatie.moduleVersies.length > 0
          ) {
            const versie = nieuweApplicatie.moduleVersies[0];
            if (versie.versie) {
              const createdVersie = await store.object.createObject(
                'voorzieningen',
                'moduleversie',
                {
                  module: finalModule,
                  versie: versie.versie,
                  status: versie.status || 'Actief',
                }
              );
              // Extract the versie ID from the created object
              createdVersieId =
                createdVersie?.id ||
                createdVersie?.['@self']?.id ||
                getIdString(createdVersie) ||
                null;
            }
          }
        } catch (appError) {
          console.error('Failed to create applicatie:', appError);
          setRegisterCallBack('error');
          setError({
            message:
              'Er is een fout opgetreden bij het aanmaken van de applicatie. Probeer het opnieuw.',
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
        afnemer: finalAfnemer || gebruik?.afnemer,
        module: finalModule || gebruik?.module,
        // For nieuwe applicatie flow, use the created versie ID; otherwise use existing moduleVersie
        moduleVersie:
          applicatieKeuze === 'nieuw' && createdVersieId
            ? createdVersieId
            : gebruik?.moduleVersie,
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
    const base = [];
    if (needsAanbiederStep) base.push('Aanbieder');
    base.push('Applicatie', 'Gebruiksinformatie', 'Referentiecomponenten');
    if (needsDeelnemersStep) base.push('Deelnemers');
    base.push('Controleren');
    return base;
  })();

  const currentStepName = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case -1:
        return 'Afnemer';
      case 0:
        return applicatieKeuze === 'bestaand'
          ? 'Toevoegen applicatie'
          : 'Publiceren applicatie';
      case 1:
        return 'Gebruiksinformatie';
      case 2:
        return 'Referentiecomponenten';
      case 3:
        // If Deelnemers step is shown, logical step 3 is Deelnemers
        // Otherwise, logical step 3 is Controleren
        return needsDeelnemersStep ? 'Deelnemers' : 'Controleren';
      case 4:
        return 'Controleren';
      default:
        return stepsList[step] || '';
    }
  };

  const canGoNext = () => {
    const logicalStep = getLogicalStepFromPhysical(currentStep);

    if (logicalStep === -1) {
      // Aanbieder step - validate based on afnemerKeuze
      if (afnemerKeuze === 'bestaand') {
        return !!gebruik?.afnemer; // Existing: afnemer must be selected
      } else {
        // New: validate required fields
        const requiredFields = ['naam', 'type', 'website'];
        const missingFields = requiredFields.filter(
          (field) =>
            !afnemerOrganisatie[field] || !String(afnemerOrganisatie[field]).trim()
        );
        if (missingFields.length > 0) return false;

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

        return true;
      }
    }
    if (logicalStep === 0) {
      // Applicatie step - validate based on applicatieKeuze
      if (applicatieKeuze === 'bestaand') {
        return !!gebruik?.module; // Existing: module must be selected
      } else {
        // New: validate leverancier and applicatie fields
        if (leverancierKeuze === 'bestaand') {
          // Existing leverancier: must be selected
          if (!nieuweApplicatie.leverancier) return false;
        } else {
          // New leverancier: validate required fields
          const requiredLeverancierFields = ['naam', 'type', 'website'];
          const missingLeverancierFields = requiredLeverancierFields.filter(
            (field) =>
              !leverancierOrganisatie[field] ||
              !String(leverancierOrganisatie[field]).trim()
          );
          if (missingLeverancierFields.length > 0) return false;

          // Validate website format if provided
          if (
            leverancierOrganisatie.website &&
            String(leverancierOrganisatie.website).trim()
          ) {
            const website = String(leverancierOrganisatie.website).trim();
            if (!validateWebsite(website)) {
              return false;
            }
          }
        }

        // Validate applicatie required fields
        if (!nieuweApplicatie.naam || !String(nieuweApplicatie.naam).trim())
          return false;
        if (!nieuweApplicatie.website || !String(nieuweApplicatie.website).trim())
          return false;

        // Validate website format
        if (nieuweApplicatie.website && String(nieuweApplicatie.website).trim()) {
          const website = String(nieuweApplicatie.website).trim();
          if (!validateWebsite(website)) {
            return false;
          }
        }

        return true;
      }
    }
    if (logicalStep === 1) {
      // Gebruik informatie step - status required
      return !!gebruik?.status;
    }
    if (logicalStep === 2) {
      return true; // Referentiecomponenten optional
    }
    if (logicalStep === 3) {
      // If Deelnemers step is shown, this is the Deelnemers step (optional)
      // Otherwise, this is the Controleren step
      return true;
    }
    if (logicalStep === 4) {
      return true; // Controleren step (when Deelnemers is shown)
    }
    return false;
  };

  const renderStep = (step) => {
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case -1:
        return (
          <ConGebruikStepAanbieder
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            afnemerOrganisatie={afnemerOrganisatie}
            setAfnemerOrganisatieData={setAfnemerOrganisatieData}
            loading={loading}
            schemas={schemas}
            afnemerKeuze={afnemerKeuze}
            afnemerOptions={afnemerOptions}
            afnemerLoading={afnemerLoading}
            searchAfnemers={debouncedSearchAfnemers}
          />
        );
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
            applicatieKeuze={applicatieKeuze}
            nieuweApplicatie={nieuweApplicatie}
            setNieuweApplicatieData={setNieuweApplicatieData}
            leverancierKeuze={leverancierKeuze}
            setLeverancierKeuze={setLeverancierKeuze}
            leverancierOrganisatie={leverancierOrganisatie}
            setLeverancierOrganisatieData={setLeverancierOrganisatieData}
            leverancierOptions={enhancedLeverancierOptions}
            leverancierLoading={leverancierLoading}
            searchLeveranciers={debouncedSearchLeveranciers}
            loading={loading}
          />
        );
      case 1:
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
            applicatieKeuze={applicatieKeuze}
            selectedApplicatieData={selectedApplicatieData}
            setNieuweApplicatieData={setNieuweApplicatieData}
            isEditMode={isEditMode}
            versionOptions={versionOptions}
            versionsLoading={versionsLoading}
            nieuweApplicatie={nieuweApplicatie}
          />
        );
      case 2:
        return (
          <ConGebruikStepReferentiecomponenten
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            referentieComponentenOptions={referentieComponentenOptions}
            setSelectedReferentieComponenten={setSelectedReferentieComponenten}
            loading={loading}
            referentieComponentenLoading={referentieComponentenLoading}
            applicatieKeuze={applicatieKeuze}
            selectedApplicatieData={selectedApplicatieData}
          />
        );
      case 3:
        // If Deelnemers step is shown, render it; otherwise fall through to review
        if (needsDeelnemersStep) {
          return (
            <ConGebruikStepDeelnemers
              gebruik={gebruik}
              setGebruikData={setGebruikData}
              loading={loading}
              deelnemerOptions={deelnemerOptions}
              deelnemersLoading={deelnemersLoading}
            />
          );
        }
        // Fall through to review if Deelnemers step is not shown
        return (
          <ConGebruikStepReview
            gebruik={gebruik}
            versionOptions={versionOptions}
            refCompOptions={refCompOptions}
            organisatieOptions={organisatieOptions}
            moduleOptions={modulesOptions}
            selectedReferentieComponenten={selectedReferentieComponenten}
            applicatieKeuze={applicatieKeuze}
            leverancierKeuze={leverancierKeuze}
            afnemerKeuze={afnemerKeuze}
            nieuweApplicatie={nieuweApplicatie}
            leverancierOrganisatie={leverancierOrganisatie}
            afnemerOrganisatie={afnemerOrganisatie}
            leverancierOptions={leverancierOptions}
            afnemerOptions={afnemerOptions}
            selectedApplicatieData={selectedApplicatieData}
            deelnemerOptions={deelnemerOptions}
          />
        );
      case 4:
      default:
        return (
          <ConGebruikStepReview
            gebruik={gebruik}
            versionOptions={versionOptions}
            refCompOptions={refCompOptions}
            organisatieOptions={organisatieOptions}
            moduleOptions={modulesOptions}
            selectedReferentieComponenten={selectedReferentieComponenten}
            applicatieKeuze={applicatieKeuze}
            leverancierKeuze={leverancierKeuze}
            afnemerKeuze={afnemerKeuze}
            nieuweApplicatie={nieuweApplicatie}
            leverancierOrganisatie={leverancierOrganisatie}
            afnemerOrganisatie={afnemerOrganisatie}
            leverancierOptions={leverancierOptions}
            afnemerOptions={afnemerOptions}
            selectedApplicatieData={selectedApplicatieData}
            deelnemerOptions={deelnemerOptions}
          />
        );
    }
  };

  const { icon: Icon, schema: wizardSchema } = useMemo(
    () => getActiveWizard() || {},
    [gebruikType]
  );
  const capitalizedSchema = _.capitalize(wizardSchema);
  const editModeTitle = `${capitalizedSchema} updaten`;

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
                  {isEditMode
                    ? editModeTitle
                    : applicatieKeuze === 'bestaand'
                    ? 'Een applicatie toevoegen'
                    : 'Een nieuwe applicatie toevoegen'}
                </Heading1>
                <Paragraph>
                  {applicatieKeuze === 'bestaand'
                    ? 'Vul dit formulier in om de applicatie toe te voegen aan uw applicatielandschap'
                    : 'Vul dit formulier in om applicaties op te voeren die nog niet bestaan in de softwarecatalogus, maar u wel in gebruik heeft. Dit waren voorheen de “externe pakketten”'}
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
                        // Conditionally include Aanbieder step (only for ontbrekend-organisatie)
                        ...(needsAanbiederStep
                          ? [
                              {
                                id: 'aanbieder-step',
                                marker: 1,
                                status: getStatus(currentStep, 0),
                                title: 'Aanbieder',
                              },
                            ]
                          : []),
                        {
                          id: 'applicatie-selectie-step',
                          marker: needsAanbiederStep ? 2 : 1,
                          status: getStatus(currentStep, getAdjustedStepIndex(0)),
                          title: 'Applicatie',
                        },
                        {
                          id: 'gebruik-configuratie-step',
                          marker: needsAanbiederStep ? 3 : 2,
                          status: getStatusMultiStep(
                            currentStep,
                            getAdjustedStepIndex(1),
                            getAdjustedStepIndex(1),
                            needsDeelnemersStep
                              ? getAdjustedStepIndex(4)
                              : getAdjustedStepIndex(3)
                          ),
                          title: 'Gebruik configuratie',
                          steps: [
                            {
                              id: 'informatie-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(1)
                              ),
                              title: 'Gebruik informatie',
                            },
                            {
                              id: 'versie-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(2)
                              ),
                              title: 'Versie',
                            },
                            {
                              id: 'referentiecomponenten-substep',
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(3)
                              ),
                              title: 'Referentiecomponenten',
                            },
                            // Conditionally include Deelnemers sub-step (only for Samenwerking/Community)
                            ...(needsDeelnemersStep
                              ? [
                                  {
                                    id: 'deelnemers-substep',
                                    status: getStatus(
                                      currentStep,
                                      getAdjustedStepIndex(4)
                                    ),
                                    title: 'Deelnemers',
                                  },
                                ]
                              : []),
                          ],
                        },
                        {
                          id: 'controleren-step',
                          marker: (() => {
                            let marker = 3;
                            if (needsAanbiederStep) marker += 1;
                            return marker;
                          })(),
                          status: getStatus(
                            currentStep,
                            getAdjustedStepIndex(needsDeelnemersStep ? 5 : 4)
                          ),
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

                    <ConDebugViewer data={gebruik} title='Gebruik Object' />

                    {afnemerKeuze === 'nieuw' && (
                      <ConDebugViewer
                        data={afnemerOrganisatie}
                        title='Afnemer Organisatie Object'
                      />
                    )}
                    {leverancierKeuze === 'nieuw' && (
                      <ConDebugViewer
                        data={leverancierOrganisatie}
                        title='Leverancier Organisatie Object'
                      />
                    )}
                    {applicatieKeuze === 'nieuw' && (
                      <ConDebugViewer
                        data={nieuweApplicatie}
                        title='Nieuwe Applicatie Object'
                      />
                    )}

                    {renderStep(currentStep)}

                    <AcFlex
                      justifyContent='between'
                      className={clsx(
                        'ac-register-form-buttons',
                        currentStep !== 0 &&
                          'ac-register-form-buttons-not-first-step'
                      )}
                    >
                      <AcFlex spacing='xs' style={{ width: 'fit-content' }}>
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

                        {/* Show "Ik kan de gewenste aanbieder niet vinden" button only on Aanbieder step */}
                        {getLogicalStepFromPhysical(currentStep) === -1 &&
                          afnemerKeuze === 'bestaand' && (
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={<VISUALS.BUILDING />}
                              onClick={() => setAfnemerKeuze('nieuw')}
                            >
                              Ik kan de gewenste aanbieder niet vinden
                            </AcButton>
                          )}

                        {/* Show "Bestaande aanbieder selecteren" button only on Aanbieder step when creating new */}
                        {getLogicalStepFromPhysical(currentStep) === -1 &&
                          afnemerKeuze === 'nieuw' && (
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={<VISUALS.ARROW_LEFT />}
                              onClick={() => setAfnemerKeuze('bestaand')}
                            >
                              Bestaande aanbieder selecteren
                            </AcButton>
                          )}

                        {/* Show this button when aanBieder step is NOT shown, so that its on the left */}
                        {getLogicalStepFromPhysical(currentStep) === 0 &&
                          applicatieKeuze === 'bestaand' && (
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={<VISUALS.CUBE />}
                              onClick={() => setApplicatieKeuze('nieuw')}
                            >
                              Ik kan de gewenste applicatie niet vinden
                            </AcButton>
                          )}

                        {/* Show this button when aanBieder step is NOT shown, so that its on the left */}
                        {getLogicalStepFromPhysical(currentStep) === 0 &&
                          applicatieKeuze === 'nieuw' && (
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={<VISUALS.ARROW_LEFT />}
                              onClick={() => {
                                setApplicatieKeuze('bestaand');
                                // Reset leverancier-related state when switching back to existing applicatie
                                setLeverancierKeuze('bestaand');
                                setLeverancierOrganisatie((prev) => {
                                  // Reset all properties of the prev object to empty strings
                                  return Object.fromEntries(
                                    Object.keys(prev).map((key) => [key, ''])
                                  );
                                });
                                setNieuweApplicatieData('leverancier', null);
                              }}
                            >
                              Bestaande applicatie selecteren
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
                        {(() => {
                          const finalLogicalStep = needsDeelnemersStep ? 4 : 3;
                          return (
                            getLogicalStepFromPhysical(currentStep) !==
                              finalLogicalStep && (
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
                            )
                          );
                        })()}
                      </AcFlex>

                      {(() => {
                        const finalLogicalStep = needsDeelnemersStep ? 4 : 3;
                        return (
                          getLogicalStepFromPhysical(currentStep) ===
                            finalLogicalStep && (
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
                              {isEditMode
                                ? 'Gebruik updaten'
                                : 'Gebruik registreren'}
                            </AcButton>
                          )
                        );
                      })()}
                    </AcFlex>
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
                      startDatumVerwerving: new Date().toISOString().split('T')[0],
                      startDatumGepland: '',
                      startDatumInProductie: '',
                      startDatumUitTeFaseren: '',
                      startDatumUitGefaseerd: '',
                    });
                    setGebruikType(getGebruikTypeFromUrl());
                    setApplicatieKeuze('bestaand');
                    setNieuweApplicatie({
                      naam: '',
                      website: '',
                      beschrijvingKort: '',
                      leverancier: null,
                      moduleVersies: [],
                      cloudDienstverleningsmodel: [],
                    });
                    setAfnemerKeuze('bestaand');
                    setAfnemerOrganisatie({
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
                    setLeverancierKeuze('bestaand');
                    setLeverancierOrganisatie({
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
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsGebruik)));
