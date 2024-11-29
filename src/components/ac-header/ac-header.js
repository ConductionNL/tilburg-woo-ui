import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { AcNavigation } from '@components';
import { AcBreadcrumbs } from '@molecules';
import { AcContainer, AcLogo } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

const AcHeader = ({ store }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const hostname = window.location.hostname;

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
              {hostname === 'vng.opencatalogi.nl' ? (
                <span class='logo-text'>Softwarecatalogus</span>
              ) : (
                <span class='logo-text'>Open Tilburg</span>
              )}
            </div>
          ) : (
            <>
              <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
                <AcLogo variant='header' />
                {hostname === 'vng.opencatalogi.nl' ? (
                  <span class='logo-text'>Softwarecatalogus</span>
                ) : (
                  <span class='logo-text'>Open Tilburg</span>
                )}
              </Link>
            </>
          )}
        </div>
        <AcNavigation />
      </div>
      <div className='ac-header__navigation-secondary'>
        <AcContainer>{!isHomePage && <AcBreadcrumbs />}</AcContainer>
      </div>
    </header>
  );
};

export default withStore(observer(AcHeader));
