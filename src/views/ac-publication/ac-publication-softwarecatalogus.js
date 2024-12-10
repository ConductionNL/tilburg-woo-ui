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
import acFormatDate from '@src/utilities/ac-format-date';
import { Pagination } from '@amsterdam/design-system-react';
import { Heading2 } from '@utrecht/component-library-react';
import { AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import _ from 'lodash';

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

  const tabsContent = JSON.parse(get_single?.data?.tabsData || '{}');

  const publicationTypes = get_relations?.map((relation) => relation.publicationType);
  const uniquePublicationTypes = _.uniqBy(publicationTypes, "title")


  const mapAttachmentRow = (row, primary) => {
    // Fallback for when there is no extension property
    const extension = row.type.split('/').pop();

    if (!primary) {
      return [
        <AcLink to={row.accessUrl} target='_blank'>
          <VISUALS.DOCUMENT />
          <Link>
            {`${row.title}.${row.extension ?? extension}` || 'Naamloos bestand'}
          </Link>
        </AcLink>,
      ];
    }

    return [
      <AcLink to={row.accessUrl} target='_blank'>
        <VISUALS.DOCUMENT />
        <Link>
          {`${row.title}.${row.extension ?? extension}` || 'Naamloos bestand'}
        </Link>
      </AcLink>,
      row.labels[0] || LABELS.UNKNOWN,
      acFormatDate(row?.published, 'YYYY-MM-DD', 'DD MMMM YYYY') || LABELS.UNKNOWN,
    ];
  };

  const mapTabRow = (row) => {
    return [
      <span>{row.title}</span>,
      <span>{row.description || 'Geen omschrijving beschikbaar'}</span>,
      <span>{row.catalog.title || 'Geen catalogus beschikbaar'}</span>,
      <AcLink  to={`/publicatie/${row.id}`} onClick={() => TabOnClick(row.id)}>
        <VISUALS.ARROW_RIGHT />
        <Link>
          Bekijk
        </Link>
      </AcLink>,
    ];
  };

  const TabOnClick = (id) => {
    resetRelations(); 
    resetPublication();    
    fetchPublication(id).then(() => {
        fetchRelations(get_single.uri)    
    });
  }
  

  return (
    <>
      <AcContainer compact margin='xl' className={'ac-publication-container'}>
        <AcFlex column spacing={'lg'}>
          <div className='ac-publication-header'>
            <Heading>{get_single?.title}</Heading>
            { <img src={get_single?.image} className='ac-publication-header-image'></img>}
          </div>

          <AcCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.summary || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
          </AcCard>

          {get_single?.data?.github_url && (
            <div className='ac-publication-buttons'>
              <Button onClick={() => window.open(get_single?.data?.github_url, '_blank')}>
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
                  mapAttachmentRow(attachment, true)
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
                  )?.map((attachment) => mapAttachmentRow(attachment))}
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
                [
                  LABELS.CATEGORY,
                  <>
                  {get_single?.category ? 
                  <AcLink
                  href={getSearchPageURL({
                      category: [get_single?.category],
                    })}
                    >
                    {get_single?.category} 
                  </AcLink>
                        :
                        <span>{'-'}</span>
                  }
                  </>
                ],
                [
                  "Licentie",
                  <span>{get_single?.license || '-'}</span>
                ],
                [
                  "Status",
                  <span>{get_single?.data?.status || '-'}</span>
                ],
                [
                  "Software type",
                  <span>{get_single?.data?.software_type || '-'}</span>
                ],
                [
                  "Onderhouds type",
                  <span>{get_single?.data?.maintenance_type || '-'}</span>
                ]
              ]}
            />
          </div>
            <div className='ac-publication-three-column'>
              <div>
                <Heading2>Applicatie</Heading2>
                <div className='ac-publication-three-column-item'><span>Geen applicatie beschikbaar</span></div>
              </div>
              <div>
                <Heading2>Organisatie</Heading2>
                <div className='ac-publication-three-column-item'><span>Geen organisatie beschikbaar</span></div>
              </div>
              <div>
                <Heading2>Beoordeling</Heading2>
                <div className='ac-publication-three-column-item'><span>Geen beoordeling beschikbaar</span></div>
              </div>


            </div>
            {uniquePublicationTypes && uniquePublicationTypes.length > 0 && (
            <AcTabs  selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
              <AcTabList>
                
              {uniquePublicationTypes && uniquePublicationTypes.map((publicationType, idx) => (

                <AcTab selected={tabIndex === idx}>
                  <span>{publicationType.title}</span>
                  <BadgeCounter className="ac-publication-badge-counter">
                    {get_relations?.filter((relation) => relation.publicationType.title === publicationType.title).length}
                  </BadgeCounter>

                </AcTab>
              
              ))}
              </AcTabList>
              {uniquePublicationTypes && uniquePublicationTypes.map((publicationType, idx) => (
              <AcTabPanel selected={tabIndex === idx}>
                  <AcTable
                    header={['Naam', 'Omschrijving', 'Catalogus']}
                    rows={get_relations?.filter((relation) => relation.publicationType.title === publicationType.title).map((relation) => mapTabRow(relation))}
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
