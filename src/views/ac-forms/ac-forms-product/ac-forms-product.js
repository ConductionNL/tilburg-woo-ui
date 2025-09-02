import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { useDebouncedInput } from '@src/hooks/index';

import {
  Heading1,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import { validateWebsite } from '@views/ac-forms/validation/form-validations';

// Stage Components
import ConFormProductopbouwStage from './components/con-form-productopbouw-stage';
import ConFormProductInformatieStage from './components/con-form-product-informatie-stage';
import ConFormStandaardenStage from './components/con-form-standaarden-stage';
import ConFormAanbiederInformatieStage from './components/con-form-aanbieder-informatie-stage';
import ConFormApplicatieStage from './components/con-form-applicatie-stage';
import ConFormLicentieStage from './components/con-form-licentie-stage';
import ConFormModuleVersieStage from './components/con-form-module-versie-stage';
import ConFormReferentiecomponentenStage from './components/con-form-referentiecomponenten-stage';
import ConFormKoppelingenStage from './components/con-form-koppelingen-stage';
import ConFormDienstenStage from './components/con-form-diensten-stage';
import ConFormControlerenStage from './components/con-form-controleren-stage';

/**
 * Product Aanmelden Wizard (AcFormsProduct)
 *
 * High-level overview
 * - This file implements a multi-step wizard for registering a "product" and its related
 *   data: basic product info, one or more applications, license/hosting, reference components,
 *   standards, integrations (koppelingen), services (diensten) and a final review.
 * - The wizard is rendered by the top-level component `AcFormsProduct`. The component maintains
 *   all shared state and renders the correct step via `renderStep(currentStep)`.
 * - Each step is a memoized sub-component that is only responsible for its own slice of the UI
 *   and writes changes back into the shared `product` object using `setProduct` or `setProductData`.
 *
 * Data model (simplified)
 * - product: {
 *     productName, beschrijving, productpagina, logo(+filename), hosting, jurisdictie,
 *     applicaties: {
 *       [index]: {
 *         naam, beschrijvingKort, licentieType, licentie,
 *         referentieComponenten: string[] | { id, naam }[],
 *         standaarden: { naam: string, supported?: boolean, bewijs?: string }[],
 *         koppelingen: {
 *           applicatie1: string, applicatie2: string,
 *           richtingDataUitwisseling?: string, soortKoppeling?: string
 *         }[],
 *         diensten: string[]
 *       }
 *     }
 *   }
 *
 * Fetching
 * - This file performs multiple read-only fetches for form setup and options:
 *
 *   **Schema Definitions** (fetched on component mount):
 *   - Product:        `${BASE_URL}/openregister/api/schemas/product`
 *   - Module:         `${BASE_URL}/openregister/api/schemas/module`
 *   - ModuleVersie:   `${BASE_URL}/openregister/api/schemas/moduleversie`
 *   - Dienst:         `${BASE_URL}/openregister/api/schemas/dienst`
 *   - Koppeling:      `${BASE_URL}/openregister/api/schemas/koppeling`
 *   - Compliancy:     `${BASE_URL}/openregister/api/schemas/compliancy`
 *   Used to provide field types, validation, descriptions, and enhanced form generation.
 *
 *   **Select Options** (for dropdown fields):
 *   - Standards:      `${BASE_URL}/openregister/api/objects/vng-gemma/element`
 *   - Ref. components:`${BASE_URL}/openregister/api/objects/vng-gemma/element`
 *   - Modules:        `${BASE_URL}/openregister/api/objects/voorzieningen/module`
 *   All are mapped to `{ value, label }` pairs and degrade to an empty list on error.
 *   Each API call is limited to 50 items initially to prevent loading thousands of records.
 *
 * Accessibility & UX
 * - The wizard announces the current step via an aria-live region.
 * - Per-step forms use Utrecht and project components; large tables use `Table`, `TableRow` ...
 * - File uploads use a shared `LogoUploadField` for both the product logo and standards evidence.
 *
 * Implementation notes
 * - The wizard avoids re-mounting app form fields unnecessarily by lifting state and memoizing
 *   sub-forms. Some steps maintain additional UI state (e.g. row management for tables) to
 *   preserve intra-step selection as the user navigates forward/back.
 */

/**
 * TODOs (endpoints and persistence)
 * - [x] Confirm and finalize openregister fetch endpoints used in this wizard:
 *       - Standards: `${BASE_URL}/openregister/api/objects/vng-gemma/element` (✓ Fixed)
 *       - Referentiecomponenten: `${BASE_URL}/openregister/api/objects/vng-gemma/element` (✓ Fixed)
 *       - Modules (for Applicatie B in Koppelingen): `${BASE_URL}/openregister/api/objects/voorzieningen/module` (✓ Fixed)
 *       All endpoints now include pagination with _limit=50 to prevent loading thousands of records.
 * - [x] Implement schema fetching for enhanced form generation (✓ Added):
 *       - Fetches schemas for: product, module, dienst, koppeling, compliancy
 *       - Provides `getFieldFromSchema()` and `getEnhancedFieldConfig()` utilities
 *       - Enables schema-based field validation, types, and descriptions
 * - [ ] Implement and wire the POST endpoint to save the full product registration payload
 *       in `handleRegister` (currently posts a minimal payload). Confirm schema and endpoint
 *       path, then serialize `product` accordingly.
 * - [ ] Integrate schema-based form generation in form steps using `getEnhancedFieldConfig()`
 *       to automatically populate field labels, types, validation, and descriptions from schemas.
 */

const AcFormsProduct = ({ userStore, store }) => {
  // Get URL search parameters to determine form type
  const [searchParams] = useSearchParams();
  const formType = searchParams.get('type') || '';

  // Debug logging in development (disabled per lint rules)

  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [isMultiApplicatie, setIsMultiApplicatie] = useState(false); // shows wether the product has multiple applicaties, used to dictate how to render the form

  // Ref for ProcessSteps container to add click handlers
  const processStepsRef = useRef(null);

  /**
   * Handle step navigation from clickable process steps
   * Maps visual step indices to actual step numbers accounting for conditional steps
   * @param {number} visualStepIndex - The index from the visual step representation
   */
  const handleStepNavigation = (visualStepIndex) => {
    // Map visual step indices to actual step numbers
    // Visual steps structure:
    // 0: Productopbouw (step 0)
    // 1: Product informatie (step 1)
    // 2: Aanbieder informatie (step 2) - conditional
    // 3: Applicaties (step 2 or 3 depending on aanbieder)
    // 4: Licentie (step 3 or 4)
    // 5: Versies (step 4 or 5)
    // 6: Referentiecomponenten (step 5 or 6)
    // 7: Standaarden (step 6 or 7)
    // 8: Koppelingen (step 7 or 8)
    // 9: Diensten (step 8 or 9)
    // 10: Controleren (step 9 or 10)

    const showsAanbiederStep = shouldShowAanbiederStep();
    let targetStep = visualStepIndex;

    // Adjust for the aanbieder step offset
    if (!showsAanbiederStep && visualStepIndex >= 2) {
      targetStep = visualStepIndex + 1; // Skip the aanbieder step
    }

    // Navigate to the target step
    setCurrentStep(targetStep);
  };

  // Step accessibility handled via UI click handlers

  // Add click handlers to ProcessSteps after each render
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      // Find all step elements in the DOM
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step'
      );

      stepElements.forEach((stepEl, index) => {
        // Remove any existing click handlers first
        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        // Only make completed steps clickable (index < currentStep)
        if (index < currentStep) {
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
  }, [currentStep, handleStepNavigation]); // Re-run when currentStep changes
  /**
   * Product State Object
   *
   * This object holds all product data that will be submitted to the API.
   * Property names match the product schema for direct API submission.
   *
   * Schema Property Mapping:
   * - naam: Product name (required, max 200 chars)
   * - beschrijvingKort: Short description (max 255 chars)
   * - beschrijvingLang: Long description (markdown, max 5000 chars)
   * - website: Product website URL (required, max 500 chars)
   * - logo: Logo URL or base64 data
   * - logoFilename: Original filename for logo upload
   * - hostingLocatie: Hosting location (enum: NL, EU, US, elders)
   * - hostingJurisdictie: Hosting jurisdiction (enum: NL, EU, US, elders)
   * - modules: Array of module objects/references
   * - applicaties: Legacy structure for existing wizard steps
   */
  const [product, setProduct] = useState({
    // Schema-compliant product properties
    naam: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    website: '',
    logo: '',
    logoFilename: '',
    hostingLocatie: '',
    hostingJurisdictie: '',
    contactpersoon: '', // Contact person object reference
    cloudDienstverleningsmodel: '', // Cloud service model enum
    modules: [], // Array of module IDs for existing modules + new module objects

    // Aanbieder/Organization reference (for all types)
    aanbieder: null, // Organization object reference - auto-set to user's active organization

    // Aanbieder/Organization information (only used for type=ontbrekend when creating new organization)
    aanbiederNaam: '', // Organization name (required)
    aanbiederType: '', // Organization type (required: Gemeente, Leverancier, Samenwerking, Community)
    aanbiederWebsite: '', // Organization website (required)
    aanbiederBeschrijvingKort: '', // Short description (max 255 chars)
    aanbiederBeschrijvingLang: '', // Long description (max 2000 chars)
    aanbiederEmail: '', // Organization email address
    aanbiederTelefoonnummer: '', // Organization phone number
    aanbiederKvkNummer: '', // Chamber of Commerce number
    aanbiederLogo: '', // Organization logo URL

    // No more applicaties property - new modules are stored directly in modules array
  });
  const [touched, setTouched] = useState({
    productName: false,
  });

  // Separate state for existing modules lookup cache (for UI display)
  const [existingModulesLookup, setExistingModulesLookup] = useState({});

  // Persist UI state for DienstenForm across steps
  const [dienstenFormState, setDienstenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedApplication: {},
    selectedDienstByRow: {},
    dienstBeschrijvingByRow: {}, // Track custom descriptions for each dienst
    allAppsDienst: null,
  });

  // Separate array to track chosen referentieComponenten with their standards
  // Structure: [{ id, naam, aanbevolenStandaarden: [], verplichteStandaarden: [], applicatieId }]
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Persist UI state for KoppelingenForm across steps
  const [koppelingenFormState, setKoppelingenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedAppAByRow: {},
    selectedAppBByRow: {},
    directionByRow: {},
    typeByRow: {},
    koppelingIdByRow: {}, // rowId -> local koppeling id
    moduleIndexByRow: {}, // rowId -> last persisted module (Applicatie A index)
  });

  const setProductData = useCallback((key, value) => {
    // No more applicaties handling - all new module data is stored directly in modules array
    setProduct((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  // Schema definitions for form generation
  const [schemas, setSchemas] = useState({
    product: null,
    module: null,
    dienst: null,
    koppeling: null,
    compliancy: null,
    organisatie: null,
  });
  const [schemasLoading, setSchemasLoading] = useState(true);
  // Loading state for standards step (used to disable next button)
  const [standaardenLoading, setStandaardenLoading] = useState(false);

  /**
   * Generate a default/empty product object based on the product schema using ObjectStore
   * @param {Object} productSchema - The product schema object
   * @returns {Object} Default product object with schema-based properties
   */
  const createDefaultProductFromSchema = useCallback(
    (productSchema) => {
      // Use the centralized ObjectStore method for schema-based object creation
      const defaultProduct =
        store.object.createDefaultObjectFromSchema(productSchema);

      return defaultProduct;
    },
    [store.object]
  );

  /**
   * Get existing applications for information display
   * Used to show which applications are excluded from configuration
   */
  const getExistingApplications = useCallback(() => {
    return getExistingModulesWithLookupData().map(
      (module) => module.naam || 'Unnamed Module'
    );
  }, [existingModulesLookup]);

  /**
   * Render info box for steps that exclude existing applications
   * Shows consistent messaging about why certain applications aren't shown
   */
  const renderExistingAppsInfoBox = useCallback(
    (stepType) => {
      const existingApps = getExistingApplications();

      if (existingApps.length === 0) return null;

      const stepTexts = {
        license: {
          title: 'Bestaande applicaties uitgesloten',
          description:
            'Voor bestaande applicaties kunnen geen licenties worden toegevoegd of aangepast, omdat deze al hun eigen licentie-informatie hebben vastgelegd in de catalogus.',
        },
        referentiecomponenten: {
          title: 'Bestaande applicaties uitgesloten',
          description:
            'Voor bestaande applicaties kunnen geen referentiecomponenten worden toegevoegd of aangepast, omdat deze al hun eigen referentiecomponenten hebben vastgelegd in de catalogus.',
        },
        standaarden: {
          title: 'Bestaande applicaties uitgesloten',
          description:
            'Voor bestaande applicaties kunnen geen standaarden worden toegevoegd of aangepast, omdat deze al hun eigen standaarden hebben vastgelegd in de catalogus.',
        },
        moduleVersies: {
          title: 'Bestaande applicaties uitgesloten',
          description:
            'Voor bestaande applicaties kunnen geen versies worden toegevoegd of aangepast, omdat deze al hun eigen versie-informatie hebben vastgelegd in de catalogus.',
        },
      };

      const text = stepTexts[stepType];
      if (!text) return null;

      return (
        <Alert
          severity='info'
          style={{
            marginTop: '1.5rem',
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            borderRadius: '8px',
          }}
        >
          <div>
            <strong>{text.title}</strong>
          </div>
          <div style={{ marginTop: '0.5rem' }}>{text.description}</div>
          <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
            De volgende bestaande applicatie{existingApps.length > 1 ? 's' : ''}{' '}
            worden daarom niet in dit overzicht getoond:
          </div>
          <ul
            style={{ marginTop: '0.25rem', marginBottom: 0, paddingLeft: '1.5rem' }}
          >
            {existingApps.map((naam, index) => (
              <li key={index}>{naam}</li>
            ))}
          </ul>
        </Alert>
      );
    },
    [getExistingApplications]
  );

  // Fetch schema definitions on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setSchemasLoading(true);
      const schemaTypes = [
        'product',
        'module',
        'dienst',
        'koppeling',
        'compliancy',
        'organisatie',
        'moduleversie',
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

        // Update product object with schema-based defaults if product schema was loaded
        if (fetchedSchemas.product) {
          setProduct((prevProduct) => {
            // Only update if current product is the default/empty state
            // Don't override if user has already started filling the form
            const isEmpty =
              !prevProduct.naam &&
              !prevProduct.website &&
              !prevProduct.beschrijvingKort;
            if (isEmpty) {
              return createDefaultProductFromSchema(fetchedSchemas.product);
            }
            return prevProduct;
          });
        }
      } catch (error) {
        console.error('Failed to fetch schemas:', error);
      } finally {
        setSchemasLoading(false);
      }
    };

    fetchSchemas();
  }, [createDefaultProductFromSchema]);

  /**
   * Helper methods for module management
   * These methods help other stages filter and work with the modules array
   */

  // Get all new modules (objects in modules array)
  const getNewModules = useCallback(() => {
    return (product.modules || []).filter((module) => typeof module === 'object');
  }, [product.modules]);

  // Get all existing module IDs (strings in modules array)
  const getExistingModuleIds = useCallback(() => {
    return (product.modules || []).filter((module) => typeof module === 'string');
  }, [product.modules]);

  // Get new modules with their data (now stored directly in modules array)
  const getNewModulesWithApplicatieData = useCallback(() => {
    return getNewModules().map((module, index) => ({
      ...module,
      moduleIndex: index, // Add index for backwards compatibility with existing stages
    }));
  }, [getNewModules]);

  // Get existing modules with lookup data combined
  const getExistingModulesWithLookupData = useCallback(() => {
    return getExistingModuleIds().map((moduleId) => {
      const lookupData = existingModulesLookup[moduleId];
      return {
        id: moduleId,
        isExisting: true,
        ...lookupData,
      };
    });
  }, [getExistingModuleIds, existingModulesLookup]);

  // Get all modules for stages that need to work with both types
  const getAllModulesForStages = useCallback(() => {
    const allModulesFromProduct = product.modules || [];
    return allModulesFromProduct.map((module, realIndex) => {
      if (typeof module === 'string') {
        // Existing module
        const lookupData = existingModulesLookup[module];
        return {
          id: module,
          isExisting: true,
          moduleIndex: realIndex, // Real index in product.modules array
          ...lookupData,
        };
      } else {
        // New module
        return {
          ...module,
          isExisting: false,
          moduleIndex: realIndex, // Real index in product.modules array
        };
      }
    });
  }, [product.modules, existingModulesLookup]);

  // Standaarden options (fetched similarly to referentiecomponenten)
  const [standaardenOptions, setStandaardenOptions] = useState([]);
  const [standaardenOptionsLoading, setStandaardenOptionsLoading] = useState(false);

  // Referentiecomponenten options with search functionality
  const [referentieComponentenOptions, setReferentieComponentenOptions] = useState(
    []
  );
  const [referentieComponentenLoading, setReferentieComponentenLoading] =
    useState(false);

  // Diensten static options
  const dienstOptions = [
    {
      value: 'Functioneel beheer',
      label: 'Functioneel beheer: ondersteuning bij dagelijks gebruik en inrichting',
    },
    {
      value: 'Technisch beheer',
      label: 'Technisch beheer: installatie, updates en systeembeheer.',
    },
    { value: 'Training', label: 'Training: gebruikers- of beheerdersopleiding.' },
    {
      value: 'Implementatie-ondersteuning',
      label: 'Implementatie-ondersteuning: hulp bij implementatie en adoptie.',
    },
  ];

  // Get query parameters from schema property configuration
  const getReferentieComponentenQueryParams = useCallback(() => {
    const moduleSchema = schemas?.module;
    const refCompProperty = moduleSchema?.properties?.referentieComponenten;
    const queryParamsString =
      refCompProperty?.items?.objectConfiguration?.queryParams;

    const baseParams = {
      _limit: '500', // Load 500 referentiecomponenten upfront
      _page: '1',
    };

    if (queryParamsString) {
      // Parse the queryParams string: "gemmaType=referentiecomponent&_extend=aanbevolenStandaarden,verplichteStandaarden"
      const urlParams = new URLSearchParams(queryParamsString);
      urlParams.forEach((value, key) => {
        baseParams[key] = value;
      });
    } else {
      // Fallback to hardcoded if schema doesn't have queryParams
      baseParams.gemmaType = 'Referentiecomponent';
      // Ensure standards are included with referentiecomponenten
      baseParams._extend = 'aanbevolenStandaarden,verplichteStandaarden';
    }

    // Keep _extend for referentiecomponenten so we get standaarden in results
    // Remove array-style param variant if present
    if (baseParams['_extend[]']) {
      delete baseParams['_extend[]'];
    }

    return baseParams;
  }, [schemas]);

  const getStandaardenQueryParams = useCallback(() => {
    const moduleSchema = schemas?.module;
    const refCompProperty = moduleSchema?.properties?.referentieComponenten;
    const queryParamsString =
      refCompProperty?.items?.objectConfiguration?.queryParams;

    const baseParams = {
      _limit: '500', // Load 500 standaarden upfront
      _page: '1',
    };

    if (queryParamsString) {
      // Parse whatever schema has, then override gemmaType below
      const urlParams = new URLSearchParams(queryParamsString);
      urlParams.forEach((value, key) => {
        baseParams[key] = value;
      });
    }

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
  }, [schemas]);

  // Function to load all referentiecomponenten upfront
  // ✅ Simplified function to load 500 referentiecomponenten
  const loadReferentieComponenten = useCallback(async () => {
    if (!schemas?.module) return; // Wait for schemas to load

    // console.debug('Loading all referentiecomponenten (500 limit)...');
    setReferentieComponentenLoading(true);

    try {
      const baseEndpoint = `${BASE_URL}/openregister/api/objects/vng-gemma/element`;
      const queryParams = getReferentieComponentenQueryParams();
      const params = new URLSearchParams(queryParams);
      const endpoint = `${baseEndpoint}?${params}`;

      // console.debug('Full endpoint:', endpoint);

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

      const options = list.map(mapToOption).filter((o) => o.label && o.value);
      setReferentieComponentenOptions(options);
      // console.debug(`Loaded ${options.length} referentiecomponenten successfully`);
    } catch (e) {
      console.error('Failed to load referentie componenten:', e);
      setReferentieComponentenOptions([]);
    } finally {
      setReferentieComponentenLoading(false);
    }
  }, [schemas, getReferentieComponentenQueryParams, getStandaardenQueryParams]);

  // Add this after loadReferentieComponenten()
  const loadStandaarden = useCallback(async () => {
    if (!schemas?.module) return;

    // console.debug('Loading standaarden (500 limit)...');
    setStandaardenOptionsLoading(true);

    try {
      const baseEndpoint = `${BASE_URL}/openregister/api/objects/vng-gemma/element`;
      const queryParams = getStandaardenQueryParams();
      const params = new URLSearchParams(queryParams);
      const endpoint = `${baseEndpoint}?${params}`;

      // console.debug('Full endpoint (standaarden):', endpoint);

      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      const options = list
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
      // console.debug(`Loaded ${options.length} standaarden successfully`);
    } catch (e) {
      console.error('Failed to load standaarden:', e);
      setStandaardenOptions([]);
    } finally {
      setStandaardenOptionsLoading(false);
    }
  }, [schemas, getStandaardenQueryParams]);

  // ✅ Load referentiecomponenten and standaarden when schemas are available
  useEffect(() => {
    if (!schemas?.module) return;

    const shouldLoadRefs =
      referentieComponentenOptions.length === 0 && !referentieComponentenLoading;
    const shouldLoadStandards =
      standaardenOptions.length === 0 && !standaardenOptionsLoading;

    if (shouldLoadRefs || shouldLoadStandards) {
      const tasks = [];
      if (shouldLoadRefs) tasks.push(loadReferentieComponenten());
      if (shouldLoadStandards) tasks.push(loadStandaarden());
      Promise.all(tasks).catch(() => {});
    }
  }, [
    schemas?.module,
    referentieComponentenOptions.length,
    referentieComponentenLoading,
    loadReferentieComponenten,
    standaardenOptions.length,
    standaardenOptionsLoading,
    loadStandaarden,
  ]);

  // Modules options with search functionality
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Function to search modules with debouncing
  // ✅ Core search function for modules
  const performModulesSearch = useCallback(async (searchTerm = '') => {
    setModulesLoading(true);

    try {
      const baseEndpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module`;
      const params = new URLSearchParams({
        _limit: '20',
        _page: '1',
      });

      // Add search parameter if provided
      if (searchTerm && searchTerm.trim()) {
        params.set('_search', searchTerm.trim());
      }

      const endpoint = `${baseEndpoint}?${params}`;

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

      const mapToOption = (item, index) => {
        const label =
          item?.naam ||
          item?.['@self']?.name ||
          item?.name ||
          item?.title ||
          item?.label ||
          (item?.id ? String(item.id) : `Module ${index + 1}`);
        const value = item?.value || item?.id || item?.slug || label;
        return {
          value: String(value),
          label: String(label),
          data: item, // Store the full API data for later access
        };
      };

      const options = list.map(mapToOption).filter((o) => o.label && o.value);
      setModulesOptions(options);
    } catch (e) {
      console.error('Failed to fetch modules:', e);
      setModulesOptions([]);
    } finally {
      setModulesLoading(false);
    }
  }, []);

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

  // Auto-set aanbieder to user's active organization
  useEffect(() => {
    if (userStore?.activeOrganization && !product.aanbieder) {
      setProductData('aanbieder', userStore.activeOrganization);
    }
  }, [userStore?.activeOrganization, product.aanbieder]);

  // State for aanbieder selection
  const [aanbiederkeuze, setAanbiederKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'

  // Remove any local-only IDs (like _localId) before submitting
  const stripLocalIds = (value) => {
    if (Array.isArray(value)) {
      return value.map(stripLocalIds).filter((v) => v != null);
    }
    if (value && typeof value === 'object') {
      const out = {};
      Object.keys(value).forEach((k) => {
        if (k === '_localId') return;
        // Remove UI-only fields from compliancy objects
        if (k === 'standaardnaam') return;
        out[k] = stripLocalIds(value[k]);
      });
      return out;
    }
    return value;
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Submit the complete product object to the voorzieningen register
      const productData = {
        ...product,
        naam: product.naam || product.productName, // Ensure naam is properly set
      };
      const sanitized = stripLocalIds(productData);

      // Use object store's createObject method which includes authentication
      await store.object.createObject('voorzieningen', 'product', sanitized);

      // createObject returns the created object directly on success
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

  // Helper function to determine if aanbieder step should be shown
  const shouldShowAanbiederStep = () => {
    return formType === 'ontbrekend';
  };

  // Helper to determine if Versies step should be shown (On-premise only)
  const shouldShowVersiesStep = () => {
    return (
      (product?.cloudDienstverleningsmodel || '') === 'On-premises (self-managed)'
    );
  };

  // Helper function to get the correct step index accounting for optional aanbieder step
  const getAdjustedStepIndex = (logicalStep) => {
    let index = logicalStep;
    // If aanbieder step is not shown, shift all steps after step 1 down by 1
    if (!shouldShowAanbiederStep() && logicalStep > 1) {
      index -= 1;
    }
    // If versies step is not shown, shift all steps after logical step 5 down by 1
    if (!shouldShowVersiesStep() && logicalStep > 5) {
      index -= 1;
    }
    return index;
  };

  // Helper function to get logical step from actual step index
  const getLogicalStepFromIndex = (stepIndex) => {
    // Base logical mapping, accounting for optional aanbieder step (logical 2)
    let logical = stepIndex;
    if (!shouldShowAanbiederStep() && stepIndex >= 2) {
      logical = stepIndex + 1;
    }
    // Additionally account for optional versies step (logical 5)
    if (!shouldShowVersiesStep()) {
      const versiesPhysicalIndex = getAdjustedStepIndex(5);
      if (stepIndex >= versiesPhysicalIndex) {
        logical += 1; // Skip logical step 5
      }
    }
    return logical;
  };

  // Defaults for moduleVersie based on schema, used when auto-creating a module in single-app mode
  const getModuleVersieDefaults = useCallback(() => {
    const defaults = {};
    const moduleVersieSchema = schemas?.moduleversie;
    if (moduleVersieSchema?.properties) {
      Object.entries(moduleVersieSchema.properties).forEach(([key, property]) => {
        if (property.default !== undefined) {
          defaults[key] = property.default;
        }
        if (property.example !== undefined && defaults[key] === undefined) {
          defaults[key] = property.example;
        }
      });
    }
    return defaults;
  }, [schemas]);

  // Ensure a single-app module exists and is prefilled from product fields
  const ensureSingleModuleInitialized = useCallback(() => {
    if (isMultiApplicatie) return;
    const firstModule = product.modules?.[0];
    if (!firstModule || typeof firstModule === 'string') {
      const moduleVersieDefaults = getModuleVersieDefaults();
      const newModule = {
        naam: product.naam || '',
        beschrijvingKort: product.beschrijvingKort || '',
        beschrijvingLang: '',
        licentieType: '',
        licentietype: '',
        licentie: '',
        hostingLocatie: '',
        hostingJurisdictie: '',
        standaarden: [],
        referentieComponenten: [],
        diensten: [],
        koppelingen: [],
        compliancy: [],
        moduleVersies: [{ ...moduleVersieDefaults }],
      };
      setProduct((prev) => ({
        ...prev,
        modules: [newModule],
      }));
    }
  }, [
    isMultiApplicatie,
    product.modules,
    product.naam,
    product.beschrijvingKort,
    getModuleVersieDefaults,
    setProduct,
  ]);

  // Handle switching between single and multi-applicatie modes
  const handleSetIsMultiApplicatie = useCallback(
    (nextValue) => {
      setIsMultiApplicatie(nextValue);

      // When switching to single mode, prune modules and clear existing module links
      if (!nextValue) {
        setProduct((prev) => {
          const prevModules = prev.modules || [];
          const firstNewModule = prevModules.find((m) => typeof m === 'object');
          const moduleToKeep = firstNewModule || {
            naam: prev.naam || '',
            beschrijvingKort: prev.beschrijvingKort || '',
            beschrijvingLang: '',
            licentieType: '',
            licentietype: '',
            licentie: '',
            hostingLocatie: '',
            hostingJurisdictie: '',
            standaarden: [],
            referentieComponenten: [],
            diensten: [],
            koppelingen: [],
            compliancy: [],
            moduleVersies: [{ ...getModuleVersieDefaults() }],
          };

          return {
            ...prev,
            modules: [moduleToKeep],
          };
        });

        // Clear lookup for existing modules so info boxes do not show leftovers
        setExistingModulesLookup({});
      }
    },
    [setProduct, getModuleVersieDefaults]
  );

  // Always ensure a module exists in single-app mode as soon as the mode is selected
  useEffect(() => {
    if (!isMultiApplicatie) {
      ensureSingleModuleInitialized();
    }
  }, [isMultiApplicatie, ensureSingleModuleInitialized]);

  // Navigation helpers to skip Applicatie step in single-app mode
  const getNextStepIndex = (stepIndex) => {
    const logical = getLogicalStepFromIndex(stepIndex);
    if (!isMultiApplicatie) {
      // From Productinformatie → either Aanbieder (if shown) or directly to Licentie
      if (logical === 1) {
        if (shouldShowAanbiederStep()) {
          return stepIndex + 1; // go to Aanbieder
        }
        return getAdjustedStepIndex(4); // skip Applicatie → Licentie
      }
      // From Aanbieder → skip Applicatie → go to Licentie
      if (logical === 2) {
        return getAdjustedStepIndex(4);
      }
    }
    // From Licentie → skip Versies when not On-premise
    if (!shouldShowVersiesStep() && logical === 4) {
      return getAdjustedStepIndex(6);
    }
    return stepIndex + 1;
  };

  const getPrevStepIndex = (stepIndex) => {
    const logical = getLogicalStepFromIndex(stepIndex);
    // From Licentie back to Productinformatie in single-app mode
    if (!isMultiApplicatie && logical === 4) {
      return getAdjustedStepIndex(1);
    }
    // From Referentiecomponenten back to Licentie when Versies is hidden
    if (!shouldShowVersiesStep() && logical === 6) {
      return getAdjustedStepIndex(4);
    }
    return stepIndex - 1;
  };

  const renderStep = (step) => {
    // Get the logical step number (accounting for optional aanbieder step)
    const logicalStep = getLogicalStepFromIndex(step);

    // Debug logging disabled per lint rules

    switch (logicalStep) {
      case 0:
        return (
          <ConFormProductopbouwStage
            isMultiApplicatie={isMultiApplicatie}
            setIsMultiApplicatie={handleSetIsMultiApplicatie}
          />
        );
      case 1:
        return (
          <ConFormProductInformatieStage
            product={product}
            setProductData={setProductData}
            loading={loading}
            touched={touched}
            schemas={schemas}
            isMultiApplicatie={isMultiApplicatie}
          />
        );
      case 2:
        // Aanbieder informatie step - only shown for 'ontbrekend' type
        if (shouldShowAanbiederStep()) {
          return (
            <ConFormAanbiederInformatieStage
              product={product}
              setProductData={setProductData}
              loading={loading}
              touched={touched}
              schemas={schemas}
              userStore={userStore}
              aanbiederkeuze={aanbiederkeuze}
              setAanbiederKeuze={setAanbiederKeuze}
            />
          );
        }
      // Fall through to next case if aanbieder step is not shown
      case 3:
        return (
          <ConFormApplicatieStage
            product={product}
            setProduct={setProduct}
            isMultiApplicatie={isMultiApplicatie}
            loading={loading}
            schemas={schemas}
            schemasLoading={schemasLoading}
            store={store}
            existingModulesLookup={existingModulesLookup}
            setExistingModulesLookup={setExistingModulesLookup}
            searchModules={searchModules}
            modulesLoading={modulesLoading}
            modulesOptions={modulesOptions}
          />
        );
      case 4:
        return (
          <ConFormLicentieStage
            product={product}
            setProduct={setProduct}
            isMultiApplicatie={isMultiApplicatie}
            loading={loading}
            schemas={schemas}
            getNewModulesWithApplicatieData={getNewModulesWithApplicatieData}
            existingModulesLookup={existingModulesLookup}
            getAllModulesForStages={getAllModulesForStages}
          />
        );
      case 5:
        return shouldShowVersiesStep() ? (
          <ConFormModuleVersieStage
            product={product}
            setProduct={setProduct}
            isMultiApplicatie={isMultiApplicatie}
            loading={loading}
            schemas={schemas}
            getNewModulesWithApplicatieData={getNewModulesWithApplicatieData}
            existingModulesLookup={existingModulesLookup}
            getAllModulesForStages={getAllModulesForStages}
          />
        ) : (
          // If versions step is hidden, render next step (Referentiecomponenten)
          renderStep(getAdjustedStepIndex(6))
        );
      case 6:
        return (
          <ConFormReferentiecomponentenStage
            product={product}
            setProduct={setProduct}
            referentieComponentenOptions={referentieComponentenOptions}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            setReferentieComponentenWithStandards={
              setReferentieComponentenWithStandards
            }
            schemas={schemas}
            loading={schemasLoading}
            getNewModulesWithApplicatieData={getNewModulesWithApplicatieData}
            existingModulesLookup={existingModulesLookup}
            referentieComponentenLoading={referentieComponentenLoading}
          />
        );
      case 7:
        return (
          <ConFormStandaardenStage
            product={product}
            setProduct={setProduct}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            schemas={schemas}
            getNewModulesWithApplicatieData={getNewModulesWithApplicatieData}
            setStandaardenLoading={setStandaardenLoading}
            standaardenOptions={standaardenOptions}
            standaardenOptionsLoading={standaardenOptionsLoading}
          />
        );
      case 8:
        return (
          <ConFormKoppelingenStage
            product={product}
            setProduct={setProduct}
            modulesOptions={modulesOptions}
            koppelingenFormState={koppelingenFormState}
            setKoppelingenFormState={setKoppelingenFormState}
            getAllModulesForStages={getAllModulesForStages}
            searchModules={searchModules}
            modulesLoading={modulesLoading}
          />
        );
      case 9:
        return (
          <ConFormDienstenStage
            product={product}
            dienstOptions={dienstOptions}
            setProduct={setProduct}
            dienstenFormState={dienstenFormState}
            setDienstenFormState={setDienstenFormState}
            getAllModulesForStages={getAllModulesForStages}
          />
        );
      case 10:
        return (
          <ConFormControlerenStage
            product={product}
            dienstOptions={dienstOptions}
            referentieComponentenOptions={referentieComponentenOptions}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            existingModulesLookup={existingModulesLookup}
            getAllModulesForStages={getAllModulesForStages}
          />
        );
    }
  };

  const getStatus = (currentStep, step) => {
    const result =
      currentStep === step
        ? 'current'
        : currentStep < step
        ? 'not-checked'
        : 'checked';

    return result;
  };

  const getStatusMultiStep = (currentStep, step, firstStep, lastStep) => {
    if (currentStep >= firstStep && currentStep <= lastStep) {
      return 'current';
    } else if (currentStep < step) {
      return 'not-checked';
    } else if (currentStep > step) {
      return 'checked';
    }
  };

  const currentStepName = (currentStep) => {
    // Get the logical step number (accounting for optional aanbieder step)
    const logicalStep = getLogicalStepFromIndex(currentStep);

    switch (logicalStep) {
      case 0:
        return 'Productopbouw';
      case 1:
        return 'Productinformatie';
      case 2:
        if (shouldShowAanbiederStep()) {
          return 'Aanbieder informatie';
        }
      // Fall through to next case if aanbieder step is not shown
      case 3:
        return isMultiApplicatie ? 'Applicaties' : 'Applicatie';
      case 4:
        return 'Licentie';
      case 5:
        return shouldShowVersiesStep() ? 'Versies' : 'Referentiecomponenten';
      case 6:
        return 'Referentiecomponenten';
      case 7:
        return 'Standaarden';
      case 8:
        return 'Koppelingen';
      case 9:
        return 'Diensten';
      case 10:
        return 'Controleer uw gegevens';
    }
  };

  const getDisabledStatus = (currentStep) => {
    // Convert physical step to logical step for consistent validation
    const logicalStep = getLogicalStepFromIndex(currentStep);

    // TODO: uncomment at the end
    if (logicalStep === 0) {
      return false;
    }
    if (logicalStep === 1) {
      // Productinformatie step validation
      const requiredFields = ['naam', 'website'];
      const missingFields = requiredFields.filter(
        (field) => !product[field] || !product[field].trim()
      );

      // Check website format (allow URLs without http/https)
      if (product.website && product.website.trim()) {
        const website = product.website.trim();
        if (!validateWebsite(website)) {
          return true; // Invalid website format
        }
      }

      return missingFields.length > 0;
    }
    if (logicalStep === 3) {
      // Applicaties step validation - check modules array
      const totalModules = product.modules?.length || 0;

      // Must have at least one module (new or existing)
      if (totalModules === 0) {
        return true;
      }

      // All new modules must have naam and beschrijving
      const newModules = getNewModules();
      const hasIncompleteNewModules = newModules.some((module) => {
        return (
          !module.naam ||
          !module.naam.trim() ||
          !module.beschrijvingKort ||
          !module.beschrijvingKort.trim()
        );
      });

      return hasIncompleteNewModules;
    }

    if (logicalStep === 4) {
      // Licentie step validation - check new modules
      const newModules = getNewModules();
      const hasIncompleteLicenses = newModules.some((module) => {
        // Check both possible field names (schema uses 'licentietype', code uses 'licentieType')
        const licenseType = module.licentietype || module.licentieType;

        // License type is required for all modules
        if (!licenseType || !licenseType.trim()) {
          return true;
        }

        // If licentietype is "Open Source", then licentie is required
        if (
          licenseType === 'Open Source' &&
          (!module.licentie || !module.licentie.trim())
        ) {
          return true;
        }

        return false;
      });

      return hasIncompleteLicenses;
    }

    // TODO: Koppelingen validation temporarily removed - too strict
    // if (logicalStep === 8) {
    //   // Koppelingen step validation - check if all koppeling rows are complete
    //   const { rows, selectedAppAByRow, selectedAppBByRow, directionByRow, typeByRow } = koppelingenFormState;
    //
    //   // Allow empty koppelingen (user might not want to add any connections)
    //   if (rows.length === 0) {
    //     return false;
    //   }
    //
    //   // Check if any row has incomplete data
    //   const hasIncompleteKoppelingen = rows.some(rowId => {
    //     const appA = selectedAppAByRow[rowId];
    //     const appB = selectedAppBByRow[rowId];
    //     const direction = directionByRow[rowId];
    //     const type = typeByRow[rowId];
    //
    //     // If any field in a row is filled, all fields must be filled
    //     const hasAnyData = appA || appB || direction || type;
    //     const hasAllData = appA && appB && direction && type;
    //
    //     return hasAnyData && !hasAllData;
    //   });
    //
    //   return hasIncompleteKoppelingen;
    // }

    if (logicalStep === 9) {
      // Diensten step validation - check if all dienst rows are complete
      const { rows, selectedApplication, selectedDienstByRow } = dienstenFormState;

      // Allow empty diensten (user might not want to add any services)
      if (rows.length === 0) {
        return false;
      }

      // Check if any row has incomplete data
      const hasIncompleteDiensten = rows.some((rowId) => {
        const appId = selectedApplication[rowId];
        const dienstVal = selectedDienstByRow[rowId];

        // If any field in a row is filled, all fields must be filled
        const hasAnyData = appId != null || dienstVal != null;
        const hasAllData = appId != null && dienstVal != null;

        return hasAnyData && !hasAllData;
      });

      return hasIncompleteDiensten;
    }

    return false;
  };

  // Add this function to generate the tooltip message
  const getDisabledTooltip = (currentStep, product) => {
    // Convert physical step to logical step for consistent validation
    const logicalStep = getLogicalStepFromIndex(currentStep);

    // Example
    if (logicalStep === 1) {
      const messages = [];

      // Check required fields
      if (!product.naam || !product.naam.trim()) {
        messages.push('Productnaam is verplicht');
      }
      if (!product.website || !product.website.trim()) {
        messages.push('Website is verplicht');
      }

      // Check website format
      if (product.website && product.website.trim()) {
        const website = product.website.trim();
        // More permissive domain validation - allow domains with or without protocol
        const domainRegex =
          /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
        if (!domainRegex.test(website)) {
          messages.push(
            'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)'
          );
        }
      }

      return messages.join('\n');
    }

    if (logicalStep === 3) {
      const messages = [];
      const totalModules = product.modules?.length || 0;

      // Check if no modules exist
      if (totalModules === 0) {
        messages.push(
          'Een product moet bestaan uit minimaal één applicatie (nieuwe of bestaande)'
        );
        return messages.join('\n');
      }

      // Check for incomplete new modules
      const newModules = getNewModules();
      const incompleteModules = [];

      newModules.forEach((module, index) => {
        const missingFields = [];
        if (!module.naam || !module.naam.trim()) {
          missingFields.push('naam');
        }
        if (!module.beschrijvingKort || !module.beschrijvingKort.trim()) {
          missingFields.push('beschrijving');
        }

        if (missingFields.length > 0) {
          // Use the actual module name if available, otherwise fall back to "Nieuwe applicatie X"
          const moduleName =
            module.naam && module.naam.trim()
              ? module.naam.trim()
              : `Nieuwe applicatie ${index + 1}`;
          incompleteModules.push(
            `${moduleName}: ${missingFields.join(', ')} ontbreekt`
          );
        }
      });

      if (incompleteModules.length > 0) {
        messages.push(
          'Alle nieuwe applicaties moeten een naam en beschrijving hebben:'
        );
        messages.push(...incompleteModules);
      }

      return messages.join('\n');
    }

    if (logicalStep === 4) {
      // Licentie step validation messages
      const messages = [];
      const newModules = getNewModules();
      const incompleteLicenses = [];

      newModules.forEach((module, index) => {
        // Check both possible field names (schema uses 'licentietype', code uses 'licentieType')
        const licenseType = module.licentietype || module.licentieType;
        const moduleName =
          module.naam && module.naam.trim()
            ? module.naam.trim()
            : `Nieuwe applicatie ${index + 1}`;

        // Check if license type is missing
        if (!licenseType || !licenseType.trim()) {
          incompleteLicenses.push(`${moduleName}: licentie type is verplicht`);
        }
        // Check if Open Source but no specific license
        else if (
          licenseType === 'Open Source' &&
          (!module.licentie || !module.licentie.trim())
        ) {
          incompleteLicenses.push(
            `${moduleName}: specifieke licentie is verplicht bij Open Source`
          );
        }
      });

      if (incompleteLicenses.length > 0) {
        messages.push(
          'Alle nieuwe applicaties hebben volledige licentie-informatie nodig:'
        );
        messages.push(...incompleteLicenses);
      }

      return messages.join('\n');
    }

    // TODO: Koppelingen tooltip validation temporarily removed - too strict
    // if (logicalStep === 8) {
    //   const { rows, selectedAppAByRow, selectedAppBByRow, directionByRow, typeByRow } = koppelingenFormState;
    //   const messages = [];
    //
    //   // Check each row for missing fields
    //   rows.forEach((rowId, index) => {
    //     const appA = selectedAppAByRow[rowId];
    //     const appB = selectedAppBByRow[rowId];
    //     const direction = directionByRow[rowId];
    //     const type = typeByRow[rowId];
    //
    //     const missingFields = [];
    //     if (!appA) missingFields.push('Applicatie A');
    //     if (!appB) missingFields.push('Applicatie B');
    //     if (!direction) missingFields.push('Richting data-uitwisseling');
    //     if (!type) missingFields.push('Soort koppeling');
    //
    //     if (missingFields.length > 0) {
    //       messages.push(`Rij ${index + 1}: ${missingFields.join(', ')} ontbreekt`);
    //     }
    //   });
    //
    //   return messages.join('\n');
    // }

    if (logicalStep === 9) {
      const { rows, selectedApplication, selectedDienstByRow } = dienstenFormState;
      const messages = [];

      // Check each row for missing fields
      rows.forEach((rowId, index) => {
        const appId = selectedApplication[rowId];
        const dienstVal = selectedDienstByRow[rowId];

        const missingFields = [];
        if (appId == null) missingFields.push('Applicatie');
        if (dienstVal == null) missingFields.push('Dienst Type');

        if (missingFields.length > 0) {
          messages.push(`Rij ${index + 1}: ${missingFields.join(', ')} ontbreekt`);
        }
      });

      return messages.join('\n');
    }

    return '';
  };

  // Determine page title based on form type
  const getPageTitle = () => {
    switch (formType) {
      case 'eigen':
        return 'Eigen product aanmelden';
      case 'ontbrekend':
        return 'Ontbrekend product melden';
      default:
        return 'Product Aanmelden';
    }
  };

  // Determine page description based on form type
  const getPageDescription = () => {
    switch (formType) {
      case 'eigen':
        return 'Vul dit formulier in om uw eigen product aan te melden in onze catalogus.';
      case 'ontbrekend':
        return 'Vul dit formulier in om een ontbrekend product te melden dat toegevoegd zou moeten worden aan onze catalogus.';
      default:
        return 'Vul dit formulier in om een product aan te melden in onze catalogus.';
    }
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <div>
                <Heading1>{getPageTitle()}</Heading1>
                <Paragraph>{getPageDescription()}</Paragraph>

                {/* Show loading state while schemas are being fetched */}
                {schemasLoading && (
                  <div
                    className='ac-forms-product-loading'
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f0f4ff',
                      border: '1px solid #d1e7ff',
                      borderRadius: '4px',
                      margin: '1rem 0',
                    }}
                  >
                    <p style={{ margin: 0, color: '#0066cc' }}>
                      📋 Formulier definities aan het laden...
                    </p>
                  </div>
                )}
              </div>
              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName(currentStep)}
                </h3>

                {registerCallBack === 'error' && error.message && (
                  <Alert type='error'>
                    <Paragraph>{error.message}</Paragraph>
                    {error.errors && (
                      <UnorderedList>
                        {Object.entries(error.errors).map(([field, messages]) => (
                          <UnorderedListItem key={field}>
                            <strong>{field}:</strong>{' '}
                            {Array.isArray(messages)
                              ? messages.join(', ')
                              : messages}
                          </UnorderedListItem>
                        ))}
                      </UnorderedList>
                    )}
                  </Alert>
                )}

                <AcColumn gap='sm'>
                  <div className='ac-register-container ac-forms-product'>
                    {/* Debug step information - only in development */}

                    <div ref={processStepsRef} className='ac-register-process-steps'>
                      <ProcessSteps
                        steps={(() => {
                          const baseSteps = [
                            {
                              id: '4p5q6r7s-8t9u-0v1w-2x3y-4z5a6b7c8d9e',
                              marker: 1,
                              status: getStatusMultiStep(
                                currentStep,
                                getAdjustedStepIndex(0),
                                getAdjustedStepIndex(0),
                                getAdjustedStepIndex(
                                  shouldShowAanbiederStep() ? 2 : 1
                                )
                              ),
                              title: 'Productopbouw',
                              steps: [
                                {
                                  id: 'v6w7x8y9-0z1a-2b3c-4d5e-6f7g8h9i0j1k',
                                  status: getStatus(
                                    currentStep,
                                    getAdjustedStepIndex(1)
                                  ),
                                  title: 'Product informatie',
                                },
                                // Conditionally add aanbieder step
                                ...(shouldShowAanbiederStep()
                                  ? [
                                      {
                                        id: 'w7x8y9z0-1a2b-3c4d-5e6f-7g8h9i0j1k2l',
                                        status: getStatus(
                                          currentStep,
                                          getAdjustedStepIndex(2)
                                        ),
                                        title: 'Aanbieder informatie',
                                      },
                                    ]
                                  : []),
                              ],
                            },
                            {
                              id: '7f8e9a2b-1c3d-4f5g-6h7i-8j9k0l1m2n3o',
                              marker: 2,
                              status: getStatusMultiStep(
                                currentStep,
                                getAdjustedStepIndex(3),
                                getAdjustedStepIndex(3),
                                getAdjustedStepIndex(9)
                              ),
                              title: currentStepName(
                                shouldShowAanbiederStep() ? 3 : 2
                              ),
                              steps: [
                                {
                                  id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
                                  status: getStatus(
                                    currentStep,
                                    getAdjustedStepIndex(4)
                                  ),
                                  title: 'Licentie',
                                },
                                // Conditionally include Versies only for On-premise cloudDienstverleningsmodel
                                ...((product?.cloudDienstverleningsmodel || '') ===
                                'On-premises (self-managed)'
                                  ? [
                                      {
                                        id: 'a2b3c4d5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
                                        status: getStatus(
                                          currentStep,
                                          getAdjustedStepIndex(5)
                                        ),
                                        title: 'Versies',
                                      },
                                    ]
                                  : []),
                                {
                                  id: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
                                  status: getStatus(
                                    currentStep,
                                    getAdjustedStepIndex(6)
                                  ),
                                  title: 'Referentiecomponenten',
                                },
                                {
                                  id: 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8',
                                  status: getStatus(
                                    currentStep,
                                    getAdjustedStepIndex(7)
                                  ),
                                  title: 'Standaarden',
                                },
                                {
                                  id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
                                  status: getStatus(
                                    currentStep,
                                    getAdjustedStepIndex(8)
                                  ),
                                  title: 'Koppelingen',
                                },
                                {
                                  id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
                                  status: getStatus(
                                    currentStep,
                                    getAdjustedStepIndex(9)
                                  ),
                                  title: 'Diensten',
                                },
                              ],
                            },
                            {
                              id: 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1',
                              marker: 3,
                              status: getStatus(
                                currentStep,
                                getAdjustedStepIndex(10)
                              ),
                              title: 'Controleren',
                            },
                          ];
                          return baseSteps;
                        })()}
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
                              🐛 Debug: Product Object (Click to expand)
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
                              {JSON.stringify(product, null, 2)}
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
                            onClick={() =>
                              setCurrentStep(getPrevStepIndex(currentStep))
                            }
                            disabled={loading}
                          >
                            Vorige
                          </AcButton>
                        )}
                        {currentStep !== getAdjustedStepIndex(10) && (
                          <div className='ac-register-button-wrapper'>
                            <AcButton
                              style='button'
                              className={clsx(
                                currentStep === 0 && 'ac-register-form-next-button'
                              )}
                              icon={<VISUALS.ARROW_RIGHT />}
                              disabled={
                                getDisabledStatus(currentStep) ||
                                loading ||
                                (getLogicalStepFromIndex(currentStep) === 7 &&
                                  standaardenLoading)
                              }
                              onClick={() => {
                                focusForm();
                                // In single-app mode, ensure a module exists before jumping to Licentie
                                ensureSingleModuleInitialized();
                                setCurrentStep(getNextStepIndex(currentStep));
                              }}
                              title={
                                getDisabledStatus(currentStep)
                                  ? getDisabledTooltip(currentStep, product)
                                  : ''
                              }
                            >
                              Volgende
                            </AcButton>
                          </div>
                        )}

                        {currentStep === getAdjustedStepIndex(10) && (
                          <AcButton
                            style='button'
                            icon={<VISUALS.CLIPBOARD_CHECK />}
                            onClick={handleRegister}
                            loading={loading}
                            disabled={loading}
                          >
                            Product aanmelden
                          </AcButton>
                        )}
                      </div>

                      {/* Info boxes now handled within individual stage components via ConExistingModulesInfoBox */}
                      {/* Exception: Standaarden stage still uses the old renderExistingAppsInfoBox */}
                      {currentStep === 7 && renderExistingAppsInfoBox('standaarden')}
                    </div>
                  </div>
                </AcColumn>
              </div>
            </>
          )}

          {/* Success Feedback Page */}
          {registerCallBack === 'success' && (
            <div>
              <Heading1>🎉 Product succesvol aangemeld!</Heading1>

              <Alert type='success'>
                <Paragraph>
                  <strong>Uw product is succesvol geregistreerd!</strong>
                </Paragraph>
                <Paragraph>
                  Het product {product.naam || 'Onbekend product'} en alle
                  bijbehorende modules, standaarden, koppelingen en diensten zijn
                  opgeslagen in de software catalogus.
                </Paragraph>
              </Alert>

              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <UnorderedList>
                  <UnorderedListItem>
                    Het product wordt zichtbaar in de software catalogus
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Organisaties kunnen het product bekijken en beoordelen
                  </UnorderedListItem>
                  <UnorderedListItem>
                    U kunt het product beheren via het beheer dashboard
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
                  onClick={() => (window.location.href = '/beheer')}
                >
                  Terug naar beheer dashboard
                </AcButton>

                <AcButton
                  style='button'
                  variant='secondary'
                  icon={<VISUALS.CUBE />}
                  onClick={() => {
                    setRegisterCallBack(null);
                    setCurrentStep(0);
                    // Reset form for new product
                    window.location.reload();
                  }}
                  sx={{ marginLeft: '1rem' }}
                >
                  Nieuw product aanmelden
                </AcButton>
              </div>
            </div>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcFormsProduct));
