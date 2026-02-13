import React, { memo } from 'react';
import { AcTile } from '@src/molecules';
import { AcGrid } from '@atoms';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

/**
 * ConFormSoortDienstStage
 * Selection step for choosing the type of service registration:
 * - Voor eigen organisatie: Service on a product from this organization
 * - Voor andere organisatie: Service on a product from another organization
 */
const ConFormSoortDienstStage = ({ dienstType, setDienstType }) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='soort-section-title'
    >
      <h2 id='soort-section-title' className='sr-only'>
        Soort dienst
      </h2>

      <Paragraph>
        <strong>Definieer het type dienst dat u wilt registreren</strong>
        <br />
        Een dienst kan bestaan uit:
        <br />
        <strong>Voor eigen organisatie:</strong> Een dienst op een product van uw
        organisatie. U beheert zowel de dienst als het onderliggende product.
        <br />
        <strong>Voor andere organisatie:</strong> Een dienst op een product van een
        andere organisatie. U biedt een dienst aan op een bestaand extern product.
        <br />
        <i>
          Deze keuze helpt organisaties om te begrijpen hoe uw dienst is
          gepositioneerd en maakt de softwarecatalogus overzichtelijker.
        </i>
      </Paragraph>

      {dienstType && (
        <div className='ac-wizard-form-alert' style={{ marginTop: '1rem' }}>
          <Alert type='info'>
            <Paragraph>
              {dienstType === 'eigen-organisatie'
                ? 'U heeft gekozen voor dienst op eigen product. In de volgende stappen selecteert u een product van uw organisatie en definieert de dienst.'
                : 'U heeft gekozen voor dienst op extern product. In de volgende stappen selecteert u een product van een andere organisatie en definieert uw dienst daarop.'}
            </Paragraph>
          </Alert>
        </div>
      )}

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
              dienstType === 'eigen-organisatie'
                ? 'ac-tile--selected'
                : 'ac-tile--not-selected'
            }`}
            onClick={() => setDienstType('eigen-organisatie')}
          />

          <AcTile
            key={'andere-organisatie'}
            icon={VISUALS.HAND_SHAKE}
            text={'Voor andere organisatie'}
            to={''}
            color={'blue'}
            size='medium'
            className={`ac-dashboard-wizard-tile ${
              dienstType === 'andere-organisatie'
                ? 'ac-tile--selected'
                : 'ac-tile--not-selected'
            }`}
            onClick={() => setDienstType('andere-organisatie')}
          />
        </AcGrid>
      </div>
    </div>
  );
};

export default memo(ConFormSoortDienstStage);
