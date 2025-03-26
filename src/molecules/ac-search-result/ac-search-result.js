import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import { NAVIGATE_TO } from '@constants/routes.constants';

const AcSearchResult = ({
  skeleton,
  title,
  summary,
  published,
  category,
  themes,
  id,
  hideCategory = false,
  hideThemes = false,
}) => {
  return (
    <AcCard searchResult padding='md' skeleton={skeleton}>
      <AcFlex column justifyContent='between' spacing='md' blockSize='full'>
        <AcFlex column spacing='sm'>
          <Heading level={3}>{title}</Heading>
          <Paragraph>{summary}</Paragraph>
        </AcFlex>
        <AcFlex justifyContent='between' className='meta'>
          <AcFlex alignItems='center' spacing='sm'>
            {!hideThemes && themes?.length > 0 && (
              <>
                <StatusBadge>{themes[0]?.title}</StatusBadge>
                {(published || (!hideCategory && category)) && <VISUALS.ELLIPSE />}
              </>
            )}
            {published && (
              <>
                <Paragraph small>
                  {acFormatDate(published, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
                </Paragraph>
                {!hideCategory && category && <VISUALS.ELLIPSE />}
              </>
            )}
            {!hideCategory && category && <Paragraph small>{category}</Paragraph>}
          </AcFlex>
          <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
            <span className='sr-only'>
              {LABELS.READ_MORE_ABOUT} {title}
            </span>
            <VISUALS.ARROW_RIGHT />
          </AcLink>
        </AcFlex>
      </AcFlex>
    </AcCard>
  );
};

export default AcSearchResult;
