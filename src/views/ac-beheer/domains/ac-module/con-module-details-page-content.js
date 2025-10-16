import {
  Heading,
  Paragraph,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn, AcFlex } from '@src/atoms';
import { AcCheckbox, AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import ConEditableStandards from '../../shared/components/con-editable-standards/con-editable-standards';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import { ConStandardsTable } from '@components';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';

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

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=@self.schema`,
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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema&_limit=500`,
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

  // Custom fetch function (matching con-my-organisation pattern)
  const fetchFullModuleData = useCallback(
    async (moduleId) => {
      if (!moduleId || !config) return;

      try {
        // Fetch the full module data using the object store
        await object.fetchObject(config.registerSlug, config.schemaSlug, moduleId, {
          _extend: config.extend,
          _related: true,
          _relatedNames: true,
        });
        // Ensure active object is set so related data selectors work
        object.setActiveObject(config.registerSlug, config.schemaSlug, {
          id: moduleId,
        });
        // Also fetch schema if not yet loaded
        object.fetchSchema(config.schemaSlug);
      } catch (error) {
        console.error('Error fetching full module data:', error);
      }
    },
    [object, config]
  );

  // Helper function to update field data and refresh (matching con-my-organisation pattern exactly)
  const setNewFieldDataAndFetch = (v, field) => {
    if (data) {
      data[field] = v;
      fetchFullModuleData(data?.['@self']?.id);
    }
  };

  // Check organization permissions for actions
  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat het product niet gevonden is',
      };

  const actualCanEdit = canEdit && hasEditPermission;

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
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? getDisabledActionTooltip('edit', reason)
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
      {(data?.licentietype ||
        data?.licentie ||
        data?.moduleVersies ||
        data?.website) && (
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
              {Array.isArray(data?.moduleVersies) && (
                <div>
                  <b>Huidige versie:</b>
                  <p>
                    {data.moduleVersies.find((v) => v.status === 'in gebruik')
                      ?.versie || 'Geen versie in gebruik'}
                  </p>
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
          onSuccess={(newCompliancy) => {
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
