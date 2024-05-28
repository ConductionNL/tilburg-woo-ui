import clsx from 'clsx'

import HeroImage from  '../../assets/images/placeholder.jpeg'
import { Link } from '@utrecht/component-library-react/dist/css-module'
import { VISUALS } from '@constants'
import loadable from '@loadable/component'

const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));
const TilburgSearchbox = loadable(() => import('@components/tilburg-searchbox/tilburg-searchbox'));

const TilburgHero = () => {

    const _CLASSES = clsx('tilburg-hero')
    return (
        <section className={_CLASSES}>
            <TilburgContainer>
                <TilburgCard blue padding="lg">
                    <TilburgSearchbox home label="Waar ben je naar op zoek?" />
                    <Link href="/test">
                        Uitgebreid zoeken
                        <VISUALS.ARROW_RIGHT />
                    </Link>
                </TilburgCard>
            </TilburgContainer>
        </section>
    )
}

export default TilburgHero;
