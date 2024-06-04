import loadable from '@loadable/component';
import {VISUALS} from "@constants";
import {Heading, Paragraph} from "@utrecht/component-library-react/dist/css-module";

const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));
const TilburgSection = loadable(() => import('@atoms/tilburg-section/tilburg-section'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));

const TilburgAbout = () => {
    return (
        <TilburgSection className="tilburg-about" spacing>
            <TilburgContainer>
                <div className="tilburg-about__heading">
                    <Heading level={2}>Over Open Tilburg</Heading>
                    <Paragraph>
                        Bij gemeente Tilburg willen we transparant zijn. Alles wat we bespreken willen we openbaar en
                        inzichtelijk maken voor iedereen. Op deze website kun je alle openbare documentatie en
                        publicaties terugvinden.
                        <ul className="tilburg-usps">
                            <li>Alles op één centrale plek</li>
                            <li>Zoek in 23.420 publicaties</li>
                            <li>Direct documenten downloaden</li>
                        </ul>
                    </Paragraph>
                    <TilburgLink to="/over-ons">
                        Meer over deze website
                    </TilburgLink>
                </div>
                <div className="tilburg-about__img">
                    <img src="about-tilburg-placeholder.png" alt=""/>
                </div>
            </TilburgContainer>
        </TilburgSection>
    )
}

export default TilburgAbout;
