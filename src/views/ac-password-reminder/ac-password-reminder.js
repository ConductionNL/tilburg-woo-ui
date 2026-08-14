// eslint-disable-next-line import/no-unresolved
import { useState, useRef, Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import { AcFormField } from '@molecules';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcButton from '@molecules/ac-button/ac-button';

/**
 * ConPasswordReminder Component
 *
 * Handles password reset flow with two steps:
 * 1. Email input to request a one-time login code
 * 2. 6-digit code input with dashes between 3rd and 4th digit
 *
 * @param {Object} store - MobX store containing user store
 */
const ConPasswordReminder = () => {
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const navigate = useNavigate();

  // Refs for the 6 code input fields
  const codeInputRefs = useRef([]);

  const validateEmail = (emailToValidate) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToValidate) {
      return 'E-mailadres is verplicht';
    }
    if (!emailRegex.test(emailToValidate)) {
      return 'Voer een geldig e-mailadres in';
    }
    return null;
  };

  const validateCode = (codeArray) => {
    const codeString = codeArray.join('');
    if (codeString.length !== 6) {
      return 'Voer een 6-cijferige code in';
    }
    if (!/^\d{6}$/.test(codeString)) {
      return 'Code moet uit 6 cijfers bestaan';
    }
    return null;
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSubmit();
    }
  };

  const handleEmailSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Only proceed if we're actually on the email step
    if (step !== 'email') {
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    // TODO: Implement backend call when available
    // For now, just simulate a successful request
    setTimeout(() => {
      setStep('code');
      setIsLoading(false);
      // Focus first code input
      if (codeInputRefs.current[0]) {
        codeInputRefs.current[0].focus();
      }
    }, 1000);
  };

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Clear errors when user starts typing
    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: '' }));
    }

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodeSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const codeError = validateCode(code);
    if (codeError) {
      setErrors({ code: codeError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    // TODO: Implement backend call when available
    // For now, just simulate processing
    setTimeout(() => {
      setIsLoading(false);
      // Would typically redirect to login or dashboard after successful code verification
    }, 1000);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setIsLoading(false);
    setErrors({});
    setCode(['', '', '', '', '', '']);
  };

  const renderEmailStep = () => (
    <div>
      <div className='ac-password-reminder-heading'>
        <Heading level={1}>Wachtwoord vergeten</Heading>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          Voer uw e-mailadres in om een eenmalige inlogcode te ontvangen.
        </p>
      </div>

      <div className='ac-password-reminder-form'>
        <div className='ac-password-reminder-form-fields'>
          <div>
            <AcFormField
              id='email'
              label='E-mailadres'
              type='email'
              inputType='email'
              value={email}
              onChange={setEmail}
              onKeyDown={handleEmailKeyDown}
              placeholder='uw.email@voorbeeld.nl'
              required
              disabled={isLoading}
              error={errors.email}
            />
          </div>
        </div>

        <AcButton
          style='button'
          type='button'
          icon={<VISUALS.ARROW_RIGHT />}
          onClick={handleEmailSubmit}
          className='ac-password-reminder-form-button'
          disabled={isLoading}
        >
          {isLoading ? 'Verzenden...' : 'Verstuur code'}
        </AcButton>

        <AcButton
          style='button'
          buttonType='secondary'
          onClick={() => navigate('/login')}
          className='ac-password-reminder-form-button'
          disabled={isLoading}
        >
          Terug naar inloggen
        </AcButton>

        {errors.general && (
          <span className='ac-password-reminder-form-field-error' role='alert'>
            {errors.general}
          </span>
        )}
      </div>
    </div>
  );

  const renderCodeStep = () => (
    <div>
      <div className='ac-password-reminder-heading'>
        <Heading level={1}>Voer verificatiecode in</Heading>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          We hebben een 6-cijferige code naar <strong>{email}</strong> gestuurd.
        </p>
      </div>

      <div className='ac-password-reminder-form'>
        <div className='ac-code-input-container'>
          {/* The code is split across separate inputs, so a single <label>
              cannot be associated with a control. The group is named instead,
              and each input carries its own position in the code. */}
          <span id='ac-code-input-label' className='ac-code-input-label'>
            Verificatiecode
          </span>
          <div
            className='ac-code-input-group'
            role='group'
            aria-labelledby='ac-code-input-label'
          >
            {code.map((digit, index) => (
              <Fragment key={index}>
                <div className='ac-code-input-wrapper'>
                  <input
                    ref={(el) => (codeInputRefs.current[index] = el)}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    value={digit}
                    aria-label={`Cijfer ${index + 1} van ${code.length}`}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className={`ac-code-input ${
                      errors.code ? 'ac-code-input-error' : ''
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {index === 2 && <span className='ac-code-dash'>-</span>}
              </Fragment>
            ))}
          </div>
          {errors.code && (
            <span className='ac-code-input-error-message' role='alert'>
              {errors.code}
            </span>
          )}
        </div>

        <AcButton
          style='button'
          type='button'
          icon={<VISUALS.ARROW_RIGHT />}
          onClick={handleCodeSubmit}
          className='ac-password-reminder-form-button'
          disabled={isLoading}
        >
          {isLoading ? 'Verifiëren...' : 'Verifieer code'}
        </AcButton>

        <AcButton
          style='button'
          buttonType='secondary'
          onClick={() => handleBackToEmail()}
          className='ac-password-reminder-form-button'
          disabled={isLoading}
        >
          Andere e-mail gebruiken
        </AcButton>

        {errors.general && (
          <span className='ac-password-reminder-form-field-error' role='alert'>
            {errors.general}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className='ac-password-reminder-container'>
      {step === 'email' ? renderEmailStep() : renderCodeStep()}
    </div>
  );
};

export default withStore(observer(ConPasswordReminder));
