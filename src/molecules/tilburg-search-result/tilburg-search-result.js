import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { TilburgCard, TilburgFlex } from '@atoms';

const TilburgSearchResult = () => {
  return (
    <TilburgCard padding='md'>
      <Heading level={3}>Collegenota Vlaggen Dwaalgebied</Heading>
      <Paragraph>
        Besluit over vergunninen en gebruik van vlakken in het Dwaarlgebied.
      </Paragraph>

      <TilburgFlex justifyContent='between'>
        <TilburgFlex alignItems='center'>
          <StatusBadge>Wonen</StatusBadge>
          <Paragraph small>12 maart 2024</Paragraph>
          <Paragraph small>Raadstuk</Paragraph>
        </TilburgFlex>

        <VISUALS.ARROW_RIGHT />
      </TilburgFlex>
    </TilburgCard>
  );
};

export default TilburgSearchResult;
