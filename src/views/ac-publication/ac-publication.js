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

  const getFilteredAttachements = (primary = false) => {
    const filteredAttachmentsLabel = get_single?.attachments?.filter((attachment) =>
      primary ? attachment?.labels?.length > 0 : attachment?.labels?.length === 0
    );

    const filteredAttachments = [];
    filteredAttachmentsLabel &&
      filteredAttachmentsLabel.forEach((attachment) => {
        for (let i = 1; i <= attachment.labels.length; i++) {
          filteredAttachments.push({
            ...attachment,
            labels: [attachment.labels[i - 1]],
          });
        }
      });

    return primary ? filteredAttachments : filteredAttachmentsLabel;
  };

  const mapAttachmentRow = (row, primary) => {
    if (!primary) {
      return [
        <AcLink to={row.accessUrl} target='_blank'>
          <VISUALS.DOCUMENT />
          <Link>{`${row.title}.${row.extension}` || 'Naamloos bestand'}</Link>
        </AcLink>,
      ];
    }

    return [
      <AcLink to={row.accessUrl} target='_blank'>
        <VISUALS.DOCUMENT />
        <Link>{`${row.title}.${row.extension}` || 'Naamloos bestand'}</Link>
      </AcLink>,
      row.labels[0] || LABELS.UNKNOWN,
      acFormatDate(row?.published, 'YYYY-MM-DD', 'DD MMMM YYYY') || LABELS.UNKNOWN,
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

          {/* Show only when there are primary attachments */}
          {getFilteredAttachements(true)?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
              <AcFlex spacing={'xs'} className='notice'>
                <VISUALS.INFO />
                Documenten worden in een nieuw tabblad geopend.
              </AcFlex>
              <AcTable
                header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
                rows={getFilteredAttachements(true)?.map((attachment) =>
                  mapAttachmentRow(attachment, true)
                )}
              />
            </div>
          )}

          {/* Show only if there are secondary attachments */}
          {getFilteredAttachements()?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>
              <AcTable
                header={[LABELS.DOCUMENT]}
                rows={getFilteredAttachements()?.map((attachment) =>
                  mapAttachmentRow(attachment)
                )}
              />
            </div>
          )}

          <div>
            <Heading level={2}>Aanvullende informatie</Heading>
            <AcTable
              rows={[
                ['Zaaknummer', get_single?.reference || LABELS.UNKNOWN],
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
              ]}
            />
          </div>
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
