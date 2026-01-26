/**
 * Wizard Utilities Index
 *
 * Central export point for all wizard form utilities.
 */

// Mapping utilities
export {
  mapToOption,
  createModuleMapper,
  createOrganisatieMapper,
  createReferentieComponentMapper,
  createBuitengemeentelijkeMapper,
  createStandaardversieMapper,
  filterValidOptions,
  mapId,
} from './mapping-utils';

// Loading utilities
export { useLoadingState, useMultipleLoadingStates } from './loading-utils';

// Schema utilities
export {
  fetchSchemas,
  useSchemaFetcher,
  applySchemaDefaults,
  createIsEmptyCheck,
} from './schema-utils';

// Search utilities
export {
  mergeSearchOptions,
  createModuleSearchConfig,
  createOrganisatieSearchConfig,
  createEntitySearchConfig,
  useEntitySearch,
  fetchMissingEntities,
  createRelatedEntitiesFetcher,
} from './search-utils';
