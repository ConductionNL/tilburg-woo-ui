import React, { useState, memo } from 'react';
import clsx from 'clsx';
import { AcButton, AcCheckbox } from '@src/molecules';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
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
  ({ product, setProduct, isMultiApplicatie, loading, schemas, getNewModulesWithApplicatieData }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // Options
    const licentieTypeOptions = [
      { value: 'Closed Source', label: 'Closed Source' },
      { value: 'Open Source', label: 'Open Source' },
    ];

    const licentieOptions = licenses.map((l) => ({
      value: l['SPDX ID'],
      label: l.name,
    }));

    // ✅ SIMPLIFIED: Use helper method to get new modules that need license configuration
    const newModules = getNewModulesWithApplicatieData ? getNewModulesWithApplicatieData() : [];
    const applicatieIndices = newModules.map((module, index) => index); // Use direct indices

    const applicatieOptions = newModules.map((module, i) => ({
      value: i,
      label: module.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need license configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

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
        <Paragraph>
          Geef hieronder aan welke licenties van toepassing zijn op de nieuwe applicatie(s).
        </Paragraph>

        {applicatieIndices.length === 0 && allApplicatieIndices.length > 0 && (
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
              eigen licentie-informatie hebben vastgelegd in de catalogus. Er hoeven geen
              licenties geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        {applicatieIndices.length > 0 && isMultiNewApplicatie && (
          <div
            className='ac-register-form-checkbox-wrapper'
            style={{ marginBottom: '1rem' }}
          >
            <p>Geldt dezelfde licentie-informatie voor alle nieuwe applicaties?</p>
            <AcCheckbox
              label='Ja, voor alle applicaties hetzelfde'
              value='same'
              checked={sameForAll}
              onChange={() => setSameForAll(true)}
            />
            <AcCheckbox
              label='Nee, per applicatie verschillend'
              value='per-app'
              checked={!sameForAll}
              onChange={() => setSameForAll(false)}
            />
          </div>
        )}

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Direct implementation instead of renderSelectors for better reactivity */}
            <div className='ac-register-form-grid'>
              <div>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='licentietype'
                  value={(() => {
                    const currentModule = newModules[0] || {};
                    return currentModule.licentietype || currentModule.licentieType || '';
                  })()}
                  onChange={(value) => {
                    // Store as both schema field name and camelCase for compatibility
                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({
                        licentietype: value,  // Schema field name
                        licentieType: value,  // Legacy camelCase
                        ...(value !== 'Open Source' ? { licentie: '' } : {}),
                      });
                    } else {
                      updateModuleField(0, 'licentietype', value);
                      updateModuleField(0, 'licentieType', value);
                      if (value !== 'Open Source') updateModuleField(0, 'licentie', '');
                    }
                  }}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />
              </div>
              <div>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='licentie'
                  value={(() => {
                    const currentModule = newModules[0] || {};
                    return currentModule.licentie || '';
                  })()}
                  onChange={(value) => {
                    // Handle license change directly
                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({ licentie: value });
                    } else {
                      updateModuleField(0, 'licentie', value);
                    }
                  }}
                  isDisabled={(() => {
                    // Get current license type dynamically
                    const currentModule = newModules[0] || {};
                    const currentLicenseType = currentModule.licentietype || currentModule.licentieType || '';
                    return loading || currentLicenseType !== 'Open Source';
                  })()}
                  width='half'
                  schemas={schemas}
                  customProps={(() => {
                    // Get current values dynamically for customProps
                    const currentModule = newModules[0] || {};
                    const currentLicenseType = currentModule.licentietype || currentModule.licentieType || '';
                    const currentLicense = currentModule.licentie || '';
                    const isOpenSource = currentLicenseType === 'Open Source';
                    
                    return {
                      // Add required styling when Open Source is selected
                      className: clsx(
                        isOpenSource && !currentLicense && 'ac-beheer-select--error'
                      ),
                      placeholder: isOpenSource ? 'Selecteer licentie (verplicht)' : 'Selecteer licentie',
                      // Make field required when Open Source is selected
                      required: isOpenSource,
                      // Add visual required indicator
                      label: isOpenSource ? 'licentie *' : 'licentie'
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
                    licentieTypeOptions.find((o) => o.value === (app.licentietype || app.licentieType)) ||
                    null;
                  const selectedLicentie =
                    licentieOptions.find((o) => o.value === app.licentie) || null;
                  const isOpenSourceSelected = selectedType?.value === 'Open Source';
                  const isLicenseRequired = isOpenSourceSelected && !selectedLicentie;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            'ac-beheer-select--disabled'
                          )}
                          value={
                            applicatieOptions.find((o) => o.value === index) || null
                          }
                          options={applicatieOptions}
                          isDisabled
                        />
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
                            updateModuleField(
                              index,
                              'licentie',
                              opt?.value || null
                            )
                          }
                          options={licentieOptions}
                          isDisabled={
                            loading || selectedType?.value !== 'Open Source'
                          }
                          placeholder={isOpenSourceSelected ? 'Selecteer licentie (verplicht)' : 'Selecteer licentie'}
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
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
            <Paragraph style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
              Alle applicaties zijn bestaande applicaties uit de catalogus. 
              Hun licentie-informatie is al vastgelegd en hoeft niet opnieuw geconfigureerd te worden.
            </Paragraph>
          </div>
        )}
      </div>
    );
  }
);

ConFormLicentieStage.displayName = 'ConFormLicentieStage';

export default ConFormLicentieStage;
