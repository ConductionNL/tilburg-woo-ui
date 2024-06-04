import loadable from '@loadable/component'
import { Heading } from '@utrecht/component-library-react/dist/css-module'
import { Paragraph, StatusBadge } from '@utrecht/component-library-react'
import { VISUALS } from '@constants'
import clsx from 'clsx';
import TilburgFlex from '@atoms/tilburg-flex/tilburg-flex';

const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'))

const TilburgSearchResult = () => {
    return (
        <TilburgCard padding="md">
            <Heading level={3}>Collegenota Vlaggen Dwaalgebied</Heading>
            <Paragraph>
                Besluit over vergunninen en gebruik van vlakken in het Dwaarlgebied.
            </Paragraph>

            <TilburgFlex justifyContent="between">
                <TilburgFlex alignItems="center">
                    <StatusBadge>Wonen</StatusBadge>
                    <Paragraph small>12 maart 2024</Paragraph>
                    <Paragraph small>Raadstuk</Paragraph>
                </TilburgFlex>

                <VISUALS.ARROW_RIGHT />
            </TilburgFlex>
        </TilburgCard>
    )
}

export default TilburgSearchResult;
