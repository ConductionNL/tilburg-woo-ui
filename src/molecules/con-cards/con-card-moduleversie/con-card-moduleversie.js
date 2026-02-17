import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { extractTitle, extractSummary } from '@src/utilities/con-extract-text';

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
  datumInOntwikkeling,
  datumInGebruik,
  datumEindeOndersteuning,
  datumTeruggetrokken,
  moduleUuid,
  created,
  navigateTo = 'publication',
}) => {

  const title = versie || '';

  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);
      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('applicatieversie', id);
      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  const formattedInOntwikkeling = datumInOntwikkeling
    ? acFormatDate(datumInOntwikkeling, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')
    : null;
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
          <VISUALS.INFO
            style={{
              height: 'var(--utrecht-heading-3-font-size)',
              width: 'var(--utrecht-heading-3-font-size)',
              flexShrink: 0,
              color: 'inherit',
            }}
          />
          <p className="utrecht-heading-3">{extractTitle(title)}</p>
          {moduleUuid && (
            <Paragraph small>
              (Behoort tot <ConUuidResolver>{moduleUuid}</ConUuidResolver>)
            </Paragraph>
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
            {created && (
              <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                {acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
            )}
          </AcFlex>
          <AcFlex alignItems='center' spacing='sm'>
            {formattedInOntwikkeling && (
              <Paragraph small>
                In ontwikkeling sinds {formattedInOntwikkeling}
              </Paragraph>
            )}
            {!formattedInOntwikkeling && formattedInGebruik && (
              <Paragraph small>In gebruik sinds {formattedInGebruik}</Paragraph>
            )}
            {(formattedInOntwikkeling || formattedInGebruik) &&
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
