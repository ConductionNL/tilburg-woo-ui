import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import { AcContainer, AcSection, AcFlex } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcFormField, AcButton, AcCheckbox, AcLink } from '@src/molecules';
import { BASE_URL } from '../ac-beheer/ac-beheer';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { AcColumn } from '@src/atoms';
import {
  Heading1,
  Separator,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { validateAndProcessLogoUrl } from './con-logo-preview';
import ReactSelect from 'react-select';
import clsx from 'clsx';
import ConLogoPreview from './con-logo-preview';
import ReactMarkdown from 'react-markdown';

const organizationTypes = [
  { value: 'leverancier', label: 'Leverancier' },
  { value: 'gemeente', label: 'Gemeente' },
  { value: 'samenwerking', label: 'Samenwerking' },
  { value: 'community', label: 'Community' },
];

const AcRegister = () => {
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [showAlert, setShowAlert] = useState(true);
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
  const [touched, setTouched] = useState({
    name: false,
    contactPersons: {
      firstName: false,
      lastName: false,
      phone: false,
      email: false,
    },
  });
  const [logoValidation, setLogoValidation] = useState({
    isValidating: false,
    isValid: true,
  });
  const [confirmationCheckbox, setConfirmationCheckbox] = useState({
    privacy: false,
    terms: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orgType = params.get('organisatieType');

    if (orgType) {
      const matchingType = organizationTypes.find(
        (type) => type.value.toLowerCase() === orgType.toLowerCase()
      );
      if (matchingType) {
        setOrganization((prev) => ({
          ...prev,
          organizationType: matchingType.value,
        }));
      }
    }
  }, []);

  const handleLogoValidation = useCallback(async (url) => {
    if (!url) {
      setLogoValidation({ isValidating: false, isValid: true });
      return;
    }

    setLogoValidation({ isValidating: true, isValid: true });
    const isValid = await validateAndProcessLogoUrl(url);
    setLogoValidation({ isValidating: false, isValid });
  }, []);

  const setOrganizationData = useCallback(
    (key, value) => {
      if (key === 'logo') {
        handleLogoValidation(value);
      }
      if (key.includes('contactPersons')) {
        const field = key.split('.')[1];
        setOrganization((prev) => ({
          ...prev,
          contactPersons: [{ ...prev.contactPersons[0], [field]: value }],
        }));
        setTouched((prev) => ({
          ...prev,
          contactPersons: {
            ...prev.contactPersons,
            [field]: true,
          },
        }));
      } else {
        setOrganization((prev) => ({ ...prev, [key]: value }));
        setTouched((prev) => ({
          ...prev,
          [key]: true,
        }));
      }
    },
    [handleLogoValidation]
  );

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const validateWebsite = useCallback((website) => {
    return website && website.match(/^https?:\/\/[^\s]+$/);
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone) return false;
    return isValidPhoneNumber(phone, 'NL');
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
          setError({ message: data.message, errors: data.errors });
        } else {
          setRegisterCallBack('success');
        }
      } else {
        const data = await response.json();
        setRegisterCallBack('error');
        setError({ message: data.message, errors: data.errors });
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
    setTouched({
      name: false,
      contactPersons: {
        firstName: false,
        lastName: false,
        phone: false,
        email: false,
      },
    });
    setCurrentStep(0);
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <OrganizationRequiredForm
            {...{
              organization,
              setOrganizationData,
              loading,
              touched,
              validateWebsite,
            }}
          />
        );
      case 1:
        return (
          <OrganizationOptionalForm
            {...{
              organization,
              setOrganizationData,
              loading,
              validateEmail,
              validatePhone,
              touched,
              logoValidation,
            }}
          />
        );
      case 2:
        return (
          <ContactInformationForm
            {...{
              organization,
              setOrganizationData,
              loading,
              validateEmail,
              validatePhone,
              touched,
              setTouched,
              showAlert,
              setShowAlert,
            }}
          />
        );
      case 3:
        return (
          <ReviewForm
            {...{ organization, confirmationCheckbox, setConfirmationCheckbox }}
          />
        );
    }
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

  const getStatusMultiStep = (currentStep, step) => {
    if (currentStep === 0 || currentStep === 1) {
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
        return 'Verplichte gegevens';
      case 1:
        return 'Optionele gegevens';
      case 2:
        return 'Contactgegevens';
      case 3:
        return 'Controleren';
    }
  };

  const getDisabledStatus = (currentStep) => {
    if (currentStep === 0) {
      return (
        !organization.name ||
        !organization.organizationType ||
        !organization.website ||
        (organization.website && !validateWebsite(organization.website))
      );
    }
    if (currentStep === 1) {
      return (
        (organization.logo && !logoValidation.isValid) ||
        (organization.email && !validateEmail(organization.email)) ||
        (organization.phone && !validatePhone(organization.phone))
      );
    }
    if (currentStep === 2) {
      return (
        !organization.contactPersons[0].firstName ||
        !organization.contactPersons[0].lastName ||
        !validatePhone(organization.contactPersons[0].phone) ||
        !validateEmail(organization.contactPersons[0].email)
      );
    }
    if (currentStep === 3) {
      return false;
    }
  };

  // Add this function to generate the tooltip message
  const getDisabledTooltip = (
    currentStep,
    organization,
    validateEmail,
    validatePhone
  ) => {
    if (currentStep === 0) {
      const missing = [];
      if (!organization.name) missing.push('Naam');
      if (!organization.organizationType) missing.push('Organisatie type');
      if (!organization.website) missing.push('Website');
      const messages = [];
      if (missing.length > 0) {
        messages.push(`Verplichte velden nog niet ingevuld: ${missing.join(', ')}`);
      }
      if (organization.website && !validateWebsite(organization.website)) {
        messages.push('Ongeldig websiteadres');
      }
      return messages.join('\n');
    }

    if (currentStep === 1) {
      const messages = [];
      if (organization.logo && !logoValidation.isValid) {
        messages.push('Ongeldig logo URL. Gebruik een geldige afbeelding URL');
      }
      if (organization.email && !validateEmail(organization.email)) {
        messages.push('Ongeldig e-mailadres');
      }
      if (organization.phone && !validatePhone(organization.phone)) {
        messages.push('Ongeldig telefoonnummer');
      }
      return messages.join('\n');
    }
    if (currentStep === 2) {
      const missing = [];
      if (!organization.contactPersons[0].firstName) missing.push('Voornaam');
      if (!organization.contactPersons[0].lastName) missing.push('Achternaam');
      if (!organization.contactPersons[0].phone) {
        missing.push('Telefoonnummer');
      } else if (!validatePhone(organization.contactPersons[0].phone)) {
        return 'Ongeldig telefoonnummer';
      }
      if (!organization.contactPersons[0].email) {
        missing.push('E-mailadres');
      } else if (!validateEmail(organization.contactPersons[0].email)) {
        return 'Ongeldig e-mailadres';
      }

      const messages = [];
      if (missing.length > 0) {
        messages.push(`Verplichte velden nog niet ingevuld: ${missing.join(', ')}`);
      }
      if (
        organization.contactPersons[0].phone &&
        !validatePhone(organization.contactPersons[0].phone)
      ) {
        messages.push('Ongeldig telefoonnummer');
      }
      if (
        organization.contactPersons[0].email &&
        !validateEmail(organization.contactPersons[0].email)
      ) {
        messages.push('Ongeldig e-mailadres');
      }
      return messages.join('\n');
    }

    return '';
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {!registerCallBack && (
            <>
              <Heading1>Aanmelden</Heading1>
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
                            id: '4p5q6r7s-8t9u-0v1w-2x3y-4z5a6b7c8d9e',
                            marker: 1,
                            status: getStatusMultiStep(currentStep, 0),
                            title: 'Organisatiegegevens',
                            steps: [
                              {
                                id: 'v6w7x8y9-0z1a-2b3c-4d5e-6f7g8h9i0j1k',
                                status: getStatus(currentStep, 0),
                                title: 'Verplichte gegevens',
                              },
                              {
                                id: 'f0g1h2i3-4j5k-6l7m-8n9o-0p1q2r3s4t5u',
                                status: getStatus(currentStep, 1),
                                title: 'Optionele gegevens',
                              },
                            ],
                          },
                          {
                            id: '7f8e9a2b-1c3d-4f5g-6h7i-8j9k0l1m2n3o',
                            marker: 2,
                            status: getStatus(currentStep, 2),
                            title: 'Contactgegevens',
                          },

                          {
                            id: 'l2m3n4o5-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
                            marker: 3,
                            status: getStatus(currentStep, 3),
                            title: 'Controleren',
                          },
                        ]}
                      />
                    </div>
                    <div className='ac-register-form-container'>
                      <div
                        className='sr-only'
                        role='status'
                        aria-live='polite'
                        id='form-status'
                      >
                        {currentStepName(currentStep)}
                      </div>
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
                        {currentStep !== 3 &&
                          organization.organizationType !== 'gemeente' && (
                            <div className='ac-register-button-wrapper'>
                              <AcButton
                                style='button'
                                className={clsx(
                                  currentStep === 0 && 'ac-register-form-next-button'
                                )}
                                icon={<VISUALS.ARROW_RIGHT />}
                                disabled={getDisabledStatus(currentStep) || loading}
                                onClick={() => setCurrentStep(currentStep + 1)}
                                title={
                                  getDisabledStatus(currentStep)
                                    ? getDisabledTooltip(
                                        currentStep,
                                        organization,
                                        validateEmail,
                                        validatePhone
                                      )
                                    : ''
                                }
                              >
                                Volgende
                              </AcButton>
                            </div>
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
                            disabled={
                              loading ||
                              !confirmationCheckbox.terms ||
                              !confirmationCheckbox.privacy
                            }
                          >
                            Aanmelden
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
              <Heading level={2}>Aanmelding succesvol!</Heading>
              <p>Beste {organization.name},</p>
              <p>
                Uw aanmelding voor de SoftwareCatalogus is succesvol ontvangen. We
                hebben een bevestigingsmail gestuurd naar{' '}
                <b>{organization.contactPersons[0].email}</b>. Controleer uw inbox
                (en eventueel uw spam folder) voor deze bevestiging.
              </p>
              <p>
                Een beheerder zal uw aanmelding beoordelen. Zodra uw aanmelding is
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
                Terug naar aanmelden
              </AcButton>
            </AcColumn>
          )}
          {registerCallBack === 'error' && (
            <AcColumn gap='sm'>
              <Heading level={2}>Er is iets misgegaan</Heading>
              <p>
                Beste {organization.contactPersons[0].firstName}{' '}
                {organization.contactPersons[0].middleName}{' '}
                {organization.contactPersons[0].lastName} van {organization.name},
              </p>
              <p>
                Er ging iets mis bij het verwerken van je registratie voor de
                Softwarecatalogus. .{' '}
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
                        <UnorderedListItem
                          key={error.message || JSON.stringify(error)}
                        >
                          {error.message || JSON.stringify(error)}
                        </UnorderedListItem>
                      ))}
                    </UnorderedList>
                  )}
                </>
              )}
              <p>
                Probeer het later nog eens. Blijft het probleem zich voordoen? Neem
                dan gerust contact op via softwarecatalogus@vng.nl en voeg er de
                foutmelding toe. We helpen je graag verder.
              </p>
              <p>Met vriendelijke groet, Het team van de Softwarecatalogus</p>
              <br />
              <AcButton
                style='button'
                icon={<VISUALS.ARROW_LEFT />}
                onClick={() => {
                  setRegisterCallBack(null);
                  setCurrentStep(3);
                }}
              >
                Terug naar aanmelden
              </AcButton>
            </AcColumn>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

