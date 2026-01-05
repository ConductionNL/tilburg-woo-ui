import React, { memo, useState } from 'react';
import {
  Alert,
  Link,
  Paragraph,
  Separator,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import { handleFileClick } from '@utils';
import { AcFlex } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcFormatDate } from '@src/utilities/ac-format-date';

/**
 * ConGebruikStepReview
 * Review screen showing all selected and created data.
 * Handles both existing selections and new entity creation flows.
 */
const ConGebruikStepReview = ({
  gebruik,
  versionOptions,
  refCompOptions,
  organisatieOptions,
  moduleOptions,
  // Selected referentiecomponenten with full data (including standards)
  selectedReferentieComponenten,
  // New flow markers
  applicatieKeuze,
  leverancierKeuze,
  afnemerKeuze,
  // New entity data
  nieuweApplicatie,
  leverancierOrganisatie,
  afnemerOrganisatie,
  // Options for existing entities
  leverancierOptions,
  afnemerOptions,
  // Selected applicatie data (for looking up version by ID)
  selectedApplicatieData,
  // Deelnemer options for Samenwerking/Community organizations
  deelnemerOptions = [],
  // Aanbod beheerders flow props
  isAanbodBeheerdersFlow = false,
  selectedKlanten = [],
  klantenOptions = [],
}) => {
  // Helper function to get the correct afnemer display name
  const getAfnemerDisplayName = () => {
    const afnemer = gebruik?.afnemer;
    if (!afnemer) return '-';

    // If afnemer is an object (from ConSchemaEnhancedField), use its name
    if (typeof afnemer === 'object') {
      return (
        afnemer?.['@self']?.name ||
        afnemer?.naam ||
        afnemer?.name ||
        afnemer?.title ||
        '-'
      );
    }

    // If afnemer is a string (UUID), try to find it in organisatieOptions or afnemerOptions
    const orgOption = (organisatieOptions || []).find(
      (opt) => String(opt.value) === String(afnemer)
    );
    if (orgOption) {
      return orgOption.label;
    }

    const afnemerOption = (afnemerOptions || []).find(
      (opt) => String(opt.value) === String(afnemer)
    );
    if (afnemerOption) {
      return afnemerOption.label;
    }

    // Fallback: use ConUuidResolver for UUID strings
    return <ConUuidResolver>{afnemer}</ConUuidResolver>;
  };

  // Helper function to get the relevant start date based on status
  const getRelevantStartDate = () => {
    const status = gebruik?.status;
    switch (status) {
      case 'Verwerving':
        return {
          label: 'Startdatum Verwerving',
          value: gebruik?.startDatumVerwerving
            ? AcFormatDate(gebruik.startDatumVerwerving, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      case 'Gepland':
        return {
          label: 'Startdatum Gepland',
          value: gebruik?.startDatumGepland
            ? AcFormatDate(gebruik.startDatumGepland, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      case 'In productie':
        return {
          label: 'Startdatum In productie',
          value: gebruik?.startDatumInProductie
            ? AcFormatDate(
                gebruik.startDatumInProductie,
                'YYYY-MM-DD',
                'D MMMM YYYY'
              )
            : null,
        };
      case 'Uit te faseren':
        return {
          label: 'Startdatum Uit te faseren',
          value: gebruik?.startDatumUitTeFaseren
            ? AcFormatDate(
                gebruik.startDatumUitTeFaseren,
                'YYYY-MM-DD',
                'D MMMM YYYY'
              )
            : null,
        };
      case 'Uitgefaseerd':
        return {
          label: 'Startdatum Uitgefaseerd',
          value: gebruik?.startDatumUitGefaseerd
            ? AcFormatDate(
                gebruik.startDatumUitGefaseerd,
                'YYYY-MM-DD',
                'D MMMM YYYY'
              )
            : null,
        };
      default:
        return null;
    }
  };

  const relevantStartDate = getRelevantStartDate();

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

  // Manage visibility state of info alerts for application flows.
  // Alert persists as closed for the session after user closes it (via sessionStorage).
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    // Return true (show) if the alert has not been closed in this session, otherwise false.
    return !sessionStorage.getItem('gebruik-review-info-alert-closed');
  });

  // Mark the 'bestaand' alert as closed for the session and update state.
  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('gebruik-review-info-alert-closed', 'true');
  };

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='review-title'
    >
      <h2 id='review-title' className='sr-only'>
        Controleren
      </h2>

      <Paragraph>
        {isAanbodBeheerdersFlow ? (
          <>
            Controleer of het overzicht van de applicatiegebruik melding volledig en
            juist is voordat u verder gaat.
            <br />
            <br />
            U kunt met Vorige terug naar de eerdere stappen.
            <br />
            <br />
            Met de knop verzenden kunt u de melding aan de klant sturen
          </>
        ) : (
          <>
            Controleer of het overzicht van de applicatiegebruik melding volledig en
            juist is voordat u verder gaat.
            <br />
            U kunt met Vorige terug naar de eerdere stappen.
            <br />
            Met de knop verzenden kunt u de melding aan de klant sturen
          </>
        )}
      </Paragraph>

      {/* Closeable info alert about adding an existing application */}
      {showInfoAlert && (
        <Alert severity='info' className='ac-forms-info-alert'>
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
              <span className='ac-forms-product-info-alert__text'>
                De applicatie wordt toegevoegd aan uw applicatielandschap.
                <br />
                Uw gebruiksinformatie is zichtbaar voor andere gemeenten en
                samenwerkingen om kennisdeling te bevorderen. Daarnaast kan de
                leverancier zien dat u hun applicatie gebruikt.
                <br />
                De interne notitie is uitsluitend voor intern gebruik.
              </span>
            </div>
          </div>
        </Alert>
      )}

      <div className='ac-register-review'>
        <div className='ac-register-review__section'>
          <div className='ac-register-review__header'>
            <h3 className='utrecht-heading-4'>Overzicht</h3>
          </div>
          <Separator className='con-form-wizard-review-header__separator' />

          {/* Simplified review for Aanbod beheerders flow */}
          {isAanbodBeheerdersFlow ? (
            <>
              {/* Applicatie */}
              <div className='ac-register-review__field'>
                <strong>Applicatie:</strong>
                <div>
                  {moduleOptions.find((o) => o.value === gebruik?.module)?.label ||
                    '-'}
                </div>
              </div>

              {/* Klanten */}
              <div className='ac-register-review__field'>
                <strong>Klant(en):</strong>
                <div>
                  {selectedKlanten.length > 0 ? (
                    <UnorderedList>
                      {selectedKlanten.map((klantId) => {
                        const klantOption = klantenOptions.find(
                          (opt) => String(opt.value) === String(klantId)
                        );
                        return (
                          <UnorderedListItem key={klantId}>
                            {klantOption ? (
                              klantOption.label
                            ) : (
                              <ConUuidResolver>{klantId}</ConUuidResolver>
                            )}
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Only show contactpersoon if it has a value */}
              {gebruik?.contactpersoon && (
                <div className='ac-register-review__field'>
                  <strong>Contactpersoon:</strong>
                  <div>
                    {typeof gebruik.contactpersoon === 'object' ? (
                      // Handle contactpersoon as object with name properties
                      (() => {
                        const c = gebruik.contactpersoon;

                        // First, try to use the saved display name
                        if (c._displayName) {
                          return c._displayName;
                        }

                        // Try different name combinations for contactpersoon
                        const fullName = [
                          c?.voornaam,
                          c?.tussenvoegsel,
                          c?.achternaam,
                        ]
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
                      <ConUuidResolver>{gebruik.contactpersoon}</ConUuidResolver>
                    )}
                  </div>
                </div>
              )}

              {/* Afnemer section */}
              {gebruik?.type === 'ontbrekend-organisatie' &&
                (gebruik?.afnemer || afnemerKeuze === 'nieuw') && (
                  <div className='ac-register-review__field'>
                    <strong>Afnemer:</strong>
                    <div>
                      {afnemerKeuze === 'nieuw' ? (
                        <div>
                          <div
                            style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
                          >
                            Nieuwe aanbieder aanmaken
                          </div>
                          <div style={{ marginLeft: '1rem' }}>
                            <div>
                              <strong>Naam:</strong>{' '}
                              {afnemerOrganisatie?.naam || '-'}
                            </div>
                            {afnemerOrganisatie?.type && (
                              <div>
                                <strong>Type:</strong> {afnemerOrganisatie.type}
                              </div>
                            )}
                            {afnemerOrganisatie?.website && (
                              <AcFlex spacing='xs'>
                                <strong>Website:</strong>
                                <Link
                                  href={
                                    afnemerOrganisatie.website.startsWith(
                                      'http://'
                                    ) ||
                                    afnemerOrganisatie.website.startsWith('https://')
                                      ? afnemerOrganisatie.website
                                      : `https://${afnemerOrganisatie.website}`
                                  }
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  {afnemerOrganisatie.website}
                                </Link>
                              </AcFlex>
                            )}
                            {afnemerOrganisatie?.['e-mailadres'] && (
                              <AcFlex spacing='xs'>
                                <strong>E-mailadres:</strong>
                                <Link
                                  href={`mailto:${afnemerOrganisatie['e-mailadres']}`}
                                >
                                  {afnemerOrganisatie['e-mailadres']}
                                </Link>
                              </AcFlex>
                            )}
                            {afnemerOrganisatie?.telefoonnummer && (
                              <AcFlex spacing='xs'>
                                <strong>Telefoonnummer:</strong>
                                <Link
                                  href={`tel:${afnemerOrganisatie.telefoonnummer}`}
                                >
                                  {afnemerOrganisatie.telefoonnummer}
                                </Link>
                              </AcFlex>
                            )}
                          </div>
                        </div>
                      ) : (
                        getAfnemerDisplayName()
                      )}
                    </div>
                  </div>
                )}

              <div className='ac-register-review__field'>
                <strong>Status:</strong>
                <div>{gebruik?.status || '-'}</div>
              </div>

              {/* Only show the relevant start date based on selected status */}
              {relevantStartDate && relevantStartDate.value && (
                <div className='ac-register-review__field'>
                  <strong>{relevantStartDate.label}:</strong>
                  <div>{relevantStartDate.value}</div>
                </div>
              )}

              {/* Applicatie section */}
              <div className='ac-register-review__field'>
                <strong>Applicatie:</strong>
                <div>
                  {applicatieKeuze === 'nieuw' ? (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Nieuwe applicatie aanmaken
                      </div>
                      <div style={{ marginLeft: '1rem' }}>
                        <div>
                          <strong>Naam:</strong> {nieuweApplicatie?.naam || '-'}
                        </div>
                        {nieuweApplicatie?.website && (
                          <AcFlex spacing='xs'>
                            <strong>Website:</strong>
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
                          </AcFlex>
                        )}
                        {nieuweApplicatie?.beschrijvingKort && (
                          <div>
                            <strong>Beschrijving:</strong>{' '}
                            {nieuweApplicatie.beschrijvingKort}
                          </div>
                        )}

                        {/* Leverancier section within nieuwe applicatie */}
                        {leverancierKeuze === 'nieuw' ? (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Leverancier:</strong> Nieuwe leverancier aanmaken
                            <div
                              style={{ marginLeft: '1rem', marginTop: '0.25rem' }}
                            >
                              <div>
                                <strong>Naam:</strong>{' '}
                                {leverancierOrganisatie?.naam || '-'}
                              </div>
                              {leverancierOrganisatie?.type && (
                                <div>
                                  <strong>Type:</strong>{' '}
                                  {leverancierOrganisatie.type}
                                </div>
                              )}
                              {leverancierOrganisatie?.website && (
                                <AcFlex spacing='xs'>
                                  <strong>Website:</strong>
                                  <Link
                                    href={
                                      leverancierOrganisatie.website.startsWith(
                                        'http://'
                                      ) ||
                                      leverancierOrganisatie.website.startsWith(
                                        'https://'
                                      )
                                        ? leverancierOrganisatie.website
                                        : `https://${leverancierOrganisatie.website}`
                                    }
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    {leverancierOrganisatie.website}
                                  </Link>
                                </AcFlex>
                              )}
                              {leverancierOrganisatie?.['e-mailadres'] && (
                                <AcFlex spacing='xs'>
                                  <strong>E-mailadres:</strong>
                                  <Link
                                    href={`mailto:${leverancierOrganisatie['e-mailadres']}`}
                                  >
                                    {leverancierOrganisatie['e-mailadres']}
                                  </Link>
                                </AcFlex>
                              )}
                              {leverancierOrganisatie?.telefoonnummer && (
                                <AcFlex spacing='xs'>
                                  <strong>Telefoonnummer:</strong>
                                  <Link
                                    href={`tel:${leverancierOrganisatie.telefoonnummer}`}
                                  >
                                    {leverancierOrganisatie.telefoonnummer}
                                  </Link>
                                </AcFlex>
                              )}
                            </div>
                          </div>
                        ) : nieuweApplicatie?.leverancier ? (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Leverancier:</strong>{' '}
                            {(() => {
                              const leverancierId = nieuweApplicatie.leverancier;
                              const leverancierOption = (
                                leverancierOptions || []
                              ).find(
                                (opt) => String(opt.value) === String(leverancierId)
                              );
                              return leverancierOption
                                ? leverancierOption.label
                                : leverancierId.startsWith(
                                    '__manually_created_aanbieder__'
                                  )
                                ? 'Handmatig aangemaakt'
                                : leverancierId;
                            })()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    moduleOptions.find((o) => o.value === gebruik?.module)?.label ||
                    '-'
                  )}
                </div>
              </div>

              {/* Versie - only show for existing applicatie */}
              {applicatieKeuze === 'bestaand' && (
                <div className='ac-register-review__field'>
                  <strong>Versie:</strong>
                  <div>
                    {(() => {
                      // Since moduleVersie now stores the ID, look it up in selectedApplicatieData.moduleVersies
                      const moduleVersieId = gebruik?.moduleVersie;
                      if (!moduleVersieId || !selectedApplicatieData) return '-';

                      const versiesArray =
                        selectedApplicatieData.moduleVersies ||
                        selectedApplicatieData.moduleversies ||
                        [];

                      const foundVersie = versiesArray.find(
                        (v) => String(v?.id) === String(moduleVersieId)
                      );

                      if (foundVersie) {
                        return (
                          foundVersie?.versie ||
                          foundVersie?.version ||
                          foundVersie?.nummer ||
                          '-'
                        );
                      }

                      // Fallback to versionOptions lookup (for backwards compatibility)
                      const option = (versionOptions || []).find(
                        (o) => String(o.value) === String(moduleVersieId)
                      );
                      return option ? option.label : '-';
                    })()}
                  </div>
                </div>
              )}

              {/* Hosting - only show for existing applicatie */}
              {applicatieKeuze === 'bestaand' &&
                gebruik?.cloudDienstverleningsmodel && (
                  <div className='ac-register-review__field'>
                    <strong>Hosting:</strong>
                    <div>
                      {Array.isArray(gebruik.cloudDienstverleningsmodel) &&
                      gebruik.cloudDienstverleningsmodel.length > 0 ? (
                        <UnorderedList>
                          {gebruik.cloudDienstverleningsmodel.map(
                            (hosting, index) => (
                              <UnorderedListItem key={index}>
                                {hosting}
                              </UnorderedListItem>
                            )
                          )}
                        </UnorderedList>
                      ) : (
                        gebruik.cloudDienstverleningsmodel
                      )}
                    </div>
                  </div>
                )}

              {/* Interne aantekening */}
              {gebruik?.interneAantekening && (
                <div className='ac-register-review__field'>
                  <strong>Interne aantekening:</strong>
                  <div>{gebruik.interneAantekening}</div>
                </div>
              )}

              {/* Referentiecomponenten */}
              <div className='ac-register-review__field'>
                <strong>Referentiecomponenten:</strong>
                <div>
                  {(gebruik?.gebruiktVoorReferentiecomponenten || []).length ? (
                    <UnorderedList>
                      {(gebruik.gebruiktVoorReferentiecomponenten || []).map((v) => {
                        // Try to find in selectedReferentieComponenten first
                        const selectedRefComp = (
                          selectedReferentieComponenten || []
                        ).find((ref) => String(ref.id) === String(v));

                        if (selectedRefComp) {
                          return (
                            <UnorderedListItem key={v}>
                              {selectedRefComp.naam || v}
                            </UnorderedListItem>
                          );
                        }

                        // Fallback to refCompOptions if not in selectedReferentieComponenten
                        const opt = (refCompOptions || []).find(
                          (o) => String(o.value) === String(v)
                        );
                        return (
                          <UnorderedListItem key={v}>
                            {opt ? (
                              opt.label
                            ) : (
                              <ConUuidResolver>{v}</ConUuidResolver>
                            )}
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  ) : (
                    '-'
                  )}
                </div>
              </div>

              {/* Deelnemers */}
              {Array.isArray(gebruik?.deelnemers) &&
                gebruik.deelnemers.length > 0 && (
                  <div className='ac-register-review__field'>
                    <strong>Deelnemers:</strong>
                    <div>
                      <UnorderedList>
                        {gebruik.deelnemers.map((deelnemerId) => {
                          // First try to find in deelnemerOptions (for Samenwerking/Community)
                          const deelnemerOpt = (deelnemerOptions || []).find(
                            (o) => String(o.value) === String(deelnemerId)
                          );
                          if (deelnemerOpt) {
                            return (
                              <UnorderedListItem key={deelnemerId}>
                                {deelnemerOpt.label}
                              </UnorderedListItem>
                            );
                          }

                          // Fallback to organisatieOptions
                          const orgOpt = (organisatieOptions || []).find(
                            (o) => String(o.value) === String(deelnemerId)
                          );
                          if (orgOpt) {
                            return (
                              <UnorderedListItem key={deelnemerId}>
                                {orgOpt.label}
                              </UnorderedListItem>
                            );
                          }

                          // Fallback: use ConUuidResolver for unknown UUIDs
                          return (
                            <UnorderedListItem key={deelnemerId}>
                              <ConUuidResolver>{deelnemerId}</ConUuidResolver>
                            </UnorderedListItem>
                          );
                        })}
                      </UnorderedList>
                    </div>
                  </div>
                )}

              {/* Ondersteunde Standaarden (Compliancy) */}
              {Array.isArray(gebruik?.compliancy) &&
                gebruik.compliancy.length > 0 && (
                  <div className='ac-register-review__field'>
                    <strong>Ondersteunde standaarden:</strong>
                    <div>
                      <UnorderedList>
                        {gebruik.compliancy.map((comp, i) => {
                          const displayName =
                            comp.standaardnaam || comp.standaardversie;

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
                                    <Link
                                      href='#'
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleFileClick(comp.bewijs);
                                      }}
                                      title={comp.bewijsFilename || 'bewijs'}
                                    >
                                      {createMiddleEllipsis(comp.bewijsFilename)}
                                    </Link>
                                  </>
                                ) : comp.url ? (
                                  <>
                                    <span>- bewijs:</span>
                                    <Link
                                      href={comp.url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                    >
                                      {comp.url}
                                    </Link>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepReview);
