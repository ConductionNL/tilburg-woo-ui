import React, { useState, useEffect, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcFlex, AcSection } from '@atoms';
import { useNavigate } from 'react-router';
import { AcLoader } from '@components';
import {
  Heading,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import AcFormField from '@molecules/ac-form-field/ac-form-field';
import AcButton from '@molecules/ac-button/ac-button';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { useLaterEffect } from '@src/hooks';
import AcMyAccountModal from './ac-my-account-modal';

const AcMyAccount = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
  });
  const [touched, setTouched] = useState({
    displayName: false,
    email: false,
    firstName: false,
    middleName: false,
    lastName: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { getUser, updateUser } = useNextcloudRequests();

  // Email validation function
  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  // Refetch logic
  const fetchUserData = async () => {
    try {
      const response = await getUser();
      const user = response.data;
      setUserData(user);
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(
          '/login?redirect_url=' + encodeURIComponent(window.location.pathname)
        );
      } else {
        console.error(err);
        throw Error(
          err.message || 'Er is een fout opgetreden bij het laden van uw gegevens.'
        );
      }
    } finally {
    }
  };

  useEffect(async () => {
    try {
      setLoading(true);
      await fetchUserData();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.displayName?.trim()) {
      errors.displayName = 'Weergavenaam is verplicht';
    }

    if (!formData.email?.trim()) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const updateData = {
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim() || null,
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim() || null,
      };

      await updateUser(updateData);

      // Update local user data
      setUserData((prev) => ({
        ...prev,
        ...updateData,
      }));
      setFormData((prev) => ({
        ...prev,
        ...updateData,
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        // User needs to log in again
        navigate(
          '/login?redirect_url=' + encodeURIComponent(window.location.pathname)
        );
      } else {
        setError(
          err.message || 'Er is een fout opgetreden bij het opslaan van uw gegevens.'
        );
      }
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

        {/* Modal for editing account info */}
        <AcMyAccountModal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchUserData}
          formData={formData}
          touched={touched}
          validateEmail={validateEmail}
        />
      </AcColumn>
    </AcSection>
  );
};

export default observer(AcMyAccount);
