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
  interneAantekening,
  deelnemers,
  deelnemerOptions,
  searchResults,
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

  // Fetch selected koppeling data for gebruik beheerder flow
  useEffect(() => {
    if (
      !selectedKoppelingId ||
      koppelingsType !== 'aanbieden-koppeling' ||
      isEditMode
    )
      return;

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
        const url = `/api/apps/openregister/api/objects/voorzieningen/koppeling/${encodeURIComponent(
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
  }, [selectedKoppelingId, koppelingsType, isEditMode, searchResults]);

  // Helper function to get the relevant date field label/value based on status
  const getDateFieldForStatus = () => {
    if (!statusGebruiksinformatie) return { label: '', value: '' };

    const statusToDateMap = {
      'in gebruik': { label: 'Startdatum Status', value: datumInGebruik },
      'in ontwikkeling': {
        label: 'Startdatum Status',
        value: datumInOntwikkeling,
      },
      'einde ondersteuning': {
        label: 'Startdatum Status',
        value: datumEindeOndersteuning,
      },
      teruggetrokken: {
        label: 'Startdatum Status',
        value: datumTeruggetrokken,
      },
    };

    return statusToDateMap[statusGebruiksinformatie] || { label: '', value: '' };
  };

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
    return fromPool?.label || '';
  };

  // Render Gebruik-beheerders flow (aanbieden-koppeling)
  if (koppelingsType === 'aanbieden-koppeling') {
    const koppeling = selectedKoppelingData;
    const rels = koppeling?.['@self']?.relations || {};
    const moduleAIdRaw = rels?.moduleA ?? koppeling?.moduleA;
    const moduleBIdRaw = rels?.moduleB ?? koppeling?.moduleB;
    const moduleAId = String(extractRelationId(moduleAIdRaw) || '');
    const moduleBId = String(extractRelationId(moduleBIdRaw) || '');
    const moduleALabel = optionLabelByValue(moduleAId) || moduleAId || '-';
    const moduleBLabel = optionLabelByValue(moduleBId) || moduleBId || '-';
    const richting =
      koppeling?.gegevensuitwisselingRichting ||
      koppeling?.richting ||
      'bi-directioneel';
    const dirArrow = getArrowForDirection(richting);
    const koppelingNaam = koppeling?.naam || '';
    const koppelingType = koppeling?.type || '';
    const koppelingBeschrijving = koppeling?.beschrijvingKort || '';
    const koppelingStandaarden = koppeling?.standaardversies || [];
    const dateField = getDateFieldForStatus();

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

        {koppelingLoading ? (
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
                  <ConUuidResolver>{moduleALabel}</ConUuidResolver> {dirArrow}{' '}
                  <ConUuidResolver>{moduleBLabel}</ConUuidResolver>
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

              {dateField.value && (
                <div className='ac-register-review__field'>
                  <strong>{dateField.label}:</strong>
                  <div>{dateField.value}</div>
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
