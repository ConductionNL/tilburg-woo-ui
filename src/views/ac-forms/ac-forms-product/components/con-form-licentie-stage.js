import React, { useState, memo, useEffect } from 'react';
import clsx from 'clsx';
// import { AcButton } from '@src/molecules';
import { ConExistingModulesInfoBox, ConModulesChoiceSwitch } from '@components';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';
import licenses from '@assets/licenses/licenses.json';

/**
 * Licentie Stage Component
 *
 * This stage manages license information for new applications in the product.
 * Existing applications are excluded as they already have their license information.
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProduct - Function to update the entire product object
 * @param {boolean} isMultiApplicatie - Whether product has multiple applications
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormLicentieStage = memo(
  ({
    product,
    setProduct,
    // isMultiApplicatie: _isMultiApplicatie,
    loading,
    // schemas: _schemas,
    getNewModulesWithApplicatieData,
    existingModulesLookup,
    // getAllModulesForStages: _getAllModulesForStages,
  }) => {
    // ✅ SIMPLIFIED: Use helper method to get new modules that need license configuration
    const newModules = getNewModulesWithApplicatieData
      ? getNewModulesWithApplicatieData()
      : [];

    // Check if any module has different licenties from other modules
    const areValuesDifferent =
      newModules.length > 1 &&
      newModules.some((module, moduleIndex) => {
        // Get sorted licentie arrays for comparison
        const currentLicenties = [...(module.licenties || [])].sort((a, b) =>
          `${a.licentietype}-${a.licentie}`.localeCompare(
            `${b.licentietype}-${b.licentie}`
          )
        );

        // Compare with all other modules
        return newModules.some((otherModule, otherIndex) => {
          if (moduleIndex === otherIndex) return false;

          const otherLicenties = [...(otherModule.licenties || [])].sort((a, b) =>
            `${a.licentietype}-${a.licentie}`.localeCompare(
              `${b.licentietype}-${b.licentie}`
            )
          );

          // Check if arrays have different lengths
          if (currentLicenties.length !== otherLicenties.length) return true;

          // Compare each licentie
          return currentLicenties.some(
            (licentie, i) =>
              licentie.licentietype !== otherLicenties[i].licentietype ||
              licentie.licentie !== otherLicenties[i].licentie
          );
        });
      });
    // if there is a difference between values set sameForAll to false
    const [sameForAll, setSameForAll] = useState(!areValuesDifferent);

    // ✅ NEW: Separate state for "same for all" configuration values
    // This ensures immediate reactivity without waiting for product state sync
    const [sameForAllConfig, setSameForAllConfig] = useState({
      licentietype: '',
      licentie: '',
    });

    // Options
    const licentieTypeOptions = [
      { value: 'Closed Source', label: 'Closed Source' },
      { value: 'Open Source', label: 'Open Source' },
    ];

    const licentieOptions = licenses.map((l) => ({
      value: l['SPDX ID'],
      label: l.name,
    }));

    // ✅ CRITICAL FIX: Get the actual indices in product.modules where new modules are located
    const applicatieIndices = [];
    (product.modules || []).forEach((module, index) => {
      if (typeof module === 'object') {
        applicatieIndices.push(index);
      }
    });

    // const applicatieOptions = newModules.map((module, i) => ({
    //   value: i,
    //   label: module.naam || `Applicatie ${i + 1}`,
    // }));

    // Check if there are multiple NEW applications that need license configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

    // ✅ Initialize sameForAllConfig from first module when modules change
    useEffect(() => {
      if (newModules.length > 0 && isMultiNewApplicatie) {
        const firstModule = newModules[0];
        const newConfig = {
          licentietype: firstModule.licentietype || firstModule.licentieType || '',
          licentie: firstModule.licentie || '',
        };
        setSameForAllConfig(newConfig);
      }
    }, [newModules.length, isMultiNewApplicatie]);

    const updateModuleField = (moduleIndex, key, value) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        if (typeof modules[moduleIndex] === 'object') {
          modules[moduleIndex] = { ...modules[moduleIndex], [key]: value };
        }
        return { ...prev, modules };
      });
    };

    const applyToAll = (fields) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        // Only apply to NEW modules (objects, not strings)
        // Track updates locally (no-op output)
        modules.forEach((module, index) => {
          if (typeof module === 'object' && applicatieIndices.includes(index)) {
            modules[index] = { ...modules[index], ...fields };
          }
        });

        return { ...prev, modules };
      });
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='license-hosting-section-title'
      >
        <h2 id='license-hosting-section-title' className='sr-only'>
          Licentie
        </h2>
        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Licentie-informatie voor transparantie en compliance</strong>
          <br />
          Licentie-informatie geeft duidelijkheid over de voorwaarden waaronder uw
          software beschikbaar is. Dit helpt organisaties bij hun selectie,
          juridische beoordeling en inkoop. Kies eerst of uw software open source of
          closed source is en selecteer vervolgens de specifieke licentie.
        </Paragraph>

        {applicatieIndices.length === 0 && (product.modules || []).length > 0 && (
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
              eigen licentie-informatie hebben vastgelegd in de catalogus. Er hoeven
              geen licenties geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        <ConModulesChoiceSwitch
          isMultiNewApplicatie={isMultiNewApplicatie}
          sameForAll={sameForAll}
          onSameForAllChange={(value) => {
            setSameForAll(value);
            // When switching back to "same for all", sync config from first module
            if (value && newModules.length > 0) {
              const firstModule = newModules[0];
              const syncConfig = {
                licentietype:
                  firstModule.licentietype || firstModule.licentieType || '',
                licentie: firstModule.licentie || '',
              };
              setSameForAllConfig(syncConfig);
              // Synced sameForAllConfig on mode switch
            }
          }}
          configType='licentie'
        />

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Direct implementation instead of renderSelectors for better reactivity */}
            <div className='ac-register-form-grid'>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                  }}
                >
                  Licensevorm <span style={{ color: 'red' }}>*</span>
                </label>
                <ReactSelect
                  value={(() => {
                    const currentValue =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '';
                    return (
                      licentieTypeOptions.find(
                        (opt) => opt.value === currentValue
                      ) || null
                    );
                  })()}
                  onChange={(selectedOption) => {
                    const value = selectedOption?.value || '';

                    // Store as both schema field name and camelCase for compatibility
                    if (sameForAll && isMultiNewApplicatie) {
                      // Update the dedicated state first for immediate reactivity
                      setSameForAllConfig((prev) => ({
                        ...prev,
                        licentietype: value,
                        ...(value !== 'Open Source' ? { licentie: '' } : {}),
                      }));

                      // Then update all modules
                      applyToAll({
                        licentietype: value, // Schema field name
                        licentieType: value, // Legacy camelCase
                        ...(value !== 'Open Source' ? { licentie: '' } : {}),
                      });
                    } else {
                      updateModuleField(0, 'licentietype', value);
                      updateModuleField(0, 'licentieType', value);
                      if (value !== 'Open Source')
                        updateModuleField(0, 'licentie', '');
                    }
                  }}
                  options={licentieTypeOptions}
                  placeholder='Selecteer licensevorm'
                  isDisabled={loading}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px',
                      height: '48px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#666',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      height: '46px',
                      padding: '0 12px',
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
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                  }}
                >
                  {(() => {
                    const currentLicenseType =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '';
                    const isOpenSource = currentLicenseType === 'Open Source';
                    return isOpenSource ? 'Licentie *' : 'Licentie';
                  })()}
                </label>
                <ReactSelect
                  value={(() => {
                    const currentValue =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentie
                        : newModules[0]?.licentie || '';
                    return (
                      licentieOptions.find((opt) => opt.value === currentValue) ||
                      null
                    );
                  })()}
                  onChange={(selectedOption) => {
                    const value = selectedOption?.value || '';

                    // Handle license change directly
                    if (sameForAll && isMultiNewApplicatie) {
                      // Update the dedicated state first for immediate reactivity
                      setSameForAllConfig((prev) => ({ ...prev, licentie: value }));

                      // Then update all modules
                      applyToAll({ licentie: value });
                    } else {
                      updateModuleField(0, 'licentie', value);
                    }
                  }}
                  options={licentieOptions}
                  placeholder={(() => {
                    const currentLicenseType =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '';
                    const isOpenSource = currentLicenseType === 'Open Source';
                    return isOpenSource
                      ? 'Selecteer licentie (verplicht)'
                      : 'Selecteer licentie';
                  })()}
                  isDisabled={(() => {
                    // Get current license type dynamically from the appropriate source
                    const currentLicenseType =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '';

                    return loading || currentLicenseType !== 'Open Source';
                  })()}
                  styles={(() => {
                    // Get current values dynamically for styling
                    const currentLicenseType =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '';
                    const currentLicense =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentie
                        : newModules[0]?.licentie || '';

                    const isOpenSource = currentLicenseType === 'Open Source';
                    const hasError = isOpenSource && !currentLicense;

                    return {
                      control: (provided) => ({
                        ...provided,
                        minHeight: '48px',
                        height: '48px',
                        border: hasError ? '1px solid #dc2626' : '1px solid #ccc', // Red border if error
                        borderRadius: '4px',
                        boxShadow: hasError
                          ? '0 0 0 1px #dc2626'
                          : provided.boxShadow,
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#666',
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        height: '46px',
                        padding: '0 12px',
                      }),
                      input: (provided) => ({
                        ...provided,
                        margin: 0,
                        padding: 0,
                      }),
                      indicatorSeparator: () => ({
                        display: 'none',
                      }),
                    };
                  })()}
                />
              </div>
            </div>
          </div>
        ) : applicatieIndices.length > 0 ? (
          <div>
            <Table>
              <thead>
                <TableRow>
                  <TableCell>
                    <b>Nieuwe applicatie</b>
                  </TableCell>
                  <TableCell>
                    <b>Type licentie</b>
                  </TableCell>
                  <TableCell>
                    <b>Licentie</b>
                  </TableCell>
                </TableRow>
              </thead>
              <TableBody>
                {newModules.map((module, index) => {
                  const app = module;
                  const selectedType =
                    licentieTypeOptions.find(
                      (o) => o.value === (app.licentietype || app.licentieType)
                    ) || null;
                  const selectedLicentie =
                    licentieOptions.find((o) => o.value === app.licentie) || null;
                  const isOpenSourceSelected = selectedType?.value === 'Open Source';
                  const isLicenseRequired =
                    isOpenSourceSelected && !selectedLicentie;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <span>{app.naam || `Applicatie ${index + 1}`}</span>
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            loading && 'ac-beheer-select--disabled'
                          )}
                          value={selectedType}
                          onChange={(opt) => {
                            const value = opt?.value || null;
                            // Store as both schema field name and camelCase for compatibility
                            updateModuleField(index, 'licentietype', value);
                            updateModuleField(index, 'licentieType', value);
                            // Clear license if not Open Source
                            if (value !== 'Open Source') {
                              updateModuleField(index, 'licentie', '');
                            }
                          }}
                          options={licentieTypeOptions}
                          isDisabled={loading}
                          placeholder='Selecteer type licentie'
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            (loading || selectedType?.value !== 'Open Source') &&
                              'ac-beheer-select--disabled',
                            // Add red border when Open Source is selected but no license is chosen
                            isLicenseRequired && 'ac-beheer-select--error'
                          )}
                          value={selectedLicentie}
                          onChange={(opt) =>
                            updateModuleField(index, 'licentie', opt?.value || null)
                          }
                          options={licentieOptions}
                          isDisabled={
                            loading || selectedType?.value !== 'Open Source'
                          }
                          placeholder={
                            isOpenSourceSelected
                              ? 'Selecteer licentie (verplicht)'
                              : 'Selecteer licentie'
                          }
                          isClearable
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          // No new applications that need license configuration
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
            }}
          >
            <Paragraph style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
              Alle applicaties zijn bestaande applicaties uit de catalogus. Hun
              licentie-informatie is al vastgelegd en hoeft niet opnieuw
              geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        <ConExistingModulesInfoBox
          key='licentie-stage-existing-modules-info'
          existingModulesLookup={existingModulesLookup}
          configType='licenties'
        />
      </div>
    );
  }
);

ConFormLicentieStage.displayName = 'ConFormLicentieStage';

export default ConFormLicentieStage;
