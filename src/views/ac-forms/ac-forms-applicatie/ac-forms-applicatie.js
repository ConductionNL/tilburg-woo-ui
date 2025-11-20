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
import { useDebouncedInput } from '@src/hooks';
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
import ConFormApplicatieDienstenStage from './components/con-form-applicatie-diensten-stage';
import ConFormApplicatieControlerenStage from './components/con-form-applicatie-controleren-stage';
import ConFormApplicatieAanbiederInformatieStage from './components/con-form-applicatie-aanbieder-informatie-stage';

// Utils
import { getStatusMultiStep } from './utils/steps.utils';
import { getActiveWizard } from '@src/constants/wizards.constants';

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

const AcFormsApplicatieInner = ({
  userStore,
  store,
  formType,
  applicatieId,
  redirect,
}) => {
  //   TODO: Remove info log when userStore is fully implemented
  console.info('userStore', userStore);

  // Determine edit mode from applicatieId
  const isEditMode = !!applicatieId;
  const navigate = useNavigate();

  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(5);

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
    naam: 'Testing test to test test',
    type: 'Leverancier',
    website: 'testing.test',
    'e-mailadres': 'test@test.nl',
    telefoonnummer: '+31789456123',
  });

  /**
   * Applicatie State Object
   *
   * This object holds all applicatie data that will be submitted to the API.
   */
  const [applicatie, setApplicatie] = useState({
    naam: 'test',
    beschrijvingKort: 'test',
    beschrijvingLang: '# test\n~~test but striketrough~~',
    website: 'test.test.test',
    contactpersoon: '499f5e42-9c1c-4efd-97ca-7c310e8dcf9a',
    cloudDienstverleningsmodel: ['IaaS', 'On-premises (self-managed)'],
    hostingJurisdictie: 'NL',
    hostingLocatie: 'EU',
    aanbieder: null,
    licentietype: 'Open source',
    licentie: 'GNU General Public License (GPL)',
    referentieComponenten: [
      '46214411-71a5-4533-a813-b44e3da2aafc',
      'e3a3a9b3-b778-4e12-a6a3-f72384a7fac7',
      'f1038d7e-b993-44ae-b325-3bf00993334a',
    ],
    type: 'Applicatie',
    logo: 'data:image/png;base64,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',
    omvat: [],
    onderdeelVan: [],
    diensten: [
      {
        _localId: 'dienst_mi5qvvpo_q4f9v1',
        type: 'Opleidingen',
        naam: 'test',
        aanbieder: null,
      },
    ],
    koppelingen: [
      {
        _localId: 'kpl_mi5qvkon_j54uao',
        moduleA: 'test',
        moduleB: '83039237-2520-464a-947f-454193dd550a',
        richtingDataUitwisseling: 'AnaarB',
        soortKoppeling: 'n.v.t',
      },
      {
        _localId: 'kpl_mi5qvnpa_ujigl5',
        moduleA: 'test',
        moduleB: '55e5cac0-b3e0-4667-864f-d1f8fb20ee80',
        richtingDataUitwisseling: 'bi-directioneel',
        soortKoppeling: 'digikoppeling',
      },
      {
        _localId: 'kpl_mi5qvs9y_gnh13i',
        moduleA: 'test',
        moduleB: 'b04b82b1-3c02-4ab2-bd48-0e0df9791cea',
        richtingDataUitwisseling: 'BnaarA',
        soortKoppeling: 'upload naar portaal',
      },
    ],
    compliancy: [
      {
        standaardversie: 'id-b49e98a1-8db0-11e3-67ab-0050568a6153',
        standaardGemma: 'b49e98a1-8db0-11e3-67ab-0050568a6153',
        standaardnaam: 'Afsprakenstelsel eHerkenning - Koppelvlak DV-HM',
        bewijs: null,
        bewijsFilename: null,
        url: null,
      },
      {
        standaardversie: 'id-bd2313c1-8db0-11e3-67ab-0050568a6153',
        standaardGemma: 'bd2313c1-8db0-11e3-67ab-0050568a6153',
        standaardnaam: 'StUF HR',
        bewijs: null,
        bewijsFilename: null,
        url: null,
      },
      {
        standaardversie: 'id-b630d161-8db0-11e3-67ab-0050568a6153',
        standaardGemma: 'b630d161-8db0-11e3-67ab-0050568a6153',
        standaardnaam: 'Betalen en invorderen services',
        bewijs: null,
        bewijsFilename: null,
        url: 'www.test.nl',
      },
      {
        standaardversie: 'id-be7c3b21-8db0-11e3-67ab-0050568a6153',
        standaardGemma: 'be7c3b21-8db0-11e3-67ab-0050568a6153',
        standaardnaam: 'Zaak- en documentservices',
        bewijs: null,
        bewijsFilename: null,
        url: null,
      },
      {
        standaardversie: '7133d1be-ad54-4aba-ad99-cb2b14f13287',
        standaardGemma: '7133d1be-ad54-4aba-ad99-cb2b14f13287',
        standaardnaam: 'BAG Individuele Bevragingen API-standaard',
        bewijs: null,
        bewijsFilename: null,
        url: null,
      },
    ],
    standaarden: [
      'id-b49e98a1-8db0-11e3-67ab-0050568a6153',
      'id-bd2313c1-8db0-11e3-67ab-0050568a6153',
      'id-b630d161-8db0-11e3-67ab-0050568a6153',
      'id-be7c3b21-8db0-11e3-67ab-0050568a6153',
      '7133d1be-ad54-4aba-ad99-cb2b14f13287',
    ],
    standaardenGemma: [
      'b49e98a1-8db0-11e3-67ab-0050568a6153',
      'bd2313c1-8db0-11e3-67ab-0050568a6153',
      'b630d161-8db0-11e3-67ab-0050568a6153',
      'be7c3b21-8db0-11e3-67ab-0050568a6153',
      '7133d1be-ad54-4aba-ad99-cb2b14f13287',
    ],
    moduleVersies: [
      {
        versie: '9.25.55',
        status: 'in ontwikkeling',
      },
      {
        versie: '1.0.0',
        status: 'in gebruik',
      },
    ],
    gebruiken: [],
    beoordelingen: [],
    kwetsbaarheden: [],
    licentieType: 'Open source',
  });

  // Ref for ProcessSteps container
  const processStepsRef = useRef(null);

  /**
   * Check if Versies step should be shown based on cloud service model
   * @returns {boolean} True if Versies step should be shown
   */
  const shouldShowVersiesStep = useCallback(() => {
    return (applicatie?.cloudDienstverleningsmodel || '').includes(
      'On-premises (self-managed)'
    );
  }, [applicatie?.cloudDienstverleningsmodel]);

  /**
   * Helper function to get the correct step index accounting for optional steps
   * Accounts for the optional Aanbieder step (only shown for ontbrekend-applicatie)
   * and the optional Versies step (only shown for On-premises)
   * @param {number} logicalStep - The logical step number
   * Logical steps: 0=Aanbieder, 1=Applicatie info, 2=Licentie, 3=Versies, 4=Referentiecomponenten,
   *                5=Standaarden, 6=Koppelingen, 7=Diensten, 8=Controleren
   * @returns {number} The adjusted physical step index
   */
  const getAdjustedStepIndex = useCallback(
    (logicalStep) => {
      let index = logicalStep;

      // If Aanbieder step is not shown and we're past it, adjust the index
      if (formType !== 'ontbrekend-applicatie' && logicalStep > 0) {
        index -= 1;
      }

      // If Versies step is not shown and we're past it, adjust the index
      if (!shouldShowVersiesStep() && logicalStep > 3) {
        index -= 1;
      }

      return index;
    },
    [formType, shouldShowVersiesStep]
  );

  /**
   * Convert physical step index to logical step number
   * Accounts for optional steps (Aanbieder and Versies)
   * @param {number} physicalStep - The physical step index
   * @returns {number} The logical step number
   */
  const getLogicalStepFromPhysical = useCallback(
    (physicalStep) => {
      // Start with physical step
      let logicalStep = physicalStep;

      // For eigen type, add 1 to account for skipped Aanbieder step
      if (formType === 'eigen') {
        logicalStep += 1;
      }

      // If Versies step is not shown, skip logical step 3
      if (!shouldShowVersiesStep()) {
        // If we're at or past where Versies would be (logical step 3), add 1 to skip it
        if (logicalStep >= 3) {
          logicalStep += 1;
        }
      }

      return logicalStep;
    },
    [formType, shouldShowVersiesStep]
  );

  /**
   * Generate a mapping of visual step indices to actual step indices
   * This must match the order in which ProcessSteps renders clickable elements
   * @returns {number[]} Array where index is visual position, value is actual step index
   */
  const generateStepIndexMapping = useCallback(() => {
    const mapping = [];

    if (formType === 'ontbrekend-applicatie') {
      // Main step 1 header (Applicatie informatie)
      mapping.push(getAdjustedStepIndex(0));
      // Sub-step: Aanbieder
      mapping.push(getAdjustedStepIndex(0));
      // Sub-step: Applicatie gegevens
      mapping.push(getAdjustedStepIndex(1));
    } else {
      // Main step 1: Applicatie informatie (no sub-steps)
      mapping.push(getAdjustedStepIndex(1));
    }

    // Main step 2 header (Applicatie configuratie)
    mapping.push(getAdjustedStepIndex(2));
    // Sub-steps under Applicatie configuratie
    mapping.push(getAdjustedStepIndex(2)); // Licentie

    // Conditionally include Versies step
    if (shouldShowVersiesStep()) {
      mapping.push(getAdjustedStepIndex(3)); // Versies
    }

    mapping.push(getAdjustedStepIndex(4)); // Referentiecomponenten
    mapping.push(getAdjustedStepIndex(5)); // Standaarden
    mapping.push(getAdjustedStepIndex(6)); // Koppelingen
    mapping.push(getAdjustedStepIndex(7)); // Diensten

    // Main step 3: Controleren
    mapping.push(getAdjustedStepIndex(8));

    return mapping;
  }, [formType, getAdjustedStepIndex, shouldShowVersiesStep]);

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

  const [touched, setTouched] = useState({
    naam: false,
  });

  // Schema definitions for form generation
  const [schemas, setSchemas] = useState({
    module: null,
    product: null,
    moduleversie: null,
    dienst: null,
  });
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Referentiecomponenten options with search functionality
  const [referentieComponentenOptions, setReferentieComponentenOptions] = useState(
    []
  );
  const [referentieComponentenLoading, setReferentieComponentenLoading] =
    useState(false);

  // Separate array to track chosen referentieComponenten with their standards
  // Structure: [{ id, naam, aanbevolenStandaarden: [], verplichteStandaarden: [], applicatieId }]
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Standaarden options with search functionality
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenOptionsLoading, setStandaardenOptionsLoading] = useState(false);
  // Extra standards selected via multi-select (not from referentieComponenten)
  const [selectedExtraStandards, setSelectedExtraStandards] = useState([]);

  // Modules options with search functionality for koppelingen
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Add state for external facilities options
  const [buitengemeentelijkeOptions, setBuitengemeentelijkeOptions] = useState([]);
  const [buitengemeentelijkeOptionsLoading, setBuitengemeentelijkeOptionsLoading] =
    useState(false);

  // Koppelingen form state
  const [koppelingenFormState, setKoppelingenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedAppAByRow: {},
    selectedAppBByRow: {},
    directionByRow: {},
    typeByRow: {},
    koppelingIdByRow: {},
  });

  // Diensten form state
  const [dienstenFormState, setDienstenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedDienstByRow: {},
    dienstNaamByRow: {},
    dienstIdByRow: {},
  });

  // Diensten options from schema enum
  const dienstOptions = useMemo(() => {
    const dienstSchema = schemas?.dienst;
    const typeProperty = dienstSchema?.properties?.type;

    if (typeProperty?.enum && Array.isArray(typeProperty.enum)) {
      return typeProperty.enum.map((value) => {
        // Try to get description from schema first, then fall back to the enum value itself
        const schemaDescription =
          typeProperty.enumDescriptions?.[typeProperty.enum.indexOf(value)];

        // Use schema description if available, otherwise use the enum value as the label
        const label = schemaDescription || value;

        return {
          value,
          label,
        };
      });
    }
    return [];
  }, [schemas?.dienst]);

  /**
   * Generate a default/empty applicatie object based on the applicatie schema using ObjectStore
   * @param {Object} applicatieSchema - The applicatie schema object
   * @returns {Object} Default applicatie object with schema-based properties
   */
  const createDefaultApplicatieFromSchema = useCallback(
    (applicatieSchema) => {
      // Use the centralized ObjectStore method for schema-based object creation
      const defaultApplicatie =
        store.object.createDefaultObjectFromSchema(applicatieSchema);

      return defaultApplicatie;
    },
    [store.object]
  );

  const setApplicatieData = useCallback((key, value) => {
    setApplicatie((prev) => {
      // Handle function updates (for koppelingen array updates)
      if (typeof value === 'function') {
        return { ...prev, [key]: value(prev[key]) };
      }
      return { ...prev, [key]: value };
    });
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const setAanbiederOrganisatieData = useCallback((key, value) => {
    setAanbiederOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch schema definitions on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setSchemasLoading(true);
      const schemaTypes = [
        'module',
        'product',
        'moduleversie',
        'organisatie',
        'dienst',
      ];
      const fetchedSchemas = {};

      try {
        const schemaPromises = schemaTypes.map(async (schemaType) => {
          try {
            // Use object store's fetchSchema method which includes authentication
            await store.object.fetchSchema(schemaType);
            const schema = store.object.getSchema(`schema_${schemaType}`);
            return { schemaType, schema };
          } catch (error) {
            console.error(`Failed to fetch schema for ${schemaType}:`, error);
            return { schemaType, schema: null };
          }
        });

        const results = await Promise.all(schemaPromises);
        results.forEach(({ schemaType, schema }) => {
          fetchedSchemas[schemaType] = schema;
        });

        setSchemas(fetchedSchemas);

        // Update applicatie object with schema-based defaults if applicatie schema was loaded
        if (fetchedSchemas.module) {
          setApplicatie((prevApplicatie) => {
            // Only update if current product is the default/empty state
            // Don't override if user has already started filling the form
            const isEmpty =
              !prevApplicatie.naam && !prevApplicatie.cloudDienstverleningsmodel;
            if (isEmpty) {
              return createDefaultApplicatieFromSchema(fetchedSchemas.module);
            }
            return prevApplicatie;
          });
        }
      } catch (error) {
        console.error('Failed to fetch schemas:', error);
      } finally {
        setSchemasLoading(false);
      }
    };

    fetchSchemas();
  }, [createDefaultApplicatieFromSchema]);

  // Prefill applicatie data when editing
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode || !applicatieId) return;
      if (schemasLoading) return; // Wait for schemas to load first

      setPrefillLoading(true);
      setPrefillError(null);
      try {
        // Fetch the applicatie object with extended koppelingen and diensten
        await store.object.fetchObject(
          'voorzieningen',
          'module',
          String(applicatieId),
          {
            _extend: ['@self.schema', 'koppelingen', 'diensten'],
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

        // Helper function to extract ID from object or string
        const mapId = (item) =>
          item && typeof item === 'object'
            ? String(item.id || item.value || item.uuid || item.slug || '')
            : String(item || '');

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
          `${commongroundApiUrl()}/openconnector/api/user/me`,
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

  // Function to load referentiecomponenten
  const loadReferentieComponenten = useCallback(async () => {
    if (!schemas?.module) return; // Wait for schemas to load

    console.info('📋 Loading referentiecomponenten...');
    setReferentieComponentenLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
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
  }, [schemas?.module]);

  // ✅ Load referentiecomponenten when schemas are available
  useEffect(() => {
    if (!schemas?.module) return;

    // Only load if we haven't loaded yet and we're not currently loading
    const shouldLoadRefs =
      referentieComponentenOptions.length === 0 && !referentieComponentenLoading;

    if (shouldLoadRefs) {
      loadReferentieComponenten();
    }
  }, [schemas?.module]);

  // Function to load standaarden
  const loadStandaarden = useCallback(async () => {
    if (!schemas?.module) return;

    console.info('📋 Loading standaarden...');
    setStandaardenOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
        '_extend[]': '@self.schema',
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
  }, [schemas?.module]);

  // ✅ Load standaarden when schemas are available
  useEffect(() => {
    if (!schemas?.module) return;

    // Only load if we haven't loaded yet and we're not currently loading
    const shouldLoadStandards =
      standaardenOptions.length === 0 && !standaardenOptionsLoading;

    if (shouldLoadStandards) {
      loadStandaarden();
    }
  }, [schemas?.module]);

  // Initialize selectedExtraStandards from existing compliancy data
  useEffect(() => {
    if (standaardenOptions.length === 0) return;
    if (selectedExtraStandards.length > 0) return; // Already initialized

    const existingCompliancy = applicatie.compliancy || [];
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
    applicatie.compliancy,
    selectedExtraStandards.length,
  ]);

  // Function to search modules with debouncing using object store cache
  const performModulesSearch = useCallback(
    async (searchTerm = '') => {
      setModulesLoading(true);

      try {
        const queryParams = {
          _limit: '20',
          _page: '1',
        };

        // Add search parameter if provided
        if (searchTerm && searchTerm.trim()) {
          queryParams._search = searchTerm.trim();
        }

        console.info(
          `📋 Searching modules via object store cache (term: "${searchTerm}")...`
        );

        // Use object store cache-first method for immediate response
        const list = await store.object.fetchModulesCacheFirst(queryParams);

        const mapToOption = (item, index) => {
          const label =
            item?.naam ||
            item?.['@self']?.name ||
            item?.name ||
            item?.title ||
            item?.label ||
            (item?.id ? String(item.id) : `Applicatie ${index + 1}`);
          const value = item?.value || item?.id || item?.slug || label;
          return {
            value: String(value),
            label: String(label),
            data: item, // Store the full API data for later access
          };
        };

        const options = list.map(mapToOption).filter((o) => o.label && o.value);
        setModulesOptions(options);
        console.info(`✅ Loaded ${options.length} modules (cache-first)`);
      } catch (e) {
        console.error('Failed to fetch modules:', e);
        setModulesOptions([]);
      } finally {
        setModulesLoading(false);
      }
    },
    [store]
  );

  // ✅ Debounced search function for modules
  const debouncedModulesSearch = useDebouncedInput(performModulesSearch, 500);

  // ✅ Public search function that always debounces by 500ms (only on real typing)
  const searchModules = useCallback(
    (searchTerm = '') => {
      // Only trigger debounced fetch; component will ensure it's only called on typing
      setModulesLoading(true);
      debouncedModulesSearch(searchTerm || '');
    },
    [performModulesSearch, debouncedModulesSearch]
  );

  // Pre-load modules once so Applicatie B has initial options
  useEffect(() => {
    performModulesSearch('');
  }, [performModulesSearch]);

  // Function to load buitengemeentelijke voorzieningen
  const loadBuitengemeentelijkeVoorzieningen = useCallback(async () => {
    console.info('📋 Loading external facilities via object store cache...');
    setBuitengemeentelijkeOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Buitengemeentelijke voorziening',
        '_extend[]': '@self.schema',
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
          return { value: String(value), label: String(label), data: item };
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
  }, []);

  // Load buitengemeentelijke voorzieningen on mount
  useEffect(() => {
    loadBuitengemeentelijkeVoorzieningen();
  }, [loadBuitengemeentelijkeVoorzieningen]);

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

      koppelingen.forEach((kpl) => {
        const rowId = rowCounter++;
        nextRows.push(rowId);

        // Try to prefill Applicatie B by id when present in API data
        const moduleBId = (() => {
          if (!kpl) return null;
          // Check @self.relations first, then fall back to direct properties
          const relationsModuleB = kpl?.['@self']?.relations?.moduleB;
          if (relationsModuleB != null) return String(relationsModuleB);
          if (kpl.moduleBId != null) return String(kpl.moduleBId);
          if (kpl.moduleB != null) {
            // Accept both object reference and primitive id
            return String(
              typeof kpl.moduleB === 'object' ? kpl.moduleB?.id : kpl.moduleB
            );
          }
          return null;
        })();

        if (moduleBId != null) {
          nextSelectedAppBByRow[rowId] = moduleBId;
        }

        if (kpl && kpl.richtingDataUitwisseling) {
          nextDirectionByRow[rowId] = kpl.richtingDataUitwisseling;
        }

        if (kpl && kpl.soortKoppeling) {
          nextTypeByRow[rowId] = kpl.soortKoppeling;
        }

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
      });

      if (nextRows.length > 0) {
        setKoppelingenFormState((prev) => ({
          ...prev,
          rows: nextRows,
          nextRowId: nextRows.length,
          selectedAppBByRow: { ...prev.selectedAppBByRow, ...nextSelectedAppBByRow },
          directionByRow: { ...prev.directionByRow, ...nextDirectionByRow },
          typeByRow: { ...prev.typeByRow, ...nextTypeByRow },
          koppelingIdByRow: {
            ...prev.koppelingIdByRow,
            ...nextKoppelingIdByRow,
          },
        }));
      }
    }
  }, [applicatie?.koppelingen, koppelingenFormState.rows.length]);

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

  // Add click handlers to ProcessSteps after each render
  useEffect(() => {
    // Early return if ref doesn't exist, loading, or error state
    if (!processStepsRef.current) return;
    if (prefillLoading || prefillError) return;

    const addClickHandlers = () => {
      // Find all step elements in the DOM
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
    handleStepNavigation,
    generateStepIndexMapping,
    prefillLoading,
    prefillError,
  ]);

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

      let createdApplicatie = null;
      if (applicatieId) {
        // Edit mode: update existing applicatie via PUT
        await store.object.updateObject(
          'voorzieningen',
          'module',
          String(applicatieId),
          applicatieData
        );
        // For edit mode, use the existing applicatieId
        createdApplicatie = { id: applicatieId };
      } else {
        // Create mode: create new applicatie via POST
        createdApplicatie = await store.object.createObject(
          'voorzieningen',
          'module',
          applicatieData
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

  // Helper function to get step status
  /**
   * Get the status of a step for ProcessSteps component
   * @param {number} currentStep - The current active step
   * @param {number} step - The step to get status for
   * @returns {string} 'checked', 'current', or 'not-checked'
   */
  const getStatus = (currentStep, step) => {
    if (currentStep > step) return 'checked';
    if (currentStep === step) return 'current';
    return 'not-checked';
  };

  const renderStep = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        // Aanbieder - only for ontbrekend-applicatie
        return (
          <ConFormApplicatieAanbiederInformatieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            aanbiederOrganisatie={aanbiederOrganisatie}
            setAanbiederOrganisatieData={setAanbiederOrganisatieData}
            loading={loading}
            schemas={schemas}
            aanbiederKeuze={aanbiederKeuze}
            setAanbiederKeuze={setAanbiederKeuze}
          />
        );
      case 1:
        // Applicatie informatie
        return (
          <ConFormApplicatieInformatieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            loading={loading}
            touched={touched}
            schemas={schemas}
          />
        );
      case 2:
        // Licentie & Hosting
        return (
          <ConFormApplicatieLicentieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            loading={loading}
            touched={touched}
            schemas={schemas}
          />
        );
      case 3:
        // Versies - only shown for On-premises
        return (
          <ConFormApplicatieVersieStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            loading={loading}
            schemas={schemas}
          />
        );
      case 4:
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
      case 5:
        return (
          <ConFormApplicatieStandaardenStage
            applicatie={applicatie}
            setApplicatieData={setApplicatieData}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
            selectedExtraStandards={selectedExtraStandards}
            setSelectedExtraStandards={setSelectedExtraStandards}
          />
        );
      case 6:
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
          />
        );
      case 7:
        return (
          <ConFormApplicatieDienstenStage
            applicatie={applicatie}
            dienstOptions={dienstOptions}
            setApplicatieData={setApplicatieData}
            dienstenFormState={dienstenFormState}
            setDienstenFormState={setDienstenFormState}
          />
        );
      case 8:
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
            dienstOptions={dienstOptions}
            formType={formType}
            store={store}
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
        return 'Aanbieder';
      case 1:
        return 'Informatie over uw applicatie';
      case 2:
        return 'Licentie en Hosting informatie';
      case 3:
        return 'Laat weten welke versies er zijn';
      case 4:
        return 'Koppel uw applicatie aan de GEMMA';
      case 5:
        return 'Selecteer de standaarden voor uw applicatie';
      case 6:
        return 'Koppelingen met andere applicaties';
      case 7:
        return 'Diensten';
      case 8:
        return 'Controleer uw gegevens';
      default:
        return '';
    }
  };

  const getDisabledStatus = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    // Aanbieder step (logical step 0) - only for 'ontbrekend-applicatie' type
    if (logicalStep === 0 && formType === 'ontbrekend-applicatie') {
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

    // Applicatie informatie: naam is required
    if (logicalStep === 1) {
      return (
        !applicatie.naam?.trim?.() ||
        (applicatie.website && !validateWebsite(applicatie.website))
      );
    }
    // licentie: licentie is required when open source is selected
    if (logicalStep === 2) {
      if (applicatie.licentietype === 'Open source') {
        return !applicatie.licentie || applicatie.licentie.trim() === '';
      }
    }

    // Standaarden step: validate URLs in compliancy array
    if (logicalStep === 5) {
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

    return false;
  };

  const getDisabledTooltip = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    // Aanbieder step validation messages
    if (logicalStep === 0 && formType === 'ontbrekend-applicatie') {
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

    if (logicalStep === 1) {
      if (!applicatie.naam || applicatie.naam.trim() === '') {
        return 'Vul de naam van de applicatie in';
      }
      if (applicatie.website && !validateWebsite(applicatie.website)) {
        return 'Website heeft een ongeldig formaat';
      }
    }

    if (logicalStep === 5) {
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

              {/* Only show form if not loading and no error */}
              {!prefillLoading && !prefillError && (
                <>
                  <div>
                    <h3
                      className={clsx(
                        'utrecht-heading-3',
                        'ac-register-form-heading'
                      )}
                    >
                      {currentStepName(currentStep)}
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
                          <ProcessSteps
                            steps={[
                              {
                                id: 'applicatie-setup-step',
                                marker: 1,
                                status:
                                  formType === 'ontbrekend-applicatie'
                                    ? getStatusMultiStep(
                                        currentStep,
                                        getAdjustedStepIndex(0),
                                        getAdjustedStepIndex(0),
                                        getAdjustedStepIndex(1)
                                      )
                                    : getStatus(
                                        currentStep,
                                        getAdjustedStepIndex(1)
                                      ),
                                title: 'Applicatie informatie',
                                steps:
                                  formType === 'ontbrekend-applicatie'
                                    ? [
                                        {
                                          id: 'aanbieder-substep',
                                          status: getStatus(
                                            currentStep,
                                            getAdjustedStepIndex(0)
                                          ),
                                          title: 'Aanbieder',
                                        },
                                        {
                                          id: 'applicatie-info-substep',
                                          status: getStatus(
                                            currentStep,
                                            getAdjustedStepIndex(1)
                                          ),
                                          title: 'Applicatie gegevens',
                                        },
                                      ]
                                    : undefined,
                              },
                              {
                                id: 'applicatie-configuratie-step',
                                marker: 2,
                                status: getStatusMultiStep(
                                  currentStep,
                                  getAdjustedStepIndex(2),
                                  getAdjustedStepIndex(2),
                                  getAdjustedStepIndex(8)
                                ),
                                title: 'Applicatie configuratie',
                                steps: [
                                  {
                                    id: 'licentie-substep',
                                    status: getStatus(
                                      currentStep,
                                      getAdjustedStepIndex(2)
                                    ),
                                    title: 'Licentie / Hosting',
                                  },
                                  // Conditionally include Versies step for On-premises
                                  ...(shouldShowVersiesStep()
                                    ? [
                                        {
                                          id: 'versies-substep',
                                          status: getStatus(
                                            currentStep,
                                            getAdjustedStepIndex(3)
                                          ),
                                          title: 'Versies',
                                        },
                                      ]
                                    : []),
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
                                ],
                              },
                              {
                                id: 'applicatie-controleren-step',
                                marker: 3,
                                status: getStatus(
                                  currentStep,
                                  getAdjustedStepIndex(8)
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

                              <pre>Step {currentStep}</pre>
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
                                onClick={() => {
                                  setCurrentStep(currentStep - 1);
                                }}
                                disabled={loading || prefillLoading}
                              >
                                Vorige
                              </AcButton>
                            )}
                            {currentStep === 0 &&
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
                            {getLogicalStepFromPhysical(currentStep) !== 8 && (
                              <AcButton
                                style='button'
                                className={clsx(
                                  currentStep === 0 && 'ac-register-form-next-button'
                                )}
                                icon={<VISUALS.ARROW_RIGHT />}
                                disabled={
                                  getDisabledStatus(currentStep) ||
                                  loading ||
                                  prefillLoading ||
                                  schemasLoading
                                }
                                onClick={() => {
                                  focusForm();
                                  setCurrentStep(currentStep + 1);
                                }}
                                title={
                                  getDisabledStatus(currentStep)
                                    ? getDisabledTooltip(currentStep)
                                    : ''
                                }
                              >
                                Volgende
                              </AcButton>
                            )}

                            {getLogicalStepFromPhysical(currentStep) === 8 && (
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
