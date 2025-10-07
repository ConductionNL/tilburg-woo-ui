import React, { useEffect, useState, useCallback, useRef } from 'react';
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

  // State for referentieComponenten data with standards
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Fetch referentieComponenten data with their standards
  const fetchReferentieComponentenWithStandards = useCallback(async () => {
    if (!get_single?.referentieComponenten?.length) {
      setReferentieComponentenWithStandards([]);
      return;
    }

    console.info('📋 Fetching referentieComponenten with standards data...');

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
      });

      // Fetch referentieComponenten from openconnector endpoint
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Error fetching referentieComponenten:', response.statusText);
        return;
      }

      const data = await response.json();
      const allReferentieComponenten = data.results || data;

      // Filter to only the referentieComponenten that are used in this product
      const productReferentieComponenten = get_single.referentieComponenten
        .map((refId) => {
          const refData = allReferentieComponenten.find(
            (ref) =>
              String(ref.id) === String(refId) ||
              String(ref.value) === String(refId) ||
              String(ref.slug) === String(refId)
          );

          if (refData) {
            return {
              id: refId,
              naam:
                refData?.xml?.name?._value ||
                refData?.naam ||
                refData?.name ||
                refData?.title ||
                refData?.label ||
                refId,
              moduleId: 0, // For publication view, we don't have specific modules
              applicatieId: 0,
              // Extract standards from the API data
              aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
              verplichteStandaarden: refData.verplichteStandaarden || [],
              // Store the full API data for future use
              fullData: refData,
            };
          }
          return null;
        })
        .filter(Boolean);

      setReferentieComponentenWithStandards(productReferentieComponenten);
      console.info(
        `✅ Loaded ${productReferentieComponenten?.length} referentieComponenten with standards data`
      );
    } catch (error) {
      console.warn(
        '⚠️ Failed to fetch referentieComponenten with standards:',
        error
      );
      setReferentieComponentenWithStandards([]);
    }
  }, [get_single?.referentieComponenten]);

  // Helper function to determine standard type based on referentieComponenten (similar to form logic)
  const getStandardTypeFromReferentieComponenten = useCallback(
    (standardId) => {
      if (!referentieComponentenWithStandards?.length) {
        return { type: 'AANBEVOLEN', components: [] }; // Default fallback
      }

      const verplichteComponents = [];
      const aanbevolenComponents = [];

      // Check each referentiecomponent for this standard
      referentieComponentenWithStandards.forEach((refComp) => {
        const refCompName = refComp.naam || `Component ${refComp.id}`;

        // Check if this standard is in verplichte standaarden
        if (
          refComp.verplichteStandaarden &&
          Array.isArray(refComp.verplichteStandaarden)
        ) {
          const isVerplicht = refComp.verplichteStandaarden.some((standard) => {
            // Handle both string IDs and object formats
            const id =
              typeof standard === 'string'
                ? standard
                : standard?.id ||
                  standard?.value ||
                  standard?.slug ||
                  standard?.naam ||
                  standard?.name;
            return String(id) === String(standardId);
          });

          if (isVerplicht && !verplichteComponents.includes(refCompName)) {
            verplichteComponents.push(refCompName);
          }
        }

        // Check if this standard is in aanbevolen standaarden
        if (
          refComp.aanbevolenStandaarden &&
          Array.isArray(refComp.aanbevolenStandaarden)
        ) {
          const isAanbevolen = refComp.aanbevolenStandaarden.some((standard) => {
            // Handle both string IDs and object formats
            const id =
              typeof standard === 'string'
                ? standard
                : standard?.id ||
                  standard?.value ||
                  standard?.slug ||
                  standard?.naam ||
                  standard?.name;
            return String(id) === String(standardId);
          });

          if (isAanbevolen && !aanbevolenComponents.includes(refCompName)) {
            aanbevolenComponents.push(refCompName);
          }
        }
      });

      // Verplicht takes precedence over aanbevolen (same logic as form)
      const primaryType =
        verplichteComponents?.length > 0 ? 'VERPLICHT' : 'AANBEVOLEN';

      return {
        type: primaryType,
        verplichteComponents,
        aanbevolenComponents,
        allComponents: [...verplichteComponents, ...aanbevolenComponents],
      };
    },
    [referentieComponentenWithStandards]
  );

  // Fetch standards from openconnector endpoint
  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(
          'Error fetching openconnector standards:',
          response.statusText
        );
        return;
      }

      const data = await response.json();
      const fetchedStandards = data.results || data;

      setStandards(fetchedStandards);
      console.info(
        `✅ Loaded ${fetchedStandards?.length} standards for publication page`
      );
    } catch (error) {
      console.warn('⚠️ Failed to fetch standards:', error);
      setStandards([]);
    } finally {
      setStandardsLoading(false);
    }
  }, []);

  // TODO: Remove this if it's not needed
  // The code below is a fetch request on the publication endpoint that will fetch all the elements that are published and are of gemmaType Standaard
  // For now there are no results on this endpoint. This is because of the gemmaType filter not being applied in the backend correctly.

  // Fetch standards from publications endpoint with specific parameters
  //   const fetchStandards = useCallback(async () => {
  //     setStandardsLoading(true);
  //     try {
  //       const queryParams = new URLSearchParams({
  //         '@self[schema]': 'element',
  //         gemmaType: 'Standaard',
  //       });

  //       console.info('📋 Fetching standards from publications endpoint...');

  //       // Fetch standards from publications endpoint using normal fetch
  //       const response = await fetch(
  //         `${commongroundApiUrl()}/opencatalogi/api/publications?${queryParams}`,
  //         {
  //           method: 'GET',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         console.error('Error fetching publications standards:', response.statusText);
  //         return;
  //       }

  //       const data = await response.json();
  //       const fetchedStandards = data.results || data;

  //       console.info(
  //         `✅ Loaded ${fetchedStandards.length} standards from publications endpoint`
  //       );

  //       // You can process the fetched standards here if needed
  //       // For now, we'll just log them
  //       console.log('Publications standards:', fetchedStandards);
  //     } catch (error) {
  //       console.warn('⚠️ Failed to fetch standards from publications:', error);
  //     } finally {
  //       setStandardsLoading(false);
  //     }
  //   }, []);

  useEffect(() => {
    fetchStandards();
    fetchReferentieComponentenWithStandards();
  }, [fetchStandards, fetchReferentieComponentenWithStandards]);
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Track which IDs we've already fetched to prevent duplicate calls
  const fetchedIds = useRef(new Set());

  const fetchUses = useCallback(async () => {
    if (!id) return;
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
  }, []);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
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
  }, []);

  useEffect(() => {
    // Only fetch when the ID in the URL changes and we haven't fetched for this ID before
    if (!id || fetchedIds.current.has(id)) {
      return;
    }

    // Mark this ID as fetched
    fetchedIds.current.add(id);

    fetchUses();
    fetchUsed();
  }, [id, fetchUses, fetchUsed]);

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
              referentieComponentenWithStandards={referentieComponentenWithStandards}
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
        navigateTo='publication'
      />
    </AcContainer>
  );
};

