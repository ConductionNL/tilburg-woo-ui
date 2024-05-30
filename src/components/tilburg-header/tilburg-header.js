import React from 'react';
import {useLocation} from 'react-router-dom';
import loadable from '@loadable/component';
import {VISUALS} from '@constants';
import {
    BreadcrumbNav,
    BreadcrumbNavLink,
    BreadcrumbNavSeparator,
    SkipLink
} from '@utrecht/component-library-react/dist/css-module';

const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgNavigation = loadable(() => import('@components/tilburg-navigation/tilburg-navigation'));

const TilburgHeader = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <header className="tilburg-header">
            <SkipLink href="#main">
                Direct naar de inhoud
            </SkipLink>
            <div className="tilburg-header__navigation-main">
                <div className="tilburg-header__logo">
                    {isHomePage ? (
                        <div>
                            <VISUALS.LOGO/>
                            <span className="sr-only">Logo</span>
                            Open Tilburg
                        </div>
                    ) : (
                        <a href="/" title="Logo Tilburg - Ga naar de beginpagina">
                            <VISUALS.LOGO/>
                            Open Tilburg
                        </a>
                    )}
                </div>
                <TilburgNavigation/>
            </div>
            <div className="tilburg-header__navigation-secondary">
                <TilburgContainer>
                    {!isHomePage && (
                        <BreadcrumbNav>
                            <BreadcrumbNavLink href="/" rel="home" index={0}>
                                Home
                            </BreadcrumbNavLink>
                            <BreadcrumbNavSeparator>
                                <VISUALS.CHEVRON_RIGHT/>
                            </BreadcrumbNavSeparator>
                            <BreadcrumbNavLink href="/a/" index={1}>
                                Uitgebreid zoeken
                            </BreadcrumbNavLink>
                            <BreadcrumbNavSeparator>
                                <VISUALS.CHEVRON_RIGHT/>
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
}

export default TilburgHeader;