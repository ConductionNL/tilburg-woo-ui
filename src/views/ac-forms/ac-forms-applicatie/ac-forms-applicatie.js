import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { commongroundApiUrl } from '@config';

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
import ConFormApplicatieControlerenStage from './components/con-form-applicatie-controleren-stage';
import ConFormApplicatieOrganisatieStage from './components/con-form-applicatie-organisatie-stage';

// Utils
import { getStatusMultiStep } from './utils/steps.utils';

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
  const [showOrganisatieForm, setShowOrganisatieForm] = useState(false);

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
  });

  /**
   * Organisatie State Object
   *
   * This object holds organization data that will be created before the applicatie.
   * Only used when user clicks "Ik kan de gewenste leverancier niet vinden" button.
   */
  const [organisatie, setOrganisatie] = useState({
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
   *                5=Standaarden, 6=Koppelingen, 7=Controleren
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

    // Main step 3: Controleren
    mapping.push(getAdjustedStepIndex(7));

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
    setApplicatie((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const setOrganisatieData = useCallback((key, value) => {
    setOrganisatie((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Check if organization data has been filled in
   * @returns {boolean} True if organization has any data
   */
  const hasOrganisatieData = useCallback(() => {
    if (!organisatie.naam || !organisatie.type || !organisatie.website) {
      return false;
    }
    return true;
  }, [organisatie]);

  // Fetch schema definitions on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setSchemasLoading(true);
      const schemaTypes = ['module', 'product', 'moduleversie', 'organisatie'];
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

      // If organization data exists, create the organization first
      if (hasOrganisatieData()) {
        try {
          const newOrganizationData = {
            naam: organisatie.naam,
            type: organisatie.type,
            website: organisatie.website,
            beschrijvingKort: organisatie.beschrijvingKort,
            beschrijvingLang: organisatie.beschrijvingLang,
            'e-mailadres': organisatie['e-mailadres'],
            telefoonnummer: organisatie.telefoonnummer,
            kvkNummer: organisatie.kvkNummer,
            logo: organisatie.logo,
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
    // If organization form is showing, render it instead of the normal step
    if (showOrganisatieForm) {
      return (
        <ConFormApplicatieOrganisatieStage
          organisatie={organisatie}
          setOrganisatieData={setOrganisatieData}
          loading={loading}
          schemas={schemas}
        />
      );
    }

    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    switch (logicalStep) {
      case 0:
        // Aanbieder - only for ontbrekend-applicatie
        return (
          <div>
            <Heading1>Aanbieder</Heading1>
          </div>
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
        return <div>Standaarden</div>;
      case 6:
        return <div>Koppelingen</div>;
      case 7:
        return <ConFormApplicatieControlerenStage applicatie={applicatie} />;
      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    // If organization form is showing, return its title
    if (showOrganisatieForm) {
      return 'Nieuwe organisatie aanmaken';
    }

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
        return 'Controleren';
      default:
        return '';
    }
  };

  const getDisabledStatus = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    if (logicalStep === 1) {
      // Applicatie informatie: naam is required
      return !applicatie.naam || applicatie.naam.trim() === '';
    }
    return false;
  };

  const getDisabledTooltip = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);

    if (logicalStep === 1) {
      if (!applicatie.naam || applicatie.naam.trim() === '') {
        return 'Vul de naam van de applicatie in';
      }
    }
    return '';
  };

  /**
   * Check if current step is the Versies step (logical step 3)
   * @param {number} step - The physical step number
   * @returns {boolean} True if current step is the Versies step
   */
  const isVersieStep = (step) => {
    // Convert physical step to logical step using helper function
    const logicalStep = getLogicalStepFromPhysical(step);
    return logicalStep === 3;
  };

  const getPageTitle = (formType) => {
    switch (formType) {
      case 'eigen':
        return 'Uw applicatie registreren';
      case 'ontbrekend-applicatie':
        return 'Applicatie melden en registreren';
      default:
        return 'Applicatie aanmelden';
    }
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

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <div>
                <Heading1>
                  {isEditMode ? 'Applicatie updaten' : getPageTitle(formType)}
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
                              getAdjustedStepIndex(7)
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
                            ],
                          },
                          {
                            id: 'applicatie-controleren-step',
                            marker: 3,
                            status: getStatus(currentStep, getAdjustedStepIndex(7)),
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
                              if (showOrganisatieForm) {
                                // Close organization form and return to versie step
                                setShowOrganisatieForm(false);
                              } else {
                                setCurrentStep(currentStep - 1);
                              }
                            }}
                            disabled={loading}
                          >
                            Vorige
                          </AcButton>
                        )}
                        {getLogicalStepFromPhysical(currentStep) !== 7 && (
                          <div className='ac-register-button-wrapper'>
                            {isVersieStep(currentStep) && !showOrganisatieForm && (
                              <AcButton
                                style='button'
                                buttonType='secondary'
                                className='con-forms-applicatie--leverancier-not-found'
                                icon={<VISUALS.ARROW_RIGHT />}
                                onClick={() => {
                                  // Toggle organization form visibility
                                  setShowOrganisatieForm((prev) => !prev);
                                }}
                                disabled={loading}
                              >
                                Ik kan de gewenste leverancier niet vinden
                              </AcButton>
                            )}
                            <AcButton
                              style='button'
                              className={clsx(
                                currentStep === 0 && 'ac-register-form-next-button'
                              )}
                              icon={<VISUALS.ARROW_RIGHT />}
                              disabled={getDisabledStatus(currentStep) || loading}
                              onClick={() => {
                                if (showOrganisatieForm) {
                                  // Close organization form and return to versie step
                                  setShowOrganisatieForm(false);
                                } else {
                                  focusForm();
                                  setCurrentStep(currentStep + 1);
                                }
                              }}
                              title={
                                getDisabledStatus(currentStep)
                                  ? getDisabledTooltip(currentStep)
                                  : ''
                              }
                            >
                              Volgende
                            </AcButton>
                          </div>
                        )}

                        {getLogicalStepFromPhysical(currentStep) === 7 && (
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
