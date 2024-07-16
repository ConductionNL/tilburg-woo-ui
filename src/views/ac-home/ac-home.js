import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import {
  TilburgAbout,
  TilburgHero,
  TilburgIntro,
  TilburgSubjects,
} from '@components';

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
];

const AcHome = ({ store }) => {
  return (
    <>
      <TilburgIntro />
      <TilburgHero />
      <TilburgSubjects
        heading='Zoeken op onderwerp'
        paragraph='Bekijk alle documenten van belangrijke onderwerpen die spelen binnen de gemeente Tilburg.'
        showLink
        subjects={subjectsDummyData}
      />
      <TilburgAbout />
    </>
  );
};

export default withStore(observer(AcHome));
