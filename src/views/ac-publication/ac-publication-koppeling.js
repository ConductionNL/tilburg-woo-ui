import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router-dom';
import { AcColumn, AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { VISUALS } from '@constants';
import { AcButton } from '@molecules';
import {
  Heading,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
import RelatedTabs from '@views/ac-publication/con-related-tabs-new';
import ConUuidResolver from '@src/components/con-uuid-resolver/con-uuid-resolver';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
// import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';
import { normalizeSchemaName } from '@src/utilities/con-normalize-schema-name';
import { AcFormatDate } from '@src/utilities/ac-format-date';
// import { checkOrganizationPermissions } from '@utils/organization-permissions';

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
 * Publication page for schema slug 'koppeling'.
 * Read-only detail view with actions menu and related Uses/Used tabs.
 */
const AcPublicationKoppeling = ({ store: { publications, user, object } }) => {
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

  // Derived fields from get_single
  const title = useMemo(() => {
    return (
      get_single?.naam || get_single?.['@self']?.name || get_single?.['@self']?.id
    );
  }, [get_single]);

  const moduleAId = useMemo(() => {
    return get_single?.['@self']?.relations?.moduleA || get_single?.moduleA || null;
  }, [get_single]);

  const moduleBId = useMemo(() => {
    return get_single?.['@self']?.relations?.moduleB || get_single?.moduleB || null;
  }, [get_single]);

  const richting = useMemo(() => {
    return (
      get_single?.richtingDataUitwisseling ||
      get_single?.gegevensuitwisselingRichting ||
      get_single?.['@self']?.relations?.richtingDataUitwisseling ||
      'bi-directioneel'
    );
  }, [get_single]);

  const intermediairId = useMemo(() => {
    return (
      get_single?.['@self']?.relations?.gerealiseerdMetIntermediairModule ||
      get_single?.gerealiseerdMetIntermediairModule ||
      null
    );
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  return (
    <AcContainer margin='xl' className='ac-publication-container'>
      <AcColumn gap='sm' horizontalOverflowWrapper>
        <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
          <Heading className='con-beheer-details--title'>{title}</Heading>

          <Heading className='con-module-publication--header-type'>
            {schemaSlug &&
              (() => {
                const Icon = getTabHeaderIcon(schemaSlug);
                return <Icon />;
              })()}
            {schemaSlug && getTabHeaderName(schemaSlug, true)}
          </Heading>

          {schemaSlug &&
            (() => {
              const userGroups =
                user?.currentUser?.groups || user?.user?.groups || [];
              const hasGebruikBeheerder = userGroups.includes('gebruik-beheerder');

              // Check if user is the owner of the object
              const userActiveOrg = user?.activeOrganization;
              const objectOrg = get_single?.['@self']?.organisation;
              const userOrgId = userActiveOrg?.uuid || userActiveOrg?.id;
              const objectOrgId =
                typeof objectOrg === 'string'
                  ? objectOrg
                  : objectOrg?.id || objectOrg?.uuid;
              const isOwner = userOrgId && objectOrgId && userOrgId === objectOrgId;

              // For GebruikBeheerder, show a single button only if not the owner
              // If owner, show the actions menu
              if (hasGebruikBeheerder && !isOwner) {
                return (
                  <AcButton
                    style='button'
                    buttonType='primary'
                    icon={<VISUALS.PLUS />}
                    onClick={() => {
                      const params = new URLSearchParams({
                        type: 'aanbieden-koppeling',
                        koppelingId: id,
                      });
                      navigate(`/forms/gebruik/koppeling?${params.toString()}`);
                    }}
                    sr='Koppeling aanbieden'
                  />
                );
              }

              // For AanbodBeheerder or GebruikBeheerder who owns the object, show the actions menu
              return (
                <ConDetailsActionsMenu
                  user={user}
                  id={id}
                  schemaSlug={schemaSlug}
                  title={title}
                  published={get_single?.['@self']?.published}
                  object={get_single}
                  showViewAction={false}
                  showEditAction={true}
                  showPublishActions={true}
                  onDelete={handleDelete}
                  onEdit={() => {
                    if (schemaSlug) {
                      const wizardSchemaName =
                        normalizeSchemaName(schemaSlug).toLowerCase();
                      const wizards = Object.values(DASHBOARD_WIZARDS);
                      const wizard = wizards.find(
                        (w) => w.schema === wizardSchemaName
                      );
                      if (wizard) {
                        const baseUrl = getWizardUrl(wizard);
                        const url = new URL(baseUrl, window.location.origin);
                        url.searchParams.set('id', id);
                        navigate(url.pathname + url.search);
                        return;
                      }
                    }
                    // Fallback to beheer detail page in same tab with edit modal
                    const beheerUrl = `/beheer/${schemaSlug}/${id}?showEditModal=true`;
                    navigate(beheerUrl);
                  }}
                  triggerStyle='button'
                />
              );
            })()}
        </AcFlex>

        {!get_single?.['@self']?.published && (
          <Alert type='warning' style={{ marginBottom: '1rem' }}>
            <Heading level={4}>Koppeling is nog niet gepubliceerd</Heading>
            <Paragraph>
              Deze koppeling is momenteel niet zichtbaar in de zoekfunctie. Gebruik
              de &quot;Publiceren&quot; actie om deze gegevens zichtbaar te maken.
            </Paragraph>
          </Alert>
        )}

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
              {richting} (
              {richting === 'AnaarB' ? '→' : richting === 'BnaarA' ? '←' : '↔'})
            </div>
            {get_single?.soortKoppeling && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Soort koppeling: </strong>
                {get_single.soortKoppeling}
              </div>
            )}
            {get_single?.type && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Transportprotocol: </strong>
                {get_single.type}
              </div>
            )}
            {get_single?.status && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Status: </strong>
                {get_single.status}
              </div>
            )}
            {(() => {
              const allDates = getAllDatesWithValues(get_single);
              return allDates.length > 0
                ? allDates.map((dateInfo, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      <strong>{dateInfo.label}: </strong>
                      {dateInfo.value}
                    </div>
                  ))
                : null;
            })()}
            {get_single?.beschrijvingKort && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Korte beschrijving: </strong>
                {get_single.beschrijvingKort}
              </div>
            )}
            {intermediairId && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Intermediair: </strong>
                <ConUuidResolver>{String(intermediairId)}</ConUuidResolver>
              </div>
            )}
            {get_single?.standaardversies &&
              get_single.standaardversies.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Standaardversies:</strong>
                  <ul
                    style={{
                      margin: '0.5rem 0 0 0',
                      paddingInlineStart: '1.25rem',
                      listStyleType: 'disc',
                    }}
                  >
                    {get_single.standaardversies.map((s) => (
                      <li key={s} style={{ marginBottom: '0.25rem' }}>
                        <ConUuidResolver>{String(s)}</ConUuidResolver>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {get_single?.dienst && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Dienst: </strong>
                <ConUuidResolver>{String(get_single.dienst)}</ConUuidResolver>
              </div>
            )}
          </div>
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

export default withStore(observer(AcPublicationKoppeling));
