import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import RelatedTabs from './con-related-tabs';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu, ConUuidResolver } from '@components';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

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

  // Tabs
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  // Track which IDs we've already fetched to prevent duplicate calls
  const fetchedIds = useRef(new Set());

  // Extract contactpersoon from uses data instead of get_single
  const contact = useMemo(() => {
    if (!uses?.length) return null;

    // Find the first contactpersoon object in the uses array
    // (if multiple contactpersonen exist, we take the first one)
    const contactpersoonObject = uses.find(
      (use) => use?.['@self']?.schema?.slug === 'contactpersoon'
    );

    if (!contactpersoonObject) return null;

    return contactpersoonObject;
  }, [uses]);

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=@self.schema&_limit=100`,
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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema&_limit=100`,
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
                  get_single?.id ||
                  get_single?.name ||
                  'Product'}{' '}
                {'('}
                <ConUuidResolver>{get_single.aanbieder}</ConUuidResolver>
                {')'}
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
              {(() => {
                const Icon = getTabHeaderIcon(get_single?.['@self'].schema.slug);
                return <Icon />;
              })()}
              {getTabHeaderName(get_single?.['@self'].schema.slug, true)}
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
        </AcFlex>
        <AcFlex spacing='sm' justifyContent='between'>
          <AcFlex column spacing='md' style={{ flex: 3 }}>
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
                  [rehypeSanitize],
                  [remarkRehype, { handlers: { ...defListHastHandlers } }],
                ]}
              />
            )}
          </AcFlex>
          <AcFlex column spacing='sm' style={{ flex: 1 }}>
            {(usesLoading ||
              (contact && typeof contact === 'object') ||
              get_single?.website) && (
              <AcFlex
                column
                spacing='sm'
                className='con-product-details--contact-info'
              >
                {get_single?.website && (
                  <div>
                    <b>Website:</b>
                    <Link
                      href={`${
                        get_single?.website.startsWith('http')
                          ? get_single?.website
                          : `https://${get_single?.website}`
                      }`}
                    >
                      {get_single?.website}
                    </Link>
                  </div>
                )}
                {/* Show loading state while fetching uses data */}
                {usesLoading && (
                  <AcFlex column spacing='xs'>
                    <b>Contactpersoon:</b>
                    <p>Laden...</p>
                  </AcFlex>
                )}
                {/* Show contact info when available and not loading */}
                {!usesLoading && contact && typeof contact === 'object' && (
                  <AcFlex column spacing='xs'>
                    <b>Contactpersoon:</b>
                    <p>
                      {[contact.voornaam, contact.tussenvoegsel, contact.achternaam]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                    <div>
                      {contact['e-mailadres'] && (
                        <Link href={`mailto:${contact['e-mailadres']}`}>
                          {contact['e-mailadres']}
                        </Link>
                      )}
                    </div>
                    <div>
                      {contact.telefoonnummer && (
                        <Link
                          href={`tel:${String(contact.telefoonnummer)
                            .split('')
                            .filter((i) => i !== ' ')
                            .join('')}`}
                        >
                          {contact.telefoonnummer}
                        </Link>
                      )}
                    </div>
                  </AcFlex>
                )}
                {/* Show message when no contact found after loading */}
                {!usesLoading && !contact && (
                  <AcFlex column spacing='xs'>
                    <b>Contactpersoon:</b>
                    <p>Geen contactpersoon gevonden</p>
                  </AcFlex>
                )}
              </AcFlex>
            )}

            {(get_single?.status ||
              get_single?.hostingLocatie ||
              get_single?.hostingJurisdictie ||
              get_single?.cloudDienstverleningsmodel) && (
              <AcFlex
                column
                spacing='sm'
                className='con-product-details--contact-info'
              >
                {get_single?.status && (
                  <div>
                    <b>Status:</b>
                    <p>{get_single?.status}</p>
                  </div>
                )}
                {get_single?.hostingLocatie && (
                  <div>
                    <b>De applicatie wordt gehost in:</b>
                    <p>{get_single?.hostingLocatie}</p>
                  </div>
                )}
                {get_single?.hostingJurisdictie && (
                  <div>
                    <b>De data wordt opgeslagen in:</b>
                    <p>{get_single?.hostingJurisdictie}</p>
                  </div>
                )}
                {get_single?.cloudDienstverleningsmodel && (
                  <div>
                    <b>Hosting type:</b>
                    <p>{get_single?.cloudDienstverleningsmodel}</p>
                  </div>
                )}
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
        tabIndex={relatedTabIndex}
        setTabIndex={setRelatedTabIndex}
        object={object}
        navigateTo='publication'
        user={user}
      />
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationProduct));
