import { useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader, AcDrawer, AcTabList, AcSearchFilter, AcModal } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Textbox,
  SecondaryActionButton,
  Button,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { Pagination } from '@amsterdam/design-system-react';
import { StatusBadge, Heading2, Heading3 } from '@utrecht/component-library-react';
import _ from 'lodash';
import { MOCK_CONCEPTS } from '@constants/mock.data.constants';
import { AcGetAdditionalInfoRow } from '@src/services/ac-get-additional-info-row';

const AcPublication = observer(({ store: { publications } }) => {
  const {
    // fetchPublication,
    // resetPublication,
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
    setAttachmentSearch,
    attachmentSearch,
    // fetchAttachments,
    attachments,
    // resetAttachments,
  } = publications;

  const drawerRef = useRef(null);
  const modalRef = useRef(null);

  const [filteredAllConcepts, setFilteredAllConcepts] = useState(
    MOCK_CONCEPTS.allConcepts
  );
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'error'

  const handleAllConceptsSearch = (searchTerm) => {
    const filtered = MOCK_CONCEPTS.allConcepts.filter((concept) =>
      concept.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAllConcepts(filtered);
    return filtered.length;
  };

  const handleAttachmentSearch = (searchTerm) => {
    setAttachmentSearch(searchTerm);
    return getFilteredAttachments(false)?.length || 0;
  };

  const tabs = [
    {
      title: 'Deze pagina',
      content: (
        <>
          {MOCK_CONCEPTS.pageConcepts.map((concept) => (
            <AcFlex column key={concept.title}>
              <Heading level={3}>{concept.title}</Heading>
              <Paragraph>{concept.description}</Paragraph>
            </AcFlex>
          ))}
        </>
      ),
    },
    {
      title: 'Alle begrippen',
      content: (
        <>
          <AcSearchFilter
            onSearch={handleAllConceptsSearch}
            ariaLabel='Zoek in alle begrippen'
            label='Zoek in alle begrippen'
            searchIconOnly={true}
          />
          {filteredAllConcepts.map((concept) => (
            <AcFlex column key={concept.title}>
              <Heading level={3}>{concept.title}</Heading>
              <Paragraph>{concept.description}</Paragraph>
            </AcFlex>
          ))}
        </>
      ),
    },
  ];

  // useEffect(() => {
  //   fetchPublication(id);
  //   fetchAttachments(id);
  //   return () => {
  //     resetPublication();
  //     resetAttachments();
  //   };
  // }, []);

  // useEffect(() => {
  //   document.title = get_single?.title || 'Gemeente | Publicatie';
  // }, [get_single]);

  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  const openDrawer = () => {
    drawerRef.current?.showModal();
  };

  const openDialog = () => {
    modalRef.current?.showModal();
  };

  const copyLink = async () => {
    try {
      // Get the base URL (will be the actual domain in production)
      const baseUrl = window.location.origin;
      // Construct the publication URL
      const url = `${baseUrl}/publicatie/${get_single?.id}`;

      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');

      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      setCopyStatus('error');
    }
  };

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copied':
        return LABELS.COPY_LINK_SUCCESS;
      case 'error':
        return LABELS.COPY_LINK_ERROR;
      default:
        return LABELS.COPY_LINK;
    }
  };

  const mapAttachmentRow = (row, primary) => {
    // Fallback for when there is no extension property

    const formatFileSize = (bytes) => {
      if (!bytes) return '-';
      const mb = bytes / (1024 * 1024);
      if (mb >= 1) {
        return `${Math.round(mb)} MB`;
      }
      return `${Math.round(bytes / 1024)} KB`;
    };

    if (!primary) {
      return [
        <AcLink key={row.accessUrl} to={row.accessUrl} target='_blank'>
          {`${row.title}` || 'Naamloos bestand'}
          <span className='sr-only'>Opent in een nieuw tabblad</span>
          <VISUALS.EXTERNAL_LINK_PINK />
        </AcLink>,
        formatFileSize(row.size),
      ];
    }

    return [
      <AcLink key={row.accessUrl} to={row.accessUrl} target='_blank'>
        {`${row.title}` || 'Naamloos bestand'}
        <span className='sr-only'>Opent in een nieuw tabblad</span>
        <VISUALS.EXTERNAL_LINK_PINK />
      </AcLink>,
      _.upperFirst(row.labels[0]) || LABELS.UNKNOWN,
      acFormatDate('2025-02-19T08:43:54Z', 'YYYY-MM-DD', 'DD MMMM YYYY') ||
        LABELS.UNKNOWN,
      formatFileSize(row.size),
    ];
  };

  const renderPrimaryAttachments = useMemo(() => {
    if (!getFilteredAttachments(true)?.length) {
      return null;
    }

    return (
      <AcFlex column>
        <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
        <AcFlex spacing={'xs'} className='notice'>
          <VISUALS.INFO />
          Documenten worden in een nieuw tabblad geopend.
        </AcFlex>
        <AcTable
          header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE, LABELS.SIZE]}
          rows={getFilteredAttachments(true)?.map((attachment) =>
            mapAttachmentRow(attachment, true)
          )}
        />
      </AcFlex>
    );
  }, [get_single]);

  const renderAttachments = () => {
    const allAttachments = getFilteredAttachments(false);

    if (!allAttachments?.length) {
      return null;
    }

    const totalItems = allAttachments.length;
    const totalPages = Math.ceil(totalItems / attachmentPagination.perPage);
    const paginatedAttachments = getFilteredAttachments(
      false,
      attachmentPagination.page
    );

    return (
      <AcFlex column>
        <AcFlex spacing={'md'} column>
          <AcFlex alignItems='center' spacing='snail'>
            <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>{' '}
            <StatusBadge>{totalItems}</StatusBadge>
          </AcFlex>
          <AcSearchFilter
            onSearch={handleAttachmentSearch}
            initialValue={attachmentSearch}
            label='Zoek in bijlagen'
            placeholder='Welk document zoek je?'
          />
          <AcTable
            header={[LABELS.DOCUMENT, LABELS.SIZE]}
            rows={toJS(paginatedAttachments)?.map((attachment) =>
              mapAttachmentRow(attachment)
            )}
          />
          {totalItems > attachmentPagination.perPage && (
            <Pagination
              totalPages={totalPages}
              page={attachmentPagination.page}
              nextLabel=''
              previousLabel=''
              onPageChange={(page) => setAttachmentsPage(page)}
            />
          )}
        </AcFlex>
      </AcFlex>
    );
  };

  return (
    <>
      <AcContainer compact margin='xl'>
        <AcFlex column spacing={'lg'}>
          <div className='ac-publication-header'>
            <Heading>{get_single?.title}</Heading>
            {
              <img
                src={get_single?.image}
                className='ac-publication-header-image'
              ></img>
            }
          </div>

          <AcCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.summary || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
            <SecondaryActionButton style='button' onClick={openDrawer}>
              <VISUALS.LIST_ALT />
              {LABELS.CONCEPTS_LIST}
            </SecondaryActionButton>
          </AcCard>

          {get_single?.data?.github_url && (
            <div className='ac-publication-buttons'>
              <Button
                onClick={() => window.open(get_single?.data?.github_url, '_blank')}
              >
                <VISUALS.GITHUB />
                <span>Bekijk op Repository</span>
              </Button>
              <Button>
                <VISUALS.COMMON_GROUND />
                <span>Common Ground Beoordeling</span>
              </Button>
            </div>
          )}

          {renderPrimaryAttachments}
          {renderAttachments()}

          <AcFlex column>
            <Heading level={2}>{LABELS.ADDITIONAL_INFO}</Heading>
            <AcTable
              rows={AcGetAdditionalInfoRow(get_single, getSearchPageURL, true)}
            />
          </AcFlex>

          <div className='ac-publication-three-column'>
            <div>
              <Heading2 className='ac-publication-three-column-item-heading'>
                Organisatie
              </Heading2>
              {get_single?.organization ? (
                <div className='ac-publication-organization-card'>
                  <AcCard>
                    <div className='ac-publication-organization-card-content'>
                      <div className='ac-publication-organization-card-header'>
                        <Heading3>{get_single?.organization?.title}</Heading3>
                        {get_single?.organization?.image && (
                          <div className='ac-publication-organization-card-logo-container'>
                            <img
                              src={get_single?.organization?.image}
                              className='ac-publication-organization-card-logo'
                            ></img>
                          </div>
                        )}
                      </div>
                      <Paragraph className='ac-publication-organization-card-description'>
                        {get_single?.organization?.summary ||
                          'Geen omschrijving beschikbaar'}
                      </Paragraph>
                    </div>
                  </AcCard>
                </div>
              ) : (
                <div className='ac-publication-three-column-item'>
                  <span>Geen organisatie beschikbaar</span>
                </div>
              )}
            </div>
          </div>
          <SecondaryActionButton style='button' onClick={openDialog}>
            <VISUALS.SHARE />
            Link delen
          </SecondaryActionButton>
        </AcFlex>
      </AcContainer>

      <AcDrawer id='concepts-drawer' ref={drawerRef} title={LABELS.CONCEPTS_LIST}>
        <AcTabList tabs={tabs} />
      </AcDrawer>

      <AcModal
        id='share-modal'
        ref={modalRef}
        title={LABELS.SHARE_MODAL}
        disableDefaultButton
        buttons={[
          {
            label: getCopyButtonText(),
            onClick: copyLink,
            shareLink: true,
            shareLinkStatus: copyStatus,
          },
        ]}
      >
        <AcFlex column spacing='sm'>
          <Paragraph>Kopieer de link naar uw klembord.</Paragraph>
          <Textbox
            value={`${window.location.origin}/publicatie/${get_single?.id}`}
            readOnly
          />
          <div role='status' aria-live='polite' className='sr-only'>
            {copyStatus === 'copied' && 'De link is gekopieerd naar uw klembord'}
            {copyStatus === 'error' && 'Het kopiëren van de link is mislukt'}
          </div>
        </AcFlex>
      </AcModal>
    </>
  );
});

export default withStore(AcPublication);
