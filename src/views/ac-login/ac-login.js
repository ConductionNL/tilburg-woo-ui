// eslint-disable-next-line import/no-unresolved
import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import { useSearchParams, Link } from 'react-router-dom';
import { AcFormField } from '@molecules';
import {
  Heading,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcButton from '@molecules/ac-button/ac-button';
import { useDebouncedInput } from '@src/hooks/index';

const AcLogin = ({ store }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = store;

  // Ref to store flush functions from debounced inputs
  const flushFunctionsRef = useRef([]);

  // Ref to store the latest form values (updated immediately, not debounced)
  const latestFormDataRef = useRef({
    username: '',
    password: '',
  });

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect_url');
  const wasRedirected = !!redirectUrl;

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

  const handleImmediateInputChange = (field, value) => {
    // Update ref immediately (not debounced)
    latestFormDataRef.current = {
      ...latestFormDataRef.current,
      [field]: value,
    };
    // Also trigger the debounced update for UI state
    handleInputChange(field, value);
  };

  const validateForm = (dataToValidate = formData) => {
    const newErrors = {};

    if (!dataToValidate.username) {
      newErrors.username = 'Gebruikersnaam is verplicht';
    }

    if (!dataToValidate.password) {
      newErrors.password = 'Wachtwoord is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Flush all pending debounced values before submitting
    flushFunctionsRef.current.forEach((flush) => flush());

    // Use the latest values from the ref for validation and submission
    const latestData = latestFormDataRef.current;

    if (!validateForm(latestData)) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    const result = await user.sessionLogin(latestData.username, latestData.password);

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

  const { debouncedCallback: debouncedSetUsername, flush: flushUsername } =
    useDebouncedInput((value) => handleInputChange('username', value), 500, {
      returnFlushFunction: true,
    });

  const { debouncedCallback: debouncedSetPassword, flush: flushPassword } =
    useDebouncedInput((value) => handleInputChange('password', value), 500, {
      returnFlushFunction: true,
    });

  // Register flush functions
  useEffect(() => {
    flushFunctionsRef.current.push(flushUsername, flushPassword);
    return () => {
      // Clean up flush functions on unmount
      flushFunctionsRef.current = flushFunctionsRef.current.filter(
        (fn) => fn !== flushUsername && fn !== flushPassword
      );
    };
  }, [flushUsername, flushPassword]);

  return (
    <div className='ac-login-container'>
      <div>
        {wasRedirected && (
          <div
            className='ac-login-redirect-notice'
            style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              color: '#1976d2',
            }}
          >
            <strong>Inloggen vereist:</strong> Je moet inloggen om deze pagina te
            bekijken.
          </div>
        )}

        <div className='ac-login-heading'>
          <Heading level={1}>Inloggen</Heading>
        </div>

        <form className='ac-login-form' onSubmit={handleSubmit}>
          <div className='ac-login-form-fields'>
            <div>
              <AcFormField
                id='username'
                label='Gebruikersnaam'
                type='text'
                inputType='text'
                value={formData.username}
                onChange={(value) => {
                  handleImmediateInputChange('username', value);
                  debouncedSetUsername(value);
                }}
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
                onChange={(value) => {
                  handleImmediateInputChange('password', value);
                  debouncedSetPassword(value);
                }}
                placeholder='Uw wachtwoord'
                required
                disabled={isLoading || user.loading.status}
                error={errors.password}
              />
            </div>

            <Link
              className='utrecht-link utrecht-link--html-a'
              to='/wachtwoord-vergeten'
            >
              Wachtwoord vergeten?
            </Link>
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

          <AcButton
            style='button'
            buttonType='secondary'
            onClick={() => navigate('/reminder')}
            className='ac-login-form-button'
            disabled={isLoading || user.loading.status}
          >
            Wachtwoord vergeten?
          </AcButton>

          {(user.error || errors.general) && (
            <span className='ac-login-form-field-error' role='alert'>
              {user.error || errors.general}
            </span>
          )}
        </form>
      </div>
    </div>
  );
};

export default withStore(observer(AcLogin));
