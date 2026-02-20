import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import {
  extractText,
  extractTitle,
  extractSummary,
} from '@src/utilities/con-extract-text';
import { NAVIGATE_TO } from '@constants/routes.constants';
const ConCardDienst = ({
  skeleton,
  title,
  summary,
  category,
  id,
  aanbieder,
  type,
  created,
  navigateTo = 'publication',
}) => {
  // Get the aanbieder value (handle both object and string formats)
  const aanbiederValue =
    typeof aanbieder === 'object' ? aanbieder?.value : aanbieder;

  const onClick = () => {
    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);

      case 'beheer':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('dienst', id);

      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          <VISUALS.HAND_HOLDING
            style={{
              height: 'var(--utrecht-heading-3-font-size)',
              width: 'var(--utrecht-heading-3-font-size)',
              flexShrink: 0,
              color: 'inherit',
            }}
          />
          <p className="utrecht-heading-3">
            <ConUuidResolver>{extractTitle(title)}</ConUuidResolver>
          </p>
          {aanbiederValue && (
            <Paragraph small>
              (Aangeboden door <ConUuidResolver>{aanbiederValue}</ConUuidResolver>)
            </Paragraph>
          )}
        </AcFlex>
      </AcFlex>
      <Paragraph>{extractSummary(summary)}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          <AcFlex alignItems='center' spacing='sm'>
            {created && (
              <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                {acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
            )}
            {category && (
              <>
                {created && <VISUALS.ELLIPSE />}
                <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                  {extractText(category)}
                </Paragraph>
              </>
            )}
            {type && (
              <>
                {(created || category) && <VISUALS.ELLIPSE />}
                <Paragraph small>
                  {(() => {
                    // Check if it's a string that looks like a JSON array
                    if (typeof type === 'string' && type.trim().startsWith('[')) {
                      try {
                        const parsed = JSON.parse(type);
                        if (Array.isArray(parsed)) {
                          return parsed
                            .map((item) => extractText(item))
                            .filter(Boolean)
                            .join(', ');
                        }
                      } catch (e) {
                        // If parsing fails, just display as-is
                        return extractText(type);
                      }
                    }

                    // Handle actual arrays
                    if (Array.isArray(type)) {
                      return type
                        .map((typeItem) => {
                          // Handle objects with naam/name/label
                          if (typeof typeItem === 'object' && typeItem !== null) {
                            return extractText(
                              typeItem.naam ||
                                typeItem.name ||
                                typeItem.label ||
                                typeItem
                            );
                          }
                          return extractText(typeItem);
                        })
                        .filter(Boolean)
                        .join(', ');
                    }

                    // Handle single object with naam/name/label
                    if (typeof type === 'object' && type !== null) {
                      return extractText(
                        type.naam || type.name || type.label || type
                      );
                    }

                    return extractText(type);
                  })()}
                </Paragraph>
              </>
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

export default ConCardDienst;
