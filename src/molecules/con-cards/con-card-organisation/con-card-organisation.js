import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import { NAVIGATE_TO } from '@constants/routes.constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';

const ConCardOrganisation = ({
  skeleton,
  title,
  summary,
  published,
  updated,
  category,
  themes,
  id,
  logo,
}) => {
  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.BUILDING style={{ color: 'var(--tilburg-interaction-color)' }} />
          <Heading level={3}>{title}</Heading>
        </AcFlex>
        {logo && (
          <ConLogoPreview
            logoUrl={logo}
            className='ac-register-review__logo'
            style={{ margin: 0, aspectRatio: 'auto', height: '32px' }}
          />
        )}
        {!logo && (
          <Paragraph className='organisation-card__updated'>
            Laatst bijgewerkt:{' '}
            {acFormatDate(updated, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
          </Paragraph>
        )}
      </AcFlex>
      <Paragraph>
        {summary}
      </Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && (
            <>
              <StatusBadge>{themes[0]?.title}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}

          <Paragraph small>{category}</Paragraph>
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

export default ConCardOrganisation;
