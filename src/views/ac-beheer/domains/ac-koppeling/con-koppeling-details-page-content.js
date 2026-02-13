import { Heading } from '@utrecht/component-library-react/dist/css-module';
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
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { AcFormatDate } from '@src/utilities/ac-format-date';

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

/**
 * Gets all dates that have values, to show the full history/trail of status changes.
 * Returns an array of date objects with label and formatted value.
 */
const getAllDatesWithValues = (data) => {
  const dates = [];

  if (data?.datumInOntwikkeling) {
    dates.push({
      label: 'Startdatum In ontwikkeling',
      value: AcFormatDate(data.datumInOntwikkeling, 'YYYY-MM-DD', 'D MMMM YYYY'),
    });
  }

  if (data?.datumInGebruik) {
    dates.push({
      label: 'Startdatum In gebruik',
      value: AcFormatDate(data.datumInGebruik, 'YYYY-MM-DD', 'D MMMM YYYY'),
    });
  }

  if (data?.datumEindeOndersteuning) {
    dates.push({
      label: 'Startdatum Einde ondersteuning',
      value: AcFormatDate(data.datumEindeOndersteuning, 'YYYY-MM-DD', 'D MMMM YYYY'),
    });
  }

  if (data?.datumTeruggetrokken) {
    dates.push({
      label: 'Startdatum Teruggetrokken',
      value: AcFormatDate(data.datumTeruggetrokken, 'YYYY-MM-DD', 'D MMMM YYYY'),
    });
  }

  return dates;
};

/**
 * Koppeling Details Content
 * - Shows basic info and resolves moduleA/moduleB via @self.relations if fields are null
 */
