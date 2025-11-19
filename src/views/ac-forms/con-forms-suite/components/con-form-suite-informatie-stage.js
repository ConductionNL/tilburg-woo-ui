import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * Suite Informatie Stage
 *
 * Fields (from schema suite):
 * - naam, contactpersoon, website, beschrijvingKort, beschrijvingLang, logo
 */
const ConFormSuiteInformatieStage = memo(
  ({ suite, setSuiteData, loading, touched, schemas }) => {
    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='suite-informatie-section-title'
      >
        <h2 id='suite-informatie-section-title' className='sr-only'>
          Suite informatie
        </h2>

        <Paragraph style={{ marginBottom: '1.5rem' }}>
          <strong>Registreer uw suite</strong>
          <br />
          In de volgende stap vult u de basisgegevens in.
          <br />
          Deze informatie helpt organisaties om snel te begrijpen welk aanbod uw
          suite omvat en hoe die binnen hun landschap past.
        </Paragraph>

        <Paragraph style={{ marginBottom: '2rem' }}>
          <strong>Basisinformatie van de suite</strong>
          <br />
          Vul de naam, contactpersoon, website en beschrijvingen in. Voeg indien
          gewenst een logo toe.
        </Paragraph>

        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='naam'
              value={suite.naam || ''}
              onChange={(value) => setSuiteData('naam', value)}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='website'
              value={suite.website || ''}
              onChange={(value) => setSuiteData('website', value)}
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
              }}
            />

            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='beschrijvingKort'
              value={suite.beschrijvingKort || ''}
              onChange={(value) => setSuiteData('beschrijvingKort', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='beschrijvingLang'
              value={suite.beschrijvingLang || ''}
              onChange={(value) => setSuiteData('beschrijvingLang', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='logo'
              value={suite.logo}
              onChange={(value) => setSuiteData('logo', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              customProps={{ inputType: 'file', format: 'base64' }}
            />

            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='contactpersoon'
              value={suite.contactpersoon || ''}
              onChange={(value) => setSuiteData('contactpersoon', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                getOptionLabel: (opt) => {
                  const c = opt?.data ?? opt;
                  // Try different name combinations for contactpersoon
                  const fullName = [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
                    .filter(Boolean)
                    .join(' ');

                  // Fallback to other name properties if voornaam/achternaam not available
                  if (fullName.trim()) {
                    return fullName;
                  }

                  // Try alternative name properties
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
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormSuiteInformatieStage.displayName = 'ConFormSuiteInformatieStage';

export default ConFormSuiteInformatieStage;
