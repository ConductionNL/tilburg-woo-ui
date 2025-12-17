import React, { memo, useState, useEffect, useCallback } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import {
  Alert,
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * All startDatum property names for clearing purposes.
 */
const ALL_START_DATUM_PROPERTIES = [
  'startDatumVerwerving',
  'startDatumGepland',
  'startDatumInProductie',
  'startDatumUitTeFaseren',
  'startDatumUitGefaseerd',
];

/**
 * Maps status value to corresponding startDatum property name.
 * @param {string} status - The status value (e.g., 'Verwerving', 'Gepland', etc.)
 * @returns {string|null} - The property name (e.g., 'startDatumVerwerving') or null if no mapping exists
 */
const getStartDatumPropertyName = (status) => {
  const statusToPropertyMap = {
    Verwerving: 'startDatumVerwerving',
    Gepland: 'startDatumGepland',
    'In productie': 'startDatumInProductie',
    'Uit te faseren': 'startDatumUitTeFaseren',
    Uitgefaseerd: 'startDatumUitGefaseerd',
  };
  return statusToPropertyMap[status] || null;
};

/**
 * Gets the label for the start date field based on the selected status.
 * @param {string} status - The status value
 * @returns {string} - The label for the date field
 */
const getStartDatumLabel = (status) => {
  const statusToLabelMap = {
    Verwerving: 'Startdatum Verwerving',
    Gepland: 'Startdatum Gepland',
    'In productie': 'Startdatum In productie',
    'Uit te faseren': 'Startdatum Uit te faseren',
    Uitgefaseerd: 'Startdatum Uitgefaseerd',
  };
  return statusToLabelMap[status] || 'Startdatum';
};

/**
 * Gets today's date in YYYY-MM-DD format for date input fields.
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * ConGebruikStepInformatie
 * Renders the "Gebruik informatie" step of the Gebruik wizard.
 * Shows hosting (filtered from applicatie), status, startdatum, and interneNotitie fields.
 */
const ConGebruikStepInformatie = ({
  gebruik,
  setGebruikData,
  loading,
  schemas,
  applicatieKeuze,
  selectedApplicatieData,
  setNieuweApplicatieData,
  isEditMode = false,
  versionOptions = [],
  versionsLoading = false,
  nieuweApplicatie = null,
}) => {
  // Get moduleVersie schema for defaults (for new applicatie flow)
  const moduleVersieSchema = schemas?.moduleversie;

  // Extract default values from schema for new applicatie version
  const getSchemaDefaults = useCallback(() => {
    const defaults = {};
    if (moduleVersieSchema?.properties) {
      Object.entries(moduleVersieSchema.properties).forEach(([key, property]) => {
        if (property.default !== undefined) {
          defaults[key] = property.default;
        }
        // Also check for examples as fallback defaults
        if (property.example !== undefined && defaults[key] === undefined) {
          defaults[key] = property.example;
        }
      });
    }
    return defaults;
  }, [moduleVersieSchema]);

  const schemaDefaults = getSchemaDefaults();

  // Get current version for new applicatie flow
  const getVersie = useCallback(() => {
    return Array.isArray(nieuweApplicatie?.moduleVersies) &&
      nieuweApplicatie.moduleVersies.length > 0
      ? nieuweApplicatie.moduleVersies[0]
      : { ...schemaDefaults };
  }, [nieuweApplicatie?.moduleVersies, schemaDefaults]);

  // Update version field for new applicatie (only one version allowed)
  const updateVersie = useCallback(
    (field, value) => {
      const currentVersie = getVersie();
      const updatedVersie = {
        ...currentVersie,
        [field]: value,
      };
      if (setNieuweApplicatieData) {
        setNieuweApplicatieData('moduleVersies', [updatedVersie]);
      }
    },
    [getVersie, setNieuweApplicatieData]
  );

  // Ensure status is always set to "in gebruik" for new applicatie versions
  useEffect(() => {
    if (applicatieKeuze !== 'nieuw' || !nieuweApplicatie) return;
    const versie = getVersie();
    if (versie.status !== 'in gebruik') {
      updateVersie('status', 'in gebruik');
    }
  }, [applicatieKeuze, nieuweApplicatie]);
  // Manage visibility state of info alerts for application flows.
  // Alert persists as closed for the session after user closes it (via sessionStorage).
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    // Return true (show) if the alert has not been closed in this session, otherwise false.
    return !sessionStorage.getItem('gebruik-informatie-info-alert-closed');
  });

  // Mark the 'bestaand' alert as closed for the session and update state.
  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('gebruik-informatie-info-alert-closed', 'true');
  };
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='info-title'
    >
      <h2 id='info-title' className='sr-only'>
        Gebruiksinformatie
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Selecteer de gebruikte hosting en versie. Ook kunt u een interne notitie
        toevoegen voor uw collega’s.
      </Paragraph>

      {/* Closeable info alert about adding an existing application */}
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
              <strong>Interne notitie</strong>
              <br />
              <span className='ac-forms-product-info-alert__text'>
                De interne notitie is alleen zichtbaar voor de eigen organisatie.
                Gebruikers van buiten de organisatie zien deze niet.
              </span>
            </div>
          </div>
        </Alert>
      )}

      <div className='ac-register-form-grid'>
        {/* Hosting field - filtered from applicatie's cloudDienstverleningsmodel */}
        <div style={{ gridColumn: 'span 2' }}>
          {(() => {
            // Get hosting options from selected applicatie or module schema enum
            const hostingOptions = [];
            if (
              applicatieKeuze === 'bestaand' &&
              selectedApplicatieData?.cloudDienstverleningsmodel
            ) {
              const hostingArray = Array.isArray(
                selectedApplicatieData.cloudDienstverleningsmodel
              )
                ? selectedApplicatieData.cloudDienstverleningsmodel
                : [selectedApplicatieData.cloudDienstverleningsmodel];
              hostingOptions.push(
                ...hostingArray.map((h) => ({ value: h, label: h }))
              );
            } else if (applicatieKeuze === 'nieuw') {
              // Get enum values from module schema for new applicatie flow
              const moduleSchema = schemas?.module;
              const cloudDienstverleningsmodelProperty =
                moduleSchema?.properties?.cloudDienstverleningsmodel;
              if (
                cloudDienstverleningsmodelProperty?.type === 'array' &&
                cloudDienstverleningsmodelProperty?.items?.enum
              ) {
                hostingOptions.push(
                  ...cloudDienstverleningsmodelProperty.items.enum.map((h) => ({
                    value: h,
                    label: h,
                  }))
                );
              }
            }

            return (
              <ConSchemaEnhancedField
                schemaType='gebruik'
                schemaProperty='cloudDienstverleningsmodel'
                value={gebruik?.cloudDienstverleningsmodel || ''}
                onChange={(value) => {
                  setGebruikData('cloudDienstverleningsmodel', value);
                  // When creating new applicatie, also update nieuweApplicatie
                  if (applicatieKeuze === 'nieuw' && setNieuweApplicatieData) {
                    setNieuweApplicatieData('cloudDienstverleningsmodel', value);
                  }
                }}
                isDisabled={loading || hostingOptions.length === 0}
                width='full'
                schemas={schemas}
                optionsProvider={hostingOptions}
                customProps={{
                  label: 'Hosting',
                  placeholder:
                    hostingOptions.length === 0
                      ? 'Geen hosting opties beschikbaar'
                      : 'Selecteer hosting',
                  description: 'Hosting type zoals gedefinieerd door de applicatie',
                }}
              />
            );
          })()}
        </div>

        {/* Applicatie versie field - select for existing applicatie, input for new applicatie */}
        {applicatieKeuze === 'bestaand' && (
          <div style={{ gridColumn: 'span 2' }}>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty='moduleVersie'
              value={gebruik?.moduleVersie || null}
              onChange={(value) => setGebruikData('moduleVersie', value)}
              isDisabled={versionsLoading}
              isLoading={versionsLoading}
              schemas={schemas}
              optionsProvider={versionOptions}
              onSearch={() => {}}
              width='full'
              customProps={{
                label: 'Applicatie versie',
                placeholder: 'Selecteer een applicatie versie',
              }}
            />
          </div>
        )}

        {/* Versie creation for new applicatie */}
        {applicatieKeuze === 'nieuw' && nieuweApplicatie && (
          <div style={{ gridColumn: 'span 2' }}>
            <div>
              <h3>Versie informatie</h3>
              <Table>
                <thead>
                  <TableRow>
                    <TableCell>
                      <b>Versie</b>
                    </TableCell>
                    <TableCell>
                      <b>Status</b>
                    </TableCell>
                  </TableRow>
                </thead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Textbox
                        value={getVersie().versie ?? schemaDefaults.versie ?? ''}
                        onChange={(event) =>
                          updateVersie('versie', event.target.value)
                        }
                        placeholder={
                          schemaDefaults.versie ||
                          moduleVersieSchema?.properties?.versie?.example ||
                          '1.0.0'
                        }
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <span style={{ color: '#666' }}>In gebruik</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Status field */}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='status'
            value={gebruik?.status || ''}
            onChange={(value) => {
              setGebruikData('status', value);

              const newStartDatumProperty = getStartDatumPropertyName(value);

              if (!isEditMode) {
                // In create mode: clear all other startDatum fields, only keep the one for current status
                ALL_START_DATUM_PROPERTIES.forEach((property) => {
                  if (property !== newStartDatumProperty) {
                    setGebruikData(property, '');
                  }
                });
              }

              // Set the corresponding startDatum to today if not already set
              if (newStartDatumProperty && !gebruik?.[newStartDatumProperty]) {
                setGebruikData(newStartDatumProperty, getTodayDateString());
              }
            }}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />
        </div>

        {/* Startdatum field - shown when a status is selected */}
        {gebruik?.status && getStartDatumPropertyName(gebruik.status) && (
          <div style={{ gridColumn: 'span 2' }}>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty={getStartDatumPropertyName(gebruik.status)}
              value={
                gebruik?.[getStartDatumPropertyName(gebruik.status)] ||
                getTodayDateString()
              }
              onChange={(value) => {
                const startDatumProperty = getStartDatumPropertyName(gebruik.status);
                if (startDatumProperty) {
                  setGebruikData(startDatumProperty, value);
                }
              }}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                label: getStartDatumLabel(gebruik.status),
                description: `De startdatum voor de status "${gebruik.status}"`,
              }}
            />
          </div>
        )}

        {/* Interne notitie field */}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='interneAantekening'
            value={gebruik?.interneAantekening || ''}
            onChange={(value) => setGebruikData('interneAantekening', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
            customProps={{
              label: 'Interne notitie',
              placeholder: 'Voeg een interne notitie toe',
              description:
                'Interne notitie die alleen zichtbaar is voor uw organisatie',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepInformatie);
