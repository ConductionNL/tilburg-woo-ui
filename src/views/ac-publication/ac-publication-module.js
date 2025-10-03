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
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useResolvedArray } from '@src/utilities/con-resolve-uuids-in-text';

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
  const [tabIndexUses, setTabIndexUses] = useState(0);
  const [tabIndexUsed, setTabIndexUsed] = useState(0);

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
        tabIndexUses={tabIndexUses}
        setTabIndexUses={setTabIndexUses}
        tabIndexUsed={tabIndexUsed}
        setTabIndexUsed={setTabIndexUsed}
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

  // Combine all referentieComponenten into a unique array

  const resolvedReferentieComponenten = useResolvedArray(
    referentieComponenten,
    objectStore
  );

  return (
    <div className='con-product-details--side-content-tabs'>
      <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
        <AcTabList>
          <AcTab selected={tabIndex === 0}>Standaarden:</AcTab>
          <AcTab selected={tabIndex === 1}>Geschikt voor:</AcTab>
        </AcTabList>
        <AcTabPanel selected={tabIndex === 0}>
          {standardsLoading ? (
            <p>Standaarden laden...</p>
          ) : (
            complianceStandards.map((standard, idx) => (
              <p
                style={{ display: 'flex', gap: '5px', alignItems: 'center' }}
                key={idx}
              >
                <ConStandardsResolver
                  standardId={standard.standaardversie}
                  standards={standards}
                />
                -
                {standard.bewijs ? (
                  <Link href={standard.bewijs}>bewijs</Link>
                ) : (
                  <span>geen bewijs</span>
                )}
              </p>
            ))
          )}
        </AcTabPanel>
        <AcTabPanel selected={tabIndex === 1}>
          {resolvedReferentieComponenten.map((id, idx) => (
            <p key={idx}>{id}</p>
          ))}
        </AcTabPanel>
      </AcTabs>
    </div>
  );
};

export default withStore(observer(AcPublicationProduct));
