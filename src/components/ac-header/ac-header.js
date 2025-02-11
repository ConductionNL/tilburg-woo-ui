import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { AcNavigation } from '@components';
import { AcBreadcrumbs } from '@molecules';
import { AcContainer, AcLogo } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcCNavigation } from '@components';

const AcHeader = ({ store: { menu } }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const { all_menu_items } = menu;

  const menuItems = all_menu_items.find((item) => item.position === 2);

  const getTitle = () => {
    const hostname = window.location.hostname;

    switch (hostname) {
      case 'vng.opencatalogi.nl':
        return 'Softwarecatalogus';
      case 'open-tilburg.accept.commonground.nu':
        return 'Open Tilburg';
      case 'open-dimpact.accept.commonground.nu':
        return 'Producten catalogus';
      case 'open-rotterdam.accept.commonground.nu':
        return 'Open Rotterdam';
      case 'open-migrato.accept.commonground.nu':
        return 'Open Migrato';
      case 'opencatalogi.nl':
        return 'OpenCatalogi';
      case 'localhost':
        return 'Localhost catalogus';
      default:
        return 'Open Tilburg';
    }
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
              <AcLogo variant='header' />
              <span className='sr-only'>Logo</span>
              <span class='logo-text'>{getTitle()}</span>
            </div>
          ) : (
            <>
              <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
                <AcLogo variant='header' />
                <span class='logo-text'>{getTitle()}</span>
              </Link>
            </>
          )}
        </div>
        <AcNavigation />
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
