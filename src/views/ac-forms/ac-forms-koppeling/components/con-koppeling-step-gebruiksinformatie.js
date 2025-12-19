import React, { memo, useState, useMemo, useEffect } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * All date property names for clearing purposes.
 */
const ALL_START_DATUM_PROPERTIES = [
  'datumInGebruik',
  'datumInOntwikkeling',
  'datumEindeOndersteuning',
  'datumTeruggetrokken',
];

/**
 * Maps status value to corresponding date property name.
 * @param {string} status - The status value (e.g., 'in gebruik', 'in ontwikkeling', etc.)
 * @returns {string|null} - The property name (e.g., 'datumInGebruik') or null if no mapping exists
 */
const getStartDatumPropertyName = (status) => {
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
const getStartDatumLabel = (status) => {
  const statusToLabelMap = {
    'in gebruik': 'Startdatum Status',
    'in ontwikkeling': 'Startdatum Status',
    'einde ondersteuning': 'Startdatum Status',
    teruggetrokken: 'Startdatum Status',
  };
  return statusToLabelMap[status] || 'Startdatum Status';
};

/**
 * Gets today's date in YYYY-MM-DD format for date input fields.
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * ConKoppelingStepGebruiksinformatie
 * Renders the "Gebruiksinformatie" step of the Koppeling wizard for gebruik beheerder flow.
 * Shows status, startdatum status, and interne notitie fields.
 */
const ConKoppelingStepGebruiksinformatie = ({
  status,
  setStatus,
  datumInGebruik,
  setDatumInGebruik,
  datumInOntwikkeling,
  setDatumInOntwikkeling,
  datumEindeOndersteuning,
  setDatumEindeOndersteuning,
  datumTeruggetrokken,
  setDatumTeruggetrokken,
  interneAantekening,
  setInterneAantekening,
  loading,
  schemas,
  isEditMode = false,
}) => {
  // Derive status options from schema enum
  const statusOptions = useMemo(() => {
    const koppelingSchema = schemas?.koppeling;
    const statusProperty = koppelingSchema?.properties?.status;
    if (statusProperty?.enum && Array.isArray(statusProperty.enum)) {
      return statusProperty.enum.map((value) => ({
        value,
        label: value,
      }));
    }
    // Fallback to hardcoded options
    return [
      { value: 'in ontwikkeling', label: 'In ontwikkeling' },
      { value: 'in gebruik', label: 'In gebruik' },
      { value: 'einde ondersteuning', label: 'Einde ondersteuning' },
      { value: 'teruggetrokken', label: 'Teruggetrokken' },
    ];
  }, [schemas?.koppeling]);

  // Set default status to "in gebruik" if not set
  useEffect(() => {
    if (!status && !isEditMode) {
      setStatus('in gebruik');
    }
  }, [status, isEditMode, setStatus]);

  // Manage visibility state of info alert
  // Alert persists as closed for the session after user closes it (via sessionStorage).
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('koppeling-gebruiksinformatie-info-alert-closed');
  });

  // Mark the alert as closed for the session and update state.
  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-gebruiksinformatie-info-alert-closed', 'true');
  };

  // Get current date value based on status
  const getCurrentDateValue = () => {
    const propertyName = getStartDatumPropertyName(status);
    if (!propertyName) return '';
    switch (propertyName) {
      case 'datumInGebruik':
        return datumInGebruik || '';
      case 'datumInOntwikkeling':
        return datumInOntwikkeling || '';
      case 'datumEindeOndersteuning':
        return datumEindeOndersteuning || '';
      case 'datumTeruggetrokken':
        return datumTeruggetrokken || '';
      default:
        return '';
    }
  };

  // Set date value based on status
  const setCurrentDateValue = (value) => {
    const propertyName = getStartDatumPropertyName(status);
    if (!propertyName) return;
    switch (propertyName) {
      case 'datumInGebruik':
        setDatumInGebruik(value);
        break;
      case 'datumInOntwikkeling':
        setDatumInOntwikkeling(value);
        break;
      case 'datumEindeOndersteuning':
        setDatumEindeOndersteuning(value);
        break;
      case 'datumTeruggetrokken':
        setDatumTeruggetrokken(value);
        break;
    }
  };

  // Handle status change
  const handleStatusChange = (value) => {
    const newStartDatumProperty = getStartDatumPropertyName(value);

    // Get current date value for the new status before clearing
    let currentDateValue = '';
    if (newStartDatumProperty) {
      switch (newStartDatumProperty) {
        case 'datumInGebruik':
          currentDateValue = datumInGebruik || '';
          break;
        case 'datumInOntwikkeling':
          currentDateValue = datumInOntwikkeling || '';
          break;
        case 'datumEindeOndersteuning':
          currentDateValue = datumEindeOndersteuning || '';
          break;
        case 'datumTeruggetrokken':
          currentDateValue = datumTeruggetrokken || '';
          break;
      }
    }

    setStatus(value);

    if (!isEditMode) {
      // In create mode: clear all other date fields, only keep the one for current status
      ALL_START_DATUM_PROPERTIES.forEach((property) => {
        if (property !== newStartDatumProperty) {
          switch (property) {
            case 'datumInGebruik':
              setDatumInGebruik('');
              break;
            case 'datumInOntwikkeling':
              setDatumInOntwikkeling('');
              break;
            case 'datumEindeOndersteuning':
              setDatumEindeOndersteuning('');
              break;
            case 'datumTeruggetrokken':
              setDatumTeruggetrokken('');
              break;
          }
        }
      });
    }

    // Set the corresponding date to today if not already set
    if (newStartDatumProperty && !currentDateValue) {
      switch (newStartDatumProperty) {
        case 'datumInGebruik':
          setDatumInGebruik(getTodayDateString());
          break;
        case 'datumInOntwikkeling':
          setDatumInOntwikkeling(getTodayDateString());
          break;
        case 'datumEindeOndersteuning':
          setDatumEindeOndersteuning(getTodayDateString());
          break;
        case 'datumTeruggetrokken':
          setDatumTeruggetrokken(getTodayDateString());
          break;
      }
    }
  };

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='gebruiksinformatie-title'
    >
      <h2 id='gebruiksinformatie-title' className='sr-only'>
        Gebruiksinformatie
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Selecteer de status. Ook kunt u een interne notitie toevoegen voor uw
        collega's.
      </Paragraph>

      {/* Closeable info alert about interne notitie */}
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
        {/* Status field */}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='koppeling'
            schemaProperty='status'
            value={status || ''}
            onChange={handleStatusChange}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            optionsProvider={statusOptions}
            customProps={{
              label: 'Status',
              placeholder: 'Selecteer status',
            }}
          />
        </div>

        {/* Startdatum Status field - shown when a status is selected */}
        {status && getStartDatumPropertyName(status) && (
          <div style={{ gridColumn: 'span 2' }}>
            <ConSchemaEnhancedField
              schemaType='koppeling'
              schemaProperty={getStartDatumPropertyName(status)}
              value={getCurrentDateValue() || getTodayDateString()}
              onChange={(value) => setCurrentDateValue(value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                label: getStartDatumLabel(status),
                description: `De startdatum voor de status "${status}"`,
              }}
            />
          </div>
        )}

        {/* Interne notitie field */}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='koppeling'
            schemaProperty='interneAantekening'
            value={interneAantekening || ''}
            onChange={(value) => setInterneAantekening(value)}
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

export default memo(ConKoppelingStepGebruiksinformatie);
