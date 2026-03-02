import React, { memo, useState } from 'react';
import { ConUuidResolver, ConExternalLink } from '@components';
import {
  UnorderedList,
  UnorderedListItem,
  Separator,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
// Import MDEditor for markdown rendering
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';

const ConFormControlerenStage = memo(
  ({
    dienst,
    selectedModuleIds,
    moduleOptionsByProduct,
    formType,
    aanbiederKeuze,
    aanbiederOrganisatie,
    // Gebruik-beheerders flow props
    isGebruikBeheerdersFlow = false,
    gebruik,
    dienstenResults = [],
    deelnemerOptions = [],
    // New dienst creation props
    dienstKeuze,
    nieuweDienst,
    leverancierKeuze,
    leverancierOrganisatie,
    // Schemas for field labels
    schemas = {},
  }) => {
    // Helper function to get schema label for a field
    const getSchemaLabel = (schemaType, propertyName, fallback) => {
      if (!schemas || !schemaType || !propertyName) return fallback;

      const schema = schemas[schemaType];
      if (!schema || !schema.properties) return fallback;

      const propertySchema = schema.properties[propertyName];
      if (!propertySchema) return fallback;

      return propertySchema.title || fallback;
    };

    // Helper to get module information with additional details
    const getModulesWithDetails = () => {
      return (selectedModuleIds || []).map((id) => {
        // moduleOptionsByProduct now contains { all: [...] } structure
        const allModules = moduleOptionsByProduct?.all || [];
        const option = allModules.find((o) => o.value === id);
        return {
          id,
          label: option?.label || id,
          data: option?.data || null,
        };
      });
    };

    // Helper to get selected diensten with details for Gebruik-beheerders flow
    const getSelectedDienstenWithDetails = () => {
      if (
        !isGebruikBeheerdersFlow ||
        !gebruik?.diensten ||
        !Array.isArray(gebruik.diensten)
      ) {
        return [];
      }

      const selectedDienstIds = gebruik.diensten.map((id) => String(id));
      return dienstenResults
        .filter((dienst) => {
          const dienstId = String(dienst?.id || dienst?.['@self']?.id || '');
          return selectedDienstIds.includes(dienstId);
        })
        .map((dienst) => {
          // Parse type field - handle string, array, or string containing JSON array
          let parsedType = '';
          if (Array.isArray(dienst?.type)) {
            parsedType = dienst.type.map((t) => String(t)).join(', ');
          } else if (typeof dienst?.type === 'string' && dienst.type.trim().startsWith('[')) {
            // Handle string containing JSON array like "['id1', 'id2']"
            try {
              const parsed = JSON.parse(dienst.type);
              if (Array.isArray(parsed)) {
                parsedType = parsed.map((t) => String(t)).join(', ');
              } else {
                parsedType = String(dienst.type);
              }
            } catch (e) {
              parsedType = String(dienst.type);
            }
          } else {
            parsedType = String(dienst?.type || '');
          }

          return {
            id: dienst?.id || dienst?.['@self']?.id || '',
            naam: String(
              dienst?.naam || dienst?.name || dienst?.title || dienst?.label || ''
            ),
            beschrijvingKort: String(
              dienst?.beschrijvingKort ||
                dienst?.beschrijving ||
                dienst?.omschrijving ||
                ''
            ),
            website: String(dienst?.website || ''),
            type: parsedType,
            aanbieder: dienst?.aanbieder ? String(dienst.aanbieder) : null,
          };
        });
    };

    // Helper to get selected deelnemers with labels
    const getSelectedDeelnemersWithLabels = () => {
      if (
        !isGebruikBeheerdersFlow ||
        !gebruik?.deelnemers ||
        !Array.isArray(gebruik.deelnemers)
      ) {
        return [];
      }

      const selectedDeelnemerIds = gebruik.deelnemers.map((id) => String(id));
      return deelnemerOptions
        .filter((option) => selectedDeelnemerIds.includes(String(option.value)))
        .map((option) => ({
          id: option.value,
          label: option.label,
        }));
    };

    // const productsWithDetails = getProductsWithDetails();
    const modulesWithDetails = getModulesWithDetails();
    const selectedDienstenWithDetails = getSelectedDienstenWithDetails();
    const selectedDeelnemersWithLabels = getSelectedDeelnemersWithLabels();

    // Helper to get leverancier label for new dienst (following koppeling pattern)
    const getLeverancierLabelForNewDienst = () => {
      if (leverancierKeuze === 'nieuw') {
        return leverancierOrganisatie?.naam || '';
      }

      // First check if we have a stored label (from selection)
      if (nieuweDienst?.leverancierLabel) {
        return nieuweDienst.leverancierLabel;
      }

      // Fallback to leverancier ID (will be resolved by ConUuidResolver)
      return nieuweDienst?.leverancier || '';
    };

    const isNewLeverancier = leverancierKeuze === 'nieuw';
    const leverancierDisplayName = getLeverancierLabelForNewDienst();
    const leverancierWebsite = isNewLeverancier
      ? leverancierOrganisatie?.website || ''
      : '';

    // Manage visibility state of info alert
    const [showInfoAlert, setShowInfoAlert] = useState(() => {
      return !sessionStorage.getItem('interne-notitie-info-alert-closed');
    });

    const handleCloseAlert = () => {
      setShowInfoAlert(false);
      sessionStorage.setItem('interne-notitie-info-alert-closed', 'true');
    };

    // Render Gebruik-beheerders flow sections
    if (isGebruikBeheerdersFlow) {
      return (
        <div>
          <Paragraph>
            Controleer of het overzicht van de dienst volledig en juist is voordat u
            verder gaat.
            <br />
            U kunt met Vorige terug naar de eerdere stappen.
            <br />
            Na het registreren van de koppeling kunt u via uw &quot;Dashboard&quot;
            de koppeling opzoeken en indien gewenst aanpassen.
          </Paragraph>
          <br />

          {/* Closeable info alert */}
          {showInfoAlert && (
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
                  <strong>Interne notitie</strong>
                  <br />
                  <span className='ac-forms-product-info-alert__text'>
                    De interne notitie is alleen te lezen door gebruikers binnen uw
                    organisatie.
                  </span>
                </div>
              </div>
            </Alert>
          )}
          <br />

          {/* Nieuwe Leverancier Section - only shown when creating a NEW leverancier */}
          {dienstKeuze === 'nieuw' &&
            isNewLeverancier &&
            leverancierOrganisatie?.naam && (
              <div className='con-form-wizard-review-heading-container'>
                <h3 className='con-form-wizard-review-heading-header'>
                  Nieuwe leverancier
                </h3>
                <div className='ac-register-review'>
                  <div className='ac-register-review__section'>
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'naam', 'Naam')}:</strong>{' '}
                      <span>{leverancierDisplayName || '-'}</span>
                    </div>
                    {leverancierWebsite && (
                      <div
                        className='ac-register-review__field'
                        style={{ display: 'flex', gap: '4px' }}
                      >
                        <strong>{getSchemaLabel('organisatie', 'website', 'Website')}:</strong>
                        <ConExternalLink href={leverancierWebsite} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* New Dienst section (when creating new dienst) */}
          {dienstKeuze === 'nieuw' && (
            <div className='con-form-wizard-review-heading-container'>
              <h3 className='con-form-wizard-review-heading-header'>
                Nieuwe dienst
              </h3>
              <div className='ac-register-review'>
                <div className='ac-register-review__section'>
                  <div className='ac-register-review__field'>
                    <strong>{getSchemaLabel('dienst', 'aanbieder', 'Aanbieder')}:</strong>
                    <div>
                      {isNewLeverancier ? (
                        leverancierDisplayName || '-'
                      ) : leverancierDisplayName ? (
                        <ConUuidResolver>{leverancierDisplayName}</ConUuidResolver>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  <div className='ac-register-review__field'>
                    <strong>{getSchemaLabel('dienst', 'naam', 'Naam')}:</strong> <span>{nieuweDienst?.naam || '-'}</span>
                  </div>
                  {nieuweDienst?.type && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('dienst', 'type', 'Type')}:</strong> <span>{nieuweDienst.type}</span>
                    </div>
                  )}
                  {nieuweDienst?.website && (
                    <div
                      className='ac-register-review__field'
                      style={{ display: 'flex', gap: '4px' }}
                    >
                      <strong>{getSchemaLabel('dienst', 'website', 'Website')}:</strong>
                      <ConExternalLink href={nieuweDienst.website} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Diensten section (when selecting existing diensten) */}
          {dienstKeuze !== 'nieuw' && (
            <div className='con-form-wizard-review-heading-container'>
              <h3 className='con-form-wizard-review-heading-header'>Diensten</h3>
              <div className='ac-register-review'>
                <div className='ac-register-review__section'>
                  {selectedDienstenWithDetails.length > 0 ? (
                    <UnorderedList>
                      {selectedDienstenWithDetails.map((dienstItem, i) => (
                        <UnorderedListItem key={`dienst-${dienstItem.id}-${i}`}>
                          <div>
                            <strong>
                              {dienstItem.naam ? (
                                <ConUuidResolver>{dienstItem.naam}</ConUuidResolver>
                              ) : (
                                'Onbekende dienst'
                              )}
                            </strong>
                            {dienstItem.beschrijvingKort && (
                              <div
                                style={{
                                  fontSize: '0.875rem',
                                  color: '#666',
                                  marginTop: '0.25rem',
                                }}
                              >
                                {dienstItem.beschrijvingKort}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                marginTop: '0.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                              }}
                            >
                              {dienstItem.type && (
                                <div>
                                  <span style={{ fontWeight: '500' }}>Type:</span>{' '}
                                  <ConUuidResolver>
                                    {dienstItem.type}
                                  </ConUuidResolver>
                                </div>
                              )}
                              {dienstItem.aanbieder && (
                                <div>
                                  <span style={{ fontWeight: '500' }}>
                                    Aanbieder:
                                  </span>{' '}
                                  <ConUuidResolver>
                                    {dienstItem.aanbieder}
                                  </ConUuidResolver>
                                </div>
                              )}
                              {dienstItem.website && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{ fontWeight: '500' }}>Website:</span>
                                  <ConExternalLink href={dienstItem.website} />
                                </div>
                              )}
                            </div>
                          </div>
                        </UnorderedListItem>
                      ))}
                    </UnorderedList>
                  ) : (
                    <div className='ac-register-review__field'>
                      <Paragraph style={{ fontStyle: 'italic', color: '#666' }}>
                        Geen diensten geselecteerd
                      </Paragraph>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Gebruiksinformatie section */}
          <div className='con-form-wizard-review-heading-container'>
            <h3 className='con-form-wizard-review-heading-header'>
              Gebruiksinformatie
            </h3>
            <div className='ac-register-review__section'>
            <div className='ac-register-review__field'>
              <strong>{getSchemaLabel('gebruik', 'status', 'Status')}:</strong>{' '}
                {gebruik?.status ? (
                  <span>
                    <ConUuidResolver>{gebruik.status}</ConUuidResolver>
                  </span>
                ) : (
                  <span style={{ fontStyle: 'italic', color: '#666' }}>-</span>
                )}
              </div>
              {gebruik?.interneAantekening && (
                <div className='ac-register-review__field'>
                  <strong>{getSchemaLabel('gebruik', 'interneAantekening', 'Interne aantekening')}:</strong>
                  <div
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      marginTop: '0.25rem',
                    }}
                  >
                    {gebruik.interneAantekening}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deelnemers section - only show if deelnemers were selected */}
          {selectedDeelnemersWithLabels.length > 0 && (
            <div className='con-form-wizard-review-heading-container'>
              <h3 className='con-form-wizard-review-heading-header'>Deelnemers</h3>
              <div className='ac-register-review'>
                <div className='ac-register-review__section'>
                  <div className='ac-register-review__field'>
                    <UnorderedList>
                      {selectedDeelnemersWithLabels.map((deelnemer, i) => (
                        <UnorderedListItem key={`deelnemer-${deelnemer.id}-${i}`}>
                          <ConUuidResolver>{deelnemer.label}</ConUuidResolver>
                        </UnorderedListItem>
                      ))}
                    </UnorderedList>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Render Aanbod-beheerders flow sections (existing code)
    return (
      <div>
        <Paragraph>
          Controleer of het overzicht van de dienst volledig en juist is voordat u
          verder gaat.
          <br />
          U kunt met Vorige terug naar de eerdere stappen.
          <br />
          Na het registreren van de dienst kunt u via uw “Dashboard” de dienst
          opzoeken en indien gewenst aanpassen.
        </Paragraph>
        <br />

        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>
            Dienst informatie
          </h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>
                {dienst.naam ? (
                  <ConUuidResolver>{dienst.naam}</ConUuidResolver>
                ) : (
                  'Onbekende dienst'
                )}
              </h4>
              {dienst.logo && (
                <ConLogoPreview
                  logoUrl={dienst.logo}
                  className='ac-register-review__logo'
                />
              )}
            </div>
            <Separator className='con-form-wizard-review-header__separator' />

            {dienst.beschrijvingKort && (
              <div className='ac-register-review__field'>
                <strong>{getSchemaLabel('dienst', 'beschrijvingKort', 'Korte beschrijving')}:</strong>
                <div
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    marginTop: '0.25rem',
                  }}
                >
                  <ConUuidResolver>{dienst.beschrijvingKort}</ConUuidResolver>
                </div>
              </div>
            )}

            {dienst.beschrijvingLang && (
              <div className='ac-register-review__description'>
                <strong className='ac-register-review__description__heading'>
                  {getSchemaLabel('dienst', 'beschrijvingLang', 'Lange beschrijving')}:
                </strong>
                <div
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                  }}
                >
                  <MDEditor.Markdown
                    wrapperElement={{
                      'data-color-mode': 'light',
                    }}
                    className='con-my-account-description'
                    source={dienst.beschrijvingLang}
                    remarkPlugins={[
                      [remarkGfm, { singleTilde: false }],
                      remarkDefinitionList,
                      remarkEmoji,
                      remarkSupersub,
                      remarkMark,
                    ]}
                    rehypePlugins={[
                      rehypeSlug,
                      [rehypeSanitize],
                      [remarkRehype, { handlers: { ...defListHastHandlers } }],
                    ]}
                  />
                </div>
              </div>
            )}

            <div className='ac-register-review__field'>
              <strong>{getSchemaLabel('dienst', 'website', 'Website')}:</strong> <ConExternalLink href={dienst.website} />
            </div>

            <div className='ac-register-review__field'>
              <strong>{getSchemaLabel('dienst', 'type', 'Type')}:</strong>{' '}
              <span>
                {Array.isArray(dienst.type) && dienst.type.length > 0 ? (
                  <span>
                    {dienst.type.map((typeId, index) => (
                      <React.Fragment key={index}>
                        <ConUuidResolver>{String(typeId)}</ConUuidResolver>
                        {index < dienst.type.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </span>
                ) : dienst.type && !Array.isArray(dienst.type) ? (
                  // Backward compatibility: handle string type
                  <ConUuidResolver>{String(dienst.type)}</ConUuidResolver>
                ) : (
                  '-'
                )}
              </span>
            </div>

            {dienst.contactpersoon && (
              <div className='ac-register-review__field'>
                <strong>{getSchemaLabel('dienst', 'contactpersoon', 'Contactpersoon')}:</strong>{' '}
                <span>
                  {typeof dienst.contactpersoon === 'object' ? (
                    // Handle contactpersoon as object with name properties
                    (() => {
                      const c = dienst.contactpersoon;
                      // Try different name combinations for contactpersoon
                      const fullName = [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
                        .filter(Boolean)
                        .join(' ');

                      // Fallback to other name properties if voornaam/achternaam not available
                      if (fullName.trim()) {
                        return fullName;
                      }

                      // Try alternative name properties
                      return (
                        c?.['@self']?.name ||
                        c?.naam ||
                        c?.name ||
                        c?.displayName ||
                        c?.label ||
                        c?.id ||
                        'Onbekende contactpersoon'
                      );
                    })()
                  ) : (
                    // Handle contactpersoon as UUID string - resolve with ConUuidResolver
                    <ConUuidResolver>{dienst.contactpersoon}</ConUuidResolver>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>Applicaties</h3>
          <div className='ac-register-review'>
            <div className='ac-register-review__section'>
              {modulesWithDetails.length > 0 ? (
                <div className='ac-register-review__field'>
                  <UnorderedList>
                    {modulesWithDetails.map((module, i) => (
                      <UnorderedListItem key={`mod-${module.id}-${i}`}>
                        <div>
                          <strong>
                            <ConUuidResolver>{module.label}</ConUuidResolver>
                          </strong>
                          {module.data?.beschrijvingKort && (
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                marginTop: '0.25rem',
                              }}
                            >
                              {module.data.beschrijvingKort}
                            </div>
                          )}
                          {module.data?.licentieType && (
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                marginTop: '0.25rem',
                              }}
                            >
                              Licentie: {module.data.licentieType}
                              {module.data.licentie &&
                                module.data.licentieType !== 'Closed Source' &&
                                ` (${module.data.licentie})`}
                            </div>
                          )}
                        </div>
                      </UnorderedListItem>
                    ))}
                  </UnorderedList>
                </div>
              ) : (
                <div className='ac-register-review__field'>
                  <Paragraph style={{ fontStyle: 'italic', color: '#666' }}>
                    Geen applicaties geselecteerd
                  </Paragraph>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aanbieder section - only shown for ontbrekend-dienst */}
        {formType === 'ontbrekend-dienst' && (
          <div className='con-form-wizard-review-heading-container'>
            <h3 className='con-form-wizard-review-heading-header'>Aanbieder</h3>
            <div className='ac-register-review__section'>
              {aanbiederKeuze === 'bestaand' && dienst.aanbieder ? (
                <div className='ac-register-review__field'>
                  <strong>{getSchemaLabel('dienst', 'aanbieder', 'Aanbieder')}:</strong>{' '}
                  <span>
                    <ConUuidResolver>{dienst.aanbieder}</ConUuidResolver>
                  </span>
                </div>
              ) : aanbiederKeuze === 'nieuw' && aanbiederOrganisatie ? (
                <>
                  {aanbiederOrganisatie.naam && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'naam', 'Naam')}:</strong> <span>{aanbiederOrganisatie.naam}</span>
                    </div>
                  )}
                  {aanbiederOrganisatie.type && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'type', 'Type')}:</strong>{' '}
                      <span>
                        <ConUuidResolver>
                          {aanbiederOrganisatie.type}
                        </ConUuidResolver>
                      </span>
                    </div>
                  )}
                  {aanbiederOrganisatie.website && (
                    <div
                      className='ac-register-review__field'
                      style={{ display: 'flex', gap: '4px' }}
                    >
                      <strong>{getSchemaLabel('organisatie', 'website', 'Website')}:</strong>
                      <ConExternalLink href={aanbiederOrganisatie.website} />
                    </div>
                  )}
                  {aanbiederOrganisatie.beschrijvingKort && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'beschrijvingKort', 'Korte beschrijving')}:</strong>
                      <div
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          marginTop: '0.25rem',
                        }}
                      >
                        {aanbiederOrganisatie.beschrijvingKort}
                      </div>
                    </div>
                  )}
                  {aanbiederOrganisatie.beschrijvingLang && (
                    <div className='ac-register-review__description'>
                      <strong className='ac-register-review__description__heading'>
                        {getSchemaLabel('organisatie', 'beschrijvingLang', 'Lange beschrijving')}:
                      </strong>
                      <div
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                        }}
                      >
                        <MDEditor.Markdown
                          wrapperElement={{
                            'data-color-mode': 'light',
                          }}
                          className='con-my-account-description'
                          source={aanbiederOrganisatie.beschrijvingLang}
                          remarkPlugins={[
                            [remarkGfm, { singleTilde: false }],
                            remarkDefinitionList,
                            remarkEmoji,
                            remarkSupersub,
                            remarkMark,
                          ]}
                          rehypePlugins={[
                            rehypeSlug,
                            [rehypeSanitize],
                            [remarkRehype, { handlers: { ...defListHastHandlers } }],
                          ]}
                        />
                      </div>
                    </div>
                  )}
                  {aanbiederOrganisatie['e-mailadres'] && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'e-mailadres', 'E-mailadres')}:</strong>{' '}
                      <span>{aanbiederOrganisatie['e-mailadres']}</span>
                    </div>
                  )}
                  {aanbiederOrganisatie.telefoonnummer && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'telefoonnummer', 'Telefoonnummer')}:</strong>{' '}
                      <span>{aanbiederOrganisatie.telefoonnummer}</span>
                    </div>
                  )}
                  {aanbiederOrganisatie.logo && (
                    <div className='ac-register-review__field'>
                      <strong>{getSchemaLabel('organisatie', 'logo', 'Logo')}:</strong>
                      <ConLogoPreview
                        logoUrl={aanbiederOrganisatie.logo}
                        className='ac-register-review__logo'
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className='ac-register-review__field'>
                  <Paragraph style={{ fontStyle: 'italic', color: '#666' }}>
                    Geen aanbieder geselecteerd
                  </Paragraph>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ConFormControlerenStage.displayName = 'ConFormControlerenStage';

export default ConFormControlerenStage;
