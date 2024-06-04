import clsx from 'clsx'
import { VISUALS } from '@constants'
import loadable from '@loadable/component'

const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));
const TilburgSearchbox = loadable(() => import('@components/tilburg-searchbox/tilburg-searchbox'));

const TilburgHero = () => {

    const _CLASSES = clsx('tilburg-hero')
    return (
        <section className={_CLASSES} style="background-image: url('/home-hero-background.png');">
            <TilburgContainer>
                <TilburgCard blue padding="lg">
                    <TilburgSearchbox home label="Waar ben je naar op zoek?" />
                    <TilburgLink href="/test">
                        Uitgebreid zoeken
                        <VISUALS.ARROW_RIGHT />
                    </TilburgLink>
                </TilburgCard>
            </TilburgContainer>
        </section>
    )
}

export default TilburgHero;
