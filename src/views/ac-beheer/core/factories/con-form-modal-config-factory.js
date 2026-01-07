import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field.js';
import { smartSplit } from '@src/utilities';
import licenses from '@assets/licenses/licenses.json';
import BeheerPageConfigFactory from './con-beheer-page-config-factory';

/**
 * Form Modal Configuration Factory
 * This factory creates configuration objects for different form modal types
 *
 * Key Features:
 * - Integrates with BeheerPageConfigFactory to reuse registerSlug and schemaSlug
 * - Automatically constructs API endpoints from beheer config
 * - Uses API schema field names directly (no field mappings needed)
 * - Provides form-specific configurations (options, validation, visibility)
 * - Supports dynamic field behaviors and custom components
 * - Automatically generates initial data from API schema properties
 *
 * Initial Data Strategy:
 * - Schema properties are automatically used to generate initial form data
 * - Default values from schema are respected
 * - Type-appropriate defaults are generated (string='', number=0, boolean=false, etc.)
 * - Only specify initialData overrides for custom business logic requirements
 * - This ensures forms stay in sync with API schema changes automatically
 *
 * Simplified Field Handling:
 * - Uses API schema field names directly (e.g., 'naam', 'beschrijving')
 * - No field mappings needed - eliminates complexity and maintenance
 * - Form data, validation, and submission all use consistent field names
 * - ConDynamicSchemaForm automatically handles Dutch field labels
 *
 * Enum Filtering & Options Priority:
 *
 * Priority Order:
 * 1. Schema enum is ALWAYS used if it exists (highest priority)
 * 2. enumFilter can be used to filter the schema enum
 * 3. Custom optionsProviders only apply when NO schema enum exists
 *
 * Enum Filter Modes (only work when schema has enum):
 *
 * 1. Include Mode (Static) - Only show specific enum values:
 *    optionsProviders: {
 *      status: { enumFilter: 'include', values: ['active', 'pending'] }
 *    }
 *    // If schema has enum: ['active', 'pending', 'inactive', 'archived']
 *    // Result will be: ['active', 'pending']
 *
 * 2. Include Mode (Dynamic) - Filter based on context (e.g., user organization):
 *    optionsProviders: {
 *      rollen: {
 *        enumFilter: 'include',
 *        values: (formData, context) => {
 *          if (context?.user?.activeOrganization?.type === 'Leverancier') {
 *            return ['aanbod-beheerder'];
 *          }
 *          return ['aanbod-beheerder', 'gebruik-beheerder', ...];
 *        }
 *      }
 *    }
 *
 * 3. Exclude Mode - Hide specific enum values:
 *    optionsProviders: {
 *      status: { enumFilter: 'exclude', values: ['deprecated', 'legacy'] }
 *    }
 *    // If schema has enum: ['active', 'deprecated', 'legacy', 'inactive']
 *    // Result will be: ['active', 'inactive']
 *
 * 4. Custom Options (only when NO enum in schema):
 *    optionsProviders: {
 *      customField: () => [
 *        { value: 'optie1', label: 'Optie 1' },
 *        { value: 'optie2', label: 'Optie 2' }
 *      ]
 *    }
 */
