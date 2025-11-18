import React, { memo } from 'react';
import {
  UnorderedList,
  UnorderedListItem,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import { AcLink } from '@src/molecules';
import { handleFileClick } from '@utils';

/**
 * ConGebruikStepReview
 * Review screen mirroring product review UI.
 */
const ConGebruikStepReview = ({
  gebruik,
  versionOptions,
  refCompOptions,
  koppelingOptions,
  dienstOptions,
  organisatieOptions,
  moduleOptions,
  standaardenOptions,
  referentieComponentenWithStandards,
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

    // If afnemer is a string (UUID), try to find it in organisatieOptions
    const orgOption = (organisatieOptions || []).find(
      (opt) => String(opt.value) === String(afnemer)
    );
    if (orgOption) {
      return orgOption.label;
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
          value: gebruik?.startDatumVerwerving,
        };
      case 'Gepland':
        return {
          label: 'Geplande Startdatum',
          value: gebruik?.startDatumGepland,
        };
      case 'In productie':
        return {
          label: 'Startdatum In Productie',
          value: gebruik?.startDatumInProductie,
        };
      case 'Uit te faseren':
        return {
          label: 'Startdatum Uit Te Faseren',
          value: gebruik?.startDatumUitTeFaseren,
        };
      case 'Uitgefaseerd':
        return {
          label: 'Startdatum Uit Gefaseerd',
          value: gebruik?.startDatumUitGefaseerd,
        };
      default:
        return null;
    }
  };

  const relevantStartDate = getRelevantStartDate();

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
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='review-title'
    >
      <h2 id='review-title' className='sr-only'>
        Controleren
      </h2>

      <div className='ac-register-review'>
        <div className='ac-register-review__section'>
          <div className='ac-register-review__header'>
            <h3 className='utrecht-heading-4'>Overzicht</h3>
          </div>
          <Separator className='con-form-wizard-review-header__separator' />

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
                  <ConUuidResolver>{gebruik.contactpersoon}</ConUuidResolver>
                )}
              </div>
            </div>
          )}

          {/* Only show Afnemer when type is 'ontbrekend-organisatie' */}
          {gebruik?.type === 'ontbrekend-organisatie' && (
            <div className='ac-register-review__field'>
              <strong>Afnemer:</strong>
              <div>{getAfnemerDisplayName()}</div>
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

          <div className='ac-register-review__field'>
            <strong>Referentiecomponenten:</strong>
            <div>
              {(gebruik?.gebruiktVoorReferentiecomponenten || []).length ? (
                <UnorderedList>
                  {(gebruik.gebruiktVoorReferentiecomponenten || []).map((v) => {
                    const opt = (refCompOptions || []).find(
                      (o) => String(o.value) === String(v)
                    );
                    return (
                      <UnorderedListItem key={v}>
                        {opt ? opt.label : <ConUuidResolver>{v}</ConUuidResolver>}
                      </UnorderedListItem>
                    );
                  })}
                </UnorderedList>
              ) : (
                '-'
              )}
            </div>
          </div>

          <div className='ac-register-review__field'>
            <strong>Applicatie:</strong>
            <div>
              {moduleOptions.find((o) => o.value === gebruik?.module)?.label || '-'}
            </div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Applicatie versie:</strong>
            <div>
              {(
                (versionOptions || []).find(
                  (o) => String(o.value) === String(gebruik?.moduleVersie)
                ) || {}
              ).label || '-'}
            </div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Koppelingen:</strong>
            <div>
              {(gebruik?.koppelingen || []).length ? (
                <UnorderedList>
                  {(gebruik.koppelingen || []).map((v) => {
                    const opt = (koppelingOptions || []).find(
                      (o) => String(o.value) === String(v)
                    );
                    return (
                      <UnorderedListItem key={v}>
                        {opt ? opt.label : <ConUuidResolver>{v}</ConUuidResolver>}
                      </UnorderedListItem>
                    );
                  })}
                </UnorderedList>
              ) : (
                '-'
              )}
            </div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Diensten:</strong>
            <div>
              {(gebruik?.diensten || []).length ? (
                <UnorderedList>
                  {(gebruik.diensten || []).map((v) => {
                    const opt = (dienstOptions || []).find(
                      (o) => String(o.value) === String(v)
                    );
                    return (
                      <UnorderedListItem key={v}>
                        {opt ? opt.label : <ConUuidResolver>{v}</ConUuidResolver>}
                      </UnorderedListItem>
                    );
                  })}
                </UnorderedList>
              ) : (
                '-'
              )}
            </div>
          </div>

          {Array.isArray(gebruik?.deelnemers) && gebruik.deelnemers.length > 0 && (
            <div className='ac-register-review__field'>
              <strong>Deelnemers:</strong>
              <div>
                <UnorderedList>
                  {gebruik.deelnemers.map((v) => {
                    const opt = (organisatieOptions || []).find(
                      (o) => String(o.value) === String(v)
                    );
                    return (
                      <UnorderedListItem key={v}>
                        {opt ? opt.label : v}
                      </UnorderedListItem>
                    );
                  })}
                </UnorderedList>
              </div>
            </div>
          )}

          {/* Ondersteunde Standaarden (Compliancy) */}
          {Array.isArray(gebruik?.compliancy) && gebruik.compliancy.length > 0 && (
            <div className='ac-register-review__field'>
              <strong>Ondersteunde standaarden:</strong>
              <div>
                <UnorderedList>
                  {gebruik.compliancy.map((comp, i) => {
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
                              <AcLink
                                href={comp.url}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                {comp.url}
                              </AcLink>
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
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepReview);
