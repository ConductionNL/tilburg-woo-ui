import React, { useState } from 'react';
import { AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ConSchemaEnhancedField, ConUuidResolver, AcLoader } from '@src/components';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

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
  editingKoppelingId = '',
  onSearchModules,
  schemas = {},
  // New application flow props
  ownAppKeuze = 'bestaand',
  nieuweOwnApp = {},
  setNieuweOwnAppData,
  ownAppLeverancierKeuze = 'bestaand',
  setOwnAppLeverancierKeuze,
  nieuweOwnAppLeverancier = {},
  setNieuweOwnAppLeverancierData,
  leverancierOptions = [],
  leverancierLoading = false,
  searchLeveranciers,
}) => {
  // Manage visibility state of info alert
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('koppeling-zoeken-info-alert-closed');
  });

  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-zoeken-info-alert-closed', 'true');
  };
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
        <div>
          <Paragraph>
            Controleer eerst of de koppeling al bestaat. Dit kan op twee manieren:
          </Paragraph>
          <ul style={{ marginInlineStart: '1rem', marginTop: '0.5rem' }}>
            <li>
              Ga naar de betreffende applicatie en kijk onder het tabblad
              &quot;Koppelingen&quot; of de koppeling al aanwezig is.
            </li>
            <li>
              Ga naar de zoekpagina, zoek op de applicatie en gebruik de filter
              &quot;Koppelingen&quot; om te controleren of de koppeling daar al
              staat.
            </li>
          </ul>
        </div>
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

      {ownAppKeuze === 'bestaand' ? (
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
              onSearch={(_path, _refSlug, q) =>
                onSearchModules && onSearchModules(q)
              }
              customProps={{
                label: 'Applicatie',
                placeholder: 'Selecteer een applicatie',
                isClearable: false,
                required: true,
              }}
            />
          </div>
        </div>
      ) : (
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Section 1: Leverancier */}
            <h3 className='utrecht-heading-3' style={{ width: '100%' }}>
              {ownAppLeverancierKeuze === 'nieuw'
                ? 'Leverancier aanmaken'
                : 'Leverancier selecteren'}
            </h3>

            {/* Existing leverancier dropdown */}
            {ownAppLeverancierKeuze !== 'nieuw' ? (
              <>
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='aanbieder'
                  value={nieuweOwnApp?.leverancier || null}
                  onChange={(value) => {
                    const nextId =
                      (value && value.data && (value.data.id || value.data.value)) ||
                      (value && value.value) ||
                      value;
                    setNieuweOwnAppData('leverancier', nextId);
                  }}
                  isDisabled={loading}
                  isLoading={leverancierLoading}
                  width='half'
                  schemas={schemas}
                  optionsProvider={leverancierOptions}
                  onSearch={(_path, _refSlug, query) =>
                    searchLeveranciers && searchLeveranciers(query || '')
                  }
                  customProps={{
                    label: 'Leverancier',
                    isClearable: true,
                    placeholder: 'Zoek en selecteer leverancier',
                    required: true,
                  }}
                />

                <div style={{ alignSelf: 'end' }}>
                  <AcButton
                    style='button'
                    buttonType='secondary'
                    icon={<VISUALS.BUILDING />}
                    onClick={() => setOwnAppLeverancierKeuze('nieuw')}
                  >
                    Ik kan de gewenste leverancier niet vinden
                  </AcButton>
                </div>
              </>
            ) : (
              <>
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={nieuweOwnAppLeverancier?.naam || ''}
                  onChange={(value) => setNieuweOwnAppLeverancierData('naam', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                  customProps={{
                    required: true,
                    placeholder: 'Naam van de leverancier',
                  }}
                />

                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='website'
                  value={nieuweOwnAppLeverancier?.website || ''}
                  onChange={(value) =>
                    setNieuweOwnAppLeverancierData('website', value)
                  }
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                  customProps={{
                    inputType: 'text',
                    required: true,
                    placeholder: 'Website van de leverancier',
                    validation: {
                      custom: (value) => {
                        if (!value || value.trim() === '') return true;
                        return validateWebsite(value.trim());
                      },
                      customErrorMessage:
                        'Website heeft een ongeldig formaat (bijv. conduction.nl)',
                    },
                  }}
                />

                <AcButton
                  style='button'
                  buttonType='secondary'
                  icon={<VISUALS.ARROW_LEFT />}
                  onClick={() => setOwnAppLeverancierKeuze('bestaand')}
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
              value={nieuweOwnApp?.naam || ''}
              onChange={(value) => setNieuweOwnAppData('naam', value)}
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
              value={nieuweOwnApp?.website || ''}
              onChange={(value) => setNieuweOwnAppData('website', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                inputType: 'text',
                required: true,
                placeholder: 'Website van de applicatie',
                validation: {
                  custom: (value) => {
                    if (!value || String(value).trim() === '') return true;
                    return validateWebsite(String(value).trim());
                  },
                  customErrorMessage:
                    'Website heeft een ongeldig formaat (bijv. conduction.nl)',
                },
                description: 'Een URL naar uw applicatie of organisatie',
              }}
            />

            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='beschrijvingKort'
              value={nieuweOwnApp?.beschrijvingKort || ''}
              onChange={(value) => setNieuweOwnAppData('beschrijvingKort', value)}
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
      )}

      {/* Only show existing koppelingen section when selecting an existing application */}
      {ownAppKeuze !== 'nieuw' && (
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

          <div className='ac-register-review'>
            <div className='ac-register-review__section'>
              {resultsLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    marginBottom: searchResults.length > 0 ? '0.75rem' : 0,
                  }}
                >
                  <AcLoader
                    style={{ height: 'auto', flex: 'none', fontSize: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    Koppelingen worden geladen...
                  </span>
                </div>
              )}

              {searchResults.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {searchResults.map((k, i) => {
                    const currentKoppelingId =
                      k?.id || k?.['@self']?.id || String(i);
                    const isCurrentKoppeling =
                      isEditMode &&
                      editingKoppelingId &&
                      String(currentKoppelingId) === String(editingKoppelingId);
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
                        key={currentKoppelingId}
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderLeft: isCurrentKoppeling
                            ? '3px solid var(--tilburg-color-primary, #0063e5)'
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: isCurrentKoppeling
                            ? 'var(--tilburg-color-gray-50, #f8f9fa)'
                            : 'transparent',
                        }}
                      >
                        {isCurrentKoppeling && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontStyle: 'italic',
                              color: 'var(--tilburg-color-gray-600, #666)',
                              marginBottom: '0.25rem',
                            }}
                          >
                            U bewerkt deze koppeling
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {naam && (
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <strong style={{ fontSize: '1rem' }}>{naam}</strong>
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            {soortLabel && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#e8f4f8',
                                  color: '#0063e5',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                }}
                              >
                                {soortLabel}
                              </span>
                            )}
                            {statusLabel && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor:
                                    statusLabel.toLowerCase() === 'concept'
                                      ? '#fff3cd'
                                      : statusLabel.toLowerCase() ===
                                          'gepubliceerd' ||
                                        statusLabel.toLowerCase() === 'published'
                                      ? '#d1e7dd'
                                      : '#e8e8e8',
                                  color:
                                    statusLabel.toLowerCase() === 'concept'
                                      ? '#856404'
                                      : statusLabel.toLowerCase() ===
                                          'gepubliceerd' ||
                                        statusLabel.toLowerCase() === 'published'
                                      ? '#0f5132'
                                      : '#333',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                }}
                              >
                                {statusLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
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
                        </div>

                        {beschrijving && (
                          <div
                            style={{
                              color: '#666',
                              fontSize: '0.9rem',
                              marginBottom: '0.5rem',
                              lineHeight: '1.4',
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              width: '100%',
                            }}
                          >
                            {beschrijving}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : !resultsLoading ? (
                <Paragraph style={{ margin: 0 }}>
                  {ownApp?.value
                    ? `Geen bestaande koppelingen gevonden voor ${ownApp.label}. U kunt deze zelf toevoegen in de volgende stap.`
                    : 'Selecteer eerst een applicatie om bestaande koppelingen te bekijken.'}
                </Paragraph>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </AcFlex>
  );
};

export default ConKoppelingStageZoeken;
