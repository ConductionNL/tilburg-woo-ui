import { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import { AcContainer, AcSection, AcFlex, AcGrid } from '@src/atoms';
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
  Link,
} from '@utrecht/component-library-react/dist/css-module';
import { isValidPhoneNumber } from 'libphonenumber-js';
import ReactSelect from 'react-select';
import clsx from 'clsx';
import ConLogoPreview from './con-logo-preview';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useDebouncedInput } from '@src/hooks/index';

const organizationTypes = [
  { value: 'Leverancier', label: 'Leverancier' },
  { value: 'Gemeente', label: 'Gemeente' },
  { value: 'Samenwerking', label: 'Samenwerking' },
  { value: 'Community', label: 'Community' },
];

const AcRegister = () => {
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [showAlert, setShowAlert] = useState(true);
  const [organization, setOrganization] = useState({
    name: 'Conduction',
    contactInformation: {},
    website: 'https://conduction.nl',
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
    organizationType: 'Leverancier',
    kvkNumber: '',
    email: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [touched, setTouched] = useState({
    name: false,
    contactPersons: {
      firstName: false,
      lastName: false,
      phone: false,
      email: false,
    },
  });
  const [confirmationCheckbox, setConfirmationCheckbox] = useState({
    privacy: false,
    terms: false,
  });

  const navigate = useNavigate();

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

  const acceptedLogoFileTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
  ];

  const handleLogoFileSelect = useCallback(
    (e) => {
      if (!e.target.files.length) {
        setLogoFile(null);
        setLogoDataUrl(null);
        return;
      }

      const file = e.target.files[0];

      if (!acceptedLogoFileTypes.includes(file.type)) {
        setLogoFile(null);
        setLogoDataUrl(null);
        return;
      }

      file.getDataUrl = async () => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      };

      setLogoFile(file);

      (async () => {
        const dataUrl = await file.getDataUrl();
        setLogoDataUrl(dataUrl);
      })();
    },
    [setLogoFile]
  );

  const setOrganizationData = useCallback((key, value) => {
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
  }, []);

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const validateWebsite = useCallback((website) => {
    return (
      website &&
      website.match(/^(?:https:\/\/|www\.)[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?$/i)
    );
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone) return false;
    const trimmed = phone.replace(/\s+/g, '');
    if (trimmed.startsWith('+')) {
      return isValidPhoneNumber(trimmed);
    }
    if (trimmed.startsWith('06')) {
      return isValidPhoneNumber(trimmed, 'NL');
    }
    return false;
  }, []);

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
        logo: logoDataUrl,
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
      organizationType: 'Leverancier',
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
    setLogoFile(null);
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
              handleLogoFileSelect,
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
            {...{
              organization,
              logoDataUrl,
              confirmationCheckbox,
              setConfirmationCheckbox,
            }}
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
        return 'Contactpersoon';
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
        messages.push(
          !organization.website.startsWith('https://') &&
            !organization.website.startsWith('www.')
            ? 'Website moet beginnen met https:// of www.'
            : 'Ongeldig Websiteadres'
        );
      }
      return messages.join('\n');
    }

    if (currentStep === 1) {
      const messages = [];
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
                            title: 'Contactpersoon',
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
                Uw aanmelding voor de Softwarecatalogus is succesvol ontvangen. We
                hebben een bevestigingsmail gestuurd naar{' '}
                <b>{organization.contactPersons[0].email}</b>. Controleer uw inbox
                (en eventueel uw spam folder) voor deze bevestiging.
              </p>
              <p>
                Een beheerder zal uw aanmelding beoordelen. Zodra uw aanmelding is
                goedgekeurd, ontvangt u een nieuwe e-mail met daarin uw inloggegevens
                en verdere instructies voor het gebruik van de Softwarecatalogus.
              </p>
              <p>
                Heeft u vragen? Neem dan contact op met onze helpdesk via
                support@softwarecatalogus.nl
              </p>
              <br />
              <AcButton
                style='button'
                icon={<VISUALS.ARROW_LEFT />}
                onClick={() => navigate('/')}
              >
                Terug naar homepage
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
                onClick={() => navigate('/')}
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
    const debouncedSetWebsite = useDebouncedInput(
      (value) => setOrganizationData('website', value),
      500
    );

    const debouncedSetName = useDebouncedInput(
      (value) => setOrganizationData('name', value),
      500
    );

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
          {organization.organizationType !== 'gemeente' && (
            <div style={{ gridColumn: 'span 2' }}>
              <AcFormField
                label='Naam'
                required={true}
                placeholder='Voorbeeld: Gemeente Amsterdam'
                value={organization.name}
                onChange={(e) => debouncedSetName(e)}
                hasError={touched.name && !organization.name}
                disabled={loading}
                id='org-name'
                aria-describedby={
                  touched.name && !organization.name ? 'name-error' : undefined
                }
                className='ac-register-form-field__no-width-limit'
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
          )}
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
              value={organizationTypes.find(
                (type) => type.value === organization.organizationType
              )}
              className='ac-beheer-select ac-register-form-field__no-width-limit'
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
                onChange={(e) => debouncedSetWebsite(e)}
                id='website-field'
                aria-describedby={
                  touched.website && !organization.website
                    ? 'website-error'
                    : undefined
                }
                disabled={loading}
                className='ac-register-form-field__no-width-limit'
              />
              {touched.website &&
                (!organization.website ||
                  !validateWebsite(organization.website)) && (
                  <span className='ac-register-form-field-error'>
                    {touched.website && !organization.website
                      ? 'Dit veld is verplicht'
                      : organization.website &&
                        !validateWebsite(organization.website) &&
                        !organization.website.startsWith('https://') &&
                        !organization.website.startsWith('www.')
                      ? 'Website moet beginnen met https:// of www.'
                      : 'Ongeldig Websiteadres'}
                  </span>
                )}
            </div>
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
                    Softwarecatalogus. Voor meer informatie of vragen kunt u contact
                    opnemen met{' '}
                    <Link
                      className='ac-register-form-alert-link'
                      href='mailto:softwarecatalogus@vng.nl'
                    >
                      softwarecatalogus@vng.nl
                    </Link>
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
    handleLogoFileSelect,
  }) => {
    const dimensions = { width: '100%', height: '234px' };
    const counterRef = useRef(null);
    let localSummary = organization.summary || '';

    // Debounced functions for all optional fields
    const debouncedSetSummary = useDebouncedInput(
      (value) => setOrganizationData('summary', value),
      500
    );

    const debouncedSetKvkNumber = useDebouncedInput(
      (value) => setOrganizationData('kvkNumber', value),
      500
    );

    const debouncedSetOin = useDebouncedInput(
      (value) => setOrganizationData('oin', value),
      500
    );

    const debouncedSetPhone = useDebouncedInput(
      (value) => setOrganizationData('phone', value),
      500
    );

    const debouncedSetEmail = useDebouncedInput(
      (value) => setOrganizationData('email', value),
      500
    );

    // Update counter with correct singular/plural
    const updateCounter = (value) => {
      const remaining = 255 - (value?.length || 0);
      const label = remaining === 1 ? 'karakter over' : 'karakters over';
      if (counterRef.current) {
        counterRef.current.textContent = `${remaining} ${label}`;
      }
    };

    // Update counter on mount and when summary changes
    useEffect(() => {
      updateCounter(organization.summary || '');
    }, [organization.summary]);

    return (
      <div className='ac-register-form-section'>
        <AcGrid columns={2}>
          <div>
            <AcFormField
              fullWidth={true}
              inputType='textarea'
              label='Korte beschrijving'
              placeholder='Een korte beschrijving van de organisatie'
              tooltip='Een korte beschrijving van de organisatie'
              value={organization.summary}
              onChange={(e) => {
                localSummary = e;
                updateCounter(e);
                debouncedSetSummary(e);
              }}
              disabled={loading}
              maxLength={255}
              className='textarea-with-dimensions'
              style={{
                '--textarea-height': dimensions.height,
                '--textarea-width': dimensions.width,
              }}
            />
            <span ref={counterRef} className='character-count' />
          </div>

          <AcFlex column spacing='sm'>
            {organization.organizationType === 'Leverancier' && (
              <AcFormField
                label='KvK nummer'
                placeholder='12345678'
                value={organization.kvkNumber}
                onChange={(e) => debouncedSetKvkNumber(e)}
                disabled={loading}
              />
            )}

            {(organization.organizationType === 'Gemeente' ||
              organization.organizationType === 'Samenwerking') && (
              <AcFormField
                label='OIN'
                placeholder='00000001002564440000'
                value={organization.oin}
                onChange={(e) => debouncedSetOin(e)}
                disabled={loading}
              />
            )}

            <AcFlex column>
              <label className='utrecht-form-label'>
                <h4 className='utrecht-heading-4'>Logo</h4>
              </label>

              <input
                id='fileInput-logo'
                type='file'
                accept={[
                  'image/png',
                  'image/jpeg',
                  'image/jpg',
                  'image/webp',
                  'image/svg+xml',
                ].join(',')}
                multiple={false}
                onChange={handleLogoFileSelect}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--utrecht-textbox-border-color)',
                  borderRadius: 'var(--utrecht-select-border-radius)',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '1em',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                    borderColor: 'var(--utrecht-button-primary-action-border-color)',
                  },
                }}
              />

              <small
                style={{
                  display: 'block',
                  marginTop: '0.5em',
                  color: 'var(--utrecht-paragraph-color)',
                  fontSize: '0.85em',
                  fontStyle: 'italic',
                  opacity: 0.85,
                  userSelect: 'none',
                }}
              >
                Toegestane bestandstypen: png, jpeg, jpg, webp, svg
              </small>
            </AcFlex>

            <div>
              <AcFormField
                label='Telefoonnummer (organisatie)'
                placeholder='06 12345678'
                value={organization.phone}
                type='tel'
                onChange={(e) => debouncedSetPhone(e)}
                hasError={organization.phone && !validatePhone(organization.phone)}
                id='phone-field'
                disabled={loading}
              />
              <span className='ac-register-form-field-error'>
                {organization.phone &&
                  !validatePhone(organization.phone) &&
                  'Ongeldig telefoonnummer. Gebruik een Nederlands mobiel nummer (bijv. 06 1234 5678) of internationaal nummer (bijv. +31 6 1234 5678)'}
              </span>
            </div>

            <div>
              <AcFormField
                label='E-mailadres (organisatie)'
                placeholder='john.doe@example.com'
                value={organization.email}
                type='email'
                onChange={(e) => debouncedSetEmail(e)}
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
          </AcFlex>
        </AcGrid>
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
    // Debounced functions for all contact person fields
    const debouncedSetFirstName = useDebouncedInput(
      (value) => setOrganizationData('contactPersons.firstName', value),
      500
    );

    const debouncedSetLastName = useDebouncedInput(
      (value) => setOrganizationData('contactPersons.lastName', value),
      500
    );

    const debouncedSetContactPhone = useDebouncedInput(
      (value) => setOrganizationData('contactPersons.phone', value),
      500
    );

    const debouncedSetContactEmail = useDebouncedInput(
      (value) => setOrganizationData('contactPersons.email', value),
      500
    );

    const debouncedSetFunction = useDebouncedInput(
      (value) => setOrganizationData('contactPersons.function', value),
      500
    );

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
                      Het contactpersoon dat wordt ingevuld wordt het eerste
                      aanspreekpunt van de organisatie. Dit kan op een later moment
                      nog gewijzigd worden.
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
              onChange={(e) => debouncedSetFirstName(e)}
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
          <div>
            <AcFormField
              label='Achternaam'
              required={true}
              placeholder='Doe'
              value={organization.contactPersons[0].lastName}
              type='text'
              onChange={(e) => debouncedSetLastName(e)}
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
              onChange={(e) => debouncedSetContactPhone(e)}
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
                  'Ongeldig telefoonnummer. Gebruik een Nederlands mobiel nummer (bijv. 06 1234 5678) of internationaal nummer (bijv. +31 6 1234 5678)'}
            </span>
          </div>
          <div>
            <AcFormField
              label='E-mailadres'
              required={true}
              placeholder='john.doe@example.com'
              value={organization.contactPersons[0].email}
              type='email'
              onChange={(e) => debouncedSetContactEmail(e)}
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
            onChange={(e) => debouncedSetFunction(e)}
            id='name-field'
            disabled={loading}
          />
        </div>
      </div>
    );
  }
);

const ReviewForm = memo(
  ({ organization, logoDataUrl, confirmationCheckbox, setConfirmationCheckbox }) => {
    return (
      <div className='ac-register-form-section'>
        <div className='ac-register-review'>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>Organisatiegegevens</h4>
              {logoDataUrl && (
                <ConLogoPreview
                  logoUrl={logoDataUrl}
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

            {organization.organizationType === 'Leverancier' && (
              <div className='ac-register-review__field'>
                <strong>KvK nummer:</strong>
                <span>{organization.kvkNumber || '-'}</span>
              </div>
            )}
            {(organization.organizationType === 'Gemeente' ||
              organization.organizationType === 'Samenwerking') && (
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
