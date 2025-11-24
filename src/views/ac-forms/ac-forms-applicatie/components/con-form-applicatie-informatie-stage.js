import React, { memo } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * Applicatie Informatie Form Component
 *
 * This step collects basic information about the application.
 *
 * Features:
 * - Application name (required)
 * - Website
 * - Short description (beschrijvingKort)
 * - Long description (beschrijvingLang)
 * - Contact person (contactpersoon)
 * - Logo
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration
 * @param {Array} contactpersoonOptions - Options for contactpersoon dropdown
 * @param {boolean} contactpersoonLoading - Loading state for contactpersoon options
 * @param {boolean} contactpersoonSearchLoading - Loading state for contactpersoon search
 * @param {Function} searchContactpersonen - Search function for contactpersonen
 */
const ConFormApplicatieInformatieStage = memo(
  ({
    applicatie,
    setApplicatieData,
    loading,
    touched,
    schemas,
    contactpersoonOptions = [],
    contactpersoonLoading = false,
    contactpersoonSearchLoading = false,
    searchContactpersonen,
  }) => {
    return (
      <div role='group' aria-labelledby='applicatie-info-section-title'>
        <h2 id='applicatie-info-section-title' className='sr-only'>
          Informatie over uw applicatie
        </h2>
        <Paragraph className='con-form-wizard-paragraph'>
          De opgevoerde gegevens zorgen ervoor dat gemeenten uw applicatie kunnen
          vinden, herkennen en toevoegen aan haar applicatielandschap. Vul de velden
          zo volledig mogelijk in, zodat uw applicatie goed zichtbaar is in de
          softwarecatalogus.
          <br />
          Na het opslaan kunt u de gegevens later altijd weer aanpassen of aanvullen.
        </Paragraph>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Application Name and Website on same row */}
            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='naam'
              value={applicatie.naam || ''}
              touched={touched}
              onChange={(value) => setApplicatieData('naam', value)}
              isDisabled={loading}
              width='half'
              customProps={{
                required: true,
                placeholder: 'Naam van de applicatie',
                description: 'Naam van uw applicatie',
              }}
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='website'
              value={applicatie.website || ''}
              onChange={(value) => setApplicatieData('website', value)}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
              customProps={{
                inputType: 'text',
                validation: {
                  custom: (value) => {
                    if (!value || String(value).trim() === '') return true;
                    const website = String(value).trim();
                    return validateWebsite(website);
                  },
                  customErrorMessage:
                    'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)',
                },
                description: 'Een URL naar uw applicatie of organisatie',
              }}
            />

            {/* Short Description (korteOmschrijving) */}
            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='beschrijvingKort'
              value={applicatie.beschrijvingKort || ''}
              onChange={(value) => setApplicatieData('beschrijvingKort', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              customProps={{
                description:
                  'Een korte beschrijving van de applicatie voor o.a. in de zoekresultaten.',
              }}
            />

            {/* Long Description (uitgebreideOmschrijving) */}
            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='beschrijvingLang'
              value={applicatie.beschrijvingLang || ''}
              onChange={(value) => setApplicatieData('beschrijvingLang', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              customProps={{
                description:
                  'Een uitgebreide omschrijving van uw applicatie. Dit kan met mark down opgemaakt worden.',
              }}
            />

            {/* Logo and Contact Person on same row */}
            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='logo'
              value={applicatie.logo}
              onChange={(value) => setApplicatieData('logo', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                inputType: 'file',
                format: 'base64',
                description: 'Het logo van de applicatie of de organisatie.',
              }}
            />

            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='contactpersoon'
              value={applicatie.contactpersoon || ''}
              onChange={(value) => {
                setApplicatieData('contactpersoon', value);
              }}
              isDisabled={loading}
              isLoading={contactpersoonLoading || contactpersoonSearchLoading}
              width='half'
              schemas={schemas}
              optionsProvider={contactpersoonOptions}
              onSearch={(_path, _refSlug, q) =>
                searchContactpersonen && searchContactpersonen(q || '')
              }
              customProps={{
                getOptionLabel: (opt) => {
                  const c = opt?.data ?? opt;
                  const fullName = [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
                    .filter(Boolean)
                    .join(' ');

                  if (fullName.trim()) {
                    return fullName;
                  }

                  return (
                    c?.['@self']?.name ||
                    c?.naam ||
                    c?.name ||
                    c?.displayName ||
                    c?.label ||
                    c?.id ||
                    'Onbekende contactpersoon'
                  );
                },
                isClearable: true,
                description: 'Selecteer de contactpersoon voor deze applicatie',
                placeholder: 'Zoek en selecteer contactpersoon',
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatieInformatieStage.displayName = 'ConFormApplicatieInformatieStage';

export default ConFormApplicatieInformatieStage;
