import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { useDebouncedInput } from '@src/hooks/index';

import {
  Heading1,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import ConFormProductTypeSelectStage from './con-form-product-type-select-stage';

// Utils
import {
  shouldShowAanbiederStep,
  shouldShowVersiesStep,
  getAdjustedStepIndex as utilGetAdjustedStepIndex,
  getLogicalStepFromIndex as utilGetLogicalStepFromIndex,
  getStatus,
  getStatusMultiStep,
  currentStepName as utilCurrentStepName,
  getNextStepIndex as utilGetNextStepIndex,
  getPrevStepIndex as utilGetPrevStepIndex,
} from './utils/steps.utils';
import { stripLocalIds } from './utils/serialization.utils';
import {
  getDisabledStatus as utilGetDisabledStatus,
  getDisabledTooltip as utilGetDisabledTooltip,
} from './utils/validation.utils';
import {
  getPageTitle as utilGetPageTitle,
  getPageDescription as utilGetPageDescription,
} from './utils/texts.utils';
import { commongroundApiUrl } from '@config';
import { uploadFileToObject, isDataUrlNeedingUpload } from '@src/utilities';

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

const AcFormsProductInner = ({
  userStore,
  store,
  formType,
  productId,
  onClearProductId,
}) => {
  // Determine edit mode from productId
  const isEditMode = !!productId;
  const navigate = useNavigate();

  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  // Edit mode prefill state
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);
  const [prefillRetry, setPrefillRetry] = useState(0);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [isMultiApplicatie, setIsMultiApplicatie] = useState(false); // shows wether the product has multiple applicaties, used to dictate how to render the form

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
    aanbieder: null, // Organization object reference - must be explicitly selected by user

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

  // Ref for ProcessSteps container to add click handlers
  const processStepsRef = useRef(null);

  /**
   * Generate a mapping of visual step indices to actual step indices
   * This must match the order in which ProcessSteps renders clickable elements
   * @returns {number[]} Array where index is visual position, value is actual step index
   */
  const generateStepIndexMapping = useCallback(() => {
    const mapping = [];
    const showsAanbiederStep = shouldShowAanbiederStep(formType);
    const showsVersiesStep = shouldShowVersiesStep(product);

    // First main step: Productopbouw (header)
    mapping.push(getAdjustedStepIndex(0));

    // Sub-steps under Productopbouw:
    mapping.push(getAdjustedStepIndex(1)); // Product informatie
    if (showsAanbiederStep) {
      mapping.push(getAdjustedStepIndex(2)); // Aanbieder informatie (conditional)
    }

    // Second main step: Applicatie configuratie (header)
    mapping.push(getAdjustedStepIndex(3)); // Applicaties

    // Sub-steps under Applicatie configuratie:
    mapping.push(getAdjustedStepIndex(4)); // Licentie
    if (showsVersiesStep) {
      mapping.push(getAdjustedStepIndex(5)); // Versies (conditional)
    }
    mapping.push(getAdjustedStepIndex(6)); // Referentiecomponenten
    mapping.push(getAdjustedStepIndex(7)); // Standaarden
    mapping.push(getAdjustedStepIndex(8)); // Koppelingen
    mapping.push(getAdjustedStepIndex(9)); // Diensten

    // Third main step: Controleren (header)
    mapping.push(getAdjustedStepIndex(10));

    return mapping;
  }, [formType, product]);

  /**
   * Handle step navigation from clickable process steps
   * Maps visual step indices to actual step numbers accounting for conditional steps
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

  // Step accessibility handled via UI click handlers

  // Add click handlers to ProcessSteps after each render
  useEffect(() => {
    if (!processStepsRef.current) return;
    // Disable step clicks while prefill is in progress or when there is a prefill error
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
    product.cloudDienstverleningsmodel, // Re-run when versies visibility changes
  ]); // Re-run when currentStep changes

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
    dienstIdByRow: {}, // Track dienst IDs by row
    moduleIndexByRow: {}, // Track which module each row belongs to
    allAppsDienst: null,
  });

  // Separate array to track chosen referentieComponenten with their standards
  // Structure: [{ id, naam, aanbevolenStandaarden: [], verplichteStandaarden: [], applicatieId }]
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // State to track the "same for all" choice from referentiecomponenten stage
  // This affects how standards are displayed and managed
  const [referentieComponentenSameForAll, setReferentieComponentenSameForAll] =
    useState(true);

  // Prefill referentiecomponenten state for edit mode without relying on effects
  // Accepts optional modules/options to avoid stale state during async updates
  const prefillReferentieComponentenWithStandardsForEdit = useCallback(
    (modulesInput, optionsInput) => {
      if (!isEditMode) return;
      const options = Array.isArray(optionsInput) ? optionsInput : [];
      if (options.length === 0) return;
      const modules = Array.isArray(modulesInput) ? modulesInput : product.modules;
      const firstModule = modules?.[0];
      if (!firstModule || typeof firstModule !== 'object') return;
      const rcIds = Array.isArray(firstModule.referentieComponenten)
        ? firstModule.referentieComponenten
        : [];
      if (rcIds.length === 0) return;

      // ✅ FIX: Normalize referentieComponenten IDs the same way as the stage component
      const normalizeReferentieComponentenId = (refId) => {
        // Handle null, undefined, or empty values
        if (refId == null || refId === '') {
          return null; // or return '' if you prefer empty string
        }

        if (typeof refId === 'object') {
          const extractedId = refId.id || refId.value || refId.naam;
          return extractedId != null ? String(extractedId) : null;
        }

        return String(refId);
      };

      setReferentieComponentenWithStandards((prev) => {
        const filtered = prev.filter((entry) => entry.applicatieId !== 0);
        const entries = rcIds.map((refId) => {
          // Normalize the ID before matching
          const normalizedRefId = normalizeReferentieComponentenId(refId);
          const refOption = options.find(
            (opt) => String(opt.value) === normalizedRefId
          );
          const refData = refOption?.data || {};
          return {
            id: normalizedRefId, // Use normalized ID
            naam: refOption?.label || normalizedRefId,
            moduleId: 0,
            applicatieId: 0,
            aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
            verplichteStandaarden: refData.verplichteStandaarden || [],
            fullData: refData,
          };
        });
        return [...filtered, ...entries];
      });
    },
    [isEditMode, product.modules]
  );

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

  // Prepare koppelingen form UI state from a modules array (used for edit-mode prefill)
  const prepareKoppelingenFormStateFromModules = (modulesInput) => {
    const modules = Array.isArray(modulesInput) ? modulesInput : [];
    let rowCounter = 0;
    const nextRows = [];
    const nextSelectedAppAByRow = {};
    const nextSelectedAppBByRow = {};
    const nextDirectionByRow = {};
    const nextTypeByRow = {};
    const nextKoppelingIdByRow = {};
    const nextModuleIndexByRow = {};

    /**
     * Edit-mode: UI stores Applicatie A as a modules array index, while
     * kpl['@self'].relations.moduleA is an id/object reference.
     * We normalize that id and look up the correct index, handling mixed module shapes
     * (new module objects vs existing module ids). If no relation is present or no match
     * can be found, we fall back to the containing module's index so the row stays usable.
     */
    const resolveModuleAIndexFromRelation = (kpl, fallbackIndex) => {
      try {
        const relation = kpl?.['@self']?.relations?.moduleA;
        if (relation == null) return fallbackIndex;

        // Relation may be an id (string/number) or an object containing an id
        const relatedModuleId =
          typeof relation === 'object'
            ? String(relation.id ?? relation.value ?? '')
            : String(relation);
        if (!relatedModuleId) return fallbackIndex;

        const idx = modules.findIndex((mod) => {
          if (!mod || typeof mod !== 'object') return false;
          const modId = mod?.id ?? mod?.['@self']?.id;
          return String(modId) === relatedModuleId;
        });
        return idx >= 0 ? idx : fallbackIndex;
      } catch (e) {
        // TODO: consider reporting if needed; keep robust fallback behavior for now
        return fallbackIndex;
      }
    };

    modules.forEach((module, moduleIndex) => {
      if (!module || typeof module !== 'object') return;
      const koppelingen = Array.isArray(module.koppelingen)
        ? module.koppelingen
        : [];
      koppelingen.forEach((kpl) => {
        const rowId = rowCounter++;
        nextRows.push(rowId);
        // Applicatie A: prefer koppeling relation to moduleA when present in API data
        const appAIndex = resolveModuleAIndexFromRelation(kpl, moduleIndex);
        nextSelectedAppAByRow[rowId] = appAIndex;
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
        // ✅ FIXED: Use existing _localId if present (which now includes existing IDs)
        const localId =
          kpl && kpl._localId
            ? kpl._localId
            : `kpl_${Date.now().toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;
        nextKoppelingIdByRow[rowId] = localId;
        // Track last persisted module index based on resolved Applicatie A
        nextModuleIndexByRow[rowId] = appAIndex;
      });
    });

    if (nextRows.length === 0) return; // nothing to prefill

    setKoppelingenFormState((prev) => ({
      ...prev,
      rows: nextRows,
      nextRowId: nextRows.length,
      selectedAppAByRow: { ...prev.selectedAppAByRow, ...nextSelectedAppAByRow },
      selectedAppBByRow: { ...prev.selectedAppBByRow, ...nextSelectedAppBByRow },
      directionByRow: { ...prev.directionByRow, ...nextDirectionByRow },
      typeByRow: { ...prev.typeByRow, ...nextTypeByRow },
      koppelingIdByRow: { ...prev.koppelingIdByRow, ...nextKoppelingIdByRow },
      moduleIndexByRow: { ...prev.moduleIndexByRow, ...nextModuleIndexByRow },
    }));
  };

  // Prepare diensten form UI state from a modules array (used for edit-mode prefill)
  const prepareDienstenFormStateFromModules = (modulesInput) => {
    const modules = Array.isArray(modulesInput) ? modulesInput : [];
    let rowCounter = 0;
    const nextRows = [];
    const nextSelectedApplication = {};
    const nextSelectedDienstByRow = {};
    const nextDienstBeschrijvingByRow = {};
    const nextDienstIdByRow = {}; // ✅ FIXED: Track dienst IDs
    const nextModuleIndexByRow = {}; // ✅ FIXED: Track module indices

    modules.forEach((module, moduleIndex) => {
      if (!module || typeof module !== 'object') return;
      const diensten = Array.isArray(module.diensten) ? module.diensten : [];
      diensten.forEach((dienst) => {
        const rowId = rowCounter++;
        nextRows.push(rowId);
        nextSelectedApplication[rowId] = moduleIndex;
        nextModuleIndexByRow[rowId] = moduleIndex; // ✅ FIXED: Track module index

        if (dienst && typeof dienst === 'object') {
          // ✅ FIXED: Track the dienst ID (either existing or local)
          if (dienst._localId) {
            nextDienstIdByRow[rowId] = dienst._localId;
          }
          if (dienst.type != null)
            nextSelectedDienstByRow[rowId] = String(dienst.type);
          if (dienst.naam != null)
            nextDienstBeschrijvingByRow[rowId] = String(dienst.naam);
        } else if (dienst != null) {
          nextSelectedDienstByRow[rowId] = String(dienst);
        }
      });
    });

    if (nextRows.length === 0) return;

    setDienstenFormState((prev) => ({
      ...prev,
      rows: nextRows,
      nextRowId: nextRows.length,
      selectedApplication: {
        ...prev.selectedApplication,
        ...nextSelectedApplication,
      },
      selectedDienstByRow: {
        ...prev.selectedDienstByRow,
        ...nextSelectedDienstByRow,
      },
      dienstBeschrijvingByRow: {
        ...prev.dienstBeschrijvingByRow,
        ...nextDienstBeschrijvingByRow,
      },
      dienstIdByRow: {
        // ✅ FIXED: Include dienst ID tracking
        ...prev.dienstIdByRow,
        ...nextDienstIdByRow,
      },
      moduleIndexByRow: {
        // ✅ FIXED: Include module index tracking
        ...prev.moduleIndexByRow,
        ...nextModuleIndexByRow,
      },
    }));
  };

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
      (module) => module.naam || 'Unnamed Applicatie'
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
            setProduct((prev) => ({
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

  /**
   * Helper methods for module management
   * These methods help other stages filter and work with the modules array
   */

  // Get all new modules (objects in modules array)
  const getNewModules = useCallback(() => {
    return (product.modules || []).filter(
      (module) => typeof module === 'object' && !module?.id
    );
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
      if (typeof module === 'string' || module?.id) {
        // Existing module
        const modId = typeof module === 'string' ? module : module.id;
        const lookupData = existingModulesLookup[modId];
        return {
          id: modId,
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
  }, [schemas?.dienst]);

  // Get query parameters from schema property configuration
  const getReferentieComponentenQueryParams = useCallback(() => {
    const moduleSchema = schemas?.module;
    const refCompProperty = moduleSchema?.properties?.referentieComponenten;
    const queryParamsString =
      refCompProperty?.items?.objectConfiguration?.queryParams;

    const baseParams = {
      _limit: '500', // Load 500 referentiecomponenten upfront
      _page: '1',
      _source: 'index',
    };

    if (queryParamsString) {
      // // Parse the queryParams string: "gemmaType=Referentiecomponent&_extend=aanbevolenStandaarden,verplichteStandaarden"
      // const urlParams = new URLSearchParams(queryParamsString);
      // urlParams.forEach((value, key) => {
      //   baseParams[key] = value;
      // });
    } else {
      // Fallback to hardcoded if schema doesn't have queryParams
      baseParams.gemmaType = 'Referentiecomponent';
      // Ensure standards are included with referentiecomponenten
      // baseParams._extend = 'aanbevolenStandaarden,verplichteStandaarden';
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
      _source: 'index',
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

  // Function to load all referentiecomponenten upfront using object store cache
  // ✅ Uses cache-first strategy for immediate response
  // const loadReferentieComponenten = useCallback(async () => {
  //   if (!schemas?.module) return; // Wait for schemas to load

  //   console.info('📋 Loading referentiecomponenten via object store cache...');
  //   setReferentieComponentenLoading(true);

  //   try {
  //     const queryParams = getReferentieComponentenQueryParams();

  //     // Use object store cache-first method for immediate response
  //     const list = await store.object.fetchGemmaElementsCacheFirst(
  //       'Referentiecomponent',
  //       queryParams
  //     );

  //     const mapToOption = (item, index) => {
  //       const label =
  //         item?.xml?.name?._value ||
  //         item?.naam ||
  //         item?.name ||
  //         item?.title ||
  //         item?.label ||
  //         `Component ${index + 1}`;
  //       const value = item?.value || item?.id || item?.slug || label;
  //       return {
  //         value: String(value),
  //         label: String(label),
  //         data: item, // Store the full API data for access to aanbevolenStandaarden, verplichteStandaarden
  //       };
  //     };

  //     const options = list.map(mapToOption).filter((o) => o.label && o.value);
  //     setReferentieComponentenOptions(options);
  //     console.info(
  //       `✅ Loaded ${options.length} referentiecomponenten (cache-first)`
  //     );
  //     // Prefill edit-mode selections as soon as options are available
  //     if (isEditMode) {
  //       prefillReferentieComponentenWithStandardsForEdit(product.modules, options);
  //     }
  //   } catch (e) {
  //     console.error('Failed to load referentie componenten:', e);
  //     setReferentieComponentenOptions([]);
  //   } finally {
  //     setReferentieComponentenLoading(false);
  //   }
  // }, [schemas, getReferentieComponentenQueryParams, store]);

  // TODO remove this once we have the referentiecomponenten options loaded from the object store cache
  const loadReferentieComponenten = useCallback(async () => {
    if (!schemas?.module) return; // Wait for schemas to load

    console.info('📋 Loading referentiecomponenten via object store cache...');
    setReferentieComponentenLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
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
      console.info(
        `✅ Loaded ${options.length} referentiecomponenten (cache-first)`
      );
      // Prefill edit-mode selections as soon as options are available
      if (isEditMode) {
        prefillReferentieComponentenWithStandardsForEdit(product.modules, options);
      }
    } catch (e) {
      console.error('Failed to load referentie componenten:', e);
      setReferentieComponentenOptions([]);
    } finally {
      setReferentieComponentenLoading(false);
    }
  }, [schemas, getReferentieComponentenQueryParams, store]);

  // Function to load standaarden using object store cache
  // ✅ Uses cache-first strategy for immediate response
  // const loadStandaarden = useCallback(async () => {
  //   if (!schemas?.module) return;

  //   console.info('📋 Loading standaarden via object store cache...');
  //   setStandaardenOptionsLoading(true);

  //   try {
  //     const queryParams = getStandaardenQueryParams();

  //     // Use object store cache-first method for immediate response
  //     const list = await store.object.fetchGemmaElementsCacheFirst(
  //       'standaard',
  //       queryParams
  //     );

  //     const options = list
  //       .map((item, index) => {
  //         const label =
  //           item?.xml?.name?._value ||
  //           item?.naam ||
  //           item?.name ||
  //           item?.title ||
  //           item?.label ||
  //           `Standaard ${index + 1}`;
  //         const value = item?.value || item?.id || item?.slug || label;
  //         return { value: String(value), label: String(label), data: item };
  //       })
  //       .filter((o) => o.label && o.value);

  //     setStandaardenOptions(options);
  //     console.info(`✅ Loaded ${options.length} standaarden (cache-first)`);
  //   } catch (e) {
  //     console.error('Failed to load standaarden:', e);
  //     setStandaardenOptions([]);
  //   } finally {
  //     setStandaardenOptionsLoading(false);
  //   }
  // }, [schemas, getStandaardenQueryParams, store]);

  // TODO remove this once we have the standaarden options loaded from the object store cache
  const loadStandaarden = useCallback(async () => {
    if (!schemas?.module) return;

    console.info('📋 Loading standaarden via object store cache...');
    setStandaardenOptionsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
        '_extend[]': '@self.schema',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
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
      console.info(`✅ Loaded ${options.length} standaarden (cache-first)`);
    } catch (e) {
      console.error('Failed to load standaarden:', e);
      setStandaardenOptions([]);
    } finally {
      setStandaardenOptionsLoading(false);
    }
  }, [schemas, getStandaardenQueryParams, store]);

  // ✅ Load referentiecomponenten and standaarden when schemas are available
  useEffect(() => {
    if (!schemas?.module) return;

    // Only load if we haven't loaded yet and we're not currently loading
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
  }, [schemas?.module]);

  // Modules options with search functionality
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Function to search modules with debouncing using object store cache
  // ✅ Uses cache-first strategy for immediate response
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

  // Map fetched API product to local state structure used by the wizard
  const mapFetchedProductToLocalState = useCallback(
    (apiProduct) => {
      if (!apiProduct) return null;

      const markedModules = apiProduct.modules.map((module) => ({
        ...module,
        koppelingen: module.koppelingen.map((kpl) => ({
          // ✅ FIXED: Preserve existing ID if present, otherwise generate local ID
          _localId: kpl.id
            ? `existing_${kpl.id}`
            : `kpl_${Date.now().toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
          ...kpl,
        })),
        diensten: module.diensten.map((dienst) => ({
          // ✅ FIXED: Preserve existing dienst ID if present, otherwise generate local ID
          _localId:
            typeof dienst === 'object' && dienst.id
              ? `existing_${dienst.id}`
              : `dienst_${Date.now().toString(36)}_${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,
          ...(typeof dienst === 'object' ? dienst : { type: dienst }),
        })),
      }));

      // a module from the modules could be missing the `naam` and `beschrijvingKort` property.
      // when that happens gather it from the @self metadata.
      markedModules.forEach((module) => {
        if (!('naam' in module)) {
          module.naam = module['@self'].name;
        }
        if (!('beschrijvingKort' in module)) {
          module.beschrijvingKort = module['@self'].summary;
        }
      });

      // Ensure each module has a moduleVersies array with schema-based defaults
      try {
        const moduleVersieDefaults = (() => {
          const defaults = {};
          const moduleVersieSchema = schemas?.moduleversie;
          if (moduleVersieSchema?.properties) {
            Object.entries(moduleVersieSchema.properties).forEach(
              ([key, property]) => {
                if (property.default !== undefined) {
                  defaults[key] = property.default;
                }
                if (property.example !== undefined && defaults[key] === undefined) {
                  defaults[key] = property.example;
                }
              }
            );
          }
          return defaults;
        })();

        markedModules.forEach((module) => {
          const hasArray = Array.isArray(module.moduleVersies);
          const hasItems = hasArray && module.moduleVersies.length > 0;
          if (!hasItems) {
            module.moduleVersies = [{ ...moduleVersieDefaults }];
          }
        });
      } catch (e) {
        // TODO: consider logging; keep mapper resilient
      }

      // cloudDienstverleningsmodel comes as array; we use single string (first value) for UI logic
      const cloudModel = Array.isArray(apiProduct.cloudDienstverleningsmodel)
        ? apiProduct.cloudDienstverleningsmodel[0] || ''
        : apiProduct.cloudDienstverleningsmodel || '';

      const mappedProduct = {
        // Schema-compliant properties
        naam: apiProduct.naam || '',
        beschrijvingKort: apiProduct.beschrijvingKort || '',
        beschrijvingLang: apiProduct.beschrijvingLang || '',
        website: apiProduct.website || '',
        logo: apiProduct.logo || '',
        logoFilename: '',
        logoAccessUrl: null,
        hostingLocatie: apiProduct.hostingLocatie || '',
        hostingJurisdictie: apiProduct.hostingJurisdictie || '',
        contactpersoon: apiProduct.contactpersoon || '',
        cloudDienstverleningsmodel: cloudModel,
        modules: markedModules,

        // Aanbieder reference if present
        aanbieder: apiProduct.aanbieder || null,

        // Keep create-only fields untouched
        aanbiederNaam: '',
        aanbiederType: '',
        aanbiederWebsite: '',
        aanbiederBeschrijvingKort: '',
        aanbiederBeschrijvingLang: '',
        aanbiederEmail: '',
        aanbiederTelefoonnummer: '',
        aanbiederKvkNummer: '',
        aanbiederLogo: '',
      };

      // Prepare koppelingen UI state from mapped modules immediately (edit mode path)
      try {
        prepareKoppelingenFormStateFromModules(mappedProduct.modules);
      } catch (e) {
        // TODO: If needed, add error reporting here
      }

      // Prepare diensten UI state from mapped modules immediately (edit mode path)
      try {
        prepareDienstenFormStateFromModules(mappedProduct.modules);
      } catch (e) {
        // TODO: If needed, add error reporting here
      }

      return mappedProduct;
    },
    [store, schemas]
  );

  // Prefill product data in edit mode
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        // Skip first stage in edit mode
        setCurrentStep(getAdjustedStepIndex(1));
        // Fetch the product
        await store.object.fetchObject(
          'voorzieningen',
          'product',
          String(productId),
          {
            _extend: [
              '@self.schema',
              'modules',
              'modules.koppelingen',
              'modules.diensten',
            ],
          }
        );
        const fetched = store.object.getObject(
          'voorzieningen_product',
          String(productId)
        );
        if (cancelled) return;
        const mapped = mapFetchedProductToLocalState(fetched);
        setIsMultiApplicatie(mapped.modules.length > 1);
        if (mapped) {
          // Attempt prefill immediately when product modules are known (may no-op if options not yet loaded)
          prefillReferentieComponentenWithStandardsForEdit(
            mapped.modules,
            referentieComponentenOptions
          );
          setProduct({ ...mapped, modules: mapped.modules || [] });

          // Fetch logo file metadata if logo exists and is not a data URL
          if (mapped.logo && !isDataUrlNeedingUpload(mapped.logo)) {
            try {
              const filesResponse = await fetch(
                `${commongroundApiUrl()}/openregister/api/objects/voorzieningen/product/${productId}/files`
              );
              if (filesResponse.ok) {
                const filesData = await filesResponse.json();
                const files = filesData.results || [];
                // Find the logo file (usually named 'logo.png' or similar)
                const logoFile = files.find(
                  (f) =>
                    f.title?.toLowerCase().includes('logo') ||
                    f.name?.toLowerCase().includes('logo')
                );
                if (logoFile) {
                  setProduct((prev) => ({
                    ...prev,
                    logoFilename: logoFile.title || logoFile.name || 'logo.png',
                    logoAccessUrl: logoFile.accessUrl || null,
                  }));
                }
              }
            } catch (error) {
              console.warn('Failed to fetch logo metadata:', error);
            }
          }
        }
      } catch (e) {
        setPrefillError(
          'Het laden van het product is mislukt. Probeer het opnieuw of start een nieuw product.'
        );
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, productId, mapFetchedProductToLocalState, store, prefillRetry]);

  // State for aanbieder selection
  const [aanbiederkeuze, setAanbiederKeuze] = useState('bestaand'); // 'bestaand' or 'nieuw'

  /**
   * Upload all evidence files (bewijs) in modules' compliancy arrays
   * Uploads each file separately (not batched) for reliability
   *
   * IMPORTANT: Evidence files are uploaded to the MODULE, not the product!
   * The file ID (not path) is saved in compliancy.bewijs for later fetching.
   *
   * This allows:
   * - Fetching files via: GET /api/objects/voorzieningen/module/{moduleId}/files/{fileId}
   * - Matching files to specific standards in compliancy
   * - Flexible file management per module
   *
   * @param {Array} modules - Array of modules with compliancy arrays
   * @returns {Promise<Array>} Array of modules with bewijs set to file IDs
   */
  const uploadCompliancyEvidence = async (modules) => {
    if (!Array.isArray(modules) || modules.length === 0) {
      return modules;
    }

    const processedModules = await Promise.all(
      modules.map(async (module) => {
        if (typeof module !== 'object' || !module.compliancy || !module.id) {
          return module;
        }

        // Upload each file separately
        const processedCompliancy = await Promise.all(
          module.compliancy.map(async (comp) => {
            // If bewijs is a data URL, upload it
            if (isDataUrlNeedingUpload(comp.bewijs)) {
              try {
                const filename = comp.bewijsFilename || 'evidence.pdf';

                const uploadResult = await uploadFileToObject(
                  comp.bewijs,
                  'voorzieningen',
                  'module',
                  String(module.id),
                  'bewijs',
                  filename
                );

                if (uploadResult?.id) {
                  // Keep bewijsFilename for display, replace bewijs with file ID
                  return {
                    ...comp,
                    bewijs: uploadResult.id, // Save file ID
                    bewijsFilename: filename, // Keep filename for display in review stage
                  };
                } else {
                  console.error(
                    'File upload succeeded but no ID returned for standard:',
                    comp.standaardversie
                  );
                  // Return compliancy without bewijs if no ID
                  const { ...restComp } = comp;
                  delete restComp.bewijs;
                  delete restComp.bewijsFilename;
                  return restComp;
                }
              } catch (error) {
                console.error(
                  'Failed to upload evidence for standard:',
                  comp.standaardversie,
                  error
                );
                // Return compliancy without bewijs if upload failed
                const { ...restComp } = comp;
                delete restComp.bewijs;
                delete restComp.bewijsFilename;
                return restComp;
              }
            }

            // If bewijs is not a data URL (already a file ID), keep it
            if (comp.bewijs && !isDataUrlNeedingUpload(comp.bewijs)) {
              // Keep both bewijs and bewijsFilename for display
              return {
                ...comp,
                bewijs: comp.bewijs, // Keep existing file ID
                bewijsFilename: comp.bewijsFilename, // Keep filename
              };
            }

            // No bewijs, remove bewijsFilename
            const { ...restComp } = comp;
            delete restComp.bewijsFilename;
            return restComp;
          })
        );

        return {
          ...module,
          compliancy: processedCompliancy,
        };
      })
    );

    return processedModules;
  };

  /**
   * Helper to remove bewijsFilename and bewijsAccessUrl from modules before sending to API
   * These fields are kept in local state for display, but shouldn't be sent to backend
   */
  const stripBewijsFilenamesForAPI = (modules) => {
    if (!modules || !Array.isArray(modules)) return modules;

    return modules.map((module) => {
      if (module.compliancy && Array.isArray(module.compliancy)) {
        return {
          ...module,
          compliancy: module.compliancy.map((comp) => {
            const { ...restComp } = comp;
            delete restComp.bewijsFilename;
            delete restComp.bewijsAccessUrl;
            return restComp;
          }),
        };
      }
      return module;
    });
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      let finalAanbieder = product.aanbieder;

      // ✅ For type=ontbrekend with new organization, create the organization first
      if (formType === 'ontbrekend' && aanbiederkeuze === 'nieuw') {
        try {
          const newOrganizationData = {
            naam: product.aanbiederNaam,
            type: product.aanbiederType,
            website: product.aanbiederWebsite,
            beschrijvingKort: product.aanbiederBeschrijvingKort,
            beschrijvingLang: product.aanbiederBeschrijvingLang,
            'e-mailadres': product.aanbiederEmail,
            telefoonnummer: product.aanbiederTelefoonnummer,
            kvkNummer: product.aanbiederKvkNummer,
            logo: product.aanbiederLogo,
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

      // Submit the complete product object to the voorzieningen register
      const productData = {
        ...product,
        naam: product.naam || product.productName, // Ensure naam is properly set
        aanbieder: finalAanbieder, // ✅ Always include the aanbieder
      };
      const sanitized = stripLocalIds(productData);

      // Check if logo needs to be uploaded separately
      const hasLogoDataUrl = isDataUrlNeedingUpload(sanitized.logo);

      let response;

      if (productId) {
        // === EDIT MODE ===
        // Step 1: Upload logo if it's a data URL and get the downloadUrl
        let logoDownloadUrl = null;
        if (hasLogoDataUrl) {
          const uploadResult = await uploadFileToObject(
            sanitized.logo,
            'voorzieningen',
            'product',
            String(productId),
            'logo',
            sanitized.logoFilename || 'logo.png'
          );

          // Capture the downloadUrl for separate update
          if (uploadResult && uploadResult.fileData?.downloadUrl) {
            logoDownloadUrl = uploadResult.fileData.downloadUrl;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Step 2: Upload evidence files for existing modules and get file IDs
        let modulesWithFileIds = sanitized.modules;
        if (sanitized.modules && sanitized.modules.length > 0) {
          modulesWithFileIds = await uploadCompliancyEvidence(sanitized.modules);
        }

        // Update local product state with modules including bewijsFilename for display
        setProduct((prev) => ({
          ...prev,
          modules: modulesWithFileIds,
        }));

        // Step 3: Update product with file IDs in compliancy (without bewijsFilename for API)
        const updatePayload = {
          ...sanitized,
          modules: stripBewijsFilenamesForAPI(modulesWithFileIds),
        };

        // Remove logo if it was uploaded (don't send base64)
        if (hasLogoDataUrl) {
          delete updatePayload.logo;
        }

        // Always strip UI-only fields
        delete updatePayload.logoFilename;
        delete updatePayload.logoAccessUrl;

        response = await store.object.updateObject(
          'voorzieningen',
          'product',
          String(productId),
          updatePayload
        );

        // Step 4: Update with downloadUrl if logo was uploaded
        if (logoDownloadUrl) {
          await store.object.updateObject(
            'voorzieningen',
            'product',
            String(productId),
            { logo: logoDownloadUrl }
          );
        }
      } else {
        // === CREATE MODE ===
        // Step 1: Create product without logo and without evidence files
        const createPayload = { ...sanitized };
        if (hasLogoDataUrl) {
          createPayload.logo = undefined;
        }
        delete createPayload.logoFilename;
        delete createPayload.logoAccessUrl;

        // Remove bewijs data URLs from compliancy before creation
        if (createPayload.modules) {
          createPayload.modules = createPayload.modules.map((module) => {
            if (module.compliancy) {
              return {
                ...module,
                compliancy: module.compliancy.map((comp) => {
                  const { ...restComp } = comp;
                  // Only include bewijs if it's not a data URL
                  if (comp.bewijs && !isDataUrlNeedingUpload(comp.bewijs)) {
                    return { ...restComp, bewijs: comp.bewijs };
                  }
                  delete restComp.bewijs;
                  delete restComp.bewijsFilename;
                  return restComp;
                }),
              };
            }
            return module;
          });
        }

        response = await store.object.createObject(
          'voorzieningen',
          'product',
          createPayload
        );

        // Step 2: Upload logo after creation if it's a data URL
        if (hasLogoDataUrl && response?.id) {
          const uploadResult = await uploadFileToObject(
            sanitized.logo,
            'voorzieningen',
            'product',
            String(response.id),
            'logo',
            sanitized.logoFilename || 'logo.png'
          );

          // If we got a downloadUrl, update the product with the logo URL
          if (uploadResult && uploadResult.fileData?.downloadUrl) {
            await store.object.updateObject(
              'voorzieningen',
              'product',
              String(response.id),
              { logo: uploadResult.fileData.downloadUrl }
            );
          }
        }

        // Step 3: Upload evidence files for newly created modules and update with file IDs
        if (response?.id && response?.modules && sanitized.modules) {
          // Map created modules with IDs to original modules with bewijs
          const modulesWithIds = response.modules.map((createdModule, index) => {
            const originalModule = sanitized.modules[index];
            return {
              ...originalModule,
              id: createdModule.id || createdModule,
            };
          });

          const modulesWithFileIds = await uploadCompliancyEvidence(modulesWithIds);

          // Update local product state with modules including bewijsFilename for display
          setProduct((prev) => ({
            ...prev,
            modules: modulesWithFileIds,
          }));

          // Update product with file IDs in compliancy (strip bewijsFilename for API)
          await store.object.updateObject(
            'voorzieningen',
            'product',
            String(response.id),
            {
              modules: stripBewijsFilenamesForAPI(modulesWithFileIds),
            }
          );
        }
      }

      // createObject/updateObject returns the object directly on success
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

  // Helper function to get the correct step index accounting for optional steps (util wrapper)
  const getAdjustedStepIndex = (logicalStep) =>
    utilGetAdjustedStepIndex(logicalStep, formType, product);

  // Helper function to get logical step from actual step index (util wrapper)
  const getLogicalStepFromIndex = (stepIndex) =>
    utilGetLogicalStepFromIndex(stepIndex, formType, product);

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
    if (isEditMode) return; // Do not auto-create modules when editing
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
        standaardenGemma: [], // New array for objectIds
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
    isEditMode,
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

  // Sync module name and description with product in single-app mode
  useEffect(() => {
    if (!isMultiApplicatie && !isEditMode && product.modules?.length > 0) {
      const firstModule = product.modules[0];
      if (typeof firstModule === 'object') {
        // Only update if the module name/description differs from product
        const needsNameUpdate = firstModule.naam !== (product.naam || '');
        const needsDescUpdate =
          firstModule.beschrijvingKort !== (product.beschrijvingKort || '');

        if (needsNameUpdate || needsDescUpdate) {
          setProduct((prev) => {
            const modules = [...(prev.modules || [])];
            modules[0] = {
              ...modules[0],
              naam: prev.naam || '',
              beschrijvingKort: prev.beschrijvingKort || '',
            };
            return { ...prev, modules };
          });
        }
      }
    }
  }, [
    isMultiApplicatie,
    isEditMode,
    product.naam,
    product.beschrijvingKort,
    product.modules,
  ]);

  // Navigation helpers to skip Applicatie step in single-app mode
  const getNextStepIndex = (stepIndex) =>
    utilGetNextStepIndex(stepIndex, formType, product, isMultiApplicatie);

  const getPrevStepIndex = (stepIndex) =>
    utilGetPrevStepIndex(stepIndex, formType, product, isMultiApplicatie);

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
            formType={formType}
            loading={loading || (isEditMode && prefillLoading)}
            touched={touched}
            schemas={schemas}
            isMultiApplicatie={isMultiApplicatie}
          />
        );
      case 2:
        // Aanbieder informatie step - only shown for 'ontbrekend' type
        if (shouldShowAanbiederStep(formType)) {
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
        return shouldShowVersiesStep(product) ? (
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
            sameForAll={referentieComponentenSameForAll}
            setSameForAll={setReferentieComponentenSameForAll}
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
            existingModulesLookup={existingModulesLookup}
            standaardenOptionsLoading={standaardenOptionsLoading}
            sameForAll={referentieComponentenSameForAll}
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
            modulesOptions={modulesOptions}
          />
        );
    }
  };

  const currentStepName = (currentStep) =>
    utilCurrentStepName(currentStep, formType, product, isMultiApplicatie);

  const getDisabledStatus = (currentStep) =>
    utilGetDisabledStatus(
      currentStep,
      product,
      dienstenFormState,
      isMultiApplicatie,
      formType,
      aanbiederkeuze
    );

  // Tooltip text for disabled Next button - util wrapper
  const getDisabledTooltip = (currentStep, product) =>
    utilGetDisabledTooltip(
      currentStep,
      product,
      dienstenFormState,
      isMultiApplicatie,
      formType,
      aanbiederkeuze
    );

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <div>
                <Heading1>
                  {isEditMode ? 'Product updaten' : utilGetPageTitle(formType)}
                </Heading1>
                <Paragraph>
                  {isEditMode
                    ? 'Werk uw productgegevens bij in onze catalogus.'
                    : utilGetPageDescription(formType)}
                </Paragraph>
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
                                  shouldShowAanbiederStep(formType) ? 2 : 1
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
                                ...(shouldShowAanbiederStep(formType)
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
                                shouldShowAanbiederStep(formType) ? 3 : 2
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
                                ...((
                                  product?.cloudDienstverleningsmodel || ''
                                ).includes('On-premises (self-managed)')
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
                            disabled={loading || prefillLoading || !!prefillError}
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
                                prefillLoading ||
                                !!prefillError ||
                                getDisabledStatus(currentStep) ||
                                loading ||
                                (getLogicalStepFromIndex(currentStep) === 7 &&
                                  standaardenLoading)
                              }
                              onClick={() => {
                                focusForm();
                                // In single-app mode, ensure a module exists before jumping to Licentie
                                if (!isEditMode) {
                                  ensureSingleModuleInitialized();
                                }
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
                            icon={
                              isEditMode ? (
                                <VISUALS.SAVE />
                              ) : (
                                <VISUALS.CLIPBOARD_CHECK />
                              )
                            }
                            onClick={handleRegister}
                            loading={loading}
                            disabled={loading}
                          >
                            {isEditMode ? 'Product updaten' : 'Product aanmelden'}
                          </AcButton>
                        )}
                      </div>

                      {/* Info boxes now handled within individual stage components via ConExistingModulesInfoBox */}
                      {/* Exception: Standaarden stage still uses the old renderExistingAppsInfoBox */}
                      {currentStep === 7 && renderExistingAppsInfoBox('standaarden')}
                      {/* Prefill error UI */}
                      {prefillError && (
                        <div style={{ marginTop: '1rem' }}>
                          <Alert type='error'>
                            <Paragraph>{prefillError}</Paragraph>
                          </Alert>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              marginTop: '0.5rem',
                            }}
                          >
                            <AcButton
                              style='button'
                              icon={<VISUALS.ARROW_RIGHT />}
                              onClick={() => {
                                // Retry prefill by re-running effect
                                setPrefillError(null);
                                setPrefillRetry((n) => n + 1);
                              }}
                            >
                              Opnieuw proberen
                            </AcButton>
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={<VISUALS.CUBES />}
                              onClick={() => {
                                // Explicitly start a new product instead of editing
                                onClearProductId?.();
                                setCurrentStep(getAdjustedStepIndex(0));
                              }}
                            >
                              Nieuw product starten
                            </AcButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </AcColumn>
              </div>
            </>
          )}

          {/* Success Feedback Page */}
          {registerCallBack === 'success' && (
            <div>
              <Heading1>
                {isEditMode
                  ? '🎉 Product succesvol geüpdatet!'
                  : '🎉 Product succesvol aangemeld!'}
              </Heading1>

              <Alert type='ok'>
                <Paragraph>
                  <strong>
                    {isEditMode
                      ? 'Uw product is succesvol bijgewerkt!'
                      : 'Uw product is succesvol geregistreerd!'}
                  </strong>
                </Paragraph>
                <Paragraph>
                  Het product {product.naam || 'Onbekend product'} en alle
                  bijbehorende modules, standaarden, koppelingen en diensten zijn
                  opgeslagen in de softwarecatalogus.
                </Paragraph>
              </Alert>

              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <UnorderedList>
                  <UnorderedListItem>
                    Het product wordt zichtbaar in de softwarecatalogus
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
                  onClick={() => navigate('/beheer')}
                >
                  Terug naar beheer dashboard
                </AcButton>

                <AcButton
                  style='button'
                  variant='secondary'
                  icon={<VISUALS.CUBES />}
                  onClick={() => {
                    // Navigate to a clean product form without any query parameters
                    navigate(window.location.pathname, { replace: true });
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

const AcFormsProduct = ({ userStore, store }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const formType = searchParams.get('type') || '';
  const productId = searchParams.get('id') || '';

  const handleClearProductId = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('id');
    setSearchParams(next);
    // Hard reset form UI to initial state
    // Keep current route, only drop id
  }, [searchParams, setSearchParams]);

  if (!formType) {
    return <ConFormProductTypeSelectStage />;
  }

  return (
    <AcFormsProductInner
      userStore={userStore}
      store={store}
      formType={formType}
      productId={productId}
      onClearProductId={handleClearProductId}
    />
  );
};

export default withStore(observer(AcFormsProduct));
