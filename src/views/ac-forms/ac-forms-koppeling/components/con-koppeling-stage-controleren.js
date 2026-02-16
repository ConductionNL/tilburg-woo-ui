import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { ConUuidResolver } from '@src/components';
import {
  Alert,
  Link,
  Paragraph,
  Separator,
  UnorderedList,
  UnorderedListItem,
  Heading1,
} from '@utrecht/component-library-react/dist/css-module';
import { AcFormatDate } from '@src/utilities/ac-format-date';

/**
 * Gets the relevant start date based on the selected status for a row.
 * @param {string} status - The status value
 * @param {Object} startDatumInProductieByRow - Map of rowId to date
 * @param {Object} startDatumGeplandByRow - Map of rowId to date
 * @param {Object} startDatumUitTeFaserenByRow - Map of rowId to date
 * @param {Object} startDatumUitGefaseerdByRow - Map of rowId to date
 * @param {number|string} rowId - The row ID
 * @returns {Object|null} - Object with label and value, or null
 */
const getRelevantStartDate = (
  status,
  startDatumInProductieByRow,
  startDatumGeplandByRow,
  startDatumUitTeFaserenByRow,
  startDatumUitGefaseerdByRow,
  rowId
) => {
  if (!status) return null;

  switch (status) {
    case 'in gebruik':
      return {
        label: 'Startdatum In gebruik',
        value: startDatumInProductieByRow?.[rowId]
          ? AcFormatDate(
              startDatumInProductieByRow[rowId],
              'YYYY-MM-DD',
              'D MMMM YYYY'
            )
          : null,
      };
    case 'in ontwikkeling':
      return {
        label: 'Startdatum In ontwikkeling',
        value: startDatumGeplandByRow?.[rowId]
          ? AcFormatDate(startDatumGeplandByRow[rowId], 'YYYY-MM-DD', 'D MMMM YYYY')
          : null,
      };
    case 'einde ondersteuning':
      return {
        label: 'Startdatum Einde ondersteuning',
        value: startDatumUitTeFaserenByRow?.[rowId]
          ? AcFormatDate(
              startDatumUitTeFaserenByRow[rowId],
              'YYYY-MM-DD',
              'D MMMM YYYY'
            )
          : null,
      };
    case 'teruggetrokken':
      return {
        label: 'Startdatum Teruggetrokken',
        value: startDatumUitGefaseerdByRow?.[rowId]
          ? AcFormatDate(
              startDatumUitGefaseerdByRow[rowId],
              'YYYY-MM-DD',
              'D MMMM YYYY'
            )
          : null,
      };
    default:
      return null;
  }
};

