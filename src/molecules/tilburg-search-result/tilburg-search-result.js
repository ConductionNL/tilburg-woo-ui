import { TilburgLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { TilburgCard, TilburgFlex } from '@atoms';

import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';

const TilburgSearchResult = ({
  skeleton,
  title,
  content,
  date,
  category,
  themes,
  _id,
}) => {
  return (
    <TilburgCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{content}</Paragraph>
      <TilburgFlex justifyContent='between' className='meta'>
        <TilburgFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && (
            <>
              <StatusBadge>{themes[0]?.hoofdthema}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}
          <Paragraph small>{date}</Paragraph>
          <VISUALS.ELLIPSE />
          <Paragraph small>{category}</Paragraph>
        </TilburgFlex>
        <TilburgLink to={`/publicatie/${_id}`}>
          <span class='sr-only'>
            {LABELS.READ_MORE_ABOUT} {title}
          </span>
          <VISUALS.ARROW_RIGHT />
        </TilburgLink>
      </TilburgFlex>
    </TilburgCard>
  );
};

export default TilburgSearchResult;
