import React, { memo, useState, useMemo, useEffect } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * All date property names for clearing purposes.
 */
const ALL_START_DATUM_PROPERTIES = [
  'startDatumInProductie',
  'startDatumGepland',
  'startDatumUitTeFaseren',
  'startDatumUitGefaseerd',
  'startDatumVerwerving',
];

/**
 * Maps status value to corresponding date property name.
 * @param {string} status - The status value (e.g., 'In productie', 'Gepland', etc.)
 * @returns {string|null} - The property name (e.g., 'startDatumInProductie') or null if no mapping exists
 */
const getStartDatumPropertyName = (status) => {
  const statusToPropertyMap = {
    'In productie': 'startDatumInProductie',
    Gepland: 'startDatumGepland',
    'Uit te faseren': 'startDatumUitTeFaseren',
    Uitgefaseerd: 'startDatumUitGefaseerd',
    Verwerving: 'startDatumVerwerving',
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
  startDatumInProductie,
  setStartDatumInProductie,
  startDatumGepland,
  setStartDatumGepland,
  startDatumUitTeFaseren,
  setStartDatumUitTeFaseren,
  startDatumUitGefaseerd,
  setStartDatumUitGefaseerd,
  startDatumVerwerving,
  setStartDatumVerwerving,
  interneAantekening,
  setInterneAantekening,
  loading,
  schemas,
  isEditMode = false,
}) => {
  // Derive status options from schema enum
  const statusOptions = useMemo(() => {
    const gebruikSchema = schemas?.gebruik;
    const statusProperty = gebruikSchema?.properties?.status;
    if (statusProperty?.enum && Array.isArray(statusProperty.enum)) {
      return statusProperty.enum.map((value) => ({
        value,
        label: value,
      }));
    }
    // Fallback to hardcoded options (gebruik status values)
    return [
      { value: 'Verwerving', label: 'Verwerving' },
      { value: 'Gepland', label: 'Gepland' },
      { value: 'In productie', label: 'In productie' },
      { value: 'Uit te faseren', label: 'Uit te faseren' },
      { value: 'Uitgefaseerd', label: 'Uitgefaseerd' },
    ];
  }, [schemas?.gebruik]);

  // Set default status to "In productie" and corresponding date if not set
  useEffect(() => {
    if (!status && !isEditMode) {
      setStatus('In productie');
      // Also set the corresponding start date to today
      if (!startDatumInProductie) {
        setStartDatumInProductie(getTodayDateString());
      }
    }
  }, [status, isEditMode, startDatumInProductie]);

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
      case 'startDatumInProductie':
        return startDatumInProductie || '';
      case 'startDatumGepland':
        return startDatumGepland || '';
      case 'startDatumUitTeFaseren':
        return startDatumUitTeFaseren || '';
      case 'startDatumUitGefaseerd':
        return startDatumUitGefaseerd || '';
      case 'startDatumVerwerving':
        return startDatumVerwerving || '';
      default:
        return '';
    }
  };

  // Set date value based on status
  const setCurrentDateValue = (value) => {
    const propertyName = getStartDatumPropertyName(status);
    if (!propertyName) return;
    switch (propertyName) {
      case 'startDatumInProductie':
        setStartDatumInProductie(value);
        break;
      case 'startDatumGepland':
        setStartDatumGepland(value);
        break;
      case 'startDatumUitTeFaseren':
        setStartDatumUitTeFaseren(value);
        break;
      case 'startDatumUitGefaseerd':
        setStartDatumUitGefaseerd(value);
        break;
      case 'startDatumVerwerving':
        setStartDatumVerwerving(value);
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
        case 'startDatumInProductie':
          currentDateValue = startDatumInProductie || '';
          break;
        case 'startDatumGepland':
          currentDateValue = startDatumGepland || '';
          break;
        case 'startDatumUitTeFaseren':
          currentDateValue = startDatumUitTeFaseren || '';
          break;
        case 'startDatumUitGefaseerd':
          currentDateValue = startDatumUitGefaseerd || '';
          break;
        case 'startDatumVerwerving':
          currentDateValue = startDatumVerwerving || '';
          break;
      }
    }

    setStatus(value);

    if (!isEditMode) {
      // In create mode: clear all other date fields, only keep the one for current status
      ALL_START_DATUM_PROPERTIES.forEach((property) => {
        if (property !== newStartDatumProperty) {
          switch (property) {
            case 'startDatumInProductie':
              setStartDatumInProductie('');
              break;
            case 'startDatumGepland':
              setStartDatumGepland('');
              break;
            case 'startDatumUitTeFaseren':
              setStartDatumUitTeFaseren('');
              break;
            case 'startDatumUitGefaseerd':
              setStartDatumUitGefaseerd('');
              break;
            case 'startDatumVerwerving':
              setStartDatumVerwerving('');
              break;
          }
        }
      });
    }

    // Set the corresponding date to today if not already set
    if (newStartDatumProperty && !currentDateValue) {
      switch (newStartDatumProperty) {
        case 'startDatumInProductie':
          setStartDatumInProductie(getTodayDateString());
          break;
        case 'startDatumGepland':
          setStartDatumGepland(getTodayDateString());
          break;
        case 'startDatumUitTeFaseren':
          setStartDatumUitTeFaseren(getTodayDateString());
          break;
        case 'startDatumUitGefaseerd':
          setStartDatumUitGefaseerd(getTodayDateString());
          break;
        case 'startDatumVerwerving':
          setStartDatumVerwerving(getTodayDateString());
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
        collega&apos;s.
      </Paragraph>

      {/* Closeable info alert about interne notitie */}
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
        <div>
          <ConSchemaEnhancedField
            schemaType='gebruik'
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
          <div>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              inputStyle={{ height: '40px', minHeight: '40px' }}
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
            schemaType='gebruik'
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
