import React, { memo, useState, useEffect } from 'react';
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
 * Koppelingen Stage Component
 *
 * This stage manages connections/integrations between applications in the product.
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProduct - Function to update the entire product object
 * @param {Array} modulesOptions - Available modules for connections
 * @param {Object} koppelingenFormState - UI state for the koppelingen form
 * @param {Function} setKoppelingenFormState - Function to update koppelingen form state
 */
const ConFormKoppelingenStage = memo(
  ({
    setProduct,
    modulesOptions,
    modulesLoading,
    koppelingenFormState,
    setKoppelingenFormState,
    getAllModulesForStages,
    searchModules,
  }) => {
    // State for controlling alert visibility - persists until page refresh
    const [showInfoAlert, setShowInfoAlert] = useState(() => {
      // Check if alert was previously closed in this session
      return !sessionStorage.getItem('koppelingen-info-alert-closed');
    });

    // Handle closing the alert and remember the choice
    const handleCloseAlert = () => {
      setShowInfoAlert(false);
      sessionStorage.setItem('koppelingen-info-alert-closed', 'true');
    };

    const {
      rows,
      selectedAppAByRow,
      selectedAppBByRow,
      directionByRow,
      typeByRow,
      koppelingIdByRow = {},
      moduleIndexByRow = {},
    } = koppelingenFormState;

    // ✅ SIMPLIFIED: Use helper method to get all modules (new + existing) for koppelingen
    const allModules = getAllModulesForStages ? getAllModulesForStages() : [];
    const appOptions = allModules.map((module, index) => ({
      value: module.isExisting ? module.id : module.moduleIndex,
      label:
        module.naam ||
        module?.['@self']?.name ||
        module?.fullData?.['@self']?.name ||
        (module.id ? String(module.id) : `Module ${index + 1}`),
      isExisting: !!module.isExisting,
    }));

    React.useEffect(() => {
      getAllModulesForStages();
    }, []);

    const directionOptions = [
      { value: 'AnaarB', label: 'A → B' },
      { value: 'BnaarA', label: 'B → A' },
      { value: 'bi-directioneel', label: '↔ Bi-directioneel' },
    ];

    const typeOptions = [
      { value: 'n.v.t', label: 'N.v.t' },
      { value: 'bestandsoverdracht', label: 'Bestandsoverdracht' },
      { value: 'digikoppeling', label: 'Digikoppeling' },
      { value: 'message que', label: 'Message queue' },
      { value: 'upload naar portaal', label: 'Upload naar portaal' },
      { value: 'webservices', label: 'Webservices' },
      { value: 'api', label: 'API' },
    ];

    const setKoppelingValue = (rowId, updater) => {
      setKoppelingenFormState((prev) => ({ ...prev, ...updater(prev) }));
    };

    const generateLocalId = () =>
      `kpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // Accept overrides so we can persist immediately with the newly selected value(s)
    const persistRowIntoProduct = (rowId, overrides = {}) => {
      const appAId = overrides.appAId ?? selectedAppAByRow[rowId];
      const appBId = overrides.appBId ?? selectedAppBByRow[rowId];
      const richting = overrides.richting ?? directionByRow[rowId];
      const soort = overrides.soort ?? typeByRow[rowId];
      if (appAId == null || appBId == null) return;

      let localId = koppelingIdByRow[rowId];
      if (!localId) {
        localId = generateLocalId();
        setKoppelingenFormState((prev) => ({
          ...prev,
          koppelingIdByRow: { ...(prev.koppelingIdByRow || {}), [rowId]: localId },
        }));
      }

      const prevModuleIndex = moduleIndexByRow[rowId];

      setProduct((prev) => {
        const modules = [...(prev.modules || [])];

        // If koppeling moved from another module, remove it there first
        if (prevModuleIndex != null && prevModuleIndex !== appAId) {
          const prevModule = modules[prevModuleIndex];
          if (typeof prevModule === 'object') {
            const prevList = Array.isArray(prevModule.koppelingen)
              ? prevModule.koppelingen
              : [];
            modules[prevModuleIndex] = {
              ...prevModule,
              koppelingen: prevList.filter((k) => k._localId !== localId),
            };
          }
        }

        const sourceModule = modules[appAId];

        // Only modify if it's an object (new module), not string (existing module)
        if (typeof sourceModule !== 'object') {
          console.warn(
            'Cannot modify existing module koppelingen:',
            appAId,
            sourceModule
          );
          return prev;
        }

        const list = Array.isArray(sourceModule.koppelingen)
          ? [...sourceModule.koppelingen]
          : [];
        const idx = list.findIndex((k) => k?._localId === localId);

        const moduleALabel = appOptions.find((o) => o.value === appAId)?.label;
        // Persist moduleB as its identifier so edit-mode can preselect by id
        const moduleBId = appBId;

        const fields = {
          moduleA: moduleALabel,
          moduleB: moduleBId,
          richtingDataUitwisseling: richting,
          soortKoppeling: soort,
        };

        if (idx >= 0) {
          list[idx] = { ...list[idx], ...fields };
        } else {
          list.push({ _localId: localId, ...fields });
        }

        modules[appAId] = { ...sourceModule, koppelingen: list };
        return { ...prev, modules };
      });

      // Track last persisted module index for this row
      setKoppelingenFormState((prev) => ({
        ...prev,
        moduleIndexByRow: { ...(prev.moduleIndexByRow || {}), [rowId]: appAId },
      }));
    };

    const removeRow = (rowId) => {
      const localId = koppelingIdByRow[rowId];
      const curModuleIdx = selectedAppAByRow[rowId];
      const prevModuleIdx = moduleIndexByRow[rowId];

      if (localId != null) {
        setProduct((prev) => {
          const modules = [...(prev.modules || [])];

          const removeFrom = (idx) => {
            if (idx == null) return;
            const mod = modules[idx];
            if (typeof mod === 'object') {
              const list = Array.isArray(mod.koppelingen) ? mod.koppelingen : [];
              modules[idx] = {
                ...mod,
                koppelingen: list.filter((k) => k?._localId !== localId),
              };
            }
          };

          removeFrom(prevModuleIdx);
          if (curModuleIdx !== prevModuleIdx) removeFrom(curModuleIdx);

          return { ...prev, modules };
        });
      }

      setKoppelingenFormState((prev) => ({
        ...prev,
        rows: prev.rows.filter((id) => id !== rowId),
        selectedAppAByRow: Object.fromEntries(
          Object.entries(prev.selectedAppAByRow).filter(([k]) => Number(k) !== rowId)
        ),
        selectedAppBByRow: Object.fromEntries(
          Object.entries(prev.selectedAppBByRow).filter(([k]) => Number(k) !== rowId)
        ),
        directionByRow: Object.fromEntries(
          Object.entries(prev.directionByRow).filter(([k]) => Number(k) !== rowId)
        ),
        typeByRow: Object.fromEntries(
          Object.entries(prev.typeByRow).filter(([k]) => Number(k) !== rowId)
        ),
        koppelingIdByRow: Object.fromEntries(
          Object.entries(prev.koppelingIdByRow || {}).filter(
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

    useEffect(() => {
      // Initialize koppelingen data when form state is prefilled in edit mode
      // This ensures that prefilled koppelingen are actually persisted to the product
      if (rows.length > 0) {
        let initializedCount = 0;

        rows.forEach((rowId) => {
          const appAId = selectedAppAByRow[rowId];
          const appBId = selectedAppBByRow[rowId];
          const richting = directionByRow[rowId];
          const soort = typeByRow[rowId];

          // Only persist if we have the minimum required data (appA and appB)
          if (appAId != null && appBId != null) {
            persistRowIntoProduct(rowId, {
              appAId,
              appBId,
              richting,
              soort,
            });
            initializedCount++;
          }
        });

        // Single consolidated log message instead of one per row
        if (initializedCount > 0) {
          console.log(`🔄 Initialized ${initializedCount} koppeling(en)`);
        }
      }
    }, [
      // Only run when the actual koppeling data changes, not on every state update
      JSON.stringify(
        rows.map((rowId) => ({
          appA: selectedAppAByRow[rowId],
          appB: selectedAppBByRow[rowId],
          richting: directionByRow[rowId],
          soort: typeByRow[rowId],
        }))
      ),
    ]);

    return (
      <div>
        <h2 id='koppelingen-section-title' className='sr-only'>
          Koppelingen
        </h2>

        <Paragraph style={{ marginBottom: '2rem' }}>
          <strong>Integraties en gegevensuitwisseling</strong>
          <br />
          Geef hier aan hoe uw applicatie gegevens uitwisselt met andere systemen.
          Dit helpt organisaties om te zien hoe uw software integreert in hun
          applicatielandschap. Vul voor elke koppeling in: de betrokken applicaties,
          de richting van de uitwisseling en het type koppeling (bijv. API, bestand,
          bericht).
        </Paragraph>

        {/* Closeable info alert about updating koppeling details later */}
        {showInfoAlert && (
          <Alert severity='info' className='ac-forms-product-info-alert'>
            <button
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
                <strong>Koppeling details aanpassen</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  U definieert hier de basis koppelingen tussen applicaties. Na het
                  opslaan van uw product kunt u op de detailpagina van elke koppeling
                  aanvullende technische details toevoegen zoals een naam,
                  beschrijvingen en status.
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
                  <b>Applicatie A</b>
                </TableCell>
                <TableCell>
                  <b>Applicatie B</b>
                </TableCell>
                <TableCell>
                  <b>Richting data-uitwisseling</b>
                </TableCell>
                <TableCell>
                  <b>Soort koppeling</b>
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
                        selectedAppAByRow[rowId] != null
                          ? appOptions.find(
                              (o) => o.value === selectedAppAByRow[rowId]
                            )
                          : null
                      }
                      onChange={(opt) => {
                        // Persist immediately with the fresh value
                        persistRowIntoProduct(rowId, { appAId: opt?.value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          selectedAppAByRow: {
                            ...prev.selectedAppAByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={modulesOptions}
                      value={(() => {
                        const selected = selectedAppBByRow[rowId];
                        if (selected == null) return null;
                        const opts = modulesOptions || [];
                        let found = opts.find(
                          (o) => String(o.value) === String(selected)
                        );
                        if (!found) {
                          found = opts.find(
                            (o) => String(o.label) === String(selected)
                          );
                        }
                        return found || null;
                      })()}
                      onInputChange={(inputValue, meta) => {
                        if (meta && meta.action === 'input-change') {
                          searchModules(inputValue || '');
                        }
                        return inputValue;
                      }}
                      isLoading={modulesLoading}
                      onChange={(opt) => {
                        // Persist immediately with the fresh value
                        persistRowIntoProduct(rowId, { appBId: opt?.value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          selectedAppBByRow: {
                            ...prev.selectedAppBByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={directionOptions}
                      value={
                        directionByRow[rowId]
                          ? directionOptions.find(
                              (o) => o.value === directionByRow[rowId]
                            )
                          : null
                      }
                      onChange={(opt) => {
                        // Persist immediately with the fresh value
                        persistRowIntoProduct(rowId, { richting: opt?.value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          directionByRow: {
                            ...prev.directionByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={typeOptions}
                      value={
                        typeByRow[rowId]
                          ? typeOptions.find((o) => o.value === typeByRow[rowId])
                          : null
                      }
                      onChange={(opt) => {
                        // Persist immediately with the fresh value
                        persistRowIntoProduct(rowId, { soort: opt?.value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          typeByRow: { ...prev.typeByRow, [rowId]: opt?.value },
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
                          removeRow(rowId);
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
                    setKoppelingenFormState((prev) => ({
                      ...prev,
                      rows: [...prev.rows, prev.nextRowId],
                      nextRowId: prev.nextRowId + 1,
                    }))
                  }
                >
                  Nieuwe koppeling toevoegen
                </AcButton>
              </div>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
);

ConFormKoppelingenStage.displayName = 'ConFormKoppelingenStage';

export default ConFormKoppelingenStage;
