import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import { AcSection, AcContainer, AcCard } from '@atoms';
import { AcLink } from '@molecules';
import { VISUALS } from '@constants';
import AcGrid from '@atoms/ac-grid/ac-grid';

const ICON_MAP = {
  search: VISUALS.SEARCH,
  cubes: VISUALS.CUBES,
  cube: VISUALS.CUBE,
  users: VISUALS.USERS,
  building: VISUALS.BUILDING,
  document: VISUALS.DOCUMENT,
  gear: VISUALS.GEAR,
  link: VISUALS.LINK,
  world: VISUALS.WORLD,
  truck: VISUALS.TRUCK,
  scroll: VISUALS.SCROLL,
  themes: VISUALS.THEMES,
  house: VISUALS.HOUSE,
};

const AcContentBlocks = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <AcSection className='ac-content-blocks' spacing>
      <AcContainer>
        <AcGrid columns={3}>
          {blocks.map((block, index) => {
            const IconComponent = block.icon && ICON_MAP[block.icon];

            return (
              <AcCard key={index} category spaceBetween padding='md'>
                <div className='ac-content-blocks__header'>
                  {IconComponent && <IconComponent />}
                  <Heading level={3}>{block.title}</Heading>
                </div>
                <Paragraph>{block.text}</Paragraph>
                {block.linkUrl && (
                  <AcLink to={block.linkUrl}>
                    {block.linkTitle || 'Meer informatie'}
                    <VISUALS.ARROW_RIGHT />
                  </AcLink>
                )}
              </AcCard>
            );
          })}
        </AcGrid>
      </AcContainer>
    </AcSection>
  );
};

export default AcContentBlocks;
