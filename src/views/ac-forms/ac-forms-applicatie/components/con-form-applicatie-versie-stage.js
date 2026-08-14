import React, { useState, memo, useEffect } from 'react';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@src/atoms';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';

/**
 * All date property names for clearing purposes.
 */
const ALL_DATUM_PROPERTIES = [
  'datumInGebruik',
  'datumInOntwikkeling',
  'datumEindeOndersteuning',
  'datumTeruggetrokken',
];

/**
 * Maps status value to corresponding datum property name.
 * @param {string} status - The status value
 * @returns {string|null} - The property name or null if no mapping exists
 */
const getDatumPropertyName = (status) => {
  const statusToPropertyMap = {
    'in gebruik': 'datumInGebruik',
    'in ontwikkeling': 'datumInOntwikkeling',
    'einde ondersteuning': 'datumEindeOndersteuning',
    teruggetrokken: 'datumTeruggetrokken',
  };
  return statusToPropertyMap[status] || null;
};

/**
 * Gets the label for the start date field based on the selected status.
 * @param {string} status - The status value
 * @returns {string} - The label for the date field
 */
const getDatumLabel = (status) => {
  const statusToLabelMap = {
    'in gebruik': 'Startdatum In gebruik',
    'in ontwikkeling': 'Startdatum In ontwikkeling',
    'einde ondersteuning': 'Startdatum Einde ondersteuning',
    teruggetrokken: 'Startdatum Teruggetrokken',
  };
  return statusToLabelMap[status] || 'Startdatum Status';
};

/**
 * Gets today's date in YYYY-MM-DD format.
 * @returns {string} - Today's date
 */
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Applicatieversie Stage Component
 *
 * This stage manages version information for the applicatie.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration
 * @param {boolean} isEditMode - Whether in edit mode (preserves all dates)
 */
