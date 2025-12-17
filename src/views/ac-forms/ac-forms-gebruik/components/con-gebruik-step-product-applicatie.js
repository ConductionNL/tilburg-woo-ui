import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import {
  validateWebsite,
  validateEmail,
  validatePhone,
} from '@views/ac-forms/validation/form-validations';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';

/**
 * ConGebruikStepProductApplicatie
 * Applicatie selection with searchable module select.
 * Shows all available applicaties from the catalog.
 * Also handles non-existing application flow with applicatie creation form.
 */
const ConGebruikStepProductApplicatie = ({
  gebruik,
  setGebruikData,
  moduleOptions,
  modulesLoading,
  searchLoading,
  searchModules,
  schemas,
  applicatieKeuze,
  nieuweApplicatie,
  setNieuweApplicatieData,
  leverancierKeuze,
  setLeverancierKeuze,
  leverancierOrganisatie,
  setLeverancierOrganisatieData,
  leverancierOptions,
  leverancierLoading,
  searchLeveranciers,
  loading,
}) => {
  // Existing application flow
  if (applicatieKeuze === 'bestaand') {
    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='applicatie-title'
      >
        <h2 id='applicatie-title' className='sr-only'>
          Applicatie
        </h2>

        <Paragraph>
          Selecteer de applicatie(s) waarvan u het gebruik aan uw klanten wilt
          melden.
        </Paragraph>

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty='module'
              value={gebruik?.module || null}
              onChange={(value) => {
                const nextId =
                  (value && value.data && (value.data.id || value.data.value)) ||
                  (value && value.value) ||
                  value;
                setGebruikData('module', nextId);
              }}
              isDisabled={modulesLoading}
              isLoading={modulesLoading || searchLoading}
              width='full'
              schemas={schemas}
              optionsProvider={moduleOptions}
              onSearch={(_path, _refSlug, q) => searchModules && searchModules(q)}
              customProps={{
                label: 'Applicatie',
                placeholder: 'Selecteer een applicatie',
                required: true,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Non-existing application flow - show applicatie creation form
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='applicatie-creation-title'
    >
      <h2 id='applicatie-creation-title' className='sr-only'>
        Applicatie aanmaken
      </h2>
      <Paragraph className='con-form-wizard-paragraph'>
        Maak een nieuwe applicatie aan voor dit gebruik.
      </Paragraph>

      <div className='con-dynamic-form-container'>
        <div className='con-form-fields-container'>
          {/* Section 1: Leverancier */}
          <h3 className='utrecht-heading-3' style={{ width: '100%' }}>
            {leverancierKeuze === 'bestaand'
              ? 'Leverancier selecteren'
              : 'Leverancier aanmaken'}
          </h3>

          {/* Existing leverancier dropdown */}
          {leverancierKeuze === 'bestaand' && (
            <>
              <ConSchemaEnhancedField
                schemaType='module'
                required={true}
                schemaProperty='aanbieder'
                value={nieuweApplicatie.leverancier}
                onChange={(value) => {
                  // Check if this is the manually created aanbieder
                  if (
                    value &&
                    (value._isManuallyCreatedAanbieder ||
                      value.data?._isManuallyCreatedAanbieder ||
                      (typeof value.value === 'string' &&
                        value.value.startsWith('__manually_created_aanbieder__')))
                  ) {
                    // Store the full value to match the option, but we'll recognize it by the prefix
                    setNieuweApplicatieData(
                      'leverancier',
                      value.value || '__manually_created_aanbieder__'
                    );
                  } else {
                    // Normal leverancier selection
                    const nextId =
                      (value && value.data && (value.data.id || value.data.value)) ||
                      (value && value.value) ||
                      value;
                    setNieuweApplicatieData('leverancier', nextId);
                  }
                }}
                isDisabled={loading}
                isLoading={leverancierLoading}
                width='half'
                schemas={schemas}
                optionsProvider={leverancierOptions}
                onSearch={(_path, _refSlug, q) =>
                  searchLeveranciers && searchLeveranciers(q || '')
                }
                customProps={{
                  label: 'Leverancier',
                  isClearable: true,
                  placeholder: 'Zoek en selecteer leverancier',
                }}
              />

              <div style={{ alignSelf: 'end' }}>
                <AcButton
                  style='button'
                  buttonType='secondary'
                  icon={<VISUALS.BUILDING />}
                  onClick={() => setLeverancierKeuze('nieuw')}
                >
                  Ik kan de gewenste leverancier niet vinden
                </AcButton>
              </div>
            </>
          )}

          {/* New leverancier form fields */}
          {leverancierKeuze === 'nieuw' && (
            <>
              <ConSchemaEnhancedField
                schemaType='organisatie'
                schemaProperty='naam'
                value={leverancierOrganisatie.naam || ''}
                onChange={(value) => setLeverancierOrganisatieData('naam', value)}
                isDisabled={loading}
                width='full'
                schemas={schemas}
                customProps={{
                  required: true,
                }}
              />

              <ConSchemaEnhancedField
                schemaType='organisatie'
                schemaProperty='type'
                value={leverancierOrganisatie.type || ''}
                onChange={(value) => setLeverancierOrganisatieData('type', value)}
                isDisabled={loading}
                width='half'
                schemas={schemas}
                customProps={{
                  required: true,
                }}
              />

              <ConSchemaEnhancedField
                schemaType='organisatie'
                schemaProperty='website'
                value={leverancierOrganisatie.website || ''}
                onChange={(value) => setLeverancierOrganisatieData('website', value)}
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

              <ConSchemaEnhancedField
                schemaType='organisatie'
                schemaProperty='e-mailadres'
                value={leverancierOrganisatie['e-mailadres'] || ''}
                onChange={(value) =>
                  setLeverancierOrganisatieData('e-mailadres', value)
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

              <ConSchemaEnhancedField
                schemaType='organisatie'
                schemaProperty='telefoonnummer'
                value={leverancierOrganisatie.telefoonnummer || ''}
                onChange={(value) =>
                  setLeverancierOrganisatieData('telefoonnummer', value)
                }
                isDisabled={loading}
                width='half'
                customProps={{
                  validation: {
                    custom: (value) => {
                      if (!value || value.trim() === '') return true;
                      return validatePhone(value.trim());
                    },
                    customErrorMessage: 'Ongeldig telefoonnummer. (+31 6 1234 5678)',
                  },
                }}
                schemas={schemas}
              />

              <AcButton
                style='button'
                buttonType='secondary'
                icon={<VISUALS.ARROW_LEFT />}
                onClick={() => setLeverancierKeuze('bestaand')}
              >
                Bestaande leverancier selecteren
              </AcButton>
            </>
          )}

          {/* Section 2: Applicatie fields */}
          <h3
            className='utrecht-heading-3'
            style={{ marginTop: '2rem', width: '100%' }}
          >
            Applicatie
          </h3>

          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='naam'
            value={nieuweApplicatie.naam || ''}
            onChange={(value) => setNieuweApplicatieData('naam', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            customProps={{
              required: true,
              placeholder: 'Naam van de applicatie',
            }}
          />

          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='website'
            value={nieuweApplicatie.website || ''}
            onChange={(value) => setNieuweApplicatieData('website', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
            customProps={{
              inputType: 'text',
              required: true,
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

          <ConSchemaEnhancedField
            schemaType='module'
            schemaProperty='beschrijvingKort'
            value={nieuweApplicatie.beschrijvingKort || ''}
            onChange={(value) => setNieuweApplicatieData('beschrijvingKort', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
            customProps={{
              description:
                'Een korte beschrijving van de applicatie voor o.a. in de zoekresultaten.',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepProductApplicatie);
