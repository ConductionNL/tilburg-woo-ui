import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router-dom';
import { AcColumn, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
// import { VISUALS } from '@constants';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
import RelatedTabs from '@views/ac-publication/con-related-tabs-new';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
// import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';
import { AcFormatDate } from '@src/utilities/ac-format-date';
// import { checkOrganizationPermissions } from '@utils/organization-permissions';

/**
 * Publication page for schema slug 'gebruik'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationGebruik = ({ store: { publications, user, object } }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get_single, loading } = publications;

  const schemaId =
    typeof get_single?.['@self']?.schema === 'object'
      ? get_single?.['@self']?.schema.id
      : get_single?.['@self']?.schema;
  const schemaSlug = useMemo(
    () => (schemaId ? schemaCache.get(schemaId) : null),
    [schemaId]
  );

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  // Related tabs state
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [relatedTabIndex, setRelatedTabIndex] = useState(0);
  
  // Aggregated schemas from all endpoints (indexed by schema ID)
  const [aggregatedSchemas, setAggregatedSchemas] = useState({});

  // Resolved names state for referentiecomponenten (needed for sorting and GEMMA links)
  const [sortedReferentiecomponenten, setSortedReferentiecomponenten] = useState([]);

  // Full organization data for checking type (Leverancier, Community, etc.)
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);

  // Fetch full organization data to get the type
  useEffect(() => {
    const fetchFullOrganisationData = async () => {
      const activeOrg = user?.activeOrganization;
      const organisationId = activeOrg?.uuid || activeOrg?.id;

      if (!organisationId) return;

      try {
        await object.fetchObject('voorzieningen', 'organisatie', organisationId, {
          '_extend[]': ['@self.schema'],
        });

        const fullOrgData = object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );

        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);
        }
      } catch (error) {
        console.error('Error fetching full organization data:', error);
      }
    };

    fetchFullOrganisationData();
  }, [user?.activeOrganization?.uuid, user?.activeOrganization?.id, object]);

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=_schema`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const json = await response.json();
      setUses(json.results || []);
      
      // Extract and aggregate schemas from @self.schemas
      if (json['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...json['@self'].schemas
        }));
      }
    } finally {
      setUsesLoading(false);
    }
  }, [id]);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=_schema`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const json = await response.json();
      setUsed(json.results || []);
      
      // Extract and aggregate schemas from @self.schemas
      if (json['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...json['@self'].schemas
        }));
      }
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchUses();
    fetchUsed();
  }, [id, fetchUses, fetchUsed]);

  // Resolve and sort referentiecomponenten alphabetically
  useEffect(() => {
    const resolveAndSortReferentiecomponenten = async () => {
      if (
        !get_single?.gebruiktVoorReferentiecomponenten ||
        !Array.isArray(get_single.gebruiktVoorReferentiecomponenten) ||
        get_single.gebruiktVoorReferentiecomponenten.length === 0
      ) {
        setSortedReferentiecomponenten([]);
        return;
      }

      const ids = get_single.gebruiktVoorReferentiecomponenten.map((refId) =>
        String(refId)
      );
      const namesMap = await object.getNamesForMultipleIds(ids);

      const withNames = ids
        .map((refId) => ({
          id: refId,
          label: namesMap[refId] || refId,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setSortedReferentiecomponenten(withNames);
    };

    resolveAndSortReferentiecomponenten();
  }, [get_single?.gebruiktVoorReferentiecomponenten, object]);

  const status = get_single?.status || '-';

  // Get all status dates that are set
  const statusDates = [
    {
      label: 'Startdatum Verwerving',
      value: get_single?.startDatumVerwerving
        ? AcFormatDate(get_single.startDatumVerwerving, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum Gepland',
      value: get_single?.startDatumGepland
        ? AcFormatDate(get_single.startDatumGepland, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum In productie',
      value: get_single?.startDatumInProductie
        ? AcFormatDate(get_single.startDatumInProductie, 'YYYY-MM-DD', 'D MMMM YYYY')
        : null,
    },
    {
      label: 'Startdatum Uit te faseren',
      value: get_single?.startDatumUitTeFaseren
        ? AcFormatDate(
            get_single.startDatumUitTeFaseren,
            'YYYY-MM-DD',
            'D MMMM YYYY'
          )
        : null,
    },
    {
      label: 'Startdatum Uitgefaseerd',
      value: get_single?.startDatumUitGefaseerd
        ? AcFormatDate(
            get_single.startDatumUitGefaseerd,
            'YYYY-MM-DD',
            'D MMMM YYYY'
          )
        : null,
    },
  ].filter((item) => item.value);

  // Extract deelnemer IDs from the data
  const deelnemerIds = Array.isArray(get_single?.deelnemers)
    ? get_single.deelnemers.map((deelnemer) => {
        if (typeof deelnemer === 'object') {
          return String(deelnemer?.id || deelnemer?.['@self']?.id || deelnemer);
        }
        return String(deelnemer);
      })
    : [];

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl' className='ac-publication-container'>
      <AcColumn gap='sm' horizontalOverflowWrapper>
        <AcFlex spacing='sm' justifyContent='end' alignItems='center'>
          <Heading className='con-module-publication--header-type'>
            {(() => {
              const Icon = schemaSlug ? getTabHeaderIcon(schemaSlug) : null;
              return Icon ? <Icon /> : null;
            })()}
            {schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
          </Heading>
          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={schemaSlug}
            title={get_single?.id}
            published={get_single?.['@self']?.published}
            object={get_single}
            showViewAction={false}
            showEditAction={true}
            showPublishActions={true}
            onDelete={handleDelete}
            onEdit={() => {
              // Check if organization type is Leverancier or Community
              // These organization types don't have their own gebruik objects,
              // they only manage gebruik for gemeentes or other organizations
              const orgType = fullActiveOrganisation?.type;
              const isLeverancierOrCommunity =
                orgType === 'Leverancier' || orgType === 'Community';

              // For Leverancier/Community, use ontbrekend-organisatie type
              const gebruikType = isLeverancierOrCommunity
                ? 'ontbrekend-organisatie'
                : '';
              const url = new URL(
                '/forms/gebruik/applicatie',
                window.location.origin
              );
              if (gebruikType) {
                url.searchParams.set('type', gebruikType);
              }
              url.searchParams.set('id', id);
              navigate(url.pathname + url.search);
            }}
            triggerStyle='button'
          />
        </AcFlex>

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
                      style={{ minHeight: '24px' }}
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
        </div>

        <div style={{ marginTop: '2rem' }}>
          <RelatedTabs
            uses={uses}
            used={used}
            gebruik={[]}
            schemas={aggregatedSchemas}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            gebruikLoading={false}
            excludeObjectIds={[]}
            tabIndex={relatedTabIndex}
            setTabIndex={setRelatedTabIndex}
            object={object}
            navigateTo='publication'
            user={user}
          />
        </div>

        <AcGenericBeheerDeleteModal
          objects={get_single ? [get_single] : []}
          showModal={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => navigate('/zoeken')}
        />
      </AcColumn>
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationGebruik));
