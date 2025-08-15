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

const AcHeader = ({ store: { menu } }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const { all_menu_items } = menu;

  // Get sub menu items from position 2
  const menuItems = menu.getMenuFromPosition(2) || null;
  
  // Debug logging to help understand menu structure
  if (process.env.NODE_ENV === 'development') {
    console.log('AcHeader - all_menu_items:', all_menu_items);
    console.log('AcHeader - menuItems (position 2):', menuItems);
    console.log('AcHeader - menuItems.items:', menuItems?.items);
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
        <AcNavigation />
      </div>
      {menuItems && menuItems.items && Array.isArray(menuItems.items) && menuItems.items.length > 0 && (
        <div className='ac-header__navigation-secondary'>
          <AcContainer>
            <AcCNavigation items={menuItems.items} />
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
