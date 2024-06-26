import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';

import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgLoader } from '@components';
import { TilburgTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Link,
} from '@utrecht/component-library-react/dist/css-module';

const AcPublication = ({ store: { documents } }) => {
  const { id } = useParams();

  const { fetchDocument, get_single, loading } = documents;

  useEffect(() => {
    fetchDocument(id);
  }, [id]);

  useEffect(() => {
    console.log(get_single);

    document.title = get_single?.titel || 'Open Tilburg | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <TilburgLoader />;
  }

  const mapRow = (row) => {
    return [
      <Link href={row.url}>{row.titel}</Link>,
      row.type || 'Onbekend',
      row.datum || 'Onbekend',
    ];
  };

  return (
    <>
      <TilburgContainer compact margin='xl'>
        <TilburgFlex column spacing={'md'}>
          <Heading>{get_single?.titel}</Heading>

          <TilburgCard blue>
            <Heading level={2}>Samenvatting</Heading>
            <Paragraph>{get_single?.samenvatting}</Paragraph>
          </TilburgCard>

          <div>
            <Heading level={2}>Hoofddocumenten</Heading>
            <Paragraph>Er zijn geen hoofddocumenten beschikbaar.</Paragraph>
          </div>

          <div>
            <Heading level={2}>Bijlagen</Heading>
            <TilburgTable
              header={['Document', 'Type', 'Datum']}
              rows={get_single.bijlagen.map((bijlage) => mapRow(bijlage))}
            />
          </div>

          <div>
            <Heading level={2}>Aanvullende informatie</Heading>
            <TilburgTable
              rows={[
                ['Zaaknummer', 1922973],
                ['Categorie', <Link>Woo-verzoek</Link>],
                ['Onderwerp', <Link>Duurzaamheid</Link>],
              ]}
            />
          </div>
        </TilburgFlex>
      </TilburgContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
