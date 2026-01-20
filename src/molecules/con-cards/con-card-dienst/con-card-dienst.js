import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
// import acFormatDate from '@src/utilities/ac-format-date';
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
  // updated,
  category,
  themes,
  id,
  aanbieder,
  status,
  type,
  navigateTo = 'publication',
}) => {
  // Get the aanbieder value (handle both object and string formats)
  const aanbiederValue = typeof aanbieder === 'object' ? aanbieder?.value : aanbieder;

  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);

      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('dienst', id);

      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.HAND_HOLDING
            style={{
              height: 'var(--utrecht-heading-3-font-size)',
              width: 'var(--utrecht-heading-3-font-size)',
              flexShrink: 0,
              color: 'inherit',
            }}
          />
          <Heading level={3}>
            <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
          </Heading>
          {aanbiederValue && (
            <Paragraph small>
              (Aangeboden door <ConUuidResolver>{aanbiederValue}</ConUuidResolver>)
            </Paragraph>
          )}
        </AcFlex>
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
          {category && <Paragraph small>{extractText(category)}</Paragraph>}
          {type && (
            <>
              <VISUALS.ELLIPSE />
              <Paragraph small>
                {Array.isArray(type)
                  ? type.map(extractText).join(', ')
                  : extractText(type)}
              </Paragraph>
            </>
          )}
          {status && (
            <>
              <VISUALS.ELLIPSE />
              <Paragraph small>{extractText(status)}</Paragraph>
            </>
          )}
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

export default ConCardDienst;
