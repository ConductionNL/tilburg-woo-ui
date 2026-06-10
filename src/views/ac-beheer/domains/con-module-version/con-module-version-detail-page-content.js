import {
  Heading,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';

/**
 * Content for the module version (applicatie versie) details page
 *
 * note:
 * Structured to match con-product-details layout with vertical content flow
 * and integrated action menu.
 */
const ConModuleVersionDetailsPageContent = ({
  loading,
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

  // Check organization permissions for actions
  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat de applicatieversie niet gevonden is',
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
                  onClick={() => {
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
        <ConEditableDescription
          registerSlug={data['@self'].register.slug}
          schemaSlug={data['@self'].schema.slug}
          objectId={data?.['@self']?.id}
          field='beschrijvingKort'
          label='Korte beschrijving'
          placeholder='Een korte beschrijving van de applicatieversie'
          tooltip='Een korte beschrijving van de applicatieversie'
          maxLength={255}
          isMarkdown={false}
          value={data.beschrijvingKort}
          serialize={(v) => v}
          deserialize={(v) => v || ''}
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
          placeholder='Een uitgebreide beschrijving van de applicatieversie'
          tooltip='Een uitgebreide beschrijving van de applicatieversie'
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
          canEdit={actualCanEdit}
        />
      </div>

      {/* Extra Information Section */}
      {(data?.versie || data?.status || data?.releaseDatum) && (
        <>
          <Heading level={3} style={{ marginBlockStart: '1rem' }}>
            Extra informatie
          </Heading>
          <div className='ac-register-review__section'>
            <div style={{ marginTop: '12px' }}>
              {data?.versie && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Versienummer: </strong>
                  {data.versie}
                </div>
              )}
              {data?.status && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Status: </strong>
                  {data.status}
                  {(() => {
                    // Map status to corresponding date field
                    const statusDateMap = {
                      'in ontwikkeling': data.datumInOntwikkeling,
                      ontwikkeling: data.datumInOntwikkeling,
                      actief: data.datumInGebruik,
                      'in gebruik': data.datumInGebruik,
                      teruggetrokken: data.datumTeruggetrokken,
                      'einde ondersteuning': data.datumEindeOndersteuning,
                    };

                    const statusDate =
                      statusDateMap[data.status?.toLowerCase()] || null;

                    if (statusDate && !isNaN(new Date(statusDate).getTime())) {
                      return (
                        <span style={{ color: '#666', marginLeft: '4px' }}>
                          (sinds {new Date(statusDate).toLocaleDateString('nl-NL')})
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
              {data?.releaseDatum && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Release datum: </strong>
                  {!isNaN(new Date(data.releaseDatum).getTime())
                    ? new Date(data.releaseDatum).toLocaleDateString('nl-NL')
                    : data.releaseDatum}
                </div>
              )}
            </div>
          </div>
        </>
      )}

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

/* Warning card for unpublished objects - LEGACY: No longer needed */
// const UnpublishedWarning = ({ data }) => {
//   if (data?.['@self']?.published) return null;
//   const schemaName = data?.['@self']?.schema?.title || 'Applicatie versie';
//   const objectName = data?.['@self']?.name;
//
//   return (
//     <Alert type='warning' style={{ marginBottom: '1rem' }}>
//       <Heading level={4}>{schemaName} is nog niet gepubliceerd</Heading>
//       <Paragraph>
//         {objectName} is momenteel niet zichtbaar in de zoekfunctie van de softwarecatalogus.
//         Gebruik de &quot;Publiceren&quot; actie om deze gegevens beschikbaar te maken
//         voor bezoekers.
//       </Paragraph>
//     </Alert>
//   );
// };

export default ConModuleVersionDetailsPageContent;
