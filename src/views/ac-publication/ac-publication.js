import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import { AcFormatDate } from '@utils';
import acFormatDate from '@src/utilities/ac-format-date';

const AcPublication = ({ store: { documents } }) => {
  const { id } = useParams();
  const {
    fetchDocument,
    resetDocument,
    get_single,
    loading,
    getSearchPageURL,
    get_attachments,
  } = documents;

  useEffect(() => {
    fetchDocument(id);
    return () => resetDocument();
  }, []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  const mapAttachmentRow = (row, primary) => {
    if (!primary) {
      return [
        <AcLink to={row.url}>
          <VISUALS.DOCUMENT />
          <Link>{row.title || 'Naamloos bestand'}</Link>
        </AcLink>,
      ];
    }

    return [
      <AcLink to={row.url}>
        <VISUALS.DOCUMENT />
        <Link>{row.title || 'Naamloos bestand'}</Link>
      </AcLink>,
      row.labels[0] || LABELS.UNKNOWN,
      acFormatDate(row?._self?.dateCreated, 'YYYY-MM-DD', 'DD MMMM YYYY') ||
        LABELS.UNKNOWN,
    ];
  };

  return (
    <>
      <AcContainer compact margin='xl'>
        <AcFlex column spacing={'lg'}>
          <Heading>{get_single?.title}</Heading>

          <AcCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.summary || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
          </AcCard>

          <div>
            <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
            <AcTable
              header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
              rows={get_attachments(true)?.map((attachment) =>
                mapAttachmentRow(attachment, true)
              )}
            />
          </div>

          <div>
            <Heading level={2}>Bijlagen</Heading>
            <AcTable
              header={[LABELS.DOCUMENT]}
              rows={get_attachments()?.map((attachment) =>
                mapAttachmentRow(attachment)
              )}
            />
          </div>

          <div>
            <Heading level={2}>Aanvullende informatie</Heading>
            <AcTable
              rows={[
                ['Zaaknummer', '???'],
                [
                  LABELS.CATEGORY,
                  <AcLink
                    href={getSearchPageURL({
                      category: [get_single?.category],
                    })}
                  >
                    {get_single?.category}
                  </AcLink>,
                ],
                ['Onderwerp', <Link>Duurzaamheid</Link>],
              ]}
            />
          </div>
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
