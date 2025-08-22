import { useState, useCallback, memo, useEffect, useMemo } from 'react';
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
    naam: 'VNG Product',
    beschrijvingKort: 'Dit is de korte beschrijving van het VNG product',
    beschrijvingLang: 'Dit is een uitgebreide beschrijving van het VNG product in **Markdown** formaat.',
    website: 'https://www.vng.nl',
    logo: 'data:image/png;base64,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',
    logoFilename: '',
    hostingLocatie: 'NL',
    hostingJurisdictie: 'EU',
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
    applicaties: {
      0: {
        naam: 'OpenWoo',
        beschrijvingKort:
          'Open source WOO-portaal voor transparante overheidscommunicatie',
        licentieType: 'Open Source',
        licentie: 'EUPL 1.2',
        referentieComponenten: [
          {
            naam: 'Document Management Component',
            id: 'dmc-001',
          },
          {
            naam: 'Zoek Component',
            id: 'zc-002',
          },
          {
            naam: 'Publicatie Component',
            id: 'pc-003',
          },
          {
            naam: 'Metadata Component',
            id: 'mc-004',
          },
        ],
        standaarden: [
          {
            naam: 'TMLO 2.0',
            id: 'tmlo-20',
            bewijs: 'https://www.nationaalarchief.nl/archiveren/kennisbank/tmlo',
          },
        ],
        koppelingen: [
          {
            applicatie1: 'OpenWoo',
            applicatie2: 'OpenZaak',
            richtingDataUitwisseling: 'Bidirectioneel',
            sooortKoppeling: 'REST API',
          },
          {
            applicatie1: 'OpenWoo',
            applicatie2: 'DocumentManagementSystem',
            richtingDataUitwisseling: 'Bidirectioneel',
            sooortKoppeling: 'REST API',
          },
        ],
        diensten: ['Technisch beheer', 'Implementatie-ondersteuning'],
      },
      1: {
        naam: 'OpenZaak',
        beschrijvingKort:
          'Open source zaaksysteem voor gemeenten met ondersteuning voor ZGW API standaarden',
        licentieType: 'Open Source',
        licentie: 'EUPL 1.2',
        referentieComponenten: [],
        standaarden: [],
        koppelingen: [
          {
            applicatie1: 'OpenZaak',
            applicatie2: 'Klantportaal',
            richtingDataUitwisseling: 'Bidirectioneel',
            sooortKoppeling: 'REST API',
          },
        ],
        diensten: [],
      },
      2: {
        naam: 'Burgerzaken Suite',
        beschrijvingKort:
          'Complete oplossing voor burgerzaken met modules voor geboorteaangifte, huwelijken en overlijdensaangifte',
        licentieType: 'Closed Source',
        licentie: 'Proprietary Enterprise License',
        referentieComponenten: [
          {
            naam: 'BRP Koppeling Module',
            id: 'brp-001',
          },
        ],
        standaarden: [
          {
            naam: 'StUF-BG 3.10',
            id: 'stuf-310',
            bewijs: 'https://www.gemmaonline.nl/index.php/StUF-BG_3.10_compliance',
          },
        ],
        koppelingen: [],
        diensten: [],
      },
    }, // array of applicaties with a unique key for easier data management
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
    organisatie: null
  });
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Fetch schema definitions on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setSchemasLoading(true);
      const schemaTypes = ['product', 'module', 'dienst', 'koppeling', 'compliancy', 'organisatie'];
      const fetchedSchemas = {};

      try {
        const schemaPromises = schemaTypes.map(async (schemaType) => {
          try {
            const response = await fetch(`${BASE_URL}/openregister/api/schemas/${schemaType}`, {
              headers: { Accept: 'application/json' },
            });
            if (!response.ok) {
              console.warn(`Schema fetch failed for ${schemaType}:`, response.status);
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
      } catch (error) {
        console.error('Failed to fetch schemas:', error);
      } finally {
        setSchemasLoading(false);
      }
    };

    fetchSchemas();
  }, []);

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
      
      if (currentSchema[pathSegment].type === 'object' && currentSchema[pathSegment].properties) {
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
          _page: '1'
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

  // Persist UI state for StandaardenForm across steps
  const [standaardenFormState, setStandaardenFormState] = useState({
    rows: [0],
    nextRowId: 1,
    selectedApplication: {},
    selectedStandardByRow: {},
    supportedByRow: {},
    bewijsByRow: {},
  });

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
    const baseEndpoint = `${BASE_URL}/openregister/api/objects/vng-gemma/element`;

    const mapToOption = (item, index) => {
      const label =
        item?.naam ||
        item?.name ||
        item?.title ||
        item?.label ||
        `Component ${index + 1}`;
      const value = item?.value || item?.id || item?.slug || label;
      return { value: String(value), label: String(label) };
    };

    const fetchOptions = async () => {
      try {
        // Add pagination parameters to limit initial load
        const params = new URLSearchParams({
          _limit: '50',
          _page: '1'
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
  }, []);

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
          _page: '1'
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
      console.log('🏢 Auto-setting aanbieder to user active organization:', userStore.activeOrganization);
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
    if (!shouldShowAanbiederStep() && stepIndex > 1) {
      return stepIndex + 1;
    }
    return stepIndex;
  };

  const renderStep = (step) => {
    // Get the logical step number (accounting for optional aanbieder step)
    const logicalStep = getLogicalStepFromIndex(step);
    
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
            }}
          />
        );
      case 5:
        return (
          <ReferentieComponentenForm
            {...{
              product,
              setProduct,
              referentieComponentenOptions,
              refCompFormState,
              setRefCompFormState,
            }}
          />
        );
      case 6:
        return (
          <StandaardenForm
            {...{
              product,
              setProduct,
              standaardOptions: standaardOptionsRef.current,
              standaardenFormState,
              setStandaardenFormState,
            }}
          />
        );
      case 7:
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
      case 8:
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
      case 9:
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
        return 'Referentiecomponenten';
      case 6:
        return 'Standaarden';
      case 7:
        return 'Koppelingen';
      case 8:
        return 'Diensten';
      case 9:
        return 'Controleren';
    }
  };

  const getDisabledStatus = (currentStep) => {
    // TODO: uncomment at the end
    if (currentStep === 0) {
      return false;
    }
    if (currentStep === 1) {
      //   return !product.productName;
      return false;
    }
  };

  // Add this function to generate the tooltip message
  const getDisabledTooltip = (product) => {
    // Example
    if (currentStep === 1) {
      const messages = [];
      if (!product.productName) {
        messages.push('Productnaam is verplicht');
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
                <Paragraph>
                  {getPageDescription()}
                </Paragraph>

                {/* Show loading state while schemas are being fetched */}
                {schemasLoading && (
                  <div className='ac-forms-product-loading' style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f0f4ff', 
                    border: '1px solid #d1e7ff',
                    borderRadius: '4px',
                    margin: '1rem 0'
                  }}>
                    <p style={{ margin: 0, color: '#0066cc' }}>📋 Formulier definities aan het laden...</p>
                  </div>
                )}

                {/* Debug: Show loaded schemas in development */}
                {process.env.NODE_ENV === 'development' && !schemasLoading && (
                  <details style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#666' }}>
                    <summary>🔍 Debug: Loaded Schemas & Utilities</summary>
                    <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <p><strong>Schemas Status:</strong></p>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                        {Object.entries(schemas).map(([key, schema]) => (
                          <li key={key} style={{ color: schema ? '#28a745' : '#dc3545' }}>
                            {key}: {schema ? '✅ Loaded' : '❌ Failed'}
                            {schema && schema.properties && (
                              <span style={{ fontSize: '0.7rem', color: '#666' }}>
                                {' '}({Object.keys(schema.properties).length} properties)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p><strong>Available Utilities:</strong></p>
                      <code style={{ fontSize: '0.7rem', display: 'block', margin: '0.5rem 0' }}>
                        getFieldFromSchema(schemaType, fieldName)<br/>
                        getEnhancedFieldConfig(schemaType, fieldName, baseConfig)
                      </code>
                    </div>
                  </details>
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
                    <div className='ac-register-process-steps'>
                      <ProcessSteps
                        steps={(() => {
                          const baseSteps = [
                            {
                              id: '4p5q6r7s-8t9u-0v1w-2x3y-4z5a6b7c8d9e',
                              marker: 1,
                              status: getStatusMultiStep(currentStep, 0, 0, shouldShowAanbiederStep() ? 2 : 1),
                              title: 'Productopbouw',
                              steps: [
                                {
                                  id: 'v6w7x8y9-0z1a-2b3c-4d5e-6f7g8h9i0j1k',
                                  status: getStatus(currentStep, 1),
                                  title: 'Product informatie',
                                },
                                // Conditionally add aanbieder step
                                ...(shouldShowAanbiederStep() ? [{
                                  id: 'w7x8y9z0-1a2b-3c4d-5e6f-7g8h9i0j1k2l',
                                  status: getStatus(currentStep, 2),
                                  title: 'Aanbieder informatie',
                                }] : []),
                              ],
                            },
                            {
                              id: '7f8e9a2b-1c3d-4f5g-6h7i-8j9k0l1m2n3o',
                              marker: 2,
                              status: getStatusMultiStep(currentStep, shouldShowAanbiederStep() ? 3 : 2, shouldShowAanbiederStep() ? 3 : 2, shouldShowAanbiederStep() ? 8 : 7),
                              title: currentStepName(shouldShowAanbiederStep() ? 3 : 2),
                              steps: [
                                {
                                  id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
                                  status: getStatus(currentStep, shouldShowAanbiederStep() ? 4 : 3),
                                  title: 'Licentie',
                                },
                                {
                                  id: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
                                  status: getStatus(currentStep, shouldShowAanbiederStep() ? 5 : 4),
                                  title: 'Referentiecomponenten',
                                },
                                {
                                  id: 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8',
                                  status: getStatus(currentStep, shouldShowAanbiederStep() ? 6 : 5),
                                  title: 'Standaarden',
                                },
                                {
                                  id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
                                  status: getStatus(currentStep, shouldShowAanbiederStep() ? 7 : 6),
                                  title: 'Koppelingen',
                                },
                                {
                                  id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
                                  status: getStatus(currentStep, shouldShowAanbiederStep() ? 8 : 7),
                                  title: 'Diensten',
                                },
                              ],
                            },
                            {
                              id: 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1',
                              marker: 3,
                              status: getStatus(currentStep, shouldShowAanbiederStep() ? 9 : 8),
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
                        {currentStep !== (shouldShowAanbiederStep() ? 9 : 8) && (
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

                        {currentStep === (shouldShowAanbiederStep() ? 9 : 8) && (
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
    const remainingLongDescriptionChars = 5000 - (product.beschrijvingLang?.length || 0);

    return (
      <div
        role='group'
        aria-labelledby='organization-section-title'
      >
        <h2 id='organization-section-title' className='sr-only'>
          Productinformatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Product Name - Required field, full width */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="naam"
              value={product.naam || ''}
              onChange={(value) => setProductData('naam', value)}
              isDisabled={loading}
              width="full" // Override to full width
              customProps={{ placeholder: "Voorbeeld: VNG Product Suite" }}
              schemas={schemas}
            />

            {/* Website/Product Page - URL field, full width */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="website"
              value={product.website || ''}
              onChange={(value) => setProductData('website', value)}
              isDisabled={loading}
              width="full" // Override to full width
              customProps={{ placeholder: "https://voorbeeld.nl/product" }}
              schemas={schemas}
            />

            {/* Short Description - Textarea, full width */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="beschrijvingKort"
              value={product.beschrijvingKort || ''}
              onChange={(value) => setProductData('beschrijvingKort', value)}
              isDisabled={loading}
              width="full" // Override to full width
              customProps={{ inputType: "textarea" }}
              schemas={schemas}
            />
            <small className='ac-register-form-field-help'>
              {remainingDescriptionChars} karakters over
            </small>

            {/* Long Description - Markdown textarea, full width */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="beschrijvingLang"
              value={product.beschrijvingLang || ''}
              onChange={(value) => setProductData('beschrijvingLang', value)}
              isDisabled={loading}
              width="full" // Ensure full width for markdown editor
              customProps={{ inputType: "wysiwyg-markdown" }}
              schemas={schemas}
            />
            <small className='ac-register-form-field-help'>
              {remainingLongDescriptionChars} karakters over
            </small>

            {/* Logo Upload - Now placed under beschrijvingLang, full width */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="logo"
              value={product.logo}
              onChange={(value) => setProductData('logo', value)}
              isDisabled={loading}
              width="full" // Override to full width
              formData={{ 
                ...product, 
                logoFilename: product.logoFilename // Include filename for LogoUploadField
              }}
              customProps={{ 
                inputType: "file",
                format: "base64" // This will trigger the LogoUploadField 
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
              schemaType="product"
              schemaProperty="contactpersoon"
              value={product.contactpersoon}
              onChange={(value) => setProductData('contactpersoon', value)}
              isDisabled={loading}
              width="half" // Explicitly set to half width
              schemas={schemas}
            />

            {/* Cloud Service Model - Enum select, full width (after contact) */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="cloudDienstverleningsmodel"
              value={product.cloudDienstverleningsmodel || ''}
              onChange={(value) => setProductData('cloudDienstverleningsmodel', value)}
              isDisabled={loading}
              width="full" // Override width to ensure full width display
              schemas={schemas}
            />

            {/* Hosting Location - Enum select, half width (left side) */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="hostingLocatie"
              value={product.hostingLocatie || ''}
              onChange={(value) => setProductData('hostingLocatie', value)}
              isDisabled={loading}
              width="half" // Explicitly set to half width
              schemas={schemas}
            />

            {/* Hosting Jurisdiction - Enum select, half width (right side, next to location) */}
            <ConSchemaEnhancedField
              schemaType="product"
              schemaProperty="hostingJurisdictie"
              value={product.hostingJurisdictie || ''}
              onChange={(value) => setProductData('hostingJurisdictie', value)}
              isDisabled={loading}
              width="half" // Explicitly set to half width
              schemas={schemas}
            />
          </div>
        </div>
      </div>
    );
  }
);

// Applicatie form fields are extracted to module scope to avoid remounts
// used in ApplicatieStep
const ApplicatieFormFields = memo(
  ({ index, applicatie, updateApplicatie, loading }) => {
    const nameInputId = `applicatie-naam-${index}`;

    const [localName, setLocalName] = useState(applicatie.naam || '');
    useEffect(() => {
      setLocalName(applicatie.naam || '');
    }, [applicatie.naam, index]);

    const [localDesc, setLocalDesc] = useState(applicatie.beschrijvingKort || '');
    useEffect(() => {
      setLocalDesc(applicatie.beschrijvingKort || '');
    }, [applicatie.beschrijvingKort, index]);

    const debouncedSetName = useDebouncedInput(
      (v) => updateApplicatie(index, 'naam', v),
      300
    );
    const debouncedSetDesc = useDebouncedInput(
      (v) => updateApplicatie(index, 'beschrijvingKort', v),
      300
    );

    return (
      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2' }}>
          <AcFormField
            label='Naam van de applicatie'
            value={localName}
            onChange={(v) => {
              setLocalName(v);
              debouncedSetName(v);
            }}
            disabled={loading}
            id={nameInputId}
            className='ac-register-form-field__no-width-limit'
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <AcFormField
            label='Korte beschrijving van de applicatie'
            inputType='textarea'
            value={localDesc}
            onChange={(v) => {
              setLocalDesc(v);
              debouncedSetDesc(v);
            }}
            maxLength={255}
            disabled={loading}
            id={`applicatie-beschrijving-${index}`}
            className='ac-register-form-field__no-width-limit'
          />
          <small className='ac-register-form-field-help'>
            {255 - (localDesc?.length || 0)} karakters over
          </small>
        </div>
      </div>
    );
  }
);

// Step 2 Applicatie(s)
const ApplicatieStep = memo(
  ({ product, setProduct, isMultiApplicatie, loading, schemas, schemasLoading, store }) => {
    // Keep focus while typing by only committing name changes on blur
    
    // State for selecting existing applications to add
    const [selectedExistingApplication, setSelectedExistingApplication] = useState(null);
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
          firstItem: Array.isArray(selectedExistingApplication) ? selectedExistingApplication[0] : selectedExistingApplication,
          storeCollections: store?.object ? Object.keys(store.object.collections || {}) : 'no store'
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
          firstResult: moduleCollection?.results?.[0]
        });
        
        if (moduleCollection?.results) {
          const foundModule = moduleCollection.results.find(item => item['@self']?.id === selectedExistingApplication);
          console.log('🔍 Found module:', { foundModule, searchingFor: selectedExistingApplication });
          
          if (foundModule) {
            selectedItem = {
              value: selectedExistingApplication,
              label: foundModule['@self']?.name || 'Unnamed Module',
              data: foundModule
            };
          } else {
            console.warn('Could not find module data for ID:', selectedExistingApplication);
            return;
          }
        } else {
          console.warn('Module collection not available');
          return;
        }
      } else if (Array.isArray(selectedExistingApplication)) {
        selectedItem = selectedExistingApplication[0];  // Take first item if array
      } else {
        selectedItem = selectedExistingApplication;    // Use directly if object
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
          naam: selectedItem.label || 
                applicationData.naam || 
                applicationData.name || 
                applicationData.title || 
                applicationData['@self']?.name || 
                'Unnamed Application',
                
          beschrijvingKort: applicationData.beschrijvingKort || 
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
          diensten: []
        };

        console.log('🔧 Created new applicatie entry:', newApplicatie);

        return { ...prev, applicaties: { ...prev.applicaties, [nextIndex]: newApplicatie } };
      });

      // Clear the selection
      setSelectedExistingApplication(null);
    };

    if (!isMultiApplicatie) {
      const app0 = product.applicaties?.[0];
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
                <b>Naam</b>
              </TableCell>
              <TableCell>
                <b>Beschrijving</b>
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
                      <div style={{ 
                        padding: '8px 12px', 
                        minHeight: '36px', 
                        display: 'flex', 
                        alignItems: 'center',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        {applicatie.naam} <small style={{ marginLeft: '8px', color: '#999' }}>(bestaande applicatie)</small>
                      </div>
                    ) : (
                      <Textbox
                        id={`table-applicatie-naam-${index}`}
                        value={applicatie?.naam || ''}
                        onChange={(e) => updateApplicatie(index, 'naam', e.target.value)}
                        placeholder='Naam van de applicatie'
                        disabled={loading}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isExisting ? (
                      // Read-only display for existing modules
                      <div style={{ 
                        padding: '8px 12px', 
                        minHeight: '36px', 
                        display: 'flex', 
                        alignItems: 'center',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        {applicatie.beschrijvingKort || 'Geen beschrijving beschikbaar'}
                      </div>
                    ) : (
                      <Textbox
                        id={`table-applicatie-beschrijving-${index}`}
                        value={applicatie?.beschrijvingKort || ''}
                        onChange={(e) =>
                          updateApplicatie(index, 'beschrijvingKort', e.target.value)
                        }
                        maxLength={255}
                        placeholder='Beschrijving van de applicatie'
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
                      style='buttonSlim'
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

          <div className='ac-register-review' style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
            {/* New application block */}
            <div className='ac-register-form-section' style={{ flex: '1', minWidth: '0', display: 'flex' }}>
              <div className='ac-register-review__section' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
                <div className='ac-register-review__field' style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <Paragraph style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Nieuwe applicatie</strong>
                    </Paragraph>
                    <Paragraph style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}>
                      Maak een volledig nieuwe applicatie aan. U configureert alle instellingen, licenties, standaarden en referentiecomponenten zelf.
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
            <div className='ac-register-form-section' style={{ flex: '1', minWidth: '0', display: 'flex' }}>
              <div className='ac-register-review__section' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
                <div className='ac-register-review__field' style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <Paragraph style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Bestaande applicatie</strong>
                    </Paragraph>
                    <Paragraph style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}>
                      Koppel een reeds bestaande applicatie uit de catalogus. Alle instellingen, licenties en compliance-informatie zijn al vastgelegd.
                    </Paragraph>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1' }}>
                      <ConSchemaEnhancedField
                        schemaType="product"
                        schemaProperty="modules"
                        value={selectedExistingApplication}
                        onChange={setSelectedExistingApplication}
                        schemas={schemas}
                        formData={{}}
                        store={store}
                        width="full"
                        showLabel={false}
                        showDescription={false}
                        customProps={{ 
                          placeholder: "Selecteer een bestaande applicatie...",
                          // Force single-select instead of multi-select
                          isMulti: false,
                          // Override the array behavior
                          type: 'select'
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
  ({ product, setProduct, isMultiApplicatie, loading }) => {
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

    const applicatieIndices = Object.keys(product.applicaties || {})
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: product.applicaties?.[i]?.naam || `Applicatie ${i + 1}`,
    }));

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
        Object.keys(next.applicaties).forEach((k) => {
          next.applicaties[k] = { ...next.applicaties[k], ...fields };
        });
        return next;
      });
    };

    const renderSelectors = ({
      valueLicentieType,
      valueLicentie,
      onChangeLicentieType,
      onChangeLicentie,
    }) => {
      const selectedType =
        licentieTypeOptions.find((o) => o.value === valueLicentieType) || null;
      const selectedLicentie =
        licentieOptions.find((o) => o.value === valueLicentie) || null;

      return (
        <div className='ac-register-form-grid'>
          <div>
            <label className='utrecht-form-label'>Type Licentie</label>
            <ReactSelect
              className={clsx(
                'ac-beheer-select',
                loading && 'ac-beheer-select--disabled'
              )}
              value={selectedType}
              onChange={(opt) => onChangeLicentieType(opt?.value || null)}
              options={licentieTypeOptions}
              isDisabled={loading}
              placeholder='Selecteer type licentie'
            />
          </div>
          <div>
            <label className='utrecht-form-label'>Licentie</label>
            <ReactSelect
              className={clsx(
                'ac-beheer-select',
                loading && 'ac-beheer-select--disabled'
              )}
              value={selectedLicentie}
              onChange={(opt) => onChangeLicentie(opt?.value || null)}
              options={licentieOptions}
              isDisabled={loading || selectedType?.value !== 'Open Source'}
              placeholder='Selecteer licentie'
              isClearable
            />
          </div>
        </div>
      );
    };

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
          Geef hieronder aan welke licenties van toepassing zijn op de applicatie(s).
        </Paragraph>

        {isMultiApplicatie && (
          <div
            className='ac-register-form-checkbox-wrapper'
            style={{ marginBottom: '1rem' }}
          >
            <p>Geldt dezelfde licentie-informatie voor alle applicaties?</p>
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

        {!isMultiApplicatie || sameForAll ? (
          <div>
            {renderSelectors({
              valueLicentieType: product.applicaties?.[0]?.licentieType || '',
              valueLicentie: product.applicaties?.[0]?.licentie || '',
              onChangeLicentieType: (v) => {
                if (sameForAll && isMultiApplicatie) {
                  applyToAll({
                    licentieType: v,
                    ...(v !== 'Open Source' ? { licentie: '' } : {}),
                  });
                } else {
                  updateApplicatieField(0, 'licentieType', v);
                  if (v !== 'Open Source') updateApplicatieField(0, 'licentie', '');
                }
              },
              onChangeLicentie: (v) => {
                if (sameForAll && isMultiApplicatie) applyToAll({ licentie: v });
                else updateApplicatieField(0, 'licentie', v);
              },
            })}
          </div>
        ) : (
          <div>
            <Table>
              <thead>
                <TableRow>
                  <TableCell>
                    <b>Applicatie</b>
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
                    licentieTypeOptions.find((o) => o.value === app.licentieType) ||
                    null;
                  const selectedLicentie =
                    licentieOptions.find((o) => o.value === app.licentie) || null;
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
                          onChange={(opt) =>
                            updateApplicatieField(
                              index,
                              'licentieType',
                              opt?.value || null
                            )
                          }
                          options={licentieTypeOptions}
                          isDisabled={loading}
                          placeholder='Selecteer type licentie'
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            loading && 'ac-beheer-select--disabled'
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
                          placeholder='Selecteer licentie'
                          isClearable
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }
);

// Step 4 Referentiecomponenten
const ReferentieComponentenForm = memo(
  ({
    product,
    setProduct,
    referentieComponentenOptions,
    refCompFormState,
    setRefCompFormState,
  }) => {
    const { rows, selectedApplication } = refCompFormState;

    const normalizeValues = (arr) => {
      if (!Array.isArray(arr)) return [];
      const values = arr
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'object' && 'value' in item) return String(item.value);
          return String(item);
        })
        .filter((v) => typeof v === 'string' && v.length > 0);
      return Array.from(new Set(values));
    };

    const replaceRefs = (appId, refs) => {
      const refsArray = normalizeValues(refs);
      setProduct((prev) => {
        const applicaties = { ...prev.applicaties };
        const existing = applicaties[appId] || {};
        applicaties[appId] = { ...existing, referentieComponenten: refsArray };
        return { ...prev, applicaties };
      });
    };

    // Filter out existing applications - they already have their referentiecomponenten defined
    const appOptions = Object.entries(product.applicaties)
      .filter(([id, app]) => !app.isExisting) // Only include new applications
      .map(([id, app]) => ({
        value: id,
        label: app.naam,
      }));

    // If no new applications exist, show a message instead of the form
    const hasNewApplications = appOptions.length > 0;

    return (
      <div>
        <h2 id='refcomp-section-title' className='sr-only'>
          Referentiecomponenten
        </h2>

        {!hasNewApplications ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Paragraph>
              <strong>Geen nieuwe applicaties gevonden</strong>
            </Paragraph>
            <Paragraph>
              Alle applicaties in dit product zijn bestaande applicaties die al hun eigen referentiecomponenten hebben.
              Er hoeven geen referentiecomponenten toegevoegd te worden.
            </Paragraph>
          </div>
        ) : (
          <TableContainer className='con-form-wizard-table-container'>
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Applicatie</b>
                </TableCell>
                <TableCell>
                  <b>Referentiecomponenten</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {rows.map((rowId) => {
                const appId = selectedApplication[rowId];
                const saved = normalizeValues(
                  appId != null
                    ? product.applicaties?.[appId]?.referentieComponenten
                    : []
                );
                const selectedMulti = saved
                  .map((v) =>
                    referentieComponentenOptions.find(
                      (o) => String(o.value) === String(v)
                    )
                  )
                  .filter(Boolean);

                return (
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
                          setRefCompFormState((prev) => ({
                            ...prev,
                            selectedApplication: {
                              ...prev.selectedApplication,
                              [rowId]: selectedOption?.value,
                            },
                          }));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <ReactSelect
                        isMulti
                        options={referentieComponentenOptions}
                        value={selectedMulti}
                        isDisabled={selectedApplication[rowId] == null}
                        onChange={(selectedOptions) => {
                          if (selectedApplication[rowId] == null) return;
                          setRefCompFormState((prev) => ({
                            ...prev,
                            selectedRefCompsByRow: {
                              ...prev.selectedRefCompsByRow,
                              [rowId]: Array.isArray(selectedOptions)
                                ? selectedOptions.map((o) => String(o.value))
                                : [],
                            },
                          }));
                          replaceRefs(
                            selectedApplication[rowId],
                            Array.isArray(selectedOptions)
                              ? selectedOptions.map((o) => String(o.value))
                              : []
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AcButton
                          style='buttonSlim'
                          buttonType='secondary'
                          icon={<VISUALS.MINUS />}
                          disabled={rows.length === 1}
                          onClick={() => {
                            setRefCompFormState((prev) => ({
                              ...prev,
                              rows: prev.rows.filter((id) => id !== rowId),
                              selectedApplication: Object.fromEntries(
                                Object.entries(prev.selectedApplication).filter(
                                  ([k]) => Number(k) !== rowId
                                )
                              ),
                              selectedRefCompsByRow: Object.fromEntries(
                                Object.entries(prev.selectedRefCompsByRow).filter(
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
                );
              })}

              <div style={{ marginTop: '1rem' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.PLUS />}
                  onClick={() =>
                    setRefCompFormState((prev) => ({
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
        )}
      </div>
    );
  }
);

ReferentieComponentenForm.displayName = 'ReferentieComponentenForm';

// Step 5 Koppelingen

// Step 6 Standaarden
const StandaardenForm = memo(
  ({
    product,
    setProduct,
    standaardOptions,
    standaardenFormState,
    setStandaardenFormState,
  }) => {
    const { rows, selectedApplication, selectedStandardByRow, supportedByRow } =
      standaardenFormState;

    // Filter out existing applications - they already have their standaarden defined
    const appOptions = Object.entries(product.applicaties)
      .filter(([id, app]) => !app.isExisting) // Only include new applications
      .map(([id, app]) => ({
        value: id,
        label: app.naam,
      }));

    // If no new applications exist, show a message instead of the form
    const hasNewApplications = appOptions.length > 0;

    const setSupported = (rowId, supported) => {
      setStandaardenFormState((prev) => ({
        ...prev,
        supportedByRow: { ...prev.supportedByRow, [rowId]: !!supported },
      }));

      const appId = selectedApplication[rowId];
      const stdVal = selectedStandardByRow[rowId];
      if (appId == null || !stdVal) return;

      setProduct((prev) => {
        const applicaties = { ...prev.applicaties };
        const existing = applicaties[appId] || {};
        const current = Array.isArray(existing.standaarden)
          ? existing.standaarden
          : [];
        const other = current.filter((s) =>
          typeof s === 'object' ? s.naam !== stdVal : s !== stdVal
        );
        const nextItem = {
          naam: String(stdVal),
          bewijs: existing.bewijs || '',
          supported: !!supported,
        };
        applicaties[appId] = { ...existing, standaarden: [...other, nextItem] };
        return { ...prev, applicaties };
      });
    };

    const setBewijs = (rowId, file) => {
      const appId = selectedApplication[rowId];
      const stdVal = selectedStandardByRow[rowId];
      if (appId == null || !stdVal) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        setProduct((prev) => {
          const applicaties = { ...prev.applicaties };
          const existing = applicaties[appId] || {};
          const current = Array.isArray(existing.standaarden)
            ? existing.standaarden
            : [];
          const updated = current.map((s) => {
            if (typeof s === 'object' ? s.naam === stdVal : s === stdVal) {
              return {
                naam: String(stdVal),
                bewijs: dataUrl,
                supported: !!supportedByRow[rowId],
              };
            }
            return s;
          });
          applicaties[appId] = { ...existing, standaarden: updated };
          return { ...prev, applicaties };
        });
      };
      reader.readAsDataURL(file);
    };

    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaarden
        </h2>

        {!hasNewApplications ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Paragraph>
              <strong>Geen nieuwe applicaties gevonden</strong>
            </Paragraph>
            <Paragraph>
              Alle applicaties in dit product zijn bestaande applicaties die al hun eigen standaarden hebben.
              Er hoeven geen standaarden toegevoegd te worden.
            </Paragraph>
          </div>
        ) : (
          <TableContainer className='con-form-wizard-table-container'>
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Applicatie</b>
                </TableCell>
                <TableCell>
                  <b>Standaard</b>
                </TableCell>
                <TableCell>
                  <b>Ondersteund</b>
                </TableCell>
                <TableCell>
                  <b>Bewijs</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {rows.map((rowId) => {
                const selectedStdVal = selectedStandardByRow[rowId] || '';
                const selectedStd =
                  selectedStdVal &&
                  standaardOptions.find(
                    (o) => String(o.value) === String(selectedStdVal)
                  );

                return (
                  <TableRow key={rowId}>
                    <TableCell style={{ alignContent: 'center' }}>
                      <ReactSelect
                        options={appOptions}
                        value={
                          selectedApplication[rowId] != null
                            ? appOptions.find(
                                (o) => o.value === selectedApplication[rowId]
                              )
                            : null
                        }
                        onChange={(opt) =>
                          setStandaardenFormState((prev) => ({
                            ...prev,
                            selectedApplication: {
                              ...prev.selectedApplication,
                              [rowId]: opt?.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell style={{ alignContent: 'center' }}>
                      <ReactSelect
                        options={standaardOptions}
                        value={selectedStd || null}
                        isDisabled={selectedApplication[rowId] == null}
                        onChange={(opt) =>
                          setStandaardenFormState((prev) => ({
                            ...prev,
                            selectedStandardByRow: {
                              ...prev.selectedStandardByRow,
                              [rowId]: opt?.value || '',
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell style={{ alignContent: 'center' }}>
                      <input
                        type='checkbox'
                        checked={!!supportedByRow[rowId]}
                        disabled={
                          selectedApplication[rowId] == null ||
                          !selectedStandardByRow[rowId]
                        }
                        onChange={(e) => setSupported(rowId, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell style={{ alignContent: 'center' }}>
                      {(() => {
                        const appIdVal = selectedApplication[rowId];
                        const stdVal = selectedStandardByRow[rowId];
                        const saved =
                          appIdVal != null && stdVal
                            ? (Array.isArray(
                                product.applicaties?.[appIdVal]?.standaarden
                              )
                                ? product.applicaties[appIdVal].standaarden
                                : []
                              ).find((s) =>
                                typeof s === 'object'
                                  ? s.naam === stdVal
                                  : s === stdVal
                              )
                            : null;

                        return (
                          <LogoUploadField
                            fieldConfig={{
                              label: 'Bewijs (upload)',
                              filename:
                                standaardenFormState?.bewijsByRow?.[rowId] || '',
                            }}
                            _value={
                              typeof saved === 'object' ? saved?.bewijs || '' : ''
                            }
                            onChange={(dataUrl) =>
                              setBewijs(rowId, { target: { result: dataUrl } })
                            }
                            onChangeFileName={(name) =>
                              setStandaardenFormState((prev) => ({
                                ...prev,
                                bewijsByRow: {
                                  ...prev.bewijsByRow,
                                  [rowId]: name || '',
                                },
                              }))
                            }
                            onClear={() =>
                              setBewijs(rowId, { target: { result: '' } })
                            }
                            accept={['.pdf', '.txt', '.doc', '.docx']}
                            showPreview={false}
                            validation={{ required: false }}
                            propertyName={`bewijs-${rowId}`}
                            isDisabled={
                              selectedApplication[rowId] == null ||
                              !selectedStandardByRow[rowId]
                            }
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell style={{ alignContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AcButton
                          style='buttonSlim'
                          buttonType='secondary'
                          icon={<VISUALS.MINUS />}
                          disabled={rows.length === 1}
                          onClick={() =>
                            setStandaardenFormState((prev) => ({
                              ...prev,
                              rows: prev.rows.filter((id) => id !== rowId),
                              selectedApplication: Object.fromEntries(
                                Object.entries(prev.selectedApplication).filter(
                                  ([k]) => Number(k) !== rowId
                                )
                              ),
                              selectedStandardByRow: Object.fromEntries(
                                Object.entries(prev.selectedStandardByRow).filter(
                                  ([k]) => Number(k) !== rowId
                                )
                              ),
                              supportedByRow: Object.fromEntries(
                                Object.entries(prev.supportedByRow).filter(
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
                );
              })}

              <div style={{ marginTop: '1rem' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.PLUS />}
                  onClick={() =>
                    setStandaardenFormState((prev) => ({
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
        )}
      </div>
    );
  }
);

StandaardenForm.displayName = 'StandaardenForm';

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
      { value: 'A -> B', label: 'Van A naar B' },
      { value: 'B -> A', label: 'Van B naar A' },
      { value: 'A <-> B', label: 'Bidirectioneel' },
    ];

    const typeOptions = [
      { value: 'Maatwerk', label: 'Maatwerk' },
      { value: 'Standaard', label: 'Standaard' },
      { value: 'API', label: 'API' },
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
                        style='buttonSlim'
                        buttonType='secondary'
                        icon={<VISUALS.MINUS />}
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

KoppelingenForm.displayName = 'KoppelingenForm';

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
                        style='buttonSlim'
                        buttonType='secondary'
                        icon={<VISUALS.MINUS />}
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
    return (
      <div>
        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>
            Product informatie
          </h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>{product.productName}</h4>
              {product.logo && (
                <ConLogoPreview
                  logoUrl={product.logo}
                  className='ac-register-review__logo'
                />
              )}
            </div>
            <Separator className='con-form-wizard-review-header__separator' />

            <div className='ac-register-review__field'>
              <strong>Beschrijving:</strong>
              <span>{product.beschrijving || '-'}</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Productpagina:</strong> {product.productpagina || '-'}
            </div>
            <div className='ac-register-review__field'>
              <strong>Hosting:</strong> {product.hosting || '-'}
            </div>
            <div className='ac-register-review__field'>
              <strong>Jurisdictie:</strong> {product.jurisdictie || '-'}
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
                              const soort = kp.sooortKoppeling;
                              const details =
                                richting || soort
                                  ? ` (${[richting, soort]
                                      .filter(Boolean)
                                      .join(', ')})`
                                  : '';
                              return (
                                <UnorderedListItem
                                  key={`${kp.applicatie1}-${kp.applicatie2}-${kIdx}`}
                                >
                                  {kp.applicatie1} ↔ {kp.applicatie2}
                                  {details}
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

const TestForm = memo(({ currentStep }) => {
  // TODOThis testForm needs to be removed after all the steps have their own form

  return <div>hi this is current step {currentStep}</div>;
});

ProductOpbouwForm.displayName = 'ProductOpbouwForm';
ProductOpbouwInformationForm.displayName = 'ProductOpbouwInformationForm';

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
    setAanbiederKeuze
  }) => {
    // Set default aanbieder to user's active organization when switching to 'bestaand'
    useEffect(() => {
      if (aanbiederkeuze === 'bestaand' && userStore?.activeOrganization && !product.aanbieder) {
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
      <div
        role='group'
        aria-labelledby='aanbieder-section-title'
      >
        <h2 id='aanbieder-section-title' className='sr-only'>
          Aanbieder informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            
            {/* Choice between existing and new organization - using same styling as ProductOpbouw */}
            <div className="con-form-field-wrapper field-size-full">
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
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
                schemaType="product"
                schemaProperty="aanbieder"
                value={product.aanbieder}
                onChange={(value) => setProductData('aanbieder', value)}
                isDisabled={loading}
                width="full"
                customProps={{ 
                  placeholder: "Selecteer een organisatie...",
                  isClearable: true
                }}
                schemas={schemas}
              />
            )}

            {/* New organization form fields */}
            {aanbiederkeuze === 'nieuw' && (
              <>
                {/* Organization Name - Required */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="naam"
                  value={product.aanbiederNaam || ''}
                  onChange={(value) => setProductData('aanbiederNaam', value)}
                  isDisabled={loading}
                  width="full"
                  customProps={{ placeholder: "Bijvoorbeeld: VNG Realisatie" }}
                  schemas={schemas}
                />

                {/* Organization Type - Required */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="type"
                  value={product.aanbiederType || ''}
                  onChange={(value) => setProductData('aanbiederType', value)}
                  isDisabled={loading}
                  width="half"
                  schemas={schemas}
                />

                {/* Organization Website - Required */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="website"
                  value={product.aanbiederWebsite || ''}
                  onChange={(value) => setProductData('aanbiederWebsite', value)}
                  isDisabled={loading}
                  width="half"
                  customProps={{ placeholder: "https://www.organisatie.nl" }}
                  schemas={schemas}
                />

                {/* Short Description */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="beschrijvingKort"
                  value={product.aanbiederBeschrijvingKort || ''}
                  onChange={(value) => setProductData('aanbiederBeschrijvingKort', value)}
                  isDisabled={loading}
                  width="full"
                  customProps={{ 
                    placeholder: "Korte beschrijving van de organisatie",
                    maxLength: 255
                  }}
                  schemas={schemas}
                />

                {/* Long Description */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="beschrijvingLang"
                  value={product.aanbiederBeschrijvingLang || ''}
                  onChange={(value) => setProductData('aanbiederBeschrijvingLang', value)}
                  isDisabled={loading}
                  width="full"
                  customProps={{ 
                    placeholder: "Uitgebreide beschrijving van de organisatie",
                    component: "AcTextarea",
                    rows: 4,
                    maxLength: 2000
                  }}
                  schemas={schemas}
                />

                {/* Email Address */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="e-mailadres"
                  value={product.aanbiederEmail || ''}
                  onChange={(value) => setProductData('aanbiederEmail', value)}
                  isDisabled={loading}
                  width="half"
                  customProps={{ placeholder: "contact@organisatie.nl" }}
                  schemas={schemas}
                />

                {/* Phone Number */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="telefoonnummer"
                  value={product.aanbiederTelefoonnummer || ''}
                  onChange={(value) => setProductData('aanbiederTelefoonnummer', value)}
                  isDisabled={loading}
                  width="half"
                  customProps={{ placeholder: "06 12345678" }}
                  schemas={schemas}
                />

                {/* KvK Number */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="kvkNummer"
                  value={product.aanbiederKvkNummer || ''}
                  onChange={(value) => setProductData('aanbiederKvkNummer', value)}
                  isDisabled={loading}
                  width="half"
                  customProps={{ placeholder: "12345678" }}
                  schemas={schemas}
                />

                {/* Logo URL */}
                <ConSchemaEnhancedField
                  schemaType="organisatie"
                  schemaProperty="logo"
                  value={product.aanbiederLogo || ''}
                  onChange={(value) => setProductData('aanbiederLogo', value)}
                  isDisabled={loading}
                  width="half"
                  customProps={{ placeholder: "https://www.organisatie.nl/logo.png" }}
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
DienstenForm.displayName = 'DienstenForm';
ControlerenForm.displayName = 'ControlerenForm';

TestForm.displayName = 'TestForm';

export default withStore(observer(AcFormsProduct));
