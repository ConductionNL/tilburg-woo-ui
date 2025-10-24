import React, { memo } from 'react';
import { AcTile } from '@src/molecules';
import { AcGrid } from '@atoms';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

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
          <strong>Een enkele applicatie:</strong> één softwaretoepassing met eigen
          functionaliteit.
          <br />
          <strong>Een suite (meerdere applicaties/modules):</strong> een verzameling
          applicaties en modules die samen één oplossing vormen.
          <br />
          <i>
            Deze keuze helpt organisaties om te begrijpen hoe uw oplossing is
            opgebouwd en maakt de catalogus overzichtelijker.
          </i>
          {isMultiApplicatie && (
            <div className='ac-wizard-form-alert' style={{ marginTop: '1rem' }}>
              <Alert type='info'>
                <Paragraph>
                  U heeft gekozen voor een suite. In de volgende stappen kunt u
                  meerdere applicaties toevoegen aan dit product.
                </Paragraph>
              </Alert>
            </div>
          )}
        </Paragraph>

        <div className='ac-register-form-checkbox-wrapper'>
          <AcGrid columns={2} gap='xl'>
            <AcTile
              key={'enkel'}
              icon={VISUALS.CUBE}
              text={'Een enkele applicatie'}
              to={''}
              color={'blue'}
              size='medium'
              className={`ac-dashboard-wizard-tile ${
                !isMultiApplicatie ? 'ac-tile--selected' : 'ac-tile--not-selected'
              }`}
              onClick={() => setIsMultiApplicatie(false)}
            />

            <AcTile
              key={'multi'}
              icon={VISUALS.CUBES}
              text={'Een verzameling van applicaties (suite)'}
              to={''}
              color={'blue'}
              size='medium'
              className={`ac-dashboard-wizard-tile ${
                isMultiApplicatie ? 'ac-tile--selected' : 'ac-tile--not-selected'
              }`}
              onClick={() => setIsMultiApplicatie(true)}
            />
          </AcGrid>
        </div>
      </div>
    );
  }
);

ConFormProductopbouwStage.displayName = 'ConFormProductopbouwStage';

export default ConFormProductopbouwStage;
