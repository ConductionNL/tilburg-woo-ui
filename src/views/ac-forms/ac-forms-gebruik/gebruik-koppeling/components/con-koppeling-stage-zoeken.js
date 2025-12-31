import React, { useState } from 'react';
import { AcFlex } from '@src/atoms';
import { AcCheckbox } from '@src/molecules';
import { ConSchemaEnhancedField, ConUuidResolver } from '@src/components';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

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
  selectedKoppelingId,
  setSelectedKoppelingId,
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

  // Manage visibility state of info alert
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('koppeling-zoeken-info-alert-closed');
  });

  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-zoeken-info-alert-closed', 'true');
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

      {/* Closeable info alert */}
      {!isEditMode && showInfoAlert && (
        <Alert severity='info' className='ac-forms-product-info-alert'>
          <button
            onClick={handleCloseAlert}
            className='ac-forms-product-info-alert__close-button'
            title='Sluiten'
            aria-label='Alert sluiten'
          >
            <VISUALS.CLOSE />
          </button>
          <div className='ac-forms-product-info-alert__content'>
            <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
            <div>
              <strong>Zoekpagina</strong>
              <br />
              <span className='ac-forms-product-info-alert__text'>
                U kunt ook starten vanaf de zoekpagina. Open de detailpagina van de
                gevonden koppeling en kies &apos;Koppeling toevoegen&apos;.
              </span>
            </div>
          </div>
        </Alert>
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
            isDisabled={loading}
            isLoading={ownAppLoading}
            width='full'
            schemas={schemas}
            optionsProvider={(() => {
              // Ensure the selected option is always in the options list
              // This handles the case where the option is prefilled but not yet in ownAppOptions
              if (ownApp?.value && ownApp?.label) {
                const existsInOptions = ownAppOptions.some(
                  (opt) => String(opt.value) === String(ownApp.value)
                );
                if (!existsInOptions) {
                  return [ownApp, ...ownAppOptions];
                }
              }
              return ownAppOptions;
            })()}
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
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {searchResults.map((k, i) => {
                  const koppelingId = k?.id || k?.['@self']?.id || String(i);
                  const isSelected = selectedKoppelingId === koppelingId;
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
                    <div
                      key={koppelingId}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        outline: isSelected ? '2px solid #0063e5' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                      }}
                      onClick={() => {
                        if (!loading) {
                          setSelectedKoppelingId(isSelected ? null : koppelingId);
                        }
                      }}
                    >
                      <div style={{ marginTop: '0.25rem' }}>
                        <AcCheckbox
                          id={`koppeling-${koppelingId}`}
                          value={koppelingId}
                          checked={isSelected}
                          onChange={(checked) => {
                            if (!loading) {
                              setSelectedKoppelingId(checked ? koppelingId : null);
                            }
                          }}
                          disabled={loading}
                        />
                      </div>
                      <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                        {naam && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>{naam}</strong>
                          </div>
                        )}
                        <div>
                          {dir === 'BnaarA' ? (
                            <>
                              <ConUuidResolver>{bLabel}</ConUuidResolver> {dirArrow}{' '}
                              <ConUuidResolver>{aLabel}</ConUuidResolver>
                            </>
                          ) : (
                            <>
                              <ConUuidResolver>{aLabel}</ConUuidResolver> {dirArrow}{' '}
                              <ConUuidResolver>{bLabel}</ConUuidResolver>
                            </>
                          )}
                          {soortLabel ? ` (${soortLabel})` : ''}
                        </div>
                        {(statusLabel || beschrijving) && (
                          <div
                            style={{
                              color: '#666',
                              fontSize: '0.9rem',
                              marginTop: '0.25rem',
                            }}
                          >
                            {statusLabel && <div>Status: {statusLabel}</div>}
                            {beschrijving && <div>Beschrijving: {beschrijving}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
