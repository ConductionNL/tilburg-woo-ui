import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Link,
  Button,
  BadgeCounter,
} from '@utrecht/component-library-react/dist/css-module';

import { LABELS, VISUALS } from '@constants';
import { AcGetAdditionalInfoRow } from '@src/services/ac-get-additional-info-row';
import { Pagination } from '@amsterdam/design-system-react';
import { Heading2, Heading3 } from '@utrecht/component-library-react';
import { AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import _ from 'lodash';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';

const AcPublicationSoftwarecatalogus = ({ store: { publications } }) => {
  const {
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
    get_relations,
    resetRelations,
    resetPublication,
    fetchRelations,
    fetchPublication,
  } = publications;

  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  const publicationTypes = get_relations
    ?.filter((relation) => {
      if (relation.publicationType.title !== get_single.publicationType.title) {
        return relation.publicationType;
      }
    })
    .map((relation) => relation.publicationType);

  const uniquePublicationTypes = _.uniqBy(publicationTypes, 'title');

  const mapTabRow = (row) => {
    return [
      <span key={row.id}>{row.title}</span>,
      <span key={row.id}>{row.summary || 'Geen samenvatting beschikbaar'}</span>,
      <span key={row.id}>{row.catalog.title || 'Geen catalogus beschikbaar'}</span>,
      <AcLink key={row.id} to={`/publicatie/${row.id}`} onClick={() => TabOnClick(row.id)}>
        <VISUALS.ARROW_RIGHT />
        <Link>Bekijk</Link>
      </AcLink>,
    ];
  };

  const TabOnClick = (id) => {
    resetRelations();
    resetPublication();
    fetchPublication(id).then(() => {
      fetchRelations(get_single.uri);
    });
  };

  return (
    <>
      <AcContainer compact margin='xl' className={'ac-publication-container'}>
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
            <Heading level={2}>Omschrijving</Heading>
            <Paragraph>
              {get_single?.description || 'Geen omschrijving beschikbaar'}
            </Paragraph>
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
              <Heading level={2}>{'Downloads'}</Heading>
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
            <AcFlex spacing={'xs'} className='notice'>
              <VISUALS.INFO />
              Links worden in een nieuw tabblad geopend.
            </AcFlex>
            <AcTable rows={AcGetAdditionalInfoRow(get_single, getSearchPageURL)} />
          </div>

          <div className='ac-publication-three-column'>
            {/* <div>
              <Heading2 className='ac-publication-three-column-item-heading'>Applicatie</Heading2>
              <div className='ac-publication-three-column-item'>
                <span>Geen applicatie beschikbaar</span>
              </div>
            </div> */}
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
            {/* <div>
              <Heading2 className='ac-publication-three-column-item-heading'>Beoordeling</Heading2>
              <div className='ac-publication-three-column-item'>
                <span>Geen beoordeling beschikbaar</span>
              </div>
            </div> */}
          </div>

          {uniquePublicationTypes && uniquePublicationTypes.length > 0 && (
            <AcTabs
              selectedIndex={tabIndex}
              onSelect={(index) => setTabIndex(index)}
            >
              <AcTabList>
                {uniquePublicationTypes &&
                  uniquePublicationTypes.map((publicationType, idx) => (
                    <AcTab key={idx} selected={tabIndex === idx}>
                      <span>{publicationType.title}</span>
                      <BadgeCounter className='ac-publication-badge-counter'>
                        {
                          get_relations?.filter(
                            (relation) =>
                              relation.publicationType.title ===
                              publicationType.title
                          ).length
                        }
                      </BadgeCounter>
                    </AcTab>
                  ))}
              </AcTabList>
              {uniquePublicationTypes &&
                uniquePublicationTypes.map((publicationType, idx) => (
                  <AcTabPanel key={idx} selected={tabIndex === idx}>
                    <AcTable
                      header={['Naam', 'Samenvatting', 'Catalogus']}
                      rows={get_relations
                        ?.filter(
                          (relation) =>
                            relation.publicationType.title === publicationType.title
                        )
                        .map((relation) => mapTabRow(relation))}
                    />
                  </AcTabPanel>
                ))}
            </AcTabs>
          )}
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublicationSoftwarecatalogus));
