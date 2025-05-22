import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { AcAbout, AcHero, AcLoader, AcFeatured } from '@components';
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
import { VISUALS } from '@constants';

const AcHome = ({ store: { pages, publications, themes, categories } }) => {
  const { fetchPage, resetPage, get_single } = pages;
  const {
    getSearchPageURL,
    fetchLatestPublications,
    latest_publications,
    is_loading_latest,
  } = publications;
  const { all_themes, fetchThemes } = themes;
  const {
    all_categories,
    fetchCategories,
    is_loading: is_loading_categories,
  } = categories;

  useEffect(() => {
    fetchPage('/home');
    fetchThemes();
    fetchLatestPublications(3);
    fetchCategories();
    return () => resetPage();
  }, []);

  const contents = get_single.contents;

  if (!contents || is_loading_categories) {
    return <AcLoader />;
  }

  console.log('contents', contents);

  return (
    <>
      <AcHero />

      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='rat'>
            <Heading level={2}>Welke documenten vind je hier binnenkort?</Heading>
            <Paragraph>
              In de komende maanden zijn op deze website alle openbare documenten van
              de gemeente Tilburg te vinden.
            </Paragraph>
          </AcColumn>
          <br />
          <AcGrid row={3}>
            {all_categories?.map((category, index) => (
              <AcCardCategory key={index} {...category} />
            ))}
          </AcGrid>
        </AcContainer>
      </AcSection>

      {/* <AcSection spacing blue>
        <AcContainer>
          <AcColumn gap='tiger'>
            <AcColumn gap='rat'>
              <Heading level={2}>{LABELS.THEMES}</Heading>
              <Paragraph>
                Bekijk alle documenten van belangrijke onderwerpen die spelen binnen
                de gemeente Tilburg.
              </Paragraph>
            </AcColumn>
            <AcGrid row={3}>
              {all_themes?.slice(0, 3).map((subject, index) => (
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
            <AcLink type='button' animate to={PATHS.THEMES}>
              {LABELS.VIEW_ALL_THEMES}
              <VISUALS.ARROW_RIGHT />
            </AcLink>
          </AcColumn>
        </AcContainer>
      </AcSection> */}

      <AcFeatured publications={latest_publications} isLoading={is_loading_latest} />

      <AcAbout
        title={AcRemoveTags(contents[0]?.data?.content)}
        content={AcSanitizeHtml(AcRemoveParagraphTags(contents[1]?.data?.content))}
        list={AcSanitizeHtml(AcRemoveParagraphTags(contents[2]?.data?.content))}
        link={AcSanitizeHtml(AcRemoveParagraphTags(contents[3]?.data?.content))}
        image={contents[4]?.data}
      />
    </>
  );
};

export default withStore(observer(AcHome));
