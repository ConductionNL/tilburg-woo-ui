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
import { ProcessSteps } from '@gemeente-denhaag/components-react';

const AcRegister = () => {
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState({
    name: '',
    contactInformation: {},
    website: '',
    links: '',
    oin: '',
    status: '',
    logo: '',
    cbs: '',
    phone: '',
    role: '',
    summary: '',
    description: '',
    contactPersons: [
      {
        name: '',
        phone: '',
        email: '',
      },
    ],
    collaborations: [],
    declarations: [],
    organizationType: 'leverancier',
    kvkNumber: '',
    email: '',
  });

  const organizationTypes = [
    { id: 'leverancier', label: 'Leverancier' },
    { id: 'gemeente', label: 'Gemeente' },
    { id: 'samenwerking', label: 'Samenwerking' },
    { id: 'community', label: 'Community' },
  ];

  const setOrganizationData = (key, value) => {
    if (key.includes('contactPersons')) {
      const field = key.split('.')[1];
      setOrganization({
        ...organization,
        contactPersons: [{ ...organization.contactPersons[0], [field]: value }],
      });
    } else {
      setOrganization({ ...organization, [key]: value });
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    console.log(organization);
    console.log(organization.name);
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
                naam: organization.contactPersons[0].name,
                telefoonnummer: organization.contactPersons[0].phone,
                'e-mailadres': organization.contactPersons[0].email,
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
    setOrganization({
      name: '',
      contactInformation: {},
      website: '',
      links: '',
      oin: '',
      status: '',
      logo: '',
      cbs: '',
      phone: '',
      role: '',
      summary: '',
      description: '',
      contactPersons: [
        {
          name: '',
          phone: '',
          email: '',
        },
      ],
      collaborations: [],
      declarations: [],
      organizationType: 'leverancier',
      kvkNumber: '',
      email: '',
    });
  };

  const validateEmail = (email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return <OrganizationForm />;
      case 1:
        return <ContactPersonForm />;
      case 2:
        return <ContactInformationForm />;
      case 3:
        return <ReviewForm />;
    }
  };
  const [currentStep, setCurrentStep] = useState(0);

  const OrganizationForm = () => {
    return (
      <div>
        <h3 className='utrecht-heading-3'>Organisatiegegevens</h3>

        <div>
          <h4 className='utrecht-heading-4'>Organisatie type *</h4>
          <ReactSelect
            placeholder='Selecteer een applicatie type'
            defaultValue={organizationTypes[0]}
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
          placeholder='Voorbeeld: Gemeente Amsterdam'
          value={organization.name}
          onBlur={(e) => setOrganizationData('name', e)}
          hasError={!organization.name}
          disabled={loading}
        />
        <AcFormField
          label='Beschrijving kort'
          placeholder='Een korte beschrijving van de organisatie'
          value={organization.description}
          onBlur={(e) => setOrganizationData('description', e)}
          disabled={loading}
        />

        <AcFormField
          label='KvK nummer'
          placeholder='12345678'
          value={organization.kvkNumber}
          onBlur={(e) => setOrganizationData('kvkNumber', e)}
          disabled={loading}
        />
      </div>
    );
  };

  const ContactPersonForm = () => {
    return (
      <div>
        <h3 className='utrecht-heading-3'>Contact persoon</h3>
        <AcFormField
          label='Naam *'
          placeholder='John'
          value={organization.contactPersons[0].name}
          type='text'
          onBlur={(e) => setOrganizationData('contactPersons.name', e)}
          hasError={!organization.contactPersons[0].name}
          id='name-field'
          disabled={loading}
        />

        <AcFormField
          label='Telefoonnummer *'
          placeholder='06 12345678'
          value={organization.contactPersons[0].phone}
          type='tel'
          onBlur={(e) => setOrganizationData('contactPersons.phone', e)}
          hasError={!organization.contactPersons[0].phone}
          id='phone-field'
          disabled={loading}
        />

        <AcFormField
          label='Email adres *'
          placeholder='john.doe@example.com'
          value={organization.contactPersons[0].email}
          type='email'
          onBlur={(e) => setOrganizationData('contactPersons.email', e)}
          hasError={!validateEmail(organization.contactPersons[0].email)}
          id='email-field'
          disabled={loading}
        />
      </div>
    );
  };

  const ContactInformationForm = () => {
    return (
      <div>
        <h3 className='utrecht-heading-3'>Contact informatie (Optioneel)</h3>
        <AcFormField
          label='Website'
          placeholder='https://www.example.com'
          value={organization.website}
          type='text'
          onBlur={(e) => setOrganizationData('website', e)}
          id='website-field'
          disabled={loading}
        />

        <AcFormField
          label='Telefoonnummer'
          placeholder='06 12345678'
          value={organization.phone}
          type='tel'
          id='phone-field'
          disabled={loading}
        />

        <AcFormField
          label='Email adres'
          placeholder='john.doe@example.com'
          value={organization.email}
          type='email'
          hasError={organization.email && !validateEmail(organization.email)}
          id='email-field'
          disabled={loading}
        />
      </div>
    );
  };

  const ReviewForm = () => {
    return (
      <div>
        <h3 className='utrecht-heading-3'>Review</h3>
        <div className='ac-register-review'>
          <h4 className='utrecht-heading-4'>Organisatiegegevens</h4>
          <p>
            <strong>Naam:</strong> {organization.name}
          </p>
          <p>
            <strong>KvK nummer:</strong> {organization.kvkNumber}
          </p>
          <p>
            <strong>Type organisatie:</strong> {organization.organizationType}
          </p>
          <p>
            <strong>Korte beschrijving:</strong> {organization.summary}
          </p>
          <p>
            <strong>Uitgebreide beschrijving:</strong> {organization.description}
          </p>

          <h4 className='utrecht-heading-4'>Contactpersoon</h4>
          <p>
            <strong>Naam:</strong> {organization.contactPersons[0].name}
          </p>
          <p>
            <strong>Telefoonnummer:</strong> {organization.contactPersons[0].phone}
          </p>
          <p>
            <strong>Email:</strong> {organization.contactPersons[0].email}
          </p>

          <h4 className='utrecht-heading-4'>Contact informatie</h4>
          <p>
            <strong>Website:</strong> {organization.website}
          </p>
          <p>
            <strong>Telefoonnummer:</strong> {organization.phone}
          </p>
          <p>
            <strong>Email:</strong> {organization.email}
          </p>
        </div>
      </div>
    );
  };

  const getStatus = (currentStep, step) => {
    if (currentStep === step) {
      return 'current';
    } else if (currentStep < step) {
      return 'not-checked';
    } else if (currentStep > step) {
      return 'checked';
    }
  };

  const getStatusTwo = (currentStep, step) => {
    if (currentStep === 1 || currentStep === 2) {
      return 'current';
    } else if (currentStep < step) {
      return 'not-checked';
    } else if (currentStep > step) {
      return 'checked';
    }
  };

  const getDisabledStatus = (currentStep) => {
    if (currentStep === 0) {
      return !organization.name || !organization.organizationType;
    }
    if (currentStep === 1) {
      return (
        !organization.contactPersons[0].name ||
        !organization.contactPersons[0].phone ||
        !validateEmail(organization.contactPersons[0].email)
      );
    }
    if (currentStep === 2) {
      return false;
    }
    if (currentStep === 3) {
      return false;
    }
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <Heading1>Registratie</Heading1>
              <AcColumn gap='sm'>
                <div className='ac-register-container'>
                  <div className='ac-register-process-steps'>
                    <ProcessSteps
                      steps={[
                        {
                          id: '7f8e9a2b-1c3d-4f5g-6h7i-8j9k0l1m2n3o',
                          marker: 1,
                          status: getStatus(currentStep, 0),
                          title: 'Organisatiegegevens',
                        },
                        {
                          id: '4p5q6r7s-8t9u-0v1w-2x3y-4z5a6b7c8d9e',
                          marker: 2,
                          status: getStatusTwo(currentStep, 1),
                          title: 'Contactgegevens',
                          steps: [
                            {
                              id: 'v6w7x8y9-0z1a-2b3c-4d5e-6f7g8h9i0j1k',
                              status: getStatus(currentStep, 1),
                              title: 'Contactpersoon',
                            },
                            {
                              id: 'f0g1h2i3-4j5k-6l7m-8n9o-0p1q2r3s4t5u',
                              status: getStatus(currentStep, 2),
                              title: 'ContactInformatie (Optioneel)',
                            },
                          ],
                        },

                        {
                          id: 'l2m3n4o5-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
                          marker: 3,
                          status: getStatus(currentStep, 3),
                          title: 'Review',
                        },
                      ]}
                    />
                  </div>
                  <div className='ac-register-form-container'>
                    {renderStep(currentStep)}

                    <div>
                      {currentStep !== 0 && (
                        <AcButton
                          style='button'
                          icon={<VISUALS.ARROW_LEFT />}
                          onClick={() => setCurrentStep(currentStep - 1)}
                        >
                          Terug
                        </AcButton>
                      )}
                      {currentStep !== 3 && (
                        <AcButton
                          style='button'
                          icon={<VISUALS.ARROW_RIGHT />}
                          disabled={getDisabledStatus(currentStep)}
                          onClick={() => setCurrentStep(currentStep + 1)}
                        >
                          Volgende
                        </AcButton>
                      )}
                      {currentStep === 3 && (
                        <AcButton
                          style='button'
                          icon={<VISUALS.ARROW_RIGHT />}
                          onClick={handleRegister}
                          disabled={loading}
                        >
                          {LABELS.REGISTER}
                        </AcButton>
                      )}
                    </div>
                  </div>
                </div>
              </AcColumn>
            </>
          )}

          {registerCallBack === 'success' && (
            <AcColumn gap='sm'>
              <Heading level={2}>Registratie succesvol!</Heading>
              <p>Beste {organization.name},</p>
              <p>
                Uw registratie voor de SoftwareCatalogus is succesvol ontvangen. We
                hebben een bevestigingsmail gestuurd naar{' '}
                <b>{organization.contactPersons[0].email}</b>. Controleer uw inbox
                (en eventueel uw spam folder) voor deze bevestiging.
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
              <p>Beste {organization.name},</p>
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
