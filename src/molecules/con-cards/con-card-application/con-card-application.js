import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { Link } from 'react-router-dom';

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
}) => {
  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.CUBE style={{ color: 'var(--tilburg-interaction-color)' }} />
          <AcFlex alignItems='end' spacing='xs'>
            <Heading level={3}>{title}</Heading>
            {organisationData && (
              <Paragraph small>
                (Aangeboden door{' '}
                {organisationData && isObject(organisationData) ? (
                  <Link href={organisationData.website}>
                    {organisationData.naam}
                  </Link>
                ) : (
                  String(organisationData.naam)
                )}
                )
              </Paragraph>
            )}
          </AcFlex>
        </AcFlex>
        <Paragraph className='organisation-card__updated'>
          Laatst bijgewerkt:{' '}
          {acFormatDate(updated, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
        </Paragraph>
      </AcFlex>
      {/* truncate to 100 characters */}
      <Paragraph>
        {summary?.length > 100 ? `${summary.slice(0, 100)}...` : summary}
      </Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {themes?.length > 0 && (
              <>
                <StatusBadge>{themes[0]?.title}</StatusBadge>
                <VISUALS.ELLIPSE />
              </>
            )}

            <Paragraph small>Type: {category ?? '-'}</Paragraph>
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
