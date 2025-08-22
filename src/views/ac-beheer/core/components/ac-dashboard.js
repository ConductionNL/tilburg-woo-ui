import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection, AcGrid } from '@atoms';
import { AcButton, AcTile } from '@molecules';
import { ConDynamicSidenav } from '@components';
import { getDashboardWizards, getWizardUrl, SOFTWARE_CATALOG_CONCEPTS } from '@constants/wizards.constants';
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
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />

        <AcFlex column spacing='lg' className='ac-dashboard-content'>
          {/* Wizard Tiles */}
          {availableWizards.length > 0 && (
            <div className='ac-dashboard-wizards'>
              <Heading level={3}>Wizards</Heading>
              <AcGrid columns={4} gap='xl' className='ac-dashboard-wizard-grid'>
                {availableWizards.map((wizard) => (
                  <AcTile
                    key={wizard.id}
                    icon={wizard.icon}
                    text={wizard.name}
                    to={getWizardUrl(wizard)}
                    color={wizard.color}
                    size="medium"
                    className='ac-dashboard-wizard-tile'
                  />
                ))}
              </AcGrid>
            </div>
          )}

          {/* Welcome Section */}
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <Heading level={4}>Welkom bij de Softwarecatalogus!</Heading>
            </div>
            <Separator className='ac-register-review-header__separator' />

            <Paragraph>
              Centrale plek voor het beheren en ontdekken van software, diensten en toepassingen binnen de overheid.
            </Paragraph>

            <Paragraph>
              Producten en diensten toevoegen aan de catalogus, gebruik van software registreren binnen uw organisatie, zoeken naar bestaande oplossingen en uw organisatiegegevens beheren.
            </Paragraph>

            <div className='ac-register-review__field' style={{ marginTop: 'var(--tilburg-space-block-lg)' }}>
              <strong>Product:</strong>
              <span>Een softwareproduct is een complete oplossing die door een organisatie wordt aangeboden. Dit kan bijvoorbeeld een website, applicatie of systeem zijn.</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Dienst:</strong>
              <span>Een dienst is een specifieke functionaliteit of service die wordt aangeboden, vaak als onderdeel van een groter product.</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Applicatie:</strong>
              <span>Een applicatie is een specifieke software-implementatie die onderdeel kan zijn van een product en concrete functionaliteiten biedt.</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Gebruik:</strong>
              <span>Gebruik registreert hoe organisaties producten, diensten of applicaties inzetten binnen hun processen en werkwijzen.</span>
            </div>

            <Paragraph>
              U kunt uw organisatiegegevens en accountinformatie beheren via{' '}
              <a href="/account" onClick={(e) => { e.preventDefault(); navigate('/account'); }}>
                Mijn Account
              </a>.
              Voor vragen over de catalogus kunt u contact opnemen via de contactgegevens 
              in de footer van deze website.
            </Paragraph>
          </div>
        </AcFlex>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
