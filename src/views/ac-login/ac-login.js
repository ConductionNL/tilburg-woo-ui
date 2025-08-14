// eslint-disable-next-line import/no-unresolved
import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
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
    // Clear local errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Gebruikersnaam is verplicht';
    }

    if (!formData.password) {
      newErrors.password = 'Wachtwoord is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    const result = await user.sessionLogin(formData.username, formData.password);

    if (result.success) {
      const targetUrl = redirectUrl || user.getOrganizationDashboardUrl();
      navigate(targetUrl);
    } else {
      setErrors({
        general: result.error || 'Inloggen mislukt. Controleer uw gegevens.',
      });
    }

    setIsLoading(false);
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
              disabled={isLoading || user.loading.status}
              error={errors.username}
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
              disabled={isLoading || user.loading.status}
              error={errors.password}
            />
          </div>

          <AcButton
            style='button'
            icon={<VISUALS.ARROW_RIGHT />}
            onClick={handleSubmit}
            className='ac-login-form-button'
            disabled={isLoading || user.loading.status}
          >
            {isLoading || user.loading.status ? 'Inloggen...' : 'Inloggen'}
          </AcButton>

          <div className='ac-login-separator-row'>
            <Separator className='ac-login-separator' />
            <span className='ac-login-divider-text'>of</span>
            <Separator className='ac-login-separator' />
          </div>

          <AcButton
            style='button'
            buttonType='secondary'
            onClick={() => navigate('/register')}
            className='ac-login-form-button'
            disabled={isLoading || user.loading.status}
          >
            Aanmelden
          </AcButton>

          {(user.error || errors.general) && (
            <span className='ac-login-form-field-error' role='alert'>
              {user.error || errors.general}
            </span>
          )}
        </form>
      </div>

      {nextcloudLogin && <AcAuthentication />}
    </div>
  );
};

export default withStore(observer(AcLogin));
