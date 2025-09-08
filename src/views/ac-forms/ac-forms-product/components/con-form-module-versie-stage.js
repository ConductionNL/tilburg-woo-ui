import React, { useState, memo } from 'react';
import clsx from 'clsx';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
// import { AcCheckbox } from '@src/molecules';
// import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { ConExistingModulesInfoBox, ConModulesChoiceSwitch } from '@components';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textbox,
  Heading3,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Module Versie Stage Component
 *
 * This stage manages version information for new applications in the product.
 * Existing applications are excluded as they already have their version information.
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProduct - Function to update the entire product object
 * @param {boolean} isMultiApplicatie - Whether product has multiple applications
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormModuleVersieStage = memo(
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
    const [sameForAll, setSameForAll] = useState(true);

    // Get moduleVersie schema for status options and defaults
    const moduleVersieSchema = schemas?.moduleversie;
    const statusOptions =
      moduleVersieSchema?.properties?.status?.enum?.map((status) => ({
        value: status,
        label:
          typeof status === 'string' && status.length > 0
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : status,
      })) || [];

    // Extract default values from schema
    const getSchemaDefaults = () => {
      const defaults = {};
      if (moduleVersieSchema?.properties) {
        Object.entries(moduleVersieSchema.properties).forEach(([key, property]) => {
          if (property.default !== undefined) {
            defaults[key] = property.default;
          }
          // Also check for examples as fallback defaults
          if (property.example !== undefined && defaults[key] === undefined) {
            defaults[key] = property.example;
          }
        });
      }
      return defaults;
    };

    const schemaDefaults = getSchemaDefaults();

    // Only show versions when cloud dienstverleningsmodel is On-premises (self-managed)
    const isOnPremise = (product?.cloudDienstverleningsmodel || '').includes(
      'On-premises (self-managed)'
    );
    if (!isOnPremise) {
      return null;
    }

    // ✅ SIMPLIFIED: Use helper method to get new modules that need versie configuration
    const newModules = getNewModulesWithApplicatieData
      ? getNewModulesWithApplicatieData()
      : [];
    const applicatieIndices = newModules.map((module, index) => index); // Use direct indices

    // Check if there are multiple NEW applications that need versie configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

    // Helpers to manage multiple version rows
    const updateModuleVersieAt = (moduleIndex, versionIndex, field, value) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const module = modules[moduleIndex];
        if (typeof module === 'object') {
          const versions = Array.isArray(module.moduleVersies)
            ? [...module.moduleVersies]
            : [];
          if (!versions[versionIndex]) {
            versions[versionIndex] = { ...schemaDefaults };
          }
          versions[versionIndex] = { ...versions[versionIndex], [field]: value };
          modules[moduleIndex] = { ...module, moduleVersies: versions };
          return { ...prev, modules };
        }
        return prev;
      });
    };

    const addModuleVersie = (moduleIndex) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const module = modules[moduleIndex];
        if (typeof module === 'object') {
          const versions = Array.isArray(module.moduleVersies)
            ? [...module.moduleVersies]
            : [];
          versions.push({ ...schemaDefaults });
          modules[moduleIndex] = { ...module, moduleVersies: versions };
          return { ...prev, modules };
        }
        return prev;
      });
    };

    const removeModuleVersie = (moduleIndex, versionIndex) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const module = modules[moduleIndex];
        if (typeof module === 'object') {
          const versions = Array.isArray(module.moduleVersies)
            ? [...module.moduleVersies]
            : [];
          if (versions.length > 1) {
            versions.splice(versionIndex, 1);
            modules[moduleIndex] = { ...module, moduleVersies: versions };
            return { ...prev, modules };
          }
        }
        return prev;
      });
    };

    // Render a single module's version table
    const renderModuleVersionTable = (module, moduleIndex) => {
      const versions =
        Array.isArray(module.moduleVersies) && module.moduleVersies.length > 0
          ? module.moduleVersies
          : [{ ...schemaDefaults }];

      return (
        <div key={`module-${moduleIndex}`} style={{ marginBottom: '2rem' }}>
          <Heading3 style={{ marginBottom: '1rem' }}>
            {module.naam || `Applicatie ${moduleIndex + 1}`}
          </Heading3>

          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Versie</b>
                </TableCell>
                <TableCell>
                  <b>Status</b>
                </TableCell>
                <TableCell>
                  <b>Beschrijving</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {versions.map((moduleVersie, vIdx) => (
                <TableRow key={`${moduleIndex}-${vIdx}`}>
                  <TableCell>
                    <Textbox
                      value={moduleVersie.versie || schemaDefaults.versie || ''}
                      onChange={(e) =>
                        updateModuleVersieAt(
                          moduleIndex,
                          vIdx,
                          'versie',
                          e.target.value
                        )
                      }
                      placeholder={
                        schemaDefaults.versie ||
                        moduleVersieSchema?.properties?.versie?.example ||
                        '1.0.0'
                      }
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      className={clsx(
                        'ac-beheer-select',
                        loading && 'ac-beheer-select--disabled'
                      )}
                      value={
                        statusOptions.find(
                          (opt) =>
                            opt.value ===
                            (moduleVersie.status || schemaDefaults.status)
                        ) || null
                      }
                      onChange={(opt) =>
                        updateModuleVersieAt(
                          moduleIndex,
                          vIdx,
                          'status',
                          opt?.value || null
                        )
                      }
                      options={statusOptions}
                      isDisabled={loading}
                      placeholder={schemaDefaults.status || 'Selecteer status'}
                    />
                  </TableCell>
                  <TableCell>
                    <Textbox
                      value={
                        moduleVersie.beschrijvingKort ||
                        schemaDefaults.beschrijvingKort ||
                        ''
                      }
                      onChange={(e) =>
                        updateModuleVersieAt(
                          moduleIndex,
                          vIdx,
                          'beschrijvingKort',
                          e.target.value
                        )
                      }
                      placeholder={
                        schemaDefaults.beschrijvingKort ||
                        moduleVersieSchema?.properties?.beschrijvingKort?.example ||
                        'Beschrijving'
                      }
                      disabled={loading}
                      maxLength={255}
                    />
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.TRASHCAN />}
                        disabled={versions.length <= 1 || loading}
                        onClick={() => removeModuleVersie(moduleIndex, vIdx)}
                        title='Versie verwijderen'
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div style={{ marginTop: '1rem' }}>
            <AcButton
              style='button'
              icon={<VISUALS.PLUS />}
              onClick={() => addModuleVersie(moduleIndex)}
              disabled={loading}
            >
              Rij toevoegen voor {module.naam || `Applicatie ${moduleIndex + 1}`}
            </AcButton>
          </div>
        </div>
      );
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='versie-section-title'
      >
        <h2 id='versie-section-title' className='sr-only'>
          Versies
        </h2>
        <Paragraph style={{ marginBottom: '2rem' }}>
          <strong>Versie-informatie voor beheer en planning</strong>
          <br />
          Versie-informatie laat zien hoe actueel uw software is en helpt
          organisaties bij planning en impactanalyses. Geef de versienummering,
          status (bijv. in gebruik, ontwikkeling, uitgefaseerd) en een korte
          toelichting op.
        </Paragraph>

        <ConModulesChoiceSwitch
          isMultiNewApplicatie={isMultiNewApplicatie}
          sameForAll={sameForAll}
          onSameForAllChange={setSameForAll}
          configType='versie'
        />

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            <h3>Versie informatie</h3>
            {(() => {
              const appIndex = applicatieIndices[0];
              const versions = Array.isArray(newModules[0]?.moduleVersies)
                ? newModules[0].moduleVersies
                : [{ ...schemaDefaults }];
              return (
                <Table>
                  <thead>
                    <TableRow>
                      <TableCell>
                        <b>Versienummer</b>
                      </TableCell>
                      <TableCell>
                        <b>Status</b>
                      </TableCell>
                      <TableCell>
                        <b>Beschrijving</b>
                      </TableCell>
                      <TableCell>
                        <b>Acties</b>
                      </TableCell>
                    </TableRow>
                  </thead>
                  <TableBody>
                    {versions.map((mv, vIdx) => (
                      <TableRow key={`v-${vIdx}`}>
                        <TableCell>
                          <Textbox
                            value={mv.versie || schemaDefaults.versie || ''}
                            onChange={(e) =>
                              updateModuleVersieAt(
                                appIndex,
                                vIdx,
                                'versie',
                                e.target.value
                              )
                            }
                            placeholder={
                              schemaDefaults.versie ||
                              moduleVersieSchema?.properties?.versie?.example ||
                              '1.0.0'
                            }
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <ReactSelect
                            className={clsx(
                              'ac-beheer-select',
                              loading && 'ac-beheer-select--disabled'
                            )}
                            value={
                              statusOptions.find(
                                (opt) =>
                                  opt.value === (mv.status || schemaDefaults.status)
                              ) || null
                            }
                            onChange={(opt) =>
                              updateModuleVersieAt(
                                appIndex,
                                vIdx,
                                'status',
                                opt?.value || null
                              )
                            }
                            options={statusOptions}
                            isDisabled={loading}
                            placeholder={schemaDefaults.status || 'Selecteer status'}
                          />
                        </TableCell>
                        <TableCell>
                          <Textbox
                            value={
                              mv.beschrijvingKort ||
                              schemaDefaults.beschrijvingKort ||
                              ''
                            }
                            onChange={(e) =>
                              updateModuleVersieAt(
                                appIndex,
                                vIdx,
                                'beschrijvingKort',
                                e.target.value
                              )
                            }
                            placeholder={
                              schemaDefaults.beschrijvingKort ||
                              moduleVersieSchema?.properties?.beschrijvingKort
                                ?.example ||
                              'Beschrijving'
                            }
                            disabled={loading}
                            maxLength={255}
                          />
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <AcButton
                              style='button'
                              buttonType='secondary'
                              icon={<VISUALS.TRASHCAN />}
                              disabled={versions.length <= 1 || loading}
                              onClick={() => removeModuleVersie(appIndex, vIdx)}
                              title='Versie verwijderen'
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <div style={{ marginTop: '1rem' }}>
                      <AcButton
                        style='button'
                        icon={<VISUALS.PLUS />}
                        onClick={() => addModuleVersie(appIndex)}
                        disabled={loading}
                      >
                        Rij toevoegen
                      </AcButton>
                    </div>
                  </TableBody>
                </Table>
              );
            })()}
          </div>
        ) : applicatieIndices.length > 0 ? (
          <div>
            {/* Render separate tables for each module */}
            {newModules.map((module, moduleIndex) =>
              renderModuleVersionTable(module, moduleIndex)
            )}
          </div>
        ) : null}

        <ConExistingModulesInfoBox
          key='versie-stage-existing-modules-info'
          existingModulesLookup={existingModulesLookup}
          configType='versies'
        />
      </div>
    );
  }
);

ConFormModuleVersieStage.displayName = 'ConFormModuleVersieStage';

export default ConFormModuleVersieStage;
