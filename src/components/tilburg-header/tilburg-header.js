import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { VISUALS } from '@constants';
import {
  BreadcrumbNav,
  BreadcrumbNavLink,
  BreadcrumbNavSeparator,
  SkipLink,
} from '@utrecht/component-library-react/dist/css-module';

import { TilburgNavigation } from '@components';
import { TilburgContainer } from '@atoms';

const TilburgHeader = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className='tilburg-header'>
      <SkipLink href='#main'>Direct naar de inhoud</SkipLink>
      <div className='tilburg-header__navigation-main'>
        <div className='tilburg-header__logo'>
          {isHomePage ? (
            <div>
              <VISUALS.LOGO />
              <span className='sr-only'>Logo</span>
              Open Tilburg
            </div>
          ) : (
            <Link to='/' title='Logo Tilburg - Ga naar de beginpagina'>
              <VISUALS.LOGO />
              Open Tilburg
            </Link>
          )}
        </div>
        <TilburgNavigation />
      </div>
      <div className='tilburg-header__navigation-secondary'>
        <TilburgContainer>
          {!isHomePage && (
            <BreadcrumbNav>
              <BreadcrumbNavLink href='/' rel='home' index={0}>
                Home
              </BreadcrumbNavLink>
              <BreadcrumbNavSeparator>
                <VISUALS.CHEVRON_RIGHT />
              </BreadcrumbNavSeparator>
              <BreadcrumbNavLink href='/a/' index={1}>
                Uitgebreid zoeken
              </BreadcrumbNavLink>
              <BreadcrumbNavSeparator>
                <VISUALS.CHEVRON_RIGHT />
              </BreadcrumbNavSeparator>
              <BreadcrumbNavLink disabled current>
                Label
              </BreadcrumbNavLink>
            </BreadcrumbNav>
          )}
        </TilburgContainer>
      </div>
    </header>
  );
};

export default TilburgHeader;