const OrganizationRequiredForm = memo(
  ({ organization, setOrganizationData, loading, touched, validateWebsite }) => {
    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='organization-section-title'
      >
        <h2 id='organization-section-title' className='sr-only'>
          Verplichte gegevens
        </h2>
        <div className='ac-register-form-grid'>
          <div>
            <h4 className='utrecht-heading-4' id='org-type-label'>
              Organisatietype
              <span className='required-indicator' aria-hidden='true'>
                *
              </span>
              <span className='sr-only'>(verplicht)</span>
            </h4>
            <ReactSelect
              placeholder='Selecteer een organisatietype'
              defaultValue={organizationTypes[0]}
              className='ac-beheer-select'
              loading={organizationTypes?.length === 0}
              options={organizationTypes}
              onChange={(selected) =>
                setOrganizationData('organizationType', selected.value)
              }
              aria-labelledby='org-type-label'
              aria-required='true'
            />
          </div>
          {organization.organizationType !== 'gemeente' && (
            <>
              <div>
                <AcFormField
                  label='Naam'
                  required={true}
                  placeholder='Voorbeeld: Gemeente Amsterdam'
                  value={organization.name}
                  onBlur={(e) => setOrganizationData('name', e)}
                  hasError={touched.name && !organization.name}
                  disabled={loading}
                  id='org-name'
                  aria-describedby={
                    touched.name && !organization.name ? 'name-error' : undefined
                  }
                />
                {touched.name && !organization.name && (
                  <span
                    className='ac-register-form-field-error'
                    id='name-error'
                    role='alert'
                  >
                    Dit veld is verplicht
                  </span>
                )}
              </div>
              <div>
                <AcFormField
                  label='Website'
                  placeholder='https://www.example.com'
                  value={organization.website}
                  required={true}
                  hasError={
                    (touched.website && !organization.website) ||
                    (organization.website && !validateWebsite(organization.website))
                  }
                  type='text'
                  onBlur={(e) => setOrganizationData('website', e)}
                  id='website-field'
                  aria-describedby={
                    touched.website && !organization.website
                      ? 'website-error'
                      : undefined
                  }
                  disabled={loading}
                />
                {touched.website &&
                  (!organization.website ||
                    !validateWebsite(organization.website)) && (
                    <span className='ac-register-form-field-error'>
                      {touched.website && !organization.website
                        ? 'Dit veld is verplicht'
                        : organization.website &&
                          !validateWebsite(organization.website) &&
                          'Ongeldig websiteadres'}
                    </span>
                  )}
              </div>
            </>
          )}
        </div>
        {organization.organizationType === 'gemeente' && (
          <div className='ac-register-form-alert'>
            <Alert type='info'>
              <AcFlex spacing='sm'>
                <VISUALS.INFO_BLUE />
                <AcFlex column spacing='xs'>
                  <Heading level={3}>Gemeenten zijn al geregistreerd</Heading>
                  <Paragraph>
                    Alle Nederlandse gemeenten zijn reeds opgenomen in de
                    SoftwareCatalogus. Voor meer informatie of vragen kunt u contact
                    opnemen met{' '}
                    <a href='mailto:softwarecatalogus@vng.nl'>
                      softwarecatalogus@vng.nl
                    </a>
                    .
                  </Paragraph>
                </AcFlex>
              </AcFlex>
            </Alert>
          </div>
        )}
      </div>
    );
  }
);

