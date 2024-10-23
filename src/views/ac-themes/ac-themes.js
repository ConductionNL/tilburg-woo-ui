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

const AcSubjects = ({ store: { documents, themes } }) => {
  const { fetchDocuments, is_loading, getSearchPageURL } = documents;
  const { fetchThemes, all_themes } = themes;

  useEffect(() => {
    fetchThemes();
    fetchDocuments();
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
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cumque
              dolorum ducimus facere facilis id illum in laboriosam maiores nesciunt,
              odit optio quasi quidem quo repellat soluta tenetur vero. Accusantium,
              ducimus.
            </Paragraph>
          </AcColumn>
          {renderGrid}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcSubjects));
