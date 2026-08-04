import React, { memo, useEffect, useRef } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

/**
 * Dienst Informatie Stage
 *
 * Fields (from schema dienst):
 * - naam, contactpersoon, aanbieder, website, type, beschrijvingKort, beschrijvingLang, logo
 */
const ConFormDienstInformatieStage = memo(
  ({ dienst, setDienstData, loading, touched, schemas, userStore, dienstType }) => {
    // Ensure aanbieder is set from /me so users cannot change it later
    const hasInitializedRef = useRef(false);
    useEffect(() => {
      if (hasInitializedRef.current) return;

      let cancelled = false;
      const resolveActiveOrganisation = async () => {
        try {
          // Prefer active org from store if available
          const activeFromStore = userStore?.activeOrganization || null;
          if (activeFromStore) {
            const id = String(
              activeFromStore?.uuid ||
                activeFromStore?.id ||
                activeFromStore?.slug ||
                ''
            );
            if (!cancelled && id) {
              setDienstData('aanbieder', id);
              hasInitializedRef.current = true;
              return;
            }
          }

          // Fallback to /me endpoint once
          const meUrl = `${BASE_URL}/openregister/api/user/me`;
          let me = null;
          try {
            const res = await fetch(meUrl, {
              headers: { Accept: 'application/json' },
            });
            if (res.ok) {
              me = await res.json();
            }
          } catch {
            // ignore
          }

          const active = me?.organisations?.active || null;
          const id = String(active?.uuid || active?.id || active?.slug || '');
          if (!cancelled && id) {
            setDienstData('aanbieder', id);
            hasInitializedRef.current = true;
          }
        } catch {
          // ignore
        }
      };
      resolveActiveOrganisation();
      return () => {
        cancelled = true;
      };
    }, []);

    // Aanbieder field is hidden; value is prefilled from active organization above

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-informatie-section-title'
      >
        <h2 id='dienst-informatie-section-title' className='sr-only'>
          Registreer uw dienst
        </h2>

        <Paragraph style={{ marginBottom: '1.5rem' }}>
          Registreer hier een dienst die uw organisatie aanbiedt &mdash; bijvoorbeeld
          functioneel beheer, implementatieondersteuning, of licentiereseller.
          U kunt een dienst koppelen aan een product of applicatie van uw eigen
          organisatie, maar ook aan producten of applicaties van andere leveranciers.
          Door uw diensten te registreren helpt u gemeenten en andere organisaties om
          snel te zien welke ondersteuning en expertise beschikbaar is.
        </Paragraph>

        <Paragraph style={{ marginBottom: '0.5rem' }}>
          <strong>Informatie over uw dienst</strong>
        </Paragraph>
        <Paragraph style={{ marginBottom: '1.5rem' }}>
          Vul de naam, website en een beschrijving van uw dienst in. Voeg eventueel
          een logo toe. Gebruik een herkenbare naam, zoals: &quot;Functioneel beheer
          voor Zaakgericht Werken&quot; of &quot;Reseller van Applicatie X&quot;.
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
              customProps={{
                placeholder: 'Beschrijf in een of twee zinnen wat uw dienst inhoudt.',
              }}
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
              customProps={{
                inputType: 'file',
                format: 'base64',
                useFileObjects: true,
                enableFileSizeCheck: false, // Disable file size checks for File objects mode
              }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='contactpersoon'
              value={dienst.contactpersoon || ''}
              onChange={(value) => setDienstData('contactpersoon', value)}
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
                additionalQueryParams: { _published: 'false' },
              }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='type'
              value={dienst.type || ''}
              onChange={(value) => setDienstData('type', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                additionalQueryParams: { _published: 'false' },
                isMulti: true,
                closeMenuOnSelect: false,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormDienstInformatieStage.displayName = 'ConFormDienstInformatieStage';

export default ConFormDienstInformatieStage;
