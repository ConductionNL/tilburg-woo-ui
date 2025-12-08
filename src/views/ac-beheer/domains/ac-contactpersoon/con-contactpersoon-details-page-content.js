import {
  Heading,
  Paragraph,
  Link,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import ConLogoPreview from '@src/views/ac-register/con-logo-preview';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { ConUuidResolver } from '@src/components';

/**
 * Content for the contactpersoon details page
 *
 * note:
 * Restructured to match con-my-organisation layout with vertical content flow
 * and integrated action menu.
 */
const ConContactpersoonDetailsPageContent = ({
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

  // Full name for contactpersoon
  const fullName = useMemo(() => {
    const nameFromFields = [data?.voornaam, data?.tussenvoegsel, data?.achternaam]
      .filter(Boolean)
      .join(' ');
    return nameFromFields || data?.['@self']?.name || data?.['@self']?.id;
  }, [data]);

  // Resolve organisatie name by UUID when available
  const organisationId = useMemo(() => {
    return (
      data?.organisatie ||
      data?.['@self']?.relations?.organisatie ||
      data?.['@self']?.organisation ||
      ''
    );
  }, [data]);

  // Check organization permissions for actions
  const { canEdit: hasEditPermission, reason } = data
    ? checkOrganizationPermissions(user, data)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat de contactpersoon niet gevonden is',
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
            {(data?.['@self']?.image || data?.image) && (
              <ConLogoPreview
                className='con-beheer-details--logo-container'
                logoUrl={data?.['@self']?.image || data?.image}
              />
            )}

            <Heading className='con-beheer-details--title'>{fullName}</Heading>
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

      {/* Contactgegevens */}
      <Heading level={3} style={{ marginBlockStart: '1rem' }}>
        Contactgegevens
      </Heading>
      <div className='ac-register-review__section'>
        <div style={{ marginTop: '12px' }}>
          {data?.functie && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Functie: </strong>
              {data.functie}
            </div>
          )}
          {data?.username && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Gebruikersnaam: </strong>
              {data.username}
            </div>
          )}
          {typeof data?.['e-mailadres'] === 'string' && data['e-mailadres'] && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <strong>E‑mail: </strong>
              <Link href={`mailto:${data['e-mailadres']}`}>
                {data['e-mailadres']}
              </Link>
            </div>
          )}
          {data?.telefoonnummer && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <strong>Telefoon: </strong>
              <Link
                href={`tel:${String(data.telefoonnummer)
                  .split('')
                  .filter((i) => i !== ' ')
                  .join('')}`}
              >
                {data.telefoonnummer}
              </Link>
            </div>
          )}
          <div style={{ marginBottom: '8px' }}>
            <strong>Organisatie: </strong>
            <ConUuidResolver>{organisationId}</ConUuidResolver>
          </div>
        </div>
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
        {objectName} is momenteel niet zichtbaar in de zoekfunctie van{' '}
        {schemaName || 'de catalogus'}. Gebruik de &quot;Publiceren&quot; actie om
        deze gegevens beschikbaar te maken voor bezoekers.
      </Paragraph>
    </Alert>
  );
};

export default ConContactpersoonDetailsPageContent;
