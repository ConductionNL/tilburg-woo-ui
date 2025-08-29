import { useState, useEffect, memo, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';
import {
  Heading1,
  Paragraph,
  Alert,
  UnorderedList,
  UnorderedListItem,
} from '@utrecht/component-library-react/dist/css-module';

// Stage components
import ConFormSoortDienstStage from './components/con-form-soort-dienst-stage';
import ConFormDienstInformatieStage from './components/con-form-dienst-informatie-stage';
import ConFormProductenStage from './components/con-form-producten-stage';
import ConFormApplicatiesStage from './components/con-form-applicaties-stage';
import ConFormKoppelingenStage from './components/con-form-koppelingen-stage';
import ConFormControlerenStage from './components/con-form-controleren-stage';

const ConFormsDienst = ({ store, userStore }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const processStepsRef = useRef(null);

  // Schemas
  const [schemas, setSchemas] = useState({
    dienst: null,
    product: null,
    module: null,
    koppeling: null,
  });
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Dienst object (schema-compliant)
  const [dienst, setDienst] = useState({
    naam: '',
    beschrijvingKort: '',
    beschrijvingLang: '',
    website: '',
    logo: '',
    contactpersoon: null,
    aanbieder: '',
    type: '',
    producten: [],
    modules: [],
    koppelingen: [],
  });

  const [touched, setTouched] = useState({});

  // Service type selection state
  const [dienstType, setDienstType] = useState(null); // 'eigen-organisatie' or 'andere-organisatie'

  const setDienstData = (key, value) => {
    setDienst((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // Options/state
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProductOptions, setSelectedProductOptions] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productLabels, setProductLabels] = useState({});

  // productId -> module options derived from product details
  const [productToModulesLookup, setProductToModulesLookup] = useState({});
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [selectedKoppelingIds, setSelectedKoppelingIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Clickable previous steps
  useEffect(() => {
    if (!processStepsRef.current) return;
    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '[class*="process-step"], [role="button"], [role="tab"], .step'
      );
      stepElements.forEach((el, index) => {
        el.style.cursor = '';
        el.onclick = null;
        el.classList.remove('ac-step-clickable');
        if (index < currentStep) {
          el.classList.add('ac-step-clickable');
          el.onclick = (e) => {
            e.preventDefault();
            setCurrentStep(index);
          };
        }
      });
    };
    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  // Ensure /me is refreshed when the wizard mounts (so stages can read active organisation)
  useEffect(() => {
    if (typeof userStore?.fetchUserProfile === 'function') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          'ConFormsDienst - refreshing /me via userStore.fetchUserProfile'
        );
      }
      userStore.fetchUserProfile();
    }
  }, [userStore]);

  // Load schemas through object store (auth-aware)
  useEffect(() => {
    const load = async () => {
      setSchemasLoading(true);
      const types = ['dienst', 'product', 'module', 'koppeling'];
      const fetched = {};
      try {
        await Promise.all(
          types.map(async (t) => {
            try {
              await store.object.fetchSchema(t);
              fetched[t] = store.object.getSchema(`schema_${t}`);
            } catch {
              fetched[t] = null;
            }
          })
        );
        setSchemas(fetched);
      } finally {
        setSchemasLoading(false);
      }
    };
    load();
  }, [store]);

  // Auto-set aanbieder from active org
  // TODO: Initialize aanbieder to active organization ID
  // useEffect(() => {
  //   const actualUserStore = userStore || store?.user;
  //   if (actualUserStore?.activeOrganization && !dienst.aanbieder) {
  //     const orgId = actualUserStore.activeOrganization.uuid ||
  //                  actualUserStore.activeOrganization.id ||
  //                  actualUserStore.activeOrganization.slug;
  //     setDienstData('aanbieder', orgId || '');
  //   }
  // }, [userStore, store?.user, dienst.aanbieder]);

  // Use ref to avoid dependency issues
  const selectedProductOptionsRef = useRef(selectedProductOptions);
  selectedProductOptionsRef.current = selectedProductOptions;

  // Search/fetch products
  const performProductsSearch = useCallback(async (term = '') => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({ _limit: '20', _page: '1' });
      if (term && term.trim()) params.set('_search', term.trim());

      // TODO: Filter by own organization when dienst type is 'eigen-organisatie'
      // Use @self[organisation] parameter to filter products by organization
      // const actualUserStore = userStore || store?.user;
      // if (dienstType === 'eigen-organisatie' && actualUserStore?.activeOrganization) {
      //   const orgId = actualUserStore.activeOrganization.uuid ||
      //                actualUserStore.activeOrganization.id ||
      //                actualUserStore.activeOrganization.slug;
      //   if (orgId) {
      //     params.set('@self[organisation]', String(orgId));
      //   }
      // }

      const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product?${params}`;
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      const mapped = list.map((item, index) => ({
        value: String(item?.id || item?.value || item?.slug || index),
        label: String(
          item?.naam || item?.name || item?.title || `Product ${index + 1}`
        ),
        data: item,
      }));
      // Always include currently selected options so selected values remain available
      const currentSelectedOptions = selectedProductOptionsRef.current || [];
      const selectedById = new Set(currentSelectedOptions.map((o) => o.value));
      const merged = [
        ...currentSelectedOptions,
        ...mapped.filter((o) => !selectedById.has(o.value)),
      ];
      setProductOptions(merged);
    } catch {
      setProductOptions([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Initial load of products
  useEffect(() => {
    performProductsSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO: Reload products when dienst type changes to apply organization filtering
  // useEffect(() => {
  //   if (dienstType) {
  //     // Clear current selections as available products will change
  //     setSelectedProductIds([]);
  //     setSelectedProductOptions([]);
  //     setSelectedModuleIds([]);
  //     // Reload products with new filtering
  //     performProductsSearch('');
  //   }
  // }, [dienstType]);

  // When products selected, fetch their modules to build lookup
  useEffect(() => {
    let cancelled = false;
    const loadModulesForProducts = async () => {
      const lookup = {};
      const labels = {};
      for (const prodId of selectedProductIds) {
        try {
          // First, get product details for the label
          const productEndpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product/${prodId}`;
          const productRes = await fetch(productEndpoint, {
            headers: { Accept: 'application/json' },
          });
          if (productRes.ok) {
            const productItem = await productRes.json();
            const prodLabel = String(
              productItem?.naam ||
                productItem?.name ||
                productItem?.title ||
                productItem?.label ||
                prodId
            );
            labels[prodId] = prodLabel;
          }

          // Then, fetch modules directly from module endpoint filtered by product
          const moduleParams = new URLSearchParams({
            _limit: '50',
            product: prodId, // Filter modules by product ID
          });
          const moduleEndpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${moduleParams}`;
          const moduleRes = await fetch(moduleEndpoint, {
            headers: { Accept: 'application/json' },
          });

          if (!moduleRes.ok) throw new Error('HTTP ' + moduleRes.status);
          const moduleData = await moduleRes.json();

          // Handle both array and paginated response formats
          const modules = Array.isArray(moduleData)
            ? moduleData
            : Array.isArray(moduleData?.results)
            ? moduleData.results
            : [];

          lookup[prodId] = modules
            .map((m, idx) => {
              const id = String(m?.id || m?.value || m?.uuid || m);
              const label = String(
                m?.naam || m?.name || m?.title || `Applicatie ${idx + 1}`
              );
              return { value: id, label, data: m };
            })
            .filter((o) => o.value && o.label);
        } catch (error) {
          console.error(`Failed to load modules for product ${prodId}:`, error);
          lookup[prodId] = [];
        }
      }
      if (!cancelled) {
        setProductToModulesLookup(lookup);
        setProductLabels((prev) => ({ ...prev, ...labels }));
      }
    };
    if (selectedProductIds.length) loadModulesForProducts();
    else setProductToModulesLookup({});
    return () => {
      cancelled = true;
    };
  }, [selectedProductIds]);

  // Keep dienst.producten in sync with current selection
  useEffect(() => {
    setDienstData('producten', selectedProductIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductIds]);

  // Keep dienst.modules in sync with current selection
  useEffect(() => {
    setDienstData('modules', selectedModuleIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleIds]);

  // Keep dienst.koppelingen in sync with current selection
  useEffect(() => {
    setDienstData('koppelingen', selectedKoppelingIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKoppelingIds]);

  // Load koppelingen filtered by selected module ids using server-side search
  useEffect(() => {
    const loadKoppelingenForModules = async () => {
      try {
        if (!selectedModuleIds || selectedModuleIds.length === 0) {
          setKoppelingOptions([]);
          return;
        }

        // Single request using multiple _search[]=<id> params (IDs only)
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
        selectedModuleIds.forEach((id) => params.append('_search[]', String(id)));
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${params}`;
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          setKoppelingOptions([]);
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : [];

        const seen = new Map();
        list.forEach((item, index) => {
          const id = String(
            item?.id || item?.['@self']?.id || item?.value || `koppeling-${index}`
          );
          if (seen.has(id)) return;
          const label = String(
            item?.naam || `${item?.moduleA || '-'} ↔ ${item?.moduleB || '-'}`
          );
          seen.set(id, { value: id, label, data: item });
        });

        setKoppelingOptions(Array.from(seen.values()));
      } catch (e) {
        setKoppelingOptions([]);
      }
    };

    loadKoppelingenForModules();
  }, [selectedModuleIds]);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ConFormSoortDienstStage
            dienstType={dienstType}
            setDienstType={setDienstType}
            loading={schemasLoading}
            dienst={dienst}
          />
        );
      case 1:
        return (
          <ConFormProductenStage
            selectedProductIds={selectedProductIds}
            setSelectedProductIds={setSelectedProductIds}
            setSelectedProductOptions={setSelectedProductOptions}
            productOptions={productOptions}
            productsLoading={productsLoading}
            searchProducts={performProductsSearch}
            dienstType={dienstType}
          />
        );
      case 2:
        return (
          <ConFormDienstInformatieStage
            dienst={dienst}
            setDienstData={setDienstData}
            loading={schemasLoading}
            touched={touched}
            schemas={schemas}
            userStore={userStore}
            dienstType={dienstType}
          />
        );
      case 3:
        return (
          <ConFormApplicatiesStage
            productToModulesLookup={productToModulesLookup}
            selectedProductIds={selectedProductIds}
            selectedProductOptions={selectedProductOptions}
            productOptions={productOptions}
            productLabels={productLabels}
            selectedModuleIds={selectedModuleIds}
            setSelectedModuleIds={setSelectedModuleIds}
            dienstType={dienstType}
          />
        );
      case 4:
        return (
          <ConFormKoppelingenStage
            selectedModuleIds={selectedModuleIds}
            productToModulesLookup={productToModulesLookup}
            koppelingOptions={koppelingOptions}
            selectedKoppelingIds={selectedKoppelingIds}
            setSelectedKoppelingIds={setSelectedKoppelingIds}
            dienstType={dienstType}
          />
        );
      case 5:
        return (
          <ConFormControlerenStage
            dienst={dienst}
            selectedProductIds={selectedProductIds}
            productOptions={productOptions}
            selectedModuleIds={selectedModuleIds}
            moduleOptionsByProduct={productToModulesLookup}
            selectedKoppelingIds={selectedKoppelingIds}
            koppelingOptions={koppelingOptions}
            userStore={userStore}
            dienstType={dienstType}
          />
        );
      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      case 0:
        return 'Soort dienst';
      case 1:
        return 'Producten';
      case 2:
        return 'Dienst informatie';
      case 3:
        return 'Applicaties';
      case 4:
        return 'Koppelingen';
      case 5:
        return 'Controleren';
      default:
        return '';
    }
  };

  // Check if a field is required according to loaded schema
  const isSchemaFieldRequired = (schemaType, fieldName) => {
    const schema = schemas?.[schemaType];
    if (!schema) return false;
    // Property-level required flag
    const prop = schema.properties?.[fieldName];
    if (prop && prop.required) return true;
    // Parent-level required array per JSON Schema
    if (Array.isArray(schema.required)) {
      return schema.required.includes(fieldName);
    }
    return false;
  };

  // Validation mirroring product form style
  const getDisabledStatus = (step) => {
    if (step === 0) {
      // Must select service type
      return !dienstType;
    }
    if (step === 1) {
      // Producten: at least one product selected
      return selectedProductIds.length === 0;
    }
    if (step === 2) {
      // Respect schema requiredness
      const naamRequired = isSchemaFieldRequired('dienst', 'naam');
      const websiteRequired = isSchemaFieldRequired('dienst', 'website');

      const missingNaam = naamRequired && (!dienst.naam || !dienst.naam.trim());
      const missingWebsite =
        websiteRequired && (!dienst.website || !dienst.website.trim());
      if (missingNaam || missingWebsite) return true;

      // If website is provided, validate its format; if empty and not required, it's allowed
      if (dienst.website && dienst.website.trim()) {
        const website = dienst.website.trim();
        if (!validateWebsite(website)) return true;
      }
      return false;
    }
    if (step === 3) {
      // Applicaties: at least one module selected
      return selectedModuleIds.length === 0;
    }
    // Koppelingen: no strict validation (optional)
    return false;
  };

  const getDisabledTooltip = (step) => {
    if (step === 0) {
      return !dienstType ? 'Selecteer het type dienst' : '';
    }
    if (step === 1) {
      return selectedProductIds.length === 0 ? 'Selecteer minimaal één product' : '';
    }
    if (step === 2) {
      const messages = [];
      const naamRequired = isSchemaFieldRequired('dienst', 'naam');
      const websiteRequired = isSchemaFieldRequired('dienst', 'website');

      if (naamRequired && (!dienst.naam || !dienst.naam.trim())) {
        messages.push('Dienstnaam is verplicht');
      }
      if (websiteRequired && (!dienst.website || !dienst.website.trim())) {
        messages.push('Website is verplicht');
      } else if (dienst.website && dienst.website.trim()) {
        const website = dienst.website.trim();
        if (!validateWebsite(website)) {
          messages.push(
            'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)'
          );
        }
      }
      return messages.join('\n');
    }
    if (step === 3) {
      return selectedModuleIds.length === 0
        ? 'Selecteer minimaal één applicatie'
        : '';
    }
    return '';
  };

  // Determine page title based on dienst type
  const getPageTitle = () => {
    if (dienstType === 'eigen-organisatie') {
      return 'Dienst Aanmelden voor eigen organisatie';
    }
    if (dienstType === 'andere-organisatie') {
      return 'Dienst Aanmelden voor andere organisatie';
    }
    return 'Dienst Aanmelden';
  };

  const handleSaveDienst = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const payload = {
        ...dienst,
        producten: selectedProductIds,
        modules: selectedModuleIds,
        koppelingen: selectedKoppelingIds,
        // Include service type for processing
        dienstType: dienstType,
      };
      await store.object.createObject('voorzieningen', 'dienst', payload);
      setSaveResult('success');
    } catch (e) {
      setSaveResult('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <Heading1>{getPageTitle()}</Heading1>
            <Paragraph>
              Voer de gegevens van de dienst in, selecteer relevante producten,
              applicaties en koppelingen en controleer uw invoer.
            </Paragraph>
          </div>

          {/* End header block */}

          {saveResult === 'success' ? (
            <div>
              <Heading1>🎉 Dienst succesvol aangemeld!</Heading1>
              <Alert type='success'>
                <Paragraph>
                  <strong>Uw dienst is succesvol geregistreerd!</strong>
                </Paragraph>
                <Paragraph>
                  De dienst {dienst.naam || 'Onbekende dienst'} en de geselecteerde
                  producten, applicaties en koppelingen zijn opgeslagen in de
                  catalogus.
                </Paragraph>
              </Alert>
              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <UnorderedList>
                  <UnorderedListItem>
                    De dienst wordt zichtbaar in de software catalogus
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Organisaties kunnen de dienst bekijken en beoordelen
                  </UnorderedListItem>
                  <UnorderedListItem>
                    U kunt de dienst beheren via het beheer dashboard
                  </UnorderedListItem>
                  <UnorderedListItem>
                    Eventuele wijzigingen kunnen later worden aangebracht
                  </UnorderedListItem>
                </UnorderedList>
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                <AcButton
                  style='button'
                  icon={<VISUALS.HOUSE />}
                  onClick={() => (window.location.href = '/beheer')}
                >
                  Terug naar beheer dashboard
                </AcButton>
                <AcButton
                  style='button'
                  variant='secondary'
                  icon={<VISUALS.HAND_SHAKE />}
                  onClick={() => {
                    setSaveResult(null);
                    setCurrentStep(0);
                    window.location.reload();
                  }}
                  sx={{ marginLeft: '1rem' }}
                >
                  Nieuwe dienst aanmelden
                </AcButton>
              </div>
            </div>
          ) : (
            <>
              <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
                {currentStepName(currentStep)}
              </h3>
              <div className='ac-register-container ac-forms-product'>
                <div ref={processStepsRef} className='ac-register-process-steps'>
                  <ProcessSteps
                    steps={[
                      {
                        id: 'grp-soort-dienst',
                        marker: 1,
                        status:
                          currentStep >= 0 && currentStep <= 1
                            ? 'current'
                            : currentStep < 0
                            ? 'not-checked'
                            : 'checked',
                        title: 'Soort dienst',
                        steps: [
                          {
                            id: 'stg-producten',
                            status: getStatus(currentStep, 1),
                            title: 'Producten',
                          },
                        ],
                      },
                      {
                        id: 'grp-dienst-informatie',
                        marker: 2,
                        status:
                          currentStep >= 2 && currentStep <= 4
                            ? 'current'
                            : currentStep < 2
                            ? 'not-checked'
                            : 'checked',
                        title: 'Dienst informatie',
                        steps: [
                          {
                            id: 'stg-apps',
                            status: getStatus(currentStep, 3),
                            title: 'Applicaties',
                          },
                          {
                            id: 'stg-koppelingen',
                            status: getStatus(currentStep, 4),
                            title: 'Koppelingen',
                          },
                        ],
                      },
                      {
                        id: 'grp-review',
                        marker: 3,
                        status: getStatus(currentStep, 5),
                        title: 'Controleren',
                      },
                    ]}
                  />
                </div>

                <div className='ac-register-form-container'>
                  {process.env.NODE_ENV === 'development' && (
                    <div
                      style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <details>
                        <summary
                          style={{
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                          }}
                        >
                          🐛 Debug: Dienst Object (Click to expand)
                        </summary>
                        <pre
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '300px',
                            overflow: 'auto',
                            backgroundColor: '#ffffff',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                          }}
                        >
                          {JSON.stringify(dienst, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {saveResult === 'error' && (
                    <Alert type='error'>
                      Er is een fout opgetreden bij het opslaan.
                    </Alert>
                  )}

                  {renderStep(currentStep)}

                  <div
                    className={clsx(
                      'ac-register-form-buttons',
                      currentStep !== 0 && 'ac-register-form-buttons-not-first-step'
                    )}
                  >
                    {currentStep !== 0 && (
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.ARROW_LEFT />}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        disabled={saving || schemasLoading}
                      >
                        Vorige
                      </AcButton>
                    )}

                    {currentStep !== 5 && (
                      <div className='ac-register-button-wrapper'>
                        <AcButton
                          style='button'
                          className={clsx(
                            currentStep === 0 && 'ac-register-form-next-button'
                          )}
                          icon={<VISUALS.ARROW_RIGHT />}
                          onClick={() => setCurrentStep(currentStep + 1)}
                          disabled={
                            getDisabledStatus(currentStep) ||
                            saving ||
                            schemasLoading
                          }
                          title={
                            getDisabledStatus(currentStep)
                              ? getDisabledTooltip(currentStep)
                              : ''
                          }
                        >
                          Volgende
                        </AcButton>
                      </div>
                    )}

                    {currentStep === 5 && (
                      <AcButton
                        style='button'
                        buttonType='primary'
                        icon={<VISUALS.CLIPBOARD_CHECK />}
                        onClick={handleSaveDienst}
                        loading={saving}
                        disabled={saving}
                      >
                        {saving ? 'Bezig met opslaan...' : 'Dienst aanmelden'}
                      </AcButton>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default memo(withStore(observer(ConFormsDienst)));
