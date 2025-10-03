import React, { useEffect, useState, useCallback } from 'react';
import RelatedTabs from './con-related-tabs';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex, AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { AcLoader, ConDetailsActionsMenu, ConStandardsResolver } from '@components';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import {
  Heading,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { handleFileClick } from '@utils';

// Markdown Editor
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import { remarkMark } from 'remark-mark-highlight';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import rehypeSlug from 'rehype-slug';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const AcPublicationProduct = ({
  store: { publications, user, object },
  //   schema,
}) => {
  const { id } = useParams();
  const { get_single, loading } = publications;
  const navigate = useNavigate();

  const openDynamicCreate = useCallback(
    (targetType, preSelected, metadata = {}) => {
      // For publication pages, we'll navigate to the beheer page with modal open
      // TODO: Handle outgoing relationship metadata in beheer page URL params
      if (metadata.isOutgoing) {
        // handle outgoing relationship metadata
      }
      navigate(`/beheer/${targetType}?showCreateModal=true&voorzieningId=${id}`);
    },
    [navigate, id]
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: get_single?.['@self']?.schema?.slug,
    currentType: get_single?.['@self']?.schema?.slug, // Use schema slug as current type
    openDynamicCreate,
    currentObject: get_single, // Pass current object for organization permission checks
    currentObjectRegister: 'voorzieningen', // Pass current object register (for publication pages)
    currentObjectSchema: get_single?.['@self']?.schema?.slug, // Pass current object schema
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionMenuItems, setActionMenuItems] = useState([]);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate action menu items
  useEffect(() => {
    if (!get_single?.['@self']?.schema?.slug || !id) return;

    const items = makeActionsForContext(id).map(
      ({ key, label, onClick, schema, icon }) => ({
        key,
        label,
        onClick,
        schema,
        icon,
      })
    );

    setActionMenuItems(items);
  }, [get_single?.['@self']?.schema?.slug, id, makeActionsForContext]);

  // Standards state for resolving compliance standards
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

  // Fetch standards once for the entire component
  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const queryParams = {
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
        _extend: ['@self.schema'],
        _source: 'database',
      };

      console.info('📋 Fetching standards for publication page...');

      // Fetch standards using the correct endpoint
      const fetchedStandards = await object.fetchGemmaElementsCacheFirst(
        'Standaard',
        queryParams
      );

      setStandards(fetchedStandards);
      console.info(
        `✅ Loaded ${fetchedStandards.length} standards for publication page`
      );
    } catch (error) {
      console.warn('⚠️ Failed to fetch standards:', error);
      setStandards([]);
    } finally {
      setStandardsLoading(false);
    }
  }, [object]);

  useEffect(() => {
    fetchStandards();
  }, [fetchStandards]);
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const fetchUses = useCallback(async () => {
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=@self.schema`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching uses:', response.statusText);
        return;
      }
      const data = await response.json();
      setUses(data.results);
    } catch (error) {
      console.error('Error fetching uses:', error);
    } finally {
      setUsesLoading(false);
    }
  }, [id]);

  const fetchUsed = useCallback(async () => {
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching used:', response.statusText);
        return;
      }
      const data = await response.json();
      setUsed(data.results);
    } catch (error) {
      console.error('Error fetching used:', error);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  // Loading
  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl'>
      <AcFlex column spacing='sm'>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <Heading level={4}>
            <div className='con-beheer-details--header-container'>
              {get_single?.['@self']?.image && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={get_single?.['@self']?.image}
                />
              )}

              <Heading className='con-beheer-details--title'>
                {get_single?.['@self']?.name ||
                  get_single?.id ||
                  get_single?.name ||
                  'Product'}
              </Heading>
            </div>
          </Heading>
          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={get_single?.['@self']?.schema?.slug}
            title={get_single?.['@self']?.name || get_single?.id}
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
              const beheerUrl = `/beheer/${schemaSlug}/${id}`;
              window.open(beheerUrl, '_blank');
            }}
            uniqueActions={[
              {
                key: 'delete',
                label: 'Verwijderen',
                icon: VISUALS.TRASHCAN,
                onClick: handleDelete,
              },
            ]}
            triggerStyle='button'
            relatedActions={actionMenuItems}
          />
        </AcFlex>
        <AcFlex spacing='sm' justifyContent='between'>
          <AcFlex column spacing='md' style={{ flex: 2 }}>
            {!!get_single?.['@self']?.summary && (
              <div>{get_single?.['@self']?.summary}</div>
            )}

            {!!get_single?.beschrijvingLang && (
              <MDEditor.Markdown
                wrapperElement={{
                  'data-color-mode': 'light',
                }}
                source={get_single?.beschrijvingLang}
                remarkPlugins={[
                  [remarkGfm, { singleTilde: false }],
                  remarkDefinitionList,
                  remarkEmoji,
                  remarkSupersub,
                  remarkMark,
                ]}
                rehypePlugins={[
                  rehypeSlug,
                  [remarkRehype, { handlers: { ...defListHastHandlers } }],
                ]}
              />
            )}
          </AcFlex>
          <AcFlex column spacing='sm' style={{ flex: 1 }}>
            <AcFlex
              column
              spacing='sm'
              className='con-product-details--contact-info'
            >
              {get_single?.licentietype && (
                <div>
                  <b>Licentietype:</b>
                  <p>{get_single?.licentietype}</p>
                </div>
              )}
              {get_single?.licentie && (
                <div>
                  <b>Licentie:</b>
                  <p>{get_single?.licentie}</p>
                </div>
              )}
              {get_single?.moduleVersies && (
                <div>
                  <b>Huidige versie:</b>
                  <p>
                    {get_single.moduleVersies.find(
                      (versie) => versie.status === 'in gebruik'
                    )?.versie || 'Geen versie in gebruik'}
                  </p>
                </div>
              )}
              {get_single?.website && (
                <div>
                  <b>Website:</b>
                  <p>{get_single?.website}</p>
                </div>
              )}
              {get_single?.website && (
                <div>
                  <b>Website:</b>
                  <p>{get_single?.website}</p>
                </div>
              )}
            </AcFlex>

            <TabList
              referentieComponenten={get_single.referentieComponenten}
              complianceStandards={get_single.compliancy}
              standards={standards}
              standardsLoading={standardsLoading}
              objectStore={object}
              className='con-product-details--content-side'
            />
          </AcFlex>
        </AcFlex>
      </AcFlex>

      <AcGenericBeheerDeleteModal
        objects={get_single ? [get_single] : []}
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => navigate('/zoeken')}
      />

      <RelatedTabs
        uses={uses}
        used={used}
        usesLoading={usesLoading}
        usedLoading={usedLoading}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        object={object}
      />
    </AcContainer>
  );
};

const TabList = ({
  referentieComponenten,
  complianceStandards,
  standards,
  standardsLoading,
  objectStore,
}) => {
  const [tabIndex, setTabIndex] = useState(0);

  // Custom hook to resolve UUIDs while keeping original IDs
  const [resolvedReferentieComponenten, setResolvedReferentieComponenten] = useState(
    []
  );

  useEffect(() => {
    const resolveWithIds = async () => {
      if (!referentieComponenten?.length || !objectStore) {
        setResolvedReferentieComponenten([]);
        return;
      }

      try {
        const resolved = await Promise.all(
          referentieComponenten.map(async (id) => {
            try {
              const name = await objectStore.getNamesForSingleId(id);
              return { id, name };
            } catch (error) {
              return { id, name: id }; // Fallback to ID if resolution fails
            }
          })
        );
        setResolvedReferentieComponenten(resolved);
      } catch (error) {
        console.error('Error resolving referentie componenten:', error);
        // Fallback to just IDs
        setResolvedReferentieComponenten(
          referentieComponenten.map((id) => ({ id, name: id }))
        );
      }
    };

    resolveWithIds();
  }, [referentieComponenten, objectStore]);

  return (
    <div className='con-product-details--side-content-tabs'>
      <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
        <AcTabList>
          <AcTab selected={tabIndex === 0}>Standaarden:</AcTab>
          <AcTab selected={tabIndex === 1}>Geschikt voor:</AcTab>
        </AcTabList>
        <AcTabPanel selected={tabIndex === 0} style={{ paddingInline: '0px' }}>
          {standardsLoading ? (
            <p>Standaarden laden...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      paddingLeft:
                        'var(--utrecht-table-cell-padding-inline-end) !important',
                    }}
                  >
                    Standaard
                  </TableCell>
                  <TableCell
                    style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                  >
                    Bewijs
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceStandards.map((standard, idx) => {
                  // Get the full standard data to determine if it's required or recommended
                  const standardData = ConStandardsResolver({
                    standardId: standard.standaardversie,
                    standards: standards,
                    returnStandardData: true,
                  });

                  // Determine if this is a required standard based on available information
                  // Since we don't have the referentiecomponenten context, we'll use heuristics:
                  // 1. Check if the standard has evidence (indicates compliance)
                  // 2. Check standard properties for indicators of requirement level
                  const hasEvidence = !!standard.bewijs;

                  // Try to determine if it's required based on standard data
                  const standardInfo = standardData?.data;
                  const isLikelyRequired =
                    // If it has evidence, it might be required (organizations tend to provide evidence for required standards)
                    hasEvidence ||
                    // Check if the standard name/description contains keywords that suggest it's required
                    (standardInfo?.xml?.name?._value || standardInfo?.naam || '')
                      .toLowerCase()
                      .includes('verplicht') ||
                    // Check if it's a security or compliance standard (often required)
                    (standardInfo?.xml?.name?._value || standardInfo?.naam || '')
                      .toLowerCase()
                      .match(
                        /(security|beveiliging|privacy|gdpr|iso.*27001|baseline)/
                      );

                  const standardType = isLikelyRequired ? 'VERPLICHT' : 'AANBEVOLEN';
                  const typeColor = isLikelyRequired ? '#dc3545' : '#28a745';

                  return (
                    <TableRow key={idx}>
                      <TableCell
                        style={{
                          alignContent: 'center',
                          paddingLeft:
                            'var(--utrecht-table-cell-padding-inline-end) !important',
                        }}
                      >
                        <div>
                          <Link
                            href={`https://www.gemmaonline.nl/wiki/GEMMA/${standard.standaardversie}`}
                            target='_blank'
                          >
                            <ConStandardsResolver
                              standardId={standard.standaardversie}
                              standards={standards}
                            />
                          </Link>
                          <div style={{ marginTop: '4px' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#fff',
                                backgroundColor: typeColor,
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                lineHeight: '1.2',
                                margin: '0px', // Set block-inline values to 0px
                                marginBlockStart: '0px',
                                marginBlockEnd: '0px',
                                marginInlineStart: '0px',
                                marginInlineEnd: '0px',
                              }}
                            >
                              {standardType}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell style={{ alignContent: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#fff',
                            backgroundColor: hasEvidence ? '#28a745' : '#6c757d',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            lineHeight: '1.2',
                            margin: '0px', // Set block-inline values to 0px
                            marginBlockStart: '0px',
                            marginBlockEnd: '0px',
                            marginInlineStart: '0px',
                            marginInlineEnd: '0px',
                          }}
                        >
                          {hasEvidence ? 'COMPLIANT' : 'NON-COMPLIANT'}
                        </span>
                      </TableCell>
                      <TableCell style={{ alignContent: 'center' }}>
                        {standard.bewijs ? (
                          <Link
                            href='#'
                            onClick={(e) => {
                              e.preventDefault();
                              handleFileClick(standard.bewijs);
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            <VISUALS.DOWNLOAD />
                          </Link>
                        ) : (
                          <span
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </AcTabPanel>
        <AcTabPanel selected={tabIndex === 1}>
          {resolvedReferentieComponenten.map((item, idx) => (
            <Link
              key={idx}
              href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${item.id}`}
              target='_blank'
            >
              {item.name}
            </Link>
          ))}
        </AcTabPanel>
      </AcTabs>
    </div>
  );
};

export default withStore(observer(AcPublicationProduct));
