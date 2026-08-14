import { useMemo } from 'react';
import { AcLink } from '@molecules';
import { ConUuidResolver } from '@components';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { extractTitle, extractSummary } from '@src/utilities/con-extract-text';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import acFormatDate from '@src/utilities/ac-format-date';
import { checkOrganizationPermissions } from '@src/utilities/organization-permissions';

// card for products, modules and organisations
const ConCardOrganisationApplication = ({
  skeleton,
  title,
  summary,
  id,
  logo,
  cardType,
  type,
  referenceComponents,
  organisation,
  created,
  navigateTo = 'publication',
  user,
  '@self': objectSelf, // Extract @self for file ID resolution
}) => {
  // Extract relevance score if present (fuzzy search)
  // const relevanceScore = self?.relevance;
  // const hasRelevance = typeof relevanceScore === 'number';

  const getTypeLabel = (type) => {
    switch (type) {
      case 'Module':
        return 'Applicatie';
      default:
        return type;
    }
  };

  const icon = useMemo(() => {
    const iconStyle = {
      height: 'var(--utrecht-heading-3-font-size)',
      width: 'var(--utrecht-heading-3-font-size)',
      flexShrink: 0,
      color: 'inherit',
    };
    switch (cardType) {
      case 'product':
        return <VISUALS.CUBES style={iconStyle} />;
      case 'module':
        return <VISUALS.CUBE style={iconStyle} />;
      case 'organisatie':
        return <VISUALS.BUILDING style={iconStyle} />;
      default:
        return null;
    }
  }, [cardType]);

  const onClick = () => {
    // For organization cards in beheer context, check if it's the user's own organization
    if (navigateTo === 'beheer-organisatie' && cardType === 'organisatie' && user) {
      // Create a mock object with the organization data to check permissions
      const mockObject = {
        '@self': {
          organisation: id, // The organization ID we're checking
        },
      };

      const { canEdit } = checkOrganizationPermissions(user, mockObject);

      // If user can edit this organization, it's their own organization
      if (canEdit) {
        return '/beheer/my-organisation';
      }
    }

    switch (navigateTo) {
      case 'publication':
        return NAVIGATE_TO.PUBLICATION(id);
      case 'beheer-organisatie':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('organisatie', id);
      case 'beheer-product':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('product', id);
      case 'beheer-module':
        return NAVIGATE_TO.BEHEER_TYPE_DETAILS('applicaties', id);
      default:
        return NAVIGATE_TO.PUBLICATION(id);
    }
  };

  return (
    <AcCard organisation padding='md' skeleton={skeleton}>
      {/* {hasRelevance && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
          <StatusBadge status='success'>
            {relevanceScore}%
          </StatusBadge>
        </div>
      )} */}
      <AcFlex alignItems='center' justifyContent='space-between'>
        <AcFlex alignItems='center' spacing='xs'>
          {icon}
          <p className="utrecht-heading-3">{extractTitle(title)}</p>
          {organisation && (cardType === 'product' || cardType === 'module') && (
            <Paragraph small>
              (Aangeboden door <ConUuidResolver>{organisation}</ConUuidResolver>)
            </Paragraph>
          )}
        </AcFlex>
        {logo && (
          <ConLogoPreview
            logoUrl={logo}
            objectSelf={objectSelf}
            className='ac-register-review__logo'
            style={{ margin: 0, aspectRatio: 'auto', height: '32px' }}
          />
        )}
      </AcFlex>
      <Paragraph>{extractSummary(summary)}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex column>
          {referenceComponents?.length > 0 && (
            <Paragraph small>
              Geschikt voor:{' '}
              {referenceComponents
                .filter(Boolean)
                .slice(0, 2)
                .map((component, index) => (
                  <span key={component}>
                    {index > 0 && ', '}
                    <ConUuidResolver>{component}</ConUuidResolver>
                  </span>
                ))}
              {referenceComponents.filter(Boolean).length > 2 && (
                <span>, +{referenceComponents.filter(Boolean).length - 2} meer</span>
              )}
            </Paragraph>
          )}
          <AcFlex alignItems='center' spacing='sm'>
            {created && (
              <Paragraph small style={{ whiteSpace: 'nowrap' }}>
                {acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
            )}
            {type && (
              <>
                {created && <VISUALS.ELLIPSE />}
                <Paragraph small>{getTypeLabel(type)}</Paragraph>
              </>
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

export default ConCardOrganisationApplication;
