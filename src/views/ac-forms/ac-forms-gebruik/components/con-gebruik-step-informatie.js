import React, { memo, useEffect } from 'react';
import ReactSelect from 'react-select';
import {
  Separator,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { ConSchemaEnhancedField } from '@src/components';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * ConAfnemerOrganisatieForm
 * Renders the form fields for creating a new organization when afnemerKeuze === 'nieuw'
 */
const ConAfnemerOrganisatieForm = memo(
  ({ afnemerOrganisatie, setAfnemerOrganisatieData, loading, schemas }) => {
    return (
      <div className='con-dynamic-form-container'>
        <div className='con-form-fields-container'>
          {/* Organization Name - Required */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='naam'
            value={afnemerOrganisatie.naam || ''}
            onChange={(value) => setAfnemerOrganisatieData('naam', value)}
            isDisabled={loading}
            width='full'
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

          {/* Short Description */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='beschrijvingKort'
            value={afnemerOrganisatie.beschrijvingKort || ''}
            onChange={(value) =>
              setAfnemerOrganisatieData('beschrijvingKort', value)
            }
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
            value={afnemerOrganisatie.beschrijvingLang || ''}
            onChange={(value) =>
              setAfnemerOrganisatieData('beschrijvingLang', value)
            }
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
            value={afnemerOrganisatie['e-mailadres'] || ''}
            onChange={(value) => setAfnemerOrganisatieData('e-mailadres', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* Phone Number */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='telefoonnummer'
            value={afnemerOrganisatie.telefoonnummer || ''}
            onChange={(value) => setAfnemerOrganisatieData('telefoonnummer', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* KvK Number */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='kvkNummer'
            value={afnemerOrganisatie.kvkNummer || ''}
            onChange={(value) => setAfnemerOrganisatieData('kvkNummer', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />

          {/* Logo URL */}
          <ConSchemaEnhancedField
            schemaType='organisatie'
            schemaProperty='logo'
            value={afnemerOrganisatie.logo || ''}
            onChange={(value) => setAfnemerOrganisatieData('logo', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />
        </div>
        <Separator
          className='ac-register-review-header__separator'
          style={{ marginBlockStart: '24px' }}
        />
      </div>
    );
  }
);

ConAfnemerOrganisatieForm.displayName = 'ConAfnemerOrganisatieForm';

/**
 * ConGebruikStepInformatie
 * Renders the "Gebruik informatie" step of the Gebruik wizard.
 * Behavior changes based on gebruikType:
 * - eigen-organisatie: afnemer is locked to current user's organization
 * - andere-organisatie: afnemer can be selected from available organizations or created new
 */
const ConGebruikStepInformatie = ({
  gebruik,
  setGebruikData,
  loading,
  refCompOptions,
  organisatieOptions,
  organisatieLoading,
  searchOrganisaties,
  contactpersoonOptions,
  contactpersoonLoading,
  searchContactpersonen,
  schemas,
  // schemasLoading,
  gebruikType,
  afnemerKeuze,
  afnemerOrganisatie,
  setAfnemerOrganisatieData,
}) => {
  // Handle choice change between existing and new organization
  useEffect(() => {
    if (gebruikType !== 'andere-organisatie') return;

    if (afnemerKeuze === 'bestaand') {
      // Clear new organization fields
      setAfnemerOrganisatieData('naam', '');
      setAfnemerOrganisatieData('type', '');
      setAfnemerOrganisatieData('website', '');
      setAfnemerOrganisatieData('beschrijvingKort', '');
      setAfnemerOrganisatieData('beschrijvingLang', '');
      setAfnemerOrganisatieData('e-mailadres', '');
      setAfnemerOrganisatieData('telefoonnummer', '');
      setAfnemerOrganisatieData('kvkNummer', '');
      setAfnemerOrganisatieData('logo', '');
    }
    // Note: We don't clear afnemer here to avoid infinite loops
    // The user will explicitly select or create the organization
  }, [afnemerKeuze, gebruikType]);
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='info-title'
    >
      <h2 id='info-title' className='sr-only'>
        Informatie
      </h2>

      <div className='ac-register-form-grid'>
        {/* Contactpersoon - alleen tonen voor eigen organisatie gebruik */}
        {gebruikType !== 'andere-organisatie' && (
          <div style={{ gridColumn: 'span 2' }}>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty='contactpersoon'
              value={
                typeof gebruik?.contactpersoon === 'object' &&
                gebruik.contactpersoon !== null
                  ? gebruik.contactpersoon.id
                  : gebruik?.contactpersoon || ''
              }
              onChange={(value) => {
                setGebruikData('contactpersoon', {
                  id: value,
                  _displayName: contactpersoonOptions.find(
                    (opt) => opt.value === value
                  )?.label,
                });
              }}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              optionsProvider={contactpersoonOptions}
              isLoading={contactpersoonLoading}
              onSearch={(_path, _refSlug, q) => searchContactpersonen(q)}
              customProps={{
                getOptionLabel: (opt) => {
                  const c = opt?.data ?? opt;
                  return [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
                    .filter(Boolean)
                    .join(' ');
                },
              }}
            />
          </div>
        )}
        {gebruikType !== 'eigen-organisatie' && (
          <div style={{ gridColumn: 'span 2' }}>
            {gebruikType === 'andere-organisatie' ? (
              <>
                {/* Existing organization dropdown */}
                {afnemerKeuze === 'bestaand' && (
                  <>
                    <ConSchemaEnhancedField
                      schemaType='gebruik'
                      schemaProperty='afnemer'
                      value={
                        typeof gebruik?.afnemer === 'object' &&
                        gebruik.afnemer !== null
                          ? gebruik.afnemer.id ||
                            gebruik.afnemer['@self']?.id ||
                            gebruik.afnemer.value
                          : gebruik?.afnemer || null
                      }
                      onChange={(value) => {
                        setGebruikData('afnemer', value);
                      }}
                      isDisabled={loading}
                      width='full'
                      schemas={schemas}
                      optionsProvider={organisatieOptions}
                      isLoading={organisatieLoading}
                      onSearch={(_path, _refSlug, q) => searchOrganisaties(q)}
                      placeholder='Selecteer de klantorganisatie...'
                    />
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        marginTop: '0.25rem',
                      }}
                    >
                      Selecteer de organisatie die de applicatie gebruikt. Deze
                      organisatie wordt geïnformeerd en moet het gebruik goedkeuren.
                    </div>
                  </>
                )}

                {/* New organization form fields */}
                {afnemerKeuze === 'nieuw' && (
                  <ConAfnemerOrganisatieForm
                    afnemerOrganisatie={afnemerOrganisatie}
                    setAfnemerOrganisatieData={setAfnemerOrganisatieData}
                    loading={loading}
                    schemas={schemas}
                  />
                )}
              </>
            ) : (
              <>
                <label className='utrecht-form-label'>Afnemer</label>
                <Textbox placeholder='Selecteer eerst het type gebruik' disabled />
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#orange',
                    marginTop: '0.25rem',
                  }}
                >
                  Ga terug naar &quot;Soort gebruik&quot; om het type registratie te
                  selecteren.
                </div>
              </>
            )}
          </div>
        )}
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='status'
            value={gebruik?.status || ''}
            onChange={(value) => setGebruikData('status', value)}
            isDisabled={loading}
            width='half'
            schemas={schemas}
          />
        </div>

        {gebruik?.status === 'Verwerving' && (
          <div>
            <label className='utrecht-form-label'>Startdatum Verwerving</label>
            <input
              type='date'
              className='utrecht-textbox'
              value={gebruik?.startDatumVerwerving || ''}
              onChange={(e) =>
                setGebruikData('startDatumVerwerving', e.target.value)
              }
            />
          </div>
        )}
        {gebruik?.status === 'Gepland' && (
          <div>
            <label className='utrecht-form-label'>Geplande Startdatum</label>
            <input
              type='date'
              className='utrecht-textbox'
              value={gebruik?.startDatumGepland || ''}
              onChange={(e) => setGebruikData('startDatumGepland', e.target.value)}
            />
          </div>
        )}
        {gebruik?.status === 'In productie' && (
          <div>
            <label className='utrecht-form-label'>Startdatum In Productie</label>
            <input
              type='date'
              className='utrecht-textbox'
              value={gebruik?.startDatumInProductie || ''}
              onChange={(e) =>
                setGebruikData('startDatumInProductie', e.target.value)
              }
            />
          </div>
        )}
        {gebruik?.status === 'Uit te faseren' && (
          <div>
            <label className='utrecht-form-label'>Startdatum Uit Te Faseren</label>
            <input
              type='date'
              className='utrecht-textbox'
              value={gebruik?.startDatumUitTeFaseren || ''}
              onChange={(e) =>
                setGebruikData('startDatumUitTeFaseren', e.target.value)
              }
            />
          </div>
        )}
        {gebruik?.status === 'Uitgefaseerd' && (
          <div>
            <label className='utrecht-form-label'>Startdatum Uit Gefaseerd</label>
            <input
              type='date'
              className='utrecht-textbox'
              value={gebruik?.startDatumUitGefaseerd || ''}
              onChange={(e) =>
                setGebruikData('startDatumUitGefaseerd', e.target.value)
              }
            />
          </div>
        )}
        {/* Referentiecomponenten - alleen tonen voor eigen organisatie gebruik */}
        {gebruikType !== 'andere-organisatie' && (
          <div style={{ gridColumn: 'span 2' }}>
            <label className='utrecht-form-label'>Referentiecomponenten</label>
            <ReactSelect
              isMulti
              className='ac-beheer-select'
              closeMenuOnSelect={false}
              options={refCompOptions.sort((a, b) => a.label.localeCompare(b.label))}
              value={(gebruik?.gebruiktVoorReferentiecomponenten || [])
                .map((v) =>
                  refCompOptions.find((o) => String(o.value) === String(v))
                )
                .filter(Boolean)}
              onChange={(opts) =>
                setGebruikData(
                  'gebruiktVoorReferentiecomponenten',
                  Array.isArray(opts) ? opts.map((o) => String(o.value)) : []
                )
              }
              placeholder='Selecteer referentiecomponenten...'
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ConGebruikStepInformatie);
