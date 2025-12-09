import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router-dom';
import { AcColumn, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
// import { VISUALS } from '@constants';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
// import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';
// import { checkOrganizationPermissions } from '@utils/organization-permissions';

/**
 * Publication page for schema slug 'gebruik'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationGebruik = ({ store: { publications, user, object } }) => {
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
  const fetchedIds = useRef(new Set());

  // Resolved names state for referentiecomponenten (needed for sorting and GEMMA links)
  const [sortedReferentiecomponenten, setSortedReferentiecomponenten] = useState([]);

  // COMMENTED OUT: Only show standard actions (Bewerken, Publiceren/Depubliceren, Verwijderen)
  // Related create actions (wizard-aware) like module/product pages
  // const openDynamicCreate = useCallback(
  //   (targetType, preSelected, metadata = {}) => {
  //     if (metadata.isOutgoing) {
  //       // reserved for future use
  //     }
  //     navigate(`/beheer/${targetType}?showCreateModal=true&voorzieningId=${id}`);
  //   },
  //   [navigate, id]
  // );

  // Exclude specific schemas from actions
  // const excludeSchemas = useMemo(
  //   () => [
  //     'contract',
  //     'beoordeeling',
  //     'moduleversie',
  //     'module',
  //     'contactpersoon',
  //     'organisatie',
  //     'koppeling',
  //     'element',
  //     'dienst',
  //   ],
  //   []
  // );

  // const { makeActionsForContext } = useRelatedCreateActions({
  //   object,
  //   user,
  //   schemaRef: schemaSlug,
  //   currentType: schemaSlug,
  //   openDynamicCreate,
  //   currentObject: get_single,
  //   excludeSchemas,
  // });

  // const [actionMenuItems, setActionMenuItems] = useState([]);

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

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses`,
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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used`,
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

  // Resolve and sort referentiecomponenten alphabetically
  useEffect(() => {
    const resolveAndSortReferentiecomponenten = async () => {
      if (
        !get_single?.gebruiktVoorReferentiecomponenten ||
        !Array.isArray(get_single.gebruiktVoorReferentiecomponenten) ||
        get_single.gebruiktVoorReferentiecomponenten.length === 0
      ) {
        setSortedReferentiecomponenten([]);
        return;
      }

      const ids = get_single.gebruiktVoorReferentiecomponenten.map((refId) =>
        String(refId)
      );
      const namesMap = await object.getNamesForMultipleIds(ids);

      const withNames = ids
        .map((refId) => ({
          id: refId,
          label: namesMap[refId] || refId,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setSortedReferentiecomponenten(withNames);
    };

    resolveAndSortReferentiecomponenten();
  }, [get_single?.gebruiktVoorReferentiecomponenten, object]);

  const status = get_single?.status || '-';

  // Extract deelnemer IDs from the data
  const deelnemerIds = Array.isArray(get_single?.deelnemers)
    ? get_single.deelnemers.map((deelnemer) => {
        if (typeof deelnemer === 'object') {
          return String(deelnemer?.id || deelnemer?.['@self']?.id || deelnemer);
        }
        return String(deelnemer);
      })
    : [];

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl' className='ac-publication-container'>
      <AcColumn gap='sm' horizontalOverflowWrapper>
        <AcFlex spacing='sm' justifyContent='end' alignItems='center'>
          <Heading className='con-module-publication--header-type'>
            {(() => {
              const Icon = schemaSlug ? getTabHeaderIcon(schemaSlug) : null;
              return Icon ? <Icon /> : null;
            })()}
            {schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
          </Heading>
          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={schemaSlug}
            title={get_single?.id}
            published={get_single?.['@self']?.published}
            object={get_single}
            showViewAction={false}
            showEditAction={true}
            showPublishActions={true}
            onDelete={handleDelete}
            onEdit={() => {
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

        <Heading level={3} style={{ marginBlockStart: '1rem' }}>
          Basisinformatie
        </Heading>
        <div className='ac-register-review__section'>
          <div style={{ marginTop: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Status: </strong>
              {status}
            </div>
          </div>

          {sortedReferentiecomponenten.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Referentiecomponenten: </strong>
              <div>
                {sortedReferentiecomponenten.map((item) => (
                  <div key={item.id} style={{ marginBottom: '4px' }}>
                    <Link
                      href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${item.id}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deelnemerIds.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Deelnemers: </strong>
              <div>
                {deelnemerIds.map((deelnemerId) => (
                  <div key={deelnemerId} style={{ marginBottom: '4px' }}>
                    <ConUuidResolver>{deelnemerId}</ConUuidResolver>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
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

export default withStore(observer(AcPublicationGebruik));
