import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { TilburgSection, TilburgContainer } from '@atoms';
import { TilburgSearchResult } from '@molecules';

const TilburgFeatured = () => {
  return (
    <TilburgSection className='tilburg-featured' spacing>
      <TilburgContainer>
        <div class='tilburg-featured__heading'>
          <Heading>Uitgelicht</Heading>
        </div>
        <div class='tilburg-featured__content'>
          <TilburgSearchResult />
          <TilburgSearchResult />
          <TilburgSearchResult />
        </div>
      </TilburgContainer>
    </TilburgSection>
  );
};

export default TilburgFeatured;