const ConFormApplicatieVersieStage = memo(
  ({ applicatie, setApplicatieData, loading, schemas, isEditMode = false }) => {
    // State for controlling alert visibility - persists until page refresh
    const [showInfoAlert, setShowInfoAlert] = useState(() => {
      // Check if alert was previously closed in this session
      return !sessionStorage.getItem('applicatie-versie-info-alert-closed');
    });

    // Handle closing the alert and remember the choice
    const handleCloseAlert = () => {
      setShowInfoAlert(false);
      sessionStorage.setItem('applicatie-versie-info-alert-closed', 'true');
    };

    // Get moduleVersie schema for defaults
    const moduleVersieSchema = schemas?.moduleversie;

    // Extract default values from schema
    const getSchemaDefaults = () => {
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
    };

    const schemaDefaults = getSchemaDefaults();

    // Initialize moduleVersies with one default version if empty
    // This ensures at least one version exists when the component mounts (create mode only)
    useEffect(() => {
      if (
        !isEditMode &&
        (!Array.isArray(applicatie?.moduleVersies) ||
          applicatie.moduleVersies.length === 0)
      ) {
        // Create default version with today's date for "In gebruik" status
        const defaultVersion = { ...schemaDefaults };
        if (defaultVersion.status) {
          const datumProperty = getDatumPropertyName(defaultVersion.status);
          if (datumProperty && !defaultVersion[datumProperty]) {
            defaultVersion[datumProperty] = getTodayDateString();
          }
        }
        setApplicatieData('moduleVersies', [defaultVersion]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount - we intentionally want this to run once

    // In edit mode, ensure dates are set for versions that have a status but no date
    useEffect(() => {
      if (isEditMode && Array.isArray(applicatie?.moduleVersies)) {
        let needsUpdate = false;
        const updatedVersions = applicatie.moduleVersies.map((versie) => {
          if (versie.status) {
            const datumProperty = getDatumPropertyName(versie.status);
            if (datumProperty && !versie[datumProperty]) {
              needsUpdate = true;
              return {
                ...versie,
                [datumProperty]: getTodayDateString(),
              };
            }
          }
          return versie;
        });

        if (needsUpdate) {
          setApplicatieData('moduleVersies', updatedVersions);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount in edit mode

    // Get current versions array or initialize with one default version
    const getVersions = () => {
      return Array.isArray(applicatie?.moduleVersies) &&
        applicatie.moduleVersies.length > 0
        ? applicatie.moduleVersies
        : [{ ...schemaDefaults }];
    };

    // Update a specific version field
    const updateVersieAt = (versionIndex, field, value) => {
      const currentVersions = getVersions();
      const updatedVersions = [...currentVersions];
      if (!updatedVersions[versionIndex]) {
        updatedVersions[versionIndex] = { ...schemaDefaults };
      }

      const currentVersion = updatedVersions[versionIndex];

      // Special handling for status change
      if (field === 'status') {
        const newDatumProperty = getDatumPropertyName(value);

        // Get current date value for the new status BEFORE any changes
        let currentDateValue = '';
        if (newDatumProperty && currentVersion[newDatumProperty]) {
          currentDateValue = currentVersion[newDatumProperty];
        }

        // Create updated version object
        const updatedVersion = { ...currentVersion, status: value };

        if (!isEditMode) {
          // In create mode: clear all other date fields, only keep the one for current status
          ALL_DATUM_PROPERTIES.forEach((property) => {
            if (property !== newDatumProperty) {
              updatedVersion[property] = '';
            }
          });
        }
        // In edit mode: preserve all existing dates (don't clear anything)

        // Set the date for the new status: use existing value or today's date (only if empty)
        if (newDatumProperty && !currentDateValue) {
          updatedVersion[newDatumProperty] = getTodayDateString();
        }

        updatedVersions[versionIndex] = updatedVersion;
      } else {
        // Normal field update
        updatedVersions[versionIndex] = {
          ...currentVersion,
          [field]: value,
        };
      }

      setApplicatieData('moduleVersies', updatedVersions);
    };

    // Get current date value for a version based on its status
    const getCurrentDateValue = (versie) => {
      if (!versie.status) return '';
      const datumProperty = getDatumPropertyName(versie.status);
      if (!datumProperty) return '';
      const dateValue = versie[datumProperty] || '';
      // Strip timestamp if present (e.g., "2026-01-01 00:00:00" -> "2026-01-01")
      return dateValue ? dateValue.split(' ')[0] : '';
    };

    // Add a new version row
    const addVersie = () => {
      const currentVersions = getVersions();
      const updatedVersions = [...currentVersions, { ...schemaDefaults }];
      setApplicatieData('moduleVersies', updatedVersions);
    };

    // Remove a version row
    const removeVersie = (versionIndex) => {
      const currentVersions = getVersions();
      if (currentVersions.length <= 1) return;
      const updatedVersions = [...currentVersions];
      updatedVersions.splice(versionIndex, 1);
      setApplicatieData('moduleVersies', updatedVersions);
    };

    const versions = getVersions();

    return (
      <AcFlex column spacing='sm'>
        <h2 id='versie-section-title' className='sr-only'>
          Laat weten welke versies er zijn
        </h2>
        <Paragraph className='con-form-wizard-paragraph'>
          Versie-informatie laat zien hoe actueel uw applicatie is. Gemeenten
          gebruiken deze informatie voor beheer, planning en impactanalyses. Vermeld
          het versienummer, de status en een korte beschrijving.
        </Paragraph>

        {/* Closeable info alert about updating versie details later */}
        {showInfoAlert && (
          <Alert severity='info' className='ac-forms-info-alert'>
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
                <span className='ac-forms-product-info-alert__text'>
                  Hier vult u de basisinformatie in over de on-premise versie van uw
                  applicatie. Voor gehoste applicaties wordt een default versie
                  aangemaakt. Na het opslaan kunt u op de detailpagina van elke
                  versie extra informatie toevoegen. Deze vindt u onder het tabblad
                  &quot;Versies&quot; van uw applicatie.
                </span>
              </div>
            </div>
          </Alert>
        )}

        <AcFlex column spacing='sm' className='con-form-wizard-rows'>
          {versions.map((versie, versionIndex) => {
            const datumProperty = versie.status
              ? getDatumPropertyName(versie.status)
              : null;
            const datumValue = getCurrentDateValue(versie);

            return (
              <div
                key={`version-${versionIndex}`}
                className='ac-register-form-section'
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                }}
              >
                {/* Grid: Versie - Status - Startdatum on first row, Beschrijving and Delete on second row */}
                <div
                  className='ac-register-form-grid'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Versie field */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='moduleversie'
                      schemaProperty='versie'
                      value={versie.versie ?? ''}
                      onChange={(value) =>
                        updateVersieAt(versionIndex, 'versie', value)
                      }
                      isDisabled={loading}
                      schemas={schemas}
                      customProps={{
                        labelStyle: { fontSize: '1rem' },
                      }}
                    />
                  </div>

                  {/* Status field */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='moduleversie'
                      schemaProperty='status'
                      value={versie.status ?? ''}
                      onChange={(value) =>
                        updateVersieAt(versionIndex, 'status', value)
                      }
                      isDisabled={loading}
                      schemas={schemas}
                      customProps={{
                        labelStyle: { fontSize: '16px' },
                      }}
                    />
                  </div>

                  {/* Startdatum Status field - shown when a status is selected */}
                  {versie.status && datumProperty ? (
                    <div>
                      <ConSchemaEnhancedField
                        schemaType='moduleversie'
                        schemaProperty={datumProperty}
                        value={datumValue}
                        onChange={(value) =>
                          updateVersieAt(versionIndex, datumProperty, value)
                        }
                        isDisabled={loading}
                        schemas={schemas}
                        customProps={{
                          label: getDatumLabel(versie.status),
                          labelStyle: { fontSize: '1rem' },
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <ConSchemaEnhancedField
                        schemaType='moduleversie'
                        schemaProperty='datumInGebruik'
                        value=''
                        onChange={() => {}}
                        isDisabled={true}
                        schemas={schemas}
                        customProps={{
                          required: true,
                          label: 'Startdatum Status',
                          placeholder: 'Selecteer eerst een status',
                          labelStyle: { fontSize: '1rem' },
                        }}
                      />
                    </div>
                  )}

                  {/* Korte omschrijving field */}
                  <div>
                    <ConSchemaEnhancedField
                      schemaType='moduleversie'
                      schemaProperty='beschrijvingKort'
                      value={versie.beschrijvingKort ?? ''}
                      onChange={(value) =>
                        updateVersieAt(versionIndex, 'beschrijvingKort', value)
                      }
                      isDisabled={loading}
                      schemas={schemas}
                      customProps={{
                        labelStyle: { fontSize: '1rem' },
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
                      icon={<VISUALS.TRASHCAN />}
                      disabled={versions.length <= 1 || loading}
                      onClick={() => removeVersie(versionIndex)}
                      title='Versie verwijderen'
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
          onClick={addVersie}
          disabled={loading}
        >
          Nieuwe versie toevoegen
        </AcButton>
      </AcFlex>
    );
  }
);

ConFormApplicatieVersieStage.displayName = 'ConFormApplicatieVersieStage';

export default ConFormApplicatieVersieStage;
