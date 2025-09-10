import React, { useState, useEffect, useMemo } from 'react';
import { AcCheckbox } from '@src/molecules';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';

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
}) => {
  // ✅ SIMPLIFIED: Use helper method to get new modules with applicatie data
  const newModules = useMemo(() => {
    return getNewModulesWithApplicatieData ? getNewModulesWithApplicatieData() : [];
  }, [getNewModulesWithApplicatieData]);

  // State to track compliance and bewijs for each module-standard combination
  const [tableState, setTableState] = useState({});

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

            if (standardsMap.has(standardId)) {
              // Standard already exists, add this component to the aanbevolen list
              const existing = standardsMap.get(standardId);
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
              standardsMap.set(standardId, {
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

            if (standardsMap.has(standardId)) {
              // Standard already exists, add this component to the verplichte list
              const existing = standardsMap.get(standardId);
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
              standardsMap.set(standardId, {
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
          };
        }
      });
    });

    setTableState(initialState);
  }, [newModules, referentieComponentenWithStandards, standaardenMap]);

  // Toggle compliance for a specific module-standard combination
  const toggleCompliance = (key, isCompliant) => {
    // Get current entry BEFORE updating state to avoid React timing issues
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
        // Clear bewijs and filename if not compliant
        bewijs: isCompliant ? prev[key]?.bewijs || null : null,
        bewijsFilename: isCompliant ? prev[key]?.bewijsFilename || null : null,
      },
    }));

    // Update product data using currentEntry (not the updated tableState)
    setProduct((prev) => {
      const modules = [...(prev.modules || [])];
      const moduleIndex = currentEntry.moduleId;
      const app = modules[moduleIndex];

      if (typeof app !== 'object') {
        console.warn(
          'Cannot update compliancy on existing module:',
          moduleIndex,
          app
        );
        return prev;
      }

      let compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

      if (isCompliant) {
        // Add or update compliancy object
        const existingIndex = compliancy.findIndex(
          (c) => c.standaardversie === currentEntry.standardId
        );
        const compliancyObject = {
          standaardversie: currentEntry.standardId,
          standaardnaam: currentEntry.standardName,
          // ✅ REMOVED: module property - backend handles this with inversedBy logic
          bewijs: currentEntry.bewijs || null,
          // ✅ NEW: Add filename field for internal tracking
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

      modules[moduleIndex] = {
        ...app,
        compliancy,
      };

      return { ...prev, modules };
    });
  };

  // Update bewijs for a specific module-standard combination
  const updateBewijs = (key, bewijs) => {
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bewijs,
      },
    }));

    // Update product data
    const entry = tableState[key];
    if (!entry) return;

    setProduct((prev) => {
      const modules = [...(prev.modules || [])];
      const moduleIndex = entry.moduleId; // This should now be the direct module index
      const app = modules[moduleIndex];
      const compliancy = Array.isArray(app.compliancy) ? [...app.compliancy] : [];

      const updatedCompliancy = compliancy.map((c) =>
        c.standaardversie === entry.standardId
          ? {
              ...c,
              standaardnaam: entry.standardName,
              bewijs,
              // ✅ NEW: Keep existing filename when updating bewijs
              bewijsFilename: c.bewijsFilename || entry.bewijsFilename || null,
            }
          : c
      );

      if (typeof app === 'object') {
        modules[moduleIndex] = {
          ...app,
          compliancy: updatedCompliancy,
        };
        return { ...prev, modules };
      }
      return prev;
    });
  };

  // ✅ NEW: Update bewijs filename for a specific module-standard combination
  const updateBewijsFilename = (key, filename) => {
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bewijsFilename: filename,
      },
    }));

    // Update product data
    const entry = tableState[key];
    if (!entry) return;

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
              // Keep existing bewijs data
              bewijs: c.bewijs || entry.bewijs || null,
            }
          : c
      );

      if (typeof app === 'object') {
        modules[moduleIndex] = {
          ...app,
          compliancy: updatedCompliancy,
        };
        return { ...prev, modules };
      }
      return prev;
    });
  };

  // ✅ NEW: Clear both bewijs and filename
  const clearBewijs = (key) => {
    setTableState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bewijs: null,
        bewijsFilename: null,
      },
    }));

    // Update product data
    const entry = tableState[key];
    if (!entry) return;

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

      if (typeof app === 'object') {
        modules[moduleIndex] = {
          ...app,
          compliancy: updatedCompliancy,
        };
        return { ...prev, modules };
      }
      return prev;
    });
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
      const entriesWithCompliancy = Object.entries(tableState).filter(
        ([key, entry]) => entry.isCompliant
      );

      if (entriesWithCompliancy.length > 0) {
        setProduct((prev) => {
          const modules = [...(prev.modules || [])];
          let hasChanges = false;

          entriesWithCompliancy.forEach(([key, entry]) => {
            const moduleIndex = entry.moduleId;
            const app = modules[moduleIndex];

            if (typeof app !== 'object') {
              console.warn(
                'Cannot update compliancy on existing module:',
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
        .filter(([key, entry]) => entry.isCompliant)
        .map(([key, entry]) => ({
          key,
          standardId: entry.standardId,
          isCompliant: entry.isCompliant,
        }))
    ),
  ]);

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
      </div>
    );
  }

  // Create table rows with proper module grouping and layout
  const tableRows = [];

  // Group entries by module ID and sort them
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

          {/* Bewijs column */}
          <TableCell
            style={{
              verticalAlign: 'top',
              minWidth: '200px',
              padding: '12px',
            }}
          >
            {entry.isCompliant && (
              <LogoUploadField
                fieldConfig={{
                  label: '',
                  // Don't display filename in UI - just show generic message
                  filename: entry.bewijs ? 'Bestand geüpload' : '',
                }}
                _value={entry.bewijs || ''}
                onChange={(dataUrl) => updateBewijs(entry.key, dataUrl)}
                // ✅ NEW: Add filename change handler (for internal tracking only)
                onChangeFileName={(filename) =>
                  updateBewijsFilename(entry.key, filename)
                }
                // ✅ NEW: Update clear handler to clear both bewijs and filename
                onClear={() => clearBewijs(entry.key)}
                accept={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                showPreview={false}
                validation={{ required: false }}
                propertyName={`bewijs-${entry.key}`}
                size='small'
              />
            )}
          </TableCell>
        </TableRow>
      );
    });
  });

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
                Module
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
                Compliant
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
          const totalModules = Object.keys(moduleGroups).length;
          const allEntries = Object.values(tableState);

          // Calculate statistics by type
          const verplichteEntries = allEntries.filter(
            (entry) => entry.standardType === 'verplicht'
          );
          const aanbevolenEntries = allEntries.filter(
            (entry) => entry.standardType === 'aanbevolen'
          );

          const verplichteCompliant = verplichteEntries.filter(
            (entry) => entry.isCompliant
          ).length;
          const aanbevolenCompliant = aanbevolenEntries.filter(
            (entry) => entry.isCompliant
          ).length;

          return (
            <Paragraph style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
              <strong>Overzicht:</strong> {totalModules} module
              {totalModules !== 1 ? 's' : ''},{' '}
              <span style={{ color: '#dc3545', fontWeight: '600' }}>
                {verplichteEntries.length} verplichte standaarden (waarvan{' '}
                {verplichteCompliant} compliant)
              </span>
              {verplichteEntries.length > 0 && aanbevolenEntries.length > 0 && ', '}
              {aanbevolenEntries.length > 0 && (
                <span style={{ color: '#28a745', fontWeight: '600' }}>
                  {aanbevolenEntries.length} aanbevolen standaarden (waarvan{' '}
                  {aanbevolenCompliant} compliant)
                </span>
              )}
            </Paragraph>
          );
        })()}
      </div>
    </div>
  );
};

export default ConFormStandaardenStage;
