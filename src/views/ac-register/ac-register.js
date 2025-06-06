import { useState, useCallback, memo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import { AcContainer, AcSection } from '@src/atoms';
import { LABELS, VISUALS } from '@src/constants';
import { AcFormField, AcButton } from '@src/molecules';
import { BASE_URL } from '../ac-beheer/ac-beheer';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { AcColumn } from '@src/atoms';
import {
  Heading1,
  Separator,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';
import clsx from 'clsx';

const organizationTypes = [
  { value: 'leverancier', label: 'Leverancier' },
  { value: 'gemeente', label: 'Gemeente' },
  { value: 'samenwerking', label: 'Samenwerking' },
  { value: 'community', label: 'Community' },
];

const OrganizationForm = memo(({ organization, setOrganizationData, loading }) => {
  return (
    <div className='ac-register-form-section'>
      <div className='ac-register-form-grid'>
        <div>
          <h4 className='utrecht-heading-4'>Organisatie type *</h4>
          <ReactSelect
            placeholder='Selecteer een organisatie type'
            defaultValue={organizationTypes[0]}
            className='ac-beheer-select'
            loading={organizationTypes?.length === 0}
            options={organizationTypes}
            onChange={(selected) =>
              setOrganizationData('organizationType', selected.value)
            }
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
          value={organization.summary}
          onBlur={(e) => setOrganizationData('summary', e)}
          disabled={loading}
        />

        {organization.organizationType === 'leverancier' && (
          <AcFormField
            label='KvK nummer'
            placeholder='12345678'
            value={organization.kvkNumber}
            onBlur={(e) => setOrganizationData('kvkNumber', e)}
            disabled={loading}
          />
        )}

        {(organization.organizationType === 'gemeente' ||
          organization.organizationType === 'samenwerking') && (
          <AcFormField
            label='OIN'
            placeholder='00000001002564440000'
            value={organization.oin}
            onBlur={(e) => setOrganizationData('oin', e)}
            disabled={loading}
          />
        )}

        <AcFormField
          label='Logo'
          placeholder='https://www.example.com/logo.png'
          value={organization.logo}
          onBlur={(e) => setOrganizationData('logo', e)}
          disabled={loading}
        />
      </div>
    </div>
  );
});

const ContactPersonForm = memo(
  ({ organization, setOrganizationData, loading, validateEmail }) => {
    return (
      <div className='ac-register-form-section'>
        <div className='ac-register-form-grid'>
          <AcFormField
            label='Voornaam *'
            placeholder='John'
            value={organization.contactPersons[0].firstName}
            type='text'
            onBlur={(e) => setOrganizationData('contactPersons.firstName', e)}
            hasError={!organization.contactPersons[0].firstName}
            id='name-field'
            disabled={loading}
          />
          <AcFormField
            label='Tussenvoegsel'
            placeholder='van'
            value={organization.contactPersons[0].middleName}
            type='text'
            onBlur={(e) => setOrganizationData('contactPersons.middleName', e)}
            id='name-field'
            disabled={loading}
          />
          <AcFormField
            label='Achternaam *'
            placeholder='Doe'
            value={organization.contactPersons[0].lastName}
            type='text'
            onBlur={(e) => setOrganizationData('contactPersons.lastName', e)}
            hasError={!organization.contactPersons[0].lastName}
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

          <AcFormField
            label='Functie'
            placeholder='Sales Manager'
            value={organization.contactPersons[0].function}
            type='text'
            onBlur={(e) => setOrganizationData('contactPersons.function', e)}
            id='name-field'
            disabled={loading}
          />
        </div>
      </div>
    );
  }
);

const ContactInformationForm = memo(
  ({ organization, setOrganizationData, loading, validateEmail }) => {
    return (
      <div className='ac-register-form-section'>
        <div className='ac-register-form-grid'>
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
            onBlur={(e) => setOrganizationData('phone', e)}
            id='phone-field'
            disabled={loading}
          />

          <AcFormField
            label='Email adres'
            placeholder='john.doe@example.com'
            value={organization.email}
            type='email'
            onBlur={(e) => setOrganizationData('email', e)}
            hasError={organization.email && !validateEmail(organization.email)}
            id='email-field'
            disabled={loading}
          />
        </div>
      </div>
    );
  }
);

const LogoPreview = memo(({ logoUrl, className }) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when URL changes
    setIsValid(false);
    setIsLoading(true);

    if (!logoUrl) {
      setIsLoading(false);
      return;
    }

    // Check if URL is potentially safe
    try {
      // Handle data URLs
      if (logoUrl.startsWith('data:')) {
        const isImageData = logoUrl.startsWith('data:image/');
        if (!isImageData) {
          setIsLoading(false);
          return;
        }
      } else {
        // For regular URLs, check protocol
        const url = new URL(logoUrl);
        if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
          setIsLoading(false);
          return;
        }
      }

      // Verify it's actually an image by loading it
      const img = new Image();
      img.onload = () => {
        setIsValid(true);
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsValid(false);
        setIsLoading(false);
      };
      img.src = logoUrl;
    } catch (e) {
      setIsLoading(false);
    }
  }, [logoUrl]);

  return (
    <div className={className}>
      {logoUrl && (
        <>
          {isLoading && <span>(Validating...)</span>}
          {!isLoading && isValid && <img src={logoUrl} alt='Organization logo' />}
          {!isLoading && !isValid && <span>(Invalid image URL)</span>}
        </>
      )}
    </div>
  );
});

