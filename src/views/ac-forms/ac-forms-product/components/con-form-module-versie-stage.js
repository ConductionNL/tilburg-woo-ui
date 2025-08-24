import React, { useState, memo } from 'react';
import clsx from 'clsx';
import { AcCheckbox } from '@src/molecules';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
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
  ({ product, setProduct, isMultiApplicatie, loading, schemas, getNewModulesWithApplicatieData }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // Get moduleVersie schema for status options
    const moduleVersieSchema = schemas?.moduleversie;
    const statusOptions = moduleVersieSchema?.properties?.status?.enum?.map(status => ({
      value: status,
      label: status
    })) || [];

    // ✅ SIMPLIFIED: Use helper method to get new modules that need versie configuration
    const newModules = getNewModulesWithApplicatieData ? getNewModulesWithApplicatieData() : [];
    const applicatieIndices = newModules.map((module, index) => index); // Use direct indices

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: newModules[i]?.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need versie configuration
    const isMultiNewApplicatie = applicatieIndices.length > 1;

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
            module.moduleVersies[0] = {};
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

    const renderVersieFields = ({ appIndex, moduleVersie }) => {
      return (
        <div className='con-form-field-layout'>
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='versie'
            value={moduleVersie?.versie || ''}
            onChange={(value) => updateModuleVersie(appIndex, 'versie', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            // placeholder will come from schema example
          />
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='status'
            value={moduleVersie?.status || ''}
            onChange={(value) => updateModuleVersie(appIndex, 'status', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            // placeholder will come from schema example
          />
          <ConSchemaEnhancedField
            schemaType='moduleversie'
            schemaProperty='beschrijvingKort'
            value={moduleVersie?.beschrijvingKort || ''}
            onChange={(value) => updateModuleVersie(appIndex, 'beschrijvingKort', value)}
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
          Geef versie informatie op voor uw nieuwe applicaties/modules.
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
              eigen versie-informatie hebben vastgelegd in de catalogus. Er hoeven geen
              versies geconfigureerd te worden.
            </Paragraph>
          </div>
        )}

        {applicatieIndices.length > 0 && isMultiNewApplicatie && (
          <div
            className='ac-register-form-checkbox-wrapper'
            style={{ marginBottom: '1rem' }}
          >
            <p>Geldt dezelfde versie-informatie voor alle nieuwe applicaties?</p>
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
            <h3>Versie informatie</h3>
            {renderVersieFields({
              appIndex: applicatieIndices[0],
              moduleVersie: newModules[0]?.moduleVersies?.[0] || {}
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
                          value={moduleVersie.versie || ''}
                          onChange={(e) => updateModuleVersie(index, 'versie', e.target.value)}
                          placeholder='1.0.0'
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <ReactSelect
                          className={clsx(
                            'ac-beheer-select',
                            loading && 'ac-beheer-select--disabled'
                          )}
                          value={statusOptions.find(opt => opt.value === moduleVersie.status) || null}
                          onChange={(opt) => updateModuleVersie(index, 'status', opt?.value || null)}
                          options={statusOptions}
                          isDisabled={loading}
                          placeholder='Status'
                        />
                      </TableCell>
                      <TableCell>
                        <Textbox
                          value={moduleVersie.beschrijvingKort || ''}
                          onChange={(e) => updateModuleVersie(index, 'beschrijvingKort', e.target.value)}
                          placeholder='Beschrijving'
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
      </div>
    );
  }
);

ConFormModuleVersieStage.displayName = 'ConFormModuleVersieStage';

export default ConFormModuleVersieStage;
