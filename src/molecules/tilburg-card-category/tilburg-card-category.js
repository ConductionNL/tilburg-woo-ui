import { Heading, Paragraph } from '@utrecht/component-library-react/dist/css-module'
import loadable from '@loadable/component'
const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));
const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));

const image = 'https://www.nintendo.com/eu/media/images/10_share_images/portals_3/2x1_SuperMarioHub_image1600w.jpg'

const TilburgCardCategory = () => {

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
