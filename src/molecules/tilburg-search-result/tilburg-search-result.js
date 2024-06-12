import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { TilburgCard, TilburgFlex } from '@atoms';
import { TilburgLink } from '@molecules';

const TilburgSearchResult = ({ skeleton }) => {
  return (
    <TilburgCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>Collegenota Vlaggen Dwaalgebied</Heading>
      <Paragraph>
        Besluit over vergunninen en gebruik van vlakken in het Dwaarlgebied.
      </Paragraph>
      <TilburgFlex justifyContent='between' className='meta'>
        <TilburgFlex alignItems='center' spacing='sm'>
          <StatusBadge>Wonen</StatusBadge>
          <VISUALS.ELLIPSE />
          <Paragraph small>12 maart 2024</Paragraph>
          <VISUALS.ELLIPSE />
          <Paragraph small>Raadstuk</Paragraph>
        </TilburgFlex>
        <TilburgLink to='/'>
          <span class='sr-only'>Lees meer over Collegenota Vlaggen Dwaalgebied</span>
          <VISUALS.ARROW_RIGHT />
        </TilburgLink>
      </TilburgFlex>
    </TilburgCard>
  );
};

export default TilburgSearchResult;
