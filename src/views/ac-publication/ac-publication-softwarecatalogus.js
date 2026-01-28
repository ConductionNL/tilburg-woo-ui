import { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';

import { AcCard, AcContainer, AcFlex , AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
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
import { AcGetAdditionalInfoRow } from '@src/services/ac-get-additional-info-row';
import { Pagination } from '@amsterdam/design-system-react';
import { Heading2, Heading3 } from '@utrecht/component-library-react';
import _ from 'lodash';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

const AcPublicationSoftwarecatalogus = ({ store: { publications, user, object } }) => {
  const {
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
    get_relations,
    get_used_data,
    resetRelations,
    resetPublication,
    resetUsedData,
    fetchRelations,
    fetchPublication,
    fetchUsed,
  } = publications;

  const { id } = useParams();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
    
    // Fetch used data (compliancy, standards) when publication is loaded
    if (get_single?.id) {
      fetchUsed(get_single.id);
    }
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

          {/* Standards (Standaarden) table */}
          {get_used_data?.results && get_used_data.results.some(item => item['@self']?.schema?.id === get_used_data['@self']?.schemas?.['18']?.id) && (
            <div>
              <Heading level={2}>Standaarden</Heading>
              <AcFlex spacing={'xs'} className='notice'>
                <VISUALS.INFO />
                Overzicht van ondersteunde standaarden en hun compliancy bewijs.
              </AcFlex>
              <AcTable
                header={['Standaardversie', 'Status', 'Bewijs']}
                rows={get_used_data.results
                  .filter(item => item['@self']?.schema?.id === get_used_data['@self']?.schemas?.['18']?.id)
                  .map((compliancy) => {
                    // Get standaardversie name
                    const standaardversieId = compliancy.standaardversie;
                    const standaardversieName = object.getNameFromCache(standaardversieId) || standaardversieId;
                    
                    // Determine status based on whether bewijs or url is present
                    let status = 'ONDERSTEUND';
                    if (compliancy.bewijs || compliancy.url) {
                      status = 'ONDERSTEUND (met bewijs)';
                    }
                    
                    // Build bewijs cell content
                    let bewijsContent = '-';
                    
                    // Check for file metadata in @self.files
                    if (compliancy['@self']?.files && compliancy['@self'].files.length > 0) {
                      const file = compliancy['@self'].files[0];
                      bewijsContent = (
                        <Link
                          href={file.downloadUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {file.title || 'Download bestand'}
                        </Link>
                      );
                    } else if (compliancy.url) {
                      bewijsContent = (
                        <Link
                          href={compliancy.url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Bekijk URL
                        </Link>
                      );
                    } else if (compliancy.bewijs) {
                      bewijsContent = 'Bestand geüpload';
                    }
                    
                    return [
                      <span key={`${compliancy.id}-name`}>{standaardversieName}</span>,
                      <span key={`${compliancy.id}-status`} style={{ 
                        color: (compliancy.bewijs || compliancy.url) ? '#0d6f0d' : '#666',
                        fontWeight: (compliancy.bewijs || compliancy.url) ? '600' : '400'
                      }}>
                        {status}
                      </span>,
                      <span key={`${compliancy.id}-bewijs`}>{bewijsContent}</span>,
                    ];
                  })}
              />
            </div>
          )}

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

export default withStore(observer(AcPublicationSoftwarecatalogus));
