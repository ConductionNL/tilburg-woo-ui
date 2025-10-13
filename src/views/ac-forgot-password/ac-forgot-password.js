import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFormField } from '@molecules';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import AcButton from '@molecules/ac-button/ac-button';
import { AcFlex } from '@src/atoms';
import { VISUALS } from '@src/constants';

const AcForgotPassword = () => {
  const [email, setEmail] = useState('');

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <AcFlex className='ac-forgot-password-container'>
      <AcFlex column spacing='md' className='ac-forgot-password-container-inner'>
        <AcFlex justifyContent='center' className='ac-forgot-password-heading'>
          <Heading level={3}>Wachtwoord vergeten?</Heading>
        </AcFlex>

        <AcFlex column spacing='sm'>
          <div>
            <AcFormField
              icon={<VISUALS.ENVELOPE_OUTLINE />}
              label='E-mailadres'
              type='text'
              inputType='text'
              value={email}
              onChange={(value) => {
                setEmail(value);
              }}
              placeholder='Uw e-mailadres'
              required
              hasError={!isValidEmail(email) && !!email.trim()}
            />
          </div>

          <AcButton
            style='button'
            onClick={() => {}}
            className='ac-login-form-button'
            disabled={!isValidEmail(email)}
          >
            Wachtwoord resetten
          </AcButton>

          <AcFlex justifyContent='center'>
            <Link href='/login'>Terug naar aanmelden</Link>
          </AcFlex>
        </AcFlex>
      </AcFlex>
    </AcFlex>
  );
};

export default withStore(observer(AcForgotPassword));
