import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router-dom';
import { AcColumn, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu, ConExternalLink, ConPublicationTypeBadge } from '@components';
import { VISUALS } from '@constants';
import { AcButton } from '@molecules';
import {
  Heading,
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
import RelatedTabs from '@views/ac-publication/con-related-tabs-new';
import ConLogoPreview from '../ac-register/con-logo-preview';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';

// Markdown rendering
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import remarkRehype from 'remark-rehype';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { useResolveSchemaIds } from '@src/hooks/use-resolve-schema-ids.hook';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
// import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';
import { normalizeSchemaName } from '@src/utilities/con-normalize-schema-name';
// import { checkOrganizationPermissions } from '@utils/organization-permissions';

/**
 * Publication page for schema slug 'dienst'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationDienst = ({ store: { publications, user, object } }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get_single, loading } = publications;

  const schemaId =
    typeof get_single?.['@self']?.schema === 'object'
      ? get_single?.['@self']?.schema.id
      : get_single?.['@self']?.schema;
  const schemaSlug = useMemo(
    () => (schemaId ? schemaCache.get(schemaId) : null),
    [schemaId]
  );

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);
  
  // Aggregated schemas from all related items via hook
  const allRelatedItems = useMemo(() => [...uses, ...used], [uses, used]);
  const { aggregatedSchemas } = useResolveSchemaIds(allRelatedItems);

  // Related create actions (wizard-aware) like module/product pages
  const openDynamicCreate = useCallback(
    (targetType, preSelected, metadata = {}) => {
      if (metadata.isOutgoing) {
        // reserved for future use
      }
      navigate(`/beheer/${targetType}?showCreateModal=true&voorzieningId=${id}`);
    },
    [navigate, id]
  );

  // Exclude specific schemas from actions
  const excludeSchemas = useMemo(
    () => [
      'contract',
      'beoordeeling',
      'gebruik',
      'koppeling',
      'module',
      'contactpersoon',
      'organisatie',
    ],
    []
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: schemaSlug,
    currentType: schemaSlug,
    openDynamicCreate,
    currentObject: get_single,
    excludeSchemas,
  });

  const [, setActionMenuItems] = useState([]);

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

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=_schema`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const json = await response.json();
      setUses(json.results || []);
    } finally {
      setUsesLoading(false);
    }
  }, [id]);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=_schema`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const json = await response.json();
      setUsed(json.results || []);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchUses();
    fetchUsed();
  }, [id, fetchUses, fetchUsed]);

  // Extract contactpersoon from get_single (extended) or fallback to uses data
  const contact = useMemo(() => {
    const contactpersoon = get_single?.contactpersoon;

    if (contactpersoon) {
      // If contactpersoon is an array of objects, use the first one
      if (Array.isArray(contactpersoon) && contactpersoon.length > 0) {
        const firstContact = contactpersoon[0];
        // Check if it's an object (extended) or just a string (UUID)
        if (typeof firstContact === 'object' && firstContact !== null) {
          return firstContact;
        }
      }
      // If contactpersoon is a single object (not array, not string UUID)
      if (typeof contactpersoon === 'object' && !Array.isArray(contactpersoon)) {
        return contactpersoon;
      }
    }

    // Fallback: Find contactpersoon in uses array
    if (!uses?.length) return null;

    const contactpersoonObject = uses.find((use) => {
      const useSchemaId = use?.['@self']?.schema;
      const useSchemaSlug = useSchemaId ? schemaCache.get(useSchemaId) : null;
      return useSchemaSlug === 'contactpersoon';
    });

    return contactpersoonObject || null;
  }, [get_single?.contactpersoon, uses]);

  // For backward compatibility - get contactId for cases where we only have a UUID string
  const contactId = useMemo(() => {
    const contactpersoon = get_single?.contactpersoon;
    if (Array.isArray(contactpersoon) && contactpersoon.length > 0) {
      const firstContact = contactpersoon[0];
      if (typeof firstContact === 'string') {
        return firstContact;
      }
    }
    if (typeof contactpersoon === 'string') {
      return contactpersoon;
    }
    return null;
  }, [get_single?.contactpersoon]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl' className='ac-publication-container'>
      <AcColumn gap='sm' horizontalOverflowWrapper>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <div className='con-beheer-details--header-container'>
            {(get_single?.logo || get_single?.['@self']?.image) && (
              <ConLogoPreview
                className='con-beheer-details--logo-container'
                logoUrl={get_single?.logo || get_single?.['@self']?.image}
                objectSelf={get_single?.['@self']}
              />
            )}
            <Heading className='con-beheer-details--title'>
              {get_single?.naam ||
                get_single?.['@self']?.name ||
                get_single?.['@self']?.id}
            </Heading>
          </div>

          <Heading className='con-module-publication--header-type'>
            <ConPublicationTypeBadge schemaSlug={schemaSlug} />
          </Heading>
          {schemaSlug &&
            (() => {
              const userGroups =
                user?.currentUser?.groups || user?.user?.groups || [];
              const hasGebruikBeheerder = userGroups.includes('gebruik-beheerder');

              // Check if user is the owner of the object
              const userActiveOrg = user?.activeOrganization;
              const objectOrg = get_single?.['@self']?.organisation;
              const userOrgId = userActiveOrg?.uuid || userActiveOrg?.id;
              const objectOrgId =
                typeof objectOrg === 'string'
                  ? objectOrg
                  : objectOrg?.id || objectOrg?.uuid;
              const isOwner = userOrgId && objectOrgId && userOrgId === objectOrgId;

              // For GebruikBeheerder, show a single button only if not the owner
              // If owner, show the actions menu
              if (hasGebruikBeheerder && !isOwner) {
                return (
                  <AcButton
                    style='button'
                    buttonType='primary'
                    icon={<VISUALS.PLUS />}
                    onClick={() => {
                      const params = new URLSearchParams({
                        type: 'ontbrekend-dienst',
                        dienst: id,
                      });
                      navigate(`/forms/gebruik/dienst?${params.toString()}`);
                    }}
                  />
                );
              }

              // For AanbodBeheerder or GebruikBeheerder who owns the object, show the actions menu
              return (
                <ConDetailsActionsMenu
                  user={user}
                  id={id}
                  schemaSlug={schemaSlug}
                  title={get_single?.['@self']?.name || get_single?.id}
                  published={get_single?.['@self']?.published}
                  object={get_single}
                  showViewAction={false}
                  showEditAction={true}
                  showPublishActions={false} // LEGACY: Changed from true - Publish actions no longer needed
                  onDelete={handleDelete}
                  onEdit={() => {
                    if (schemaSlug) {
                      const wizardSchemaName =
                        normalizeSchemaName(schemaSlug).toLowerCase();
                      const wizards = Object.values(DASHBOARD_WIZARDS);
                      const wizard = wizards.find(
                        (w) => w.schema === wizardSchemaName
                      );
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
              );
            })()}
        </AcFlex>

        {/* Unpublished warning - LEGACY: No longer needed */}
        {/* {!get_single?.['@self']?.published && (
          <Alert type='warning' style={{ marginBottom: '1rem' }}>
            <Heading level={4}>Dienst is nog niet gepubliceerd</Heading>
            <Paragraph>
              Deze dienst is momenteel niet zichtbaar in de zoekfunctie. Gebruik de
              &quot;Publiceren&quot; actie om deze gegevens zichtbaar te maken.
            </Paragraph>
          </Alert>
        )} */}

        <div style={{ flex: 2 }}>
          {!!get_single?.beschrijvingKort && (
            <div>
              {get_single?.beschrijvingKort}
            </div>
          )}
        </div>

        <div>
          <br />
          {!!get_single?.beschrijvingLang && (
            <MDEditor.Markdown
              wrapperElement={{ 'data-color-mode': 'light' }}
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
        </div>

        {(contact || contactId || get_single?.website) && (
          <>
            <Heading level={3} style={{ marginBlockStart: '1rem' }}>
              Contact informatie
            </Heading>
            <div className='ac-register-review__section'>
              <div style={{ marginTop: '12px' }}>
                {get_single?.website && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <strong>Website:</strong>
                    <ConExternalLink href={get_single?.website} />
                  </div>
                )}
                {contact && typeof contact === 'object' ? (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Contactpersoon: </strong>
                    <div>
                      {[contact.voornaam, contact.tussenvoegsel, contact.achternaam]
                        .filter(Boolean)
                        .join(' ')}
                    </div>
                    {contact['e-mailadres'] && (
                      <div>
                        <Link href={`mailto:${contact['e-mailadres']}`} style={{ minHeight: '24px' }}>
                          {contact['e-mailadres']}
                        </Link>
                      </div>
                    )}
                    {contact.telefoonnummer && (
                      <div>
                        <Link
                          href={`tel:${String(contact.telefoonnummer)
                            .split('')
                            .filter((character) => character !== ' ')
                            .join('')}`}
                          style={{ minHeight: '24px' }}
                        >
                          {contact.telefoonnummer}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : contactId ? (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Contactpersoon: </strong>
                    <ConUuidResolver>{String(contactId)}</ConUuidResolver>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}

        {(get_single?.type || get_single?.status) && (
          <>
            <Heading level={3} style={{ marginBlockStart: '1rem' }}>
              Basisinformatie
            </Heading>
            <div className='ac-register-review__section'>
              <div style={{ marginTop: '12px' }}>
                {get_single?.dienstType && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Diensttype: </strong>
                    {get_single.type}
                  </div>
                )}
                {get_single?.status && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Status: </strong>
                    {get_single.status}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '2rem' }}>
          <RelatedTabs
            uses={uses}
            used={used}
            schemas={aggregatedSchemas}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            excludeObjectIds={[]}
            tabIndex={relatedTabIndex}
            setTabIndex={setRelatedTabIndex}
            object={object}
            navigateTo='publication'
            user={user}
          />
        </div>

        <AcGenericBeheerDeleteModal
          objects={get_single ? [get_single] : []}
          showModal={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => navigate('/zoeken')}
        />
      </AcColumn>
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationDienst));
