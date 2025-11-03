import React, { useState, useEffect, useMemo } from 'react';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import { ConExistingModulesInfoBox } from '@components';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { validateWebsite } from '../../validation/form-validations';

/**
 * Standaarden Form - Simple Table View
 *
 * Table columns:
 * 1. Modules (can span multiple rows)
 * 2. Standaarden
 * 3. Compliant (checkbox)
 * 4. Bewijs (file upload when compliant)
 */
const ConFormStandaardenStage = ({
  // _product,
  setProduct,
  referentieComponentenWithStandards,
  // _schemas,
  getNewModulesWithApplicatieData,
  setStandaardenLoading: setParentStandaardenLoading,
  standaardenOptions,
  standaardenOptionsLoading,
  existingModulesLookup,
  sameForAll, // Passed from referentiecomponenten stage choice
}) => {
  // ✅ SIMPLIFIED: Use helper method to get new modules with applicatie data
  const newModules = useMemo(() => {
    return getNewModulesWithApplicatieData ? getNewModulesWithApplicatieData() : [];
  }, [getNewModulesWithApplicatieData]);

  // Check if there are multiple NEW applications that need standards configuration
  const isMultiNewApplicatie = newModules.length > 1;

  // State to track compliance and bewijs for each module-standard combination
  const [tableState, setTableState] = useState({});

  // Track which modules have had their files fetched to avoid duplicate fetches
  const [fetchedModuleIds, setFetchedModuleIds] = useState(new Set());

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

  // Reflect loading to parent if provided
  useEffect(() => {
    if (typeof setParentStandaardenLoading === 'function') {
      setParentStandaardenLoading(!!standaardenOptionsLoading);
    }
  }, [standaardenOptionsLoading, setParentStandaardenLoading]);

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
            // Use composite key to keep the same standard separated per module
            const compositeKey = `${String(standardId)}::${String(
              refComp.moduleId
            )}`;

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
                existing.fetchedData = fetchedData; // Store complete fetched data for reference
              }
            } else {
              // New standard
              standardsMap.set(compositeKey, {
                id: standardId,
                naam: standardName,
                beschrijving: standardDescription,
                moduleId: refComp.moduleId,
                aanbevolenComponents: [refCompName],
                verplichteComponents: [],
                fetchedData: fetchedData, // Store complete fetched data for reference
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
            // Use composite key to keep the same standard separated per module
            const compositeKey = `${String(standardId)}::${String(
              refComp.moduleId
            )}`;

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
                existing.fetchedData = fetchedData; // Store complete fetched data for reference
              }
            } else {
              // New standard
              standardsMap.set(compositeKey, {
                id: standardId,
                naam: standardName,
                beschrijving: standardDescription,
                moduleId: refComp.moduleId,
                aanbevolenComponents: [],
                verplichteComponents: [refCompName],
                fetchedData: fetchedData, // Store complete fetched data for reference
              });
            }
          }
        });
      }
    });
    return Array.from(standardsMap.values());
  };

  const allStandards = getAllStandards();

  // Initialize table state based on existing compliancy data and module-standard relationships
  useEffect(() => {
    const initialState = {};

    // Build state based on allStandards which now includes component information
    newModules.forEach((module) => {
      // ✅ SIMPLIFIED: Use moduleIndex as moduleId for consistency
      const moduleId = module.moduleIndex;

      allStandards.forEach((standard) => {
        // Only include standards that are relevant to this module
        if (String(standard.moduleId) === String(moduleId)) {
          const key = `${moduleId}-${standard.id}`;

          // Check if there's existing compliancy data
          const existingCompliancy = module.compliancy?.find(
            (c) => c.standaardversie === standard.id
          );

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
            moduleId: moduleId,
            moduleName: module.naam || `Applicatie ${moduleId}`,
            standardId: standard.id,
            standardName: standard.naam,
            standardDescription: standard.beschrijving,
            standardType: primaryType,
            componentInfo: componentInfo.join(', '),
            verplichteComponents: standard.verplichteComponents,
            aanbevolenComponents: standard.aanbevolenComponents,
            isCompliant: !!existingCompliancy,
            bewijs: existingCompliancy?.bewijs || null,
            // ✅ NEW: Track filename for internal use (not displayed in UI)
            bewijsFilename: existingCompliancy?.bewijsFilename || null,
            url: existingCompliancy?.url || null,
          };
        }
      });
    });

    setTableState(initialState);
  }, [newModules, referentieComponentenWithStandards, standaardenMap]);

  // Fetch evidence files for edit mode - once per module at the beginning
  useEffect(() => {
    const fetchAllEvidenceFiles = async () => {
      if (!newModules || newModules.length === 0) return;

      // Track modules we've fetched in this effect run
      const modulesToFetch = newModules.filter(
        (module) => module.id && !fetchedModuleIds.has(module.id)
      );

      if (modulesToFetch.length === 0) return;

      // Mark these modules as being fetched
      const newFetchedIds = new Set(fetchedModuleIds);
      modulesToFetch.forEach((m) => newFetchedIds.add(m.id));
      setFetchedModuleIds(newFetchedIds);

      // Fetch files for all modules in parallel
      const fetchPromises = modulesToFetch.map(async (module) => {
        if (!module.compliancy) return;

        try {
          // Fetch ALL files for this module at once
          const filesResponse = await fetch(
            `${BASE_URL}/openregister/api/objects/voorzieningen/module/${module.id}/files`
          );

          if (!filesResponse.ok) {
            console.warn(`Failed to fetch files for module ${module.id}`);
            return;
          }

          const filesData = await filesResponse.json();
          // API returns { results: [...], total, page, ... }
          const files = filesData.results || [];

          // Convert files to data URLs and store in state
          const fileConversions = [];

          for (const comp of module.compliancy) {
            // If bewijs is a number (file ID), find the matching file
            if (comp.bewijs && typeof comp.bewijs === 'number') {
              const key = `${module.moduleIndex}-${comp.standaardversie}`;
              const matchingFile = files.find((f) => f.id === comp.bewijs);

              if (matchingFile) {
                fileConversions.push({
                  key,
                  file: matchingFile,
                  bewijsFileId: comp.bewijs,
                });
              } else {
                console.warn(
                  `File with ID ${comp.bewijs} not found for module ${module.id}`
                );
              }
            }
          }

          // Set file metadata in state without fetching file content
          fileConversions.forEach(({ key, file, bewijsFileId }) => {
            const filename = file.title || file.name || 'evidence.pdf';
            const fileUrl = `${BASE_URL}${file.path}`;

            setTableState((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                bewijs: fileUrl, // Use file URL directly instead of data URL
                bewijsFilename: filename,
                bewijsFileId: bewijsFileId,
                bewijsFetched: true,
              },
            }));
          });

          // Also update the product state with bewijsFilename for display in review stage
          setProduct((prev) => {
            const modules = [...(prev.modules || [])];
            const moduleIndex = module.moduleIndex;
            const currentModule = modules[moduleIndex];

            if (currentModule && currentModule.compliancy) {
              const updatedCompliancy = currentModule.compliancy.map((comp) => {
                // Find if this compliancy has a matching file
                const matchingConversion = fileConversions.find(
                  ({ key }) =>
                    key === `${module.moduleIndex}-${comp.standaardversie}`
                );

                if (matchingConversion) {
                  return {
                    ...comp,
                    bewijsFilename:
                      matchingConversion.file.title ||
                      matchingConversion.file.name ||
                      'evidence.pdf',
                    bewijsAccessUrl: matchingConversion.file.accessUrl || null, // Store accessUrl for link
                  };
                }

                return comp;
              });

              modules[moduleIndex] = {
                ...currentModule,
                compliancy: updatedCompliancy,
              };

              return { ...prev, modules };
            }

            return prev;
          });
        } catch (error) {
          console.error(`Error fetching files for module ${module.id}:`, error);
        }
      });

      await Promise.all(fetchPromises);
    };

    fetchAllEvidenceFiles();
  }, [newModules, fetchedModuleIds]);

  // Apply compliance to all modules for a specific standard
  const applyComplianceToAll = (
    standardId,
    isCompliant,
    bewijs = null,
    bewijsFilename = null,
    url = null
  ) => {
    setProduct((prev) => {
      const modules = [...(prev.modules || [])];

      // Find the standard info from allStandards
      const standardInfo = allStandards.find((s) => s.id === standardId);
      const standardName = standardInfo?.naam || standardId;

      // Apply to all new modules (objects, not strings)
      modules.forEach((module, index) => {
        if (typeof module === 'object' && !module?.id) {
          let compliancy = Array.isArray(module.compliancy)
            ? [...module.compliancy]
            : [];

          if (isCompliant) {
            // Find the standard data to get the objectId
            const standardData = findMatchingStandardData({ id: standardId });
            const objectId = standardData?.id || standardData?.objectId || null;

            // Add or update compliancy object
            const existingIndex = compliancy.findIndex(
              (c) => c.standaardversie === standardId
            );
            const compliancyObject = {
              standaardversie: standardId,
              standaardGemma: objectId,
              standaardnaam: standardName,
              bewijs: bewijs || null,
              bewijsFilename: bewijsFilename || null,
              url: url || null,
            };

            if (existingIndex >= 0) {
              compliancy[existingIndex] = compliancyObject;
            } else {
              compliancy.push(compliancyObject);
            }
          } else {
            // Remove compliancy object
            compliancy = compliancy.filter((c) => c.standaardversie !== standardId);
          }

          // Update standaarden and standaardenGemma arrays
          const currentStandaarden = Array.isArray(module.standaarden)
            ? [...module.standaarden]
            : [];
          const currentStandaardenGemma = Array.isArray(module.standaardenGemma)
            ? [...module.standaardenGemma]
            : [];

          if (isCompliant) {
            // Add to arrays if not already present
            if (!currentStandaarden.includes(standardId)) {
              currentStandaarden.push(standardId);
            }
            const objectId =
              findMatchingStandardData({ id: standardId })?.id || null;
            if (objectId && !currentStandaardenGemma.includes(objectId)) {
              currentStandaardenGemma.push(objectId);
            }
          } else {
            // Remove from arrays
            const standardIndex = currentStandaarden.indexOf(standardId);
            if (standardIndex > -1) {
              currentStandaarden.splice(standardIndex, 1);
            }
            const objectId =
              findMatchingStandardData({ id: standardId })?.id || null;
            if (objectId) {
              const objectIndex = currentStandaardenGemma.indexOf(objectId);
              if (objectIndex > -1) {
                currentStandaardenGemma.splice(objectIndex, 1);
              }
            }
          }

          modules[index] = {
            ...module,
            compliancy,
            standaarden: currentStandaarden,
            standaardenGemma: currentStandaardenGemma,
          };
        }
      });

      return { ...prev, modules };
    });
  };

  // Toggle compliance for a specific module-standard combination
  const toggleCompliance = (key, isCompliant) => {
    // Get current entry BEFORE updating state to avoid React timing issues
    const currentEntry = tableState[key];
    if (!currentEntry) {
      console.warn('No entry found for key:', key);
      return;
    }

    if (sameForAll && isMultiNewApplicatie) {
      // Update all entries for this standard in tableState
      setTableState((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((entryKey) => {
          if (updated[entryKey].standardId === currentEntry.standardId) {
            updated[entryKey] = {
              ...updated[entryKey],
              isCompliant,
              // Clear bewijs, filename, and url if not compliant
              bewijs: isCompliant ? updated[entryKey]?.bewijs || null : null,
              bewijsFilename: isCompliant
                ? updated[entryKey]?.bewijsFilename || null
                : null,
              url: isCompliant ? updated[entryKey]?.url || null : null,
            };
          }
        });
        return updated;
      });

      // Apply to all modules
      applyComplianceToAll(
        currentEntry.standardId,
        isCompliant,
        isCompliant ? currentEntry.bewijs : null,
        isCompliant ? currentEntry.bewijsFilename : null,
        isCompliant ? currentEntry.url : null
      );
    } else {
      // Update tableState for single entry
      setTableState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          isCompliant,
          // Clear bewijs, filename, and url if not compliant
          bewijs: isCompliant ? prev[key]?.bewijs || null : null,
          bewijsFilename: isCompliant ? prev[key]?.bewijsFilename || null : null,
          url: isCompliant ? prev[key]?.url || null : null,
        },
      }));

      // Update product data using currentEntry (not the updated tableState)
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const moduleIndex = currentEntry.moduleId;
        const app = modules[moduleIndex];

        if (typeof app !== 'object' || !!app?.id) {
          console.warn(
            'Cannot update compliancy on existing applicatie:',
            moduleIndex,
            app
          );
          return prev;
        }

        let compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

        if (isCompliant) {
          // Find the standard data to get the objectId
          const standardData = findMatchingStandardData({
            id: currentEntry.standardId,
          });
          const objectId = standardData?.id || standardData?.objectId || null;

          // Add or update compliancy object
          const existingIndex = compliancy.findIndex(
            (c) => c.standaardversie === currentEntry.standardId
          );
          const compliancyObject = {
            standaardversie: currentEntry.standardId,
            standaardGemma: objectId,
            standaardnaam: currentEntry.standardName,
            bewijs: currentEntry.bewijs || null,
            bewijsFilename: currentEntry.bewijsFilename || null,
          };

          if (existingIndex >= 0) {
            compliancy[existingIndex] = compliancyObject;
          } else {
            compliancy.push(compliancyObject);
          }
        } else {
          // Remove compliancy object
          compliancy = compliancy.filter(
            (c) => c.standaardversie !== currentEntry.standardId
          );
        }

        // Update standaarden and standaardenGemma arrays
        const currentStandaarden = Array.isArray(app.standaarden)
          ? [...app.standaarden]
          : [];
        const currentStandaardenGemma = Array.isArray(app.standaardenGemma)
          ? [...app.standaardenGemma]
          : [];

        if (isCompliant) {
          // Add to arrays if not already present
          if (!currentStandaarden.includes(currentEntry.standardId)) {
            currentStandaarden.push(currentEntry.standardId);
          }
          const objectId =
            findMatchingStandardData({ id: currentEntry.standardId })?.id || null;
          if (objectId && !currentStandaardenGemma.includes(objectId)) {
            currentStandaardenGemma.push(objectId);
          }
        } else {
          // Remove from arrays
          const standardIndex = currentStandaarden.indexOf(currentEntry.standardId);
          if (standardIndex > -1) {
            currentStandaarden.splice(standardIndex, 1);
          }
          const objectId =
            findMatchingStandardData({ id: currentEntry.standardId })?.id || null;
          if (objectId) {
            const objectIndex = currentStandaardenGemma.indexOf(objectId);
            if (objectIndex > -1) {
              currentStandaardenGemma.splice(objectIndex, 1);
            }
          }
        }

        modules[moduleIndex] = {
          ...app,
          compliancy,
          standaarden: currentStandaarden,
          standaardenGemma: currentStandaardenGemma,
        };

        return { ...prev, modules };
      });
    }
  };

  // Update bewijs for a specific module-standard combination
  const updateBewijs = (key, bewijs) => {
    const entry = tableState[key];
    if (!entry) return;

    if (sameForAll && isMultiNewApplicatie) {
      // Update all entries for this standard in tableState
      setTableState((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((entryKey) => {
          if (updated[entryKey].standardId === entry.standardId) {
            updated[entryKey] = {
              ...updated[entryKey],
              bewijs,
              url: null, // Clear URL when file is uploaded (mutually exclusive)
            };
          }
        });
        return updated;
      });

      // Get the LATEST filename from tableState
      const currentEntry = tableState[key];
      const currentFilename = currentEntry?.bewijsFilename || entry.bewijsFilename;
      // Apply to all modules - use the latest filename
      applyComplianceToAll(entry.standardId, true, bewijs, currentFilename, null);
    } else {
      // Update single entry
      setTableState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          bewijs,
          url: null, // Clear URL when file is uploaded (mutually exclusive)
        },
      }));

      // Update product data
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const moduleIndex = entry.moduleId;
        const app = modules[moduleIndex];
        const compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

        // Get the LATEST filename from tableState at the time of this update
        const currentEntry = tableState[key];
        const currentFilename = currentEntry?.bewijsFilename || entry.bewijsFilename;

        const updatedCompliancy = compliancy.map((c) =>
          c.standaardversie === entry.standardId
            ? {
                ...c,
                standaardnaam: entry.standardName,
                bewijs,
                bewijsFilename: currentFilename || c.bewijsFilename || null,
                url: null, // Clear URL when file is uploaded (mutually exclusive)
              }
            : c
        );

        if (typeof app === 'object' && !app?.id) {
          modules[moduleIndex] = {
            ...app,
            compliancy: updatedCompliancy,
          };
          return { ...prev, modules };
        }
        return prev;
      });
    }
  };

  // ✅ NEW: Update URL for a specific module-standard combination
  const updateUrl = (key, url) => {
    const entry = tableState[key];
    if (!entry) return;

    if (sameForAll && isMultiNewApplicatie) {
      // Update all entries for this standard in tableState
      setTableState((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((entryKey) => {
          if (updated[entryKey].standardId === entry.standardId) {
            updated[entryKey] = {
              ...updated[entryKey],
              url,
              bewijs: null, // Clear file when URL is set (mutually exclusive)
              bewijsFilename: null,
            };
          }
        });
        return updated;
      });

      // Apply to all modules
      applyComplianceToAll(entry.standardId, true, null, null, url);
    } else {
      // Update single entry
      setTableState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          url,
          bewijs: null, // Clear file when URL is set (mutually exclusive)
          bewijsFilename: null,
        },
      }));

      // Update product data
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const moduleIndex = entry.moduleId;
        const app = modules[moduleIndex];
        const compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

        const updatedCompliancy = compliancy.map((c) =>
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

        if (typeof app === 'object' && !app?.id) {
          modules[moduleIndex] = {
            ...app,
            compliancy: updatedCompliancy,
          };
          return { ...prev, modules };
        }
        return prev;
      });
    }
  };

  // ✅ NEW: Update bewijs filename for a specific module-standard combination
  const updateBewijsFilename = (key, filename) => {
    const entry = tableState[key];
    if (!entry) return;

    if (sameForAll && isMultiNewApplicatie) {
      // Update all entries for this standard in tableState
      setTableState((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((entryKey) => {
          if (updated[entryKey].standardId === entry.standardId) {
            updated[entryKey] = {
              ...updated[entryKey],
              bewijsFilename: filename,
            };
          }
        });
        return updated;
      });

      // Apply to all modules
      applyComplianceToAll(entry.standardId, true, entry.bewijs, filename);
    } else {
      // Update single entry
      setTableState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          bewijsFilename: filename,
        },
      }));

      // Update product data
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const moduleIndex = entry.moduleId;
        const app = modules[moduleIndex];
        const compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

        const updatedCompliancy = compliancy.map((c) =>
          c.standaardversie === entry.standardId
            ? {
                ...c,
                standaardnaam: entry.standardName,
                bewijsFilename: filename,
                bewijs: c.bewijs || entry.bewijs || null,
              }
            : c
        );

        if (typeof app === 'object' && !app?.id) {
          modules[moduleIndex] = {
            ...app,
            compliancy: updatedCompliancy,
          };
          return { ...prev, modules };
        }
        return prev;
      });
    }
  };

  // ✅ NEW: Clear both bewijs and filename
  const clearBewijs = (key) => {
    const entry = tableState[key];
    if (!entry) return;

    if (sameForAll && isMultiNewApplicatie) {
      // Update all entries for this standard in tableState
      setTableState((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((entryKey) => {
          if (updated[entryKey].standardId === entry.standardId) {
            updated[entryKey] = {
              ...updated[entryKey],
              bewijs: null,
              bewijsFilename: null,
            };
          }
        });
        return updated;
      });

      // Apply to all modules
      applyComplianceToAll(entry.standardId, true, null, null);
    } else {
      // Update single entry
      setTableState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          bewijs: null,
          bewijsFilename: null,
        },
      }));

      // Update product data
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const moduleIndex = entry.moduleId;
        const app = modules[moduleIndex];
        const compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

        const updatedCompliancy = compliancy.map((c) =>
          c.standaardversie === entry.standardId
            ? {
                ...c,
                standaardnaam: entry.standardName,
                bewijs: null,
                bewijsFilename: null,
              }
            : c
        );

        if (typeof app === 'object' && !app?.id) {
          modules[moduleIndex] = {
            ...app,
            compliancy: updatedCompliancy,
          };
          return { ...prev, modules };
        }
        return prev;
      });
    }
  };

  // Add this helper function at the top of the component:
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
  // This fixes edit mode where existing compliancy data might be missing these properties
  useEffect(() => {
    // Ensure compliancy objects have standardName and bewijsFilename properties
    // This fixes edit mode where existing compliancy data might be missing these properties
    if (Object.keys(tableState).length > 0) {
      const entriesWithCompliancy = Object.values(tableState).filter(
        (entry) => entry.isCompliant
      );

      if (entriesWithCompliancy.length > 0) {
        setProduct((prev) => {
          const modules = [...(prev.modules || [])];
          let hasChanges = false;

          entriesWithCompliancy.forEach((entry) => {
            const moduleIndex = entry.moduleId;
            const app = modules[moduleIndex];

            if (typeof app !== 'object' || !!app?.id) {
              console.warn(
                'Cannot update compliancy on existing applicatie:',
                moduleIndex,
                app
              );
              return;
            }

            let compliancy = Array.isArray(app.compliancy)
              ? [...app.compliancy]
              : [];

            // Find existing compliancy object
            const existingIndex = compliancy.findIndex(
              (c) => c.standaardversie === entry.standardId
            );

            if (existingIndex >= 0) {
              const existing = compliancy[existingIndex];

              // Check if we need to add missing properties
              const needsStandardName = !existing.standaardnaam;
              const needsFilename =
                existing.bewijs && !existing.bewijsFilename && entry.bewijsFilename;

              if (needsStandardName || needsFilename) {
                // Generate filename if missing and we have bewijs data
                const generatedFilename =
                  needsFilename && !entry.bewijsFilename
                    ? generateFilenameFromDataUrl(
                        existing.bewijs,
                        entry.standardName
                      )
                    : entry.bewijsFilename;

                compliancy[existingIndex] = {
                  ...existing,
                  ...(needsStandardName && { standaardnaam: entry.standardName }),
                  ...(needsFilename &&
                    generatedFilename && { bewijsFilename: generatedFilename }),
                };

                modules[moduleIndex] = { ...app, compliancy };
                hasChanges = true;
              }
            }
          });

          return hasChanges ? { ...prev, modules } : prev;
        });
      }
    }
  }, [
    // Only run when the compliancy status actually changes, not on every tableState update
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
  // This fixes cases where compliance data exists but the arrays are not in sync
  useEffect(() => {
    if (Object.keys(tableState).length === 0) return;

    setProduct((prev) => {
      const modules = [...(prev.modules || [])];
      let hasChanges = false;

      modules.forEach((module, moduleIndex) => {
        if (typeof module !== 'object' || !!module?.id) return;

        const compliancy = Array.isArray(module.compliancy)
          ? [...module.compliancy]
          : [];
        if (compliancy.length === 0) return;

        let currentStandaarden = Array.isArray(module.standaarden)
          ? [...module.standaarden]
          : [];
        let currentStandaardenGemma = Array.isArray(module.standaardenGemma)
          ? [...module.standaardenGemma]
          : [];
        let updatedCompliancy = [...compliancy];
        let moduleChanged = false;

        compliancy.forEach((comp, compIndex) => {
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
            moduleChanged = true;
          }

          // Check if standard is missing from standaarden array
          if (!currentStandaarden.includes(standardId)) {
            currentStandaarden.push(standardId);
            moduleChanged = true;
          }

          // Check if objectId is missing from standaardenGemma array
          if (objectId && !currentStandaardenGemma.includes(objectId)) {
            currentStandaardenGemma.push(objectId);
            moduleChanged = true;
          }
        });

        if (moduleChanged) {
          modules[moduleIndex] = {
            ...module,
            compliancy: updatedCompliancy,
            standaarden: currentStandaarden,
            standaardenGemma: currentStandaardenGemma,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? { ...prev, modules } : prev;
    });
  }, [tableState, standaardenMap]);

  // If no new modules exist, show a message
  if (newModules.length === 0) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaarden
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Compliance met standaarden voor vertrouwen en kwaliteit</strong>
          <br />
          Geef aan welke standaarden uw product ondersteunt, zoals API-specificaties
          of beveiligingsstandaarden. Dit laat zien dat uw software betrouwbaar is en
          goed aansluit op andere systemen.
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
            <strong>Geen nieuwe applicaties gevonden</strong>
          </Paragraph>
          <Paragraph>
            Alle applicaties in dit product zijn bestaande applicaties die al hun
            eigen standaarden hebben. Er hoeven geen standaarden geconfigureerd te
            worden.
          </Paragraph>
        </div>

        <ConExistingModulesInfoBox
          key='standaarden-stage-existing-modules-info'
          existingModulesLookup={existingModulesLookup}
          configType='standaarden'
        />
      </div>
    );
  }

  // If no standards available, show message
  if (standaardenOptionsLoading) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaarden
        </h2>
        <Paragraph>Standaarden laden...</Paragraph>

        <ConExistingModulesInfoBox
          key='standaarden-stage-existing-modules-info'
          existingModulesLookup={existingModulesLookup}
          configType='standaarden'
        />
      </div>
    );
  }

  if (allStandards.length === 0) {
    return (
      <div>
        <h2 id='standaarden-section-title' className='sr-only'>
          Standaarden
        </h2>

        <Paragraph>
          <strong>Compliance met standaarden voor vertrouwen en kwaliteit</strong>
          <br />
          Door aan te geven welke standaarden uw software ondersteunt, toont u de
          kwaliteit en betrouwbaarheid van uw oplossing. Standaarden zoals
          API-specificaties, beveiligingsstandaarden en
          gegevensuitwisselingsprotocollen zijn belangrijk voor organisaties om
          risico&apos;s in te schatten. Deze informatie helpt bij due diligence
          processen en architectuurbeslissingen. Compliance met erkende standaarden
          verhoogt het vertrouwen in uw software.
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

        <ConExistingModulesInfoBox
          key='standaarden-stage-existing-modules-info'
          existingModulesLookup={existingModulesLookup}
          configType='standaarden'
        />
      </div>
    );
  }

  // Create table rows with proper module grouping and layout
  const tableRows = [];

  if (sameForAll && isMultiNewApplicatie) {
    // When "same for all" is selected, group by standard instead of module
    const standardGroups = {};
    Object.entries(tableState).forEach(([key, entry]) => {
      if (!standardGroups[entry.standardId]) {
        standardGroups[entry.standardId] = [];
      }
      standardGroups[entry.standardId].push({ key, ...entry });
    });

    // Get all unique module names for the header
    const allUniqueModuleNames = [
      ...new Set(Object.values(tableState).map((entry) => entry.moduleName)),
    ].join(', ');
    let isFirstRow = true;

    // Generate table rows grouped by standard
    Object.values(standardGroups).forEach((entries) => {
      // Sort entries within each standard for consistent display
      entries.sort((a, b) => {
        // Sort by type first (verplicht before aanbevolen), then by module name
        if (a.standardType !== b.standardType) {
          return a.standardType === 'verplicht' ? -1 : 1;
        }
        return (a.moduleName || '').localeCompare(b.moduleName || '');
      });

      // Use the first entry as representative (they should all have same compliance status)
      const representativeEntry = entries[0];

      tableRows.push(
        <TableRow key={`standard-${representativeEntry.standardId}`}>
          {/* Combined Module column - only show on first row */}
          {isFirstRow && (
            <TableCell
              rowSpan={Object.keys(standardGroups).length}
              style={{
                verticalAlign: 'top',
                fontWeight: '600',
                backgroundColor: '#f8f9fa',
                borderRight: '2px solid #dee2e6',
                padding: '12px',
                minWidth: '150px',
              }}
            >
              {allUniqueModuleNames}
            </TableCell>
          )}

          {/* Standaard column */}
          <TableCell style={{ verticalAlign: 'top', padding: '12px' }}>
            <div
              style={{
                fontWeight: '500',
                marginBottom: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              {representativeEntry.standardName}
            </div>
            {representativeEntry.standardDescription && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  lineHeight: '1.4',
                  marginBottom: '0.5rem',
                }}
              >
                {representativeEntry.standardDescription}
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
              {representativeEntry.verplichteComponents.map(
                (componentName, index) => (
                  <span
                    key={`verplicht-${index}`}
                    style={{
                      fontSize: '0.75rem',
                      color: '#fff',
                      backgroundColor: '#dc3545',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      lineHeight: '1.2',
                    }}
                  >
                    VERPLICHT - {componentName}
                  </span>
                )
              )}

              {/* Render individual badges for aanbevolen components */}
              {representativeEntry.aanbevolenComponents.map(
                (componentName, index) => (
                  <span
                    key={`aanbevolen-${index}`}
                    style={{
                      fontSize: '0.75rem',
                      color: '#fff',
                      backgroundColor: '#28a745',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      lineHeight: '1.2',
                    }}
                  >
                    AANBEVOLEN - {componentName}
                  </span>
                )
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
              checked={representativeEntry.isCompliant || false}
              onChange={(checked) =>
                toggleCompliance(representativeEntry.key, checked)
              }
              label=''
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
            {representativeEntry.isCompliant && (
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
                    filename: representativeEntry.bewijs ? 'Bestand geüpload' : '',
                  }}
                  _value={representativeEntry.bewijs || ''}
                  onChange={(dataUrl) =>
                    updateBewijs(representativeEntry.key, dataUrl)
                  }
                  onChangeFileName={(filename) =>
                    updateBewijsFilename(representativeEntry.key, filename)
                  }
                  onClear={() => clearBewijs(representativeEntry.key)}
                  accept={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                  showPreview={false}
                  validation={{ required: false }}
                  propertyName={`bewijs-${representativeEntry.key}`}
                  size='small'
                  isDisabled={!!representativeEntry.url}
                />
                <Separator />
                <input
                  type='url'
                  className='utrecht-textbox utrecht-textbox--html-input'
                  value={representativeEntry.url || ''}
                  onChange={(e) =>
                    updateUrl(representativeEntry.key, e.target.value)
                  }
                  placeholder='https://...'
                  disabled={!!representativeEntry.bewijs}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}
          </TableCell>
        </TableRow>
      );

      // After first row, don't show module column anymore
      isFirstRow = false;
    });
  } else {
    // When "per application" is selected, group by module as before
    const moduleGroups = {};
    Object.entries(tableState).forEach(([key, entry]) => {
      if (!moduleGroups[entry.moduleId]) {
        moduleGroups[entry.moduleId] = [];
      }
      moduleGroups[entry.moduleId].push({ key, ...entry });
    });

    // Generate table rows with correct rowspan logic
    Object.values(moduleGroups).forEach((entries) => {
      // Sort entries within each module for consistent display
      entries.sort((a, b) => {
        // Sort by type first (verplicht before aanbevolen), then by name
        if (a.standardType !== b.standardType) {
          return a.standardType === 'verplicht' ? -1 : 1;
        }
        return (a.standardName || '').localeCompare(b.standardName || '');
      });

      entries.forEach((entry, index) => {
        const isFirstRowOfModule = index === 0;

        tableRows.push(
          <TableRow key={entry.key}>
            {/* Module column - only show on first row of each module */}
            {isFirstRowOfModule && (
              <TableCell
                rowSpan={entries.length}
                style={{
                  verticalAlign: 'top',
                  fontWeight: '600',
                  backgroundColor: '#f8f9fa',
                  borderRight: '2px solid #dee2e6',
                  padding: '12px',
                  minWidth: '150px',
                }}
              >
                {entry.moduleName}
              </TableCell>
            )}

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
                    style={{
                      fontSize: '0.75rem',
                      color: '#fff',
                      backgroundColor: '#dc3545',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      lineHeight: '1.2',
                    }}
                  >
                    VERPLICHT - {componentName}
                  </span>
                ))}

                {/* Render individual badges for aanbevolen components */}
                {entry.aanbevolenComponents.map((componentName, index) => (
                  <span
                    key={`aanbevolen-${index}`}
                    style={{
                      fontSize: '0.75rem',
                      color: '#fff',
                      backgroundColor: '#28a745',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      lineHeight: '1.2',
                    }}
                  >
                    AANBEVOLEN - {componentName}
                  </span>
                ))}
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
                onChange={(checked) => toggleCompliance(entry.key, checked)}
                label=''
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
                      filename: entry.bewijsFilename ? 'Bestand geüpload' : '',
                    }}
                    _value={entry.bewijs || ''}
                    onChange={(dataUrl) => updateBewijs(entry.key, dataUrl)}
                    onChangeFileName={(filename) =>
                      updateBewijsFilename(entry.key, filename)
                    }
                    onClear={() => clearBewijs(entry.key)}
                    accept={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                    showPreview={false}
                    validation={{ required: false }}
                    propertyName={`bewijs-${entry.key}`}
                    size='small'
                    isDisabled={!!entry.url}
                  />
                  <Separator />
                  <div>
                    <AcFormField
                      placeholder='https://...'
                      value={entry.url || ''}
                      type='url'
                      onChange={(e) => updateUrl(entry.key, e)}
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
      });
    });
  }

  return (
    <div>
      <h2 id='standaarden-section-title' className='sr-only'>
        Standaarden
      </h2>

      <Paragraph>
        Configureer compliance met standaarden voor uw nieuwe applicaties.
      </Paragraph>

      <TableContainer className='con-form-wizard-table-container'>
        <Table>
          <thead>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                Applicatie
              </TableCell>
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

      {/* Enhanced Summary info */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
        }}
      >
        {(() => {
          // Calculate total modules based on the current display mode
          const totalModules =
            sameForAll && isMultiNewApplicatie
              ? newModules.length // In "same for all" mode, count actual modules
              : Object.keys(
                  Object.entries(tableState).reduce((groups, [, entry]) => {
                    groups[entry.moduleId] = true;
                    return groups;
                  }, {})
                ).length; // In "per application" mode, count unique module IDs

          const allEntries = Object.values(tableState);

          // Calculate statistics by type
          const verplichteEntries = allEntries.filter(
            (entry) => entry.standardType === 'verplicht'
          );
          const aanbevolenEntries = allEntries.filter(
            (entry) => entry.standardType === 'aanbevolen'
          );

          // In "same for all" mode, count unique standards, not per-module entries
          const verplichteCount =
            sameForAll && isMultiNewApplicatie
              ? new Set(verplichteEntries.map((entry) => entry.standardId)).size
              : verplichteEntries.length;

          const aanbevolenCount =
            sameForAll && isMultiNewApplicatie
              ? new Set(aanbevolenEntries.map((entry) => entry.standardId)).size
              : aanbevolenEntries.length;

          const verplichteCompliant =
            sameForAll && isMultiNewApplicatie
              ? new Set(
                  verplichteEntries
                    .filter((entry) => entry.isCompliant)
                    .map((entry) => entry.standardId)
                ).size
              : verplichteEntries.filter((entry) => entry.isCompliant).length;

          const aanbevolenCompliant =
            sameForAll && isMultiNewApplicatie
              ? new Set(
                  aanbevolenEntries
                    .filter((entry) => entry.isCompliant)
                    .map((entry) => entry.standardId)
                ).size
              : aanbevolenEntries.filter((entry) => entry.isCompliant).length;

          return (
            <Paragraph style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
              <strong>Overzicht:</strong> {totalModules} applicatie
              {totalModules !== 1 ? 's' : ''},{' '}
              <span style={{ color: '#dc3545', fontWeight: '600' }}>
                {verplichteCount} verplichte standaarden (waarvan{' '}
                {verplichteCompliant} compliant)
              </span>
              {verplichteCount > 0 && aanbevolenCount > 0 && ', '}
              {aanbevolenCount > 0 && (
                <span style={{ color: '#28a745', fontWeight: '600' }}>
                  {aanbevolenCount} aanbevolen standaarden (waarvan{' '}
                  {aanbevolenCompliant} compliant)
                </span>
              )}
            </Paragraph>
          );
        })()}
      </div>

      <ConExistingModulesInfoBox
        key='standaarden-stage-existing-modules-info'
        existingModulesLookup={existingModulesLookup}
        configType='standaarden'
      />
    </div>
  );
};

export default ConFormStandaardenStage;