// Helper function to get all standards from referentieComponenten data
const getAllStandardsFromReferentieComponenten = (
  referentieComponentenWithStandards
) => {
  if (!referentieComponentenWithStandards?.length) return [];

  const allStandards = [];

  referentieComponentenWithStandards.forEach((refComp) => {
    // Add verplichte standaarden
    if (
      refComp.verplichteStandaarden &&
      Array.isArray(refComp.verplichteStandaarden)
    ) {
      refComp.verplichteStandaarden.forEach((standard) => {
        const standardId =
          typeof standard === 'string'
            ? standard
            : standard?.id ||
              standard?.value ||
              standard?.slug ||
              standard?.naam ||
              standard?.name;

        if (standardId && !allStandards.find((s) => s.id === standardId)) {
          allStandards.push({
            id: standardId,
            type: 'VERPLICHT',
            referentieComponent: refComp.naam || `Component ${refComp.id}`,
          });
        }
      });
    }

    // Add aanbevolen standaarden
    if (
      refComp.aanbevolenStandaarden &&
      Array.isArray(refComp.aanbevolenStandaarden)
    ) {
      refComp.aanbevolenStandaarden.forEach((standard) => {
        const standardId =
          typeof standard === 'string'
            ? standard
            : standard?.id ||
              standard?.value ||
              standard?.slug ||
              standard?.naam ||
              standard?.name;

        if (standardId) {
          const existingStandard = allStandards.find((s) => s.id === standardId);
          if (existingStandard) {
            // If already exists as VERPLICHT, keep it as VERPLICHT
            if (existingStandard.type !== 'VERPLICHT') {
              existingStandard.type = 'AANBEVOLEN';
            }
          } else {
            allStandards.push({
              id: standardId,
              type: 'AANBEVOLEN',
              referentieComponent: refComp.naam || `Component ${refComp.id}`,
            });
          }
        }
      });
    }
  });

  return allStandards;
};

