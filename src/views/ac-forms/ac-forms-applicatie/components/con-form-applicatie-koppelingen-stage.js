import React, { memo, useState, useEffect } from 'react';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@src/atoms';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';

/**
 * Koppelingen Stage Component for Applicatie Form
 *
 * This stage manages connections/integrations between the current applicatie and other applicaties.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {Array} modulesOptions - Available modules/applicaties for connections
 * @param {boolean} modulesLoading - Loading state for modules options
 * @param {Array} buitengemeentelijkeOptions - Available external facilities for connections
 * @param {boolean} buitengemeentelijkeOptionsLoading - Loading state for external facilities
 * @param {Object} koppelingenFormState - UI state for the koppelingen form
 * @param {Function} setKoppelingenFormState - Function to update koppelingen form state
 * @param {Function} searchModules - Function to search for modules/applicaties
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormApplicatieKoppelingenStage = memo(
  ({
    applicatie,
    setApplicatieData,
    modulesOptions,
    modulesLoading,
    buitengemeentelijkeOptions,
    buitengemeentelijkeOptionsLoading,
    koppelingenFormState,
    setKoppelingenFormState,
    searchModules,
    schemas,
  }) => {
    // State for controlling alert visibility - persists until page refresh
    const [showInfoAlert, setShowInfoAlert] = useState(() => {
      // Check if alert was previously closed in this session
      return !sessionStorage.getItem('applicatie-koppelingen-info-alert-closed');
    });

    // Handle closing the alert and remember the choice
    const handleCloseAlert = () => {
      setShowInfoAlert(false);
      sessionStorage.setItem('applicatie-koppelingen-info-alert-closed', 'true');
    };

    const {
      rows,
      selectedAppBByRow,
      directionByRow,
      koppelingIdByRow = {},
      naamByRow = {},
      touchedNaamByRow = {}, // Track which naam fields have been touched
    } = koppelingenFormState;

    const setKoppelingValue = (rowId, updater) => {
      setKoppelingenFormState((prev) => ({ ...prev, ...updater(prev) }));
    };

    const generateLocalId = () =>
      `kpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // Helper function to merge modules and buitengemeentelijke options
    const getMergedOptions = () => {
      const merged = [...modulesOptions];
      (buitengemeentelijkeOptions || []).forEach((buitenOpt) => {
        const exists = merged.some(
          (o) => String(o.value) === String(buitenOpt.value)
        );
        if (!exists) {
          merged.push(buitenOpt);
        }
      });
      return merged;
    };

    // Helper function to create colored dot style
    const dot = (color = 'transparent') => ({
      alignItems: 'center',
      display: 'flex',
      ':before': {
        backgroundColor: color,
        borderRadius: 10,
        content: '" "',
        display: 'block',
        marginRight: 8,
        height: 10,
        width: 10,
        flex: 'none',
      },
    });

    // Custom styles for ReactSelect with colored dots
    const getSelectStyles = () => ({
      option: (styles, { data }) => {
        const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
        return {
          ...styles,
          ...dot(color),
        };
      },
      singleValue: (styles, { data }) => {
        const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
        return {
          ...styles,
          ...dot(color),
        };
      },
      multiValue: (styles, { data }) => {
        const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
        return {
          ...styles,
          ...dot(color),
        };
      },
      placeholder: (styles) => ({
        ...styles,
        ...dot('#ccc'),
      }),
    });

    // Helper function to get koppeling data from applicatie.koppelingen array
    const getKoppelingData = (rowId) => {
      const localId = koppelingIdByRow[rowId];
      if (!localId) return null;
      const koppelingen = Array.isArray(applicatie?.koppelingen)
        ? applicatie.koppelingen
        : [];
      // First try to find by _localId
      let found = koppelingen.find((k) => k?._localId === localId);
      // If not found and localId starts with "existing_", try to find by id
      if (!found && localId.startsWith('existing_')) {
        const id = localId.replace('existing_', '');
        found = koppelingen.find(
          (k) => String(k?.id || '') === id || String(k?._localId || '') === localId
        );
      }
      return found || null;
    };

    // Persist row data into applicatie object
    const persistRowIntoApplicatie = (rowId, overrides = {}) => {
      // Check if appBId was explicitly provided (even if null/undefined) vs not provided
      const appBIdProvided = 'appBId' in overrides;
      const appBId = appBIdProvided ? overrides.appBId : selectedAppBByRow[rowId];
      const richting =
        'richting' in overrides ? overrides.richting : directionByRow[rowId];
      const koppelingData = getKoppelingData(rowId);
      // Get naam from overrides, then from persisted koppeling data, then from UI state
      const naam =
        'naam' in overrides
          ? overrides.naam
          : koppelingData?.naam ?? naamByRow[rowId];

      let localId = koppelingIdByRow[rowId];

      // If appBId is null/undefined and was explicitly provided, remove the koppeling if it exists
      if (appBIdProvided && appBId == null) {
        if (localId != null) {
          setApplicatieData('koppelingen', (prevKoppelingen) => {
            const list = Array.isArray(prevKoppelingen) ? prevKoppelingen : [];
            return list.filter((k) => k?._localId !== localId);
          });
        }
        return;
      }

      // Don't persist if appBId is still null/undefined (not provided and not in state)
      if (appBId == null) {
        return;
      }

      // Create localId if it doesn't exist
      if (!localId) {
        localId = generateLocalId();
        setKoppelingenFormState((prev) => ({
          ...prev,
          koppelingIdByRow: { ...(prev.koppelingIdByRow || {}), [rowId]: localId },
        }));
      }

      // Create or update the koppeling
      setApplicatieData('koppelingen', (prevKoppelingen) => {
        const list = Array.isArray(prevKoppelingen) ? [...prevKoppelingen] : [];

        // Find existing koppeling to preserve all its properties
        const existingKoppeling = list.find((k) => k?._localId === localId);

        const fields = {
          // Preserve existing properties, then override with new values
          ...(existingKoppeling || {}),
          _localId: localId, // Ensure local ID is preserved
          moduleA: applicatie.naam || 'Deze applicatie', // Current applicatie name
          moduleB: appBId, // Store as ID for edit mode preselection
          gegevensuitwisselingRichting: richting,
          // Only set these fields if they're explicitly provided or already exist
          ...(naam !== undefined ? { naam } : {}),
        };

        const idx = list.findIndex((k) => k?._localId === localId);
        if (idx >= 0) list[idx] = fields;
        else list.push(fields);

        return list;
      });
    };

    // Clear all fields in a row except Applicatie A
    const clearRow = (rowId) => {
      // Remove the koppeling from applicatie data if it exists
      persistRowIntoApplicatie(rowId, {
        appBId: null,
        richting: null,
      });

      // Clear UI state for this row
      setKoppelingenFormState((prev) => ({
        ...prev,
        selectedAppBByRow: Object.fromEntries(
          Object.entries(prev.selectedAppBByRow).filter(([k]) => Number(k) !== rowId)
        ),
        directionByRow: Object.fromEntries(
          Object.entries(prev.directionByRow).filter(([k]) => Number(k) !== rowId)
        ),
        naamByRow: Object.fromEntries(
          Object.entries(prev.naamByRow || {}).filter(([k]) => Number(k) !== rowId)
        ),
        touchedNaamByRow: Object.fromEntries(
          Object.entries(prev.touchedNaamByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
      }));
    };

    const removeRow = (rowId) => {
      const localId = koppelingIdByRow[rowId];

      if (localId != null) {
        setApplicatieData('koppelingen', (prevKoppelingen) => {
          const list = Array.isArray(prevKoppelingen) ? prevKoppelingen : [];
          return list.filter((k) => k?._localId !== localId);
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
        koppelingIdByRow: Object.fromEntries(
          Object.entries(prev.koppelingIdByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
        naamByRow: Object.fromEntries(
          Object.entries(prev.naamByRow || {}).filter(([k]) => Number(k) !== rowId)
        ),
        touchedNaamByRow: Object.fromEntries(
          Object.entries(prev.touchedNaamByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
      }));
    };

    useEffect(() => {
      // Initialize koppelingen data when form state is prefilled in edit mode
      // This ensures that prefilled koppelingen are actually persisted to the applicatie
      // Only update fields that are in UI state, preserving existing data from applicatie.koppelingen
      if (rows.length > 0) {
        rows.forEach((rowId) => {
          const appBId = selectedAppBByRow[rowId];
          const richting = directionByRow[rowId];
          const localId = koppelingIdByRow[rowId];

          // Only persist if we have the minimum required data (appB) and a localId
          // Skip if koppeling already exists with all data (to avoid overwriting on initial load)
          if (appBId != null && localId) {
            const existingKoppeling = getKoppelingData(rowId);
            // Only update if this is a new koppeling or if UI state differs from stored data
            // Compare moduleB as strings to handle type differences
            const moduleBMatches =
              existingKoppeling &&
              String(
                existingKoppeling.moduleB || existingKoppeling.moduleBId || ''
              ) === String(appBId);
            const needsUpdate =
              !existingKoppeling ||
              !moduleBMatches ||
              existingKoppeling.gegevensuitwisselingRichting !== richting;

            if (needsUpdate) {
              persistRowIntoApplicatie(rowId, {
                appBId,
                richting,
              });
            }
          }
        });
      }
    }, [
      // Only run when the actual koppeling data changes, not on every state update
      JSON.stringify(
        rows.map((rowId) => ({
          appB: selectedAppBByRow[rowId],
          richting: directionByRow[rowId],
          localId: koppelingIdByRow[rowId],
        }))
      ),
    ]);

    return (
      <AcFlex column spacing='sm'>
        <h2 id='koppelingen-section-title' className='sr-only'>
          Koppelingen met andere applicaties
        </h2>

        <div>
          <Paragraph className='con-form-wizard-paragraph'>
            Geef aan met welke andere applicaties uw oplossing gegevens uitwisselt.
            Zo kunnen gemeenten zien hoe uw applicatie past in hun
            applicatielandschap. <br />
            Vul per koppeling in:
            <ul style={{ marginInlineStart: '1rem' }}>
              <li>met welke applicaties u koppelt,</li>
              <li>de richting van de gegevensuitwisseling,</li>
              <li>en het type koppeling (bijvoorbeeld API, bestand of bericht).</li>
            </ul>
          </Paragraph>
        </div>

        {/* Closeable info alert about updating koppeling details later */}
        {showInfoAlert && (
          <Alert severity='info' className='ac-forms-info-alert'>
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
                <strong>Koppeling informatie aanpassen</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  U definieert hier basisinformatie van koppelingen tussen uw
                  applicatie en die van anderen. Na het opslaan van uw registratie
                  van de applicatie kunt u op de detailpagina van elke koppeling
                  aanvullende technische details toevoegen.
                  <br />
                  Als de applicatie waarmee uw wilt koppelen nog niet bestaat, dan
                  kunt u de leverancier vragen zich ook aan te melden bij de
                  Softwarecatalogus.
                </span>
              </div>
            </div>
          </Alert>
        )}

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '0.75rem',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>Applicatie</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>
              Buiten Gemeentelijke Voorziening
            </span>
          </div>
        </div>

        <AcFlex column spacing='sm' className='con-form-wizard-rows'>
          {rows.map((rowId) => {
            const koppelingData = getKoppelingData(rowId);

            return (
              <div
                key={`row-${rowId}`}
                className='ac-register-form-section'
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                }}
              >
                {/* Grid: Applicatie A - Richting - Applicatie B - Naam */}
                <div
                  className='ac-register-form-grid'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Applicatie A (disabled, shows current applicatie) */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='koppeling'
                      schemaProperty='moduleA'
                      value={applicatie.naam || 'Deze applicatie'}
                      onChange={() => {}}
                      isDisabled={true}
                      schemas={schemas}
                      optionsProvider={[
                        {
                          value: applicatie.naam || 'Deze applicatie',
                          label: applicatie.naam || 'Deze applicatie',
                        },
                      ]}
                      customProps={{
                        labelStyle: { fontSize: '1rem' },
                        component: 'ReactSelect',
                        placeholder: 'Selecteer applicatie A',
                      }}
                    />
                  </div>

                  {/* Richting (direction) */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='koppeling'
                      schemaProperty='gegevensuitwisselingRichting'
                      value={directionByRow[rowId] || ''}
                      onChange={(value) => {
                        // Persist immediately with the fresh value
                        persistRowIntoApplicatie(rowId, { richting: value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          directionByRow: {
                            ...prev.directionByRow,
                            [rowId]: value,
                          },
                        }));
                      }}
                      isDisabled={
                        modulesLoading || buitengemeentelijkeOptionsLoading
                      }
                      schemas={schemas}
                      customProps={{
                        labelStyle: { fontSize: '1rem' },
                        component: 'ReactSelect',
                        placeholder: 'Richting',
                        getOptionLabel: (opt) => {
                          // Map enum values to display labels with arrows
                          const labelMap = {
                            AnaarB: 'A → B',
                            BnaarA: 'B → A',
                            'bi-directioneel': '↔ Bi-directioneel',
                          };
                          const value = opt?.value || opt;
                          return labelMap[value] || opt?.label || value;
                        },
                      }}
                    />
                  </div>

                  {/* Applicatie B or BGV */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='koppeling'
                      schemaProperty='moduleB'
                      value={selectedAppBByRow[rowId] || ''}
                      onChange={(value) => {
                        // Update UI state first
                        setKoppelingValue(rowId, (prev) => ({
                          selectedAppBByRow: {
                            ...prev.selectedAppBByRow,
                            [rowId]: value ?? null,
                          },
                        }));
                        // Then persist (pass null explicitly when cleared)
                        persistRowIntoApplicatie(rowId, {
                          appBId: value ?? null,
                        });
                      }}
                      isLoading={modulesLoading || buitengemeentelijkeOptionsLoading}
                      schemas={schemas}
                      optionsProvider={getMergedOptions()}
                      isClearable={true}
                      onSearch={(path, refSlug, inputValue) => {
                        // Trigger search when user types
                        // Only search modules, not BGVs (they're already in buitengemeentelijkeOptions)
                        searchModules(inputValue || '');
                      }}
                      customProps={{
                        labelStyle: { fontSize: '1rem' },
                        label: 'Applicatie B of BGV',
                        component: 'ReactSelect',
                        isClearable: true,
                        isSearchable: true,
                        // Disable client-side filtering since we do server-side search
                        filterOption: () => true,
                        getOptionLabel: (opt) => {
                          // Handle both wrapped options (with .data) and direct options
                          // Options from getMergedOptions() already have .label property
                          return (
                            opt?.label ||
                            opt?.data?.label ||
                            opt?.naam ||
                            opt?.data?.naam ||
                            ''
                          );
                        },
                        getOptionValue: (opt) => {
                          // Ensure we use the correct value property (ID)
                          return opt?.value || opt?.id || '';
                        },
                      }}
                      inputStyle={getSelectStyles()}
                    />
                  </div>

                  {/* Naam (name of the connection) */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='koppeling'
                      schemaProperty='naam'
                      value={koppelingData?.naam || naamByRow[rowId] || ''}
                      onChange={(value) => {
                        const newNaam = value || '';
                        // Mark field as touched when user interacts with it
                        setKoppelingValue(rowId, (prev) => ({
                          naamByRow: {
                            ...(prev.naamByRow || {}),
                            [rowId]: newNaam,
                          },
                          touchedNaamByRow: {
                            ...(prev.touchedNaamByRow || {}),
                            [rowId]: true,
                          },
                        }));
                        // Also persist to applicatie data if appBId exists
                        persistRowIntoApplicatie(rowId, {
                          naam: newNaam,
                        });
                      }}
                      schemas={schemas}
                      touched={{ naam: touchedNaamByRow[rowId] || false }}
                      customProps={{
                        labelStyle: { fontSize: '1rem' },
                        placeholder: 'Naam van de koppeling',
                      }}
                    />
                  </div>

                  {/* Empty spacer */}
                  <div></div>

                  {/* Delete button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <AcButton
                      style='button'
                      buttonType='secondary'
                      onClick={() => {
                        rows.length === 1 ? clearRow(rowId) : removeRow(rowId);
                      }}
                      disabled={rows.length === 1}
                      icon={<VISUALS.TRASHCAN />}
                      title='Rij verwijderen'
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </AcFlex>

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
      </AcFlex>
    );
  }
);

ConFormApplicatieKoppelingenStage.displayName = 'ConFormApplicatieKoppelingenStage';

export default ConFormApplicatieKoppelingenStage;
