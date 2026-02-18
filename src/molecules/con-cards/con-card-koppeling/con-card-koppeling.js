import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import { extractText, extractTitle } from '@src/utilities/con-extract-text';
import { NAVIGATE_TO } from '@constants/routes.constants';
import acFormatDate from '@src/utilities/ac-format-date';

const ConCardKoppeling = ({
  skeleton,
  title,
  item,
  category,
  id,
  source,
  target,
  created,
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

  // Handle both individual props (source/target) and item object format
  const moduleA = source || item?.['@self']?.relations?.moduleA;
  const moduleB = target || item?.['@self']?.relations?.moduleB;
  const richtingDataUitwisseling = item?.richtingDataUitwisseling;
  const soortKoppeling = item?.soortKoppeling;
  const koppelType = item?.koppelType;
  const status = item?.status;
  const datumInGebruik = item?.datumInGebruik;
  const aanmeldstandaard = item?.aanmeldstandaard;
  const standaardversies = item?.standaardversies;
  const gebruikVoorReferentiecomponenten = item?.gebruikVoorReferentiecomponenten;

  const arrow =
    richtingDataUitwisseling === 'AnaarB'
      ? '→'
      : richtingDataUitwisseling === 'BnaarA'
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

      {/* Module koppeling met richting */}
      <AcFlex
        alignItems='center'
        spacing='xs'
        style={{ marginBottom: 'var(--spacing-default)' }}
      >
        <Paragraph>
          <ConUuidResolver>{moduleA}</ConUuidResolver> {arrow}{' '}
          <ConUuidResolver>{moduleB}</ConUuidResolver>
        </Paragraph>
      </AcFlex>

      {/* Aanmeldstandaard en versies */}
      {aanmeldstandaard && (
        <Paragraph small style={{ marginBottom: 'var(--spacing-small)' }}>
          <strong>Aanmeldstandaard:</strong>{' '}
          <ConUuidResolver>{aanmeldstandaard}</ConUuidResolver>
          {standaardversies && standaardversies.length > 0 && (
            <>
              {' '}
              (
              {standaardversies.map((versie, index) => (
                <span key={versie}>
                  {index > 0 && ', '}
                  <ConUuidResolver>{versie}</ConUuidResolver>
                </span>
              ))}
              )
            </>
          )}
        </Paragraph>
      )}

      {/* Referentiecomponenten */}
      {gebruikVoorReferentiecomponenten &&
        gebruikVoorReferentiecomponenten.length > 0 && (
          <Paragraph small style={{ marginBottom: 'var(--spacing-small)' }}>
            <strong>Geschikt voor:</strong>{' '}
            {gebruikVoorReferentiecomponenten
              .slice()
              .sort((a, b) => String(a).localeCompare(String(b)))
              .map((component, index) => (
                <span key={component}>
                  {index > 0 && ', '}
                  <ConUuidResolver>{component}</ConUuidResolver>
                </span>
              ))}
          </Paragraph>
        )}

      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm' wrap>
            {/* Status badge */}
            {status && (
              <>
                <StatusBadge>{extractText(status)}</StatusBadge>
                <VISUALS.ELLIPSE />
              </>
            )}

            {/* Koppel type (intern/extern) */}
            {koppelType && (
              <>
                <Paragraph small>
                  {koppelType === 'extern' ? 'Externe koppeling' : 'Interne koppeling'}
                </Paragraph>
                <VISUALS.ELLIPSE />
              </>
            )}

            {/* Soort koppeling */}
            {soortKoppeling && (
              <>
                <Paragraph small>{extractText(soortKoppeling)}</Paragraph>
                <VISUALS.ELLIPSE />
              </>
            )}

            {/* Datum in gebruik */}
            {datumInGebruik && (
              <>
                <Paragraph small>Sinds {acFormatDate(datumInGebruik)}</Paragraph>
                <VISUALS.ELLIPSE />
              </>
            )}

            {/* Category */}
            {category && <Paragraph small>{extractText(category)}</Paragraph>}
          </AcFlex>
          <AcFlex alignItems='center' spacing='sm'>
            {/* Created date */}
            {created && (
              <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                {acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
            )}
          </AcFlex>
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
