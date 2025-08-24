import React, { memo } from 'react';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Diensten Stage Component
 * 
 * This stage manages services that can be provided for applications in the product.
 * 
 * @param {Object} product - The product object containing form data
 * @param {Array} dienstOptions - Available service options
 * @param {Function} setProduct - Function to update the entire product object
 * @param {Object} dienstenFormState - UI state for the diensten form
 * @param {Function} setDienstenFormState - Function to update diensten form state
 */
const ConFormDienstenStage = memo(
  ({
    product,
    dienstOptions,
    setProduct,
    dienstenFormState,
    setDienstenFormState,
    getAllModulesForStages,
  }) => {
    // Keep UI state in parent so it persists across steps
    const { rows, selectedApplication, selectedDienstByRow, dienstBeschrijvingByRow } = dienstenFormState;

    const normalizeDiensten = (arr) => {
      if (!Array.isArray(arr)) return [];
      const strs = arr
        .map((item) => {
          if (item == null) return null;
          if (typeof item === 'object') {
            if ('value' in item) return String(item.value);
            return null;
          }
          return String(item);
        })
        .filter((v) => typeof v === 'string' && v.length > 0);
      return Array.from(new Set(strs));
    };

    const addDienst = (moduleIndex, dienstVal, dienstOptions, customDescription = '') => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const targetModule = modules[moduleIndex];
        
        // Only modify if it's an object (new module), not string (existing module)
        if (typeof targetModule !== 'object') {
          console.warn('Cannot modify existing module diensten:', moduleIndex, targetModule);
          // TODO: Voor externe modules moeten diensten via aparte API calls worden aangemaakt
          return prev;
        }

        // Create dienst object with proper structure - let backend generate ID
        const dienstOption = dienstOptions.find(opt => opt.value === dienstVal);
        const dienstObject = {
          type: dienstVal, // The service type (e.g., "Functioneel beheer")
          naam: customDescription || dienstOption?.label || dienstVal,
          aanbieder: prev.aanbieder, // Add active organization as aanbieder
        };
        
        // Check if dienst already exists (by type)
        const prevDiensten = Array.isArray(targetModule.diensten) ? targetModule.diensten : [];
        const exists = prevDiensten.some(d => 
          typeof d === 'object' ? d.type === dienstVal : d === dienstVal
        );
        
        if (exists) {
          return prev; // Don't add duplicate
        }
        
        const nextDiensten = [...prevDiensten, dienstObject];
        
        console.log('🔧 Adding dienst object (backend will generate ID):', { 
          dienstObject, 
          aanbieder: prev.aanbieder,
          nextDiensten 
        });
        
        modules[moduleIndex] = { ...targetModule, diensten: nextDiensten };
        return { ...prev, modules };
      });
    };

    const removeDienst = (moduleIndex, dienstVal) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const targetModule = modules[moduleIndex];
        
        // Only modify if it's an object (new module), not string (existing module)
        if (typeof targetModule !== 'object') {
          console.warn('Cannot modify existing module diensten:', moduleIndex, targetModule);
          // TODO: Voor externe modules moeten diensten via aparte API calls worden verwijderd
          return prev;
        }
        
        // Filter out the dienst by type/value
        const prevDiensten = Array.isArray(targetModule.diensten) ? targetModule.diensten : [];
        const nextDiensten = prevDiensten.filter((d) => 
          typeof d === 'object' ? d.type !== dienstVal : d !== dienstVal
        );
        
        console.log('🔧 Removing dienst:', { dienstVal, prevDiensten, nextDiensten });
        
        modules[moduleIndex] = { ...targetModule, diensten: nextDiensten };
        return { ...prev, modules };
      });
    };

    // Function to update dienst description
    const updateDienstDescription = (moduleIndex, dienstVal, newDescription) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const targetModule = modules[moduleIndex];
        
        // Only modify if it's an object (new module)
        if (typeof targetModule !== 'object') {
          return prev;
        }
        
        const diensten = Array.isArray(targetModule.diensten) ? [...targetModule.diensten] : [];
        const dienstIndex = diensten.findIndex(d => 
          typeof d === 'object' ? d.type === dienstVal : d === dienstVal
        );
        
        if (dienstIndex !== -1 && typeof diensten[dienstIndex] === 'object') {
          diensten[dienstIndex] = {
            ...diensten[dienstIndex],
            naam: newDescription || diensten[dienstIndex].naam
          };
          
          modules[moduleIndex] = { ...targetModule, diensten };
          return { ...prev, modules };
        }
        
        return prev;
      });
    };

    // ✅ SIMPLIFIED: Use helper method to get all modules (new + existing) for diensten
    const allModules = getAllModulesForStages ? getAllModulesForStages() : [];
    const appOptions = allModules.map((module, index) => ({
      value: module.isExisting ? module.id : module.moduleIndex,
      label: module.naam || `Module ${index + 1}`,
      isExisting: !!module.isExisting,
    }));
    
    return (
      <div>
        <h2 id='diensten-section-title' className='sr-only'>
          Diensten
        </h2>

        <Paragraph style={{ marginBottom: '2rem' }}>
          <strong>Digitale dienstverlening en functionaliteit</strong><br/>
          Hier beschrijft u welke diensten uw software ondersteunt. Deze informatie helpt organisaties om te begrijpen welke 
          concrete functionaliteit uw software biedt aan burgers en bedrijven. Door duidelijk te maken welke diensten worden 
          ondersteund, kunnen organisaties beoordelen of uw software aansluit bij hun dienstverleningsportfolio. 
          Dit is vooral belangrijk voor gemeenten die hun digitale dienstverlening willen uitbreiden of moderniseren.
        </Paragraph>

        <TableContainer className='con-form-wizard-table-container'>
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Applicatie</b>
                </TableCell>
                <TableCell>
                  <b>Dienst Type</b>
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
              {rows.map((rowId) => (
                <TableRow key={rowId}>
                  <TableCell>
                    <ReactSelect
                      options={appOptions}
                      value={
                        selectedApplication[rowId] != null
                          ? appOptions.find(
                              (o) => o.value === selectedApplication[rowId]
                            )
                          : null
                      }
                      onChange={(selectedOption) => {
                        const prevAppId = selectedApplication[rowId];
                        const prevDienst = selectedDienstByRow[rowId];

                        if (prevAppId != null && prevDienst != null) {
                          removeDienst(prevAppId, prevDienst);
                        }

                        setDienstenFormState((prev) => ({
                          ...prev,
                          selectedApplication: {
                            ...prev.selectedApplication,
                            [rowId]: selectedOption?.value,
                          },
                          selectedDienstByRow: Object.fromEntries(
                            Object.entries(prev.selectedDienstByRow).filter(
                              ([k]) => Number(k) !== rowId
                            )
                          ),
                          dienstBeschrijvingByRow: Object.fromEntries(
                            Object.entries(prev.dienstBeschrijvingByRow).filter(
                              ([k]) => Number(k) !== rowId
                            )
                          ),
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={dienstOptions}
                      isClearable
                      value={
                        selectedDienstByRow[rowId] != null
                          ? dienstOptions.find(
                              (o) =>
                                String(o.value) ===
                                String(selectedDienstByRow[rowId])
                            )
                          : null
                      }
                      isDisabled={selectedApplication[rowId] == null}
                      isOptionDisabled={(opt) => {
                        const appId = selectedApplication[rowId];
                        if (appId == null) return true;
                        
                        // Check if this dienst is already selected for this module
                        const targetModule = (product.modules || [])[appId];
                        if (typeof targetModule === 'object' && Array.isArray(targetModule.diensten)) {
                          const optVal = String(opt.value);
                          return targetModule.diensten.some(d => 
                            typeof d === 'object' ? d.type === optVal : d === optVal
                          );
                        }
                        return false;
                      }}
                      onChange={(selectedOption) => {
                        const appId = selectedApplication[rowId];
                        if (appId == null) return;

                        if (!selectedOption) {
                          const prevDienst = selectedDienstByRow[rowId];
                          if (prevDienst != null) {
                            removeDienst(appId, prevDienst);
                          }
                          setDienstenFormState((prev) => ({
                            ...prev,
                            selectedDienstByRow: Object.fromEntries(
                              Object.entries(prev.selectedDienstByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            dienstBeschrijvingByRow: Object.fromEntries(
                              Object.entries(prev.dienstBeschrijvingByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                          }));
                          return;
                        }

                        const customDesc = dienstBeschrijvingByRow[rowId] || '';
                        addDienst(appId, selectedOption.value, dienstOptions, customDesc);
                        setDienstenFormState((prev) => ({
                          ...prev,
                          selectedDienstByRow: {
                            ...prev.selectedDienstByRow,
                            [rowId]: String(selectedOption.value),
                          },
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Textbox
                      value={dienstBeschrijvingByRow[rowId] || ''}
                      onChange={(e) => {
                        const newDescription = e.target.value;
                        setDienstenFormState((prev) => ({
                          ...prev,
                          dienstBeschrijvingByRow: {
                            ...prev.dienstBeschrijvingByRow,
                            [rowId]: newDescription,
                          },
                        }));
                        
                        // Also update the product immediately if both app and dienst are selected
                        const appId = selectedApplication[rowId];
                        const dienstVal = selectedDienstByRow[rowId];
                        if (appId != null && dienstVal != null) {
                          updateDienstDescription(appId, dienstVal, newDescription);
                        }
                      }}
                      placeholder="Beschrijving van de dienst"
                      disabled={selectedApplication[rowId] == null || selectedDienstByRow[rowId] == null}
                    />
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.TRASHCAN />}
                        disabled={rows.length === 1}
                        onClick={() => {
                          const appId = selectedApplication[rowId];
                          const dienstVal = selectedDienstByRow[rowId];

                          if (appId != null && dienstVal != null) {
                            removeDienst(appId, dienstVal);
                          }

                          setDienstenFormState((prev) => ({
                            ...prev,
                            rows: prev.rows.filter((id) => id !== rowId),
                            selectedApplication: Object.fromEntries(
                              Object.entries(prev.selectedApplication).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            selectedDienstByRow: Object.fromEntries(
                              Object.entries(prev.selectedDienstByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                            dienstBeschrijvingByRow: Object.fromEntries(
                              Object.entries(prev.dienstBeschrijvingByRow).filter(
                                ([k]) => Number(k) !== rowId
                              )
                            ),
                          }));
                        }}
                        title='Rij verwijderen'
                      ></AcButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              <div style={{ marginTop: '1rem' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.PLUS />}
                  onClick={() =>
                    setDienstenFormState((prev) => ({
                      ...prev,
                      rows: [...prev.rows, prev.nextRowId],
                      nextRowId: prev.nextRowId + 1,
                    }))
                  }
                >
                  Rij toevoegen
                </AcButton>
              </div>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
);

ConFormDienstenStage.displayName = 'ConFormDienstenStage';

export default ConFormDienstenStage;
