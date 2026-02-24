import React, { memo, useState, useEffect, useMemo } from 'react';
import { ConUuidResolver, ConExternalLink } from '@components';
import { withStore } from '@stores';
import {
  UnorderedList,
  UnorderedListItem,
  Separator,
  Paragraph,
  Link,
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
    store,
    // New application flow props
    showNewApplicatieForm = false,
    nieuweApplicatie = {},
    leverancierKeuze = 'bestaand',
    nieuweLeverancier = {},
    leverancierOptions = [],
    // Schemas for field labels
    schemas = {},
  }) => {
    // State for fetched contactpersoon data
    const [contactpersoonData, setContactpersoonData] = useState(null);

    // Helper function to get schema label for a field
    const getSchemaLabel = (schemaType, propertyName, fallback) => {
      if (!schemas || !schemaType || !propertyName) return fallback;

      const schema = schemas[schemaType];
      if (!schema || !schema.properties) return fallback;

      const propertySchema = schema.properties[propertyName];
      if (!propertySchema) return fallback;

      return propertySchema.title || fallback;
    };

    // Extract contactpersoon ID from dienst
    const contactpersoonId = useMemo(() => {
      if (!dienst?.contactpersoon) return null;
      if (typeof dienst.contactpersoon === 'object') {
        return dienst.contactpersoon.id || dienst.contactpersoon['@self']?.id;
      }
      return String(dienst.contactpersoon);
    }, [dienst?.contactpersoon]);

    // Fetch contactpersoon object if ID is available
    useEffect(() => {
      if (!contactpersoonId || !store?.object) return;

      const fetchContactpersoon = async () => {
        try {
          // Check if already in store
          const objectType = 'voorzieningen_contactpersoon';
          const existingData = store.object.getObject(objectType, contactpersoonId);

          if (existingData) {
            setContactpersoonData(existingData);
            return;
          }

          // Fetch from API
          await store.object.fetchObject(
            'voorzieningen',
            'contactpersoon',
            contactpersoonId,
            {
              '_extend[]': ['_schema'],
            }
          );

          // Get from store after fetch
          const fetchedData = store.object.getObject(objectType, contactpersoonId);
          if (fetchedData) {
            setContactpersoonData(fetchedData);
          }
        } catch (error) {
          // Don't set state on error, will fall back to ConUuidResolver
        }
      };

      fetchContactpersoon();
    }, [contactpersoonId, store?.object]);

    // Helper function to get contactpersoon display name
    const getContactpersoonDisplayName = () => {
      // First try to use fetched contactpersoon data
      if (contactpersoonData) {
        const fullName = [
          contactpersoonData.voornaam,
          contactpersoonData.tussenvoegsel,
          contactpersoonData.achternaam,
        ]
          .filter(Boolean)
          .join(' ');

        if (fullName.trim()) {
          return fullName;
        }
      }

      // Try to use contactpersoon object if it's already an object with name fields
      if (typeof dienst.contactpersoon === 'object' && dienst.contactpersoon) {
        const c = dienst.contactpersoon;
        const fullName = [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
          .filter(Boolean)
          .join(' ');

        if (fullName.trim()) {
          return fullName;
        }
      }

      return null;
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

    // const productsWithDetails = getProductsWithDetails();
    const modulesWithDetails = getModulesWithDetails();

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

            <div
              className='ac-register-review__field'
              style={{ display: 'flex', gap: '4px' }}
            >
              <strong>{getSchemaLabel('dienst', 'website', 'Website')}:</strong>
              <ConExternalLink href={dienst.website} />
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
                  {getContactpersoonDisplayName() || (
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
                <div>
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
              ) : !showNewApplicatieForm ? (
                <div className='ac-register-review__field'>
                  <Paragraph style={{ fontStyle: 'italic', color: '#666' }}>
                    Geen applicaties geselecteerd
                  </Paragraph>
                </div>
              ) : null}

              {/* Show new application section when creating a new app */}
              {showNewApplicatieForm && (
                <>
                  {modulesWithDetails.length > 0 && (
                    <Separator className='ac-register-review__separator' />
                  )}
                  <div
                    className='ac-register-review__subsection'
                    role='group'
                    aria-labelledby='nieuwe-applicatie-heading'
                  >
                    <h4
                      id='nieuwe-applicatie-heading'
                      className='utrecht-heading-5'
                      style={{ marginBlockEnd: '1rem' }}
                    >
                      Nieuwe applicatie wordt aangemaakt
                    </h4>

                    <dl
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(120px, auto) 1fr',
                        gap: '0.5rem 1rem',
                        margin: 0,
                      }}
                    >
                      <dt
                        style={{
                          fontWeight: 600,
                          color: 'var(--tilburg-color-gray-700)',
                        }}
                      >
                        Naam
                      </dt>
                      <dd style={{ margin: 0 }}>{nieuweApplicatie?.naam || '-'}</dd>

                      {nieuweApplicatie?.website && (
                        <>
                          <dt
                            style={{
                              fontWeight: 600,
                              color: 'var(--tilburg-color-gray-700)',
                            }}
                          >
                            Website
                          </dt>
                          <dd style={{ margin: 0 }}>
                            <Link
                              href={
                                nieuweApplicatie.website.startsWith('http://') ||
                                nieuweApplicatie.website.startsWith('https://')
                                  ? nieuweApplicatie.website
                                  : `https://${nieuweApplicatie.website}`
                              }
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {nieuweApplicatie.website}
                            </Link>
                          </dd>
                        </>
                      )}

                      {nieuweApplicatie?.beschrijvingKort && (
                        <>
                          <dt
                            style={{
                              fontWeight: 600,
                              color: 'var(--tilburg-color-gray-700)',
                            }}
                          >
                            Beschrijving
                          </dt>
                          <dd style={{ margin: 0 }}>
                            {nieuweApplicatie.beschrijvingKort}
                          </dd>
                        </>
                      )}
                    </dl>

                    {/* Leverancier subsection */}
                    {(leverancierKeuze === 'nieuw' || nieuweApplicatie?.leverancier) && (
                      <div
                        style={{
                          marginBlockStart: '1.5rem',
                          paddingBlockStart: '1rem',
                          borderBlockStart: '1px solid var(--tilburg-color-gray-200)',
                        }}
                        role='group'
                        aria-labelledby='nieuwe-leverancier-heading'
                      >
                        <h5
                          id='nieuwe-leverancier-heading'
                          className='utrecht-heading-6'
                          style={{ marginBlockEnd: '0.75rem' }}
                        >
                          {leverancierKeuze === 'nieuw'
                            ? 'Nieuwe leverancier wordt aangemaakt'
                            : 'Leverancier'}
                        </h5>

                        <dl
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(120px, auto) 1fr',
                            gap: '0.5rem 1rem',
                            margin: 0,
                          }}
                        >
                          {leverancierKeuze === 'nieuw' ? (
                            <>
                              <dt
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--tilburg-color-gray-700)',
                                }}
                              >
                                Naam
                              </dt>
                              <dd style={{ margin: 0 }}>
                                {nieuweLeverancier?.naam || '-'}
                              </dd>

                              {nieuweLeverancier?.website && (
                                <>
                                  <dt
                                    style={{
                                      fontWeight: 600,
                                      color: 'var(--tilburg-color-gray-700)',
                                    }}
                                  >
                                    Website
                                  </dt>
                                  <dd style={{ margin: 0 }}>
                                    <Link
                                      href={
                                        nieuweLeverancier.website.startsWith('http://') ||
                                        nieuweLeverancier.website.startsWith('https://')
                                          ? nieuweLeverancier.website
                                          : `https://${nieuweLeverancier.website}`
                                      }
                                      target='_blank'
                                      rel='noopener noreferrer'
                                    >
                                      {nieuweLeverancier.website}
                                    </Link>
                                  </dd>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <dt
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--tilburg-color-gray-700)',
                                }}
                              >
                                Naam
                              </dt>
                              <dd style={{ margin: 0 }}>
                                {(() => {
                                  const leverancierId = nieuweApplicatie.leverancier;
                                  const leverancierOption = (leverancierOptions || []).find(
                                    (opt) => String(opt.value) === String(leverancierId)
                                  );
                                  return leverancierOption
                                    ? leverancierOption.label
                                    : leverancierId;
                                })()}
                              </dd>
                            </>
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                </>
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

export default withStore(ConFormControlerenStage);
