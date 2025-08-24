import React, { memo } from 'react';
import { AcCheckbox } from '@src/molecules';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Productopbouw Stage Component
 * 
 * This stage allows users to choose between single or multiple applications
 * for their product registration.
 * 
 * @param {boolean} isMultiApplicatie - Whether product has multiple applications
 * @param {Function} setIsMultiApplicatie - Function to update application mode
 */
const ConFormProductopbouwStage = memo(({ isMultiApplicatie, setIsMultiApplicatie }) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='productopbouw-section-title'
    >
      <h2 id='productopbouw-section-title' className='sr-only'>
        Productopbouw
      </h2>

      <Paragraph>
        Een product kan één applicatie zijn, of een verzameling applicaties en
        modules die samen een suite vormen. Geef hieronder aan welke situatie van
        toepassing is.
      </Paragraph>

      <div className='ac-register-form-checkbox-wrapper'>
        <AcCheckbox
          label='Een enkele applicatie'
          value='single'
          checked={!isMultiApplicatie}
          onChange={() => setIsMultiApplicatie(false)}
        />
        <AcCheckbox
          label='Een verzameling applicaties of modules (suite)'
          value='multi'
          checked={isMultiApplicatie}
          onChange={() => setIsMultiApplicatie(true)}
        />
      </div>
    </div>
  );
});

ConFormProductopbouwStage.displayName = 'ConFormProductopbouwStage';

export default ConFormProductopbouwStage;

