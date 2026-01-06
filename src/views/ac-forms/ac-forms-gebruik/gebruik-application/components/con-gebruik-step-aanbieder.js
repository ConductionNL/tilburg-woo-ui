import React, { memo, useEffect, useRef } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import {
  validateWebsite,
  validateEmail,
  validatePhone,
} from '@views/ac-forms/validation/form-validations';

/**
 * Aanbieder Step Component for Gebruik Form
 *
 * This step allows users to either select an existing organization or create a new one
 * when the type is 'ontbrekend-organisatie'. The selected organization is saved to gebruik.afnemer.
 *
 * Features:
 * - Radio button choice between existing and new organization
 * - Searchable dropdown for existing organizations
 * - Full form for creating new organization based on organisatie schema
 *
 * @param {Object} gebruik - The gebruik object containing form data
 * @param {Function} setGebruikData - Function to update gebruik data
 * @param {Object} afnemerOrganisatie - The organization object for creating new organization
 * @param {Function} setAfnemerOrganisatieData - Function to update organization data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration (organisatie schema)
 * @param {string} afnemerKeuze - Choice between 'bestaand' or 'nieuw'
 * @param {Array} afnemerOptions - Options for existing organizations dropdown
 * @param {boolean} afnemerLoading - Loading state for afnemer options
 * @param {Function} searchAfnemers - Function to search for organizations
 */
const ConGebruikStepAanbieder = memo(
  ({
    gebruik,
    setGebruikData,
    afnemerOrganisatie,
    setAfnemerOrganisatieData,
    loading,
    schemas,
    afnemerKeuze,
    afnemerOptions,
    afnemerLoading,
    searchAfnemers,
  }) => {
    // Track previous afnemerKeuze to detect actual changes (not just remounts)
    const previousAfnemerKeuze = useRef(afnemerKeuze);

    // Handle choice change between existing and new
    // Only clear fields when the choice actually changes, not on component mount/remount
    useEffect(() => {
      // Skip if this is the first render or if the choice hasn't actually changed
      if (previousAfnemerKeuze.current === afnemerKeuze) {
        return;
      }
      if (afnemerKeuze === 'bestaand') {
        // Clear new organization fields
        setAfnemerOrganisatieData('naam', '');
        setAfnemerOrganisatieData('type', '');
        setAfnemerOrganisatieData('website', '');
        setAfnemerOrganisatieData('e-mailadres', '');
        setAfnemerOrganisatieData('telefoonnummer', '');
        // Don't auto-set afnemer - let user explicitly select from dropdown
        setGebruikData('afnemer', null);
      } else {
        // Clear existing organization selection
        setGebruikData('afnemer', null);
      }

      // Update the previous value
      previousAfnemerKeuze.current = afnemerKeuze;
    }, [afnemerKeuze, setGebruikData, setAfnemerOrganisatieData]);

    return (
      <div role='group' aria-labelledby='aanbieder-section-title'>
        <h2 id='aanbieder-section-title' className='sr-only'>
          Afnemer informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Choice between existing and new organization - using same styling as ProductOpbouw */}
            <h3 className='utrecht-heading-3' style={{ width: '100%' }}>
              {afnemerKeuze === 'bestaand'
                ? 'Afnemer selecteren'
                : 'Afnemer aanmaken'}
            </h3>

            {/* Existing organization dropdown - using ConSchemaEnhancedField */}
            {afnemerKeuze === 'bestaand' && (
              <ConSchemaEnhancedField
                schemaType='gebruik'
                schemaProperty='afnemer'
                value={gebruik.afnemer}
                onChange={(value) => {
                  // Handle both object and string formats
                  if (!value) {
                    setGebruikData('afnemer', null);
                  } else if (
                    typeof value === 'object' &&
                    value.value !== undefined
                  ) {
                    setGebruikData('afnemer', value.value);
                  } else if (typeof value === 'string') {
                    setGebruikData('afnemer', value);
                  } else {
                    setGebruikData('afnemer', null);
                  }
                }}
                isDisabled={loading}
                isLoading={afnemerLoading}
                width='full'
                schemas={schemas}
                optionsProvider={afnemerOptions}
                onSearch={(_path, _refSlug, q) =>
                  searchAfnemers && searchAfnemers(q || '')
                }
                customProps={{
                  // placeholder will come from schema example
                  isClearable: true,
                  placeholder: 'Zoek en selecteer afnemer',
                }}
              />
            )}

            {/* New organization form fields */}
            {afnemerKeuze === 'nieuw' && (
              <>
                {/* Organization Name - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={afnemerOrganisatie.naam || ''}
                  onChange={(value) => setAfnemerOrganisatieData('naam', value)}
                  isDisabled={loading}
                  width='full'
                  // placeholder will come from schema example
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

                {/* Email Address */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='e-mailadres'
                  value={afnemerOrganisatie['e-mailadres'] || ''}
                  onChange={(value) =>
                    setAfnemerOrganisatieData('e-mailadres', value)
                  }
                  isDisabled={loading}
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
                  value={afnemerOrganisatie.telefoonnummer || ''}
                  onChange={(value) =>
                    setAfnemerOrganisatieData('telefoonnummer', value)
                  }
                  isDisabled={loading}
                  width='half'
                  customProps={{
                    inputType: 'text',
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

ConGebruikStepAanbieder.displayName = 'ConGebruikStepAanbieder';

export default ConGebruikStepAanbieder;
