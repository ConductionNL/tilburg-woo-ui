import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { AcAbout, AcHero, AcLoader } from '@components';
import { AcRemoveParagraphTags, AcRemoveTags, AcSanitizeHtml } from '@utils';
import { AcContainer, AcSection } from '@atoms';
import AcColumn from '@atoms/ac-column/ac-column';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, PATHS } from '@constants';
import { AcCardCategory, AcLink } from '@molecules';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import ConGlossaryHighlight from '@components/con-glossary-highlight/con-glossary-highlight';

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
    <ConGlossaryHighlight as='div'>
      <AcHero contents={contents} />

      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='tiger'>
            <AcColumn>
              <Heading>{LABELS.THEMES}</Heading>
              {AcCheckIfSpecificHostname() ? (
                <Paragraph>
                  Bekijk het overzicht van onderwerpen die relevant zijn voor
                  gemeenten en leveranciers binnen het domein van gemeentelijke ICT.
                </Paragraph>
              ) : (
                <Paragraph>
                  Bekijk onze publicatiesdossiers van belangrijke onderwerpen die
                  spelen binnen de gemeente Tilburg.
                </Paragraph>
              )}
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

      {(() => {
        const title = AcRemoveTags(contents[3]?.data?.content);
        const content = AcSanitizeHtml(
          AcRemoveParagraphTags(contents[4]?.data?.content)
        );
        const link = AcSanitizeHtml(
          AcRemoveParagraphTags(contents[5]?.data?.content)
        );

        // if no title or content exist, don't render the component (to comply with best practices)
        if (!title || !content) {
          return null;
        }

        return (
          <AcAbout
            title={title}
            content={content}
            link={link}
            image={contents[6]?.data}
          />
        );
      })()}
    </ConGlossaryHighlight>
  );
};

export default withStore(observer(AcHome));
