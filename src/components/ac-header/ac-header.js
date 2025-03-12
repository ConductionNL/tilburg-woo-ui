import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { LABELS, VISUALS } from '@constants';
import { SkipLink } from '@utrecht/component-library-react/dist/css-module';

import { AcNavigation } from '@components';
import { AcBreadcrumbs } from '@molecules';
import { AcContainer } from '@atoms';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

const AcHeader = ({ store }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className='ac-header'>
      <SkipLink id='skip-link' href='#main'>
        {LABELS.TO_MAIN_CONTENT}
      </SkipLink>
      <div className='ac-header__navigation-main'>
        <div className='ac-header__logo'>
          {isHomePage ? (
            <div className='logo-container'>
              <VISUALS.LOGO />
              <span className='sr-only'>Logo</span>
              <span className='logo-text'>{LABELS.APP_NAME}</span>
            </div>
          ) : (
            <Link
              to='/'
              title='Logo Gemeente - Ga naar de beginpagina'
              className='logo-container'
            >
              <VISUALS.LOGO />
              <span className='logo-text'>{LABELS.APP_NAME}</span>
            </Link>
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
