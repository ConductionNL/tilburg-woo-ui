import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection, AcGrid, AcContainer } from '@atoms';
import { AcTile } from '@molecules';
import {
  ConDynamicSidenav,
  ConOrganizationSelector,
  ConAangebodenGebruikTable,
  ConSpinLoader,
} from '@components';
import { getDashboardWizards, getWizardUrl } from '@constants/wizards.constants';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Paragraph,
  Separator,
  Link,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';

const AcDashboard = ({ store }) => {
  const navigate = useNavigate();
  const { user, object } = store;

  const [orgIsPublished, setOrgIsPublished] = useState(false);
  const [userOrganization, setUserOrganization] = useState(null);
  const [hasVoorgesteldGebruik, setHasVoorgesteldGebruik] = useState(true); // Start as true, let component set to false if no data
  const [refreshKey, setRefreshKey] = useState(0); // Key to force component refresh
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true);

  const fetchOrganisatieData = useCallback(async () => {
    const activeOrganizationId = user?.activeOrganization?.uuid;
    if (!activeOrganizationId) {
      setIsLoadingOrganization(false);
      return;
    }

    // Check if organization data is already cached
    const cachedOrganization = object.getObject(
      'voorzieningen_organisatie',
      activeOrganizationId
    );

    if (cachedOrganization) {
      // Use cached data immediately
      setOrgIsPublished(!!cachedOrganization?.['@self']?.published);
      setUserOrganization(cachedOrganization);
      setIsLoadingOrganization(false);
      return;
    }

    // Fetch if not cached
    setIsLoadingOrganization(true);
    try {
      await object.fetchObject('voorzieningen', 'organisatie', activeOrganizationId);

      const result = object.getObject(
        'voorzieningen_organisatie',
        activeOrganizationId
      );
      if (result) {
        setOrgIsPublished(!!result?.['@self']?.published);
        setUserOrganization(result);
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setIsLoadingOrganization(false);
    }
  }, [user?.activeOrganization?.uuid, object]);

  // Handle organization switch success
  const handleOrganizationSwitch = useCallback(
    (updatedUserData) => {
      console.info('Organization switched successfully:', updatedUserData);

      // Reset voorgesteld gebruik state to show info box initially
      setHasVoorgesteldGebruik(true);

      // Refresh organization data for new organization
      fetchOrganisatieData();

      // Force refresh of the ConAangebodenGebruikTable component
      setRefreshKey((prev) => prev + 1);
    },
    [fetchOrganisatieData]
  );

  // Handle organization switch error
  const handleOrganizationSwitchError = useCallback((error) => {
    console.error('Organization switch failed:', error);
    // Could add user notification here if needed
  }, []);

  useEffect(() => {
    fetchOrganisatieData();
  }, [fetchOrganisatieData]);

  // Get available wizards for this user - only calculate when userOrganization is loaded
  const availableWizards = useMemo(() => {
    if (!userOrganization) return [];
    return getDashboardWizards(user, userOrganization);
  }, [user, userOrganization]);

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcContainer>
        <AcFlex spacing='xl'>
          <ConDynamicSidenav store={store} />

          <AcFlex column spacing='lg' className='ac-dashboard-content'>
            {/* Wizard Tiles */}
            <div className='ac-dashboard-wizards'>
              <AcFlex
                alignItems='center'
                justifyContent='between'
                className='ac-dashboard-wizards-header'
              >
                <Heading level={3}>Mijn software catalogus</Heading>

                <ConOrganizationSelector
                  store={store}
                  className='ac-dashboard-org-selector'
                  onSwitchSuccess={handleOrganizationSwitch}
                  onSwitchError={handleOrganizationSwitchError}
                />
              </AcFlex>

              {isLoadingOrganization ? (
                <AcFlex
                  justifyContent='center'
                  style={{ padding: 'var(--tilburg-space-block-xl)' }}
                >
                  <ConSpinLoader />
                </AcFlex>
              ) : availableWizards.length > 0 ? (
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
              ) : (
                <Paragraph>
                  Geen wizards beschikbaar voor deze organisatie.
                </Paragraph>
              )}
            </div>

            {/* Warning card for unpublished organization */}
            {!orgIsPublished && (
              <Alert type='warning'>
                <Heading level={4}>
                  Uw organisatie staat nog niet gepubliceerd in de software catalogus
                </Heading>
                <Paragraph>
                  Dit betekent dat uw organisatie momenteel niet zichtbaar is in de
                  zoekfunctie van de catalogus. Bezoekers kunnen uw organisatie en de
                  bijbehorende producten en diensten nog niet vinden. Gebruik de
                  &quot;Publiceren&quot; actie om uw organisatie beschikbaar te maken
                  voor bezoekers en deel te nemen aan de software catalogus.
                </Paragraph>
                <AcFlex justifyContent='end'>
                  <Link href='/beheer/my-organisation'>Naar Mijn Organisatie</Link>
                </AcFlex>
              </Alert>
            )}

            {/* Voorgesteld Gebruik Table - Separate info container - Only show if there are suggestions */}
            {/* TODO: figure out why did doesnt work anymore */}
            {hasVoorgesteldGebruik && (
              <Alert type='info'>
                <Heading level={4}>Voorgesteld Gebruik</Heading>
                <Paragraph>
                  Hieronder vindt u gebruik suggesties die door andere organisaties
                  voor u zijn aangemaakt. U kunt deze overnemen om ze toe te voegen
                  aan uw organisatie of afwijzen als ze niet relevant zijn.
                </Paragraph>
                <div style={{ marginTop: 'var(--tilburg-space-block-md)' }}>
                  <ConAangebodenGebruikTable
                    key={refreshKey}
                    onDataChange={setHasVoorgesteldGebruik}
                  />
                </div>
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
                Voor accountdetails gaat u naar
                <Link
                  className='ac-dashboard-link'
                  href='/beheer/my-account'
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/beheer/my-account');
                  }}
                >
                  Mijn Account
                </Link>
                . Voor organisatiedetails gaat u naar
                <Link
                  className='ac-dashboard-link'
                  href='/beheer/my-organisation'
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/beheer/my-organisation');
                  }}
                >
                  Mijn Organisatie
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
