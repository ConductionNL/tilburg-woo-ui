import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCard } from '@atoms';
import { AcLink } from '@molecules';
import { VISUALS } from '@constants';

const AcCardCategory = ({ image, title, paragraph, linkUrl, linkTitle }) => {
  return (
    <AcCard category image={image}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{paragraph}</Paragraph>
      <AcLink to={linkUrl}>
        {linkTitle}
        <VISUALS.ARROW_RIGHT />
      </AcLink>
    </AcCard>
  );
};

export default AcCardCategory;
