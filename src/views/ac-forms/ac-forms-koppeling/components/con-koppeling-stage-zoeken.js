import React, { useState } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcFlex } from '@src/atoms';
import {
  Paragraph,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';

const ConKoppelingStageZoeken = ({
  loading,
  ownAppOptions,
  ownApp,
  setOwnApp,
  ownAppLoading,
  ownAppInput,
  setOwnAppInput,
  searchResults,
  resolvedModulesFromResults = [],
  resultsLoading = false,
  getArrowForDirection,
}) => {
  const [ownAppMenuOpen, setOwnAppMenuOpen] = useState(false);
  const idToLabel = Object.fromEntries(
    (resolvedModulesFromResults || []).map((o) => [String(o.value), String(o.label)])
  );

  const extractRelationId = (rel) => {
    if (!rel) return '';
    if (typeof rel === 'string') return String(rel);
    if (typeof rel === 'object') {
      return String(rel.id || rel.value || rel?.['@self']?.id || '') || '';
    }
    return '';
  };

  const getDirectionValue = (k) => {
    return (
      k?.gegevensuitwisselingRichting ||
      k?.richting ||
      k?.direction ||
      (k?.gegevensuitwisseling && k?.gegevensuitwisseling.richting) ||
      ''
    );
  };

  const arrowFor = (dir) => {
    if (typeof getArrowForDirection === 'function') return getArrowForDirection(dir);
    if (dir === 'AnaarB') return '→';
    if (dir === 'BnaarA') return '←';
    if (dir === 'bi-directioneel') return '↔';
    return '↔';
  };

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
        Leveranciers hebben vaak al opgegeven met welke applicaties of voorzieningen
        hun product kan koppelen. Zoek hieronder of de gewenste koppeling al bestaat.
        Als deze nog niet is opgevoerd, kunt u de koppeling zelf toevoegen in de
        volgende stap.
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
            onChange={(opt) => {
              setOwnApp(opt || null);
              // Clear the search input so the selected value renders
              setOwnAppInput('');
              // Close the menu after selection
              setOwnAppMenuOpen(false);
            }}
            isDisabled={loading}
            placeholder='Selecteer uw applicatie...'
            isClearable
            isLoading={ownAppLoading}
            inputValue={ownAppInput}
            loadingMessage={() => 'Bezig met laden…'}
            menuIsOpen={ownAppMenuOpen}
            onInputChange={(input, { action }) => {
              if (action === 'input-change') {
                setOwnAppInput(input || '');
                setOwnAppMenuOpen(true);
              }
            }}
            onMenuOpen={() => setOwnAppMenuOpen(true)}
            onMenuClose={() => setOwnAppMenuOpen(false)}
          />
        </div>
      </div>

      {/*
        <div>
          <AcButton style='button' onClick={handleSearch} disabled={loading}>
            Zoeken
          </AcButton>
        </div>
      */}

      {/*
        <AcFlex column style={{ gridColumn: 'span 2' }}>
          <label className='utrecht-form-label'>Zoek op applicatienaam</label>
          <Textbox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value || '')}
            placeholder='Bijv. OpenWoo'
            id='koppeling-zoek-input'
          />
        </AcFlex>
      */}

      <div style={{ marginTop: '1rem' }}>
        <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
          Zoekresultaten
        </h3>
        {!resultsLoading && searchResults.length ? (
          <div className='ac-register-review'>
            <div className='ac-register-review__section'>
              <UnorderedList>
                {searchResults.map((k, i) => {
                  const rels = k?.['@self']?.relations || {};
                  const aRel =
                    rels.moduleA ??
                    k.moduleA ??
                    k.applicatie1 ??
                    k.applicatieA ??
                    k.appA;
                  const bRel =
                    rels.moduleB ??
                    k.moduleB ??
                    k.applicatie2 ??
                    k.applicatieB ??
                    k.appB;
                  const aId = extractRelationId(aRel);
                  const bId = extractRelationId(bRel);

                  const aNameFromObject =
                    typeof aRel === 'object'
                      ? aRel?.naam || aRel?.name || aRel?.title || aRel?.label
                      : undefined;
                  const bNameFromObject =
                    typeof bRel === 'object'
                      ? bRel?.naam || bRel?.name || bRel?.title || bRel?.label
                      : undefined;

                  const aLabel =
                    String(aNameFromObject || (aId ? idToLabel[aId] : '') || '') ||
                    (typeof aRel === 'string' ? String(aRel) : '-') ||
                    '-';
                  const bLabel =
                    String(bNameFromObject || (bId ? idToLabel[bId] : '') || '') ||
                    (typeof bRel === 'string' ? String(bRel) : '-') ||
                    '-';

                  const dir = getDirectionValue(k);
                  const dirArrow = arrowFor(dir);

                  const naam = String(
                    (k?.naam || k?.name || k?.title || k?.label || '').toString()
                  ).trim();
                  const soortLabel = String(
                    k?.type ||
                      k?.soort ||
                      (k?.gegevensuitwisseling && k?.gegevensuitwisseling.soort) ||
                      ''
                  ).trim();
                  const statusLabel = String(k?.status || '').trim();
                  const beschrijving = String(
                    k?.beschrijvingKort || k?.beschrijving || k?.omschrijving || ''
                  ).trim();

                  return (
                    <UnorderedListItem key={k?.id || i}>
                      {naam && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>{naam}</strong>
                        </div>
                      )}
                      <div>
                        {dir === 'BnaarA' ? (
                          <>
                            {bLabel} {dirArrow} {aLabel}
                          </>
                        ) : (
                          <>
                            {aLabel} {dirArrow} {bLabel}
                          </>
                        )}
                        {soortLabel ? ` (${soortLabel})` : ''}
                      </div>
                      {(statusLabel || beschrijving) && (
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {statusLabel && <div>Status: {statusLabel}</div>}
                          {beschrijving && <div>Beschrijving: {beschrijving}</div>}
                        </div>
                      )}
                    </UnorderedListItem>
                  );
                })}
              </UnorderedList>
            </div>
          </div>
        ) : resultsLoading ? (
          <Paragraph>Bezig met laden…</Paragraph>
        ) : (
          <Paragraph>
            {ownApp?.value
              ? 'Geen bestaande koppeling gevonden voor de applicatie uit uw applicatielandschap. U kunt deze zelf toevoegen in de volgende stap.'
              : 'Geen applicatie geselecteerd.'}
          </Paragraph>
        )}
      </div>
    </AcFlex>
  );
};

export default ConKoppelingStageZoeken;
