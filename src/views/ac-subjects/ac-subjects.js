import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { TilburgSubjects } from '@components';
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
  const { categories, fetchAggregations } = documents;

  useEffect(() => {
    fetchAggregations();
  }, []);

  return (
    <>
      <TilburgSubjects
        heading='Onderwerpen'
        paragraph='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dol magna aliqua.'
        subjects={subjectsDummyData}
      />
    </>
  );
};

export default withStore(observer(AcSubjects));
