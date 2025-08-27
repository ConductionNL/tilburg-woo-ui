import React, { memo, useEffect } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
// import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

/**
 * Dienst Informatie Stage
 *
 * Fields (from schema dienst):
 * - naam, contactpersoon, aanbieder, website, type, beschrijvingKort, beschrijvingLang, logo
 */
const ConFormDienstInformatieStage = memo(
  ({ dienst, setDienstData, loading, touched, schemas, userStore }) => {
    // Prefill aanbieder with active organization (ID) if empty
    useEffect(() => {
      const org = userStore?.activeOrganization;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Dienst form - active organisation:', org);
      }
      if (org && !dienst.aanbieder) {
        const id = org.uuid || org.id || org.slug || '';
        if (id) setDienstData('aanbieder', id);
      }
    }, [userStore?.activeOrganization, dienst.aanbieder]);

    // Aanbieder field is hidden; value is prefilled from active organization above

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-informatie-section-title'
      >
        <h2 id='dienst-informatie-section-title' className='sr-only'>
          Dienst informatie
        </h2>

        <Paragraph style={{ marginBottom: '2rem' }}>
          <strong>Basisinformatie van de dienst</strong>
          <br />
          Vul de naam, contactpersoon, aanbieder, website, type en beschrijvingen in.
          Voeg indien gewenst een logo toe.
        </Paragraph>

        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='naam'
              value={dienst.naam || ''}
              onChange={(value) => setDienstData('naam', value)}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
            />

            {/* Aanbieder field removed from UI */}

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='website'
              value={dienst.website || ''}
              onChange={(value) => setDienstData('website', value)}
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
              schemaType='dienst'
              schemaProperty='beschrijvingKort'
              value={dienst.beschrijvingKort || ''}
              onChange={(value) => setDienstData('beschrijvingKort', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='beschrijvingLang'
              value={dienst.beschrijvingLang || ''}
              onChange={(value) => setDienstData('beschrijvingLang', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='logo'
              value={dienst.logo}
              onChange={(value) => setDienstData('logo', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              customProps={{ inputType: 'file', format: 'base64' }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='contactpersoon'
              value={dienst.contactpersoon || ''}
              onChange={(value) => setDienstData('contactpersoon', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* Aanbieder field removed from UI */}

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='type'
              value={dienst.type || ''}
              onChange={(value) => setDienstData('type', value)}
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

ConFormDienstInformatieStage.displayName = 'ConFormDienstInformatieStage';

export default ConFormDienstInformatieStage;
