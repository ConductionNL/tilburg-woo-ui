import React, { memo } from 'react';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import {
  UnorderedList,
  UnorderedListItem,
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

/**
 * Controleren Stage Component
 * 
 * This stage shows a review/overview of all the information entered in previous stages.
 * 
 * @param {Object} product - The product object containing form data
 * @param {Array} dienstOptions - Available service options for display
 * @param {Array} referentieComponentenOptions - Available reference component options for display
 */
const ConFormControlerenStage = memo(
  ({ product, dienstOptions, referentieComponentenOptions, existingModulesLookup }) => {
    // Debug logging to understand why the form might be empty
    console.log('🔍 ControlerenForm Debug:', {
      product: product,
      productKeys: Object.keys(product || {}),
      modules: product?.modules,
      modulesCount: (product?.modules || []).length,
      dienstOptionsCount: dienstOptions?.length || 0,
      referentieComponentenOptionsCount: referentieComponentenOptions?.length || 0
    });

    return (
      <div>
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
              <strong>Sammenvatting:</strong>
              <span>{product.beschrijvingKort || '-'}</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Website:</strong> {product.website || '-'}
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
          {(product.modules || []).filter(m => typeof m === 'object').map((module, idx) => (
            <div
              className='ac-register-form-section'
              key={module.id || module.naam || idx}
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
                      <div>{module.beschrijvingKort || ''}</div>
                    </div>
                  </div>

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
                                  <div style={{ marginLeft: '1rem', color: '#666', fontSize: '0.875rem' }}>
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
                            {module.compliancy.map((comp, i) => (
                              <UnorderedListItem key={comp.standaardversie || i}>
                                {comp.standaardversie}
                                {comp.bewijs ? (
                                  <>
                                    {' '}
                                    -{' '}
                                    <a
                                      href={comp.bewijs}
                                      target='_blank'
                                      rel='noreferrer noopener'
                                    >
                                      bewijs
                                    </a>
                                  </>
                                ) : (
                                  <small style={{ color: '#666' }}> (geen bewijs)</small>
                                )}
                              </UnorderedListItem>
                            ))}
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
                              const soortVal = kp.sooortKoppeling;
                              const soortLabel = soortVal || '';
                              const arrow =
                                richting === 'AnaarB'
                                  ? '→'
                                  : richting === 'BnaarA'
                                  ? '←'
                                  : '↔';
                              return (
                                <UnorderedListItem
                                  key={`${kp.moduleA}-${kp.moduleB}-${kIdx}`}
                                >
                                  {kp.moduleA} {arrow} {kp.moduleB}
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
                              const dienstId = typeof dienst === 'object' ? dienst.id : dienst;
                              const dienstNaam = typeof dienst === 'object' ? dienst.naam : null;
                              
                              const dienstOption = dienstOptions.find(
                                (option) => option.value === dienstId
                              );
                              const displayName = dienstNaam || dienstOption?.label || dienstId;
                              
                              return (
                                <UnorderedListItem key={dienstId || i}>
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
          {existingModulesLookup && Object.values(existingModulesLookup).map((moduleData, idx) => (
            <div
              className='ac-register-form-section'
              key={`existing-${moduleData.id || idx}`}
            >
              <div className='ac-register-review'>
                <div className='ac-register-review__section'>
                  <div className='ac-register-review__header'>
                    <h4 className='utrecht-heading-4'>
                      {moduleData.naam}{' '}
                      <small style={{ color: '#666', fontStyle: 'italic', fontSize: '0.875rem' }}>
                        (bestaande module)
                      </small>
                    </h4>
                  </div>
                  <Separator className='ac-register-review-header__separator' />

                  <div className='ac-register-review__field'>
                    <strong>Korte beschrijving:</strong>
                    <div>
                      <div>{moduleData.beschrijvingKort || 'Geen beschrijving beschikbaar'}</div>
                    </div>
                  </div>

                  <div className='ac-register-review__field' style={{ color: '#666', fontStyle: 'italic' }}>
                    <Paragraph style={{ margin: 0, fontSize: '0.875rem' }}>
                      📋 Deze module bestaat al in de catalogus. Alle configuraties (licenties, 
                      standaarden, koppelingen) zijn al vastgelegd en worden automatisch overgenomen.
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
