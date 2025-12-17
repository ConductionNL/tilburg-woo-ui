import React from 'react';
import { AcFlex } from '@src/atoms';
import { ConSchemaEnhancedField } from '@src/components';
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
  searchResults,
  resolvedModulesFromResults = [],
  resultsLoading = false,
  getArrowForDirection,
  isEditMode,
  onSearchModules,
  schemas = {},
}) => {
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
        {isEditMode ? 'Koppeling bekijken' : 'Controleren op bestaande koppeling'}
      </h2>

      {!isEditMode && (
        <Paragraph>
          Controleer eerst of de koppeling al bestaat. Dit kan op twee manieren:
          <ul style={{ marginInlineStart: '1rem' }}>
            <li>
              Ga naar de betreffende applicatie en kijk onder het tabblad
              “Koppelingen” of de koppeling al aanwezig is.
            </li>
            <li>
              Ga naar de zoekpagina, zoek op de applicatie en gebruik de filter
              “Koppelingen” om te controleren of de koppeling daar al staat.
            </li>
          </ul>
        </Paragraph>
      )}

      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='koppeling'
            schemaProperty='moduleA'
            value={ownApp?.value || null}
            onChange={(value) => {
              // ConSchemaEnhancedField returns the option object directly when using optionsProvider
              // Handle both object and string formats
              if (!value) {
                setOwnApp(null);
              } else if (typeof value === 'object' && value.value !== undefined) {
                // It's an option object with value property
                setOwnApp(value);
              } else if (typeof value === 'string') {
                // It's just the ID string, find the option
                const option = ownAppOptions.find(
                  (opt) => String(opt.value) === String(value)
                );
                setOwnApp(option || null);
              } else {
                setOwnApp(null);
              }
            }}
            isDisabled={loading || isEditMode}
            isLoading={ownAppLoading}
            width='full'
            schemas={schemas}
            optionsProvider={ownAppOptions}
            onSearch={(_path, _refSlug, q) => onSearchModules && onSearchModules(q)}
            customProps={{
              label: 'Applicatie',
              placeholder: 'Selecteer een applicatie',
              isClearable: false,
              required: true,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
          {isEditMode
            ? 'Bestaande koppelingen'
            : ownApp?.value
            ? `Reeds bestaande koppelingen voor ${ownApp.label}`
            : 'Bestaande koppelingen'}
        </h3>
        {ownApp?.value && !isEditMode && (
          <Paragraph
            style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}
          >
            Hieronder ziet u alle koppelingen die al zijn geregistreerd voor de
            geselecteerde applicatie.
          </Paragraph>
        )}
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
              ? `Geen bestaande koppelingen gevonden voor ${ownApp.label}. U kunt deze zelf toevoegen in de volgende stap.`
              : 'Selecteer eerst een applicatie om bestaande koppelingen te bekijken.'}
          </Paragraph>
        )}
      </div>
    </AcFlex>
  );
};

export default ConKoppelingStageZoeken;