const ReviewForm = memo(({ organization }) => {
  return (
    <div className='ac-register-form-section'>
      <div className='ac-register-review'>
        <div className='ac-register-review__section'>
          <div className='ac-register-review__header'>
            <h4 className='utrecht-heading-4'>Organisatiegegevens</h4>
            {organization.logo && (
              <LogoPreview
                logoUrl={organization.logo}
                className='ac-register-review__logo'
              />
            )}
          </div>
          <Separator className='ac-register-review__separator' />
          <div className='ac-register-review__field'>
            <strong>Naam:</strong>
            <span>{organization.name || '-'}</span>
          </div>
          {organization.organizationType === 'leverancier' && (
            <div className='ac-register-review__field'>
              <strong>KvK nummer:</strong>
              <span>{organization.kvkNumber || '-'}</span>
            </div>
          )}
          {(organization.organizationType === 'gemeente' ||
            organization.organizationType === 'samenwerking') && (
            <div className='ac-register-review__field'>
              <strong>OIN:</strong>
              <span>{organization.oin || '-'}</span>
            </div>
          )}
          <div className='ac-register-review__field'>
            <strong>Type organisatie:</strong>
            <span>{organization.organizationType || '-'}</span>
          </div>

          <div className='ac-register-review__field'>
            <strong>Korte beschrijving:</strong>
            <span>{organization.summary || '-'}</span>
          </div>
        </div>

        <div className='ac-register-review__section'>
          <h4 className='utrecht-heading-4'>Contactpersoon</h4>
          <Separator className='ac-register-review__separator' />
          <div className='ac-register-review__field'>
            <strong>Naam:</strong>
            {organization.contactPersons[0].firstName || '-'}{' '}
            {organization.contactPersons[0].middleName || ' '}
            {organization.contactPersons[0].lastName || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Telefoonnummer:</strong>
            {organization.contactPersons[0].phone || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Email:</strong> {organization.contactPersons[0].email || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Functie:</strong>
            {organization.contactPersons[0].function || '-'}
          </div>
        </div>

        <div className='ac-register-review__section'>
          <h4 className='utrecht-heading-4'>Contact informatie</h4>
          <Separator className='ac-register-review__separator' />
          <div className='ac-register-review__field'>
            <strong>Website:</strong> {organization.website || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Telefoonnummer:</strong> {organization.phone || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Email:</strong> {organization.email || '-'}
          </div>
        </div>
      </div>
    </div>
  );
});

const escapeSvgDataUrl = (url) => {
  if (!url) return '';

  // Check if it's an SVG data URL
  if (url.startsWith('data:image/svg+xml')) {
    return url
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/>/g, '%3E') // Encode >
      .replace(/</g, '%3C') // Encode <
      .replace(/\//g, '%2F'); // Encode /
  }

  // If it's not an SVG, return the original URL
  return url;
};

const AcRegister = () => {
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState({
    name: '',
    contactInformation: {},
    website: '',
    links: '',
    oin: '',
    logo: '',
    cbs: '',
    phone: '',
    role: '',
    summary: '',
    contactPersons: [
      {
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        email: '',
        function: '',
      },
    ],
    organizationType: 'leverancier',
    kvkNumber: '',
    email: '',
  });

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const setOrganizationData = useCallback((key, value) => {
    if (key.includes('contactPersons')) {
      const field = key.split('.')[1];
      setOrganization((prev) => ({
        ...prev,
        contactPersons: [{ ...prev.contactPersons[0], [field]: value }],
      }));
    } else {
      setOrganization((prev) => ({ ...prev, [key]: value }));
    }
  }, []);

  const escapeSvgDataUrl = (url) => {
    if (!url) return '';

    // Check if it's an SVG data URL
    if (url.startsWith('data:image/svg+xml')) {
      try {
        // Extract the SVG content
        const svgContent = url.split(',')[1];

        // Create a properly formatted data URL
        return `data:image/svg+xml;base64,${btoa(decodeURIComponent(svgContent))}`;
      } catch (error) {
        console.error('Error processing SVG:', error);
        return url;
      }
    }

    // If it's not an SVG, return the original URL
    return url;
  };

  const [error, setError] = useState({ message: null, errors: null });

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Create a copy of the organization data
      const organizationData = {
        naam: organization.name,
        website: organization.website,
        links: organization.links,
        oin: organization.oin,
        cbs: organization.cbs,
        telefoonnummer: organization.phone,
        rol: organization.role,
        beschrijvingKort: organization.summary,
        contactpersonen: [
          {
            voornaam: organization.contactPersons[0].firstName,
            tussenvoegsel: organization.contactPersons[0].middleName,
            achternaam: organization.contactPersons[0].lastName,
            telefoon: organization.contactPersons[0].phone,
            email: organization.contactPersons[0].email,
            functie: organization.contactPersons[0].function,
          },
        ],
        type: organization.organizationType,
        kvkNummer: organization.kvkNumber,
        'e-mailadres': organization.email,
      };

      // Handle the logo separately
      if (organization.logo) {
        organizationData.logo = escapeSvgDataUrl(organization.logo);
        // organizationData.logo = organization.logo;
      }

      const response = await fetch(
        `${BASE_URL}/apps/openconnector/api/endpoint/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(organizationData),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'error') {
          setRegisterCallBack('error');
          console.log({ data });
          setError({ message: data.message, errors: data.errors });
        } else {
          setRegisterCallBack('success');
        }
      } else {
        setRegisterCallBack('error');
        throw new Error('Registration failed');
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
      logo: '',
      cbs: '',
      phone: '',
      role: '',
      summary: '',
      contactPersons: [
        {
          firstName: '',
          middleName: '',
          lastName: '',
          phone: '',
          email: '',
          function: '',
        },
      ],
      organizationType: 'leverancier',
      kvkNumber: '',
      email: '',
    });
    setCurrentStep(0);
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <OrganizationForm
            organization={organization}
            setOrganizationData={setOrganizationData}
            loading={loading}
          />
        );
      case 1:
        return (
          <ContactPersonForm
            organization={organization}
            setOrganizationData={setOrganizationData}
            loading={loading}
            validateEmail={validateEmail}
          />
        );
      case 2:
        return (
          <ContactInformationForm
            organization={organization}
            setOrganizationData={setOrganizationData}
            loading={loading}
            validateEmail={validateEmail}
          />
        );
      case 3:
        return <ReviewForm organization={organization} />;
    }
  };
  const [currentStep, setCurrentStep] = useState(0);

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

  const currentStepName = (currentStep) => {
    switch (currentStep) {
      case 0:
        return 'Organisatiegegevens';
      case 1:
        return 'Contactpersoon';
      case 2:
        return 'Contactinformatie (Optioneel)';
      case 3:
        return 'Review';
    }
  };

  const getDisabledStatus = (currentStep) => {
    if (currentStep === 0) {
      return !organization.name || !organization.organizationType;
    }
    if (currentStep === 1) {
      return (
        !organization.contactPersons[0].firstName ||
        !organization.contactPersons[0].lastName ||
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
              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName(currentStep)}
                </h3>
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

                      <div
                        className={clsx(
                          'ac-register-form-buttons',
                          currentStep !== 0 &&
                            'ac-register-form-buttons-not-first-step'
                        )}
                      >
                        {currentStep !== 0 && (
                          <AcButton
                            style='button'
                            icon={<VISUALS.ARROW_LEFT />}
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={loading}
                          >
                            Terug
                          </AcButton>
                        )}
                        {currentStep !== 3 && (
                          <AcButton
                            style='button'
                            className={clsx(
                              currentStep === 0 && 'ac-register-form-next-button'
                            )}
                            icon={<VISUALS.ARROW_RIGHT />}
                            disabled={getDisabledStatus(currentStep) || loading}
                            onClick={() => setCurrentStep(currentStep + 1)}
                          >
                            Volgende
                          </AcButton>
                        )}
                        {currentStep === 3 && (
                          <AcButton
                            style='button'
                            icon={
                              loading ? (
                                <VISUALS.SPINNER className='ac-register-button--loading' />
                              ) : (
                                <VISUALS.CLIPBOARD_CHECK />
                              )
                            }
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
              </div>
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
                voor de SoftwareCatalogus.{' '}
                {error.message ? '' : 'Dit kan verschillende oorzaken hebben:'}
              </p>
              {!error.errors && !error.message && (
                <UnorderedList>
                  <UnorderedListItem>
                    Een tijdelijk probleem met onze servers
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Een probleem met uw internetverbinding
                  </UnorderedListItem>
                </UnorderedList>
              )}
              {(error.errors || error.message) && (
                <>
                  {error.message && <b>{error.message}</b>}
                  {error.errors && (
                    <UnorderedList>
                      {error.errors.map((error) => (
                        <UnorderedListItem key={error.message || error}>
                          {error.message || error}
                        </UnorderedListItem>
                      ))}
                    </UnorderedList>
                  )}
                </>
              )}
              <p>
                Probeer het later nogmaals of neem contact op met onze helpdesk via
                support@softwarecatalogus.nl als het probleem blijft bestaan.
              </p>
              <br />
              <AcButton
                style='button'
                icon={<VISUALS.ARROW_LEFT />}
                onClick={() => {
                  setRegisterCallBack(null);
                  setCurrentStep(3);
                }}
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
