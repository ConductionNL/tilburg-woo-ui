import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { useEffect } from 'react';
import { AcContainer, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCardCategory } from '@molecules';
import { LABELS, PATHS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcGrid from '@atoms/ac-grid/ac-grid';
import { useMemo } from 'react';
import { AcLoader } from '@components';

const AcThemes = ({ store: { themes } }) => {
  const { fetchThemes, all_themes, is_loading } = themes;

  useEffect(() => {
    console.log(all_themes);
    fetchThemes();
  }, []);

  const renderGrid = useMemo(() => {
    if (is_loading) {
      return <AcLoader />;
    }

    return (
      <AcGrid row={3}>
        {all_themes?.map((subject, index) => (
          // <AcCardCategory key={index} {...subject} />
          <AcCardCategory
            key={index}
            {...subject}
            linkUrl={`${PATHS.SEARCH_STATIC}?theme[]=${subject.id}`}
            linkTitle={LABELS.VIEW_DOCUMENTS}
          />
        ))}
      </AcGrid>
    );
  }, [all_themes, is_loading]);

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.THEMES}</Heading>
            <Paragraph>
              Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook
              samen innoveren en medewerkers opleiden
            </Paragraph>
          </AcColumn>
          {renderGrid}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcThemes));
