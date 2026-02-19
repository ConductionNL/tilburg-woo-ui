import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import { ConUuidResolver } from '@components';
import { VISUALS } from '@constants';
import { handleFileClick } from '@utils';
import { commongroundApiUrl } from '@config';
import { validateWebsite } from '@src/views/ac-forms/validation/form-validations';

/**
 * Reusable Standards Table Component
 *
 * This component displays standaardversies (standard versions) from referentieComponenten
 * with their compliance status. The relationship is:
 * referentieComponenten → standaarden (aanbevolen/verplicht) → standaardVersies
 *
 * It can be used both in publication pages and beheer module details pages.
 *
 * @param {Object} props
 * @param {Array} props.referentieComponenten - Array of referentieComponent IDs
 * @param {Array} props.complianceStandards - Array of compliance standards with evidence
 * @param {Array} props.compliantVersieIds - Array of compliant standaardversie IDs (standaardVersies array)
 * @param {string} props.noStandardsMessage - Custom message when no standards found
 * @param {Object} props.containerStyle - Additional styles for the container
 * @param {Function} props.onStandardsCountChange - Callback when standards count changes
 * @param {Array} props.standards - Optional: Pre-fetched standards data (if provided, won't fetch internally)
 * @param {Array} props.standaardversies - Optional: Pre-fetched standaardversies data
 * @param {Array} props.referentieComponentenWithStandards - Optional: Pre-fetched referentieComponenten data
 * @param {boolean} props.loading - Optional: Loading state when using external data
 * @param {Function} props.onReferentieComponentenChange - Callback when referentieComponenten data changes
 */

/**
 * Returns an absolute URL for use in href. Protocol-less values like "test.nl/path" are prefixed with https://
 * so the browser navigates externally instead of treating them as relative paths.
 * @param {string} url - URL string (may be protocol-less, or already absolute)
 * @returns {string} URL safe for use as link href
 */
function toAbsoluteUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return url;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  return `https://${trimmed}`;
}

