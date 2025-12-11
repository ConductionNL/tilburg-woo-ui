import React, { memo } from 'react';
import { ConUuidResolver } from '@components';
import { AcLink } from '@src/molecules';
import {
  UnorderedList,
  UnorderedListItem,
  Separator,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
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

    // const productsWithDetails = getProductsWithDetails();
    const modulesWithDetails = getModulesWithDetails();

    return (
      <div>
        <Paragraph>
          Bekijk hieronder de ingevulde gegevens. Controleer of alle informatie klopt
          voordat u uw dienst aanmeldt. U kunt velden nog aanpassen via de
          &apos;Vorige&apos; knop of op een later moment via uw eigen omgeving.
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
                {dienst.type ? (
                  <ConUuidResolver>{dienst.type}</ConUuidResolver>
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
