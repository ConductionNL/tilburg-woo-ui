import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { extractTitle, extractSummary } from '@src/utilities/con-extract-text';
import { useResolvedText } from '@src/utilities/con-resolve-uuids-in-text';

/**
 * Renders a card for an Applicatie versie (moduleversie) with version, status, related module and key dates.
 */
const ConCardModuleVersie = ({
  skeleton,
  id,
  versie,
  beschrijvingKort,
  beschrijvingLang,
  status,
  datumInGebruik,
  datumEindeOndersteuning,
  datumTeruggetrokken,
  moduleUuid,
  objectStore,
  navigateTo = 'publication',
}) => {
  const resolvedModule = useResolvedText(moduleUuid, objectStore);

  const title = versie || '';

  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);
      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('moduleversie', id);
      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  const formattedInGebruik = datumInGebruik
    ? acFormatDate(datumInGebruik, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')
    : null;
  const formattedEindeOndersteuning = datumEindeOndersteuning
    ? acFormatDate(datumEindeOndersteuning, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')
    : null;
  const formattedTeruggetrokken = datumTeruggetrokken
    ? acFormatDate(datumTeruggetrokken, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')
    : null;

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.INFO style={{ color: 'var(--tilburg-interaction-color)' }} />
          <Heading level={3}>{extractTitle(title)}</Heading>
          {resolvedModule && (
            <Paragraph small>(Behoort bij {resolvedModule})</Paragraph>
          )}
        </AcFlex>
      </AcFlex>

      <Paragraph>
        {extractSummary(beschrijvingKort || beschrijvingLang) || '-'}
      </Paragraph>

      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {status && <Paragraph small>{status}</Paragraph>}
          </AcFlex>
          <AcFlex alignItems='center' spacing='sm'>
            {formattedInGebruik && (
              <Paragraph small>In gebruik sinds {formattedInGebruik}</Paragraph>
            )}
            {formattedInGebruik &&
              (formattedEindeOndersteuning || formattedTeruggetrokken) && (
                <VISUALS.ELLIPSE />
              )}
            {formattedEindeOndersteuning && (
              <Paragraph small>
                Einde ondersteuning {formattedEindeOndersteuning}
              </Paragraph>
            )}
            {!formattedEindeOndersteuning && formattedTeruggetrokken && (
              <Paragraph small>Teruggetrokken {formattedTeruggetrokken}</Paragraph>
            )}
          </AcFlex>
        </AcFlex>
        <AcLink to={onClick()}>
          <span className='sr-only'>
            {LABELS.READ_MORE_ABOUT} {title}
          </span>
          <VISUALS.ARROW_RIGHT />
        </AcLink>
      </AcFlex>
    </AcCard>
  );
};

export default ConCardModuleVersie;
