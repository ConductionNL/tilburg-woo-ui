// Imports => MOBX
import {
  observable,
  computed,
  makeObservable,
  action,
  toJS,
  runInAction,
} from 'mobx';

// Imports => API
import nextcloudApi from '@utilities/con-nextcloud-api';

/**
 * Unified Object Store
 * Manages all beheer object types with centralized state management
 */
export class ObjectStore {
  constructor(store) {
    makeObservable(this);
    this.app = store;
    this.api = nextcloudApi;
  }

  // ============================================================================
  // OBSERVABLE STATE
  // ============================================================================

  @observable objects = new Map(); // Key: `${type}_${id}`, Value: object data
  @observable schemas = new Map(); // Key: type, Value: schema data
  @observable collections = new Map(); // Key: type, Value: { items, pagination, filters }
  @observable loading = new Map(); // Key: requestId, Value: loading state
  @observable errors = new Map(); // Key: requestId, Value: error data

  // ============================================================================
  // COMPUTED GETTERS
  // ============================================================================

  @computed
  get isLoading() {
    return Array.from(this.loading.values()).some(Boolean);
  }

  @computed
  get hasErrors() {
    return this.errors.size > 0;
  }

  @computed
  get errorCount() {
    return this.errors.size;
  }

  @computed
  get activeRequestCount() {
    return Array.from(this.loading.values()).filter(Boolean).length;
  }

  // ============================================================================
  // OBJECT CONFIGURATIONS
  // ============================================================================

