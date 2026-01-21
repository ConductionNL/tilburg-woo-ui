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
          Dienst informatie
        </h2>

        <Paragraph style={{ marginBottom: '1.5rem' }}>
          {dienstType === 'eigen-organisatie' ? (
            <>Geef aan welke dienstverlening u verleent op uw applicatie.</>
          ) : dienstType === 'andere-organisatie' ? (
            <>
              U gaat een dienst registreren voor een andere organisatie. In de
              volgende stappen vult u de basisgegevens in en selecteert u relevante
              applicaties.
            </>
          ) : (
            <>
              In de volgende stappen vult u de basisgegevens in en selecteert u
              relevante applicaties.
            </>
          )}
        </Paragraph>

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
              value={
                Array.isArray(dienst.type)
                  ? dienst.type
                  : dienst.type
                  ? [dienst.type]
                  : []
              }
              onChange={(value) =>
                setDienstData('type', Array.isArray(value) ? value : [])
              }
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
