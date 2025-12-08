import {
  Heading,
  Paragraph,
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn, AcFlex } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import ConEditableStandards from '../../shared/components/con-editable-standards/con-editable-standards';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useNavigate } from 'react-router-dom';

/**
 * Content for the module details page
 *
 * note:
 * Restructured to match con-my-organisation layout with vertical content flow
 * and integrated action menu.
 */
const ConModuleDetailsPageContent = ({
  loading,
  config,
  data,
  userStore: user,
  objectStore: object,
  id,
  canEdit = false,
  actionMenuProps,
}) => {
  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);

  // Editing state for inline editing
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingStandards, setEditingStandards] = useState(false);

  // Standards count state
  const [standardsCount, setStandardsCount] = useState(0);

  // ReferentieComponenten data state
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Standards editing state

  const navigate = useNavigate();

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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_limit=500`,
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

  // Check organization permissions for actions
  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat het product niet gevonden is',
      };

  const actualCanEdit = canEdit && hasEditPermission;

  const contactId = Array.isArray(data?.contactpersoon)
    ? data.contactpersoon[0]?.id ?? data.contactpersoon[0]
    : typeof data?.contactpersoon === 'object' && data?.contactpersoon !== null
    ? data.contactpersoon.id
    : data?.contactpersoon;

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
                      const wizard = wizards.find((w) => w.schema === 'applicatie');

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

                <ConActionMenu.Button
                  icon={<VISUALS.PENCIL />}
                  onClick={() => setEditingSummary(true)}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('edit', reason)
                      : undefined
                  }
                >
                  Bewerk samenvatting
                </ConActionMenu.Button>

                <ConActionMenu.Button
                  icon={<VISUALS.PENCIL />}
                  onClick={() => setEditingDescription(true)}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('edit', reason)
                      : undefined
                  }
                >
                  Bewerk beschrijving
                </ConActionMenu.Button>

                <ConActionMenu.Button
                  icon={<VISUALS.PENCIL />}
                  onClick={() => setEditingStandards(true)}
                  disabled={!actualCanEdit || !standardsCount}
                  data-tooltip-id={
                    !actualCanEdit || !standardsCount ? TOOLTIP_ID : undefined
                  }
                  data-tooltip-content={
                    !actualCanEdit || !standardsCount
                      ? !actualCanEdit
                        ? getDisabledActionTooltip('edit', reason)
                        : 'Kan niet bewerken want er zijn geen standaarden beschikbaar.'
                      : undefined
                  }
                >
                  Bewerk standaarden
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

      {/* Unpublished warning */}
      <UnpublishedWarning data={data} />

      {/* Short description */}
      <div style={{ flex: 2 }}>
        <ConEditableDescription
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          field='beschrijvingKort'
          label='Korte beschrijving'
          placeholder='Een korte beschrijving van de applicatie'
          tooltip='Een korte beschrijving van de applicatie'
          maxLength={255}
          isMarkdown={false}
          value={data.beschrijvingKort}
          isEditingCustomTrigger={editingSummary}
          serialize={(v) => v}
          deserialize={(v) => v || ''}
          onSuccess={(v) => {
            setEditingSummary(false);
            data.beschrijvingKort = v;
            // No data refresh needed - data already updated locally
          }}
          onCancel={() => setEditingSummary(false)}
        />
      </div>

      {/* Long description */}
      <div>
        <br />
        <ConEditableDescription
          markdownPreviewClassName='con-my-account-description'
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          field='beschrijvingLang'
          label='Lange beschrijving'
          placeholder='Een uitgebreide beschrijving van de applicatie'
          tooltip='Een uitgebreide beschrijving van de applicatie'
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
          onSuccess={(v) => {
            setEditingDescription(false);
            data.beschrijvingLang = v;
            // No data refresh needed - data already updated locally
          }}
        />
      </div>

      {/* Contact Information Section */}
      {(contactId || data?.website) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Contact Informatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.website && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <strong>Website: </strong>
                  <Link
                    href={
                      data?.website.startsWith('http')
                        ? data?.website
                        : `https://${data?.website}`
                    }
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {data?.website}
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

      {/* Extra Information Section */}
      {(data?.licentietype ||
        data?.licentie ||
        data?.moduleVersies ||
        data?.cloudDienstVerleeningsmodel ||
        data?.hostingJurisdictie ||
        data?.hostingLocatie) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Extra informatie
          </Heading>
          <div className='ac-register-review__section'>
            <AcFlex column spacing='sm'>
              {data?.licentietype && (
                <div>
                  <b>Licentietype:</b>
                  <p>{data.licentietype}</p>
                </div>
              )}
              {data?.licentie && (
                <div>
                  <b>Licentie:</b>
                  <p>{data.licentie}</p>
                </div>
              )}
              {Array.isArray(data?.moduleVersies) &&
                data.moduleVersies.length > 0 && (
                  <div>
                    <b>Huidige versie:</b>
                    <p>
                      {data.moduleVersies.find(
                        (versie) => versie.status === 'in gebruik'
                      )?.versie || 'Geen versie in gebruik'}
                    </p>
                  </div>
                )}
              {Array.isArray(data?.cloudDienstverleningsmodel) &&
                data.cloudDienstverleningsmodel.length > 0 && (
                  <div>
                    <b>Hosting type:</b>
                    <ul style={{ margin: 0, paddingLeft: '1.25em' }}>
                      {data.cloudDienstverleningsmodel.map((model, idx) => (
                        <li key={idx}>{model}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {data?.hostingJurisdictie && (
                <div>
                  <b>Hosting jurisdictie:</b>
                  <p>{data.hostingJurisdictie}</p>
                </div>
              )}
              {data?.hostingLocatie && (
                <div>
                  <b>Hosting locatie:</b>
                  <p>{data.hostingLocatie}</p>
                </div>
              )}
            </AcFlex>
          </div>
        </>
      )}

      {/* Suitable For Section */}
      <SuitableForSection
        referentieComponenten={data.referentieComponenten}
        referentieComponentenWithStandards={referentieComponentenWithStandards}
        objectStore={object}
      />

      {/* Standaarden Section */}
      <div style={{ marginTop: '1rem' }}>
        <Heading level={3}>Standaarden ({standardsCount})</Heading>
        <ConEditableStandards
          registerSlug={config?.registerSlug}
          schemaSlug={config?.schemaSlug}
          objectId={data?.['@self']?.id}
          referentieComponenten={data.referentieComponenten}
          complianceStandards={data.compliancy}
          referentieComponentenWithStandards={
            referentieComponentenWithStandards?.length > 0
              ? referentieComponentenWithStandards
              : undefined
          }
          onStandardsCountChange={setStandardsCount}
          onReferentieComponentenChange={setReferentieComponentenWithStandards}
          isEditingCustomTrigger={editingStandards}
          onSuccess={() => {
            // Only exit editing mode - don't update data.compliancy to prevent unnecessary re-renders
            setEditingStandards(false);
            // The ConEditableStandards component already sent the PATCH request
            // so the server data is correct and will be consistent
          }}
          onCancel={() => setEditingStandards(false)}
          canEdit={actualCanEdit}
        />
      </div>

      {/* Related tabs */}
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
            user={user}
          />
        </div>
      )}
    </AcColumn>
  );
};