  /**
   * Get configuration for a specific object type
   * @param {string} type - The object type
   * @returns {Object} Configuration object
   */
  getObjectConfig(type) {
    const configs = {
      applicaties: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'voorziening',
        routeType: 'applicaties',
        defaultExtend: [['_extend[]', 'standaarden']],
        defaultHeaders: [
          'naam',
          'referentieComponenten',
          'standaarden',
          'categorie',
          'links',
        ],
      },
      diensten: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'voorzieningaanbod',
        routeType: 'diensten',
        defaultExtend: [
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'leverancier'],
        ],
        defaultHeaders: ['name', 'voorzieningName', 'email'],
      },
      'voorzieningen-versie': {
        registerSlug: 'voorzieningen',
        schemaSlug: 'voorzieningversie',
        routeType: 'voorzieningen-versie',
        defaultExtend: [
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'kwetsbaarheden'],
        ],
        defaultHeaders: ['name', 'versienummer', 'releaseDatum', 'status'],
      },
      organisaties: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'organisatie',
        routeType: 'organisaties',
        defaultExtend: [['_extend[]', 'contactgegevens']],
        defaultHeaders: [
          'organizationName',
          'website',
          'beoordeling',
          'e-mailadres',
          'type',
        ],
      },
      kwetsbaarheden: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'kwetsbaarheid',
        routeType: 'kwetsbaarheden',
        defaultExtend: [],
        defaultHeaders: ['titel', 'ernst', 'detectedOn', 'status'],
      },
      gebruiken: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'voorzieninggebruik',
        routeType: 'gebruiken',
        defaultExtend: [
          ['_extend[]', 'voorzieningId'],
          ['_extend[]', 'organisatieId'],
        ],
        defaultHeaders: ['voorzieningId', 'diensten', 'status', 'contact'],
      },
      overeenkomsten: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'contract',
        routeType: 'overeenkomsten',
        defaultExtend: [['_extend[]', 'all']],
        defaultHeaders: ['name', 'startDatum', 'eindDatum', 'contactPersonProvider'],
      },
      contactpersonen: {
        registerSlug: 'voorzieningen',
        schemaSlug: 'contactpersoon',
        routeType: 'contactpersonen',
        defaultExtend: [],
        defaultHeaders: ['name', 'status', 'lastActivity', 'email', 'organisatie'],
      },
    };

    const config = configs[type];
    if (!config) {
      throw new Error(`Unknown object type: ${type}`);
    }

    return config;
  }

  /**
   * Get all supported object types
   * @returns {string[]} Array of supported types
   */
  getSupportedTypes() {
    return Object.keys(this.getObjectConfig('applicaties')); // Use any valid type to get configs
  }

  // ============================================================================
  // REQUEST MANAGEMENT
  // ============================================================================

  /**
   * Create a unique request ID for tracking
   * @param {string} type - Object type
   * @param {string} operation - Operation name
   * @param {Object} params - Request parameters
   * @returns {string} Unique request ID
   */
  createRequestId(type, operation, params = {}) {
    const timestamp = Date.now();
    const paramString = JSON.stringify(params);
    return `${type}_${operation}_${timestamp}_${paramString}`;
  }

  /**
   * Cancel a specific request
   * @param {string} requestId - Request ID to cancel
   */
  @action
  cancelRequest(requestId) {
    this.api.cancelRequest(requestId);
    this.setLoading(requestId, false);
    this.clearError(requestId);
  }

  /**
   * Cancel all active requests
   */
  @action
  cancelAllRequests() {
    this.api.cancelAllRequests();
    this.loading.clear();
    this.errors.clear();
  }

  // ============================================================================
  // STATE MANAGEMENT ACTIONS
  // ============================================================================

  @action
  setObject(type, id, data) {
    const key = `${type}_${id}`;
    this.objects.set(key, data);
  }

  @action
  setSchema(type, schema) {
    this.schemas.set(type, schema);
  }

  @action
  setCollection(type, data) {
    this.collections.set(type, data);
  }

  @action
  setLoading(requestId, status) {
    this.loading.set(requestId, status);
  }

  @action
  setError(requestId, error) {
    this.errors.set(requestId, error);
  }

  @action
  clearError(requestId) {
    this.errors.delete(requestId);
  }

  @action
  reset() {
    this.objects.clear();
    this.schemas.clear();
    this.collections.clear();
    this.loading.clear();
    this.errors.clear();
    this.cancelAllRequests();
  }

  // ============================================================================
  // DATA ACCESS METHODS
  // ============================================================================

  /**
   * Get a single object by type and ID
   * @param {string} type - Object type
   * @param {string} id - Object ID
   * @returns {Object|null} Object data or null if not found
   */
  getObject(type, id) {
    return this.objects.get(`${type}_${id}`) || null;
  }

  /**
   * Get collection data for a type
   * @param {string} type - Object type
   * @returns {Object|null} Collection data or null if not found
   */
  getCollection(type) {
    return this.collections.get(type) || null;
  }

  /**
   * Get schema for a type
   * @param {string} type - Object type
   * @returns {Object|null} Schema data or null if not found
   */
  getSchema(type) {
    return this.schemas.get(type) || null;
  }

  /**
   * Get loading state for a request
   * @param {string} requestId - Request ID
   * @returns {boolean} Loading state
   */
  getLoading(requestId) {
    return this.loading.get(requestId) || false;
  }

  /**
   * Get error for a request
   * @param {string} requestId - Request ID
   * @returns {Object|null} Error data or null if not found
   */
  getError(requestId) {
    return this.errors.get(requestId) || null;
  }

  /**
   * Get all objects of a specific type
   * @param {string} type - Object type
   * @returns {Array} Array of objects
   */
  getObjectsByType(type) {
    const objects = [];
    for (const [key, value] of this.objects.entries()) {
      if (key.startsWith(`${type}_`)) {
        objects.push(value);
      }
    }
    return objects;
  }

  // ============================================================================
  // DATA FETCHING METHODS
  // ============================================================================

  /**
   * Fetch a single object
   * @param {string} type - Object type
   * @param {string} id - Object ID
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Object data
   */
  @action
  async fetchObject(type, id, options = {}) {
    const requestId = this.createRequestId(type, 'fetchObject', { id, ...options });

    try {
      this.setLoading(requestId, true);
      this.clearError(requestId);

      const config = this.getObjectConfig(type);
      const response = await this.api.request(
        `openregister/api/objects/${config.registerSlug}/${config.schemaSlug}/${id}`,
        {
          params: options.extend || config.defaultExtend || [],
          redirectPath: `/beheer/${config.routeType}/${id}`,
          requestKey: requestId,
        }
      );

      runInAction(() => {
        this.setObject(type, id, response.data);
        this.setLoading(requestId, false);
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.setError(requestId, error);
        this.setLoading(requestId, false);
      });
      throw error;
    }
  }

  /**
   * Fetch a collection of objects
   * @param {string} type - Object type
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Collection data
   */
  @action
  async fetchCollection(type, options = {}) {
    const requestId = this.createRequestId(type, 'fetchCollection', options);

    try {
      this.setLoading(requestId, true);
      this.clearError(requestId);

      const config = this.getObjectConfig(type);
      const response = await this.api.request(
        `openregister/api/objects/${config.registerSlug}/${config.schemaSlug}`,
        {
          params: [
            ...(options.extend || config.defaultExtend || []),
            ['_page', options.page || 1],
            ['_limit', options.limit || 20],
            ...Object.entries(options.filters || {}),
          ],
          redirectPath: `/beheer/${config.routeType}`,
          requestKey: requestId,
        }
      );

      runInAction(() => {
        this.setCollection(type, {
          items: response.data.results,
          pagination: {
            total: response.data.total,
            page: options.page || 1,
            pages: response.data.pages,
            limit: options.limit || 20,
          },
          filters: options.filters || {},
        });
        this.setLoading(requestId, false);
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.setError(requestId, error);
        this.setLoading(requestId, false);
      });
      throw error;
    }
  }

  /**
   * Fetch schema for an object type
   * @param {string} type - Object type
   * @returns {Promise<Object>} Schema data
   */
  @action
  async fetchSchema(type) {
    const requestId = this.createRequestId(type, 'fetchSchema');

    try {
      this.setLoading(requestId, true);
      this.clearError(requestId);

      const config = this.getObjectConfig(type);
      const response = await this.api.request(
        `openregister/api/schemas/${config.schemaSlug}`,
        {
          redirectPath: `/beheer/${config.routeType}`,
          requestKey: requestId,
        }
      );

      runInAction(() => {
        this.setSchema(type, response.data);
        this.setLoading(requestId, false);
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.setError(requestId, error);
        this.setLoading(requestId, false);
      });
      throw error;
    }
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new object
   * @param {string} type - Object type
   * @param {Object} data - Object data
   * @returns {Promise<Object>} Created object
   */
  @action
  async createObject(type, data) {
    const requestId = this.createRequestId(type, 'createObject');

    try {
      this.setLoading(requestId, true);
      this.clearError(requestId);

      const config = this.getObjectConfig(type);
      const response = await this.api.request(
        `openregister/api/objects/${config.registerSlug}/${config.schemaSlug}`,
        {
          method: 'POST',
          data,
          redirectPath: `/beheer/${config.routeType}`,
          requestKey: requestId,
        }
      );

      runInAction(() => {
        // Add to collection if exists
        const collection = this.collections.get(type);
        if (collection) {
          collection.items.unshift(response.data);
        }
        this.setLoading(requestId, false);
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.setError(requestId, error);
        this.setLoading(requestId, false);
      });
      throw error;
    }
  }

  /**
   * Update an existing object
   * @param {string} type - Object type
   * @param {string} id - Object ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated object
   */
  @action
  async updateObject(type, id, data) {
    const requestId = this.createRequestId(type, 'updateObject', { id });

    try {
      this.setLoading(requestId, true);
      this.clearError(requestId);

      const config = this.getObjectConfig(type);
      const response = await this.api.request(
        `openregister/api/objects/${config.registerSlug}/${config.schemaSlug}/${id}`,
        {
          method: 'PUT',
          data,
          redirectPath: `/beheer/${config.routeType}/${id}`,
          requestKey: requestId,
        }
      );

      runInAction(() => {
        this.setObject(type, id, response.data);
        // Update in collection if exists
        const collection = this.collections.get(type);
        if (collection) {
          const index = collection.items.findIndex((item) => item.id === id);
          if (index !== -1) {
            collection.items[index] = response.data;
          }
        }
        this.setLoading(requestId, false);
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.setError(requestId, error);
        this.setLoading(requestId, false);
      });
      throw error;
    }
  }

  /**
   * Delete an object
   * @param {string} type - Object type
   * @param {string} id - Object ID
   * @returns {Promise<void>}
   */
  @action
  async deleteObject(type, id) {
    const requestId = this.createRequestId(type, 'deleteObject', { id });

    try {
      this.setLoading(requestId, true);
      this.clearError(requestId);

      const config = this.getObjectConfig(type);
      await this.api.request(
        `openregister/api/objects/${config.registerSlug}/${config.schemaSlug}/${id}`,
        {
          method: 'DELETE',
          redirectPath: `/beheer/${config.routeType}`,
          requestKey: requestId,
        }
      );

      runInAction(() => {
        // Remove from objects cache
        this.objects.delete(`${type}_${id}`);
        // Remove from collection if exists
        const collection = this.collections.get(type);
        if (collection) {
          collection.items = collection.items.filter((item) => item.id !== id);
        }
        this.setLoading(requestId, false);
      });
    } catch (error) {
      runInAction(() => {
        this.setError(requestId, error);
        this.setLoading(requestId, false);
      });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Clear all data for a specific type
   * @param {string} type - Object type
   */
  @action
  clearType(type) {
    // Clear all objects of a specific type
    for (const [key] of this.objects.entries()) {
      if (key.startsWith(`${type}_`)) {
        this.objects.delete(key);
      }
    }
    this.collections.delete(type);
    this.schemas.delete(type);
  }

  /**
   * Refresh collection data
   * @param {string} type - Object type
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Updated collection data
   */
  @action
  async refreshCollection(type, options = {}) {
    return this.fetchCollection(type, options);
  }

  /**
   * Refresh single object data
   * @param {string} type - Object type
   * @param {string} id - Object ID
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Updated object data
   */
  @action
  async refreshObject(type, id, options = {}) {
    return this.fetchObject(type, id, options);
  }

  /**
   * Get store statistics
   * @returns {Object} Store statistics
   */
  getStats() {
    return {
      objectCount: this.objects.size,
      schemaCount: this.schemas.size,
      collectionCount: this.collections.size,
      loadingCount: this.activeRequestCount,
      errorCount: this.errorCount,
      supportedTypes: this.getSupportedTypes(),
    };
  }
}

export default ObjectStore;
