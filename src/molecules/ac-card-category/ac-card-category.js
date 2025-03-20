import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCard, AcFlex } from '@atoms';
import { AcLink } from '@molecules';
import { VISUALS } from '@constants';

const AcCardCategory = ({
  image,
  icon,
  title,
  summary,
  linkUrl,
  linkTitle,
  isExternal = false,
}) => {
  return (
    <AcCard category spaceBetween image={image} padding='md'>
      <AcFlex spacing='sm'>
        {icon}
        <Heading level={3}>{title}</Heading>
      </AcFlex>
      <Paragraph>{summary}</Paragraph>
      {isExternal ? (
        <AcLink to={linkUrl} external>
          {linkTitle}
          <VISUALS.EXTERNAL_LINK_PINK />
        </AcLink>
      ) : (
        <AcLink to={linkUrl}>
          {linkTitle}
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      )}
    </AcCard>
  );
};

export default AcCardCategory;
