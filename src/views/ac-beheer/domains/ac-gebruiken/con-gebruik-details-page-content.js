import { Heading, Alert } from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import { VISUALS } from '@src/constants';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import { TOOLTIP_ID } from '@src/index.web';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';

/**
 * Content for the gebruik details page
 */
const ConGebruikDetailsPageContent = ({
  loading,
  data,
  config,
  userStore: user,
  objectStore: object,
  id,
  canEdit = false,
  actionMenuProps,
}) => {
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat het gebruik niet gevonden is',
      };
  const actualCanEdit = canEdit && hasEditPermission;

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
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  if (loading || !data) return null;

  // Resolve UUID fields and optional fields
  const contactId = Array.isArray(data?.contactpersoon)
    ? data.contactpersoon[0]
    : data?.contactpersoon;
  const afnemerId = data?.afnemer || data?.organisatieId || null;
  const productId = data?.product || data?.voorzieningId || null;
  const moduleId = data?.module || data?.moduleversie || data?.moduleVersie || null;

  // Determine date field based on status
  const status = data?.status || '-';
  const statusDateKey = useMemo(() => {
    if (status === 'In productie') return 'startDatumInProductie';
    if (status === 'Gepland') return 'startDatumGepland';
    if (status === 'Uit te faseren') return 'startDatumUitTeFaseren';
    if (status === 'Uit gefaseerd') return 'startDatumUitGefaseerd';
    return 'startDatumVerwerving';
  }, [status]);
  const statusDate = data?.[statusDateKey] || null;

  return (
    <AcColumn gap='sm' horizontalOverflowWrapper>
      <div
        className='ac-register-review__organisation-header'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Heading level={4}>
          <div className='con-beheer-details--header-container'>
            <Heading className='con-beheer-details--title'>{data?.id}</Heading>
          </div>
        </Heading>
        <div className='ac-register-review__header-controls'>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ConActionMenu>
              <ConActionMenu.Trigger
                icon={<VISUALS.ELLIPSIS />}
                buttonType='primary'
              >
                Acties
              </ConActionMenu.Trigger>
              <ConActionMenu.Menu position='right'>
                <ConActionMenu.Button
                  icon={<VISUALS.PENCIL />}
                  onClick={() => actionMenuProps?.setOpenModal?.('edit')}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('edit', reason)
                      : undefined
                  }
                >
                  Bewerken
                </ConActionMenu.Button>

                {data && !data['@self']?.published && (
                  <ConActionMenu.Button
                    icon={<VISUALS.PUBLISH />}
                    onClick={() => actionMenuProps?.setOpenModal?.('publish')}
                    disabled={!actualCanEdit}
                    data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                    data-tooltip-content={
                      !actualCanEdit
                        ? getDisabledActionTooltip('publish', reason)
                        : undefined
                    }
                  >
                    Publiceren
                  </ConActionMenu.Button>
                )}

                {data && data['@self']?.published && (
                  <ConActionMenu.Button
                    icon={<VISUALS.PUBLISH_OFF />}
                    onClick={() => actionMenuProps?.setOpenModal?.('depublish')}
                    disabled={!actualCanEdit}
                    data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                    data-tooltip-content={
                      !actualCanEdit
                        ? getDisabledActionTooltip('depublish', reason)
                        : undefined
                    }
                  >
                    Depubliceren
                  </ConActionMenu.Button>
                )}

                <ConActionMenu.Button
                  icon={<VISUALS.TRASHCAN />}
                  onClick={() => actionMenuProps?.setOpenModal?.('delete')}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('delete', reason)
                      : undefined
                  }
                >
                  Verwijderen
                </ConActionMenu.Button>
              </ConActionMenu.Menu>
            </ConActionMenu>
          </div>
        </div>
      </div>

      {/* Basisinformatie */}
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
          {Array.isArray(data?.diensten) && data.diensten.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Diensten: </strong>
              <div>
                {data.diensten.map((did, idx) => (
                  <div key={`${String(did)}-${idx}`}>
                    {/* Some datasets use names here, others UUIDs */}
                    {typeof did === 'string' && did.match(/^[0-9a-fA-F-]{36}$/) ? (
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

      {/* Relaties */}
      {(contactId ||
        afnemerId ||
        productId ||
        moduleId ||
        (Array.isArray(data?.gebruiktVoorReferentiecomponenten) &&
          data.gebruiktVoorReferentiecomponenten.length > 0) ||
        (Array.isArray(data?.koppelingen) && data.koppelingen.length > 0) ||
        Array.isArray(data?.deelnemers)) && (
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

              {Array.isArray(data?.gebruiktVoorReferentiecomponenten) &&
                data.gebruiktVoorReferentiecomponenten.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Referentiecomponenten: </strong>
                    <div>
                      {data.gebruiktVoorReferentiecomponenten.map((rid, idx) => (
                        <div key={`${rid}-${idx}`}>
                          <ConUuidResolver>{String(rid)}</ConUuidResolver>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Koppelingen */}
              {Array.isArray(data?.koppelingen) && data.koppelingen.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Koppelingen: </strong>
                  <div>
                    {data.koppelingen.map((kid, idx) => (
                      <div key={`${kid}-${idx}`}>
                        <ConUuidResolver>{String(kid)}</ConUuidResolver>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deelnemers (show even when empty) */}
              <div style={{ marginBottom: '8px' }}>
                <strong>Deelnemers: </strong>
                {Array.isArray(data?.deelnemers) && data.deelnemers.length > 0 ? (
                  <div>
                    {data.deelnemers.map((pid, idx) => (
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

      {id && (
        <div style={{ marginTop: '2rem' }}>
          <RelatedTabs
            uses={uses}
            used={used}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            tabIndex={relatedTabIndex}
            setTabIndex={setRelatedTabIndex}
            object={object}
            navigateTo='beheer'
          />
        </div>
      )}
    </AcColumn>
  );
};

export default ConGebruikDetailsPageContent;
