import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import AcColumn from '@src/atoms/ac-column/ac-column';
import { AcContainer, AcSection } from '@src/atoms';
import { LABELS, VISUALS } from '@src/constants';
import { AcFormField, AcButton } from '@src/molecules';
import { BASE_URL } from '../ac-beheer/ac-beheer';
import ReactSelect from 'react-select';
import { Heading1 } from '@utrecht/component-library-react/dist/css-module';

const AcRegister = () => {
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);

  const organizationTypes = [
    { id: 'leverancier', label: 'Leverancier' },
    { id: 'gemeente', label: 'Gemeente' },
    { id: 'samenwerking', label: 'Samenwerking' },
    { id: 'community', label: 'Community' },
  ];

  const organization = {
    contactPersons: [
      {
        name: '',
        phone: '',
        email: '',
      },
    ],
    name: '',
    kvkNumber: '',
    organizationType: 'leverancier',
    summary: '',
    description: '',
  };

  const setOrganizationData = (key, value) => {
    setOrganizationData({ ...organization, [key]: value });
  };

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
            kvkNummer: organization.kvkNumber,
            naam: organization.name,
            type: organization.organizationType,
            beschrijvingKort: organization.summary,
            beschrijvingLang: organization.description,
            contactpersonen: [
              {
                naam: organization.contactPerson.name,
                telefoonnummer: organization.contactPerson.phone,
                'e-mailadres': organization.contactPerson.email,
              },
            ],
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
              <Heading1>Registratie</Heading1>
              <AcColumn gap='sm'>
                <div>
                  <h4 className='utrecht-heading-4'>Organisatie type *</h4>
                  <ReactSelect
                    placeholder='Selecteer een applicatie type'
                    value={organizationTypes?.find(
                      (option) => option.id === organization.organizationType
                    )}
                    className='ac-beheer-select'
                    loading={organizationTypes?.length === 0}
                    options={organizationTypes?.map((organizationType) => ({
                      value: organizationType.id,
                      label: organizationType.label,
                    }))}
                  />
                </div>
                <AcFormField
                  label='Naam *'
                  placeholder='John Doe'
                  value={organization.name}
                  hasError={!organization.name}
                  disabled={loading}
                />
                <AcFormField
                  label='Beschrijving kort'
                  placeholder='John Doe'
                  value={organization.description}
                  disabled={loading}
                />

                <div>
                  <h3 className='utrecht-heading-3'>Contactpersoon</h3>
                  <AcFormField
                    label='Naam *'
                    placeholder='John'
                    value={organization.contactPersons[0].name}
                    type='text'
                    hasError={!organization.contactPersons[0].name}
                    id='name-field'
                    disabled={loading}
                  />

                  <AcFormField
                    label='Telefoonnummer *'
                    placeholder='06 12345678'
                    value={organization.contactPersons[0].phone}
                    type='tel'
                    hasError={!organization.contactPersons[0].phone}
                    id='phone-field'
                    disabled={loading}
                  />

                  <AcFormField
                    label='Email adres *'
                    placeholder='john.doe@example.com'
                    value={organization.contactPersons[0].email}
                    type='email'
                    hasError={!validateEmail(organization.contactPersons[0].email)}
                    id='email-field'
                    disabled={loading}
                  />
                </div>

                <AcFormField
                  label='KvK nummer'
                  placeholder='12345678'
                  value={organization.kvkNumber}
                  disabled={loading}
                />

                <AcButton
                  style='button'
                  icon={<VISUALS.ARROW_RIGHT />}
                  onClick={handleRegister}
                  disabled={
                    !organization.name ||
                    !organization.contactPersons[0].email ||
                    !validateEmail(organization.contactPersons[0].email) ||
                    loading
                  }
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
