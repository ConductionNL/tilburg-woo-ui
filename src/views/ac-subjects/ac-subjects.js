import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { useEffect } from 'react';
import { AcContainer, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCardCategory, AcLink } from '@molecules';
import { LABELS, ROUTES, VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcGrid from '@atoms/ac-grid/ac-grid';

const subjects = [
  {
    id: 1,
    image: '/card-placeholder-1.png',
    title: 'Campus Wijkevoort',
    paragraph:
      'Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.',
    linkTitle: 'Bekijk 209 documenten',
  },
  {
    id: 2,
    image: '/card-placeholder-2.png',
    title: 'Evenementen in Tilburg',
    paragraph:
      'Tilburg is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    id: 3,
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
  {
    id: 4,
    image: '/card-placeholder-1.png',
    title: 'Campus Wijkevoort',
    paragraph:
      'Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.',
    linkTitle: 'Bekijk 209 documenten',
  },
  {
    id: 5,
    image: '/card-placeholder-2.png',
    title: 'Evenementen in Tilburg',
    paragraph:
      'Tilburg is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    id: 6,
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
  {
    id: 7,
    image: '/card-placeholder-1.png',
    title: 'Campus Wijkevoort',
    paragraph:
      'Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook samen innoveren en medewerkers opleiden.',
    linkTitle: 'Bekijk 209 documenten',
  },
  {
    id: 8,
    image: '/card-placeholder-2.png',
    title: 'Evenementen in Tilburg',
    paragraph:
      'Tilburg is genomineerd voor ‘Evenementenstad van het jaar’. Bekijk alle publicaties over dit onderwerp.',
    linkTitle: 'Bekijk 511 documenten',
  },
  {
    id: 9,
    image: '/card-placeholder-3.png',
    title: 'Duurzaamheid',
    paragraph:
      'Tilburg is onderweg naar een duurzame stad. Bekijk alle beslissingen omtrent het duurzame stadsbeleid.',
    linkTitle: 'Bekijk 3.040 documenten',
  },
];

const AcSubjects = ({ store: { documents } }) => {
  const { fetchAggregations } = documents;

  useEffect(() => {
    fetchAggregations();
  }, []);

  return (
    <AcSection className='ac-subjects' spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.SUBJECTS}</Heading>
            <Paragraph>
              Op de campus gaan bedrijven, onderwijs – en onderzoeksinstellingen ook
              samen innoveren en medewerkers opleiden
            </Paragraph>
          </AcColumn>
          <AcGrid row={3}>
            {subjects.map((subject, index) => (
              // <AcCardCategory key={index} {...subject} />
              <AcCardCategory
                key={index}
                {...subject}
                linkUrl={`${ROUTES.SEARCH}?themes[]=${subject.id}`}
              />
            ))}
          </AcGrid>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcSubjects));
