import React, { useState, useEffect, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { ConDynamicSidenav } from '@components';
import {
  Heading,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcMyAccountModal from '@views/ac-my-account/ac-my-account-modal';
import AcButton from '@molecules/ac-button/ac-button';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import AcLoader from '@components/ac-loader/ac-loader';
import { Link } from 'react-router-dom';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const ConMyAccountPage = ({ store }) => {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    functie: '',
  });
  const { user } = store;

  // Refetch logic
  const fetchUserData = async () => {
    try {
      // Use UserStore's fetchUserProfile method instead of direct API calls
      await user.fetchUserProfile();
      const userData = user.user;

      if (userData) {
        setUserData(userData);

        // Extract organization data

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

  // Email validation function
  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

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
          {loading ? (
            <AcLoader />
          ) : (
            <>
              <Heading level={1}>Mijn Account</Heading>
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
                    <Link // Link from react-router combined with Utrecht styling since that works better
                      to='/beheer/my-organisation'
                      className='utrecht-link utrecht-link--html-a'
                    >
                      <span>{userData.organisations.active.name || '-'}</span>
                    </Link>
                  </div>
                  <div className='ac-register-review__field'>
                    <strong>Functie:</strong>
                    <span>{userData.functie || '-'}</span>
                  </div>
                </div>
              )}
              {/* Modal for editing account info */}
              <AcMyAccountModal
                showModal={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchUserData}
                formData={formData}
                validateEmail={validateEmail}
              />
            </>
          )}
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(ConMyAccountPage));
