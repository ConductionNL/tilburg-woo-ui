import { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import { Pagination } from '@amsterdam/design-system-react';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

const AcPublicationWooVerzoek = ({ store: { publications, user } }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
  } = publications;

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer compact margin='xl'>
        <AcFlex column spacing={'lg'}>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
            <Heading>{get_single?.title}</Heading>
            {get_single?.['@self'] && (
              <ConDetailsActionsMenu
                user={user}
                id={id}
                schemaSlug={get_single?.['@self']?.schema?.slug}
                title={get_single?.title}
                published={get_single?.['@self']?.published}
                object={get_single}
                showViewAction={false}
                showEditAction={true}
                showPublishActions={true}
                onDelete={handleDelete}
                onEdit={() => {
                  const schemaSlug = get_single?.['@self']?.schema?.slug;
                  if (schemaSlug) {
                    const wizards = Object.values(DASHBOARD_WIZARDS);
                    const wizard = wizards.find((w) => w.schema === schemaSlug);

                    if (wizard) {
                      const baseUrl = getWizardUrl(wizard);
                      const url = new URL(baseUrl, window.location.origin);
                      url.searchParams.set('id', id);
                      navigate(url.pathname + url.search);
                      return;
                    }
                  }
                  // Fallback to beheer legacy edit page in new tab
                  const beheerUrl = `/beheer/${get_single?.['@self']?.schema?.slug}/${id}`;
                  window.open(beheerUrl, '_blank');
                }}
                triggerStyle='button'
              />
            )}
          </AcFlex>

          <AcCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.summary || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
          </AcCard>

          {/* Show only when there are primary attachments */}
          {getFilteredAttachments(true)?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
              <AcFlex spacing={'xs'} className='notice'>
                <VISUALS.INFO />
                Documenten worden in een nieuw tabblad geopend.
              </AcFlex>
              <AcTable
                header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
                rows={getFilteredAttachments(true)?.map((attachment) =>
                  AcMappedAttachmentRow(attachment, true)
                )}
              />
            </div>
          )}

          {/* Show only if there are secondary attachments */}
          {getFilteredAttachments()?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>
              <AcFlex spacing={'md'} column>
                <AcTable
                  header={[LABELS.DOCUMENT]}
                  rows={getFilteredAttachments(
                    false,
                    attachmentPagination.page
                  )?.map((attachment) => AcMappedAttachmentRow(attachment))}
                />
                {getFilteredAttachments()?.length > attachmentPagination.perPage && (
                  <Pagination
                    totalPages={getFilteredAttachments().length}
                    page={1}
                    nextLabel=''
                    previousLabel=''
                    onPageChange={(page) => setAttachmentsPage(page)}
                  />
                )}
              </AcFlex>
            </div>
          )}

          <div>
            <Heading level={2}>{LABELS.ADDITIONAL_INFO}</Heading>
            <AcTable
              rows={[
                [LABELS.CASE_NUMBER, get_single?.reference || LABELS.UNKNOWN],
                [
                  LABELS.CATEGORY,
                  <AcLink
                    key={get_single?.category}
                    href={getSearchPageURL({
                      category: [get_single?.category],
                    })}
                  >
                    {get_single?.category}
                  </AcLink>,
                ],
                [
                  LABELS.THEMES,
                  get_single?.themes?.length
                    ? get_single?.themes?.map((theme) => (
                        <AcLink
                          key={theme.id}
                          href={getSearchPageURL({
                            themes: [theme.id],
                          })}
                        >
                          {theme.title}
                        </AcLink>
                      ))
                    : '-',
                ],
              ]}
            />
          </div>

          <AcGenericBeheerDeleteModal
            objects={get_single?.['@self'] ? [get_single] : []}
            showModal={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={() => navigate('/zoeken')}
          />
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublicationWooVerzoek));
