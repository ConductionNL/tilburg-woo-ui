import React, { memo, useEffect } from 'react';
import { ConSchemaEnhancedField, ConUuidResolver } from '@components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

// Inject spinner keyframes once
const SPINNER_KEYFRAMES_ID = 'con-form-applicaties-spinner-keyframes';

/**
 * Applicaties Selectie Stage
 * - Multi-select dropdown with search functionality for selecting applicaties (modules)
 * - Displays related diensten as read-only cards when applicaties are selected
 */
const ConFormApplicatiesStage = memo(
  ({
    selectedModuleIds,
    setSelectedModuleIds,
    loadingModules,
    searchLoading,
    moduleOptions,
    searchModules,
    schemas,
    dienstenResults = [],
    dienstenResultsLoading = false,
    resolvedModulesFromDiensten = [],
  }) => {
    // Inject CSS keyframes for spinner animation
    useEffect(() => {
      if (!document.getElementById(SPINNER_KEYFRAMES_ID)) {
        const style = document.createElement('style');
        style.id = SPINNER_KEYFRAMES_ID;
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }, []);
    const handleChange = (value) => {
      // ConSchemaEnhancedField with array schema returns an array of IDs for multi-select
      if (Array.isArray(value)) {
        setSelectedModuleIds(value);
      } else {
        setSelectedModuleIds([]);
      }
    };

    // Build a lookup map for module ID to label
    const idToLabel = Object.fromEntries(
      (resolvedModulesFromDiensten || []).map((option) => [
        String(option.value),
        String(option.label),
      ])
    );

    // Helper to extract relation ID from various formats
    const extractRelationId = (relation) => {
      if (!relation) return '';
      if (typeof relation === 'string') return String(relation);
      if (typeof relation === 'object') {
        return (
          String(relation.id || relation.value || relation?.['@self']?.id || '') ||
          ''
        );
      }
      return '';
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-applicaties-section-title'
      >
        <h2 id='dienst-applicaties-section-title' className='sr-only'>
          Applicaties selecteren
        </h2>

        <Paragraph style={{ marginBottom: '1rem' }}>
          Zoek de applicatie(s) waarop u de dienst aanbiedt. Veelal is dat op de
          eigen applicaties, maar u kunt ook diensten op applicaties van andere
          leveranciers aanbieden.
        </Paragraph>

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='modules'
              required={true}
              value={selectedModuleIds}
              onChange={handleChange}
              isDisabled={loadingModules}
              isLoading={loadingModules || searchLoading || dienstenResultsLoading}
              width='full'
              schemas={schemas}
              optionsProvider={moduleOptions}
              onSearch={(_path, _refSlug, q) => searchModules && searchModules(q)}
              customProps={{
                label: 'Applicaties',
                placeholder: 'Selecteer applicaties',
              }}
            />
          </div>
        </div>

        {/* Display diensten related to selected applicaties (read-only) */}
        {selectedModuleIds.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
              Bestaande diensten voor geselecteerde applicaties
            </h3>
            <Paragraph
              style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}
            >
              Hieronder ziet u alle diensten die al zijn geregistreerd voor de
              geselecteerde applicaties.
            </Paragraph>

            <div className='ac-register-review'>
              <div className='ac-register-review__section'>
                {dienstenResultsLoading && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      marginBottom: dienstenResults.length > 0 ? '0.75rem' : 0,
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ddd',
                        borderTopColor: '#0063e5',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      Diensten worden geladen...
                    </span>
                  </div>
                )}

                {dienstenResults.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    {dienstenResults.map((dienstItem, index) => {
                      const dienstId =
                        dienstItem?.id || dienstItem?.['@self']?.id || String(index);

                      const naam = String(
                        (
                          dienstItem?.naam ||
                          dienstItem?.name ||
                          dienstItem?.title ||
                          dienstItem?.label ||
                          ''
                        ).toString()
                      ).trim();
                      const beschrijvingKort = String(
                        dienstItem?.beschrijvingKort ||
                          dienstItem?.beschrijving ||
                          dienstItem?.omschrijving ||
                          ''
                      ).trim();
                      const website = String(dienstItem?.website || '').trim();
                      const type = String(dienstItem?.type || '').trim();
                      const status = String(dienstItem?.status || '').trim();
                      const aanbieder = dienstItem?.aanbieder
                        ? String(dienstItem.aanbieder).trim()
                        : null;

                      // Extract modules information
                      let modules = [];
                      if (Array.isArray(dienstItem?.modules)) {
                        modules = dienstItem.modules;
                      } else if (dienstItem?.modules) {
                        modules = [dienstItem.modules];
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
                            outline: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#fafafa',
                          }}
                        >
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
                                  <strong style={{ fontSize: '1rem' }}>
                                    {naam}
                                  </strong>
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
                                          : status.toLowerCase() ===
                                              'gepubliceerd' ||
                                            status.toLowerCase() === 'published'
                                          ? '#d1e7dd'
                                          : '#e8e8e8',
                                      color:
                                        status.toLowerCase() === 'concept'
                                          ? '#856404'
                                          : status.toLowerCase() ===
                                              'gepubliceerd' ||
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
                                  <span style={{ fontWeight: '500' }}>
                                    Applicaties:
                                  </span>{' '}
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
                                  <span style={{ fontWeight: '500' }}>
                                    Aanbieder:
                                  </span>{' '}
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
                                    style={{
                                      color: '#0063e5',
                                      textDecoration: 'none',
                                    }}
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
                ) : !dienstenResultsLoading ? (
                  <Paragraph style={{ margin: 0 }}>
                    Geen bestaande diensten gevonden voor de geselecteerde
                    applicaties.
                  </Paragraph>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ConFormApplicatiesStage.displayName = 'ConFormApplicatiesStage';

export default ConFormApplicatiesStage;
