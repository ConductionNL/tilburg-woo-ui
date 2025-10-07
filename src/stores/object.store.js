// Imports => MOBX
import { observable, makeObservable, action, runInAction } from 'mobx';

// Imports => Utilities
import axios, { CanceledError } from 'axios';
import {
  getCookie,
  sortPropertiesByOrder,
  AcFormatErrorMessage,
} from '@src/utilities';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

let app = {};

// Remove global variable and use dependency injection
const LIMIT = 20;

export const DEFAULT_SEARCH_QUERY = {
  _extend: '@self.schema',
  _limit: LIMIT,
  _page: 1,
};

// Create axios instance configured for OpenRegister API
const nextcloudApi = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header interceptor for OAuth tokens AND basic auth fallback
nextcloudApi.interceptors.request.use(
  (config) => {
    const accessToken = getCookie('nextcloud_access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      // Fallback to basic auth if available (same logic as main config)
      try {
        if (
          window.app &&
          window.app.store &&
          window.app.store.user &&
          window.app.store.user.basicAuthCredentials
        ) {
          const basicAuth = window.app.store.user.basicAuthCredentials;
          if (basicAuth && basicAuth.username && basicAuth.password) {
            const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
            config.headers.Authorization = `Basic ${credentials}`;
          }
        }
      } catch (error) {
        // Silently fail if store is not available
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling
nextcloudApi.interceptors.response.use(
  (response) => ({
    ...response,
    ok: response.status >= 200 && response.status < 300,
  }),
  (error) => {
    // Handle 401 Unauthorized errors by redirecting to login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname + window.location.search;
      // NOTE: Using window.location.href here is appropriate since this is a global
      // axios interceptor outside React component context and handles auth failures
      window.location.href = `/login?redirect_url=${encodeURIComponent(
        currentPath
      )}`;
    }
    return Promise.reject(error);
  }
);

/**
 * Store for managing objects in OpenCatalogi.
 * Handles fetching, creating, updating, deleting, and other API operations
 * for objects in the system with robust error handling and request cancellation.
 *
 * ## Core Functionality Overview
 *
 * ### State Management
 * - **Observable State**: Objects, collections, loading states, errors, active objects, related data, search terms, pagination, success states, selected objects, schema properties, column filters, schemas, schema loading states, and schema errors
 * - **Computed Getters**: Access to filtered and processed state data
 * - **Actions**: Methods that modify observable state and trigger API calls
 * - **Request Cancellation**: AbortController infrastructure to prevent race conditions
 *
 * ### API Operations (All with Request Cancellation)
 *
 * #### Collection Operations
 * - `fetchCollection(register, schema, params, append)` - Fetches paginated collections of objects with cancellation support
 * - `loadMore(type)` - Loads next page of results
 * - `loadPrevious(type)` - Loads previous page of results
 * - `exportObjects(register, schema, type)` - Exports a collection as CSV or Excel
 *
 * #### Schema Operations
 * - `fetchSchema(register, schema, params)` - Fetches schema definition with cancellation support
 * - `getSchema(type)` - Gets schema for specific type
 * - `getSchemaProperties(type)` - Gets sorted schema properties for specific type
 * - `isSchemaLoading(type)` - Checks if schema is loading for specific type
 * - `getSchemaError(type)` - Gets schema error for specific type
 * - `clearSchema(type)` - Clears schema data for specific type
 *
 * #### Individual Object Operations
 * - `fetchObject(register, schema, id, params)` - Fetches single object with related data and cancellation support
 * - `createObject(register, schema, data)` - Creates new object and refreshes collection
 * - `saveObject(objectItem)` - Creates or updates object and refreshes collection for data consistency
 * - `updateObject(register, schema, id, data)` - Updates existing object and refreshes collection
 * - `deleteObject(objectItem)` - Deletes object with operation-specific error tracking
 *
 * #### Object Lifecycle Operations
 * - `publishObject(objectItem)` - Publishes object with operation-specific state tracking
 * - `depublishObject(objectItem)` - Depublishes object with operation-specific state tracking
 * - `lockObject(objectItem, process, duration)` - Locks object for editing with operation-specific state tracking
 * - `unlockObject(objectItem)` - Unlocks object with operation-specific state tracking
 *
 * #### Mass Operations (Parallel Processing)
 * - `massDeleteObjects(objects, onProgress)` - Deletes multiple objects in parallel
 * - `massPublishObjects(objects, onProgress)` - Publishes multiple objects in parallel
 * - `massDepublishObjects(objects, onProgress)` - Depublishes multiple objects in parallel
 * - `massLockObjects(objects, process, duration, onProgress)` - Locks multiple objects in parallel
 * - `massUnlockObjects(objects, onProgress)` - Unlocks multiple objects in parallel
 *
 * ### Related Data Management
 * - `fetchRelatedData(register, schema, id, dataType, params)` - Fetches logs, uses, used, files with cancellation support
 * - `setActiveObject(register, schema, object)` - Sets active object and fetches related data
 * - `clearActiveObject(register, schema)` - Clears active object and related data
 *
 * ### Search and Filtering
 * - `setSearchTerm(type, term)` - Sets search term with debouncing
 * - `clearSearchTerm(type)` - Clears search term
 * - `initializeSchemaProperties(type, schema)` - Initializes schema properties for filtering
 * - `initializeColumnFilters(type)` - Sets up column filters based on schema
 * - `updateColumnFilter(type, id, enabled)` - Updates column filter state
 *
 * ### Selection Management
 * - `setSelectedObjects(objects)` - Sets selected objects for bulk operations
 * - `toggleSelectAllObjects(type)` - Toggles selection of all objects of a type
 * - `isAllSelectedForType(type)` - Checks if all objects of a type are selected
 *
 * ### Request Cancellation
 * - `cancelRequest(type)` - Cancels ongoing request for specific operation type
 * - `cancelAllRequests()` - Cancels all ongoing requests
 * - `_createAbortController(type)` - Creates new AbortController for request type
 *
 * ### State Setters and Getters
 *
 * #### State Setters
 * - `setCollection(type, results, append)` - Sets collection data
 * - `setLoading(type, isLoading)` - Sets loading state for operation-specific tracking
 * - `setError(type, error)` - Sets error state for operation-specific tracking
 * - `setSuccess(type, success)` - Sets success state for operation-specific tracking
 * - `setPagination(type, pagination)` - Sets pagination info
 * - `setObjectError(objectId, error)` - Sets error for specific object
 * - `clearObjectError(objectId)` - Clears error for specific object
 * - `clearAllObjectErrors()` - Clears all object errors
 * - `setSchemaLoading(type, isLoading)` - Sets schema loading state
 * - `setSchemaError(type, error)` - Sets schema error state
 * - `clearSchema(type)` - Clears schema data
 *
 * #### State Getters
 * - `getCollection(type)` - Gets collection data
 * - `getObject(type, id)` - Gets specific object
 * - `getActiveObject(type)` - Gets active object
 * - `getRelatedData(type, dataType)` - Gets related data (logs, uses, used, files)
 * - `getPagination(type)` - Gets pagination info
 * - `getSearchTerm(type)` - Gets current search term
 * - `getError(type)` - Gets error state for operation-specific tracking
 * - `getObjectError(objectId)` - Gets error for specific object
 * - `getState(type)` - Gets success/error state for operation-specific tracking
 * - `getEnabledSchemaProperties(type)` - Gets enabled schema properties
 * - `getColumnFilters(type)` - Gets column filters
 * - `getSchemaPropertiesForType(type)` - Gets all schema properties
 * - `getSchema(type)` - Gets schema for specific type
 * - `getSchemaProperties(type)` - Gets sorted schema properties
 * - `isSchemaLoading(type)` - Checks if schema is loading
 * - `getSchemaError(type)` - Gets schema error
 *
 * #### Utility Getters
 * - `isLoading(type)` - Checks if specific operation type is loading
 * - `hasMorePages(type)` - Checks if more pages available
 * - `hasPreviousPages(type)` - Checks if previous pages available
 * - `getAuditTrails(type)` - Gets audit trails
 *
 * ### Helper Methods
 * - `_constructApiUrl(register, schema, id, action)` - Constructs API URLs
 * - `_constructQueryParams(params)` - Constructs query parameters
 * - `extractId(value)` - Extracts ID from various formats
 * - `getTypeFromObject(objectItem)` - Gets object type from item
 * - `getTypeFromParams(register, schema, id, suffix)` - Gets object type from register, schema, id, suffic
 *
 * ### Names Cache System for UUID → Name Resolution
 * - `getNamesForSingleId(id)` - Gets single name from cache or backend fallback
 * - `getNamesForMultipleIds(ids)` - Gets multiple names from cache or backend fallback
 * - `setNamesInCacheSingle(id, name)` - Sets single name in cache
 * - `setNamesInCache(nameMap)` - Sets multiple names in cache
 * - `processRelatedNamesFromResponse(apiResponse)` - Processes related names from API responses
 * - `warmupNamesCache()` - Warms up cache by fetching all available names
 * - `triggerNamesWarmup()` - Triggers manual backend warmup via POST endpoint
 * - `getNamesStatsFromBackend()` - Gets cache statistics from backend
 * - `clearNamesCache()` - Clears all names from cache
 * - `getNamesStats()` - Gets frontend cache statistics
 * - `cleanExpiredNamesCache()` - Cleans expired entries from cache
 *
 * ### Backend Cache Loading System
 * - `cacheLoad()` - Pre-warms backend cache for all core registers (voorzieningen, vng-gemma)
 * - `cacheLoadRegister(registerSlug)` - Cache loads all schemas in a specific register
 * - `fetchRegister(registerSlug)` - Fetches register information including schemas
 * - `triggerBackendCacheLoad(registerId, schemaId)` - Triggers cache load for specific register/schema
 * - `isCacheLoading(registerSlug)` - Checks if cache loading is in progress for a register
 * - `getCacheLoadingError(registerSlug)` - Gets cache loading error for a register
 * - `isFullyCacheLoaded()` - Checks if all core registers are fully cache loaded
 * - `clearCacheLoadingState()` - Clears cache loading state and errors
 *
 * ## Operation-Specific State Tracking
 *
 * All operations now use operation-specific identifiers for loading, error, and success states:
 * - `fetchCollection` → `register_schema`
 * - `fetchObject` → `register_schema_objectId`
 * - `fetchRelatedData` → `register_schema_objectId_dataType`
 * - `fetchSchema` → `schema_register_schema`
 * - `createObject` → `register_schema_create`
 * - `saveObject` → `register_schema_save`
 * - `updateObject` → `register_schema_objectId`
 * - `deleteObject` → `delete_objectId`
 * - `publishObject` → `publish_objectId`
 * - `depublishObject` → `depublish_objectId`
 * - `lockObject` → `lock_objectId`
 * - `unlockObject` → `unlock_objectId`
 *
 * ## Function Relationships and Workflows
 *
 * ### Typical CRUD Workflow (with Request Cancellation)
 * 1. `fetchCollection()` → Request cancellation → `setCollection()` → `getCollection()`
 * 2. `fetchObject()` → Request cancellation → `setActiveObject()` → `getActiveObject()`
 * 3. `createObject()` → `fetchCollection()` (refresh) → `setActiveObject()`
 * 4. `saveObject()` → `fetchCollection()` (refresh) → Updates store state → Returns response
 * 5. `deleteObject()` → Operation-specific state tracking → Clears selections
 *
 * ### Schema Workflow (with Request Cancellation)
 * 1. `fetchSchema()` → Request cancellation → `setSchemaLoading()` → `getSchemaProperties()`
 * 2. Schema properties automatically initialized for column filtering
 * 3. `getSchemaProperties()` → Returns sorted properties using `sortPropertiesByOrder`
 *
 * ### Search and Filtering Workflow
 * 1. `setSearchTerm()` → Debounced → `fetchCollection()` with search params and cancellation
 * 2. `initializeSchemaProperties()` → `initializeColumnFilters()` → `updateColumnFilter()`
 *
 * ### Bulk Operations Workflow
 * 1. `setSelectedObjects()` → `massDeleteObjects()` → Operation-specific error tracking → Update selections
 * 2. Progress callbacks provide real-time feedback during parallel operations
 *
 * ### Related Data Workflow (with Request Cancellation)
 * 1. `setActiveObject()` → `fetchRelatedData()` with cancellation for logs, uses, used, files
 * 2. `getRelatedData()` → Access fetched related data
 *
 * ### Pagination Workflow
 * 1. `fetchCollection()` → `setPagination()` → `getPagination()`
 * 2. `loadMore()` / `loadPrevious()` → `fetchCollection()` with append flag
 *
 * ## Error Handling (Enhanced)
 * - **Operation-Specific Errors**: Each operation has its own error/success state preventing conflicts
 * - **Individual Object Errors**: Stored in `objectErrors` for granular feedback
 * - **Schema Errors**: Stored in `schemaErrors` for schema-specific error tracking
 * - **Request Cancellation**: AbortController prevents race conditions between concurrent requests
 * - **Mass Operations**: Provide detailed success/failure results with progress tracking
 * - **Collection Consistency**: Collections refreshed after modifications to ensure data accuracy
 *
 * ## State Synchronization (Improved)
 * - **Collections**: Automatically refreshed after CRUD operations for data consistency
 * - **Schemas**: Cached per object type with automatic property initialization
 * - **Active Objects**: Updated when related operations complete
 * - **Selected Objects**: Managed across bulk operations with automatic cleanup
 * - **Related Data**: Refreshed when active object changes with proper cancellation
 * - **Request Management**: Automatic cleanup of abort controllers after operations
 *
 * Usage Examples:
 *
 * // In a React component with store access:
 * const { store } = this.props;
 *
 * // Fetch a collection of objects
 * await store.object.fetchCollection('register-slug', 'schema-slug');
 *
 * // Get the collection data
 * const collection = store.object.getCollection('register-slug_schema-slug');
 *
 * // Fetch schema for a specific type
 * await store.object.fetchSchema('register-slug', 'schema-slug');
 *
 * // Get schema properties (sorted by order)
 * const properties = store.object.getSchemaProperties('register-slug_schema-slug');
 *
 * // Check if schema is loading
 * const isLoading = store.object.isSchemaLoading('register-slug_schema-slug');
 *
 * // Create a new object
 * const newObject = await store.object.createObject('register-slug', 'schema-slug', {
 *   title: 'New Object',
 *   description: 'Description here'
 * });
 *
 * // Update an object
 * await store.object.updateObject('register-slug', 'schema-slug', 'object-id', {
 *   title: 'Updated Title'
 * });
 *
 * // Delete an object
 * await store.object.deleteObject({
 *   id: 'object-id',
 *   '@self': { register: 'register-id', schema: 'schema-id' }
 * });
 *
 * // Publish/Depublish objects
 * await store.object.publishObject(objectItem);
 * await store.object.depublishObject(objectItem);
 *
 * // Lock/Unlock objects
 * await store.object.lockObject(objectItem, 'process-name', 3600);
 * await store.object.unlockObject(objectItem);
 *
 * // Mass operations
 * const results = await store.object.massDeleteObjects(selectedObjects);
 * const results = await store.object.massPublishObjects(selectedObjects);
 *
 * // Search functionality
 * store.object.setSearchTerm('register-slug_schema-slug', 'search term');
 *
 * // Pagination
 * await store.object.loadMore('register-slug_schema-slug');
 * await store.object.loadPrevious('register-slug_schema-slug');
 *
 * // Initialize schema properties for column filtering
 * store.object.initializeSchemaProperties('object-type', schemaData);
 * store.object.initializeColumnFilters('object-type');
 *
 * // Set active object and fetch related data
 * await store.object.setActiveObject('register-slug', 'schema-slug', object);
 *
 * // Clear active object
 * store.object.clearActiveObject('register-slug', 'schema-slug');
 *
 * // Backend cache loading (call during login)
 * await store.object.cacheLoad();
 *
 * // Check cache loading status
 * const isLoading = store.object.isCacheLoading('voorzieningen');
 * const error = store.object.getCacheLoadingError('voorzieningen');
 * const fullyLoaded = store.object.isFullyCacheLoaded();
 *
 * // Names cache system for UUID to name resolution
 * const name = await store.object.getNamesForSingleId('uuid-123');
 * const names = await store.object.getNamesForMultipleIds(['uuid-123', 'uuid-456']);
 * store.object.setNamesInCache({ 'uuid-123': 'Product Name' });
 * store.object.processRelatedNamesFromResponse(apiResponse);
 * await store.object.warmupNamesCache();
 * await store.object.triggerNamesWarmup();
 * const backendStats = await store.object.getNamesStatsFromBackend();
 */
export class ObjectStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;

    // Request cancellation infrastructure
    this.abortControllers = new Map();
  }

  // Observable state
  /**
   * Cache of individual objects by type and ID
   * @type {{[type: string]: {[id: string]: object}}}
   * */
  @observable
  objects = {};

  /**
   * Collections of objects grouped by type (e.g., 'object-type', 'register_schema')
   * @type {{[type: string]: {results: object[]}}}
   * */
  @observable
  collections = {};

  /**
   * Multi-dimensional cache for immediate responses: register -> schema -> cached response
   * @type {{[register: string]: {[schema: string]: {data: object[], timestamp: number, params: object}}}}
   */
  @observable
  listCache = {};

  /**
   * Cache metadata and settings
   * @type {{maxAge: number, backgroundRefreshThreshold: number}}
   */
  cacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
    backgroundRefreshThreshold: 2 * 60 * 1000, // 2 minutes - when to refresh in background
  };

  /**
   * Names cache for quick UUID to name resolution
   * Structure: { id: string, name: string, timestamp: number }[]
   * @type {{[id: string]: {name: string, timestamp: number}}}
   */
  @observable
  namesCache = {};

  /**
   * Names cache configuration
   * @type {{maxAge: number, warmupChunkSize: number}}
   */
  namesCacheConfig = {
    maxAge: 10 * 60 * 1000, // 10 minutes for names (longer than list cache)
    warmupChunkSize: 1000, // Process names in chunks during warmup
  };

  /**
   * Loading states for different operations (fetch, create, update, etc.)
   * @type {{[type: string]: boolean}}
   * */
  @observable
  loading = {};

  /**
   * Error states for different operations (fetch, create, update, etc.)
   * @type {{[type: string]: string}}
   * */
  @observable
  errors = {};

  /**
   * Success states for different operations
   * @type {{[type: string]: boolean}}
   * */
  @observable
  success = {};

  /**
   * Currently selected/active objects by type
   * @type {{[type: string]: Object}}
   * */
  @observable
  activeObjects = {};

  /**
   * Related data for active objects (logs, uses, used, files)
   * @type {{[type: string]: {logs: Object[], uses: Object[], used: Object[], files: Object[]}}}
   * */
  @observable
  relatedData = {};

  /**
   * Current search terms for different object types
   * @type {{[type: string]: string}}
   * */
  @observable
  searchTerms = {};

  /**
   * Debounce timers for search operations
   * @type {{[type: string]: number}}
   * */
  @observable
  searchDebounceTimers = {};

  /**
   * Pagination information for collections (total, page, pages, limit, next, prev)
   * @type {{[type: string]: {total: number, page: number, pages: number, limit: number, next: string, prev: string}}}
   * */
  @observable
  pagination = {};

  /**
   * Array of selected object IDs for bulk operations
   * @type {string[]}
   * */
  @observable
  selectedObjects = [];

  /**
   * Individual error states for specific objects
   * @type {{[type: string]: string}}
   * */
  @observable
  objectErrors = {}; // Individual error states for specific objects

  /**
   * Schema property definitions for different object types
   * @type {{[type: string]: {label: string, key: string, description: string, enabled: boolean, visible: boolean}}}
   * */
  @observable
  schemaProperties = {}; // Schema property definitions for different object types

  /**
   * Column filter states for table views
   * @type {{[type: string]: {enabled: boolean}}}
   * */
  @observable
  columnFilters = {}; // Column filter states for table views

  /**
   * Schema definitions for different object types
   * @type {{[type: string]: Object}}
   * */
  @observable
  schemas = {}; // Schema definitions for different object types

  /**
   * Loading states for schema fetching operations
   * @type {{[type: string]: boolean}}
   * */
  @observable
  schemaLoading = {}; // Loading states for schema fetching

  /**
   * Error states for schema fetching operations
   * @type {{[type: string]: string}}
   * */
  @observable
  schemaErrors = {}; // Error states for schema fetching

  // Request cancellation methods
  /**
   * Cancels any ongoing request for a specific type
   * @param {string} type - The type identifier for the request to cancel
   */
  @action
  cancelRequest = (type) => {
    const controller = this.abortControllers.get(type);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(type);
    }
  };

  /**
   * Imports one or multiple files into a register/schema
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {File|Blob|Array<File|Blob>} files - File or array of files to import
   * @returns {Object} API response data
   */
  @action
  importObjects = async (register, schema, files) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID for import');
    }

    const requestType = this.getTypeFromParams(registerId, schemaId, null, 'import');
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const normalizeFile = (f) => (f instanceof Blob ? f : f?.file || f);
      const form = new FormData();

      if (Array.isArray(files)) {
        files.forEach((f) => form.append('file', normalizeFile(f)));
      } else {
        form.append('file', normalizeFile(files));
      }

      const endpoint = `${this._constructApiUrl(registerId, schemaId)}/import`;
      const response = await nextcloudApi.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) {
        throw new Error(`Failed to import for ${registerId}/${schemaId}`);
      }

      this.setSuccess(requestType, true);
      return response.data;
    } catch (error) {
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        return;
      }
      console.error('Error importing objects:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Cancels all ongoing requests across the store
   */
  @action
  cancelAllRequests = () => {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  };

  /**
   * Creates a new AbortController for a request type
   * @param {string} type - The type identifier for the request
   * @returns {AbortController} The abort controller
   */
  _createAbortController = (type) => {
    // Cancel any existing request for this type
    this.cancelRequest(type);

    const controller = new AbortController();
    this.abortControllers.set(type, controller);
    return controller;
  };

  // Computed getters

  // Actions
  /**
   * Gets enabled schema properties for a specific object type
   * @param {string} type - The object type identifier
   * @returns {Array<Object>} Array of enabled schema properties with id, key, and other properties
   */
  @action
  getEnabledSchemaPropertiesForType = (type) => {
    const typeProperties = this.schemaProperties[type] || {};
    return Object.entries(typeProperties)
      .filter(([, prop]) => prop.enabled)
      .map(([key, prop]) => ({
        id: `prop_${key}`,
        key,
        ...prop,
      }));
  };

  /**
   * Gets all schema properties for a specific object type
   * @param {string} type - The object type identifier
   * @returns {Object} Object containing all schema properties for the type
   */
  @action
  getSchemaPropertiesForType = (type) => {
    return this.schemaProperties[type] || {};
  };

  /**
   * Checks if all objects of a specific type are selected
   * @param {string} type - The object type to check
   * @returns {boolean} True if all objects of the type are selected, false otherwise
   */
  @action
  isAllSelectedForType = (type) => {
    const collection = this.collections[type];
    if (!collection?.results?.length) return false;
    return collection.results.every((obj) =>
      this.selectedObjects.includes(obj['@self']?.id || obj.id)
    );
  };

  /**
   * Sets the collection data for a specific type
   * @param {string} type - The collection type identifier
   * @param {Array<Object>} results - Array of objects to set as collection results
   * @param {boolean} [append=false] - Whether to append to existing results or replace them
   */
  @action
  setCollection = (type, results, append = false) => {
    if (!this.collections[type]) {
      this.collections[type] = { results: [] };
    }

    const newResults = append
      ? [...(this.collections[type].results || []), ...results]
      : results;

    this.collections[type] = {
      results: newResults,
    };
  };

  /**
   * Sets the loading state for a specific type
   * @param {string} type - The type identifier for the loading state
   * @param {boolean} isLoading - Whether the type is currently loading
   */
  @action
  setLoading = (type, isLoading) => {
    this.loading[type] = isLoading;
  };

  /**
   * Sets the error state for a specific type
   * @param {string} type - The type identifier for the error state
   * @param {string|null} error - The error message or null to clear errors
   */
  @action
  setError = (type, error) => {
    this.errors[type] = error;
    if (error) {
      console.error('Error set for type:', type, error);
    }
  };

  /**
   * Sets the success state for a specific type
   * @param {string} type - The type identifier for the success state
   * @param {boolean} success - Whether the operation was successful
   */
  @action
  setSuccess = (type, success) => {
    this.success[type] = success;
  };

  /**
   * Sets the active object and fetches its related data
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} object - The object to set as active
   */
  @action
  setActiveObject = async (register, schema, object) => {
    const type = `${register}_${schema}`;
    this.activeObjects[type] = object;

    this.relatedData[type] = {
      logs: null,
      uses: null,
      used: null,
      files: null,
    };

    if (object?.id) {
      const fetchPromises = [];
      const dataTypes = ['logs', 'uses', 'used', 'files'];
      for (const dataType of dataTypes) {
        if (!this.relatedData[type][dataType]) {
          const defaultLimit = dataType === 'files' ? 500 : 20;
          fetchPromises.push(
            this.fetchRelatedData(register, schema, object.id, dataType, {
              _limit: defaultLimit,
              _page: 1,
            }).catch((error) => {
              // Log the error but don't throw it to avoid affecting the main operation
              console.warn(
                `Failed to fetch ${dataType} for object ${object.id}:`,
                error
              );
              return null; // Return null to indicate failure without throwing
            })
          );
        }
      }

      // Use Promise.allSettled instead of Promise.all to handle individual failures gracefully
      const results = await Promise.allSettled(fetchPromises);

      // Log any failures for debugging but don't throw
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(
            `Related data fetch failed for ${dataTypes[index]}:`,
            result.reason
          );
        }
      });
    } else {
      console.info('No object ID provided, skipping related data fetch');
    }
  };

  /**
   * Clears the active object and its related data
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   */
  @action
  clearActiveObject = (register, schema) => {
    const type = `${register}_${schema}`;
    this.activeObjects[type] = null;
    this.relatedData[type] = {
      logs: null,
      uses: null,
      used: null,
      files: null,
    };
  };

  /**
   * Sets pagination information for a specific type
   * @param {string} type - The type identifier for pagination
   * @param {Object} pagination - Pagination object with total, page, pages, limit, next, prev
   */
  @action
  setPagination = (type, pagination) => {
    this.pagination[type] = pagination;
  };

  /**
   * Sets the array of selected objects
   * @param {Array<string|Object>} objects - Array of object IDs or objects to select
   */
  @action
  setSelectedObjects = (objects) => {
    this.selectedObjects = objects;
  };

  /**
   * Sets an error for a specific object
   * @param {string} objectId - The ID of the object
   * @param {string} error - The error message
   */
  @action
  setObjectError = (objectId, error) => {
    this.objectErrors[objectId] = error;
  };

  /**
   * Clears the error for a specific object
   * @param {string} objectId - The ID of the object
   */
  @action
  clearObjectError = (objectId) => {
    delete this.objectErrors[objectId];
  };

  /**
   * Clears all object errors
   */
  @action
  clearAllObjectErrors = () => {
    this.objectErrors = {};
  };

  /**
   * Toggles selection of all objects of a specific type
   * @param {string} type - The object type to toggle selection for
   */
  @action
  toggleSelectAllObjects = (type) => {
    const collection = this.collections[type];
    if (!collection?.results?.length) return;

    if (this.isAllSelectedForType(type)) {
      this.selectedObjects = [];
    } else {
      this.selectedObjects = collection.results.map(
        (obj) => obj['@self']?.id || obj.id
      );
    }
  };

  /**
   * Updates the column filter state for a specific property
   * @param {string} type - The object type identifier
   * @param {string} id - The column filter ID (e.g., 'prop_name')
   * @param {boolean} enabled - Whether the column should be enabled
   */
  @action
  updateColumnFilter = (type, id, enabled) => {
    if (!this.columnFilters[type]) {
      this.columnFilters[type] = {};
    }
    this.columnFilters[type][id] = enabled;

    if (id.startsWith('prop_')) {
      const propKey = id.replace('prop_', '');
      if (this.schemaProperties[type]?.[propKey]) {
        this.schemaProperties[type][propKey].enabled = enabled;
      }
    }
  };

  /**
   * Initializes schema properties from a schema object for a specific type
   * @param {string} type - The object type identifier
   * @param {Object} schema - Schema object containing properties
   */
  @action
  initializeSchemaProperties = (type, schema) => {
    if (!schema?.properties) {
      if (!this.schemaProperties[type]) {
        this.schemaProperties[type] = {};
      }
      return;
    }

    const properties = {};
    Object.entries(schema.properties).forEach(([key, property]) => {
      properties[key] = {
        label: property.title || key,
        key,
        description: property.description || `Property: ${key}`,
        enabled: false,
        visible: property.visible !== false, // Default to visible unless explicitly set to false
      };
    });

    this.schemaProperties[type] = properties;
  };

  /**
   * Initializes column filters based on current schema properties for a specific type
   * @param {string} type - The object type identifier
   */
  @action
  initializeColumnFilters = (type) => {
    const filters = {};

    if (this.schemaProperties[type]) {
      Object.keys(this.schemaProperties[type]).forEach((key) => {
        filters[`prop_${key}`] = this.schemaProperties[type][key].enabled;
      });
    }

    this.columnFilters[type] = filters;
  };

  /**
   * Constructs API URL for object operations
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string|null} [id=null] - Object ID for specific object operations
   * @param {string|null} [action=null] - Action to perform (e.g., 'publish', 'lock')
   * @param {Object} [params={}] - Query parameters
   * @returns {string} Constructed API URL
   */
  _constructApiUrl = (register, schema, id = null, action = null) => {
    const baseUrl = '/openregister/api/objects';

    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    let url = `${baseUrl}/${registerId}/${schemaId}`;

    if (id) {
      url += `/${id}`;
      if (action) {
        if (action === 'logs') {
          url += '/audit-trails';
        } else {
          url += `/${action}`;
        }
      }
    }

    return url;
  };

  /**
   * Constructs query parameters for API requests
   * @param {Object} [params={}] - Query parameters
   * @returns {Object} Query parameters object
   */
  _constructQueryParams = (params = {}) => {
    const queryParams = {
      _limit: params._limit || params.limit || 20,
      _page: params._page || params.page || 1,
      '_extend[]': '@self.schema',
      _source: 'database', // Always use database as source
      ...params,
    };

    if (
      Array.isArray(queryParams._extend) &&
      !queryParams._extend.includes('@self.schema')
    ) {
      queryParams._extend.push('@self.schema');
    }

    // Remove internal parameters (but keep _source)
    delete queryParams._schema;
    delete queryParams._register;
    delete queryParams.extend;
    delete queryParams.page;
    delete queryParams.limit;

    return queryParams;
  };

  /**
   * Extracts ID from a value, prioritizing slug over id
   * @param {string|Object|null} value - Value to extract ID from
   * @returns {string|null} Extracted ID or the original value
   */
  extractId = (value) => {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'object') {
      return value.slug || value.id || value.uuid || value._id;
    }

    return value;
  };

  /**
   * Gets the object type from an object item
   * @param {Object} objectItem - The object item
   * @returns {string} The object type
   */
  getTypeFromObject = (objectItem) => {
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (register && schema) {
      const registerId = this.extractId(register);
      const schemaId = this.extractId(schema);
      return `${registerId}_${schemaId}`;
    }

    return null;
  };

  /**
   * Builds an operation key from register and schema with optional id and suffix.
   * - Backwards compatible: without id/suffix → 'register_schema'
   * - With id → 'register_schema_id'
   * - With id and suffix → 'register_schema_id_suffix'
   * - With suffix only → 'register_schema_suffix'
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string|null} [id=null] - Optional object id
   * @param {string|null} [suffix=null] - Optional suffix, `${type}_${suffix}`
   * @returns {string|null} The built key or null if ids missing
   */
  getTypeFromParams = (register, schema, id = null, suffix = null) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);
    if (!registerId || !schemaId) return null;
    const base = `${registerId}_${schemaId}`;
    if (id && suffix) return `${base}_${id}_${suffix}`;
    if (id) return `${base}_${id}`;
    if (suffix) return `${base}_${suffix}`;
    return base;
  };

  /**
   * Exports a collection of objects as CSV or Excel and triggers a browser download
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {('csv'|'excel')} [type='csv'] - Export type
   */
  @action
  exportObjects = async (register, schema, type = 'csv') => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);
    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID for export');
    }

    const requestType = this.getTypeFromParams(
      registerId,
      schemaId,
      null,
      `export_${type}`
    );
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    // Create abort controller for request cancellation
    const controller = this._createAbortController(requestType);

    try {
      const endpoint = `${this._constructApiUrl(registerId, schemaId)}/export`;
      const response = await nextcloudApi.get(endpoint, {
        params: { type },
        responseType: 'blob',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${registerId}/${schemaId}`);
      }

      const disposition = response.headers['content-disposition'];
      const inferred = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
      const date = new Date();
      const currentDate = date.toISOString().split('T')[0];
      const utcTime = date
        .toISOString()
        .split('T')[1]
        .replace(/[:\-.]/g, '')
        .slice(0, 6);
      const ext = type === 'excel' ? 'xlsx' : 'csv';
      const filename =
        inferred || `${registerId}_${schemaId}_${currentDate}_${utcTime}.${ext}`;

      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      this.setSuccess(requestType, true);
    } catch (error) {
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        return;
      }
      console.error('Error exporting objects:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
      this.abortControllers.delete(requestType);
    }
  };

  /**
   * Gets schema type from schema identifier
   * @param {string|Object} schema - Schema identifier or object
   * @returns {string|null} Schema type identifier
   */
  getSchemaType = (schema, typeSuffix = null) => {
    const schemaId = this.extractId(schema);
    if (!schemaId) return null;
    return `schema_${schemaId}${typeSuffix ? `_${typeSuffix}` : ''}`;
  };

  /**
   * Fetches a collection of objects from the API
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   * @param {boolean} [append=false] - Whether to append to existing results
   * @param {string} [typeSuffix=''] - Suffix to add to the type (can be used separate page data from the same collection)
   */
  @action
  fetchCollection = async (
    register,
    schema,
    params = {},
    append = false,
    typeSuffix = null
  ) => {
    const type = this.getTypeFromParams(register, schema, null, typeSuffix);
    this.setLoading(type, true);
    this.setError(type, null);
    this.setSuccess(type, null);

    // Create abort controller for request cancellation
    const controller = this._createAbortController(type);

    const pagination = this.getPagination(type) || {};

    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...params,
        '_extend[]': params._extend || params.extend || '@self.schema',
      };

      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema),
        {
          params: this._constructQueryParams(queryParams),
          signal: controller.signal,
        }
      );
      if (!response.ok)
        throw new Error(`Failed to fetch collection for ${register}/${schema}`);

      const data = response.data;

      // Process related names if present in response
      if (data.relatedNames) {
        this.processRelatedNamesFromResponse(data);
      }

      const paginationInfo = {
        total: data.total || 0,
        page: data.page || 1,
        pages:
          data.pages ||
          (data.next ? Math.ceil((data.total || 0) / (data.limit || 20)) : 1),
        limit: data.limit || 20,
        next: data.next || null,
        prev: data.prev || null,
      };

      this.setPagination(type, paginationInfo);
      this.setCollection(type, data.results, append);

      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.objects[type]) {
          this.objects[type] = {};
        }
        data.results.forEach((item) => {
          this.objects[type][item.id] = { ...item };
        });
      });

      this.setSuccess(type, true);
    } catch (error) {
      // Don't throw error if request was cancelled
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        console.info(`Request cancelled for ${type}`);
        return;
      }

      console.error(`Error fetching collection for ${type}:`, error);
      const formattedError = AcFormatErrorMessage(error) || error.message;
      this.setError(type, formattedError);
      this.setSuccess(type, false);
      throw error;
    } finally {
      this.setLoading(type, false);
      // Clean up abort controller
      this.abortControllers.delete(type);
    }
  };

  /**
   * Fetches a single object from the API
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {Object} [params={}] - Query parameters for the request
   */
  @action
  fetchObject = async (register, schema, id, params = {}) => {
    const type = `${register}_${schema}`;
    const requestType = `${type}_${id}`;
    this.setLoading(requestType, true);
    this.setError(type, null);
    this.setSuccess(type, null);

    // Create abort controller for request cancellation
    const controller = this._createAbortController(requestType);

    try {
      const queryParams = {
        ...params,
        _extend: params._extend || params.extend || '@self.schema',
      };

      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema, id),
        {
          params: this._constructQueryParams(queryParams),
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error(`Failed to fetch ${type} object`);

      const data = response.data;
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.objects[type]) this.objects[type] = {};
        this.objects[type][id] = data;
      });

      if (this.activeObjects[type]?.id === id) {
        await this.setActiveObject(register, schema, data);
      }

      this.setSuccess(type, true);
    } catch (error) {
      // Don't throw error if request was cancelled
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        console.info(`Request cancelled for ${requestType}`);
        return;
      }

      console.error(`Error fetching ${type} object:`, error);
      this.setError(type, error.message);
      this.setSuccess(type, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
      // Clean up abort controller
      this.abortControllers.delete(requestType);
    }
  };

  /**
   * Fetches related data for an object (logs, uses, used, files)
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {string} dataType - Type of related data ('logs', 'uses', 'used', 'files')
   * @param {Object} [params={}] - Query parameters for the request
   */
  @action
  fetchRelatedData = async (register, schema, id, dataType, params = {}) => {
    const type = `${register}_${schema}`;
    const requestType = `${type}_${id}_${dataType}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    // Create abort controller for request cancellation
    const controller = this._createAbortController(requestType);

    try {
      const queryParams = {
        ...params,
        ...(dataType === 'uses' || dataType === 'used'
          ? { _extend: params._extend || params.extend || '@self.schema' }
          : {}),
      };

      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema, id, dataType),
        {
          params: this._constructQueryParams(queryParams),
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error(`Failed to fetch ${dataType} for ${type}`);

      const data = response.data;
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.relatedData[type]) {
          this.relatedData[type] = {};
        }
      });

      if (data.total !== undefined || data.page !== undefined) {
        const paginationKey = `${type}_${dataType}`;
        const requestedLimit = params._limit || params.limit;
        const apiLimit = data.limit ? parseInt(data.limit, 10) : null;
        const actualLimit =
          apiLimit || requestedLimit || (dataType === 'files' ? 500 : 20);
        const paginationInfo = {
          total: data.total || 0,
          page: data.page || 1,
          pages: data.pages || Math.ceil((data.total || 0) / actualLimit),
          limit: actualLimit,
          next: data.next || null,
          prev: data.prev || null,
        };
        this.setPagination(paginationKey, paginationInfo);
      }

      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (dataType === 'logs') {
          this.relatedData[type][dataType] = data.results || [];
        } else {
          this.relatedData[type][dataType] = data;
        }
      });

      this.setSuccess(requestType, true);
    } catch (error) {
      // Don't throw error if request was cancelled
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        console.info(`Request cancelled for ${requestType}`);
        return;
      }

      console.error(`Error fetching ${dataType} for ${type}:`, error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
      // Clean up abort controller
      this.abortControllers.delete(requestType);
    }
  };

  /**
   * Fetches schema definition for a specific register and schema
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   * @param {string} [typeSuffix=null] - Suffix to add to the type (can be used separate page data from the same collection)
   */
  @action
  fetchSchema = async (schema, params = {}, typeSuffix = null) => {
    const schemaId = this.extractId(schema);
    params = params ?? {};

    if (!schemaId) {
      throw new Error('Could not extract schema ID');
    }

    const schemaType = this.getSchemaType(schema, typeSuffix);

    this.setSchemaLoading(schemaType, true);
    this.setSchemaError(schemaType, null);

    // Create abort controller for request cancellation
    const controller = this._createAbortController(schemaType);

    try {
      const endpoint = `/openregister/api/schemas/${schemaId}`;

      const response = await nextcloudApi.get(endpoint, {
        params: this._constructQueryParams(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schema for ${schemaType}`);
      }

      const schemaData = response.data;
      this.setSchema(schemaType, schemaData);

      // Initialize schema properties for this type
      this.initializeSchemaProperties(schemaType, schemaData);

      this.setSchemaError(schemaType, null);
    } catch (error) {
      // Don't throw error if request was cancelled
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        console.info(`Schema request cancelled for ${schemaType}`);
        return;
      }

      console.error(`Error fetching schema for ${schemaId}:`, error);
      const formattedError = AcFormatErrorMessage(error) || error.message;
      this.setSchemaError(schemaType, formattedError);
      throw error;
    } finally {
      this.setSchemaLoading(schemaType, false);
      // Clean up abort controller
      this.abortControllers.delete(schemaType);
    }
  };

  /**
   * Sets the schema loading state for a specific type
   * @param {string} type - The type identifier for the schema loading state
   * @param {boolean} isLoading - Whether the schema is currently loading
   */
  @action
  setSchemaLoading = (type, isLoading) => {
    this.schemaLoading[type] = isLoading;
  };

  /**
   * Sets the schema error state for a specific type
   * @param {string} type - The type identifier for the schema error state
   * @param {string|null} error - The error message or null to clear errors
   */
  @action
  setSchemaError = (type, error) => {
    this.schemaErrors[type] = error;
    if (error) {
      console.error('Schema error set for type:', type, error);
    }
  };

  /**
   * Sets schema data for a specific type
   * @param {string} type - The type identifier for the schema
   * @param {Object} schemaData - The schema data to set
   */
  @action
  setSchema = (type, schemaData) => {
    this.schemas[type] = schemaData;
  };

  /**
   * Fetches schemas related to a given schema
   * Stores the result under the schema key with a configurable suffix (defaults to 'related')
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   * @param {string|null} [typeSuffix='related'] - Optional suffix to store under a separate key
   */
  @action
  fetchSchemaRelated = async (schema, params = {}, typeSuffix = 'related') => {
    const schemaId = this.extractId(schema);
    if (!schemaId) {
      throw new Error('Could not extract schema ID');
    }

    const schemaType = this.getSchemaType(schema, typeSuffix);

    this.setSchemaLoading(schemaType, true);
    this.setSchemaError(schemaType, null);

    // Create abort controller for request cancellation
    const controller = this._createAbortController(schemaType);

    try {
      const endpoint = `/openregister/api/schemas/${schemaId}/related`;

      const response = await nextcloudApi.get(endpoint, {
        params: this._constructQueryParams(params || {}),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch related schemas for ${schemaType}`);
      }

      const relatedData = response.data;
      this.setSchema(schemaType, relatedData);
      this.setSchemaError(schemaType, null);
    } catch (error) {
      // Don't throw error if request was cancelled
      if (error.code === 'ERR_CANCELED' || error instanceof CanceledError) {
        console.info(`Schema related request cancelled for ${schemaType}`);
        return;
      }

      console.error(`Error fetching related schemas for ${schemaId}:`, error);
      this.setSchemaError(schemaType, error.message);
      throw error;
    } finally {
      this.setSchemaLoading(schemaType, false);
      // Clean up abort controller
      this.abortControllers.delete(schemaType);
    }
  };

  /**
   * Gets the related schemas for a given schema (stored using suffix, defaults to 'related')
   * @param {string|Object} schema - Schema identifier or object
   * @param {string|null} [typeSuffix='related'] - Optional suffix used when storing
   * @returns {Object|null} Related schemas response or null
   */
  getSchemaRelated = (schema, typeSuffix = 'related') => {
    const schemaType = this.getSchemaType(schema, typeSuffix);
    return this.schemas[schemaType] || null;
  };

  /**
   * Gets the schema for a specific type
   * @param {string} type - The type identifier
   * @returns {Object|null} The schema or null if not found
   */
  getSchema = (type) => this.schemas[type] || null;

  /**
   * Gets the schema properties for a specific type
   * @param {string} type - The type identifier
   * @returns {Object} The schema properties sorted by order
   */
  getSchemaProperties = (type) => {
    const schema = this.schemas[type];
    if (!schema?.properties) return {};

    return sortPropertiesByOrder(schema.properties);
  };

  /**
   * Checks if schema is currently loading for a specific type
   * @param {string} type - The type identifier
   * @returns {boolean} True if the schema is loading, false otherwise
   */
  isSchemaLoading = (type) => this.schemaLoading[type] || false;

  /**
   * Gets the schema error for a specific type
   * @param {string} type - The type identifier
   * @returns {string|null} Schema error message or null if no error
   */
  getSchemaError = (type) => this.schemaErrors[type] || null;

  /**
   * Clears schema data for a specific type
   * @param {string} type - The type identifier
   */
  @action
  clearSchema = (type) => {
    if (this.schemas[type]) {
      delete this.schemas[type];
    }
    if (this.schemaLoading[type]) {
      delete this.schemaLoading[type];
    }
    if (this.schemaErrors[type]) {
      delete this.schemaErrors[type];
    }
  };

  /**
   * Creates a new object
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} data - The object data to create
   * @returns {Object} The created object
   */
  @action
  createObject = async (register, schema, data) => {
    const type = `${register}_${schema}`;
    this.setLoading(`${type}_create`, true);
    this.setError(`${type}_create`, null);
    this.setSuccess(type, null);

    try {
      const response = await nextcloudApi.post(
        this._constructApiUrl(register, schema),
        data
      );
      if (!response.ok) throw new Error(`Failed to create ${type} object`);

      const newObject = response.data;
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.objects[type]) this.objects[type] = {};
        this.objects[type][newObject.id] = newObject;
      });

      await this.fetchCollection(register, schema);
      console.info(
        `✅ Collection refreshed after creating ${type} object:`,
        newObject.id
      );

      // Clear list cache since new object was created
      this.clearListCache(register, schema);
      console.info(`🗑️ Cleared list cache for ${register}/${schema} after creation`);

      await this.setActiveObject(register, schema, newObject);
      this.setSuccess(type, true);

      return newObject;
    } catch (error) {
      console.error(`Error creating ${type} object:`, error);
      this.setError(`${type}_create`, error.message);
      this.setSuccess(type, false);
      throw error;
    } finally {
      this.setLoading(`${type}_create`, false);
    }
  };

  /**
   * Saves an object (creates new or updates existing)
   * @param {Object} objectItem - The object to save
   * @returns {Object} Response object with response and data properties
   *
   * @note register and schema ar retrieved from the objectItem, if the objectItem doesnt have them, the object is not saved
   */
  @action
  saveObject = async (objectItem) => {
    const registerId = this.extractId(objectItem['@self']?.register);
    const schemaId = this.extractId(objectItem['@self']?.schema);

    if (!objectItem || !registerId || !schemaId) {
      throw new Error('Object item, register and schema are required');
    }

    const type = `${registerId}_${schemaId}`;
    const isNewObject = !objectItem['@self']?.id;
    const objectId = objectItem['@self']?.id;

    this.setLoading(`${type}_save`, true);
    this.setError(`${type}_save`, null);
    this.setSuccess(type, null);

    let endpoint = `/openregister/api/objects/${registerId}/${schemaId}`;
    if (!isNewObject && objectId) {
      endpoint += `/${objectId}`;
    }

    if (!objectItem['@self']) {
      objectItem['@self'] = {};
    }
    objectItem['@self'].updated = new Date().toISOString();

    try {
      const response = isNewObject
        ? await nextcloudApi.post(endpoint, objectItem)
        : await nextcloudApi.put(endpoint, objectItem);

      if (!response.ok) {
        throw new Error(
          `Failed to save object: ${response.status} ${response.statusText}`
        );
      }

      const data = response.data;

      // Update store state after successful save
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.objects[type]) this.objects[type] = {};
        this.objects[type][data.id] = data;

        // Update active object if it matches
        if (this.activeObjects[type]?.id === data.id) {
          this.activeObjects[type] = data;
        }
      });

      // Refresh the entire collection to ensure data consistency
      await this.fetchCollection(registerId, schemaId);

      // Clear list cache since object was saved
      this.clearListCache(registerId, schemaId);
      console.info(`🗑️ Cleared list cache for ${registerId}/${schemaId} after save`);

      console.info(`✅ Collection refreshed after saving ${type} object:`, data.id);
      this.setSuccess(type, true);
      return { response, data };
    } catch (error) {
      console.error('Error saving object:', error);
      this.setError(`${type}_save`, error.message);
      this.setSuccess(type, false);
      throw error;
    } finally {
      this.setLoading(`${type}_save`, false);
    }
  };

  /**
   * Updates an existing object
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {Object} data - The updated object data
   * @returns {Object} The updated object
   */
  @action
  updateObject = async (register, schema, id, data) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const type = `${registerId}_${schemaId}`;
    const requestType = `${type}_${id}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const response = await nextcloudApi.patch(
        this._constructApiUrl(register, schema, id),
        data
      );
      if (!response.ok) throw new Error(`Failed to update ${type} object`);

      const updatedObject = response.data;
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.objects[type]) this.objects[type] = {};
        this.objects[type][id] = updatedObject;
      });

      await this.fetchCollection(register, schema);
      console.info(`✅ Collection refreshed after updating ${type} object:`, id);

      // Clear list cache since object was updated
      this.clearListCache(register, schema);
      console.info(`🗑️ Cleared list cache for ${register}/${schema} after update`);

      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (this.activeObjects[type]?.id === id) {
          this.activeObjects[type] = updatedObject;
        }
      });

      this.setSuccess(requestType, true);

      return updatedObject;
    } catch (error) {
      console.error(`Error updating ${type} object:`, error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Patches an existing object
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {Object} data - The updated object data
   * @returns {Object} The updated object
   */
  @action
  patchObject = async (register, schema, id, data) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const type = `${registerId}_${schemaId}`;
    const requestType = `${type}_${id}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      console.info('🌐 PATCH Request:', {
        url: this._constructApiUrl(register, schema, id),
        data: JSON.stringify(data),
        dataKeys: Object.keys(data),
      });

      const response = await nextcloudApi.patch(
        this._constructApiUrl(register, schema, id),
        data
      );
      if (!response.ok) throw new Error(`Failed to patch ${type} object`);

      console.info('✅ PATCH Response:', {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        responseId: response.data?.id,
      });

      const updatedObject = response.data;
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (!this.objects[type]) this.objects[type] = {};
        this.objects[type][id] = updatedObject;
      });

      await this.fetchCollection(register, schema);
      console.info(`✅ Collection refreshed after patching ${type} object:`, id);

      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        if (this.activeObjects[type]?.id === id) {
          this.activeObjects[type] = updatedObject;
        }
      });

      this.setSuccess(requestType, true);

      return updatedObject;
    } catch (error) {
      console.error(`Error patching ${type} object:`, error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Deletes an object
   * @param {Object} objectItem - The object to delete with id, register, and schema information
   * @returns {boolean} True if deletion was successful
   */
  @action
  deleteObject = async (objectItem) => {
    const objectId = objectItem.id || objectItem['@self']?.id;
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (!objectId || !register || !schema) {
      throw new Error('Object must have id, register, and schema information');
    }

    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const requestType = `delete_${objectId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const endpoint = `/openregister/api/objects/${registerId}/${schemaId}/${objectId}`;

      const response = await nextcloudApi.delete(endpoint);

      if (!response.ok) {
        throw new Error(
          `Failed to delete object: ${response.status} ${response.statusText}`
        );
      }

      const isSelected = this.selectedObjects.some(
        (obj) => (obj.id || obj['@self']?.id) === objectId
      );
      if (isSelected) {
        const remainingSelected = this.selectedObjects.filter(
          (obj) => (obj.id || obj['@self']?.id) !== objectId
        );
        this.setSelectedObjects(remainingSelected);
      }

      // Clear list cache since object was deleted
      this.clearListCache(registerId, schemaId);
      console.info(
        `🗑️ Cleared list cache for ${registerId}/${schemaId} after deletion`
      );

      this.setSuccess(requestType, true);
      return true;
    } catch (error) {
      console.error('Error deleting object:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Publishes an object
   * @param {Object} objectItem - The object to publish with id, register, and schema information
   * @returns {Object} The updated object with publish status
   */
  @action
  publishObject = async (objectItem) => {
    const objectId = objectItem.id || objectItem['@self']?.id;
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (!objectId || !register || !schema) {
      throw new Error('Object must have id, register, and schema information');
    }

    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const requestType = `publish_${objectId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const endpoint = `/openregister/api/objects/${registerId}/${schemaId}/${objectId}/publish`;

      const response = await nextcloudApi.post(endpoint);

      if (!response.ok) {
        throw new Error(
          `Failed to publish object: ${response.status} ${response.statusText}`
        );
      }

      const updatedObject = response.data;

      // Update active object if it matches the published object
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        const objectType = this.getTypeFromObject(objectItem);
        const activeObject = this.activeObjects[objectType];
        if (
          activeObject &&
          (activeObject.id === objectId || activeObject['@self']?.id === objectId)
        ) {
          this.activeObjects[objectType] = updatedObject;
        }
      });

      const isSelected = this.selectedObjects.some(
        (obj) => (obj.id || obj['@self']?.id) === objectId
      );
      if (isSelected) {
        const remainingSelected = this.selectedObjects.filter(
          (obj) => (obj.id || obj['@self']?.id) !== objectId
        );
        this.setSelectedObjects(remainingSelected);
      }

      this.setSuccess(requestType, true);
      return updatedObject;
    } catch (error) {
      console.error('Error publishing object:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Depublishes an object
   * @param {Object} objectItem - The object to depublish with id, register, and schema information
   * @returns {Object} The updated object with depublish status
   */
  @action
  depublishObject = async (objectItem) => {
    const objectId = objectItem.id || objectItem['@self']?.id;
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (!objectId || !register || !schema) {
      throw new Error('Object must have id, register, and schema information');
    }

    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const requestType = `depublish_${objectId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const endpoint = `/openregister/api/objects/${registerId}/${schemaId}/${objectId}/depublish`;

      const response = await nextcloudApi.post(endpoint);

      if (!response.ok) {
        throw new Error(
          `Failed to depublish object: ${response.status} ${response.statusText}`
        );
      }

      const updatedObject = response.data;

      // Update active object if it matches the depublished object
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        const objectType = this.getTypeFromObject(objectItem);
        const activeObject = this.activeObjects[objectType];
        if (
          activeObject &&
          (activeObject.id === objectId || activeObject['@self']?.id === objectId)
        ) {
          this.activeObjects[objectType] = updatedObject;
        }
      });

      const isSelected = this.selectedObjects.some(
        (obj) => (obj.id || obj['@self']?.id) === objectId
      );
      if (isSelected) {
        const remainingSelected = this.selectedObjects.filter(
          (obj) => (obj.id || obj['@self']?.id) !== objectId
        );
        this.setSelectedObjects(remainingSelected);
      }

      this.setSuccess(requestType, true);
      return updatedObject;
    } catch (error) {
      console.error('Error depublishing object:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Create a koppeling (link) between two 'voorzieninggebruik' objects
   * @param {string} vanId - ID of the source gebruik
   * @param {string} naarId - ID of the target gebruik
   * @returns {boolean} True if the koppeling was created successfully
   *
   * @note this is HEAVILY WIP. I am not even sure if koppeling is the right endpoint, or if I need to do something with data
   */
  @action
  linkGebruik = async (vanId, naarId) => {
    const requestType = this.getTypeFromParams(
      'voorzieningen',
      'voorzieninggebruik',
      null,
      'link'
    );

    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const endpoint = `/openregister/api/objects/voorzieningen/koppeling`;
      const response = await nextcloudApi.post(endpoint, {
        van: vanId,
        naar: naarId,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to link gebruiken: ${response.status} ${response.statusText}`
        );
      }

      this.setSuccess(requestType, true);
      return true;
    } catch (error) {
      console.error('Error creating koppeling between gebruiken:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Locks an object
   * @param {Object} objectItem - The object to lock with id, register, and schema information
   * @param {string|null} [process=null] - The process name for locking
   * @param {number|null} [duration=null] - Lock duration in seconds
   * @returns {Object} The updated object with lock status
   */
  @action
  lockObject = async (objectItem, process = null, duration = null) => {
    const objectId = objectItem.id || objectItem['@self']?.id;
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (!objectId || !register || !schema) {
      throw new Error('Object must have id, register, and schema information');
    }

    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const requestType = `lock_${objectId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const endpoint = `/openregister/api/objects/${registerId}/${schemaId}/${objectId}/lock`;

      const body = {};
      if (process) body.process = process;
      if (duration) body.duration = duration;

      const response = await nextcloudApi.post(endpoint, body);

      if (!response.ok) {
        throw new Error(
          `Failed to lock object: ${response.status} ${response.statusText}`
        );
      }

      const updatedObject = response.data;

      // Update active object if it matches the locked object
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        const objectType = this.getTypeFromObject(objectItem);
        const activeObject = this.activeObjects[objectType];
        if (
          activeObject &&
          (activeObject.id === objectId || activeObject['@self']?.id === objectId)
        ) {
          this.activeObjects[objectType] = updatedObject;
        }
      });

      this.setSuccess(requestType, true);
      return updatedObject;
    } catch (error) {
      console.error('Error locking object:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Unlocks an object
   * @param {Object} objectItem - The object to unlock with id, register, and schema information
   * @returns {Object} The updated object with lock status
   */
  @action
  unlockObject = async (objectItem) => {
    const objectId = objectItem.id || objectItem['@self']?.id;
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (!objectId || !register || !schema) {
      throw new Error('Object must have id, register, and schema information');
    }

    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    const requestType = `unlock_${objectId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);
    this.setSuccess(requestType, null);

    try {
      const endpoint = `/openregister/api/objects/${registerId}/${schemaId}/${objectId}/unlock`;

      const response = await nextcloudApi.post(endpoint);

      if (!response.ok) {
        throw new Error(
          `Failed to unlock object: ${response.status} ${response.statusText}`
        );
      }

      const updatedObject = response.data;

      // Update active object if it matches the unlocked object
      runInAction(() => {
        // run in action to avoid Strict MobX warnings
        const objectType = this.getTypeFromObject(objectItem);
        const activeObject = this.activeObjects[objectType];
        if (
          activeObject &&
          (activeObject.id === objectId || activeObject['@self']?.id === objectId)
        ) {
          this.activeObjects[objectType] = updatedObject;
        }
      });

      this.setSuccess(requestType, true);
      return updatedObject;
    } catch (error) {
      console.error('Error unlocking object:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Sets search term for a specific type with debouncing
   * @param {string} type - The type identifier for search
   * @param {string} term - The search term
   */
  @action
  setSearchTerm = (type, term) => {
    if (!this.searchTerms[type]) {
      this.searchTerms[type] = '';
    }

    this.searchTerms[type] = term;

    if (this.searchDebounceTimers[type]) {
      clearTimeout(this.searchDebounceTimers[type]);
    }

    this.searchDebounceTimers[type] = setTimeout(() => {
      const [register, schema] = type.split('_');
      this.fetchCollection(register, schema, term ? { _search: term } : {});
    }, 500);
  };

  /**
   * Clears search term for a specific type
   * @param {string} type - The type identifier for search
   */
  @action
  clearSearchTerm = (type) => {
    this.searchTerms[type] = '';

    if (this.searchDebounceTimers[type]) {
      clearTimeout(this.searchDebounceTimers[type]);
      this.searchDebounceTimers[type] = null;
    }

    const [register, schema] = type.split('_');
    this.fetchCollection(register, schema);
  };

  /**
   * Loads the next page of results for a collection
   * @param {string} type - The type identifier for the collection
   */
  @action
  loadMore = async (type) => {
    const pagination = this.pagination[type];
    const [register, schema] = type.split('_');

    if (pagination.next) {
      const url = new URL(pagination.next);
      const params = Object.fromEntries(url.searchParams);
      await this.fetchCollection(register, schema, params, true);
    } else if (pagination.page < pagination.pages) {
      await this.fetchCollection(
        register,
        schema,
        {
          _page: pagination.page + 1,
          _limit: pagination.limit,
        },
        true
      );
    }
  };

  /**
   * Loads the previous page of results for a collection
   * @param {string} type - The type identifier for the collection
   */
  @action
  loadPrevious = async (type) => {
    const pagination = this.pagination[type];
    const [register, schema] = type.split('_');

    if (pagination.prev) {
      const url = new URL(pagination.prev);
      const params = Object.fromEntries(url.searchParams);
      await this.fetchCollection(register, schema, params, false);
    } else if (pagination.page > 1) {
      await this.fetchCollection(
        register,
        schema,
        {
          _page: pagination.page - 1,
          _limit: pagination.limit,
        },
        false
      );
    }
  };

  // Mass operations
  /**
   * Deletes multiple objects in parallel
   * @param {Array<Object>} objects - Array of objects to delete
   * @param {Function|null} [onProgress=null] - Progress callback function
   * @returns {Object} Object with successful and failed operations
   */
  @action
  massDeleteObjects = async (objects, onProgress = null) => {
    this.clearAllObjectErrors();

    const results = await Promise.allSettled(
      objects.map(async (obj) => {
        try {
          const objectId =
            typeof obj === 'string' ? obj : obj.id || obj['@self']?.id;
          const objectToDelete = typeof obj === 'string' ? { id: obj } : obj;

          await this.deleteObject(objectToDelete);
          this.clearObjectError(objectId);

          if (onProgress) {
            onProgress(obj, true);
          }

          return { success: true, id: objectId, object: obj };
        } catch (error) {
          const objectId = obj.id || obj['@self']?.id;
          const errorMessage = error.message || 'Unknown error';

          this.setObjectError(objectId, errorMessage);

          if (onProgress) {
            onProgress(obj, false, errorMessage);
          }

          return { success: false, id: objectId, object: obj, error: errorMessage };
        }
      })
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => r.value);
    const failed = results
      .filter(
        (r) =>
          r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      )
      .map((r) => r.value || { success: false, error: 'Unknown error' });

    if (successful.length > 0) {
      const successfulIds = successful.map((r) => r.id);
      const remainingSelected = this.selectedObjects.filter(
        (id) => !successfulIds.includes(id)
      );
      this.setSelectedObjects(remainingSelected);
    }

    return { successful, failed };
  };

  /**
   * Publishes multiple objects in parallel
   * @param {Array<Object>} objects - Array of objects to publish
   * @param {Function|null} [onProgress=null] - Progress callback function
   * @returns {Object} Object with successful and failed operations
   */
  @action
  massPublishObjects = async (objects, onProgress = null) => {
    this.clearAllObjectErrors();

    const results = await Promise.allSettled(
      objects.map(async (obj) => {
        try {
          const objectId = obj.id || obj['@self']?.id;
          await this.publishObject(obj);
          this.clearObjectError(objectId);

          if (onProgress) {
            onProgress(obj, true);
          }

          return { success: true, id: objectId, object: obj };
        } catch (error) {
          const objectId = obj.id || obj['@self']?.id;
          const errorMessage = error.message || 'Unknown error';

          this.setObjectError(objectId, errorMessage);

          if (onProgress) {
            onProgress(obj, false, errorMessage);
          }

          return { success: false, id: objectId, object: obj, error: errorMessage };
        }
      })
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => r.value);
    const failed = results
      .filter(
        (r) =>
          r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      )
      .map((r) => r.value || { success: false, error: 'Unknown error' });

    if (successful.length > 0) {
      const successfulIds = successful.map((r) => r.id);
      const remainingSelected = this.selectedObjects.filter(
        (id) => !successfulIds.includes(id)
      );
      this.setSelectedObjects(remainingSelected);
    }

    return { successful, failed };
  };

  /**
   * Depublishes multiple objects in parallel
   * @param {Array<Object>} objects - Array of objects to depublish
   * @param {Function|null} [onProgress=null] - Progress callback function
   * @returns {Object} Object with successful and failed operations
   */
  @action
  massDepublishObjects = async (objects, onProgress = null) => {
    this.clearAllObjectErrors();

    const results = await Promise.allSettled(
      objects.map(async (obj) => {
        try {
          const objectId = obj.id || obj['@self']?.id;
          await this.depublishObject(obj);
          this.clearObjectError(objectId);

          if (onProgress) {
            onProgress(obj, true);
          }

          return { success: true, id: objectId, object: obj };
        } catch (error) {
          const objectId = obj.id || obj['@self']?.id;
          const errorMessage = error.message || 'Unknown error';

          this.setObjectError(objectId, errorMessage);

          if (onProgress) {
            onProgress(obj, false, errorMessage);
          }

          return { success: false, id: objectId, object: obj, error: errorMessage };
        }
      })
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => r.value);
    const failed = results
      .filter(
        (r) =>
          r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      )
      .map((r) => r.value || { success: false, error: 'Unknown error' });

    if (successful.length > 0) {
      const successfulIds = successful.map((r) => r.id);
      const remainingSelected = this.selectedObjects.filter(
        (id) => !successfulIds.includes(id)
      );
      this.setSelectedObjects(remainingSelected);
    }

    return { successful, failed };
  };

  /**
   * Locks multiple objects in parallel
   * @param {Array<Object>} objects - Array of objects to lock
   * @param {string|null} [process=null] - The process name for locking
   * @param {number|null} [duration=null] - Lock duration in seconds
   * @param {Function|null} [onProgress=null] - Progress callback function
   * @returns {Object} Object with successful and failed operations
   */
  @action
  massLockObjects = async (
    objects,
    process = null,
    duration = null,
    onProgress = null
  ) => {
    this.clearAllObjectErrors();

    const results = await Promise.allSettled(
      objects.map(async (obj) => {
        try {
          const objectId = obj.id || obj['@self']?.id;
          await this.lockObject(obj, process, duration);
          this.clearObjectError(objectId);

          if (onProgress) {
            onProgress(obj, true);
          }

          return { success: true, id: objectId, object: obj };
        } catch (error) {
          const objectId = obj.id || obj['@self']?.id;
          const errorMessage = error.message || 'Unknown error';

          this.setObjectError(objectId, errorMessage);

          if (onProgress) {
            onProgress(obj, false, errorMessage);
          }

          return { success: false, id: objectId, object: obj, error: errorMessage };
        }
      })
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => r.value);
    const failed = results
      .filter(
        (r) =>
          r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      )
      .map((r) => r.value || { success: false, error: 'Unknown error' });

    if (successful.length > 0) {
      const successfulIds = successful.map((r) => r.id);
      const remainingSelected = this.selectedObjects.filter(
        (id) => !successfulIds.includes(id)
      );
      this.setSelectedObjects(remainingSelected);
    }

    return { successful, failed };
  };

  /**
   * Unlocks multiple objects in parallel
   * @param {Array<Object>} objects - Array of objects to unlock
   * @param {Function|null} [onProgress=null] - Progress callback function
   * @returns {Object} Object with successful and failed operations
   */
  @action
  massUnlockObjects = async (objects, onProgress = null) => {
    this.clearAllObjectErrors();

    const results = await Promise.allSettled(
      objects.map(async (obj) => {
        try {
          const objectId = obj.id || obj['@self']?.id;
          await this.unlockObject(obj);
          this.clearObjectError(objectId);

          if (onProgress) {
            onProgress(obj, true);
          }

          return { success: true, id: objectId, object: obj };
        } catch (error) {
          const objectId = obj.id || obj['@self']?.id;
          const errorMessage = error.message || 'Unknown error';

          this.setObjectError(objectId, errorMessage);

          if (onProgress) {
            onProgress(obj, false, errorMessage);
          }

          return { success: false, id: objectId, object: obj, error: errorMessage };
        }
      })
    );

    const successful = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => r.value);
    const failed = results
      .filter(
        (r) =>
          r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      )
      .map((r) => r.value || { success: false, error: 'Unknown error' });

    if (successful.length > 0) {
      const successfulIds = successful.map((r) => r.id);
      const remainingSelected = this.selectedObjects.filter(
        (id) => !successfulIds.includes(id)
      );
      this.setSelectedObjects(remainingSelected);
    }

    return { successful, failed };
  };

  /**
   * Upload a single file (attachment) to an object via multipart/form-data
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {File|Blob} file - The file to upload
   * @param {Array<string>} [labels=[]] - Optional labels to associate
   * @param {boolean} [share=false] - Optional share flag
   * @returns {Object} API response data
   */
  @action
  uploadObjectFile = async (
    register,
    schema,
    id,
    file,
    labels = [],
    share = false
  ) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId || !id) {
      throw new Error('register, schema and id are required to upload a file');
    }

    const filesType = this.getTypeFromParams(registerId, schemaId, id, 'files');
    const requestType = `${filesType}_upload`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const form = new FormData();
      form.append('files', file);

      if (Array.isArray(labels)) {
        labels.forEach((label) => form.append('tags', label));
      } else if (labels) {
        form.append('tags', labels);
      }

      if (share !== undefined && share !== null) {
        form.append('share', String(share));
      }

      const baseUrl = this._constructApiUrl(registerId, schemaId, id);
      const endpoint = `${baseUrl}/filesMultipart`;
      const response = await nextcloudApi.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to upload file: ${response.status} ${response.statusText}`
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      this.setError(requestType, error.message);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Delete a specific file (attachment) from an object
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {string} fileId - File ID to delete
   * @returns {boolean} True if deletion was successful
   */
  @action
  deleteObjectFile = async (register, schema, id, fileId) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId || !id || !fileId) {
      throw new Error(
        'register, schema, id and fileId are required to delete a file'
      );
    }

    const filesType = this.getTypeFromParams(registerId, schemaId, id, 'files');
    const requestType = `${filesType}_delete_${fileId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const encoded = encodeURIComponent(fileId);
      const filesBase = this._constructApiUrl(registerId, schemaId, id, 'files');
      const endpoint = `${filesBase}/${encoded}`;
      const response = await nextcloudApi.delete(endpoint);

      if (!response.ok) {
        throw new Error(
          `Failed to delete file: ${response.status} ${response.statusText}`
        );
      }

      this.setSuccess(requestType, true);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Publish a specific file (attachment) for an object
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {string} fileId - File ID to publish
   * @returns {Object} Response data
   */
  @action
  publishObjectFile = async (register, schema, id, fileId) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId || !id || !fileId) {
      throw new Error(
        'register, schema, id and fileId are required to publish a file'
      );
    }

    const filesType = this.getTypeFromParams(registerId, schemaId, id, 'files');
    const requestType = `${filesType}_publish_${fileId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const encoded = encodeURIComponent(fileId);
      const filesBase = this._constructApiUrl(registerId, schemaId, id, 'files');
      const endpoint = `${filesBase}/${encoded}/publish`;
      const response = await nextcloudApi.post(endpoint);
      if (!response.ok) {
        throw new Error(
          `Failed to publish file: ${response.status} ${response.statusText}`
        );
      }
      this.setSuccess(requestType, true);
      return response.data;
    } catch (error) {
      console.error('Error publishing file:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Depublish a specific file (attachment) for an object
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {string} id - The object ID
   * @param {string} fileId - File ID to depublish
   * @returns {Object} Response data
   */
  @action
  depublishObjectFile = async (register, schema, id, fileId) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId || !id || !fileId) {
      throw new Error(
        'register, schema, id and fileId are required to depublish a file'
      );
    }

    const filesType = this.getTypeFromParams(registerId, schemaId, id, 'files');
    const requestType = `${filesType}_depublish_${fileId}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const encoded = encodeURIComponent(fileId);
      const filesBase = this._constructApiUrl(registerId, schemaId, id, 'files');
      const endpoint = `${filesBase}/${encoded}/depublish`;
      const response = await nextcloudApi.post(endpoint);
      if (!response.ok) {
        throw new Error(
          `Failed to depublish file: ${response.status} ${response.statusText}`
        );
      }
      this.setSuccess(requestType, true);
      return response.data;
    } catch (error) {
      console.error('Error depublishing file:', error);
      this.setError(requestType, error.message);
      this.setSuccess(requestType, false);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Fetch tags for attachments
   * @returns {Array} Array of tag values
   */
  @action
  fetchTags = async () => {
    const requestType = `tags_fetch`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const response = await nextcloudApi.get('/openregister/api/tags');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch tags: ${response.status} ${response.statusText}`
        );
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      this.setError(requestType, error.message);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Convenience wrapper to fetch files related data
   * @param {string|Object} register
   * @param {string|Object} schema
   * @param {string} id
   * @param {Object} params
   */
  @action
  fetchObjectFiles = async (
    register,
    schema,
    id,
    params = { _limit: 500, _page: 1 }
  ) => {
    return this.fetchRelatedData(register, schema, id, 'files', params);
  };

  // Getters for accessing state
  /**
   * Checks if a specific type is currently loading
   * @param {string} type - The type identifier
   * @returns {boolean} True if the type is loading, false otherwise
   */
  isLoading = (type) => this.loading[type] || false;

  /**
   * Gets the error for a specific type
   * @param {string} type - The type identifier
   * @returns {string|null} Error message or null if no error
   */
  getError = (type) => this.errors[type] || null;

  /**
   * Gets the collection data for a specific type
   * @param {string} type - The type identifier
   * @returns {Object} Collection object with results array
   */
  getCollection = (type) => {
    return this.collections[type] || { results: [] };
  };

  /**
   * Gets the search term for a specific type
   * @param {string} type - The type identifier
   * @returns {string} Current search term or empty string
   */
  getSearchTerm = (type) => this.searchTerms[type] || '';

  /**
   * Gets a specific object by type and ID
   * @param {string} type - The type identifier
   * @param {string} id - The object ID
   * @returns {Object|null} The object or null if not found
   */
  getObject = (type, id) => this.objects[type]?.[id] || null;

  /**
   * Gets the active object for a specific type
   * @param {string} type - The type identifier
   * @returns {Object|null} The active object or null if none
   */
  getActiveObject = (type) => this.activeObjects[type] || null;

  /**
   * Gets related data for a specific type and data type
   * @param {string} type - The type identifier
   * @param {string} dataType - The data type ('logs', 'uses', 'used', 'files')
   * @returns {Object|null} The related data or null if not found
   */
  getRelatedData = (type, dataType) => this.relatedData[type]?.[dataType] || null;

  /**
   * Gets pagination information for a specific type
   * @param {string} type - The type identifier
   * @returns {Object} Pagination object with total, page, pages, limit, next, prev
   */
  getPagination = (type) => {
    if (this.pagination[type]) {
      return this.pagination[type];
    }
    const defaultLimit = type.includes('files') ? 500 : 20;
    return { total: 0, page: 1, pages: 1, limit: defaultLimit };
  };

  /**
   * Checks if there are more pages available for a collection
   * @param {string} type - The type identifier
   * @returns {boolean} True if more pages are available
   */
  hasMorePages = (type) => {
    const pagination = this.pagination[type];
    return pagination
      ? pagination.next !== null || pagination.page < pagination.pages
      : false;
  };

  /**
   * Checks if there are previous pages available for a collection
   * @param {string} type - The type identifier
   * @returns {boolean} True if previous pages are available
   */
  hasPreviousPages = (type) => {
    const pagination = this.pagination[type];
    return pagination ? pagination.prev !== null || pagination.page > 1 : false;
  };

  /**
   * Gets audit trails for a specific type
   * @param {string} type - The type identifier
   * @returns {Array} Array of audit trail entries
   */
  getAuditTrails = (type) => this.relatedData[type]?.logs || [];

  /**
   * Gets the current state (success/error) for a specific type
   * @param {string} type - The type identifier
   * @returns {Object} Object with success and error properties
   */
  getState = (type) => ({
    success: this.success[type] || null,
    error: this.errors[type] || null,
  });

  /**
   * Gets the error for a specific object
   * @param {string} objectId - The object ID
   * @returns {string|null} Error message or null if no error
   */
  getObjectError = (objectId) => this.objectErrors[objectId] || null;

  /**
   * Gets enabled schema properties for column filtering for a specific type
   * @param {string} type - The object type identifier
   * @returns {Array<Object>} Array of enabled schema properties
   */
  getEnabledSchemaProperties = (type) =>
    this.getEnabledSchemaPropertiesForType(type);

  /**
   * Gets column filters for a specific type
   * @param {string} type - The object type identifier
   * @returns {Object} Object containing column filters for the type
   */
  getColumnFilters = (type) => this.columnFilters[type] || {};

  /**
   * Clears schema properties for a specific type
   * @param {string} type - The object type identifier
   */
  @action
  clearSchemaProperties = (type) => {
    if (this.schemaProperties[type]) {
      delete this.schemaProperties[type];
    }
    if (this.columnFilters[type]) {
      delete this.columnFilters[type];
    }
  };

  /**
   * Creates a default object based on a schema definition
   * @param {Object} schema - The schema object containing properties definition
   * @param {Object} overrides - Optional object with property overrides
   * @returns {Object} Default object with schema-driven structure and values
   *
   * @example
   * const schema = {
   *   properties: {
   *     naam: { type: 'string', default: 'Default Name' },
   *     beschrijving: { type: 'string' },
   *     aantal: { type: 'integer', default: 0 },
   *     actief: { type: 'boolean', default: true },
   *     tags: { type: 'array' },
   *     metadata: { type: 'object' }
   *   }
   * };
   * const defaultObj = store.object.createDefaultObjectFromSchema(schema, { naam: 'Custom Name' });
   * // Result: { naam: 'Custom Name', beschrijving: '', aantal: 0, actief: true, tags: [], metadata: {} }
   */
  createDefaultObjectFromSchema = (schema, overrides = {}) => {
    if (!schema?.properties) {
      console.warn(
        'createDefaultObjectFromSchema: Invalid schema provided, returning empty object'
      );
      return { ...overrides };
    }

    const defaultObject = {};

    Object.entries(schema.properties).forEach(([key, property]) => {
      // Check for explicit default value in schema
      if (property.default !== undefined) {
        defaultObject[key] = property.default;
      }
      // Set empty values based on property type
      else if (property.type === 'string') {
        defaultObject[key] = '';
      } else if (property.type === 'array') {
        defaultObject[key] = [];
      } else if (property.type === 'object') {
        defaultObject[key] = property.$ref ? null : {}; // null for $ref objects, {} for plain objects
      } else if (property.type === 'boolean') {
        defaultObject[key] = false;
      } else if (property.type === 'number' || property.type === 'integer') {
        defaultObject[key] = 0;
      } else {
        // Fallback for unknown types
        defaultObject[key] = null;
      }
    });

    // Apply overrides
    return { ...defaultObject, ...overrides };
  };

  /**
   * Creates multiple default objects from multiple schemas
   * @param {Object} schemas - Object containing multiple schema definitions keyed by type
   * @param {Object} overridesByType - Optional overrides per schema type
   * @returns {Object} Object containing default objects keyed by schema type
   *
   * @example
   * const schemas = {
   *   product: { properties: { naam: { type: 'string' }, website: { type: 'string' } } },
   *   organisatie: { properties: { naam: { type: 'string' }, email: { type: 'string' } } }
   * };
   * const defaults = store.object.createDefaultObjectsFromSchemas(schemas, {
   *   product: { naam: 'My Product' }
   * });
   * // Result: { product: { naam: 'My Product', website: '' }, organisatie: { naam: '', email: '' } }
   */
  createDefaultObjectsFromSchemas = (schemas, overridesByType = {}) => {
    const results = {};

    Object.entries(schemas).forEach(([schemaType, schema]) => {
      const overrides = overridesByType[schemaType] || {};
      results[schemaType] = this.createDefaultObjectFromSchema(schema, overrides);
    });

    return results;
  };

  // ===============================
  // CACHE-FIRST METHODS FOR IMMEDIATE RESPONSES
  // ===============================

  /**
   * Generates a cache key that includes relevant query parameters
   * @param {string} registerId - Register identifier
   * @param {string} schemaId - Schema identifier
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   */
  generateCacheKey = (registerId, schemaId, params = {}) => {
    const baseKey = `${registerId}_${schemaId}`;

    // Parameters that should NOT affect cache (pagination, display, etc.)
    const excludedParams = new Set([
      '_page',
      '_limit',
      '_sort',
      '_order',
      '_fields',
      '_extend', // Usually for response format, not content filtering
      '_extend[]', // Usually for response format, not content filtering
      'page',
      'limit',
      'offset',
    ]);

    // Get all parameters that should affect the cache
    const relevantParams = Object.entries(params)
      .filter(([key]) => !excludedParams.has(key))
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b)); // Sort for consistent cache keys

    if (relevantParams.length === 0) {
      return baseKey;
    }

    // Create a hash of the relevant parameters for a clean cache key
    const paramsString = relevantParams
      .map(([key, value]) => {
        // Handle arrays and objects
        const serializedValue = Array.isArray(value)
          ? value.sort().join(',')
          : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
        return `${key}=${serializedValue}`;
      })
      .join('&');

    // Create a simple hash of the params string to keep cache keys manageable
    const paramsHash = this.simpleHash(paramsString);

    return `${baseKey}_${paramsHash}`;
  };

  /**
   * Simple hash function for creating consistent short hashes
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  simpleHash = (str) => {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36); // Base36 for shorter strings
  };

  /**
   * Gets cached data for immediate response, triggers background refresh if needed
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   * @returns {Object|null} Cached data or null if no cache exists
   */
  @action
  getCachedList = (register, schema, params = {}) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) return null;

    // Generate cache key that includes critical parameters
    const cacheKey = this.generateCacheKey(registerId, schemaId, params);

    const cached = this.listCache[cacheKey];
    if (!cached) return null;

    // Check if cache is still valid
    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > this.cacheConfig.maxAge) {
      // Cache is too old, remove it
      this.clearListCache(register, schema, params);
      return null;
    }

    // Check if we should refresh in background
    if (age > this.cacheConfig.backgroundRefreshThreshold) {
      // Trigger background refresh (don't await)
      this.refreshListInBackground(register, schema, params);
    }

    return cached.data;
  };

  /**
   * Sets cached data for a register/schema combination
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Array} data - Array of objects to cache
   * @param {Object} [params={}] - Query parameters used for the request
   */
  @action
  setCachedList = (register, schema, data, params = {}) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) return;

    // Generate cache key that includes critical parameters
    const cacheKey = this.generateCacheKey(registerId, schemaId, params);

    this.listCache[cacheKey] = {
      data: data || [],
      timestamp: Date.now(),
      params: { ...params },
    };
  };

  /**
   * Clears cached data for a specific register/schema combination
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters to identify specific cache entry
   */
  @action
  clearListCache = (register, schema, params = {}) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) return;

    // Generate cache key that includes critical parameters
    const cacheKey = this.generateCacheKey(registerId, schemaId, params);

    if (this.listCache[cacheKey]) {
      delete this.listCache[cacheKey];
    }
  };

  /**
   * Clears all cached data
   */
  @action
  clearAllListCaches = () => {
    this.listCache = {};
  };

  /**
   * Refreshes cached data in the background without blocking the UI
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   */
  refreshListInBackground = async (register, schema, params = {}) => {
    try {
      const registerId = this.extractId(register);
      const schemaId = this.extractId(schema);

      console.info(`🔄 Background refresh for ${registerId}/${schemaId}`);

      // Fetch fresh data without updating loading states (background operation)
      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema),
        {
          params: this._constructQueryParams(params),
        }
      );

      if (response.ok) {
        const data = response.data;
        const results = data.results || [];

        // Process related names if present in response
        if (data.relatedNames) {
          this.processRelatedNamesFromResponse(data);
        }

        // Update cache with fresh data
        this.setCachedList(register, schema, results, params);

        console.info(
          `✅ Background refresh completed for ${registerId}/${schemaId} (${results.length} items)`
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ Background refresh failed for ${register}/${schema}:`,
        error.message
      );
      // Don't throw - this is a background operation
    }
  };

  /**
   * Cache-first fetch method that provides immediate response from cache,
   * then refreshes data in background if needed
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   * @returns {Array} Array of objects (from cache or fresh fetch)
   */
  @action
  fetchListCacheFirst = async (register, schema, params = {}) => {
    const registerId = this.extractId(register);
    const schemaId = this.extractId(schema);

    if (!registerId || !schemaId) {
      throw new Error('Could not extract register or schema ID');
    }

    // Try to get cached data first
    const cachedData = this.getCachedList(register, schema, params);
    if (cachedData) {
      console.info(
        `⚡ Immediate response from cache for ${registerId}/${schemaId} (${cachedData.length} items)`
      );
      return cachedData;
    }

    // No cache available, do a fresh fetch
    console.info(`🌐 Fresh fetch for ${registerId}/${schemaId} (no cache)`);

    const type = this.getTypeFromParams(registerId, schemaId);
    this.setLoading(type, true);

    try {
      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema),
        {
          params: this._constructQueryParams(params),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${registerId}/${schemaId}`);
      }

      const data = response.data;
      const results = data.results || [];

      // Process related names if present in response
      if (data.relatedNames) {
        this.processRelatedNamesFromResponse(data);
      }

      // Cache the fresh data
      this.setCachedList(register, schema, results, params);

      console.info(
        `✅ Fresh fetch completed for ${registerId}/${schemaId} (${results.length} items)`
      );

      return results;
    } catch (error) {
      console.error(`❌ Failed to fetch ${registerId}/${schemaId}:`, error);
      throw error;
    } finally {
      this.setLoading(type, false);
    }
  };

  /**
   * Convenience method for fetching VNG-GEMMA elements with cache-first strategy
   * @param {string} gemmaType - Type of GEMMA element ('Referentiecomponent', 'standaard', etc.)
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Array} Array of GEMMA elements
   */
  @action
  fetchGemmaElementsCacheFirst = async (gemmaType, params = {}) => {
    const queryParams = {
      _limit: params._limit || 500,
      _page: params._page || 1,
      gemmaType: gemmaType,
      ...params,
    };

    return this.fetchListCacheFirst('vng-gemma', 'element', queryParams);
  };

  /**
   * Convenience method for fetching modules with cache-first strategy
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Array} Array of modules
   */
  @action
  fetchModulesCacheFirst = async (params = {}) => {
    const queryParams = {
      _limit: params._limit || 20,
      _page: params._page || 1,
      ...params,
    };

    return this.fetchListCacheFirst('voorzieningen', 'module', queryParams);
  };

  // ===============================
  // NAMES CACHE SYSTEM FOR UUID → NAME RESOLUTION
  // ===============================

  /**
   * Gets a single name from cache, falls back to backend if not found
   * @param {string} id - The UUID to resolve to a name
   * @returns {Promise<string>} The name for the given ID, or the ID if no name found
   */
  @action
  getNamesForSingleId = async (id) => {
    if (!id) return id;

    // Check cache first
    const cached = this.namesCache[id];
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.namesCacheConfig.maxAge) {
        console.info(`📋 Name cache hit for ${id}: ${cached.name}`);
        return cached.name;
      }
      // Cache expired, remove it
      delete this.namesCache[id];
    }

    // Fallback to backend
    try {
      console.info(`🌐 Fetching name for ${id} from backend`);
      const response = await nextcloudApi.get(`/openregister/api/names/${id}`);

      if (response.ok && response.data?.names?.[id]) {
        const name = response.data.names[id];
        this.setNamesInCache({ [id]: name });
        console.info(`✅ Single name fetched for ${id}: ${name}`);
        return name;
      } else if (response.ok && response.data?.name) {
        // Fallback for different response format
        const name = response.data.name;
        this.setNamesInCache({ [id]: name });
        console.info(`✅ Single name fetched (alt format) for ${id}: ${name}`);
        return name;
      } else if (response.ok) {
        // API responded OK but no name found - cache the UUID to prevent future calls
        console.info(
          `📝 No name found for ${id}, caching UUID to prevent future API calls`
        );
        this.setNamesInCache({ [id]: id });
        return id;
      }
    } catch (error) {
      // Handle 404 and other HTTP errors by caching the UUID to prevent repeated calls
      if (error.response?.status === 404 || error.response?.status >= 400) {
        console.info(
          `🚫 Name not found (${
            error.response?.status || 'error'
          }) for ${id}, caching UUID to prevent future API calls`
        );
        this.setNamesInCache({ [id]: id });
        return id;
      }
      console.warn(`⚠️ Failed to fetch name for ${id}:`, error.message);
    }

    // Return ID as fallback if no name found
    return id;
  };

  /**
   * Gets multiple names from cache, falls back to backend for missing ones
   * @param {string[]} ids - Array of UUIDs to resolve to names
   * @returns {Promise<{[id: string]: string}>} Object with id -> name mappings
   */
  @action
  getNamesForMultipleIds = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return {};

    const results = {};
    const missingIds = [];

    // Check cache for existing names
    ids.forEach((id) => {
      if (!id) {
        results[id] = id;
        return;
      }

      const cached = this.namesCache[id];
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < this.namesCacheConfig.maxAge) {
          results[id] = cached.name;
          return;
        }
        // Cache expired, remove it
        delete this.namesCache[id];
      }

      missingIds.push(id);
    });

    console.info(
      `📋 Names cache hits: ${Object.keys(results).length}, misses: ${
        missingIds.length
      }`
    );

    // Fetch missing names from backend
    if (missingIds.length > 0) {
      try {
        console.info(`🌐 Fetching names for ${missingIds.length} IDs from backend`);
        const response = await nextcloudApi.post('/openregister/api/names', {
          ids: missingIds,
        });

        if (response.ok && response.data?.names) {
          const fetchedNames = response.data.names;
          this.setNamesInCache(fetchedNames);

          console.info(`✅ Multiple names fetched:`, {
            total: response.data.total,
            requested: response.data.requested,
            cached: response.data.cached,
            executionTime: response.data.execution_time,
          });

          // Add fetched names to results
          Object.entries(fetchedNames).forEach(([id, name]) => {
            results[id] = name;
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch names for IDs:`, error.message);

        // Cache failed lookups to prevent repeated API calls
        if (error.response?.status === 404 || error.response?.status >= 400) {
          console.info(
            `🚫 Bulk names request failed (${
              error.response?.status || 'error'
            }), caching UUIDs to prevent future API calls`
          );
          const failedLookups = {};
          missingIds.forEach((id) => {
            failedLookups[id] = id;
          });
          this.setNamesInCache(failedLookups);
        }
      }
    }

    // Fill in missing names with IDs as fallback and cache them
    const uncachedFallbacks = {};
    missingIds.forEach((id) => {
      if (!results[id]) {
        results[id] = id;
        uncachedFallbacks[id] = id;
      }
    });

    // Cache the fallback UUIDs to prevent future API calls
    if (Object.keys(uncachedFallbacks).length > 0) {
      console.info(
        `📝 Caching ${
          Object.keys(uncachedFallbacks).length
        } UUID fallbacks to prevent future API calls`
      );
      this.setNamesInCache(uncachedFallbacks);
    }

    return results;
  };

  /**
   * Sets a single name in the cache
   * @param {string} id - The UUID
   * @param {string} name - The name to cache
   */
  @action
  setNamesInCacheSingle = (id, name) => {
    if (!id || !name) return;

    this.namesCache[id] = {
      name,
      timestamp: Date.now(),
    };
  };

  /**
   * Sets multiple names in the cache
   * @param {{[id: string]: string}} nameMap - Object with id -> name mappings
   */
  @action
  setNamesInCache = (nameMap = {}) => {
    if (!nameMap || typeof nameMap !== 'object') return;

    const timestamp = Date.now();
    let count = 0;

    Object.entries(nameMap).forEach(([id, name]) => {
      if (id && name && typeof name === 'string') {
        this.namesCache[id] = { name, timestamp };
        count++;
      }
    });

    if (count > 0) {
      console.info(`💾 Cached ${count} names in names cache`);
    }
  };

  /**
   * Processes related names from API responses and adds them to cache
   * @param {Object} apiResponse - API response that might contain relatedNames
   */
  @action
  processRelatedNamesFromResponse = (apiResponse) => {
    if (!apiResponse?.relatedNames) return;

    console.info(
      `📥 Processing ${
        Object.keys(apiResponse.relatedNames).length
      } related names from API response`
    );
    this.setNamesInCache(apiResponse.relatedNames);
  };

  /**
   * Triggers manual warmup via POST endpoint
   * @returns {Promise<Object>} Warmup response with statistics
   */
  @action
  triggerNamesWarmup = async () => {
    const requestType = 'names_trigger_warmup';
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      console.info('🔥 Triggering manual names cache warmup');
      const response = await nextcloudApi.post('/openregister/api/names/warmup');

      if (!response.ok) {
        throw new Error(
          `Failed to trigger names warmup: ${response.status} ${response.statusText}`
        );
      }

      console.info('✅ Names cache warmup triggered:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Names cache warmup trigger failed:', error);
      this.setError(requestType, error.message);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Gets names cache statistics from backend
   * @returns {Promise<Object>} Cache statistics
   */
  @action
  getNamesStatsFromBackend = async () => {
    const requestType = 'names_backend_stats';
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      console.info('📊 Fetching names cache stats from backend');
      const response = await nextcloudApi.get('/openregister/api/names/stats');

      if (!response.ok) {
        throw new Error(
          `Failed to fetch names stats: ${response.status} ${response.statusText}`
        );
      }

      console.info('✅ Names cache stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch names cache stats:', error);
      this.setError(requestType, error.message);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Warms up the names cache by fetching all available names
   * @returns {Promise<number>} Number of names loaded into cache
   */
  @action
  warmupNamesCache = async () => {
    const requestType = 'names_warmup';
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      console.info('🔥 Starting names cache warmup');
      const response = await nextcloudApi.get('/openregister/api/names');

      if (!response.ok) {
        throw new Error(
          `Failed to warmup names cache: ${response.status} ${response.statusText}`
        );
      }

      const allNames = response.data?.names || {};
      const count = Object.keys(allNames).length;

      this.setNamesInCache(allNames);

      console.info(`✅ Names cache warmed up with ${count} names:`, {
        total: response.data?.total,
        cached: response.data?.cached,
        executionTime: response.data?.execution_time,
        cacheStats: response.data?.cache_stats,
      });
      return count;
    } catch (error) {
      console.error('❌ Names cache warmup failed:', error);
      this.setError(requestType, error.message);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Clears all names from the cache
   */
  @action
  clearNamesCache = () => {
    const count = Object.keys(this.namesCache).length;
    this.namesCache = {};
    console.info(`🗑️ Cleared ${count} names from cache`);
  };

  /**
   * Gets names cache statistics
   * @returns {Object} Cache stats object
   */
  getNamesStats = () => {
    const totalNames = Object.keys(this.namesCache).length;
    const now = Date.now();
    let expired = 0;

    Object.values(this.namesCache).forEach(({ timestamp }) => {
      const age = now - timestamp;
      if (age > this.namesCacheConfig.maxAge) {
        expired++;
      }
    });

    return {
      totalNames,
      expired,
      valid: totalNames - expired,
      maxAge: this.namesCacheConfig.maxAge,
    };
  };

  /**
   * Cleans expired entries from names cache
   * @returns {number} Number of expired entries removed
   */
  @action
  cleanExpiredNamesCache = () => {
    const now = Date.now();
    let removed = 0;

    Object.entries(this.namesCache).forEach(([id, { timestamp }]) => {
      const age = now - timestamp;
      if (age > this.namesCacheConfig.maxAge) {
        delete this.namesCache[id];
        removed++;
      }
    });

    if (removed > 0) {
      console.info(`🧹 Cleaned ${removed} expired entries from names cache`);
    }

    return removed;
  };

  // ===============================
  // BACKEND CACHE WARMING SYSTEM
  // ===============================

  /**
   * Core registers that should be cache-loaded for optimal performance
   */
  CORE_REGISTERS = ['voorzieningen', 'vng-gemma'];

  /**
   * Cache loading state tracking
   * @type {{[register: string]: boolean}}
   */
  @observable
  cacheLoadingState = {};

  /**
   * Cache loading errors
   * @type {{[register: string]: string}}
   */
  @observable
  cacheLoadingErrors = {};

  /**
   * Flag to track if initial cache warming has been completed for this session
   * Prevents redundant cache loading on every /beheer page visit
   * @type {boolean}
   */
  @observable
  initialCacheWarmingCompleted = false;

  /**
   * Fetches register information including all schemas
   * @param {string} registerSlug - The register slug (e.g., 'voorzieningen', 'vng-gemma')
   * @returns {Object} Register data with schemas
   */
  @action
  fetchRegister = async (registerSlug) => {
    const requestType = `register_${registerSlug}`;
    this.setLoading(requestType, true);
    this.setError(requestType, null);

    try {
      const endpoint = `/openregister/api/registers/${registerSlug}`;
      const response = await nextcloudApi.get(endpoint);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch register ${registerSlug}: ${response.status} ${response.statusText}`
        );
      }

      console.info(`✅ Fetched register ${registerSlug}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching register ${registerSlug}:`, error);
      this.setError(requestType, error.message);
      throw error;
    } finally {
      this.setLoading(requestType, false);
    }
  };

  /**
   * Triggers backend cache loading for a specific register/schema combination
   * @param {string} registerId - The register ID
   * @param {string} schemaId - The schema ID
   * @returns {boolean} True if cache loading was successful
   */
  @action
  triggerBackendCacheLoad = async (registerId, schemaId) => {
    try {
      const endpoint = `/openregister/api/objects/${registerId}/${schemaId}`;
      const params = {
        _limit: 20, // Load first 20 items to properly warm backend cache
        _page: 1,
        '_extend[]': '@self.schema',
      };

      console.info(`🔥 Triggering backend cache load for ${registerId}/${schemaId}`);

      const response = await nextcloudApi.get(endpoint, {
        params: this._constructQueryParams(params),
      });

      if (response.ok) {
        console.info(`✅ Backend cache loaded for ${registerId}/${schemaId}`);
        return true;
      } else {
        console.warn(
          `⚠️ Failed to load backend cache for ${registerId}/${schemaId}:`,
          response.status
        );
        return false;
      }
    } catch (error) {
      console.warn(
        `⚠️ Error loading backend cache for ${registerId}/${schemaId}:`,
        error.message
      );
      return false;
    }
  };

  /**
   * Loads backend cache for all schemas in a specific register
   * @param {string} registerSlug - The register slug
   * @returns {Object} Results with successful and failed cache loads
   */
  @action
  cacheLoadRegister = async (registerSlug) => {
    // const requestType = `cache_load_${registerSlug}`;

    runInAction(() => {
      this.cacheLoadingState[registerSlug] = true;
      this.cacheLoadingErrors[registerSlug] = null;
    });

    try {
      // Fetch register data to get all schemas
      const registerData = await this.fetchRegister(registerSlug);

      if (!registerData?.schemas || !Array.isArray(registerData.schemas)) {
        throw new Error(`Register ${registerSlug} does not contain schemas array`);
      }

      console.info(
        `🔄 Cache loading ${registerData.schemas.length} schemas for register ${registerSlug}`
      );

      // Trigger cache loading for each schema in parallel
      const cacheLoadPromises = registerData.schemas.map(async (schema) => {
        const schemaId = this.extractId(schema);
        if (!schemaId) {
          console.warn(`⚠️ Could not extract schema ID from:`, schema);
          return { success: false, schema, error: 'Invalid schema ID' };
        }

        try {
          const success = await this.triggerBackendCacheLoad(
            registerData.id,
            schemaId
          );
          return { success, schema, registerId: registerData.id, schemaId };
        } catch (error) {
          return {
            success: false,
            schema,
            error: error.message,
            registerId: registerData.id,
            schemaId,
          };
        }
      });

      const results = await Promise.allSettled(cacheLoadPromises);

      const successful = results
        .filter((r) => r.status === 'fulfilled' && r.value.success)
        .map((r) => r.value);

      const failed = results
        .filter(
          (r) =>
            r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
        )
        .map((r) => r.value || { success: false, error: 'Unknown error' });

      console.info(`✅ Cache loading completed for ${registerSlug}:`, {
        successful: successful.length,
        failed: failed.length,
        total: registerData.schemas.length,
      });

      return { successful, failed, registerData };
    } catch (error) {
      const errorMessage = error.message || 'Unknown error during cache loading';
      console.error(`❌ Cache loading failed for ${registerSlug}:`, error);

      runInAction(() => {
        this.cacheLoadingErrors[registerSlug] = errorMessage;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.cacheLoadingState[registerSlug] = false;
      });
    }
  };

  /**
   * Loads backend cache for all core registers (voorzieningen and vng-gemma)
   * This function should be called during user login to pre-warm the backend cache
   * @returns {Object} Combined results from all register cache loads
   */
  @action
  cacheLoad = async () => {
    console.info(
      '🚀 Starting backend cache loading for core registers:',
      this.CORE_REGISTERS
    );

    const startTime = Date.now();
    const allResults = {
      successful: [],
      failed: [],
      registers: {},
    };

    // Load cache for all core registers in parallel
    const registerPromises = this.CORE_REGISTERS.map(async (registerSlug) => {
      try {
        const result = await this.cacheLoadRegister(registerSlug);
        allResults.registers[registerSlug] = result;
        allResults.successful.push(...result.successful);
        allResults.failed.push(...result.failed);
        return { registerSlug, success: true, result };
      } catch (error) {
        const failedResult = { success: false, error: error.message, registerSlug };
        allResults.registers[registerSlug] = failedResult;
        allResults.failed.push(failedResult);
        return { registerSlug, success: false, error: error.message };
      }
    });

    const registerResults = await Promise.allSettled(registerPromises);
    const duration = Date.now() - startTime;

    const stats = {
      duration,
      totalSuccessful: allResults.successful.length,
      totalFailed: allResults.failed.length,
      registersProcessed: registerResults.length,
      registersSuccessful: registerResults.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length,
    };

    console.info(`🎉 Backend cache loading completed in ${duration}ms:`, stats);

    // Mark initial cache warming as completed to prevent redundant calls
    runInAction(() => {
      this.initialCacheWarmingCompleted = true;
    });

    return {
      ...allResults,
      stats,
    };
  };

  /**
   * Gets cache loading state for a specific register
   * @param {string} registerSlug - The register slug
   * @returns {boolean} True if cache loading is in progress
   */
  isCacheLoading = (registerSlug) => {
    return this.cacheLoadingState[registerSlug] || false;
  };

  /**
   * Gets cache loading error for a specific register
   * @param {string} registerSlug - The register slug
   * @returns {string|null} Error message or null if no error
   */
  getCacheLoadingError = (registerSlug) => {
    return this.cacheLoadingErrors[registerSlug] || null;
  };

  /**
   * Checks if all core registers have been successfully cache loaded
   * @returns {boolean} True if all core registers are cache loaded
   */
  isFullyCacheLoaded = () => {
    return this.CORE_REGISTERS.every((register) => {
      return !this.isCacheLoading(register) && !this.getCacheLoadingError(register);
    });
  };

  /**
   * Clears cache loading state and errors
   */
  @action
  clearCacheLoadingState = () => {
    this.cacheLoadingState = {};
    this.cacheLoadingErrors = {};
  };

  /**
   * Resets the initial cache warming flag (call on logout to allow cache warming on next login)
   */
  @action
  resetCacheWarmingFlag = () => {
    this.initialCacheWarmingCompleted = false;
  };
}

export default ObjectStore;
