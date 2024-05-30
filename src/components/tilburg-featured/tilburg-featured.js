import {Heading, Paragraph} from "@utrecht/component-library-react/dist/css-module";
import loadable from "@loadable/component";

const TilburgSection = loadable(() => import('@atoms/tilburg-section/tilburg-section'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgSearchResult = loadable(() => import('@molecules/tilburg-search-result/tilburg-search-result'));

const TilburgFeatured = () => {
    return (
        <TilburgSection className="tilburg-featured" spacing={true}>
            <TilburgContainer>
                <div class="tilburg-featured__heading">
                    <Heading>Uitgelicht</Heading>
                </div>
                <div class="tilburg-featured__content">
                    <TilburgSearchResult />
                    <TilburgSearchResult />
                    <TilburgSearchResult />
                </div>
            </TilburgContainer>
        </TilburgSection>
    );
}

export default TilburgFeatured;
