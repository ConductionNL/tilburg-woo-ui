import BeheerPageConfigFactory from '@views/ac-beheer/core/factories/con-beheer-page-config-factory';
import { VISUALS } from '@constants';
import _ from 'lodash';

/**
 * Details Page Configuration Factory
 * Creates configuration objects for different beheer details page types
 */
const DetailsPageConfigFactory = {
  /**
   * Create configuration for a specific details page type
   * @param {string} type
   * @returns {Object}
   */
  createConfig: (type) => {
    // Pull canonical fields from the beheer page config
    const beheerConfig = _.pick(BeheerPageConfigFactory.createConfig(type), [
      'registerSlug',
      'schemaSlug',
      'extend',
      'routeType',
      'uniqueActions',
    ]);

    // For details pages, always extend with 'all' to get full related objects
    // This allows us to display related object names instead of just IDs
    const detailsExtend = [...(beheerConfig.extend || []), 'all'];

    // Details-specific defaults (kept minimal)
    const baseDetailsConfig = {
      ...beheerConfig,
      // Override extend parameter to include 'all' for details pages
      extend: detailsExtend,
      // Fields to exclude from the details grid
      excludedProperties: ['id'],
      // Additional actions in the action menu (besides edit/delete)
      uniqueActions: [],
      // Formatting options passed to formatBySchema
      formatBySchemaOptions: {},
    };

    switch (type) {
      case 'applicaties':
        return {
          ...baseDetailsConfig,
          excludedProperties: [
            'id',
            'naam',
            'standaarden',
            'referentieComponent',
            'beschrijvingKort',
            'beschrijvingLang',
          ],
          formatBySchemaOptions: {
            profile: {
              organisatie: { include: ['naam'], includeUnknown: true, inline: true },
            },
          },
          // Keep only non-creation unique actions; creation is handled dynamically
          uniqueActions: [
            ...beheerConfig.uniqueActions,
            {
              key: 'openCatalogus',
              label: 'Bekijk in catalogus',
              icon: VISUALS.EYE,
              action: null,
              onClick: (row) => window.open(`/publicatie/${row.id}`, '_blank'),
              condition: (row) => !!row?.id,
            },
            // commented incase this is ever still needed
            // {
            //   key: 'addGebruik',
            //   label: 'Gebruiken aanmaken',
            //   icon: VISUALS.CLOUD,
            //   action: 'addGebruik',
            //   condition: () => true,
            // },
            // {
            //   key: 'addDienst',
            //   label: 'Dienst toevoegen',
            //   icon: VISUALS.HAND_HOLDING,
            //   action: 'addDienst',
            //   condition: () => true,
            // },
            // {
            //   key: 'addVersion',
            //   label: 'Versie toevoegen',
            //   icon: VISUALS.INFO,
            //   action: 'addVersion',
            //   condition: () => true,
            // },
          ],
        };

      case 'diensten':
        return {
          ...baseDetailsConfig,
          excludedProperties: [
            'id',
            'naam',
            'versies',
            'voorziening',
            'leverancier',
            'ondersteundeStandaarden',
          ],
          formatBySchemaOptions: {
            include: ['naam'],
            includeUnknown: true,
            inline: true,
          },
        };

      case 'gebruiken':
        return {
          ...baseDetailsConfig,
          excludedProperties: ['id', 'ibpScore', 'bbnScore', 'interneAantekening'],
          formatBySchemaOptions: {
            profile: {
              voorzieningId: {
                include: ['naam'],
                includeUnknown: true,
                inline: true,
              },
              organisatieId: {
                include: ['naam'],
                includeUnknown: true,
                inline: true,
              },
            },
          },
        };

      case 'organisaties':
        return {
          ...baseDetailsConfig,
          // Creation is handled dynamically; preserve existing beheer unique actions
          uniqueActions: [...beheerConfig.uniqueActions],
          excludedProperties: [
            'id',
            'naam',
            'beschrijvingKort',
            'beschrijvingLang',
            'contactgegevens',
            'contactpersonen',
            'deelnames',
            'logo',
          ],
          formatBySchemaOptions: {
            exclude: ['@self'],
            includeUnknown: true,
            profile: {
              deelnames: { include: ['naam'], includeUnknown: true, inline: true },
            },
          },
        };

      case 'kwetsbaarheden':
        return {
          ...baseDetailsConfig,
          excludedProperties: ['id', 'titel'],
          formatBySchemaOptions: {},
        };

      case 'overeenkomsten':
        return {
          ...baseDetailsConfig,
          excludedProperties: ['id', 'contractNummer'],
          formatBySchemaOptions: {
            include: ['naam'],
            inline: true,
            profile: {
              voorzieningAanbod: {
                includeUnknown: true,
                include: ['id'],
                inline: true,
              },
              voorzieningGebruik: {
                includeUnknown: true,
                include: ['id'],
                inline: true,
              },
            },
          },
        };

      case 'contactpersonen':
        return {
          ...baseDetailsConfig,
          ...beheerConfig,
          excludedProperties: ['id', 'voornaam', 'achternaam'],
          formatBySchemaOptions: {
            profile: {
              organisatie: { include: ['naam'], includeUnknown: true, inline: true },
            },
          },
        };

      case 'voorzieningen':
        return {
          ...baseDetailsConfig,
          excludedProperties: ['id'],
          getTitle: (data) => data?.naam || data?.id,
          formatBySchemaOptions: {
            includeUnknown: true,
            profile: {
              organisatie: { include: ['naam'], includeUnknown: true, inline: true },
              omvat: { includeUnknown: true, inline: true },
            },
          },
        };

      case 'voorzieningen-versie':
        return {
          ...baseDetailsConfig,
          excludedProperties: [
            'id',
            'naam',
            'kwetsbaarheden',
            'systeemvereisten',
            'inDatumOntwikkeling',
            'inDatumActief',
            'inDatumEindeOndersteuning',
            'inDatumOnderhoud',
          ],
          getTitle: (data) => data?.naam || data?.id,
          formatBySchemaOptions: {
            include: ['id'],
            includeUnknown: true,
            inline: true,
            profile: {
              voorziening: { include: ['name'], includeUnknown: true, inline: true },
              voorzieningaanbod: {
                include: ['name'],
                includeUnknown: true,
                inline: true,
              },
            },
          },
        };

      default:
        // Generic fallback configuration for dynamic types
        // This will use the beheer config and apply generic detail settings
        return {
          ...baseDetailsConfig,
          // Generic settings for unknown types
          excludedProperties: ['id'], // Only exclude ID by default
          formatBySchemaOptions: {
            includeUnknown: true, // Show all fields we don't know about
          },
        };
    }
  },
};

export default DetailsPageConfigFactory;
