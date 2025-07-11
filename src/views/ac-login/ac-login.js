import { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import AcAuthentication from '../ac-authentication/ac-authentication';
import { AcFormField } from '@molecules';
import {
  Heading,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcButton from '@molecules/ac-button/ac-button';
import { useDebouncedInput } from '@src/hooks/index';

const AcLogin = () => {
  const [nextcloudLogin, setNextcloudLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await fetch(
        'https://vng.test.commonground.nu/apps/openconnector/api/user/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.email,
            password: formData.password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Handle successful login
        console.log('Login successful:', data);
        // You can access user data via data.user
        // Navigate to dashboard or handle session
      } else {
        const errorData = await response.json();
        setErrors({
          general: errorData.error || 'Inloggen mislukt. Controleer uw gegevens.',
        });
      }
    } catch (error) {
      setErrors({ general: 'Inloggen mislukt. Controleer uw gegevens.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextcloudLogin = () => {
    setNextcloudLogin(true);
  };

  const debouncedSetEmail = useDebouncedInput(
    (value) => setFormData({ ...formData, email: value }),
    500
  );

  const debouncedSetPassword = useDebouncedInput(
    (value) => setFormData({ ...formData, password: value }),
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
              id='email'
              label='E-mailadres'
              type='email'
              inputType='email'
              value={formData.email}
              onChange={(value) => debouncedSetEmail(value)}
              placeholder='naam@voorbeeld.nl'
              required
              hasError={formData.email && !validateEmail(formData.email)}
            />
            {formData.email && !validateEmail(formData.email) && (
              <span className='ac-login-form-field-error' role='alert'>
                Ongeldig e-mailadres
              </span>
            )}
          </div>
          <div>
            <AcFormField
              id='password'
              label='Wachtwoord'
              type={passwordVisible ? 'text' : 'password'}
              inputType='password'
              value={formData.password}
              onChange={(value) => debouncedSetPassword(value)}
              placeholder='Uw wachtwoord'
              required
            />
          </div>

          <AcButton
            style='button'
            icon={<VISUALS.ARROW_RIGHT />}
            onClick={handleSubmit}
            className='ac-login-form-button'
            disabled={isLoading}
          >
            {isLoading ? 'Inloggen...' : 'Inloggen'}
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
          >
            Nextcloud
          </AcButton>

          {errors.general && (
            <span className='ac-login-form-field-error' role='alert'>
              {errors.general}
            </span>
          )}
        </form>
      </div>

      {nextcloudLogin && <AcAuthentication />}
    </div>
  );
};

export default withStore(observer(AcLogin));
