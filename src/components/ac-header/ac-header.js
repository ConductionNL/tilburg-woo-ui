import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { AcNavigation, AcCNavigation } from '@components';
import { AcBreadcrumbs } from '@molecules';
import { AcContainer, ConLogo } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { getTitle } from '@services/con-get-title';
import { useWindowSize } from '@hooks';

const AcHeader = ({ store: { menu, user, object } }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/beheer');

  // Get sub menu items from position 2 with authentication and group filtering
  const menuItems =
    menu.getMenuFromPosition(2, user?.isAuthenticated, user?.userGroups || []) || null;

  // Determine if we are at or below the md breakpoint (matches SCSS $screen-md = 1024px)
  const windowWidth = useWindowSize();
  const isMobileLike = typeof windowWidth === 'number' && windowWidth <= 1024;

  // Get admin dashboard menu (position 7) for injecting as dropdown on small screens
  const adminMenu = menu.getAdminDashboardMenu(
    user.isAuthenticated,
    user?.userGroups || []
  );

  // State to store full organization data
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);
  const [hasLoadedOrganisation, setHasLoadedOrganisation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch full organization data to get the correct organization name
  // This runs on mount and whenever the organization ID changes
  useEffect(() => {
    const fetchFullOrganisationData = async () => {
      const activeOrg = user?.activeOrganization;
      if (!activeOrg) {
        setFullActiveOrganisation(null);
        setHasLoadedOrganisation(true);
        return;
      }

      const orgId = activeOrg?.uuid || activeOrg?.id;
      if (!orgId) {
        setFullActiveOrganisation(null);
        setHasLoadedOrganisation(true);
        return;
      }

      try {
        const type = object.getTypeFromParams('voorzieningen', 'organisatie');
        
        // Clear any existing errors
        object.setError(type, null);
        
        // Fetch the organization data
        await object.fetchObject('voorzieningen', 'organisatie', String(orgId), {
          '_extend[]': ['_schema'],
          _fresh: true, // Force bypass cache to get latest data
        });
        
        // Access the object directly from the store after fetch completes
        const fullOrgData = object.objects[type]?.[orgId] || null;
        
        // If data is still null and no error, the request was likely cancelled
        // Retry up to 3 times with a delay
        if (!fullOrgData && !object.errors[type] && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 200);
          return;
        }
        
        setFullActiveOrganisation(fullOrgData);
        setHasLoadedOrganisation(true);
      } catch (error) {
        // The active organisation no longer exists. Nothing is broken; the
        // header simply renders without organisation details.
        if (error?.isNotFound) {
          console.info(
            'Active organisation no longer exists; rendering without it.'
          );
        } else {
          console.error('Failed to fetch organization data:', error);
        }
        setFullActiveOrganisation(null);
        setHasLoadedOrganisation(true);
      }
    };

    if (user.isAuthenticated && !hasLoadedOrganisation) {
      fetchFullOrganisationData();
    }
  }, [user.isAuthenticated, user?.activeOrganization?.uuid, user?.activeOrganization?.id, object, hasLoadedOrganisation, retryCount]);

  // Reset the loaded flag and retry count when organization changes
  useEffect(() => {
    setHasLoadedOrganisation(false);
    setRetryCount(0);
  }, [user?.activeOrganization?.uuid, user?.activeOrganization?.id]);

  // Reset organization state when user logs out
  useEffect(() => {
    if (!user.isAuthenticated) {
      setFullActiveOrganisation(null);
      setHasLoadedOrganisation(false);
      setRetryCount(0);
    }
  }, [user.isAuthenticated]);

  // Get user display name and organization
  const getUserDisplayName = () => {
    if (!user.user) return null;
    const parts = [user.user.firstName, user.user.middleName, user.user.lastName].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' ');
    }
    // Fallback to displayName, then email
    return user.user.displayName || user.user.email || null;
  };

  const getOrganizationName = () => {
    // Prefer the name from the full organization data (correct name from the organization object)
    // Fall back to the name from the user's active organization session data
    const activeOrg = user.activeOrganization;
    return (
      fullActiveOrganisation?.['@self']?.name ||
      fullActiveOrganisation?.naam ||
      activeOrg?.name ||
      activeOrg?.naam ||
      null
    );
  };

  const userDisplayName = getUserDisplayName();
  const organizationName = getOrganizationName();

  // Icon mapping for admin menu items (reused from dynamic sidenav)
  const getIconForMenuItem = (menuItem) => {
    const iconMap = {
      Dashboard: VISUALS.CHART_LINE,
      Producten: VISUALS.CUBES,
      Applicaties: VISUALS.CUBE,
      Diensten: VISUALS.HAND_HOLDING,
      Gebruik: VISUALS.CLOUD,
      Versie: VISUALS.INFO,
      Contracten: VISUALS.HAND_SHAKE,
      Overeenkomsten: VISUALS.HAND_SHAKE,
      Organisaties: VISUALS.BUILDING,
      Kwetsbaarheden: VISUALS.TRIANGLE_EXCLAMATION,
      Koppelingen: VISUALS.LINK,
      Contactpersonen: VISUALS.USERS,
    };

    if (iconMap[menuItem.name]) {
      return iconMap[menuItem.name];
    }

    const linkPath = menuItem.link || '';
    if (linkPath.includes('/applicaties')) return VISUALS.CUBE;
    if (linkPath.includes('/diensten')) return VISUALS.HAND_HOLDING;
    if (linkPath.includes('/gebruik')) return VISUALS.CLOUD;
    if (linkPath.includes('/versie')) return VISUALS.INFO;
    if (linkPath.includes('/contracten') || linkPath.includes('/overeenkomsten'))
      return VISUALS.HAND_SHAKE;
    if (linkPath.includes('/organisaties')) return VISUALS.BUILDING;
    if (linkPath.includes('/kwetsbaarheden')) return VISUALS.TRIANGLE_EXCLAMATION;
    if (linkPath.includes('/contactpersonen')) return VISUALS.USERS;
    if (linkPath.includes('/voorzieningen')) return VISUALS.CUBES;
    if (linkPath.includes('/koppelingen')) return VISUALS.LINK;
    if (linkPath === '/beheer') return VISUALS.CHART_LINE;
    if (linkPath === '/beheer/my-account') return VISUALS.USER;
    if (linkPath === '/beheer/my-organisation') return VISUALS.BUILDING;

    return VISUALS.CHART_LINE;
  };

  // Build items for AcCNavigation, optionally appending the admin menu as a dropdown on mobile
  const secondaryNavItems = [];
  if (menuItems && Array.isArray(menuItems.items) && menuItems.items.length > 0) {
    secondaryNavItems.push(...menuItems.items);
  }

  if (
    isMobileLike &&
    isAdminRoute &&
    adminMenu &&
    Array.isArray(adminMenu.items) &&
    adminMenu.items.length > 0
  ) {
    const TopIcon = VISUALS.CHART_LINE;
    secondaryNavItems.push({
      name: adminMenu.name || 'Beheer',
      icon: TopIcon ? <TopIcon /> : null,
      slug: adminMenu.slug || '/beheer',
      items: adminMenu.items.map((item) => {
        const IconComponent = getIconForMenuItem(item);
        return {
          name: item.name,
          link: item.link,
          slug: item.link,
          icon: IconComponent ? <IconComponent /> : null,
        };
      }),
    });
  }

  return (
    <header className='ac-header'>
      <SkipLink id='skip-link' href='#main'>
        {LABELS.TO_MAIN_CONTENT}
      </SkipLink>
      <div className='ac-header__navigation-main'>
        <div className='ac-header__logo'>
          {isHomePage ? (
            <div>
              <ConLogo variant='header' />
              <span className='sr-only'>Logo</span>
              <h1 className='logo-text'>{getTitle()}</h1>
            </div>
          ) : (
            <>
              <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
                <ConLogo variant='header' />
                <h1 className='logo-text'>{getTitle()}</h1>
              </Link>
            </>
          )}
        </div>
        <div className='ac-header__right-section'>
          {user.isAuthenticated && (userDisplayName || organizationName) && (
            <Link to='/beheer/my-account' className='ac-header__user-info'>
              <VISUALS.USER className='ac-header__user-icon' />
              {userDisplayName && (
                <span className='ac-header__username'>{userDisplayName}</span>
              )}
              {organizationName && !userDisplayName && (
                <span className='ac-header__username'>{organizationName}</span>
              )}
              {organizationName && userDisplayName && (
                <span className='ac-header__organization'>({organizationName})</span>
              )}
            </Link>
          )}
          <AcNavigation />
        </div>
      </div>
      {secondaryNavItems.length > 0 && (
        <div className='ac-header__navigation-secondary'>
          <AcContainer>
            <AcCNavigation items={secondaryNavItems} />
          </AcContainer>
        </div>
      )}
      <div className='ac-header__navigation-breadcrumb'>
        <AcContainer>{!isHomePage && <AcBreadcrumbs />}</AcContainer>
      </div>
    </header>
  );
};

export default withStore(observer(AcHeader));
