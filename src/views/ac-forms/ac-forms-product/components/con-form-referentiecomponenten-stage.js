import React, { useState, memo, useCallback } from 'react';
import ReactSelect from 'react-select';
import { ConExistingModulesInfoBox, ConModulesChoiceSwitch } from '@components';

// Add CSS for spinner animation (in case needed for future enhancements)
const spinnerStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject CSS if not already present
if (!document.getElementById('referentie-spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'referentie-spinner-styles';
  style.textContent = spinnerStyles;
  document.head.appendChild(style);
}
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
    existingModulesLookup,
    searchReferentieComponenten,
    referentieComponentenLoading,
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
            <strong>GEMMA referentiecomponenten voor interoperabiliteit</strong><br/>
            Referentiecomponenten uit de GEMMA architectuur tonen aan welke standaard gemeentelijke functies uw software ondersteunt. 
            Door deze te koppelen aan uw applicaties, kunnen organisaties direct zien of uw software aansluit op hun IT-architectuur. 
            Dit vergemakkelijkt integratie met bestaande systemen en zorgt voor herkenbare functionaliteit. 
            Organisaties gebruiken deze informatie voor architectuur-assessments en interoperabiliteitsbeoordelingen.
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
          <strong>GEMMA referentiecomponenten voor interoperabiliteit</strong><br/>
          Referentiecomponenten uit de GEMMA architectuur tonen aan welke standaard gemeentelijke functies uw software ondersteunt. 
          Door deze te koppelen aan uw applicaties, kunnen organisaties direct zien of uw software aansluit op hun IT-architectuur. 
          Dit vergemakkelijkt integratie met bestaande systemen en zorgt voor herkenbare functionaliteit. 
          Organisaties gebruiken deze informatie voor architectuur-assessments en interoperabiliteitsbeoordelingen.
        </Paragraph>



        <ConModulesChoiceSwitch
          isMultiNewApplicatie={isMultiNewApplicatie}
          sameForAll={sameForAll}
          onSameForAllChange={setSameForAll}
          configType="referentiecomponenten"
          questionText="Dezelfde referentiecomponenten voor alle nieuwe applicaties?"
          sameForAllLabel="Ja, dezelfde voor alle"
          perAppLabel="Nee, per applicatie kiezen"
        />

        {applicatieIndices.length > 0 && (!isMultiNewApplicatie || sameForAll) ? (
          <div>
            {/* Single application or "same for all" mode */}
            <div className='ac-register-form-grid'>
              <div style={{ width: '100%', maxWidth: '400px' }}>
                <ReactSelect
                  value={(() => {
                    const currentModule = newModules[0] || {};
                    const selectedValues = currentModule.referentieComponenten || [];
                    return referentieComponentenOptions.filter(opt => selectedValues.includes(opt.value));
                  })()}
                  onChange={(selectedOptions) => {
                    const refsArray = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
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
                  options={referentieComponentenOptions}
                  placeholder={referentieComponentenOptions.length === 0 && !referentieComponentenLoading ? "Begin met typen om te zoeken..." : "Selecteer referentie componenten"}
                  isMulti={true}
                  isSearchable={true}
                  isLoading={referentieComponentenLoading}
                  isDisabled={loading}
                  onInputChange={(inputValue, actionMeta) => {
                    if (actionMeta.action === 'input-change') {
                      console.log('🔍 ReactSelect referentie search input:', inputValue);
                      if (searchReferentieComponenten) {
                        searchReferentieComponenten(inputValue);
                      }
                    }
                  }}
                  filterOption={() => true} // Disable client-side filtering, use server search
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px', // Match the height of original field
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
                        <ReactSelect
                          value={referentieComponentenOptions.filter(opt => currentRefs.includes(opt.value))}
                          onChange={(selectedOptions) => {
                            const refsArray = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                            updateModuleField(index, 'referentieComponenten', refsArray);
                            updateReferentieComponentenWithStandards(index, refsArray);
                          }}
                          options={referentieComponentenOptions}
                          placeholder={referentieComponentenOptions.length === 0 && !referentieComponentenLoading ? "Begin met typen om te zoeken..." : "Selecteer referentie componenten"}
                          isMulti={true}
                          isSearchable={true}
                          isLoading={referentieComponentenLoading}
                          isDisabled={loading}
                          onInputChange={(inputValue, actionMeta) => {
                            if (actionMeta.action === 'input-change') {
                              console.log('🔍 ReactSelect referentie search input (table):', inputValue);
                              if (searchReferentieComponenten) {
                                searchReferentieComponenten(inputValue);
                              }
                            }
                          }}
                          filterOption={() => true} // Disable client-side filtering, use server search
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              minHeight: '48px', // Match the height of original field
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

        <ConExistingModulesInfoBox 
          key="referentie-stage-existing-modules-info"
          existingModulesLookup={existingModulesLookup}
          configType="referentiecomponenten"
        />
      </div>
    );
  }
);

ConFormReferentiecomponentenStage.displayName = 'ConFormReferentiecomponentenStage';

export default ConFormReferentiecomponentenStage;
