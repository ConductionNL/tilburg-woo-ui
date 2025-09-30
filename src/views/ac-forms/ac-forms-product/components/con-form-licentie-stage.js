import React, { useState, memo, useEffect } from 'react';
// import clsx from 'clsx';
// import { AcButton } from '@src/molecules';
import { ConExistingModulesInfoBox, ConModulesChoiceSwitch } from '@components';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';
// import ReactSelect from 'react-select';
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
    schemas,
    getNewModulesWithApplicatieData,
    existingModulesLookup,
    // getAllModulesForStages: _getAllModulesForStages,
  }) => {
    // ✅ SIMPLIFIED: Use helper method to get new modules that need license configuration
    const newModules = getNewModulesWithApplicatieData
      ? getNewModulesWithApplicatieData()
      : [];

    // Check if any module has different license information from other modules
    const areValuesDifferent =
      newModules.length > 1 &&
      newModules.some((module, moduleIndex) => {
        // Get current module's license info
        const currentLicentietype = module.licentietype || module.licentieType || '';
        const currentLicentie = module.licentie || '';

        // Compare with all other modules
        return newModules.some((otherModule, otherIndex) => {
          if (moduleIndex === otherIndex) return false;

          const otherLicentietype =
            otherModule.licentietype || otherModule.licentieType || '';
          const otherLicentie = otherModule.licentie || '';

          // Check if license type or specific license is different
          return (
            currentLicentietype !== otherLicentietype ||
            currentLicentie !== otherLicentie
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

    // ✅ Use the real index inside product.modules for the first new module
    const firstNewModuleIndex = applicatieIndices[0];

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
                  Licentievorm <span style={{ color: 'red' }}>*</span>
                </label>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='licentietype'
                  value={(() => {
                    return (
                      (sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '') || ''
                    );
                  })()}
                  onChange={(value) => {
                    const nextValue = value || '';

                    if (sameForAll && isMultiNewApplicatie) {
                      setSameForAllConfig((prev) => ({
                        ...prev,
                        licentietype: nextValue,
                        ...(nextValue !== 'Open source' ? { licentie: '' } : {}),
                      }));

                      applyToAll({
                        licentietype: nextValue,
                        licentieType: nextValue,
                        ...(nextValue !== 'Open source' ? { licentie: '' } : {}),
                      });
                    } else if (typeof firstNewModuleIndex === 'number') {
                      updateModuleField(
                        firstNewModuleIndex,
                        'licentietype',
                        nextValue
                      );
                      updateModuleField(
                        firstNewModuleIndex,
                        'licentieType',
                        nextValue
                      );
                      if (nextValue !== 'Open Source')
                        updateModuleField(firstNewModuleIndex, 'licentie', '');
                    }
                  }}
                  isDisabled={loading}
                  inputStyle={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px !important',
                      height: '48px !important',
                      border: '1px solid #ccc !important',
                      borderRadius: '4px !important',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#666 !important',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      height: '46px !important',
                      padding: '0 12px !important',
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: '0 !important',
                      padding: '0 !important',
                    }),
                    indicatorSeparator: () => ({
                      display: 'none !important',
                    }),
                  }}
                  width='full'
                  showLabel={false}
                  customProps={{ placeholder: 'Selecteer licentievorm' }}
                  schemas={schemas}
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
                    const isOpenSource = currentLicenseType === 'Open source';
                    return isOpenSource ? 'Licentie *' : 'Licentie';
                  })()}
                </label>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='licentie'
                  value={(() => {
                    return (
                      (sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentie
                        : newModules[0]?.licentie) || ''
                    );
                  })()}
                  onChange={(value) => {
                    const nextValue = value || '';
                    if (sameForAll && isMultiNewApplicatie) {
                      setSameForAllConfig((prev) => ({
                        ...prev,
                        licentie: nextValue,
                      }));
                      applyToAll({ licentie: nextValue });
                    } else if (typeof firstNewModuleIndex === 'number') {
                      updateModuleField(firstNewModuleIndex, 'licentie', nextValue);
                    }
                  }}
                  optionsProvider={licentieOptions}
                  customProps={{
                    placeholder: (() => {
                      const currentLicenseType =
                        sameForAll && isMultiNewApplicatie
                          ? sameForAllConfig.licentietype
                          : newModules[0]?.licentietype ||
                            newModules[0]?.licentieType ||
                            '';
                      const isOpenSource = currentLicenseType === 'Open source';
                      return isOpenSource
                        ? 'Selecteer licentie (verplicht)'
                        : 'Selecteer licentie';
                    })(),
                  }}
                  isDisabled={(() => {
                    const currentLicenseType =
                      sameForAll && isMultiNewApplicatie
                        ? sameForAllConfig.licentietype
                        : newModules[0]?.licentietype ||
                          newModules[0]?.licentieType ||
                          '';
                    return loading || currentLicenseType !== 'Open source';
                  })()}
                  inputStyle={(() => {
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
                    const isOpenSource = currentLicenseType === 'Open source';
                    const hasError = isOpenSource && !currentLicense;
                    return {
                      control: (provided) => ({
                        ...provided,
                        minHeight: '48px',
                        height: '48px',
                        border: hasError ? '1px solid #dc2626' : '1px solid #ccc',
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
                  width='full'
                  showLabel={false}
                  schemas={schemas}
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
                  const realIndex = applicatieIndices[index];
                  const licenseTypeValue =
                    app.licentietype || app.licentieType || '';
                  const selectedLicentie =
                    licentieOptions.find((o) => o.value === app.licentie) || null;
                  const isOpenSourceSelected = licenseTypeValue === 'Open source';
                  const isLicenseRequired =
                    isOpenSourceSelected && !selectedLicentie;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <span>{app.naam || `Applicatie ${index + 1}`}</span>
                      </TableCell>
                      <TableCell>
                        <ConSchemaEnhancedField
                          schemaType='module'
                          schemaProperty='licentietype'
                          value={licenseTypeValue}
                          onChange={(value) => {
                            const nextValue = value || null;
                            updateModuleField(realIndex, 'licentietype', nextValue);
                            updateModuleField(realIndex, 'licentieType', nextValue);
                            if (nextValue !== 'Open Source') {
                              updateModuleField(realIndex, 'licentie', '');
                            }
                          }}
                          isDisabled={loading}
                          width='full'
                          showLabel={false}
                          customProps={{ placeholder: 'Selecteer type licentie' }}
                          schemas={schemas}
                        />
                      </TableCell>
                      <TableCell>
                        <ConSchemaEnhancedField
                          schemaType='module'
                          schemaProperty='licentie'
                          value={app.licentie || null}
                          onChange={(value) =>
                            updateModuleField(realIndex, 'licentie', value || null)
                          }
                          optionsProvider={licentieOptions}
                          isDisabled={loading || licenseTypeValue !== 'Open source'}
                          customProps={{
                            placeholder: isOpenSourceSelected
                              ? 'Selecteer licentie (verplicht)'
                              : 'Selecteer licentie',
                          }}
                          showLabel={false}
                          width='full'
                          schemas={schemas}
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
