import React, { memo, useEffect } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * ConAfnemerOrganisatieForm
 * Renders the form fields for creating a new organization when afnemerKeuze === 'nieuw'
 */
const ConAfnemerOrganisatieForm = memo(
  ({ afnemerOrganisatie, setAfnemerOrganisatieData, loading, schemas }) => {
    return (
      <div className='con-dynamic-form-container'>
        <div className='con-form-fields-container'>
          {/* Organization Name - Required */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='naam'
            value={afnemerOrganisatie.naam || ''}
            onChange={(value) => setAfnemerOrganisatieData('naam', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />

          {/* Organization Type - Required */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='type'
            value={afnemerOrganisatie.type || ''}
            onChange={(value) => setAfnemerOrganisatieData('type', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* Organization Website - Required */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='website'
            value={afnemerOrganisatie.website || ''}
            onChange={(value) => setAfnemerOrganisatieData('website', value)}
            isDisabled={loading}
            width='half'
            customProps={{
              inputType: 'text',
              required: true,
              validation: {
                custom: (value) => {
                  if (!value || value.trim() === '') return true;
                  const website = value.trim();
                  return validateWebsite(website);
                },
                customErrorMessage:
                  'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)',
              },
            }}
            schemas={schemas}
          />

          {/* Short Description */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='beschrijvingKort'
            value={afnemerOrganisatie.beschrijvingKort || ''}
            onChange={(value) =>
              setAfnemerOrganisatieData('beschrijvingKort', value)
            }
            isDisabled={loading}
            width='full'
            customProps={{
              maxLength: 255,
            }}
            schemas={schemas}
          />

          {/* Long Description */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='beschrijvingLang'
            value={afnemerOrganisatie.beschrijvingLang || ''}
            onChange={(value) =>
              setAfnemerOrganisatieData('beschrijvingLang', value)
            }
            isDisabled={loading}
            width='full'
            customProps={{
              component: 'AcTextarea',
              rows: 4,
              maxLength: 5000,
            }}
            schemas={schemas}
          />

          {/* Email Address */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='e-mailadres'
            value={afnemerOrganisatie['e-mailadres'] || ''}
            onChange={(value) => setAfnemerOrganisatieData('e-mailadres', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* Phone Number */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='telefoonnummer'
            value={afnemerOrganisatie.telefoonnummer || ''}
            onChange={(value) => setAfnemerOrganisatieData('telefoonnummer', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* KvK Number */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='kvkNummer'
            value={afnemerOrganisatie.kvkNummer || ''}
            onChange={(value) => setAfnemerOrganisatieData('kvkNummer', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* Logo URL */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='logo'
            value={afnemerOrganisatie.logo || ''}
            onChange={(value) => setAfnemerOrganisatieData('logo', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />
        </div>
      </div>
    );
  }
);

ConAfnemerOrganisatieForm.displayName = 'ConAfnemerOrganisatieForm';

/**
 * ConGebruikStepOrganisatie
 * Renders the organization (afnemer) selection/creation step.
 * Only shown when gebruikType === 'andere-organisatie'.
 */
const ConGebruikStepOrganisatie = ({
  gebruik,
  setGebruikData,
  loading,
  organisatieOptions,
  organisatieLoading,
  searchOrganisaties,
  schemas,
  gebruikType,
  afnemerKeuze,
  afnemerOrganisatie,
  setAfnemerOrganisatieData,
}) => {
  // Handle choice change between existing and new organization
  useEffect(() => {
    if (gebruikType !== 'andere-organisatie') return;

    if (afnemerKeuze === 'bestaand') {
      // Clear new organization fields
      setAfnemerOrganisatieData('naam', '');
      setAfnemerOrganisatieData('type', '');
      setAfnemerOrganisatieData('website', '');
      setAfnemerOrganisatieData('beschrijvingKort', '');
      setAfnemerOrganisatieData('beschrijvingLang', '');
      setAfnemerOrganisatieData('e-mailadres', '');
      setAfnemerOrganisatieData('telefoonnummer', '');
      setAfnemerOrganisatieData('kvkNummer', '');
      setAfnemerOrganisatieData('logo', '');
    } else {
      setGebruikData('afnemer', null);
    }
  }, [afnemerKeuze, gebruikType, setAfnemerOrganisatieData]);

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='organisatie-title'
    >
      <h2 id='organisatie-title' className='sr-only'>
        Organisatie
      </h2>

      <div className='ac-register-form-grid'>
        {/* Existing organization dropdown */}
        {afnemerKeuze === 'bestaand' && (
          <div style={{ gridColumn: 'span 2' }}>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty='afnemer'
              value={
                typeof gebruik?.afnemer === 'object' && gebruik.afnemer !== null
                  ? gebruik.afnemer.id ||
                    gebruik.afnemer['@self']?.id ||
                    gebruik.afnemer.value
                  : gebruik?.afnemer || null
              }
              onChange={(value) => {
                setGebruikData('afnemer', value);
              }}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              optionsProvider={organisatieOptions}
              isLoading={organisatieLoading}
              onSearch={(_path, _refSlug, q) => searchOrganisaties(q)}
              placeholder='Selecteer de klantorganisatie...'
            />
            <div
              style={{
                fontSize: '0.875rem',
                color: '#666',
                marginTop: '0.25rem',
              }}
            >
              Selecteer de organisatie die de applicatie gebruikt. Deze organisatie
              wordt geïnformeerd en moet het gebruik goedkeuren.
            </div>
          </div>
        )}

        {/* New organization form fields */}
        {afnemerKeuze === 'nieuw' && (
          <div style={{ gridColumn: 'span 2' }}>
            <ConAfnemerOrganisatieForm
              afnemerOrganisatie={afnemerOrganisatie}
              setAfnemerOrganisatieData={setAfnemerOrganisatieData}
              loading={loading}
              schemas={schemas}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ConGebruikStepOrganisatie);
