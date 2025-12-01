import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepInformatie
 * Renders the "Gebruik informatie" step of the Gebruik wizard.
 * Shows hosting (filtered from applicatie), status, and interneNotitie fields.
 */
const ConGebruikStepInformatie = ({
  gebruik,
  setGebruikData,
  loading,
  schemas,
  applicatieKeuze,
  selectedApplicatieData,
  setNieuweApplicatieData,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='info-title'
    >
      <h2 id='info-title' className='sr-only'>
        Informatie
      </h2>

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

        {/* Status field */}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='status'
            value={gebruik?.status || ''}
            onChange={(value) => setGebruikData('status', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />
        </div>

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
