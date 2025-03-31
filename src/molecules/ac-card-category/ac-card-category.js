import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCard, AcFlex } from '@atoms';
import { AcLink } from '@molecules';
import { VISUALS } from '@constants';

// Map Dutch icon names to their English VISUALS constant names
const ICON_MAPPING = {
  bereikbaarheidsgegevens: 'REACHABILITY',
  bestuursstuk: 'GOVERNANCE_DOCUMENT',
  organisatie: 'ORGANIZATION',
  raadsstuk: 'COUNCIL_DOCUMENT',
  'woo-verzoek': 'WOO_REQUEST',
  convenant: 'CONVENANT',
};

const AcCardCategory = ({
  image,
  icon,
  title,
  summary,
  linkUrl,
  linkTitle,
  isExternal = false,
}) => {
  // Convert icon names to their corresponding VISUALS constant
  const getIconComponent = (iconName) => {
    if (!iconName) return null;

    // Check if we have a mapping for this icon name
    const mappedName =
      ICON_MAPPING[iconName] || iconName.toUpperCase().replace(/-|\s/g, '_');
    const IconComponent = VISUALS[mappedName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <AcCard category spaceBetween image={image} padding='md'>
      <AcFlex spacing='sm'>
        {getIconComponent(icon)}
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
