// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

// Imports => Utilities
import { AcBuildURLSearchParams } from '@utils';
import axios from 'axios';
import { getCookie } from '@src/utilities';
import { BASE_URL } from '@views/ac-beheer/constants';

let app = {};

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

// Add Authorization header interceptor for OAuth tokens
nextcloudApi.interceptors.request.use(
  (config) => {
    const accessToken = getCookie('nextcloud_access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
  (error) => Promise.reject(error)
);

/**
 * Store for managing objects in OpenCatalogi.
 * Handles fetching, creating, updating, deleting, and other API operations
 * for objects in the system.
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
 */
export class ObjectStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
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
   * Success states for different operations
   * @type {{[type: string]: boolean}}
   * */
  @observable
  success = {};

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
            })
          );
        }
      }
      await Promise.all(fetchPromises);
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
   * Sets success and error states for a specific type
   * @param {string} type - The type identifier
   * @param {Object} state - Object containing success and error properties
   * @param {boolean} [state.success] - Success state
   * @param {string|null} [state.error] - Error message
   */
  @action
  setState = (type, { success, error }) => {
    if (success !== undefined) {
      this.success[type] = success;
    }
    if (error !== undefined) {
      this.errors[type] = error;
    }
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
  _constructApiUrl = (register, schema, id = null, action = null, params = {}) => {
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
      _limit: params._limit || 20,
      _page: params._page || 1,
      _extend: params._extend || params.extend || '@self.schema',
      ...params,
    };

    // Remove internal parameters
    delete queryParams._source;
    delete queryParams._schema;
    delete queryParams._register;
    delete queryParams.extend;

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
  getObjectTypeFromItem = (objectItem) => {
    const register = objectItem['@self']?.register || objectItem.register;
    const schema = objectItem['@self']?.schema || objectItem.schema;

    if (register && schema) {
      const registerId = this.extractId(register);
      const schemaId = this.extractId(schema);
      return `${registerId}_${schemaId}`;
    }

    return 'unknown';
  };

  /**
   * Fetches a collection of objects from the API
   * @param {string|Object} register - Register identifier or object
   * @param {string|Object} schema - Schema identifier or object
   * @param {Object} [params={}] - Query parameters for the request
   * @param {boolean} [append=false] - Whether to append to existing results
   */
  @action
  fetchCollection = async (register, schema, params = {}, append = false) => {
    this.setLoading(`${register}_${schema}`, true);
    this.setState(`${register}_${schema}`, { success: null, error: null });

    try {
      const queryParams = {
        ...params,
        _extend: params._extend || params.extend || '@self.schema',
      };

      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema),
        { params: this._constructQueryParams(queryParams) }
      );
      if (!response.ok)
        throw new Error(`Failed to fetch collection for ${register}/${schema}`);

      const data = response.data;

      const collectionKey = `${register}_${schema}`;
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

      this.setPagination(collectionKey, paginationInfo);
      this.setCollection(collectionKey, data.results, append);

      if (!this.objects[collectionKey]) {
        this.objects[collectionKey] = {};
      }
      data.results.forEach((item) => {
        this.objects[collectionKey][item.id] = { ...item };
      });
    } catch (error) {
      console.error(`Error fetching collection for ${register}/${schema}:`, error);
      this.setState(`${register}_${schema}`, {
        success: false,
        error: error.message,
      });
      throw error;
    } finally {
      this.setLoading(`${register}_${schema}`, false);
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
    this.setLoading(`${type}_${id}`, true);
    this.setState(type, { success: null, error: null });

    try {
      const queryParams = {
        ...params,
        _extend: params._extend || params.extend || '@self.schema',
      };

      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema, id),
        { params: this._constructQueryParams(queryParams) }
      );
      if (!response.ok) throw new Error(`Failed to fetch ${type} object`);

      const data = response.data;
      if (!this.objects[type]) this.objects[type] = {};
      this.objects[type][id] = data;

      if (this.activeObjects[type]?.id === id) {
        await this.setActiveObject(register, schema, data);
      }
    } catch (error) {
      console.error(`Error fetching ${type} object:`, error);
      this.setState(type, { success: false, error: error.message });
      throw error;
    } finally {
      this.setLoading(`${type}_${id}`, false);
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
    this.setLoading(`${type}_${id}_${dataType}`, true);
    this.setState(type, { success: null, error: null });

    try {
      const queryParams = {
        ...params,
        ...(dataType === 'uses' || dataType === 'used'
          ? { _extend: params._extend || params.extend || '@self.schema' }
          : {}),
      };

      const response = await nextcloudApi.get(
        this._constructApiUrl(register, schema, id, dataType),
        { params: this._constructQueryParams(queryParams) }
      );
      if (!response.ok) throw new Error(`Failed to fetch ${dataType} for ${type}`);

      const data = response.data;
      if (!this.relatedData[type]) {
        this.relatedData[type] = {};
      }

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

      if (dataType === 'logs') {
        this.relatedData[type][dataType] = data.results || [];
      } else {
        this.relatedData[type][dataType] = data;
      }
    } catch (error) {
      console.error(`Error fetching ${dataType} for ${type}:`, error);
      this.setState(type, { success: false, error: error.message });
      throw error;
    } finally {
      this.setLoading(`${type}_${id}_${dataType}`, false);
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
    this.setState(type, { success: null, error: null });

    try {
      const response = await nextcloudApi.post(
        this._constructApiUrl(register, schema),
        data
      );
      if (!response.ok) throw new Error(`Failed to create ${type} object`);

      const newObject = response.data;
      if (!this.objects[type]) this.objects[type] = {};
      this.objects[type][newObject.id] = newObject;

      await this.fetchCollection(register, schema);
      await this.setActiveObject(register, schema, newObject);
      this.setState(type, { success: true, error: null });

      return newObject;
    } catch (error) {
      console.error(`Error creating ${type} object:`, error);
      this.setError(`${type}_create`, error.message);
      this.setState(type, { success: false, error: error.message });
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

    const isNewObject = !objectItem['@self']?.id;
    const objectId = objectItem['@self']?.id;

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
      const type = `${registerId}_${schemaId}`;
      if (!this.objects[type]) this.objects[type] = {};
      this.objects[type][data.id] = data;

      // Update collection if it exists
      if (this.collections[type]) {
        const existingIndex = this.collections[type].results.findIndex(
          (item) => item.id === data.id
        );
        if (existingIndex >= 0) {
          this.collections[type].results[existingIndex] = data;
        } else {
          this.collections[type].results.unshift(data);
        }
      }

      // Update active object if it matches
      if (this.activeObjects[type]?.id === data.id) {
        this.activeObjects[type] = data;
      }

      return { response, data };
    } catch (error) {
      console.error('Error saving object:', error);
      throw error;
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
    const type = `${register}_${schema}`;
    this.setLoading(`${type}_${id}`, true);
    this.setError(`${type}_${id}`, null);
    this.setState(type, { success: null, error: null });

    try {
      const response = await nextcloudApi.put(
        this._constructApiUrl(register, schema, id),
        data
      );
      if (!response.ok) throw new Error(`Failed to update ${type} object`);

      const updatedObject = response.data;
      if (!this.objects[type]) this.objects[type] = {};
      this.objects[type][id] = updatedObject;

      await this.fetchCollection(register, schema);

      if (this.activeObjects[type]?.id === id) {
        this.activeObjects[type] = updatedObject;
      }

      this.setState(type, { success: true, error: null });

      return updatedObject;
    } catch (error) {
      console.error(`Error updating ${type} object:`, error);
      this.setError(`${type}_${id}`, error.message);
      this.setState(type, { success: false, error: error.message });
      throw error;
    } finally {
      this.setLoading(`${type}_${id}`, false);
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

    this.setLoading(`delete_${objectId}`, true);
    this.setError(`delete_${objectId}`, null);

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

      return true;
    } catch (error) {
      console.error('Error deleting object:', error);
      this.setError(`delete_${objectId}`, error.message);
      throw error;
    } finally {
      this.setLoading(`delete_${objectId}`, false);
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

    this.setLoading(`publish_${objectId}`, true);
    this.setError(`publish_${objectId}`, null);

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
      const objectType = this.getObjectTypeFromItem(objectItem);
      const activeObject = this.activeObjects[objectType];
      if (
        activeObject &&
        (activeObject.id === objectId || activeObject['@self']?.id === objectId)
      ) {
        this.activeObjects[objectType] = updatedObject;
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

      return updatedObject;
    } catch (error) {
      console.error('Error publishing object:', error);
      this.setError(`publish_${objectId}`, error.message);
      throw error;
    } finally {
      this.setLoading(`publish_${objectId}`, false);
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

    this.setLoading(`depublish_${objectId}`, true);
    this.setError(`depublish_${objectId}`, null);

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
      const objectType = this.getObjectTypeFromItem(objectItem);
      const activeObject = this.activeObjects[objectType];
      if (
        activeObject &&
        (activeObject.id === objectId || activeObject['@self']?.id === objectId)
      ) {
        this.activeObjects[objectType] = updatedObject;
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

      return updatedObject;
    } catch (error) {
      console.error('Error depublishing object:', error);
      this.setError(`depublish_${objectId}`, error.message);
      throw error;
    } finally {
      this.setLoading(`depublish_${objectId}`, false);
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

    this.setLoading(`lock_${objectId}`, true);
    this.setError(`lock_${objectId}`, null);

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
      const objectType = this.getObjectTypeFromItem(objectItem);
      const activeObject = this.activeObjects[objectType];
      if (
        activeObject &&
        (activeObject.id === objectId || activeObject['@self']?.id === objectId)
      ) {
        this.activeObjects[objectType] = updatedObject;
      }

      return updatedObject;
    } catch (error) {
      console.error('Error locking object:', error);
      this.setError(`lock_${objectId}`, error.message);
      throw error;
    } finally {
      this.setLoading(`lock_${objectId}`, false);
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

    this.setLoading(`unlock_${objectId}`, true);
    this.setError(`unlock_${objectId}`, null);

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
      const objectType = this.getObjectTypeFromItem(objectItem);
      const activeObject = this.activeObjects[objectType];
      if (
        activeObject &&
        (activeObject.id === objectId || activeObject['@self']?.id === objectId)
      ) {
        this.activeObjects[objectType] = updatedObject;
      }

      return updatedObject;
    } catch (error) {
      console.error('Error unlocking object:', error);
      this.setError(`unlock_${objectId}`, error.message);
      throw error;
    } finally {
      this.setLoading(`unlock_${objectId}`, false);
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
}

export default ObjectStore;
