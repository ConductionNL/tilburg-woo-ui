import { useState, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import AcAuthentication from '../ac-authentication/ac-authentication';
import { AcFormField } from '@molecules';
import {
  Heading,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcButton from '@molecules/ac-button/ac-button';
import { useDebouncedInput } from '@src/hooks/index';

const AcLogin = ({ store }) => {
  const [nextcloudLogin, setNextcloudLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = store;

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect_url');

  // Check if already authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await user.checkAuthStatus();
      
      if (isAuthenticated) {
        // If there's a redirect URL, use it; otherwise go to dashboard
        const targetUrl = redirectUrl || user.getOrganizationDashboardUrl();
        navigate(targetUrl);
      }
    };
    
    checkAuth();
  }, [user, navigate, redirectUrl]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (user.error) {
      user.clearError();
    }
  };

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username || !formData.password) {
      user.setError('Vul alle velden in');
      return;
    }

    try {
      // Use session-based login from UserStore
      const result = await user.sessionLogin(formData.username, formData.password);
      
      console.log('Login result:', result); // Debug log
      
      if (result.success) {
        // Show success message (optional)
        store.toasters.add({
          variant: 'success',
          title: 'Inloggen gelukt',
          description: `Welkom, ${result.user?.displayName || result.user?.uid || 'gebruiker'}!`,
        });
        
        // Navigate to redirect URL or organization dashboard
        const targetUrl = redirectUrl || user.getOrganizationDashboardUrl();
        console.log('Navigating to:', targetUrl); // Debug log
        
        // Use navigate directly without delay to ensure it works
        navigate(targetUrl);
        
        // Also try a fallback navigation if the first one doesn't work
        setTimeout(() => {
          console.log('Fallback navigation to /beheer'); // Debug log
          navigate('/beheer');
        }, 500);
      } else {
        // Error is already set in the UserStore
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      user.setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    }
  };

  const handleNextcloudLogin = () => {
    setNextcloudLogin(true);
  };

  const debouncedSetUsername = useDebouncedInput(
    (value) => handleInputChange('username', value),
    500
  );

  const debouncedSetPassword = useDebouncedInput(
    (value) => handleInputChange('password', value),
    500
  );

  return (
    <div className='ac-login-container'>
      <div>
        <div className='ac-login-heading'>
          <Heading level={1}>Inloggen</Heading>
        </div>

        <form className='ac-login-form' onSubmit={handleSubmit}>
          <div>
            <AcFormField
              id='username'
              label='Gebruikersnaam'
              type='text'
              inputType='text'
              value={formData.username}
              onChange={(value) => debouncedSetUsername(value)}
              placeholder='Uw gebruikersnaam'
              required
              disabled={user.loading.status}
            />
          </div>
          <div>
            <AcFormField
              id='password'
              label='Wachtwoord'
              type='password'
              inputType='password'
              value={formData.password}
              onChange={(value) => debouncedSetPassword(value)}
              placeholder='Uw wachtwoord'
              required
              disabled={user.loading.status}
            />
          </div>

          <AcButton
            style='button'
            icon={<VISUALS.ARROW_RIGHT />}
            onClick={handleSubmit}
            className='ac-login-form-button'
            disabled={user.loading.status}
          >
            {user.loading.status ? 'Inloggen...' : 'Inloggen'}
          </AcButton>

          <div className='ac-login-separator-row'>
            <Separator className='ac-login-separator' />
            <span className='ac-login-divider-text'>of</span>
            <Separator className='ac-login-separator' />
          </div>

          <AcButton
            style='button'
            buttonType='secondary'
            onClick={handleNextcloudLogin}
            className='ac-login-form-button'
            disabled={user.loading.status}
          >
            Nextcloud
          </AcButton>

          {user.error && (
            <span className='ac-login-form-field-error' role='alert'>
              {user.error}
            </span>
          )}
        </form>
      </div>

      {nextcloudLogin && <AcAuthentication />}
    </div>
  );
};

export default withStore(observer(AcLogin));
