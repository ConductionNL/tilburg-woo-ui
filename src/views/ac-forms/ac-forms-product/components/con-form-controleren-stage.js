import React, { memo } from 'react';
import { AcLink } from '@src/molecules';
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
 * @param {Object} product - The product object containing form data
 * @param {Array} dienstOptions - Available service options for display
 * @param {Array} referentieComponentenOptions - Available reference component options for display
 * @param {Array} referentieComponentenWithStandards - Available reference components with their standards
 */
const ConFormControlerenStage = memo(
  ({
    product,
    dienstOptions,
    referentieComponentenOptions,
    referentieComponentenWithStandards,
    existingModulesLookup,
    getAllModulesForStages,
    modulesOptions,
  }) => {
    // Debug logging removed per lint rules

    // Helper function to get standard name from ID
    const getStandardNameFromId = (standardId) => {
      if (
        !referentieComponentenWithStandards ||
        !Array.isArray(referentieComponentenWithStandards)
      ) {
        return standardId; // Fallback to ID if no standards data available
      }

      // Search through all reference components and their standards
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

      return standardId; // Fallback to ID if name not found
    };

    // Helper function to resolve moduleB ID to display name
    const getModuleBDisplayName = (moduleBId) => {
      if (!moduleBId) return moduleBId;

      // First try to find in modulesOptions (external modules)
      if (modulesOptions && Array.isArray(modulesOptions)) {
        const foundOption = modulesOptions.find(
          (opt) => String(opt.value) === String(moduleBId)
        );
        if (foundOption) {
          return foundOption.label;
        }
      }

      // Fallback: try to find in product's own modules
      const allModules = getAllModulesForStages ? getAllModulesForStages() : [];

      // Create lookup for all modules by their value
      const moduleLookup = {};
      allModules.forEach((module) => {
        const moduleValue = module.isExisting ? module.id : module.moduleIndex;
        const displayName =
          module.naam ||
          module?.['@self']?.name ||
          module?.fullData?.['@self']?.name ||
          (module.id ? String(module.id) : `Applicatie ${moduleValue}`);

        moduleLookup[String(moduleValue)] = displayName;
        moduleLookup[moduleValue] = displayName;
      });

      // Also check existing modules lookup for additional data
      if (existingModulesLookup && existingModulesLookup[moduleBId]) {
        const existingModule = existingModulesLookup[moduleBId];
        return existingModule.naam || existingModule?.['@self']?.name || moduleBId;
      }

      // Return the resolved name or fallback to the ID
      return moduleLookup[moduleBId] || moduleLookup[String(moduleBId)] || moduleBId;
    };

    return (
      <div>
        <Paragraph>
          Bekijk hieronder de ingevulde gegevens. Controleer of alle informatie klopt
          voordat u uw product aanmeldt. U kunt velden nog aanpassen via de
          &apos;Vorige&apos; knop of op een later moment via uw eigen omgeving.
        </Paragraph>
        <br />
        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>
            Product informatie
          </h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>{product.naam}</h4>
              {product.logo && (
                <ConLogoPreview
                  logoUrl={product.logo}
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
                {product.beschrijvingKort || '-'}
              </span>
            </div>

            {product.beschrijvingLang && (
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
                    source={product.beschrijvingLang}
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
              {product.website ? (
                <AcLink href={product.website} target='_blank'>
                  {product.website}
                </AcLink>
              ) : (
                '-'
              )}
            </div>
            <div className='ac-register-review__field'>
              <strong>Hosting:</strong> {product.hostingLocatie || '-'}
            </div>
            <div className='ac-register-review__field'>
              <strong>Jurisdictie:</strong> {product.hostingJurisdictie || '-'}
            </div>
          </div>
        </div>

        <h3 className='con-form-wizard-review-heading-header'>Applicaties</h3>
        <div className='ac-register-review'>
          {/* Show new modules */}
          {(product.modules || [])
            .filter((m) => typeof m === 'object' && !m?.id)
            .map((module, idx) => (
              <div
                className='ac-register-form-section'
                key={idx}
              >
                <div className='ac-register-review'>
                  <div className='ac-register-review__section'>
                    <div className='ac-register-review__header'>
                      <h4 className='utrecht-heading-4'>{module.naam}</h4>
                    </div>
                    <Separator className='ac-register-review-header__separator' />

                    <div className='ac-register-review__field'>
                      <strong>Korte beschrijving:</strong>
                      <div>
                        <div
                          style={{
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                          }}
                        >
                          {module.beschrijvingKort || ''}
                        </div>
                      </div>
                    </div>

                    {module.beschrijvingLang && (
                      <div className='ac-register-review__description'>
                        <strong>Lange beschrijving:</strong>
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
                            source={module.beschrijvingLang}
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
                              [
                                remarkRehype,
                                { handlers: { ...defListHastHandlers } },
                              ],
                            ]}
                          />
                        </div>
                      </div>
                    )}

                    <div className='ac-register-review__field'>
                      <strong>Licentietype:</strong>
                      <div>
                        <div>{module.licentieType || ''}</div>
                      </div>
                    </div>

                    {module.licentieType !== 'Closed Source' && (
                      <div className='ac-register-review__field'>
                        <strong>Licentie:</strong>
                        <div>
                          <div>{module.licentie || ''}</div>
                        </div>
                      </div>
                    )}

                    {Array.isArray(module.referentieComponenten) &&
                      module.referentieComponenten.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Referentiecomponenten:</strong>
                          <div>
                            <UnorderedList>
                              {module.referentieComponenten.map((rc, i) => {
                                // accept old shape {id, naam} or new string values
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

                    {/* Module Versies */}
                    {Array.isArray(module.moduleVersies) &&
                      module.moduleVersies.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Versies:</strong>
                          <div>
                            <UnorderedList>
                              {module.moduleVersies.map((versie, i) => (
                                <UnorderedListItem key={versie.versie || i}>
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

                    {/* Ondersteunde Standaarden (Compliancy) */}
                    {Array.isArray(module.compliancy) &&
                      module.compliancy.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Ondersteunde standaarden:</strong>
                          <div>
                            <UnorderedList>
                              {module.compliancy.map((comp, i) => {
                                const displayName =
                                  comp.standaardnaam ||
                                  getStandardNameFromId(comp.standaardversie);

                                // ✅ NEW: Function to create middle ellipsis for long filenames
                                const createMiddleEllipsis = (
                                  filename,
                                  maxLength = 25
                                ) => {
                                  if (!filename) return 'bewijs';

                                  // If filename is short enough, return as is
                                  if (filename.length <= maxLength) {
                                    return filename;
                                  }

                                  // Find the extension
                                  const lastDotIndex = filename.lastIndexOf('.');
                                  if (lastDotIndex === -1) {
                                    // No extension, truncate from end
                                    return (
                                      filename.substring(0, maxLength - 3) + '...'
                                    );
                                  }

                                  const name = filename.substring(0, lastDotIndex);
                                  const extension = filename.substring(lastDotIndex);

                                  // Calculate how much space we have for the name part
                                  const availableLength =
                                    maxLength - extension.length - 3; // 3 for "..."

                                  if (availableLength <= 0) {
                                    return '...' + extension;
                                  }

                                  // Split the available space between start and end of filename
                                  const startLength = Math.ceil(availableLength / 2);
                                  const endLength = Math.floor(availableLength / 2);

                                  const startPart = name.substring(0, startLength);
                                  const endPart = name.substring(
                                    name.length - endLength
                                  );

                                  return startPart + '...' + endPart + extension;
                                };

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
                                            {createMiddleEllipsis(
                                              comp.bewijsFilename
                                            )}
                                          </AcLink>
                                        </>
                                      ) : comp.url ? (
                                        <>
                                          <span>- bewijs:</span>
                                          <AcLink
                                            href={comp.url}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                          >
                                            {comp.url}
                                          </AcLink>
                                        </>
                                      ) : (
                                        <span style={{ color: '#666' }}>
                                          (geen bewijs)
                                        </span>
                                      )}
                                    </span>
                                  </UnorderedListItem>
                                );
                              })}
                            </UnorderedList>
                          </div>
                        </div>
                      )}

                    {Array.isArray(module.koppelingen) &&
                      module.koppelingen.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Koppelingen:</strong>
                          <div>
                            <UnorderedList>
                              {module.koppelingen.map((kp, kIdx) => {
                                const richting = kp.richtingDataUitwisseling;
                                const soortVal = kp.soortKoppeling;
                                const soortLabel = soortVal || '';
                                const arrow =
                                  richting === 'AnaarB'
                                    ? '→'
                                    : richting === 'BnaarA'
                                    ? '←'
                                    : '↔';

                                // Resolve moduleB ID to display name (fallback to buitengemeentelijkVoorziening)
                                const moduleBId = kp.moduleB || kp.buitengemeentelijkVoorziening;
                                const moduleBDisplayName = getModuleBDisplayName(
                                  moduleBId
                                );

                                return (
                                  <UnorderedListItem
                                    key={`${kp.moduleA}-${moduleBId}-${kIdx}`}
                                  >
                                    {kp.moduleA} {arrow} {moduleBDisplayName}
                                    {soortLabel ? ` (${soortLabel})` : ''}
                                  </UnorderedListItem>
                                );
                              })}
                            </UnorderedList>
                          </div>
                        </div>
                      )}

                    {Array.isArray(module.diensten) &&
                      module.diensten.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Diensten:</strong>
                          <div>
                            <UnorderedList>
                              {module.diensten.map((dienst, i) => {
                                // Handle both object and string formats
                                const dienstType =
                                  typeof dienst === 'object' ? dienst.type : dienst;
                                const dienstId =
                                  typeof dienst === 'object' ? dienst.id : null;

                                const dienstOption = dienstOptions.find(
                                  (option) => option.value === dienstType
                                );

                                // Get the application name and format as "Application - Dienst Type"
                                const applicationName =
                                  module.naam || 'Unnamed Application';
                                const dienstTypeDisplay =
                                  dienstOption?.label || dienstType;
                                const displayName = `${applicationName} - ${dienstTypeDisplay}`;

                                return (
                                  <UnorderedListItem
                                    key={dienstId || `${dienstType}-${i}`}
                                  >
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
              </div>
            ))}

          {/* Show existing modules from lookup */}
          {existingModulesLookup &&
            Object.values(existingModulesLookup).map((moduleData, idx) => (
              <div
                className='ac-register-form-section'
                key={`existing-${moduleData.id || idx}`}
              >
                <div className='ac-register-review'>
                  <div className='ac-register-review__section'>
                    <div className='ac-register-review__header'>
                      <h4 className='utrecht-heading-4'>
                        {moduleData.naam}{' '}
                        <small
                          style={{
                            color: '#666',
                            fontStyle: 'italic',
                            fontSize: '0.875rem',
                          }}
                        >
                          (bestaande applicatie)
                        </small>
                      </h4>
                    </div>
                    <Separator className='ac-register-review-header__separator' />

                    <div className='ac-register-review__field'>
                      <strong>Korte beschrijving:</strong>
                      <div>
                        <div
                          style={{
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                          }}
                        >
                          {moduleData.beschrijvingKort ||
                            'Geen beschrijving beschikbaar'}
                        </div>
                      </div>
                    </div>

                    {moduleData.fullData.beschrijvingLang && (
                      <div className='ac-register-review__description'>
                        <strong>Lange beschrijving:</strong>
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
                            source={moduleData.fullData.beschrijvingLang}
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
                              [
                                remarkRehype,
                                { handlers: { ...defListHastHandlers } },
                              ],
                            ]}
                          />
                        </div>
                      </div>
                    )}

                    <div className='ac-register-review__field'>
                      <strong>Licentietype:</strong>
                      <div>
                        <div>{moduleData.fullData.licentietype || 'Niet opgegeven'}</div>
                      </div>
                    </div>

                    {moduleData.fullData.licentietype !== 'Closed Source' &&
                      moduleData.fullData.licentie && (
                        <div className='ac-register-review__field'>
                          <strong>Licentie:</strong>
                          <div>
                            <div>{moduleData.fullData.licentie}</div>
                          </div>
                        </div>
                      )}

                    {Array.isArray(moduleData.fullData.referentieComponenten) &&
                      moduleData.fullData.referentieComponenten.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Referentiecomponenten:</strong>
                          <div>
                            <UnorderedList>
                              {moduleData.fullData.referentieComponenten.map((rc, i) => {
                                const value =
                                  typeof rc === 'string' ? rc : rc?.naam || rc?.id;
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

                    {Array.isArray(moduleData.fullData.diensten) &&
                      moduleData.fullData.diensten.length > 0 && (
                        <div className='ac-register-review__field'>
                          <strong>Diensten:</strong>
                          <div>
                            <UnorderedList>
                              {moduleData.fullData.diensten.map((dienst, i) => {
                                const dienstType =
                                  typeof dienst === 'object' ? dienst.type : dienst;
                                const dienstNaam =
                                  typeof dienst === 'object' ? dienst.naam : null;
                                const dienstId =
                                  typeof dienst === 'object' ? dienst.id : null;

                                const dienstOption = dienstOptions.find(
                                  (option) => option.value === dienstType
                                );
                                const displayName =
                                  dienstNaam || dienstOption?.label || dienstType;

                                return (
                                  <UnorderedListItem
                                    key={dienstId || `${dienstType}-${i}`}
                                  >
                                    {displayName}
                                  </UnorderedListItem>
                                );
                              })}
                            </UnorderedList>
                          </div>
                        </div>
                      )}

                    <div
                      className='ac-register-review__field'
                      style={{ color: '#666', fontStyle: 'italic' }}
                    >
                      <Paragraph style={{ margin: 0, fontSize: '0.875rem' }}>
                        📋 Bestaande applicatie uit de softwarecatalogus - bovenstaande
                        informatie is al geregistreerd
                      </Paragraph>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }
);

ConFormControlerenStage.displayName = 'ConFormControlerenStage';

export default ConFormControlerenStage;
