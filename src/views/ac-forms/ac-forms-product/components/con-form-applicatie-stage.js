import React, { useState, memo } from 'react';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textbox,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

// Applicatie form fields are extracted to module scope to avoid remounts
// used in ApplicatieStep - now using schema-driven fields
const ApplicatieFormFields = memo(
  ({ index, applicatie, updateApplicatie, loading, schemas }) => {
    // Add defensive check for applicatie object
    if (!applicatie) {
      console.warn(`ApplicatieFormFields: applicatie is undefined for index ${index}`);
      return <div>Loading applicatie...</div>;
    }

    // Get module schema for field configuration
    const moduleSchema = schemas?.module;
    if (!moduleSchema) {
      return <div>Schema laden...</div>;
    }

    return (
      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='naam'
            value={applicatie.naam || ''}
            onChange={(value) => updateApplicatie(index, 'naam', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='beschrijvingKort'
            value={applicatie.beschrijvingKort || ''}
            onChange={(value) => updateApplicatie(index, 'beschrijvingKort', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />
        </div>
      </div>
    );
  }
);

ApplicatieFormFields.displayName = 'ApplicatieFormFields';

/**
 * Applicatie Stage Component
 * 
 * This stage manages applications within a product. It supports both single and multiple 
 * application modes, and allows users to add new applications or link existing ones.
 * 
 * @param {Object} product - The product object containing form data
 * @param {Function} setProduct - Function to update the entire product object
 * @param {boolean} isMultiApplicatie - Whether product has multiple applications
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration
 * @param {boolean} schemasLoading - Whether schemas are still loading
 * @param {Object} store - Store object for API calls
 */
const ConFormApplicatieStage = memo(
  ({
    product,
    setProduct,
    isMultiApplicatie,
    loading,
    schemas,
    schemasLoading,
    store,
    existingModulesLookup,
    setExistingModulesLookup,
  }) => {
    // Keep focus while typing by only committing name changes on blur

    // State for selecting existing applications to add
    const [selectedExistingApplication, setSelectedExistingApplication] =
      useState(null);
    // State to store available module options for lookup
    const [availableModuleOptions, setAvailableModuleOptions] = useState([]);

    const updateModule = (moduleIndex, key, value) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const existing = modules[moduleIndex];
        // Only update if it's an object (new module), not a string (existing module ID)
        if (typeof existing === 'object') {
          modules[moduleIndex] = { ...existing, [key]: value };
          return { ...prev, modules };
        }
        return prev;
      });
    };

    const addModule = () => {
      setProduct((prev) => {
        // ✅ NEW: Create new module object directly with empty data
        const newModuleObject = {
          naam: '',
          beschrijvingKort: '',
          beschrijvingLang: '',
          licentieType: '',
          licentie: '',
          hostingLocatie: '',
          hostingJurisdictie: '',
          standaarden: [],
          referentieComponenten: [],
          diensten: [],
          // Backend will generate ID and other properties when saving
        };

        return {
          ...prev,
          // ✅ Add new module object directly to modules array
          modules: [...(prev.modules || []), newModuleObject],
        };
      });
    };

    // Function to add an existing application to the applications list
    const addExistingApplication = () => {
      if (!selectedExistingApplication) return;

      // Debug logging to understand the data structure
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Adding existing application:', {
          selectedApplication: selectedExistingApplication,
          isArray: Array.isArray(selectedExistingApplication),
          isString: typeof selectedExistingApplication === 'string',
          length: selectedExistingApplication?.length,
          firstItem: Array.isArray(selectedExistingApplication)
            ? selectedExistingApplication[0]
            : selectedExistingApplication,
          storeCollections: store?.object
            ? Object.keys(store.object.collections || {})
            : 'no store',
        });
      }

      // Handle different data types: string ID, object, or array
      let selectedItem;

      if (typeof selectedExistingApplication === 'string') {
        // If it's just a string ID, we need to find the full object from available options
        // Get the options from the store directly
        const collectionType = 'voorzieningen_module_options';
        const moduleCollection = store?.object?.getCollection?.(collectionType);

        console.log('🔍 Looking for module collection:', {
          collectionType,
          hasCollection: !!moduleCollection,
          resultsCount: moduleCollection?.results?.length,
          firstResult: moduleCollection?.results?.[0],
        });

        if (moduleCollection?.results) {
          const foundModule = moduleCollection.results.find(
            (item) => item['@self']?.id === selectedExistingApplication
          );
          console.log('🔍 Found module:', {
            foundModule,
            searchingFor: selectedExistingApplication,
          });

          if (foundModule) {
            selectedItem = {
              value: selectedExistingApplication,
              label: foundModule['@self']?.name || 'Unnamed Module',
              data: foundModule,
            };
          } else {
            console.warn(
              'Could not find module data for ID:',
              selectedExistingApplication
            );
            return;
          }
        } else {
          console.warn('Module collection not available');
          return;
        }
      } else if (Array.isArray(selectedExistingApplication)) {
        selectedItem = selectedExistingApplication[0]; // Take first item if array
      } else {
        selectedItem = selectedExistingApplication; // Use directly if object
      }

      if (!selectedItem) {
        console.warn('No selected item found');
        return;
      }

      setProduct((prev) => {
        const moduleId = selectedItem.value;
        const applicationData = selectedItem.data || {};
        
        // Extract basic info from selected application
        const naam = selectedItem.label ||
          applicationData.naam ||
          applicationData.name ||
          applicationData.title ||
          applicationData['@self']?.name ||
          'Unnamed Application';

        const beschrijvingKort = applicationData.beschrijvingKort ||
          applicationData.beschrijving ||
          applicationData.description ||
          applicationData.beschrijvingLang ||
          applicationData.summary ||
          applicationData['@self']?.description ||
          '';

        // ✅ NEW STRUCTURE: Only store ID in modules array, data in separate lookup
        // Update separate lookup state
        setExistingModulesLookup(prevLookup => ({
          ...prevLookup,
          [moduleId]: {
            id: moduleId,
            naam,
            beschrijvingKort,
            fullData: applicationData,
          },
        }));
        
        return {
          ...prev,
          // Add module ID string to modules array (for backend submission)
          modules: [...(prev.modules || []), moduleId],
        };
      });

      // Clear the selection
      setSelectedExistingApplication(null);
    };

    if (!isMultiApplicatie) {
      const firstModule = product.modules?.[0];
      
      // Ensure there's always a module object for single applicatie mode
      if (!firstModule || typeof firstModule === 'string') {
        // Initialize module with product name and description if available
        const productName = product.naam || '';
        const productDescription = product.beschrijvingKort || '';
        
        // Initialize the first module with product data
        const newModule = {
          naam: productName,
          beschrijvingKort: productDescription,
          beschrijvingLang: '',
          licentieType: '',
          licentie: '',
          hostingLocatie: '',
          hostingJurisdictie: '',
          standaarden: [],
          referentieComponenten: [],
          diensten: [],
        };
        
        setProduct(prev => ({
          ...prev,
          modules: [newModule, ...(prev.modules || []).filter(m => typeof m === 'string')],
        }));
        
        return <div>Initialiseren...</div>;
      }
      
      return (
        <div
          className='ac-register-form-section'
          role='group'
          aria-labelledby='applicatie-section-title'
        >
          <h2 id='applicatie-section-title' className='sr-only'>
            Applicatie
          </h2>
          <ApplicatieFormFields
            index={0}
            applicatie={firstModule}
            updateApplicatie={(index, key, value) => updateModule(index, key, value)}
            loading={loading}
            schemas={schemas}
          />
        </div>
      );
    }

    // ✅ NEW: Get all modules directly from modules array for display
    const getAllModulesForDisplay = () => {
      const items = [];
      
      (product.modules || []).forEach((module, index) => {
        if (typeof module === 'string') {
          // Existing module (string ID)
          const lookupData = existingModulesLookup[module];
          items.push({
            type: 'existing',
            key: `existing-${module}`,
            moduleId: module,
            moduleIndex: index,
            data: lookupData || { id: module, naam: `Module ${module}` },
          });
        } else {
          // New module (object with data)
          items.push({
            type: 'new',
            key: `new-${index}`,
            moduleIndex: index,
            data: module,
          });
        }
      });
      
      return items;
    };

    const moduleItems = getAllModulesForDisplay();
    const hasAnyModules = moduleItems.length > 0;

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='applicaties-section-title'
      >
        <h2 id='applicaties-section-title' className='sr-only'>
          Applicaties
        </h2>
        
        {hasAnyModules && (
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>{schemas?.module?.properties?.naam?.title || 'Naam'}</b>
                </TableCell>
                <TableCell>
                  <b>{schemas?.module?.properties?.beschrijvingKort?.title || 'Beschrijving'}</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {moduleItems.map((item) => {
                const isExisting = item.type === 'existing';
                const data = item.data;

                return (
                  <TableRow key={item.key}>
                    <TableCell>
                      {isExisting ? (
                        // Read-only display for existing modules
                        <div
                          style={{
                            padding: '8px 12px',
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666',
                            fontStyle: 'italic',
                          }}
                        >
                          {data.naam}{' '}
                          <small style={{ marginLeft: '8px', color: '#999' }}>
                            (bestaande applicatie)
                          </small>
                        </div>
                      ) : (
                        <Textbox
                          id={`table-module-naam-${item.moduleIndex}`}
                          value={data?.naam || ''}
                          onChange={(e) =>
                            updateModule(item.moduleIndex, 'naam', e.target.value)
                          }
                          placeholder={schemas?.module?.properties?.naam?.example || 'Naam van de applicatie'}
                          disabled={loading}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isExisting ? (
                        // Read-only display for existing modules
                        <div
                          style={{
                            padding: '8px 12px',
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666',
                            fontStyle: 'italic',
                          }}
                        >
                          {data.beschrijvingKort || 'Geen beschrijving beschikbaar'}
                        </div>
                      ) : (
                        <Textbox
                          id={`table-module-beschrijving-${item.moduleIndex}`}
                          value={data?.beschrijvingKort || ''}
                          onChange={(e) =>
                            updateModule(item.moduleIndex, 'beschrijvingKort', e.target.value)
                          }
                          maxLength={255}
                          placeholder={schemas?.module?.properties?.beschrijvingKort?.example || 'Beschrijving van de applicatie'}
                          disabled={loading}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <AcButton
                          style='button'
                          buttonType='secondary'
                          icon={<VISUALS.TRASHCAN />}
                          disabled={moduleItems.length === 1}
                          onClick={() => {
                            if (isExisting) {
                              // Remove existing module from modules array and lookup
                              setProduct((prev) => ({
                                ...prev,
                                modules: (prev.modules || []).filter((_, index) => index !== item.moduleIndex),
                              }));
                              
                              setExistingModulesLookup(prevLookup => {
                                const newLookup = { ...prevLookup };
                                delete newLookup[item.moduleId];
                                return newLookup;
                              });
                            } else {
                              // Remove new module directly from modules array
                              setProduct((prev) => ({
                                ...prev,
                                modules: (prev.modules || []).filter((_, index) => index !== item.moduleIndex),
                              }));
                            }
                          }}
                          title='Applicatie verwijderen'
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <div style={{ marginTop: '1rem' }}>
          {/* Explanation text */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Paragraph>
              <strong>Applicaties toevoegen aan uw product</strong>
            </Paragraph>
            <Paragraph>
              U heeft twee opties om applicaties toe te voegen aan uw product:
            </Paragraph>
          </div>

          <div
            className='ac-register-review'
            style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}
          >
            {/* New application block */}
            <div
              className='ac-register-form-section'
              style={{ flex: '1', minWidth: '0', display: 'flex' }}
            >
              <div
                className='ac-register-review__section'
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div
                  className='ac-register-review__field'
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    flex: '1',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <Paragraph style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Nieuwe applicatie</strong>
                    </Paragraph>
                    <Paragraph
                      style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}
                    >
                      Maak een volledig nieuwe applicatie aan. U configureert alle
                      instellingen, licenties, standaarden en referentiecomponenten
                      zelf.
                    </Paragraph>
                  </div>

                  <AcButton
                    style='button'
                    icon={<VISUALS.PLUS />}
                    onClick={addModule}
                    disabled={loading}
                    className='ac-forms-full-width-button'
                  >
                    Nieuwe applicatie toevoegen
          </AcButton>
                </div>
              </div>
            </div>

            {/* Existing application block */}
            <div
              className='ac-register-form-section'
              style={{ flex: '1', minWidth: '0', display: 'flex' }}
            >
              <div
                className='ac-register-review__section'
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div
                  className='ac-register-review__field'
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    flex: '1',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <Paragraph style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Bestaande applicatie</strong>
                    </Paragraph>
                    <Paragraph
                      style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}
                    >
                      Koppel een reeds bestaande applicatie uit de catalogus. Alle
                      instellingen, licenties en compliance-informatie zijn al
                      vastgelegd.
                    </Paragraph>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start', // Changed from flex-end to flex-start
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <ConSchemaEnhancedField
                        schemaType='product'
                        schemaProperty='modules'
                        value={selectedExistingApplication}
                        onChange={setSelectedExistingApplication}
                        schemas={schemas}
                        formData={{}}
                        store={store}
                        width='full'
                        showLabel={false}
                        showDescription={false}
                        customProps={{
                          // placeholder will come from schema example
                          // Force single-select instead of multi-select
                          isMulti: false,
                          // Override the array behavior
                          type: 'select',
                        }}
                      />
                    </div>

                    <div>
                      <AcButton
                        style='button'
                        buttonType='primary'
                        disabled={!selectedExistingApplication || loading}
                        onClick={addExistingApplication}
                      >
                        Toevoegen
                      </AcButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatieStage.displayName = 'ConFormApplicatieStage';

export default ConFormApplicatieStage;
