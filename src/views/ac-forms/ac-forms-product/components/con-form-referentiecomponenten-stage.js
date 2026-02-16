import React, { useState, memo, useEffect } from 'react';
import ReactSelect from 'react-select';
import { ConExistingModulesInfoBox, ConModulesChoiceSwitch } from '@components';

// Removed spinner CSS since we're no longer using search functionality
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Link,
} from '@utrecht/component-library-react/dist/css-module';

/**
 * Referentiecomponenten Stage Component
 *
 * This stage manages linking reference components to new applications in the product.
 * Existing applications are excluded as they already have their reference components.
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProduct - Function to update the entire product object
 * @param {Array} referentieComponentenOptions - Available reference component options
 * @param {Array} referentieComponentenWithStandards - Reference components with their standards
 * @param {Function} setReferentieComponentenWithStandards - Function to update reference components with standards
 * @param {Object} schemas - Available schemas for field configuration
 * @param {boolean} loading - Loading state indicator
 */
const ConFormReferentiecomponentenStage = memo(
  ({
    // product,
    setProduct,
    referentieComponentenOptions,
    // referentieComponentenWithStandards,
    setReferentieComponentenWithStandards,
    // schemas,
    loading,
    getNewModulesWithApplicatieData,
    existingModulesLookup,
    referentieComponentenLoading,
    sameForAll,
    setSameForAll,
  }) => {
    // State to save per-module referentiecomponenten when switching from "per application" to "same for all"
    const [savedPerModuleState, setSavedPerModuleState] = useState(null);
    // ✅ SIMPLIFIED: Use helper method to get new modules that need referentiecomponenten configuration
    const newModules = getNewModulesWithApplicatieData
      ? getNewModulesWithApplicatieData()
      : [];

    // Check if any module has different referentiecomponenten from other modules
    const areValuesDifferent =
      newModules.length > 1 &&
      newModules.some((module, moduleIndex) => {
        // Get sorted referentiecomponenten arrays for comparison
        const currentReferentieComponenten = [
          ...(module.referentieComponenten || []),
        ].sort();

        // Compare with all other modules
        return newModules.some((otherModule, otherIndex) => {
          if (moduleIndex === otherIndex) return false;

          const otherReferentieComponenten = [
            ...(otherModule.referentieComponenten || []),
          ].sort();

          // Check if arrays have different lengths
          if (
            currentReferentieComponenten.length !== otherReferentieComponenten.length
          )
            return true;

          // Compare each referentiecomponenten
          return currentReferentieComponenten.some(
            (referentieComponenten, i) =>
              referentieComponenten !== otherReferentieComponenten[i]
          );
        });
      });

    // Update the parent state if values are detected as different
    React.useEffect(() => {
      if (areValuesDifferent && sameForAll) {
        setSameForAll(false);
      }
    }, [areValuesDifferent, sameForAll, setSameForAll]);

    // Custom handler for sameForAll changes with state management
    const handleSameForAllChange = (newSameForAll) => {
      if (newSameForAll && !sameForAll) {
        // Switching from "per application" to "same for all"
        // Save current per-module state
        const currentPerModuleState = newModules.map((module, index) => ({
          moduleIndex: index,
          referentieComponenten: [...(module.referentieComponenten || [])],
        }));
        setSavedPerModuleState(currentPerModuleState);

        // Merge all referentiecomponenten from all modules
        const allReferentieComponenten = new Set();
        newModules.forEach((module) => {
          if (Array.isArray(module.referentieComponenten)) {
            module.referentieComponenten.forEach((ref) => {
              if (ref != null && ref !== '') {
                allReferentieComponenten.add(ref);
              }
            });
          }
        });

        const mergedReferentieComponenten = Array.from(allReferentieComponenten);

        // Apply merged referentiecomponenten to all modules
        applyToAll({ referentieComponenten: mergedReferentieComponenten });

        // Update standards data for all applications using their moduleIndex
        newModules.forEach((module) => {
          updateReferentieComponentenWithStandards(
            module.moduleIndex,
            mergedReferentieComponenten
          );
        });
      } else if (!newSameForAll && sameForAll && savedPerModuleState) {
        // Switching from "same for all" to "per application" - restore saved state
        setProduct((prev) => {
          const modules = [...(prev.modules || [])];

          savedPerModuleState.forEach(({ moduleIndex, referentieComponenten }) => {
            if (
              typeof modules[moduleIndex] === 'object' &&
              !modules[moduleIndex]?.id
            ) {
              modules[moduleIndex] = {
                ...modules[moduleIndex],
                referentieComponenten: [...referentieComponenten],
              };

              // Update standards data for this specific module
              updateReferentieComponentenWithStandards(
                moduleIndex,
                referentieComponenten
              );
            }
          });

          return { ...prev, modules };
        });
      }

      // Update the parent state
      setSameForAll(newSameForAll);
    };

    const applicatieIndices = newModules.map((module, index) => index); // Use direct indices

    // Check if there are multiple NEW applications that need referentiecomponenten configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

    const updateModuleField = (moduleIndex, key, value) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        if (typeof modules[moduleIndex] === 'object' && !modules[moduleIndex]?.id) {
          modules[moduleIndex] = { ...modules[moduleIndex], [key]: value };
        }
        return { ...prev, modules };
      });
    };

    const applyToAll = (fields) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        // Only apply to NEW modules (objects, not strings)
        modules.forEach((module, index) => {
          if (
            typeof module === 'object' &&
            applicatieIndices.includes(index) &&
            !module?.id
          ) {
            modules[index] = { ...modules[index], ...fields };
          }
        });
        return { ...prev, modules };
      });
    };

    // Around line 75, add a helper function to normalize referentieComponenten values
    const normalizeValues = (values) => {
      if (!values || !Array.isArray(values)) return [];

      return values
        .map((value) => {
          // Handle null, undefined, or empty values
          if (value == null || value === '') {
            return null;
          }

          // Handle both object format {id: "...", naam: "..."} and string format
          if (typeof value === 'object') {
            const extractedId = value.id || value.value || value.naam;
            return extractedId != null ? String(extractedId) : null;
          }

          return String(value);
        })
        .filter((id) => id != null); // Remove null values from the array
    };

    const updateReferentieComponentenWithStandards = (appId, refs) => {
      const refsArray = normalizeValues(refs);

      // Update the separate array with full referentieComponent data including standards
      setReferentieComponentenWithStandards((prev) => {
        // Remove existing entries for this application
        const filtered = prev.filter((item) => item.applicatieId !== appId);

        // Add new entries with full data from referentieComponentenOptions
        const newEntries = refsArray.map((refId) => {
          const refOption = referentieComponentenOptions.find(
            (opt) => String(opt.value) === String(refId)
          );
          const refData = refOption?.data || {};

          return {
            id: refId,
            naam: refOption?.label || refId,
            moduleId: appId, // Use moduleId for consistency with standards component
            applicatieId: appId,
            // Extract standards from the API data (these come from _extend query parameter)
            aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
            verplichteStandaarden: refData.verplichteStandaarden || [],
            // Store the full API data for future use
            fullData: refData,
          };
        });

        const result = [...filtered, ...newEntries];
        return result;
      });
    };

    useEffect(() => {
      // Trigger updateReferentieComponentenWithStandards for edit mode initialization
      // This ensures standards are populated when referentieComponenten are prefilled
      if (newModules.length > 0 && referentieComponentenOptions.length > 0) {
        newModules.forEach((module) => {
          const currentRefs = module.referentieComponenten || [];
          if (currentRefs.length > 0) {
            // Normalize the refs the same way the onChange handler does
            const normalizedRefs = normalizeValues(currentRefs);

            // Only update if we have valid normalized refs
            if (normalizedRefs.length > 0) {
              updateReferentieComponentenWithStandards(
                module.moduleIndex,
                normalizedRefs
              );
            }
          }
        });
      }
    }, [
      // Only run when the actual referentieComponenten data changes, not on every module update
      JSON.stringify(newModules.map((m) => m.referentieComponenten)),
      referentieComponentenOptions.length,
    ]);

    // Don't early return - let the component continue to show ConExistingModulesInfoBox

    return (
      <div>
        <h2 id='refcomp-section-title' className='sr-only'>
          Referentiecomponenten
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>GEMMA referentiecomponenten voor interoperabiliteit</strong>
          <br />
          Koppel uw applicatie aan de GEMMA-referentiecomponenten die de
          gemeentelijke functies weergeven die uw software ondersteunt. Dit helpt
          gemeenten te zien hoe uw software past in hun architectuur en
          vergemakkelijkt integraties. Voor een overzicht van alle
          referentiecomponenten(
          <Link
            href={
              'https://www.gemmaonline.nl/wiki/Overzicht_alle_referentiecomponenten'
            }
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'inline-block',
            }}
          >
            https://www.gemmaonline.nl/wiki/Overzicht_alle_referentiecomponenten
          </Link>
          ) kunt u terecht op GEMMA Online.
        </Paragraph>

        {newModules.length === 0 && (
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
              eigen referentiecomponenten hebben vastgelegd in de Softwarecatalogus. Er
              hoeven geen referentiecomponenten geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        <ConModulesChoiceSwitch
          isMultiNewApplicatie={isMultiNewApplicatie}
          sameForAll={sameForAll}
          onSameForAllChange={handleSameForAllChange}
          configType='referentiecomponenten'
          questionText='Dezelfde referentiecomponenten voor alle nieuwe applicaties?'
          sameForAllLabel='Ja, dezelfde voor alle'
          perAppLabel='Nee, per applicatie kiezen'
        />

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Single application or "same for all" mode */}
            <div >
              <div>
                <ReactSelect
                  value={(() => {
                    const currentModule = newModules[0] || {};
                    const selectedValues = normalizeValues(
                      currentModule.referentieComponenten || []
                    );
                    return referentieComponentenOptions.filter((opt) =>
                      selectedValues.includes(String(opt.value))
                    );
                  })()}
                  onChange={(selectedOptions) => {
                    const refsArray = selectedOptions
                      ? selectedOptions.map((opt) => opt.value)
                      : [];

                    // Clear saved state when user manually updates in "same for all" mode
                    if (sameForAll && isMultiNewApplicatie && savedPerModuleState) {
                      setSavedPerModuleState(null);
                    }

                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({ referentieComponenten: refsArray });
                      // Update standards data for all applications using their moduleIndex
                      newModules.forEach((module) => {
                        updateReferentieComponentenWithStandards(
                          module.moduleIndex,
                          refsArray
                        );
                      });
                    } else {
                      updateModuleField(0, 'referentieComponenten', refsArray);
                      updateReferentieComponentenWithStandards(
                        newModules[0]?.moduleIndex,
                        refsArray
                      );
                    }
                  }}
                  options={referentieComponentenOptions.sort((a, b) =>
                    a.label.localeCompare(b.label)
                  )}
                  placeholder={
                    referentieComponentenLoading
                      ? 'Laden...'
                      : 'Zoek en selecteer een referentiecomponent'
                  }
                  isMulti={true}
                  isSearchable={true}
                  isLoading={referentieComponentenLoading}
                  isDisabled={loading}
                  closeMenuOnSelect={false}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#666',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      padding: '8px 12px', // More padding for larger area
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      alignContent: 'flex-start',
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      margin: '2px',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #bbdefb',
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: 0,
                      padding: 0,
                    }),
                    indicatorSeparator: () => ({
                      display: 'none',
                    }),
                  }}
                />
              </div>
            </div>
          </div>
        ) : applicatieIndices.length > 0 ? (
          <div>
            {/* Multiple applications, different referentiecomponenten per application */}
            <Table>
              <thead>
                <TableRow>
                  <TableCell>
                    <strong>Applicatie</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Referentiecomponenten</strong>
                  </TableCell>
                </TableRow>
              </thead>
              <TableBody>
                {newModules.map((module, index) => {
                  const app = module;

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <strong>{app.naam || `Applicatie ${index + 1}`}</strong>
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          value={(() => {
                            const currentRefs = normalizeValues(
                              app.referentieComponenten || []
                            );
                            return referentieComponentenOptions.filter((opt) =>
                              currentRefs.includes(String(opt.value))
                            );
                          })()}
                          onChange={(selectedOptions) => {
                            const refsArray = selectedOptions
                              ? selectedOptions.map((opt) => opt.value)
                              : [];

                            // Clear saved state when user manually updates in "per application" mode
                            if (!sameForAll && savedPerModuleState) {
                              setSavedPerModuleState(null);
                            }

                            updateModuleField(
                              index,
                              'referentieComponenten',
                              refsArray
                            );
                            updateReferentieComponentenWithStandards(
                              module.moduleIndex,
                              refsArray
                            );
                          }}
                          options={referentieComponentenOptions}
                          placeholder={
                            referentieComponentenLoading
                              ? 'Laden...'
                              : 'Selecteer referentie componenten'
                          }
                          isMulti={true}
                          isSearchable={true}
                          isLoading={referentieComponentenLoading}
                          closeMenuOnSelect={false}
                          isDisabled={loading}
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                            }),
                            placeholder: (provided) => ({
                              ...provided,
                              color: '#666',
                            }),
                            valueContainer: (provided) => ({
                              ...provided,
                              padding: '8px 12px', // More padding for larger area
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'flex-start',
                              alignContent: 'flex-start',
                            }),
                            multiValue: (provided) => ({
                              ...provided,
                              margin: '2px',
                              backgroundColor: '#e3f2fd',
                              border: '1px solid #bbdefb',
                            }),
                            input: (provided) => ({
                              ...provided,
                              margin: 0,
                              padding: 0,
                            }),
                            indicatorSeparator: () => ({
                              display: 'none',
                            }),
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <ConExistingModulesInfoBox
          key='referentie-stage-existing-modules-info'
          existingModulesLookup={existingModulesLookup}
          configType='referentiecomponenten'
        />
      </div>
    );
  }
);

ConFormReferentiecomponentenStage.displayName = 'ConFormReferentiecomponentenStage';

export default ConFormReferentiecomponentenStage;
