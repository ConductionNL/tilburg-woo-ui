import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection, AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { ConDynamicSidenav } from '@components';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { commongroundApiUrl } from '@config';
import AcColumn from '@atoms/ac-column/ac-column';
import AcMyAccountModal from '@views/ac-my-account/ac-my-account-modal';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import AcLoader from '@components/ac-loader/ac-loader';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import ConEditableDescription from '@views/ac-beheer/shared/components/con-editable-description/con-editable-description';
import AcMyAccountDynamicModal from '@views/ac-my-account/ac-my-account-dynamic-modal';
import AcMyAccountPublishModal from '@views/ac-my-account/ac-my-account-publish-modal';
import AcMyAccountDeelnamesModal from '@views/ac-my-account/ac-my-account-deelnames-modal';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import _ from 'lodash';
import {
  ConCardOrganisationApplication,
  ConCardDienst,
  ConCardGebruik,
  ConCardContactpersoon,
} from '@molecules/con-cards';
import { AcSearchResult } from '@molecules';
import { getImageFromPublication, getTabHeaderIcon, getTabHeaderName } from '@utils';

/**
 * My Organisation Page
 * - Shows organization details and management options
 * - Allows switching between organizations
 * - Supports editing, publishing, and managing organization data
 */
const ConMyOrganisationPage = ({ store }) => {
  const [userData, setUserData] = useState(null);
  const [organisations, setOrganisations] = useState(null);
  const [activeOrganisation, setActiveOrganisation] = useState(null);
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDepublishModal, setShowDepublishModal] = useState(false);
  const [showDeelnamesModal, setShowDeelnamesModal] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
  });
  const { user, object } = store;

  // Check organization permissions for publish/depublish actions
  const { canEdit, reason } = fullActiveOrganisation
    ? checkOrganizationPermissions(user, fullActiveOrganisation)
    : {
        canEdit: false,
        reason: 'Kan niet bewerken omdat de organisatie niet gevonden is',
      };

  // Email validation function
  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  // Function to create fallback organization data from activeOrganisation
  const createFallbackOrganisationData = useCallback(() => {
    if (!activeOrganisation) {
      console.warn('No activeOrganisation available for fallback data');
      return;
    }

    // Create a fallback object with the structure expected by the UI
    const fallbackData = {
      id: activeOrganisation.uuid || activeOrganisation.id || 'unknown',
      naam: activeOrganisation.name || 'Organisatie',
      name: activeOrganisation.name || 'Organisatie',
      beschrijvingKort: activeOrganisation.description || '',
      beschrijvingLang: activeOrganisation.description || '',
      '@self': {
        id: activeOrganisation.uuid || activeOrganisation.id || 'unknown',
        name: activeOrganisation.name || 'Organisatie',
        published: activeOrganisation.published || false,
        schema: {
          title: 'Organisatie',
          slug: 'organisatie',
        },
        register: {
          slug: 'voorzieningen',
        },
      },
    };

    setFullActiveOrganisation(fallbackData);
  }, [activeOrganisation]);

  // Function to fetch full organization data
  const fetchFullOrganisationData = useCallback(
    async (organisationId) => {
      if (!organisationId) return;

      try {
        // Fetch the full organization data using the object store
        await object.fetchObject('voorzieningen', 'organisatie', organisationId, {
          _extend: ['@self.schema', 'contactpersonen'],
          _related: true,
          _relatedNames: true,
        });
        // Ensure active object is set so related data selectors work
        object.setActiveObject('voorzieningen', 'organisatie', {
          id: organisationId,
        });
        // Also fetch schema for tabs configuration if not yet loaded
        object.fetchSchema('organisatie');

        // Get the fetched organization data
        const fullOrgData = object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );
        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);
          object.setActiveObject('voorzieningen', 'organisatie', fullOrgData);
        } else {
          // If no full data available, create fallback from activeOrganisation
          createFallbackOrganisationData();
        }
      } catch (err) {
        console.error('Error fetching full organization data:', err);

        // Check if it's a 404 error or similar, and create fallback data
        if (
          err.response?.status === 404 ||
          err.status === 404 ||
          err.message?.includes('404')
        ) {
          console.warn(
            'Organization not found (404), using fallback data from activeOrganisation'
          );
          createFallbackOrganisationData();
        } else {
          // For other errors, still try to create fallback data
          createFallbackOrganisationData();
        }
      }
    },
    [object, createFallbackOrganisationData]
  );

  const setNewFieldDataAndFetch = (v, field) => {
    if (fullActiveOrganisation) {
      fullActiveOrganisation[field] = v;
      fetchFullOrganisationData(fullActiveOrganisation?.['@self']?.id);
    }
  };
  const setNewDataAndFetch = (v) => {
    setFullActiveOrganisation(v);
    if (v?.['@self']?.id) {
      fetchFullOrganisationData(v['@self'].id);
    }
  };

  // Refetch logic
  const fetchUserData = async () => {
    try {
      // Use UserStore's fetchUserProfile method instead of direct API calls
      await user.fetchUserProfile();
      const userData = user.user;

      if (userData) {
        setUserData(userData);

        // Extract organization data
        if (userData.organisations) {
          setOrganisations(userData.organisations);
          setActiveOrganisation(userData.organisations.active);

          // Fetch full organization data if we have an active organization
          if (userData.organisations.active?.uuid) {
            await fetchFullOrganisationData(userData.organisations.active.uuid);
          }
        }

        setFormData({
          displayName: userData.displayName || '',
          email: userData.email || '',
          firstName: userData.firstName || '',
          middleName: userData.middleName || '',
          lastName: userData.lastName || '',
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(
        new Error('Er is een fout opgetreden bij het laden van uw gegevens.')
      );
    }
  };

  // Function to open organization edit modal
  const handleEditOrganization = () => {
    if (!activeOrganisation) return;
    if (!fullActiveOrganisation) return;
    setShowOrgModal(true);
  };

  // Function to open publish modal
  const handlePublishOrganization = () => {
    if (!fullActiveOrganisation || !canEdit) return;
    setShowPublishModal(true);
  };

  // Function to open depublish modal
  const handleDepublishOrganization = () => {
    if (!fullActiveOrganisation || !canEdit) return;
    setShowDepublishModal(true);
  };

  // Function to open deelnames modal
  const handleEditDeelnames = () => {
    if (!fullActiveOrganisation || !canEdit) return;
    setShowDeelnamesModal(true);
  };

  // Handle successful form submissions
  const handleOrgFormSuccess = async (v) => {
    setNewDataAndFetch(v);
    setShowOrgModal(false);
    // Refresh user data to get updated organization info
    await fetchUserData();
  };

  const handleContactFormSuccess = async () => {
    setShowContactModal(false);
    // Refresh user data
    await fetchUserData();
  };

  const handlePublishFormSuccess = async () => {
    setShowPublishModal(false);
    // Refresh user data and organization data
    await fetchUserData();
    if (fullActiveOrganisation?.['@self']?.id) {
      await fetchFullOrganisationData(fullActiveOrganisation['@self'].id);
    }
  };

  const handleDepublishFormSuccess = async () => {
    setShowDepublishModal(false);
    // Refresh user data and organization data
    await fetchUserData();
    if (fullActiveOrganisation?.['@self']?.id) {
      await fetchFullOrganisationData(fullActiveOrganisation['@self'].id);
    }
  };

  const shortTooltip = (type) => `Een korte beschrijving van de ${type}`;
  const longTooltip = (type) => `Een uitgebreide beschrijving van de ${type}`;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        await fetchUserData();
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (error) {
    return <AcBeheerError error={error} />;
  }

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />

        <AcColumn gap='sm' horizontalOverflowWrapper>
          {loading && <AcLoader />}
          {!loading &&
            organisations &&
            organisations.available &&
            !!organisations.results?.length && (
              <>
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
                      {fullActiveOrganisation?.['@self']?.image && (
                        <ConLogoPreview
                          className='con-beheer-details--logo-container'
                          logoUrl={fullActiveOrganisation?.['@self']?.image}
                        />
                      )}

                      <Heading className='con-beheer-details--title'>
                        {fullActiveOrganisation?.['@self']?.name ||
                          fullActiveOrganisation?.id ||
                          activeOrganisation?.name ||
                          'Organisatie'}
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
                            onClick={handleEditOrganization}
                            disabled={!fullActiveOrganisation}
                            data-tooltip-id={
                              !fullActiveOrganisation ? TOOLTIP_ID : undefined
                            }
                            data-tooltip-content={
                              !fullActiveOrganisation
                                ? 'Kan niet bewerken omdat de organisatie niet gevonden is'
                                : undefined
                            }
                          >
                            Bewerken
                          </ConActionMenu.Button>
                          <ConActionMenu.Button
                            icon={<VISUALS.PENCIL />}
                            onClick={() => setEditingSummary(true)}
                            disabled={!fullActiveOrganisation}
                            data-tooltip-id={
                              !fullActiveOrganisation ? TOOLTIP_ID : undefined
                            }
                            data-tooltip-content={
                              !fullActiveOrganisation
                                ? 'Kan niet bewerken omdat de samenvatting niet gevonden is'
                                : undefined
                            }
                          >
                            Bewerk samenvatting
                          </ConActionMenu.Button>
                          <ConActionMenu.Button
                            icon={<VISUALS.PENCIL />}
                            onClick={() => setEditingDescription(true)}
                            disabled={!fullActiveOrganisation}
                            data-tooltip-id={
                              !fullActiveOrganisation ? TOOLTIP_ID : undefined
                            }
                            data-tooltip-content={
                              !fullActiveOrganisation
                                ? 'Kan niet bewerken omdat de beschrijving niet gevonden is'
                                : undefined
                            }
                          >
                            Bewerk beschrijving
                          </ConActionMenu.Button>

                          <ConActionMenu.Button
                            icon={<VISUALS.USERS />}
                            onClick={() => {
                              handleEditDeelnames();
                            }}
                            disabled={!canEdit}
                            data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                            data-tooltip-content={
                              !canEdit
                                ? getDisabledActionTooltip('publish', reason)
                                : undefined
                            }
                          >
                            Deelnames
                          </ConActionMenu.Button>

                          {fullActiveOrganisation &&
                            !fullActiveOrganisation['@self']?.published && (
                              <ConActionMenu.Button
                                icon={<VISUALS.PUBLISH />}
                                onClick={() => {
                                  canEdit ? handlePublishOrganization() : undefined;
                                }}
                                disabled={!canEdit}
                                data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                                data-tooltip-content={
                                  !canEdit
                                    ? getDisabledActionTooltip('publish', reason)
                                    : undefined
                                }
                              >
                                Publiceren
                              </ConActionMenu.Button>
                            )}
                          {fullActiveOrganisation &&
                            fullActiveOrganisation['@self']?.published && (
                              <ConActionMenu.Button
                                icon={<VISUALS.PUBLISH_OFF />}
                                onClick={
                                  canEdit ? handleDepublishOrganization : undefined
                                }
                                disabled={!canEdit}
                                data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                                data-tooltip-content={
                                  !canEdit
                                    ? getDisabledActionTooltip('depublish', reason)
                                    : undefined
                                }
                              >
                                Depubliceren
                              </ConActionMenu.Button>
                            )}
                        </ConActionMenu.Menu>
                      </ConActionMenu>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 2 }}>
                  <ConEditableDescription
                    registerSlug={
                      fullActiveOrganisation?.['@self']?.register?.slug ||
                      'voorzieningen'
                    }
                    schemaSlug={
                      fullActiveOrganisation?.['@self']?.schema?.slug ||
                      'organisatie'
                    }
                    objectId={fullActiveOrganisation?.id}
                    field='beschrijvingKort'
                    label='Korte beschrijving'
                    placeholder={shortTooltip('organisatie')}
                    tooltip={shortTooltip('organisatie')}
                    maxLength={255}
                    isMarkdown={false}
                    value={fullActiveOrganisation?.beschrijvingKort}
                    isEditingCustomTrigger={editingSummary}
                    serialize={(v) => v}
                    deserialize={(v) => v || ''}
                    onSuccess={(v) => (
                      setEditingSummary(false),
                      setNewFieldDataAndFetch(v, 'beschrijvingLang')
                    )}
                    onCancel={() => setEditingSummary(false)}
                  />
                </div>
                {fullActiveOrganisation && (
                  <div>
                    <br />
                    <ConEditableDescription
                      markdownPreviewClassName='con-my-account-description'
                      registerSlug={
                        fullActiveOrganisation?.['@self']?.register?.slug ||
                        'voorzieningen'
                      }
                      schemaSlug={
                        fullActiveOrganisation?.['@self']?.schema?.slug ||
                        'organisatie'
                      }
                      objectId={fullActiveOrganisation?.id}
                      field='beschrijvingLang'
                      label='Lange beschrijving'
                      placeholder={longTooltip('organisatie')}
                      tooltip={longTooltip('organisatie')}
                      maxLength={2000}
                      isMarkdown={true}
                      isEditingCustomTrigger={editingDescription}
                      value={fullActiveOrganisation?.beschrijvingLang}
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
                      onSuccess={(v) => (
                        setEditingDescription(false),
                        setNewFieldDataAndFetch(v, 'beschrijvingLang')
                      )}
                    />
                  </div>
                )}

                {/* Contact Information Section */}
                {fullActiveOrganisation && (
                  <>
                    <Heading level={3} style={{ marginBlockStart: '1rem' }}>
                      Contact informatie
                    </Heading>
                    <div className='ac-register-review__section'>
                      <div style={{ marginTop: '12px' }}>
                        {fullActiveOrganisation?.['e-mailadres'] && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Email: </strong>
                            <Link
                              href={`mailto:${fullActiveOrganisation['e-mailadres']}`}
                            >
                              {fullActiveOrganisation['e-mailadres']}
                            </Link>
                          </div>
                        )}
                        {fullActiveOrganisation?.telefoonnummer && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Telefoon: </strong>
                            <Link
                              href={`tel:${fullActiveOrganisation.telefoonnummer.replace(
                                /\s/g,
                                ''
                              )}`}
                            >
                              {fullActiveOrganisation.telefoonnummer}
                            </Link>
                          </div>
                        )}
                        {fullActiveOrganisation?.website && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Website: </strong>
                            <Link
                              href={
                                fullActiveOrganisation.website.startsWith('http')
                                  ? fullActiveOrganisation.website
                                  : `https://${fullActiveOrganisation.website}`
                              }
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {fullActiveOrganisation.website}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Organisation related tabs (similar to details page) */}
                {fullActiveOrganisation?.id && (
                  <div style={{ marginTop: '2rem' }}>
                    <OrganisationRelatedTabs
                      store={store}
                      organisationId={fullActiveOrganisation.id}
                    />
                  </div>
                )}
              </>
            )}
          {/* Modal for editing account info */}
          <AcMyAccountModal
            showModal={showModal}
            onClose={() => setShowModal(false)}
            onSuccess={fetchUserData}
            formData={formData}
            validateEmail={validateEmail}
          />
          {/* Dynamic form modal for organization editing */}
          {showOrgModal && fullActiveOrganisation && (
            <AcMyAccountDynamicModal
              showModal={showOrgModal}
              onClose={() => setShowOrgModal(false)}
              onSuccess={handleOrgFormSuccess}
              type='organisaties'
              isEdit={true}
              fieldConfigs={{
                status: {
                  visible: false,
                },
              }}
              data={fullActiveOrganisation}
            />
          )}
          {/* Dynamic form modal for contact person editing */}
          {showContactModal && userData && (
            <AcMyAccountDynamicModal
              showModal={showContactModal}
              onClose={() => setShowContactModal(false)}
              onSuccess={handleContactFormSuccess}
              type='contactpersonen'
              isEdit={true}
              data={{
                voornaam: userData.firstName,
                tussenvoegsel: userData.middleName,
                achternaam: userData.lastName,
                'e-mailadres': userData.email,
                telefoonnummer: userData.phone || '',
                functie: userData.function || '',
              }}
            />
          )}
          {/* Publish modal */}
          <AcMyAccountPublishModal
            showModal={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            onSuccess={handlePublishFormSuccess}
            data={fullActiveOrganisation}
            isPublish={true}
          />
          {/* Depublish modal */}
          <AcMyAccountPublishModal
            showModal={showDepublishModal}
            onClose={() => setShowDepublishModal(false)}
            onSuccess={handleDepublishFormSuccess}
            data={fullActiveOrganisation}
            isPublish={false}
          />
          {/* Deelnames modal */}
          {showDeelnamesModal && fullActiveOrganisation && (
            <AcMyAccountDeelnamesModal
              showModal={showDeelnamesModal}
              onClose={() => setShowDeelnamesModal(false)}
              onSuccess={async () => {
                await fetchUserData();
                if (fullActiveOrganisation?.['@self']?.id) {
                  await fetchFullOrganisationData(
                    fullActiveOrganisation['@self'].id
                  );
                }
              }}
              data={fullActiveOrganisation}
            />
          )}
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

const OrganisationRelatedTabs = observer(({ store, organisationId }) => {
  const { object } = store;
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [tabIndexUses, setTabIndexUses] = useState(0);
  const [tabIndexUsed, setTabIndexUsed] = useState(0);

  const fetchUses = useCallback(async () => {
    if (!organisationId) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${organisationId}/uses?_extend[]=@self.schema`,
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
      setUses(data.results);
    } catch (error) {
      console.error('Error fetching uses:', error);
    } finally {
      setUsesLoading(false);
    }
  }, [organisationId]);

  const fetchUsed = useCallback(async () => {
    if (!organisationId) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${organisationId}/used?_extend[]=@self.schema`,
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
      setUsed(data.results);
    } catch (error) {
      console.error('Error fetching used:', error);
    } finally {
      setUsedLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    fetchUses();
    fetchUsed();
  }, [fetchUses, fetchUsed]);

  const uniqueSchemasFrom = useCallback((rel) => {
    if (!rel?.length) return [];
    const map = new Map();
    for (const item of rel) {
      const schema = item['@self']?.schema;
      if (!schema) continue;
      if (!map.has(schema.id)) map.set(schema.id, schema);
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
  }, []);

  const usesSchemas = useMemo(
    () => uniqueSchemasFrom(uses),
    [uses, uniqueSchemasFrom]
  );
  const usedSchemas = useMemo(
    () => uniqueSchemasFrom(used),
    [used, uniqueSchemasFrom]
  );

  if (!usesSchemas?.length && !usedSchemas?.length && !usesLoading && !usedLoading) {
    return null;
  }

  return (
    <>
      <div>
        {(usesLoading || (uses && uses.length > 0)) && (
          <>
            {usesLoading ? (
              <div>
                <AcLoader className='con-publication-uses-used-loader' />
              </div>
            ) : (
              <AcTabs
                selectedIndex={tabIndexUses}
                onSelect={(index) => setTabIndexUses(index)}
              >
                <AcTabList>
                  {uses &&
                    _.uniqBy(uses, (use) => use['@self'].schema.id).map(
                      (use, idx) => {
                        const IconComponent = getTabHeaderIcon(
                          use['@self'].schema.slug
                        );
                        // Count items with this schema
                        const count = uses.filter(
                          (u) => u['@self'].schema.id === use['@self'].schema.id
                        ).length;
                        return (
                          <AcTab
                            key={use['@self'].schema.id}
                            selected={tabIndexUses === idx}
                          >
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <IconComponent />{' '}
                              {getTabHeaderName(use['@self'].schema.slug)} ({count})
                            </span>
                          </AcTab>
                        );
                      }
                    )}
                </AcTabList>

                {uses &&
                  _.uniqBy(uses, (use) => use['@self'].schema.id)
                    .map((use) => use['@self'])
                    .map((metadata, idx) => {
                      // Build the items for ALL items with this schema
                      const itemsWithThisSchema = uses.filter(
                        (u) => u['@self'].schema.id === metadata.schema.id
                      );

                      // Render cards based on schema type
                      const renderCards = itemsWithThisSchema.map((item) => {
                        const schemaSlug = item['@self']?.schema?.slug;

                        switch (schemaSlug) {
                          case 'product':
                          case 'module':
                          case 'organisatie':
                            return (
                              <ConCardOrganisationApplication
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                logo={getImageFromPublication(item)}
                                cardType={schemaSlug}
                                type={item['@self']?.schema?.title}
                                referenceComponents={item.referentieComponenten}
                                updated={item['@self']?.updated}
                                published={item['@self']?.published}
                                organisation={item['@self']?.organisation}
                                objectStore={object}
                              />
                            );
                          case 'dienst':
                            return (
                              <ConCardDienst
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                updated={item['@self']?.updated}
                                published={item['@self']?.published}
                                category={item['@self']?.schema?.title}
                                themes={item.themes}
                              />
                            );
                          case 'gebruik':
                            return (
                              <ConCardGebruik
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                updated={item['@self']?.updated}
                                published={item['@self']?.published}
                                category={item['@self']?.schema?.title}
                                themes={item.themes}
                              />
                            );
                          default:
                            return (
                              <AcSearchResult
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                published={item['@self']?.published}
                                category={item['@self']?.schema?.title}
                                themes={item.themes}
                              />
                            );
                        }
                      });

                      return (
                        <AcTabPanel key={idx} selected={tabIndexUses === idx}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(300px, 1fr))',
                              gap: '16px',
                              marginTop: '16px',
                            }}
                          >
                            {renderCards}
                          </div>
                        </AcTabPanel>
                      );
                    })}
              </AcTabs>
            )}
          </>
        )}
      </div>

      <div>
        {(usedLoading || (used && used.length > 0)) && (
          <>
            {usedLoading ? (
              <div>
                <AcLoader className='con-publication-uses-used-loader' />
              </div>
            ) : (
              <AcTabs
                selectedIndex={tabIndexUsed}
                onSelect={(index) => setTabIndexUsed(index)}
              >
                <AcTabList>
                  {used &&
                    _.uniqBy(used, (use) => use['@self'].schema.id).map(
                      (use, idx) => {
                        const IconComponent = getTabHeaderIcon(
                          use['@self'].schema.slug
                        );
                        // Count items with this schema
                        const count = used.filter(
                          (u) => u['@self'].schema.id === use['@self'].schema.id
                        ).length;
                        return (
                          <AcTab
                            key={use['@self'].schema.id}
                            selected={tabIndexUsed === idx}
                          >
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <IconComponent />{' '}
                              {getTabHeaderName(use['@self'].schema.slug)} ({count})
                            </span>
                          </AcTab>
                        );
                      }
                    )}
                </AcTabList>

                {used &&
                  _.uniqBy(used, (use) => use['@self']?.schema.id)
                    .map((use) => use['@self'])
                    .map((metadata, idx) => {
                      // Build the items for ALL items with this schema
                      const itemsWithThisSchema = used.filter(
                        (u) => u['@self'].schema.id === metadata.schema.id
                      );

                      // Render cards based on schema type
                      const renderCards = itemsWithThisSchema.map((item) => {
                        const schemaSlug = item['@self']?.schema?.slug;

                        switch (schemaSlug) {
                          case 'product':
                          case 'module':
                          case 'organisatie':
                            return (
                              <ConCardOrganisationApplication
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                logo={getImageFromPublication(item)}
                                cardType={schemaSlug}
                                type={item['@self']?.schema?.title}
                                referenceComponents={item.referentieComponenten}
                                updated={item['@self']?.updated}
                                published={item['@self']?.published}
                                organisation={item['@self']?.organisation}
                                objectStore={object}
                              />
                            );
                          case 'dienst':
                            return (
                              <ConCardDienst
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                updated={item['@self']?.updated}
                                published={item['@self']?.published}
                                category={item['@self']?.schema?.title}
                                themes={item.themes}
                              />
                            );
                          case 'gebruik':
                            return (
                              <ConCardGebruik
                                key={item.id}
                                id={item.id}
                                product={item.product}
                                module={item.module}
                                organisation={item['@self'].organisation}
                                referentieComponenten={
                                  item.gebruiktVoorReferentiecomponenten
                                }
                                status={item.status}
                                objectStore={object}
                              />
                            );
                          case 'contactpersoon':
                            return (
                              <ConCardContactpersoon
                                key={item.id}
                                id={item.id}
                                firstName={item.voornaam}
                                middleName={item.tussenvoegsel}
                                lastName={item.achternaam}
                                functie={item.functie}
                                image={item['@self'].image}
                                email={item['e-mailadres']}
                                telefoon={item.telefoonnummer}
                                organisation={item.organisatie}
                                objectStore={object}
                              />
                            );
                          default:
                            return (
                              <AcSearchResult
                                key={item.id}
                                id={item.id}
                                title={
                                  item.title ??
                                  item.titel ??
                                  item.name ??
                                  item.naam ??
                                  item.id
                                }
                                summary={
                                  item.beschrijving ?? item.beschrijvingKort ?? ''
                                }
                                published={item['@self']?.published}
                                category={item['@self']?.schema?.title}
                                themes={item.themes}
                              />
                            );
                        }
                      });

                      return (
                        <AcTabPanel key={idx} selected={tabIndexUsed === idx}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(300px, 1fr))',
                              gap: '16px',
                              marginTop: '16px',
                            }}
                          >
                            {renderCards}
                          </div>
                        </AcTabPanel>
                      );
                    })}
              </AcTabs>
            )}
          </>
        )}
      </div>
    </>
  );
});

export default withStore(observer(ConMyOrganisationPage));
