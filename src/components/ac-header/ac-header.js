import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { AcNavigation } from '@components';
import { AcBreadcrumbs } from '@molecules';
import { AcContainer, ConLogo } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcCNavigation } from '@components';
import { getTitle } from '@services/con-get-title';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
}

const AcHeader = ({ store: { menu, user } }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const { all_menu_items } = menu;

  // Debug user data structure
  if (user.isAuthenticated && user.currentUser) {
    console.log('Header - Current user data:', user.currentUser);
  }

  const getMenuPosition = () => {
    // Use container config if available
    if (containerConfig && containerConfig.getMenuPosition) {
      return containerConfig.getMenuPosition();
    }

    // Fallback to hostname-based logic for production builds
    const hostname = window.location.hostname;
    return hostname === 'horstadmaas.accept.opencatalogi.nl' ? 1 : 2;
  };
  
  const menuItems = all_menu_items.find((item) => item.position === getMenuPosition());

  const handleLogout = async () => {
    await user.logout();
    window.location.href = '/'; // Full page reload to ensure clean state
  };

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
              <span class='logo-text'>{getTitle()}</span>
            </div>
          ) : (
            <>
              <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
                <ConLogo variant='header' />
                <span class='logo-text'>{getTitle()}</span>
              </Link>
            </>
          )}
        </div>
        <div className='ac-header__navigation-wrapper'>
          <AcNavigation />
        </div>
        <div className='ac-header__user-section'>
          {user.isAuthenticated && (
            <div className='ac-header__user-info'>
              <span className='ac-header__username'>
                {user.currentUser?.displayName || 
                 user.currentUser?.firstName || 
                 user.currentUser?.username || 
                 user.currentUser?.uid || 
                 (user.currentUser ? 'Gebruiker' : 'Laden...')}
              </span>
              <button 
                className='ac-header__logout-btn' 
                onClick={handleLogout}
                disabled={user.loading.status}
              >
                {user.loading.status ? 'Uitloggen...' : 'Uitloggen'}
              </button>
            </div>
          )}
          {!user.isAuthenticated && (
            <div className='ac-header__user-info'>
              <a href='/login' className='ac-header__login-btn'>
                Inloggen
              </a>
            </div>
          )}
        </div>
      </div>
      {menuItems && menuItems.items.length > 0 && (
        <div className='ac-header__navigation-secondary'>
          <AcCNavigation items={menuItems.items} />
        </div>
      )}
      <div className='ac-header__navigation-breadcrumb'>
        <AcContainer>{!isHomePage && <AcBreadcrumbs />}</AcContainer>
      </div>
    </header>
  );
};

export default withStore(observer(AcHeader));
