import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { AcColumn } from '@src/atoms';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import { VISUALS } from '@src/constants';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { commongroundApiUrl } from '@src/config';
import RelatedTabs from '@views/ac-publication/con-related-tabs';
import { TOOLTIP_ID } from '@src/index.web';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { AcFormatDate } from '@src/utilities/ac-format-date';

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
  const navigate = useNavigate();
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);
  const [sortedReferentiecomponenten, setSortedReferentiecomponenten] = useState([]);

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

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  // Resolve and sort referentiecomponenten alphabetically
  useEffect(() => {
    const resolveAndSortReferentiecomponenten = async () => {
      if (
        !data?.gebruiktVoorReferentiecomponenten ||
        !Array.isArray(data.gebruiktVoorReferentiecomponenten) ||
        data.gebruiktVoorReferentiecomponenten.length === 0
      ) {
        setSortedReferentiecomponenten([]);
        return;
      }

      // Get names for all IDs
      const ids = data.gebruiktVoorReferentiecomponenten.map((id) => String(id));
      const namesMap = await object.getNamesForMultipleIds(ids);

      // Create array with ID and label, then sort
      const withNames = ids
        .map((id) => ({
          id,
          label: namesMap[id] || id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setSortedReferentiecomponenten(withNames);
    };

    resolveAndSortReferentiecomponenten();
  }, [data?.gebruiktVoorReferentiecomponenten, object]);

  const status = data?.status || '-';

  // Get all status dates that are set
  const statusDates = [
    {
      label: 'Startdatum Verwerving',
      value: data?.startDatumVerwerving
        ? AcFormatDate(data.startDatumVerwerving, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum Gepland',
      value: data?.startDatumGepland
        ? AcFormatDate(data.startDatumGepland, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum In productie',
      value: data?.startDatumInProductie
        ? AcFormatDate(data.startDatumInProductie, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum Uit te faseren',
      value: data?.startDatumUitTeFaseren
        ? AcFormatDate(data.startDatumUitTeFaseren, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum Uitgefaseerd',
      value: data?.startDatumUitGefaseerd
        ? AcFormatDate(data.startDatumUitGefaseerd, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
  ].filter((item) => item.value);

  // Extract deelnemer IDs from the data (always an array of UUID strings or empty)
  const deelnemerIds = data?.deelnemers || [];

  // Helper to extract ID from a value that could be a string, object, or nested structure
  const extractId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return (
        value?.['@self']?.id || value?.id || value?.uuid || value?.value || null
      );
    }
    return String(value);
  };

  // Get the UUID of the related object for the title (applicatie/koppeling/dienst)
  const getRelatedObjectId = () => {
    // Check for koppelingen first
    const koppelingen = data?.koppelingen || data?.['@self']?.relations?.koppelingen;
    if (Array.isArray(koppelingen) && koppelingen.length > 0) {
      const id = extractId(koppelingen[0]);
      if (id) return id;
    }

    // Check for diensten
    const diensten = data?.diensten || data?.['@self']?.relations?.diensten;
    if (Array.isArray(diensten) && diensten.length > 0) {
      const id = extractId(diensten[0]);
      if (id) return id;
    }

    // Default to module (applicatie)
    const moduleRaw = data?.module || data?.['@self']?.relations?.module;

    // Module could be an array or a single value
    const moduleValue = Array.isArray(moduleRaw) ? moduleRaw[0] : moduleRaw;
    const moduleId = extractId(moduleValue);
    if (moduleId) return moduleId;

    // Fallback to gebruik id if no related object found
    return data?.id;
  };

  const relatedObjectId = getRelatedObjectId();

  if (loading || !data) return null;

  return (
    <AcColumn gap='sm' horizontalOverflowWrapper>
      {/* Page Title */}
      <Heading level={2} style={{ marginBottom: '0.5rem' }}>
        Gebruik: <ConUuidResolver>{relatedObjectId}</ConUuidResolver>
      </Heading>

      <div
        className='ac-register-review__organisation-header'
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
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
                    // Check if koppelingen array is filled - redirect to koppeling wizard
                    // Also check @self.relations.koppelingen as fallback
                    const koppelingen =
                      data?.koppelingen || data?.['@self']?.relations?.koppelingen;
                    if (Array.isArray(koppelingen) && koppelingen.length > 0) {
                      navigate(
                        `/forms/gebruik/koppeling?type=eigen-organisatie&id=${id}`
                      );
                      return;
                    }

                    // Check if diensten array is filled - redirect to dienst wizard
                    // Also check @self.relations.diensten as fallback
                    const diensten =
                      data?.diensten || data?.['@self']?.relations?.diensten;
                    if (Array.isArray(diensten) && diensten.length > 0) {
                      navigate(`/forms/gebruik/dienst?type=dienst&id=${id}`);
                      return;
                    }

                    // Default: go to gebruik wizard
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

          {statusDates.map((dateItem) => (
            <div key={dateItem.label} style={{ marginBottom: '8px' }}>
              <strong>{dateItem.label}: </strong>
              {dateItem.value}
            </div>
          ))}
        </div>

        {sortedReferentiecomponenten.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Referentiecomponenten: </strong>
            <div>
              {sortedReferentiecomponenten.map((item) => (
                <div key={item.id} style={{ marginBottom: '4px' }}>
                  <Link
                    href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${item.id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {deelnemerIds.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Deelnemers: </strong>
            <div>
              {deelnemerIds.map((deelnemerId) => (
                <div key={deelnemerId} style={{ marginBottom: '4px' }}>
                  <ConUuidResolver>{deelnemerId}</ConUuidResolver>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show module (applicatie) if present */}
        {(() => {
          const moduleRaw = data?.module || data?.['@self']?.relations?.module;
          const moduleValue = Array.isArray(moduleRaw) ? moduleRaw[0] : moduleRaw;
          const moduleId = extractId(moduleValue);
          if (!moduleId) return null;
          return (
            <div style={{ marginBottom: '8px' }}>
              <strong>Applicatie: </strong>
              <ConUuidResolver>{moduleId}</ConUuidResolver>
            </div>
          );
        })()}

        {/* Show diensten if present */}
        {(() => {
          const diensten = data?.diensten || data?.['@self']?.relations?.diensten;
          if (!Array.isArray(diensten) || diensten.length === 0) return null;
          return (
            <div style={{ marginBottom: '8px' }}>
              <strong>Dienst{diensten.length > 1 ? 'en' : ''}: </strong>
              <div>
                {diensten.map((dienstItem, index) => {
                  const dienstId = extractId(dienstItem);
                  if (!dienstId) return null;
                  return (
                    <div key={dienstId || index} style={{ marginBottom: '4px' }}>
                      <ConUuidResolver>{dienstId}</ConUuidResolver>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Show koppelingen if present */}
        {(() => {
          const koppelingen =
            data?.koppelingen || data?.['@self']?.relations?.koppelingen;
          if (!Array.isArray(koppelingen) || koppelingen.length === 0) return null;
          return (
            <div style={{ marginBottom: '8px' }}>
              <strong>Koppeling{koppelingen.length > 1 ? 'en' : ''}: </strong>
              <div>
                {koppelingen.map((koppelingItem, index) => {
                  const koppelingId = extractId(koppelingItem);
                  if (!koppelingId) return null;
                  return (
                    <div key={koppelingId || index} style={{ marginBottom: '4px' }}>
                      <ConUuidResolver>{koppelingId}</ConUuidResolver>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Show interne aantekening if present */}
        {data?.interneAantekening && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Interne notitie: </strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{data.interneAantekening}</div>
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

export default ConGebruikDetailsPageContent;
