import { useState, useEffect, memo, useRef } from 'react';
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

  const [touched, setTouched] = useState({});

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
      // Always include currently selected options so selected values remain available
      const selectedById = new Set(
        (selectedProductOptions || []).map((o) => o.value)
      );
      const merged = [
        ...(selectedProductOptions || []),
        ...mapped.filter((o) => !selectedById.has(o.value)),
      ];
      setProductOptions(merged);
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
      const labels = {};
      for (const prodId of selectedProductIds) {
        try {
          // Fetch product details to find modules inside
          const params = new URLSearchParams({ extend: 'modules' });
          const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product/${prodId}?${params}`;
          const res = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const item = await res.json();
          // Capture product label for display
          const prodLabel = String(
            item?.naam || item?.name || item?.title || item?.label || prodId
          );
          labels[prodId] = prodLabel;
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
          <ConFormDienstopbouwStage
            setDienstData={setDienstData}
            userStore={userStore}
          />
        );
      case 1:
        return (
          <ConFormDienstInformatieStage
            dienst={dienst}
            setDienstData={setDienstData}
            loading={schemasLoading}
            touched={touched}
            schemas={schemas}
            userStore={userStore}
          />
        );
      case 2:
        return (
          <ConFormProductenStage
            selectedProductIds={selectedProductIds}
            setSelectedProductIds={setSelectedProductIds}
            setSelectedProductOptions={setSelectedProductOptions}
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
            selectedProductOptions={selectedProductOptions}
            productOptions={productOptions}
            productLabels={productLabels}
            selectedModuleIds={selectedModuleIds}
            setSelectedModuleIds={setSelectedModuleIds}
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
    if (step === 1) {
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
    if (step === 2) {
      // Producten: at least one product selected
      return selectedProductIds.length === 0;
    }
    if (step === 3) {
      // Applicaties: at least one module selected
      return selectedModuleIds.length === 0;
    }
    // Koppelingen: no strict validation (optional)
    return false;
  };

  const getDisabledTooltip = (step) => {
    if (step === 1) {
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
    if (step === 2) {
      return selectedProductIds.length === 0 ? 'Selecteer minimaal één product' : '';
    }
    if (step === 3) {
      return selectedModuleIds.length === 0
        ? 'Selecteer minimaal één applicatie'
        : '';
    }
    return '';
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
