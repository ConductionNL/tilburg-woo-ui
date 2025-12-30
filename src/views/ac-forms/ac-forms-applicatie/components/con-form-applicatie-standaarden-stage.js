import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VISUALS } from '@src/constants';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Separator,
  Link,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';
import { validateWebsite } from '../../validation/form-validations';

/**
 * Standaarden Form Stage for Applicatie Form
 *
 * This component displays standaardversies (standard versions) instead of standards directly.
 * The relationship is: referentieComponenten → standaarden (aanbevolen/verplicht) → standaardVersies
 *
 * Table columns:
 * 1. Standaardversie
 * 2. Compliant (checkbox)
 * 3. Bewijs (file upload when compliant)
 */
const ConFormApplicatieStandaardenStage = ({
  applicatie,
  setApplicatieData,
  referentieComponentenWithStandards,
  standaardenOptions,
  standaardenOptionsLoading,
  standaardenversiesOptions,
  standaardenversiesOptionsLoading,
  selectedExtraStandards,
  setSelectedExtraStandards,
}) => {
  // State to track compliance and bewijs for each standaardversie
  const [tableState, setTableState] = useState({});

  // Ref to track previous allStandaardVersies IDs to prevent unnecessary cleanup
  const prevAllStandardsIdsRef = useRef(new Set());

  // Enhanced function to get ID with better matching
  const getStandardId = (item) => {
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

  // Lookup map for standaarden (used to find standaardVersies from standards)
  const standaardenMap = useMemo(() => {
    const map = {};
    const nameMap = {};
    const identifierMap = {};

    (standaardenOptions || []).forEach((opt) => {
      const data = opt?.data || opt || {};

      // Primary ID mapping
      const id =
        data?.id || data?.identifier || data?.value || data?.slug || opt?.value;
      if (id != null) {
        map[String(id)] = data;
      }

      // Name-based mapping for fallback matching
      const name = data?.name || data?.naam || data?.title || data?.label;
      if (name) {
        nameMap[String(name).toLowerCase()] = data;
      }

      // Identifier mapping
      const identifier = data?.identifier || data?.value;
      if (identifier) {
        identifierMap[String(identifier)] = data;
      }
    });

    return { byId: map, byName: nameMap, byIdentifier: identifierMap };
  }, [standaardenOptions]);

  // Lookup map for standaardversies with multiple matching strategies
  const standaardenversiesMap = useMemo(() => {
    const map = {};
    const nameMap = {};
    const identifierMap = {};

    (standaardenversiesOptions || []).forEach((opt) => {
      const data = opt?.data || opt || {};

      // Primary ID mapping
      const id =
        data?.id || data?.identifier || data?.value || data?.slug || opt?.value;
      if (id != null) {
        map[String(id)] = data;
      }

      // Name-based mapping for fallback matching
      const name =
        data?.xml?.name?._value ||
        data?.name ||
        data?.naam ||
        data?.title ||
        data?.label;
      if (name) {
        nameMap[String(name).toLowerCase()] = data;
      }

      // Identifier mapping
      const identifier = data?.identifier || data?.value;
      if (identifier) {
        identifierMap[String(identifier)] = data;
      }
    });

    return { byId: map, byName: nameMap, byIdentifier: identifierMap };
  }, [standaardenversiesOptions]);

  // Enhanced function to find matching standard data
  const findMatchingStandardData = (standard) => {
    const standardId = getStandardId(standard);

    // Try direct ID match first
    if (standardId && standaardenMap.byId[String(standardId)]) {
      return standaardenMap.byId[String(standardId)];
    }

    // Try identifier match
    if (standardId && standaardenMap.byIdentifier[String(standardId)]) {
      return standaardenMap.byIdentifier[String(standardId)];
    }

    // Try name-based matching as fallback
    const standardName =
      standard?.name || standard?.naam || standard?.title || standard?.label;
    if (standardName && standaardenMap.byName[String(standardName).toLowerCase()]) {
      return standaardenMap.byName[String(standardName).toLowerCase()];
    }

    return {};
  };

  // Function to find matching standaardversie data
  const findMatchingStandaardversieData = (versie) => {
    const versieId = getStandardId(versie);

    // Try direct ID match first
    if (versieId && standaardenversiesMap.byId[String(versieId)]) {
      return standaardenversiesMap.byId[String(versieId)];
    }

    // Try identifier match
    if (versieId && standaardenversiesMap.byIdentifier[String(versieId)]) {
      return standaardenversiesMap.byIdentifier[String(versieId)];
    }

    // Try name-based matching as fallback
    const versieName =
      versie?.xml?.name?._value ||
      versie?.name ||
      versie?.naam ||
      versie?.title ||
      versie?.label;
    if (
      versieName &&
      standaardenversiesMap.byName[String(versieName).toLowerCase()]
    ) {
      return standaardenversiesMap.byName[String(versieName).toLowerCase()];
    }

    return {};
  };

  // Extract standaardversie information from data
  const extractStandaardversieInfo = (versie, fetchedData = {}) => {
    // Prioritize fetched data, fall back to original versie data
    const name =
      fetchedData.xml?.name?._value ||
      fetchedData.name ||
      fetchedData.naam ||
      fetchedData.title ||
      fetchedData.label ||
      versie?.xml?.name?._value ||
      versie?.name ||
      versie?.naam ||
      versie?.title ||
      versie?.label ||
      (typeof versie === 'string' ? versie : getStandardId(versie));

    const description =
      fetchedData.xml?.documentation?._value ||
      fetchedData.summary ||
      fetchedData.documentation ||
      fetchedData.beschrijving ||
      fetchedData.description ||
      versie?.xml?.documentation?._value ||
      versie?.summary ||
      versie?.documentation ||
      versie?.beschrijving ||
      versie?.description ||
      '';

    // Get versieaanduiding (version indicator) if available
    const versieaanduiding =
      fetchedData.versieaanduiding || versie?.versieaanduiding || '';

    // Get status if available
    const status = fetchedData.status || versie?.status || '';

    return { name, description, versieaanduiding, status };
  };

  // Get all standaardversies from referentieComponentenWithStandards
  // This traverses: referentieComponenten → standaarden → standaardVersies
  const getAllStandaardVersies = () => {
    const versiesMap = new Map();

    referentieComponentenWithStandards.forEach((refComp) => {
      const refCompName = refComp.naam || `Component ${refComp.id}`;

      // Helper function to process standards and extract their versions
      const processStandards = (standards, isVerplicht) => {
        if (!standards || !Array.isArray(standards)) return;

        standards.forEach((standard) => {
          const standardId = getStandardId(standard);
          if (!standardId) return;

          // Find the full standard data to get standaardVersies
          const fetchedStandardData = findMatchingStandardData(standard);
          const standardData = { ...standard, ...fetchedStandardData };

          // Get standaardVersies array from the standard
          const standaardVersies = standardData.standaardVersies || [];

          // If no versions found, skip this standard
          if (!Array.isArray(standaardVersies) || standaardVersies.length === 0) {
            return;
          }

          // Process each standaardversie
          standaardVersies.forEach((versie) => {
            const versieId = getStandardId(versie);
            if (!versieId) return;

            // Find matching data from fetched standaardversies
            const fetchedVersieData = findMatchingStandaardversieData(versie);
            const {
              name: versieName,
              description: versieDescription,
              versieaanduiding,
              status,
            } = extractStandaardversieInfo(versie, fetchedVersieData);

            const compositeKey = String(versieId);

            if (versiesMap.has(compositeKey)) {
              // Versie already exists, add this component to the appropriate list
              const existing = versiesMap.get(compositeKey);
              if (isVerplicht) {
                if (!existing.verplichteComponents.includes(refCompName)) {
                  existing.verplichteComponents.push(refCompName);
                }
              } else {
                if (!existing.aanbevolenComponents.includes(refCompName)) {
                  existing.aanbevolenComponents.push(refCompName);
                }
              }
              // Update with better data if available
              if (fetchedVersieData && Object.keys(fetchedVersieData).length > 0) {
                existing.naam = versieName;
                existing.beschrijving = versieDescription;
                existing.versieaanduiding = versieaanduiding;
                existing.status = status;
                existing.fetchedData = fetchedVersieData;
              }
            } else {
              // New standaardversie
              versiesMap.set(compositeKey, {
                id: versieId,
                naam: versieName,
                beschrijving: versieDescription,
                versieaanduiding,
                status,
                aanbevolenComponents: isVerplicht ? [] : [refCompName],
                verplichteComponents: isVerplicht ? [refCompName] : [],
                fetchedData: fetchedVersieData,
                // Store parent standard info for reference
                parentStandardId: standardId,
              });
            }
          });
        });
      };

      // Process aanbevolen standaarden (isVerplicht = false)
      processStandards(refComp.aanbevolenStandaarden, false);

      // Process verplichte standaarden (isVerplicht = true)
      processStandards(refComp.verplichteStandaarden, true);
    });

    return Array.from(versiesMap.values());
  };

  const allStandards = useMemo(() => {
    const result = getAllStandaardVersies();
    return result;
  }, [referentieComponentenWithStandards, standaardenMap, standaardenversiesMap]);

  // Get IDs of standaardversies already in referentieComponenten (aanbevolen and verplicht)
  const existingStandardIds = useMemo(() => {
    const ids = new Set();

    allStandards.forEach((standaardversie) => {
      // Add primary ID
      ids.add(String(standaardversie.id));

      // Add alternative IDs from fetched data
      const fetchedData = findMatchingStandaardversieData({
        id: standaardversie.id,
      });
      if (fetchedData) {
        ['id', 'identifier', 'value', 'slug'].forEach((key) => {
          if (fetchedData[key]) ids.add(String(fetchedData[key]));
        });
      }
    });

    return ids;
  }, [allStandards, standaardenversiesMap]);

  // Filter standaardenversiesOptions to exclude versions already in referentieComponenten
  const availableExtraStandardsOptions = useMemo(() => {
    return (standaardenversiesOptions || []).filter((option) => {
      // Collect all possible IDs from the option
      const optionIds = [
        option.value,
        option.data?.id,
        option.data?.identifier,
        option.data?.value,
        option.data?.slug,
      ]
        .filter(Boolean)
        .map(String);

      // Check if any ID matches existing standaardversies
      return !optionIds.some((optionId) => existingStandardIds.has(optionId));
    });
  }, [standaardenversiesOptions, existingStandardIds]);

  // Clean up selectedExtraStandards when standards move to referentieComponenten
  useEffect(() => {
    const allStandardsIds = new Set(
      allStandards.map((standard) => String(standard.id))
    );

    // Check if allStandardsIds actually changed
    const idsChanged =
      prevAllStandardsIdsRef.current.size !== allStandardsIds.size ||
      Array.from(prevAllStandardsIdsRef.current).some(
        (standardId) => !allStandardsIds.has(standardId)
      ) ||
      Array.from(allStandardsIds).some(
        (standardId) => !prevAllStandardsIdsRef.current.has(standardId)
      );

    if (!idsChanged) {
      return;
    }

    // Update ref
    prevAllStandardsIdsRef.current = allStandardsIds;

    setSelectedExtraStandards((prev) => {
      // Check if any selectedExtraStandards need to be removed
      const needsCleanup = prev.some((option) =>
        allStandardsIds.has(String(option.value))
      );

      if (!needsCleanup) {
        return prev; // Return same reference if no changes
      }

      const filtered = prev.filter(
        (option) => !allStandardsIds.has(String(option.value))
      );
      return filtered;
    });
  }, [allStandards, setSelectedExtraStandards]);

  // Clean up orphaned compliancy entries when referentieComponenten or selectedExtraStandards change
  useEffect(() => {
    // Get all valid standaardversie IDs (from both referentieComponenten and selectedExtraStandards)
    const validStandaardversieIds = new Set();

    // Add standaardversies from referentieComponenten (allStandards now contains versions)
    allStandards.forEach((standaardversie) => {
      // Add primary ID
      validStandaardversieIds.add(String(standaardversie.id));

      // Add alternative IDs from fetched data to handle different identifier formats
      const fetchedData = findMatchingStandaardversieData({
        id: standaardversie.id,
      });
      if (fetchedData) {
        ['id', 'identifier', 'value', 'slug', 'uuid'].forEach((key) => {
          if (fetchedData[key])
            validStandaardversieIds.add(String(fetchedData[key]));
        });
      }
    });

    // Add standaardversies from selectedExtraStandards
    selectedExtraStandards.forEach((option) => {
      const versieId = String(option.value);
      validStandaardversieIds.add(versieId);

      // Also add alternative IDs
      const fetchedData = findMatchingStandaardversieData({ id: versieId });
      if (fetchedData) {
        ['id', 'identifier', 'value', 'slug', 'uuid'].forEach((key) => {
          if (fetchedData[key])
            validStandaardversieIds.add(String(fetchedData[key]));
        });
      }
    });

    // Check if any compliancy entries need to be removed
    // Only remove entries that have no data AND are not in valid standaardversies
    const currentCompliancy = Array.isArray(applicatie.compliancy)
      ? applicatie.compliancy
      : [];

    // Find orphaned entries (not in valid standaardversies)
    const orphanedCompliancy = currentCompliancy.filter(
      (compliancy) =>
        !validStandaardversieIds.has(String(compliancy.standaardversie)) &&
        !validStandaardversieIds.has(String(compliancy.standaardGemma))
    );

    // Only remove orphaned entries that have no data
    const orphanedWithoutData = orphanedCompliancy.filter(
      (compliancy) => !compliancy.bewijs && !compliancy.url
    );

    // Only update if there are orphaned entries without data to remove
    if (orphanedWithoutData.length > 0) {
      console.info(
        `🧹 Cleaning up ${orphanedWithoutData.length} orphaned compliancy entries without data`
      );

      // Keep entries that are in valid standaardversies OR have data
      const cleanedCompliancy = currentCompliancy.filter(
        (compliancy) =>
          validStandaardversieIds.has(String(compliancy.standaardversie)) ||
          validStandaardversieIds.has(String(compliancy.standaardGemma)) ||
          compliancy.bewijs ||
          compliancy.url
      );

      setApplicatieData('compliancy', cleanedCompliancy);
    }

    // Always clean up standaardversies array (compliance indicator)
    const currentStandaardversies = Array.isArray(applicatie.standaardVersies)
      ? applicatie.standaardVersies
      : [];
    const cleanedStandaardversies = currentStandaardversies.filter((versieId) =>
      validStandaardversieIds.has(String(versieId))
    );
    if (cleanedStandaardversies.length !== currentStandaardversies.length) {
      setApplicatieData('standaardVersies', cleanedStandaardversies);
    }

    // Always clean up standaardenGemma array (compliance indicator)
    const currentStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
      ? applicatie.standaardenGemma
      : [];
    const cleanedStandaardenGemma = currentStandaardenGemma.filter((gemmaId) =>
      validStandaardversieIds.has(String(gemmaId))
    );
    if (cleanedStandaardenGemma.length !== currentStandaardenGemma.length) {
      setApplicatieData('standaardenGemma', cleanedStandaardenGemma);
    }
  }, [
    allStandards,
    selectedExtraStandards,
    applicatie.compliancy,
    applicatie.standaardVersies,
    applicatie.standaardenGemma,
    setApplicatieData,
    standaardenversiesMap,
  ]);

  // Initialize table state based on existing compliancy data
  useEffect(() => {
    const initialState = {};

    // Get standaardversies array to check compliance status
    // Also check legacy standaarden array for backwards compatibility
    const standaardversiesArray = Array.isArray(applicatie.standaardVersies)
      ? applicatie.standaardVersies.map(String)
      : [];
    const legacyStandaardenArray = Array.isArray(applicatie.standaarden)
      ? applicatie.standaarden.map(String)
      : [];
    // Combine both arrays for checking compliance
    const allCompliantIds = new Set([
      ...standaardversiesArray,
      ...legacyStandaardenArray,
    ]);

    // Add standaardversies from referentieComponenten
    allStandards.forEach((standaardversie) => {
      const key = standaardversie.id;

      // Check if there's existing compliancy data (load even if not compliant)
      const existingCompliancy = (applicatie.compliancy || []).find(
        (compliancy) => compliancy.standaardversie === standaardversie.id
      );

      // Check standaardversies and legacy standaarden arrays to determine compliance status
      const isCompliant = allCompliantIds.has(String(standaardversie.id));

      // Determine the primary type (verplicht takes precedence)
      const primaryType =
        standaardversie.verplichteComponents.length > 0 ? 'verplicht' : 'aanbevolen';

      // Build component information display
      const componentInfo = [];
      if (standaardversie.verplichteComponents.length > 0) {
        componentInfo.push(
          `VERPLICHT (${standaardversie.verplichteComponents.join(', ')})`
        );
      }
      if (standaardversie.aanbevolenComponents.length > 0) {
        componentInfo.push(
          `AANBEVOLEN (${standaardversie.aanbevolenComponents.join(', ')})`
        );
      }

      initialState[key] = {
        standardId: standaardversie.id,
        standardName: standaardversie.naam,
        standardDescription: standaardversie.beschrijving,
        versieaanduiding: standaardversie.versieaanduiding,
        status: standaardversie.status,
        standardType: primaryType,
        componentInfo: componentInfo.join(', '),
        verplichteComponents: standaardversie.verplichteComponents,
        aanbevolenComponents: standaardversie.aanbevolenComponents,
        isCompliant,
        // Load compliancy data even if not compliant (preserved data)
        bewijs: existingCompliancy?.bewijs || null,
        bewijsFilename: existingCompliancy?.bewijsFilename || null,
        url: existingCompliancy?.url || null,
      };
    });

    // Add extra standaardversies from multi-select
    selectedExtraStandards.forEach((selectedOption) => {
      const optionValue = String(selectedOption.value);
      const fetchedData = findMatchingStandaardversieData({ id: optionValue });

      // Use the identifier property from fetched data (like pre-selected standards do)
      // The identifier contains the proper id- prefixed format
      const versieId = fetchedData?.identifier || fetchedData?.id || optionValue;

      if (!initialState[versieId]) {
        const {
          name: versieName,
          description: versieDescription,
          versieaanduiding,
          status,
        } = extractStandaardversieInfo({ id: optionValue }, fetchedData);

        // Check all possible ID formats for existing compliancy
        // The compliancy might be stored with different ID formats
        const existingCompliancy = (applicatie.compliancy || []).find(
          (compliancy) => {
            const compVersieId = compliancy.standaardversie;
            // Direct match
            if (compVersieId === versieId) return true;
            if (compVersieId === optionValue) return true;
            // Also check if the compliancy's standaardversie matches any of the fetched data IDs
            if (fetchedData?.identifier && compVersieId === fetchedData.identifier)
              return true;
            if (fetchedData?.id && compVersieId === fetchedData.id) return true;
            if (fetchedData?.value && compVersieId === fetchedData.value)
              return true;
            // Check standaardGemma as well
            if (compliancy.standaardGemma === versieId) return true;
            if (compliancy.standaardGemma === optionValue) return true;
            return false;
          }
        );

        // Check standaardversies and legacy standaarden arrays to determine compliance status
        // Check both possible ID formats
        const isCompliant =
          allCompliantIds.has(versieId) || allCompliantIds.has(optionValue);

        initialState[versieId] = {
          standardId: versieId,
          standardName: versieName,
          standardDescription: versieDescription,
          versieaanduiding,
          status,
          standardType: 'toegevoegd',
          componentInfo: 'TOEGEVOEGD',
          verplichteComponents: [],
          aanbevolenComponents: [],
          isCompliant,
          // Load compliancy data even if not compliant (preserved data)
          bewijs: existingCompliancy?.bewijs || null,
          bewijsFilename: existingCompliancy?.bewijsFilename || null,
          url: existingCompliancy?.url || null,
        };
      }
    });

    // Only update if the state actually changed
    const currentKeys = Object.keys(tableState);
    const newKeys = Object.keys(initialState);
    const keysChanged =
      currentKeys.length !== newKeys.length ||
      currentKeys.some((key) => !initialState[key]) ||
      newKeys.some((key) => {
        const current = tableState[key];
        const next = initialState[key];
        return (
          !current ||
          current.isCompliant !== next.isCompliant ||
          current.bewijs !== next.bewijs ||
          current.url !== next.url ||
          current.bewijsFilename !== next.bewijsFilename
        );
      });

    if (!keysChanged && currentKeys.length > 0) {
      return;
    }

    setTableState(initialState);
  }, [
    applicatie.compliancy,
    applicatie.standaardVersies,
    referentieComponentenWithStandards,
    standaardenversiesMap,
    selectedExtraStandards,
  ]);

  // Force re-sync table state when selectedExtraStandards changes
  // This ensures compliancy data is properly loaded for newly selected extra standards
  const prevSelectedExtraStandardsRef = useRef([]);
  useEffect(() => {
    const prevIds = new Set(
      prevSelectedExtraStandardsRef.current.map((s) => String(s.value))
    );
    const currentIds = new Set(selectedExtraStandards.map((s) => String(s.value)));

    // Check if the selection actually changed (not just a reference change)
    const selectionChanged =
      prevIds.size !== currentIds.size ||
      [...currentIds].some((id) => !prevIds.has(id));

    if (selectionChanged && selectedExtraStandards.length > 0) {
      // Update the table state for extra standards with their compliancy data
      setTableState((prev) => {
        const updated = { ...prev };

        selectedExtraStandards.forEach((selectedOption) => {
          const optionValue = String(selectedOption.value);
          const fetchedData = findMatchingStandaardversieData({ id: optionValue });
          const versieId = fetchedData?.identifier || fetchedData?.id || optionValue;

          // Find existing compliancy for this extra standard
          const existingCompliancy = (applicatie.compliancy || []).find(
            (compliancy) => {
              const compVersieId = compliancy.standaardversie;
              if (compVersieId === versieId) return true;
              if (compVersieId === optionValue) return true;
              if (fetchedData?.identifier && compVersieId === fetchedData.identifier)
                return true;
              if (fetchedData?.id && compVersieId === fetchedData.id) return true;
              if (fetchedData?.value && compVersieId === fetchedData.value)
                return true;
              if (compliancy.standaardGemma === versieId) return true;
              if (compliancy.standaardGemma === optionValue) return true;
              return false;
            }
          );

          // Update the entry if it exists and has compliancy data to load
          if (updated[versieId] && existingCompliancy) {
            updated[versieId] = {
              ...updated[versieId],
              isCompliant: true,
              bewijs: existingCompliancy.bewijs || updated[versieId].bewijs || null,
              bewijsFilename:
                existingCompliancy.bewijsFilename ||
                updated[versieId].bewijsFilename ||
                null,
              url: existingCompliancy.url || updated[versieId].url || null,
            };
          }
        });

        return updated;
      });
    }

    prevSelectedExtraStandardsRef.current = selectedExtraStandards;
  }, [selectedExtraStandards, applicatie.compliancy, standaardenversiesMap]);

  // Handle extra standaardversies selection change
  const handleExtraStandardsChange = (selectedOptions) => {
    const newSelected = selectedOptions || [];
    const newSelectedIds = new Set(
      newSelected.map((option) => String(option.value))
    );
    const prevSelectedIds = new Set(
      selectedExtraStandards.map((option) => String(option.value))
    );

    // Find standaardversies that were removed
    const removedVersies = selectedExtraStandards.filter(
      (option) => !newSelectedIds.has(String(option.value))
    );

    // Find standaardversies that were newly added
    const addedVersies = newSelected.filter(
      (option) => !prevSelectedIds.has(String(option.value))
    );

    // Handle removed standaardversies - preserve compliancy entries if they have data
    if (removedVersies.length > 0) {
      const prevCompliancy = Array.isArray(applicatie.compliancy)
        ? [...applicatie.compliancy]
        : [];

      // Only remove compliancy entries that have no data (no bewijs, no url)
      const updatedCompliancy = prevCompliancy.filter((compliancy) => {
        const isRemovedVersie = removedVersies.some(
          (option) => String(option.value) === String(compliancy.standaardversie)
        );

        if (!isRemovedVersie) {
          // Keep entries for standaardversies that weren't removed
          return true;
        }

        // For removed standaardversies, only keep if they have data
        const hasData = compliancy.bewijs || compliancy.url;
        return hasData;
      });

      setApplicatieData('compliancy', updatedCompliancy);

      // Always remove from standaardversies array (compliance indicator)
      const prevStandaardversies = Array.isArray(applicatie.standaardVersies)
        ? [...applicatie.standaardVersies]
        : [];
      const updatedStandaardversies = prevStandaardversies.filter(
        (versieId) =>
          !removedVersies.some((option) => String(option.value) === String(versieId))
      );
      setApplicatieData('standaardVersies', updatedStandaardversies);

      // Always remove from standaardenGemma array (compliance indicator)
      const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
        ? [...applicatie.standaardenGemma]
        : [];
      removedVersies.forEach((option) => {
        const versieData = findMatchingStandaardversieData({ id: option.value });
        // Use identifier for consistency with id- prefix format
        const objectId =
          versieData?.identifier || versieData?.id || versieData?.objectId || null;
        if (objectId) {
          const index = prevStandaardenGemma.indexOf(objectId);
          if (index > -1) {
            prevStandaardenGemma.splice(index, 1);
          }
        }
      });
      setApplicatieData('standaardenGemma', prevStandaardenGemma);
    }

    // Automatically mark newly added standaardversies as compliant
    if (addedVersies.length > 0) {
      const prevCompliancy = Array.isArray(applicatie.compliancy)
        ? [...applicatie.compliancy]
        : [];
      const updatedCompliancy = [...prevCompliancy];

      const prevStandaardversies = Array.isArray(applicatie.standaardVersies)
        ? [...applicatie.standaardVersies]
        : [];
      const updatedStandaardversies = [...prevStandaardversies];

      const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
        ? [...applicatie.standaardenGemma]
        : [];
      const updatedStandaardenGemma = [...prevStandaardenGemma];

      addedVersies.forEach((option) => {
        const optionValue = String(option.value);
        const versieData = findMatchingStandaardversieData({ id: optionValue });

        // Use the identifier property from fetched data (like pre-selected standards do)
        // The identifier contains the proper id- prefixed format
        const versieId = versieData?.identifier || versieData?.id || optionValue;

        const { name: versieName } = extractStandaardversieInfo(
          { id: optionValue },
          versieData
        );

        // Use identifier for standaardGemma as well to maintain consistency
        const objectId =
          versieData?.identifier || versieData?.id || versieData?.objectId || null;

        // Check if compliancy entry already exists (check both possible ID formats)
        const existingIndex = updatedCompliancy.findIndex(
          (compliancy) =>
            compliancy.standaardversie === versieId ||
            compliancy.standaardversie === optionValue
        );

        if (existingIndex < 0) {
          // Create new compliancy entry with the identifier format
          updatedCompliancy.push({
            standaardversie: versieId,
            standaardGemma: objectId,
            standaardnaam: versieName,
            bewijs: null,
            bewijsFilename: null,
            url: null,
          });
        }

        // Add to standaardVersies array if not already present (check both formats)
        if (
          !updatedStandaardversies.includes(versieId) &&
          !updatedStandaardversies.includes(optionValue)
        ) {
          updatedStandaardversies.push(versieId);
        }

        // Add to standaardenGemma array if not already present
        if (objectId && !updatedStandaardenGemma.includes(objectId)) {
          updatedStandaardenGemma.push(objectId);
        }
      });

      setApplicatieData('compliancy', updatedCompliancy);
      setApplicatieData('standaardVersies', updatedStandaardversies);
      setApplicatieData('standaardenGemma', updatedStandaardenGemma);
    }

    setSelectedExtraStandards(newSelected);
  };

  // Toggle compliance for a specific standaardversie
  const toggleCompliance = (key, isCompliant) => {
    const currentEntry = tableState[key];
    if (!currentEntry) {
      console.warn('No entry found for key:', key);
      return;
    }

    // Update tableState
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isCompliant,
        // Preserve bewijs, filename, and url regardless of compliance status
        bewijs: prev[key]?.bewijs || null,
        bewijsFilename: prev[key]?.bewijsFilename || null,
        url: prev[key]?.url || null,
      },
    }));

    // Update applicatie data
    // Always preserve compliancy entries - never remove them
    const prevCompliancy = Array.isArray(applicatie.compliancy)
      ? [...applicatie.compliancy]
      : [];

    // Find the standaardversie data to get the objectId
    const versieData = findMatchingStandaardversieData({
      id: currentEntry.standardId,
    });
    // Use identifier for standaardGemma to maintain consistency with id- prefix format
    const objectId =
      versieData?.identifier || versieData?.id || versieData?.objectId || null;

    // Find existing compliancy entry or create new one
    const existingIndex = prevCompliancy.findIndex(
      (compliancy) => compliancy.standaardversie === currentEntry.standardId
    );

    const compliancyObject = {
      standaardversie: currentEntry.standardId,
      standaardGemma: objectId,
      standaardnaam: currentEntry.standardName,
      // Preserve all data from current entry
      bewijs: currentEntry.bewijs || null,
      bewijsFilename: currentEntry.bewijsFilename || null,
      url: currentEntry.url || null,
    };

    // Always update or add the compliancy entry (never remove)
    if (existingIndex >= 0) {
      prevCompliancy[existingIndex] = compliancyObject;
    } else {
      prevCompliancy.push(compliancyObject);
    }

    setApplicatieData('compliancy', prevCompliancy);

    // Update standaardversies and standaardenGemma arrays based on compliance status
    const prevStandaardversies = Array.isArray(applicatie.standaardVersies)
      ? [...applicatie.standaardVersies]
      : [];
    let newStandaardversies = prevStandaardversies;

    if (isCompliant) {
      // Add to array if not already present
      if (!newStandaardversies.includes(currentEntry.standardId)) {
        newStandaardversies.push(currentEntry.standardId);
      }
    } else {
      // Remove from array (but keep in compliancy)
      const versieIndex = newStandaardversies.indexOf(currentEntry.standardId);
      if (versieIndex > -1) {
        newStandaardversies.splice(versieIndex, 1);
      }
    }

    setApplicatieData('standaardVersies', newStandaardversies);

    const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
      ? [...applicatie.standaardenGemma]
      : [];
    let newStandaardenGemma = prevStandaardenGemma;

    if (isCompliant) {
      if (objectId && !newStandaardenGemma.includes(objectId)) {
        newStandaardenGemma.push(objectId);
      }
    } else {
      // Remove from array (but keep in compliancy)
      if (objectId) {
        const objectIndex = newStandaardenGemma.indexOf(objectId);
        if (objectIndex > -1) {
          newStandaardenGemma.splice(objectIndex, 1);
        }
      }
    }

    setApplicatieData('standaardenGemma', newStandaardenGemma);
  };

  // Update bewijs for a specific standard
  const updateBewijs = (key, bewijs) => {
    const entry = tableState[key];
    if (!entry) return;

    // Update tableState
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bewijs,
        url: null, // Clear URL when file is uploaded (mutually exclusive)
      },
    }));

    // Update applicatie data
    const prevCompliancy = Array.isArray(applicatie.compliancy)
      ? [...applicatie.compliancy]
      : [];
    const updatedCompliancy = prevCompliancy.map((c) =>
      c.standaardversie === entry.standardId
        ? {
            ...c,
            standaardnaam: entry.standardName,
            bewijs,
            bewijsFilename: c.bewijsFilename || entry.bewijsFilename || null,
            url: null, // Clear URL when file is uploaded (mutually exclusive)
          }
        : c
    );

    setApplicatieData('compliancy', updatedCompliancy);
  };

  // Update URL for a specific standard
  const updateUrl = (key, url) => {
    const entry = tableState[key];
    if (!entry) return;

    // Update tableState
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        url,
        bewijs: null, // Clear file when URL is set (mutually exclusive)
        bewijsFilename: null,
      },
    }));

    // Update applicatie data
    const prevCompliancy = Array.isArray(applicatie.compliancy)
      ? [...applicatie.compliancy]
      : [];
    const updatedCompliancy = prevCompliancy.map((c) =>
      c.standaardversie === entry.standardId
        ? {
            ...c,
            standaardnaam: entry.standardName,
            url,
            bewijs: null, // Clear file when URL is set (mutually exclusive)
            bewijsFilename: null,
          }
        : c
    );

    setApplicatieData('compliancy', updatedCompliancy);
  };

  // Update bewijs filename for a specific standard
  const updateBewijsFilename = (key, filename) => {
    const entry = tableState[key];
    if (!entry) return;

    // Update tableState
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bewijsFilename: filename,
      },
    }));

    // Update applicatie data
    const prevCompliancy = Array.isArray(applicatie.compliancy)
      ? [...applicatie.compliancy]
      : [];
    const updatedCompliancy = prevCompliancy.map((c) =>
      c.standaardversie === entry.standardId
        ? {
            ...c,
            standaardnaam: entry.standardName,
            bewijsFilename: filename,
            bewijs: c.bewijs || entry.bewijs || null,
          }
        : c
    );

    setApplicatieData('compliancy', updatedCompliancy);
  };

  // Clear both bewijs and filename
  const clearBewijs = (key) => {
    const entry = tableState[key];
    if (!entry) return;

    // Update tableState
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bewijs: null,
        bewijsFilename: null,
      },
    }));

    // Update applicatie data
    const prevCompliancy = Array.isArray(applicatie.compliancy)
      ? [...applicatie.compliancy]
      : [];
    const updatedCompliancy = prevCompliancy.map((c) =>
      c.standaardversie === entry.standardId
        ? {
            ...c,
            standaardnaam: entry.standardName,
            bewijs: null,
            bewijsFilename: null,
          }
        : c
    );

    setApplicatieData('compliancy', updatedCompliancy);
  };

  // Generate filename from data URL
  const generateFilenameFromDataUrl = (dataUrl, standardName) => {
    if (!dataUrl || typeof dataUrl !== 'string') return null;

    // Extract MIME type from data URL
    const mimeMatch = dataUrl.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    // Map MIME types to extensions
    const extensionMap = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
    };

    const extension = extensionMap[mimeType] || 'file';
    const safeName = standardName.replace(/[^a-zA-Z0-9]/g, '_');

    return `bewijs_${safeName}.${extension}`;
  };

  // Ensure compliancy objects have standardName and bewijsFilename properties
  useEffect(() => {
    if (Object.keys(tableState).length > 0) {
      const entriesWithCompliancy = Object.values(tableState).filter(
        (entry) => entry.isCompliant
      );

      if (entriesWithCompliancy.length > 0) {
        const prevCompliancy = Array.isArray(applicatie.compliancy)
          ? [...applicatie.compliancy]
          : [];
        let hasChanges = false;
        let updatedCompliancy = [...prevCompliancy];

        entriesWithCompliancy.forEach((entry) => {
          const existingIndex = updatedCompliancy.findIndex(
            (c) => c.standaardversie === entry.standardId
          );

          if (existingIndex >= 0) {
            const existing = updatedCompliancy[existingIndex];

            // Check if we need to add missing properties
            const needsStandardName = !existing.standaardnaam;
            const needsFilename =
              existing.bewijs && !existing.bewijsFilename && entry.bewijsFilename;

            if (needsStandardName || needsFilename) {
              // Generate filename if missing and we have bewijs data
              const generatedFilename =
                needsFilename && !entry.bewijsFilename
                  ? generateFilenameFromDataUrl(existing.bewijs, entry.standardName)
                  : entry.bewijsFilename;

              updatedCompliancy[existingIndex] = {
                ...existing,
                ...(needsStandardName && { standaardnaam: entry.standardName }),
                ...(needsFilename &&
                  generatedFilename && { bewijsFilename: generatedFilename }),
              };

              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          setApplicatieData('compliancy', updatedCompliancy);
        }
      }
    }
  }, [
    JSON.stringify(
      Object.entries(tableState)
        .filter(([, entry]) => entry.isCompliant)
        .map(([key, entry]) => ({
          key,
          standardId: entry.standardId,
          isCompliant: entry.isCompliant,
        }))
    ),
  ]);

  // Ensure standaardGemma, standaarden, and standaardenGemma arrays are properly synchronized
  useEffect(() => {
    if (Object.keys(tableState).length === 0) return;

    const prevCompliancy = Array.isArray(applicatie.compliancy)
      ? [...applicatie.compliancy]
      : [];
    if (prevCompliancy.length === 0) return;

    // Early return if standaardenversiesMap is not ready (empty)
    if (
      !standaardenversiesMap ||
      Object.keys(standaardenversiesMap.byId || {}).length === 0
    )
      return;

    let compliancyHasChanges = false;
    let updatedCompliancy = [...prevCompliancy];

    prevCompliancy.forEach((comp, compIndex) => {
      const versieId = comp.standaardversie;
      if (!versieId) return;

      // Find the standaardversie data to get the objectId
      const versieData = findMatchingStandaardversieData({ id: versieId });
      // Use identifier for consistency with id- prefix format
      const objectId =
        versieData?.identifier || versieData?.id || versieData?.objectId || null;

      // Check if standaardGemma is missing and needs to be filled
      if (!comp.standaardGemma && objectId) {
        updatedCompliancy[compIndex] = {
          ...comp,
          standaardGemma: objectId,
        };
        compliancyHasChanges = true;
      }
    });

    if (compliancyHasChanges) {
      setApplicatieData('compliancy', updatedCompliancy);
    }

    // Only sync standaardversies arrays for entries that are actually compliant
    // Check tableState to determine which standaardversies are compliant
    const compliantVersieIds = new Set();
    Object.values(tableState).forEach((entry) => {
      if (entry.isCompliant && entry.standardId) {
        compliantVersieIds.add(String(entry.standardId));
      }
    });

    const compliancy = applicatie.compliancy || [];
    const prevStandaardversies = Array.isArray(applicatie.standaardVersies)
      ? [...applicatie.standaardVersies]
      : [];
    let standaardversiesHasChanges = false;
    let updatedStandaardversies = [...prevStandaardversies];

    // Only add standaardversies to standaardversies array if they're actually compliant
    compliancy.forEach((comp) => {
      const versieId = comp.standaardversie;
      if (!versieId) return;

      // Only add if compliant (in tableState with isCompliant=true) and not already in array
      if (
        compliantVersieIds.has(String(versieId)) &&
        !updatedStandaardversies.includes(versieId)
      ) {
        updatedStandaardversies.push(versieId);
        standaardversiesHasChanges = true;
      }
    });

    if (standaardversiesHasChanges) {
      setApplicatieData('standaardVersies', updatedStandaardversies);
    }

    const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
      ? [...applicatie.standaardenGemma]
      : [];
    let standaardenGemmaHasChanges = false;
    let updatedStandaardenGemma = [...prevStandaardenGemma];

    // Only add standaardversies to standaardenGemma array if they're actually compliant
    compliancy.forEach((comp) => {
      const versieId = comp.standaardversie;
      if (!versieId) return;

      // Only add if compliant (in tableState with isCompliant=true)
      if (!compliantVersieIds.has(String(versieId))) return;

      // Find the standaardversie data to get the objectId
      const versieData = findMatchingStandaardversieData({ id: versieId });
      // Use identifier for consistency with id- prefix format
      const objectId =
        versieData?.identifier || versieData?.id || versieData?.objectId || null;

      // Check if objectId is missing from standaardenGemma array
      if (objectId && !updatedStandaardenGemma.includes(objectId)) {
        updatedStandaardenGemma.push(objectId);
        standaardenGemmaHasChanges = true;
      }
    });

    if (standaardenGemmaHasChanges) {
      setApplicatieData('standaardenGemma', updatedStandaardenGemma);
    }
  }, [tableState, applicatie.compliancy, standaardenversiesMap, setApplicatieData]);

  // If no standaardversies available, show message
  if (standaardenOptionsLoading || standaardenversiesOptionsLoading) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaardversies
        </h2>
        <Paragraph>Standaardversies laden...</Paragraph>
      </div>
    );
  }

  if (allStandards.length === 0 && selectedExtraStandards.length === 0) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaardversies
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Selecteer de standaardversies voor uw applicatie</strong>
          <br />
          Geef voor uw applicatie aan welke standaarden worden ondersteund en of een
          testrapport beschikbaar is. Er worden de standaarden getoond die verplicht
          of aanbevolen zijn voor de in de vorige stap geselecteerde
          referentiecomponenten. Dit helpt gemeenten te beoordelen hoe uw software
          past in hun architectuur en vergemakkelijkt integraties. Voor{' '}
          <Link
            href='https://www.gemmaonline.nl/wiki/GEMMA_standaardenlijst'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'inline-block',
            }}
          >
            een overzicht van alle standaarden
          </Link>{' '}
          kunt u terecht op GEMMA Online.
        </Paragraph>

        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          <Paragraph>
            <strong>Geen standaardversies beschikbaar</strong>
          </Paragraph>
          <Paragraph>
            Aan de geselecteerde referentiecomponenten zijn momenteel geen
            standaardversies gekoppeld. U kunt hieronder handmatig standaardversies
            toevoegen of teruggaan om andere referentiecomponenten te selecteren.
          </Paragraph>
        </div>

        {/* Extra standaardversies multi-select - always show when options available */}
        {availableExtraStandardsOptions.length > 0 && (
          <div style={{ marginBlock: '1.5rem' }}>
            <Paragraph style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
              Voeg standaardversies toe
            </Paragraph>
            <ReactSelect
              isMulti
              className='ac-beheer-select'
              options={availableExtraStandardsOptions}
              value={selectedExtraStandards}
              onChange={handleExtraStandardsChange}
              isLoading={standaardenversiesOptionsLoading}
              closeMenuOnSelect={false}
              placeholder='Zoek en selecteer standaardversies...'
              isSearchable={true}
            />
          </div>
        )}
      </div>
    );
  }

  // Split entries by type
  const allEntries = Object.values(tableState);
  const verplichtEntries = allEntries
    .filter((entry) => entry.standardType === 'verplicht')
    .sort((a, b) => (a.standardName || '').localeCompare(b.standardName || ''));
  const aanbevolenEntries = allEntries
    .filter((entry) => entry.standardType === 'aanbevolen')
    .sort((a, b) => (a.standardName || '').localeCompare(b.standardName || ''));
  const extraEntries = allEntries
    .filter((entry) => entry.standardType === 'toegevoegd')
    .sort((a, b) => (a.standardName || '').localeCompare(b.standardName || ''));

  // Helper function to render a table row for an entry
  const renderEntryRow = (entry) => {
    const entryKey = entry.key || entry.standardId;
    return (
      <TableRow key={entryKey}>
        {/* Standaard column */}
        <TableCell style={{ verticalAlign: 'top', padding: '12px' }}>
          <div
            style={{
              fontWeight: '500',
              marginBottom: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            {entry.standardName}
          </div>
          {entry.standardDescription && (
            <div
              style={{
                fontSize: '0.85rem',
                color: '#6c757d',
                lineHeight: '1.4',
                marginBottom: '0.5rem',
              }}
            >
              {entry.standardDescription}
            </div>
          )}
          {/* Component badges - individual badge per component */}
          <div
            style={{
              marginBottom: '0.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem',
            }}
          >
            {/* Render individual badges for verplichte components */}
            {entry.verplichteComponents.map((componentName, index) => (
              <span
                key={`verplicht-${index}`}
                className='con-standaard-badge con-standaard-badge--verplicht'
              >
                VERPLICHT - {componentName}
              </span>
            ))}

            {/* Render individual badges for aanbevolen components */}
            {entry.aanbevolenComponents.map((componentName, index) => (
              <span
                key={`aanbevolen-${index}`}
                className='con-standaard-badge con-standaard-badge--aanbevolen'
              >
                AANBEVOLEN - {componentName}
              </span>
            ))}

            {/* Render badge for extra standards */}
            {entry.standardType === 'toegevoegd' && (
              <span className='con-standaard-badge con-standaard-badge--toegevoegd'>
                TOEGEVOEGD
              </span>
            )}
          </div>
        </TableCell>

        {/* Compliant column */}
        <TableCell
          style={{
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: '12px',
            width: '100px',
          }}
        >
          <AcCheckbox
            checked={entry.isCompliant || false}
            onChange={(checked) => toggleCompliance(entryKey, checked)}
            label=''
            id={`compliant-${entryKey}`}
          />
        </TableCell>

        {/* Bewijs column (file upload and URL) */}
        <TableCell
          style={{
            verticalAlign: 'top',
            minWidth: '250px',
            padding: '12px',
          }}
        >
          {entry.isCompliant && (
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
                  filename: entry.bewijs ? 'Bestand geüpload' : '',
                }}
                _value={entry.bewijs || ''}
                onChange={(dataUrl) => updateBewijs(entryKey, dataUrl)}
                onChangeFileName={(filename) =>
                  updateBewijsFilename(entryKey, filename)
                }
                onClear={() => clearBewijs(entryKey)}
                accept={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                showPreview={false}
                validation={{ required: false }}
                propertyName={`bewijs-${entryKey}`}
                size='small'
                isDisabled={!!entry.url}
              />
              <Separator />
              <div>
                <AcFormField
                  placeholder='https://...'
                  value={entry.url || ''}
                  type='url'
                  onChange={(value) => updateUrl(entryKey, value)}
                  disabled={!!entry.bewijs}
                  className='ac-register-form-field__no-width-limit'
                  hasError={validateWebsite(entry.url)}
                />
                {entry.url && (!entry.url || !validateWebsite(entry.url)) && (
                  <span className='ac-register-form-field-error'>
                    {entry.url &&
                      !validateWebsite(entry.url) &&
                      'URL heeft een ongeldig formaat'}
                  </span>
                )}
              </div>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Create table rows with section headers
  const tableRows = [];

  // Verplicht section
  if (verplichtEntries.length > 0) {
    tableRows.push(
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
    verplichtEntries.forEach((entry) => {
      tableRows.push(renderEntryRow(entry));
    });
  }

  // Aanbevolen section
  if (aanbevolenEntries.length > 0) {
    tableRows.push(
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
    aanbevolenEntries.forEach((entry) => {
      tableRows.push(renderEntryRow(entry));
    });
  }

  // Extra section (no header)
  if (extraEntries.length > 0) {
    tableRows.push(
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
    extraEntries.forEach((entry) => {
      tableRows.push(renderEntryRow(entry));
    });
  }

  return (
    <div>
      <h2 id='standaarden-section-title' className='sr-only'>
        Selecteer de standaardversies voor uw applicatie
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Geef voor uw applicatie aan welke standaardversies worden ondersteund en of
        een testrapport beschikbaar is. Er worden de standaardversies getoond die
        verplicht of aanbevolen zijn voor de in de vorige stap geselecteerde
        referentiecomponenten. Dit helpt gemeenten te beoordelen hoe uw software past
        in hun architectuur en vergemakkelijkt integraties. Voor{' '}
        <Link
          href='https://www.gemmaonline.nl/wiki/GEMMA_standaardenlijst'
          target='_blank'
          rel='noopener noreferrer'
          style={{
            display: 'inline-block',
          }}
        >
          een overzicht van alle standaarden
        </Link>{' '}
        kunt u terecht op GEMMA Online.
      </Paragraph>

      <Alert severity='info' className='ac-forms-product-info-alert'>
        <div className='ac-forms-product-info-alert__content'>
          <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
          <div>
            <strong>Extra standaardversies toevoegen</strong>
            <br />
            <span className='ac-forms-product-info-alert__text'>
              Onderstaand overzicht toont de standaardversies die verplicht of
              aanbevolen zijn voor uw geselecteerde referentiecomponenten. Wilt u
              aanvullende standaardversies toevoegen die niet in dit overzicht staan?
              Scroll dan naar onderaan deze pagina waar u extra standaardversies kunt
              selecteren via het zoekveld.
            </span>
          </div>
        </div>
      </Alert>

      <TableContainer className='con-form-wizard-table-container'>
        <Table>
          <thead>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                Standaardversie
              </TableCell>
              <TableCell
                style={{
                  fontWeight: 'bold',
                  backgroundColor: '#f8f9fa',
                  textAlign: 'center',
                }}
              >
                Ondersteund
              </TableCell>
              <TableCell style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                Bewijs
              </TableCell>
            </TableRow>
          </thead>
          <TableBody>{tableRows}</TableBody>
        </Table>
      </TableContainer>

      {/* Summary info */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
        }}
      >
        {(() => {
          const allEntries = Object.values(tableState);

          // Calculate statistics by type
          const verplichteEntries = allEntries.filter(
            (entry) => entry.standardType === 'verplicht'
          );
          const aanbevolenEntries = allEntries.filter(
            (entry) => entry.standardType === 'aanbevolen'
          );

          const verplichteCount = verplichteEntries.length;
          const aanbevolenCount = aanbevolenEntries.length;

          const verplichteCompliant = verplichteEntries.filter(
            (entry) => entry.isCompliant
          ).length;

          const aanbevolenCompliant = aanbevolenEntries.filter(
            (entry) => entry.isCompliant
          ).length;

          return (
            <Paragraph style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
              <strong>Overzicht:</strong>{' '}
              <span className='con-standaard-summary-verplicht'>
                {verplichteCount} verplichte{' '}
                {`standaardversie${verplichteCount > 1 ? 's' : ''}`} (waarvan{' '}
                {verplichteCompliant} ondersteund)
              </span>
              {verplichteCount > 0 && aanbevolenCount > 0 && ', '}
              {aanbevolenCount > 0 && (
                <span className='con-standaard-summary-aanbevolen'>
                  {aanbevolenCount} aanbevolen{' '}
                  {`standaardversie${aanbevolenCount > 1 ? 's' : ''}`} (waarvan{' '}
                  {aanbevolenCompliant} ondersteund)
                </span>
              )}
              {verplichteCount > 0 &&
                aanbevolenCount > 0 &&
                extraEntries.length > 0 &&
                ', '}
              {extraEntries.length > 0 && (
                <span className='con-standaard-summary-toegevoegd'>
                  {extraEntries.length} toegevoegde{' '}
                  {`standaardversie${extraEntries.length > 1 ? 's' : ''}`} (waarvan{' '}
                  {extraEntries.filter((entry) => entry.isCompliant).length}{' '}
                  ondersteund)
                </span>
              )}
            </Paragraph>
          );
        })()}
      </div>

      {/* Extra standaardversies multi-select */}
      {availableExtraStandardsOptions.length > 0 && (
        <div style={{ marginBlock: '1.5rem' }}>
          <Paragraph style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
            Voeg extra standaardversies toe (optioneel)
          </Paragraph>
          <ReactSelect
            isMulti
            className='ac-beheer-select'
            options={availableExtraStandardsOptions}
            value={selectedExtraStandards}
            onChange={handleExtraStandardsChange}
            isLoading={standaardenversiesOptionsLoading}
            closeMenuOnSelect={false}
            placeholder='Zoek en selecteer extra standaardversies...'
            isSearchable={true}
          />
        </div>
      )}
    </div>
  );
};

export default ConFormApplicatieStandaardenStage;
