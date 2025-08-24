import React, { useState, memo } from 'react';
import { AcCheckbox } from '@src/molecules';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
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
    product,
    setProduct,
    referentieComponentenOptions,
    referentieComponentenWithStandards,
    setReferentieComponentenWithStandards,
    schemas,
    loading,
    getNewModulesWithApplicatieData,
  }) => {
    const [sameForAll, setSameForAll] = useState(true);

    // ✅ SIMPLIFIED: Use helper method to get new modules that need referentiecomponenten configuration
    const newModules = getNewModulesWithApplicatieData ? getNewModulesWithApplicatieData() : [];
    const applicatieIndices = newModules.map((module, index) => index); // Use direct indices

    const applicatieOptions = applicatieIndices.map((i) => ({
      value: i,
      label: newModules[i]?.naam || `Applicatie ${i + 1}`,
    }));

    // Check if there are multiple NEW applications that need referentiecomponenten configuration
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

    const normalizeValues = (values) => {
      if (!values) return [];
      if (Array.isArray(values)) {
        return values.map((v) => (typeof v === 'object' ? v.value || v.id : v));
      }
      return Array.from(new Set(values));
    };

    const updateReferentieComponentenWithStandards = (appId, refs) => {
      const refsArray = normalizeValues(refs);
      
      // Update the separate array with full referentieComponent data including standards
      setReferentieComponentenWithStandards((prev) => {
        // Remove existing entries for this application
        const filtered = prev.filter(item => item.applicatieId !== appId);
        
        // Add new entries with full data from referentieComponentenOptions
        const newEntries = refsArray.map(refId => {
          const refOption = referentieComponentenOptions.find(opt => String(opt.value) === String(refId));
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
        console.log('🔍 Updated referentieComponentenWithStandards:', result);
        return result;
      });
    };

    // If no new applications exist, show a message instead of the form
    if (applicatieIndices.length === 0) {
      return (
        <div>
          <h2 id='refcomp-section-title' className='sr-only'>
            Referentiecomponenten
          </h2>

          <Paragraph>
            Koppel referentiecomponenten aan uw nieuwe applicaties.
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
              Alle applicaties in dit product zijn bestaande applicaties die al
              hun eigen referentiecomponenten hebben. Er hoeven geen
              referentiecomponenten gekoppeld te worden.
            </Paragraph>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 id='refcomp-section-title' className='sr-only'>
          Referentiecomponenten
        </h2>

        <Paragraph>
          Koppel referentiecomponenten aan uw nieuwe applicaties.
        </Paragraph>

        {/* Same for all checkbox - only show if multiple new applications */}
        {isMultiNewApplicatie && (
          <div style={{ marginBottom: '1rem' }}>
            <AcCheckbox
              checked={sameForAll}
              label='Dezelfde referentiecomponenten voor alle applicaties'
              onChange={() => setSameForAll(!sameForAll)}
            />
          </div>
        )}

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Single application or "same for all" mode */}
            <div className='ac-register-form-grid'>
              <div>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='referentieComponenten'
                  value={(() => {
                    const currentModule = newModules[0] || {};
                    return currentModule.referentieComponenten || [];
                  })()}
                  onChange={(value) => {
                    const refsArray = normalizeValues(value);
                    if (sameForAll && isMultiNewApplicatie) {
                      applyToAll({ referentieComponenten: refsArray });
                      // Update standards data for all applications
                      applicatieIndices.forEach(appId => {
                        updateReferentieComponentenWithStandards(appId, refsArray);
                      });
                    } else {
                      updateModuleField(0, 'referentieComponenten', refsArray);
                      updateReferentieComponentenWithStandards(applicatieIndices[0], refsArray);
                    }
                  }}
                  isDisabled={loading}
                  width='full'
                  schemas={schemas}
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
                  const currentRefs = app.referentieComponenten || [];

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <strong>{app.naam || `Applicatie ${index + 1}`}</strong>
                      </TableCell>
                      <TableCell>
                        <ConSchemaEnhancedField
                          schemaType='module'
                          schemaProperty='referentieComponenten'
                          value={currentRefs}
                          onChange={(value) => {
                            const refsArray = normalizeValues(value);
                            updateModuleField(index, 'referentieComponenten', refsArray);
                            updateReferentieComponentenWithStandards(index, refsArray);
                          }}
                          isDisabled={loading}
                          width='full'
                          schemas={schemas}
                          showLabel={false}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          // No new applications that need referentiecomponenten configuration
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
            <Paragraph style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
              Alle applicaties zijn bestaande applicaties uit de catalogus. 
              Hun referentiecomponenten zijn al vastgelegd en hoeven niet opnieuw geconfigureerd te worden.
            </Paragraph>
          </div>
        )}
      </div>
    );
  }
);

ConFormReferentiecomponentenStage.displayName = 'ConFormReferentiecomponentenStage';

export default ConFormReferentiecomponentenStage;
