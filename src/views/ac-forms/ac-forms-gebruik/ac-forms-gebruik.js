import { useState, useEffect, memo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { createDefaultFormObject } from '@src/utilities/schema-object-factory';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import {
  Heading1,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import ConGebruikStepSoort from './components/con-gebruik-step-soort';
import ConGebruikStepInformatie from './components/con-gebruik-step-informatie';
import ConGebruikStepProductApplicatie from './components/con-gebruik-step-product-applicatie';
import ConGebruikStepVersie from './components/con-gebruik-step-versie';
import ConGebruikStepKoppelingen from './components/con-gebruik-step-koppelingen';
import ConGebruikStepDiensten from './components/con-gebruik-step-diensten';
import ConGebruikStepReview from './components/con-gebruik-step-review';
import ConGebruikStepDeelnemers from './components/con-gebruik-step-deelnemers';

const mapToOption = (item, index) => {
  const label =
    item?.['@self']?.name ||
    item?.naam ||
    item?.name ||
    item?.title ||
    item?.label ||
    `Applicatie ${index + 1}`;
  const value = item?.id || item?.slug || label;
  return { value: String(value), label: String(label), data: item };
};

const AcFormsGebruik = ({ store }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Submission state management (following product wizard pattern)
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [error, setError] = useState({ message: null, errors: null });

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '.denhaag-process-steps .denhaag-process-steps__step'
      );

      stepElements.forEach((stepEl, index) => {
        stepEl.style.cursor = '';
        stepEl.onclick = null;
        stepEl.classList.remove('ac-step-clickable');

        if (index < currentStep) {
          stepEl.classList.add('ac-step-clickable');
          stepEl.onclick = (e) => {
            e.preventDefault();
            setCurrentStep(index);
          };
        }
      });
    };

    const timeoutId = setTimeout(addClickHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  // Schema management
  const [schemas, setSchemas] = useState({});
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Gebruik object based on schema
  const [gebruik, setGebruik] = useState({});
  // Single source of truth updater
  const setGebruikData = (key, value) =>
    setGebruik((prev) => ({ ...prev, [key]: value }));

  // Usage type selection state
  const [gebruikType, setGebruikType] = useState(null); // 'eigen-organisatie' or 'andere-organisatie'

  // Clear certain fields when gebruikType changes to 'andere-organisatie'
  useEffect(() => {
    if (gebruikType === 'andere-organisatie') {
      // Voor andere organisatie gebruik hoeven contactpersoon en referentiecomponenten niet getoond te worden
      // We wissen deze velden om verwarring te voorkomen
      setGebruikData('contactpersoon', '');
      setGebruikData('gebruiktVoorReferentiecomponenten', []);
    }
  }, [gebruikType]);

  // Options state (UI-only)
  const [productOptions, setProductOptions] = useState([]);
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [dienstOptions] = useState([
    {
      value: 'Functioneel beheer',
      label: 'Functioneel beheer: ondersteuning bij dagelijks gebruik en inrichting',
    },
    {
      value: 'Technisch beheer',
      label: 'Technisch beheer: installatie, updates en systeembeheer.',
    },
    { value: 'Training', label: 'Training: gebruikers- of beheerdersopleiding.' },
    {
      value: 'Implementatie-ondersteuning',
      label: 'Implementatie-ondersteuning: hulp bij implementatie en adoptie.',
    },
  ]);

  // Deelnemers (organisaties) options
  const [organisatieOptions, setOrganisatieOptions] = useState([]);

  // Versies
  const [versionOptions, setVersionOptions] = useState([]);

  // Referentiecomponenten
  const [refCompOptions, setRefCompOptions] = useState([]);

  // Fetch schemas on component mount
  useEffect(() => {
    const fetchSchemaAndInit = async () => {
      try {
        const response = await fetch('/api/apps/openregister/api/schemas/gebruik');
        if (response.ok) {
          const gebruikSchema = await response.json();
          const defaultGebruik = createDefaultFormObject(
            store,
            gebruikSchema,
            'gebruik',
            { status: 'Verwerving' }
          );
          setGebruik(defaultGebruik);
          setSchemas({ gebruik: gebruikSchema });
          setSchemasLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch schemas for gebruik form:', error);
        setSchemas({});
        setSchemasLoading(false);
      }
    };
    fetchSchemaAndInit();
  }, [store]);

  // Prefill afnemer from active organization (if present)
  useEffect(() => {
    const org = store?.userStore?.activeOrganization;
    if (org) setGebruikData('afnemer', org);
  }, [store?.userStore?.activeOrganization]);

  // Preload all slow API calls at component mount (hotloading like in product form)
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        // Use authenticated API client instead of raw fetch
        await store.object.fetchCollection('voorzieningen', 'product', { 
          _limit: '50', 
          _page: '1', 
          _extend: '@self.schema' 
        });
        const collection = store.object.getCollection('voorzieningen_product');
        const list = collection?.results || collection || [];
        const options = list.map(mapToOption);
        if (isMounted) setProductOptions(options);
      } catch (e) {
        if (isMounted) setProductOptions([]);
      }
    };

    const fetchModules = async () => {
      try {
        // Use authenticated API client instead of raw fetch
        await store.object.fetchCollection('voorzieningen', 'module', { 
          _limit: '50', 
          _page: '1', 
          _extend: '@self.schema' 
        });
        const collection = store.object.getCollection('voorzieningen_module');
        const list = collection?.results || collection || [];
        const options = list.map(mapToOption);
        if (isMounted) setModulesOptions(options);
      } catch (e) {
        if (isMounted) setModulesOptions([]);
      }
    };

    const fetchOrganisaties = async () => {
      try {
        // Use authenticated API client instead of raw fetch
        await store.object.fetchCollection('voorzieningen', 'organisatie', { 
          _limit: '50', 
          _page: '1', 
          _extend: '@self.schema' 
        });
        const collection = store.object.getCollection('voorzieningen_organisatie');
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            item?.['@self']?.name ||
            item?.naam ||
            item?.name ||
            item?.title ||
            `Organisatie ${index + 1}`;
          const value = item?.id || item?.slug || label;
          return { value: String(value), label: String(label), data: item };
        });
        if (isMounted) setOrganisatieOptions(options);
      } catch (e) {
        if (isMounted) setOrganisatieOptions([]);
      }
    };

    const fetchRefComps = async () => {
      try {
        // Use authenticated API client instead of raw fetch
        await store.object.fetchCollection('vng-gemma', 'element', { 
          _limit: '500', 
          _page: '1', 
          gemmaType: 'Referentiecomponent' 
        });
        const collection = store.object.getCollection('vng-gemma_element');
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            item?.xml?.name?._value ||
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            `Component ${index + 1}`;
          const value = item?.value || item?.id || item?.slug || label;
          return { value: String(value), label: String(label) };
        });
        if (isMounted) setRefCompOptions(options);
      } catch (e) {
        if (isMounted) setRefCompOptions([]);
      }
    };

    // Preload all APIs in parallel for better performance
    fetchProducts();
    fetchModules();
    fetchOrganisaties();
    fetchRefComps();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // When product changes, filter preloaded modules (no additional API calls needed)
  useEffect(() => {
    const p = gebruik?.product;
    if (!p) {
      setModulesOptions([]);
      setGebruikData('module', null);
      return;
    }
    
    // Filter preloaded modules based on product selection
    // Since modules are now preloaded, we can use them directly instead of making API calls
    const searchLabel = p?.naam || p?.name || p?.title;
    if (searchLabel && modulesOptions.length > 0) {
      // Filter modules that match the product name
      const filteredOptions = modulesOptions.filter(option => {
        const moduleLabel = option.label?.toLowerCase() || '';
        const productLabel = searchLabel.toLowerCase();
        return moduleLabel.includes(productLabel) || productLabel.includes(moduleLabel);
      });
      
      if (filteredOptions.length > 0) {
        // Use filtered options if we found matches
        setModulesOptions(filteredOptions);
        if (filteredOptions.length === 1) {
          setGebruikData('module', filteredOptions[0].data || filteredOptions[0]);
        }
      }
      // If no specific matches found, keep all preloaded modules available
    }
  }, [gebruik?.product, modulesOptions]);

  // Server-side search for modules
  const searchModules = async (query) => {
    try {
      setModulesLoading(true);
      const q = String(query || '').trim();
      if (!q) {
        setModulesOptions([]);
        return;
      }
      // Use authenticated API client instead of raw fetch
      await store.object.fetchCollection('voorzieningen', 'module', { 
        _limit: '50', 
        _page: '1', 
        _search: q 
      });
      const collection = store.object.getCollection('voorzieningen_module');
      const list = collection?.results || collection || [];
      const options = list.map(mapToOption);
      setModulesOptions(options);
    } catch (e) {
      setModulesOptions([]);
    } finally {
      setModulesLoading(false);
    }
  };

  // When module changes, fetch versions (and later koppelingen/diensten)
  useEffect(() => {
    const fetchVersions = async () => {
      setVersionsLoading(true);
      try {
        setVersionOptions([]);
        if (!gebruik?.module) return;

        // Fetch module versions via the dedicated endpoint with pagination
        // Filter by relation @self.relations.module; fallback to client-side filtering
        const moduleId = gebruik?.module;
        const limit = 20;
        let page = 1;
        let allItems = [];
        let hasMore = true;

        // Helper to build URL with optional relation filter param
        const buildUrl = (pageNum, relationKey) => {
          const url = new URL(
            '/api/apps/openregister/api/objects/voorzieningen/moduleversie',
            window.location.origin
          );
          url.searchParams.set('_limit', String(limit));
          url.searchParams.set('_page', String(pageNum));
          url.searchParams.set('_extend', '@self.schema,@self.relations');
          if (relationKey) {
            url.searchParams.set(relationKey, moduleId);
          }
          return url.toString();
        };

        // Try relation keys that include @self.relations.module
        const relationKeysToTry = ['@self.relations.module'];
        let fetchedWithServerFilter = false;

        for (const relationKey of relationKeysToTry) {
          page = 1;
          allItems = [];
          hasMore = true;

          while (hasMore && page <= 10) {
            const res = await fetch(buildUrl(page, relationKey), {
              headers: { Accept: 'application/json' },
            });
            if (!res.ok) {
              allItems = [];
              break;
            }
            const data = await res.json();
            const list = data?.results;

            allItems = allItems.concat(list);
            hasMore = !!data?.next;
            page += 1;
          }

          if (allItems.length > 0) {
            fetchedWithServerFilter = true;
            break;
          }
        }

        // If server-side filter yielded nothing, fetch without filter and filter client-side
        if (!fetchedWithServerFilter) {
          page = 1;
          allItems = [];
          hasMore = true;
          while (hasMore && page <= 10) {
            const res = await fetch(buildUrl(page, null), {
              headers: { Accept: 'application/json' },
            });
            if (!res.ok) break;
            const data = await res.json();
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data?.results)
              ? data.results
              : [];
            allItems = allItems.concat(list);
            hasMore = list.length === limit;
            page += 1;
          }

          // Client-side filter by @self.relations.module common shapes
          allItems = allItems.filter((v) => {
            const rel = v?.['@self']?.relations?.module || v?.module;
            if (!rel) return false;
            const relId =
              (typeof rel === 'string' && rel) ||
              rel?.id ||
              rel?.['@self']?.id ||
              rel?.value;
            return String(relId) === moduleId;
          });
        }

        const options = allItems.map((v) => {
          const label =
            v?.['@self']?.name ||
            v?.nummer ||
            v?.version ||
            v?.naam ||
            v?.label ||
            v?.title ||
            v?.semanticVersion ||
            v?.versie ||
            v?.id;
          const value =
            v?.id || v?.nummer || v?.version || v?.versie || String(label);
          return { value: String(value), label: String(label) };
        });

        setVersionOptions(options);
      } catch {
        setVersionOptions([]);
      } finally {
        setVersionsLoading(false);
      }
    };
    fetchVersions();
  }, [gebruik?.module]);

  // When module changes, fetch koppelingen options using _search on module label
  useEffect(() => {
    const fetchKoppelingen = async () => {
      try {
        const modId = gebruik?.module;
        const mod = modulesOptions.find((m) => m.value === modId)?.data;
        if (!mod) {
          setKoppelingOptions([]);
          return;
        }
        const searchLabel = mod?.naam || mod?.name || mod?.title;
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
        if (searchLabel) params.set('_search', searchLabel);
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
        const options = list.map((item, index) => {
          const appA =
            item?.applicatie1 ||
            item?.applicatieA ||
            item?.moduleA ||
            item?.bronApplicatie ||
            item?.source ||
            item?.naam ||
            `A${index + 1}`;
          const appB =
            item?.applicatie2 ||
            item?.applicatieB ||
            item?.moduleB ||
            item?.doelApplicatie ||
            item?.target ||
            item?.naam ||
            `B${index + 1}`;

          const direction = item?.gegevensuitwisselingRichting;
          const arrow = direction === 'AnaarB' ? '→' : direction === 'BnaarA' ? '←' : '↔';
          const label = `${appA} ${arrow} ${appB}`;
          const value = item?.value || item?.id || label;
          return { value: String(value), label: String(label) };
        });
        setKoppelingOptions(options);
      } catch (e) {
        setKoppelingOptions([]);
      }
    };
    fetchKoppelingen();
  }, [gebruik?.module]);

  // When afnemer is samenwerking, organisaties are already preloaded - no additional API calls needed
  useEffect(() => {
    // Organisaties are now preloaded at component mount, so we don't need conditional fetching
    // The preloaded organisatie options are always available for both afnemer selection and deelnemers
    if (!isAfnemerSamenwerking()) {
      // Keep organisatie options available as they're also used for afnemer selection
      // No need to clear them as they're useful for the afnemer field
    }
  }, [gebruik?.afnemer]);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const isAfnemerSamenwerking = () => {
    const type = gebruik?.afnemer?.organisatieType || gebruik?.afnemer?.type || '';
    return String(type).toLowerCase() === 'samenwerking';
  };

  // Submission handler (following product wizard pattern)
  const handleRegister = async () => {
    setLoading(true);
    try {
      // Strip any local IDs and prepare data for submission
      const gebruikData = {
        ...gebruik,
        // Ensure required fields are properly set
        contactpersoon: gebruik?.contactpersoon,
        afnemer: gebruik?.afnemer,
        product: gebruik?.product,
        module: gebruik?.module,
        moduleVersie: gebruik?.moduleVersie,
        status: gebruik?.status || 'Verwerving',
        // Include usage type for processing
        gebruikType: gebruikType,
      };

      // Submit to the gebruik endpoint using the object store
      await store.object.createObject('voorzieningen', 'gebruik', gebruikData);

      // On success, show success page
      setRegisterCallBack('success');
    } catch (err) {
      setRegisterCallBack('error');
      setError({
        message: 'Er is een fout opgetreden bij het registreren van het gebruik.',
        errors: null,
      });
      console.error('Gebruik registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = (() => {
    const base = [
      'Soort gebruik',
      'Gebruik informatie',
      'Product en applicatie',
      'Versie',
      'Koppelingen',
      'Diensten',
    ];
    if (isAfnemerSamenwerking()) base.push('Deelnemers');
    base.push('Controleren');
    return base;
  })();

  const canGoNext = () => {
    if (currentStep === 0) {
      return !!gebruikType; // Must select usage type
    }
    if (currentStep === 1) {
      // Gebruik informatie step - contactpersoon required for eigen organisatie only
      if (gebruikType === 'andere-organisatie') {
        // For andere organisatie: only afnemer and status required
        return !!gebruik?.afnemer && !!gebruik?.status;
      } else {
        // For eigen organisatie: contactpersoon, afnemer and status required
        return !!gebruik?.contactpersoon && !!gebruik?.afnemer && !!gebruik?.status;
      }
    }
    if (currentStep === 2) {
      return !!gebruik?.module; // Product en applicatie step
    }
    if (currentStep === 3) {
      return !!gebruik?.moduleVersie && !versionsLoading; // Versie step
    }
    if (currentStep === 4) {
      return true; // koppelingen optional
    }
    if (currentStep === 5) {
      return true; // diensten optional
    }
    if (currentStep === 6 && isAfnemerSamenwerking()) {
      return true; // deelnemers optional
    }
    return false;
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ConGebruikStepSoort
            gebruikType={gebruikType}
            setGebruikType={setGebruikType}
            loading={loading}
            gebruik={gebruik}
          />
        );
      case 1:
        return (
          <ConGebruikStepInformatie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            loading={loading}
            refCompOptions={refCompOptions}
            organisatieOptions={organisatieOptions}
            schemas={schemas}
            schemasLoading={schemasLoading}
            gebruikType={gebruikType}
          />
        );
      case 2:
        return (
          <ConGebruikStepProductApplicatie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            productOptions={productOptions}
            moduleOptions={modulesOptions}
            modulesLoading={modulesLoading}
            searchModules={searchModules}
            loading={loading}
            schemas={schemas}
            gebruikType={gebruikType}
          />
        );
      case 3:
        return (
          <ConGebruikStepVersie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            versionOptions={versionOptions}
            versionsLoading={versionsLoading}
            schemas={schemas}
          />
        );
      case 4:
        return (
          <ConGebruikStepKoppelingen
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            koppelingOptions={koppelingOptions}
            schemas={schemas}
          />
        );
      case 5:
        return (
          <ConGebruikStepDiensten
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            dienstOptions={dienstOptions}
            schemas={schemas}
          />
        );
      case 6:
        if (isAfnemerSamenwerking()) {
          return (
            <ConGebruikStepDeelnemers
              gebruik={gebruik}
              setGebruikData={setGebruikData}
              organisatieOptions={organisatieOptions}
              schemas={schemas}
            />
          );
        }
      // fall through to review if not samenwerking
      default:
        return (
          <ConGebruikStepReview
            gebruik={gebruik}
            versionOptions={versionOptions}
            refCompOptions={refCompOptions}
            koppelingOptions={koppelingOptions}
            dienstOptions={dienstOptions}
            organisatieOptions={organisatieOptions}
            productOptions={productOptions}
            moduleOptions={modulesOptions}
          />
        );
    }
  };

  const currentStepName = (step) => stepsList[step] || '';

  // Determine page title based on gebruik type
  const getPageTitle = () => {
    if (gebruikType === 'eigen-organisatie') {
      return 'Gebruik Aanmelden voor eigen organisatie';
    }
    if (gebruikType === 'andere-organisatie') {
      return 'Gebruik Aanmelden voor andere organisatie';
    }
    return 'Gebruik Aanmelden';
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          {/* Main form - only show when not in success/error state */}
          {!registerCallBack && (
            <>
              <div>
                <Heading1>{getPageTitle()}</Heading1>
                <Paragraph>
                  Selecteer een applicatie, vul aanvullende informatie aan en
                  controleer uw invoer.
                </Paragraph>
              </div>

              <div>
                <h3
                  className={clsx('utrecht-heading-3', 'ac-register-form-heading')}
                >
                  {currentStepName(currentStep)}
                </h3>

                <div className='ac-register-container ac-forms-product'>
                  <div ref={processStepsRef} className='ac-register-process-steps'>
                    <ProcessSteps
                      steps={stepsList.map((title, index) => ({
                        id: `step-${index}`,
                        marker: index + 1,
                        status: getStatus(currentStep, index),
                        title,
                      }))}
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
                            🐛 Debug: Gebruik Object (Click to expand)
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
                            {JSON.stringify(gebruik, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}

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
                          buttonType='secondary'
                          onClick={() => setCurrentStep(currentStep - 1)}
                          disabled={loading}
                        >
                          Vorige
                        </AcButton>
                      )}

                      {currentStep !== stepsList.length - 1 && (
                        <div className='ac-register-button-wrapper'>
                          <AcButton
                            style='button'
                            className={clsx(
                              currentStep === 0 && 'ac-register-form-next-button'
                            )}
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={!canGoNext() || loading}
                          >
                            Volgende
                          </AcButton>
                        </div>
                      )}

                      {currentStep === stepsList.length - 1 && (
                        <AcButton
                          style='button'
                          buttonType='primary'
                          onClick={handleRegister}
                          loading={loading}
                          disabled={loading}
                        >
                          Gebruik registreren
                        </AcButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error Display */}
          {registerCallBack === 'error' && error.message && (
            <div>
              <Heading1>❌ Registratie mislukt</Heading1>
              <div style={{ marginTop: '1rem' }}>
                <div className='utrecht-alert utrecht-alert--error'>
                  <Paragraph>{error.message}</Paragraph>
                  {error.errors && (
                    <ul>
                      {Object.entries(error.errors).map(([field, messages]) => (
                        <li key={field}>
                          <strong>{field}:</strong>{' '}
                          {Array.isArray(messages) ? messages.join(', ') : messages}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <AcButton
                    style='button'
                    onClick={() => {
                      setRegisterCallBack(null);
                      setError({ message: null, errors: null });
                    }}
                  >
                    Probeer opnieuw
                  </AcButton>
                </div>
              </div>
            </div>
          )}

          {/* Success Page */}
          {registerCallBack === 'success' && (
            <div>
              <Heading1>🎉 Gebruik succesvol geregistreerd!</Heading1>

              <div style={{ marginTop: '1rem' }}>
                <div className='utrecht-alert utrecht-alert--success'>
                  <div className='utrecht-alert__content'>
                    <Paragraph>
                      <strong>Uw gebruik is succesvol geregistreerd!</strong>
                    </Paragraph>
                    <Paragraph>
                      Het gebruik van{' '}
                      {gebruik?.product?.naam ||
                        gebruik?.module?.naam ||
                        'het geselecteerde product'}
                      {gebruikType === 'eigen-organisatie'
                        ? ` door uw organisatie`
                        : ` door ${
                            gebruik?.afnemer?.naam || 'de geselecteerde organisatie'
                          }`}{' '}
                      is opgeslagen in de software catalogus.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '0.9rem', color: '#666' }}>
                      Type registratie:{' '}
                      {gebruikType === 'eigen-organisatie'
                        ? 'Gebruik voor eigen organisatie'
                        : 'Gebruik voor andere organisatie (klant)'}
                    </Paragraph>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Paragraph>
                  <strong>Wat gebeurt er nu?</strong>
                </Paragraph>
                <ul className='utrecht-unordered-list'>
                  {gebruikType === 'eigen-organisatie' ? (
                    <>
                      <li>Het gebruik wordt zichtbaar in de software catalogus</li>
                      <li>
                        Andere organisaties kunnen zien welke producten u gebruikt
                      </li>
                      <li>
                        Dit helpt bij het delen van ervaringen en best practices
                      </li>
                      <li>U kunt het gebruik beheren via het beheer dashboard</li>
                    </>
                  ) : (
                    <>
                      <li>
                        De klantorganisatie wordt geïnformeerd over deze registratie
                      </li>
                      <li>
                        De klant moet het gebruik goedkeuren voordat het definitief
                        wordt
                      </li>
                      <li>
                        Na goedkeuring wordt het gebruik zichtbaar in de catalogus
                      </li>
                      <li>U kunt het gebruik beheren via het beheer dashboard</li>
                    </>
                  )}
                  <li>Eventuele wijzigingen kunnen later worden aangebracht</li>
                </ul>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                <AcButton
                  style='button'
                  onClick={() => (window.location.href = '/beheer')}
                >
                  Terug naar beheer dashboard
                </AcButton>

                <AcButton
                  style='button'
                  buttonType='secondary'
                  onClick={() => {
                    setRegisterCallBack(null);
                    setCurrentStep(0);
                    // Reset form for new registration
                    window.location.reload();
                  }}
                >
                  Nieuw gebruik registreren
                </AcButton>
              </div>
            </div>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default memo(withStore(observer(AcFormsGebruik)));
