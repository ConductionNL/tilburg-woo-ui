import React, { memo, useState, useEffect, useMemo } from 'react';
import { AcLink } from '@src/molecules';
import { ConUuidResolver } from '@components';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import {
  UnorderedList,
  UnorderedListItem,
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

// Import MDEditor for markdown rendering
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';

import { handleFileClick } from '@utils';
import rehypeSanitize from 'rehype-sanitize';

/**
 * Controleren Stage Component
 *
 * This stage shows a review/overview of all the information entered in previous stages.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Array} referentieComponentenOptions - Available reference component options for display
 * @param {Array} referentieComponentenWithStandards - Available reference components with their standards
 * @param {Array} standaardenOptions - Available standards options for display
 * @param {Array} modulesOptions - Available modules/applicaties for connections display
 * @param {Array} buitengemeentelijkeOptions - Available external facilities for connections display
 * @param {Array} dienstOptions - Available service options for display
 * @param {Object} store - MobX store for fetching objects
 */
const ConFormApplicatieControlerenStage = memo(
  ({
    applicatie,
    referentieComponentenOptions,
    referentieComponentenWithStandards,
    standaardenOptions,
    modulesOptions,
    buitengemeentelijkeOptions,
    dienstOptions,
    formType,
    store,
    aanbiederOrganisatie,
    aanbiederKeuze,
  }) => {
    // State to store fetched contactpersoon object
    const [contactpersoonData, setContactpersoonData] = useState(null);

    // Get contactpersoon ID from applicatie
    const contactpersoonId = useMemo(() => {
      if (!applicatie?.contactpersoon) return null;
      if (typeof applicatie.contactpersoon === 'object') {
        return (
          applicatie.contactpersoon.id || applicatie.contactpersoon['@self']?.id
        );
      }
      return String(applicatie.contactpersoon);
    }, [applicatie?.contactpersoon]);

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
              '_extend[]': ['@self.schema'],
              _published: 'false',
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
      if (
        typeof applicatie.contactpersoon === 'object' &&
        applicatie.contactpersoon
      ) {
        const c = applicatie.contactpersoon;
        const fullName = [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
          .filter(Boolean)
          .join(' ');

        if (fullName.trim()) {
          return fullName;
        }
      }

      return null;
    };
    // Helper function to get standard name from ID
    const getStandardNameFromId = (standardId) => {
      if (!standardId) return standardId;

      // First try to find in standaardenOptions
      if (standaardenOptions && Array.isArray(standaardenOptions)) {
        const foundOption = standaardenOptions.find(
          (opt) =>
            String(opt.value) === String(standardId) ||
            String(opt.data?.id) === String(standardId)
        );
        if (foundOption) {
          return (
            foundOption.label ||
            foundOption.data?.naam ||
            foundOption.data?.name ||
            standardId
          );
        }
      }

      // Fallback: search through referentieComponentenWithStandards
      if (
        referentieComponentenWithStandards &&
        Array.isArray(referentieComponentenWithStandards)
      ) {
        for (const refComp of referentieComponentenWithStandards) {
          // Check verplichte standards
          if (Array.isArray(refComp.verplichteStandaarden)) {
            const found = refComp.verplichteStandaarden.find(
              (standard) =>
                standard.id === standardId || `id-${standard.id}` === standardId
            );
            if (found) return found.naam || found.title || standardId;
          }

          // Check aanbevolen standards
          if (Array.isArray(refComp.aanbevolenStandaarden)) {
            const found = refComp.aanbevolenStandaarden.find(
              (standard) =>
                standard.id === standardId || `id-${standard.id}` === standardId
            );
            if (found) return found.naam || found.title || standardId;
          }
        }
      }

      return standardId; // Fallback to ID if name not found
    };

    // Helper function to resolve moduleB ID to display name
    const getModuleBDisplayName = (moduleBId) => {
      if (!moduleBId) return moduleBId;

      // Try to find in modulesOptions (applicaties)
      if (modulesOptions && Array.isArray(modulesOptions)) {
        const foundOption = modulesOptions.find(
          (opt) => String(opt.value) === String(moduleBId)
        );
        if (foundOption) {
          return foundOption.label;
        }
      }

      // Try to find in buitengemeentelijkeOptions (external facilities)
      if (buitengemeentelijkeOptions && Array.isArray(buitengemeentelijkeOptions)) {
        const foundOption = buitengemeentelijkeOptions.find(
          (opt) => String(opt.value) === String(moduleBId)
        );
        if (foundOption) {
          return foundOption.label;
        }
      }

      return moduleBId; // Fallback to ID if not found
    };

    // Helper function to normalize URLs for external links
    // Adds https:// prefix if needed for external URLs, keeps local URLs as-is
    const normalizeUrl = (url) => {
      if (!url || typeof url !== 'string') return url;

      const trimmedUrl = url.trim();

      // Already has protocol, return as-is
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }

      // Local/relative URL (starts with /), return as-is
      if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }

      // External URL without protocol (e.g., www.test.com, example.com)
      // Add https:// prefix
      return `https://${trimmedUrl}`;
    };

    // Helper function to check if URL is external (not a local/relative path)
    const isExternalUrl = (url) => {
      if (!url || typeof url !== 'string') return false;
      const trimmedUrl = url.trim();

      // Local/relative URL (starts with /)
      if (trimmedUrl.startsWith('/')) {
        return false;
      }

      // Already has protocol, definitely external
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return true;
      }

      // Starts with www. or contains domain-like pattern (has dot and doesn't start with .)
      // This covers cases like www.test.com, example.com, subdomain.example.com
      if (
        trimmedUrl.startsWith('www.') ||
        (trimmedUrl.includes('.') && !trimmedUrl.startsWith('.'))
      ) {
        return true;
      }

      // Default to local for ambiguous cases
      return false;
    };

    // Helper function to create middle ellipsis for long filenames
    const createMiddleEllipsis = (filename, maxLength = 25) => {
      if (!filename) return 'bewijs';

      // If filename is short enough, return as is
      if (filename.length <= maxLength) {
        return filename;
      }

      // Find the extension
      const lastDotIndex = filename.lastIndexOf('.');
      if (lastDotIndex === -1) {
        // No extension, truncate from end
        return filename.substring(0, maxLength - 3) + '...';
      }

      const name = filename.substring(0, lastDotIndex);
      const extension = filename.substring(lastDotIndex);

      // Calculate how much space we have for the name part
      const availableLength = maxLength - extension.length - 3; // 3 for "..."

      if (availableLength <= 0) {
        return '...' + extension;
      }

      // Split the available space between start and end of filename
      const startLength = Math.ceil(availableLength / 2);
      const endLength = Math.floor(availableLength / 2);

      const startPart = name.substring(0, startLength);
      const endPart = name.substring(name.length - endLength);

      return startPart + '...' + endPart + extension;
    };

    return (
      <div>
        <Paragraph>
          Controleer of het overzicht van de applicatie volledig en juist is voordat
          u verder gaat.
          <br />
          U kunt met Vorige terug naar de eerdere stappen.
          <br />
          Na het registreren van de applicatie kunt u via uw “Dashboard” de
          applicatie opzoeken en indien gewenst aanpassen.
        </Paragraph>
        <br />
        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>
            Applicatie informatie
          </h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>{applicatie.naam}</h4>
              {applicatie.logo && (
                <ConLogoPreview
                  logoUrl={applicatie.logo}
                  className='ac-register-review__logo'
                />
              )}
            </div>
            <Separator className='con-form-wizard-review-header__separator' />

            <div className='ac-register-review__field'>
              <strong>Korte beschrijving:</strong>
              <span
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {applicatie.beschrijvingKort || '-'}
              </span>
            </div>

            {applicatie.beschrijvingLang && (
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
                    source={applicatie.beschrijvingLang}
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
              {applicatie.website ? (
                isExternalUrl(applicatie.website) ? (
                  <a
                    href={normalizeUrl(applicatie.website)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='utrecht-link utrecht-link--html-a'
                  >
                    {applicatie.website}
                  </a>
                ) : (
                  <AcLink href={applicatie.website}>{applicatie.website}</AcLink>
                )
              ) : (
                '-'
              )}
            </div>

            {applicatie.contactpersoon && (
              <div className='ac-register-review__field'>
                <strong>Contactpersoon:</strong>{' '}
                {(() => {
                  const displayName = getContactpersoonDisplayName();
                  if (displayName) {
                    return <span>{displayName}</span>;
                  }
                  // Fallback to ConUuidResolver
                  return (
                    <ConUuidResolver>
                      {typeof applicatie.contactpersoon === 'object'
                        ? applicatie.contactpersoon.id || applicatie.contactpersoon
                        : applicatie.contactpersoon}
                    </ConUuidResolver>
                  );
                })()}
              </div>
            )}

            <div className='ac-register-review__field'>
              <strong>Hosting vorm:</strong>{' '}
              {applicatie.cloudDienstverleningsmodel?.join(', ') || '-'}
            </div>

            <div className='ac-register-review__field'>
              <strong>Licentietype:</strong>{' '}
              {applicatie.licentietype || applicatie.licentieType || '-'}
            </div>

            {(applicatie.licentietype !== 'Closed Source' ||
              applicatie.licentieType !== 'Closed Source') &&
              applicatie.licentie && (
                <div className='ac-register-review__field'>
                  <strong>Licentie:</strong> {applicatie.licentie}
                </div>
              )}

            <div className='ac-register-review__field'>
              <strong>Hosting:</strong> {applicatie.hostingLocatie || '-'}
            </div>

            <div className='ac-register-review__field'>
              <strong>Jurisdictie:</strong> {applicatie.hostingJurisdictie || '-'}
            </div>

            {/* Module Versies */}
            {Array.isArray(applicatie.moduleVersies) &&
              applicatie.moduleVersies.length > 0 && (
                <div className='ac-register-review__field'>
                  <strong>Versies:</strong>
                  <div>
                    <UnorderedList>
                      {applicatie.moduleVersies.map((versie, i) => (
                        <UnorderedListItem key={i}>
                          <strong>{versie.versie}</strong> - {versie.status}
                          {versie.beschrijvingKort && (
                            <div
                              style={{
                                marginLeft: '1rem',
                                color: '#666',
                                fontSize: '0.875rem',
                              }}
                            >
                              {versie.beschrijvingKort}
                            </div>
                          )}
                        </UnorderedListItem>
                      ))}
                    </UnorderedList>
                  </div>
                </div>
              )}

            {/* Referentiecomponenten */}
            {Array.isArray(applicatie.referentieComponenten) &&
              applicatie.referentieComponenten.length > 0 && (
                <div className='ac-register-review__field'>
                  <strong>Referentiecomponenten:</strong>
                  <div>
                    <UnorderedList>
                      {applicatie.referentieComponenten.map((rc, i) => {
                        // Accept old shape {id, naam} or new string values
                        const value = typeof rc === 'string' ? rc : rc?.naam;
                        const opt = referentieComponentenOptions?.find(
                          (o) => String(o.value) === String(value)
                        );
                        const label = opt ? opt.label : value;
                        return (
                          <UnorderedListItem key={value || i}>
                            {label}
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  </div>
                </div>
              )}

            {/* Ondersteunde Standaarden (Compliancy) */}
            {Array.isArray(applicatie.compliancy) &&
              applicatie.compliancy.length > 0 && (
                <div className='ac-register-review__field'>
                  <strong>Ondersteunde standaarden:</strong>
                  <div>
                    <UnorderedList>
                      {applicatie.compliancy.map((comp, i) => {
                        const displayName =
                          comp.standaardnaam ||
                          getStandardNameFromId(comp.standaardversie);

                        return (
                          <UnorderedListItem key={comp.standaardversie || i}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <span>{displayName}</span>
                              {comp.bewijs ? (
                                <>
                                  <span>- bewijs:</span>
                                  <AcLink
                                    href='#'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleFileClick(comp.bewijs);
                                    }}
                                    title={comp.bewijsFilename || 'bewijs'}
                                  >
                                    {createMiddleEllipsis(comp.bewijsFilename)}
                                  </AcLink>
                                </>
                              ) : comp.url ? (
                                <>
                                  <span>- bewijs:</span>
                                  {isExternalUrl(comp.url) ? (
                                    <a
                                      href={normalizeUrl(comp.url)}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='utrecht-link utrecht-link--html-a'
                                    >
                                      {comp.url}
                                    </a>
                                  ) : (
                                    <AcLink href={comp.url}>{comp.url}</AcLink>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: '#666' }}>(geen bewijs)</span>
                              )}
                            </span>
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  </div>
                </div>
              )}

            {/* Koppelingen */}
            {Array.isArray(applicatie.koppelingen) &&
              applicatie.koppelingen.length > 0 && (
                <div className='ac-register-review__field'>
                  <strong>Koppelingen:</strong>
                  <div>
                    <UnorderedList>
                      {applicatie.koppelingen.map((kp, kIdx) => {
                        const richting = kp.gegevensuitwisselingRichting;
                        const arrow =
                          richting === 'AnaarB'
                            ? '→'
                            : richting === 'BnaarA'
                            ? '←'
                            : '↔';

                        // Resolve moduleB ID to display name
                        const moduleBId =
                          kp.moduleB ||
                          kp?.['@self']?.relations?.moduleB ||
                          kp.moduleBId;
                        const moduleBDisplayName = getModuleBDisplayName(moduleBId);

                        // Get koppeling name (required field)
                        const koppelingNaam = kp.naam;

                        return (
                          <UnorderedListItem
                            key={`${
                              kp.moduleA || applicatie.naam
                            }-${moduleBId}-${kIdx}`}
                          >
                            <strong>{koppelingNaam}</strong>
                            <br />
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>
                              {applicatie.naam} {arrow} {moduleBDisplayName}
                            </span>
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  </div>
                </div>
              )}

            {/* Diensten */}
            {Array.isArray(applicatie.diensten) &&
              applicatie.diensten.length > 0 && (
                <div className='ac-register-review__field'>
                  <strong>Diensten:</strong>
                  <div>
                    <UnorderedList>
                      {applicatie.diensten.map((dienst, i) => {
                        // Handle both object and string formats
                        const dienstType =
                          typeof dienst === 'object' ? dienst.type : dienst;
                        const dienstNaam =
                          typeof dienst === 'object' ? dienst.naam : null;
                        const dienstId =
                          typeof dienst === 'object' ? dienst.id : null;

                        const dienstOption = dienstOptions?.find(
                          (option) => option.value === dienstType
                        );
                        const dienstTypeDisplay = dienstOption?.label || dienstType;

                        // Display both naam and type if both are available
                        const displayName = dienstNaam
                          ? `${dienstNaam} (${dienstTypeDisplay})`
                          : dienstTypeDisplay;

                        return (
                          <UnorderedListItem key={dienstId || `${dienstType}-${i}`}>
                            {displayName}
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  </div>
                </div>
              )}
          </div>
        </div>
        {formType === 'ontbrekend-applicatie' && (
          <div className='con-form-wizard-review-heading-container'>
            <h3 className='con-form-wizard-review-heading-header'>Aanbieder</h3>
            <div className='ac-register-review__section'>
              {formType === 'ontbrekend-applicatie' && applicatie.aanbieder ? (
                <div className='ac-register-review__field'>
                  <strong>Aanbieder:</strong>{' '}
                  <span>
                    <ConUuidResolver>{applicatie.aanbieder}</ConUuidResolver>
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
                        isExternalUrl(aanbiederOrganisatie.website) ? (
                          <a
                            href={normalizeUrl(aanbiederOrganisatie.website)}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='utrecht-link utrecht-link--html-a'
                          >
                            {aanbiederOrganisatie.website}
                          </a>
                        ) : (
                          <AcLink href={aanbiederOrganisatie.website}>
                            {aanbiederOrganisatie.website}
                          </AcLink>
                        )
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

ConFormApplicatieControlerenStage.displayName = 'ConFormApplicatieControlerenStage';

export default ConFormApplicatieControlerenStage;
