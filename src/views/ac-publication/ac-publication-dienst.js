import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router-dom';
import { AcColumn, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { VISUALS } from '@constants';
import {
  Heading,
  Paragraph,
  Link,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
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
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';

/**
 * Publication page for schema slug 'dienst'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationDienst = ({ store: { publications, user, object } }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get_single, loading } = publications;

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);
  const fetchedIds = useRef(new Set());

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

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: get_single?.['@self']?.schema?.slug,
    currentType: get_single?.['@self']?.schema?.slug,
    openDynamicCreate,
    currentObject: get_single,
    currentObjectRegister: 'voorzieningen',
    currentObjectSchema: get_single?.['@self']?.schema?.slug,
  });

  const [actionMenuItems, setActionMenuItems] = useState([]);

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

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=@self.schema`,
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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema`,
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
    if (!id || fetchedIds.current.has(id)) return;
    fetchedIds.current.add(id);
    fetchUses();
    fetchUsed();
  }, [id, fetchUses, fetchUsed]);

  const contactId = useMemo(() => {
    if (Array.isArray(get_single?.contactpersoon))
      return get_single.contactpersoon[0];
    return get_single?.contactpersoon;
  }, [get_single]);

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
              />
            )}
            <Heading className='con-beheer-details--title'>
              {get_single?.naam ||
                get_single?.['@self']?.name ||
                get_single?.['@self']?.id}
            </Heading>
          </div>

          <Heading className='con-module-publication--header-type'>
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
                const beheerUrl = `/beheer/${schemaSlug}/${id}`;
                window.open(beheerUrl, '_blank');
              }
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

        {!get_single?.['@self']?.published && (
          <Alert type='warning' style={{ marginBottom: '1rem' }}>
            <Heading level={4}>Dienst is nog niet gepubliceerd</Heading>
            <Paragraph>
              Deze dienst is momenteel niet zichtbaar in de zoekfunctie. Gebruik de
              &quot;Publiceren&quot; actie om deze gegevens zichtbaar te maken.
            </Paragraph>
          </Alert>
        )}

        <div style={{ flex: 2 }}>
          {!!get_single?.beschrijvingKort && (
            <div>{get_single?.beschrijvingKort}</div>
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

        {(contactId || get_single?.website) && (
          <>
            <Heading level={3} style={{ marginBlockStart: '1rem' }}>
              Contact informatie
            </Heading>
            <div className='ac-register-review__section'>
              <div style={{ marginTop: '12px' }}>
                {get_single?.website && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <strong>Website: </strong>
                    <Link
                      href={
                        get_single?.website.startsWith('http')
                          ? get_single?.website
                          : `https://${get_single?.website}`
                      }
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {get_single?.website}
                    </Link>
                  </div>
                )}
                {contactId && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Contactpersoon: </strong>
                    <ConUuidResolver>{String(contactId)}</ConUuidResolver>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {(get_single?.type || get_single?.dienstType || get_single?.status) && (
          <>
            <Heading level={3} style={{ marginBlockStart: '1rem' }}>
              Basisinformatie
            </Heading>
            <div className='ac-register-review__section'>
              <div style={{ marginTop: '12px' }}>
                {get_single?.type && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Type: </strong>
                    {get_single.type}
                  </div>
                )}
                {get_single?.dienstType && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Diensttype: </strong>
                    {get_single.dienstType}
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

        {(get_single?.aanbieder ||
          (Array.isArray(get_single?.producten) &&
            get_single.producten.length > 0) ||
          (Array.isArray(get_single?.koppelingen) &&
            get_single.koppelingen.length > 0) ||
          (Array.isArray(get_single?.modules) && get_single.modules.length > 0)) && (
          <>
            <Heading level={3} style={{ marginBlockStart: '1rem' }}>
              Relaties
            </Heading>
            <div className='ac-register-review__section'>
              <div style={{ marginTop: '12px' }}>
                {get_single?.aanbieder && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Aanbieder: </strong>
                    <ConUuidResolver>{String(get_single.aanbieder)}</ConUuidResolver>
                  </div>
                )}

                {Array.isArray(get_single?.koppelingen) &&
                  get_single.koppelingen.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Koppelingen: </strong>
                      <div>
                        {get_single.koppelingen.map((kid, idx) => (
                          <div key={`${kid}-${idx}`}>
                            <ConUuidResolver>{String(kid)}</ConUuidResolver>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {Array.isArray(get_single?.modules) &&
                  get_single.modules.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Modules: </strong>
                      <div>
                        {get_single.modules.map((mid, idx) => {
                          const moduleId = typeof mid === 'object' ? mid.id : mid;
                          return (
                            <div key={`${moduleId}-${idx}`}>
                              <ConUuidResolver>{String(moduleId)}</ConUuidResolver>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '2rem' }}>
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
