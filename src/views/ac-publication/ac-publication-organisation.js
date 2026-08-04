import React, { useEffect, useState, useCallback, useMemo } from 'react';
import RelatedTabs from './con-related-tabs-new';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu, ConExternalLink, ConPublicationTypeBadge } from '@components';
import { withStore } from '@stores';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { normalizeSchemaName } from '@src/utilities/con-normalize-schema-name';
import { createBeschrijvingTab } from './helpers/beschrijving-tab.helper';

const AcPublication = ({ store: { publications, object, user } }) => {
  const { id } = useParams();
  const { get_single, loading, attachments } = publications;

  const navigate = useNavigate();

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);

  const schemaId =
    typeof get_single?.['@self']?.schema === 'object'
      ? get_single?.['@self']?.schema.id
      : get_single?.['@self']?.schema;
  const schemaSlug = useMemo(
    () => (schemaId ? schemaCache.get(schemaId) : null),
    [schemaId]
  );

  // Tabs
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [gebruik, setGebruik] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [gebruikLoading, setGebruikLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Aggregated schemas from all endpoints (indexed by schema ID)
  const [aggregatedSchemas, setAggregatedSchemas] = useState({});

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=_schema`,
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
      
      // Extract and aggregate schemas from @self.schemas
      if (data['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...data['@self'].schemas
        }));
      }
    } catch (error) {
      console.error('Error fetching uses:', error);
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
      
      // Extract and aggregate schemas from @self.schemas
      if (data['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...data['@self'].schemas
        }));
      }
    } catch (error) {
      console.error('Error fetching used:', error);
    } finally {
      setUsedLoading(false);
    }
  }, [id]);

  const fetchGebruik = useCallback(async () => {
    if (!id) return;
    setGebruikLoading(true);
    try {
      // For organisations, fetch gebruik where the organisation is referenced
      const response = await fetch(
        `${commongroundApiUrl()}/softwarecatalog/api/gebruik?_limit=1000&_extend[]=_schema&organisatie=${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching gebruik:', response.statusText);
        return;
      }
      const data = await response.json();
      setGebruik(data.results || []);
      
      // Extract and aggregate schemas from @self.schemas
      if (data['@self']?.schemas) {
        setAggregatedSchemas(prev => ({
          ...prev,
          ...data['@self'].schemas
        }));
      }
    } catch (error) {
      console.error('Error fetching gebruik:', error);
    } finally {
      setGebruikLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    fetchUses();
    fetchUsed();
    fetchGebruik();
  }, [id, fetchUses, fetchUsed, fetchGebruik]);

  // Loading
  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer margin='xl'>
        <AcFlex column spacing='sm'>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
            <Heading level={4} className='con-product-publication--header-container'>
              <div className='con-beheer-details--header-container'>
                {get_single?.['@self']?.image || get_single?.logo && (
                  <ConLogoPreview
                    className='con-beheer-details--logo-container'
                    logoUrl={
                      get_single?.['@self']?.image || get_single?.logo
                    }
                  />
                )}

                <Heading className='con-beheer-details--title'>
                  {get_single?.['@self']?.name ||
                    get_single?.id ||
                    get_single?.name ||
                    'Organisatie'}
                </Heading>
              </div>
            </Heading>

            <AcFlex
              justifyContent='end'
              alignItems='center'
              spacing='sm'
              className='con-product-publication--header-actions'
            >
              <Heading className='con-product-publication--header-type'>
                <ConPublicationTypeBadge schemaSlug={schemaSlug} />
              </Heading>
              {schemaSlug && (
                <ConDetailsActionsMenu
                  user={user}
                  id={id}
                  schemaSlug={schemaSlug}
                  title={get_single?.['@self']?.name || get_single?.id}
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
              )}
            </AcFlex>
          </AcFlex>
          <AcFlex spacing='sm' justifyContent='between'>
            <AcFlex column spacing='md' style={{ flex: 3 }}>
              {!!get_single?.['@self']?.summary && (
                <div>{get_single?.['@self']?.summary}</div>
              )}
            </AcFlex>
            {(get_single?.['e-mailadres'] ||
              get_single?.telefoonnummer ||
              get_single?.website) && (
              <AcFlex column spacing='sm' style={{ flex: 1 }}>
                <div className='ac-register-review__section'>
                  <div style={{ marginTop: '12px' }}>
                    {get_single?.['e-mailadres'] && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Email: </strong>
                        <Link href={`mailto:${get_single['e-mailadres']}`}>
                          {get_single['e-mailadres']}
                        </Link>
                      </div>
                    )}
                    {get_single?.telefoonnummer && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Telefoon: </strong>
                        <Link
                          href={`tel:${get_single.telefoonnummer.replace(
                            /\s/g,
                            ''
                          )}`}
                        >
                          {get_single.telefoonnummer}
                        </Link>
                      </div>
                    )}
                    {get_single?.website && (
                      <div
                        style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}
                      >
                        <strong>Website:</strong>
                        <ConExternalLink href={get_single.website} />
                      </div>
                    )}
                  </div>
                </div>
              </AcFlex>
            )}
          </AcFlex>

          <AcGenericBeheerDeleteModal
            objects={get_single ? [get_single] : []}
            showModal={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={() => navigate('/zoeken')}
          />

          <RelatedTabs
            uses={uses}
            used={used}
            gebruik={gebruik}
            schemas={aggregatedSchemas}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            gebruikLoading={gebruikLoading}
            excludeObjectIds={[]}
            tabIndex={tabIndex}
            setTabIndex={setTabIndex}
            object={object}
            navigateTo='publication'
            user={user}
            customTabsBefore={[createBeschrijvingTab(get_single)]}
          />
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
