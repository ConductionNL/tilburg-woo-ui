import React, { memo, useState } from 'react';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
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
    // product,
    dienstOptions,
    setProduct,
    dienstenFormState,
    setDienstenFormState,
    getAllModulesForStages,
  }) => {
    // State for controlling alert visibility - persists until page refresh
    const [showInfoAlert, setShowInfoAlert] = useState(() => {
      // Check if alert was previously closed in this session
      return !sessionStorage.getItem('diensten-info-alert-closed');
    });

    // Handle closing the alert and remember the choice
    const handleCloseAlert = () => {
      setShowInfoAlert(false);
      sessionStorage.setItem('diensten-info-alert-closed', 'true');
    };

    // Keep UI state in parent so it persists across steps
    const {
      rows,
      selectedApplication,
      selectedDienstByRow,
      dienstIdByRow, // Track dienst IDs by row
      moduleIndexByRow, // Track which module each row belongs to
    } = dienstenFormState;

    const generateLocalId = () =>
      `dienst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const setDienstValue = (rowId, updater) => {
      setDienstenFormState((prev) => ({ ...prev, ...updater(prev) }));
    };

    // Accept overrides so we can persist immediately with the newly selected value(s)
    const persistRowIntoProduct = (rowId, overrides = {}) => {
      const appId = overrides.appId ?? selectedApplication[rowId];
      const dienstVal = overrides.dienstVal ?? selectedDienstByRow[rowId];

      if (appId == null || dienstVal == null) return;

      let localId = dienstIdByRow?.[rowId];
      if (!localId) {
        localId = generateLocalId();
        setDienstenFormState((prev) => ({
          ...prev,
          dienstIdByRow: { ...(prev.dienstIdByRow || {}), [rowId]: localId },
        }));
      }

      const prevModuleIndex = moduleIndexByRow?.[rowId];

      // Resolve indices using getAllModulesForStages mapping
      const allModules = getAllModulesForStages ? getAllModulesForStages() : [];
      const resolveUsingAllModules = (identifier) => {
        if (identifier == null) return null;
        const asNumber = Number(identifier);
        if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) return asNumber;
        const found = allModules.find((m) => {
          if (!m) return false;
          if (m.id && String(m.id) === String(identifier)) return true;
          if (m.moduleIndex != null && String(m.moduleIndex) === String(identifier))
            return true;
          if (m.value != null && String(m.value) === String(identifier)) return true;
          return false;
        });
        return found ? found.moduleIndex : null;
      };

      const curIndexResolved = resolveUsingAllModules(appId);
      const prevIndexResolved = resolveUsingAllModules(prevModuleIndex);

      setProduct((prev) => {
        const modules = [...(prev.modules || [])];

        const curIndex = curIndexResolved;
        const prevIndex = prevIndexResolved;

        // If dienst moved from another module, remove it there first
        if (prevIndex != null && prevIndex !== curIndex) {
          const prevModule = modules[prevIndex];
          if (typeof prevModule === 'object') {
            const prevList = Array.isArray(prevModule.diensten)
              ? prevModule.diensten
              : [];
            modules[prevIndex] = {
              ...prevModule,
              diensten: prevList.filter((d) => d._localId !== localId),
            };
          }
        }

        // Only modify if it's an object (new module), not string (existing module)
        if (curIndex == null) {
          console.warn('Could not resolve target module for dienst:', appId);
          return prev;
        }

        let targetModule = modules[curIndex];

        // If target is a string id (existing module), convert to editable object using lookup
        if (typeof targetModule !== 'object') {
          const modId = String(targetModule || appId);
          const lookup =
            allModules.find(
              (m) => String(m.id) === String(modId) || m.moduleIndex === curIndex
            ) || {};
          const existingDiensten = Array.isArray(lookup.diensten)
            ? lookup.diensten
            : [];
          targetModule = { ...lookup, id: modId, diensten: existingDiensten };
          modules[curIndex] = targetModule;
        }

        // Create or update dienst object with proper structure
        const dienstOption = dienstOptions.find((opt) => opt.value === dienstVal);

        const existingDienst = Array.isArray(targetModule.diensten)
          ? targetModule.diensten.find((d) => d._localId === localId)
          : null;

        const dienstObject = {
          ...(existingDienst || {}),
          _localId: localId, // Add local ID for tracking
          type: dienstVal, // The service type (e.g., "Functioneel beheer")
          naam: dienstOption?.label || dienstVal,
          aanbieder: prev.aanbieder, // Add active organization as aanbieder
        };

        const prevDiensten = Array.isArray(targetModule.diensten)
          ? targetModule.diensten
          : [];

        // Find existing dienst by localId and update, or add new one
        const existingIndex = prevDiensten.findIndex((d) => d._localId === localId);
        let nextDiensten;

        if (existingIndex !== -1) {
          // Update existing dienst
          nextDiensten = [...prevDiensten];
          nextDiensten[existingIndex] = dienstObject;
        } else {
          // Add new dienst
          nextDiensten = [...prevDiensten, dienstObject];
        }

        modules[curIndex] = { ...targetModule, diensten: nextDiensten };

        return { ...prev, modules };
      });

      // Track which module this row belongs to (numeric resolved index)
      setDienstValue(rowId, (prev) => ({
        moduleIndexByRow: {
          ...(prev.moduleIndexByRow || {}),
          [rowId]: curIndexResolved,
        },
      }));
    };

    const removeRow = (rowId) => {
      const appId = selectedApplication[rowId];
      const localId = dienstIdByRow?.[rowId];

      if (appId != null && localId != null) {
        setProduct((prev) => {
          const modules = [...(prev.modules || [])];

          const resolved = resolveModuleIndex(appId);
          if (resolved != null) {
            const targetModule = modules[resolved];
            if (typeof targetModule === 'object') {
              const prevDiensten = Array.isArray(targetModule.diensten)
                ? targetModule.diensten
                : [];
              const nextDiensten = prevDiensten.filter(
                (d) => d._localId !== localId
              );
              modules[resolved] = { ...targetModule, diensten: nextDiensten };
            }
          }

          return { ...prev, modules };
        });
      }

      setDienstenFormState((prev) => ({
        ...prev,
        rows: prev.rows.filter((id) => id !== rowId),
        selectedApplication: Object.fromEntries(
          Object.entries(prev.selectedApplication || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
        selectedDienstByRow: Object.fromEntries(
          Object.entries(prev.selectedDienstByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
        dienstIdByRow: Object.fromEntries(
          Object.entries(prev.dienstIdByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
        moduleIndexByRow: Object.fromEntries(
          Object.entries(prev.moduleIndexByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
      }));
    };

    // Handle application selection change for a row: move or remove dienst as needed
    const handleApplicationChange = (rowId, selectedOption) => {
      // Preserve current dienst selection so we can move it between modules
      const currentDienst = selectedDienstByRow[rowId];

      // Update selected application in UI state
      setDienstenFormState((prev) => ({
        ...prev,
        selectedApplication: {
          ...prev.selectedApplication,
          [rowId]: selectedOption?.value,
        },
      }));

      // If user cleared the application, remove the dienst from its previous module
      if (!selectedOption) {
        // If there's a persisted localId, remove it from product.modules
        const localId = dienstIdByRow?.[rowId];
        if (localId != null) {
          // remove by resolving previous index
          setProduct((prev) => {
            const modules = [...(prev.modules || [])];
            // try numeric prev index first
            const prevIdx = moduleIndexByRow?.[rowId];
            const resolve = (identifier) => {
              if (identifier == null) return null;
              const asNumber = Number(identifier);
              if (!Number.isNaN(asNumber) && Number.isInteger(asNumber))
                return asNumber;
              const allModules = getAllModulesForStages
                ? getAllModulesForStages()
                : [];
              const found = allModules.find((m) => {
                if (!m) return false;
                if (m.id && String(m.id) === String(identifier)) return true;
                if (
                  m.moduleIndex != null &&
                  String(m.moduleIndex) === String(identifier)
                )
                  return true;
                return false;
              });
              return found ? found.moduleIndex : null;
            };
            const resolvedPrev = resolve(prevIdx);
            if (resolvedPrev != null) {
              const mod = modules[resolvedPrev];
              if (typeof mod === 'object') {
                const list = Array.isArray(mod.diensten) ? mod.diensten : [];
                modules[resolvedPrev] = {
                  ...mod,
                  diensten: list.filter((d) => d._localId !== localId),
                };
              }
            }
            return { ...prev, modules };
          });
        }
        return;
      }

      // If there is a selected dienst, persist (move) it to the newly selected module
      if (currentDienst != null) {
        persistRowIntoProduct(rowId, {
          appId: selectedOption?.value,
          dienstVal: currentDienst,
        });
      }
    };

    // Resolve a module identifier (index or id) to a numeric index in product.modules
    const resolveModuleIndex = (identifier) => {
      if (identifier == null) return null;
      const asNumber = Number(identifier);
      if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) return asNumber;
      const allModules = getAllModulesForStages ? getAllModulesForStages() : [];
      const found = allModules.find((m) => {
        if (!m) return false;
        if (m.id && String(m.id) === String(identifier)) return true;
        if (m.moduleIndex != null && String(m.moduleIndex) === String(identifier))
          return true;
        if (m.value != null && String(m.value) === String(identifier)) return true;
        return false;
      });
      return found ? found.moduleIndex : null;
    };

    // ✅ SIMPLIFIED: Use helper method to get all modules (new + existing) for diensten
    const allModules = getAllModulesForStages ? getAllModulesForStages() : [];
    const appOptions = allModules.map((module, index) => ({
      value: module.isExisting ? module.id : module.moduleIndex,
      label: module.naam || `Applicatie ${index + 1}`,
      isExisting: !!module.isExisting,
    }));

    return (
      <div>
        <h2 id='diensten-section-title' className='sr-only'>
          Diensten
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Digitale dienstverlening en functionaliteit</strong>
          <br />
          Geef aan welke diensten uw software ondersteunt. Diensten beschrijven de
          concrete functionaliteit die uw applicatie biedt aan burgers, bedrijven of
          gemeenten. Door dit vast te leggen, zien organisaties hoe uw software
          aansluit bij hun dienstverlening
        </Paragraph>

        {/* Closeable info alert about updating dienst details later */}
        {showInfoAlert && (
          <Alert severity='info' className='ac-forms-product-info-alert'>
            <button
              type='button'
              onClick={handleCloseAlert}
              className='ac-forms-product-info-alert__close-button'
              title='Sluiten'
              aria-label='Alert sluiten'
            >
              <VISUALS.CLOSE />
            </button>
            <div className='ac-forms-product-info-alert__content'>
              <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
              <div>
                <strong>Dienst details aanpassen</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  U selecteert hier alleen het type dienst. Na het opslaan van uw
                  product kunt u op de detailpagina van elke dienst aanvullende
                  informatie toevoegen zoals een naam, beschrijvingen,
                  contactgegevens en specifieke voorwaarden.
                </span>
              </div>
            </div>
          </Alert>
        )}

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
                      isClearable
                      value={
                        selectedApplication[rowId] != null
                          ? appOptions.find(
                              (o) => o.value === selectedApplication[rowId]
                            )
                          : null
                      }
                      onChange={(selectedOption) =>
                        handleApplicationChange(rowId, selectedOption)
                      }
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
                      onChange={(selectedOption) => {
                        const appId = selectedApplication[rowId];
                        if (appId == null) return;

                        if (!selectedOption) {
                          setDienstenFormState((prev) => ({
                            ...prev,
                            selectedDienstByRow: {
                              ...(prev.selectedDienstByRow || {}),
                              [rowId]: undefined,
                            },
                          }));
                          return;
                        }

                        setDienstenFormState((prev) => ({
                          ...prev,
                          selectedDienstByRow: {
                            ...prev.selectedDienstByRow,
                            [rowId]: String(selectedOption.value),
                          },
                        }));

                        // Persist immediately
                        persistRowIntoProduct(rowId, {
                          dienstVal: selectedOption.value,
                        });
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
                        onClick={() => removeRow(rowId)}
                        title='Rij verwijderen'
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

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
            Nieuwe dienst toevoegen
          </AcButton>
        </div>
      </div>
    );
  }
);

ConFormDienstenStage.displayName = 'ConFormDienstenStage';

export default ConFormDienstenStage;
