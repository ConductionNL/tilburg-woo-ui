import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { ConUuidResolver } from '@src/components';
import {
  Alert,
  Paragraph,
  Separator,
  UnorderedList,
  UnorderedListItem,
  Heading1,
} from '@utrecht/component-library-react/dist/css-module';
import { AcFormatDate } from '@src/utilities/ac-format-date';

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
  // Gebruik-beheerders flow props
  selectedKoppelingId,
  statusGebruiksinformatie,
  datumInGebruik,
  datumInOntwikkeling,
  datumEindeOndersteuning,
  datumTeruggetrokken,
  datumVerwerving,
  interneAantekening,
  deelnemers,
  deelnemerOptions,
  searchResults,
  // New koppeling creation props
  koppelingKeuze,
  nieuweKoppeling,
  leverancierKeuze,
  leverancierOrganisatie,
  buitengemeentelijkeOptions,
}) => {
  const navigate = useNavigate();

  // State for fetched koppeling data (for gebruik beheerder flow)
  const [selectedKoppelingData, setSelectedKoppelingData] = useState(null);
  const [koppelingLoading, setKoppelingLoading] = useState(false);

  // Manage visibility state of info alert (for gebruik beheerder flow)
  // Alert persists as closed for the session after user closes it (via sessionStorage).
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('koppeling-controleren-info-alert-closed');
  });

  // Mark the alert as closed for the session and update state.
  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-controleren-info-alert-closed', 'true');
  };

  // Fetch selected koppeling data for gebruik beheerder flow (also in edit mode)
  useEffect(() => {
    if (!selectedKoppelingId || koppelingsType !== 'aanbieden-koppeling') return;

    // First try to find in searchResults
    const foundInResults = (searchResults || []).find(
      (k) => String(k?.id || k?.['@self']?.id || '') === String(selectedKoppelingId)
    );

    if (foundInResults) {
      setSelectedKoppelingData(foundInResults);
      return;
    }

    // If not found in results, fetch it
    let cancelled = false;
    const fetchKoppelingData = async () => {
      try {
        setKoppelingLoading(true);
        const url = `/api/openregister/api/objects/voorzieningen/koppeling/${encodeURIComponent(
          selectedKoppelingId
        )}?_extend[]=@self.schema&_extend[]=@self.relations&_published=false`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();

        if (!cancelled) {
          setSelectedKoppelingData(data);
        }
      } catch (error) {
        console.error('Failed to fetch koppeling data for review:', error);
      } finally {
        if (!cancelled) setKoppelingLoading(false);
      }
    };

    fetchKoppelingData();
    return () => {
      cancelled = true;
    };
  }, [selectedKoppelingId, koppelingsType, searchResults]);

  // Helper function to get the relevant start date based on status
  const getRelevantStartDate = () => {
    const status = statusGebruiksinformatie;
    if (!status) return null;

    switch (status) {
      case 'Verwerving':
        return {
          label: 'Startdatum Verwerving',
          value: datumVerwerving
            ? AcFormatDate(datumVerwerving, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      case 'Gepland':
        return {
          label: 'Startdatum Gepland',
          value: datumInOntwikkeling
            ? AcFormatDate(datumInOntwikkeling, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      case 'In productie':
        return {
          label: 'Startdatum In productie',
          value: datumInGebruik
            ? AcFormatDate(datumInGebruik, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      case 'Uit te faseren':
        return {
          label: 'Startdatum Uit te faseren',
          value: datumEindeOndersteuning
            ? AcFormatDate(datumEindeOndersteuning, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      case 'Uitgefaseerd':
        return {
          label: 'Startdatum Uitgefaseerd',
          value: datumTeruggetrokken
            ? AcFormatDate(datumTeruggetrokken, 'YYYY-MM-DD', 'D MMMM YYYY')
            : null,
        };
      default:
        return null;
    }
  };

  const relevantStartDate = getRelevantStartDate();

  // Helper function to resolve deelnemer names from IDs
  const getDeelnemerLabel = (deelnemerId) => {
    if (!deelnemerId) return '';
    const deelnemerOpt = (deelnemerOptions || []).find(
      (o) => String(o.value) === String(deelnemerId)
    );
    if (deelnemerOpt) return deelnemerOpt.label;
    return String(deelnemerId);
  };

  // Helper function to extract relation ID
  const extractRelationId = (rel) => {
    if (!rel) return '';
    if (typeof rel === 'string') return String(rel);
    if (typeof rel === 'object') {
      return String(rel.id || rel.value || rel?.['@self']?.id || '') || '';
    }
    return '';
  };

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
            Alle ingevoerde koppelingen zijn opgeslagen in de softwarecatalogus.
          </Paragraph>
        </Alert>

        <div style={{ marginTop: '2rem' }}>
          <Paragraph>
            <strong>Wat gebeurt er nu?</strong>
          </Paragraph>
          <UnorderedList>
            <UnorderedListItem>
              De koppelingen worden zichtbaar in de softwarecatalogus
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
    if (fromPool) return fromPool.label;
    // Also check buitengemeentelijkeOptions
    const fromBgv = (buitengemeentelijkeOptions || []).find((o) => String(o.value) === v);
    return fromBgv?.label || '';
  };

  // Helper to get module B label for new koppeling
  const getModuleBLabelForNewKoppeling = () => {
    if (!nieuweKoppeling?.moduleB) return '-';

    // First check if we have a stored label
    if (nieuweKoppeling?.moduleBLabel) {
      return nieuweKoppeling.moduleBLabel;
    }

    const moduleBValue = nieuweKoppeling.moduleB;

    // Check in modulesOptions
    const moduleOption = (modulesOptions || []).find(
      (opt) => String(opt.value) === String(moduleBValue)
    );
    if (moduleOption) return moduleOption.label;

    // Check in buitengemeentelijkeOptions
    const bgvOption = (buitengemeentelijkeOptions || []).find(
      (opt) => String(opt.value) === String(moduleBValue)
    );
    if (bgvOption) return bgvOption.label;

    return String(moduleBValue);
  };

  // Helper to get leverancier label for new koppeling
  const getLeverancierLabelForNewKoppeling = () => {
    if (leverancierKeuze === 'nieuw') {
      return leverancierOrganisatie?.naam || '';
    }

    // First check if we have a stored label (from selection)
    if (nieuweKoppeling?.leverancierLabel) {
      return nieuweKoppeling.leverancierLabel;
    }

    // Fallback to leverancier ID (will be resolved by ConUuidResolver)
    return nieuweKoppeling?.leverancier || '';
  };

  // Check if we have any leverancier info to display
  const hasLeverancierInfo = () => {
    if (leverancierKeuze === 'nieuw') {
      return !!leverancierOrganisatie?.naam;
    }
    return !!nieuweKoppeling?.leverancier || !!nieuweKoppeling?.leverancierLabel;
  };

  // Render Gebruik-beheerders flow (aanbieden-koppeling)
  if (koppelingsType === 'aanbieden-koppeling') {
    // Check if we're creating a new koppeling
    const isNewKoppeling = koppelingKeuze === 'nieuw';

    // For existing koppeling
    const koppeling = selectedKoppelingData;
    const rels = koppeling?.['@self']?.relations || {};
    const moduleAIdRaw = rels?.moduleA ?? koppeling?.moduleA;
    const moduleBIdRaw = rels?.moduleB ?? koppeling?.moduleB ?? rels?.buitengemeentelijkVoorziening ?? koppeling?.buitengemeentelijkVoorziening;
    const moduleAId = String(extractRelationId(moduleAIdRaw) || '');
    const moduleBId = String(extractRelationId(moduleBIdRaw) || '');
    const moduleALabel = optionLabelByValue(moduleAId);
    const moduleBLabel = optionLabelByValue(moduleBId);
    const moduleADisplay = moduleALabel || moduleAId || '-';
    const moduleBDisplay = moduleBLabel || moduleBId || '-';
    const richting =
      koppeling?.gegevensuitwisselingRichting ||
      koppeling?.richting ||
      'bi-directioneel';
    const dirArrow = getArrowForDirection(richting);
    const koppelingNaam = koppeling?.naam || '';
    const koppelingType = koppeling?.type || '';
    const koppelingBeschrijving = koppeling?.beschrijvingKort || '';
    const koppelingStandaarden = koppeling?.standaardversies || [];

    // For new koppeling
    const newKoppelingNaam = nieuweKoppeling?.naam || '';
    const newKoppelingRichting = nieuweKoppeling?.richting || 'bi-directioneel';
    const newKoppelingDirArrow = getArrowForDirection(newKoppelingRichting);
    const newModuleALabel = ownApp?.label || '-';
    const newModuleBLabel = getModuleBLabelForNewKoppeling();
    const isNewLeverancier = leverancierKeuze === 'nieuw';
    const leverancierDisplayName = getLeverancierLabelForNewKoppeling();
    const leverancierWebsite = isNewLeverancier
      ? leverancierOrganisatie?.website || ''
      : '';

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='koppeling-review-title'
      >
        <h2 id='koppeling-review-title' className='utrecht-heading-2'>
          Controleer uw gegevens
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          Controleer of het overzicht van de koppeling volledig en juist is voordat u
          verder gaat. U kunt met Vorige terug naar de eerdere stappen. Na het
          registreren van de koppeling kunt u via uw Dashboard de koppeling opzoeken
          en indien gewenst aanpassen.
        </Paragraph>

        {/* Closeable info alert */}
        {showInfoAlert && (
          <Alert
            severity='info'
            className='ac-forms-product-info-alert'
            style={{ marginBottom: '2rem' }}
          >
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
                <Paragraph style={{ margin: 0 }}>
                  De koppeling wordt toegevoegd aan uw applicatielandschap.
                </Paragraph>
                <Paragraph style={{ margin: '0.5rem 0 0 0' }}>
                  Uw gebruiksinformatie is zichtbaar voor andere gemeenten en
                  samenwerkingen om kennisdeling te bevorderen. De leverancier ziet
                  dat u de koppeling gebruikt.
                </Paragraph>
                <Paragraph style={{ margin: '0.5rem 0 0 0' }}>
                  De interne notitie is uitsluitend voor intern gebruik.
                </Paragraph>
              </div>
            </div>
          </Alert>
        )}

        {isNewKoppeling ? (
          /* New Koppeling Review */
          <div className='ac-register-review'>
            {/* Leverancier Section - always shown above koppeling */}
            {hasLeverancierInfo() && (
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <h3 className='utrecht-heading-4'>
                    {isNewLeverancier ? 'Nieuwe leverancier' : 'Leverancier'}
                  </h3>
                </div>
                <Separator className='ac-register-review-header__separator' />

                <div className='ac-register-review__field'>
                  <strong>Naam:</strong>
                  <div>
                    {isNewLeverancier ? (
                      leverancierDisplayName || '-'
                    ) : leverancierDisplayName ? (
                      <ConUuidResolver>{leverancierDisplayName}</ConUuidResolver>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>

                {leverancierWebsite && (
                  <div className='ac-register-review__field'>
                    <strong>Website:</strong>
                    <div>{leverancierWebsite}</div>
                  </div>
                )}
              </div>
            )}

            {/* New Koppeling Section */}
            <div className='ac-register-review__section'>
              <div className='ac-register-review__header'>
                <h3 className='utrecht-heading-4'>Nieuwe koppeling</h3>
              </div>
              <Separator className='ac-register-review-header__separator' />

              <div className='ac-register-review__field'>
                <strong>Aanbieder:</strong>
                <div>
                  <div>
                    {isNewLeverancier ? (
                      leverancierDisplayName || '-'
                    ) : leverancierDisplayName ? (
                      <ConUuidResolver>{leverancierDisplayName}</ConUuidResolver>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>

              {newKoppelingNaam && (
                <div className='ac-register-review__field'>
                  <strong>Naam:</strong>
                  <div>{newKoppelingNaam}</div>
                </div>
              )}

              <div className='ac-register-review__field'>
                <strong>Koppeling:</strong>
                <div>
                  {newModuleALabel} {newKoppelingDirArrow} {newModuleBLabel}
                </div>
              </div>
            </div>

            {/* Gebruiksinformatie Section for new koppeling */}
            <div className='ac-register-review__section'>
              <div className='ac-register-review__header'>
                <h3 className='utrecht-heading-4'>Gebruiksinformatie</h3>
              </div>
              <Separator className='ac-register-review-header__separator' />

              {statusGebruiksinformatie && (
                <div className='ac-register-review__field'>
                  <strong>Status:</strong>
                  <div>{statusGebruiksinformatie}</div>
                </div>
              )}

              {/* Only show the relevant start date based on selected status */}
              {relevantStartDate && relevantStartDate.value && (
                <div className='ac-register-review__field'>
                  <strong>{relevantStartDate.label}:</strong>
                  <div>{relevantStartDate.value}</div>
                </div>
              )}

              {interneAantekening && (
                <div className='ac-register-review__field'>
                  <strong>Interne notitie:</strong>
                  <div>{interneAantekening}</div>
                </div>
              )}
            </div>

            {/* Deelnemers Section for new koppeling */}
            {Array.isArray(deelnemers) && deelnemers.length > 0 && (
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <h3 className='utrecht-heading-4'>Deelnemers</h3>
                </div>
                <Separator className='ac-register-review-header__separator' />

                <div className='ac-register-review__field'>
                  <strong>Deelnemers:</strong>
                  <div>
                    <UnorderedList>
                      {deelnemers.map((deelnemerId) => {
                        const label = getDeelnemerLabel(deelnemerId);
                        return (
                          <UnorderedListItem key={deelnemerId}>
                            {label ? (
                              label
                            ) : (
                              <ConUuidResolver>{deelnemerId}</ConUuidResolver>
                            )}
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : koppelingLoading ? (
          <Paragraph>Bezig met laden...</Paragraph>
        ) : !selectedKoppelingData ? (
          <Alert type='error'>
            <Paragraph>
              De geselecteerde koppeling kon niet worden geladen. Controleer of de
              koppeling nog bestaat.
            </Paragraph>
          </Alert>
        ) : (
          <div className='ac-register-review'>
            {/* Selected Koppeling Section */}
            <div className='ac-register-review__section'>
              <div className='ac-register-review__header'>
                <h3 className='utrecht-heading-4'>Geselecteerde koppeling</h3>
              </div>
              <Separator className='ac-register-review-header__separator' />

              {koppelingNaam && (
                <div className='ac-register-review__field'>
                  <strong>Naam:</strong>
                  <div>{koppelingNaam}</div>
                </div>
              )}

              <div className='ac-register-review__field'>
                <strong>Koppeling:</strong>
                <div>
                  {moduleALabel ? (
                    moduleADisplay
                  ) : (
                    <ConUuidResolver>{moduleADisplay}</ConUuidResolver>
                  )}{' '}
                  {dirArrow}{' '}
                  {moduleBLabel ? (
                    moduleBDisplay
                  ) : (
                    <ConUuidResolver>{moduleBDisplay}</ConUuidResolver>
                  )}
                </div>
              </div>

              {koppelingType && (
                <div className='ac-register-review__field'>
                  <strong>Type:</strong>
                  <div>{koppelingType}</div>
                </div>
              )}

              {koppelingBeschrijving && (
                <div className='ac-register-review__field'>
                  <strong>Beschrijving:</strong>
                  <div>{koppelingBeschrijving}</div>
                </div>
              )}

              {koppelingStandaarden.length > 0 && (
                <div className='ac-register-review__field'>
                  <strong>Standaarden:</strong>
                  <div>
                    {koppelingStandaarden
                      .map((s) => {
                        const standaardOpt = (standaardenOptions || []).find(
                          (o) => String(o.value) === String(s)
                        );
                        return standaardOpt?.label || String(s);
                      })
                      .join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Gebruiksinformatie Section */}
            <div className='ac-register-review__section'>
              <div className='ac-register-review__header'>
                <h3 className='utrecht-heading-4'>Gebruiksinformatie</h3>
              </div>
              <Separator className='ac-register-review-header__separator' />

              {statusGebruiksinformatie && (
                <div className='ac-register-review__field'>
                  <strong>Status:</strong>
                  <div>{statusGebruiksinformatie}</div>
                </div>
              )}

              {/* Only show the relevant start date based on selected status */}
              {relevantStartDate && relevantStartDate.value && (
                <div className='ac-register-review__field'>
                  <strong>{relevantStartDate.label}:</strong>
                  <div>{relevantStartDate.value}</div>
                </div>
              )}

              {interneAantekening && (
                <div className='ac-register-review__field'>
                  <strong>Interne notitie:</strong>
                  <div>{interneAantekening}</div>
                </div>
              )}
            </div>

            {/* Deelnemers Section */}
            {Array.isArray(deelnemers) && deelnemers.length > 0 && (
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <h3 className='utrecht-heading-4'>Deelnemers</h3>
                </div>
                <Separator className='ac-register-review-header__separator' />

                <div className='ac-register-review__field'>
                  <strong>Deelnemers:</strong>
                  <div>
                    <UnorderedList>
                      {deelnemers.map((deelnemerId) => {
                        const label = getDeelnemerLabel(deelnemerId);
                        return (
                          <UnorderedListItem key={deelnemerId}>
                            {label ? (
                              label
                            ) : (
                              <ConUuidResolver>{deelnemerId}</ConUuidResolver>
                            )}
                          </UnorderedListItem>
                        );
                      })}
                    </UnorderedList>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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
        Controleren
      </h2>

      <Paragraph>
        Controleer of het overzicht van de koppeling volledig en juist is voordat u
        verder gaat.
        <br />
        U kunt met Vorige terug naar de eerdere stappen.
        <br />
        Na het registreren van de koppeling kunt u via uw “Dashboard” de koppeling
        opzoeken en indien gewenst aanpassen.
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
                      optionLabelByValue(appAValue) || ownApp?.label || '-';
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

                    return (
                      <UnorderedListItem key={rowId}>
                        {naam && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>{naam}</strong>
                          </div>
                        )}
                        <div>
                          {appALabel} {dirArrow} {appBLabel}
                          {soortLabel ? ` (${soortLabel})` : ''}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {statusLabel && <div>Status: {statusLabel}</div>}
                          {beschrijving && <div>Beschrijving: {beschrijving}</div>}
                          {standaardenByRow?.[rowId]?.length > 0 && (
                            <div>
                              Standaarden:{' '}
                              {standaardenByRow[rowId]
                                .map(
                                  (s) =>
                                    standaardenOptions.find((o) => o.value === s)
                                      ?.label
                                )
                                .join(', ')}
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
        </div>
      </div>
    </div>
  );
};

export default ConKoppelingStageControleren;
