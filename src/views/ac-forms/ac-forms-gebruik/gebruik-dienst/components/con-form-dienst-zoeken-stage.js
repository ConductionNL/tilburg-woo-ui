import React, { useState } from 'react';
import { AcFlex } from '@src/atoms';
import { AcCheckbox, AcButton } from '@src/molecules';
import {
  ConSchemaEnhancedField,
  ConUuidResolver,
  ConExternalLink,
} from '@src/components';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

const ConFormDienstZoekenStage = ({
  loading,
  ownAppOptions,
  ownApp,
  setOwnApp,
  ownAppLoading,
  searchResults,
  resolvedModulesFromResults = [],
  resultsLoading = false,
  isEditMode,
  onSearchModules,
  schemas = {},
  selectedDienstIds = [],
  setSelectedDienstIds,
  // New dienst creation props
  dienstKeuze = 'bestaand',
  setDienstKeuze,
  nieuweDienst = {},
  setNieuweDienstData,
  // Leverancier props
  leverancierKeuze = 'bestaand',
  setLeverancierKeuze,
  leverancierOrganisatie = {},
  setLeverancierOrganisatieData,
  leverancierOptions = [],
  leverancierLoading = false,
  searchLeveranciers,
  // Type options
  dienstTypeOptions = [],
  // Gebruik state for module binding
  gebruik = {},
  setGebruikData,
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

  // Manage visibility state of info alerts
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('dienst-zoeken-info-alert-closed');
  });
  const [showInfoAlertNieuw, setShowInfoAlertNieuw] = useState(() => {
    return !sessionStorage.getItem('dienst-zoeken-nieuw-info-alert-closed');
  });

  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('dienst-zoeken-info-alert-closed', 'true');
  };

  const handleCloseAlertNieuw = () => {
    setShowInfoAlertNieuw(false);
    sessionStorage.setItem('dienst-zoeken-nieuw-info-alert-closed', 'true');
  };

  // New dienst creation form
  if (dienstKeuze === 'nieuw' && setDienstKeuze) {
    return (
      <AcFlex
        column
        spacing='sm'
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-nieuw-title'
      >
        <h2 id='dienst-nieuw-title' className='sr-only'>
          Nieuwe dienst aanmaken
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          Vul de gegevens in voor de nieuwe dienst. Na het opvoeren van de dienst is
          deze ook zichtbaar voor andere gemeenten, zodat zij deze ook kunnen opnemen
          in hun applicatielandschap.
        </Paragraph>

        {/* Closeable info alert */}
        {showInfoAlertNieuw && (
          <Alert severity='info' className='ac-forms-product-info-alert'>
            <button
              onClick={handleCloseAlertNieuw}
              className='ac-forms-product-info-alert__close-button'
              title='Sluiten'
              aria-label='Alert sluiten'
            >
              <VISUALS.CLOSE />
            </button>
            <div className='ac-forms-product-info-alert__content'>
              <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
              <div>
                <strong>Dienst zoeken</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  Weet je zeker dat de dienst niet al bestaat? Ga naar de zoekpagina
                  en zoek op de naam van de dienst of applicatie.
                </span>
              </div>
            </div>
          </Alert>
        )}

        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Section 1: Applicatie - commented out when creating new dienst */}
            {/* <h3 className='utrecht-heading-3' style={{ width: '100%' }}>
              Applicatie selecteren
            </h3>

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='modules'
              value={ownApp?.value || null}
              onChange={(value) => {
                let actualValue = value;
                if (Array.isArray(value)) {
                  actualValue = value.length > 0 ? value[0] : null;
                }
                if (!actualValue) {
                  setOwnApp(null);
                } else if (
                  typeof actualValue === 'object' &&
                  actualValue.value !== undefined
                ) {
                  setOwnApp(actualValue);
                } else if (typeof actualValue === 'string') {
                  const option = ownAppOptions.find(
                    (opt) => String(opt.value) === String(actualValue)
                  );
                  setOwnApp(option || null);
                } else {
                  setOwnApp(null);
                }
              }}
              isDisabled={loading}
              isLoading={ownAppLoading}
              width='half'
              schemas={schemas}
              optionsProvider={(() => {
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
              onSearch={(_path, _refSlug, q) =>
                onSearchModules && onSearchModules(q)
              }
              customProps={{
                label: 'Applicatie',
                placeholder: 'Selecteer een applicatie',
                isClearable: false,
                required: true,
                isMulti: false,
                closeMenuOnSelect: true,
              }}
            /> */}

            {/* Section 2: Leverancier */}
            <h3
              className='utrecht-heading-3'
              style={{ marginTop: '2rem', width: '100%' }}
            >
              {leverancierKeuze === 'bestaand'
                ? 'Leverancier selecteren'
                : 'Leverancier aanmaken'}
            </h3>

            {/* Existing leverancier dropdown */}
            {leverancierKeuze === 'bestaand' && (
              <>
                <ConSchemaEnhancedField
                  schemaType='dienst'
                  schemaProperty='aanbieder'
                  value={nieuweDienst.leverancier || null}
                  onChange={(value) => {
                    const nextId =
                      (value && value.data && (value.data.id || value.data.value)) ||
                      (value && value.value) ||
                      value;
                    setNieuweDienstData('leverancier', nextId);
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

                {!isEditMode && setLeverancierKeuze && (
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
                )}
              </>
            )}

            {/* New leverancier form fields */}
            {leverancierKeuze === 'nieuw' && setLeverancierOrganisatieData && (
              <>
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={leverancierOrganisatie.naam || ''}
                  onChange={(value) => setLeverancierOrganisatieData('naam', value)}
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
                  onChange={(value) =>
                    setLeverancierOrganisatieData('website', value)
                  }
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

                {setLeverancierKeuze && (
                  <AcButton
                    style='button'
                    buttonType='secondary'
                    icon={<VISUALS.ARROW_LEFT />}
                    onClick={() => setLeverancierKeuze('bestaand')}
                  >
                    Bestaande leverancier selecteren
                  </AcButton>
                )}
              </>
            )}

            {/* Section 3: Dienst fields */}
            <h3
              className='utrecht-heading-3'
              style={{ marginTop: '2rem', width: '100%' }}
            >
              Dienst
            </h3>

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='naam'
              value={nieuweDienst.naam || ''}
              onChange={(value) => setNieuweDienstData('naam', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                required: true,
                placeholder: 'Naam van de dienst',
              }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='type'
              value={nieuweDienst.type || ''}
              onChange={(value) => {
                const nextValue = (value && value.value) || value;
                setNieuweDienstData('type', nextValue);
              }}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              optionsProvider={dienstTypeOptions}
              customProps={{
                required: true,
                placeholder: 'Selecteer een type',
              }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='website'
              value={nieuweDienst.website || ''}
              onChange={(value) => setNieuweDienstData('website', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
              customProps={{
                inputType: 'text',
                validation: {
                  custom: (value) => {
                    if (!value || String(value).trim() === '') return true;
                    const website = String(value).trim();
                    return validateWebsite(website);
                  },
                  customErrorMessage:
                    'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)',
                },
                description: 'Een URL naar de dienst of organisatie',
              }}
            />
          </div>
        </div>
      </AcFlex>
    );
  }

  // Existing dienst selection flow
  return (
    <AcFlex
      column
      spacing='sm'
      className='ac-register-form-section'
      role='group'
      aria-labelledby='dienst-zoek-title'
    >
      <h2 id='dienst-zoek-title' className='sr-only'>
        {isEditMode ? 'Dienst bekijken' : 'Dienst zoeken'}
      </h2>

      {!isEditMode && (
        <Paragraph>
          Zoek naar diensten die op de applicaties in uw applicatielandschap worden
          uitgevoerd. Zoek op de naam van de betrokken applicatie.
          <br />
          <br />
          Alle relevante diensten die relevant zijn voor uw eigen applicaties worden
          weergegeven.
          <br />
          Bestaat de dienst nog niet, dan kunt u deze toevoegen.
          <br />
          <br />
          Na het selecteren van de gewenste dienst kunt u in de volgende stappen
          aanvullende informatie opvoeren.
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
                gevonden dienst en kies &apos;Dienst toevoegen&apos;.
              </span>
            </div>
          </div>
        </Alert>
      )}

      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='module'
            value={gebruik?.module || null}
            onChange={(value) => {
              // Handle array case (when schema type is array but we want single-select)
              let actualValue = value;
              if (Array.isArray(value)) {
                actualValue = value.length > 0 ? value[0] : null;
              }

              // Extract ID from value (could be object or string)
              const nextId =
                (actualValue &&
                  actualValue.data &&
                  (actualValue.data.id || actualValue.data.value)) ||
                (actualValue && actualValue.value) ||
                actualValue;

              // Update gebruik.module
              if (setGebruikData) {
                setGebruikData('module', nextId);
              }

              // Handle both object and string formats for ownApp state
              if (!actualValue) {
                setOwnApp(null);
              } else if (
                typeof actualValue === 'object' &&
                actualValue.value !== undefined
              ) {
                // It's an option object with value property
                setOwnApp(actualValue);
              } else if (typeof actualValue === 'string') {
                // It's just the ID string, find the option
                const option = ownAppOptions.find(
                  (opt) => String(opt.value) === String(actualValue)
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
            optionsProvider={ownAppOptions}
            onSearch={(_path, _refSlug, q) => onSearchModules && onSearchModules(q)}
            customProps={{
              label: 'Applicatie',
              placeholder: 'Selecteer een applicatie',
              isClearable: false,
              required: true,
              isMulti: false, // Force single-select even though schema property is array type
              closeMenuOnSelect: true,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
          {isEditMode
            ? 'Bestaande diensten'
            : ownApp?.value
            ? `Reeds bestaande diensten voor ${ownApp.label}`
            : 'Bestaande diensten'}
        </h3>
        {ownApp?.value && !isEditMode && (
          <Paragraph
            style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}
          >
            Hieronder ziet u alle diensten die al zijn geregistreerd voor de
            geselecteerde applicatie.
          </Paragraph>
        )}
        {!resultsLoading && searchResults.length ? (
          <div className='ac-register-review'>
            <div className='ac-register-review__section'>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {searchResults.map((d, i) => {
                  const dienstId = d?.id || d?.['@self']?.id || String(i);
                  const isSelected =
                    Array.isArray(selectedDienstIds) &&
                    selectedDienstIds.includes(dienstId);

                  // In edit mode, show which dienst(en) are being edited
                  const isBeingEdited = isEditMode && isSelected;

                  const naam = String(
                    (d?.naam || d?.name || d?.title || d?.label || '').toString()
                  ).trim();
                  const beschrijvingKort = String(
                    d?.beschrijvingKort || d?.beschrijving || d?.omschrijving || ''
                  ).trim();
                  const website = String(d?.website || '').trim();
                  // d?.type can be a string, array of strings, or string containing JSON array; handle all cases
                  let type = [];
                  if (Array.isArray(d?.type)) {
                    type = d.type.map((t) => String(t).trim()).filter(Boolean);
                  } else if (
                    typeof d?.type === 'string' &&
                    d.type.trim().startsWith('[')
                  ) {
                    // Handle string containing JSON array like "['id1', 'id2']"
                    try {
                      const parsed = JSON.parse(d.type);
                      if (Array.isArray(parsed)) {
                        type = parsed.map((t) => String(t).trim()).filter(Boolean);
                      } else {
                        type = [String(d.type).trim()];
                      }
                    } catch (e) {
                      type = [String(d.type).trim()];
                    }
                  } else if (d?.type) {
                    type = [String(d.type).trim()];
                  }
                  const aanbieder = d?.aanbieder ? String(d.aanbieder).trim() : null;

                  // Extract modules information - handle both string (single UUID) and array
                  let modules = [];
                  if (Array.isArray(d?.modules)) {
                    modules = d.modules;
                  } else if (d?.modules) {
                    // Single module as string UUID
                    modules = [d.modules];
                  }

                  const moduleLabels = modules
                    .map((m) => {
                      const moduleId = extractRelationId(m);
                      if (moduleId && idToLabel[moduleId]) {
                        return idToLabel[moduleId];
                      }
                      if (typeof m === 'object' && m !== null) {
                        return (
                          m?.naam || m?.name || m?.title || m?.label || moduleId
                        );
                      }
                      return moduleId;
                    })
                    .filter(Boolean);

                  return (
                    <div
                      key={dienstId}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderLeft: isBeingEdited
                          ? '3px solid var(--tilburg-color-primary, #0063e5)'
                          : isSelected
                          ? '2px solid #0063e5'
                          : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: isBeingEdited
                          ? 'var(--tilburg-color-gray-50, #f8f9fa)'
                          : isSelected
                          ? '#f0f7ff'
                          : '#fafafa',
                      }}
                    >
                      {isBeingEdited && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                            color: 'var(--tilburg-color-gray-600, #666)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          U bewerkt deze dienst
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          cursor: loading ? 'default' : 'pointer',
                        }}
                        onClick={() => {
                          if (!loading) {
                            const currentIds = Array.isArray(selectedDienstIds)
                              ? [...selectedDienstIds]
                              : [];
                            if (isSelected) {
                              // Remove from selection
                              setSelectedDienstIds(
                                currentIds.filter((id) => id !== dienstId)
                              );
                            } else {
                              // Add to selection
                              setSelectedDienstIds([...currentIds, dienstId]);
                            }
                          }
                        }}
                      >
                        <label htmlFor={`dienst-${dienstId}`} className='sr-only'>
                          {naam
                            ? `Selecteer dienst ${naam}${
                                type.length > 0 ? `, type: ${type.join(', ')}` : ''
                              }${
                                aanbieder ? `, aanbieder: ${aanbieder}` : ''
                              }`
                            : `Selecteer dienst${
                                type.length > 0 ? `, type: ${type.join(', ')}` : ''
                              }`}
                        </label>
                        <AcCheckbox
                          id={`dienst-${dienstId}`}
                          value={dienstId}
                          checked={isSelected}
                          onChange={(checked) => {
                            if (!loading) {
                              const currentIds = Array.isArray(selectedDienstIds)
                                ? [...selectedDienstIds]
                                : [];
                              if (checked) {
                                // Add to selection
                                if (!currentIds.includes(dienstId)) {
                                  setSelectedDienstIds([...currentIds, dienstId]);
                                }
                              } else {
                                // Remove from selection
                                setSelectedDienstIds(
                                  currentIds.filter((id) => id !== dienstId)
                                );
                              }
                            }
                          }}
                          disabled={loading}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Header row with naam and badges */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            marginBottom: '0.5rem',
                            minWidth: 0,
                          }}
                        >
                          {naam && (
                            <div
                              style={{ flex: 1, minWidth: '200px', flexShrink: 1 }}
                            >
                              <strong style={{ fontSize: '1rem' }}>{naam}</strong>
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              flexWrap: 'wrap',
                              minWidth: 0,
                              flexShrink: 1,
                              maxWidth: '100%',
                              marginLeft: 'auto',
                              justifyContent: 'flex-end',
                            }}
                          >
                            {type.length > 0 && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  color: '#374151',
                                }}
                              >
                                {type.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {beschrijvingKort && (
                          <div
                            style={{
                              color: '#4b5563',
                              fontSize: '0.875rem',
                              marginBottom: '0.5rem',
                              lineHeight: '1.4',
                            }}
                          >
                            {beschrijvingKort}
                          </div>
                        )}

                        {/* Metadata row */}
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            fontSize: '0.8rem',
                            color: '#6b7280',
                          }}
                        >
                          {aanbieder && (
                            <div>
                              <strong>Aanbieder:</strong>{' '}
                              <ConUuidResolver>{aanbieder}</ConUuidResolver>
                            </div>
                          )}
                          {moduleLabels.length > 0 && (
                            <div>
                              <strong>Applicatie(s):</strong>{' '}
                              {moduleLabels.map((label, idx) => (
                                <span key={idx}>
                                  {idx > 0 && ', '}
                                  <ConUuidResolver>{label}</ConUuidResolver>
                                </span>
                              ))}
                            </div>
                          )}
                          {website && (
                            <div>
                              <ConExternalLink
                                href={website}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
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
              ? `Geen bestaande diensten gevonden voor ${ownApp.label}. U kunt deze zelf toevoegen via de knop 'Ik kan de gewenste dienst niet vinden'.`
              : 'Selecteer eerst een applicatie om bestaande diensten te bekijken.'}
          </Paragraph>
        )}
      </div>
    </AcFlex>
  );
};

export default ConFormDienstZoekenStage;
