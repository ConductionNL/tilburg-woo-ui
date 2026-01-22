import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { extractTitle } from '@src/utilities/con-extract-text';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';

const ConCardContactpersoon = ({
  skeleton,
  id,
  firstName,
  middleName,
  lastName,
  functie,
  image,
  email,
  organisation,
  telefoon,
  navigateTo = 'publication',
}) => {
  // Get the organisation value (handle both object and string formats)
  const organisationValue = typeof organisation === 'object' ? organisation?.value : organisation;

  const name = [firstName, middleName, lastName].filter(Boolean).join(' ');

  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);

      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('contactpersoon', id);

      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.USER
            style={{
              height: 'var(--utrecht-heading-3-font-size)',
              width: 'var(--utrecht-heading-3-font-size)',
              flexShrink: 0,
              color: 'inherit',
            }}
          />
          <Heading level={3}>{extractTitle(name)}</Heading>
          {organisationValue && (
            <Paragraph small>
              (Werkzaam bij <ConUuidResolver>{organisationValue}</ConUuidResolver>)
            </Paragraph>
          )}
        </AcFlex>
        {image && (
          <ConLogoPreview
            logoUrl={image}
            className='ac-register-review__logo'
            style={{ margin: 0, aspectRatio: 'auto', height: '32px' }}
          />
        )}
      </AcFlex>
      <Paragraph>Functie: {functie || '-'}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {email && <Paragraph small>{email}</Paragraph>}
            {telefoon && (
              <>
                <VISUALS.ELLIPSE />
                <Paragraph small>{telefoon}</Paragraph>
              </>
            )}
          </AcFlex>
        </AcFlex>
        <AcLink to={onClick()}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT} {name}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardContactpersoon;
