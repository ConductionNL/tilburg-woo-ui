import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgCard } from '@atoms';
import { TilburgLink } from '@molecules';
import { VISUALS } from '@constants';

const image = '/card-placeholder.png';

const TilburgCardCategory = ({ title, children, linkUrl, linkTitle }) => {
  return (
    <TilburgCard category image={image}>
      <Heading level={3}>Campus Wijkevoort</Heading>
      <Paragraph>
        Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen
        innoveren en medewerkers opleiden.
      </Paragraph>
      <TilburgLink to='/'>
        Bekijk de 209 documenten
        <VISUALS.ARROW_RIGHT />
      </TilburgLink>
    </TilburgCard>
  );
};

export default TilburgCardCategory;
