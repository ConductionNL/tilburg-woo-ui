import React, { memo } from 'react';
import { AcTile } from '@src/molecules';
import { AcGrid } from '@atoms';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * ConGebruikStepSoort
 * Selection step for choosing the type of usage registration:
 * - Voor eigen organisatie: Register usage of existing products by your organization  
 * - Voor andere organisatie: Register usage of your products by other organizations (customers)
 */
const ConGebruikStepSoort = ({ gebruikType, setGebruikType, loading, gebruik }) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='soort-section-title'
    >
      <h2 id='soort-section-title' className='sr-only'>
        Soort gebruik
      </h2>



      <Paragraph>
        <strong>Definieer het type gebruik dat u wilt registreren</strong>
        <br />
        Een gebruik kan bestaan uit:
        <br />
        <strong>Voor eigen organisatie:</strong> Selecteer een bestaand product uit de software catalogus en registreer het gebruik door uw organisatie.
        <br />
        <strong>Voor andere organisatie:</strong> Registreer het gebruik van uw product door een klant. De klant wordt geïnformeerd en moet het gebruik goedkeuren.
        <br />
        <i>
          Deze keuze helpt organisaties om te begrijpen hoe uw registratie is opgebouwd en maakt de catalogus overzichtelijker.
        </i>
        {gebruikType && (
          <div className='ac-register-form-alert' style={{ marginTop: '1rem' }}>
            <Alert type='info'>
              <Paragraph>
                {gebruikType === 'eigen-organisatie'
                  ? 'U heeft gekozen voor gebruik door eigen organisatie. In de volgende stappen selecteert u een product uit de catalogus dat uw organisatie gebruikt.'
                  : 'U heeft gekozen voor gebruik door andere organisatie. In de volgende stappen selecteert u een klantorganisatie en een product van uw organisatie.'
                }
              </Paragraph>
            </Alert>
          </div>
        )}
      </Paragraph>

      <div className='ac-register-form-checkbox-wrapper'>
        <AcGrid columns={2} gap='xl'>
          <AcTile
            key={'eigen-organisatie'}
            icon={VISUALS.BUILDING}
            text={'Voor eigen organisatie'}
            to={''}
            color={'blue'}
            size='medium'
            className={`ac-dashboard-wizard-tile ${
              gebruikType === 'eigen-organisatie' ? 'ac-tile--selected' : 'ac-tile--not-selected'
            }`}
            onClick={() => setGebruikType('eigen-organisatie')}
          />

          <AcTile
            key={'andere-organisatie'}
            icon={VISUALS.HAND_SHAKE}
            text={'Voor andere organisatie'}
            to={''}
            color={'blue'}
            size='medium'
            className={`ac-dashboard-wizard-tile ${
              gebruikType === 'andere-organisatie' ? 'ac-tile--selected' : 'ac-tile--not-selected'
            }`}
            onClick={() => setGebruikType('andere-organisatie')}
          />
        </AcGrid>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepSoort);
