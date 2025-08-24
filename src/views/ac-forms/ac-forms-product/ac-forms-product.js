import { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcFormField, AcButton, AcCheckbox } from '@src/molecules';
import ReactSelect from 'react-select';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { useDebouncedInput } from '@src/hooks/index';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import StandaardenFormNew from './components/standaarden-form-new';

import {
  Heading1,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import licenses from '@assets/licenses/licenses.json';

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
 *           richtingDataUitwisseling?: string, sooortKoppeling?: string
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

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Product form type from URL:', formType);
  }

  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [isMultiApplicatie, setIsMultiApplicatie] = useState(true); // shows wether the product has multiple applicaties, used to dictate how to render the form
  
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

  /**
   * Check if a step should be accessible for navigation
   * Only allow navigation to completed steps or the current step
   * @param {number} visualStepIndex - The visual step index
   * @returns {boolean} Whether the step should be accessible
   */
  const isStepAccessible = (visualStepIndex) => {
    const showsAanbiederStep = shouldShowAanbiederStep();
    let actualStepIndex = visualStepIndex;
    
    if (!showsAanbiederStep && visualStepIndex >= 2) {
      actualStepIndex = visualStepIndex + 1;
    }
    
    // Only allow navigation to completed steps (steps before current) or current step
    return actualStepIndex <= currentStep;
  };

  // Add click handlers to ProcessSteps after each render
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      // Find all step elements in the DOM
      const stepElements = processStepsRef.current.querySelectorAll(
        '[class*="process-step"], [role="button"], [role="tab"], .step, [data-step]'
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
    contactpersoon: null, // Contact person object reference
    cloudDienstverleningsmodel: '', // Cloud service model enum
    modules: [], // Array of module objects/UUIDs

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

    // Legacy properties for existing wizard steps (will be migrated)
    // These are maintained for compatibility with existing ApplicatieStep and other components
    applicaties: {}, // Empty applications list - will be populated by user
  });
  const [touched, setTouched] = useState({
    productName: false,
  });
  const [allSameType, setAllSameType] = useState(false);

  // Persist UI state for DienstenForm across steps
  const [dienstenFormState, setDienstenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedApplication: {},
    selectedDienstByRow: {},
    allAppsDienst: null,
  });

  // Persist UI state for ReferentiecomponentenForm across steps
  const [refCompFormState, setRefCompFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedApplication: {},
    selectedRefCompsByRow: {}, // rowId -> array of values
  });

  // Separate array to track chosen referentieComponenten with their standards
  // Structure: [{ id, naam, aanbevolenStandaarden: [], verplichteStandaarden: [], applicatieId }]
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] = useState([]);

  // Persist UI state for KoppelingenForm across steps
  const [koppelingenFormState, setKoppelingenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedAppAByRow: {},
    selectedAppBByRow: {},
    directionByRow: {},
    typeByRow: {},
  });

  const setProductData = useCallback((key, value) => {
    if (key.includes('applicaties')) {
      const parts = key.split('.');
      const id = parts[1];
      const field = parts[2];

      setProduct((prev) => {
        // Handle diensten array specially
        if (field === 'diensten') {
          return {
            ...prev,
            applicaties: {
              ...prev.applicaties,
              [id]: {
                ...prev.applicaties[id],
                diensten: [...(prev.applicaties[id]?.diensten || []), value],
              },
            },
          };
        }

        // Handle other fields normally
        return {
          ...prev,
          applicaties: {
            ...prev.applicaties,
            [id]: {
              ...prev.applicaties[id],
              [field]: value,
            },
          },
        };
      });

      setTouched((prev) => ({
        ...prev,
        applicaties: {
          ...prev.applicaties,
          [id]: {
            ...prev.applicaties?.[id],
            [field]: true,
          },
        },
      }));
    } else {
      setProduct((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({
        ...prev,
        [key]: true,
      }));
    }
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

  /**
   * Generate a default/empty product object based on the product schema using ObjectStore
   * @param {Object} productSchema - The product schema object
   * @returns {Object} Default product object with schema-based properties
   */
  const createDefaultProductFromSchema = useCallback((productSchema) => {
    // Use the centralized ObjectStore method for schema-based object creation
    const defaultProduct = store.object.createDefaultObjectFromSchema(productSchema, {
      // Legacy wizard structure for compatibility - ensures applicaties property exists
      applicaties: {},
    });
    
    return defaultProduct;
  }, [store.object]);

  /**
   * Get existing applications for information display
   * Used to show which applications are excluded from configuration
   */
  const getExistingApplications = useCallback(() => {
    const allApplicatieIndices = Object.keys(product.applicaties || {})
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    return allApplicatieIndices
      .filter((index) => {
        const app = product.applicaties[index];
        return app?.isExisting; // Only existing applications
      })
      .map((index) => product.applicaties[index]?.naam || `Applicatie ${index + 1}`);
  }, [product.applicaties]);

  /**
   * Render info box for steps that exclude existing applications
   * Shows consistent messaging about why certain applications aren't shown
   */
  const renderExistingAppsInfoBox = useCallback((stepType) => {
    const existingApps = getExistingApplications();
    
    if (existingApps.length === 0) return null;

    const stepTexts = {
      license: {
        title: 'Bestaande applicaties uitgesloten',
        description: 'Voor bestaande applicaties kunnen geen licenties worden toegevoegd of aangepast, omdat deze al hun eigen licentie-informatie hebben vastgelegd in de catalogus.',
      },
      referentiecomponenten: {
        title: 'Bestaande applicaties uitgesloten', 
        description: 'Voor bestaande applicaties kunnen geen referentiecomponenten worden toegevoegd of aangepast, omdat deze al hun eigen referentiecomponenten hebben vastgelegd in de catalogus.',
      },
      standaarden: {
        title: 'Bestaande applicaties uitgesloten',
        description: 'Voor bestaande applicaties kunnen geen standaarden worden toegevoegd of aangepast, omdat deze al hun eigen standaarden hebben vastgelegd in de catalogus.',
      },
      moduleVersies: {
        title: 'Bestaande applicaties uitgesloten',
        description: 'Voor bestaande applicaties kunnen geen versies worden toegevoegd of aangepast, omdat deze al hun eigen versie-informatie hebben vastgelegd in de catalogus.',
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
        <div style={{ marginTop: '0.5rem' }}>
          {text.description}
        </div>
        <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
          De volgende bestaande applicatie{existingApps.length > 1 ? 's' : ''} worden daarom niet in dit overzicht getoond:
        </div>
        <ul style={{ marginTop: '0.25rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
          {existingApps.map((naam, index) => (
            <li key={index}>{naam}</li>
          ))}
        </ul>
      </Alert>
    );
  }, [getExistingApplications]);

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
            const response = await fetch(
              `${BASE_URL}/openregister/api/schemas/${schemaType}`,
              {
                headers: { Accept: 'application/json' },
              }
            );
            if (!response.ok) {
              console.warn(
                `Schema fetch failed for ${schemaType}:`,
                response.status
              );
              return { schemaType, schema: null };
            }
            const schema = await response.json();
            console.log(`✅ Fetched schema for ${schemaType}:`, schema);
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
          setProduct(prevProduct => {
            // Only update if current product is the default/empty state
            // Don't override if user has already started filling the form
            const isEmpty = !prevProduct.naam && !prevProduct.website && !prevProduct.beschrijvingKort;
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
   * Utility function to get field information from schemas
   * @param {string} schemaType - The schema type (product, module, dienst, koppeling, compliancy)
   * @param {string} fieldName - The field name to look up
   * @returns {object|null} Field schema information or null if not found
   */
  const getFieldFromSchema = (schemaType, fieldName) => {
    const schema = schemas[schemaType];
    if (!schema?.properties) return null;

    // Support nested field paths with dot notation (e.g., "bivClassificatie.beschikbaarheid")
    const fieldPath = fieldName.split('.');
    let currentSchema = schema.properties;

    for (const pathSegment of fieldPath) {
      if (!currentSchema[pathSegment]) return null;

      if (
        currentSchema[pathSegment].type === 'object' &&
        currentSchema[pathSegment].properties
      ) {
        currentSchema = currentSchema[pathSegment].properties;
      } else {
        return currentSchema[pathSegment];
      }
    }

    return null;
  };

  /**
   * Get enhanced field configuration using schema information
   * @param {string} schemaType - The schema type to look up
   * @param {string} fieldName - The field name
   * @param {object} baseConfig - Base field configuration
   * @returns {object} Enhanced field configuration with schema information
   */
  const getEnhancedFieldConfig = (schemaType, fieldName, baseConfig = {}) => {
    const fieldSchema = getFieldFromSchema(schemaType, fieldName);
    if (!fieldSchema) return baseConfig;

    return {
      ...baseConfig,
      label: fieldSchema.title || baseConfig.label || fieldName,
      description: fieldSchema.description || baseConfig.description,
      required: fieldSchema.required || baseConfig.required,
      placeholder: fieldSchema.example || baseConfig.placeholder,
      type: fieldSchema.type || baseConfig.type,
      enum: fieldSchema.enum || baseConfig.enum,
      format: fieldSchema.format || baseConfig.format,
      minLength: fieldSchema.minLength || baseConfig.minLength,
      maxLength: fieldSchema.maxLength || baseConfig.maxLength,
      minimum: fieldSchema.minimum || baseConfig.minimum,
      maximum: fieldSchema.maximum || baseConfig.maximum,
      pattern: fieldSchema.pattern || baseConfig.pattern,
    };
  };

  // Standards options via API
  const [standaardOptionsState, setStandaardOptionsState] = useState([]);
  const standaardOptionsRef = { current: standaardOptionsState };
  useEffect(() => {
    let isMounted = true;
    const baseEndpoint = `${BASE_URL}/openregister/api/objects/vng-gemma/element`;
    const mapToOption = (item, index) => {
      const label =
        item?.naam ||
        item?.name ||
        item?.title ||
        item?.label ||
        `Standaard ${index + 1}`;
      const value = item?.value || item?.id || item?.slug || label;
      return { value: String(value), label: String(label) };
    };
    const fetchOptions = async () => {
      try {
        // Add pagination parameters to limit initial load
        const params = new URLSearchParams({
          _limit: '50',
          _page: '1',
        });
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
        const options = list.map(mapToOption).filter((o) => o.label && o.value);
        if (isMounted) setStandaardOptionsState(options);
      } catch (e) {
        console.error('Failed to fetch standards:', e);
        if (isMounted) setStandaardOptionsState([]);
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Note: StandaardenForm now uses its own internal state management

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

  // Referentiecomponenten options (empty by default; will be filled via API)
  const [referentieComponentenOptions, setReferentieComponentenOptions] = useState(
    []
  );
  // Remove unused loading/error flags to keep lint clean; we optimistically load and fallback to empty

  useEffect(() => {
    let isMounted = true;
    
    // Get query parameters from schema property configuration
    const getReferentieComponentenQueryParams = () => {
      // Extract query parameters from module schema referentieComponenten property
      const moduleSchema = schemas?.module;
      const refCompProperty = moduleSchema?.properties?.referentieComponenten;
      const queryParamsString = refCompProperty?.items?.objectConfiguration?.queryParams;
      
      const baseParams = {
        _limit: '500',
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
        baseParams._extend = 'aanbevolenStandaarden,verplichteStandaarden';
      }
      
      return baseParams;
    };
    
    const baseEndpoint = `${BASE_URL}/openregister/api/objects/vng-gemma/element`;

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
        data: item // Store the full API data for access to aanbevolenStandaarden, verplichteStandaarden
      };
    };

    const fetchOptions = async () => {
      try {
        // Use schema-driven query parameters
        const queryParams = getReferentieComponentenQueryParams();
        const params = new URLSearchParams(queryParams);
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
        const options = list.map(mapToOption).filter((o) => o.label && o.value);
        if (isMounted) setReferentieComponentenOptions(options);
      } catch (e) {
        console.error('Failed to fetch referentie componenten:', e);
        if (isMounted) setReferentieComponentenOptions([]);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [schemas]); // Add schemas dependency to re-fetch when schemas are loaded

  // Modules options (global fetch like standaarden/referentiecomponenten)
  // Modules list for KoppelingenForm
  const [modulesOptions, setModulesOptions] = useState([]);
  useEffect(() => {
    let isMounted = true;
    const baseEndpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module`;
    const mapToOption = (item, index) => {
      const label =
        item?.naam ||
        item?.name ||
        item?.title ||
        item?.label ||
        `Module ${index + 1}`;
      const value = item?.value || item?.id || item?.slug || label;
      return { value: String(value), label: String(label) };
    };
    const fetchOptions = async () => {
      try {
        // Add pagination parameters to limit initial load
        const params = new URLSearchParams({
          _limit: '50',
          _page: '1',
        });
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
        const options = list.map(mapToOption).filter((o) => o.label && o.value);
        if (isMounted) setModulesOptions(options);
      } catch (e) {
        console.error('Failed to fetch modules:', e);
        if (isMounted) setModulesOptions([]);
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-set aanbieder to user's active organization
  useEffect(() => {
    if (userStore?.activeOrganization && !product.aanbieder) {
      console.log(
        '🏢 Auto-setting aanbieder to user active organization:',
        userStore.activeOrganization
      );
      setProductData('aanbieder', userStore.activeOrganization);
    }
  }, [userStore?.activeOrganization, product.aanbieder]);

  // State for aanbieder selection
  const [aanbiederkeuze, setAanbiederKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Create a copy of the organization data
      const productData = {
        naam: product.productName,
      };

      const response = await fetch(
        `${BASE_URL}/openconnector/api/endpoint/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'error') {
          setRegisterCallBack('error');
          setError({ message: data.message, errors: data.errors });
        } else {
          setRegisterCallBack('success');
        }
      } else {
        setRegisterCallBack('error');
        setError({
          message: 'Er is een fout opgetreden bij het registreren.',
          errors: null,
        });
      }
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

  // Helper function to get the correct step index accounting for optional aanbieder step
  const getAdjustedStepIndex = (logicalStep) => {
    if (!shouldShowAanbiederStep()) {
      // If aanbieder step is not shown, shift all steps after step 1 down by 1
      return logicalStep > 1 ? logicalStep - 1 : logicalStep;
    }
    return logicalStep;
  };

  // Helper function to get logical step from actual step index
  const getLogicalStepFromIndex = (stepIndex) => {
    // When aanbieder step is NOT shown, we need to map physical steps to logical steps
    // Physical: 0,1,2,3,4,5,6,7,8,9  → Logical: 0,1,3,4,5,6,7,8,9,10
    // When aanbieder step IS shown, physical and logical steps are the same
    if (!shouldShowAanbiederStep() && stepIndex >= 2) {
      return stepIndex + 1; // Skip logical step 2 (aanbieder)
    }
    return stepIndex;
  };

  const renderStep = (step) => {
    // Get the logical step number (accounting for optional aanbieder step)
    const logicalStep = getLogicalStepFromIndex(step);
    
    // Debug logging to understand step mapping
    console.log('🔍 renderStep Debug:', {
      physicalStep: step,
      logicalStep: logicalStep,
      shouldShowAanbiederStep: shouldShowAanbiederStep(),
      formType: formType
    });

    switch (logicalStep) {
      case 0:
        return (
          <ProductOpbouwForm
            {...{
              product,
              setProductData,
              touched,
              isMultiApplicatie,
              setIsMultiApplicatie,
            }}
          />
        );
      case 1:
        return (
          <ProductOpbouwInformationForm
            {...{
              product,
              setProductData,
              loading,
              touched,
              schemas, // Pass schemas for field configuration
            }}
          />
        );
      case 2:
        // Aanbieder informatie step - only shown for 'ontbrekend' type
        if (shouldShowAanbiederStep()) {
          return (
            <AanbiederInformatieForm
              {...{
                product,
                setProductData,
                loading,
                touched,
                schemas, // Pass schemas for field configuration (organisatie schema)
                userStore, // Pass userStore for active organization
                aanbiederkeuze,
                setAanbiederKeuze,
              }}
            />
          );
        }
      // Fall through to next case if aanbieder step is not shown
      case 3:
        return (
          <ApplicatieStep
            {...{
              product,
              setProduct,
              isMultiApplicatie,
              loading,
              schemas, // Pass schemas for field configuration
              schemasLoading, // Pass schemas loading state
              store, // Pass store for useRefOptions
            }}
          />
        );
      case 4:
        return (
          <LicenseAndHostingStep
            {...{
              product,
              setProduct,
              isMultiApplicatie,
              loading,
              schemas,
            }}
          />
        );
      case 5:
        return (
          <ModuleVersieStep
            {...{
              product,
              setProduct,
              isMultiApplicatie,
              loading,
              schemas,
            }}
          />
        );
      case 6:
        return (
          <ReferentieComponentenForm
            {...{
              product,
              setProduct,
              referentieComponentenOptions,
              referentieComponentenWithStandards,
              setReferentieComponentenWithStandards,
              schemas,
              loading: schemasLoading,
            }}
          />
        );
      case 7:
        return (
          <StandaardenFormNew
            product={product}
            setProduct={setProduct}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            schemas={schemas}
          />
        );
      case 8:
        return (
          <KoppelingenForm
            {...{
              product,
              setProduct,
              modulesOptions,
              koppelingenFormState,
              setKoppelingenFormState,
            }}
          />
        );
      case 9:
        return (
          <DienstenForm
            {...{
              currentStep,
              setAllSameType,
              allSameType,
              dienstOptions,
              product,
              setProduct, // keep product updates consistent with ApplicatieStep
              dienstenFormState, // persist form UI state across steps
              setDienstenFormState,
            }}
          />
        );
      case 10:
        return (
          <ControlerenForm
            {...{
              product,
              dienstOptions,
              referentieComponentenOptions,
            }}
          />
        );
    }
  };

  const getStatus = (currentStep, step) => {
    if (currentStep === step) {
      return 'current';
    } else if (currentStep < step) {
      return 'not-checked';
    } else if (currentStep > step) {
      return 'checked';
    }
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
        return 'Versies';
      case 6:
        return 'Referentiecomponenten';
      case 7:
        return 'Standaarden';
      case 8:
        return 'Koppelingen';
      case 9:
        return 'Diensten';
      case 10:
        return 'Controleren';
    }
  };

  const getDisabledStatus = (currentStep) => {
    // TODO: uncomment at the end
    if (currentStep === 0) {
      return false;
    }
    if (currentStep === 1) {
      // Productinformatie step validation
      const requiredFields = ['naam', 'website'];
      const missingFields = requiredFields.filter(field => !product[field] || !product[field].trim());
      
      // Check website format (allow URLs without http/https)
      if (product.website && product.website.trim()) {
        const website = product.website.trim();
        // More permissive domain validation - allow domains with or without protocol
        // Matches: example.com, www.example.com, https://example.com, sub.domain.co.uk, etc.
        const domainRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
        if (!domainRegex.test(website)) {
          return true; // Invalid website format
        }
      }
      
      return missingFields.length > 0;
    }
    if (currentStep === 2) {
      // Applicaties step validation
      const applicaties = product.applicaties || {};
      const applicatieEntries = Object.entries(applicaties);
      
      // Must have at least one application (new or existing)
      if (applicatieEntries.length === 0) {
        return true;
      }
      
      // All new applications must have naam and beschrijving
      const newApplications = applicatieEntries.filter(([id, app]) => !app.isExisting);
      const hasIncompleteNewApps = newApplications.some(([id, app]) => {
        return !app.naam || !app.naam.trim() || !app.beschrijvingKort || !app.beschrijvingKort.trim();
      });
      
      return hasIncompleteNewApps;
    }
    
    if (currentStep === 4) {
      // Licentie step validation
      const applicaties = product.applicaties || {};
      const applicatieEntries = Object.entries(applicaties);
      
      // Check new applications for license requirements
      const newApplications = applicatieEntries.filter(([id, app]) => !app.isExisting);
      const hasIncompleteLicenses = newApplications.some(([id, app]) => {
        // Check both possible field names (schema uses 'licentietype', code uses 'licentieType')
        const licenseType = app.licentietype || app.licentieType;
        // If licentietype is "Open Source", then licentie is required
        return licenseType === 'Open Source' && (!app.licentie || !app.licentie.trim());
      });
      
      return hasIncompleteLicenses;
    }
    
    return false;
  };

  // Add this function to generate the tooltip message
  const getDisabledTooltip = (currentStep, product) => {
    // Example
    if (currentStep === 1) {
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
        const domainRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
        if (!domainRegex.test(website)) {
          messages.push('Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)');
        }
      }
      
      return messages.join('\n');
    }
    
    if (currentStep === 2) {
      const messages = [];
      const applicaties = product.applicaties || {};
      const applicatieEntries = Object.entries(applicaties);
      
      // Check if no applications exist
      if (applicatieEntries.length === 0) {
        messages.push('Een product moet bestaan uit minimaal één applicatie (nieuwe of bestaande)');
        return messages.join('\n');
      }
      
      // Check for incomplete new applications
      const newApplications = applicatieEntries.filter(([id, app]) => !app.isExisting);
      const incompleteApps = [];
      
      newApplications.forEach(([id, app], index) => {
        const missingFields = [];
        if (!app.naam || !app.naam.trim()) {
          missingFields.push('naam');
        }
        if (!app.beschrijvingKort || !app.beschrijvingKort.trim()) {
          missingFields.push('beschrijving');
        }
        
        if (missingFields.length > 0) {
          // Use the actual application name if available, otherwise fall back to "Nieuwe applicatie X"
          const appName = app.naam && app.naam.trim() ? app.naam.trim() : `Nieuwe applicatie ${index + 1}`;
          incompleteApps.push(`${appName}: ${missingFields.join(', ')} ontbreekt`);
        }
      });
      
      if (incompleteApps.length > 0) {
        messages.push('Alle nieuwe applicaties moeten een naam en beschrijving hebben:');
        messages.push(...incompleteApps);
      }
      
      return messages.join('\n');
    }
    
    if (currentStep === 4) {
      // Licentie step validation messages
      const messages = [];
      const applicaties = product.applicaties || {};
      const applicatieEntries = Object.entries(applicaties);
      
      // Check for incomplete licenses in new applications
      const newApplications = applicatieEntries.filter(([id, app]) => !app.isExisting);
      const incompleteLicenses = [];
      
      newApplications.forEach(([id, app], index) => {
        // Check both possible field names (schema uses 'licentietype', code uses 'licentieType')
        const licenseType = app.licentietype || app.licentieType;
        if (licenseType === 'Open Source' && (!app.licentie || !app.licentie.trim())) {
          // Use the actual application name if available
          const appName = app.naam && app.naam.trim() ? app.naam.trim() : `Nieuwe applicatie ${index + 1}`;
          incompleteLicenses.push(`${appName}: licentie is verplicht bij Open Source`);
        }
      });
      
      if (incompleteLicenses.length > 0) {
        messages.push('Voor Open Source applicaties is een licentie verplicht:');
        messages.push(...incompleteLicenses);
      }
      
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
                    <div 
                      ref={processStepsRef}
                      className='ac-register-process-steps'
                    >
                      <ProcessSteps
                        steps={(() => {
                          const baseSteps = [
                          {
                            id: '4p5q6r7s-8t9u-0v1w-2x3y-4z5a6b7c8d9e',
                            marker: 1,
                              status: getStatusMultiStep(
                                currentStep,
                                0,
                                0,
                                shouldShowAanbiederStep() ? 2 : 1
                              ),
                            title: 'Productopbouw',
                            steps: [
                              {
                                id: 'v6w7x8y9-0z1a-2b3c-4d5e-6f7g8h9i0j1k',
                                status: getStatus(currentStep, 1),
                                title: 'Product informatie',
                              },
                                // Conditionally add aanbieder step
                                ...(shouldShowAanbiederStep()
                                  ? [
                                      {
                                        id: 'w7x8y9z0-1a2b-3c4d-5e6f-7g8h9i0j1k2l',
                                        status: getStatus(currentStep, 2),
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
                                shouldShowAanbiederStep() ? 3 : 2,
                                shouldShowAanbiederStep() ? 3 : 2,
                                shouldShowAanbiederStep() ? 9 : 8
                              ),
                              title: currentStepName(
                                shouldShowAanbiederStep() ? 3 : 2
                              ),
                            steps: [
                              {
                                id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
                                  status: getStatus(
                                    currentStep,
                                    shouldShowAanbiederStep() ? 4 : 3
                                  ),
                                title: 'Licentie',
                              },
                              {
                                id: 'a2b3c4d5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
                                  status: getStatus(
                                    currentStep,
                                    shouldShowAanbiederStep() ? 5 : 4
                                  ),
                                title: 'Versies',
                              },
                              {
                                id: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
                                  status: getStatus(
                                    currentStep,
                                    shouldShowAanbiederStep() ? 6 : 5
                                  ),
                                title: 'Referentiecomponenten',
                              },
                              {
                                id: 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8',
                                  status: getStatus(
                                    currentStep,
                                    shouldShowAanbiederStep() ? 7 : 6
                                  ),
                                title: 'Standaarden',
                              },
                              {
                                id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
                                  status: getStatus(
                                    currentStep,
                                    shouldShowAanbiederStep() ? 8 : 7
                                  ),
                                title: 'Koppelingen',
                              },
                              {
                                id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
                                  status: getStatus(
                                    currentStep,
                                    shouldShowAanbiederStep() ? 9 : 8
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
                                shouldShowAanbiederStep() ? 10 : 9
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
                            disabled={loading}
                          >
                            Vorige
                          </AcButton>
                        )}
                        {currentStep !== (shouldShowAanbiederStep() ? 10 : 9) && (
                          <div className='ac-register-button-wrapper'>
                            <AcButton
                              style='button'
                              className={clsx(
                                currentStep === 0 && 'ac-register-form-next-button'
                              )}
                              icon={<VISUALS.ARROW_RIGHT />}
                              disabled={getDisabledStatus(currentStep) || loading}
                              onClick={() => {
                                focusForm();
                                setCurrentStep(currentStep + 1);
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

                        {currentStep === (shouldShowAanbiederStep() ? 10 : 9) && (
                          <AcButton
                            style='button'
                            icon={<VISUALS.CLIPBOARD_CHECK />}
                            onClick={handleRegister}
                            loading={loading}
                            // Disabled until we know what endpoint we need to use and what data we need to send
                            disabled={loading || true}
                          >
                            Product aanmelden
                          </AcButton>
                        )}
                      </div>

                      {/* Info box for steps that exclude existing applications - positioned after navigation for calmer experience */}
                      {currentStep === 4 && renderExistingAppsInfoBox('license')}
                      {currentStep === 5 && renderExistingAppsInfoBox('moduleVersies')}
                      {currentStep === 6 && renderExistingAppsInfoBox('referentiecomponenten')}
                      {currentStep === 7 && renderExistingAppsInfoBox('standaarden')}
                    </div>
                  </div>
                </AcColumn>
              </div>
            </>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

// Step 0  Productopbouw
const ProductOpbouwForm = memo(({ isMultiApplicatie, setIsMultiApplicatie }) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='organization-section-title'
    >
      <h2 id='organization-section-title' className='sr-only'>
        Productopbouw
      </h2>

      <Paragraph>
        Een product kan één applicatie zijn, of een verzameling applicaties en
        modules die samen een suite vormen. Geef hieronder aan welke situatie van
        toepassing is.
      </Paragraph>
      <div className='ac-register-form-checkbox-wrapper'>
        <AcCheckbox
          label='Een enkele'
          value='single'
          checked={!isMultiApplicatie}
          onChange={() => setIsMultiApplicatie(false)}
        />
        <AcCheckbox
          label='Een verzameling applicaties of modules (suite)'
          value='multi'
          checked={isMultiApplicatie}
          onChange={() => setIsMultiApplicatie(true)}
        />
      </div>
    </div>
  );
});

/**
 * Step 1: Product Information Form Component
 *
 * This component renders the product information step using schema-enhanced fields.
 * It replaces hard-coded form fields with dynamic components that derive their
 * configuration from the product schema.
 *
 * Schema Field Mapping:
 * - naam (required, string, max 200 chars) -> naam in state
 * - beschrijvingKort (string, max 255 chars) -> beschrijvingKort in state
 * - beschrijvingLang (markdown, max 5000 chars) -> beschrijvingLang in state
 * - website (required, url, max 500 chars) -> website in state
 * - logo (url) -> logo in state (handled by LogoUploadField for now)
 * - contactpersoon (related-object) -> contactpersoon in state
 * - cloudDienstverleningsmodel (enum) -> cloudDienstverleningsmodel in state
 * - hostingLocatie (enum) -> hostingLocatie in state
 * - hostingJurisdictie (enum) -> hostingJurisdictie in state
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProductData - Function to update product data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration
 */
const ProductOpbouwInformationForm = memo(
  ({ product, setProductData, loading, touched, schemas }) => {
    // Calculate remaining characters for short description
    const remainingDescriptionChars = 255 - (product.beschrijvingKort?.length || 0);

    // Calculate remaining characters for long description
    const remainingLongDescriptionChars =
      5000 - (product.beschrijvingLang?.length || 0);

    return (
      <div role='group' aria-labelledby='organization-section-title'>
        <h2 id='organization-section-title' className='sr-only'>
          Productinformatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Product Name - Required field, full width */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='naam'
              value={product.naam || ''}
              onChange={(value) => setProductData('naam', value)}
              isDisabled={loading}
              width='full' // Override to full width
              // placeholder will come from schema example
              schemas={schemas}
            />

            {/* Website/Product Page - URL field, full width */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='website'
              value={product.website || ''}
              onChange={(value) => setProductData('website', value)}
              isDisabled={loading}
              width='full' // Override to full width
              // placeholder will come from schema example
              schemas={schemas}
            />

            {/* Short Description - Textarea, full width */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='beschrijvingKort'
              value={product.beschrijvingKort || ''}
              onChange={(value) => setProductData('beschrijvingKort', value)}
              isDisabled={loading}
              width='full' // Override to full width
              customProps={{ inputType: 'textarea' }}
              schemas={schemas}
            />
            <small className='ac-register-form-field-help'>
              {remainingDescriptionChars} karakters over
            </small>

            {/* Long Description - Markdown textarea, full width */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='beschrijvingLang'
              value={product.beschrijvingLang || ''}
              onChange={(value) => setProductData('beschrijvingLang', value)}
              isDisabled={loading}
              width='full' // Ensure full width for markdown editor
              customProps={{ inputType: 'wysiwyg-markdown' }}
              schemas={schemas}
            />
            <small className='ac-register-form-field-help'>
              {remainingLongDescriptionChars} karakters over
            </small>

            {/* Logo Upload - Now placed under beschrijvingLang, full width */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='logo'
              value={product.logo}
              onChange={(value) => setProductData('logo', value)}
              isDisabled={loading}
              width='full' // Override to full width
              formData={{
                ...product,
                logoFilename: product.logoFilename, // Include filename for LogoUploadField
              }}
              customProps={{
                inputType: 'file',
                format: 'base64', // This will trigger the LogoUploadField
              }}
              onFieldChange={(fieldPath, value) => {
                // Handle filename updates for LogoUploadField
                if (fieldPath === 'logoFilename') {
                  setProductData('logoFilename', value);
                }
              }}
              schemas={schemas}
            />

            {/* Contact Person - Related object select, auto half width */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='contactpersoon'
              value={product.contactpersoon}
              onChange={(value) => setProductData('contactpersoon', value)}
              isDisabled={loading}
              width='half' // Explicitly set to half width
              schemas={schemas}
            />

            {/* Cloud Service Model - Enum select, half width (next to contact) */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='cloudDienstverleningsmodel'
              value={product.cloudDienstverleningsmodel || ''}
              onChange={(value) =>
                setProductData('cloudDienstverleningsmodel', value)
              }
              isDisabled={loading}
              width='half' // Half width to position next to Contact field
              schemas={schemas}
            />

            {/* Hosting Location - Enum select, half width (left side) */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='hostingLocatie'
              value={product.hostingLocatie || ''}
              onChange={(value) => setProductData('hostingLocatie', value)}
              isDisabled={loading}
              width='half' // Explicitly set to half width
              schemas={schemas}
            />

            {/* Hosting Jurisdiction - Enum select, half width (right side, next to location) */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='hostingJurisdictie'
              value={product.hostingJurisdictie || ''}
              onChange={(value) => setProductData('hostingJurisdictie', value)}
              isDisabled={loading}
              width='half' // Explicitly set to half width
              schemas={schemas}
            />
          </div>
        </div>
      </div>
    );
  }
);

// Applicatie form fields are extracted to module scope to avoid remounts
// used in ApplicatieStep - now using schema-driven fields
const ApplicatieFormFields = memo(
  ({ index, applicatie, updateApplicatie, loading, schemas }) => {
    // Add defensive check for applicatie object
    if (!applicatie) {
      console.warn(`ApplicatieFormFields: applicatie is undefined for index ${index}`);
      return <div>Loading applicatie...</div>;
    }

    // Get module schema for field configuration
    const moduleSchema = schemas?.module;
    if (!moduleSchema) {
      return <div>Schema laden...</div>;
    }

    return (
      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='naam'
            value={applicatie.naam || ''}
            onChange={(value) => updateApplicatie(index, 'naam', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='beschrijvingKort'
            value={applicatie.beschrijvingKort || ''}
            onChange={(value) => updateApplicatie(index, 'beschrijvingKort', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />
        </div>
      </div>
    );
  }
);

// Step 2 Applicatie(s)
const ApplicatieStep = memo(
  ({
    product,
    setProduct,
    isMultiApplicatie,
    loading,
    schemas,
    schemasLoading,
    store,
  }) => {
    // Keep focus while typing by only committing name changes on blur

    // State for selecting existing applications to add
    const [selectedExistingApplication, setSelectedExistingApplication] =
      useState(null);
    // State to store available module options for lookup
    const [availableModuleOptions, setAvailableModuleOptions] = useState([]);

    const updateApplicatie = (index, key, value) => {
      setProduct((prev) => {
        const applicaties = { ...prev.applicaties };
        const existing = applicaties[index];
        applicaties[index] = { ...existing, [key]: value };
        return { ...prev, applicaties: applicaties };
      });
    };

    const addApplicatie = () => {
      setProduct((prev) => {
        const indices = Object.keys(prev.applicaties).map((k) => parseInt(k, 10));
        const nextIndex = indices.length ? Math.max(...indices) + 1 : 0;

        const createEmptyClone = (template) => {
          if (Array.isArray(template)) return [];
          if (template && typeof template === 'object') {
            return Object.keys(template).reduce((acc, key) => {
              acc[key] = createEmptyClone(template[key]);
              return acc;
            }, {});
          }
          return '';
        };

        const templateIndex = indices.length ? Math.max(...indices) : null;
        const template =
          templateIndex !== null ? prev.applicaties[templateIndex] : {};
        const emptyApplicatie = createEmptyClone(template);

        return {
          ...prev,
          applicaties: {
            ...prev.applicaties,
            [nextIndex]: emptyApplicatie,
          },
        };
      });
    };

    // Function to add an existing application to the applications list
    const addExistingApplication = () => {
      if (!selectedExistingApplication) return;

      // Debug logging to understand the data structure
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Adding existing application:', {
          selectedApplication: selectedExistingApplication,
          isArray: Array.isArray(selectedExistingApplication),
          isString: typeof selectedExistingApplication === 'string',
          length: selectedExistingApplication?.length,
          firstItem: Array.isArray(selectedExistingApplication)
            ? selectedExistingApplication[0]
            : selectedExistingApplication,
          storeCollections: store?.object
            ? Object.keys(store.object.collections || {})
            : 'no store',
        });
      }

      // Handle different data types: string ID, object, or array
      let selectedItem;

      if (typeof selectedExistingApplication === 'string') {
        // If it's just a string ID, we need to find the full object from available options
        // Get the options from the store directly
        const collectionType = 'voorzieningen_module_options';
        const moduleCollection = store?.object?.getCollection?.(collectionType);

        console.log('🔍 Looking for module collection:', {
          collectionType,
          hasCollection: !!moduleCollection,
          resultsCount: moduleCollection?.results?.length,
          firstResult: moduleCollection?.results?.[0],
        });

        if (moduleCollection?.results) {
          const foundModule = moduleCollection.results.find(
            (item) => item['@self']?.id === selectedExistingApplication
          );
          console.log('🔍 Found module:', {
            foundModule,
            searchingFor: selectedExistingApplication,
          });

          if (foundModule) {
            selectedItem = {
              value: selectedExistingApplication,
              label: foundModule['@self']?.name || 'Unnamed Module',
              data: foundModule,
            };
          } else {
            console.warn(
              'Could not find module data for ID:',
              selectedExistingApplication
            );
            return;
          }
        } else {
          console.warn('Module collection not available');
          return;
        }
      } else if (Array.isArray(selectedExistingApplication)) {
        selectedItem = selectedExistingApplication[0]; // Take first item if array
      } else {
        selectedItem = selectedExistingApplication; // Use directly if object
      }

      if (!selectedItem) {
        console.warn('No selected item found');
        return;
      }

      setProduct((prev) => {
        const indices = Object.keys(prev.applicaties).map((k) => parseInt(k, 10));
        const nextIndex = indices.length ? Math.max(...indices) + 1 : 0;

        // Extract data from the selected application
        const applicationData = selectedItem.data || {};

        // Create a new application entry with the existing application data
        // Try multiple possible field names from the API data
        const newApplicatie = {
          // Copy basic info from selected application - try various field names
          naam:
            selectedItem.label ||
            applicationData.naam ||
            applicationData.name ||
            applicationData.title ||
            applicationData['@self']?.name ||
            'Unnamed Application',

          beschrijvingKort:
            applicationData.beschrijvingKort ||
            applicationData.beschrijving ||
            applicationData.description ||
            applicationData.beschrijvingLang ||
            applicationData.summary ||
            applicationData['@self']?.description ||
            '',

          // Mark this as an existing application (read-only)
          isExisting: true,
          existingApplicationId: selectedItem.value,
          existingApplicationData: applicationData,
          // Initialize other required fields as empty
          licentieType: '',
          licentie: '',
          hostingLocatie: '',
          hostingJurisdictie: '',
          standaarden: [],
          referentieComponenten: [],
          diensten: [],
        };

        console.log('🔧 Created new applicatie entry:', newApplicatie);

        return {
          ...prev,
          applicaties: { ...prev.applicaties, [nextIndex]: newApplicatie },
        };
      });

      // Clear the selection
      setSelectedExistingApplication(null);
    };

    if (!isMultiApplicatie) {
      const app0 = product.applicaties?.[0];
      
      // Ensure there's always an applicatie object for single applicatie mode
      if (!app0) {
        // Initialize applicatie with product name and description if available
        const productName = product.naam || '';
        const productDescription = product.beschrijvingKort || '';
        
        // Initialize the applicatie with product data
        setProduct(prev => ({
          ...prev,
          applicaties: {
            ...prev.applicaties,
            0: {
              naam: productName,
              beschrijvingKort: productDescription,
            }
          }
        }));
        
        return <div>Initialiseren...</div>;
      }
      
      return (
        <div
          className='ac-register-form-section'
          role='group'
          aria-labelledby='applicatie-section-title'
        >
          <h2 id='applicatie-section-title' className='sr-only'>
            Applicatie
          </h2>
          <ApplicatieFormFields
            index={0}
            applicatie={app0}
            updateApplicatie={updateApplicatie}
            loading={loading}
            schemas={schemas}
          />
        </div>
      );
    }

    const applicatieIndices = Object.keys(product.applicaties || {})
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='applicaties-section-title'
      >
        <h2 id='applicaties-section-title' className='sr-only'>
          Applicaties
        </h2>
        <Table>
          <thead>
            <TableRow>
              <TableCell>
                <b>{schemas?.module?.properties?.naam?.title || 'Naam'}</b>
              </TableCell>
              <TableCell>
                <b>{schemas?.module?.properties?.beschrijvingKort?.title || 'Beschrijving'}</b>
              </TableCell>
              <TableCell>
                <b>Acties</b>
              </TableCell>
            </TableRow>
          </thead>
          <TableBody>
            {applicatieIndices.map((index) => {
              const applicatie = product.applicaties[index];
              const isExisting = applicatie?.isExisting;

              return (
              <TableRow key={index}>
                <TableCell>
                    {isExisting ? (
                      // Read-only display for existing modules
                      <div
                        style={{
                          padding: '8px 12px',
                          minHeight: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666',
                          fontStyle: 'italic',
                        }}
                      >
                        {applicatie.naam}{' '}
                        <small style={{ marginLeft: '8px', color: '#999' }}>
                          (bestaande applicatie)
                        </small>
                      </div>
                    ) : (
                  <Textbox
                    id={`table-applicatie-naam-${index}`}
                        value={applicatie?.naam || ''}
                        onChange={(e) =>
                          updateApplicatie(index, 'naam', e.target.value)
                        }
                    placeholder={schemas?.module?.properties?.naam?.example || 'Naam van de applicatie'} // placeholder will come from schema example
                    disabled={loading}
                  />
                    )}
                </TableCell>
                <TableCell>
                    {isExisting ? (
                      // Read-only display for existing modules
                      <div
                        style={{
                          padding: '8px 12px',
                          minHeight: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666',
                          fontStyle: 'italic',
                        }}
                      >
                        {applicatie.beschrijvingKort ||
                          'Geen beschrijving beschikbaar'}
                      </div>
                    ) : (
                  <Textbox
                    id={`table-applicatie-beschrijving-${index}`}
                        value={applicatie?.beschrijvingKort || ''}
                    onChange={(e) =>
                      updateApplicatie(index, 'beschrijvingKort', e.target.value)
                    }
                    maxLength={255}
                    placeholder={schemas?.module?.properties?.beschrijvingKort?.example || 'Beschrijving van de applicatie'} // placeholder will come from schema example
                    disabled={loading}
                  />
                    )}
                </TableCell>
                <TableCell>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <AcButton
                      style='button'
                      buttonType='secondary'
                        icon={<VISUALS.TRASHCAN />}
                      disabled={applicatieIndices.length === 1}
                      onClick={() => {
                        setProduct((prev) => {
                          const next = {
                            ...prev,
                            applicaties: { ...prev.applicaties },
                          };
                          delete next.applicaties[index];
                          return next;
                        });
                      }}
                      title='Applicatie verwijderen'
                    ></AcButton>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div style={{ marginTop: '1rem' }}>
          {/* Explanation text */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Paragraph>
              <strong>Applicaties toevoegen aan uw product</strong>
            </Paragraph>
            <Paragraph>
              U heeft twee opties om applicaties toe te voegen aan uw product:
            </Paragraph>
          </div>

          <div
            className='ac-register-review'
            style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}
          >
            {/* New application block */}
            <div
              className='ac-register-form-section'
              style={{ flex: '1', minWidth: '0', display: 'flex' }}
            >
              <div
                className='ac-register-review__section'
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div
                  className='ac-register-review__field'
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    flex: '1',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <Paragraph style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Nieuwe applicatie</strong>
                    </Paragraph>
                    <Paragraph
                      style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}
                    >
                      Maak een volledig nieuwe applicatie aan. U configureert alle
                      instellingen, licenties, standaarden en referentiecomponenten
                      zelf.
                    </Paragraph>
                  </div>

                  <AcButton
                    style='button'
                    icon={<VISUALS.PLUS />}
                    onClick={addApplicatie}
                    disabled={loading}
                    className='ac-forms-full-width-button'
                  >
                    Nieuwe applicatie toevoegen
          </AcButton>
                </div>
              </div>
            </div>

            {/* Existing application block */}
            <div
              className='ac-register-form-section'
              style={{ flex: '1', minWidth: '0', display: 'flex' }}
            >
              <div
                className='ac-register-review__section'
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div
                  className='ac-register-review__field'
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    flex: '1',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <Paragraph style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Bestaande applicatie</strong>
                    </Paragraph>
                    <Paragraph
                      style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}
                    >
                      Koppel een reeds bestaande applicatie uit de catalogus. Alle
                      instellingen, licenties en compliance-informatie zijn al
                      vastgelegd.
                    </Paragraph>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <ConSchemaEnhancedField
                        schemaType='product'
                        schemaProperty='modules'
                        value={selectedExistingApplication}
                        onChange={setSelectedExistingApplication}
                        schemas={schemas}
                        formData={{}}
                        store={store}
                        width='full'
                        showLabel={false}
                        showDescription={false}
                        customProps={{
                          // placeholder will come from schema example
                          // Force single-select instead of multi-select
                          isMulti: false,
                          // Override the array behavior
                          type: 'select',
                        }}
                      />
                    </div>

                    <div style={{ paddingTop: '0.5rem' }}>
                      <AcButton
                        style='button'
                        buttonType='primary'
                        disabled={!selectedExistingApplication || loading}
                        onClick={addExistingApplication}
                      >
                        Toevoegen
                      </AcButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// Step 3: Licentie
const LicenseAndHostingStep = memo(
  ({ product, setProduct, isMultiApplicatie, loading, schemas }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // Options
    const licentieTypeOptions = [
      { value: 'Closed Source', label: 'Closed Source' },
      { value: 'Open Source', label: 'Open Source' },
    ];

    const licentieOptions = licenses.map((l) => ({
      value: l['SPDX ID'],
      label: l.name,
    }));

    // Get all application indices
    const allApplicatieIndices = Object.keys(product.applicaties || {})
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    // Filter out existing applications for license configuration - only new applications need license setup
    const applicatieIndices = allApplicatieIndices.filter((index) => {
      const app = product.applicaties[index];
      return !app?.isExisting; // Only include new applications (not existing ones)
    });

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: product.applicaties?.[i]?.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need license configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;



    const updateApplicatieField = (index, key, value) => {
      setProduct((prev) => {
        const next = { ...prev, applicaties: { ...prev.applicaties } };
        next.applicaties[index] = { ...next.applicaties[index], [key]: value };
        return next;
      });
    };

    const applyToAll = (fields) => {
      setProduct((prev) => {
        const next = { ...prev, applicaties: { ...prev.applicaties } };
        // Only apply to NEW applications (not existing ones)
        applicatieIndices.forEach((index) => {
          const k = String(index);
          if (next.applicaties[k] && !next.applicaties[k].isExisting) {
          next.applicaties[k] = { ...next.applicaties[k], ...fields };
          }
        });
        return next;
      });
    };

    // renderSelectors function removed - now using direct implementation for better reactivity

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='license-hosting-section-title'
      >
        <h2 id='license-hosting-section-title' className='sr-only'>
          Licentie
        </h2>
        <Paragraph>
          Geef hieronder aan welke licenties van toepassing zijn op de nieuwe applicatie(s).
        </Paragraph>

        {applicatieIndices.length === 0 && allApplicatieIndices.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              background: '#f8f9fa',
              borderRadius: '8px',
            }}
          >
            <Paragraph>
              <strong>Geen nieuwe applicaties gevonden</strong>
            </Paragraph>
            <Paragraph>
              Alle applicaties in dit product zijn bestaande applicaties die al hun
              eigen licentie-informatie hebben vastgelegd in de catalogus. Er hoeven geen
              licenties geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        {applicatieIndices.length > 0 && isMultiNewApplicatie && (
          <div
            className='ac-register-form-checkbox-wrapper'
            style={{ marginBottom: '1rem' }}
          >
            <p>Geldt dezelfde licentie-informatie voor alle nieuwe applicaties?</p>
            <AcCheckbox
              label='Ja, voor alle applicaties hetzelfde'
              value='same'
              checked={sameForAll}
              onChange={() => setSameForAll(true)}
            />
            <AcCheckbox
              label='Nee, per applicatie verschillend'
              value='per-app'
              checked={!sameForAll}
              onChange={() => setSameForAll(false)}
            />
          </div>
        )}

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Direct implementation instead of renderSelectors for better reactivity */}
            <div className='ac-register-form-grid'>
              <div>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='licentietype'
                  value={(() => {
                    const currentApp = product.applicaties?.[applicatieIndices[0]] || {};
                    return currentApp.licentietype || currentApp.licentieType || '';
                  })()}
                  onChange={(value) => {
                    // Store as both schema field name and camelCase for compatibility
                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({
                        licentietype: value,  // Schema field name
                        licentieType: value,  // Legacy camelCase
                        ...(value !== 'Open Source' ? { licentie: '' } : {}),
                      });
                    } else {
                      updateApplicatieField(applicatieIndices[0], 'licentietype', value);
                      updateApplicatieField(applicatieIndices[0], 'licentieType', value);
                      if (value !== 'Open Source') updateApplicatieField(applicatieIndices[0], 'licentie', '');
                    }
                  }}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />
              </div>
              <div>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='licentie'
                  value={(() => {
                    const currentApp = product.applicaties?.[applicatieIndices[0]] || {};
                    return currentApp.licentie || '';
                  })()}
                  onChange={(value) => {
                    // Handle license change directly
                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({ licentie: value });
                    } else {
                      updateApplicatieField(applicatieIndices[0], 'licentie', value);
                    }
                  }}
                  isDisabled={(() => {
                    // Get current license type dynamically
                    const currentApp = product.applicaties?.[applicatieIndices[0]] || {};
                    const currentLicenseType = currentApp.licentietype || currentApp.licentieType || '';
                    return loading || currentLicenseType !== 'Open Source';
                  })()}
                  width='half'
                  schemas={schemas}
                  customProps={(() => {
                    // Get current values dynamically for customProps
                    const currentApp = product.applicaties?.[applicatieIndices[0]] || {};
                    const currentLicenseType = currentApp.licentietype || currentApp.licentieType || '';
                    const currentLicense = currentApp.licentie || '';
                    const isOpenSource = currentLicenseType === 'Open Source';
                    
                    return {
                      // Add required styling when Open Source is selected
                      className: clsx(
                        isOpenSource && !currentLicense && 'ac-beheer-select--error'
                      ),
                      placeholder: isOpenSource ? 'Selecteer licentie (verplicht)' : 'Selecteer licentie',
                      // Make field required when Open Source is selected
                      required: isOpenSource,
                      // Add visual required indicator
                      label: isOpenSource ? 'licentie *' : 'licentie'
                    };
                  })()}
                />
              </div>
            </div>
          </div>
        ) : applicatieIndices.length > 0 ? (
          <div>
            <Table>
              <thead>
                <TableRow>
                  <TableCell>
                    <b>Nieuwe applicatie</b>
                  </TableCell>
                  <TableCell>
                    <b>Type licentie</b>
                  </TableCell>
                  <TableCell>
                    <b>Licentie</b>
                  </TableCell>
                </TableRow>
              </thead>
              <TableBody>
                {applicatieIndices.map((index) => {
                  const app = product.applicaties[index] || {};
                  const selectedType =
                    licentieTypeOptions.find((o) => o.value === (app.licentietype || app.licentieType)) ||
                    null;
                  const selectedLicentie =
                    licentieOptions.find((o) => o.value === app.licentie) || null;
                  const isOpenSourceSelected = selectedType?.value === 'Open Source';
                  const isLicenseRequired = isOpenSourceSelected && !selectedLicentie;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            'ac-beheer-select--disabled'
                          )}
                          value={
                            applicatieOptions.find((o) => o.value === index) || null
                          }
                          options={applicatieOptions}
                          isDisabled
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            loading && 'ac-beheer-select--disabled'
                          )}
                          value={selectedType}
                          onChange={(opt) => {
                            const value = opt?.value || null;
                            // Store as both schema field name and camelCase for compatibility
                            updateApplicatieField(index, 'licentietype', value);
                            updateApplicatieField(index, 'licentieType', value);
                            // Clear license if not Open Source
                            if (value !== 'Open Source') {
                              updateApplicatieField(index, 'licentie', '');
                            }
                          }}
                          options={licentieTypeOptions}
                          isDisabled={loading}
                          placeholder='Selecteer type licentie'
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            (loading || selectedType?.value !== 'Open Source') &&
                              'ac-beheer-select--disabled',
                            // Add red border when Open Source is selected but no license is chosen
                            isLicenseRequired && 'ac-beheer-select--error'
                          )}
                          value={selectedLicentie}
                          onChange={(opt) =>
                            updateApplicatieField(
                              index,
                              'licentie',
                              opt?.value || null
                            )
                          }
                          options={licentieOptions}
                          isDisabled={
                            loading || selectedType?.value !== 'Open Source'
                          }
                          placeholder={isOpenSourceSelected ? 'Selecteer licentie (verplicht)' : 'Selecteer licentie'}
                          isClearable
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          // No new applications that need license configuration
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
            <Paragraph style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
              Alle applicaties zijn bestaande applicaties uit de catalogus. 
              Hun licentie-informatie is al vastgelegd en hoeft niet opnieuw geconfigureerd te worden.
            </Paragraph>
          </div>
        )}
      </div>
    );
  }
);

// Step 5: ModuleVersies
const ModuleVersieStep = memo(
  ({ product, setProduct, isMultiApplicatie, loading, schemas }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // Get moduleVersie schema for status options
    const moduleVersieSchema = schemas?.moduleversie;
    const statusOptions = moduleVersieSchema?.properties?.status?.enum?.map(status => ({
      value: status,
      label: status
    })) || [];

    // Get all application indices
    const allApplicatieIndices = Object.keys(product.applicaties || {})
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    // Filter out existing applications for versie configuration - only new applications need versie setup
    const applicatieIndices = allApplicatieIndices.filter((index) => {
      const app = product.applicaties[index];
      return !app?.isExisting; // Only include new applications (not existing ones)
    });

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: product.applicaties?.[i]?.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need versie configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

    const updateModuleVersie = (appIndex, field, value) => {
      setProduct((prev) => {
        const next = { ...prev, applicaties: { ...prev.applicaties } };
        const app = next.applicaties[appIndex] || {};
        
        // Initialize moduleVersies array if it doesn't exist
        if (!app.moduleVersies) {
          app.moduleVersies = [];
        }
        
        // For now, we'll manage one version per module (index 0)
        if (!app.moduleVersies[0]) {
          app.moduleVersies[0] = {};
        }
        
        app.moduleVersies[0][field] = value;
        next.applicaties[appIndex] = app;
        
        return next;
      });
    };

    const applyToAll = (fields) => {
      applicatieIndices.forEach((index) => {
        Object.entries(fields).forEach(([field, value]) => {
          updateModuleVersie(index, field, value);
        });
      });
    };

    const renderVersieFields = ({ appIndex, moduleVersie }) => {
      return (
        <div className='con-form-field-layout'>
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='versie'
            value={moduleVersie?.versie || ''}
            onChange={(value) => updateModuleVersie(appIndex, 'versie', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            // placeholder will come from schema example
          />
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='status'
            value={moduleVersie?.status || ''}
            onChange={(value) => updateModuleVersie(appIndex, 'status', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            // placeholder will come from schema example
          />
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='beschrijvingKort'
            value={moduleVersie?.beschrijvingKort || ''}
            onChange={(value) => updateModuleVersie(appIndex, 'beschrijvingKort', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
            // placeholder will come from schema example
          />
        </div>
      );
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='versie-section-title'
      >
        <h2 id='versie-section-title' className='sr-only'>
          Versies
        </h2>
        <Paragraph>
          Geef versie informatie op voor uw nieuwe applicaties/modules.
        </Paragraph>

        {applicatieIndices.length === 0 && allApplicatieIndices.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              background: '#f8f9fa',
              borderRadius: '8px',
            }}
          >
            <Paragraph>
              <strong>Geen nieuwe applicaties gevonden</strong>
            </Paragraph>
            <Paragraph>
              Alle applicaties in dit product zijn bestaande applicaties die al hun
              eigen versie-informatie hebben vastgelegd in de catalogus. Er hoeven geen
              versies geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        {applicatieIndices.length > 0 && isMultiNewApplicatie && (
          <div
            className='ac-register-form-checkbox-wrapper'
            style={{ marginBottom: '1rem' }}
          >
            <p>Geldt dezelfde versie-informatie voor alle nieuwe applicaties?</p>
            <AcCheckbox
              label='Ja, voor alle applicaties hetzelfde'
              value='same'
              checked={sameForAll}
              onChange={() => setSameForAll(true)}
            />
            <AcCheckbox
              label='Nee, per applicatie verschillend'
              value='per-app'
              checked={!sameForAll}
              onChange={() => setSameForAll(false)}
            />
          </div>
        )}

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            <h3>Versie informatie</h3>
            {renderVersieFields({
              appIndex: applicatieIndices[0],
              moduleVersie: product.applicaties?.[applicatieIndices[0]]?.moduleVersies?.[0] || {}
            })}
          </div>
        ) : applicatieIndices.length > 0 ? (
          <div>
            <Table>
              <thead>
                <TableRow>
                  <TableCell>
                    <b>Nieuwe applicatie</b>
                  </TableCell>
                  <TableCell>
                    <b>Versie</b>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell>
                    <b>Beschrijving</b>
                  </TableCell>
                </TableRow>
              </thead>
              <TableBody>
                {applicatieIndices.map((index) => {
                  const app = product.applicaties[index] || {};
                  const moduleVersie = app.moduleVersies?.[0] || {};
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <span>{app.naam || `Applicatie ${index + 1}`}</span>
                      </TableCell>
                      <TableCell>
                        <Textbox
                          value={moduleVersie.versie || ''}
                          onChange={(e) => updateModuleVersie(index, 'versie', e.target.value)}
                          placeholder='1.0.0'
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            loading && 'ac-beheer-select--disabled'
                          )}
                          value={statusOptions.find(opt => opt.value === moduleVersie.status) || null}
                          onChange={(opt) => updateModuleVersie(index, 'status', opt?.value || null)}
                          options={statusOptions}
                          isDisabled={loading}
                          placeholder='Status'
                        />
                      </TableCell>
                      <TableCell>
                        <Textbox
                          value={moduleVersie.beschrijvingKort || ''}
                          onChange={(e) => updateModuleVersie(index, 'beschrijvingKort', e.target.value)}
                          placeholder='Beschrijving'
                          disabled={loading}
                          maxLength={255}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    );
  }
);

// Step 6 Referentiecomponenten
const ReferentieComponentenForm = memo(
  ({
    product,
    setProduct,
    referentieComponentenOptions,
    referentieComponentenWithStandards,
    setReferentieComponentenWithStandards,
    schemas,
    loading,
  }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // Get all application indices
    const allApplicatieIndices = Object.keys(product.applicaties || {})
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    // Filter out existing applications for referentiecomponenten configuration - only new applications need this
    const applicatieIndices = allApplicatieIndices.filter((index) => {
      const app = product.applicaties[index];
      return !app?.isExisting; // Only include new applications (not existing ones)
    });

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: product.applicaties?.[i]?.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need referentiecomponenten configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

    const updateApplicatieField = (index, key, value) => {
      setProduct((prev) => {
        const next = { ...prev, applicaties: { ...prev.applicaties } };
        next.applicaties[index] = { ...next.applicaties[index], [key]: value };
        return next;
      });
    };

    const applyToAll = (fields) => {
      setProduct((prev) => {
        const next = { ...prev, applicaties: { ...prev.applicaties } };
        applicatieIndices.forEach((index) => {
          next.applicaties[index] = { ...next.applicaties[index], ...fields };
        });
        return next;
      });
    };

    const normalizeValues = (values) => {
      if (!values) return [];
      if (Array.isArray(values)) {
        return values.map((v) => (typeof v === 'object' ? v.value || v.id : v));
      }
      return Array.from(new Set(values));
    };

    const updateReferentieComponentenWithStandards = (appId, refs) => {
      const refsArray = normalizeValues(refs);
      
      // Update the separate array with full referentieComponent data including standards
      setReferentieComponentenWithStandards((prev) => {
        // Remove existing entries for this application
        const filtered = prev.filter(item => item.applicatieId !== appId);
        
        // Add new entries with full data from referentieComponentenOptions
        const newEntries = refsArray.map(refId => {
          const refOption = referentieComponentenOptions.find(opt => String(opt.value) === String(refId));
          const refData = refOption?.data || {};
          
          return {
            id: refId,
            naam: refOption?.label || refId,
            moduleId: appId, // Use moduleId for consistency with standards component
            applicatieId: appId,
            // Extract standards from the API data (these come from _extend query parameter)
            aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
            verplichteStandaarden: refData.verplichteStandaarden || [],
            // Store the full API data for future use
            fullData: refData,
          };
        });
        
        const result = [...filtered, ...newEntries];
        console.log('🔍 Updated referentieComponentenWithStandards:', result);
        return result;
      });
    };

    // If no new applications exist, show a message instead of the form
    if (applicatieIndices.length === 0) {
      return (
        <div>
          <h2 id='refcomp-section-title' className='sr-only'>
            Referentiecomponenten
          </h2>

          <Paragraph>
            Koppel referentiecomponenten aan uw nieuwe applicaties.
          </Paragraph>

          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              background: '#f8f9fa',
              borderRadius: '8px',
            }}
          >
            <Paragraph>
              <strong>Geen nieuwe applicaties gevonden</strong>
            </Paragraph>
            <Paragraph>
              Alle applicaties in dit product zijn bestaande applicaties die al
              hun eigen referentiecomponenten hebben. Er hoeven geen
              referentiecomponenten gekoppeld te worden.
            </Paragraph>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 id='refcomp-section-title' className='sr-only'>
          Referentiecomponenten
        </h2>

        <Paragraph>
          Koppel referentiecomponenten aan uw nieuwe applicaties.
        </Paragraph>

        {/* Same for all checkbox - only show if multiple new applications */}
        {isMultiNewApplicatie && (
          <div style={{ marginBottom: '1rem' }}>
            <AcCheckbox
              checked={sameForAll}
              label='Dezelfde referentiecomponenten voor alle applicaties'
              onChange={() => setSameForAll(!sameForAll)}
            />
          </div>
        )}

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Single application or "same for all" mode */}
            <div className='ac-register-form-grid'>
              <div>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='referentieComponenten'
                  value={(() => {
                    const currentApp = product.applicaties?.[applicatieIndices[0]] || {};
                    return currentApp.referentieComponenten || [];
                  })()}
                  onChange={(value) => {
                    const refsArray = normalizeValues(value);
                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({ referentieComponenten: refsArray });
                      // Update standards data for all applications
                      applicatieIndices.forEach(appId => {
                        updateReferentieComponentenWithStandards(appId, refsArray);
                      });
                    } else {
                      updateApplicatieField(applicatieIndices[0], 'referentieComponenten', refsArray);
                      updateReferentieComponentenWithStandards(applicatieIndices[0], refsArray);
                    }
                  }}
                  isDisabled={loading}
                  width='full'
                  schemas={schemas}
                />
              </div>
            </div>
          </div>
        ) : applicatieIndices.length > 0 ? (
          <div>
            {/* Multiple applications, different referentiecomponenten per application */}
            <Table>
              <thead>
                <TableRow>
                  <TableCell>
                    <strong>Applicatie</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Referentiecomponenten</strong>
                  </TableCell>
                </TableRow>
              </thead>
              <TableBody>
                {applicatieIndices.map((index) => {
                  const app = product.applicaties[index] || {};
                  const currentRefs = app.referentieComponenten || [];

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <strong>{app.naam || `Applicatie ${index + 1}`}</strong>
                      </TableCell>
                      <TableCell>
                        <ConSchemaEnhancedField
                          schemaType='module'
                          schemaProperty='referentieComponenten'
                          value={currentRefs}
                          onChange={(value) => {
                            const refsArray = normalizeValues(value);
                            updateApplicatieField(index, 'referentieComponenten', refsArray);
                            updateReferentieComponentenWithStandards(index, refsArray);
                          }}
                          isDisabled={loading}
                          width='full'
                          schemas={schemas}
                          showLabel={false}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          // No new applications that need referentiecomponenten configuration
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
            <Paragraph style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
              Alle applicaties zijn bestaande applicaties uit de catalogus. 
              Hun referentiecomponenten zijn al vastgelegd en hoeven niet opnieuw geconfigureerd te worden.
            </Paragraph>
          </div>
        )}
      </div>
    );
  }
);

// Step 5 Koppelingen

// Step 6 Standaarden - Now using StandaardenFormNew component

// Step 6.5 Koppelingen
const KoppelingenForm = memo(
  ({
    product,
    setProduct,
    modulesOptions,
    koppelingenFormState,
    setKoppelingenFormState,
  }) => {
    const { rows, selectedAppAByRow, selectedAppBByRow, directionByRow, typeByRow } =
      koppelingenFormState;

    const appOptions = Object.entries(product.applicaties).map(([id, app]) => ({
      value: id,
      label: app.naam || `Applicatie ${Number(id) + 1}`,
    }));

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

    // Fetch modules per selected Applicatie A; empty fallback when none
    // (Removed per-row fetch; we now use global modules list)

    const setKoppelingValue = (rowId, updater) => {
      setKoppelingenFormState((prev) => ({ ...prev, ...updater(prev) }));
    };

    const persistRowIntoProduct = (rowId) => {
      const appAId = selectedAppAByRow[rowId];
      const appBId = selectedAppBByRow[rowId];
      const richting = directionByRow[rowId];
      const soort = typeByRow[rowId];
      if (appAId == null || appBId == null) return;

      setProduct((prev) => {
        const applicaties = { ...prev.applicaties };
        const source = applicaties[appAId] || {};
        const list = Array.isArray(source.koppelingen) ? source.koppelingen : [];
        const withoutSame = list.filter(
          (k) =>
            !(
              k.applicatie1 === appOptions.find((o) => o.value === appAId)?.label &&
              k.applicatie2 === appOptions.find((o) => o.value === appBId)?.label
            )
        );
        const newItem = {
          applicatie1: appOptions.find((o) => o.value === appAId)?.label,
          applicatie2: appOptions.find((o) => o.value === appBId)?.label,
          richtingDataUitwisseling: richting,
          sooortKoppeling: soort,
        };
        applicaties[appAId] = { ...source, koppelingen: [...withoutSame, newItem] };
        return { ...prev, applicaties };
      });
    };

    return (
      <div>
        <h2 id='koppelingen-section-title' className='sr-only'>
          Koppelingen
        </h2>
        <TableContainer className='con-form-wizard-table-container'>
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Applicatie A</b>
                </TableCell>
                <TableCell>
                  <b>Applicatie B</b>
                </TableCell>
                <TableCell>
                  <b>Richting data-uitwisseling</b>
                </TableCell>
                <TableCell>
                  <b>Soort koppeling</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {rows.map((rowId) => (
                <TableRow key={rowId}>
                  <TableCell>
                    <ReactSelect
                      options={appOptions}
                      value={
                        selectedAppAByRow[rowId] != null
                          ? appOptions.find(
                              (o) => o.value === selectedAppAByRow[rowId]
                            )
                          : null
                      }
                      onChange={(opt) => {
                        setKoppelingValue(rowId, (prev) => ({
                          selectedAppAByRow: {
                            ...prev.selectedAppAByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                        persistRowIntoProduct(rowId);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={modulesOptions}
                      value={
                        selectedAppBByRow[rowId] != null
                          ? (modulesOptions || []).find(
                              (o) => o.value === selectedAppBByRow[rowId]
                            )
                          : null
                      }
                      onChange={(opt) => {
                        setKoppelingValue(rowId, (prev) => ({
                          selectedAppBByRow: {
                            ...prev.selectedAppBByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                        persistRowIntoProduct(rowId);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={directionOptions}
                      value={
                        directionByRow[rowId]
                          ? directionOptions.find(
                              (o) => o.value === directionByRow[rowId]
                            )
                          : null
                      }
                      onChange={(opt) => {
                        setKoppelingValue(rowId, (prev) => ({
                          directionByRow: {
                            ...prev.directionByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                        persistRowIntoProduct(rowId);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={typeOptions}
                      value={
                        typeByRow[rowId]
                          ? typeOptions.find((o) => o.value === typeByRow[rowId])
                          : null
                      }
                      onChange={(opt) => {
                        setKoppelingValue(rowId, (prev) => ({
                          typeByRow: { ...prev.typeByRow, [rowId]: opt?.value },
                        }));
                        persistRowIntoProduct(rowId);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.TRASHCAN />}
                        disabled={rows.length === 1}
                        onClick={() =>
                          setKoppelingenFormState((prev) => ({
                            ...prev,
                            rows: prev.rows.filter((id) => id !== rowId),
                            selectedAppAByRow: Object.fromEntries(
                              Object.entries(prev.selectedAppAByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            selectedAppBByRow: Object.fromEntries(
                              Object.entries(prev.selectedAppBByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            directionByRow: Object.fromEntries(
                              Object.entries(prev.directionByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            typeByRow: Object.fromEntries(
                              Object.entries(prev.typeByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                          }))
                        }
                        title='Rij verwijderen'
                      ></AcButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              <div style={{ marginTop: '1rem' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.PLUS />}
                  onClick={() =>
                    setKoppelingenFormState((prev) => ({
                      ...prev,
                      rows: [...prev.rows, prev.nextRowId],
                      nextRowId: prev.nextRowId + 1,
                    }))
                  }
                >
                  Rij toevoegen
                </AcButton>
              </div>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
);

// Step 7 Diensten
const DienstenForm = memo(
  ({
    product,
    dienstOptions,
    setProduct,
    dienstenFormState,
    setDienstenFormState,
  }) => {
    // Keep UI state in parent so it persists across steps
    const { rows, selectedApplication, selectedDienstByRow } = dienstenFormState;

    const normalizeDiensten = (arr) => {
      if (!Array.isArray(arr)) return [];
      const strs = arr
        .map((item) => {
          if (item == null) return null;
          if (typeof item === 'object') {
            if ('value' in item) return String(item.value);
            return null;
          }
          return String(item);
        })
        .filter((v) => typeof v === 'string' && v.length > 0);
      return Array.from(new Set(strs));
    };

    const addDienst = (appId, dienstVal) => {
      const dienst = String(dienstVal);
      setProduct((prev) => {
        const applicaties = { ...prev.applicaties };
        const existing = applicaties[appId] || {};
        const prevDiensten = normalizeDiensten(existing.diensten);
        const nextDiensten = prevDiensten.includes(dienst)
          ? prevDiensten
          : [...prevDiensten, dienst];
        applicaties[appId] = { ...existing, diensten: nextDiensten };
        return { ...prev, applicaties };
      });
    };

    const removeDienst = (appId, dienstVal) => {
      const dienst = String(dienstVal);
      setProduct((prev) => {
        const applicaties = { ...prev.applicaties };
        const existing = applicaties[appId] || {};
        const prevDiensten = normalizeDiensten(existing.diensten);
        const nextDiensten = prevDiensten.filter((d) => d !== dienst);
        applicaties[appId] = { ...existing, diensten: nextDiensten };
        return { ...prev, applicaties };
      });
    };

    const appOptions = Object.entries(product.applicaties).map(([id, app]) => ({
      value: id,
      label: app.naam,
    }));
    return (
      <div>
        <h2 id='diensten-section-title' className='sr-only'>
          Diensten
        </h2>

        <TableContainer className='con-form-wizard-table-container'>
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Applicatie</b>
                </TableCell>
                <TableCell>
                  <b>Dienst Type</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {rows.map((rowId) => (
                <TableRow key={rowId}>
                  <TableCell>
                    <ReactSelect
                      options={appOptions}
                      value={
                        selectedApplication[rowId] != null
                          ? appOptions.find(
                              (o) => o.value === selectedApplication[rowId]
                            )
                          : null
                      }
                      onChange={(selectedOption) => {
                        const prevAppId = selectedApplication[rowId];
                        const prevDienst = selectedDienstByRow[rowId];

                        if (prevAppId != null && prevDienst != null) {
                          removeDienst(prevAppId, prevDienst);
                        }

                        setDienstenFormState((prev) => ({
                          ...prev,
                          selectedApplication: {
                            ...prev.selectedApplication,
                            [rowId]: selectedOption?.value,
                          },
                          selectedDienstByRow: Object.fromEntries(
                            Object.entries(prev.selectedDienstByRow).filter(
                              ([k]) => Number(k) !== rowId
                            )
                          ),
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={dienstOptions}
                      isClearable
                      value={
                        selectedDienstByRow[rowId] != null
                          ? dienstOptions.find(
                              (o) =>
                                String(o.value) ===
                                String(selectedDienstByRow[rowId])
                            )
                          : null
                      }
                      isDisabled={selectedApplication[rowId] == null}
                      isOptionDisabled={(opt) => {
                        const appId = selectedApplication[rowId];
                        if (appId == null) return true;
                        const saved = normalizeDiensten(
                          product.applicaties?.[appId]?.diensten
                        );
                        const optVal = String(opt.value);
                        return saved.includes(optVal);
                      }}
                      onChange={(selectedOption) => {
                        const appId = selectedApplication[rowId];
                        if (appId == null) return;

                        if (!selectedOption) {
                          const prevDienst = selectedDienstByRow[rowId];
                          if (prevDienst != null) {
                            removeDienst(appId, prevDienst);
                          }
                          setDienstenFormState((prev) => ({
                            ...prev,
                            selectedDienstByRow: Object.fromEntries(
                              Object.entries(prev.selectedDienstByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                          }));
                          return;
                        }

                        addDienst(appId, selectedOption.value);
                        setDienstenFormState((prev) => ({
                          ...prev,
                          selectedDienstByRow: {
                            ...prev.selectedDienstByRow,
                            [rowId]: String(selectedOption.value),
                          },
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.TRASHCAN />}
                        disabled={rows.length === 1}
                        onClick={() => {
                          const appId = selectedApplication[rowId];
                          const dienstVal = selectedDienstByRow[rowId];

                          if (appId != null && dienstVal != null) {
                            removeDienst(appId, dienstVal);
                          }

                          setDienstenFormState((prev) => ({
                            ...prev,
                            rows: prev.rows.filter((id) => id !== rowId),
                            selectedApplication: Object.fromEntries(
                              Object.entries(prev.selectedApplication).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            selectedDienstByRow: Object.fromEntries(
                              Object.entries(prev.selectedDienstByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                          }));
                        }}
                        title='Rij verwijderen'
                      ></AcButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              <div style={{ marginTop: '1rem' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.PLUS />}
                  onClick={() =>
                    setDienstenFormState((prev) => ({
                      ...prev,
                      rows: [...prev.rows, prev.nextRowId],
                      nextRowId: prev.nextRowId + 1,
                    }))
                  }
                >
                  Rij toevoegen
                </AcButton>
              </div>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
);

// Step 8 Controleren
const ControlerenForm = memo(
  ({ product, dienstOptions, referentieComponentenOptions }) => {
    // Debug logging to understand why the form might be empty
    console.log('🔍 ControlerenForm Debug:', {
      product: product,
      productKeys: Object.keys(product || {}),
      applicaties: product?.applicaties,
      applicatiesKeys: Object.keys(product?.applicaties || {}),
      dienstOptionsCount: dienstOptions?.length || 0,
      referentieComponentenOptionsCount: referentieComponentenOptions?.length || 0
    });

    return (
      <div>
        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>
            Product informatie
          </h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>{product.naam}</h4>
              {product.logo && (
                <ConLogoPreview
                  logoUrl={product.logo}
                  className='ac-register-review__logo'
                />
              )}
            </div>
            <Separator className='con-form-wizard-review-header__separator' />

            <div className='ac-register-review__field'>
              <strong>Sammenvatting:</strong>
              <span>{product.beschrijvingKort || '-'}</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Website:</strong> {product.website || '-'}
            </div>
            <div className='ac-register-review__field'>
              <strong>Hosting:</strong> {product.hostingLocatie || '-'}
            </div>
            <div className='ac-register-review__field'>
              <strong>Jurisdictie:</strong> {product.hostingJurisdictie || '-'}
            </div>
          </div>
        </div>

        <h3 className='con-form-wizard-review-heading-header'>Applicaties</h3>
        <div className='ac-register-review'>
          {Object.values(product.applicaties).map((applicatie, idx) => (
            <div
              className='ac-register-form-section'
              key={applicatie.id || applicatie.naam || idx}
            >
              <div className='ac-register-review'>
                <div className='ac-register-review__section'>
                  <div className='ac-register-review__header'>
                    <h4 className='utrecht-heading-4'>{applicatie.naam}</h4>
                  </div>
                  <Separator className='ac-register-review-header__separator' />

                  <div className='ac-register-review__field'>
                    <strong>Korte beschrijving:</strong>
                    <div>
                      <div>{applicatie.beschrijvingKort || ''}</div>
                    </div>
                  </div>

                  <div className='ac-register-review__field'>
                    <strong>Licentietype:</strong>
                    <div>
                      <div>{applicatie.licentieType || ''}</div>
                    </div>
                  </div>

                  {applicatie.licentieType !== 'Closed Source' && (
                    <div className='ac-register-review__field'>
                      <strong>Licentie:</strong>
                      <div>
                        <div>{applicatie.licentie || ''}</div>
                      </div>
                    </div>
                  )}

                  {Array.isArray(applicatie.referentieComponenten) &&
                    applicatie.referentieComponenten.length > 0 && (
                      <div className='ac-register-review__field'>
                        <strong>Referentiecomponenten:</strong>
                        <div>
                          <UnorderedList>
                            {applicatie.referentieComponenten.map((rc, i) => {
                              // accept old shape {id, naam} or new string values
                              const value = typeof rc === 'string' ? rc : rc?.naam;
                              const opt = referentieComponentenOptions?.find(
                                (o) => String(o.value) === String(value)
                              );
                              const label = opt ? opt.label : value;
                              return (
                                <UnorderedListItem key={value || i}>
                                  {label}
                                </UnorderedListItem>
                              );
                            })}
                          </UnorderedList>
                        </div>
                      </div>
                    )}

                  {Array.isArray(applicatie.standaarden) &&
                    applicatie.standaarden.length > 0 && (
                      <div className='ac-register-review__field'>
                        <strong>Standaarden:</strong>
                        <div>
                          <UnorderedList>
                            {applicatie.standaarden.map((std) => (
                              <UnorderedListItem key={std.id || std.naam}>
                                {std.naam}
                                {std.bewijs ? (
                                  <>
                                    {' '}
                                    -{' '}
                                    <a
                                      href={std.bewijs}
                                      target='_blank'
                                      rel='noreferrer noopener'
                                    >
                                      bewijs
                                    </a>
                                  </>
                                ) : null}
                              </UnorderedListItem>
                            ))}
                          </UnorderedList>
                        </div>
                      </div>
                    )}

                  {Array.isArray(applicatie.koppelingen) &&
                    applicatie.koppelingen.length > 0 && (
                      <div className='ac-register-review__field'>
                        <strong>Koppelingen:</strong>
                        <div>
                          <UnorderedList>
                            {applicatie.koppelingen.map((kp, kIdx) => {
                              const richting = kp.richtingDataUitwisseling;
                              const soortVal = kp.sooortKoppeling;
                              const soortLabel = soortVal || '';
                              const arrow =
                                richting === 'AnaarB'
                                  ? '→'
                                  : richting === 'BnaarA'
                                  ? '←'
                                  : '↔';
                              return (
                                <UnorderedListItem
                                  key={`${kp.applicatie1}-${kp.applicatie2}-${kIdx}`}
                                >
                                  {kp.applicatie1} {arrow} {kp.applicatie2}
                                  {soortLabel ? ` (${soortLabel})` : ''}
                                </UnorderedListItem>
                              );
                            })}
                          </UnorderedList>
                        </div>
                      </div>
                    )}

                  {Array.isArray(applicatie.diensten) &&
                    applicatie.diensten.length > 0 && (
                      <div className='ac-register-review__field'>
                        <strong>Diensten:</strong>
                        <div>
                          <UnorderedList>
                            {applicatie.diensten.map((dienst) => {
                              const dienstOption = dienstOptions.find(
                                (option) => option.value === dienst
                              );
                              return (
                                <UnorderedListItem key={dienst}>
                                  {dienstOption ? dienstOption.label : dienst}
                                </UnorderedListItem>
                              );
                            })}
                          </UnorderedList>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

/**
 * Aanbieder Informatie Form Component
 *
 * This step allows users to either select an existing organization or create a new one
 * when registering a missing product (type=ontbrekend).
 *
 * Features:
 * - Radio button choice between existing and new organization
 * - Searchable dropdown for existing organizations (defaults to user's active organization)
 * - Full form for creating new organization based on organisatie schema
 *
 * Only shown when formType === 'ontbrekend'
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProductData - Function to update product data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration (organisatie schema)
 * @param {Object} userStore - User store for active organization
 * @param {string} aanbiederkeuze - Choice between 'bestaand' or 'nieuw'
 * @param {Function} setAanbiederKeuze - Function to update choice
 */
const AanbiederInformatieForm = memo(
  ({
    product,
    setProductData,
    loading,
    touched,
    schemas,
    userStore,
    aanbiederkeuze,
    setAanbiederKeuze,
  }) => {
    // Set default aanbieder to user's active organization when switching to 'bestaand'
    useEffect(() => {
      if (
        aanbiederkeuze === 'bestaand' &&
        userStore?.activeOrganization &&
        !product.aanbieder
      ) {
        setProductData('aanbieder', userStore.activeOrganization);
      }
    }, [aanbiederkeuze, userStore?.activeOrganization, product.aanbieder]);

    // Handle choice change between existing and new
    const handleChoiceChange = (choice) => {
      setAanbiederKeuze(choice);
      if (choice === 'bestaand') {
        // Clear new organization fields
        setProductData('aanbiederNaam', '');
        setProductData('aanbiederType', '');
        setProductData('aanbiederWebsite', '');
        setProductData('aanbiederBeschrijvingKort', '');
        setProductData('aanbiederBeschrijvingLang', '');
        setProductData('aanbiederEmail', '');
        setProductData('aanbiederTelefoonnummer', '');
        setProductData('aanbiederKvkNummer', '');
        setProductData('aanbiederLogo', '');
        // Set to default organization (user's active organization)
        if (userStore?.activeOrganization) {
          setProductData('aanbieder', userStore.activeOrganization);
        }
      } else {
        // Clear existing organization selection
        setProductData('aanbieder', null);
      }
    };

    return (
      <div role='group' aria-labelledby='aanbieder-section-title'>
        <h2 id='aanbieder-section-title' className='sr-only'>
          Aanbieder informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Choice between existing and new organization - using same styling as ProductOpbouw */}
            <div className='con-form-field-wrapper field-size-full'>
              <div style={{ marginBottom: '1rem' }}>
                <h3
                  style={{
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                  }}
                >
                  Aanbieder selecteren
                </h3>

                <div className='ac-register-form-checkbox-wrapper'>
                  <AcCheckbox
                    label='Bestaande organisatie selecteren'
                    value='bestaand'
                    checked={aanbiederkeuze === 'bestaand'}
                    onChange={() => handleChoiceChange('bestaand')}
                    disabled={loading}
                  />
                  <AcCheckbox
                    label='Nieuwe organisatie aanmaken'
                    value='nieuw'
                    checked={aanbiederkeuze === 'nieuw'}
                    onChange={() => handleChoiceChange('nieuw')}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Existing organization dropdown - using ConSchemaEnhancedField */}
            {aanbiederkeuze === 'bestaand' && (
              <ConSchemaEnhancedField
                schemaType='product'
                schemaProperty='aanbieder'
                value={product.aanbieder}
                onChange={(value) => setProductData('aanbieder', value)}
                isDisabled={loading}
                width='full'
                customProps={{
                  // placeholder will come from schema example
                  isClearable: true,
                }}
                schemas={schemas}
              />
            )}

            {/* New organization form fields */}
            {aanbiederkeuze === 'nieuw' && (
              <>
                {/* Organization Name - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={product.aanbiederNaam || ''}
                  onChange={(value) => setProductData('aanbiederNaam', value)}
                  isDisabled={loading}
                  width='full'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Organization Type - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='type'
                  value={product.aanbiederType || ''}
                  onChange={(value) => setProductData('aanbiederType', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />

                {/* Organization Website - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='website'
                  value={product.aanbiederWebsite || ''}
                  onChange={(value) => setProductData('aanbiederWebsite', value)}
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Short Description */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='beschrijvingKort'
                  value={product.aanbiederBeschrijvingKort || ''}
                  onChange={(value) =>
                    setProductData('aanbiederBeschrijvingKort', value)
                  }
                  isDisabled={loading}
                  width='full'
                  customProps={{
                    // placeholder will come from schema example
                    maxLength: 255,
                  }}
                  schemas={schemas}
                />

                {/* Long Description */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='beschrijvingLang'
                  value={product.aanbiederBeschrijvingLang || ''}
                  onChange={(value) =>
                    setProductData('aanbiederBeschrijvingLang', value)
                  }
                  isDisabled={loading}
                  width='full'
                  customProps={{
                    // placeholder will come from schema example
                    component: 'AcTextarea',
                    rows: 4,
                    maxLength: 2000,
                  }}
                  schemas={schemas}
                />

                {/* Email Address */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='e-mailadres'
                  value={product.aanbiederEmail || ''}
                  onChange={(value) => setProductData('aanbiederEmail', value)}
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Phone Number */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='telefoonnummer'
                  value={product.aanbiederTelefoonnummer || ''}
                  onChange={(value) =>
                    setProductData('aanbiederTelefoonnummer', value)
                  }
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* KvK Number */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='kvkNummer'
                  value={product.aanbiederKvkNummer || ''}
                  onChange={(value) => setProductData('aanbiederKvkNummer', value)}
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Logo URL */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='logo'
                  value={product.aanbiederLogo || ''}
                  onChange={(value) => setProductData('aanbiederLogo', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

AanbiederInformatieForm.displayName = 'AanbiederInformatieForm';
ApplicatieFormFields.displayName = 'ApplicatieFormFields';
ApplicatieStep.displayName = 'ApplicatieStep';
LicenseAndHostingStep.displayName = 'LicenseAndHostingStep';
ModuleVersieStep.displayName = 'ModuleVersieStep';
DienstenForm.displayName = 'DienstenForm';
ControlerenForm.displayName = 'ControlerenForm';
ReferentieComponentenForm.displayName = 'ReferentieComponentenForm';
ProductOpbouwForm.displayName = 'ProductOpbouwForm';
ProductOpbouwInformationForm.displayName = 'ProductOpbouwInformationForm';
KoppelingenForm.displayName = 'KoppelingenForm';
// StandaardenForm is now StandaardenFormNew (separate component)

export default withStore(observer(AcFormsProduct));
