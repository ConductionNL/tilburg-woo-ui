import React, { memo } from 'react';
import ReactSelect from 'react-select';
import { Textbox } from '@utrecht/component-library-react/dist/css-module';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepInformatie
 * Renders the "Gebruik informatie" step of the Gebruik wizard.
 * Behavior changes based on gebruikType:
 * - eigen-organisatie: afnemer is locked to current user's organization
 * - andere-organisatie: afnemer can be selected from available organizations
 */
const ConGebruikStepInformatie = ({
  gebruik,
  setGebruikData,
  loading,
  refCompOptions,
  organisatieOptions,
  schemas,
  // schemasLoading,
  gebruikType,
}) => {
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
              value={gebruik?.contactpersoon || ''}
              onChange={(value) => setGebruikData('contactpersoon', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              // Avoid internal $ref search churn for contactpersoon on this step
              // by providing an empty, stable optionsProvider (store-driven options may be prefilled elsewhere)
              optionsProvider={[]}
            />
          </div>
        )}
        <div style={{ gridColumn: 'span 2' }}>
          {gebruikType === 'andere-organisatie' ? (
            <>
              <ConSchemaEnhancedField
                schemaType='gebruik'
                schemaProperty='afnemer'
                value={gebruik?.afnemer || null}
                onChange={(value) => setGebruikData('afnemer', value)}
                isDisabled={loading}
                width='full'
                schemas={schemas}
                optionsProvider={organisatieOptions}
                placeholder='Selecteer de klantorganisatie...'
              />
              <div
                style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}
              >
                Selecteer de organisatie die uw product gebruikt. Deze organisatie
                wordt geïnformeerd en moet het gebruik goedkeuren.
              </div>
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
              options={refCompOptions}
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
