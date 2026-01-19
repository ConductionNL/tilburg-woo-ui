import { useLocation, Link } from 'react-router-dom';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { AcNavigation, AcCNavigation } from '@components';
import { AcBreadcrumbs } from '@molecules';
import { AcContainer, ConLogo } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { getTitle } from '@services/con-get-title';
import { useWindowSize } from '@hooks';

const AcHeader = ({ store: { menu, user } }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/beheer');

  // Get sub menu items from position 2 with authentication and group filtering
  const menuItems =
    menu.getMenuFromPosition(2, user.isAuthenticated, user.userGroups || []) || null;

  // Determine if we are at or below the md breakpoint (matches SCSS $screen-md = 1024px)
  const windowWidth = useWindowSize();
  const isMobileLike = typeof windowWidth === 'number' && windowWidth <= 1024;

  // Get admin dashboard menu (position 7) for injecting as dropdown on small screens
  const adminMenu = menu.getAdminDashboardMenu(
    user.isAuthenticated,
    user.userGroups || []
  );

  // Get user display name and organization
  const getUserDisplayName = () => {
    if (!user.user) return null;
    const parts = [user.user.firstName, user.user.middleName, user.user.lastName].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' ');
    }
    // Fallback to email if no name parts are available
    return user.user.email || null;
  };

  const getOrganizationName = () => {
    return user.user?.organisations?.active?.naam || null;
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
              <span className='logo-text'>{getTitle()}</span>
            </div>
          ) : (
            <>
              <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
                <ConLogo variant='header' />
                <span className='logo-text'>{getTitle()}</span>
              </Link>
            </>
          )}
        </div>
        <div className='ac-header__right-section'>
          {user.isAuthenticated && (userDisplayName || organizationName) && (
            <div className='ac-header__user-info'>
              {userDisplayName && (
                <span className='ac-header__username'>{userDisplayName}</span>
              )}
              {organizationName && !userDisplayName && (
                <span className='ac-header__username'>{organizationName}</span>
              )}
              {organizationName && userDisplayName && (
                <span className='ac-header__organization'>({organizationName})</span>
              )}
            </div>
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
