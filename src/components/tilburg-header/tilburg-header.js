import loadable from '@loadable/component'
import { VISUALS } from '@constants'
import {
    BreadcrumbNav,
    BreadcrumbNavLink,
    BreadcrumbNavSeparator,
    SkipLink
} from '@utrecht/component-library-react/dist/css-module';

import ReadspeakerPlaceholder from '../../assets/images/readspeaker-placeholder.png';

const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgNavigation = loadable(() => import('@components/tilburg-navigation/tilburg-navigation'));

const TilburgHeader = () => {
    return (
        <header className="tilburg-header">
            <SkipLink href="#main">
                Skip to main content
            </SkipLink>
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
                <TilburgContainer>
                    <BreadcrumbNav>
                        <BreadcrumbNavLink href="/" rel="home" index={0}>
                            Home
                        </BreadcrumbNavLink>
                        <BreadcrumbNavSeparator>
                            <VISUALS.CHEVRON_RIGHT />
                        </BreadcrumbNavSeparator>
                        <BreadcrumbNavLink href="/a/" index={1}>
                            Uitgebreid zoeken
                        </BreadcrumbNavLink>
                        <BreadcrumbNavSeparator>
                            <VISUALS.CHEVRON_RIGHT />
                        </BreadcrumbNavSeparator>
                        <BreadcrumbNavLink disabled current>
                            Label
                        </BreadcrumbNavLink>
                    </BreadcrumbNav>
                    <img src={ReadspeakerPlaceholder} alt=""/>
                </TilburgContainer>
            </div>
        </header>
    );
}

export default TilburgHeader
