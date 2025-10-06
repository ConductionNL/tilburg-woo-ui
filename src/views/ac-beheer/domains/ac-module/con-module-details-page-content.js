import {
  Heading,
  Paragraph,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn, AcFlex } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConEditableDescription from '../../shared/components/con-editable-description/con-editable-description';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import { ConStandardsResolver } from '@components';
import { handleFileClick } from '@utils';
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

  // Standards state for resolving compliance standards
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

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
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema`,
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

  // Fetch standards from openconnector endpoint
  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
      });
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error(
          'Error fetching openconnector standards:',
          response.statusText
        );
        return;
      }
      const data = await response.json();
      const fetchedStandards = data.results || data;
      setStandards(fetchedStandards);
    } catch (error) {
      console.warn('Failed to fetch standards:', error);
      setStandards([]);
    } finally {
      setStandardsLoading(false);
    }
  }, []);

  // Note: Modules currently have no dedicated contact block on this page

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
    fetchStandards();
  }, [fetchUses, fetchUsed, fetchStandards]);

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

                {/* TODO: Summary and description editing is not working yet*/}
                {/* <ConActionMenu.Button
                  icon={<VISUALS.PENCIL />}
                  onClick={() => setEditingSummary(true)}
                  disabled={!actualCanEdit}
                  data-tooltip-id={!actualCanEdit ? TOOLTIP_ID : undefined}
                  data-tooltip-content={
                    !actualCanEdit
                      ? 'Kan niet bewerken omdat de samenvatting niet bewerkt kan worden'
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
                      ? 'Kan niet bewerken omdat de beschrijving niet bewerkt kan worden'
                      : undefined
                  }
                >
                  Bewerk beschrijving
                </ConActionMenu.Button> */}

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
          registerSlug={data['@self'].register.slug}
          schemaSlug={data['@self'].schema.slug}
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
          onSuccess={() => setEditingDescription(false)}
          canEdit={actualCanEdit}
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
        objectStore={object}
      />

      {/* Standaarden Section (replacing Extra informatie) */}
      <div style={{ marginTop: '1rem' }}>
        <Heading level={3}>Standaarden</Heading>
        {standardsLoading ? (
          <p>Standaarden laden...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: '#f8f9fa',
                    paddingLeft:
                      'var(--utrecht-table-cell-padding-inline-end) !important',
                  }}
                >
                  Standaard
                </TableCell>
                <TableCell
                  style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Status
                </TableCell>
                <TableCell
                  style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Bewijs
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.compliancy || []).map((standard, idx) => {
                const standardData = ConStandardsResolver({
                  standardId: standard.standaardversie,
                  standards: standards,
                  returnStandardData: true,
                });

                const hasEvidence = !!standard.bewijs;
                const standardInfo = standardData?.data;
                const isLikelyRequired =
                  hasEvidence ||
                  (standardInfo?.xml?.name?._value || standardInfo?.naam || '')
                    .toLowerCase()
                    .includes('verplicht') ||
                  (standardInfo?.xml?.name?._value || standardInfo?.naam || '')
                    .toLowerCase()
                    .match(
                      /(security|beveiliging|privacy|gdpr|iso.*27001|baseline)/
                    );

                const standardType = isLikelyRequired ? 'VERPLICHT' : 'AANBEVOLEN';
                const typeColor = isLikelyRequired ? '#dc3545' : '#28a745';

                return (
                  <TableRow key={idx}>
                    <TableCell
                      style={{
                        alignContent: 'center',
                        paddingLeft:
                          'var(--utrecht-table-cell-padding-inline-end) !important',
                      }}
                    >
                      <div>
                        <Link
                          href={`https://www.gemmaonline.nl/wiki/GEMMA/${standard.standaardversie}`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <ConStandardsResolver
                            standardId={standard.standaardversie}
                            standards={standards}
                          />
                        </Link>
                        <div style={{ marginTop: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#fff',
                              backgroundColor: typeColor,
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              lineHeight: '1.2',
                              margin: '0px',
                              marginBlockStart: '0px',
                              marginBlockEnd: '0px',
                              marginInlineStart: '0px',
                              marginInlineEnd: '0px',
                            }}
                          >
                            {standardType}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={{ alignContent: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#fff',
                          backgroundColor: hasEvidence ? '#28a745' : '#6c757d',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          lineHeight: '1.2',
                          margin: '0px',
                          marginBlockStart: '0px',
                          marginBlockEnd: '0px',
                          marginInlineStart: '0px',
                          marginInlineEnd: '0px',
                        }}
                      >
                        {hasEvidence ? 'COMPLIANT' : 'NON-COMPLIANT'}
                      </span>
                    </TableCell>
                    <TableCell style={{ alignContent: 'center' }}>
                      {standard.bewijs ? (
                        <Link
                          href='#'
                          onClick={(e) => {
                            e.preventDefault();
                            handleFileClick(standard.bewijs);
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <VISUALS.DOWNLOAD />
                        </Link>
                      ) : (
                        <span
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          -
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Related tabs */}
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

// Suitable For Section component for modules
const SuitableForSection = ({ referentieComponenten, objectStore }) => {
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
  }, [referentieComponenten, objectStore]);

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
