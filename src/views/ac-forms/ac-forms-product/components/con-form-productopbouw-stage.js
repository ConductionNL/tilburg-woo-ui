import React, { memo } from 'react';
import { AcCheckbox } from '@src/molecules';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Productopbouw Stage Component
 *
 * This stage allows users to choose between single or multiple applications
 * for their product registration.
 *
 * @param {boolean} isMultiApplicatie - Whether product has multiple applications
 * @param {Function} setIsMultiApplicatie - Function to update application mode
 */
const ConFormProductopbouwStage = memo(
  ({ isMultiApplicatie, setIsMultiApplicatie }) => {
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
          <strong>Definieer de structuur van uw product</strong>
          <br />
          Een product kan bestaan uit:
          <br />
          <br />
          <strong>Een enkele applicatie:</strong> één softwaretoepassing met eigen
          functionaliteit.
          <br />
          <br />
          <strong>Een suite (meerdere applicaties/modules):</strong> een verzameling
          applicaties en modules die samen één oplossing vormen.
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

          {isMultiApplicatie && (
            <Alert type='info' style={{ marginTop: '1rem' }}>
              <Paragraph>
                U heeft gekozen voor een suite. In de volgende stappen kunt u
                meerdere applicaties toevoegen aan dit product
              </Paragraph>
            </Alert>
          )}
        </div>
      </div>
    );
  }
);

ConFormProductopbouwStage.displayName = 'ConFormProductopbouwStage';

export default ConFormProductopbouwStage;
