import React from 'react';
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
