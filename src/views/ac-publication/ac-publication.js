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
import { LABELS } from '@constants';

const AcPublication = ({ store: { documents } }) => {
  const { id } = useParams();

  const { fetchDocument, resetDocument, get_single, loading } = documents;

  useEffect(() => {
    fetchDocument(id);
    return () => resetDocument();
  }, []);

  useEffect(() => {
    console.log(get_single);

    document.title = get_single?.titel || 'Open Tilburg | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <TilburgLoader />;
  }

  const mapAttachmentRow = (row) => {
    return [
      <Link href={row.url}>{row.titel}</Link>,
      row.type || LABELS.UNKNOWN,
      row.datum || LABELS.UNKNOWN,
    ];
  };

  return (
    <>
      <TilburgContainer compact margin='xl'>
        <TilburgFlex column spacing={'lg'}>
          <Heading>{get_single?.titel}</Heading>

          <TilburgCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.samenvatting || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
          </TilburgCard>

          <div>
            <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
            <Paragraph>Er zijn geen hoofddocumenten beschikbaar.</Paragraph>
          </div>

          <div>
            <Heading level={2}>Bijlagen</Heading>
            <TilburgTable
              header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
              rows={get_single.bijlagen.map((attachment) =>
                mapAttachmentRow(attachment)
              )}
            />
          </div>

          <div>
            <Heading level={2}>Aanvullende informatie</Heading>
            <TilburgTable
              rows={[
                ['Zaaknummer', 1922973],
                [LABELS.CATEGORY, <Link>Woo-verzoek</Link>],
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
