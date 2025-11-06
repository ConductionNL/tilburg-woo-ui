import React, { memo } from 'react';
import {
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

/**
 * Controleren Stage Component
 *
 * This stage shows a review/overview of all the information entered in previous stages.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 */
const ConFormApplicatieControlerenStage = memo(({ applicatie }) => {
  return (
    <div>
      <Paragraph>
        Bekijk hieronder de ingevulde gegevens. Controleer of alle informatie klopt
        voordat u uw applicatie aanmeldt. U kunt velden nog aanpassen via de
        &apos;Vorige&apos; knop of op een later moment via uw eigen omgeving.
      </Paragraph>
      <br />
      <div className='con-form-wizard-review-heading-container'>
        <h3 className='con-form-wizard-review-heading-header'>
          Applicatie informatie
        </h3>
        <div className='ac-register-review__section'>
          <div className='ac-register-review__header'>
            <h4 className='utrecht-heading-4'>{applicatie.naam}</h4>
          </div>
          <Separator className='con-form-wizard-review-header__separator' />

          <div className='ac-register-review__field'>
            <strong>Naam:</strong>
            <span
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
              }}
            >
              {applicatie.naam || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ConFormApplicatieControlerenStage.displayName = 'ConFormApplicatieControlerenStage';

export default ConFormApplicatieControlerenStage;
