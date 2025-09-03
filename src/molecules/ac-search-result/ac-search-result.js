import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import { extractText, extractTitle, extractSummary } from '@src/utilities/con-extract-text';
import { NAVIGATE_TO } from '@constants/routes.constants';

const AcSearchResult = ({
  skeleton,
  title,
  summary,
  published,
  category,
  themes,
  id,
  // user,
  // schemaSlug,
  // ...rest // This will capture the full object data
}) => {
  return (
    <AcCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>{extractTitle(title)}</Heading>
      <Paragraph>{extractSummary(summary)}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && (
            <>
              <StatusBadge>{extractText(themes[0]?.title)}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}
          {published && (
            <>
              <Paragraph small>
                {acFormatDate(published, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
              <VISUALS.ELLIPSE />
            </>
          )}
          <Paragraph small>{extractText(category)}</Paragraph>
        </AcFlex>
        <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT} {extractTitle(title)}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default AcSearchResult;
