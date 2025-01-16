import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';

import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';

const AcSearchResult = ({
  skeleton,
  title,
  summary,
  published,
  category,
  themes,
  id,
}) => {
  return (
    <AcCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{summary}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          <Paragraph small>
            {acFormatDate(published, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
          </Paragraph>
          <VISUALS.ELLIPSE />
          <Paragraph small>{category}</Paragraph>
          {themes?.length > 0 && (
            <>
              <VISUALS.ELLIPSE />
              <Paragraph small>{themes[0]?.title}</Paragraph>
            </>
          )}
        </AcFlex>
        <AcLink to={`/publicatie/${id}`}>
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
