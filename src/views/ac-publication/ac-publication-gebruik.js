import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router-dom';
import { AcColumn, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { VISUALS } from '@constants';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

/**
 * Publication page for schema slug 'gebruik'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationGebruik = ({ store: { publications, user, object } }) => {
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

  // Derived data / field mapping
  const contactId = useMemo(() => {
    if (Array.isArray(get_single?.contactpersoon))
      return get_single.contactpersoon[0];
    return get_single?.contactpersoon;
  }, [get_single]);

  const afnemerId = useMemo(() => {
    return get_single?.afnemer || get_single?.organisatieId || null;
  }, [get_single]);

  const productId = useMemo(() => {
    return get_single?.product || get_single?.voorzieningId || null;
  }, [get_single]);

  const moduleId = useMemo(() => {
    return (
      get_single?.module ||
      get_single?.moduleversie ||
      get_single?.moduleVersie ||
      null
    );
  }, [get_single]);

  const status = get_single?.status || '-';
  const statusDateKey = useMemo(() => {
    if (status === 'In productie') return 'startDatumInProductie';
    if (status === 'Gepland') return 'startDatumGepland';
    if (status === 'Uit te faseren') return 'startDatumUitTeFaseren';
    if (status === 'Uit gefaseerd') return 'startDatumUitGefaseerd';
    return 'startDatumVerwerving';
  }, [status]);
  const statusDate = get_single?.[statusDateKey] || null;

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl' className='ac-publication-container'>
      <AcColumn gap='sm' horizontalOverflowWrapper>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <Heading className='con-beheer-details--title'>
            {get_single?.['@self']?.name || get_single?.id}
          </Heading>

          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={get_single?.['@self']?.schema?.slug}
            title={get_single?.id}
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

        <Heading level={3} style={{ marginBlockStart: '1rem' }}>
          Basisinformatie
        </Heading>
        <div className='ac-register-review__section'>
          <div style={{ marginTop: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Status: </strong>
              {status}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Datum ({status}): </strong>
              {statusDate || '-'}
            </div>
            {Array.isArray(get_single?.diensten) &&
              get_single.diensten.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Diensten: </strong>
                  <div>
                    {get_single.diensten.map((did, idx) => (
                      <div key={`${String(did)}-${idx}`}>
                        {typeof did === 'string' &&
                        did.match(/^[0-9a-fA-F-]{36}$/) ? (
                          <ConUuidResolver>{String(did)}</ConUuidResolver>
                        ) : (
                          String(did)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {(contactId ||
          afnemerId ||
          productId ||
          moduleId ||
          (Array.isArray(get_single?.gebruiktVoorReferentiecomponenten) &&
            get_single.gebruiktVoorReferentiecomponenten.length > 0) ||
          (Array.isArray(get_single?.koppelingen) &&
            get_single.koppelingen.length > 0) ||
          Array.isArray(get_single?.deelnemers)) && (
          <>
            <Heading level={3} style={{ marginBlockStart: '1rem' }}>
              Relaties
            </Heading>
            <div className='ac-register-review__section'>
              <div style={{ marginTop: '12px' }}>
                {contactId && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Contactpersoon: </strong>
                    <ConUuidResolver>{String(contactId)}</ConUuidResolver>
                  </div>
                )}

                {afnemerId && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Afnemer: </strong>
                    <ConUuidResolver>{String(afnemerId)}</ConUuidResolver>
                  </div>
                )}

                {productId && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Product: </strong>
                    <ConUuidResolver>{String(productId)}</ConUuidResolver>
                  </div>
                )}

                {moduleId && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Module/versie: </strong>
                    <ConUuidResolver>{String(moduleId)}</ConUuidResolver>
                  </div>
                )}

                {Array.isArray(get_single?.gebruiktVoorReferentiecomponenten) &&
                  get_single.gebruiktVoorReferentiecomponenten.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Referentiecomponenten: </strong>
                      <div>
                        {get_single.gebruiktVoorReferentiecomponenten.map(
                          (rid, idx) => (
                            <div key={`${rid}-${idx}`}>
                              <ConUuidResolver>{String(rid)}</ConUuidResolver>
                            </div>
                          )
                        )}
                      </div>
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

                <div style={{ marginBottom: '8px' }}>
                  <strong>Deelnemers: </strong>
                  {Array.isArray(get_single?.deelnemers) &&
                  get_single.deelnemers.length > 0 ? (
                    <div>
                      {get_single.deelnemers.map((pid, idx) => (
                        <div key={`${String(pid)}-${idx}`}>
                          <ConUuidResolver>{String(pid)}</ConUuidResolver>
                        </div>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
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

export default withStore(observer(AcPublicationGebruik));
