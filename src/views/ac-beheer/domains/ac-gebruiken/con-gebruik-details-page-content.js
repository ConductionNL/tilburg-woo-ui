import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
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

  if (loading || !data) return null;

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
            <ConUuidResolver>
              <Heading className='con-beheer-details--title'>{data?.id}</Heading>
            </ConUuidResolver>
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
        </div>

        {Array.isArray(data?.gebruiktVoorReferentiecomponenten) &&
          data.gebruiktVoorReferentiecomponenten.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Referentiecomponenten: </strong>
              <div>
                {data.gebruiktVoorReferentiecomponenten.map((rid, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <Link
                      href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${rid}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ConUuidResolver>{String(rid)}</ConUuidResolver>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {id && (
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
            navigateTo='beheer'
          />
        </div>
      )}
    </AcColumn>
  );
};

export default ConGebruikDetailsPageContent;
