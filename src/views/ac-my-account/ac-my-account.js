import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { AcFlex, AcGrid, AcSection } from '@atoms';
import { useNavigate } from 'react-router';
import { AcLoader } from '@components';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import AcButton from '@molecules/ac-button/ac-button';
import AcMyAccountModal from './ac-my-account-modal';
import ReactSelect from 'react-select';
import clsx from 'clsx';

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
      setError(new Error('Er is een fout opgetreden bij het laden van uw gegevens.'));
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

      const updateData = {
        // ...userData,
        displayName: userData.displayName,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName,
        language: userData.language,
        locale: userData.locale,
        activeOrganisation: selectedOption.value,
      };

      const response = await updateUser(updateData);
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
      setError(new Error('Er is een fout opgetreden bij het wisselen van organisatie.'));
    } finally {
      setSwitchingOrg(false);
    }
  };

  if (error) {
    return <AcBeheerError error={error} />;
  }

  if (loading) {
    return <AcLoader />;
  }

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcColumn gap='sm'>
        <AcFlex spacing='sm' justifyContent='between'>
          <Heading>Mijn Account</Heading>
          <AcButton
            style='button'
            icon={<VISUALS.PENCIL />}
            onClick={() => setShowModal(true)}
          >
            Account bewerken
          </AcButton>
        </AcFlex>

        <AcGrid columns={2}>
          {/* Organization Section - Add this new section */}
          {organisations &&
            organisations.available &&
            !!organisations.results?.length && (
              <div
                className='ac-organization-section'
                style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}
              >
                <Heading level={2} style={{ marginBottom: '1rem' }}>
                  Organisatie
                </Heading>
                <div style={{ maxWidth: 600 }}>
                  {organisations.results.length > 1 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label className='utrecht-form-label'>
                        <Heading level={4}>Actieve organisatie</Heading>
                      </label>
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
                          'ac-beheer-select',
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
                      />
                      {switchingOrg && (
                        <Paragraph
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.875rem',
                            color: '#666',
                          }}
                        >
                          Organisatie wordt gewijzigd...
                        </Paragraph>
                      )}
                    </div>
                  )}

                  {activeOrganisation && (
                    <dl
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'max-content 1fr',
                        rowGap: '0.5rem',
                        columnGap: '2rem',
                        maxWidth: 600,
                      }}
                    >
                      <dt>
                        <strong>Organisatie naam</strong>
                      </dt>
                      <dd>
                        <Paragraph>{activeOrganisation.name}</Paragraph>
                      </dd>

                      <dt>
                        <strong>Beschrijving</strong>
                      </dt>
                      <dd>
                        <Paragraph>
                          {activeOrganisation.description || '-'}
                        </Paragraph>
                      </dd>

                      <dt>
                        <strong>Eigenaar</strong>
                      </dt>
                      <dd>
                        <Paragraph>{activeOrganisation.owner}</Paragraph>
                      </dd>

                      <dt>
                        <strong>Aantal leden</strong>
                      </dt>
                      <dd>
                        <Paragraph>
                          {activeOrganisation.users?.length || 0}
                        </Paragraph>
                      </dd>

                      <dt>
                        <strong>Type</strong>
                      </dt>
                      <dd>
                        <Paragraph>
                          {activeOrganisation.isDefault
                            ? 'Standaard organisatie'
                            : 'Normale organisatie'}
                        </Paragraph>
                      </dd>
                    </dl>
                  )}
                </div>
              </div>
            )}

          {/* Personal Info Section */}
          {userData && (
            <div
              className='ac-personal-info-section'
              style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}
            >
              <Heading level={2} style={{ marginBottom: '1rem' }}>
                Persoonlijke gegevens
              </Heading>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content 1fr',
                  rowGap: '0.5rem',
                  columnGap: '2rem',
                  maxWidth: 600,
                }}
              >
                <dt>
                  <strong>Weergavenaam</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.displayName || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>E-mailadres</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.email || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>E-mail geverifieerd</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.emailVerified ? 'Ja' : 'Nee'}</Paragraph>
                </dd>

                <dt>
                  <strong>Voornaam</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.firstName || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Tussenvoegsels</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.middleName || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Achternaam</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.lastName || '-'}</Paragraph>
                </dd>
              </dl>
            </div>
          )}

          {/* Info Section */}
          {userData && (
            <div className='ac-account-info-section' style={{ marginTop: '2.5rem' }}>
              <Heading level={2} style={{ marginBottom: '1rem' }}>
                Mijn accountinformatie
              </Heading>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content 1fr',
                  rowGap: '0.5rem',
                  columnGap: '2rem',
                  maxWidth: 600,
                }}
              >
                <dt>
                  <strong>UID</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.uid || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Account actief</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.enabled ? 'Ja' : 'Nee'}</Paragraph>
                </dd>

                <dt>
                  <strong>Laatste login</strong>
                </dt>
                <dd>
                  <Paragraph>
                    {userData.lastLogin
                      ? new Date(userData.lastLogin * 1000).toLocaleString()
                      : '-'}
                  </Paragraph>
                </dd>

                <dt>
                  <strong>Backend</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.backend || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Groepen</strong>
                </dt>
                <dd>
                  <Paragraph>
                    {userData.groups && userData.groups.length > 0
                      ? userData.groups.join(', ')
                      : '-'}
                  </Paragraph>
                </dd>

                <dt>
                  <strong>Taal</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.language || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Landinstellingen</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.locale || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Avatar scope</strong>
                </dt>
                <dd>
                  <Paragraph>{userData.avatarScope || '-'}</Paragraph>
                </dd>

                <dt>
                  <strong>Opslag gebruikt</strong>
                </dt>
                <dd>
                  <Paragraph>
                    {userData.quota && userData.quota.used
                      ? `${(userData.quota.used / (1024 * 1024)).toFixed(2)} MB`
                      : '-'}
                  </Paragraph>
                </dd>

                <dt>
                  <strong>Opslag totaal</strong>
                </dt>
                <dd>
                  <Paragraph>
                    {userData.quota &&
                    userData.quota.total &&
                    userData.quota.total !== 'none'
                      ? userData.quota.total
                      : 'Onbeperkt'}
                  </Paragraph>
                </dd>

                <dt>
                  <strong>Backend mogelijkheden</strong>
                </dt>
                <dd>
                  {userData.backendCapabilities ? (
                    <AcColumn gap='xs'>
                      {Object.entries(userData.backendCapabilities).map(([k, v]) => (
                        <Paragraph key={k} style={{ margin: 0 }}>
                          {k}: {v ? 'Ja' : 'Nee'}
                        </Paragraph>
                      ))}
                    </AcColumn>
                  ) : (
                    <Paragraph>-</Paragraph>
                  )}
                </dd>
              </dl>
            </div>
          )}
        </AcGrid>

        {/* Modal for editing account info */}
        <AcMyAccountModal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchUserData}
          formData={formData}
          validateEmail={validateEmail}
        />
      </AcColumn>
    </AcSection>
  );
};

export default withStore(observer(AcMyAccount));
