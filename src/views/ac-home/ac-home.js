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

const AcHome = ({ store: { pages, publications, themes } }) => {
  const { fetchPage, resetPage, get_single } = pages;
  const {
    getSearchPageURL,
    fetchLatestPublications,
    latest_publications,
    is_loading_latest,
  } = publications;
  const { all_themes, fetchThemes } = themes;

  useEffect(() => {
    fetchPage('/home');
    fetchThemes();
    fetchLatestPublications(3);
    return () => resetPage();
  }, []);

  const contents = get_single.contents;

  console.log(contents);

  if (!contents) {
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </Paragraph>
          </AcColumn>
          <br />
          <AcGrid row={3}>
            <AcCardCategory
              icon={<VISUALS.CONVENANT />}
              title='Convenant'
              summary='Een formele overeenkomst of afspraak tussen twee of meer partijen'
              linkUrl={PATHS.DOCUMENTS}
              linkTitle='Bekijk de convenanten'
            />
            <AcCardCategory
              icon={<VISUALS.GOVERNANCE_DOCUMENT />}
              title='Bestuursstuk'
              summary='Document dat wordt gebruikt om beleid of richtlijnen vast te leggen'
              linkUrl={PATHS.DOCUMENTS}
              linkTitle='Bekijk de bestuursstukken'
            />
            <AcCardCategory
              icon={<VISUALS.WOO_REQUEST />}
              title='WOO-verzoek'
              summary='Verzoek bij een overheidsinstantie om informatie op te vragen'
              linkUrl={PATHS.DOCUMENTS}
              linkTitle='Bekijk de WOO-verzoeken'
            />
            <AcCardCategory
              icon={<VISUALS.COUNCIL_DOCUMENT />}
              title='Raadsstuk'
              summary='Onderwerpen die worden besproken tijdens de gemeenteraadsvergaderingen'
              linkUrl={PATHS.DOCUMENTS}
              linkTitle='Bekijk de Raadsstukken'
            />
            <AcCardCategory
              icon={<VISUALS.ORGANIZATION />}
              title='Organisatie en werkwijze'
              summary='Taken en bevoegdheden van de organisatieonderdelen'
              linkUrl={PATHS.DOCUMENTS}
              linkTitle='Organisatie en werkwijze'
            />
            <AcCardCategory
              icon={<VISUALS.REACHABILITY />}
              title='Bereikbaarheidsgegevens'
              summary='De bereikbaarheid van Gemeente Tilburg en de werkwijze van een klachtenprocedure'
              linkUrl={PATHS.DOCUMENTS}
              linkTitle='Bereikbaarheidsgegevens'
              isExternal
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
              <AcCardCategory
                image='./placeholder.png'
                title='Campus Wijkevoort'
                summary='Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.'
                linkUrl='#'
                linkTitle='Bekijk de documenten'
              />
              <AcCardCategory
                image='./placeholder.png'
                title='Duurzaamheid'
                summary='Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.'
                linkUrl='#'
                linkTitle='Bekijk de documenten'
              />
            </AcGrid>
            <AcLink type='button' animate to={PATHS.THEMES}>
              {LABELS.VIEW_ALL_THEMES}
              <VISUALS.ARROW_RIGHT />
            </AcLink>
          </AcColumn>
        </AcContainer>
      </AcSection>

      {/* <AcSection spacing>
        <AcContainer>
          <AcColumn gap='rat'>
            <Heading level={2}>Uitgelicht</Heading>
          </AcColumn>
          <br />
          <AcGrid row={3}>
            <div
              style={{
                border: '1px solid gray',
                inlineSize: '100%',
                blockSize: '200px',
              }}
            />
            <div
              style={{
                border: '1px solid gray',
                inlineSize: '100%',
                blockSize: '200px',
              }}
            />
            <div
              style={{
                border: '1px solid gray',
                inlineSize: '100%',
                blockSize: '200px',
              }}
            />
          </AcGrid>
        </AcContainer>
      </AcSection> */}

      <AcFeatured publications={latest_publications} isLoading={is_loading_latest} />

      {/* <AcAbout
        title={AcRemoveTags(contents[3]?.data?.content)}
        content={AcSanitizeHtml(AcRemoveParagraphTags(contents[4]?.data?.content))}
        link={AcSanitizeHtml(AcRemoveParagraphTags(contents[2]?.data?.content))}
        image={contents[6]?.data}
      /> */}

      <AcAbout
        title='Over Open Tilburg'
        content={
          <>
            <p>
              Bij de gemeente Tilburg zijn we transparant en willen we voldoen aan de
              Wet open overheid. De documenten die onder de wet vallen maken we
              openbaar. Op deze website kun je openbare documentatie en publicaties
              terugvinden.
            </p>

            <ul>
              <li>Alles op één centrale plek</li>
              <li>Zoek in 23.420 publicaties</li>
              <li>Direct documenten downloaden</li>
            </ul>
          </>
        }
        link={
          <AcLink to='#' external>
            <VISUALS.QUESTION_MARK />
            Meer weten over Open Tilburg?
          </AcLink>
        }
        image={{
          url: './placeholder.png',
          alt: 'Placeholder image',
        }}
      />
    </>
  );
};

export default withStore(observer(AcHome));
