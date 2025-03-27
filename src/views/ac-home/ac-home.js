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

  console.log(contents);

  if (!contents || is_loading_categories) {
    return <AcLoader />;
  }

  return (
    <>
      <AcHero />

      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='rat'>
            <Heading level={2}>Welke documenten vind je hier?</Heading>
            <Paragraph>
              Op deze website zijn alle openbare documenten van de gemeente Tilburg
              te vinden.
            </Paragraph>
          </AcColumn>
          <br />
          <AcGrid row={3}>
            {all_categories?.map((category, index) => (
              <AcCardCategory key={index} {...category} />
            ))}
            {/* Dummy category cards */}
            <AcCardCategory
              title='Vergunningen'
              summary='Aanvragen en besluiten over omgevingsvergunningen en evenementen'
              linkUrl='/search?categories=vergunningen'
              linkTitle='Bekijk documenten'
              icon={<VISUALS.COUNCIL_DOCUMENT />}
            />
            <AcCardCategory
              title='Bestuurlijke stukken'
              summary='Raadsvergaderingen, collegebesluiten en beleidsdocumenten'
              linkUrl='/search?categories=bestuurlijke-stukken'
              linkTitle='Bekijk documenten'
              icon={<VISUALS.GOVERNANCE_DOCUMENT />}
            />
            <AcCardCategory
              title='Financiën'
              summary='Begrotingen, jaarverslagen en financiële rapportages'
              linkUrl='/search?categories=financien'
              linkTitle='Bekijk documenten'
              icon={<VISUALS.DOCUMENT />}
            />
            <AcCardCategory
              title='Ruimtelijke ordening'
              summary='Bestemmingsplannen, structuurvisies en gebiedsontwikkeling'
              linkUrl='/search?categories=ruimtelijke-ordening'
              linkTitle='Bekijk documenten'
              icon={<VISUALS.ORGANIZATION />}
            />
            <AcCardCategory
              title='Milieu en duurzaamheid'
              summary='Milieueffectrapportages, klimaatbeleid en energietransitie'
              linkUrl='/search?categories=milieu-duurzaamheid'
              linkTitle='Bekijk documenten'
              icon={<VISUALS.THEMES />}
            />
            <AcCardCategory
              title='Sociaal domein'
              summary='Jeugdzorg, WMO, participatie en maatschappelijke ondersteuning'
              linkUrl='/search?categories=sociaal-domein'
              linkTitle='Bekijk documenten'
              icon={<VISUALS.REACHABILITY />}
            />
          </AcGrid>
        </AcContainer>
      </AcSection>

      <AcSection spacing blue>
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
      </AcSection>

      <AcFeatured publications={latest_publications} isLoading={is_loading_latest} />

      <AcAbout
        title={AcRemoveTags(contents[3]?.data?.content)}
        content={AcSanitizeHtml(AcRemoveParagraphTags(contents[4]?.data?.content))}
        link={AcSanitizeHtml(AcRemoveParagraphTags(contents[2]?.data?.content))}
        image={contents[5]?.data}
      />
    </>
  );
};

export default withStore(observer(AcHome));