const ConStandardsTable = ({
  referentieComponenten = [],
  complianceStandards = [],
  compliantVersieIds = [],
  noStandardsMessage = 'Geen standaardversies gevonden voor de gekoppelde referentiecomponenten.',
  containerStyle = {},
  onStandardsCountChange,
  standards: externalStandards,
  standaardversies: externalStandaardversies,
  referentieComponentenWithStandards: externalReferentieComponentenWithStandards,
  loading: externalLoading = false,
  onReferentieComponentenChange,
  isEditing = false,
  onComplianceChange,
  disabled = false,
}) => {
  // Standards state for resolving compliance standards
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

  // Standaardversies state
  const [standaardversies, setStandaardversies] = useState([]);
  const [standaardversiesLoading, setStandaardversiesLoading] = useState(false);

  // State for referentieComponenten data with standards
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Track if user is authenticated (can access element endpoints)
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Assume authenticated initially

  // Memoize the referentieComponenten array to prevent unnecessary refetches
  // when the parent component re-renders with a new array reference but same content
  const memoizedReferentieComponenten = useMemo(() => {
    if (!referentieComponenten?.length) return [];
    return referentieComponenten;
  }, [JSON.stringify(referentieComponenten)]);

  // Fetch referentieComponenten data with their standards
  const fetchReferentieComponentenWithStandards = useCallback(async () => {
    if (!memoizedReferentieComponenten?.length) {
      setReferentieComponentenWithStandards([]);
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
      });

      // Fetch referentieComponenten from openconnector endpoint
      const response = await fetch(
        `${commongroundApiUrl()}/openregister/api/objects/vng-gemma/element?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsAuthenticated(false);
        }
        return;
      }

      setIsAuthenticated(true);

      const data = await response.json();
      const allReferentieComponenten = data.results || data;

      // Filter to only the referentieComponenten that are used in this object
      const objectReferentieComponenten = memoizedReferentieComponenten
        .map((refId) => {
          const refData = allReferentieComponenten.find(
            (ref) =>
              String(ref.id) === String(refId) ||
              String(ref.value) === String(refId) ||
              String(ref.slug) === String(refId)
          );

          if (refData) {
            return {
              id: refId,
              naam:
                refData?.xml?.name?._value ||
                refData?.naam ||
                refData?.name ||
                refData?.title ||
                refData?.label ||
                refId,
              moduleId: 0, // For publication view, we don't have specific modules
              applicatieId: 0,
              // Extract standards from the API data
              aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
              verplichteStandaarden: refData.verplichteStandaarden || [],
              // Store the full API data for future use
              fullData: refData,
            };
          }
          return null;
        })
        .filter(Boolean);

      setReferentieComponentenWithStandards(objectReferentieComponenten);
    } catch (error) {
      setReferentieComponentenWithStandards([]);
    }
  }, [memoizedReferentieComponenten]);

  // Fetch standards from openconnector endpoint
  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
      });

      const response = await fetch(
        `${commongroundApiUrl()}/openregister/api/objects/vng-gemma/element?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsAuthenticated(false);
        }
        return;
      }

      setIsAuthenticated(true);

      const data = await response.json();
      const fetchedStandards = data.results || data;

      setStandards(fetchedStandards);
    } catch (error) {
      setStandards([]);
    } finally {
      setStandardsLoading(false);
    }
  }, []);

  // Fetch standaardversies from openconnector endpoint
  const fetchStandaardversies = useCallback(async () => {
    setStandaardversiesLoading(true);
    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaardversie',
      });

      const response = await fetch(
        `${commongroundApiUrl()}/openregister/api/objects/vng-gemma/element?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsAuthenticated(false);
        }
        return;
      }

      setIsAuthenticated(true);

      const data = await response.json();
      const fetchedStandaardversies = data.results || data;

      setStandaardversies(fetchedStandaardversies);
    } catch (error) {
      setStandaardversies([]);
    } finally {
      setStandaardversiesLoading(false);
    }
  }, []);

  // Use external data if provided, otherwise use internal state
  // Priority: Internal fetched data (when available) > External data > Empty
  // This ensures that when we successfully fetch 321 items, we use those instead of the 5 from external
  const effectiveStandards =
    standards.length > 0 ? standards : externalStandards || standards;

  const effectiveStandaardversies =
    standaardversies.length > 0
      ? standaardversies
      : externalStandaardversies || standaardversies;

  const effectiveReferentieComponentenWithStandards =
    referentieComponentenWithStandards.length > 0
      ? referentieComponentenWithStandards
      : externalReferentieComponentenWithStandards ||
        referentieComponentenWithStandards;

  const effectiveLoading =
    externalLoading || standardsLoading || standaardversiesLoading;

  // Always try to fetch full data when authenticated, unless we already have it
  // Only skip fetching if:
  // 1. We already have internal data (standaardversies.length > 0), OR
  // 2. We've confirmed we're not authenticated (isAuthenticated === false)
  const shouldFetchData =
    standaardversies.length === 0 &&
    referentieComponentenWithStandards.length === 0 &&
    isAuthenticated;

  useEffect(() => {
    if (shouldFetchData) {
      fetchStandards();
      fetchStandaardversies();
      fetchReferentieComponentenWithStandards();
    }
  }, [
    shouldFetchData,
    fetchStandards,
    fetchStandaardversies,
    fetchReferentieComponentenWithStandards,
  ]);

  // Helper function to get ID from an item
  const getItemId = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item;
    return (
      item.id ||
      item?.['@self']?.id ||
      item.identifier ||
      item.value ||
      item.slug ||
      item.naam ||
      item.name ||
      null
    );
  };

  // Helper function to find matching standard data
  const findMatchingStandardData = useCallback(
    (standard) => {
      const standardId = getItemId(standard);
      if (!standardId || !effectiveStandards?.length) return null;

      return effectiveStandards.find(
        (standardData) =>
          String(standardData.id) === String(standardId) ||
          String(standardData.identifier) === String(standardId) ||
          String(standardData.value) === String(standardId)
      );
    },
    [effectiveStandards]
  );

  // Helper function to find matching standaardversie data
  const findMatchingStandaardversieData = useCallback(
    (versie) => {
      const versieId = getItemId(versie);
      if (!versieId || !effectiveStandaardversies?.length) return null;

      return effectiveStandaardversies.find(
        (versieData) =>
          String(versieData.id) === String(versieId) ||
          String(versieData.identifier) === String(versieId) ||
          String(versieData.value) === String(versieId)
      );
    },
    [effectiveStandaardversies]
  );

  // Helper function to get all standaardversies from referentieComponenten data
  // Traverses: referentieComponenten → standaarden → find matching standaardversies by their parent standard ID
  const getAllStandaardVersiesFromReferentieComponenten = useCallback(
    (referentieComponentenWithStandardsData) => {
      if (!referentieComponentenWithStandardsData?.length) return [];
      if (!effectiveStandaardversies?.length) return [];

      const allVersies = [];

      referentieComponentenWithStandardsData.forEach((refComp) => {
        const refCompName = refComp.naam || `Component ${refComp.id}`;

        // Helper to process standards and find their versions
        // Instead of looking for standaardVersies array in the standard,
        // we search through all standaardversies to find ones that reference this standard
        const processStandards = (standardsList, isVerplicht) => {
          if (!standardsList || !Array.isArray(standardsList)) return;

          standardsList.forEach((standard) => {
            const standardId = getItemId(standard);
            if (!standardId) return;

            // Find all standaardversies that have this standard as their parent
            const matchingVersies = effectiveStandaardversies.filter((versie) => {
              const versieStandaardId = getItemId(versie.standaard);
              if (!versieStandaardId) return false;

              // Match by ID
              return String(versieStandaardId) === String(standardId);
            });

            // Process each matching standaardversie
            matchingVersies.forEach((versie) => {
              const versieId = getItemId(versie);
              if (!versieId) return;

              // Get versie name
              const versieName =
                versie?.xml?.name?._value ||
                versie?.name ||
                versie?.naam ||
                versieId;

              const existingVersie = allVersies.find(
                (versieEntry) => String(versieEntry.id) === String(versieId)
              );

              if (existingVersie) {
                // If already exists as VERPLICHT, keep it as VERPLICHT
                if (isVerplicht && existingVersie.type !== 'VERPLICHT') {
                  existingVersie.type = 'VERPLICHT';
                }
                // Add this referentiecomponent to the list if not already present
                const refComps = existingVersie.referentieComponenten || [];
                if (!refComps.includes(refCompName)) {
                  existingVersie.referentieComponenten = [...refComps, refCompName];
                }
              } else {
                allVersies.push({
                  id: versieId,
                  name: versieName,
                  type: isVerplicht ? 'VERPLICHT' : 'AANBEVOLEN',
                  referentieComponenten: [refCompName],
                  parentStandardId: standardId,
                  fetchedData: versie,
                });
              }
            });
          });
        };

        // Process verplichte standaarden (isVerplicht = true)
        processStandards(refComp.verplichteStandaarden, true);

        // Process aanbevolen standaarden (isVerplicht = false)
        processStandards(refComp.aanbevolenStandaarden, false);
      });

      return allVersies;
    },
    [
      effectiveStandaardversies,
      findMatchingStandardData,
      findMatchingStandaardversieData,
    ]
  );

  // Get all standaardversies from referentieComponenten using the helper function
  const allReferentieStandaardversies = useMemo(
    () =>
      getAllStandaardVersiesFromReferentieComponenten(
        effectiveReferentieComponentenWithStandards
      ),
    [
      effectiveReferentieComponentenWithStandards,
      getAllStandaardVersiesFromReferentieComponenten,
    ]
  );

  // Get IDs of standaardversies from referentieComponenten
  const referentieStandaardversieIds = useMemo(() => {
    return new Set(allReferentieStandaardversies.map((versie) => String(versie.id)));
  }, [allReferentieStandaardversies]);

  // Find "toegevoegd" (added) standaardversies - versions in compliantVersieIds or complianceStandards but not in referentieComponenten
  const toegevoegdeStandaardversies = useMemo(() => {
    const toegevoegdMap = new Map();

    // Helper function to check if a versie ID is in referentieComponenten
    const isInReferentieComponenten = (versieId) => {
      const versieData = effectiveStandaardversies?.find(
        (versie) =>
          String(versie.id) === String(versieId) ||
          String(versie.identifier) === String(versieId) ||
          String(versie.value) === String(versieId)
      );

      if (versieData) {
        const possibleIds = [
          String(versieData.id),
          String(versieData.identifier),
          String(versieData.value),
          String(versieData.uuid),
        ].filter(Boolean);

        return possibleIds.some((id) => referentieStandaardversieIds.has(id));
      }

      return referentieStandaardversieIds.has(String(versieId));
    };

    // Helper function to add a toegevoegd versie
    const addToegeveogdVersie = (versieId, providedName = null) => {
      if (toegevoegdMap.has(versieId)) return;

      const versieData = effectiveStandaardversies?.find(
        (versie) =>
          String(versie.id) === String(versieId) ||
          String(versie.identifier) === String(versieId) ||
          String(versie.value) === String(versieId)
      );

      // Use the identifier property (like the form stage does)
      const resolverIdentifier =
        versieData?.identifier || versieData?.id || versieData?.value || versieId;

      // Prefer fetched data with actual names, then fall back to provided name or identifier
      // This ensures we use the real name from the API if available, not the UUID from compliancy.standaardnaam
      const versieName =
        versieData?.['@self']?.name ||
        versieData?.xml?.name?._value ||
        versieData?.name ||
        versieData?.naam ||
        providedName ||
        resolverIdentifier;

      toegevoegdMap.set(versieId, {
        id: resolverIdentifier,
        name: versieName,
        type: 'TOEGEVOEGD',
        referentieComponent: 'Extra toegevoegd',
        fetchedData: versieData,
      });
    };

    // Check compliantVersieIds array (standaardVersies)
    if (compliantVersieIds && compliantVersieIds.length > 0) {
      compliantVersieIds.forEach((versieId) => {
        if (!isInReferentieComponenten(versieId)) {
          addToegeveogdVersie(versieId);
        }
      });
    }

    // Also check complianceStandards for backwards compatibility
    if (complianceStandards && complianceStandards.length > 0) {
      complianceStandards.forEach((compliancy) => {
        const versieId = compliancy.standaardversie;
        if (versieId && !isInReferentieComponenten(versieId)) {
          // Pass the standaardnaam from compliancy if available
          addToegeveogdVersie(versieId, compliancy.standaardnaam);
        }
      });
    }

    return Array.from(toegevoegdMap.values());
  }, [
    complianceStandards,
    compliantVersieIds,
    referentieStandaardversieIds,
    effectiveStandaardversies,
  ]);

  // Combine referentie standaardversies with toegevoegde standaardversies
  const allStandards = useMemo(() => {
    return [...allReferentieStandaardversies, ...toegevoegdeStandaardversies];
  }, [allReferentieStandaardversies, toegevoegdeStandaardversies]);

  // Notify parent component when standards count changes
  useEffect(() => {
    if (onStandardsCountChange) {
      onStandardsCountChange(allStandards.length);
    }
  }, [allStandards.length, onStandardsCountChange]);

  // Notify parent component when referentieComponenten data changes
  // Use a ref to prevent calling the callback unnecessarily and causing infinite loops
  const previousReferentieComponentenDataRef = React.useRef(null);
  useEffect(() => {
    if (
      onReferentieComponentenChange &&
      effectiveReferentieComponentenWithStandards
    ) {
      // Only call the callback if the data actually changed (deep comparison by JSON)
      const currentDataJson = JSON.stringify(
        effectiveReferentieComponentenWithStandards
      );
      if (previousReferentieComponentenDataRef.current !== currentDataJson) {
        previousReferentieComponentenDataRef.current = currentDataJson;
        onReferentieComponentenChange(effectiveReferentieComponentenWithStandards);
      }
    }
  }, [effectiveReferentieComponentenWithStandards, onReferentieComponentenChange]);

  // Functions for editing mode
  const toggleCompliance = useCallback(
    (versieId, isCompliant) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      let newCompliancy;

      // Find the versie data to get all possible IDs
      const versieData = effectiveStandaardversies?.find(
        (versie) =>
          versie.id === versieId ||
          versie.identifier === versieId ||
          versie.value === versieId
      );

      // Collect all possible IDs for this versie
      const allPossibleIds = new Set([versieId]);
      if (versieData?.id) allPossibleIds.add(String(versieData.id));
      if (versieData?.identifier) allPossibleIds.add(String(versieData.identifier));
      if (versieData?.value) allPossibleIds.add(String(versieData.value));

      if (isCompliant) {
        // Use identifier for standaardGemma to maintain consistency with id- prefix format
        const objectId =
          versieData?.identifier || versieData?.id || versieData?.objectId || null;

        // Add or update compliancy - check all possible IDs
        const existingIndex = currentCompliancy.findIndex(
          (compliancy) =>
            allPossibleIds.has(String(compliancy.standaardversie)) ||
            allPossibleIds.has(String(compliancy.standaardGemma))
        );

        // Find the standaardversie name for display
        const versieEntry = allStandards.find((entry) => entry.id === versieId);
        const versieName =
          versieEntry?.name ||
          versieData?.['@self']?.name ||
          versieData?.xml?.name?._value ||
          versieData?.name ||
          versieData?.naam ||
          versieId;

        const compliancyObject = {
          standaardversie: versieId,
          standaardGemma: objectId,
          standaardnaam: versieName,
          bewijs: null,
          bewijsFilename: null,
          url: null,
        };

        if (existingIndex >= 0) {
          newCompliancy = [...currentCompliancy];
          newCompliancy[existingIndex] = compliancyObject;
        } else {
          newCompliancy = [...currentCompliancy, compliancyObject];
        }
      } else {
        // Remove compliancy - check all possible IDs
        newCompliancy = currentCompliancy.filter(
          (compliancy) =>
            !allPossibleIds.has(String(compliancy.standaardversie)) &&
            !allPossibleIds.has(String(compliancy.standaardGemma))
        );
      }

      onComplianceChange(newCompliancy);
    },
    [
      isEditing,
      onComplianceChange,
      complianceStandards,
      allStandards,
      effectiveStandaardversies,
    ]
  );

  const updateBewijs = useCallback(
    (standardId, bewijs) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId || c.standaardGemma === standardId
          ? { ...c, bewijs, url: null, bewijsFilename: c.bewijsFilename } // Clear URL when file is uploaded (mutually exclusive)
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  const updateUrl = useCallback(
    (standardId, url) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId || c.standaardGemma === standardId
          ? { ...c, url, bewijs: null, bewijsFilename: null } // Clear file when URL is set (mutually exclusive)
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  const updateBewijsFilename = useCallback(
    (standardId, filename) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId || c.standaardGemma === standardId
          ? { ...c, bewijsFilename: filename }
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  const clearBewijs = useCallback(
    (standardId) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId || c.standaardGemma === standardId
          ? { ...c, bewijs: null, bewijsFilename: null, url: null }
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  if (effectiveLoading) {
    return <p>Standaardversies laden...</p>;
  }

  if (!allStandards || allStandards.length === 0) {
    return (
      <p style={{ padding: '16px', color: '#6c757d', fontStyle: 'italic' }}>
        {noStandardsMessage}
      </p>
    );
  }

  // const shouldScroll = enableScrolling && allStandards.length > 5;

  return (
    <div
      style={{
        width: '100%',
        ...containerStyle,
      }}
    >
      <Table style={{ width: '100%', tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow>
            <TableCell
              style={{
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                paddingLeft:
                  'var(--utrecht-table-cell-padding-inline-end) !important',
                width: '50%',
              }}
            >
              Standaardversie
            </TableCell>
            <TableCell
              style={{
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                width: '25%',
              }}
            >
              {isEditing ? 'Ondersteund' : 'Status'}
            </TableCell>
            <TableCell
              style={{
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                width: '25%',
              }}
            >
              Bewijs
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            // Group standards by type
            const verplichtStandards = allStandards.filter(
              (s) => s.type === 'VERPLICHT'
            );
            const aanbevolenStandards = allStandards.filter(
              (s) => s.type === 'AANBEVOLEN'
            );
            const toegevoegdStandards = allStandards.filter(
              (s) => s.type === 'TOEGEVOEGD'
            );

            const renderStandardRow = (versieEntry, idx) => {
              // Check if this standaardversie is in the complianceStandards array
              // For toegevoegd versions, we need to match by multiple possible identifiers
              const complianceStandard = complianceStandards?.find((compliancy) => {
                // Direct match
                if (compliancy.standaardversie === versieEntry.id) return true;

                // Also check standaardGemma (the canonical ID)
                if (compliancy.standaardGemma === versieEntry.id) return true;

                // Check all possible ID formats
                const versieData = effectiveStandaardversies?.find(
                  (versie) =>
                    String(versie.id) === String(versieEntry.id) ||
                    String(versie.identifier) === String(versieEntry.id) ||
                    String(versie.value) === String(versieEntry.id)
                );

                if (versieData) {
                  return (
                    String(compliancy.standaardversie) === String(versieData.id) ||
                    String(compliancy.standaardversie) ===
                      String(versieData.identifier) ||
                    String(compliancy.standaardversie) ===
                      String(versieData.value) ||
                    String(compliancy.standaardGemma) === String(versieData.id) ||
                    String(compliancy.standaardGemma) ===
                      String(versieData.identifier)
                  );
                }

                return false;
              });

              // Check if this versie is in the compliantVersieIds array
              const isInCompliantVersieIds = compliantVersieIds?.some((id) => {
                if (String(id) === String(versieEntry.id)) return true;

                // Also check fetched data IDs
                const versieData = effectiveStandaardversies?.find(
                  (versie) =>
                    String(versie.id) === String(versieEntry.id) ||
                    String(versie.identifier) === String(versieEntry.id) ||
                    String(versie.value) === String(versieEntry.id)
                );

                if (versieData) {
                  return (
                    String(id) === String(versieData.id) ||
                    String(id) === String(versieData.identifier) ||
                    String(id) === String(versieData.value)
                  );
                }

                return false;
              });

              // Extract the actual URL from bewijs field
              // bewijs can be:
              // 1. A data URL string (data:application/pdf;base64,...)
              // 2. An object with url property: { url: "https://..." } or { url: "data:..." }
              // 3. null/undefined
              const bewijsValue = complianceStandard?.bewijs;
              const bewijsUrl =
                typeof bewijsValue === 'object' && bewijsValue?.url
                  ? bewijsValue.url
                  : typeof bewijsValue === 'string'
                  ? bewijsValue
                  : null;

              const bewijsFilename = complianceStandard?.bewijsFilename;

              // Check if we have a data URL (base64 encoded file)
              const hasBewijsDataUrl = bewijsUrl && bewijsUrl.startsWith('data:');
              // Check if we have an HTTP(S) or protocol-less external URL in bewijs (e.g. test.nl/path)
              const hasBewijsHttpUrl =
                bewijsUrl &&
                (bewijsUrl.startsWith('http://') ||
                  bewijsUrl.startsWith('https://') ||
                  validateWebsite(bewijsUrl));
              // Check if we have a separate url field
              const hasUrl = !!complianceStandard?.url;
              const hasBewijsFile = !!complianceStandard?.['@self']?.files?.[0];

              // For display purposes: compliant means has evidence
              const isCompliant =
                hasBewijsFile || hasBewijsDataUrl || hasBewijsHttpUrl || hasUrl;
              // Ondersteund means in compliancy or compliantVersieIds but no evidence yet
              const isOndersteund =
                (!!complianceStandard && isInCompliantVersieIds) &&
                !hasBewijsDataUrl &&
                !hasBewijsHttpUrl &&
                !hasUrl;
              // For checkbox: checked if in compliancy array or compliantVersieIds
              const isChecked = !!complianceStandard || isInCompliantVersieIds;

              // Find the actual standaardversie object to get its real ID
              const actualVersie = effectiveStandaardversies?.find(
                (versie) =>
                  versie.identifier === versieEntry.id ||
                  versie.id === versieEntry.id ||
                  versie.objectId === versieEntry.id
              );

              // Use the actual versie's ID, fallback to versieEntry.id if not found
              const versieObjectId = actualVersie?.id || versieEntry.id;

              // Get the display name for the standaardversie
              const versieName =
                versieEntry.name ||
                actualVersie?.['@self']?.name ||
                actualVersie?.xml?.name?._value ||
                actualVersie?.name ||
                actualVersie?.naam ||
                versieEntry.id;

              return (
                <TableRow key={`${versieEntry.type}-${idx}`}>
                  <TableCell
                    style={{
                      alignContent: 'center',
                      paddingLeft:
                        'var(--utrecht-table-cell-padding-inline-end) !important',
                      width: '50%',
                      wordWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    <div>
                      <Link
                        href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${versieObjectId}`}
                        target='_blank'
                      >
                        <ConUuidResolver>{versieName}</ConUuidResolver>
                      </Link>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          key={`${versieEntry.type}-${idx}`}
                          className={`con-standaard-badge con-standaard-badge--${versieEntry.type.toLowerCase()}`}
                        >
                          {versieEntry.type}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '0.75rem',
                          color: '#6c757d',
                          wordWrap: 'break-word',
                        }}
                      >
                        {(
                          versieEntry.referentieComponenten ??
                          (versieEntry.referentieComponent
                            ? [versieEntry.referentieComponent]
                            : [])
                        ).map((refCompName, refIdx) => (
                          <span key={`${versieEntry.type}-${idx}-ref-${refIdx}`}>
                            {refIdx > 0 && ', '}
                            <ConUuidResolver>{refCompName}</ConUuidResolver>
                          </span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    style={{
                      alignContent: 'center',
                      width: '25%',
                      overflow: 'hidden',
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AcCheckbox
                          checked={isChecked}
                          onChange={(checked) =>
                            toggleCompliance(versieEntry.id, checked)
                          }
                          disabled={disabled}
                          label=''
                        />
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#fff',
                          backgroundColor: isCompliant
                            ? '#28a745'
                            : isOndersteund
                            ? '#A86200'
                            : versieEntry.type === 'VERPLICHT'
                            ? '#dc3545'
                            : '#6c757d',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          lineHeight: '1.2',
                          margin: '0px',
                          marginBlockStart: '0px',
                          marginBlockEnd: '0px',
                          marginInlineStart: '0px',
                          marginInlineEnd: '0px',
                        }}
                      >
                        {isCompliant
                          ? 'COMPLIANT'
                          : isOndersteund
                          ? 'ONDERSTEUND'
                          : 'NIET ONDERSTEUND'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    style={{
                      alignContent: 'center',
                      width: '25%',
                      overflow: 'hidden',
                    }}
                  >
                    {isEditing ? (
                      // Show file upload or URL input when editing and checked (in compliancy or compliantVersieIds)
                      isChecked ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <LogoUploadField
                            fieldConfig={{
                              label: '',
                              filename: complianceStandard?.bewijs
                                ? 'Bestand geüpload'
                                : '',
                            }}
                            _value={complianceStandard?.bewijs || ''}
                            onChange={(dataUrl) =>
                              updateBewijs(versieEntry.id, dataUrl)
                            }
                            onChangeFileName={(filename) =>
                              updateBewijsFilename(versieEntry.id, filename)
                            }
                            onClear={() => clearBewijs(versieEntry.id)}
                            accept={[
                              '.pdf',
                              '.jpg',
                              '.jpeg',
                              '.png',
                              '.doc',
                              '.docx',
                            ]}
                            showPreview={false}
                            validation={{ required: false }}
                            propertyName={`bewijs-${versieEntry.id}`}
                            size='small'
                            isDisabled={disabled || !!complianceStandard?.url}
                          />
                          <Separator />
                          <div>
                            <AcFormField
                              placeholder='https://...'
                              value={complianceStandard?.url || ''}
                              type='url'
                              onChange={(e) => updateUrl(versieEntry.id, e)}
                              disabled={disabled || !!complianceStandard?.bewijs}
                              className='ac-register-form-field__no-width-limit'
                              hasError={validateWebsite(complianceStandard?.url)}
                            />
                            {complianceStandard?.url &&
                              (!complianceStandard?.url ||
                                !validateWebsite(complianceStandard?.url)) && (
                                <span className='ac-register-form-field-error'>
                                  {complianceStandard?.url &&
                                    !validateWebsite(complianceStandard?.url) &&
                                    'URL heeft een ongeldig formaat'}
                                </span>
                              )}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'flex',
                            justifyContent: 'left',
                          }}
                        >
                          -
                        </span>
                      )
                    ) : (
                      // Always show download/link button when not editing
                      (() => {
                        // Check for file metadata in @self.files
                        const fileInfo = complianceStandard?.['@self']?.files?.[0];
                        const fileTitle = fileInfo?.title;
                        const fileDownloadUrl = fileInfo?.downloadUrl;

                        if (fileTitle && fileDownloadUrl) {
                          return (
                            <Link
                              href={fileDownloadUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                justifyContent: 'left',
                                cursor: 'pointer',
                              }}
                              title={`Download: ${fileTitle}`}
                            >
                              <VISUALS.DOWNLOAD />
                              <span style={{ fontSize: '0.85rem' }}>
                                {fileTitle}
                              </span>
                            </Link>
                          );
                        } else if (hasBewijsDataUrl) {
                          // Data URL (base64 encoded file) - handle with handleFileClick
                          return (
                            <Link
                              href='#'
                              onClick={(e) => {
                                e.preventDefault();
                                handleFileClick(bewijsUrl);
                              }}
                              style={{
                                display: 'flex',
                                justifyContent: 'left',
                                cursor: 'pointer',
                              }}
                            >
                              <VISUALS.DOWNLOAD />
                              <span style={{ fontSize: '0.85rem' }}>
                                {bewijsFilename}
                              </span>
                            </Link>
                          );
                        } else if (hasBewijsHttpUrl) {
                          // HTTP(S) or protocol-less external URL in bewijs field - display the URL
                          return (
                            <Link
                              href={toAbsoluteUrl(bewijsUrl)}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                justifyContent: 'left',
                                cursor: 'pointer',
                                wordBreak: 'break-all',
                              }}
                              title={`Open bewijs URL: ${bewijsUrl}`}
                            >
                              <VISUALS.EXTERNAL_LINK />
                              <span style={{ fontSize: '0.85rem' }}>
                                {bewijsUrl}
                              </span>
                            </Link>
                          );
                        } else if (hasUrl) {
                          // Separate url field - display the URL
                          return (
                            <Link
                              href={toAbsoluteUrl(complianceStandard.url)}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                justifyContent: 'left',
                                cursor: 'pointer',
                                wordBreak: 'break-all',
                              }}
                              title={`Open bewijs URL: ${complianceStandard.url}`}
                            >
                              <VISUALS.EXTERNAL_LINK />
                              <span style={{ fontSize: '0.85rem' }}>
                                {complianceStandard.url}
                              </span>
                            </Link>
                          );
                        } else {
                          return (
                            <span
                              style={{
                                display: 'flex',
                                justifyContent: 'left',
                              }}
                            >
                              -
                            </span>
                          );
                        }
                      })()
                    )}
                  </TableCell>
                </TableRow>
              );
            };

            const rows = [];

            // Verplicht section
            if (verplichtStandards.length > 0) {
              rows.push(
                <TableRow key='header-verplicht'>
                  <TableCell
                    colSpan={3}
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                    }}
                  >
                    Verplicht
                  </TableCell>
                </TableRow>
              );
              verplichtStandards.forEach((standard, idx) => {
                rows.push(renderStandardRow(standard, idx));
              });
            }

            // Aanbevolen section
            if (aanbevolenStandards.length > 0) {
              rows.push(
                <TableRow key='header-aanbevolen'>
                  <TableCell
                    colSpan={3}
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                    }}
                  >
                    Aanbevolen
                  </TableCell>
                </TableRow>
              );
              aanbevolenStandards.forEach((standard, idx) => {
                rows.push(renderStandardRow(standard, idx));
              });
            }

            // Toegevoegd section
            if (toegevoegdStandards.length > 0) {
              rows.push(
                <TableRow key='header-toegevoegd'>
                  <TableCell
                    colSpan={3}
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                    }}
                  >
                    Toegevoegd
                  </TableCell>
                </TableRow>
              );
              toegevoegdStandards.forEach((standard, idx) => {
                rows.push(renderStandardRow(standard, idx));
              });
            }

            return rows;
          })()}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConStandardsTable;
