import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection, AcGrid, AcContainer } from '@atoms';
import { AcTile } from '@molecules';
import { ConDynamicSidenav, ConOrganizationSelector } from '@components';
import { getDashboardWizards, getWizardUrl } from '@constants/wizards.constants';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Paragraph,
  Separator,
  Link,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

const AcDashboard = ({ store }) => {
  const navigate = useNavigate();
  const { user, object } = store;

  const [orgIsPublished, setOrgIsPublished] = useState(null);

  useEffect(() => {
    const activeOrganizationId = user?.activeOrganization?.uuid;

    const fetchOrganisatieData = async () => {
      await object.fetchObject('voorzieningen', 'organisatie', activeOrganizationId);

      const result = object.getObject(
        'voorzieningen_organisatie',
        activeOrganizationId
      );
      if (result) {
        setOrgIsPublished(!!result?.['@self']?.published);
      }
    };

    fetchOrganisatieData();
  }, []);

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
                <AcFlex
                  alignItems='center'
                  justifyContent='between'
                  className='ac-dashboard-wizards-header'
                >
                  <Heading level={3}>
                    <AcFlex spacing='xs' alignItems='center'>
                      <VISUALS.WAND_SPARKLES_SOLID
                        style={{ width: '24px', height: '24px' }}
                      />
                      Mijn softwarecatalogus
                    </AcFlex>
                  </Heading>

                  <ConOrganizationSelector
                    store={store}
                    className='ac-dashboard-org-selector'
                    onSwitchSuccess={() => {
                      // Refresh the page to update wizards based on new organization
                      // window.location.reload();
                    }}
                    onSwitchError={(error) => {
                      console.error('Organization switch failed:', error);
                    }}
                  />
                </AcFlex>

                <AcGrid columns={5} gap='xl' className='ac-dashboard-wizard-grid'>
                  {availableWizards.map((wizard) => (
                    <AcTile
                      key={wizard.id}
                      icon={wizard.icon}
                      text={wizard.name}
                      to={getWizardUrl(wizard)}
                      color={wizard.color}
                      disabled={wizard.disabled}
                      size='medium'
                      className='ac-dashboard-wizard-tile'
                    />
                  ))}
                </AcGrid>
              </div>
            )}

            {/* Warning card for unpublished objects */}
            {orgIsPublished === false && (
              <Alert type='warning'>
                <Heading level={4}>
                  Deze organisatie is nog niet gepubliceerd
                </Heading>
                <Paragraph>
                  Deze organisatie is momenteel niet zichtbaar in de zoekfunctie van{' '}
                  de catalogus. Gebruik de &quot;Publiceren&quot; actie om het
                  beschikbaar te maken voor bezoekers.
                </Paragraph>
                <AcFlex justifyContent='end'>
                  <Link href='/beheer/my-organisation'>Naar Mijn Organisatie</Link>
                </AcFlex>
              </Alert>
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

              <Paragraph className='ac-dashboard-link-container'>
                Voor account- en organisatiedetails gaat u naar
                <Link
                  className='ac-dashboard-link'
                  href='/account'
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/account');
                  }}
                >
                  Mijn Account
                </Link>
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
