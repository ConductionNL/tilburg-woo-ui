import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import RelatedTabs from './con-related-tabs';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { normalizeSchemaName } from '@src/utilities/con-normalize-schema-name';
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
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';

const AcPublicationContactperson = ({ store: { publications, object, user } }) => {
  const { id } = useParams();
  const { get_single, loading, attachments } = publications;

  const navigate = useNavigate();

  const schemaId =
    typeof get_single?.['@self']?.schema === 'object'
      ? get_single?.['@self']?.schema.id
      : get_single?.['@self']?.schema;
  const schemaSlug = useMemo(
    () => (schemaId ? schemaCache.get(schemaId) : null),
    [schemaId]
  );

  // Use the same related actions hook as beheer pages
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

  // Exclude specific schemas from actions
  const excludeSchemas = useMemo(
    () => ['organisatie', 'product', 'dienst', 'gebruik', 'module', 'suite'],
    []
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: schemaSlug,
    currentType: schemaSlug, // Use schema slug as current type
    openDynamicCreate,
    currentObject: get_single,
    excludeSchemas,
  });

  // Generate action menu items
  const [actionMenuItems, setActionMenuItems] = useState([]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  useEffect(() => {
    if (!schemaSlug || !id) return;

    const items = makeActionsForContext(
      id,
      null,
      get_single,
      'voorzieningen',
      schemaSlug
    ).map(({ key, label, onClick, schema, icon }) => ({
      key,
      label,
      onClick,
      schema,
      icon,
    }));

    setActionMenuItems(items);
  }, [schemaSlug, id, makeActionsForContext, get_single]);

  // Tabs
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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses`,
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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used`,
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
  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer margin='xl'>
        <AcFlex column spacing='sm'>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
            <Heading level={4} className='con-product-publication--header-container'>
              <div className='con-beheer-details--header-container'>
                {(get_single?.['@self']?.image || get_single?.image) && (
                  <ConLogoPreview
                    className='con-beheer-details--logo-container'
                    logoUrl={get_single?.['@self']?.image || get_single?.image}
                  />
                )}

                <Heading className='con-beheer-details--title'>
                  {`${get_single?.voornaam} ${get_single?.tussenvoegsel || ''} ${
                    get_single?.achternaam
                  }` || 'Contactpersoon'}
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
            {(get_single?.['e-mailadres'] ||
              get_single?.telefoonnummer ||
              get_single?.website) && (
              <AcFlex column spacing='sm' style={{ flex: 1 }}>
                <div className='ac-register-review__section'>
                  <div style={{ marginTop: '12px' }}>
                    {get_single?.functie && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Functie: </strong>
                        {get_single?.functie}
                      </div>
                    )}

                    {typeof get_single?.['e-mailadres'] === 'string' &&
                      get_single?.['e-mailadres'] && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '8px',
                          }}
                        >
                          <strong>E‑mail: </strong>
                          <Link href={`mailto:${get_single?.['e-mailadres']}`}>
                            {get_single?.['e-mailadres']}
                          </Link>
                        </div>
                      )}
                    {get_single?.telefoonnummer && (
                      <div
                        style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}
                      >
                        <strong>Telefoon: </strong>
                        <Link
                          href={`tel:${String(get_single?.telefoonnummer)
                            .split('')
                            .filter((i) => i !== ' ')
                            .join('')}`}
                        >
                          {get_single?.telefoonnummer}
                        </Link>
                      </div>
                    )}
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Organisatie: </strong>
                      <ConUuidResolver>{get_single?.organisatie}</ConUuidResolver>
                    </div>
                  </div>
                </div>
              </AcFlex>
            )}
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
            tabIndex={tabIndex}
            setTabIndex={setTabIndex}
            object={object}
            navigateTo='publication'
            user={user}
          />
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublicationContactperson));
