import {
  Heading,
  Paragraph,
  Link,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { ConExternalLink, ConUuidResolver } from '@src/components';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';

/**
 * Content for the product details page
 *
 * note:
 * Restructured to match con-my-organisation layout with vertical content flow
 * and integrated action menu.
 */
const ConProductDetailsPageContent = ({
  loading,
  data,
  config,
  userStore: user,
  objectStore: object,
  id,
  canEdit = false,
  actionMenuProps,
}) => {
  const navigate = useNavigate();
  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  // Editing state for inline editing
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

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
      setUses(data.results || []);
    } catch (error) {
      console.error('Error fetching uses:', error);
      setUses([]);
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
      setUsed(data.results || []);
    } catch (error) {
      console.error('Error fetching used:', error);
      setUsed([]);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  const contact = Array.isArray(data.contactpersoon)
    ? data.contactpersoon[0]
    : data.contactpersoon;

  // Check organization permissions for actions
  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat het product niet gevonden is',
      };

  const actualCanEdit = canEdit && hasEditPermission;

  // Setup dynamic create callback for related actions
  const openDynamicCreate = useCallback(
    (targetType, preSelected, metadata = {}) => {
      actionMenuProps?.setDynamicCreateTargetType?.(targetType);
      actionMenuProps?.setDynamicCreatePreSelected?.(preSelected);
      actionMenuProps?.setDynamicCreateMetadata?.(metadata);
      actionMenuProps?.setOpenModal?.('dynamicCreate');
    },
    [actionMenuProps]
  );

  // Initialize related create actions hook
  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: config?.schemaSlug,
    currentType: 'product',
    openDynamicCreate,
  });

  // Generate unique actions from config
  const uniqueActions = useMemo(() => {
    if (!config?.uniqueActions || !data) return [];
    return config.uniqueActions
      .filter((action) => action.condition?.(data))
      .map((action) => ({
        key: action.key,
        label: action.label,
        icon: action.icon,
        onClick: () => {
          if (action.action === 'wizard' && action.wizardPath) {
            const params = action.wizardParams ? action.wizardParams(data) : {};
            const searchParams = new URLSearchParams(params);
            const queryString = searchParams.toString();
            navigate(`${action.wizardPath}${queryString ? '?' + queryString : ''}`);
          } else if (typeof action.onClick === 'function') {
            action.onClick(data);
          } else {
            actionMenuProps?.setOpenModal?.(action.action);
          }
        },
      }));
  }, [config?.uniqueActions, data, navigate, actionMenuProps]);

  // Generate dynamic create actions
  const dynamicCreateActions = useMemo(() => {
    if (!id || config?.disableRelatedCreateActions) return [];
    return makeActionsForContext(
      id,
      config?.dynamicActionFilter,
      data,
      config?.registerSlug,
      config?.schemaSlug
    );
  }, [
    id,
    config?.disableRelatedCreateActions,
    config?.dynamicActionFilter,
    makeActionsForContext,
    data,
    config?.registerSlug,
    config?.schemaSlug,
  ]);

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  if (loading || !data) return null;

  return (
    <AcColumn gap='sm' horizontalOverflowWrapper>
      {/* Header with logo, title and actions */}
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
            {(data?.logo || data?.['@self']?.image) && (
              <ConLogoPreview
                className='con-beheer-details--logo-container'
                logoUrl={data?.logo || data?.['@self']?.image}
              />
            )}

            <Heading className='con-beheer-details--title'>
              {data?.naam || data?.['@self']?.name || data?.['@self']?.id}
            </Heading>
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

                {/* Unique actions from config */}
                {uniqueActions.map((action) => (
                  <ConActionMenu.Button
                    key={action.key}
                    icon={action.icon}
                    onClick={action.onClick}
                    disabled={!actualCanEdit}
                    data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                    data-tooltip-content={
                      !actualCanEdit
                        ? getDisabledActionTooltip(action.key, reason)
                        : undefined
                    }
                  >
                    {action.label}
                  </ConActionMenu.Button>
                ))}

                {/* Dynamic create actions */}
                {dynamicCreateActions.map((action) => (
                  <ConActionMenu.Button
                    key={action.key}
                    icon={action.icon}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </ConActionMenu.Button>
                ))}

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
        <ConEditableDescription
          registerSlug={data['@self'].register.slug}
          schemaSlug={data['@self'].schema.slug}
          objectId={data?.['@self']?.id}
          field='beschrijvingKort'
          label='Korte beschrijving'
          placeholder='Een korte beschrijving van het product'
          tooltip='Een korte beschrijving van het product'
          maxLength={255}
          isMarkdown={false}
          value={data.beschrijvingKort}
          isEditingCustomTrigger={editingSummary}
          serialize={(v) => v}
          deserialize={(v) => v || ''}
          onSuccess={() => setEditingSummary(false)}
          onCancel={() => setEditingSummary(false)}
          canEdit={actualCanEdit}
        />
      </div>

      {/* Long description */}
      <div>
        <br />
        <ConEditableDescription
          markdownPreviewClassName='con-my-account-description'
          registerSlug={data['@self'].register.slug}
          schemaSlug={data['@self'].schema.slug}
          objectId={data?.['@self']?.id}
          field='beschrijvingLang'
          label='Lange beschrijving'
          placeholder='Een uitgebreide beschrijving van het product'
          tooltip='Een uitgebreide beschrijving van het product'
          maxLength={5000}
          isMarkdown={true}
          isEditingCustomTrigger={editingDescription}
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
          onCancel={() => setEditingDescription(false)}
          onSuccess={() => setEditingDescription(false)}
          canEdit={actualCanEdit}
        />
      </div>

      {/* Contact Information Section */}
      {((contact && typeof contact === 'object') || data?.website) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Contact informatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.website && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <strong>Website:</strong>
                  <ConExternalLink href={data?.website} />
                </div>
              )}
              {contact && typeof contact === 'object' && (
                <>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Contactpersoon: </strong>
                    {[contact.voornaam, contact.tussenvoegsel, contact.achternaam]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                  {contact['e-mailadres'] && (
                    <div
                      style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}
                    >
                      <strong>Email: </strong>
                      <Link href={`mailto:${contact['e-mailadres']}`}>
                        {contact['e-mailadres']}
                      </Link>
                    </div>
                  )}
                  {contact.telefoonnummer && (
                    <div
                      style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}
                    >
                      <strong>Telefoon: </strong>
                      <Link
                        href={`tel:${String(contact.telefoonnummer)
                          .split('')
                          .filter((i) => i !== ' ')
                          .join('')}`}
                      >
                        {contact.telefoonnummer}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Extra Information Section */}
      {(data?.status ||
        data?.hostingLocatie ||
        data?.hostingJurisdictie ||
        (data?.cloudDienstverleningsmodel &&
          ((Array.isArray(data?.cloudDienstverleningsmodel) &&
            data?.cloudDienstverleningsmodel.length > 0) ||
            (typeof data?.cloudDienstverleningsmodel === 'string' &&
              data?.cloudDienstverleningsmodel.length > 0)))) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Extra informatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.status && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Status: </strong>
                  {data.status}
                </div>
              )}
              {data?.hostingLocatie && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>De applicatie wordt gehost in: </strong>
                  {data.hostingLocatie}
                </div>
              )}
              {data?.hostingJurisdictie && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>De data wordt opgeslagen in: </strong>
                  {data.hostingJurisdictie}
                </div>
              )}
              {data?.cloudDienstverleningsmodel &&
                ((Array.isArray(data?.cloudDienstverleningsmodel) &&
                  data?.cloudDienstverleningsmodel.length > 0) ||
                  (typeof data?.cloudDienstverleningsmodel === 'string' &&
                    data?.cloudDienstverleningsmodel.length > 0)) && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Hosting type: </strong>
                    {Array.isArray(data?.cloudDienstverleningsmodel)
                      ? data?.cloudDienstverleningsmodel.join(', ')
                      : data?.cloudDienstverleningsmodel}
                  </div>
                )}
            </div>
          </div>
        </>
      )}

      {/* Suitable For Section */}
      <SuitableForSection modules={data.modules} />

      {/* Related tabs */}
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

// Suitable For Section component
const SuitableForSection = ({ modules }) => {
  // Combine all referentieComponenten into a unique array
  const allReferentieComponenten = useMemo(() => {
    if (!modules?.length) return [];
    return [
      ...new Set(modules.flatMap((module) => module.referentieComponenten || [])),
    ];
  }, [modules]);

  if (!allReferentieComponenten?.length) return null;

  return (
    <>
      <Heading level={3} style={{ marginBlockStart: '1rem' }}>
        Geschikt voor
      </Heading>
      <div className='ac-register-review__section'>
        <div style={{ marginTop: '12px' }}>
          {allReferentieComponenten.map((id, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              <Link
                href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${id}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                <ConUuidResolver>{String(id)}</ConUuidResolver>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
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
//         {objectName} is momenteel niet zichtbaar in de zoekfunctie van{' '}
//         {schemaName || 'de catalogus'}. Gebruik de &quot;Publiceren&quot; actie om
//         deze gegevens beschikbaar te maken voor bezoekers.
//       </Paragraph>
//     </Alert>
//   );
// };

export default ConProductDetailsPageContent;
