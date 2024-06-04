import loadable from "@loadable/component";
import {Heading, Paragraph} from "@utrecht/component-library-react/dist/css-module";
import {VISUALS} from "@constants";

const TilburgSection = loadable(() => import('@atoms/tilburg-section/tilburg-section'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgCardCategory = loadable(() => import('@molecules/tilburg-card-category/tilburg-card-category'));
const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));

const TilburgSubjects = () => {
    return (
        <TilburgSection className="tilburg-subjects" spacing>
            <TilburgContainer>
                <div class="tilburg-subjects__heading">
                    <Heading>Zoeken op onderwerp</Heading>
                    <Paragraph>
                        Bekijk alle documenten van belangrijke onderwerpen die spelen binnen de gemeente Tilburg.
                    </Paragraph>
                </div>
                <div class="tilburg-subjects__content">
                    <TilburgCardCategory/>
                    <TilburgCardCategory/>
                    <TilburgCardCategory/>
                </div>
                <div class="tilburg-subjects__more">
                    <TilburgLink type="button">
                        <VISUALS.LIST/>
                        Toon alle onderwerpen
                    </TilburgLink>
                </div>
            </TilburgContainer>
        </TilburgSection>
    );
}

export default TilburgSubjects;
