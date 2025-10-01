import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { extractTitle } from '@src/utilities/con-extract-text';
import {
  useResolvedArray,
  useResolvedText,
} from '@src/utilities/con-resolve-uuids-in-text';

const ConCardGebruik = ({
  skeleton,
  id,
  product,
  module,
  organisation,
  referentieComponenten,
  status,
  objectStore,
}) => {
  // Use generic UUID resolver for organisation name
  const resolvedOrganisation = useResolvedText(organisation, objectStore);

  const title = product || organisation || module;
  const resolvedTitle = useResolvedText(title, objectStore);

  const resolvedReferentieComponenten = useResolvedArray(
    referentieComponenten,
    objectStore
  );

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.CLOUD style={{ color: 'var(--tilburg-interaction-color)' }} />
          <Heading level={3}>{extractTitle(resolvedTitle)}</Heading>
          {organisation && (
            <Paragraph small>(Gebruikt door {resolvedOrganisation})</Paragraph>
          )}
        </AcFlex>
      </AcFlex>
      <Paragraph>{resolvedReferentieComponenten?.join(', ') || '-'}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {status && <Paragraph small>{status}</Paragraph>}
          </AcFlex>
        </AcFlex>
        <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT} {resolvedTitle}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardGebruik;
