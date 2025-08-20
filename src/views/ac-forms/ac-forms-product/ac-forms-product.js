import { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import { AcContainer, AcSection, AcFlex, AcGrid } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcFormField, AcButton, AcCheckbox, AcLink } from '@src/molecules';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
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
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { useNavigate } from 'react-router-dom';
import { useDebouncedInput } from '@src/hooks/index';
import { ConMarkdown } from '@src/components';

const organizationTypes = [
  { value: 'Leverancier', label: 'Leverancier' },
  { value: 'Gemeente', label: 'Gemeente' },
  { value: 'Samenwerking', label: 'Samenwerking' },
  { value: 'Community', label: 'Community' },
];

const AcFormsProduct = () => {
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
    (selectedFile) => {
      if (!selectedFile || !acceptedLogoFileTypes.includes(selectedFile.type)) {
        return;
      }

      setLogoFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        const logoDataUrl = event.target.result;
        setLogoDataUrl(logoDataUrl);
        setOrganization((prevOrganization) => ({
          ...prevOrganization,
          logo: logoDataUrl,
        }));
      };

      reader.readAsDataURL(selectedFile);
    },
    [acceptedLogoFileTypes]
  );

  const validateWebsite = useCallback((website) => {
    if (!website) return false;
    try {
      // Allow websites without protocol, but validate the structure
      const urlPattern = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?$/;
      return urlPattern.test(website);
    } catch {
      return false;
    }
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
            telefoonnummer: organization.contactPersons[0].phone,
            'e-mailadres': organization.contactPersons[0].email,
            functie: organization.contactPersons[0].function,
          },
        ],
        type: organization.organizationType,
        kvkNummer: organization.kvkNumber,
        'e-mailadres': organization.email,
      };

      // Changed endpoint to /product
      const response = await fetch(
        `${BASE_URL}/openconnector/api/endpoint/product`,
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
        console.error('Registration failed', response);
        setRegisterCallBack('error');
        setError({
          message: 'Er is een fout opgetreden bij het registreren.',
          errors: null,
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setRegisterCallBack('error');
      setError({
        message: 'Er is een fout opgetreden bij het registreren.',
        errors: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = useMemo(() => {
    const isStep1Valid =
      organization.name.trim() &&
      organization.contactPersons[0].firstName.trim() &&
      organization.contactPersons[0].lastName.trim() &&
      organization.contactPersons[0].email &&
      validateWebsite(organization.website) &&
      validatePhone(organization.contactPersons[0].phone);

    const isStep2Valid = organization.summary.trim();

    const isStep3Valid =
      confirmationCheckbox.privacy && confirmationCheckbox.terms;

    switch (currentStep) {
      case 0:
        return isStep1Valid;
      case 1:
        return isStep2Valid;
      case 2:
        return isStep3Valid;
      default:
        return false;
    }
  }, [
    organization,
    currentStep,
    confirmationCheckbox,
    validateWebsite,
    validatePhone,
  ]);

  if (registerCallBack === 'success') {
    return (
      <AcSection spacing>
        <AcContainer>
          <AcColumn gap="lg">
            <Heading1>Product Aanmelding Gelukt!</Heading1>
            <Alert type="ok">
              <Paragraph>
                Uw product aanmelding is succesvol ingediend. U ontvangt
                binnenkort een bevestiging via e-mail.
              </Paragraph>
            </Alert>
          </AcColumn>
        </AcContainer>
      </AcSection>
    );
  }

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap="lg">
          <div>
            <Heading1>Product Aanmelden</Heading1>
            <Paragraph>
              Vul dit formulier in om een product aan te melden in onze catalogus.
            </Paragraph>
          </div>

          {registerCallBack === 'error' && error.message && (
            <Alert type="error">
              <Paragraph>{error.message}</Paragraph>
              {error.errors && (
                <UnorderedList>
                  {Object.entries(error.errors).map(([field, messages]) => (
                    <UnorderedListItem key={field}>
                      <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
                    </UnorderedListItem>
                  ))}
                </UnorderedList>
              )}
            </Alert>
          )}

          <ProcessSteps
            steps={[
              { status: currentStep >= 0 ? 'current' : 'incomplete', title: 'Productgegevens' },
              { status: currentStep >= 1 ? 'current' : 'incomplete', title: 'Beschrijving' },
              { status: currentStep >= 2 ? 'current' : 'incomplete', title: 'Bevestiging' },
            ]}
          />

          <div className="ac-register-form-content">
            {/* Form content would be rendered here based on currentStep */}
            <p>Product formulier content for step {currentStep + 1} would go here...</p>
          </div>

          <div className="ac-register-form-actions">
            {currentStep > 0 && (
              <AcButton
                style="secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Vorige
              </AcButton>
            )}
            
            {currentStep < 2 ? (
              <AcButton
                style="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isFormValid || loading}
              >
                Volgende
              </AcButton>
            ) : (
              <AcButton
                style="primary"
                onClick={handleRegister}
                disabled={!isFormValid || loading}
              >
                {loading ? 'Bezig met verzenden...' : 'Product Aanmelden'}
              </AcButton>
            )}
          </div>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsProduct)));
