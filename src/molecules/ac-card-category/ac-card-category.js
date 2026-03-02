import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCard, AcFlex } from '@atoms';
import { AcLink } from '@molecules';
import { VISUALS } from '@constants';

const ICON_MAP = {
  raadsstuk: VISUALS.USERS,
  bestuursstuk: VISUALS.DOCUMENT,
  organisatie: VISUALS.BUILDING,
  'woo-verzoek': VISUALS.ENVELOPE,
  convenant: VISUALS.HAND_SHAKE,
  bereikbaarheidsgegevens: VISUALS.PHONE,
  document: VISUALS.DOCUMENT,
  search: VISUALS.SEARCH,
  contact: VISUALS.CONTACT,
  themes: VISUALS.THEMES,
  house: VISUALS.HOUSE,
  world: VISUALS.WORLD,
  cube: VISUALS.CUBE,
  cubes: VISUALS.CUBES,
  truck: VISUALS.TRUCK,
  link: VISUALS.LINK,
  scroll: VISUALS.SCROLL,
  gear: VISUALS.GEAR,
};

const AcCardCategory = ({ icon, title, summary, linkUrl, linkTitle, isExternal }) => {
  const IconComponent = icon && ICON_MAP[icon];

  return (
    <AcCard category spaceBetween padding="md">
      <AcFlex spacing="sm" alignItems="center">
        {IconComponent && <IconComponent />}
        <Heading level={3}>{title}</Heading>
      </AcFlex>
      <Paragraph>{summary}</Paragraph>
      {linkUrl && isExternal ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="ac-link">
          {linkTitle}
          <VISUALS.EXTERNAL_LINK />
        </a>
      ) : linkUrl ? (
        <AcLink to={linkUrl}>
          {linkTitle}
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      ) : null}
    </AcCard>
  );
};

export default AcCardCategory;
