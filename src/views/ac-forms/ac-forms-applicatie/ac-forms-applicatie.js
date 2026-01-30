import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { commongroundApiUrl } from '@config';
import _ from 'lodash';
import {
  validateWebsite,
  validateEmail,
  validatePhone,
} from '@views/ac-forms/validation/form-validations';

import {
  Heading1,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

// Stage Components
import ConFormApplicatieTypeSelectStage from './con-form-applicatie-type-select-stage';
import ConFormApplicatieInformatieStage from './components/con-form-applicatie-informatie-stage';
import ConFormApplicatieLicentieStage from './components/con-form-applicatie-licentie-stage';
import ConFormApplicatieVersieStage from './components/con-form-applicatie-versie-stage';
import ConFormApplicatieReferentiecomponentenStage from './components/con-form-applicatie-referentiecomponenten-stage';
import ConFormApplicatieStandaardenStage from './components/con-form-applicatie-standaarden-stage';
import ConFormApplicatieKoppelingenStage from './components/con-form-applicatie-koppelingen-stage';
// import ConFormApplicatieDienstenStage from './components/con-form-applicatie-diensten-stage';
import ConFormApplicatieControlerenStage from './components/con-form-applicatie-controleren-stage';
import ConFormApplicatieAanbiederInformatieStage from './components/con-form-applicatie-aanbieder-informatie-stage';

// Utils
import { getActiveWizard } from '@src/constants/wizards.constants';
import { stripLocalIds } from './utils/serialization.utils';
import useStepper, { addStepperClickHandlers, generateSteps } from '../con-stepper';
import {
  useSchemaFetcher,
  applySchemaDefaults,
  createIsEmptyCheck,
  createModuleMapper,
  createOrganisatieMapper,
  createReferentieComponentMapper,
  createBuitengemeentelijkeMapper,
  createStandaardMapper,
  createStandaardversieMapper,
  createModuleSearchConfig,
  createOrganisatieSearchConfig,
  createEntitySearchConfig,
  mapToOption,
  useEntitySearch,
  fetchMissingEntities,
  mapId,
} from '../wizard-utils';

/**
 * Applicatie Aanmelden Wizard (AcFormsApplicatie)
 *
 * High-level overview
 * - This file implements a multi-step wizard for registering an "applicatie" (application)
 * - The wizard is rendered by the top-level component `AcFormsApplicatie`
 * - Each step is a memoized sub-component that writes changes back into the shared `applicatie` object
 *
 * Data model (simplified)
 * - applicatie: {
 *     naam: string (required)
 *   }
 */

const AcFormsApplicatieInner = ({ store, formType, applicatieId, redirect }) => {
  // Determine edit mode from applicatieId
  const isEditMode = !!applicatieId;
  const navigate = useNavigate();

  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const stepper = useStepper();

  // Edit-mode prefill state
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);

  // State for aanbieder selection (only for ontbrekend-applicatie)
  const [aanbiederKeuze, setAanbiederKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'

  /**
   * Aanbieder Organization State Object
   *
   * This object holds organization data for creating a new organization.
   * Only used when aanbiederKeuze === 'nieuw' and formType === 'ontbrekend-applicatie'
   */
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

  /**
   * Applicatie State Object
   *
   * This object holds all applicatie data that will be submitted to the API.
   */
  const [applicatie, setApplicatie] = useState({
    naam: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    website: '',
    contactpersoon: '',
    cloudDienstverleningsmodel: [],
    hostingJurisdictie: '',
    hostingLocatie: '',
    aanbieder: '',
    licentietype: '',
    licentie: '',
    referentieComponenten: [],
    type: '',
    logo: '',
    omvat: [],
    onderdeelVan: [],
    diensten: [],
    koppelingen: [],
    beoordelingen: [],
    kwetsbaarheden: [],
    licentieType: '',
    compliancy: [],
    standaarden: [],
    standaardVersies: [],
    standaardenGemma: [],
  });

  // Ref for ProcessSteps container
  const processStepsRef = useRef(null);

  /**
   * Check if Versies step should be shown based on cloud service model
   * @returns {boolean} True if Versies step should be shown
   */
  const shouldShowVersiesStep = (
    applicatie?.cloudDienstverleningsmodel || ''
  ).includes('On-premises (self-managed)');

  // ProcessSteps configuration - must be created early to define steps with stepper
  const processStepsConfig = useMemo(() => {
    const needsAanbiederStep = formType === 'ontbrekend-applicatie';

    if (needsAanbiederStep) {
      // For ontbrekend-applicatie: Aanbieder step + multi-step group
      return generateSteps(stepper, [
        {
          title: 'Applicatie informatie',
          isNavigable: false,
          substeps: [
            { title: 'Aanbieder', stepLabel: 'aanbieder' },
            { title: 'Applicatie gegevens', stepLabel: 'applicatie-informatie' },
          ],
        },
        {
          title: 'Applicatie configuratie',
          isNavigable: false,
          substeps: [
            { title: 'Licentie / Hosting', stepLabel: 'licentie' },
            {
              title: 'Versies',
              stepLabel: 'versies',
              condition: shouldShowVersiesStep,
            },
            { title: 'Referentiecomponenten', stepLabel: 'referentiecomponenten' },
            { title: 'Standaarden', stepLabel: 'standaarden' },
            { title: 'Koppelingen', stepLabel: 'koppelingen' },
          ],
        },
        { title: 'Controleren', stepLabel: 'controleren' },
      ]);
    } else {
      // For eigen type: no Aanbieder step
      return generateSteps(stepper, [
        { title: 'Applicatie informatie', stepLabel: 'applicatie-informatie' },
        {
          title: 'Applicatie configuratie',
          isNavigable: false,
          substeps: [
            { title: 'Licentie / Hosting', stepLabel: 'licentie' },
            {
              title: 'Versies',
              stepLabel: 'versies',
              condition: shouldShowVersiesStep,
            },
            { title: 'Referentiecomponenten', stepLabel: 'referentiecomponenten' },
            { title: 'Standaarden', stepLabel: 'standaarden' },
            { title: 'Koppelingen', stepLabel: 'koppelingen' },
          ],
        },
        { title: 'Controleren', stepLabel: 'controleren' },
      ]);
    }
  }, [stepper.getCurrentStep(), formType, shouldShowVersiesStep]);

  // Add click handlers to steps
  // This ensures that that clicking on a individual step or sub-step will navigate to the correct step
  useEffect(() => {
    return addStepperClickHandlers({
      processStepsRef,
      processStepsConfig,
      stepper,
      skipIfLoading: prefillLoading,
      skipIfError: prefillError,
    });
  }, [
    stepper.getCurrentStep(),
    prefillLoading,
    prefillError,
    stepper,
    processStepsConfig,
  ]);

  // Referentiecomponenten options with search functionality
  const referentieComponentMapper = useMemo(
    () => createReferentieComponentMapper(),
    []
  );
  const referentieComponentenSearchConfig = useMemo(
    () =>
      createEntitySearchConfig(store, 'element', {
        collectionKey: 'vng-gemma',
        mapToOption: referentieComponentMapper,
        queryParamsBuilder: (searchTerm, additionalParams = {}) => ({
          _limit: '500',
          _page: '1',
          _published: 'false',
          gemmaType: 'Referentiecomponent',
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
          ...additionalParams,
        }),
        extendParams: [
          '@self.schema',
          'aanbevolenStandaarden',
          'verplichteStandaarden',
          'gekoppeldeStandaardVersies',
        ],
      }),
    [store, referentieComponentMapper]
  );
  const {
    search: searchReferentieComponenten,
    loading: referentieComponentenLoading,
    options: referentieComponentenOptions,
  } = useEntitySearch(referentieComponentenSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });

  // Separate array to track chosen referentieComponenten with their standards
  // Structure: [{ id, naam, aanbevolenStandaarden: [], verplichteStandaarden: [], applicatieId }]
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Standaarden options with search functionality
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenOptionsLoading, setStandaardenOptionsLoading] = useState(false);
  // Extra standards selected via multi-select (not from referentieComponenten)
  const [selectedExtraStandards, setSelectedExtraStandards] = useState([]);
  // Ref to track if selectedExtraStandards has been initialized from existing data
  const selectedExtraStandardsInitializedRef = useRef(false);

  // Standaardenversies options with search functionality
  const standaardversieMapper = useMemo(() => createStandaardversieMapper(), []);
  const standaardenversiesSearchConfig = useMemo(
    () =>
      createEntitySearchConfig(store, 'element', {
        collectionKey: 'vng-gemma',
        mapToOption: standaardversieMapper,
        queryParamsBuilder: (searchTerm, additionalParams = {}) => ({
          _limit: '500',
          _page: '1',
          _published: 'false',
          gemmaType: 'Standaardversie',
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
          ...additionalParams,
        }),
        extendParams: ['@self.schema'],
      }),
    [store, standaardversieMapper]
  );
  const {
    search: searchStandaardenversies,
    loading: standaardenversiesOptionsLoading,
    options: standaardenversiesOptions,
  } = useEntitySearch(standaardenversiesSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });

  // Modules options with search functionality for koppelingen
  const moduleMapper = useMemo(() => createModuleMapper({ type: 'applicatie' }), []);
  const moduleSearchConfig = useMemo(
    () =>
      createModuleSearchConfig(store, {
        useCacheFirst: true,
        mapToOption: moduleMapper,
        queryParamsBuilder: (searchTerm) => ({
          _limit: '20',
          _page: '1',
          _published: 'false',
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
        }),
      }),
    [store, moduleMapper]
  );
  const {
    search: searchModules,
    loading: modulesLoading,
    options: modulesOptions,
    setOptions: setModulesOptions,
  } = useEntitySearch(moduleSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });

  // Buitengemeentelijke voorzieningen options with search functionality
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
  } = useEntitySearch(buitengemeentelijkeSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });

  // Contactpersoon options with search functionality
  // Simple mapper - component handles display via getOptionLabel
  const contactpersoonMapper = useMemo(
    () => (item, index) => {
      return mapToOption(item, index, {
        valueFields: ['@self.id', 'id'],
        fallbackLabel: `Contactpersoon ${index + 1}`,
      });
    },
    []
  );
  const contactpersoonSearchConfig = useMemo(
    () =>
      createEntitySearchConfig(store, 'contactpersoon', {
        mapToOption: contactpersoonMapper,
        source: 'database',
        queryParamsBuilder: (searchTerm, additionalParams = {}) => ({
          _limit: '50',
          _page: '1',
          _multi: true, // Enable multitenancy
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
          ...additionalParams,
        }),
      }),
    [store, contactpersoonMapper]
  );
  const {
    search: searchContactpersonen,
    loading: contactpersoonSearchLoading,
    options: contactpersoonOptions,
  } = useEntitySearch(contactpersoonSearchConfig, {
    debounceDelay: 250,
    mergeStrategy: 'preserve-existing',
  });
  const [contactpersoonLoading, setContactpersoonLoading] = useState(false);

  // Aanbieder (organisatie) options with search functionality
  const organisatieMapper = useMemo(() => createOrganisatieMapper(), []);
  const organisatieSearchConfig = useMemo(
    () =>
      createOrganisatieSearchConfig(store, {
        mapToOption: organisatieMapper,
        source: 'database',
        queryParamsBuilder: (searchTerm, additionalParams = {}) => ({
          _limit: '50',
          _page: '1',
          _multi: true, // Enable multitenancy
          ...(searchTerm && searchTerm.trim() ? { _search: searchTerm.trim() } : {}),
          ...additionalParams,
        }),
      }),
    [store, organisatieMapper]
  );
  const {
    search: searchAanbieders,
    loading: aanbiederSearchLoading,
    options: aanbiederOptions,
  } = useEntitySearch(organisatieSearchConfig, {
    debounceDelay: 500,
    mergeStrategy: 'preserve-existing',
  });
  const [aanbiederLoading, setAanbiederLoading] = useState(false);

  // Koppelingen form state
  const [koppelingenFormState, setKoppelingenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedAppAByRow: {},
    selectedAppBByRow: {},
    directionByRow: {},
    koppelingIdByRow: {},
    naamByRow: {},
  });

  // Diensten form state
  const [dienstenFormState, setDienstenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedDienstByRow: {},
    dienstNaamByRow: {},
    dienstIdByRow: {},
  });

  const setApplicatieData = useCallback((key, value) => {
    setApplicatie((prev) => {
      // Handle function updates (for koppelingen array updates)
      if (typeof value === 'function') {
        return { ...prev, [key]: value(prev[key]) };
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const setAanbiederOrganisatieData = useCallback((key, value) => {
    setAanbiederOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch schema definitions on component mount
  const { schemas, loading: schemasLoading } = useSchemaFetcher(
    store,
    ['module', 'suite', 'moduleversie', 'organisatie', 'dienst'],
    {
      onSchemasLoaded: (fetchedSchemas) => {
        // Update applicatie object with schema-based defaults if applicatie schema was loaded
        if (fetchedSchemas.module) {
          const isEmptyCheck = createIsEmptyCheck([
            'naam',
            'cloudDienstverleningsmodel',
          ]);
          setApplicatie((prevApplicatie) => {
            return applySchemaDefaults(
              store,
              prevApplicatie,
              fetchedSchemas.module,
              isEmptyCheck
            );
          });
        }
      },
    }
  );

  // Prefill applicatie data when editing
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode || !applicatieId) return;
      if (schemasLoading) return; // Wait for schemas to load first
      stepper.resetCurrentStep();
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        // Fetch the applicatie object with extended koppelingen, diensten, and moduleVersies
        await store.object.fetchObject(
          'voorzieningen',
          'module',
          String(applicatieId),
          {
            '_extend[]': [
              '_schema',
              'koppelingen',
              'diensten',
              'moduleVersies',
              'compliancy',
            ],
            _published: 'false',
          }
        );
        if (cancelled) return;

        const fetched = store.object.getObject(
          'voorzieningen_module',
          String(applicatieId)
        );
        if (!fetched) {
          setPrefillError('Applicatie niet gevonden');
          return;
        }

        // Map referentieComponenten
        const prefilledReferentieComponenten = Array.isArray(
          fetched.referentieComponenten
        )
          ? fetched.referentieComponenten.map((rc) => mapId(rc)).filter(Boolean)
          : [];

        // Map koppelingen with _localId for tracking (same pattern as product form)
        const prefilledKoppelingen = Array.isArray(fetched.koppelingen)
          ? fetched.koppelingen.map((kpl) => ({
              // Preserve existing ID if present, otherwise generate local ID
              _localId: kpl.id
                ? `existing_${kpl.id}`
                : `kpl_${Date.now().toString(36)}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,
              ...kpl,
            }))
          : [];

        // Map diensten with _localId for tracking (same pattern as product form)
        const prefilledDiensten = Array.isArray(fetched.diensten)
          ? fetched.diensten.map((dienst) => ({
              // Preserve existing dienst ID if present, otherwise generate local ID
              _localId:
                typeof dienst === 'object' && dienst.id
                  ? `existing_${dienst.id}`
                  : `dienst_${Date.now().toString(36)}_${Math.random()
                      .toString(36)
                      .slice(2, 8)}`,
              ...(typeof dienst === 'object' ? dienst : { type: dienst }),
            }))
          : [];

        // Update applicatie object with fetched data
        setApplicatie((prev) => ({
          ...prev,
          naam: fetched.naam || '',
          beschrijvingKort: fetched.beschrijvingKort || '',
          beschrijvingLang: fetched.beschrijvingLang || '',
          website: fetched.website || '',
          logo: fetched.logo || '',
          contactpersoon: fetched.contactpersoon || null,
          aanbieder: fetched.aanbieder ? mapId(fetched.aanbieder) : null,
          cloudDienstverleningsmodel: fetched.cloudDienstverleningsmodel || '',
          licentietype: fetched.licentietype || fetched.licentieType || '',
          licentieType: fetched.licentietype || fetched.licentieType || '',
          licentie: fetched.licentie || '',
          hostingLocatie: fetched.hostingLocatie || '',
          hostingJurisdictie: fetched.hostingJurisdictie || '',
          referentieComponenten: prefilledReferentieComponenten,
          moduleVersies: fetched.moduleVersies || [],
          compliancy: fetched.compliancy || [],
          standaarden: fetched.standaarden || [],
          standaardVersies: fetched.standaardVersies || [],
          standaardenGemma: fetched.standaardenGemma || [],
          koppelingen: prefilledKoppelingen,
          diensten: prefilledDiensten,
        }));

        console.info('✅ Applicatie data prefilled for edit mode');
      } catch (err) {
        console.error('Failed to prefill applicatie data:', err);
        setPrefillError('Fout bij het laden van applicatie gegevens');
      } finally {
        if (!cancelled) {
          setPrefillLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, applicatieId, schemasLoading, store.object]);

  // ✅ Set aanbieder after schemas are loaded to avoid race condition
  useEffect(() => {
    if (schemasLoading) return; // Wait for schemas to finish loading
    if (isEditMode) return; // Don't override aanbieder in edit mode
    if (formType !== 'eigen') return; // Only for eigen type

    // Fetch current user's active organization from /me endpoint
    const fetchUserOrganization = async () => {
      try {
        const response = await fetch(
          `${commongroundApiUrl()}/openregister/api/user/me`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
          }
        );

        if (response.ok) {
          const userData = await response.json();

          const activeOrgId =
            userData?.organisations?.active?.uuid ||
            userData?.organisations?.active?.id;

          if (activeOrgId) {
            setApplicatie((prev) => ({
              ...prev,
              aanbieder: activeOrgId,
            }));
          } else {
            console.warn('No active organization found for current user');
          }
        } else {
          console.error('Failed to fetch user profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user organization:', error);
      }
    };

    fetchUserOrganization();
  }, [formType, schemasLoading, isEditMode]);

  // Function to load standaarden based on selected referentiecomponenten
  const loadStandaardenFromReferentieComponenten = useCallback(
    async (selectedRefComps) => {
      if (!schemas?.module || !selectedRefComps || selectedRefComps.length === 0) {
        console.info(
          '⏭️ No referentiecomponenten selected, skipping standaarden load'
        );
        setStandaardenOptions([]);
        return;
      }

      console.info('📋 Loading standaarden from selected referentiecomponenten...');
      setStandaardenOptionsLoading(true);

      try {
        // ✨ REFACTORED: Use gekoppeldeStandaardVersies from the initial fetch
        // instead of making N+1 API calls
        const standaardenMap = new Map(); // Use Map to deduplicate and store full data

        selectedRefComps.forEach((refCompValue) => {
          // Find the full referentiecomponent data
          const refCompOption = referentieComponentenOptions.find(
            (opt) => opt.value === refCompValue
          );
          if (!refCompOption?.data) return;

          const refCompData = refCompOption.data;

          // Helper to process standaarden and extract their versions from gekoppeldeStandaardVersies
          const processStandaarden = (standaardenList) => {
            if (!Array.isArray(standaardenList)) return;

            standaardenList.forEach((standaard) => {
              const standaardId =
                standaard?.['@self']?.id || standaard?.id || standaard;
              if (!standaardId) return;

              // If we haven't seen this standaard yet, initialize it
              if (!standaardenMap.has(standaardId)) {
                // Get gekoppeldeStandaardVersies for this referentiecomponent
                const gekoppeldeVersies =
                  refCompData.gekoppeldeStandaardVersies || [];

                // Filter versions that belong to this standard
                const standaardVersies = gekoppeldeVersies.filter((versie) => {
                  // Check if this version belongs to this standard
                  const versieStandaardId =
                    versie?.standaard?.['@self']?.id ||
                    versie?.standaard?.id ||
                    versie?.standaard;
                  return String(versieStandaardId) === String(standaardId);
                });

                standaardenMap.set(standaardId, {
                  ...standaard,
                  standaardVersies: standaardVersies,
                });
              }
            });
          };

          // Collect from both aanbevolen and verplichte standaarden
          processStandaarden(refCompData.aanbevolenStandaarden);
          processStandaarden(refCompData.verplichteStandaarden);
        });

        console.info(
          `📊 Found ${standaardenMap.size} unique standaarden from selected components`
        );

        if (standaardenMap.size === 0) {
          console.warn('⚠️ No standaarden found in selected referentiecomponenten');
          setStandaardenOptions([]);
          setStandaardenOptionsLoading(false);
          return;
        }

        // Map to options using mapper function
        const standaarden = Array.from(standaardenMap.values());
        const standaardMapper = createStandaardMapper();
        const options = standaarden
          .map((item, index) => standaardMapper(item, index))
          .filter((o) => o.label && o.value);

        setStandaardenOptions(options);
        console.info(
          `✅ Loaded ${options.length} standaarden with versions from gekoppeldeStandaardVersies (eliminated N+1 queries)`
        );
      } catch (e) {
        console.error('Failed to load standaarden:', e);
        setStandaardenOptions([]);
      } finally {
        setStandaardenOptionsLoading(false);
      }
    },
    [schemas?.module, referentieComponentenOptions]
  );

  // ✅ Load standaarden when referentiecomponenten are selected
  useEffect(() => {
    if (!schemas?.module) return;
    if (referentieComponentenOptions.length === 0) return; // Wait for options to load

    // Get the IDs/values from referentieComponentenWithStandards
    const selectedRefCompValues = referentieComponentenWithStandards.map(
      (rc) => rc.id || rc.value
    );

    if (selectedRefCompValues.length > 0) {
      loadStandaardenFromReferentieComponenten(selectedRefCompValues);
    } else {
      // Clear standaarden if no referentiecomponenten selected
      setStandaardenOptions([]);
    }
  }, [
    referentieComponentenWithStandards,
    referentieComponentenOptions,
    schemas?.module,
    loadStandaardenFromReferentieComponenten,
  ]);

  // Load ALL standaardversies when schemas are available (for extra standaardversies dropdown)
  useEffect(() => {
    if (!schemas?.module) return;
    if (standaardenversiesOptionsLoading) return; // Currently loading

    searchStandaardenversies('');
  }, [schemas?.module]);

  // Load referentiecomponenten when schemas are available
  useEffect(() => {
    if (!schemas?.module) return;
    if (referentieComponentenLoading) return; // Currently loading

    searchReferentieComponenten('');
  }, [schemas?.module]);

  // Initialize selectedExtraStandards from existing compliancy and standaardVersies data
  // This runs when editing to restore the previously selected extra standards
  useEffect(() => {
    if (standaardenversiesOptions.length === 0) return;
    if (standaardenOptions.length === 0) return; // Need standards to check standaardVersies

    // Get all standaardversie IDs from compliancy and standaardVersies arrays
    const existingCompliancy = applicatie.compliancy || [];
    const existingStandaardVersies =
      applicatie.standaardVersies || applicatie.standaardversies || [];

    // Collect all versie IDs that might be "extra" (from compliancy or standaardVersies)
    const allVersieIds = new Set();
    existingCompliancy.forEach((comp) => {
      if (comp.standaardversie) {
        allVersieIds.add(String(comp.standaardversie));
      }
    });
    existingStandaardVersies.forEach((versieId) => {
      if (versieId) {
        allVersieIds.add(String(versieId));
      }
    });

    // If no existing data, mark as initialized and return
    if (allVersieIds.size === 0) {
      if (!selectedExtraStandardsInitializedRef.current) {
        selectedExtraStandardsInitializedRef.current = true;
      }
      return;
    }

    // If already initialized and selectedExtraStandards matches existing data, skip
    if (selectedExtraStandardsInitializedRef.current) {
      const currentExtraIds = new Set(
        selectedExtraStandards.map((s) => String(s.value))
      );
      // Check if the sets are identical
      if (
        currentExtraIds.size === allVersieIds.size &&
        [...allVersieIds].every((id) => currentExtraIds.has(id))
      ) {
        return; // Already correctly initialized
      }
      // If data changed (e.g., when switching to edit mode), allow re-initialization
    }

    // Get all standaardversie IDs from referentieComponentenWithStandards
    // Traverse: referentieComponenten → standaarden → standaardVersies
    const getAllStandaardVersiesFromRefs = () => {
      const versiesSet = new Set();

      // Helper to get ID from an item
      const getItemId = (item) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        return (
          item.id ||
          item.identifier ||
          item.value ||
          item.slug ||
          item.naam ||
          item.name ||
          null
        );
      };

      // Helper to process standards and extract their versions
      const processStandards = (standardsList) => {
        if (!standardsList || !Array.isArray(standardsList)) return;

        standardsList.forEach((standard) => {
          const standardId = getItemId(standard);
          if (!standardId) return;

          // Find the full standard data to get standaardVersies
          const fetchedStandardData = standaardenOptions.find(
            (opt) =>
              String(opt.value || opt.data?.id || opt.data?.identifier) ===
              String(standardId)
          );
          const standardData = fetchedStandardData?.data || standard;

          // Get standaardVersies array from the standard
          const standaardVersiesList = standardData?.standaardVersies || [];

          if (Array.isArray(standaardVersiesList)) {
            standaardVersiesList.forEach((versie) => {
              const versieId = getItemId(versie);
              if (versieId) {
                versiesSet.add(String(versieId));
              }
            });
          }
        });
      };

      referentieComponentenWithStandards.forEach((refComp) => {
        processStandards(refComp.aanbevolenStandaarden);
        processStandards(refComp.verplichteStandaarden);
      });

      return versiesSet;
    };

    const refVersieIds = getAllStandaardVersiesFromRefs();

    // Find extra standaardversies: those in compliancy/standaardVersies but NOT in referentieComponenten
    const extraVersies = [];

    allVersieIds.forEach((versieId) => {
      // Check if this versie is NOT in referentieComponenten (i.e., it's an extra versie)
      // Also check all possible ID format variations to ensure proper matching
      let isInRefs = false;

      // Check direct match
      if (refVersieIds.has(versieId)) {
        isInRefs = true;
      } else {
        // Check if any ref versie ID matches this versieId (handle ID format variations)
        refVersieIds.forEach((refVersieId) => {
          if (String(refVersieId) === String(versieId)) {
            isInRefs = true;
          }
        });
      }

      if (!isInRefs) {
        // Find the option for this standaardversie - check all possible ID formats
        const option = standaardenversiesOptions.find((opt) => {
          // Check option value (should now be identifier)
          if (String(opt.value) === versieId) return true;
          // Also check data properties for backwards compatibility
          if (opt.data?.identifier && String(opt.data.identifier) === versieId)
            return true;
          if (opt.data?.id && String(opt.data.id) === versieId) return true;
          if (opt.data?.value && String(opt.data.value) === versieId) return true;
          return false;
        });

        if (option) {
          extraVersies.push(option);
        }
      }
    });

    if (extraVersies.length > 0) {
      setSelectedExtraStandards(extraVersies);
    }

    // Mark as initialized after processing
    selectedExtraStandardsInitializedRef.current = true;
  }, [
    standaardenOptions,
    standaardenversiesOptions,
    referentieComponentenWithStandards,
    applicatie.compliancy, // Include to reinitialize when editing
    applicatie.standaardVersies, // Include to reinitialize when editing
    selectedExtraStandards, // Include to check if already correct
  ]);

  // Pre-load modules once so Applicatie B has initial options
  useEffect(() => {
    searchModules('');
  }, []);

  // Load buitengemeentelijke voorzieningen on mount
  useEffect(() => {
    if (buitengemeentelijkeOptionsLoading) return; // Currently loading
    searchBuitengemeentelijkeVoorzieningen('');
  }, []);

  // Pre-load contactpersonen once so dropdown has initial options
  useEffect(() => {
    const loadInitialContactpersonen = async () => {
      setContactpersoonLoading(true);
      try {
        searchContactpersonen('');
      } finally {
        setContactpersoonLoading(false);
      }
    };
    loadInitialContactpersonen();
  }, [searchContactpersonen]);

  // Pre-load organisaties once so dropdown has initial options (only for ontbrekend-applicatie)
  useEffect(() => {
    if (formType !== 'ontbrekend-applicatie') return;

    const loadInitialAanbieders = async () => {
      setAanbiederLoading(true);
      try {
        searchAanbieders('');
      } finally {
        setAanbiederLoading(false);
      }
    };
    loadInitialAanbieders();
  }, [formType, searchAanbieders]);

  // Initialize koppelingen form state from applicatie.koppelingen (for edit mode)
  useEffect(() => {
    const koppelingen = Array.isArray(applicatie?.koppelingen)
      ? applicatie.koppelingen
      : [];

    // Only initialize if we have koppelingen and form state only has the default row
    if (
      koppelingen.length > 0 &&
      koppelingenFormState.rows.length === 1 &&
      koppelingenFormState.rows[0] === 0 &&
      Object.keys(koppelingenFormState.koppelingIdByRow || {}).length === 0
    ) {
      let rowCounter = 0;
      const nextRows = [];
      const nextSelectedAppBByRow = {};
      const nextDirectionByRow = {};
      const nextTypeByRow = {};
      const nextKoppelingIdByRow = {};
      const nextNaamByRow = {};
      const updatedKoppelingen = [];

      koppelingen.forEach((kpl) => {
        const rowId = rowCounter++;
        nextRows.push(rowId);

        // Use existing _localId if present, otherwise generate one
        const localId =
          kpl && kpl._localId
            ? kpl._localId
            : kpl?.id
            ? `existing_${kpl.id}`
            : `kpl_${Date.now().toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;
        nextKoppelingIdByRow[rowId] = localId;

        // Ensure the koppeling has _localId set for proper data retrieval
        updatedKoppelingen.push({
          ...kpl,
          _localId: localId,
        });

        // Try to prefill Applicatie B by id when present in API data
        const moduleBId = (() => {
          if (!kpl) return null;
          // Check moduleB first (direct property)
          if (kpl.moduleB != null) {
            // Accept both object reference and primitive id
            return String(
              typeof kpl.moduleB === 'object' ? kpl.moduleB?.id : kpl.moduleB
            );
          }
          // Then check moduleBId
          if (kpl.moduleBId != null) return String(kpl.moduleBId);
          // Finally check @self.relations as last case scenario
          const relationsModuleB = kpl?.['@self']?.relations?.moduleB;
          if (relationsModuleB != null) return String(relationsModuleB);
          return null;
        })();

        if (moduleBId != null) {
          nextSelectedAppBByRow[rowId] = moduleBId;
        }

        if (kpl && kpl.gegevensuitwisselingRichting) {
          nextDirectionByRow[rowId] = kpl.gegevensuitwisselingRichting;
        }

        if (kpl && kpl.soortKoppeling) {
          nextTypeByRow[rowId] = kpl.soortKoppeling;
        }

        if (kpl && kpl.naam) {
          nextNaamByRow[rowId] = kpl.naam;
        }
      });

      if (nextRows.length > 0) {
        // Update applicatie.koppelingen to ensure all have _localId
        setApplicatieData('koppelingen', updatedKoppelingen);

        setKoppelingenFormState((prev) => ({
          ...prev,
          rows: nextRows,
          nextRowId: nextRows.length,
          selectedAppBByRow: { ...prev.selectedAppBByRow, ...nextSelectedAppBByRow },
          directionByRow: { ...prev.directionByRow, ...nextDirectionByRow },
          koppelingIdByRow: {
            ...prev.koppelingIdByRow,
            ...nextKoppelingIdByRow,
          },
          naamByRow: { ...prev.naamByRow, ...nextNaamByRow },
        }));
      }
    }
  }, [applicatie?.koppelingen, koppelingenFormState.rows.length]);

  // Fetch missing selected moduleB IDs and add them to modulesOptions (for edit mode)
  useEffect(() => {
    const run = async () => {
      // Only run if we have koppelingen form state initialized
      const selectedModuleBIds = Object.values(
        koppelingenFormState.selectedAppBByRow || {}
      ).filter(Boolean);

      if (selectedModuleBIds.length === 0) return;

      // Directly ask fetchMissingEntities to handle missing IDs, with all current ones
      await fetchMissingEntities(
        store,
        'voorzieningen',
        'module',
        selectedModuleBIds,
        modulesOptions,
        moduleMapper,
        setModulesOptions,
        { extendParams: ['@self.schema'], source: 'index' }
      );
    };

    run();
  }, [koppelingenFormState.selectedAppBByRow, modulesOptions, store, moduleMapper]);

  // Initialize diensten form state from applicatie.diensten (for edit mode)
  useEffect(() => {
    const diensten = Array.isArray(applicatie?.diensten) ? applicatie.diensten : [];

    // Only initialize if we have diensten and form state only has the default row
    if (
      diensten.length > 0 &&
      dienstenFormState.rows.length === 1 &&
      dienstenFormState.rows[0] === 0 &&
      Object.keys(dienstenFormState.dienstIdByRow || {}).length === 0
    ) {
      let rowCounter = 0;
      const nextRows = [];
      const nextSelectedDienstByRow = {};
      const nextDienstNaamByRow = {};
      const nextDienstIdByRow = {};

      diensten.forEach((dienst) => {
        const rowId = rowCounter++;
        nextRows.push(rowId);

        if (dienst && dienst.type) {
          nextSelectedDienstByRow[rowId] = String(dienst.type);
        }

        if (dienst && dienst.naam) {
          nextDienstNaamByRow[rowId] = dienst.naam;
        }

        // Use existing _localId if present, otherwise generate one
        const localId =
          dienst && dienst._localId
            ? dienst._localId
            : dienst?.id
            ? `existing_${dienst.id}`
            : `dienst_${Date.now().toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;
        nextDienstIdByRow[rowId] = localId;
      });

      if (nextRows.length > 0) {
        setDienstenFormState((prev) => ({
          ...prev,
          rows: nextRows,
          nextRowId: nextRows.length,
          selectedDienstByRow: {
            ...prev.selectedDienstByRow,
            ...nextSelectedDienstByRow,
          },
          dienstNaamByRow: {
            ...prev.dienstNaamByRow,
            ...nextDienstNaamByRow,
          },
          dienstIdByRow: {
            ...prev.dienstIdByRow,
            ...nextDienstIdByRow,
          },
        }));
      }
    }
  }, [applicatie?.diensten, dienstenFormState.rows.length]);

  const handleRegister = async () => {
    setLoading(true);
    try {
      let finalAanbieder = applicatie.aanbieder;

      // ✅ For type=ontbrekend-applicatie with new organization, create the organization first
      if (formType === 'ontbrekend-applicatie' && aanbiederKeuze === 'nieuw') {
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

      // Submit the complete applicatie object to the voorzieningen register
      const applicatieData = {
        ...applicatie,
        aanbieder: finalAanbieder,
      };

      // Filter out empty moduleVersies entries before submitting
      // Only keep versions that have at least a version number or status
      if (Array.isArray(applicatieData.moduleVersies)) {
        applicatieData.moduleVersies = applicatieData.moduleVersies.filter(
          (versie) => versie && (versie.versie || versie.status)
        );
      }

      const sanitized = stripLocalIds(applicatieData);

      let createdApplicatie = null;
      if (applicatieId) {
        // Edit mode: update existing applicatie via PUT
        await store.object.updateObject(
          'voorzieningen',
          'module',
          String(applicatieId),
          sanitized
        );
        // For edit mode, use the existing applicatieId
        createdApplicatie = { id: applicatieId };
      } else {
        // Create mode: create new applicatie via POST
        createdApplicatie = await store.object.createObject(
          'voorzieningen',
          'module',
          sanitized
        );
      }

      // Check if redirect parameter exists
      if (redirect && createdApplicatie) {
        const applicatieIdValue =
          createdApplicatie?.id || createdApplicatie?.['@self']?.id;
        if (applicatieIdValue) {
          try {
            // Decode the redirect URL (it's a relative path like /forms/dienst?type=...)
            const decodedRedirect = decodeURIComponent(redirect);

            // Parse the URL - decodedRedirect is a relative path, so we need to construct a full URL to parse it
            const url = new URL(decodedRedirect, window.location.origin);
            const redirectParams = new URLSearchParams(url.search);

            // Add applicatie parameter
            redirectParams.set('applicatie', String(applicatieIdValue));

            // Reconstruct the relative URL with the new parameter
            const redirectUrl = `${url.pathname}${
              redirectParams.toString() ? `?${redirectParams.toString()}` : ''
            }`;

            // Navigate to the redirect URL
            navigate(redirectUrl);
            return; // Exit early, don't show success page
          } catch (redirectError) {
            console.error('Failed to parse redirect URL:', redirectError);
            // Fall through to show success page if redirect fails
          }
        }
      }

      setRegisterCallBack('success');
    } catch (err) {
      setRegisterCallBack('error');
      setError({
        message: 'Er is een fout opgetreden bij het registreren.',
        errors: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const focusForm = () => {
    const form = document.querySelector('#formStart');
    if (form) {
      form.focus();
    }
  };

  const renderStep = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Show loading state while schemas are being fetched (except for type selection step)
    if (
      schemasLoading &&
      stepLabel !== 'aanbieder' &&
      formType !== 'ontbrekend-applicatie'
    ) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Paragraph>Schema&apos;s laden...</Paragraph>
        </div>
      );
    }

    switch (stepLabel) {
      case 'aanbieder':
        return (
          <ConFormApplicatieAanbiederInformatieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            aanbiederOrganisatie={aanbiederOrganisatie}
            setAanbiederOrganisatieData={setAanbiederOrganisatieData}
            loading={loading || prefillLoading}
            schemas={schemas}
            aanbiederKeuze={aanbiederKeuze}
            setAanbiederKeuze={setAanbiederKeuze}
            aanbiederOptions={aanbiederOptions}
            aanbiederLoading={aanbiederLoading}
            aanbiederSearchLoading={aanbiederSearchLoading}
            searchAanbieders={searchAanbieders}
          />
        );
      case 'applicatie-informatie':
        return (
          <ConFormApplicatieInformatieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            loading={loading || prefillLoading}
            schemas={schemas}
            contactpersoonOptions={contactpersoonOptions}
            contactpersoonLoading={contactpersoonLoading}
            contactpersoonSearchLoading={contactpersoonSearchLoading}
            searchContactpersonen={searchContactpersonen}
          />
        );
      case 'licentie':
        return (
          <ConFormApplicatieLicentieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            loading={loading}
            schemas={schemas}
          />
        );
      case 'versies':
        return (
          <ConFormApplicatieVersieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            loading={loading}
            schemas={schemas}
            isEditMode={isEditMode}
          />
        );
      case 'referentiecomponenten':
        return (
          <ConFormApplicatieReferentiecomponentenStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            referentieComponentenOptions={referentieComponentenOptions}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            setReferentieComponentenWithStandards={
              setReferentieComponentenWithStandards
            }
            schemas={schemas}
            loading={loading}
            referentieComponentenLoading={referentieComponentenLoading}
          />
        );
      case 'standaarden':
        return (
          <ConFormApplicatieStandaardenStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
            standaardenversiesOptions={standaardenversiesOptions}
            standaardenversiesOptionsLoading={standaardenversiesOptionsLoading}
            selectedExtraStandards={selectedExtraStandards}
            setSelectedExtraStandards={setSelectedExtraStandards}
          />
        );
      case 'koppelingen':
        return (
          <ConFormApplicatieKoppelingenStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            modulesOptions={modulesOptions}
            modulesLoading={modulesLoading}
            buitengemeentelijkeOptions={buitengemeentelijkeOptions}
            buitengemeentelijkeOptionsLoading={buitengemeentelijkeOptionsLoading}
            koppelingenFormState={koppelingenFormState}
            setKoppelingenFormState={setKoppelingenFormState}
            searchModules={searchModules}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
          />
        );
      case 'controleren':
        return (
          <ConFormApplicatieControlerenStage
            applicatie={applicatie}
            aanbiederOrganisatie={aanbiederOrganisatie}
            aanbiederKeuze={aanbiederKeuze}
            referentieComponentenOptions={referentieComponentenOptions}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            standaardenOptions={standaardenOptions}
            modulesOptions={modulesOptions}
            buitengemeentelijkeOptions={buitengemeentelijkeOptions}
            schemas={schemas}
            formType={formType}
            store={store}
          />
        );
      default:
        return null;
    }
  };

  const currentStepName = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    switch (stepLabel) {
      case 'aanbieder':
        return 'Aanbieder';
      case 'applicatie-informatie':
        return 'Informatie over uw applicatie';
      case 'licentie':
        return 'Licentie en Hosting informatie';
      case 'versies':
        return 'Laat weten welke versies er zijn';
      case 'referentiecomponenten':
        return 'Koppel uw applicatie aan de GEMMA';
      case 'standaarden':
        return 'Selecteer de standaarden voor uw applicatie';
      case 'koppelingen':
        return 'Koppelingen met andere applicaties';
      case 'controleren':
        return 'Controleer uw gegevens';
      default:
        return '';
    }
  };

  const getDisabledStatus = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Aanbieder step - only for 'ontbrekend-applicatie' type
    if (stepLabel === 'aanbieder') {
      // If user selected "bestaand", check if aanbieder is selected
      if (aanbiederKeuze === 'bestaand') {
        return !applicatie.aanbieder || !String(applicatie.aanbieder).trim();
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

      // Validate email format if provided
      if (
        aanbiederOrganisatie['e-mailadres'] &&
        String(aanbiederOrganisatie['e-mailadres']).trim()
      ) {
        const email = String(aanbiederOrganisatie['e-mailadres']).trim();
        if (!validateEmail(email)) {
          return true;
        }
      }

      // Validate phone format if provided
      if (
        aanbiederOrganisatie.telefoonnummer &&
        String(aanbiederOrganisatie.telefoonnummer).trim()
      ) {
        const phone = String(aanbiederOrganisatie.telefoonnummer).trim();
        if (!validatePhone(phone)) {
          return true;
        }
      }

      return missingNewOrgFields.length > 0;
    }

    // Applicatie informatie: naam, website, and beschrijvingKort are required
    if (stepLabel === 'applicatie-informatie') {
      // Check naam is filled
      if (!applicatie.naam?.trim?.()) {
        return true;
      }
      // Check website is filled
      if (!applicatie.website?.trim?.()) {
        return true;
      }
      // Check beschrijvingKort is filled
      if (!applicatie.beschrijvingKort?.trim?.()) {
        return true;
      }
      // Validate website format if provided
      if (applicatie.website && !validateWebsite(applicatie.website)) {
        return true;
      }
      return false;
    }
    // licentie: licentietype is required, and licentie is required when open source is selected
    if (stepLabel === 'licentie') {
      // Check if licentietype is filled
      if (!applicatie.licentietype || applicatie.licentietype.trim() === '') {
        return true;
      }
      // If open source is selected, licentie is also required
      if (applicatie.licentietype === 'Open source') {
        return !applicatie.licentie || applicatie.licentie.trim() === '';
      }
    }

    // Versies step: versie, status, and startdatum are required for each version
    if (stepLabel === 'versies' && shouldShowVersiesStep()) {
      if (
        Array.isArray(applicatie.moduleVersies) &&
        applicatie.moduleVersies.length > 0
      ) {
        // Check if all versions have versie, status, and corresponding datum filled
        const hasInvalidVersions = applicatie.moduleVersies.some((versie) => {
          const missingVersie = !versie.versie || !String(versie.versie).trim();
          const missingStatus = !versie.status || !String(versie.status).trim();

          // Check if the corresponding datum field is filled based on status
          let missingDatum = false;
          if (versie.status) {
            const datumProperty = {
              'in gebruik': 'datumInGebruik',
              'in ontwikkeling': 'datumInOntwikkeling',
              'einde ondersteuning': 'datumEindeOndersteuning',
              teruggetrokken: 'datumTeruggetrokken',
            }[versie.status];

            if (datumProperty) {
              missingDatum =
                !versie[datumProperty] || !String(versie[datumProperty]).trim();
            }
          }

          return missingVersie || missingStatus || missingDatum;
        });
        if (hasInvalidVersions) {
          return true;
        }
      }
    }

    // Standaarden step: validate URLs in compliancy array
    if (stepLabel === 'standaarden') {
      if (Array.isArray(applicatie.compliancy)) {
        const invalidUrls = applicatie.compliancy.filter(
          (comp) =>
            comp.url &&
            String(comp.url).trim() &&
            !validateWebsite(String(comp.url).trim())
        );
        if (invalidUrls.length > 0) {
          return true;
        }
      }
    }

    // Koppelingen step: validate that all started koppelingen have a naam
    // A koppeling is considered "started" if it has moduleB filled in
    // Empty koppelingen (no moduleB) are ignored - koppelingen are optional
    if (stepLabel === 'koppelingen') {
      if (Array.isArray(applicatie.koppelingen)) {
        const startedKoppelingenWithoutNaam = applicatie.koppelingen.filter((kp) => {
          // Check if koppeling has moduleB (meaning it was started)
          const hasModuleB = kp.moduleB != null && String(kp.moduleB).trim() !== '';
          // Check if naam is missing
          const missingNaam = !kp.naam || !String(kp.naam).trim();
          // Only flag as invalid if started but missing naam
          return hasModuleB && missingNaam;
        });
        if (startedKoppelingenWithoutNaam.length > 0) {
          return true;
        }
      }
    }

    return false;
  };

  const getDisabledTooltip = () => {
    const stepLabel = stepper.getLabelFromStep(stepper.getCurrentStep());

    // Aanbieder step validation messages
    if (stepLabel === 'aanbieder') {
      if (aanbiederKeuze === 'bestaand') {
        if (!applicatie.aanbieder || !String(applicatie.aanbieder).trim()) {
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
        if (
          aanbiederOrganisatie['e-mailadres'] &&
          !validateEmail(String(aanbiederOrganisatie['e-mailadres']).trim())
        ) {
          return 'E-mailadres heeft een ongeldig formaat';
        }
        if (
          aanbiederOrganisatie.telefoonnummer &&
          !validatePhone(String(aanbiederOrganisatie.telefoonnummer).trim())
        ) {
          return 'Telefoonnummer heeft een ongeldig formaat';
        }
      }
    }

    if (stepLabel === 'applicatie-informatie') {
      if (!applicatie.naam || applicatie.naam.trim() === '') {
        return 'Vul de naam van de applicatie in';
      }
      if (!applicatie.website || applicatie.website.trim() === '') {
        return 'Vul de website van de applicatie in';
      }
      if (
        !applicatie.beschrijvingKort ||
        applicatie.beschrijvingKort.trim() === ''
      ) {
        return 'Vul een korte beschrijving van de applicatie in';
      }
      if (applicatie.website && !validateWebsite(applicatie.website)) {
        return 'Website heeft een ongeldig formaat';
      }
    }

    if (stepLabel === 'licentie') {
      if (!applicatie.licentietype || applicatie.licentietype.trim() === '') {
        return 'Selecteer een licentievorm';
      }
      if (
        applicatie.licentietype === 'Open source' &&
        (!applicatie.licentie || applicatie.licentie.trim() === '')
      ) {
        return 'Selecteer een licentie';
      }
    }

    // Versies step validation messages
    if (stepLabel === 'versies' && shouldShowVersiesStep()) {
      if (
        Array.isArray(applicatie.moduleVersies) &&
        applicatie.moduleVersies.length > 0
      ) {
        const versieWithoutVersie = applicatie.moduleVersies.find(
          (versie) => !versie.versie || !String(versie.versie).trim()
        );
        if (versieWithoutVersie) {
          return 'Vul het versienummer in voor alle versies';
        }
        const versieWithoutStatus = applicatie.moduleVersies.find(
          (versie) => !versie.status || !String(versie.status).trim()
        );
        if (versieWithoutStatus) {
          return 'Selecteer een status voor alle versies';
        }
        // Check for missing datum based on status
        const versieWithoutDatum = applicatie.moduleVersies.find((versie) => {
          if (!versie.status) return false;
          const datumProperty = {
            'in gebruik': 'datumInGebruik',
            'in ontwikkeling': 'datumInOntwikkeling',
            'einde ondersteuning': 'datumEindeOndersteuning',
            teruggetrokken: 'datumTeruggetrokken',
          }[versie.status];
          if (!datumProperty) return false;
          return !versie[datumProperty] || !String(versie[datumProperty]).trim();
        });
        if (versieWithoutDatum) {
          return 'Vul de startdatum status in voor alle versies';
        }
      }
    }

    if (stepLabel === 'standaarden') {
      if (Array.isArray(applicatie.compliancy)) {
        const invalidUrl = applicatie.compliancy.find(
          (comp) =>
            comp.url &&
            String(comp.url).trim() &&
            !validateWebsite(String(comp.url).trim())
        );
        if (invalidUrl) {
          return 'Een of meer URLs in de compliancy hebben een ongeldig formaat';
        }
      }
    }

    if (stepLabel === 'koppelingen') {
      if (Array.isArray(applicatie.koppelingen)) {
        const startedKoppelingWithoutNaam = applicatie.koppelingen.find((kp) => {
          // Check if koppeling has moduleB (meaning it was started)
          const hasModuleB = kp.moduleB != null && String(kp.moduleB).trim() !== '';
          // Check if naam is missing
          const missingNaam = !kp.naam || !String(kp.naam).trim();
          // Only flag as invalid if started but missing naam
          return hasModuleB && missingNaam;
        });
        if (startedKoppelingWithoutNaam) {
          return 'Vul voor alle koppelingen de naam in';
        }
      }
    }

    return '';
  };

  const getPageDescription = (formType) => {
    switch (formType) {
      case 'eigen':
        return 'Vul dit formulier in om een door u aangeboden applicatie toe te voegen aan de softwarecatalogus.';
      case 'ontbrekend-applicatie':
        return 'Meld een applicatie die nog niet in de catalogus staat en registreer deze.';
      default:
        return 'Registreer een nieuwe applicatie in de softwarecatalogus.';
    }
  };

  const {
    icon: Icon,
    name: wizardName,
    schema: wizardSchema,
  } = useMemo(() => getActiveWizard() || {}, [formType]);
  const capitalizedSchema = _.capitalize(wizardSchema);
  const editModeTitle = `${capitalizedSchema} updaten`;

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <div>
                <Heading1
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Icon style={{ width: '1em', height: '1em' }} />
                  Uw {isEditMode ? editModeTitle : wizardName}
                </Heading1>
                <Paragraph>
                  {isEditMode
                    ? 'Werk uw applicatiegegevens bij in onze catalogus.'
                    : getPageDescription(formType)}
                </Paragraph>
              </div>

              {/* Error state for prefill */}
              {prefillError && (
                <Alert type='error'>
                  <Paragraph>
                    <strong>Fout bij het laden van applicatie</strong>
                  </Paragraph>
                  <Paragraph>{prefillError}</Paragraph>
                  <AcButton
                    style='button'
                    buttonType='secondary'
                    onClick={() => navigate('/beheer')}
                  >
                    Terug naar beheer
                  </AcButton>
                </Alert>
              )}

              {/* Show form always (even during loading), hide only on error */}
              {!prefillError && (
                <>
                  <div>
                    <h3
                      className={clsx(
                        'utrecht-heading-3',
                        'ac-register-form-heading'
                      )}
                    >
                      {currentStepName()}
                    </h3>

                    {registerCallBack === 'error' && error.message && (
                      <Alert type='error'>
                        <Paragraph>{error.message}</Paragraph>
                        {error.errors && (
                          <UnorderedList>
                            {Object.entries(error.errors).map(
                              ([field, messages]) => (
                                <UnorderedListItem key={field}>
                                  <strong>{field}:</strong>{' '}
                                  {Array.isArray(messages)
                                    ? messages.join(', ')
                                    : messages}
                                </UnorderedListItem>
                              )
                            )}
                          </UnorderedList>
                        )}
                      </Alert>
                    )}

                    <AcColumn gap='sm'>
                      <div className='ac-register-container ac-forms-applicatie'>
                        <div
                          ref={processStepsRef}
                          className='ac-register-process-steps'
                        >
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
                          <div tabIndex='-1' id='formStart'></div>

                          {/* Debug JSON Display - only in development */}
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
                                  🐛 Debug: Applicatie Object (Click to expand)
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
                                  {JSON.stringify(applicatie, null, 2)}
                                </pre>
                              </details>

                              <pre>Step {stepper.getCurrentStep()}</pre>
                            </div>
                          )}

                          {renderStep()}

                          <div
                            className={clsx(
                              'ac-register-form-buttons',
                              stepper.getCurrentStep() !== 1 &&
                                'ac-register-form-buttons-not-first-step'
                            )}
                          >
                            {stepper.getCurrentStep() !== 1 && (
                              <AcButton
                                style='button'
                                buttonType='secondary'
                                icon={<VISUALS.ARROW_LEFT />}
                                onClick={() => {
                                  stepper.previous();
                                }}
                                disabled={loading || prefillLoading}
                              >
                                Vorige
                              </AcButton>
                            )}
                            {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                              'aanbieder' &&
                              formType === 'ontbrekend-applicatie' && (
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
                            {stepper.getLabelFromStep(stepper.getCurrentStep()) !==
                              'controleren' && (
                              <AcButton
                                style='button'
                                className={clsx(
                                  stepper.getCurrentStep() === 1 &&
                                    'ac-register-form-next-button'
                                )}
                                icon={<VISUALS.ARROW_RIGHT />}
                                disabled={
                                  getDisabledStatus() ||
                                  loading ||
                                  prefillLoading ||
                                  schemasLoading
                                }
                                onClick={() => {
                                  focusForm();
                                  stepper.next();
                                }}
                                title={
                                  getDisabledStatus() ? getDisabledTooltip() : ''
                                }
                              >
                                Volgende
                              </AcButton>
                            )}

                            {stepper.getLabelFromStep(stepper.getCurrentStep()) ===
                              'controleren' && (
                              <AcButton
                                style='button'
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
                                  ? 'Applicatie updaten'
                                  : redirect
                                  ? 'Applicatie aanmelden en terug naar vorige wizard'
                                  : 'Applicatie aanmelden'}
                              </AcButton>
                            )}
                          </div>
                        </div>
                      </div>
                    </AcColumn>
                  </div>
                </>
              )}
            </>
          )}

          {/* Success Feedback Page */}
          {registerCallBack === 'success' && (
            <div>
              <Heading1>
                {isEditMode
                  ? '🎉 Applicatie succesvol geüpdatet!'
                  : '🎉 Applicatie succesvol aangemeld!'}
              </Heading1>

              <Alert type='ok'>
                <Paragraph>
                  <strong>
                    {isEditMode
                      ? 'Uw applicatie is succesvol bijgewerkt!'
                      : 'Uw applicatie is succesvol geregistreerd!'}
                  </strong>
                </Paragraph>
                <Paragraph>
                  De applicatie {applicatie.naam || 'Onbekende applicatie'} is
                  opgeslagen in de softwarecatalogus.
                </Paragraph>
              </Alert>

              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <UnorderedList>
                  <UnorderedListItem>
                    De applicatie wordt zichtbaar in de softwarecatalogus
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Organisaties kunnen de applicatie bekijken en beoordelen
                  </UnorderedListItem>
                  <UnorderedListItem>
                    U kunt de applicatie beheren via het beheer dashboard
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
                  icon={<VISUALS.CUBES />}
                  onClick={() => {
                    // Navigate to a clean applicatie form without any query parameters
                    navigate(window.location.pathname, { replace: true });
                  }}
                  sx={{ marginLeft: '1rem' }}
                >
                  Nieuwe applicatie aanmelden
                </AcButton>
              </div>
            </div>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

const AcFormsApplicatie = ({ userStore, store }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const formType = searchParams.get('type') || '';
  const applicatieId = searchParams.get('id') || '';
  const redirect = searchParams.get('redirect') || '';

  const handleClearApplicatieId = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('id');
    setSearchParams(next);
    // Hard reset form UI to initial state
    // Keep current route, only drop id
  }, [searchParams, setSearchParams]);

  if (!formType) {
    return <ConFormApplicatieTypeSelectStage />;
  }

  return (
    <AcFormsApplicatieInner
      userStore={userStore}
      store={store}
      formType={formType}
      applicatieId={applicatieId}
      redirect={redirect}
      onClearApplicatieId={handleClearApplicatieId}
    />
  );
};

export default withStore(observer(AcFormsApplicatie));