// Suitable For Section component for modules
const SuitableForSection = ({
  referentieComponenten,
  referentieComponentenWithStandards,
  objectStore,
}) => {
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    const resolveWithIds = async () => {
      if (
        !Array.isArray(referentieComponenten) ||
        referentieComponenten.length === 0
      ) {
        setResolved([]);
        return;
      }

      // If we have referentieComponentenWithStandards data, use it to get the actual object IDs
      if (referentieComponentenWithStandards?.length > 0) {
        const resolvedWithObjectIds = referentieComponenten.map((id) => {
          const refCompData = referentieComponentenWithStandards.find(
            (refComp) => refComp.id === id
          );

          return {
            id: refCompData?.fullData?.id || id, // Use actual object ID if available
            name: refCompData?.naam || id,
          };
        });
        setResolved(resolvedWithObjectIds);
        return;
      }

      // Fallback to the original resolution method
      try {
        const results = await Promise.all(
          referentieComponenten.map(async (id) => {
            try {
              const name = await objectStore.getNamesForSingleId(id);
              return { id, name };
            } catch (error) {
              return { id, name: id };
            }
          })
        );
        setResolved(results);
      } catch (e) {
        setResolved(referentieComponenten.map((id) => ({ id, name: id })));
      }
    };
    resolveWithIds();
  }, [referentieComponenten, referentieComponentenWithStandards, objectStore]);

  if (!resolved.length) return null;

  return (
    <>
      <Heading level={3} style={{ marginBlockStart: '1rem' }}>
        Geschikt voor
      </Heading>
      <div className='ac-register-review__section'>
        <div style={{ marginTop: '12px' }}>
          {resolved.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              <Link
                href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${item.id}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/* Warning card for unpublished objects */
const UnpublishedWarning = ({ data }) => {
  if (data?.['@self']?.published) return null;
  const schemaName = data?.['@self']?.schema?.title;
  const title = schemaName ? `${schemaName}` : '';
  const objectName = data?.['@self']?.name;

  return (
    <div className='ac-alert ac-alert--warning' style={{ marginBottom: '1rem' }}>
      <Heading level={4}>{title} is nog niet gepubliceerd</Heading>
      <Paragraph>
        {objectName} is momenteel niet zichtbaar in de zoekfunctie van{' '}
        {schemaName || 'de catalogus'}. Gebruik de &quot;Publiceren&quot; actie om
        deze gegevens beschikbaar te maken voor bezoekers.
      </Paragraph>
    </div>
  );
};

export default ConModuleDetailsPageContent;
