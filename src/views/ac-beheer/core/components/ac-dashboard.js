import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection, AcGrid, AcContainer } from '@atoms';
import { AcTile } from '@molecules';
import { ConDynamicSidenav } from '@components';
import { getDashboardWizards, getWizardUrl } from '@constants/wizards.constants';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

const AcDashboard = ({ store }) => {
  const navigate = useNavigate();
  const { user } = store;

  // Get available wizards for this user
  const availableWizards = getDashboardWizards(user, user?.organisation);

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcContainer>
        <AcFlex spacing='xl'>
          <ConDynamicSidenav store={store} />

          <AcFlex column spacing='lg' className='ac-dashboard-content'>
            {/* Wizard Tiles */}
            {availableWizards.length > 0 && (
              <div className='ac-dashboard-wizards'>
                <Heading level={3}>Wizards</Heading>
                <AcGrid columns={5} gap='xl' className='ac-dashboard-wizard-grid'>
                  {availableWizards.map((wizard) => (
                    <AcTile
                      key={wizard.id}
                      icon={wizard.icon}
                      text={wizard.name}
                      to={getWizardUrl(wizard)}
                      color={wizard.color}
                      size='medium'
                      className='ac-dashboard-wizard-tile'
                    />
                  ))}
                </AcGrid>
              </div>
            )}

            {/* Welcome Section */}
            <div className='ac-register-review__section'>
              <div className='ac-register-review__header'>
                <Heading level={4}>Welkom in de Softwarecatalogus!</Heading>
              </div>
              <Separator className='ac-register-review-header__separator' />

              <Paragraph>
                Dit is de centrale plek om applicaties en diensten binnen de gemeente
                te beheren en te ontdekken en deze te koppelen aan uw ICT
                Architectuur op basis van de GEMMA.
              </Paragraph>

              <div
                className='ac-register-review__field'
                style={{ marginTop: 'var(--tilburg-space-block-lg)' }}
              >
                <strong>Product aanbieden:</strong>
                <span>registreer uw softwareproduct als leverancier.</span>
              </div>

              <div
                className='ac-register-review__field'
                style={{ marginTop: 'var(--tilburg-space-block-lg)' }}
              >
                <strong>Product melden:</strong>
                <span>geef door als een product nog ontbreekt in de catalogus.</span>
              </div>

              <div className='ac-register-review__field'>
                <strong>Dienst registreren:</strong>
                <span>leg vast welke diensten u bij een product afneemt.</span>
              </div>

              <div className='ac-register-review__field'>
                <strong>Gebruik registreren:</strong>
                <span>
                  registreer hoe uw organisatie applicaties inzet in processen en
                  werkstromen.
                </span>
              </div>

              <div className='ac-register-review__field'>
                <strong>Koppeling registreren:</strong>
                <span>leg vast welke koppelingen uw organisatie gebruikt.</span>
              </div>

              <Paragraph>
                Voor account- en organisatiedetails gaat u naar{' '}
                <a
                  href='/account'
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/account');
                  }}
                >
                  Mijn Account
                </a>
                .
              </Paragraph>
            </div>
          </AcFlex>
        </AcFlex>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
