import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import AcColumn from '@src/atoms/ac-column/ac-column';
import { AcContainer, AcSection } from '@src/atoms';
import { LABELS, VISUALS } from '@src/constants';
import { AcFormField, AcButton } from '@src/molecules';
import { BASE_URL } from '../ac-beheer/ac-beheer';

const AcRegister = () => {
  const [kvkNumber, setKvkNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/apps/openconnector/api/endpoint/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'kvk-nummer': kvkNumber,
            organisatienaam: name,
            email,
            id: '1',
          }),
        }
      );
      if (response.ok) {
        setRegisterCallBack('success');
      }
    } catch (error) {
      setRegisterCallBack('error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegisterCallBack(null);
    setName('');
    setEmail('');
    setKvkNumber('');
  };

  const validateEmail = (email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <Heading>{LABELS.REGISTER}</Heading>

              <AcColumn gap='sm'>
                <AcFormField
                  label='Naam *'
                  placeholder='John Doe'
                  value={name}
                  hasError={!name}
                  onChange={setName}
                  disabled={loading}
                />
                <AcFormField
                  label='Email adres *'
                  placeholder='john.doe@example.com'
                  value={email}
                  onChange={setEmail}
                  type='email'
                  hasError={!validateEmail(email)}
                  id='email-field'
                  disabled={loading}
                />

                <AcFormField
                  label='KvK nummer'
                  placeholder='12345678'
                  value={kvkNumber}
                  onChange={setKvkNumber}
                  disabled={loading}
                />

                <AcButton
                  style='button'
                  icon={<VISUALS.ARROW_RIGHT />}
                  onClick={handleRegister}
                  disabled={!name || !email || !validateEmail(email) || loading}
                >
                  {LABELS.REGISTER}
                </AcButton>
              </AcColumn>
            </>
          )}

          {registerCallBack === 'success' && (
            <AcColumn gap='sm'>
              <Heading level={2}>Registratie succesvol!</Heading>
              <p>Beste {name},</p>
              <p>
                Uw registratie voor de SoftwareCatalogus is succesvol ontvangen. We
                hebben een bevestigingsmail gestuurd naar <b>{email}</b>. Controleer
                uw inbox (en eventueel uw spam folder) voor deze bevestiging.
              </p>
              <p>
                Een beheerder zal uw registratie beoordelen. Zodra uw registratie is
                goedgekeurd, ontvangt u een nieuwe e-mail met daarin uw inloggegevens
                en verdere instructies voor het gebruik van de SoftwareCatalogus.
              </p>
              <p>
                Heeft u vragen? Neem dan contact op met onze helpdesk via
                support@softwarecatalogus.nl
              </p>
              <br />
              <AcButton
                style='button'
                icon={<VISUALS.ARROW_LEFT />}
                onClick={() => resetForm()}
              >
                Terug naar registratie
              </AcButton>
            </AcColumn>
          )}
          {registerCallBack === 'error' && (
            <AcColumn gap='sm'>
              <Heading level={2}>Er is iets misgegaan</Heading>
              <p>Beste {name},</p>
              <p>
                Er is helaas een fout opgetreden bij het verwerken van uw registratie
                voor de SoftwareCatalogus. Dit kan verschillende oorzaken hebben:
              </p>
              <ul className='ac-register__error-list'>
                <li>Een tijdelijk probleem met onze servers</li>
                <li>Een probleem met uw internetverbinding</li>
              </ul>
              <p>
                Probeer het later nogmaals of neem contact op met onze helpdesk via
                support@softwarecatalogus.nl als het probleem blijft bestaan.
              </p>
              <br />
              <AcButton
                style='button'
                icon={<VISUALS.ARROW_LEFT />}
                onClick={() => resetForm()}
              >
                Terug naar registratie
              </AcButton>
            </AcColumn>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcRegister));
