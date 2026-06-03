import React, { useState, memo, useEffect } from 'react';
import clsx from 'clsx';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import {
  Paragraph,
  Textbox,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';
import { AcFlex } from '@src/atoms';

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
 * Applicatie Versie Stage Component
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

    // Get moduleVersie schema for status options and defaults
    const moduleVersieSchema = schemas?.moduleversie;
    const statusOptions =
      moduleVersieSchema?.properties?.status?.enum?.map((status) => ({
        value: status,
        label:
          typeof status === 'string' && status.length > 0
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : status,
      })) || [];

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
      updatedVersions[versionIndex] = {
        ...updatedVersions[versionIndex],
        [field]: value,
      };
      setApplicatieData('moduleVersies', updatedVersions);
    };

    // Handle status change with automatic datum logic
    const handleStatusChange = (versionIndex, newStatus) => {
      const currentVersions = getVersions();
      const currentVersion = currentVersions[versionIndex] || {};
      const newDatumProperty = getDatumPropertyName(newStatus);

      // Get current date value for the new status BEFORE any changes
      let currentDateValue = '';
      if (newDatumProperty && currentVersion[newDatumProperty]) {
        currentDateValue = currentVersion[newDatumProperty];
      }

      // Create updated version object
      const updatedVersion = { ...currentVersion, status: newStatus };

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

      // Update the version
      const updatedVersions = [...currentVersions];
      updatedVersions[versionIndex] = updatedVersion;
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
          {versions.map((versie, vIdx) => {
            const datumProperty = versie.status
              ? getDatumPropertyName(versie.status)
              : null;
            const datumValue = getCurrentDateValue(versie);

            return (
              <div
                key={`version-${vIdx}`}
                className='ac-register-form-section'
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                }}
              >
                {/* Grid: Versie - Status - Startdatum - Beschrijving */}
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
                    <label
                      className='utrecht-form-label'
                      htmlFor={`versie-versie-${vIdx}`}
                      style={{ display: 'block' }}
                    >
                      Versie
                      <span className='required-indicator' aria-hidden='true'>
                        *
                      </span>
                      <span className='sr-only'>(verplicht)</span>
                    </label>
                    <Textbox
                      id={`versie-versie-${vIdx}`}
                      value={versie.versie ?? schemaDefaults.versie ?? ''}
                      onChange={(e) =>
                        updateVersieAt(vIdx, 'versie', e.target.value)
                      }
                      placeholder={
                        schemaDefaults.versie ||
                        moduleVersieSchema?.properties?.versie?.example ||
                        '1.0.0'
                      }
                      disabled={loading}
                      aria-required='true'
                    />
                  </div>

                  {/* Status field */}
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={`versie-status-${vIdx}`}
                      style={{ display: 'block' }}
                    >
                      Status
                      <span className='required-indicator' aria-hidden='true'>
                        *
                      </span>
                      <span className='sr-only'>(verplicht)</span>
                    </label>
                    <ReactSelect
                      inputId={`versie-status-${vIdx}`}
                      className={clsx(
                        'ac-beheer-select',
                        loading && 'ac-beheer-select--disabled'
                      )}
                      value={
                        statusOptions.find(
                          (opt) =>
                            opt.value === (versie.status || schemaDefaults.status)
                        ) || null
                      }
                      onChange={(opt) =>
                        handleStatusChange(vIdx, opt?.value || null)
                      }
                      options={statusOptions}
                      isDisabled={loading}
                      placeholder={schemaDefaults.status || 'Selecteer status'}
                      aria-required='true'
                    />
                  </div>

                  {/* Startdatum Status field - shown when a status is selected */}
                  {versie.status && datumProperty ? (
                    <div>
                      <label
                        className='utrecht-form-label'
                        htmlFor={`versie-datum-${vIdx}`}
                        style={{ display: 'block' }}
                      >
                        {getDatumLabel(versie.status)}
                        <span className='required-indicator' aria-hidden='true'>
                          *
                        </span>
                        <span className='sr-only'>(verplicht)</span>
                      </label>
                      <Textbox
                        id={`versie-datum-${vIdx}`}
                        type='date'
                        value={datumValue}
                        onChange={(e) =>
                          updateVersieAt(
                            vIdx,
                            datumProperty,
                            e.target.value
                          )
                        }
                        disabled={loading}
                        style={{ height: '40px' }}
                        aria-required='true'
                      />
                    </div>
                  ) : (
                    <div>
                      <label
                        className='utrecht-form-label'
                        htmlFor={`versie-datum-placeholder-${vIdx}`}
                        style={{ display: 'block' }}
                      >
                        Startdatum Status
                        <span className='required-indicator' aria-hidden='true'>
                          *
                        </span>
                        <span className='sr-only'>(verplicht)</span>
                      </label>
                      <Textbox
                        id={`versie-datum-placeholder-${vIdx}`}
                        type='date'
                        value=''
                        disabled
                        placeholder='Selecteer eerst een status'
                        style={{ height: '40px' }}
                        aria-required='true'
                      />
                    </div>
                  )}

                  {/* Korte omschrijving field */}
                  <div>
                    <label
                      className='utrecht-form-label'
                      htmlFor={`versie-beschrijving-${vIdx}`}
                      style={{ display: 'block' }}
                    >
                      Korte omschrijving
                    </label>
                    <Textbox
                      id={`versie-beschrijving-${vIdx}`}
                      value={versie.beschrijvingKort || ''}
                      onChange={(e) =>
                        updateVersieAt(vIdx, 'beschrijvingKort', e.target.value)
                      }
                      placeholder='Korte beschrijving van deze versie'
                      disabled={loading}
                    />
                  </div>
                  <div></div>
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
                      onClick={() => removeVersie(vIdx)}
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
