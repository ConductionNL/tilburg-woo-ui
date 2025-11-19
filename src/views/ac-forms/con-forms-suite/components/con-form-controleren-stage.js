import React, { memo, useState, useEffect, useMemo } from 'react';
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
  ({ suite, selectedApplicatieIds, applicatieOptions, store }) => {
    // State to store fetched contactpersoon object
    const [contactpersoonData, setContactpersoonData] = useState(null);

    // Get contactpersoon ID from suite
    const contactpersoonId = useMemo(() => {
      if (!suite?.contactpersoon) return null;
      if (typeof suite.contactpersoon === 'object') {
        return (
          suite.contactpersoon.id ||
          suite.contactpersoon['@self']?.id ||
          suite.contactpersoon.value ||
          suite.contactpersoon.uuid
        );
      }
      return String(suite.contactpersoon);
    }, [suite?.contactpersoon]);

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
              _extend: '@self.schema',
            }
          );

          // Get from store after fetch
          const fetchedData = store.object.getObject(objectType, contactpersoonId);
          if (fetchedData) {
            setContactpersoonData(fetchedData);
          }
        } catch (error) {
          console.error('Failed to fetch contactpersoon:', error);
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
      if (typeof suite.contactpersoon === 'object' && suite.contactpersoon) {
        const c = suite.contactpersoon;
        const fullName = [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
          .filter(Boolean)
          .join(' ');

        if (fullName.trim()) {
          return fullName;
        }
      }

      return null;
    };
    // Helper to get applicatie information with additional details
    const getApplicatiesWithDetails = () => {
      return (selectedApplicatieIds || []).map((id) => {
        const option = (applicatieOptions || []).find((o) => o.value === id);
        return {
          id,
          label: option?.label || id,
          data: option?.data || null,
        };
      });
    };

    const applicatiesWithDetails = getApplicatiesWithDetails();

    return (
      <div>
        <Paragraph>
          Bekijk hieronder de ingevulde gegevens. Controleer of alle informatie klopt
          voordat u uw suite aanmeldt. U kunt velden nog aanpassen via de
          &apos;Vorige&apos; knop of op een later moment via uw eigen omgeving.
        </Paragraph>
        <br />

        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>Suite informatie</h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>
                {suite.naam ? (
                  <ConUuidResolver>{suite.naam}</ConUuidResolver>
                ) : (
                  'Onbekende suite'
                )}
              </h4>
              {suite.logo && (
                <ConLogoPreview
                  logoUrl={suite.logo}
                  className='ac-register-review__logo'
                />
              )}
            </div>
            <Separator className='con-form-wizard-review-header__separator' />

            {suite.beschrijvingKort && (
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
                  <ConUuidResolver>{suite.beschrijvingKort}</ConUuidResolver>
                </div>
              </div>
            )}

            {suite.beschrijvingLang && (
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
                    source={suite.beschrijvingLang}
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
              {suite.website ? (
                <AcLink
                  href={suite.website}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ConUuidResolver>{suite.website}</ConUuidResolver>
                </AcLink>
              ) : (
                '-'
              )}
            </div>

            {suite.contactpersoon && (
              <div className='ac-register-review__field'>
                <strong>Contactpersoon:</strong>{' '}
                <span>
                  {(() => {
                    const displayName = getContactpersoonDisplayName();
                    if (displayName) {
                      return displayName;
                    }
                    // Fallback to ConUuidResolver if we couldn't build a full name
                    return (
                      <ConUuidResolver>
                        {typeof suite.contactpersoon === 'object'
                          ? suite.contactpersoon.id ||
                            suite.contactpersoon['@self']?.id ||
                            suite.contactpersoon.value ||
                            suite.contactpersoon.uuid ||
                            ''
                          : suite.contactpersoon}
                      </ConUuidResolver>
                    );
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>Applicaties</h3>
          <div className='ac-register-review'>
            <div className='ac-register-review__section'>
              {applicatiesWithDetails.length > 0 ? (
                <div className='ac-register-review__field'>
                  <UnorderedList>
                    {applicatiesWithDetails.map((applicatie, i) => (
                      <UnorderedListItem key={`app-${applicatie.id}-${i}`}>
                        <div>
                          <strong>
                            <ConUuidResolver>{applicatie.label}</ConUuidResolver>
                          </strong>
                          {applicatie.data?.beschrijvingKort && (
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                marginTop: '0.25rem',
                              }}
                            >
                              {applicatie.data.beschrijvingKort}
                            </div>
                          )}
                          {(applicatie.data?.licentieType ||
                            applicatie.data?.licentietype) && (
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                marginTop: '0.25rem',
                              }}
                            >
                              Licentie:{' '}
                              {applicatie.data.licentieType ||
                                applicatie.data.licentietype}
                              {applicatie.data.licentie &&
                                (applicatie.data.licentieType ||
                                  applicatie.data.licentietype) !==
                                  'Closed Source' &&
                                ` (${applicatie.data.licentie})`}
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
      </div>
    );
  }
);

ConFormControlerenStage.displayName = 'ConFormControlerenStage';

export default ConFormControlerenStage;
