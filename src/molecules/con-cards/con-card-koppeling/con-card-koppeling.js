import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { extractText, extractTitle } from '@src/utilities/con-extract-text';
import { NAVIGATE_TO } from '@constants/routes.constants';

const ConCardKoppeling = ({
  skeleton,
  title,
  item,
  category,
  id,
  published,
  navigateTo = 'publication',
}) => {
  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);

      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('koppeling', id);

      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  const moduleA = item['@self'].relations.moduleA;
  const moduleB = item['@self'].relations.moduleB;
  const arrow =
    item.richtingDataUitwisseling === 'AnaarB'
      ? '→'
      : item.richtingDataUitwisseling === 'BnaarA'
      ? '←'
      : '↔';

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.LINK
            style={{
              height: 'var(--utrecht-heading-3-font-size)',
              width: 'var(--utrecht-heading-3-font-size)',
              flexShrink: 0,
              color: 'inherit',
            }}
          />
          <Heading level={3}>
            <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
          </Heading>
        </AcFlex>
      </AcFlex>
      <Paragraph>
        <ConUuidResolver>{moduleA}</ConUuidResolver> {arrow}{' '}
        <ConUuidResolver>{moduleB}</ConUuidResolver>
      </Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {published && (
            <>
              <Paragraph small>{item.soortKoppeling}</Paragraph>
              <VISUALS.ELLIPSE />
            </>
          )}
          {item.soortKoppeling && (
            <>
              <Paragraph small>{item.soortKoppeling}</Paragraph>
              <VISUALS.ELLIPSE />
            </>
          )}

          <Paragraph small>{extractText(category)}</Paragraph>
        </AcFlex>
        <AcLink to={onClick()}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT}{' '}
            <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardKoppeling;
