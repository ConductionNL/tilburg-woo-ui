import React, { memo, useEffect } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import {
  validateWebsite,
  validateEmail,
  validatePhone,
} from '@views/ac-forms/validation/form-validations';

/**
 * Aanbieder Informatie Form Component for Koppeling
 *
 * This step allows users to either select an existing organization or create a new one
 * when registering a koppeling with type=aanbieden-koppeling.
 *
 * Features:
 * - Choice between existing and new organization
 * - Searchable dropdown for existing organizations
 * - Full form for creating new organization based on organisatie schema
 *
 * Only shown when koppelingsType === 'aanbieden-koppeling'
 *
 * @param {Object} aanbieder - The aanbieder value (UUID string or null)
 * @param {Function} setAanbieder - Function to update aanbieder value
 * @param {Object} aanbiederOrganisatie - The organization object for creating new organization
 * @param {Function} setAanbiederOrganisatieData - Function to update organization data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration (koppeling and organisatie schemas)
 * @param {boolean} schemasLoading - Loading state for schemas
 * @param {string} aanbiederKeuze - Choice between 'bestaand' or 'nieuw'
 * @param {Function} setAanbiederKeuze - Function to update choice
 * @param {Array} organisatieOptions - Options for existing organizations
 * @param {boolean} organisatieLoading - Loading state for organizations
 * @param {Function} searchOrganisaties - Function to search organizations
 */
const ConKoppelingStageAanbieder = memo(
  ({
    aanbieder,
    setAanbieder,
    aanbiederOrganisatie,
    setAanbiederOrganisatieData,
    loading,
    schemas,
    schemasLoading,
    aanbiederKeuze,
    organisatieOptions,
    organisatieLoading,
    searchOrganisaties,
  }) => {
    // Handle choice change between existing and new
    const handleChoiceChange = () => {
      if (aanbiederKeuze === 'bestaand') {
        // Clear new organization fields
        setAanbiederOrganisatieData('naam', '');
        setAanbiederOrganisatieData('type', '');
        setAanbiederOrganisatieData('website', '');
        setAanbiederOrganisatieData('e-mailadres', '');
        setAanbiederOrganisatieData('telefoonnummer', '');
      } else {
        // Clear existing organization selection
        setAanbieder(null);
      }
    };

    useEffect(handleChoiceChange, [aanbiederKeuze]);

    return (
      <div role='group' aria-labelledby='aanbieder-section-title'>
        <h2 id='aanbieder-section-title' className='sr-only'>
          Aanbieder informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>

            {/* Existing organization dropdown */}
            {aanbiederKeuze === 'bestaand' && (
              <div style={{ gridColumn: 'span 2' }}>
                <ConSchemaEnhancedField
                  schemaType='koppeling'
                  schemaProperty='aanbieder'
                  value={aanbieder}
                  onChange={(value) => {
                    // Handle both object and string formats
                    if (!value) {
                      setAanbieder(null);
                    } else if (
                      typeof value === 'object' &&
                      value.value !== undefined
                    ) {
                      setAanbieder(value.value);
                    } else if (typeof value === 'string') {
                      setAanbieder(value);
                    } else {
                      setAanbieder(null);
                    }
                  }}
                  isDisabled={loading || schemasLoading}
                  width='full'
                  schemas={schemas}
                  optionsProvider={organisatieOptions}
                  isLoading={organisatieLoading || schemasLoading}
                  onSearch={(_path, _refSlug, q) => searchOrganisaties(q)}
                  customProps={{
                    label: 'Aanbieder',
                    placeholder: 'Selecteer een aanbieder',
                    isClearable: true,
                  }}
                />
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.25rem',
                  }}
                >
                  Selecteer de organisatie die deze koppeling aanbiedt.
                </div>
              </div>
            )}

            {/* New organization form fields */}
            {aanbiederKeuze === 'nieuw' && (
              <>
                {/* Organization Name - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={aanbiederOrganisatie.naam || ''}
                  onChange={(value) => setAanbiederOrganisatieData('naam', value)}
                  isDisabled={loading || schemasLoading}
                  width='full'
                  schemas={schemas}
                />

                {/* Organization Type - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='type'
                  value={aanbiederOrganisatie.type || ''}
                  onChange={(value) => setAanbiederOrganisatieData('type', value)}
                  isDisabled={loading || schemasLoading}
                  width='half'
                  schemas={schemas}
                />

                {/* Organization Website - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='website'
                  value={aanbiederOrganisatie.website || ''}
                  onChange={(value) => setAanbiederOrganisatieData('website', value)}
                  isDisabled={loading || schemasLoading}
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

                {/* Email Address */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='e-mailadres'
                  value={aanbiederOrganisatie['e-mailadres'] || ''}
                  onChange={(value) =>
                    setAanbiederOrganisatieData('e-mailadres', value)
                  }
                  isDisabled={loading || schemasLoading}
                  width='half'
                  customProps={{
                    inputType: 'text',
                    validation: {
                      custom: (value) => {
                        if (!value || value.trim() === '') return true;
                        return !!validateEmail(value.trim());
                      },
                      customErrorMessage: 'Ongeldig e-mailadres',
                    },
                  }}
                  schemas={schemas}
                />

                {/* Phone Number */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='telefoonnummer'
                  value={aanbiederOrganisatie.telefoonnummer || ''}
                  onChange={(value) =>
                    setAanbiederOrganisatieData('telefoonnummer', value)
                  }
                  isDisabled={loading || schemasLoading}
                  width='half'
                  customProps={{
                    validation: {
                      custom: (value) => {
                        if (!value || value.trim() === '') return true;
                        return validatePhone(value.trim());
                      },
                      customErrorMessage:
                        'Ongeldig telefoonnummer. (+31 6 1234 5678)',
                    },
                  }}
                  schemas={schemas}
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ConKoppelingStageAanbieder.displayName = 'ConKoppelingStageAanbieder';

export default ConKoppelingStageAanbieder;
