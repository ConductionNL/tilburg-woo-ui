import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { Link } from 'react-router-dom';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';

const isObject = (value) => {
  return typeof value === 'object' && value !== null;
};

const ConCardApplication = ({
  skeleton,
  title,
  summary,
  updated,
  category,
  themes,
  referenceComponents,
  organisationData,
  id,
  logo,
}) => {
  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.CUBE style={{ color: 'var(--tilburg-interaction-color)' }} />
          <AcFlex alignItems='center' spacing='xs'>
            <Heading level={3}>{title}</Heading>
            {organisationData && isObject(organisationData) && (
              <Paragraph small>(Aangeboden door {organisationData.naam})</Paragraph>
            )}
          </AcFlex>
        </AcFlex>
        {logo && (
          <ConLogoPreview
            logoUrl={logo}
            className='ac-register-review__logo'
            style={{ margin: 0, aspectRatio: 'auto', height: '32px' }}
          />
        )}
      </AcFlex>
      {/* truncate to 100 characters */}
      <Paragraph>{summary}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {themes?.length > 0 && (
              <>
                <StatusBadge>{themes[0]?.title}</StatusBadge>
                <VISUALS.ELLIPSE />
              </>
            )}
            <Paragraph className='organisation-card__updated'>
              Laatst bijgewerkt:{' '}
              {acFormatDate(updated, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
            </Paragraph>{' '}
          </AcFlex>
          {!!referenceComponents?.length && (
            <Paragraph small>
              Geschikt voor:{' '}
              {referenceComponents
                ?.map((component) => component?.name)
                .filter(Boolean)
                .join(', ')}
            </Paragraph>
          )}
        </AcFlex>
        <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
          <span class='sr-only'>
            {LABELS.READ_MORE_ABOUT} {title}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardApplication;
