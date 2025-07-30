import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@stores';

/**
 * React hook for accessing object store functionality
 * Provides a clean interface for working with beheer objects
 *
 * @param {string} type - The object type (e.g., 'applicaties', 'diensten')
 * @returns {Object} Object store interface
 */
export const useObjectStore = (type) => {
  const { objects } = useStore();
  const requestIdsRef = useRef(new Set());

  // Validate type on mount
  useEffect(() => {
    try {
      objects.getObjectConfig(type);
    } catch (error) {
      console.error(`Invalid object type: ${type}`, error);
    }
  }, [type, objects]);

  // Cleanup function to cancel requests when component unmounts
  useEffect(() => {
    return () => {
      requestIdsRef.current.forEach((requestId) => {
        objects.cancelRequest(requestId);
      });
      requestIdsRef.current.clear();
    };
  }, [objects]);

  // Helper to track request IDs for cleanup
  const trackRequest = useCallback((requestId) => {
    requestIdsRef.current.add(requestId);
    return requestId;
  }, []);

  // Helper to untrack request IDs
  const untrackRequest = useCallback((requestId) => {
    requestIdsRef.current.delete(requestId);
  }, []);

  return useMemo(
    () => ({
      // ============================================================================
      // DATA ACCESS
      // ============================================================================

      /**
       * Get a single object by ID
       * @param {string} id - Object ID
       * @returns {Object|null} Object data or null if not found
       */
      getObject: (id) => objects.getObject(type, id),

      /**
       * Get collection data for this type
       * @returns {Object|null} Collection data or null if not found
       */
      getCollection: () => objects.getCollection(type),

      /**
       * Get schema for this type
       * @returns {Object|null} Schema data or null if not found
       */
      getSchema: () => objects.getSchema(type),

      /**
       * Get all objects of this type
       * @returns {Array} Array of objects
       */
      getObjectsByType: () => objects.getObjectsByType(type),

      // ============================================================================
      // LOADING STATES
      // ============================================================================

      /**
       * Get loading state for a specific request
       * @param {string} requestId - Request ID
       * @returns {boolean} Loading state
       */
      getLoading: (requestId) => objects.getLoading(requestId),

      /**
       * Get error for a specific request
       * @param {string} requestId - Request ID
       * @returns {Object|null} Error data or null if not found
       */
      getError: (requestId) => objects.getError(requestId),

      /**
       * Check if any request is loading
       * @returns {boolean} Global loading state
       */
      get isLoading() {
        return objects.isLoading;
      },

      /**
       * Check if there are any errors
       * @returns {boolean} Global error state
       */
      get hasErrors() {
        return objects.hasErrors;
      },

      // ============================================================================
      // DATA FETCHING
      // ============================================================================

      /**
       * Fetch a single object
       * @param {string} id - Object ID
       * @param {Object} options - Request options
       * @returns {Promise<Object>} Object data
       */
      fetchObject: async (id, options = {}) => {
        const requestId = objects.createRequestId(type, 'fetchObject', {
          id,
          ...options,
        });
        trackRequest(requestId);

        try {
          const result = await objects.fetchObject(type, id, options);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      /**
       * Fetch collection of objects
       * @param {Object} options - Request options
       * @returns {Promise<Object>} Collection data
       */
      fetchCollection: async (options = {}) => {
        const requestId = objects.createRequestId(type, 'fetchCollection', options);
        trackRequest(requestId);

        try {
          const result = await objects.fetchCollection(type, options);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      /**
       * Fetch schema for this type
       * @returns {Promise<Object>} Schema data
       */
      fetchSchema: async () => {
        const requestId = objects.createRequestId(type, 'fetchSchema');
        trackRequest(requestId);

        try {
          const result = await objects.fetchSchema(type);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      // ============================================================================
      // CRUD OPERATIONS
      // ============================================================================

      /**
       * Create a new object
       * @param {Object} data - Object data
       * @returns {Promise<Object>} Created object
       */
      createObject: async (data) => {
        const requestId = objects.createRequestId(type, 'createObject');
        trackRequest(requestId);

        try {
          const result = await objects.createObject(type, data);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      /**
       * Update an existing object
       * @param {string} id - Object ID
       * @param {Object} data - Updated data
       * @returns {Promise<Object>} Updated object
       */
      updateObject: async (id, data) => {
        const requestId = objects.createRequestId(type, 'updateObject', { id });
        trackRequest(requestId);

        try {
          const result = await objects.updateObject(type, id, data);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      /**
       * Delete an object
       * @param {string} id - Object ID
       * @returns {Promise<void>}
       */
      deleteObject: async (id) => {
        const requestId = objects.createRequestId(type, 'deleteObject', { id });
        trackRequest(requestId);

        try {
          await objects.deleteObject(type, id);
          untrackRequest(requestId);
        } catch (error) {
          untrackRequest(requestId);
        }
      },

      // ============================================================================
      // UTILITY METHODS
      // ============================================================================

      /**
       * Refresh collection data
       * @param {Object} options - Request options
       * @returns {Promise<Object>} Updated collection data
       */
      refreshCollection: async (options = {}) => {
        const requestId = objects.createRequestId(
          type,
          'refreshCollection',
          options
        );
        trackRequest(requestId);

        try {
          const result = await objects.refreshCollection(type, options);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      /**
       * Refresh single object data
       * @param {string} id - Object ID
       * @param {Object} options - Request options
       * @returns {Promise<Object>} Updated object data
       */
      refreshObject: async (id, options = {}) => {
        const requestId = objects.createRequestId(type, 'refreshObject', {
          id,
          ...options,
        });
        trackRequest(requestId);

        try {
          const result = await objects.refreshObject(type, id, options);
          untrackRequest(requestId);
          return result;
        } catch (error) {
          untrackRequest(requestId);
          throw error;
        }
      },

      /**
       * Clear all data for this type
       */
      clearType: () => objects.clearType(type),

      /**
       * Cancel a specific request
       * @param {string} requestId - Request ID to cancel
       */
      cancelRequest: (requestId) => {
        objects.cancelRequest(requestId);
        untrackRequest(requestId);
      },

      /**
       * Get configuration for this type
       * @returns {Object} Configuration object
       */
      getConfig: () => objects.getObjectConfig(type),

      /**
       * Get store statistics
       * @returns {Object} Store statistics
       */
      getStats: () => objects.getStats(),
    }),
    [type, objects, trackRequest, untrackRequest]
  );
};

export default useObjectStore;
