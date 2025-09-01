import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { AcFlex, AcGrid, AcSection, AcContainer } from '@atoms';
import { useNavigate } from 'react-router';
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
import ConGenericFormModal from '@views/ac-beheer/core/modals/con-generic-form-modal/con-generic-form-modal';

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
  const [switchingOrg, setSwitchingOrg] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const navigate = useNavigate();
  const { user } = store;

  // Email validation function
  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
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
    setShowOrgModal(true);
  };

  // Function to open contact person edit modal  
  const handleEditContact = () => {
    if (!userData) return;
    setShowContactModal(true);
  };

  // Handle successful form submissions
  const handleOrgFormSuccess = async (response) => {
    setShowOrgModal(false);
    // Refresh user data to get updated organization info
    await fetchUserData();
  };

  const handleContactFormSuccess = async (response) => {
    setShowContactModal(false);
    // Refresh user data
    await fetchUserData();
  };

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
                    <Heading level={4}>Organisatie gegevens</Heading>
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
                      <AcButton
                        style='button'
                        icon={<VISUALS.PENCIL />}
                        onClick={handleEditOrganization}
                      >
                        Bewerken
                      </AcButton>
                    </div>
                  </div>
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
                        {Object.entries(userData.backendCapabilities).map(([k, v]) => (
                          <Paragraph key={k} style={{ margin: 0 }}>
                            {k}: {v ? 'Ja' : 'Nee'}
                          </Paragraph>
                        ))}
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
          {showOrgModal && activeOrganisation && (
            <ConGenericFormModal
              showModal={showOrgModal}
              onClose={() => setShowOrgModal(false)}
              onSuccess={handleOrgFormSuccess}
              type="organisaties"
              isEdit={true}
              data={activeOrganisation}
            />
          )}

          {/* Dynamic form modal for contact person editing */}
          {showContactModal && userData && (
            <ConGenericFormModal
              showModal={showContactModal}
              onClose={() => setShowContactModal(false)}
              onSuccess={handleContactFormSuccess}
              type="contactpersonen"
              isEdit={true}
              data={{
                voornaam: userData.firstName,
                tussenvoegsel: userData.middleName,
                achternaam: userData.lastName,
                'e-mailadres': userData.email,
                telefoonnummer: userData.phone || '',
                functie: userData.function || ''
              }}
            />
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcMyAccount));
