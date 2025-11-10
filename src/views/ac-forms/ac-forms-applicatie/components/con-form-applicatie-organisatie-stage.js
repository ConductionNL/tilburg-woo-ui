import React, { memo } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * Applicatie Organisatie Form Component
 *
 * This component allows users to create a new organization when they cannot find
 * the desired supplier in the versie stage.
 *
 * Features:
 * - Full form for creating new organization based on organisatie schema
 * - All fields are optional but follow schema validation
 *
 * @param {Object} organisatie - The organization object containing form data
 * @param {Function} setOrganisatieData - Function to update organization data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration (organisatie schema)
 */
const ConFormApplicatieOrganisatieStage = memo(
  ({ organisatie, setOrganisatieData, loading, schemas }) => {
    return (
      <div role='group' aria-labelledby='organisatie-section-title'>
        <h2 id='organisatie-section-title' className='sr-only'>
          Organisatie informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Organization Name - Required */}
            <ConSchemaEnhancedField
              schemaType='organisatie'
              schemaProperty='naam'
              value={organisatie.naam || ''}
              onChange={(value) => setOrganisatieData('naam', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            {/* Organization Type - Required */}
            <ConSchemaEnhancedField
              schemaType='organisatie'
              schemaProperty='type'
              value={organisatie.type || ''}
              onChange={(value) => setOrganisatieData('type', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* Organization Website - Required */}
            <ConSchemaEnhancedField
              schemaType='organisatie'
              schemaProperty='website'
              value={organisatie.website || ''}
              onChange={(value) => setOrganisatieData('website', value)}
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
              value={organisatie.beschrijvingKort || ''}
              onChange={(value) => setOrganisatieData('beschrijvingKort', value)}
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
              value={organisatie.beschrijvingLang || ''}
              onChange={(value) => setOrganisatieData('beschrijvingLang', value)}
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
              value={organisatie['e-mailadres'] || ''}
              onChange={(value) => setOrganisatieData('e-mailadres', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* Phone Number */}
            <ConSchemaEnhancedField
              schemaType='organisatie'
              schemaProperty='telefoonnummer'
              value={organisatie.telefoonnummer || ''}
              onChange={(value) => setOrganisatieData('telefoonnummer', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* KvK Number */}
            <ConSchemaEnhancedField
              schemaType='organisatie'
              schemaProperty='kvkNummer'
              value={organisatie.kvkNummer || ''}
              onChange={(value) => setOrganisatieData('kvkNummer', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* Logo URL */}
            <ConSchemaEnhancedField
              schemaType='organisatie'
              schemaProperty='logo'
              value={organisatie.logo || ''}
              onChange={(value) => setOrganisatieData('logo', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatieOrganisatieStage.displayName = 'ConFormApplicatieOrganisatieStage';

export default ConFormApplicatieOrganisatieStage;