const FormModalConfigFactory = {
  /**
   * Creates configuration for a specific form modal type
   * @param {string} type - The form modal type
   * @returns {Object} Configuration object
   */
  createConfig: (type) => {
    // Get the beheer page config for this type to reuse registerSlug and schemaSlug
    const beheerConfig = BeheerPageConfigFactory.createConfig(type);

    const baseConfig = {
      // Beheer page configuration (for API endpoint construction)
      beheerConfig,

      // Schema configuration - use the same schema as the beheer page
      schemaType: beheerConfig.schemaSlug,

      // Form data configuration
      initialData: {},

      // Options providers configuration
      optionsProviders: {},

      // Field configurations (visibility, disabled states, etc.)
      fieldConfigs: {},

      // Custom field components
      customComponents: {},

      // Loading states configuration
      loadingStates: {},

      // Data transformation before submit
      transformSubmitData: (data) => data,

      // Additional effects to run when form data changes
      additionalEffects: [],

      // Custom validation logic
      customValidation: null,

      // Custom name for the form modal (gets applied as `${title} toevoegen` or `${title} bewerken`)
      title: null,
    };

    switch (type) {
      case 'module':
      case 'applicaties':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          // Only specify custom defaults or overrides here
          initialData: {
            logoFilename: '', // Add logoFilename as UI-only field for file tracking
          },
          optionsProviders: {
            voorzieningstype: () => [
              { value: 'Toepassing', label: 'Toepassing' },
              { value: 'Platform', label: 'Platform' },
              { value: 'GeneriekComponent', label: 'GeneriekComponent' },
              { value: 'Service', label: 'Service' },
              { value: 'Anders', label: 'Anders' },
            ],
            cloudDienstverleningsmodel: () => [
              { value: 'SaaS', label: 'SaaS' },
              { value: 'PaaS', label: 'PaaS' },
              { value: 'IaaS', label: 'IaaS' },
              { value: 'Anders', label: 'Anders' },
            ],
            licentie: () =>
              licenses.map((license) => ({
                label: license.name,
                value: license['SPDX ID'],
              })),
            referentieComponenten: {
              type: 'collection',
              register: 'vng-gemma',
              schema: 'element',
              params: { 'properties.value': 'Referentiecomponent', _limit: 1000 },
              labelField: 'name',
              valueField: 'identifier',
            },
            standaarden: {
              type: 'dynamic',
              dependsOn: 'referentieComponenten',
            },
            contact: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'contactpersoon',
              labelField: (item) => {
                const nameParts = [
                  item.voornaam,
                  item.tussenvoegsel,
                  item.achternaam,
                ].filter(Boolean);
                return nameParts.join(' ');
              },
              valueField: 'username',
            },
            organisatie: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'organisatie',
              labelField: (item) => item.naam || item.id,
              valueField: 'id',
            },
            diensten: () =>
              [
                'Functioneel beheer',
                'Applicatie beheer',
                'Technisch beheer',
                'Implementatieondersteuning',
                'Opleidingen',
                'Reseller',
              ].map((service) => ({ value: service, label: service })),
          },
          fieldConfigs: {
            type: { visible: false }, // Hide the type field in applicaties modal
            logoFilename: { visible: false }, // Hide UI-only field from form
            logoAccessUrl: { visible: false }, // Hide UI-only field from form
            licentietype: {
              // Ensure no default value is set for licentietype
              defaultValue: '',
            },
            licentie: {
              visible: (formData) => {
                const licentietype = String(
                  formData.licentietype || ''
                ).toLowerCase();
                return licentietype === 'open source';
              },
            },
          },
          customComponents: {
            logo: LogoUploadField,
          },
          // Transform data before submission - remove licentie if not Open Source
          transformSubmitData: (data) => {
            const licentietype = String(data.licentietype || '').toLowerCase();
            if (licentietype !== 'open source' && data.licentie) {
              // Remove licentie field if not Open Source
              const { ...rest } = data;
              return rest;
            }
            return data;
          },
          additionalEffects: [
            {
              dependencies: ['referentieComponenten'],
              effect: async (
                formData,
                { objectStore, setOptionsLoading, setOptions }
              ) => {
                if (!formData?.referentieComponenten?.length) {
                  setOptions('standaarden', []);
                  setOptionsLoading('standaarden', false);
                  return;
                }

                setOptionsLoading('standaarden', true);

                try {
                  // Build params for voorzieningen query
                  const voorzieningParams = {};
                  formData.referentieComponenten.forEach((component) => {
                    if (!voorzieningParams.referentieComponenten) {
                      voorzieningParams.referentieComponenten = [];
                    }
                    voorzieningParams.referentieComponenten.push(component);
                  });

                  // Get voorzieningen with selected reference components using object store
                  await objectStore.fetchCollection(
                    'voorzieningen',
                    'voorziening',
                    { ...voorzieningParams, _published: 'false' }
                  );

                  const voorzieningType = objectStore.getTypeFromParams(
                    'voorzieningen',
                    'voorziening'
                  );
                  const voorzieningCollection =
                    objectStore.getCollection(voorzieningType);
                  const voorzieningData = voorzieningCollection.results || [];

                  // Flatten the voorziening standaarden array
                  const voorzieningStandaarden = [
                    ...new Set(
                      voorzieningData.flatMap(
                        (voorziening) => voorziening.standaarden
                      )
                    ),
                  ];

                  if (voorzieningStandaarden.length === 0) {
                    setOptions('standaarden', []);
                    return;
                  }

                  // Build params for standaarden query
                  const standaardenParams = {
                    id: voorzieningStandaarden,
                  };

                  // Get the standaarden using object store
                  await objectStore.fetchCollection(
                    'voorzieningen',
                    'standaard',
                    { ...standaardenParams, _published: 'false' }
                  );

                  const standaardenType = objectStore.getTypeFromParams(
                    'voorzieningen',
                    'standaard'
                  );
                  const standaardenCollection =
                    objectStore.getCollection(standaardenType);
                  const standaardenData = standaardenCollection.results || [];

                  // Set the standaarden options
                  setOptions(
                    'standaarden',
                    standaardenData.map((standaard) => ({
                      value: standaard.id,
                      label: standaard.naam,
                    }))
                  );
                } catch (error) {
                  console.error('Error fetching standaarden:', error);
                  setOptions('standaarden', []);
                } finally {
                  setOptionsLoading('standaarden', false);
                }
              },
            },
          ],
        };

      case 'moduleversion':
      case 'moduleversie':
      case 'applicatieversie':
      case 'applicatiesversie':
        return {
          ...baseConfig,
          title: 'Applicatie versie', // Override the title to show "Applicatie versie"
          /**
           * Initialize module field from relation data when editing
           * Similar to how contactpersoon sets organisatie - we override the module field
           * to use the value from @self.relations.module instead of the top-level module field
           */
          initialData: ({ data } = {}) => {
            // Store both module for form and originalModule for submission
            const moduleFromRelation = data?.['@self']?.relations?.module;
            return {
              ...(moduleFromRelation && { module: moduleFromRelation }),
              ...(moduleFromRelation && { _originalModule: moduleFromRelation }),
            };
          },
          optionsProviders: {
            module: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'voorziening',
              labelField: 'naam',
              valueField: 'id',
            },
          },
          fieldConfigs: {
            module: {
              label: 'Applicatie',
              placeholder: 'Selecteer applicatie',
              disabled: true,
              visible: false,
            },
            _originalModule: {
              visible: false, // Hidden field for internal use
            },
            gebruiken: {
              visible: false,
            },
            // Hide description fields - they are edited inline via action menu
            beschrijvingKort: {
              visible: false,
            },
            beschrijvingLang: {
              visible: false,
            },
            // Show date fields conditionally based on selected status
            datumInOntwikkeling: {
              visible: (formData) => {
                const status = String(formData.status || '').toLowerCase();
                return status === 'in ontwikkeling' || status === 'ontwikkeling';
              },
            },
            datumInGebruik: {
              visible: (formData) => {
                const status = String(formData.status || '').toLowerCase();
                return status === 'actief' || status === 'in gebruik';
              },
            },
            datumTeruggetrokken: {
              visible: (formData) => {
                const status = String(formData.status || '').toLowerCase();
                return status === 'teruggetrokken';
              },
            },
            datumEindeOndersteuning: {
              visible: (formData) => {
                const status = String(formData.status || '').toLowerCase();
                return status === 'einde ondersteuning';
              },
            },
          },
          // Transform data before submission - ensure module is always from relation
          transformSubmitData: (data) => {
            const submitData = { ...data };

            // If we have the original module from relation, use it
            if (data._originalModule) {
              submitData.module = data._originalModule;
              // Remove the temporary field
              delete submitData._originalModule;
            }

            return submitData;
          },
        };

      case 'diensten':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          initialData: {},
          optionsProviders: {
            voorziening: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'voorziening',
              labelField: 'naam',
              valueField: 'id',
            },
            leverancier: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'organisatie',
              labelField: (item) => item.naam ?? item.organisatienaam ?? item.id,
              valueField: 'id',
            },
            ondersteuningsopties: () => [
              { label: 'Functioneel beheer', value: 'Functioneel beheer' },
              { label: 'Applicatiebeheer', value: 'Applicatiebeheer' },
              { label: 'Technisch beheer', value: 'Technisch beheer' },
              {
                label: 'Implementatieondersteuning',
                value: 'Implementatieondersteuning',
              },
              { label: 'Opleidingen', value: 'Opleidingen' },
              { label: 'Licentiereseller', value: 'Licentiereseller' },
            ],
            licentie: () =>
              licenses.map((license) => ({
                label: license.name,
                value: license['SPDX ID'],
              })),
            contact: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'contactpersoon',
              labelField: (item) => {
                const nameParts = [
                  item.voornaam,
                  item.tussenvoegsel,
                  item.achternaam,
                ].filter(Boolean);
                return nameParts.join(' ');
              },
              valueField: 'username',
            },
          },
          fieldConfigs: {
            // Hide fields that are not in the current form
            id: { visible: false },
            naam: { visible: false },
            status: { visible: false },
            laag: { visible: false },
            verklaringen: { visible: false },
            hosting: { visible: false },
            versies: { visible: false },
            omvat: { visible: false },
          },
          transformSubmitData: (data) => ({
            ...data,
            ondersteuningsopties: smartSplit(data.ondersteuningsopties),
            certificeringen: smartSplit(data.certificeringen),
            ondersteundeStandaarden: smartSplit(data.ondersteundeStandaarden),
          }),
        };

      case 'organisaties':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          initialData: {
            logoFilename: '', // Add logoFilename as UI-only field for file tracking
          },
          optionsProviders: {
            samenwerkingen: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'organisatie',
              filter: (item, formData) =>
                item?.type?.toLowerCase() === 'samenwerking' &&
                item.id !== formData?.id,
              labelField: 'naam',
              valueField: 'id',
            },
          },
          fieldConfigs: {
            // Only hide the fields we don't want to show
            id: { visible: false },
            logoFilename: { visible: false }, // Hide UI-only field from form
            logoAccessUrl: { visible: false }, // Hide UI-only field from form,
            beschrijvingKort: { visible: false },
            beschrijvingLang: { visible: false },
            type: { visible: (formData, isEdit) => !isEdit }, // Only show type field when adding new organisation
            links: { visible: false },
            oin: { visible: false },
            rol: { visible: false },
            cbsCode: {
              visible: (formData) => formData.type?.toLowerCase() === 'gemeente',
            },
            samenwerkingen: { visible: false },
            deelnames: { visible: false },
            deelnemers: { visible: false },
            kvkNummer: {
              visible: false,
            },
            contactpersonen: { visible: false },
            verklaringen: { visible: false },
          },
          customComponents: {
            logo: LogoUploadField,
          },
          transformSubmitData: (data) => ({
            ...data,
            contactgegevens: smartSplit(data.contactgegevens),
          }),
        };

      case 'contactpersonen':
      case 'contactpersoon':
        return {
          ...baseConfig,
          // Most initial data is automatically generated from schema properties
          // Only specify custom defaults or overrides here
          /**
           * Compute initial defaults for contactpersoon
           * - Prefill organisatie from active organisation when creating (not editing) and when not pre-selected
           */
          title: 'Gebruiker',
          initialData: ({ user, isEdit, preSelected } = {}) => {
            const activeOrg = user?.activeOrganization || null;
            const orgId = String(activeOrg?.uuid);

            return {
              voorkeuren: { taal: 'NL-nl', thema: 'licht' },
              // Do not override when editing or when a preSelected organisatie exists
              ...(orgId &&
                !(isEdit || !!preSelected?.organisatie) && {
                  organisatie: orgId,
                }),
            };
          },
          optionsProviders: {
            // Use enumFilter to dynamically filter rollen based on organization type
            // If org type is 'Leverancier', only show 'aanbod-beheerder'
            rollen: {
              enumFilter: 'include',
              values: (formData, context) => {
                const orgType = context?.user?.activeOrganization?.type;

                // If organization type is 'Leverancier', only allow 'Aanbod-beheerder'
                if (orgType === 'Leverancier') {
                  return ['Aanbod-beheerder'];
                }

                // Otherwise, return null to show all enum values from schema
                return null;
              },
            },
          },
          fieldConfigs: {
            // Hide fields that are not in the current form
            id: { visible: false },
            laatsteInlogdatum: { visible: false },
            aanmaakdatum: { visible: false },
            wijzigingsdatum: { visible: false },
            voorkeuren: { visible: false },
            notificaties: { visible: false },
            // Disable organisatie field since you can only edit for your own organisation anyway
            organisatie: { visible: false },
            // Make telefoonnummer required when aanspreekPunt is true
            telefoonnummer: {
              visible: true,
              required: (formData) => formData.aanspreekPunt,
            },
          },
        };

      case 'gebruiken':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          initialData: {},
          optionsProviders: {
            organisatieId: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'organisatie',
              labelField: (item) => item.naam ?? item.id,
              valueField: 'id',
            },
            voorzieningId: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'voorziening',
              labelField: 'naam',
              valueField: 'id',
            },
            versieId: {
              type: 'dynamic',
              dependsOn: 'voorzieningId',
            },
            hosting: () => [
              { label: 'On-premises', value: 'on-premises' },
              { label: 'SaaS', value: 'SaaS' },
              { label: 'PaaS', value: 'PaaS' },
              { label: 'hybride', value: 'hybride' },
            ],
            contact: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'contactpersoon',
              labelField: (item) => {
                const nameParts = [
                  item.voornaam,
                  item.tussenvoegsel,
                  item.achternaam,
                ].filter(Boolean);
                return nameParts.join(' ');
              },
              valueField: 'username',
            },
            'bivClassificatie.beschikbaarheid': () => [
              { label: 'Laag', value: 'Laag' },
              { label: 'Midden', value: 'Midden' },
              { label: 'Hoog', value: 'Hoog' },
            ],
            'bivClassificatie.integriteit': () => [
              { label: 'Laag', value: 'Laag' },
              { label: 'Midden', value: 'Midden' },
              { label: 'Hoog', value: 'Hoog' },
            ],
            'bivClassificatie.vertrouwelijkheid': () => [
              { label: 'Laag', value: 'Laag' },
              { label: 'Midden', value: 'Midden' },
              { label: 'Hoog', value: 'Hoog' },
            ],
          },
          fieldConfigs: {
            // Hide fields that are not in the current form
            id: { visible: false },
            deelneming: { visible: false },
            startDatumActief: { visible: false },
            startDatumGepland: { visible: false },
            startDatumBeëindigd: { visible: false },
            interneAantekening: { visible: false },
            // Disable versieId field if no voorzieningId is selected
            versieId: {
              visible: true,
              disabled: (formData) => !formData.voorzieningId,
            },
          },
          additionalEffects: [
            {
              dependencies: ['voorzieningId'],
              effect: async (
                formData,
                { objectStore, setOptionsLoading, setOptions }
              ) => {
                if (!formData.voorzieningId) {
                  setOptions('versieId', []);
                  return;
                }

                setOptionsLoading('versieId', true);

                try {
                  // Get voorzieningaanbod for the selected voorziening using object store
                  const aanbodParams = {
                    voorziening: formData.voorzieningId,
                  };

                  await objectStore.fetchCollection(
                    'voorzieningen',
                    'voorzieningaanbod',
                    { ...aanbodParams, _published: 'false' }
                  );

                  const aanbodType = objectStore.getTypeFromParams(
                    'voorzieningen',
                    'voorzieningaanbod'
                  );
                  const aanbodCollection = objectStore.getCollection(aanbodType);
                  const aanbodData = aanbodCollection.results || [];
                  const aanbodIds = aanbodData.map((item) => item.id);

                  if (!aanbodIds.length) {
                    setOptions('versieId', []);
                    return;
                  }

                  // Get voorzieningversie for the aanbod IDs using object store
                  const versieParams = {
                    'voorzieningaanbod[]': aanbodIds,
                  };

                  await objectStore.fetchCollection(
                    'voorzieningen',
                    'voorzieningversie',
                    { ...versieParams, _published: 'false' }
                  );

                  const versieType = objectStore.getTypeFromParams(
                    'voorzieningen',
                    'voorzieningversie'
                  );
                  const versieCollection = objectStore.getCollection(versieType);
                  const versies = versieCollection.results || [];

                  setOptions(
                    'versieId',
                    versies.map((item) => ({
                      label: item.versienummer,
                      value: item.id,
                    }))
                  );
                } catch (error) {
                  console.error('Error fetching versies:', error);
                  setOptions('versieId', []);
                } finally {
                  setOptionsLoading('versieId', false);
                }
              },
            },
          ],
          transformSubmitData: (data) => ({
            ...data,
            ...(data.status &&
              data.status !== data.originalStatus && {
                [`startDatum${data.status}`]: new Date().toISOString(),
              }),
          }),
        };

      case 'overeenkomsten':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          initialData: {},
          optionsProviders: {
            contractType: () =>
              [
                { id: 'SLA', label: 'SLA' },
                { id: 'Licentie', label: 'Licentie' },
                { id: 'Onderhoud', label: 'Onderhoud' },
              ].map((type) => ({ value: type.id, label: type.label })),
            kostenPeriode: () =>
              [
                { id: 'Maandelijks', label: 'Maandelijks' },
                { id: 'Jaarlijks', label: 'Jaarlijks' },
                { id: 'Eenmalig', label: 'Eenmalig' },
              ].map((periode) => ({ value: periode.id, label: periode.label })),
            status: () =>
              [
                { id: 'Actief', label: 'Actief' },
                { id: 'Verlopen', label: 'Verlopen' },
                { id: 'Inonderhandeling', label: 'Inonderhandeling' },
              ].map((status) => ({ value: status.id, label: status.label })),
          },
          fieldConfigs: {
            // Hide fields that are not in the current form
            id: { visible: false },
          },
          transformSubmitData: (data) => ({
            voorzieningAanbod: data.voorzieningAanbod,
            voorzieningGebruik: data.voorzieningGebruik,
            startDatum: data.startDatum,
            eindDatum: data.eindDatum,
            contractNummer: data.contractNummer,
            contractType: data.contractType,
            kosten: data.kosten,
            kostenPeriode: data.kostenPeriode,
            contactPersoonAanbieder: {
              id: data.contactpersoonAanbieder.id,
              naam: data.contactpersoonAanbieder.naam,
              email: data.contactpersoonAanbieder.email,
            },
            contactPersoonGebruiker: {
              id: data.contactpersoonGebruiker.id,
              naam: data.contactpersoonGebruiker.naam,
              email: data.contactpersoonGebruiker.email,
            },
            documentReferentie: data.documentReferentie,
            status: data.status,
            opmerkingen: data.opmerkingen,
          }),
        };

      case 'voorzieningen-versie':
        return {
          ...baseConfig,
          // Initial data generated from schema; preSelected.voorziening can be provided
          initialData: {},
          optionsProviders: {},
          fieldConfigs: {
            id: { visible: false },
          },
          transformSubmitData: (data) => ({ ...data }),
        };

      case 'kwetsbaarheden':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          initialData: {},
          optionsProviders: {
            ernst: () => [
              { label: 'Laag', value: 'laag' },
              { label: 'Gemiddeld', value: 'gemiddeld' },
              { label: 'Hoog', value: 'hoog' },
              { label: 'Kritiek', value: 'kritiek' },
            ],
            // Example: Filter enum to only show specific values
            // If schema has enum: ['status1', 'status2', 'status3', 'status4']
            // This would show only: ['status1', 'status2']
            // status: { enumFilter: 'include', values: ['status1', 'status2'] },

            // Example: Filter enum to exclude specific values
            // If schema has enum: ['option1', 'option2', 'option3']
            // This would show: ['option1', 'option3'] (excluding 'option2')
            // someField: { enumFilter: 'exclude', values: ['option2'] },
          },
          fieldConfigs: {
            // Hide fields that are not in the current form
            id: { visible: false },
          },
          transformSubmitData: (data) => ({
            ...data,
            referenties: smartSplit(data.referenties),
          }),
        };

      default:
        // Generic fallback configuration for dynamic types
        // This will generate a form based purely on the schema
        try {
          // Get the beheer page config for this type to reuse registerSlug and schemaSlug
          const beheerConfig = BeheerPageConfigFactory.createConfig(type);

          return {
            // Beheer page configuration (for API endpoint construction)
            beheerConfig,

            // Form configuration
            title: type.charAt(0).toUpperCase() + type.slice(1),
            fields: [], // Will be populated dynamically from schema
            fieldVisibility: {}, // All fields visible by default
            initialData: {}, // No custom initial data
            optionsProviders: {}, // No custom options providers
            fieldConfigs: {}, // No custom field configs
            customComponents: {}, // No custom components
            transformSubmitData: (data) => data, // No transformation by default
            additionalEffects: [], // No additional effects
            customValidation: null, // No custom validation
          };
        } catch (error) {
          // If beheer config also doesn't exist, create a minimal fallback
          console.warn(
            `No beheer config found for type: ${type}, using minimal fallback`
          );
          return {
            // Minimal configuration without beheerConfig
            title: type.charAt(0).toUpperCase() + type.slice(1),
            fields: [],
            fieldVisibility: {},
            initialData: {},
            optionsProviders: {},
            fieldConfigs: {},
            customComponents: {},
            transformSubmitData: (data) => data,
            additionalEffects: [],
            customValidation: null,
          };
        }
    }
  },
};

export default FormModalConfigFactory;
