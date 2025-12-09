import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import RelatedTabs from './con-related-tabs';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu, ConUuidResolver } from '@components';
import { withStore } from '@stores';
// import { VISUALS } from '@constants';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
// import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
// import { checkOrganizationPermissions } from '@utils/organization-permissions';

// Markdown Editor
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import { remarkMark } from 'remark-mark-highlight';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';

/**
 * Module Version (Applicatie Versie) Publication Page
 * - Fetches object, schema and related data (uses/used)
 * - Renders version information and related tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const AcPublicationModuleVersie = ({ store: { publications, user, object } }) => {
  const { id } = useParams();
  const { get_single, loading } = publications;
  const navigate = useNavigate();

  const schemaId =
    typeof get_single?.['@self']?.schema === 'object'
      ? get_single?.['@self']?.schema.id
      : get_single?.['@self']?.schema;
  const schemaSlug = useMemo(
    () => (schemaId ? schemaCache.get(schemaId) : null),
    [schemaId]
  );

  // COMMENTED OUT: Only show standard actions (Bewerken, Publiceren/Depubliceren, Verwijderen)
  // const openDynamicCreate = useCallback(
  //   (targetType, preSelected, metadata = {}) => {
  //     // For publication pages, we'll navigate to the beheer page with modal open
  //     if (metadata.isOutgoing) {
  //       // handle outgoing relationship metadata
  //     }
  //     navigate(`/beheer/${targetType}?showCreateModal=true&moduleVersieId=${id}`);
  //   },
  //   [navigate, id]
  // );

  // Exclude specific schemas from actions
  // const excludeSchemas = useMemo(() => ['gebruik', 'module'], []);

  // const { makeActionsForContext } = useRelatedCreateActions({
  //   object,
  //   user,
  //   schemaRef: schemaSlug,
  //   currentType: schemaSlug,
  //   openDynamicCreate,
  //   currentObject: get_single,
  //   excludeSchemas,
  // });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [actionMenuItems, setActionMenuItems] = useState([]);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate action menu items - COMMENTED OUT: Only show standard actions
  // useEffect(() => {
  //   if (!schemaSlug || !id) return;

  //   const items = makeActionsForContext(
  //     id,
  //     null,
  //     get_single,
  //     'voorzieningen',
  //     schemaSlug
  //   ).map(({ key, label, onClick, schema, icon }) => ({
  //     key,
  //     label,
  //     onClick,
  //     schema,
  //     icon,
  //   }));

  //   setActionMenuItems(items);
  // }, [schemaSlug, id, makeActionsForContext, get_single]);

  // Tabs
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  // Track which IDs we've already fetched to prevent duplicate calls
  const fetchedIds = useRef(new Set());

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_limit=100`,
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
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_limit=100`,
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

  // Get status date
  const getStatusDate = () => {
    const statusDateMap = {
      'in ontwikkeling': get_single.datumInOntwikkeling,
      ontwikkeling: get_single.datumInOntwikkeling,
      actief: get_single.datumInGebruik,
      'in gebruik': get_single.datumInGebruik,
      teruggetrokken: get_single.datumTeruggetrokken,
      'einde ondersteuning': get_single.datumEindeOndersteuning,
    };

    const statusDate = statusDateMap[get_single?.status?.toLowerCase()] || null;

    if (statusDate && !isNaN(new Date(statusDate).getTime())) {
      return new Date(statusDate).toLocaleDateString('nl-NL');
    }
    return null;
  };

  return (
    <AcContainer margin='xl'>
      <AcFlex column spacing='sm'>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <Heading level={4} className='con-product-publication--header-container'>
            <div className='con-beheer-details--header-container'>
              {(get_single?.['@self']?.image || get_single?.logo) && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={get_single?.['@self']?.image || get_single?.logo}
                />
              )}

              <Heading className='con-beheer-details--title'>
                {get_single?.['@self']?.name ||
                  get_single?.naam ||
                  get_single?.versie ||
                  get_single?.id ||
                  'Applicatie versie'}
              </Heading>
            </div>
          </Heading>
          <AcFlex
            justifyContent='between'
            alignItems='center'
            spacing='sm'
            className='con-product-publication--header-actions'
          >
            <Heading className='con-product-publication--header-type'>
              {schemaSlug &&
                (() => {
                  const Icon = getTabHeaderIcon(schemaSlug);
                  return <Icon />;
                })()}
              {schemaSlug && getTabHeaderName(schemaSlug, true)}
            </Heading>
            <ConDetailsActionsMenu
              user={user}
              id={id}
              schemaSlug={schemaSlug}
              title={get_single?.['@self']?.name || get_single?.id}
              published={get_single?.['@self']?.published}
              object={get_single}
              showViewAction={false}
              showEditAction={true}
              showPublishActions={true}
              onDelete={handleDelete}
              onEdit={() => {
                // Navigate to beheer edit page in new tab
                if (schemaSlug) {
                  const beheerUrl = `/beheer/${schemaSlug}/${id}`;
                  window.open(beheerUrl, '_blank');
                }
              }}
              // uniqueActions={[
              //   {
              //     key: 'delete',
              //     label: 'Verwijderen',
              //     icon: VISUALS.TRASHCAN,
              //     onClick: handleDelete,
              //   },
              // ]}
              triggerStyle='button'
              // relatedActions={actionMenuItems}
            />
          </AcFlex>
        </AcFlex>
        <AcFlex spacing='sm' justifyContent='between'>
          <AcFlex column spacing='md' style={{ flex: 3 }}>
            {!!get_single?.beschrijvingKort && (
              <div>{get_single?.beschrijvingKort}</div>
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
                  [rehypeSanitize],
                  [remarkRehype, { handlers: { ...defListHastHandlers } }],
                ]}
              />
            )}
          </AcFlex>
          <AcFlex column spacing='sm' style={{ flex: 1 }}>
            {/* Version Information */}
            {(get_single?.versie ||
              get_single?.status ||
              get_single?.releaseDatum) && (
              <AcFlex
                column
                spacing='sm'
                className='con-product-details--contact-info'
              >
                {get_single?.versie && (
                  <div>
                    <b>Versienummer:</b>
                    <p>{get_single?.versie}</p>
                  </div>
                )}
                {get_single?.status && (
                  <div>
                    <b>Status:</b>
                    <p>
                      {get_single?.status}
                      {getStatusDate() && (
                        <span style={{ color: '#666', marginLeft: '4px' }}>
                          (sinds {getStatusDate()})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {get_single?.releaseDatum && (
                  <div>
                    <b>Release datum:</b>
                    <p>
                      {!isNaN(new Date(get_single.releaseDatum).getTime())
                        ? new Date(get_single.releaseDatum).toLocaleDateString(
                            'nl-NL'
                          )
                        : get_single.releaseDatum}
                    </p>
                  </div>
                )}
              </AcFlex>
            )}

            {/* Module/Application Information */}
            {get_single?.module && (
              <AcFlex
                column
                spacing='sm'
                className='con-product-details--contact-info'
              >
                <div>
                  <b>Applicatie:</b>
                  <p>
                    <ConUuidResolver>{get_single.module}</ConUuidResolver>
                  </p>
                </div>
              </AcFlex>
            )}
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
        id={id}
        uses={uses}
        used={used}
        usesLoading={usesLoading}
        usedLoading={usedLoading}
        gebruikId={id}
        gebruikSchemaId={schemaId}
        gebruikSchemaSlug={get_single?.['@self']?.schema?.slug}
        tabIndex={relatedTabIndex}
        setTabIndex={setRelatedTabIndex}
        object={object}
        navigateTo='publication'
        user={user}
      />
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationModuleVersie));
