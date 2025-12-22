import React, { useState } from 'react';
import { AcFlex } from '@src/atoms';
import { AcCheckbox } from '@src/molecules';
import { ConSchemaEnhancedField, ConUuidResolver } from '@src/components';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

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

  // Manage visibility state of info alert
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('dienst-zoeken-info-alert-closed');
  });

  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('dienst-zoeken-info-alert-closed', 'true');
  };

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
            schemaType='dienst'
            schemaProperty='modules'
            value={ownApp?.value || null}
            onChange={(value) => {
              // Handle array case (when schema type is array but we want single-select)
              let actualValue = value;
              if (Array.isArray(value)) {
                actualValue = value.length > 0 ? value[0] : null;
              }

              // Handle both object and string formats
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

                  const naam = String(
                    (d?.naam || d?.name || d?.title || d?.label || '').toString()
                  ).trim();
                  const beschrijvingKort = String(
                    d?.beschrijvingKort || d?.beschrijving || d?.omschrijving || ''
                  ).trim();
                  const website = String(d?.website || '').trim();
                  const type = String(d?.type || '').trim();
                  const status = String(d?.status || '').trim();
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
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '1rem',
                        outline: isSelected ? '2px solid #0063e5' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#f0f7ff' : '#fafafa',
                        cursor: isEditMode || loading ? 'default' : 'pointer',
                      }}
                      onClick={() => {
                        if (!isEditMode && !loading) {
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
                      <div style={{ marginTop: '0.125rem' }}>
                        <AcCheckbox
                          id={`dienst-${dienstId}`}
                          value={dienstId}
                          checked={isSelected}
                          onChange={(checked) => {
                            if (!isEditMode && !loading) {
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
                          disabled={isEditMode || loading}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        {/* Header row with naam and badges */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            marginBottom: '0.5rem',
                            flexWrap: 'wrap',
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
                            {type && (
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
                                {type}
                              </span>
                            )}
                            {status && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor:
                                    status.toLowerCase() === 'concept'
                                      ? '#fff3cd'
                                      : status.toLowerCase() === 'gepubliceerd' ||
                                        status.toLowerCase() === 'published'
                                      ? '#d1e7dd'
                                      : '#e8e8e8',
                                  color:
                                    status.toLowerCase() === 'concept'
                                      ? '#856404'
                                      : status.toLowerCase() === 'gepubliceerd' ||
                                        status.toLowerCase() === 'published'
                                      ? '#0f5132'
                                      : '#333',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                }}
                              >
                                {status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {beschrijvingKort && (
                          <div
                            style={{
                              color: '#666',
                              fontSize: '0.9rem',
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
                            flexDirection: 'column',
                            gap: '0.375rem',
                            fontSize: '0.875rem',
                            color: '#666',
                          }}
                        >
                          {moduleLabels.length > 0 && (
                            <div>
                              <span style={{ fontWeight: '500' }}>Applicaties:</span>{' '}
                              {moduleLabels.map((label, idx) => (
                                <span key={idx}>
                                  <ConUuidResolver>{label}</ConUuidResolver>
                                  {idx < moduleLabels.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {aanbieder && (
                            <div>
                              <span style={{ fontWeight: '500' }}>Aanbieder:</span>{' '}
                              <ConUuidResolver>{aanbieder}</ConUuidResolver>
                            </div>
                          )}
                          {website && (
                            <div>
                              <span style={{ fontWeight: '500' }}>Website:</span>{' '}
                              <a
                                href={
                                  website.startsWith('http')
                                    ? website
                                    : `https://${website}`
                                }
                                target='_blank'
                                rel='noopener noreferrer'
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: '#0063e5', textDecoration: 'none' }}
                              >
                                {website}
                              </a>
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
