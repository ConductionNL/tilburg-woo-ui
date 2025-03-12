import { useEffect, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcCardCategory } from '@molecules';
import { LABELS, PATHS } from '@constants';
import AcGrid from '@atoms/ac-grid/ac-grid';
import { AcLoader } from '@components';
import { AcContainer, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { AcBuildURLSearchParams } from '@utils';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

const AcSubjects = ({ store: { publications, themes } }) => {
  const { fetchPublications, is_loading, getSearchPageURL } = publications;
  const { fetchThemes, all_themes } = themes;

  useEffect(() => {
    fetchThemes();
    fetchPublications();
  }, []);

  const renderGrid = useMemo(() => {
    if (is_loading) {
      return <AcLoader />;
    }

    return (
      <AcGrid row={3}>
        {all_themes?.map((subject, index) => (
          <AcCardCategory
            key={index}
            {...subject}
            linkUrl={getSearchPageURL({
              themes: [subject.id],
            })}
            linkTitle={LABELS.VIEW_DOCUMENTS}
          />
        ))}
      </AcGrid>
    );
  }, [all_themes, is_loading]);

  if (is_loading) {
    return <AcLoader />;
  }

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.THEMES}</Heading>
            {AcCheckIfSpecificHostname() ? (
              <Paragraph>
                Op deze pagina vindt u een overzicht van onderwerpen die relevant
                zijn voor gemeenten en leveranciers binnen het domein van
                gemeentelijke ICT. De documenten en informatie zijn thematisch
                gerangschikt om u te helpen snel en eenvoudig toegang te krijgen tot
                relevante gegevens. Bent u op zoek naar specifieke softwarepakketten,
                standaarden, referentiecomponenten of rapportages? Dan kunt u deze
                hier vinden
              </Paragraph>
            ) : (
              <Paragraph>
                Op deze pagina staan de documenten niet ingedeeld per Woo-categorie.
                Hier hebben we documenten over één onderwerp bij elkaar gezet. Bent u
                op zoek naar bestuursstukken, raadsstukken, convenanten of
                woo-verzoeken over een specifiek onderwerp? Dan kunt u deze hier
                vinden.
              </Paragraph>
            )}
          </AcColumn>
          {renderGrid}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcSubjects));
