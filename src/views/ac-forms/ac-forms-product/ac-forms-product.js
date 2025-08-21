import { useState, useCallback, memo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcFormField, AcButton, AcCheckbox } from '@src/molecules';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';

import {
  Heading1,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import clsx from 'clsx';
import { useDebouncedInput } from '@src/hooks/index';
import LogoUploadField from '@views/ac-beheer/shared/components/con-logo-upload-field';

const AcFormsProduct = () => {
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [isMultiApplicatie, setIsMultiApplicatie] = useState(false); // shows wether the product has multiple applicaties, used to dictate how to render the form
  const [product, setProduct] = useState({
    productName: '',
    beschrijving: '',
    productpagina: '',
    logo: '',
    applicaties: {}, // array of applicaties with a unique key for easier data management
  });
  const [touched, setTouched] = useState({
    productName: false,
  });

  const setProductData = useCallback((key, value) => {
    {
      setProduct((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({
        ...prev,
        [key]: true,
      }));
    }
  }, []);

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Create a copy of the organization data
      const productData = {
        naam: product.productName,
      };

      const response = await fetch(
        `${BASE_URL}/openconnector/api/endpoint/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
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

  const focusForm = () => {
    const form = document.querySelector('#formStart');
    if (form) {
      form.focus();
    }
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ProductOpbouwForm
            {...{
              product,
              setProductData,
              touched,
              isMultiApplicatie,
              setIsMultiApplicatie,
            }}
          />
        );
      case 1:
        return (
          <ProductOpbouwInformationForm
            {...{
              product,
              setProductData,
              loading,
              touched,
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
        return 'Productopbouw';
      case 1:
        return 'Productinformatie';
    }
  };

  const getDisabledStatus = (currentStep) => {
    if (currentStep === 0) {
      return false;
    }
    if (currentStep === 1) {
      return !product.productName;
    }
  };

  // Add this function to generate the tooltip message
  const getDisabledTooltip = (product) => {
    // Example
    if (currentStep === 1) {
      const messages = [];
      if (!product.productName) {
        messages.push('Productnaam is verplicht');
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
              <div>
                <Heading1>Product Aanmelden</Heading1>
                <Paragraph>
                  Vul dit formulier in om een product aan te melden in onze
                  catalogus.
                </Paragraph>
              </div>
              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName(currentStep)}
                </h3>

                {registerCallBack === 'error' && error.message && (
                  <Alert type='error'>
                    <Paragraph>{error.message}</Paragraph>
                    {error.errors && (
                      <UnorderedList>
                        {Object.entries(error.errors).map(([field, messages]) => (
                          <UnorderedListItem key={field}>
                            <strong>{field}:</strong>{' '}
                            {Array.isArray(messages)
                              ? messages.join(', ')
                              : messages}
                          </UnorderedListItem>
                        ))}
                      </UnorderedList>
                    )}
                  </Alert>
                )}

                <AcColumn gap='sm'>
                  <div className='ac-register-container'>
                    <div className='ac-register-process-steps'>
                      <ProcessSteps
                        steps={[
                          {
                            id: '4p5q6r7s-8t9u-0v1w-2x3y-4z5a6b7c8d9e',
                            marker: 1,
                            status: getStatusMultiStep(currentStep, 0),
                            title: 'Productopbouw',
                            steps: [
                              {
                                id: 'v6w7x8y9-0z1a-2b3c-4d5e-6f7g8h9i0j1k',
                                status: getStatus(currentStep, 1),
                                title: 'Product informatie',
                              },
                            ],
                          },
                          {
                            id: '7f8e9a2b-1c3d-4f5g-6h7i-8j9k0l1m2n3o',
                            marker: 2,
                            status: getStatus(currentStep, 2),
                            title: 'Contactpersoon',
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
                      <div tabIndex='-1' id='formStart'></div>

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
                            Vorige
                          </AcButton>
                        )}
                        {currentStep !== 3 && (
                          <div className='ac-register-button-wrapper'>
                            <AcButton
                              style='button'
                              className={clsx(
                                currentStep === 0 && 'ac-register-form-next-button'
                              )}
                              icon={<VISUALS.ARROW_RIGHT />}
                              disabled={getDisabledStatus(currentStep) || loading}
                              onClick={() => {
                                focusForm();
                                setCurrentStep(currentStep + 1);
                              }}
                              title={
                                getDisabledStatus(currentStep)
                                  ? getDisabledTooltip(currentStep, product)
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
                            icon={<VISUALS.CLIPBOARD_CHECK />}
                            onClick={handleRegister}
                            loading={loading}
                            disabled={loading}
                          >
                            Product aanmelden
                          </AcButton>
                        )}
                      </div>
                    </div>
                  </div>
                </AcColumn>
              </div>
            </>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

const ProductOpbouwForm = memo(
  ({
    product,
    setProductData,
    touched,
    isMultiApplicatie,
    setIsMultiApplicatie,
  }) => {
    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='organization-section-title'
      >
        <h2 id='organization-section-title' className='sr-only'>
          Productopbouw
        </h2>

        <Paragraph>
          Een product kan één applicatie zijn, of een verzameling applicaties en
          modules die samen een suite vormen. Geef hieronder aan welke situatie van
          toepassing is.
        </Paragraph>
        <div className='ac-register-form-checkbox-wrapper'>
          <AcCheckbox
            label='Een enkele'
            value='single'
            checked={!isMultiApplicatie}
            onChange={() => setIsMultiApplicatie(false)}
          />
          <AcCheckbox
            label='Een verzameling applicaties of modules (suite)'
            value='multi'
            checked={isMultiApplicatie}
            onChange={() => setIsMultiApplicatie(true)}
          />
        </div>
      </div>
    );
  }
);

const ProductOpbouwInformationForm = memo(
  ({ product, setProductData, loading, touched }) => {
    // Debounce example
    const debouncedSetName = useDebouncedInput(
      (value) => setProductData('productName', value),
      500
    );

    const remainingDescriptionChars = 225 - (product.beschrijving?.length || 0);

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='organization-section-title'
      >
        <h2 id='organization-section-title' className='sr-only'>
          Productinformatie
        </h2>

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2' }}>
            <AcFormField
              label='Productnaam'
              required={true}
              placeholder='Voorbeeld: Gemeente Amsterdam'
              value={product.productName}
              onChange={(e) => debouncedSetName(e)}
              hasError={touched.productName && !product.productName}
              disabled={loading}
              id='product-name'
              aria-describedby={
                touched.productName && !product.productName
                  ? 'name-error'
                  : undefined
              }
              className='ac-register-form-field__no-width-limit'
            />
            {touched.productName && !product.productName && (
              <span
                className='ac-register-form-field-error'
                id='name-error'
                role='alert'
              >
                Dit veld is verplicht
              </span>
            )}
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <AcFormField
              label='Beschrijving'
              tooltip='Beschrijf kort het product (max. 225 tekens).'
              inputType='textarea'
              value={product.beschrijving}
              onChange={(v) => setProductData('beschrijving', v)}
              disabled={loading}
              id='product-description'
              maxLength={225}
              className='ac-register-form-field__no-width-limit'
            />
            <small className='ac-register-form-field-help'>
              {remainingDescriptionChars} karakters over
            </small>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <AcFormField
              label='Productpagina'
              inputType='url'
              placeholder='https://voorbeeld.nl/product'
              value={product.productpagina}
              onChange={(v) => setProductData('productpagina', v)}
              disabled={loading}
              id='product-page'
              className='ac-register-form-field__no-width-limit'
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <LogoUploadField
              fieldConfig={{ label: 'Logo (upload)' }}
              _value={product.logo}
              onChange={(dataUrl) => setProductData('logo', dataUrl)}
              validation={{ required: false }}
              propertyName='logo'
              isDisabled={loading}
            />
          </div>
        </div>
      </div>
    );
  }
);

ProductOpbouwForm.displayName = 'ProductOpbouwForm';
ProductOpbouwInformationForm.displayName = 'ProductOpbouwInformationForm';

export default withStore(observer(AcFormsProduct));
