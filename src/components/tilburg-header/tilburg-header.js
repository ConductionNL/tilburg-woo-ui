import {
    BreadcrumbNav,
    BreadcrumbNavLink,
    BreadcrumbNavSeparator
} from '@utrecht/component-library-react/dist/css-module';

import ReadspeakerPlaceholder from '../../assets/images/readspeaker-placeholder.png';

const TilburgNavigation = loadable(() => import('@components/tilburg-navigation/tilburg-navigation'));

// import { TilburgNavigation } from '@components/tilburg-navigation/tilburg-navigation'
import { VISUALS } from '@constants'
import loadable from '@loadable/component'

const TilburgHeader = () => {
    return (
        <header className="tilburg-header">
            <div className="tilburg-header__navigation-main">
                <div className="tilburg-header__logo">
                    <a href="/">
                        <VISUALS.LOGO />
                        Open Tilburg
                    </a>
                </div>
                <TilburgNavigation />
            </div>
            <div className="tilburg-header__navigation-secondary">
                <div className="container">
                    <BreadcrumbNav>
                        <BreadcrumbNavLink href="/" rel="home" index={0}>
                            Home
                        </BreadcrumbNavLink>
                        <BreadcrumbNavSeparator>
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="1em" width="1em">
                                <path
                                    fillRule="evenodd"
                                    d="M20.607 16 10 5.393l1.414-1.414L23.435 16l-12.02 12.02L10 26.608z"
                                    clipRule="evenodd"
                                ></path>
                            </svg>
                        </BreadcrumbNavSeparator>
                        <BreadcrumbNavLink href="/a/" index={1}>
                            Uitgebreid zoeken
                        </BreadcrumbNavLink>
                        <BreadcrumbNavSeparator>
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="1em" width="1em">
                                <path
                                    fillRule="evenodd"
                                    d="M20.607 16 10 5.393l1.414-1.414L23.435 16l-12.02 12.02L10 26.608z"
                                    clipRule="evenodd"
                                ></path>
                            </svg>
                        </BreadcrumbNavSeparator>
                        <BreadcrumbNavLink disabled current>
                            Label
                        </BreadcrumbNavLink>
                    </BreadcrumbNav>
                    <img src={ReadspeakerPlaceholder} alt=""/>
                </div>
            </div>
        </header>
    );
}

export default TilburgHeader
