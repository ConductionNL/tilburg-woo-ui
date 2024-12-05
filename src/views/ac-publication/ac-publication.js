import { useEffect, useState } from 'react';
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
  Button,
  BadgeCounter,
} from '@utrecht/component-library-react/dist/css-module';

import { LABELS, VISUALS } from '@constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { Pagination } from '@amsterdam/design-system-react';
import { Heading2 } from '@utrecht/component-library-react';
import { AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';

const AcPublication = ({ store: { publications } }) => {
  const { id } = useParams();
  const {
    fetchPublication,
    resetPublication,
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
  } = publications;

  useEffect(() => {
    fetchPublication(id);
    return () => resetPublication();
  }, []);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  const tabsContent = JSON.parse(get_single?.data?.tabsData || '{}');

  const getTableRows = (publication) => {
    let tableRows = [];
    // TODO: Add other publication types and bring page to different templates
    switch (publication?.publicationType?.title) {
      case 'Softwarecatalogus':
        tableRows = [
          [
            LABELS.CATEGORY,
            <AcLink
              href={getSearchPageURL({
                category: [publication?.category],
              })}
            >
              {publication?.category}
            </AcLink>,
          ],
          [
            "Licentie",
            <span>{publication?.license || '-'}</span>
          ],
          [
            "Status",
            <span>{publication?.data?.status || '-'}</span>
          ],
          [
            "Software type",
            <span>{publication?.data?.software_type || '-'}</span>
          ],
          [
            "Onderhouds type",
            <span>{publication?.data?.maintenance_type || '-'}</span>
          ],
          [
            "Products",
            <span className='ac-publication-products'>
              {
                JSON.parse(get_single?.data?.products || '{}')?.length > 0 ?
                  JSON.parse(get_single?.data?.products || '{}')?.map((product, idx) => <AcLink href={product.url}>{product.label}{idx < JSON.parse(get_single?.data?.products || '{}')?.length - 1 ? ', ' : ''} </AcLink>)
                  : '-'
              }
            </span>
          ],
        ]
        break;
      case 'Woo-verzoeken en -besluiten':
        tableRows = [
          [LABELS.CASE_NUMBER, publication?.reference || LABELS.UNKNOWN],
          [
            LABELS.CATEGORY,
            <AcLink
              href={getSearchPageURL({
                category: [publication?.category],
              })}
            >
              {publication?.category}
            </AcLink>,
          ],
          [
            LABELS.THEMES,
            publication?.themes?.length
              ? publication?.themes?.map((theme) => (
                <AcLink
                  href={getSearchPageURL({
                    themes: [theme.id],
                  })}
                >
                  {theme.title}
                </AcLink>
              ))
              : '-',
          ]
        ]
        break;
      default:
        tableRows = [
          [LABELS.CASE_NUMBER, publication?.reference || LABELS.UNKNOWN],
          [
            LABELS.CATEGORY,
            <AcLink
              href={getSearchPageURL({
                category: [publication?.category],
              })}
            >
              {publication?.category}
            </AcLink>,
          ],
          [
            LABELS.THEMES,
            publication?.themes?.length
              ? publication?.themes?.map((theme) => (
                <AcLink
                  href={getSearchPageURL({
                    themes: [theme.id],
                  })}
                >
                  {theme.title}
                </AcLink>
              ))
              : '-',
          ]
        ]
        break;
    }
    return tableRows;
  }



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

  const mapDependencyRow = (row) => {
    return [
      <span>{row.name}</span>,
      <span>{row.version}</span>,
      <span>{row.description}</span>,
      <AcLink to={row.viewLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>
          Bekijk
        </Link>
      </AcLink>,
      <AcLink to={row.downloadLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>
          Download
        </Link>
      </AcLink>,
    ];
  };
  const mapReuseRow = (row) => {
    return [
      <span>{row.name}</span>,
      <AcLink to={row.website} target='_blank'>
        <VISUALS.WORLD />
        <Link>
          Website
        </Link>
      </AcLink>,
      <AcLink to={row.github} target='_blank'>
        <VISUALS.GITHUB />
        <Link>
          Github
        </Link>
      </AcLink>,
    ];
  };
  const mapConfigurationRow = (row) => {
    return [
      <span>{row.name}</span>,
      <span>{row.organization}</span>,
      <span>{row.supports}</span>,
      <AcLink to={row.viewLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>
          Bekijk
        </Link>
      </AcLink>,
      <AcLink to={row.downloadLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>
          Download
        </Link>
      </AcLink>,
    ];
  };

  return (
    <>
      <AcContainer compact margin='xl' className={get_single?.publicationType?.title === 'Softwarecatalogus' && 'ac-publication-container'}>
        <AcFlex column spacing={'lg'}>
          <div className='ac-publication-header'>
            <Heading>{get_single?.title}</Heading>
            {get_single?.publicationType?.title === 'Softwarecatalogus' && <img src={get_single?.image} className='ac-publication-header-image'></img>}
          </div>

          <AcCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.summary || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
          </AcCard>

          {get_single?.publicationType?.title === 'Softwarecatalogus' && get_single?.data?.github_url && (
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
              <Heading level={2}>{get_single?.publicationType?.title === 'Softwarecatalogus' ? 'Downloads' : LABELS.DOCUMENTS_SECONDARY}</Heading>
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
              rows={getTableRows(get_single)}
            />
          </div>
          {get_single?.publicationType?.title === 'Softwarecatalogus' && (
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
          )}
          {(get_single?.publicationType?.title === 'Softwarecatalogus' || get_single?.catalog?.title === 'Softwarecatalogus') && (
            <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
              <AcTabList>
                <AcTab selected={tabIndex === 0}>
                  <span>Componenten & Afhankelijkheden</span>
                  <BadgeCounter className="ac-publication-badge-counter">
                    {tabsContent?.dependencies?.length ?? 0}
                  </BadgeCounter>

                </AcTab>
                <AcTab>
                  <span>Hergebruik</span>
                  <BadgeCounter className="ac-publication-badge-counter">
                    {tabsContent?.reuse?.length ?? 0}
                  </BadgeCounter>
                </AcTab>
                <AcTab>
                  <span >Configuraties</span>
                  <BadgeCounter className="ac-publication-badge-counter">
                    {tabsContent?.configurations?.length ?? 0}
                  </BadgeCounter>
                </AcTab>
              </AcTabList>
              <AcTabPanel selected={tabIndex === 0}>
                {tabsContent?.dependencies?.length > 0 && (
                  <AcTable
                    header={['Naam', 'Versie', 'Omschrijving']}
                    rows={tabsContent?.dependencies?.map((configuration) => mapDependencyRow(configuration))}
                  />
                )}
                {!tabsContent?.dependencies?.length && (
                  <Paragraph>Geen componenten & afhankelijkheden beschikbaar</Paragraph>
                )}
              </AcTabPanel>
              <AcTabPanel>
                {tabsContent?.reuse?.length > 0 && (
                  <AcTable
                    header={['Naam', 'Website', 'GitHub']}
                    rows={tabsContent?.reuse?.map((configuration) => mapReuseRow(configuration))}
                  />
                )}
                {!tabsContent?.reuse?.length && (
                  <Paragraph>Geen hergebruik beschikbaar</Paragraph>
                )}
              </AcTabPanel>
              <AcTabPanel>
                {tabsContent?.configurations?.length > 0 && (
                  <AcTable
                    header={['Naam', 'Organisatie', 'Ondersteund']}
                    rows={tabsContent?.configurations?.map((configuration) => mapConfigurationRow(configuration))}
                  />
                )}
                {!tabsContent?.configurations?.length && (
                  <Paragraph>Geen configuraties beschikbaar</Paragraph>
                )}
              </AcTabPanel>
            </AcTabs>
          )}
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
