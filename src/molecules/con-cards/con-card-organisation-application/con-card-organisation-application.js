// eslint-disable-next-line import/no-unresolved
import React, { useMemo } from 'react';
import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';

const ConCardOrganisationApplication = ({
  skeleton,
  title,
  summary,
  type,
  id,
  logo,
  cardType,
  // user,
  // published,
  // ...rest // Capture additional object data
}) => {
  const icon = useMemo(() => {
    switch (cardType) {
      case 'voorziening':
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
          <Heading level={3}>{title}</Heading>
        </AcFlex>
        {logo && (
          <ConLogoPreview
            logoUrl={logo}
            className='ac-register-review__logo'
            style={{ margin: 0, aspectRatio: 'auto', height: '32px' }}
          />
        )}
      </AcFlex>
      <Paragraph>{summary}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          <Paragraph small>{type}</Paragraph>
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
