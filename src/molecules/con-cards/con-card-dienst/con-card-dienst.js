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

const ConCardDienst = ({
  skeleton,
  title,
  summary,
  // published,
  updated,
  category,
  themes,
  id,
}) => {
  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.HAND_HOLDING
            style={{ color: 'var(--tilburg-interaction-color)' }}
          />
          <Heading level={3}>
            <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
          </Heading>
        </AcFlex>
        <Paragraph className='organisation-card__updated'>
          Laatst bijgewerkt:{' '}
          {acFormatDate(updated, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
        </Paragraph>
      </AcFlex>
      <Paragraph>{extractSummary(summary)}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && (
            <>
              <StatusBadge>{extractText(themes[0]?.title)}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}

          <Paragraph small>{extractText(category)}</Paragraph>
        </AcFlex>
        <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
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

export default ConCardDienst;
