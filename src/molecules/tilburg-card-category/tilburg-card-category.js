import loadable from '@loadable/component'

import { Heading, Paragraph } from '@utrecht/component-library-react/dist/css-module'

const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));
const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));

const image = '/card-placeholder.png'

const TilburgCardCategory = ({title, children, linkUrl, linkTitle}) => {

    return (
        <TilburgCard image={image}>
            <Heading level={3}>Campus Wijkevoort</Heading>
            <Paragraph>
                Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.
            </Paragraph>
            <TilburgLink label="Bekijk alle documenten" href="/" />
        </TilburgCard>
    )
}

export default TilburgCardCategory
