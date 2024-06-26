import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgCard } from '@atoms';
import { TilburgLink } from '@molecules';
import { VISUALS } from '@constants';

const TilburgCardCategory = ({ image, title, paragraph, linkUrl, linkTitle }) => {
  return (
    <TilburgCard category image={image}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{paragraph}</Paragraph>
      <TilburgLink to={linkUrl}>
        {linkTitle}
        <VISUALS.ARROW_RIGHT />
      </TilburgLink>
    </TilburgCard>
  );
};

export default TilburgCardCategory;
