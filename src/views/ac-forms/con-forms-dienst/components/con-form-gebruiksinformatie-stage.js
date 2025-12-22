import React, { memo, useState, useMemo, useEffect } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * ConFormGebruiksinformatieStage
 * Renders the "Gebruiksinformatie" step of the Dienst wizard for gebruik beheerder flow.
 * Shows status and interne notitie fields.
 */
const ConFormGebruiksinformatieStage = ({
  status,
  setStatus,
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

  // Set default status to "In productie" if not set
  useEffect(() => {
    if (!status && !isEditMode) {
      setStatus('In productie');
    }
  }, [status, isEditMode, setStatus]);

  // Manage visibility state of info alert
  // Alert persists as closed for the session after user closes it (via sessionStorage).
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('dienst-gebruiksinformatie-info-alert-closed');
  });

  // Mark the alert as closed for the session and update state.
  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('dienst-gebruiksinformatie-info-alert-closed', 'true');
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
        U kunt hier de status van de dienst aangeven en een interne notitie en
        toevoegen voor uw collega&apos;s.
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
                De interne notitie is alleen te lezen door gebruikers binnen uw
                organisatie.
              </span>
            </div>
          </div>
        </Alert>
      )}

      <div className='ac-register-form-grid'>
        {/* Status field */}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='status'
            value={status || ''}
            onChange={setStatus}
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

export default memo(ConFormGebruiksinformatieStage);