const ConKoppelingDetailsPageContent = ({
  loading,
  data,
  userStore: user,
  objectStore: object,
  id,
  canEdit = false,
  actionMenuProps,
  config,
}) => {
  const navigate = useNavigate();
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

  // Resolve module ids, fallback to @self.relations
  const moduleAId = useMemo(() => {
    return data?.['@self']?.relations?.moduleA || null;
  }, [data]);

  const moduleBId = useMemo(() => {
    return data?.['@self']?.relations?.moduleB || null;
  }, [data]);

  const richting = useMemo(() => {
    return (
      data?.richtingDataUitwisseling ||
      data?.gegevensuitwisselingRichting ||
      data?.['@self']?.relations?.richtingDataUitwisseling ||
      'bi-directioneel'
    );
  }, [data]);

  const intermediairId = useMemo(() => {
    return (
      data?.['@self']?.relations?.gerealiseerdMetIntermediairModule ||
      data?.gerealiseerdMetIntermediairModule ||
      null
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
        <div className='con-beheer-details--header-container'>
          <Heading className='con-beheer-details--title'>{title}</Heading>
        </div>
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
                  onClick={() => {
                    // Prefer wizard editing when available; fallback to legacy modal
                    if (config?.schemaSlug) {
                      const wizards = Object.values(DASHBOARD_WIZARDS);
                      const wizard = wizards.find(
                        (w) => w.schema === config.schemaSlug
                      );

                      if (wizard) {
                        const baseUrl = getWizardUrl(wizard);
                        const url = new URL(baseUrl, window.location.origin);
                        url.searchParams.set('id', id);
                        navigate(url.pathname + url.search);
                        return;
                      }
                    }

                    // Fallback to modal
                    actionMenuProps?.setOpenModal?.('edit');
                  }}
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

                {/* Publish/Depublish actions - LEGACY: No longer needed */}
                {/* {data && !data['@self']?.published && (
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
                )} */}

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

      {/* Unpublished warning - LEGACY: No longer needed */}
      {/* <UnpublishedWarning data={data} /> */}

      {/* Short description */}
      <div style={{ flex: 2 }}>
        {/* <ConEditableDescription
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          field='beschrijvingKort'
          label='Korte beschrijving'
          placeholder='Een korte beschrijving van de dienst'
          tooltip='Een korte beschrijving van de dienst'
          maxLength={255}
          isMarkdown={false}
          value={data.beschrijvingKort}
          serialize={(v) => v}
          deserialize={(v) => v || ''}
          onSuccess={(v) => {
            data.beschrijvingKort = v;
            // No data refresh needed - data already updated locally
          }}
        /> */}

        {/* Visual representation - Short description */}
        {!!data?.beschrijvingKort && <div>{data.beschrijvingKort}</div>}
      </div>

      {/* Long description */}
      <div>
        {/* <br />
        <ConEditableDescription
          markdownPreviewClassName='con-my-account-description'
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          field='beschrijvingLang'
          label='Lange beschrijving'
          placeholder='Een uitgebreide beschrijving van de dienst'
          tooltip='Een uitgebreide beschrijving van de dienst'
          maxLength={5000}
          isMarkdown={true}
          value={data.beschrijvingLang}
          serialize={(v) => JSON.stringify(v || '')}
          deserialize={(v) => {
            if (!v) return '';
            try {
              return JSON.parse(v) || '';
            } catch (e) {
              return v;
            }
          }}
          onSuccess={(v) => {
            data.beschrijvingLang = v;
            // No data refresh needed - data already updated locally
          }}
        /> */}
        {!!data?.beschrijvingLang && (
          <>
            <br />
            <MDEditor.Markdown
              wrapperElement={{
                'data-color-mode': 'light',
              }}
              source={(() => {
                try {
                  return JSON.parse(data.beschrijvingLang) || '';
                } catch (e) {
                  return data.beschrijvingLang || '';
                }
              })()}
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
          </>
        )}
      </div>
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
          {data?.soortKoppeling && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Soort koppeling: </strong>
              {data.soortKoppeling}
            </div>
          )}
          {data?.type && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Transportprotocol: </strong>
              {data.type}
            </div>
          )}
          {data?.status && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Status: </strong>
              {data.status}
            </div>
          )}
          {(() => {
            const allDates = getAllDatesWithValues(data);
            return allDates.length > 0
              ? allDates.map((dateInfo, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <strong>{dateInfo.label}: </strong>
                    {dateInfo.value}
                  </div>
                ))
              : null;
          })()}
          {data?.beschrijvingKort && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Korte beschrijving: </strong>
              {data.beschrijvingKort}
            </div>
          )}
          {intermediairId && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Intermediair: </strong>
              <ConUuidResolver>{String(intermediairId)}</ConUuidResolver>
            </div>
          )}
          {data?.standaardversies && data.standaardversies.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Standaardversies:</strong>
              <ul
                style={{
                  margin: '0.5rem 0 0 0',
                  paddingInlineStart: '1.25rem',
                  listStyleType: 'disc',
                }}
              >
                {data.standaardversies.map((s) => (
                  <li key={s} style={{ marginBottom: '0.25rem' }}>
                    <ConUuidResolver>{String(s)}</ConUuidResolver>
                  </li>
                ))}
              </ul>
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
            id={id}
            uses={uses}
            used={used}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            gebruikId={id}
            gebruikSchemaId={data?.['@self']?.schema}
            tabIndex={relatedTabIndex}
            setTabIndex={setRelatedTabIndex}
            object={object}
            navigateTo='beheer'
            user={user}
          />
        </div>
      )}
    </AcColumn>
  );
};

/* Warning card for unpublished objects - LEGACY: No longer needed */
// const UnpublishedWarning = ({ data }) => {
//   if (data?.['@self']?.published) return null;
//   const schemaName = data?.['@self']?.schema?.title;
//   const title = schemaName ? `${schemaName}` : '';
//   const objectName = data?.['@self']?.name;
//
//   return (
//     <Alert type='warning' style={{ marginBottom: '1rem' }}>
//       <Heading level={4}>{title} is nog niet gepubliceerd</Heading>
//       <Paragraph>
//         {objectName} is momenteel niet zichtbaar in de zoekfunctie. Gebruik de
//         &quot;Publiceren&quot; actie om deze gegevens zichtbaar te maken.
//       </Paragraph>
//     </Alert>
//   );
// };

export default ConKoppelingDetailsPageContent;
