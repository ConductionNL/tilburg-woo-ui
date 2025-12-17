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
 * Table columns:
 * 1. Standaarden
 * 2. Compliant (checkbox)
 * 3. Bewijs (file upload when compliant)
 */
const ConFormApplicatieStandaardenStage = ({
  applicatie,
  setApplicatieData,
  referentieComponentenWithStandards,
  standaardenOptions,
  standaardenOptionsLoading,
  selectedExtraStandards,
  setSelectedExtraStandards,
}) => {
  // State to track compliance and bewijs for each standard
  const [tableState, setTableState] = useState({});

  // Ref to track previous allStandards IDs to prevent unnecessary cleanup
  const prevAllStandardsIdsRef = useRef(new Set());

  // Enhanced function to get standard ID with better matching
  const getStandardId = (standard) => {
    if (!standard) return null;
    if (typeof standard === 'string') return standard;
    return (
      standard.id ||
      standard?.['@self']?.id ||
      standard.identifier ||
      standard.value ||
      standard.slug ||
      standard.naam ||
      standard.name ||
      null
    );
  };

  // Enhanced lookup map with multiple matching strategies
  const standaardenMap = useMemo(() => {
    const map = {};
    const nameMap = {}; // Additional map for name-based matching
    const identifierMap = {}; // Additional map for identifier-based matching

    (standaardenOptions || []).forEach((opt) => {
      const d = opt?.data || opt || {};

      // Primary ID mapping
      const id = d?.id || d?.identifier || d?.value || d?.slug || opt?.value;
      if (id != null) {
        map[String(id)] = d;
      }

      // Name-based mapping for fallback matching
      const name = d?.name || d?.naam || d?.title || d?.label;
      if (name) {
        nameMap[String(name).toLowerCase()] = d;
      }

      // Identifier mapping
      const identifier = d?.identifier || d?.value;
      if (identifier) {
        identifierMap[String(identifier)] = d;
      }
    });

    return { byId: map, byName: nameMap, byIdentifier: identifierMap };
  }, [standaardenOptions]);

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

    // Return empty object if no match found
    return {};
  };

  // Enhanced function to extract standard information
  const extractStandardInfo = (standard, fetchedData = {}) => {
    // Prioritize fetched data, fall back to original standard data
    const name =
      fetchedData.name ||
      fetchedData.xml?.name?._value ||
      fetchedData.afkorting ||
      fetchedData.naam ||
      fetchedData.title ||
      fetchedData.label ||
      standard?.name ||
      standard?.xml?.name?._value ||
      standard?.naam ||
      standard?.title ||
      standard?.label ||
      (typeof standard === 'string' ? standard : getStandardId(standard));

    const description =
      fetchedData.summary ||
      fetchedData.xml?.documentation?._value ||
      fetchedData.documentation ||
      fetchedData.beschrijving ||
      fetchedData.description ||
      standard?.summary ||
      standard?.xml?.documentation?._value ||
      standard?.documentation ||
      standard?.beschrijving ||
      standard?.description ||
      '';

    return { name, description };
  };

  // Get all standards from referentieComponentenWithStandards with component tracking
  const getAllStandards = () => {
    const standardsMap = new Map();

    referentieComponentenWithStandards.forEach((refComp) => {
      const refCompName = refComp.naam || `Component ${refComp.id}`;

      // Process aanbevolen standaarden
      if (
        refComp.aanbevolenStandaarden &&
        Array.isArray(refComp.aanbevolenStandaarden)
      ) {
        refComp.aanbevolenStandaarden.forEach((standard) => {
          const standardId = getStandardId(standard);
          if (standardId) {
            // Find matching data from fetched standards
            const fetchedData = findMatchingStandardData(standard);
            const { name: standardName, description: standardDescription } =
              extractStandardInfo(standard, fetchedData);
            // Use standard ID as key (single applicatie, no need for module separation)
            const compositeKey = String(standardId);

            if (standardsMap.has(compositeKey)) {
              // Standard already exists, add this component to the aanbevolen list
              const existing = standardsMap.get(compositeKey);
              if (!existing.aanbevolenComponents.includes(refCompName)) {
                existing.aanbevolenComponents.push(refCompName);
              }
              // Update with better data if available
              if (fetchedData && Object.keys(fetchedData).length > 0) {
                existing.naam = standardName;
                existing.beschrijving = standardDescription;
                existing.fetchedData = fetchedData;
              }
            } else {
              // New standard
              standardsMap.set(compositeKey, {
                id: standardId,
                naam: standardName,
                beschrijving: standardDescription,
                aanbevolenComponents: [refCompName],
                verplichteComponents: [],
                fetchedData: fetchedData,
              });
            }
          }
        });
      }

      // Process verplichte standaarden
      if (
        refComp.verplichteStandaarden &&
        Array.isArray(refComp.verplichteStandaarden)
      ) {
        refComp.verplichteStandaarden.forEach((standard) => {
          const standardId = getStandardId(standard);
          if (standardId) {
            // Find matching data from fetched standards
            const fetchedData = findMatchingStandardData(standard);
            const { name: standardName, description: standardDescription } =
              extractStandardInfo(standard, fetchedData);
            // Use standard ID as key (single applicatie, no need for module separation)
            const compositeKey = String(standardId);

            if (standardsMap.has(compositeKey)) {
              // Standard already exists, add this component to the verplichte list
              const existing = standardsMap.get(compositeKey);
              if (!existing.verplichteComponents.includes(refCompName)) {
                existing.verplichteComponents.push(refCompName);
              }
              // Update with better data if available
              if (fetchedData && Object.keys(fetchedData).length > 0) {
                existing.naam = standardName;
                existing.beschrijving = standardDescription;
                existing.fetchedData = fetchedData;
              }
            } else {
              // New standard
              standardsMap.set(compositeKey, {
                id: standardId,
                naam: standardName,
                beschrijving: standardDescription,
                aanbevolenComponents: [],
                verplichteComponents: [refCompName],
                fetchedData: fetchedData,
              });
            }
          }
        });
      }
    });
    return Array.from(standardsMap.values());
  };

  const allStandards = useMemo(() => {
    const result = getAllStandards();
    return result;
  }, [referentieComponentenWithStandards, standaardenMap]);

  // Get IDs of standards already in referentieComponenten (aanbevolen and verplicht)
  const existingStandardIds = useMemo(() => {
    const ids = new Set();

    allStandards.forEach((standard) => {
      // Add primary ID
      ids.add(String(standard.id));

      // Add alternative IDs from fetched data
      const fetchedData = findMatchingStandardData({ id: standard.id });
      if (fetchedData) {
        ['id', 'identifier', 'value', 'slug'].forEach((key) => {
          if (fetchedData[key]) ids.add(String(fetchedData[key]));
        });
      }
    });

    return ids;
  }, [allStandards, standaardenMap]);

  // Filter standaardenOptions to exclude standards already in referentieComponenten
  const availableExtraStandardsOptions = useMemo(() => {
    return (standaardenOptions || []).filter((option) => {
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

      // Check if any ID matches existing standards
      return !optionIds.some((optionId) => existingStandardIds.has(optionId));
    });
  }, [standaardenOptions, existingStandardIds]);

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
    // Get all valid standard IDs (from both referentieComponenten and selectedExtraStandards)
    const validStandardIds = new Set();

    // Add standards from referentieComponenten (allStandards)
    allStandards.forEach((standard) => {
      // Add primary ID
      validStandardIds.add(String(standard.id));

      // Add alternative IDs from fetched data to handle different identifier formats
      const fetchedData = findMatchingStandardData({ id: standard.id });
      if (fetchedData) {
        ['id', 'identifier', 'value', 'slug', 'uuid'].forEach((key) => {
          if (fetchedData[key]) validStandardIds.add(String(fetchedData[key]));
        });
      }
    });

    // Add standards from selectedExtraStandards
    selectedExtraStandards.forEach((option) => {
      const standardId = String(option.value);
      validStandardIds.add(standardId);

      // Also add alternative IDs
      const fetchedData = findMatchingStandardData({ id: standardId });
      if (fetchedData) {
        ['id', 'identifier', 'value', 'slug', 'uuid'].forEach((key) => {
          if (fetchedData[key]) validStandardIds.add(String(fetchedData[key]));
        });
      }
    });

    // Check if any compliancy entries need to be removed
    // Only remove entries that have no data AND are not in valid standards
    const currentCompliancy = Array.isArray(applicatie.compliancy)
      ? applicatie.compliancy
      : [];

    // Find orphaned entries (not in valid standards)
    const orphanedCompliancy = currentCompliancy.filter(
      (compliancy) =>
        !validStandardIds.has(String(compliancy.standaardversie)) &&
        !validStandardIds.has(String(compliancy.standaardGemma))
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

      // Keep entries that are in valid standards OR have data
      const cleanedCompliancy = currentCompliancy.filter(
        (compliancy) =>
          validStandardIds.has(String(compliancy.standaardversie)) ||
          validStandardIds.has(String(compliancy.standaardGemma)) ||
          compliancy.bewijs ||
          compliancy.url
      );

      setApplicatieData('compliancy', cleanedCompliancy);
    }

    // Always clean up standaarden array (compliance indicator)
    const currentStandaarden = Array.isArray(applicatie.standaarden)
      ? applicatie.standaarden
      : [];
    const cleanedStandaarden = currentStandaarden.filter((standardId) =>
      validStandardIds.has(String(standardId))
    );
    if (cleanedStandaarden.length !== currentStandaarden.length) {
      setApplicatieData('standaarden', cleanedStandaarden);
    }

    // Always clean up standaardenGemma array (compliance indicator)
    const currentStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
      ? applicatie.standaardenGemma
      : [];
    const cleanedStandaardenGemma = currentStandaardenGemma.filter((gemmaId) =>
      validStandardIds.has(String(gemmaId))
    );
    if (cleanedStandaardenGemma.length !== currentStandaardenGemma.length) {
      setApplicatieData('standaardenGemma', cleanedStandaardenGemma);
    }
  }, [
    allStandards,
    selectedExtraStandards,
    applicatie.compliancy,
    applicatie.standaarden,
    applicatie.standaardenGemma,
    setApplicatieData,
    standaardenMap,
  ]);

  // Initialize table state based on existing compliancy data
  useEffect(() => {
    const initialState = {};

    // Get standaarden array to check compliance status
    const standaardenArray = Array.isArray(applicatie.standaarden)
      ? applicatie.standaarden.map(String)
      : [];

    // Add standards from referentieComponenten
    allStandards.forEach((standard) => {
      const key = standard.id;

      // Check if there's existing compliancy data (load even if not compliant)
      const existingCompliancy = (applicatie.compliancy || []).find(
        (c) => c.standaardversie === standard.id
      );

      // Check standaarden array to determine compliance status
      const isCompliant = standaardenArray.includes(String(standard.id));

      // Determine the primary type (verplicht takes precedence)
      const primaryType =
        standard.verplichteComponents.length > 0 ? 'verplicht' : 'aanbevolen';

      // Build component information display
      const componentInfo = [];
      if (standard.verplichteComponents.length > 0) {
        componentInfo.push(
          `VERPLICHT (${standard.verplichteComponents.join(', ')})`
        );
      }
      if (standard.aanbevolenComponents.length > 0) {
        componentInfo.push(
          `AANBEVOLEN (${standard.aanbevolenComponents.join(', ')})`
        );
      }

      initialState[key] = {
        standardId: standard.id,
        standardName: standard.naam,
        standardDescription: standard.beschrijving,
        standardType: primaryType,
        componentInfo: componentInfo.join(', '),
        verplichteComponents: standard.verplichteComponents,
        aanbevolenComponents: standard.aanbevolenComponents,
        isCompliant,
        // Load compliancy data even if not compliant (preserved data)
        bewijs: existingCompliancy?.bewijs || null,
        bewijsFilename: existingCompliancy?.bewijsFilename || null,
        url: existingCompliancy?.url || null,
      };
    });

    // Add extra standards from multi-select
    selectedExtraStandards.forEach((selectedOption) => {
      const standardId = String(selectedOption.value);
      if (!initialState[standardId]) {
        const fetchedData = findMatchingStandardData({ id: standardId });
        const { name: standardName, description: standardDescription } =
          extractStandardInfo({ id: standardId }, fetchedData);

        const existingCompliancy = (applicatie.compliancy || []).find(
          (c) => c.standaardversie === standardId
        );

        // Check standaarden array to determine compliance status
        const isCompliant = standaardenArray.includes(standardId);

        initialState[standardId] = {
          standardId,
          standardName,
          standardDescription,
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
          current.url !== next.url
        );
      });

    if (!keysChanged && currentKeys.length > 0) {
      return;
    }

    setTableState(initialState);
  }, [
    applicatie.compliancy,
    applicatie.standaarden,
    referentieComponentenWithStandards,
    standaardenMap,
    selectedExtraStandards,
  ]);

  // Handle extra standards selection change
  const handleExtraStandardsChange = (selectedOptions) => {
    const newSelected = selectedOptions || [];
    const newSelectedIds = new Set(
      newSelected.map((option) => String(option.value))
    );
    const prevSelectedIds = new Set(
      selectedExtraStandards.map((option) => String(option.value))
    );

    // Find standards that were removed
    const removedStandards = selectedExtraStandards.filter(
      (option) => !newSelectedIds.has(String(option.value))
    );

    // Find standards that were newly added
    const addedStandards = newSelected.filter(
      (option) => !prevSelectedIds.has(String(option.value))
    );

    // Handle removed standards - preserve compliancy entries if they have data
    if (removedStandards.length > 0) {
      const prevCompliancy = Array.isArray(applicatie.compliancy)
        ? [...applicatie.compliancy]
        : [];

      // Only remove compliancy entries that have no data (no bewijs, no url)
      const updatedCompliancy = prevCompliancy.filter((compliancy) => {
        const isRemovedStandard = removedStandards.some(
          (option) => String(option.value) === String(compliancy.standaardversie)
        );

        if (!isRemovedStandard) {
          // Keep entries for standards that weren't removed
          return true;
        }

        // For removed standards, only keep if they have data
        const hasData = compliancy.bewijs || compliancy.url;
        return hasData;
      });

      setApplicatieData('compliancy', updatedCompliancy);

      // Always remove from standaarden array (compliance indicator)
      const prevStandaarden = Array.isArray(applicatie.standaarden)
        ? [...applicatie.standaarden]
        : [];
      const updatedStandaarden = prevStandaarden.filter(
        (standardId) =>
          !removedStandards.some(
            (option) => String(option.value) === String(standardId)
          )
      );
      setApplicatieData('standaarden', updatedStandaarden);

      // Always remove from standaardenGemma array (compliance indicator)
      const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
        ? [...applicatie.standaardenGemma]
        : [];
      removedStandards.forEach((option) => {
        const standardData = findMatchingStandardData({ id: option.value });
        const objectId = standardData?.id || standardData?.objectId || null;
        if (objectId) {
          const index = prevStandaardenGemma.indexOf(objectId);
          if (index > -1) {
            prevStandaardenGemma.splice(index, 1);
          }
        }
      });
      setApplicatieData('standaardenGemma', prevStandaardenGemma);
    }

    // Automatically mark newly added standards as compliant
    if (addedStandards.length > 0) {
      const prevCompliancy = Array.isArray(applicatie.compliancy)
        ? [...applicatie.compliancy]
        : [];
      const updatedCompliancy = [...prevCompliancy];

      const prevStandaarden = Array.isArray(applicatie.standaarden)
        ? [...applicatie.standaarden]
        : [];
      const updatedStandaarden = [...prevStandaarden];

      const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
        ? [...applicatie.standaardenGemma]
        : [];
      const updatedStandaardenGemma = [...prevStandaardenGemma];

      addedStandards.forEach((option) => {
        const standardId = String(option.value);
        const standardData = findMatchingStandardData({ id: standardId });
        const { name: standardName } = extractStandardInfo(
          { id: standardId },
          standardData
        );
        const objectId = standardData?.id || standardData?.objectId || null;

        // Check if compliancy entry already exists
        const existingIndex = updatedCompliancy.findIndex(
          (compliancy) => compliancy.standaardversie === standardId
        );

        if (existingIndex < 0) {
          // Create new compliancy entry
          updatedCompliancy.push({
            standaardversie: standardId,
            standaardGemma: objectId,
            standaardnaam: standardName,
            bewijs: null,
            bewijsFilename: null,
            url: null,
          });
        }

        // Add to standaarden array if not already present
        if (!updatedStandaarden.includes(standardId)) {
          updatedStandaarden.push(standardId);
        }

        // Add to standaardenGemma array if not already present
        if (objectId && !updatedStandaardenGemma.includes(objectId)) {
          updatedStandaardenGemma.push(objectId);
        }
      });

      setApplicatieData('compliancy', updatedCompliancy);
      setApplicatieData('standaarden', updatedStandaarden);
      setApplicatieData('standaardenGemma', updatedStandaardenGemma);
    }

    setSelectedExtraStandards(newSelected);
  };

  // Toggle compliance for a specific standard
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

    // Find the standard data to get the objectId
    const standardData = findMatchingStandardData({
      id: currentEntry.standardId,
    });
    const objectId = standardData?.id || standardData?.objectId || null;

    // Find existing compliancy entry or create new one
    const existingIndex = prevCompliancy.findIndex(
      (c) => c.standaardversie === currentEntry.standardId
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

    // Update standaarden and standaardenGemma arrays based on compliance status
    const prevStandaarden = Array.isArray(applicatie.standaarden)
      ? [...applicatie.standaarden]
      : [];
    let newStandaarden = prevStandaarden;

    if (isCompliant) {
      // Add to array if not already present
      if (!newStandaarden.includes(currentEntry.standardId)) {
        newStandaarden.push(currentEntry.standardId);
      }
    } else {
      // Remove from array (but keep in compliancy)
      const standardIndex = newStandaarden.indexOf(currentEntry.standardId);
      if (standardIndex > -1) {
        newStandaarden.splice(standardIndex, 1);
      }
    }

    setApplicatieData('standaarden', newStandaarden);

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

    // Early return if standaardenMap is not ready (empty)
    if (!standaardenMap || Object.keys(standaardenMap.byId || {}).length === 0)
      return;

    let compliancyHasChanges = false;
    let updatedCompliancy = [...prevCompliancy];

    prevCompliancy.forEach((comp, compIndex) => {
      const standardId = comp.standaardversie;
      if (!standardId) return;

      // Find the standard data to get the objectId
      const standardData = findMatchingStandardData({ id: standardId });
      const objectId = standardData?.id || standardData?.objectId || null;

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

    // Only sync standaarden arrays for entries that are actually compliant
    // Check tableState to determine which standards are compliant
    const compliantStandardIds = new Set();
    Object.values(tableState).forEach((entry) => {
      if (entry.isCompliant && entry.standardId) {
        compliantStandardIds.add(String(entry.standardId));
      }
    });

    const compliancy = applicatie.compliancy || [];
    const prevStandaarden = Array.isArray(applicatie.standaarden)
      ? [...applicatie.standaarden]
      : [];
    let standaardenHasChanges = false;
    let updatedStandaarden = [...prevStandaarden];

    // Only add standards to standaarden array if they're actually compliant
    compliancy.forEach((comp) => {
      const standardId = comp.standaardversie;
      if (!standardId) return;

      // Only add if compliant (in tableState with isCompliant=true) and not already in array
      if (
        compliantStandardIds.has(String(standardId)) &&
        !updatedStandaarden.includes(standardId)
      ) {
        updatedStandaarden.push(standardId);
        standaardenHasChanges = true;
      }
    });

    if (standaardenHasChanges) {
      setApplicatieData('standaarden', updatedStandaarden);
    }

    const prevStandaardenGemma = Array.isArray(applicatie.standaardenGemma)
      ? [...applicatie.standaardenGemma]
      : [];
    let standaardenGemmaHasChanges = false;
    let updatedStandaardenGemma = [...prevStandaardenGemma];

    // Only add standards to standaardenGemma array if they're actually compliant
    compliancy.forEach((comp) => {
      const standardId = comp.standaardversie;
      if (!standardId) return;

      // Only add if compliant (in tableState with isCompliant=true)
      if (!compliantStandardIds.has(String(standardId))) return;

      // Find the standard data to get the objectId
      const standardData = findMatchingStandardData({ id: standardId });
      const objectId = standardData?.id || standardData?.objectId || null;

      // Check if objectId is missing from standaardenGemma array
      if (objectId && !updatedStandaardenGemma.includes(objectId)) {
        updatedStandaardenGemma.push(objectId);
        standaardenGemmaHasChanges = true;
      }
    });

    if (standaardenGemmaHasChanges) {
      setApplicatieData('standaardenGemma', updatedStandaardenGemma);
    }
  }, [tableState, applicatie.compliancy, standaardenMap, setApplicatieData]);

  // If no standards available, show message
  if (standaardenOptionsLoading) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaarden
        </h2>
        <Paragraph>Standaarden laden...</Paragraph>
      </div>
    );
  }

  if (allStandards.length === 0) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaarden
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
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
          }}
        >
          <Paragraph>
            <strong>Geen standaarden beschikbaar</strong>
          </Paragraph>
          <Paragraph>
            Aan de geselecteerde referentiecomponenten zijn momenteel geen
            standaarden gekoppeld. U kunt teruggaan om andere referentiecomponenten
            te selecteren of doorgaan zonder standaarden.
          </Paragraph>
        </div>
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
        Selecteer de standaarden voor uw applicatie
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Geef voor uw applicatie aan welke standaarden worden ondersteund en of een
        testrapport beschikbaar is. Er worden de standaarden getoond die verplicht of
        aanbevolen zijn voor de in de vorige stap geselecteerde
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
            <strong>Extra standaarden toevoegen</strong>
            <br />
            <span className='ac-forms-product-info-alert__text'>
              Onderstaand overzicht toont de standaarden die verplicht of aanbevolen
              zijn voor uw geselecteerde referentiecomponenten. Wilt u aanvullende
              standaarden toevoegen die niet in dit overzicht staan? Scroll dan naar
              onderaan deze pagina waar u extra standaarden kunt selecteren via het
              zoekveld.
            </span>
          </div>
        </div>
      </Alert>

      <TableContainer className='con-form-wizard-table-container'>
        <Table>
          <thead>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                Standaard
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
                {`standaard${verplichteCount > 1 ? 'en' : ''}`} (waarvan{' '}
                {verplichteCompliant} ondersteund)
              </span>
              {verplichteCount > 0 && aanbevolenCount > 0 && ', '}
              {aanbevolenCount > 0 && (
                <span className='con-standaard-summary-aanbevolen'>
                  {aanbevolenCount} aanbevolen{' '}
                  {`standaard${aanbevolenCount > 1 ? 'en' : ''}`} (waarvan{' '}
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
                  {`standaard${extraEntries.length > 1 ? 'en' : ''}`} (waarvan{' '}
                  {extraEntries.filter((entry) => entry.isCompliant).length}{' '}
                  ondersteund)
                </span>
              )}
            </Paragraph>
          );
        })()}
      </div>

      {/* Extra standards multi-select */}
      {availableExtraStandardsOptions.length > 0 && (
        <div style={{ marginBlock: '1.5rem' }}>
          <Paragraph style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
            Voeg extra standaarden toe (optioneel)
          </Paragraph>
          <ReactSelect
            isMulti
            className='ac-beheer-select'
            options={availableExtraStandardsOptions}
            value={selectedExtraStandards}
            onChange={handleExtraStandardsChange}
            isLoading={standaardenOptionsLoading}
            closeMenuOnSelect={false}
            placeholder='Zoek en selecteer extra standaarden...'
            isSearchable={true}
          />
        </div>
      )}
    </div>
  );
};

export default ConFormApplicatieStandaardenStage;
