import React, { memo, useState, useEffect } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { VISUALS } from '@src/constants';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Textbox,
  Textarea,
  Separator,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@src/atoms';

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
 * @param {Array} standaardenOptions - Available standards options
 * @param {boolean} standaardenOptionsLoading - Loading state for standards options
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
    standaardenOptions = [],
    standaardenOptionsLoading = false,
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
      typeByRow,
      koppelingIdByRow = {},
    } = koppelingenFormState;

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

    const statusOptions = [
      { value: 'in ontwikkeling', label: 'In ontwikkeling' },
      { value: 'in gebruik', label: 'In gebruik' },
      { value: 'einde ondersteuning', label: 'Einde ondersteuning' },
      { value: 'teruggetrokken', label: 'Teruggetrokken' },
    ];

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
      const soort = 'soort' in overrides ? overrides.soort : typeByRow[rowId];
      const naam =
        'naam' in overrides ? overrides.naam : getKoppelingData(rowId)?.naam;
      const status =
        'status' in overrides ? overrides.status : getKoppelingData(rowId)?.status;
      const standaarden =
        'standaarden' in overrides
          ? overrides.standaarden
          : getKoppelingData(rowId)?.standaarden;
      const beschrijving =
        'beschrijving' in overrides
          ? overrides.beschrijving
          : getKoppelingData(rowId)?.beschrijving;

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
          richtingDataUitwisseling: richting,
          soortKoppeling: soort,
          // Only set these fields if they're explicitly provided or already exist
          ...(naam !== undefined ? { naam } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(standaarden !== undefined ? { standaarden } : {}),
          ...(beschrijving !== undefined ? { beschrijving } : {}),
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
        soort: null,
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
        typeByRow: Object.fromEntries(
          Object.entries(prev.typeByRow).filter(([k]) => Number(k) !== rowId)
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
        typeByRow: Object.fromEntries(
          Object.entries(prev.typeByRow).filter(([k]) => Number(k) !== rowId)
        ),
        koppelingIdByRow: Object.fromEntries(
          Object.entries(prev.koppelingIdByRow || {}).filter(
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
          const soort = typeByRow[rowId];
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
              existingKoppeling.richtingDataUitwisseling !== richting ||
              existingKoppeling.soortKoppeling !== soort;

            if (needsUpdate) {
              persistRowIntoApplicatie(rowId, {
                appBId,
                richting,
                soort,
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
          soort: typeByRow[rowId],
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
            applicatielandschap. Vul per koppeling in:
          </Paragraph>
          <ul style={{ marginInlineStart: '1rem' }}>
            <li>met welke applicatie u koppelt,</li>
            <li>de richting van de gegevensuitwisseling,</li>
            <li>en het type koppeling (bijvoorbeeld API, bestand of bericht).</li>
          </ul>
        </div>

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
                  softwarecatalogus.
                </span>
              </div>
            </div>
          </Alert>
        )}

        <AcFlex column spacing='sm' className='con-form-wizard-rows'>
          {rows.map((rowId) => {
            const koppelingData = getKoppelingData(rowId);
            const beschrijving = koppelingData?.beschrijving || '';
            const maxLen = 255;
            const charsLeft = Math.max(0, maxLen - beschrijving.length);

            const appAId = `koppeling-appA-${rowId}`;
            const appBId = `koppeling-appB-${rowId}`;
            const soortId = `koppeling-soort-${rowId}`;
            const richtingId = `koppeling-richting-${rowId}`;
            const statusId = `koppeling-status-${rowId}`;

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
                {/* Row 1: Applicatie A - Richting - Applicatie B */}
                <div
                  className='ac-register-form-grid'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={appAId}
                      style={{ display: 'block' }}
                    >
                      Applicatie A
                      <span className='required-indicator' aria-hidden='true'>
                        *
                      </span>
                      <span className='sr-only'>(verplicht)</span>
                    </label>
                    <ReactSelect
                      isDisabled
                      className={clsx(
                        'ac-beheer-select',
                        'ac-beheer-select--disabled'
                      )}
                      value={{
                        value: applicatie.naam || 'Deze applicatie',
                        label: applicatie.naam || 'Deze applicatie',
                      }}
                      placeholder='Selecteer applicatie A'
                      inputId={appAId}
                      aria-required='true'
                    />
                  </div>
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={richtingId}
                      style={{ display: 'block' }}
                    >
                      Richting
                      <span className='required-indicator' aria-hidden='true'>
                        *
                      </span>
                      <span className='sr-only'>(verplicht)</span>
                    </label>
                    <ReactSelect
                      className={clsx(
                        'ac-beheer-select',
                        (modulesLoading || buitengemeentelijkeOptionsLoading) &&
                          'ac-beheer-select--disabled'
                      )}
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
                        persistRowIntoApplicatie(rowId, { richting: opt?.value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          directionByRow: {
                            ...prev.directionByRow,
                            [rowId]: opt?.value,
                          },
                        }));
                      }}
                      placeholder='Richting'
                      inputId={richtingId}
                      aria-required='true'
                    />
                  </div>
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={appBId}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      Applicatie B of BGV
                      <span className='required-indicator' aria-hidden='true'>
                        *
                      </span>
                      <span className='sr-only'>(verplicht)</span>
                    </label>
                    <ReactSelect
                      className={clsx(
                        'ac-beheer-select',
                        (modulesLoading || buitengemeentelijkeOptionsLoading) &&
                          'ac-beheer-select--disabled'
                      )}
                      isClearable
                      options={getMergedOptions()}
                      value={(() => {
                        const selected = selectedAppBByRow[rowId];
                        if (selected == null) return null;
                        const opts = getMergedOptions();
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
                      onChange={(opt) => {
                        // Update UI state first
                        setKoppelingValue(rowId, (prev) => ({
                          selectedAppBByRow: {
                            ...prev.selectedAppBByRow,
                            [rowId]: opt?.value ?? null,
                          },
                        }));
                        // Then persist (pass null explicitly when cleared)
                        persistRowIntoApplicatie(rowId, {
                          appBId: opt?.value ?? null,
                        });
                      }}
                      onInputChange={(inputValue, meta) => {
                        if (meta && meta.action === 'input-change') {
                          searchModules(inputValue || '');
                        }
                        return inputValue;
                      }}
                      isLoading={modulesLoading || buitengemeentelijkeOptionsLoading}
                      inputId={appBId}
                      aria-required='true'
                      styles={getSelectStyles()}
                    />
                  </div>
                </div>

                {/* Row 2: Soort - Naam - Status */}
                <div
                  className='ac-register-form-grid'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={soortId}
                      style={{ display: 'block' }}
                    >
                      Soort
                    </label>
                    <ReactSelect
                      className={clsx(
                        'ac-beheer-select',
                        (modulesLoading || buitengemeentelijkeOptionsLoading) &&
                          'ac-beheer-select--disabled'
                      )}
                      options={typeOptions}
                      isClearable
                      value={
                        typeByRow[rowId]
                          ? typeOptions.find((o) => o.value === typeByRow[rowId])
                          : null
                      }
                      onChange={(opt) => {
                        // Persist immediately with the fresh value
                        persistRowIntoApplicatie(rowId, { soort: opt?.value });
                        // Keep UI state in sync
                        setKoppelingValue(rowId, (prev) => ({
                          typeByRow: { ...prev.typeByRow, [rowId]: opt?.value },
                        }));
                      }}
                      placeholder='Soort'
                      inputId={soortId}
                    />
                  </div>
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={`koppeling-naam-${rowId}`}
                      style={{ display: 'block' }}
                    >
                      Naam
                    </label>
                    <Textbox
                      id={`koppeling-naam-${rowId}`}
                      value={koppelingData?.naam || ''}
                      onChange={(e) =>
                        persistRowIntoApplicatie(rowId, {
                          naam: e?.target?.value || '',
                        })
                      }
                      placeholder='Naam van de koppeling'
                    />
                  </div>
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={statusId}
                      style={{ display: 'block' }}
                    >
                      Status
                    </label>
                    <ReactSelect
                      className={clsx(
                        'ac-beheer-select',
                        (modulesLoading || buitengemeentelijkeOptionsLoading) &&
                          'ac-beheer-select--disabled'
                      )}
                      options={statusOptions}
                      isClearable
                      value={
                        koppelingData?.status
                          ? statusOptions.find(
                              (o) => o.value === koppelingData.status
                            )
                          : null
                      }
                      onChange={(opt) =>
                        persistRowIntoApplicatie(rowId, {
                          status: opt?.value,
                        })
                      }
                      placeholder='Status'
                      inputId={statusId}
                    />
                  </div>
                </div>

                <Separator
                  className='ac-register-review-header__separator'
                  style={{ marginBlock: '24px' }}
                />

                <div className='con-koppeling-standaarden-field'>
                  <label
                    className='utrecht-form-label'
                    htmlFor={`koppeling-standaarden-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    Standaarden
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      'con-koppeling-standaarden-select',
                      (modulesLoading || buitengemeentelijkeOptionsLoading) &&
                        'ac-beheer-select--disabled'
                    )}
                    isClearable
                    value={
                      koppelingData?.standaarden &&
                      Array.isArray(koppelingData.standaarden)
                        ? standaardenOptions.filter((o) =>
                            koppelingData.standaarden.includes(o.value)
                          )
                        : null
                    }
                    onChange={(opt) => {
                      const standaarden = opt ? opt.map((o) => o.value) : [];
                      persistRowIntoApplicatie(rowId, {
                        standaarden:
                          standaarden.length > 0 ? standaarden : undefined,
                      });
                    }}
                    options={standaardenOptions}
                    placeholder={
                      standaardenOptionsLoading
                        ? 'Laden...'
                        : 'Selecteer standaarden'
                    }
                    isMulti={true}
                    isSearchable={true}
                    isLoading={standaardenOptionsLoading}
                    closeMenuOnSelect={false}
                    isDisabled={
                      modulesLoading ||
                      buitengemeentelijkeOptionsLoading ||
                      standaardenOptionsLoading
                    }
                    inputId={`koppeling-standaarden-${rowId}`}
                  />
                </div>

                {/* Korte beschrijving (full width) */}
                <div style={{ marginTop: '1rem' }}>
                  <label
                    className='utrecht-form-label'
                    htmlFor={`koppeling-beschrijving-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    Korte beschrijving
                  </label>
                  <Textarea
                    id={`koppeling-beschrijving-${rowId}`}
                    className='con-koppeling-beschrijving'
                    value={beschrijving}
                    maxLength={maxLen}
                    onChange={(e) =>
                      persistRowIntoApplicatie(rowId, {
                        beschrijving: e?.target?.value || '',
                      })
                    }
                    placeholder='Korte beschrijving van de koppeling (max 255 tekens)'
                  />
                  <Paragraph
                    style={{
                      marginTop: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#666',
                    }}
                  >
                    {charsLeft} tekens resterend
                  </Paragraph>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '0.75rem',
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
