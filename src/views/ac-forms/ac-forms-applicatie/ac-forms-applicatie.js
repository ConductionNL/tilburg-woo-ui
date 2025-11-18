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
import {
  validateWebsite,
  validateEmail,
  validatePhone,
} from '@views/ac-forms/validation/form-validations';
import _ from 'lodash';

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

const AcFormsApplicatieInner = ({ userStore, store, formType, applicatieId }) => {
  //   TODO: Remove info log when userStore is fully implemented
  console.info('userStore', userStore);

  // Determine edit mode from applicatieId
  const isEditMode = !!applicatieId;
  const navigate = useNavigate();

  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);

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
    aanbieder: null,
    cloudDienstverleningsmodel: '',
    licentietype: '',
    licentieType: '',
    licentie: '',
    hostingLocatie: '',
    hostingJurisdictie: '',
    referentieComponenten: [],
    koppelingen: [],
    diensten: [],
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
    if (!processStepsRef.current) return;

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
  }, [currentStep, handleStepNavigation, generateStepIndexMapping]);

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

      if (applicatieId) {
        // Edit mode: update existing applicatie via PUT
        await store.object.updateObject(
          'voorzieningen',
          'module',
          String(applicatieId),
          applicatieData
        );
      } else {
        // Create mode: create new applicatie via POST
        await store.object.createObject('voorzieningen', 'module', applicatieData);
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
            referentieComponentenOptions={referentieComponentenOptions}
            referentieComponentenWithStandards={referentieComponentenWithStandards}
            standaardenOptions={standaardenOptions}
            modulesOptions={modulesOptions}
            dienstOptions={dienstOptions}
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
        return 'Licentie';
      case 3:
        return 'Versies';
      case 4:
        return 'Koppel uw applicatie aan de GEMMA';
      case 5:
        return 'Standaarden';
      case 6:
        return 'Koppelingen';
      case 7:
        return 'Diensten';
      case 8:
        return 'Controleren';
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
        return 'Vul dit formulier in om uw applicatie te registreren in de softwarecatalogus.';
      case 'ontbrekend-applicatie':
        return 'Meld een applicatie die nog niet in de catalogus staat en registreer deze.';
      default:
        return 'Registreer een nieuwe applicatie in de softwarecatalogus.';
    }
  };

  const { icon: Icon, schema } = getActiveWizard();

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
                  {_.capitalize(schema)}
                  {isEditMode
                    ? ' updaten'
                    : formType === 'ontbrekend-applicatie'
                    ? ' melden'
                    : ' registreren'}
                </Heading1>
                <Paragraph>
                  {isEditMode
                    ? 'Werk uw applicatiegegevens bij in onze catalogus.'
                    : getPageDescription(formType)}
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
                  <div className='ac-register-container ac-forms-applicatie'>
                    <div ref={processStepsRef} className='ac-register-process-steps'>
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
                                : getStatus(currentStep, getAdjustedStepIndex(1)),
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
                            status: getStatus(currentStep, getAdjustedStepIndex(8)),
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
                            disabled={loading}
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
                            disabled={getDisabledStatus(currentStep) || loading}
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
                            disabled={loading}
                          >
                            {isEditMode
                              ? 'Applicatie updaten'
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
      onClearApplicatieId={handleClearApplicatieId}
    />
  );
};

export default withStore(observer(AcFormsApplicatie));
