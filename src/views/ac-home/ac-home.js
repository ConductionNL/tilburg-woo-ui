import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { AcAbout, AcHero, AcIntro, AcLoader } from '@components';
import { AcRemoveParagraphTags, AcRemoveTags, AcSanitizeHtml } from '@utils';
import { AcContainer, AcSection } from '@atoms';
import AcColumn from '@atoms/ac-column/ac-column';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, PATHS } from '@constants';
import { AcCardCategory, AcLink } from '@molecules';
import AcGrid from '@atoms/ac-grid/ac-grid';

const AcHome = ({ store: { pages, publications, themes } }) => {
  const { fetchPage, resetPage, get_single } = pages;
  const { getSearchPageURL } = publications;
  const { all_themes, fetchThemes } = themes;

  useEffect(() => {
    fetchPage('/home');
    fetchThemes();
    return () => resetPage();
  }, []);

  const contents = get_single.contents;

  if (!contents) {
    return <AcLoader />;
  }

  return (
    <>
      <AcHero />

      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='tiger'>
            <AcColumn>
              <Heading>{LABELS.THEMES}</Heading>
              <Paragraph>
                Bekijk onze publicatiesdossiers van belangrijke onderwerpen die
                spelen binnen de gemeente Tilburg.
              </Paragraph>
            </AcColumn>
            <AcGrid row={3}>
              {all_themes
                ?.slice(0, Math.min(3, all_themes.length))
                .map((subject, index) => (
                  // <AcCardCategory key={index} {...subject} />
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
            <AcLink type='button' to={PATHS.THEMES}>
              {LABELS.VIEW_ALL_THEMES}
            </AcLink>
          </AcColumn>
        </AcContainer>
      </AcSection>

      <AcAbout
        title={AcRemoveTags(contents[3]?.data?.content)}
        content={AcSanitizeHtml(AcRemoveParagraphTags(contents[4]?.data?.content))}
        link={AcSanitizeHtml(AcRemoveParagraphTags(contents[5]?.data?.content))}
        image={contents[6]?.data}
      />
    </>
  );
};

export default withStore(observer(AcHome));