const ConKoppelingStageControleren = ({
  rows,
  modulesOptions,
  selectedModuleLabels,
  selectedAppAByRow,
  selectedAppBByRow,
  ownApp,
  directionByRow,
  typeByRow,
  typeOptions,
  beschrijvingByRow,
  beschrijvingLangByRow,
  statusByRow,
  statusOptions,
  nameByRow,
  getArrowForDirection,
  saveResult,
  saveErrors,
  // redirectCountdown,
  isEditMode,
  onRetryForm,
  onResetForm,
  standaardenByRow,
  standaardenOptions,
  koppelingsType,
  aanbieder,
  organisatieOptions,
  aanbiederKeuze,
  aanbiederOrganisatie,
  // Startdatum fields per status
  startDatumInProductieByRow,
  startDatumGeplandByRow,
  startDatumUitTeFaserenByRow,
  startDatumUitGefaseerdByRow,
  // Intermediair
  intermediairByRow,
  intermediairOptions,
  // New own app flow
  ownAppKeuze = 'bestaand',
  nieuweOwnApp = {},
  ownAppLeverancierKeuze = 'bestaand',
  nieuweOwnAppLeverancier = {},
  leverancierOptions = [],
}) => {
  const navigate = useNavigate();

  if (saveResult === 'error') {
    return (
      <div className='ac-register-form-section'>
        <Heading1>Er is iets misgegaan</Heading1>

        <Alert type='error'>
          <Paragraph>
            Het opslaan van de koppelingen is mislukt. Probeer het later nog eens.
          </Paragraph>
          {saveErrors?.length > 0 && (
            <>
              <Paragraph>
                <strong>Details:</strong>
              </Paragraph>
              <UnorderedList>
                {saveErrors.map((msg, idx) => (
                  <UnorderedListItem key={idx}>{msg}</UnorderedListItem>
                ))}
              </UnorderedList>
            </>
          )}
        </Alert>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
          <AcButton
            style='button'
            icon={<VISUALS.HOUSE />}
            onClick={() => navigate('/beheer')}
          >
            Terug naar beheer dashboard
          </AcButton>

          <AcButton
            style='button'
            buttonType='secondary'
            icon={<VISUALS.RELOAD />}
            onClick={onRetryForm}
          >
            Opnieuw proberen
          </AcButton>
        </div>
      </div>
    );
  }
  if (saveResult === 'success') {
    return (
      <div className='ac-register-form-section'>
        <Heading1>
          {isEditMode
            ? '🎉 Koppeling succesvol bijgewerkt!'
            : '🎉 Koppelingen succesvol opgeslagen!'}
        </Heading1>

        <Alert type='ok'>
          <Paragraph>
            <strong>
              {isEditMode
                ? 'Uw koppeling is succesvol bijgewerkt!'
                : 'Uw koppelingen zijn succesvol geregistreerd!'}
            </strong>
          </Paragraph>
          <Paragraph>
            Alle ingevoerde koppelingen zijn opgeslagen in de Softwarecatalogus.
          </Paragraph>
        </Alert>

        <div style={{ marginTop: '2rem' }}>
          <Paragraph>
            <strong>Wat gebeurt er nu?</strong>
          </Paragraph>
          <UnorderedList>
            <UnorderedListItem>
              De koppelingen worden zichtbaar in de Softwarecatalogus
            </UnorderedListItem>
            <UnorderedListItem>
              U kunt de koppelingen beheren via het beheer dashboard
            </UnorderedListItem>
            <UnorderedListItem>
              Eventuele wijzigingen kunnen later worden aangebracht
            </UnorderedListItem>
          </UnorderedList>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
          <AcButton
            style='button'
            icon={<VISUALS.HOUSE />}
            onClick={() => navigate('/beheer')}
          >
            Terug naar beheer dashboard
          </AcButton>

          <AcButton
            style='button'
            buttonType='secondary'
            icon={<VISUALS.LINK />}
            onClick={onResetForm}
          >
            Nieuwe koppeling registreren
          </AcButton>
        </div>
      </div>
    );
  }

  const optionLabelByValue = (val) => {
    if (!val) return '';
    const v = String(val);
    if (selectedModuleLabels && selectedModuleLabels[v])
      return selectedModuleLabels[v];
    const fromPool = modulesOptions.find((o) => String(o.value) === v);
    return fromPool?.label || '';
  };

  // Helper function to get the correct aanbieder display name
  const getAanbiederDisplayName = () => {
    // If creating a new organization, show the naam from aanbiederOrganisatie
    if (aanbiederKeuze === 'nieuw' && aanbiederOrganisatie?.naam) {
      return aanbiederOrganisatie.naam;
    }

    // If no aanbieder selected yet, return '-'
    if (!aanbieder) return '-';

    // If aanbieder is an object (from ConSchemaEnhancedField), use its name
    if (typeof aanbieder === 'object') {
      return (
        aanbieder?.['@self']?.name ||
        aanbieder?.naam ||
        aanbieder?.name ||
        aanbieder?.title ||
        '-'
      );
    }

    // If aanbieder is a string (UUID), try to find it in organisatieOptions
    const orgOption = (organisatieOptions || []).find(
      (opt) => String(opt.value) === String(aanbieder)
    );
    if (orgOption) {
      return orgOption.label;
    }

    // Fallback: use ConUuidResolver for UUID strings
    return <ConUuidResolver>{aanbieder}</ConUuidResolver>;
  };

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-review-title'
    >
      <h2 id='koppeling-review-title' className='sr-only'>
        Controleer uw gegevens
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Controleer of het overzicht van de koppeling volledig en juist is voordat u
        verder gaat.
        <br />
        U kunt met Vorige terug naar de eerdere stappen.
        <br />
        Na het registreren van de koppeling kunt u via uw &quot;Dashboard&quot; de
        koppeling opzoeken en indien gewenst aanpassen.
      </Paragraph>

      {saveResult === 'error' && (
        <Alert type='error'>
          <Paragraph>Opslaan mislukt:</Paragraph>
          {saveErrors.length > 0 && (
            <UnorderedList>
              {saveErrors.map((msg, idx) => (
                <UnorderedListItem key={idx}>{msg}</UnorderedListItem>
              ))}
            </UnorderedList>
          )}
        </Alert>
      )}

      <div className='ac-register-review'>
        <div className='ac-register-review__section'>
          <div className='ac-register-review__header'>
            <h3 className='utrecht-heading-4'>Koppelingen</h3>
          </div>
          <Separator className='ac-register-review-header__separator' />

          {/* Only show Aanbieder when type is 'aanbieden-koppeling' */}
          {koppelingsType === 'aanbieden-koppeling' && (
            <div className='ac-register-review__field'>
              <strong>Aanbieder:</strong>
              <div>{getAanbiederDisplayName()}</div>
            </div>
          )}

          {/* Koppelingen list - show first */}
          {!rows.length ? (
            <Paragraph>Geen koppelingen toegevoegd.</Paragraph>
          ) : (
            <div className='ac-register-review__field'>
              <strong>Koppelingen:</strong>
              <div>
                <UnorderedList>
                  {rows.map((rowId) => {
                    const naam = (nameByRow[rowId] || '').trim();
                    const appAValue =
                      selectedAppAByRow[rowId] || ownApp?.value || '';
                    const appALabel =
                      ownAppKeuze === 'nieuw'
                        ? nieuweOwnApp?.naam || '-'
                        : optionLabelByValue(appAValue) || ownApp?.label || '-';
                    const appBValue = selectedAppBByRow[rowId] || '';
                    const appBLabel = optionLabelByValue(appBValue) || '-';
                    const richting = directionByRow[rowId] || '';
                    const dirArrow = getArrowForDirection(richting);
                    const soortVal = typeByRow[rowId] || '';
                    const soortLabel =
                      (soortVal &&
                        (typeOptions.find((o) => o.value === soortVal)?.label ||
                          soortVal)) ||
                      '';
                    const statusVal = statusByRow[rowId] || '';
                    const statusLabel =
                      (statusVal &&
                        (statusOptions.find((o) => o.value === statusVal)?.label ||
                          statusVal)) ||
                      '';
                    const beschrijving = (beschrijvingByRow[rowId] || '').trim();
                    const beschrijvingLang = (
                      beschrijvingLangByRow?.[rowId] || ''
                    ).trim();

                    // Get the relevant start date for this row
                    const relevantStartDate = getRelevantStartDate(
                      statusVal,
                      startDatumInProductieByRow,
                      startDatumGeplandByRow,
                      startDatumUitTeFaserenByRow,
                      startDatumUitGefaseerdByRow,
                      rowId
                    );

                    // Get intermediair label if selected
                    const intermediairVal = intermediairByRow?.[rowId];
                    const intermediairLabel = intermediairVal
                      ? intermediairOptions?.find((o) => o.value === intermediairVal)
                          ?.label || ''
                      : '';

                    return (
                      <UnorderedListItem key={rowId}>
                        {naam && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>{naam}</strong>
                          </div>
                        )}
                        <div>
                          {appALabel} {dirArrow} {appBLabel}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {statusLabel && <div>Status: {statusLabel}</div>}
                          {relevantStartDate?.value && (
                            <div>
                              {relevantStartDate.label}: {relevantStartDate.value}
                            </div>
                          )}
                          {beschrijving && <div>Beschrijving: {beschrijving}</div>}
                          {beschrijvingLang && (
                            <div>Lange beschrijving: {beschrijvingLang}</div>
                          )}
                          {soortLabel && <div>Transportprotocol: {soortLabel}</div>}
                          {intermediairLabel && (
                            <div>Intermediair: {intermediairLabel}</div>
                          )}
                          {standaardenByRow?.[rowId]?.length > 0 && (
                            <div>
                              <div style={{ marginBottom: '0.25rem' }}>
                                Standaardversies:
                              </div>
                              <ul
                                style={{
                                  margin: 0,
                                  paddingInlineStart: '1.25rem',
                                  listStyleType: 'disc',
                                }}
                              >
                                {standaardenByRow[rowId]
                                  .map((s) => {
                                    const label = standaardenOptions.find(
                                      (o) => o.value === s
                                    )?.label;
                                    return label ? (
                                      <li
                                        key={s}
                                        style={{ marginBottom: '0.125rem' }}
                                      >
                                        {label}
                                      </li>
                                    ) : null;
                                  })
                                  .filter(Boolean)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </UnorderedListItem>
                    );
                  })}
                </UnorderedList>
              </div>
            </div>
          )}

          {/* Show new application section when creating a new own app - after koppelingen */}
          {ownAppKeuze === 'nieuw' && (
            <>
              <Separator className='ac-register-review__separator' />
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
                  <dd style={{ margin: 0 }}>{nieuweOwnApp?.naam || '-'}</dd>

                  {nieuweOwnApp?.website && (
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
                            nieuweOwnApp.website.startsWith('http://') ||
                            nieuweOwnApp.website.startsWith('https://')
                              ? nieuweOwnApp.website
                              : `https://${nieuweOwnApp.website}`
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {nieuweOwnApp.website}
                        </Link>
                      </dd>
                    </>
                  )}

                  {nieuweOwnApp?.beschrijvingKort && (
                    <>
                      <dt
                        style={{
                          fontWeight: 600,
                          color: 'var(--tilburg-color-gray-700)',
                        }}
                      >
                        Beschrijving
                      </dt>
                      <dd style={{ margin: 0 }}>{nieuweOwnApp.beschrijvingKort}</dd>
                    </>
                  )}
                </dl>

                {/* Leverancier subsection */}
                {(ownAppLeverancierKeuze === 'nieuw' ||
                  nieuweOwnApp?.leverancier) && (
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
                      {ownAppLeverancierKeuze === 'nieuw'
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
                      {ownAppLeverancierKeuze === 'nieuw' ? (
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
                            {nieuweOwnAppLeverancier?.naam || '-'}
                          </dd>

                          {nieuweOwnAppLeverancier?.website && (
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
                                    nieuweOwnAppLeverancier.website.startsWith(
                                      'http://'
                                    ) ||
                                    nieuweOwnAppLeverancier.website.startsWith(
                                      'https://'
                                    )
                                      ? nieuweOwnAppLeverancier.website
                                      : `https://${nieuweOwnAppLeverancier.website}`
                                  }
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  {nieuweOwnAppLeverancier.website}
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
                              const leverancierId = nieuweOwnApp.leverancier;
                              const leverancierOption = (
                                leverancierOptions || []
                              ).find(
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
  );
};

export default ConKoppelingStageControleren;
