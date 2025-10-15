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
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';

/**
 * Publication page for schema slug 'koppeling'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationKoppeling = ({ store: { publications, user, object } }) => {
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

  // Derived fields from get_single
  const title = useMemo(() => {
    return (
      get_single?.naam || get_single?.['@self']?.name || get_single?.['@self']?.id
    );
  }, [get_single]);

  const moduleAId = useMemo(() => {
    return get_single?.moduleA || get_single?.['@self']?.relations?.moduleA || null;
  }, [get_single]);

  const moduleBId = useMemo(() => {
    return get_single?.moduleB || get_single?.['@self']?.relations?.moduleB || null;
  }, [get_single]);

  const richting = useMemo(() => {
    return (
      get_single?.richtingDataUitwisseling ||
      get_single?.gegevensuitwisselingRichting ||
      get_single?.['@self']?.relations?.richtingDataUitwisseling ||
      'bi-directioneel'
    );
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl' className='ac-publication-container'>
      <AcColumn gap='sm' horizontalOverflowWrapper>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <Heading className='con-beheer-details--title'>{title}</Heading>

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
            title={title}
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
            <Heading level={4}>Koppeling is nog niet gepubliceerd</Heading>
            <Paragraph>
              Deze koppeling is momenteel niet zichtbaar in de zoekfunctie. Gebruik
              de &quot;Publiceren&quot; actie om deze gegevens zichtbaar te maken.
            </Paragraph>
          </Alert>
        )}

        <Heading level={3} style={{ marginBlockStart: '1rem' }}>
          Koppeling
        </Heading>
        <div className='ac-register-review__section'>
          <div style={{ marginTop: '12px' }}>
            <div style={{ marginBottom: '16px' }}>
              {(() => {
                const richtingIcon =
                  richting === 'AnaarB' ? '→' : richting === 'BnaarA' ? '←' : '↔';
                return (
                  <AcFlex spacing='xs'>
                    <ConUuidResolver>{String(moduleAId)}</ConUuidResolver>
                    {richtingIcon}
                    <ConUuidResolver>{String(moduleBId)}</ConUuidResolver>
                  </AcFlex>
                );
              })()}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Applicatie A: </strong>
              {moduleAId ? (
                <ConUuidResolver>{String(moduleAId)}</ConUuidResolver>
              ) : (
                '-'
              )}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Applicatie B: </strong>
              {moduleBId ? (
                <ConUuidResolver>{String(moduleBId)}</ConUuidResolver>
              ) : (
                '-'
              )}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Richting: </strong>
              {richting} (
              {richting === 'AnaarB' ? '→' : richting === 'BnaarA' ? '←' : '↔'})
            </div>
            {get_single?.soortKoppeling && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Soort koppeling: </strong>
                {get_single.soortKoppeling}
              </div>
            )}
            {get_single?.type && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Type: </strong>
                {get_single.type}
              </div>
            )}
            {get_single?.status && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Status: </strong>
                {get_single.status}
              </div>
            )}
            {get_single?.dienst && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Dienst: </strong>
                <ConUuidResolver>{String(get_single.dienst)}</ConUuidResolver>
              </div>
            )}
          </div>
        </div>

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

export default withStore(observer(AcPublicationKoppeling));
