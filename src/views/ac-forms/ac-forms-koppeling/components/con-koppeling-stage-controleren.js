import React from 'react';
import {
  Alert,
  Paragraph,
  Separator,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';

const ConKoppelingStageControleren = ({
  rows,
  modulesOptions,
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
  redirectCountdown,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-review-title'
    >
      <h2 id='koppeling-review-title' className='sr-only'>
        Controleren
      </h2>

      {saveResult === 'success' && (
        <div className='ac-register-form-alert'>
          <Alert type='info'>
            <Paragraph>
              Koppelingen succesvol opgeslagen. U wordt doorgestuurd naar het
              beheer-overzicht in {redirectCountdown} seconden…
            </Paragraph>
            <Paragraph>
              Of ga direct naar{' '}
              <a className='ac-register-form-alert-link' href='/beheer/koppeling'>
                /beheer/koppeling
              </a>
              .
            </Paragraph>
          </Alert>
        </div>
      )}

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
            <h3 className='utrecht-heading-4'>Overzicht koppelingen</h3>
          </div>
          <Separator className='con-form-wizard-review-header__separator' />

          {!rows.length ? (
            <Paragraph>Geen toegevoegde koppelingen.</Paragraph>
          ) : (
            <UnorderedList>
              {rows.map((rowId) => {
                const naam = (nameByRow[rowId] || '').trim();
                const appALabel =
                  modulesOptions.find((o) => o.value === selectedAppAByRow[rowId])
                    ?.label ||
                  ownApp?.label ||
                  '-';
                const appBLabel =
                  modulesOptions.find((o) => o.value === selectedAppBByRow[rowId])
                    ?.label || '-';
                const richting = directionByRow[rowId] || '';
                const soortVal = typeByRow[rowId] || '';
                const soortLabel =
                  (soortVal &&
                    (typeOptions.find((o) => o.value === soortVal)?.label ||
                      soortVal)) ||
                  '-';
                const beschrijving = beschrijvingByRow[rowId] || '-';
                const statusVal = statusByRow[rowId] || '';
                const statusLabel =
                  (statusVal &&
                    (statusOptions.find((o) => o.value === statusVal)?.label ||
                      statusVal)) ||
                  '-';
                const dirArrow = getArrowForDirection(richting);

                return (
                  <UnorderedListItem key={rowId}>
                    {naam ? (
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>{naam}</strong>
                      </div>
                    ) : null}
                    {appALabel} {dirArrow} {appBLabel}
                    <div>
                      <small>
                        <strong>Beschrijving:</strong> {beschrijving}
                      </small>
                    </div>
                    <div>
                      <small>
                        <strong>Soort:</strong> {soortLabel}
                      </small>
                    </div>
                    <div>
                      <small>
                        <strong>Status:</strong> {statusLabel}
                      </small>
                    </div>
                  </UnorderedListItem>
                );
              })}
            </UnorderedList>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConKoppelingStageControleren;
