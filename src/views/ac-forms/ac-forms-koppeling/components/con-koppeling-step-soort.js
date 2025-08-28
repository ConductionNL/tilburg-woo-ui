import React from 'react';
import { AcGrid } from '@src/atoms';
import { AcTile } from '@src/molecules';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * Soort Koppeling Step Component
 *
 * This step allows users to select the type of connection they want to register:
 * - Voor eigen organisatie: Report usage of connections on software within own organization
 * - Aanbieden koppeling: Offer connections on existing products (potentially adding services for other parties)
 */
const ConKoppelingStepSoort = ({ koppelingsType, setKoppelingsType }) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='soort-section-title'
    >
      <h2 id='soort-section-title' className='sr-only'>
        Soort koppeling
      </h2>

      <Paragraph>
        <strong>Definieer het type koppeling dat u wilt registreren</strong>
        <br />
        Een koppeling kan bestaan uit:
      </Paragraph>

      <Paragraph>
        <strong>Voor eigen organisatie:</strong> Het opgeven van gebruik van een
        koppeling op in gebruik zijnde software binnen de eigen organisatie.
        <br />
        <strong>Aanbieden koppeling:</strong> Het aanbod van een koppeling op
        bestaand product. Indien het een koppeling betreft op product van andere
        partij(en) kan tevens meteen een dienst worden toegevoegd.
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
              koppelingsType === 'eigen-organisatie'
                ? 'ac-tile--selected'
                : 'ac-tile--not-selected'
            }`}
            onClick={() => setKoppelingsType('eigen-organisatie')}
          />
          <AcTile
            key={'aanbieden-koppeling'}
            icon={VISUALS.HAND_SHAKE}
            text={'Aanbieden koppeling'}
            to={''}
            color={'blue'}
            size='medium'
            className={`ac-dashboard-wizard-tile ${
              koppelingsType === 'aanbieden-koppeling'
                ? 'ac-tile--selected'
                : 'ac-tile--not-selected'
            }`}
            onClick={() => setKoppelingsType('aanbieden-koppeling')}
          />
        </AcGrid>
      </div>

      {koppelingsType && (
        <Alert type='info' style={{ marginTop: '1rem' }}>
          {koppelingsType === 'eigen-organisatie'
            ? 'U gaat het gebruik van een koppeling binnen uw organisatie registreren. Dit helpt bij het beheer van uw softwarelandschap.'
            : 'U gaat een koppeling aanbieden op een bestaand product. Dit kan ook gebruikt worden om diensten toe te voegen voor andere organisaties.'}
        </Alert>
      )}
    </div>
  );
};

export default ConKoppelingStepSoort;
