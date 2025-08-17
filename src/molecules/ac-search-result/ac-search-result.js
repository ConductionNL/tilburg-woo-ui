import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import acFormatDate from '@src/utilities/ac-format-date';
import { NAVIGATE_TO } from '@constants/routes.constants';
import { ConPublicationActions } from '@components';

const AcSearchResult = ({
  skeleton,
  title,
  summary,
  published,
  category,
  themes,
  id,
  user,
  schemaSlug,
}) => {
  return (
    <AcCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{summary}</Paragraph>
      <AcFlex justifyContent='between' className='meta'>
        <AcFlex alignItems='center' spacing='sm'>
          {themes?.length > 0 && (
            <>
              <StatusBadge>{themes[0]?.title}</StatusBadge>
              <VISUALS.ELLIPSE />
            </>
          )}
          {published && (
            <>
              <Paragraph small>
                {acFormatDate(published, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')}
              </Paragraph>
              <VISUALS.ELLIPSE />
            </>
          )}
          <Paragraph small>{category}</Paragraph>
        </AcFlex>
        <AcFlex alignItems='center' spacing='sm'>
          {user?.isAuthenticated && (
            <ConPublicationActions
              user={user}
              id={id}
              schemaSlug={schemaSlug}
              title={title}
              published={published}
              triggerStyle='buttonSlim'
            />
          )}
          <AcLink to={NAVIGATE_TO.PUBLICATION(id)}>
            <span className='sr-only'>
              {LABELS.READ_MORE_ABOUT} {title}
            </span>
            <VISUALS.ARROW_RIGHT />
          </AcLink>
        </AcFlex>
      </AcFlex>
    </AcCard>
  );
};

export default AcSearchResult;
