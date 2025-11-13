import React, { memo } from 'react';
import ReactSelect from 'react-select';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepInformatie
 * Renders the "Gebruik informatie" step of the Gebruik wizard.
 * For eigen-organisatie: shows contactpersoon and referentiecomponenten.
 * For andere-organisatie: only shows status and date fields (afnemer is handled in separate step).
 */
const ConGebruikStepInformatie = ({
  gebruik,
  setGebruikData,
  loading,
  refCompOptions,
  contactpersoonOptions,
  contactpersoonLoading,
  searchContactpersonen,
  schemas,
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
        {gebruikType === 'eigen-organisatie' && (
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
        {gebruikType === 'eigen-organisatie' && (
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