const TabList = ({
  referentieComponenten,
  complianceStandards,
  standards,
  standardsLoading,
  objectStore,
  referentieComponentenWithStandards,
}) => {
  // Get all standards from referentieComponenten using the helper function
  const allReferentieStandards = getAllStandardsFromReferentieComponenten(
    referentieComponentenWithStandards
  );

  // Set default tab index based on whether we have standards from referentieComponenten
  const hasStandards = allReferentieStandards && allReferentieStandards.length > 0;
  const [tabIndex, setTabIndex] = useState(0);

  // Update tab index when standards data becomes available
  useEffect(() => {
    if (hasStandards) {
      setTabIndex(0); // Show standards tab
    } else {
      setTabIndex(1); // Show "Geschikt voor" tab
    }
  }, [hasStandards]);

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
          <AcTab
            selected={tabIndex === 0}
          >{`Standaarden (${allReferentieStandards.length})`}</AcTab>
          <AcTab
            selected={tabIndex === 1}
          >{`Geschikt voor (${referentieComponenten.length})`}</AcTab>
        </AcTabList>
        <AcTabPanel selected={tabIndex === 0} style={{ paddingInline: '0px' }}>
          {standardsLoading ? (
            <p>Standaarden laden...</p>
          ) : allReferentieStandards && allReferentieStandards.length > 0 ? (
            <div
              style={{
                maxHeight: allReferentieStandards.length > 5 ? '500px' : 'auto',
                overflowY: allReferentieStandards.length > 5 ? 'auto' : 'visible',
                overflowX: 'hidden',
                border:
                  allReferentieStandards.length > 5 ? '1px solid #e9ecef' : 'none',
                borderRadius: allReferentieStandards.length > 5 ? '4px' : '0',
                width: '100%',
              }}
            >
              <Table style={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHeader>
                  <TableRow>
                    <TableCell
                      style={{
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        paddingLeft:
                          'var(--utrecht-table-cell-padding-inline-end) !important',
                        position:
                          allReferentieStandards.length > 5 ? 'sticky' : 'static',
                        top: allReferentieStandards.length > 5 ? '0' : 'auto',
                        zIndex: allReferentieStandards.length > 5 ? '10' : 'auto',
                        width: '50%',
                      }}
                    >
                      Standaard
                    </TableCell>
                    <TableCell
                      style={{
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        position:
                          allReferentieStandards.length > 5 ? 'sticky' : 'static',
                        top: allReferentieStandards.length > 5 ? '0' : 'auto',
                        zIndex: allReferentieStandards.length > 5 ? '10' : 'auto',
                        width: '25%',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      style={{
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa',
                        position:
                          allReferentieStandards.length > 5 ? 'sticky' : 'static',
                        top: allReferentieStandards.length > 5 ? '0' : 'auto',
                        zIndex: allReferentieStandards.length > 5 ? '10' : 'auto',
                        width: '25%',
                      }}
                    >
                      Bewijs
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReferentieStandards.map((refStandard, idx) => {
                    // Check if this standard is in the complianceStandards array
                    const complianceStandard = complianceStandards?.find(
                      (cs) => cs.standaardversie === refStandard.id
                    );
                    const isCompliant = !!complianceStandard;
                    const hasEvidence = !!complianceStandard?.bewijs;

                    const typeColor =
                      refStandard.type === 'VERPLICHT' ? '#dc3545' : '#28a745';

                    return (
                      <TableRow key={idx}>
                        <TableCell
                          style={{
                            alignContent: 'center',
                            paddingLeft:
                              'var(--utrecht-table-cell-padding-inline-end) !important',
                            width: '50%',
                            wordWrap: 'break-word',
                            overflow: 'hidden',
                          }}
                        >
                          <div>
                            <Link
                              href={`https://www.gemmaonline.nl/wiki/GEMMA/${refStandard.id}`}
                              target='_blank'
                            >
                              <ConStandardsResolver
                                standardId={refStandard.id}
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
                                  margin: '0px',
                                  marginBlockStart: '0px',
                                  marginBlockEnd: '0px',
                                  marginInlineStart: '0px',
                                  marginInlineEnd: '0px',
                                }}
                              >
                                {refStandard.type}
                              </span>
                            </div>
                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '0.75rem',
                                color: '#6c757d',
                                wordWrap: 'break-word',
                              }}
                            >
                              {refStandard.referentieComponent}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell
                          style={{
                            alignContent: 'center',
                            width: '25%',
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#fff',
                              backgroundColor: isCompliant ? '#28a745' : '#6c757d',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              lineHeight: '1.2',
                              margin: '0px',
                              marginBlockStart: '0px',
                              marginBlockEnd: '0px',
                              marginInlineStart: '0px',
                              marginInlineEnd: '0px',
                            }}
                          >
                            {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                          </span>
                        </TableCell>
                        <TableCell
                          style={{
                            alignContent: 'center',
                            width: '25%',
                            overflow: 'hidden',
                          }}
                        >
                          {hasEvidence ? (
                            <Link
                              href='#'
                              onClick={(e) => {
                                e.preventDefault();
                                handleFileClick(complianceStandard.bewijs);
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
            </div>
          ) : (
            <p style={{ padding: '16px', color: '#6c757d', fontStyle: 'italic' }}>
              Geen standaarden gevonden voor de gekoppelde referentiecomponenten.
            </p>
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
