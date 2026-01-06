import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import {
  AcSection,
  AcContainer,
  AcTabs,
  AcTabList,
  AcTab,
  AcTabPanel,
} from '@atoms';
import { AcLoader, ConExternalLink } from '@components';
import {
  Heading,
  Paragraph,
  Separator,
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import { Link as RouterLink } from 'react-router-dom';
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
import AcMyAccountDeelnamesModal from './ac-my-account-deelnames-modal';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';

const AcMyAccount = ({ store }) => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    functie: '',
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
  const [showDeelnamesModal, setShowDeelnamesModal] = useState(false);
  const [contactImageFit, setContactImageFit] = useState('cover');

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
          '_extend[]': ['@self.schema', 'contactpersonen'],
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

  // Detect if contact image looks already round (square with transparent corners)
  const handleContactImageLoad = useCallback((e) => {
    try {
      const img = e?.target;
      if (!img) return;
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Default behavior: crop to center
      let nextFit = 'cover';

      // If not square, we crop to circle center
      if (width !== height) {
        setContactImageFit(nextFit);
        return;
      }

      // Try to inspect corner transparency to guess if already circular
      // This may fail on cross-origin images; fall back to 'cover'.
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setContactImageFit(nextFit);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ];
      let transparentCorners = 0;
      for (const [x, y] of corners) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        if (data[3] < 10) transparentCorners += 1; // alpha channel near 0
      }
      if (transparentCorners >= 3) {
        nextFit = 'contain';
      }
      setContactImageFit(nextFit);
    } catch (err) {
      // Likely CORS taint; keep default cropping behavior
      setContactImageFit('cover');
    }
  }, []);

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
          email: userData.email || '',
          firstName: userData.firstName || '',
          middleName: userData.middleName || '',
          lastName: userData.lastName || '',
          functie: userData.functie || '',
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

  // Handle hash scrolling after data is loaded
  useEffect(() => {
    if (!loading && userData && window.location.hash) {
      // Let browser handle hash scrolling after content is loaded
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [loading, userData]);

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
        email: updatedUser.email || '',
        firstName: updatedUser.firstName || '',
        middleName: updatedUser.middleName || '',
        lastName: updatedUser.lastName || '',
        functie: updatedUser.functie || '',
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
                <>
                  <div className='ac-register-review__organisation-header'>
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
                    <div className='ac-register-review__header-controls'>
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

                        <AcButton
                          style='button'
                          icon={<VISUALS.USERS />}
                          onClick={canEdit ? handleEditDeelnames : undefined}
                          disabled={!canEdit || !fullActiveOrganisation}
                          data-tooltip-id={
                            !canEdit || !fullActiveOrganisation
                              ? TOOLTIP_ID
                              : undefined
                          }
                          data-tooltip-content={
                            !fullActiveOrganisation
                              ? 'Kan deelnames niet bewerken omdat de organisatie niet gevonden is'
                              : !canEdit
                              ? getDisabledActionTooltip('bewerken', reason)
                              : undefined
                          }
                        >
                          Deelnames
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
                  <div className='ac-register-review__section'>
                    <div className='ac-account-review__header'>
                      <div style={{ flex: 2 }}>
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
                        <br />
                        <br />
                        <div className='ac-account-review__header-info'>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <span>Website:</span>
                            <ConExternalLink
                              href={fullActiveOrganisation?.website}
                            />
                          </div>
                          <div>
                            Telefoon:
                            <div>
                              {fullActiveOrganisation?.telefoonnummer ? (
                                <Link
                                  href={`tel:${fullActiveOrganisation.telefoonnummer}`}
                                >
                                  {fullActiveOrganisation.telefoonnummer}
                                </Link>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>
                          <div>
                            Type:
                            <div>{fullActiveOrganisation?.type || '-'}</div>
                          </div>
                          {fullActiveOrganisation?.type === 'Leverancier' && (
                            <div>
                              KVK-nummer:
                              <div>{fullActiveOrganisation?.kvkNummer || '-'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className='ac-register-review__contact'>
                        <div className='ac-register-review__contact-details'>
                          <div className='ac-register-review__contact-image'>
                            {fullActiveOrganisation?.contactpersonen[0]?.image ? (
                              <img
                                src={fullActiveOrganisation.contactpersonen[0].image}
                                alt='Contactpersoon'
                                className='ac-register-review__contact-image--round'
                                onLoad={handleContactImageLoad}
                                style={{ objectFit: contactImageFit }}
                              />
                            ) : (
                              <div className='ac-register-review__contact-image--round'>
                                <VISUALS.USER_CIRCLE />
                              </div>
                            )}
                          </div>
                          <Heading level={5}>Contactpersoon</Heading>
                          <div className='ac-register-review__contact-info'>
                            <div>
                              {[
                                fullActiveOrganisation?.contactpersonen[0]?.voornaam,
                                fullActiveOrganisation?.contactpersonen[0]
                                  ?.tussenvoegsel,
                                fullActiveOrganisation?.contactpersonen[0]
                                  ?.achternaam,
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            </div>
                            <div>
                              {fullActiveOrganisation?.contactpersonen[0]?.[
                                'e-mailadres'
                              ] ? (
                                <Link
                                  href={`mailto:${fullActiveOrganisation?.contactpersonen[0]?.['e-mailadres']}`}
                                >
                                  {
                                    fullActiveOrganisation?.contactpersonen[0]?.[
                                      'e-mailadres'
                                    ]
                                  }
                                </Link>
                              ) : (
                                '-'
                              )}
                            </div>
                            <div>
                              {fullActiveOrganisation?.contactpersonen[0]
                                ?.telefoonnummer ? (
                                <Link
                                  href={`tel:${fullActiveOrganisation?.contactpersonen[0]?.telefoonnummer}`}
                                >
                                  {
                                    fullActiveOrganisation?.contactpersonen[0]
                                      ?.telefoonnummer
                                  }
                                </Link>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
                          maxLength={5000}
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
                    {/* Organisation related tabs (similar to details page) */}
                    {fullActiveOrganisation?.id && (
                      <div style={{ marginTop: '1rem' }}>
                        <AccountOrganisationTabs
                          store={store}
                          organisationId={fullActiveOrganisation.id}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            <div id='gebruikersgegevens' />

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
                <Separator className='ac-my-account__separator' />

                <div className='ac-register-review__field'>
                  <strong>E-mailadres:</strong>
                  <span>{userData.email || '-'}</span>
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
                <div className='ac-register-review__field'>
                  <strong>Organisatie:</strong>
                  <RouterLink // Link from react-router combined with Utrecht styling since that works better
                    to='/beheer/my-organisation'
                    className='utrecht-link utrecht-link--html-a'
                  >
                    <span>{userData.organisations.active.name || '-'}</span>
                  </RouterLink>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Functie:</strong>
                  <span>{userData.functie || '-'}</span>
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
      </AcContainer>
    </AcSection>
  );
};

const AccountOrganisationTabs = observer(({ store }) => {
  const { object } = store;
  const objectType = 'voorzieningen_organisatie';

  // Pull related data for tabs
  const usesData = object.getRelatedData(objectType, 'uses');
  const usedData = object.getRelatedData(objectType, 'used');

  const uniqueSchemasFrom = useCallback((rel) => {
    if (!rel?.results) return [];
    const map = new Map();
    for (const item of rel.results) {
      const schema = item['@self']?.schema;
      if (!schema) continue;
      if (!map.has(schema.id)) map.set(schema.id, schema);
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
  }, []);

  // Only show specific categories: producten, diensten, koppelingen, modules
  const filterWantedSchemas = useCallback((schemas) => {
    const wanted = new Set(['product', 'dienst', 'koppeling', 'module']);
    return (schemas || []).filter((s) => wanted.has(s.slug || s.id || s));
  }, []);

  const usesSchemas = useMemo(
    () => filterWantedSchemas(uniqueSchemasFrom(usesData)),
    [usesData]
  );
  const usedSchemas = useMemo(
    () => filterWantedSchemas(uniqueSchemasFrom(usedData)),
    [usedData]
  );

  const [tabIndex, setTabIndex] = useState(0);

  if (!usesSchemas?.length && !usedSchemas?.length) return null;

  return (
    <div className='ac-account--tabs-container'>
      <AcTabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
        <AcTabList>
          {usesSchemas.map((schema, idx) => {
            const count = (usesData?.results || []).filter(
              (r) => r['@self']?.schema?.id === schema.id
            ).length;
            return (
              <AcTab key={`uses-${schema.id}`} selected={tabIndex === idx}>
                {(schema.slug === 'product'
                  ? 'Producten'
                  : schema.slug === 'dienst'
                  ? 'Diensten'
                  : schema.slug === 'koppeling'
                  ? 'Koppelingen'
                  : schema.slug === 'module'
                  ? 'Applicaties'
                  : schema.title || schema.id) + (count ? ` (${count})` : '')}
              </AcTab>
            );
          })}
          {usedSchemas.map((schema, idx) => {
            const count = (usedData?.results || []).filter(
              (r) => r['@self']?.schema?.id === schema.id
            ).length;
            return (
              <AcTab
                key={`used-${schema.id}`}
                selected={tabIndex === idx + usesSchemas.length}
              >
                {(schema.slug === 'product'
                  ? 'Producten'
                  : schema.slug === 'dienst'
                  ? 'Diensten'
                  : schema.slug === 'koppeling'
                  ? 'Koppelingen'
                  : schema.slug === 'module'
                  ? 'Applicaties'
                  : schema.title || schema.id) + (count ? ` (${count})` : '')}
              </AcTab>
            );
          })}
        </AcTabList>

        {usesSchemas.map((schema, idx) => {
          const rows = (usesData?.results || []).filter(
            (r) => r['@self']?.schema?.id === schema.id
          );
          return (
            <AcTabPanel key={`uses-panel-${schema.id}`} selected={tabIndex === idx}>
              <ul
                style={{ margin: 0, paddingInlineStart: '1rem', textAlign: 'right' }}
              >
                {rows.map((r) => {
                  const href =
                    r['@self']?.schema?.slug && r['@self']?.id
                      ? `/beheer/${r['@self']?.schema?.slug}/${r['@self']?.id}`
                      : undefined;
                  return (
                    <li key={r.id || r['@self']?.id}>
                      {href ? (
                        <Link href={href}>{r['@self']?.name || r.id}</Link>
                      ) : (
                        r['@self']?.name || r.id
                      )}
                    </li>
                  );
                })}
              </ul>
            </AcTabPanel>
          );
        })}

        {usedSchemas.map((schema, idx) => {
          const rows = (usedData?.results || []).filter(
            (r) => r['@self']?.schema?.id === schema.id
          );
          const index = idx + usesSchemas.length;
          return (
            <AcTabPanel
              key={`used-panel-${schema.id}`}
              selected={tabIndex === index}
            >
              <ul
                style={{ margin: 0, paddingInlineStart: '1rem', textAlign: 'right' }}
              >
                {rows.map((r) => {
                  const href =
                    r['@self']?.schema?.slug && r['@self']?.id
                      ? `/beheer/${r['@self']?.schema?.slug}/${r['@self']?.id}`
                      : undefined;
                  return (
                    <li key={r.id || r['@self']?.id}>
                      {href ? (
                        <Link href={href}>{r['@self']?.name || r.id}</Link>
                      ) : (
                        r['@self']?.name || r.id
                      )}
                    </li>
                  );
                })}
              </ul>
            </AcTabPanel>
          );
        })}
      </AcTabs>
    </div>
  );
});

export default withStore(observer(AcMyAccount));
