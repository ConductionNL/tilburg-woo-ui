import React, { memo, useState, useEffect } from 'react';
import { VISUALS, PATHS } from '@src/constants';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Koppelingen Stage Component for Applicatie Form
 *
 * This stage manages connections/integrations between the current applicatie and other applicaties.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {Array} modulesOptions - Available modules/applicaties for connections
 * @param {boolean} modulesLoading - Loading state for modules options
 * @param {Object} koppelingenFormState - UI state for the koppelingen form
 * @param {Function} setKoppelingenFormState - Function to update koppelingen form state
 * @param {Function} searchModules - Function to search for modules/applicaties
 */
const ConFormApplicatieKoppelingenStage = memo(
  ({
    applicatie,
    setApplicatieData,
    modulesOptions,
    modulesLoading,
    koppelingenFormState,
    setKoppelingenFormState,
    searchModules,
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

    const setKoppelingValue = (rowId, updater) => {
      setKoppelingenFormState((prev) => ({ ...prev, ...updater(prev) }));
    };

    const generateLocalId = () =>
      `kpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // Persist row data into applicatie object
    const persistRowIntoApplicatie = (rowId, overrides = {}) => {
      // Check if appBId was explicitly provided (even if null/undefined) vs not provided
      const appBIdProvided = 'appBId' in overrides;
      const appBId = appBIdProvided ? overrides.appBId : selectedAppBByRow[rowId];
      const richting =
        'richting' in overrides ? overrides.richting : directionByRow[rowId];
      const soort = 'soort' in overrides ? overrides.soort : typeByRow[rowId];

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
        };

        const idx = list.findIndex((k) => k?._localId === localId);
        if (idx >= 0) list[idx] = fields;
        else list.push(fields);

        return list;
      });
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
      if (rows.length > 0) {
        rows.forEach((rowId) => {
          const appBId = selectedAppBByRow[rowId];
          const richting = directionByRow[rowId];
          const soort = typeByRow[rowId];

          // Only persist if we have the minimum required data (appB)
          if (appBId != null) {
            persistRowIntoApplicatie(rowId, {
              appBId,
              richting,
              soort,
            });
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
        }))
      ),
    ]);

    // Handle opening applicatie form in new tab
    const handleOpenApplicatieForm = () => {
      const applicatieFormUrl = `${window.location.origin}${PATHS.FORMS_APPLICATIE}?type=ontbrekend-applicatie`;
      window.open(applicatieFormUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <div>
        <h2 id='koppelingen-section-title' className='sr-only'>
          Koppelingen
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Koppelingen met andere applicaties</strong>
          <br />
          Geef aan met welke andere applicaties uw oplossing gegevens uitwisselt. Zo
          kunnen gemeenten zien hoe uw applicatie past in hun applicatielandschap.
          <br />
          <br />
          Vul per koppeling in:
          <ul style={{ marginInlineStart: '1rem' }}>
            <li>met welke applicaties u koppelt,</li>
            <li>de richting van de gegevensuitwisseling,</li>
            <li>en het type koppeling (bijvoorbeeld API, bestand of bericht).</li>
          </ul>
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
                <strong>Koppeling informatie aanpassen</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  U definieert hier basis informatie van koppelingen tussen uw
                  applicatie en die van anderen. Na het opslaan van uw registratie
                  van de applicatie kunt u op de detailpagina van elke koppeling
                  aanvullende technische details toevoegen.
                  <br />
                  <br />
                  Als de applicatie waarmee uw wilt koppelen nog niet bestaat, dan
                  dient u deze eerst op te voeren via het{' '}
                  <Link
                    onClick={handleOpenApplicatieForm}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit',
                    }}
                  >
                    &quot;Applicatie melden&quot;
                  </Link>
                  . Dit kan pas na het afronden van de registratie van uw applicatie.
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
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    >
                      {applicatie.naam || 'Deze applicatie'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={modulesOptions || []}
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
                      isClearable={true}
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
                        persistRowIntoApplicatie(rowId, { richting: opt?.value });
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
                        persistRowIntoApplicatie(rowId, { soort: opt?.value });
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

ConFormApplicatieKoppelingenStage.displayName = 'ConFormApplicatieKoppelingenStage';

export default ConFormApplicatieKoppelingenStage;
