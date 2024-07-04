import { TilburgLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { TilburgCard, TilburgFlex } from '@atoms';

import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';

const TilburgSearchResult = ({
  skeleton,
  title,
  content,
  publicationDate,
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
              <StatusBadge>{themes[0]?.title}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}
          <Paragraph small>
            {acFormatDate(publicationDate, 'YYYY-MM-DD', 'DD MMMM YYYY')}
          </Paragraph>
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
