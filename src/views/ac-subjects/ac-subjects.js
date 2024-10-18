import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcSubjects as AcSubjectsContainer, AcLoader } from '@components';
import { useEffect } from 'react';

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
    title: 'Evenementen in Tilburg',
    paragraph:
      'Tilburg is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
  {
    image: '/card-placeholder-1.png',
    title: 'Campus Wijkevoort',
    paragraph:
      'Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.',
    linkTitle: 'Bekijk 209 documenten',
  },
  {
    image: '/card-placeholder-2.png',
    title: 'Evenementen in Tilburg',
    paragraph:
      'Tilburg is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
  {
    image: '/card-placeholder-1.png',
    title: 'Campus Wijkevoort',
    paragraph:
      'Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.',
    linkTitle: 'Bekijk 209 documenten',
  },
  {
    image: '/card-placeholder-2.png',
    title: 'Evenementen in Tilburg',
    paragraph:
      'Tilburg is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
];

const AcSubjects = ({ store: { documents } }) => {
  const { themes, items, fetchThemes, fetchDocuments, is_loading } = documents;

  const newThemes = themes.map((theme) => {
    return {
      ...theme,
      paragraph: theme.description,
      linkTitle: `Bekijk ${
        items.filter((item) => item.themes.includes(theme.id))?.count ?? 0
      } documenten`,
    };
  });

  useEffect(() => {
    fetchThemes();
    fetchDocuments();
  }, []);

  if (is_loading) {
    return <AcLoader />;
  }

  return (
    <>
      <AcSubjectsContainer
        heading='Onderwerpen'
        paragraph='Hier vind je de onderwerpen die benoemd worden in de publicaties.'
        subjects={newThemes}
      />
    </>
  );
};

export default withStore(observer(AcSubjects));
