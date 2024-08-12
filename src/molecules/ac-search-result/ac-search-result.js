import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';

import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';

const AcSearchResult = ({
  skeleton,
  title,
  description,
  published,
  category,
  themes,
  _id,
}) => {
  return (
    <AcCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{description}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && false && (
            <>
              <StatusBadge>{themes[0]?.title}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}
          <Paragraph small>
            {acFormatDate(published, 'YYYY-MM-DD', 'DD MMMM YYYY')}
          </Paragraph>
          <VISUALS.ELLIPSE />
          <Paragraph small>{category}</Paragraph>
        </AcFlex>
        <AcLink to={`/publicatie/${_id}`}>
          <span class='sr-only'>
            {LABELS.READ_MORE_ABOUT} {title}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default AcSearchResult;
