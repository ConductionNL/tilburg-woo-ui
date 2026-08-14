import { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';

import {
  AcCard,
  AcContainer,
  AcFlex,
  AcTabs,
  AcTabList,
  AcTab,
  AcTabPanel,
} from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
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
import { Pagination } from '@amsterdam/design-system-react';
import { Heading2 } from '@utrecht/component-library-react';
import { AcGetAdditionalInfoRow } from '@src/services/ac-get-additional-info-row';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import { useParams, useNavigate } from 'react-router-dom';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { normalizeSchemaName } from '@src/utilities/con-normalize-schema-name';

const AcPublicationFormulier = ({ store: { publications, user } }) => {
  const {
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
  } = publications;

  const { id } = useParams();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  const tabsContent = JSON.parse(get_single?.data?.tabsData || '{}');

  const mapDependencyRow = (row) => {
    return [
      <span key={row.name}>{row.name}</span>,
      <span key={row.version}>{row.version}</span>,
      <span key={row.description}>{row.description}</span>,
      <AcLink key={row.viewLink} to={row.viewLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>Bekijk</Link>
      </AcLink>,
      <AcLink key={row.downloadLink} to={row.downloadLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>Download</Link>
      </AcLink>,
    ];
  };
  const mapReuseRow = (row) => {
    return [
      <span key={row.name}>{row.name}</span>,
      <AcLink key={row.website} to={row.website} target='_blank'>
        <VISUALS.WORLD />
        <Link>Website</Link>
      </AcLink>,
      <AcLink key={row.github} to={row.github} target='_blank'>
        <VISUALS.GITHUB />
        <Link>Github</Link>
      </AcLink>,
    ];
  };
  const mapConfigurationRow = (row) => {
    return [
      <span key={row.name}>{row.name}</span>,
      <span key={row.organization}>{row.organization}</span>,
      <span key={row.supports}>{row.supports}</span>,
      <AcLink key={row.viewLink} to={row.viewLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>Bekijk</Link>
      </AcLink>,
      <AcLink key={row.downloadLink} to={row.downloadLink} target='_blank'>
        <VISUALS.EXTERNAL_LINK />
        <Link>Download</Link>
      </AcLink>,
    ];
  };

  return (
    <>
      <AcContainer compact margin='xl' className={'ac-publication-container'}>
        <AcFlex column spacing={'lg'}>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
            <div className='ac-publication-header'>
              <Heading>{get_single?.title}</Heading>
              {
                <img
                  src={get_single?.image}
                  className='ac-publication-header-image'
                ></img>
              }
            </div>
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
                onDelete={handleDelete}
                onEdit={() => {
                  const schemaSlug = get_single?.['@self']?.schema?.slug;
                  if (schemaSlug) {
                    const wizardSchemaName = normalizeSchemaName(schemaSlug).toLowerCase();
                    const wizards = Object.values(DASHBOARD_WIZARDS);
                    const wizard = wizards.find((w) => w.schema === wizardSchemaName);

                    if (wizard) {
                      const baseUrl = getWizardUrl(wizard);
                      const url = new URL(baseUrl, window.location.origin);
                      url.searchParams.set('id', id);
                      navigate(url.pathname + url.search);
                      return;
                    }
                  }
                  // Fallback to beheer detail page in same tab with edit modal
                  const beheerUrl = `/beheer/${schemaSlug}/${id}?showEditModal=true`;
                  navigate(beheerUrl);
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
                    totalPages={Math.ceil(
                      getFilteredAttachments().length / attachmentPagination.perPage
                    )}
                    page={attachmentPagination.page}
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
              Documenten worden in een nieuw tabblad geopend.
            </AcFlex>
            <AcTable rows={AcGetAdditionalInfoRow(get_single, getSearchPageURL)} />
          </div>
          <div className='ac-publication-three-column'>
            <div>
              <Heading2>Organisatie</Heading2>
              <div className='ac-publication-three-column-item'>
                <span>Geen organisatie beschikbaar</span>
              </div>
            </div>
          </div>
          <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
            <AcTabList>
              <AcTab selected={tabIndex === 0}>
                <span>Componenten & Afhankelijkheden</span>
                <BadgeCounter className='ac-publication-badge-counter'>
                  {tabsContent?.dependencies?.length ?? 0}
                </BadgeCounter>
              </AcTab>
              <AcTab>
                <span>Hergebruik</span>
                <BadgeCounter className='ac-publication-badge-counter'>
                  {tabsContent?.reuse?.length ?? 0}
                </BadgeCounter>
              </AcTab>
              <AcTab>
                <span>Configuraties</span>
                <BadgeCounter className='ac-publication-badge-counter'>
                  {tabsContent?.configurations?.length ?? 0}
                </BadgeCounter>
              </AcTab>
            </AcTabList>
            <AcTabPanel selected={tabIndex === 0}>
              {tabsContent?.dependencies?.length > 0 && (
                <AcTable
                  header={['Naam', 'Versie', 'Omschrijving']}
                  rows={tabsContent?.dependencies?.map((configuration) =>
                    mapDependencyRow(configuration)
                  )}
                />
              )}
              {!tabsContent?.dependencies?.length && (
                <Paragraph>
                  Geen componenten & afhankelijkheden beschikbaar
                </Paragraph>
              )}
            </AcTabPanel>
            <AcTabPanel>
              {tabsContent?.reuse?.length > 0 && (
                <AcTable
                  header={['Naam', 'Website', 'GitHub']}
                  rows={tabsContent?.reuse?.map((configuration) =>
                    mapReuseRow(configuration)
                  )}
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
                  rows={tabsContent?.configurations?.map((configuration) =>
                    mapConfigurationRow(configuration)
                  )}
                />
              )}
              {!tabsContent?.configurations?.length && (
                <Paragraph>Geen configuraties beschikbaar</Paragraph>
              )}
            </AcTabPanel>
          </AcTabs>

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

export default withStore(observer(AcPublicationFormulier));
