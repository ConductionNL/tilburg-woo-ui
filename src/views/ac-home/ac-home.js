import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { AcAbout, AcHero, AcIntro, AcLoader, AcSubjects } from '@components';
import { AcRemoveParagraphTags, AcRemoveTags, AcSanitizeHtml } from '@utils';

const subjectsDummyData = [
  {
    image: '/card-placeholder-1.png',
    title: 'Campus Wijkevoort',
    paragraph:
      'Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.',
    linkTitle: 'Bekijk 209 documenten',
  },
  {
    image: '/card-placeholder-2.png',
    title: 'Evenementen in Ac',
    paragraph:
      'Ac is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Ac is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
];

const AcHome = ({ store: { pages } }) => {
  const { fetchPage, resetPage, get_single } = pages;

  useEffect(() => {
    fetchPage('/home');
    return () => resetPage();
  }, [location]);

  const contents = get_single.contents;

  if (!contents) {
    return <AcLoader />;
  }

  return (
    <>
      <AcIntro
        title={AcRemoveTags(contents[0]?.data.content)}
        content={AcSanitizeHtml(contents[1]?.data.content)}
        link={AcRemoveParagraphTags(contents[2]?.data.content)}
      />
      <AcHero />
      <AcSubjects
        heading='Zoeken op onderwerp'
        paragraph='Bekijk alle documenten van belangrijke onderwerpen die spelen binnen de gemeente Tilburg.'
        showLink
        subjects={subjectsDummyData}
      />
      <AcAbout
        title={AcRemoveTags(contents[3].data.content)}
        content={AcSanitizeHtml(AcRemoveParagraphTags(contents[4].data.content))}
        link={AcSanitizeHtml(AcRemoveParagraphTags(contents[5].data.content))}
      />
    </>
  );
};

export default withStore(observer(AcHome));
