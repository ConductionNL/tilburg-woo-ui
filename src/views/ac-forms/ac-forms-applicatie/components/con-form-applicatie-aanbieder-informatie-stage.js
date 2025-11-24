import React, { memo, useEffect, useRef } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import {
  validateWebsite,
  validateEmail,
  validatePhone,
} from '@views/ac-forms/validation/form-validations';

/**
 * Aanbieder Informatie Form Component
 *
 * This step allows users to either select an existing organization or create a new one
 * when registering a missing applicatie (type=ontbrekend-applicatie).
 *
 * Features:
 * - Radio button choice between existing and new organization
 * - Searchable dropdown for existing organizations
 * - Full form for creating new organization based on organisatie schema
 *
 * Only shown when formType === 'ontbrekend-applicatie'
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {Object} aanbiederOrganisatie - The organization object for creating new organization
 * @param {Function} setAanbiederOrganisatieData - Function to update organization data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration (organisatie schema)
 * @param {string} aanbiederKeuze - Choice between 'bestaand' or 'nieuw'
 * @param {Function} setAanbiederKeuze - Function to update choice
 * @param {Array} aanbiederOptions - Options for aanbieder dropdown
 * @param {boolean} aanbiederLoading - Loading state for aanbieder options
 * @param {boolean} aanbiederSearchLoading - Loading state for aanbieder search
 * @param {Function} searchAanbieders - Debounced search function for organisaties (for typing)
 * @param {Function} searchAanbiedersImmediate - Non-debounced search function for organisaties (for clearing)
 */
const ConFormApplicatieAanbiederInformatieStage = memo(
  ({
    applicatie,
    setApplicatieData,
    aanbiederOrganisatie,
    setAanbiederOrganisatieData,
    loading,
    schemas,
    aanbiederKeuze,
    aanbiederOptions = [],
    aanbiederLoading = false,
    aanbiederSearchLoading = false,
    searchAanbieders,
  }) => {
    // Track previous aanbiederKeuze to detect actual changes (not just remounts)
    const previousAanbiederKeuze = useRef(aanbiederKeuze);

    // Handle choice change between existing and new
    // Only clear fields when the choice actually changes, not on component mount/remount
    useEffect(() => {
      // Skip if this is the first render or if the choice hasn't actually changed
      if (previousAanbiederKeuze.current === aanbiederKeuze) {
        return;
      }

      if (aanbiederKeuze === 'bestaand') {
        // Clear new organization fields when switching to existing
        setAanbiederOrganisatieData('naam', '');
        setAanbiederOrganisatieData('type', '');
        setAanbiederOrganisatieData('website', '');
        setAanbiederOrganisatieData('e-mailadres', '');
        setAanbiederOrganisatieData('telefoonnummer', '');
        // Clear the selected aanbieder when switching FROM nieuw TO bestaand
        setApplicatieData('aanbieder', null);
      } else {
        // Clear existing organization selection when switching to new
        setApplicatieData('aanbieder', null);
      }

      // Update the previous value
      previousAanbiederKeuze.current = aanbiederKeuze;
    }, [aanbiederKeuze, setApplicatieData, setAanbiederOrganisatieData]);

    return (
      <div role='group' aria-labelledby='aanbieder-section-title'>
        <h2 id='aanbieder-section-title' className='sr-only'>
          Aanbieder informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Choice between existing and new organization - using same styling as ProductOpbouw */}
            <div className='con-form-field-wrapper field-size-full'>
              <h3>Aanbieder selecteren</h3>
            </div>

            {/* Existing organization dropdown - using ConSchemaEnhancedField */}
            {aanbiederKeuze === 'bestaand' && (
              <ConSchemaEnhancedField
                schemaType='module'
                required={true}
                schemaProperty='aanbieder'
                value={applicatie.aanbieder}
                onChange={(value) => { 
                  setApplicatieData('aanbieder', value);
                }}
                isDisabled={loading}
                isLoading={aanbiederLoading || aanbiederSearchLoading}
                width='full'
                schemas={schemas}
                optionsProvider={aanbiederOptions}
                onSearch={(_path, _refSlug, q) =>
                  searchAanbieders && searchAanbieders(q || '')
                }
                customProps={{
                  // placeholder will come from schema example
                  isClearable: true,
                  placeholder: 'Zoek en selecteer aanbieder',
                }}
              />
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
                  isDisabled={loading}
                  width='full'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Organization Type - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='type'
                  value={aanbiederOrganisatie.type || ''}
                  onChange={(value) => setAanbiederOrganisatieData('type', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />

                {/* Organization Website - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='website'
                  value={aanbiederOrganisatie.website || ''}
                  onChange={(value) => setAanbiederOrganisatieData('website', value)}
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
                  value={aanbiederOrganisatie['e-mailadres'] || ''}
                  onChange={(value) =>
                    setAanbiederOrganisatieData('e-mailadres', value)
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
                  value={aanbiederOrganisatie.telefoonnummer || ''}
                  onChange={(value) =>
                    setAanbiederOrganisatieData('telefoonnummer', value)
                  }
                  isDisabled={loading}
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

ConFormApplicatieAanbiederInformatieStage.displayName =
  'ConFormApplicatieAanbiederInformatieStage';

export default ConFormApplicatieAanbiederInformatieStage;
