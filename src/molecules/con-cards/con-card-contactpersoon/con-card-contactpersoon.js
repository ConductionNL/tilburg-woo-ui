// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { extractTitle } from '@src/utilities/con-extract-text';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { useResolvedText } from '@src/utilities/con-resolve-uuids-in-text';

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
  objectStore,
}) => {
  // Use generic UUID resolver for organisation name
  const resolvedOrganisation = useResolvedText(organisation, objectStore);

  const name = [firstName, middleName, lastName].filter(Boolean).join(' ');

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.USER style={{ color: 'var(--tilburg-interaction-color)' }} />
          <Heading level={3}>{extractTitle(name)}</Heading>
          {organisation && (
            <Paragraph small>(Werkzaam bij {resolvedOrganisation})</Paragraph>
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
        <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
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
