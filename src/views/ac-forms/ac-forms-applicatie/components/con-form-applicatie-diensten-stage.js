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
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Diensten Stage Component for Applicatie Form
 *
 * This stage manages services that can be provided by the applicatie.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Array} dienstOptions - Available service type options
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {Object} dienstenFormState - UI state for the diensten form
 * @param {Function} setDienstenFormState - Function to update diensten form state
 */
const ConFormApplicatieDienstenStage = memo(
  ({
    applicatie,
    dienstOptions,
    setApplicatieData,
    dienstenFormState,
    setDienstenFormState,
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
      selectedDienstByRow,
      dienstNaamByRow, // Track dienst names by row
      dienstIdByRow, // Track dienst IDs by row
    } = dienstenFormState;

    const generateLocalId = () =>
      `dienst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // Persist row data into applicatie.diensten array
    const persistRowIntoApplicatie = (rowId, overrides = {}) => {
      const dienstVal = overrides.dienstVal ?? selectedDienstByRow[rowId];
      const dienstNaam = overrides.dienstNaam ?? dienstNaamByRow?.[rowId];

      if (dienstVal == null) return;

      let localId = dienstIdByRow?.[rowId];
      if (!localId) {
        localId = generateLocalId();
        setDienstenFormState((prev) => ({
          ...prev,
          dienstIdByRow: { ...(prev.dienstIdByRow || {}), [rowId]: localId },
        }));
      }

      // Get dienst option for label
      const dienstOption = dienstOptions?.find((opt) => opt.value === dienstVal);

      setApplicatieData('diensten', (prevDiensten) => {
        const diensten = Array.isArray(prevDiensten) ? [...prevDiensten] : [];

        // Create or update dienst object with proper structure
        const dienstObject = {
          _localId: localId,
          type: dienstVal, // The service type (e.g., "Functioneel beheer")
          naam: dienstNaam || dienstOption?.label || dienstVal,
          aanbieder: applicatie.aanbieder, // Add active organization as aanbieder
        };

        // Find existing dienst by localId and update, or add new one
        const existingIndex = diensten.findIndex((d) => d._localId === localId);

        if (existingIndex !== -1) {
          // Update existing dienst
          diensten[existingIndex] = dienstObject;
        } else {
          // Add new dienst
          diensten.push(dienstObject);
        }

        return diensten;
      });
    };

    const removeRow = (rowId) => {
      const localId = dienstIdByRow?.[rowId];

      if (localId != null) {
        setApplicatieData('diensten', (prevDiensten) => {
          const diensten = Array.isArray(prevDiensten) ? prevDiensten : [];
          return diensten.filter((d) => d._localId !== localId);
        });
      }

      setDienstenFormState((prev) => ({
        ...prev,
        rows: prev.rows.filter((id) => id !== rowId),
        selectedDienstByRow: Object.fromEntries(
          Object.entries(prev.selectedDienstByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
        dienstNaamByRow: Object.fromEntries(
          Object.entries(prev.dienstNaamByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
        dienstIdByRow: Object.fromEntries(
          Object.entries(prev.dienstIdByRow || {}).filter(
            ([k]) => Number(k) !== rowId
          )
        ),
      }));
    };

    return (
      <div>
        <h2 id='diensten-section-title' className='sr-only'>
          Diensten
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Digitale dienstverlening en functionaliteit</strong>
          <br />
          Geef aan welke diensten uw applicatie ondersteunt. Diensten beschrijven de
          concrete functionaliteit die uw applicatie biedt aan burgers, bedrijven of
          gemeenten. Door dit vast te leggen, zien organisaties hoe uw software
          aansluit bij hun dienstverlening
        </Paragraph>

        {/* Closeable info alert about updating dienst details later */}
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
                <strong>Dienst details aanpassen</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  U selecteert hier alleen het type dienst. Na het opslaan van uw
                  applicatie kunt u op de detailpagina van elke dienst aanvullende
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
                  <b>Dienst Naam</b>
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
                    <Textbox
                      value={dienstNaamByRow?.[rowId] || ''}
                      onChange={(e) => {
                        const naam = e.target.value;
                        setDienstenFormState((prev) => ({
                          ...prev,
                          dienstNaamByRow: {
                            ...(prev.dienstNaamByRow || {}),
                            [rowId]: naam,
                          },
                        }));

                        // Persist immediately if dienst type is already selected
                        if (selectedDienstByRow[rowId] != null) {
                          persistRowIntoApplicatie(rowId, { dienstNaam: naam });
                        }
                      }}
                      placeholder='Naam van de dienst'
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      options={dienstOptions || []}
                      isClearable
                      value={
                        selectedDienstByRow[rowId] != null
                          ? (dienstOptions || [])?.find(
                              (o) =>
                                String(o.value) === String(selectedDienstByRow[rowId])
                            )
                          : null
                      }
                      onChange={(selectedOption) => {
                        if (!selectedOption) {
                          setDienstenFormState((prev) => ({
                            ...prev,
                            selectedDienstByRow: {
                              ...(prev.selectedDienstByRow || {}),
                              [rowId]: undefined,
                            },
                          }));

                          // Remove dienst from applicatie if cleared
                          const localId = dienstIdByRow?.[rowId];
                          if (localId != null) {
                            setApplicatieData('diensten', (prevDiensten) => {
                              const diensten = Array.isArray(prevDiensten)
                                ? prevDiensten
                                : [];
                              return diensten.filter((d) => d._localId !== localId);
                            });
                          }
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
                        persistRowIntoApplicatie(rowId, {
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

ConFormApplicatieDienstenStage.displayName = 'ConFormApplicatieDienstenStage';

export default ConFormApplicatieDienstenStage;

