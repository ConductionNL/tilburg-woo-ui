import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
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
  const moduleA = source || item?.moduleA;
  const moduleB = target || item?.moduleB;
  const richtingDataUitwisseling = item?.gegevensuitwisselingRichting;
  const status = item?.status;
  const createdDate = created || item?.['@self']?.created;
  
  // Get the appropriate status date based on status
  const getStatusDate = () => {
    if (!status) return null;
    const statusDateMap = {
      'in ontwikkeling': item?.datumInOntwikkeling,
      'ontwikkeling': item?.datumInOntwikkeling,
      'actief': item?.datumInGebruik,
      'in gebruik': item?.datumInGebruik,
      'teruggetrokken': item?.datumTeruggetrokken,
      'einde ondersteuning': item?.datumEindeOndersteuning,
    };
    return statusDateMap[status?.toLowerCase()] || null;
  };
  
  const statusDate = getStatusDate();
  const standaardversies = item?.standaardversies;

  const arrow =
    richtingDataUitwisseling === 'a-naar-b' || richtingDataUitwisseling === 'AnaarB'
      ? '→'
      : richtingDataUitwisseling === 'b-naar-a' || richtingDataUitwisseling === 'BnaarA'
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

      {/* Standaardversies */}
      {standaardversies && standaardversies.length > 0 && (
        <Paragraph small style={{ marginBottom: 'var(--spacing-small)' }}>
          <strong>Standaardversies:</strong>{' '}
          {standaardversies.map((versie, index) => (
            <span key={versie}>
              {index > 0 && ', '}
              <ConUuidResolver>{versie}</ConUuidResolver>
            </span>
          ))}
        </Paragraph>
      )}

      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm' wrap>
            {/* Created date */}
            {createdDate && (
              <>
                <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                  {acFormatDate(createdDate, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
                </Paragraph>
                <VISUALS.ELLIPSE />
              </>
            )}

            {/* Type/Category */}
            {category && (
              <>
                <Paragraph small>{extractText(category)}</Paragraph>
                <VISUALS.ELLIPSE />
              </>
            )}

            {/* Status with date */}
            {status && (
              <Paragraph small>
                {extractText(status)}
                {statusDate && (
                  <span style={{ marginLeft: '4px' }}>
                    (sinds {acFormatDate(statusDate, 'YYYY-MM-DD HH:mm:ss', 'DD MMMM YYYY', 'nl-NL')})
                  </span>
                )}
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
