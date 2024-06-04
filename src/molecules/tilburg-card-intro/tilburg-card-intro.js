import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { Button, Paragraph } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { TilburgCard } from '@atoms';

const TilburgCardIntro = ({ title, description, image }) => {
  return (
    <TilburgCard blue>
      <Heading>Samenvatting</Heading>
      <Paragraph lead>
        Woo-verzoek: alle relevante documenten, informatie en correspondentie
        betreffende het overleg tussen de gemeente en Somerset Capital Partners B.V.
        / Somerset Real Estate B.V. / Intospace vanaf 1 januari 2016 tot nu.
      </Paragraph>

      <Button>
        <VISUALS.LIST_BLUE />
        Begrippenlijst
      </Button>
    </TilburgCard>
  );
};

export default TilburgCardIntro;
