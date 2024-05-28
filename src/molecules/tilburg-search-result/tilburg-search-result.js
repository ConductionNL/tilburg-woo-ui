import loadable from '@loadable/component'
import { Heading } from '@utrecht/component-library-react/dist/css-module'
import { Paragraph, StatusBadge } from '@utrecht/component-library-react'
import { VISUALS } from '@constants'

const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'))

const TilburgSearchResult = () => {
    return (
        <TilburgCard>
            <Heading level={3}>Collegenota Vlaggen Dwaalgebied</Heading>
            <Paragraph>
                Besluit over vergunninen en gebruik van vlakken in het Dwaarlgebied.
            </Paragraph>
            <StatusBadge>Wonen</StatusBadge>
            <Paragraph small>12 maart 2024</Paragraph>
            <Paragraph small>Raadstuk</Paragraph>
            <VISUALS.ARROW_RIGHT />
        </TilburgCard>
    )
}

export default TilburgSearchResult;
