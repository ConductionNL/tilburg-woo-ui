import {
  Heading,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn, AcFlex } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';

/**
 * Koppeling Details Content
 * - Shows basic info and resolves moduleA/moduleB via @self.relations if fields are null
 */
const ConKoppelingDetailsPageContent = ({
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

  // Resolve module ids, fallback to @self.relations
  const moduleAId = useMemo(() => {
    return data?.moduleA || data?.['@self']?.relations?.moduleA || null;
  }, [data]);

  const moduleBId = useMemo(() => {
    return data?.moduleB || data?.['@self']?.relations?.moduleB || null;
  }, [data]);

  const richting = useMemo(() => {
    return (
      data?.richtingDataUitwisseling ||
      data?.gegevensuitwisselingRichting ||
      data?.['@self']?.relations?.richtingDataUitwisseling ||
      'bi-directioneel'
    );
  }, [data]);

  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat de koppeling niet gevonden is',
      };
  const actualCanEdit = canEdit && hasEditPermission;

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  if (loading || !data) return null;

  const title = data?.naam || data?.['@self']?.name || data?.['@self']?.id;

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
            <Heading className='con-beheer-details--title'>{title}</Heading>
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

      <UnpublishedWarning data={data} />

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
            {richting} ({richting === 'AnaarB' ? '→' : richting === 'BnaarA' ? '←' : '↔'})
          </div>
          {data?.soortKoppeling && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Soort koppeling: </strong>
              {data.soortKoppeling}
            </div>
          )}
          {data?.type && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Type: </strong>
              {data.type}
            </div>
          )}
          {data?.status && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Status: </strong>
              {data.status}
            </div>
          )}
          {data?.dienst && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Dienst: </strong>
              <ConUuidResolver>{String(data.dienst)}</ConUuidResolver>
            </div>
          )}
        </div>
      </div>

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

/* Warning card for unpublished objects */
const UnpublishedWarning = ({ data }) => {
  if (data?.['@self']?.published) return null;
  const schemaName = data?.['@self']?.schema?.title;
  const title = schemaName ? `${schemaName}` : '';
  const objectName = data?.['@self']?.name;

  return (
    <Alert type='warning' style={{ marginBottom: '1rem' }}>
      <Heading level={4}>{title} is nog niet gepubliceerd</Heading>
      <Paragraph>
        {objectName} is momenteel niet zichtbaar in de zoekfunctie. Gebruik de
        "Publiceren" actie om deze gegevens zichtbaar te maken.
      </Paragraph>
    </Alert>
  );
};

export default ConKoppelingDetailsPageContent;
