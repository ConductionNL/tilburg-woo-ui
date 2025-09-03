import React from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcSection, AcContainer, AcFlex, AcGrid } from '@atoms';
import { AcTile } from '@molecules';
import { getDashboardWizards, getWizardUrl } from '@constants/wizards.constants';
import { VISUALS } from '@src/constants';
import {
  Heading,
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

// ConFormsIndex
// Renders a wizard picker at /forms showing available wizards as tiles
const ConFormsIndex = ({ store }) => {
  const { user } = store || {};
  const availableWizards = getDashboardWizards(user, user?.organisation);

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcContainer>
        <AcFlex column spacing='lg' className='ac-dashboard-content'>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <Heading level={3}>
                <AcFlex spacing='xs' alignItems='center'>
                  <VISUALS.WAND_SPARKLES_SOLID
                    style={{ width: '24px', height: '24px' }}
                  />
                  Kies een wizard om te starten
                </AcFlex>
              </Heading>
            </div>
            <Separator className='ac-register-review-header__separator' />

            <Paragraph>
              <strong>Wat wilt u doen?</strong>
              <br />
              Selecteer hieronder de gewenste wizard. Deze begeleidt u stap voor
              stap.
            </Paragraph>
          </div>

          {availableWizards?.length > 0 && (
            <div className='ac-dashboard-wizards'>
              <AcGrid columns={5} gap='xl' className='ac-dashboard-wizard-grid'>
                {availableWizards.map((wizard) => (
                  <AcTile
                    key={wizard.id}
                    icon={wizard.icon}
                    text={wizard.name}
                    to={getWizardUrl(wizard)}
                    color={wizard.color || 'blue'}
                    size='medium'
                    className='ac-dashboard-wizard-tile'
                  />
                ))}
              </AcGrid>
            </div>
          )}
        </AcFlex>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(ConFormsIndex));
