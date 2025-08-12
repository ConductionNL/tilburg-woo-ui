import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field.js';
import { collapseExtendedObjects, smartSplit } from '@src/utilities';
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
    };

    switch (type) {
      case 'applicaties':
        return {
          ...baseConfig,
          // Initial data is now automatically generated from schema properties
          // Only specify custom defaults or overrides here
          initialData: {},
          optionsProviders: {
            voorzieningstype: () =>
              [
                { id: 'Toepassing', label: 'Toepassing' },
                { id: 'Platform', label: 'Platform' },
                { id: 'GeneriekComponent', label: 'GeneriekComponent' },
                { id: 'Service', label: 'Service' },
                { id: 'Anders', label: 'Anders' },
              ].map((type) => ({ value: type.id, label: type.label })),
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
            licentie: {
              visible: (formData) => formData.licentietype === 'Open Source',
            },
          },
          customComponents: {
            logo: LogoUploadField,
          },
          // No field transformation needed - use API field names directly
          transformSubmitData: (data) => data,
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
                    voorzieningParams
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
                    standaardenParams
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
          initialData: {},
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
            beschrijvingKort: { visible: false },
            beschrijvingLang: { visible: false },
            type: { visible: (formData, isEdit) => !isEdit }, // Only show type field when adding new organisation
            links: { visible: false },
            oin: { visible: false },
            rol: { visible: false },
            cbs: {
              visible: (formData) => formData.type?.toLowerCase() === 'gemeente',
            },
            samenwerkingen: { visible: false },
            deelnames: { visible: false },
            deelnemers: { visible: false },
            kvkNummer: {
              visible: (formData) => formData.type?.toLowerCase() === 'leverancier',
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
        return {
          ...baseConfig,
          // Most initial data is automatically generated from schema properties
          // Only specify custom defaults or overrides here
          initialData: {
            organisatie: 'ce0391a9-2006-426c-88cd-adedc10579b7', // Always set to this specific organisation
            voorkeuren: { taal: 'NL-nl', thema: 'licht' }, // Custom default for nested object
          },
          optionsProviders: {
            rollen: () => [
              { label: 'Aanbod-beheerder', value: 'aanbod-beheerder' },
              { label: 'Gebruik-beheerder', value: 'gebruik-beheerder' },
              { label: 'Gebruik-raadpleger', value: 'gebruik-raadpleger' },
              { label: 'Functioneel beheerder', value: 'functioneel beheerder' },
              { label: 'VNG-raadpleger', value: 'VNG-raadpleger' },
              { label: 'Bezoeker', value: 'Bezoeker' },
            ],
            organisatie: {
              type: 'collection',
              register: 'voorzieningen',
              schema: 'organisatie',
              labelField: (item) => item.naam || item.id,
              valueField: 'id',
            },
          },
          fieldConfigs: {
            // Hide fields that are not in the current form
            id: { visible: false },
            laatsteInlogdatum: { visible: false },
            aanmaakdatum: { visible: false },
            wijzigingsdatum: { visible: false },
            voorkeuren: { visible: false },
            // Disable organisatie field for non-admin users
            organisatie: {
              visible: true,
              disabled: true, // Always disabled
            },
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
                    aanbodParams
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
                    versieParams
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
        throw new Error(`Unknown form modal type: ${type}`);
    }
  },
};

export default FormModalConfigFactory;
