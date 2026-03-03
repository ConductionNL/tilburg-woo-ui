import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import acFormatDate from '@src/utilities/ac-format-date';

const ConCardGebruik = ({
  skeleton,
  id,
  module,
  organisation,
  referentieComponenten,
  status,
  created,
  navigateTo = 'publication',
}) => {

  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);

      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('gebruik', id);

      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.CLOUD
            style={{
              height: 'var(--utrecht-heading-3-font-size)',
              width: 'var(--utrecht-heading-3-font-size)',
              flexShrink: 0,
              color: 'inherit',
            }}
          />
          <Heading level={3}>
            <ConUuidResolver>{module}</ConUuidResolver> - gebruik
          </Heading>
          {organisation && (
            <Paragraph small>
              (Gebruikt door <ConUuidResolver>{organisation}</ConUuidResolver>)
            </Paragraph>
          )}
        </AcFlex>
      </AcFlex>
      <Paragraph>
        Geschikt voor:{' '}
        {referentieComponenten?.filter(Boolean).length > 0
          ? <>
              {referentieComponenten
                .filter(Boolean)
                .slice(0, 2)
                .map((component, index) => (
                  <span key={component}>
                    {index > 0 && ', '}
                    <ConUuidResolver>{component}</ConUuidResolver>
                  </span>
                ))}
              {referentieComponenten.filter(Boolean).length > 2 && (
                <span>, +{referentieComponenten.filter(Boolean).length - 2} meer</span>
              )}
            </>
          : '-'}
      </Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {created && (
              <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                {acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
            )}
          </AcFlex>
          <AcFlex alignItems='center' spacing='sm'>
            {status && <Paragraph small>{status}</Paragraph>}
          </AcFlex>
        </AcFlex>
        <AcLink to={onClick()}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT} <ConUuidResolver>{module}</ConUuidResolver> - gebruik
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardGebruik;