const OrganizationOptionalForm = memo(
  ({
    organization,
    setOrganizationData,
    loading,
    validateEmail,
    validatePhone,
    logoValidation,
  }) => {
    const [preview, setPreview] = useState(false);
    const [dimensions, setDimensions] = useState({ width: '100%', height: '150px' });
    const lastKnownDimensions = useRef(dimensions);
    const counterRef = useRef(null);
    let localSummary = organization.summary || '';

    const handlePreviewClick = () => {
      if (!preview) {
        // Switching to preview - save current dimensions
        const textarea = document.querySelector('.utrecht-textarea');
        if (textarea) {
          const newDimensions = {
            width: `${textarea.offsetWidth}px`,
            height: `${textarea.offsetHeight}px`,
          };
          setDimensions(newDimensions);
          lastKnownDimensions.current = newDimensions;
        }
      } else {
        // Switching back to edit - use last known dimensions
        setDimensions(lastKnownDimensions.current);
      }
      setPreview(!preview);
    };

    const updateCounter = (value) => {
      if (counterRef.current) {
        counterRef.current.textContent = `${
          255 - (value?.length || 0)
        } karakters over`;
      }
    };

    return (
      <div className='ac-register-form-section'>
        <div className='ac-register-form-grid'>
          <div>
            {preview ? (
              <>
                <AcFormField
                  customInput={
                    <div
                      className='markdown-preview'
                      style={{
                        height: dimensions.height,
                        width: dimensions.width,
                      }}
                    >
                      <ReactMarkdown>{organization.summary || ''}</ReactMarkdown>
                    </div>
                  }
                  label='Korte beschrijving'
                  customLabelPart={
                    <button
                      onClick={handlePreviewClick}
                      className={`preview-button ${preview ? 'active' : ''}`}
                    >
                      {preview ? 'Edit' : 'Preview'}
                    </button>
                  }
                  tooltip='Een korte beschrijving van de organisatie'
                />
                <span ref={counterRef} className='character-count'>
                  {255 - (localSummary?.length || 0)} karakters over
                </span>
              </>
            ) : (
              <>
                <AcFormField
                  fullWidth={true}
                  inputType='textarea'
                  label='Korte beschrijving'
                  customLabelPart={
                    <button
                      onClick={handlePreviewClick}
                      className={`preview-button ${preview ? 'active' : ''}`}
                    >
                      {preview ? 'Edit' : 'Preview'}
                    </button>
                  }
                  placeholder='Een korte beschrijving van de organisatie'
                  tooltip='Een korte beschrijving van de organisatie'
                  value={organization.summary}
                  onChange={(e) => {
                    localSummary = e;
                    updateCounter(e);
                  }}
                  onBlur={(e) => setOrganizationData('summary', e)}
                  disabled={loading}
                  maxLength={255}
                  className='textarea-with-dimensions'
                  style={{
                    '--textarea-height': dimensions.height,
                    '--textarea-width': dimensions.width,
                  }}
                />
                <span ref={counterRef} className='character-count'>
                  {255 - (localSummary?.length || 0)} karakters over
                </span>
              </>
            )}
          </div>

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

          <div>
            <AcFormField
              label='Logo'
              placeholder='https://www.example.com/logo.png'
              value={organization.logo}
              onBlur={(e) => setOrganizationData('logo', e)}
              hasError={organization.logo && !logoValidation.isValid}
              disabled={loading}
              id='org-logo'
              aria-describedby={
                logoValidation.isValidating
                  ? 'logo-validating'
                  : organization.logo && !logoValidation.isValid
                  ? 'logo-error'
                  : undefined
              }
            />
            {logoValidation.isValidating && (
              <span className='ac-register-form-field-info' id='logo-validating'>
                Logo URL wordt gevalideerd...
              </span>
            )}
            {!logoValidation.isValidating &&
              organization.logo &&
              !logoValidation.isValid && (
                <span
                  className='ac-register-form-field-error'
                  id='logo-error'
                  role='alert'
                >
                  Ongeldig logo URL. Gebruik een geldige afbeelding URL
                </span>
              )}
          </div>

          <div>
            <AcFormField
              label='Telefoonnummer'
              placeholder='06 12345678'
              value={organization.phone}
              type='tel'
              onBlur={(e) => setOrganizationData('phone', e)}
              hasError={organization.phone && !validatePhone(organization.phone)}
              id='phone-field'
              disabled={loading}
            />
            <span className='ac-register-form-field-error'>
              {organization.phone &&
                !validatePhone(organization.phone) &&
                'Ongeldig telefoonnummer. Gebruik een Nederlands nummer (bijv. 06 1234 5678 of +31 6 1234 5678)'}
            </span>
          </div>

          <div>
            <AcFormField
              label='E-mailadres'
              placeholder='john.doe@example.com'
              value={organization.email}
              type='email'
              onBlur={(e) => setOrganizationData('email', e)}
              hasError={organization.email && !validateEmail(organization.email)}
              id='email-field'
              disabled={loading}
            />
            <span className='ac-register-form-field-error'>
              {organization.email &&
                !validateEmail(organization.email) &&
                'Ongeldig e-mailadres'}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

const ContactInformationForm = memo(
  ({
    organization,
    setOrganizationData,
    loading,
    validateEmail,
    validatePhone,
    touched,
    showAlert,
    setShowAlert,
  }) => {
    return (
      <div className='ac-register-form-section'>
        <div style={{ position: 'relative' }}>
          {showAlert && (
            <div className='ac-register-form-alert'>
              <Alert type='info'>
                <button
                  className='ac-register-form-alert-close-btn'
                  onClick={() => setShowAlert(false)}
                  aria-label='Sluiten'
                  type='button'
                >
                  &times;
                </button>
                <AcFlex spacing='sm'>
                  <VISUALS.INFO_BLUE />
                  <AcFlex column spacing='xs'>
                    <Heading level={3}>Contactpersoon</Heading>
                    <Paragraph>
                      Het Contactpersoon dat U invult, zal gebruikt worden voor
                      communicatie met de organisatie.
                    </Paragraph>
                  </AcFlex>
                </AcFlex>
              </Alert>
            </div>
          )}
        </div>

        <div className='ac-register-form-grid'>
          <div>
            <AcFormField
              label='Voornaam'
              required={true}
              placeholder='John'
              value={organization.contactPersons[0].firstName}
              type='text'
              onBlur={(e) => setOrganizationData('contactPersons.firstName', e)}
              hasError={
                touched.contactPersons.firstName &&
                !organization.contactPersons[0].firstName
              }
              id='name-field'
              disabled={loading}
            />
            <span className='ac-register-form-field-error'>
              {touched.contactPersons.firstName &&
                !organization.contactPersons[0].firstName &&
                'Dit veld is verplicht'}
            </span>
          </div>
          <AcFormField
            label='Tussenvoegsel'
            placeholder='van'
            value={organization.contactPersons[0].middleName}
            type='text'
            onBlur={(e) => setOrganizationData('contactPersons.middleName', e)}
            id='name-field'
            disabled={loading}
          />
          <div>
            <AcFormField
              label='Achternaam'
              required={true}
              placeholder='Doe'
              value={organization.contactPersons[0].lastName}
              type='text'
              onBlur={(e) => setOrganizationData('contactPersons.lastName', e)}
              hasError={
                touched.contactPersons.lastName &&
                !organization.contactPersons[0].lastName
              }
              id='name-field'
              disabled={loading}
            />
            <span className='ac-register-form-field-error'>
              {touched.contactPersons.lastName &&
                !organization.contactPersons[0].lastName &&
                'Dit veld is verplicht'}
            </span>
          </div>
          <div>
            <AcFormField
              label='Telefoonnummer'
              required={true}
              placeholder='06 12345678'
              value={organization.contactPersons[0].phone}
              type='tel'
              onBlur={(e) => setOrganizationData('contactPersons.phone', e)}
              hasError={
                (touched.contactPersons.phone &&
                  !organization.contactPersons[0].phone) ||
                (organization.contactPersons[0].phone &&
                  !validatePhone(organization.contactPersons[0].phone))
              }
              id='phone-field'
              disabled={loading}
            />
            <span className='ac-register-form-field-error'>
              {touched.contactPersons.phone && !organization.contactPersons[0].phone
                ? 'Dit veld is verplicht'
                : organization.contactPersons[0].phone &&
                  !validatePhone(organization.contactPersons[0].phone) &&
                  'Ongeldig telefoonnummer. Gebruik een Nederlands nummer (bijv. 06 1234 5678 of +31 6 1234 5678)'}
            </span>
          </div>
          <div>
            <AcFormField
              label='E-mailadres'
              required={true}
              placeholder='john.doe@example.com'
              value={organization.contactPersons[0].email}
              type='email'
              onBlur={(e) => setOrganizationData('contactPersons.email', e)}
              hasError={
                (touched.contactPersons.email &&
                  !organization.contactPersons[0].email) ||
                (organization.contactPersons[0].email &&
                  !validateEmail(organization.contactPersons[0].email))
              }
              id='email-field'
              disabled={loading}
            />
            <span className='ac-register-form-field-error'>
              {touched.contactPersons.email && !organization.contactPersons[0].email
                ? 'Dit veld is verplicht'
                : organization.contactPersons[0].email &&
                  !validateEmail(organization.contactPersons[0].email) &&
                  'Ongeldig e-mailadres'}
            </span>
          </div>
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

const ReviewForm = memo(
  ({ organization, confirmationCheckbox, setConfirmationCheckbox }) => {
    return (
      <div className='ac-register-form-section'>
        <div className='ac-register-review'>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>Organisatiegegevens</h4>
              {organization.logo && (
                <ConLogoPreview
                  logoUrl={organization.logo}
                  className='ac-register-review__logo'
                />
              )}
            </div>
            <Separator className='ac-register-review-header__separator' />
            <div className='ac-register-review__field'>
              <strong>Naam:</strong>
              <span>{organization.name || '-'}</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Type organisatie:</strong>
              <span>{organization.organizationType || '-'}</span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Website:</strong> {organization.website || '-'}
            </div>

            <Separator className='ac-register-review__separator' />

            <div className='ac-register-review__field'>
              <strong>Korte beschrijving:</strong>
              <div>
                <ReactMarkdown>{organization.summary || ''}</ReactMarkdown>
              </div>
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
              <strong>Telefoonnummer:</strong> {organization.phone || '-'}
            </div>
            <div className='ac-register-review__field'>
              <strong>Email:</strong> {organization.email || '-'}
            </div>
          </div>

          <div className='ac-register-review__section'>
            <h4 className='utrecht-heading-4'>Contactpersoon</h4>
            <Separator className='ac-register-review-header__separator' />
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
        </div>

        <div className='ac-register-form-checkbox-wrapper'>
          <AcCheckbox
            label={
              <>
                Ik ga akkoord met de{' '}
                <AcLink
                  to='/algemene-voorwaarden'
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ display: 'inline' }}
                >
                  algemene voorwaarden
                </AcLink>
              </>
            }
            value='Ik ga akkoord met de algemene voorwaarden'
            checked={confirmationCheckbox.terms}
            onChange={() =>
              setConfirmationCheckbox({
                ...confirmationCheckbox,
                terms: !confirmationCheckbox.terms,
              })
            }
          />
          <AcCheckbox
            label={
              <>
                Ik ga akkoord met de{' '}
                <AcLink
                  to='/privacyverklaring'
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ display: 'inline' }}
                >
                  privacyverklaring
                </AcLink>
              </>
            }
            value='Ik ga akkoord met de privacyverklaring'
            checked={confirmationCheckbox.privacy}
            onChange={() =>
              setConfirmationCheckbox({
                ...confirmationCheckbox,
                privacy: !confirmationCheckbox.privacy,
              })
            }
          />
        </div>
      </div>
    );
  }
);

export default withStore(observer(AcRegister));
