import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgCard } from '@atoms';
import { TilburgLink } from '@molecules';

const image = '/card-placeholder.png';

const TilburgCardCategory = ({ title, children, linkUrl, linkTitle }) => {
  return (
    <TilburgCard image={image}>
      <Heading level={3}>Campus Wijkevoort</Heading>
      <Paragraph>
        Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen
        innoveren en medewerkers opleiden.
      </Paragraph>
      <TilburgLink label='Bekijk alle documenten' href='/' />
    </TilburgCard>
  );
};

export default TilburgCardCategory;
