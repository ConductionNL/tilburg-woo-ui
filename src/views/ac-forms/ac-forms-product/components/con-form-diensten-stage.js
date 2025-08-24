import React, { memo } from 'react';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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
    const { rows, selectedApplication, selectedDienstByRow } = dienstenFormState;

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

    const addDienst = (moduleIndex, dienstVal, dienstOptions) => {
      setProduct((prev) => {
        const modules = [...(prev.modules || [])];
        const targetModule = modules[moduleIndex];
        
        // Only modify if it's an object (new module), not string (existing module)
        if (typeof targetModule !== 'object') {
          console.warn('Cannot modify existing module diensten:', moduleIndex, targetModule);
          // TODO: Voor externe modules moeten diensten via aparte API calls worden aangemaakt
          return prev;
        }

        // Create dienst object instead of string
        const dienstOption = dienstOptions.find(opt => opt.value === dienstVal);
        const dienstObject = {
          id: dienstVal,
          naam: dienstOption?.label || dienstVal,
        };
        
        // Check if dienst already exists (by id)
        const prevDiensten = Array.isArray(targetModule.diensten) ? targetModule.diensten : [];
        const exists = prevDiensten.some(d => 
          typeof d === 'object' ? d.id === dienstVal : d === dienstVal
        );
        
        if (exists) {
          return prev; // Don't add duplicate
        }
        
        const nextDiensten = [...prevDiensten, dienstObject];
        
        console.log('🔧 Adding dienst object:', { dienstObject, nextDiensten });
        
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
        
        // Filter out the dienst by id/value
        const prevDiensten = Array.isArray(targetModule.diensten) ? targetModule.diensten : [];
        const nextDiensten = prevDiensten.filter((d) => 
          typeof d === 'object' ? d.id !== dienstVal : d !== dienstVal
        );
        
        console.log('🔧 Removing dienst:', { dienstVal, prevDiensten, nextDiensten });
        
        modules[moduleIndex] = { ...targetModule, diensten: nextDiensten };
        return { ...prev, modules };
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
                            typeof d === 'object' ? d.id === optVal : d === optVal
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
                          }));
                          return;
                        }

                        addDienst(appId, selectedOption.value, dienstOptions);
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
