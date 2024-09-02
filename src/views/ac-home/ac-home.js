import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { AcAbout, AcHero, AcIntro, AcLoader } from '@components';
import { AcRemoveParagraphTags, AcRemoveTags, AcSanitizeHtml } from '@utils';

const AcHome = ({ store: { pages } }) => {
  const { fetchPage, resetPage, get_single } = pages;

  useEffect(() => {
    fetchPage('/home');
    return () => resetPage();
  }, []);

  const contents = get_single.contents;

  if (!contents) {
    return <AcLoader />;
  }

  return (
    <>
      <AcIntro
        title={AcRemoveTags(contents[0]?.data?.content)}
        content={AcSanitizeHtml(contents[1]?.data?.content)}
        link={AcRemoveParagraphTags(contents[2]?.data?.content)}
      />
      <AcHero />
      {/*<AcSubjects*/}
      {/*  heading='Zoeken op onderwerp'*/}
      {/*  paragraph='Bekijk alle documenten van belangrijke onderwerpen die spelen binnen de gemeente Tilburg.'*/}
      {/*  showLink*/}
      {/*  subjects={subjectsDummyData}*/}
      {/*/>*/}
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
