/**
 * Organization Utilities for Form Components
 *
 * Provides utilities for fetching and processing organization data
 * used across ac-forms components.
 */

import { useState, useEffect } from 'react';
import { mapId, mapToOption } from './mapping-utils';
import { AcLogFetchError } from '@utils';

/**
 * Custom hook to fetch full organization data and optionally process deelnemers
 * @param {Object} store - MobX store instance
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.extend - Array of extend fields for API request (default: ['_schema'])
 * @param {boolean} options.processDeelnemers - Whether to process deelnemers into options (default: false)
 * @param {Array<string>} options.deelnemerOrgTypes - Organization types to process deelnemers for (default: ['Samenwerking'])
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 * @param {Function} options.onSuccess - Optional callback called with (orgData, deelnemerOptions)
 * @param {Function} options.onError - Optional error callback
 * @returns {Object} Object containing fullActiveOrganisation, deelnemerOptions, loading, error
 */
export const useFullOrganization = (store, options = {}) => {
  const {
    extend = ['_schema'],
    processDeelnemers = false,
    deelnemerOrgTypes = ['Samenwerking'],
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);
  const [deelnemerOptions, setDeelnemerOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFullOrganisationData = async () => {
      const activeOrg = store?.user?.activeOrganization;
      const organisationId = activeOrg?.uuid || activeOrg?.id;

      if (!organisationId || !enabled) {
        setFullActiveOrganisation(null);
        setDeelnemerOptions([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await store.object.fetchObject(
          'voorzieningen',
          'organisatie',
          organisationId,
          {
            '_extend[]': extend,
          }
        );

        const fullOrgData = store.object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );

        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);

          // Process deelnemers into options if enabled and organization type matches
          if (processDeelnemers) {
            const orgType = fullOrgData?.type || '';
            if (deelnemerOrgTypes.includes(orgType)) {
              const deelnemers = Array.isArray(fullOrgData?.deelnemers)
                ? fullOrgData.deelnemers
                : [];

              // Map deelnemers to options format
              const options = deelnemers
                .filter((deelnemer) => {
                  // Filter out invalid deelnemers
                  const id =
                    typeof deelnemer === 'object' ? mapId(deelnemer) : deelnemer;
                  return id && id !== 'undefined' && id !== 'null';
                })
                .map((deelnemer, index) => {
                  // Handle both object format and string (UUID) format
                  if (typeof deelnemer === 'object') {
                    return mapToOption(deelnemer, index, {
                      labelFields: ['naam', '@self.name', 'name'],
                      valueFields: ['@self.id', 'id'],
                      fallbackLabel: `Deelnemer ${index + 1}`,
                    });
                  }
                  // If it's just a string (UUID), use it as both value and label
                  return {
                    value: String(deelnemer),
                    label: String(deelnemer),
                    data: null,
                  };
                });

              setDeelnemerOptions(options);

              if (onSuccess) {
                onSuccess(fullOrgData, options);
              }
            } else {
              setDeelnemerOptions([]);
            }
          } else {
            if (onSuccess) {
              onSuccess(fullOrgData, []);
            }
          }
        }
      } catch (err) {
        AcLogFetchError('Error fetching full organization data', err);
        setError(err);
        setDeelnemerOptions([]);
        if (onError) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFullOrganisationData();
  }, [
    store?.user?.activeOrganization?.uuid,
    store?.user?.activeOrganization?.id,
    enabled,
    processDeelnemers,
    JSON.stringify(extend),
    JSON.stringify(deelnemerOrgTypes),
  ]);

  return {
    fullActiveOrganisation,
    deelnemerOptions,
    loading,
    error,
  };
};
