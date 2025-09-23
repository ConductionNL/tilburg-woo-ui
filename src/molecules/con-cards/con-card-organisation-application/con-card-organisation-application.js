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
import { useResolvedText, useResolvedArray } from '@src/utilities/con-resolve-uuids-in-text';

const ConCardOrganisationApplication = ({
  skeleton,
  title,
  summary,
  id,
  logo,
  cardType,
  type, // Schema type/title
  referenceComponents,
  updated,
  organisation,
  objectStore, // Add objectStore for names resolution
  // user,
  // published,
  // ...rest // Capture additional object data
}) => {
  // Use generic UUID resolver for organisation name
  const resolvedOrganisation = useResolvedText(organisation, objectStore);
  
  // Use generic UUID resolver for reference components
  const resolvedReferenceComponents = useResolvedArray(referenceComponents, objectStore);

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
            <Paragraph small>(Aangeboden door {resolvedOrganisation})</Paragraph>
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
          {!!resolvedReferenceComponents?.length && (
            <Paragraph small>
              Geschikt voor:{' '}
              {resolvedReferenceComponents
                ?.slice(0, 2) // Only take the first two components
                .filter(Boolean)
                .join(', ')}
            </Paragraph>
          )}
          <AcFlex alignItems='center' spacing='sm'>
            <Paragraph small>
              {acFormatDate(updated, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
            </Paragraph>
            {type && (
              <>
                <VISUALS.ELLIPSE />
                <Paragraph small>{type}</Paragraph>
              </>
            )}
          </AcFlex>
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
