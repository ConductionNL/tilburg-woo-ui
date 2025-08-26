import React, { memo } from 'react';
import {
  Paragraph,
  UnorderedList,
  UnorderedListItem,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

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
}) => {
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

          <div className='ac-register-review__field'>
            <strong>Naam:</strong>
            <div>{gebruik?.naam || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Contactpersoon:</strong>
            <div>{gebruik?.contactpersoon || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Afnemer:</strong>
            <div>{gebruik?.afnemer?.naam || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Status:</strong>
            <div>{gebruik?.status || '-'}</div>
          </div>

          <div className='ac-register-review__field'>
            <strong>Startdatum Verwerving:</strong>
            <div>{gebruik?.startDatumVerwerving || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Geplande Startdatum:</strong>
            <div>{gebruik?.startDatumGepland || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Startdatum In Productie:</strong>
            <div>{gebruik?.startDatumInProductie || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Startdatum Uit Te Faseren:</strong>
            <div>{gebruik?.startDatumUitTeFaseren || '-'}</div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Startdatum Uit Gefaseerd:</strong>
            <div>{gebruik?.startDatumUitGefaseerd || '-'}</div>
          </div>

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
                        {opt ? opt.label : v}
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
            <strong>Product:</strong>
            <div>
              {(() => {
                const p = gebruik?.product;
                return p?.naam || p?.name || p?.title || '-';
              })()}
            </div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Applicatie:</strong>
            <div>
              {(() => {
                const m = gebruik?.module;
                return m?.naam || m?.name || m?.title || '-';
              })()}
            </div>
          </div>
          <div className='ac-register-review__field'>
            <strong>Module versie:</strong>
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
                        {opt ? opt.label : v}
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
                        {opt ? opt.label : v}
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
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepReview);
