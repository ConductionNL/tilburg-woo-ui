import { useState, useEffect, memo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import {
  Heading1,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';

// Stage components
import ConFormDienstInformatieStage from './components/con-form-dienst-informatie-stage';
import ConFormDienstopbouwStage from './components/con-form-dienstopbouw-stage';
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

  const setDienstData = (key, value) => {
    setDienst((prev) => ({ ...prev, [key]: value }));
  };

  // Options/state
  const [productOptions, setProductOptions] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

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
  useEffect(() => {
    if (userStore?.activeOrganization && !dienst.aanbieder) {
      setDienstData(
        'aanbieder',
        userStore.activeOrganization.uuid ||
          userStore.activeOrganization.id ||
          userStore.activeOrganization.slug ||
          ''
      );
    }
  }, [userStore?.activeOrganization, dienst.aanbieder]);

  // Search/fetch products
  const performProductsSearch = async (term = '') => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({ _limit: '20', _page: '1' });
      if (term && term.trim()) params.set('_search', term.trim());
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
      setProductOptions(mapped);
    } catch {
      setProductOptions([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    performProductsSearch('');
  }, []);

  // When products selected, fetch their modules to build lookup
  useEffect(() => {
    let cancelled = false;
    const loadModulesForProducts = async () => {
      const lookup = {};
      for (const prodId of selectedProductIds) {
        try {
          // Fetch product details to find modules inside
          const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product/${prodId}`;
          const res = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const item = await res.json();
          const modules = Array.isArray(item?.modules) ? item.modules : [];
          lookup[prodId] = modules
            .map((m, idx) => {
              const id = String(m?.id || m?.value || m);
              const label = String(
                m?.naam || m?.name || m?.title || `Applicatie ${idx + 1}`
              );
              return { value: id, label, data: m };
            })
            .filter((o) => o.value && o.label);
        } catch {
          lookup[prodId] = [];
        }
      }
      if (!cancelled) setProductToModulesLookup(lookup);
    };
    if (selectedProductIds.length) loadModulesForProducts();
    else setProductToModulesLookup({});
    return () => {
      cancelled = true;
    };
  }, [selectedProductIds]);

  // Load koppelingen options broadly (we will filter by selectedModuleIds in the stage)
  useEffect(() => {
    const loadKoppelingen = async () => {
      try {
        const params = new URLSearchParams({ _limit: '20', _page: '1' });
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/koppeling?${params}`;
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
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
            item?.naam || `${item?.moduleA || '-'} ↔ ${item?.moduleB || '-'}`
          ),
          data: item,
        }));
        setKoppelingOptions(mapped);
      } catch {
        setKoppelingOptions([]);
      }
    };
    loadKoppelingen();
  }, []);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return <ConFormDienstopbouwStage />;
      case 1:
        return (
          <ConFormDienstInformatieStage
            dienst={dienst}
            setDienstData={setDienstData}
            loading={schemasLoading}
            touched={{}}
            schemas={schemas}
            userStore={userStore}
          />
        );
      case 2:
        return (
          <ConFormProductenStage
            selectedProductIds={selectedProductIds}
            setSelectedProductIds={setSelectedProductIds}
            productOptions={productOptions}
            productsLoading={productsLoading}
            searchProducts={performProductsSearch}
          />
        );
      case 3:
        return (
          <ConFormApplicatiesStage
            productToModulesLookup={productToModulesLookup}
            selectedProductIds={selectedProductIds}
            selectedModuleIds={selectedModuleIds}
            setSelectedModuleIds={setSelectedModuleIds}
          />
        );
      case 4:
        return (
          <ConFormKoppelingenStage
            selectedModuleIds={selectedModuleIds}
            koppelingOptions={koppelingOptions}
            selectedKoppelingIds={selectedKoppelingIds}
            setSelectedKoppelingIds={setSelectedKoppelingIds}
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
          />
        );
      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      case 0:
        return 'Informatie';
      case 1:
        return 'Dienst informatie';
      case 2:
        return 'Producten';
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

  const isNextDisabled = () => {
    if (currentStep === 1) {
      return !dienst.naam?.trim() || !dienst.aanbieder;
    }
    if (currentStep === 2) {
      return selectedProductIds.length === 0;
    }
    if (currentStep === 3) {
      return selectedModuleIds.length === 0;
    }
    return false;
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
            <Heading1>Dienst Aanmelden</Heading1>
            <Paragraph>
              Voer de gegevens van de dienst in, selecteer relevante producten,
              applicaties en koppelingen en controleer uw invoer.
            </Paragraph>
          </div>

          <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
            {currentStepName(currentStep)}
          </h3>

          <div className='ac-register-container ac-forms-product'>
            <div ref={processStepsRef} className='ac-register-process-steps'>
              <ProcessSteps
                steps={[
                  {
                    id: 'grp-dienst',
                    marker: 1,
                    status:
                      currentStep >= 0 && currentStep <= 3
                        ? 'current'
                        : currentStep < 0
                        ? 'not-checked'
                        : 'checked',
                    title: 'Informatie',
                    steps: [
                      {
                        id: 'stg-dienst-info',
                        status: getStatus(currentStep, 1),
                        title: 'Dienst informatie',
                      },
                      {
                        id: 'stg-producten',
                        status: getStatus(currentStep, 2),
                        title: 'Producten',
                      },
                      {
                        id: 'stg-apps',
                        status: getStatus(currentStep, 3),
                        title: 'Applicaties',
                      },
                    ],
                  },
                  {
                    id: 'grp-koppelingen',
                    marker: 2,
                    status: getStatus(currentStep, 4),
                    title: 'Koppelingen',
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
              {saveResult === 'success' && (
                <Alert type='success'>De dienst is succesvol aangemeld.</Alert>
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
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={saving || schemasLoading}
                  >
                    Vorige
                  </AcButton>
                )}

                {currentStep !== 4 && (
                  <div className='ac-register-button-wrapper'>
                    <AcButton
                      style='button'
                      className={clsx(
                        currentStep === 0 && 'ac-register-form-next-button'
                      )}
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={isNextDisabled() || saving || schemasLoading}
                    >
                      Volgende
                    </AcButton>
                  </div>
                )}

                {currentStep === 4 && (
                  <AcButton
                    style='button'
                    buttonType='primary'
                    onClick={handleSaveDienst}
                    disabled={saving}
                  >
                    {saving ? 'Bezig met opslaan...' : 'Opslaan'}
                  </AcButton>
                )}
              </div>
            </div>
          </div>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default memo(withStore(observer(ConFormsDienst)));
