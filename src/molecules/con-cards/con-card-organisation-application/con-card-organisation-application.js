// eslint-disable-next-line import/no-unresolved
import React, { useMemo } from 'react';
import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { extractTitle, extractSummary } from '@src/utilities/con-extract-text';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import acFormatDate from '@src/utilities/ac-format-date';

const ConCardOrganisationApplication = ({
  skeleton,
  title,
  summary,
  id,
  logo,
  cardType,
  referenceComponents,
  updated,
  organisation,
  // user,
  // published,
  // ...rest // Capture additional object data
}) => {
  const icon = useMemo(() => {
    switch (cardType) {
      case 'product':
      case 'module':
        return (
          <VISUALS.CUBE style={{ color: 'var(--tilburg-interaction-color)' }} />
        );
      case 'organisatie':
        return (
          <VISUALS.BUILDING style={{ color: 'var(--tilburg-interaction-color)' }} />
        );
      default:
        return null;
    }
  }, [cardType]);

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          {icon}
          <Heading level={3}>{extractTitle(title)}</Heading>
          {organisation && (cardType === 'product' || cardType === 'module') && (
            <Paragraph small>(Aangeboden door {organisation})</Paragraph>
          )}
        </AcFlex>
        {logo && (
          <ConLogoPreview
            logoUrl={logo}
            className='ac-register-review__logo'
            style={{ margin: 0, aspectRatio: 'auto', height: '32px' }}
          />
        )}
      </AcFlex>
      <Paragraph>{extractSummary(summary)}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          {!!referenceComponents?.length && (
            <Paragraph small>
              Geschikt voor:{' '}
              {referenceComponents
                ?.slice(0, 2) // Only take the first two components
                .filter(Boolean)
                .join(', ')}
            </Paragraph>
          )}
          <Paragraph className='organisation-card__updated'>
            Laatst bijgewerkt:{' '}
            {acFormatDate(updated, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
          </Paragraph>{' '}
        </AcFlex>
        <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT} {title}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardOrganisationApplication;
