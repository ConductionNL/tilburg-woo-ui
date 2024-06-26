import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { TilburgNavigation } from '@components';
import { TilburgBreadcrumbs } from '@molecules';
import { TilburgContainer } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

const TilburgHeader = ({ store }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className='tilburg-header'>
      <SkipLink id='skip-link' href='#main'>
        {LABELS.TO_MAIN_CONTENT}
      </SkipLink>
      <div className='tilburg-header__navigation-main'>
        <div className='tilburg-header__logo'>
          {isHomePage ? (
            <div>
              <VISUALS.LOGO />
              <span className='sr-only'>Logo</span>
              {LABELS.APP_NAME}
            </div>
          ) : (
            <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
              <VISUALS.LOGO />
              {LABELS.APP_NAME}
            </Link>
          )}
        </div>
        <TilburgNavigation />
      </div>
      <div className='tilburg-header__navigation-secondary'>
        <TilburgContainer>{!isHomePage && <TilburgBreadcrumbs />}</TilburgContainer>
      </div>
    </header>
  );
};

export default withStore(observer(TilburgHeader));
