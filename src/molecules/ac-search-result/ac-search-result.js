import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import {
  extractText,
  extractTitle,
  extractSummary,
} from '@src/utilities/con-extract-text';
import { NAVIGATE_TO } from '@constants/routes.constants';

const AcSearchResult = ({
  skeleton,
  title,
  summary,
  created,
  category,
  themes,
  id,
  // self, // Regular prop name for @self data
  navigateTo = 'publication',
  // ...rest // Capture all other properties
}) => {
  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);
      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS(category, id);
      case 'view':
        return `/beheer/view/${id}`;
      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  // Extract relevance score if present (fuzzy search)
  // const relevanceScore = self?.relevance;
  // const hasRelevance = typeof relevanceScore === 'number';

  return (
    <AcCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3} style={{ margin: 0, flex: 1 }}>
        <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
      </Heading>
      {/* <AcFlex justifyContent='between' alignItems='start' style={{ marginBottom: '0.5rem' }}>
        <Heading level={3} style={{ margin: 0, flex: 1 }}>
          <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
        </Heading>
        {hasRelevance && (
          <StatusBadge status='success' style={{ marginLeft: '1rem', flexShrink: 0 }}>
            {relevanceScore}%
          </StatusBadge>
        )}
      </AcFlex> */}
      <Paragraph>{extractSummary(summary)}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && (
            <>
              <StatusBadge>{extractText(themes[0]?.title)}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}
          {created && (
            <>
              <Paragraph small>
                {acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
              <VISUALS.ELLIPSE />
            </>
          )}
          <Paragraph small>{extractText(category)}</Paragraph>
        </AcFlex>
        <AcLink to={onClick()}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT}{' '}
            <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default AcSearchResult;
