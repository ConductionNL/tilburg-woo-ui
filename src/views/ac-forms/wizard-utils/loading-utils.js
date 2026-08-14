/**
 * Loading State Utilities for Forms
 *
 * Provides hooks for managing loading states in form components.
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing a single loading state
 * @param {boolean} initialState - Initial loading state (default: false)
 * @returns {Object} Object with loading state and helpers
 * @returns {boolean} loading - Current loading state
 * @returns {Function} setLoading - Function to set loading state
 * @returns {Function} withLoading - Wrapper function that sets loading during async operation
 */
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(
    async (asyncFn) => {
      setLoading(true);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    setLoading,
    withLoading,
  };
};

/**
 * Hook for managing multiple loading states
 * @param {Array<string>} keys - Array of keys for loading states
 * @param {Object} initialStates - Initial states per key (optional)
 * @returns {Object} Object with loading states and helpers per key
 *
 * @example
 * const { schemas, modules } = useMultipleLoadingStates(['schemas', 'modules']);
 * // schemas.loading, schemas.setLoading, schemas.withLoading
 * // modules.loading, modules.setLoading, modules.withLoading
 */
export const useMultipleLoadingStates = (keys, initialStates = {}) => {
  // Initialize all loading states in a single object
  const initialState = keys.reduce((acc, key) => {
    acc[key] = initialStates[key] || false;
    return acc;
  }, {});

  const [loadingStates, setLoadingStates] = useState(initialState);

  // Create a single setter function that updates a specific key
  const setLoadingForKey = useCallback((key, value) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Create helper functions for each key (using useMemo to avoid recreating on every render)
  const states = useMemo(() => {
    const result = {};
    for (const key of keys) {
      result[key] = {
        loading: loadingStates[key],
        setLoading: (value) => setLoadingForKey(key, value),
        withLoading: async (asyncFn) => {
          setLoadingForKey(key, true);
          try {
            const result = await asyncFn();
            return result;
          } finally {
            setLoadingForKey(key, false);
          }
        },
      };
    }
    return result;
  }, [keys, loadingStates, setLoadingForKey]);

  return states;
};
