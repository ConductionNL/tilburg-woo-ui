import clsx from 'clsx';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { useState, useCallback, memo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcSection, AcColumn } from '@src/atoms';
import { VISUALS } from '@src/constants';
import { AcFormField, AcButton, AcCheckbox } from '@src/molecules';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { useDebouncedInput } from '@src/hooks/index';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import {
  Heading1,
  UnorderedList,
  UnorderedListItem,
  Alert,
  Paragraph,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

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
    applicaties: {
      0: {
        naam: '',
        beschrijvingKort: '',
        licentieType: '',
        licentie: '',
        referentieComponenten: [],
        standaarden: [],
        koppelingen: [],
        diensten: [],
      },
    }, // array of applicaties with a unique key for easier data management
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
      case 2:
        return (
          <TestForm
            {...{
              currentStep,
            }}
          />
        );
      case 3:
        return (
          <TestForm
            {...{
              currentStep,
            }}
          />
        );
      case 4:
        return (
          <TestForm
            {...{
              currentStep,
            }}
          />
        );
      case 5:
        return (
          <TestForm
            {...{
              currentStep,
            }}
          />
        );
      case 6:
        return (
          <TestForm
            {...{
              currentStep,
            }}
          />
        );
      case 7:
        return (
          <TestForm
            {...{
              currentStep,
            }}
          />
        );
      case 8:
        return (
          <ControlerenForm
            {...{
              product,
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

  const getStatusMultiStep = (currentStep, step, firstStep, lastStep) => {
    if (currentStep >= firstStep && currentStep <= lastStep) {
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
      // return !product.productName;
      return false;
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
                            status: getStatusMultiStep(currentStep, 0, 0, 1),
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
                            status: getStatusMultiStep(currentStep, 2, 2, 7),
                            title: 'Applicatie(s)',
                            steps: [
                              {
                                id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
                                status: getStatus(currentStep, 3),
                                title: 'Licentie & hosting',
                              },
                              {
                                id: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
                                status: getStatus(currentStep, 4),
                                title: 'Referentiecomponenten',
                              },
                              {
                                id: 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8',
                                status: getStatus(currentStep, 5),
                                title: 'Standaarden',
                              },
                              {
                                id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
                                status: getStatus(currentStep, 6),
                                title: 'Koppelingen',
                              },
                              {
                                id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
                                status: getStatus(currentStep, 7),
                                title: 'Diensten',
                              },
                            ],
                          },
                          {
                            id: 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1',
                            marker: 3,
                            status: getStatus(currentStep, 8),
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
                        {currentStep !== 8 && (
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

                        {currentStep === 8 && (
                          <AcButton
                            style='button'
                            icon={<VISUALS.CLIPBOARD_CHECK />}
                            onClick={handleRegister}
                            loading={loading}
                            // Disabled until we know what endpoint we need to use and what data we need to send
                            disabled={loading || true}
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

const ProductOpbouwForm = memo(({ isMultiApplicatie, setIsMultiApplicatie }) => {
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
});

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

const ControlerenForm = memo(({ product }) => {
  return (
    <div>
      <div className='con-form-wizard-review-heading-container'>
        <h3 className='con-form-wizard-review-heading-header'>Product informatie</h3>
        <div className='ac-register-review__section'>
          <div className='ac-register-review__header'>
            <h4 className='utrecht-heading-4'>{product.productName}</h4>
            {product.logo && (
              <ConLogoPreview
                logoUrl={product.logo}
                className='ac-register-review__logo'
              />
            )}
          </div>
          <Separator className='con-form-wizard-review-header__separator' />

          <div className='ac-register-review__field'>
            <strong>Beschrijving:</strong>
            <span>{product.beschrijving || '-'}</span>
          </div>

          <div className='ac-register-review__field'>
            <strong>Productpagina:</strong> {product.productpagina || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Hosting:</strong> {product.hosting || '-'}
          </div>
          <div className='ac-register-review__field'>
            <strong>Jurisdictie:</strong> {product.jurisdictie || '-'}
          </div>
        </div>
      </div>

      <h3 className='con-form-wizard-review-heading-header'>Applicaties</h3>
      <div className='ac-register-review'>
        {Object.values(product.applicaties).map((applicatie, idx) => (
          <div
            className='ac-register-form-section'
            key={applicatie.id || applicatie.naam || idx}
          >
            <div className='ac-register-review'>
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <h4 className='utrecht-heading-4'>{applicatie.naam}</h4>
                </div>
                <Separator className='ac-register-review-header__separator' />

                <div className='ac-register-review__field'>
                  <strong>Korte beschrijving:</strong>
                  <div>
                    <div>{applicatie.beschrijvingKort || ''}</div>
                  </div>
                </div>

                <div className='ac-register-review__field'>
                  <strong>Licentietype:</strong>
                  <div>
                    <div>{applicatie.licentieType || ''}</div>
                  </div>
                </div>

                {applicatie.licentieType !== 'Closed Source' && (
                  <div className='ac-register-review__field'>
                    <strong>Licentie:</strong>
                    <div>
                      <div>{applicatie.licentie || ''}</div>
                    </div>
                  </div>
                )}

                {Array.isArray(applicatie.referentieComponenten) &&
                  applicatie.referentieComponenten.length > 0 && (
                    <div className='ac-register-review__field'>
                      <strong>Referentiecomponenten:</strong>
                      <div>
                        <UnorderedList>
                          {applicatie.referentieComponenten.map((rc) => (
                            <UnorderedListItem key={rc.id || rc.naam}>
                              {rc.naam}
                            </UnorderedListItem>
                          ))}
                        </UnorderedList>
                      </div>
                    </div>
                  )}

                {Array.isArray(applicatie.standaarden) &&
                  applicatie.standaarden.length > 0 && (
                    <div className='ac-register-review__field'>
                      <strong>Standaarden:</strong>
                      <div>
                        <UnorderedList>
                          {applicatie.standaarden.map((std) => (
                            <UnorderedListItem key={std.id || std.naam}>
                              {std.naam}
                              {std.bewijs ? (
                                <>
                                  {' '}
                                  -{' '}
                                  <a
                                    href={std.bewijs}
                                    target='_blank'
                                    rel='noreferrer noopener'
                                  >
                                    bewijs
                                  </a>
                                </>
                              ) : null}
                            </UnorderedListItem>
                          ))}
                        </UnorderedList>
                      </div>
                    </div>
                  )}

                {Array.isArray(applicatie.koppelingen) &&
                  applicatie.koppelingen.length > 0 && (
                    <div className='ac-register-review__field'>
                      <strong>Koppelingen:</strong>
                      <div>
                        <UnorderedList>
                          {applicatie.koppelingen.map((kp, kIdx) => {
                            const richting = kp.richtingDataUitwisseling;
                            const soort = kp.sooortKoppeling;
                            const details =
                              richting || soort
                                ? ` (${[richting, soort]
                                    .filter(Boolean)
                                    .join(', ')})`
                                : '';
                            return (
                              <UnorderedListItem
                                key={`${kp.applicatie1}-${kp.applicatie2}-${kIdx}`}
                              >
                                {kp.applicatie1} ↔ {kp.applicatie2}
                                {details}
                              </UnorderedListItem>
                            );
                          })}
                        </UnorderedList>
                      </div>
                    </div>
                  )}

                {Array.isArray(applicatie.diensten) &&
                  applicatie.diensten.length > 0 && (
                    <div className='ac-register-review__field'>
                      <strong>Diensten:</strong>
                      <div>
                        <UnorderedList>
                          {applicatie.diensten.map((dienst) => (
                            <UnorderedListItem key={dienst.id || dienst.naam}>
                              {dienst.naam}
                            </UnorderedListItem>
                          ))}
                        </UnorderedList>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const TestForm = memo(({ currentStep }) => {
  // This testForm needs to be removed after all the steps have their own form

  return <div>hi this is current step {currentStep}</div>;
});

ProductOpbouwForm.displayName = 'ProductOpbouwForm';
ProductOpbouwInformationForm.displayName = 'ProductOpbouwInformationForm';
ControlerenForm.displayName = 'ControlerenForm';

TestForm.displayName = 'TestForm';

export default withStore(observer(AcFormsProduct));
