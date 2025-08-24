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
        <strong>Definieer de structuur van uw product</strong><br/>
        Een product kan bestaan uit één enkele applicatie of een verzameling van meerdere applicaties en modules die samen een suite vormen. 
        Deze informatie helpt organisaties om het juiste product te vinden en te begrijpen hoe complex uw oplossing is. 
        In de catalogus worden producten overzichtelijk weergegeven met hun onderliggende componenten, 
        waardoor potentiële gebruikers direct zien wat uw product omvat.
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

