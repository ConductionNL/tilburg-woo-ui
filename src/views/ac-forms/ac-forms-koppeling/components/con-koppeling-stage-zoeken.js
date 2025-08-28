import React from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';
import {
  Paragraph,
  UnorderedList,
  UnorderedListItem,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';

const ConKoppelingStageZoeken = ({
  loading,
  ownAppOptions,
  ownApp,
  setOwnApp,
  ownAppLoading,
  setOwnAppInput,
  handleSearch,
  searchQuery,
  setSearchQuery,
  searchResults,
}) => {
  return (
    <AcFlex
      column
      spacing='sm'
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-zoek-title'
    >
      <h2 id='koppeling-zoek-title' className='sr-only'>
        Koppeling zoeken
      </h2>

      <Paragraph>
        Vul de naam van de applicatie in om te controleren of er al koppelingen
        bestaan.
      </Paragraph>

      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2' }}>
          <label className='utrecht-form-label'>Uw applicatie (optioneel)</label>
          <ReactSelect
            className={clsx(
              'ac-beheer-select',
              loading && 'ac-beheer-select--disabled'
            )}
            options={ownAppOptions}
            value={ownApp}
            onChange={setOwnApp}
            isDisabled={loading}
            placeholder='Selecteer uw applicatie...'
            isClearable
            isLoading={ownAppLoading}
            onInputChange={(input, { action }) => {
              if (action === 'input-change') setOwnAppInput(input || '');
            }}
          />
        </div>
      </div>

      <div>
        <AcButton style='button' onClick={handleSearch} disabled={loading}>
          Zoeken
        </AcButton>
      </div>

      <AcFlex column style={{ gridColumn: 'span 2' }}>
        <label className='utrecht-form-label'>Zoek op applicatienaam</label>
        <Textbox
          value={searchQuery}
          onChange={(e) => setSearchQuery(e?.target?.value || '')}
          placeholder='Bijv. OpenWoo'
          id='koppeling-zoek-input'
        />
      </AcFlex>

      <div style={{ marginTop: '1rem' }}>
        <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
          Zoekresultaten
        </h3>
        {searchResults.length ? (
          <UnorderedList>
            {searchResults.map((k, i) => (
              <UnorderedListItem key={k?.id || i}>
                {k?.applicatie1 || k?.applicatieA || k?.appA || 'Onbekend'} ↔{' '}
                {k?.applicatie2 || k?.applicatieB || k?.appB || 'Onbekend'}
              </UnorderedListItem>
            ))}
          </UnorderedList>
        ) : (
          <Paragraph>Geen koppelingen gevonden.</Paragraph>
        )}
      </div>
    </AcFlex>
  );
};

export default ConKoppelingStageZoeken;
