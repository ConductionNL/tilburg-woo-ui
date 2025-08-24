import React, { useState, memo } from 'react';
import clsx from 'clsx';
import { AcCheckbox } from '@src/molecules';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { ConExistingModulesInfoBox, ConModulesChoiceSwitch } from '@components';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textbox,
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
  ({ product, setProduct, isMultiApplicatie, loading, schemas, getNewModulesWithApplicatieData, existingModulesLookup, getAllModulesForStages }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // Get moduleVersie schema for status options and defaults
    const moduleVersieSchema = schemas?.moduleversie;
    const statusOptions = moduleVersieSchema?.properties?.status?.enum?.map(status => ({
      value: status,
      label: status
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

    // ✅ SIMPLIFIED: Use helper method to get new modules that need versie configuration
    const newModules = getNewModulesWithApplicatieData ? getNewModulesWithApplicatieData() : [];
    const applicatieIndices = newModules.map((module, index) => index); // Use direct indices

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: newModules[i]?.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need versie configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;
    
    // Debug logging to understand the state
    console.log('🔧 Versie stage debug:', {
      applicatieIndicesLength: applicatieIndices.length,
      isMultiNewApplicatie,
      sameForAll,
      newModulesCount: newModules.length,
      existingModulesCount: existingModulesLookup ? Object.keys(existingModulesLookup).length : 0,
      showChoiceOptions: applicatieIndices.length > 0 && isMultiNewApplicatie,
      showSingleForm: applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll),
      showTable: applicatieIndices.length > 0 && isMultiNewApplicatie && !sameForAll
    });

    const updateModuleVersie = (moduleIndex, field, value) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const module = modules[moduleIndex];
        
        if (typeof module === 'object') {
          // Initialize moduleVersies array if it doesn't exist
          if (!module.moduleVersies) {
            module.moduleVersies = [];
          }
          
          // For now, we'll manage one version per module (index 0)
          if (!module.moduleVersies[0]) {
            // Initialize with schema defaults
            module.moduleVersies[0] = { ...schemaDefaults };
            console.log('🔧 Initializing moduleVersie with schema defaults:', schemaDefaults);
          }
          
          module.moduleVersies[0][field] = value;
          modules[moduleIndex] = module;
          
          return { ...prev, modules };
        }
        
        return prev;
      });
    };

    const applyToAll = (fields) => {
      applicatieIndices.forEach((index) => {
        Object.entries(fields).forEach(([field, value]) => {
          updateModuleVersie(index, field, value);
        });
      });
    };

    const renderVersieFields = ({ appIndex, moduleVersie, isSameForAll = false }) => {
      const handleFieldChange = (field, value) => {
        if (isSameForAll) {
          // Apply to all modules
          applyToAll({ [field]: value });
          console.log('🔧 Applying to all modules:', field, value);
        } else {
          // Update only specific module
          updateModuleVersie(appIndex, field, value);
        }
      };

      return (
        <div className='con-form-field-layout'>
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='versie'
            value={moduleVersie?.versie || schemaDefaults.versie || ''}
            onChange={(value) => handleFieldChange('versie', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            // placeholder will come from schema example
          />
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='status'
            value={moduleVersie?.status || schemaDefaults.status || ''}
            onChange={(value) => handleFieldChange('status', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            // placeholder will come from schema example
          />
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='beschrijvingKort'
            value={moduleVersie?.beschrijvingKort || schemaDefaults.beschrijvingKort || ''}
            onChange={(value) => handleFieldChange('beschrijvingKort', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
            // placeholder will come from schema example
          />
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
        <Paragraph>
          <strong>Versie-informatie voor beheer en planning</strong><br/>
          Versie-informatie helpt organisaties om te begrijpen welke functies beschikbaar zijn en hoe actueel uw software is. 
          De status (zoals 'in gebruik', 'ontwikkeling', of 'uitgefaseerd') geeft inzicht in de levenscyclus en ondersteuningsmogelijkheden. 
          Een korte beschrijving per versie helpt bij het kiezen van de juiste versie voor hun situatie. 
          Deze informatie wordt gebruikt voor impactanalyses bij updates en voor planningsdoeleinden.
        </Paragraph>





        <ConModulesChoiceSwitch
          isMultiNewApplicatie={isMultiNewApplicatie}
          sameForAll={sameForAll}
          onSameForAllChange={setSameForAll}
          configType="versie"
        />

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            <h3>Versie informatie</h3>
            {renderVersieFields({
              appIndex: applicatieIndices[0],
              moduleVersie: newModules[0]?.moduleVersies?.[0] || {},
              isSameForAll: sameForAll && isMultiNewApplicatie
            })}
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
                    <b>Versie</b>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell>
                    <b>Beschrijving</b>
                  </TableCell>
                </TableRow>
              </thead>
              <TableBody>
                {newModules.map((module, index) => {
                  const app = module;
                  const moduleVersie = app.moduleVersies?.[0] || {};
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <span>{app.naam || `Applicatie ${index + 1}`}</span>
                      </TableCell>
                      <TableCell>
                        <Textbox
                          value={moduleVersie.versie || schemaDefaults.versie || ''}
                          onChange={(e) => updateModuleVersie(index, 'versie', e.target.value)}
                          placeholder={schemaDefaults.versie || moduleVersieSchema?.properties?.versie?.example || '1.0.0'}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            loading && 'ac-beheer-select--disabled'
                          )}
                          value={statusOptions.find(opt => opt.value === (moduleVersie.status || schemaDefaults.status)) || null}
                          onChange={(opt) => updateModuleVersie(index, 'status', opt?.value || null)}
                          options={statusOptions}
                          isDisabled={loading}
                          placeholder={schemaDefaults.status || 'Selecteer status'}
                        />
                      </TableCell>
                      <TableCell>
                        <Textbox
                          value={moduleVersie.beschrijvingKort || schemaDefaults.beschrijvingKort || ''}
                          onChange={(e) => updateModuleVersie(index, 'beschrijvingKort', e.target.value)}
                          placeholder={schemaDefaults.beschrijvingKort || moduleVersieSchema?.properties?.beschrijvingKort?.example || 'Beschrijving'}
                          disabled={loading}
                          maxLength={255}
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
          key="versie-stage-existing-modules-info"
          existingModulesLookup={existingModulesLookup}
          configType="versies"
        />
      </div>
    );
  }
);

ConFormModuleVersieStage.displayName = 'ConFormModuleVersieStage';

export default ConFormModuleVersieStage;
