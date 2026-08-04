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
import ConGebruikStepSelecteren from './components/con-gebruik-step-selecteren';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { VISUALS } from '@src/constants';
import { useDebouncedInput } from '@src/hooks';
import { getActiveWizard } from '@src/constants/wizards.constants';
import { commongroundApiUrl } from '@config';
import _ from 'lodash';
import { ConDebugViewer } from '@src/components';
import useStepper from '../../con-stepper';
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
  const stepper = useStepper();
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
  // @TODO: currently aanbieder step is never shown as type 'ontbrekend-organisatie' does not have aanbieders,
  // this either needs to be fixed or removed.
  const needsAanbiederStep = typeFromUrl === 'ontbrekend-organisatie';

  // Aanbod beheerders flow detection (simplified 2-step flow)
  const isAanbodBeheerdersFlow = typeFromUrl === 'ontbrekend-organisatie';

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
            '_extend[]': ['_schema', 'deelnemers'],
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

  // Helper function for step status (must be defined before processStepsConfig)
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

  // ProcessSteps configuration - must be created early to define steps with stepper
  const processStepsConfig = useMemo(() => {
    const steps = [];
    const currentStepNum = stepper.getCurrentStep();

    // Reset step definitions for this flavor
    stepper.resetStepDefinitions('process-steps');
    stepper.resetStepDefinitions('process-steps-status');

    if (isAanbodBeheerdersFlow) {
      // Aanbod beheerders flow: simplified 2-step flow
      steps.push({
        id: 'selecteren-step',
        marker: stepper.defineStep('process-steps', 'selecteren'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Selecteren',
      });

      steps.push({
        id: 'controleren-step',
        marker: stepper.defineStep('process-steps', 'controleren'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Controleren',
      });
    } else {
      // Gebruik beheerders flow
      // Conditionally include Aanbieder step (only for ontbrekend-organisatie)
      if (needsAanbiederStep) {
        steps.push({
          id: 'aanbieder-step',
          marker: stepper.defineStep('process-steps', 'aanbieder'),
          status: getStatus(
            currentStepNum,
            stepper.defineStep('process-steps-status')
          ),
          title: 'Aanbieder',
        });
      }

      steps.push({
        id: 'applicatie-selectie-step',
        marker: stepper.defineStep('process-steps', 'applicatie'),
        status: getStatus(
          currentStepNum,
          stepper.defineStep('process-steps-status')
        ),
        title: 'Applicatie',
      });

      // Gebruik configuratie step with sub-steps
      // Define the status step for the multi-step group first
      const gebruikConfigStartStatusStep = stepper.defineStep(
        'process-steps-status'
      );

      // Build sub-steps for gebruik configuratie flow (define inline, in order)
      // These are the actual navigable steps - define them BEFORE the main step marker
      const informatieMarker = stepper.defineStep('process-steps', 'informatie');
      const referentiecomponentenMarker = stepper.defineStep(
        'process-steps',
        'referentiecomponenten'
      );
      const subSteps = [
        {
          id: 'informatie-substep',
          marker: informatieMarker,
          status: getStatus(stepper.getCurrentStep(), informatieMarker),
          title: 'Gebruikinformatie',
        },
        {
          id: 'referentiecomponenten-substep',
          marker: referentiecomponentenMarker,
          status: getStatus(stepper.getCurrentStep(), referentiecomponentenMarker),
          title: 'Referentiecomponenten',
        },
      ];

      // Only add deelnemers step if organization type is Samenwerking/Community
      if (needsDeelnemersStep) {
        const deelnemersMarker = stepper.defineStep('process-steps', 'deelnemers');
        subSteps.push({
          id: 'deelnemers-substep',
          marker: deelnemersMarker,
          status: getStatus(stepper.getCurrentStep(), deelnemersMarker),
          title: 'Deelnemers',
        });
      }

      // Use the first sub-step's marker as the main step marker (for visual grouping)
      // This ensures navigation goes directly to the first sub-step, not to a non-existent "Gebruik configuratie" step
      steps.push({
        id: 'gebruik-configuratie-step',
        marker: subSteps[0].marker,
        status: getStatusMulti(
          stepper.getCurrentStep(),
          gebruikConfigStartStatusStep,
          gebruikConfigStartStatusStep + subSteps.length
        ),
        title: 'Gebruik configuratie',
        steps: subSteps,
      });

      const controlerenMarker = stepper.defineStep('process-steps', 'controleren');
      steps.push({
        id: 'controleren-step',
        marker: controlerenMarker,
        status: getStatus(currentStepNum, controlerenMarker),
        title: 'Controleren',
      });
    }

    return steps;
  }, [stepper, isAanbodBeheerdersFlow, needsAanbiederStep, needsDeelnemersStep]);

  // Add click handlers to steps
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
            e.stopPropagation();
            stepper.setCurrentStep(stepNumber);
          };
        }
      });
    };
    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [stepper.getCurrentStep(), prefillLoading, prefillError, stepper]);

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

  // Aanbod beheerders flow state
  const [selectedKlanten, setSelectedKlanten] = useState([]); // Array of klant IDs
  const [selectedKlantenOptions, setSelectedKlantenOptions] = useState([]); // Array of klant option objects
  const [klantenOptions, setKlantenOptions] = useState([]);
  const [klantenLoading, setKlantenLoading] = useState(false);
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

  // Prefill for edit mode: fetch existing gebruik and map to local state; start at step 1
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      stepper.resetCurrentStep();
      setPrefillLoading(true);
      setPrefillError(null);
      try {
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
        const apiObj = store.object.getObject(
          'voorzieningen_gebruik',
          String(gebruikId)
        );
        const mapped = mapFetchedGebruikToLocalState(apiObj);

        setGebruik(mapped);
        setGebruikType(mapped.gebruikType || null);
        // Initialize previous module ref to prevent clearing hosting on initial load
        previousModuleRef.current = mapped.module;

        // For Aanbod beheerders flow (ontbrekend-organisatie), set the afnemer as selectedKlanten
        if (typeFromUrl === 'ontbrekend-organisatie' && mapped.afnemer) {
          // afnemer could be a single ID or already an array
          const afnemerIds = Array.isArray(mapped.afnemer)
            ? mapped.afnemer
            : [mapped.afnemer];
          const filteredAfnemerIds = afnemerIds.filter(Boolean);
          setSelectedKlanten(filteredAfnemerIds);

          // Also fetch the afnemer organisation to add to klanten options so it displays correctly
          if (filteredAfnemerIds.length > 0) {
            const afnemerId = filteredAfnemerIds[0];
            try {
              await store.object.fetchObject(
                'voorzieningen',
                'organisatie',
                afnemerId,
                {
                  '_extend[]': ['_schema'],
                  _published: 'false',
                }
              );
              const afnemerData = store.object.getObject(
                'voorzieningen_organisatie',
                afnemerId
              );
              if (afnemerData) {
                const afnemerOption = {
                  value: String(
                    afnemerData?.['@self']?.id || afnemerData?.id || afnemerId
                  ),
                  label: String(
                    afnemerData?.['@self']?.name ||
                      afnemerData?.naam ||
                      afnemerData?.name ||
                      afnemerId
                  ),
                  data: afnemerData,
                };
                // Add to klanten options if not already present
                setKlantenOptions((prev) => {
                  const exists = prev.some(
                    (opt) => opt.value === afnemerOption.value
                  );
                  if (exists) return prev;
                  return [afnemerOption, ...prev];
                });
              }
            } catch (fetchError) {
              console.error('Error fetching afnemer organisation:', fetchError);
            }
          }
        }

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
          '_extend[]': '_schema',
          _published: 'false',
        });
        const collection = store.object.getCollection('vng-gemma_element');
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            item?.['@self']?.name ||
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
        const queryParams = {
          _limit: '50',
          _page: '1',
          '_extend[]': ['_schema', 'moduleVersies'],
        };

        // Filter by leverancier (aanbieder) for Aanbod beheerders flow
        if (isAanbodBeheerdersFlow) {
          const activeOrg = store?.user?.activeOrganization;
          const activeOrgId = activeOrg?.uuid || activeOrg?.id;
          if (activeOrgId) {
            queryParams.aanbieder = activeOrgId;
          }
        }

        await store.object.fetchCollection(
          'voorzieningen',
          'module',
          queryParams,
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
  }, [store, isAanbodBeheerdersFlow]);

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
            const fetchParams = {
              '_extend[]': ['_schema', 'moduleVersies'],
            };

            // Filter by leverancier (aanbieder) for Aanbod beheerders flow
            if (isAanbodBeheerdersFlow) {
              const activeOrg = store?.user?.activeOrganization;
              const activeOrgId = activeOrg?.uuid || activeOrg?.id;
              if (activeOrgId) {
                fetchParams.aanbieder = activeOrgId;
              }
            }

            await store.object.fetchObject(
              'voorzieningen',
              'module',
              String(applicatieFromUrl),
              fetchParams
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
  }, [applicatieFromUrl, modulesOptions, isEditMode, store, isAanbodBeheerdersFlow]);

  // Server-side search for modules (searches all modules)
  const searchModules = useCallback(
    async (query) => {
      try {
        setSearchLoading(true);
        const q = String(query || '').trim();

        const queryParams = {
          _limit: '50',
          _page: '1',
          '_extend[]': ['_schema', 'moduleVersies'],
        };

        // Filter by leverancier (aanbieder) for Aanbod beheerders flow
        if (isAanbodBeheerdersFlow) {
          const activeOrg = store?.user?.activeOrganization;
          const activeOrgId = activeOrg?.uuid || activeOrg?.id;
          if (activeOrgId) {
            queryParams.aanbieder = activeOrgId;
          }
        }

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
    [store, isAanbodBeheerdersFlow]
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
          '_extend[]': '_schema',
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

  // Server-side search for klanten (organisations of type Gemeente or Samenwerking)
  const searchKlanten = useCallback(
    async (query) => {
      try {
        setKlantenLoading(true);
        const q = String(query || '').trim();

        const params = {
          'type[]': ['Gemeente', 'Samenwerking'],
          _limit: '50',
          _page: '1',
          _source: 'index',
          '_extend[]': '_schema',
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

        // Merge with existing options to preserve selected items
        setKlantenOptions((prevOptions) => {
          const newOptionsMap = new Map(options.map((opt) => [opt.value, opt]));
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
        console.error('Klanten search failed:', e);
      } finally {
        setKlantenLoading(false);
      }
    },
    [store]
  );

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
          _multi: true, // Enable multitenancy
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
  const debouncedSearchKlanten = useDebouncedInput(searchKlanten, 500, {
    disableInstantValidation: true,
  });

  // Trigger initial contactperson search when switching to 'eigen-organisatie'
  useEffect(() => {
    if (gebruikType === 'eigen-organisatie') {
      // Load initial contactpersons when switching to eigen-organisatie mode
      searchContactpersonen('');
    }
  }, [gebruikType, searchContactpersonen]);

  // Trigger initial klanten search when in Aanbod beheerders flow
  useEffect(() => {
    if (isAanbodBeheerdersFlow) {
      searchKlanten('');
    }
  }, [isAanbodBeheerdersFlow, searchKlanten]);

  // Function to load referentiecomponenten
  const loadReferentieComponenten = useCallback(async () => {
    console.info('📋 Loading referentiecomponenten...');
    setReferentieComponentenLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        _published: 'false',
      });
      
      // Add multiple extend parameters to include standards
      queryParams.append('_extend[]', '_schema');
      queryParams.append('_extend[]', 'aanbevolenStandaarden');
      queryParams.append('_extend[]', 'verplichteStandaarden');

      // Fetch referentiecomponenten from openconnector endpoint
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

      const mapToOption = (item, index) => {
        const label =
          item?.['@self']?.name ||
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
            '_extend[]': ['_schema', '@self.relations', 'moduleVersies'],
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
      // Clear moduleVersie when there are no versions available
      if (gebruik?.moduleVersie != null && !(isEditMode && isInitialLoad)) {
        console.info('Clearing moduleVersie because no versions are available');
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
      // Clear moduleVersie when current value doesn't match available options
      if (!(isEditMode && isInitialLoad)) {
        console.info(
          'Clearing moduleVersie because current value is not in available options',
          { current, availableOptions: options.map((o) => o.value) }
        );
        setGebruikData('moduleVersie', null);
      }
    }
    // Auto-select when only one version available
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

  // Submission handler (following product wizard pattern)
  const handleRegister = async () => {
    setLoading(true);
    try {
      // Handle Aanbod beheerders flow with parallel saveObject calls
      if (isAanbodBeheerdersFlow) {
        if (!gebruik?.module || !selectedKlanten || selectedKlanten.length === 0) {
          setRegisterCallBack('error');
          setError({
            message:
              'Selecteer een applicatie en ten minste één klant voordat u doorgaat.',
            errors: null,
          });
          setLoading(false);
          return;
        }

        // Create gebruik objects for each selected klant
        const gebruikObjects = selectedKlanten.map((klantId) => ({
          module: gebruik.module,
          afnemer: klantId,
          // status is a required field
          status: 'Verwerving',
          startDatumVerwerving: new Date().toISOString().split('T')[0],
        }));

        try {
          // Save all objects in parallel using Promise.allSettled
          const savePromises = gebruikObjects.map((obj) =>
            store.object.saveObject(obj, 'voorzieningen', 'gebruik')
          );

          const results = await Promise.allSettled(savePromises);

          // Check if all saves succeeded
          const failed = results.filter((result) => result.status === 'rejected');

          if (failed.length > 0) {
            const errorMessages = failed
              .map((result) => result.reason?.message || 'Unknown error')
              .filter(Boolean);

            throw new Error(
              `Er zijn fouten opgetreden bij het opslaan van ${failed.length} van ${
                gebruikObjects.length
              } gebruiksmeldingen. ${errorMessages.join('; ')}`
            );
          }

          // On success, show success page
          setRegisterCallBack('success');
        } catch (bulkError) {
          console.error('Parallel save failed:', bulkError);
          setRegisterCallBack('error');
          setError({
            message:
              bulkError.message ||
              'Er is een fout opgetreden bij het opslaan van de gebruiksmeldingen. Probeer het opnieuw.',
            errors: null,
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      // Existing logic
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

  const canGoNext = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Aanbod beheerders flow validation
    if (isAanbodBeheerdersFlow) {
      if (stepLabel === 'selecteren') {
        // Selecteren step: applicatie and at least one klant must be selected
        return !!gebruik?.module && selectedKlanten && selectedKlanten.length > 0;
      }
      if (stepLabel === 'controleren') {
        // Controleren step: always true (review step)
        return true;
      }
      return false;
    }

    if (stepLabel === 'aanbieder') {
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
    if (stepLabel === 'applicatie') {
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
    if (stepLabel === 'informatie') {
      // Gebruik informatie step - status required
      return !!gebruik?.status;
    }
    if (stepLabel === 'referentiecomponenten') {
      return true; // Referentiecomponenten optional
    }
    if (stepLabel === 'deelnemers') {
      return true; // Deelnemers optional
    }
    if (stepLabel === 'controleren') {
      return true; // Controleren step
    }
    return false;
  };

  const renderStep = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Aanbod beheerders flow: simplified 2-step flow
    if (isAanbodBeheerdersFlow) {
      switch (stepLabel) {
        case 'selecteren':
          return (
            <ConGebruikStepSelecteren
              gebruik={gebruik}
              setGebruikData={setGebruikData}
              moduleOptions={modulesOptions}
              modulesLoading={modulesLoading || applicatiePreloadLoading}
              searchLoading={searchLoading}
              searchModules={debouncedSearchModules}
              schemas={schemas}
              klantenOptions={klantenOptions}
              klantenLoading={klantenLoading}
              searchKlanten={debouncedSearchKlanten}
              selectedKlanten={selectedKlanten}
              setSelectedKlanten={setSelectedKlanten}
              selectedKlantenOptions={selectedKlantenOptions}
              setSelectedKlantenOptions={setSelectedKlantenOptions}
              loading={loading}
            />
          );
        case 'controleren':
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
              isAanbodBeheerdersFlow={true}
              selectedKlanten={selectedKlanten}
              klantenOptions={klantenOptions}
            />
          );
        default:
          return null;
      }
    }

    // Existing Gebruik beheerders flow
    switch (stepLabel) {
      case 'aanbieder':
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
      case 'applicatie':
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
            isEditMode={isEditMode}
          />
        );
      case 'informatie':
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
      case 'referentiecomponenten':
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
      case 'deelnemers':
        return (
          <ConGebruikStepDeelnemers
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            loading={loading}
            deelnemerOptions={deelnemerOptions}
            deelnemersLoading={deelnemersLoading}
          />
        );
      case 'controleren':
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

  const currentStepName = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'aanbieder':
        return 'Afnemer';
      case 'applicatie':
        return applicatieKeuze === 'bestaand'
          ? 'Toevoegen applicatie'
          : 'Publiceren applicatie';
      case 'informatie':
        return 'Gebruiksinformatie';
      case 'referentiecomponenten':
        return 'Koppel de applicatie aan referentiecomponenten';
      case 'deelnemers':
        return 'Deelnemers toevoegen';
      case 'controleren':
        return 'Controleer uw gegevens';
      case 'selecteren':
        return 'Selecteer de applicatie en klanten';
      default:
        return '';
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
                  {isAanbodBeheerdersFlow
                    ? 'Uw applicatiegebruik melden'
                    : isEditMode
                    ? editModeTitle
                    : applicatieKeuze === 'bestaand'
                    ? 'Een applicatie toevoegen'
                    : 'Een nieuwe applicatie toevoegen'}
                </Heading1>
                <Paragraph>
                  {isAanbodBeheerdersFlow
                    ? 'Vul het formulier in om inzicht te geven in het gebruik van uw applicaties bij klanten.'
                    : applicatieKeuze === 'bestaand'
                    ? 'Vul dit formulier in om de applicatie toe te voegen aan uw applicatielandschap'
                    : 'Vul dit formulier in om applicaties op te voeren die nog niet bestaan in de softwarecatalogus, maar u wel in gebruik heeft. Dit waren voorheen de “externe pakketten”'}
                </Paragraph>
              </div>

              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {isAanbodBeheerdersFlow
                    ? stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                      'selecteren'
                      ? 'Selecteer de applicatie en klanten'
                      : 'Controleer uw gegevens'
                    : currentStepName()}
                </h3>

                <div className='ac-register-container ac-forms-product'>
                  <div ref={processStepsRef} className='ac-register-process-steps'>
                    <ProcessSteps steps={processStepsConfig} />
                  </div>

                  <div className='ac-register-form-container'>
                    <div
                      className='sr-only'
                      role='status'
                      aria-live='polite'
                      id='form-status'
                    >
                      {currentStepName()}
                    </div>

                    {isAanbodBeheerdersFlow ? (
                      <ConDebugViewer
                        data={{
                          module: gebruik.module,
                          afnemer: selectedKlanten,
                        }}
                        title='Gebruik Object'
                      />
                    ) : (
                      <ConDebugViewer data={gebruik} title='Gebruik Object' />
                    )}

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

                    {renderStep()}

                    <AcFlex
                      justifyContent='between'
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
                            disabled={loading || prefillLoading || !!prefillError}
                          >
                            Vorige
                          </AcButton>
                        )}

                        {/* Show "Ik kan de gewenste aanbieder niet vinden" button only on Aanbieder step */}
                        {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                          'aanbieder' &&
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
                        {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                          'aanbieder' &&
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
                        {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                          'applicatie' &&
                          applicatieKeuze === 'bestaand' &&
                          !isEditMode && (
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
                        {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                          'applicatie' &&
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
                          stepper.getCurrentStep() === 1 &&
                            'ac-register-form-next-button'
                        )}
                      >
                        {(() => {
                          const stepLabel = stepper.getLabelFromStep(
                            stepper.getCurrentStep()
                          );
                          if (isAanbodBeheerdersFlow) {
                            // Aanbod flow: show Next button on Selecteren step
                            return (
                              stepLabel === 'selecteren' && (
                                <div className='ac-register-button-wrapper'>
                                  <AcButton
                                    style='button'
                                    icon={<VISUALS.ARROW_RIGHT />}
                                    onClick={() => stepper.next()}
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
                          }
                          // Gebruik flow: show Next button on all steps except Controleren
                          return (
                            stepLabel !== 'controleren' && (
                              <div className='ac-register-button-wrapper'>
                                <AcButton
                                  style='button'
                                  icon={<VISUALS.ARROW_RIGHT />}
                                  onClick={() => stepper.next()}
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
                        const stepLabel = stepper.getLabelFromStep(
                          stepper.getCurrentStep()
                        );
                        if (isAanbodBeheerdersFlow) {
                          // Aanbod flow: show submit button on Controleren step
                          return (
                            stepLabel === 'controleren' && (
                              <AcButton
                                style='button'
                                buttonType='primary'
                                icon={<VISUALS.CLIPBOARD_CHECK />}
                                onClick={handleRegister}
                                loading={loading}
                                disabled={loading || prefillLoading}
                              >
                                Verzenden
                              </AcButton>
                            )
                          );
                        }
                        // Gebruik flow: show submit button on Controleren step
                        return (
                          stepLabel === 'controleren' && (
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
                    stepper.resetCurrentStep();
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
