import React, { memo } from 'react';
import ReactSelect from 'react-select';
import clsx from 'clsx';
import { Textbox } from '@utrecht/component-library-react/dist/css-module';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepInformatie
 * Renders the "Informatie" step of the Gebruik wizard.
 * Mirrors layout and classes used in the product form for consistent UI.
 */
const ConGebruikStepInformatie = ({
  gebruik,
  setGebruikData,
  loading,
  refCompOptions,
  schemas,
  _schemasLoading,
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
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='naam'
            value={gebruik?.naam || ''}
            onChange={(value) => setGebruikData('naam', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='contactpersoon'
            value={gebruik?.contactpersoon || ''}
            onChange={(value) => setGebruikData('contactpersoon', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className='utrecht-form-label'>Afnemer (huidige organisatie)</label>
          <Textbox
            value={gebruik?.afnemer?.naam || gebruik?.afnemer?.name || ''}
            disabled
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className='utrecht-form-label'>Status</label>
          <ReactSelect
            className={clsx(
              'ac-beheer-select',
              loading && 'ac-beheer-select--disabled'
            )}
            options={[
              { value: 'Verwerving', label: 'Verwerving' },
              { value: 'Gepland', label: 'Gepland' },
              { value: 'In productie', label: 'In productie' },
              { value: 'Uit te faseren', label: 'Uit te faseren' },
              { value: 'Uitgefaseerd', label: 'Uitgefaseerd' },
            ]}
            value={
              [
                { value: 'Verwerving', label: 'Verwerving' },
                { value: 'Gepland', label: 'Gepland' },
                { value: 'In productie', label: 'In productie' },
                { value: 'Uit te faseren', label: 'Uit te faseren' },
                { value: 'Uitgefaseerd', label: 'Uitgefaseerd' },
              ].find((o) => o.value === gebruik?.status) || null
            }
            onChange={(opt) => setGebruikData('status', opt?.value || 'Verwerving')}
          />
        </div>

        <div>
          <label className='utrecht-form-label'>Startdatum Verwerving</label>
          <input
            type='date'
            className='utrecht-textbox'
            value={gebruik?.startDatumVerwerving || ''}
            onChange={(e) => setGebruikData('startDatumVerwerving', e.target.value)}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>Geplande Startdatum</label>
          <input
            type='date'
            className='utrecht-textbox'
            value={gebruik?.startDatumGepland || ''}
            onChange={(e) => setGebruikData('startDatumGepland', e.target.value)}
          />
        </div>
        <div>
          <label className='utrecht-form-label'>Startdatum In Productie</label>
          <input
            type='date'
            className='utrecht-textbox'
            value={gebruik?.startDatumInProductie || ''}
            onChange={(e) => setGebruikData('startDatumInProductie', e.target.value)}
          />
        </div>
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
        <div style={{ gridColumn: 'span 2' }}>
          <label className='utrecht-form-label'>Referentiecomponenten</label>
          <ReactSelect
            isMulti
            className='ac-beheer-select'
            options={refCompOptions}
            value={(gebruik?.gebruiktVoorReferentiecomponenten || [])
              .map((v) => refCompOptions.find((o) => String(o.value) === String(v)))
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
      </div>
    </div>
  );
};

export default memo(ConGebruikStepInformatie);
