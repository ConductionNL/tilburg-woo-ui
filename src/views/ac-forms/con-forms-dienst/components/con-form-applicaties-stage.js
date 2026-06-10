import React, { memo } from 'react';
import {
  ConSchemaEnhancedField,
  ConUuidResolver,
  AcLoader,
  ConExternalLink,
} from '@components';
import { AcButton } from '@src/molecules';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

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
    showNewApplicatieForm = false,
    nieuweApplicatie = {},
    setNieuweApplicatieData = () => {},
    leverancierKeuze = 'bestaand',
    setLeverancierKeuze = () => {},
    nieuweLeverancier = {},
    setNieuweLeverancierData = () => {},
    leverancierOptions = [],
    leverancierLoading = false,
    searchLeveranciers = () => {},
    isEditMode = false,
    editingDienstId = '',
  }) => {
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

        {/* New application form */}
        {showNewApplicatieForm ? (
          <div className='con-dynamic-form-container'>
            <div className='con-form-fields-container'>
              {/* Section 1: Leverancier */}
              <h3 className='utrecht-heading-3' style={{ width: '100%' }}>
                {leverancierKeuze === 'nieuw'
                  ? 'Leverancier aanmaken'
                  : 'Leverancier selecteren'}
              </h3>

              {/* Existing leverancier dropdown */}
              {leverancierKeuze !== 'nieuw' ? (
                <>
                  <ConSchemaEnhancedField
                    schemaType='module'
                    schemaProperty='aanbieder'
                    value={nieuweApplicatie?.leverancier || null}
                    onChange={(value) => {
                      const nextId =
                        (value && value.data && (value.data.id || value.data.value)) ||
                        (value && value.value) ||
                        value;
                      setNieuweApplicatieData('leverancier', nextId);
                    }}
                    isDisabled={loadingModules}
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
                      onClick={() => setLeverancierKeuze('nieuw')}
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
                    value={nieuweLeverancier?.naam || ''}
                    onChange={(value) => setNieuweLeverancierData('naam', value)}
                    isDisabled={loadingModules}
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
                    value={nieuweLeverancier?.website || ''}
                    onChange={(value) => setNieuweLeverancierData('website', value)}
                    isDisabled={loadingModules}
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
                    onClick={() => setLeverancierKeuze('bestaand')}
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
                value={nieuweApplicatie?.naam || ''}
                onChange={(value) => setNieuweApplicatieData('naam', value)}
                isDisabled={loadingModules}
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
                value={nieuweApplicatie?.website || ''}
                onChange={(value) => setNieuweApplicatieData('website', value)}
                isDisabled={loadingModules}
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
                value={nieuweApplicatie?.beschrijvingKort || ''}
                onChange={(value) => setNieuweApplicatieData('beschrijvingKort', value)}
                isDisabled={loadingModules}
                width='full'
                schemas={schemas}
                customProps={{
                  description:
                    'Een korte beschrijving van de applicatie voor o.a. in de zoekresultaten.',
                }}
              />
            </div>
          </div>
        ) : (
          // Existing application selection
          <div className='ac-register-form-grid'>
            <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
              <ConSchemaEnhancedField
                schemaType='dienst'
                schemaProperty='modules'
                required={true}
                value={selectedModuleIds}
                onChange={handleChange}
                isDisabled={loadingModules}
                isLoading={
                  loadingModules || searchLoading || dienstenResultsLoading
                }
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
        )}

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
                      marginBottom: dienstenResults.length > 0 ? '0.75rem' : 0,
                    }}
                  >
                    <AcLoader
                      style={{ height: 'auto', flex: 'none', fontSize: '0.5rem' }}
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

                      // Check if this is the dienst being edited
                      const isCurrentDienst =
                        isEditMode &&
                        editingDienstId &&
                        String(dienstId) === String(editingDienstId);

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
                      
                      // Handle type - could be array, object, string, or string containing JSON array
                      // Return as array for rendering separate tags
                      const typeArray = (() => {
                        const rawType = dienstItem?.type;
                        if (!rawType) return [];
                        
                        // Check if it's a string that looks like a JSON array
                        if (typeof rawType === 'string' && rawType.trim().startsWith('[')) {
                          try {
                            const parsed = JSON.parse(rawType);
                            if (Array.isArray(parsed)) {
                              return parsed
                                .map((item) => (typeof item === 'string' ? item : String(item)))
                                .filter(Boolean);
                            }
                          } catch (e) {
                            // If parsing fails, return as single item array
                            return [String(rawType)];
                          }
                        }
                        
                        // Handle actual arrays
                        if (Array.isArray(rawType) && rawType.length > 0) {
                          return rawType
                            .map((t) =>
                              typeof t === 'object'
                                ? t.naam || t.name || t.label || String(t)
                                : String(t)
                            )
                            .filter(Boolean);
                        }
                        
                        // Handle objects
                        if (typeof rawType === 'object') {
                          return [String(
                            rawType.naam || rawType.name || rawType.label || rawType
                          )];
                        }
                        
                        return [String(rawType)];
                      })();
                      
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
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderLeft: isCurrentDienst
                              ? '3px solid var(--tilburg-color-primary, #0063e5)'
                              : '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: isCurrentDienst
                              ? 'var(--tilburg-color-gray-50, #f8f9fa)'
                              : '#fafafa',
                          }}
                        >
                          {isCurrentDienst && (
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
                                  gap: '0.25rem',
                                  flexWrap: 'wrap',
                                  justifyContent: 'flex-end',
                                  marginLeft: 'auto',
                                }}
                              >
                                {typeArray.length > 0 && typeArray.map((typeItem, index) => (
                                  <span
                                    key={index}
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
                                    {typeItem}
                                  </span>
                                ))}
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
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{ fontWeight: '500' }}>Website:</span>
                                  <ConExternalLink href={website} />
                                </div>
                              )}
                            </div>
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
