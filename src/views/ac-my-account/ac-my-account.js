import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { AcSection, AcContainer } from '@atoms';
import { AcLoader } from '@components';
import {
  Heading,
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import AcColumn from '@atoms/ac-column/ac-column';
import AcButton from '@molecules/ac-button/ac-button';
import AcMyAccountModal from './ac-my-account-modal';
import ReactSelect from 'react-select';
import clsx from 'clsx';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import ConEditableDescription from '@views/ac-beheer/shared/components/con-editable-description/con-editable-description';
import AcMyAccountDynamicModal from './ac-my-account-dynamic-modal';
import AcMyAccountPublishModal from './ac-my-account-publish-modal';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';

const AcMyAccount = ({ store }) => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [organisations, setOrganisations] = useState(null);
  const [activeOrganisation, setActiveOrganisation] = useState(null);
  const [fullActiveOrganisation, setFullActiveOrganisation] = useState(null); // New state for full org data
  const [switchingOrg, setSwitchingOrg] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDepublishModal, setShowDepublishModal] = useState(false);

  const { user, object } = store; // Add object store

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
          _extend: ['@self.schema'],
        });

        // Get the fetched organization data
        const fullOrgData = object.getObject(
          'voorzieningen_organisatie',
          organisationId
        );
        if (fullOrgData) {
          setFullActiveOrganisation(fullOrgData);
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

  // Handle organization switching using existing updateUser function
  const handleOrganisationSwitch = async (selectedOption) => {
    if (!selectedOption || selectedOption.value === activeOrganisation?.uuid) {
      return;
    }

    try {
      setSwitchingOrg(true);

      // Use UserStore's updateUser method
      const response = await user.updateUser({
        activeOrganisation: selectedOption.value,
      });

      const updatedUser = response.data;
      setUserData(updatedUser);

      // Update organization data
      if (updatedUser.organisations) {
        setOrganisations(updatedUser.organisations);
        setActiveOrganisation(updatedUser.organisations.active);

        // Fetch full organization data for the newly selected organization
        if (updatedUser.organisations.active?.uuid) {
          await fetchFullOrganisationData(updatedUser.organisations.active.uuid);
        }
      }

      // Update form data with new user data
      setFormData({
        displayName: updatedUser.displayName || '',
        email: updatedUser.email || '',
        firstName: updatedUser.firstName || '',
        middleName: updatedUser.middleName || '',
        lastName: updatedUser.lastName || '',
      });
    } catch (err) {
      console.error('Error switching organization:', err);
      setError(
        new Error('Er is een fout opgetreden bij het wisselen van organisatie.')
      );
    } finally {
      setSwitchingOrg(false);
    }
  };

  // Function to open organization edit modal
  const handleEditOrganization = () => {
    if (!activeOrganisation) return;
    if (!fullActiveOrganisation) return;
    setShowOrgModal(true);
  };

  // Function to open contact person edit modal
  const handleEditContact = () => {
    if (!userData) return;
    setShowContactModal(true);
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

  const shortTooltip = (type) =>
    `Een korte beschrijving van de ${type.slice(0, -1)}`;
  const longTooltip = (type) =>
    `Een uitgebreide beschrijving van de ${type.slice(0, -1)}`;

  if (error) {
    return <AcBeheerError error={error} />;
  }

  if (loading) {
    return <AcLoader />;
  }

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='lg'>
          <div className='ac-register-review'>
            {/* Organisatie gegevens Section */}
            {organisations &&
              organisations.available &&
              !!organisations.results?.length && (
                <div className='ac-register-review__section'>
                  <div className='ac-register-review__header'>
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
                      {organisations.results.length > 1 && (
                        <ReactSelect
                          placeholder='Selecteer organisatie'
                          value={
                            activeOrganisation
                              ? {
                                  value: activeOrganisation.uuid,
                                  label:
                                    activeOrganisation.name +
                                    (activeOrganisation.isDefault
                                      ? ' (Standaard)'
                                      : ''),
                                }
                              : null
                          }
                          className={clsx(
                            'ac-beheer-select ac-register-review__org-select',
                            switchingOrg && 'ac-beheer-select--disabled'
                          )}
                          onChange={handleOrganisationSwitch}
                          options={organisations.results.map((org) => ({
                            value: org.uuid,
                            label: org.name + (org.isDefault ? ' (Standaard)' : ''),
                          }))}
                          isLoading={switchingOrg}
                          isDisabled={switchingOrg}
                          isClearable={false}
                          styles={{
                            container: (provided) => ({
                              ...provided,
                              minWidth: '200px',
                              marginRight: '1rem',
                            }),
                          }}
                        />
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <AcButton
                          style='button'
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
                        </AcButton>

                        {fullActiveOrganisation &&
                          !fullActiveOrganisation['@self']?.published && (
                            <AcButton
                              style='button'
                              icon={<VISUALS.PUBLISH />}
                              onClick={
                                canEdit ? handlePublishOrganization : undefined
                              }
                              disabled={!canEdit}
                              data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                              data-tooltip-content={
                                !canEdit
                                  ? getDisabledActionTooltip('publish', reason)
                                  : undefined
                              }
                            >
                              Publiceren
                            </AcButton>
                          )}
                        {fullActiveOrganisation &&
                          fullActiveOrganisation['@self']?.published && (
                            <AcButton
                              style='button'
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
                            </AcButton>
                          )}
                      </div>
                    </div>
                  </div>
                  {fullActiveOrganisation && (
                    <div>
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
                        serialize={(v) => v}
                        deserialize={(v) => v || ''}
                        onSuccess={(v) =>
                          setNewFieldDataAndFetch(v, 'beschrijvingKort')
                        }
                      />
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
                        onSuccess={(v) =>
                          setNewFieldDataAndFetch(v, 'beschrijvingLang')
                        }
                      />
                    </div>
                  )}
                  <Separator className='ac-register-review-header__separator' />

                  {switchingOrg && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <Paragraph
                        style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          margin: 0,
                        }}
                      >
                        Organisatie wordt gewijzigd...
                      </Paragraph>
                    </div>
                  )}

                  {activeOrganisation && (
                    <>
                      <div className='ac-register-review__field'>
                        <strong>Naam:</strong>
                        <span>{activeOrganisation.name}</span>
                      </div>
                      <div className='ac-register-review__field'>
                        <strong>Type organisatie:</strong>
                        <span>
                          {activeOrganisation.isDefault
                            ? 'Standaard organisatie'
                            : 'Normale organisatie'}
                        </span>
                      </div>
                      <div className='ac-register-review__field'>
                        <strong>Beschrijving:</strong>
                        <span>{activeOrganisation.description || '-'}</span>
                      </div>
                      <div className='ac-register-review__field'>
                        <strong>Eigenaar:</strong>
                        <span>{activeOrganisation.owner}</span>
                      </div>
                      <div className='ac-register-review__field'>
                        <strong>Aantal leden:</strong>
                        <span>{activeOrganisation.users?.length || 0}</span>
                      </div>

                      {/* Display additional fields from full organization data */}
                      {fullActiveOrganisation && (
                        <>
                          <div className='ac-register-review__field'>
                            <strong>KvK nummer:</strong>
                            <span>{fullActiveOrganisation.kvkNummer || '-'}</span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>RSIN:</strong>
                            <span>{fullActiveOrganisation.rsin || '-'}</span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>Website:</strong>
                            <span>{fullActiveOrganisation.website || '-'}</span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>Adres:</strong>
                            <span>
                              {fullActiveOrganisation.adres?.straatnaam &&
                              fullActiveOrganisation.adres?.huisnummer
                                ? `${fullActiveOrganisation.adres.straatnaam} ${fullActiveOrganisation.adres.huisnummer}`
                                : '-'}
                            </span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>Postcode:</strong>
                            <span>
                              {fullActiveOrganisation.adres?.postcode || '-'}
                            </span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>Plaats:</strong>
                            <span>
                              {fullActiveOrganisation.adres?.woonplaats || '-'}
                            </span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>Land:</strong>
                            <span>{fullActiveOrganisation.adres?.land || '-'}</span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>Telefoon:</strong>
                            <span>
                              {fullActiveOrganisation.telefoonnummer || '-'}
                            </span>
                          </div>
                          <div className='ac-register-review__field'>
                            <strong>E-mail:</strong>
                            <span>
                              {fullActiveOrganisation['e-mailadres'] || '-'}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

            {/* Gebruikersgegevens Section */}
            {userData && (
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <Heading level={4}>Gebruikersgegevens</Heading>
                  <AcButton
                    style='button'
                    icon={<VISUALS.PENCIL />}
                    onClick={() => setShowModal(true)}
                  >
                    Bewerken
                  </AcButton>
                </div>
                <Separator className='ac-register-review-header__separator' />

                <div className='ac-register-review__field'>
                  <strong>Weergavenaam:</strong>
                  <span>{userData.displayName || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>E-mailadres:</strong>
                  <span>{userData.email || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>E-mail geverifieerd:</strong>
                  <span>{userData.emailVerified ? 'Ja' : 'Nee'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Voornaam:</strong>
                  <span>{userData.firstName || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Tussenvoegsels:</strong>
                  <span>{userData.middleName || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Achternaam:</strong>
                  <span>{userData.lastName || '-'}</span>
                </div>
              </div>
            )}

            {/* Contact gegevens Section */}
            {userData && (
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <Heading level={4}>Contact gegevens</Heading>
                  <AcButton
                    style='button'
                    icon={<VISUALS.PENCIL />}
                    onClick={handleEditContact}
                  >
                    Bewerken
                  </AcButton>
                </div>
                <Separator className='ac-register-review-header__separator' />

                <div className='ac-register-review__field'>
                  <strong>UID:</strong>
                  <span>{userData.uid || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Account actief:</strong>
                  <span>{userData.enabled ? 'Ja' : 'Nee'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Laatste login:</strong>
                  <span>
                    {userData.lastLogin
                      ? new Date(userData.lastLogin * 1000).toLocaleString()
                      : '-'}
                  </span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Backend:</strong>
                  <span>{userData.backend || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Groepen:</strong>
                  <span>
                    {userData.groups && userData.groups.length > 0
                      ? userData.groups.join(', ')
                      : '-'}
                  </span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Taal:</strong>
                  <span>{userData.language || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Landinstellingen:</strong>
                  <span>{userData.locale || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Avatar scope:</strong>
                  <span>{userData.avatarScope || '-'}</span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Opslag gebruikt:</strong>
                  <span>
                    {userData.quota && userData.quota.used
                      ? `${(userData.quota.used / (1024 * 1024)).toFixed(2)} MB`
                      : '-'}
                  </span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Opslag totaal:</strong>
                  <span>
                    {userData.quota &&
                    userData.quota.total &&
                    userData.quota.total !== 'none'
                      ? userData.quota.total
                      : 'Onbeperkt'}
                  </span>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Backend mogelijkheden:</strong>
                  <div>
                    {userData.backendCapabilities ? (
                      <AcColumn gap='xs'>
                        {Object.entries(userData.backendCapabilities).map(
                          ([k, v]) => (
                            <Paragraph key={k} style={{ margin: 0 }}>
                              {k}: {v ? 'Ja' : 'Nee'}
                            </Paragraph>
                          )
                        )}
                      </AcColumn>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

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
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcMyAccount));
