import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection, AcGrid, AcContainer } from '@atoms';
import { AcTile } from '@molecules';
import {
  ConDynamicSidenav,
  ConOrganizationSelector,
  ConAangebodenSuggestiesTable,
  ConSpinLoader,
} from '@components';
import { getDashboardWizards, getWizardUrl } from '@constants/wizards.constants';
import { useNavigate } from 'react-router';
import {
  Heading,
  Paragraph,
  Separator,
  Alert,
  Link,
} from '@utrecht/component-library-react/dist/css-module';

const AcDashboard = ({ store }) => {
  const navigate = useNavigate();
  const { user, object } = store;

  const [userOrganization, setUserOrganization] = useState(null);
  const [hasSuggestions, setHasSuggestions] = useState(null); // null = checking, true = has suggestions, false = no suggestions
  const [refreshKey, setRefreshKey] = useState(0); // Key to force component refresh
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true);

  const userGroups = user?.user?.groups || [];

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
      setUserOrganization(cachedOrganization);
      setIsLoadingOrganization(false);
      return;
    }

    // Fetch if not cached
    setIsLoadingOrganization(true);
    try {
      await object.fetchObject(
        'voorzieningen',
        'organisatie',
        activeOrganizationId,
        {
          _published: 'false',
        }
      );

      const result = object.getObject(
        'voorzieningen_organisatie',
        activeOrganizationId
      );
      if (result) {
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

      // Reset suggestions state to checking mode
      setHasSuggestions(null);

      // Refresh organization data for new organization
      fetchOrganisatieData();

      // Force refresh of the ConAangebodenSuggestiesTable component
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
                <Heading level={3}>Mijn softwarecatalogus</Heading>

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
                <AcGrid
                  columns={
                    availableWizards.length >= 4 ? 4 : availableWizards.length
                  }
                  gap='xl'
                  className='ac-dashboard-wizard-grid'
                >
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

            {/* Aangeboden Suggesties Table - Shows suggestions from other organizations */}
            <div
              style={{
                visibility: hasSuggestions === true ? 'visible' : 'hidden',
                height: hasSuggestions === true ? 'auto' : 0,
                overflow: 'hidden',
              }}
            >
              <div className='ac-dashboard-suggestions-fade-in'>
                <Alert type='info'>
                  <Heading level={4}>Aangeboden Suggesties</Heading>
                  <Paragraph>
                    Hieronder vindt u suggesties die door andere organisaties voor u
                    zijn aangemaakt. Dit kunnen koppelingen, gebruik of andere
                    registraties zijn. U kunt deze overnemen om ze toe te voegen aan
                    uw organisatie, of afwijzen als ze niet relevant zijn.
                  </Paragraph>
                  <div style={{ marginTop: 'var(--tilburg-space-block-md)' }}>
                    <ConAangebodenSuggestiesTable
                      id={user?.activeOrganization?.uuid}
                      key={refreshKey}
                      onDataChange={setHasSuggestions}
                    />
                  </div>
                </Alert>
              </div>
            </div>

            {/* Welcome Section */}
            <div className='ac-register-review__section'>
              {/* show this section if the user is a leverancier or gemeente */}
              {userGroups.includes('aanbod-beheerder') && (
                <>
                  <div className='ac-register-review__header'>
                    <Heading level={4}>Welkom in uw softwarecatalogus</Heading>
                  </div>
                  <Separator />

                  <div>
                    <Paragraph>
                      Via deze omgeving publiceert en beheert u uw aanbod voor
                      gemeenten. Hier legt u vast:
                    </Paragraph>

                    <ul style={{ marginInlineStart: '1.2rem' }}>
                      <li>welke applicaties en diensten u aanbiedt</li>
                      <li>welke koppelingen beschikbaar zijn</li>
                      <li>
                        hoe uw oplossing aansluit op de GEMeentelijke Model
                        Architectuur (GEMMA)
                      </li>
                      <li>
                        dat uw applicatie beschikbaar is voor opname in het
                        gemeentelijke applicatielandschap
                      </li>
                    </ul>
                  </div>

                  <Paragraph>
                    Wilt u een nieuwe applicatie, dienst of koppeling publiceren?
                    Gebruik dan de acties bovenaan deze pagina. Een overzicht van uw
                    reeds gepubliceerde applicaties, diensten en koppelingen vindt u
                    via het linkermenu.
                  </Paragraph>

                  <Paragraph>
                    Gemeenten gebruiken deze informatie bij het vergelijken,
                    selecteren en inkopen van applicaties. Zorg daarom dat uw
                    gegevens volledig en actueel zijn.
                  </Paragraph>
                </>
              )}

              {/* show this section for the other 2 options */}
              {userGroups.includes('gebruik-beheerder') &&
                !userGroups.includes('aanbod-beheerder') && (
                  <>
                    <div className='ac-register-review__header'>
                      <Heading level={4}>Welkom in de softwarecatalogus</Heading>
                    </div>
                    <Separator className='ac-register-review-header__separator' />

                    <Paragraph>
                      Dit is de centrale plek om producten, applicaties, diensten en
                      koppelingen te beheren. Door applicaties te koppelen aan
                      GEMMA-referentiecomponenten wordt uw applicatielandschap
                      gemapped op de GEMMA-referentiearchitectuur.
                    </Paragraph>

                    <div className='ac-register-review__field'>
                      <strong>Dienst registreren:</strong>
                      <span>leg vast welke diensten u bij een product afneemt.</span>
                    </div>

                    <div className='ac-register-review__field'>
                      <strong>Gebruik registreren:</strong>
                      <span>
                        registreer hoe uw organisatie applicaties inzet in processen
                        en werkstromen.
                      </span>
                    </div>

                    <div className='ac-register-review__field'>
                      <strong>Koppeling registreren:</strong>
                      <span>
                        leg vast welke koppelingen uw organisatie gebruikt.
                      </span>
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
                  </>
                )}
            </div>
          </AcFlex>
        </AcFlex>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
