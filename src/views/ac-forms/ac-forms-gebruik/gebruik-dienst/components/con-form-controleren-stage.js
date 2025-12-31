import React, { memo, useState } from 'react';
import { ConUuidResolver } from '@components';
import { AcLink } from '@src/molecules';
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
  }) => {
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
        .map((dienst) => ({
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
          type: String(dienst?.type || ''),
          aanbieder: dienst?.aanbieder ? String(dienst.aanbieder) : null,
        }));
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

          {/* Diensten section */}
          <div className='con-form-wizard-review-heading-container'>
            <h3 className='con-form-wizard-review-heading-header'>Diensten</h3>
            <div className='ac-register-review'>
              <div className='ac-register-review__section'>
                {selectedDienstenWithDetails.length > 0 ? (
                  <UnorderedList>
                    {selectedDienstenWithDetails.map((dienst, i) => (
                      <UnorderedListItem key={`dienst-${dienst.id}-${i}`}>
                        <div>
                          <strong>
                            {dienst.naam ? (
                              <ConUuidResolver>{dienst.naam}</ConUuidResolver>
                            ) : (
                              'Onbekende dienst'
                            )}
                          </strong>
                          {dienst.beschrijvingKort && (
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                marginTop: '0.25rem',
                              }}
                            >
                              {dienst.beschrijvingKort}
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
                            {dienst.type && (
                              <div>
                                <span style={{ fontWeight: '500' }}>Type:</span>{' '}
                                <ConUuidResolver>{dienst.type}</ConUuidResolver>
                              </div>
                            )}
                            {dienst.aanbieder && (
                              <div>
                                <span style={{ fontWeight: '500' }}>Aanbieder:</span>{' '}
                                <ConUuidResolver>{dienst.aanbieder}</ConUuidResolver>
                              </div>
                            )}
                            {dienst.website && (
                              <div>
                                <span style={{ fontWeight: '500' }}>Website:</span>{' '}
                                <AcLink
                                  href={
                                    dienst.website.startsWith('http')
                                      ? dienst.website
                                      : `https://${dienst.website}`
                                  }
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  {dienst.website}
                                </AcLink>
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

          {/* Gebruiksinformatie section */}
          <div className='con-form-wizard-review-heading-container'>
            <h3 className='con-form-wizard-review-heading-header'>
              Gebruiksinformatie
            </h3>
            <div className='ac-register-review__section'>
              <div className='ac-register-review__field'>
                <strong>Status:</strong>{' '}
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
                  <strong>Interne aantekening:</strong>
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
                <strong>Korte beschrijving:</strong>
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
                  Lange beschrijving:
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
              <strong>Website:</strong>{' '}
              {dienst.website ? (
                <AcLink
                  href={dienst.website}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ConUuidResolver>{dienst.website}</ConUuidResolver>
                </AcLink>
              ) : (
                '-'
              )}
            </div>

            <div className='ac-register-review__field'>
              <strong>Type:</strong>{' '}
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
                <strong>Contactpersoon:</strong>{' '}
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
                  <strong>Aanbieder:</strong>{' '}
                  <span>
                    <ConUuidResolver>{dienst.aanbieder}</ConUuidResolver>
                  </span>
                </div>
              ) : aanbiederKeuze === 'nieuw' && aanbiederOrganisatie ? (
                <>
                  {aanbiederOrganisatie.naam && (
                    <div className='ac-register-review__field'>
                      <strong>Naam:</strong> <span>{aanbiederOrganisatie.naam}</span>
                    </div>
                  )}
                  {aanbiederOrganisatie.type && (
                    <div className='ac-register-review__field'>
                      <strong>Type:</strong>{' '}
                      <span>
                        <ConUuidResolver>
                          {aanbiederOrganisatie.type}
                        </ConUuidResolver>
                      </span>
                    </div>
                  )}
                  {aanbiederOrganisatie.website && (
                    <div className='ac-register-review__field'>
                      <strong>Website:</strong>{' '}
                      {aanbiederOrganisatie.website ? (
                        <AcLink
                          href={aanbiederOrganisatie.website}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {aanbiederOrganisatie.website}
                        </AcLink>
                      ) : (
                        '-'
                      )}
                    </div>
                  )}
                  {aanbiederOrganisatie.beschrijvingKort && (
                    <div className='ac-register-review__field'>
                      <strong>Korte beschrijving:</strong>
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
                        Lange beschrijving:
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
                      <strong>E-mailadres:</strong>{' '}
                      <span>{aanbiederOrganisatie['e-mailadres']}</span>
                    </div>
                  )}
                  {aanbiederOrganisatie.telefoonnummer && (
                    <div className='ac-register-review__field'>
                      <strong>Telefoonnummer:</strong>{' '}
                      <span>{aanbiederOrganisatie.telefoonnummer}</span>
                    </div>
                  )}
                  {aanbiederOrganisatie.logo && (
                    <div className='ac-register-review__field'>
                      <strong>Logo:</strong>
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
