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
import ConGebruikStepInformatie from './components/con-gebruik-step-informatie';
import ConGebruikStepProductApplicatie from './components/con-gebruik-step-product-applicatie';
import ConGebruikStepVersie from './components/con-gebruik-step-versie';
import ConGebruikStepKoppelingen from './components/con-gebruik-step-koppelingen';
import ConGebruikStepDiensten from './components/con-gebruik-step-diensten';
import ConGebruikStepReview from './components/con-gebruik-step-review';
import ConGebruikStepDeelnemers from './components/con-gebruik-step-deelnemers';

const mapToOption = (item, index) => {
  const label =
    item?.naam ||
    item?.name ||
    item?.title ||
    item?.label ||
    `Applicatie ${index + 1}`;
  const value = item?.value || item?.id || item?.slug || label;
  return { value: String(value), label: String(label), data: item };
};

const AcFormsGebruik = ({ store }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;

    const addClickHandlers = () => {
      const stepElements = processStepsRef.current.querySelectorAll(
        '[class*="process-step"], [role="button"], [role="tab"], .step'
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

  // Options state (UI-only)
  const [productOptions, setProductOptions] = useState([]);
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [dienstOptions, setDienstOptions] = useState([
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

  // Fetch product and referentiecomponenten options on mount
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/product?${params}`;
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
        const options = list.map(mapToOption);
        if (isMounted) setProductOptions(options);
      } catch (e) {
        if (isMounted) setProductOptions([]);
      }
    };

    const fetchRefComps = async () => {
      try {
        const params = new URLSearchParams({ _limit: '500', _page: '1' });
        params.set('gemmaType', 'Referentiecomponent');
        const endpoint = `${BASE_URL}/openregister/api/objects/vng-gemma/element?${params}`;
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

    fetchProducts();
    fetchRefComps();
    return () => {
      isMounted = false;
    };
  }, []);

  // When product changes, fetch modules
  useEffect(() => {
    const fetchModulesForProduct = async () => {
      try {
        setModulesOptions([]);
        setGebruikData('module', null);
        const p = gebruik?.product;
        if (!p) return;
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
        const searchLabel = p?.naam || p?.name || p?.title;
        if (searchLabel) params.set('_search', searchLabel);
        const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${params}`;
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
        const options = list.map(mapToOption);
        setModulesOptions(options);
        if (options.length === 1)
          setGebruikData('module', options[0].data || options[0]);
      } catch (e) {
        setModulesOptions([]);
      }
    };
    fetchModulesForProduct();
  }, [gebruik?.product]);

  // Server-side search for modules
  const searchModules = async (query) => {
    try {
      setModulesLoading(true);
      const q = String(query || '').trim();
      if (!q) {
        setModulesOptions([]);
        return;
      }
      const params = new URLSearchParams({ _limit: '50', _page: '1' });
      params.set('_search', q);
      const endpoint = `${BASE_URL}/openregister/api/objects/voorzieningen/module?${params}`;
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
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
      setLoading(true);
      try {
        setVersionOptions([]);
        const mod = gebruik?.module;
        if (!mod) return;

        // Fetch module versions via the dedicated endpoint with pagination
        // Filter by relation @self.relations.module; fallback to client-side filtering
        const moduleId = String(mod?.id || mod?.value);
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
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data?.results)
              ? data.results
              : [];

            allItems = allItems.concat(list);
            hasMore = list.length === limit;
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
        setLoading(false);
      }
    };
    fetchVersions();
  }, [gebruik?.module]);

  // When module changes, fetch koppelingen options using _search on module label
  useEffect(() => {
    const fetchKoppelingen = async () => {
      try {
        const mod = gebruik?.module;
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
            `A${index + 1}`;
          const appB =
            item?.applicatie2 ||
            item?.applicatieB ||
            item?.moduleB ||
            item?.doelApplicatie ||
            item?.target ||
            `B${index + 1}`;

          const label = `${appA} ↔ ${appB}`;
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

  // When afnemer is samenwerking, fetch organisaties for deelnemers step
  useEffect(() => {
    const fetchOrganisaties = async () => {
      try {
        if (!isAfnemerSamenwerking()) {
          setOrganisatieOptions([]);
          return;
        }
        const params = new URLSearchParams({ _limit: '100', _page: '1' });
        const endpoint = `${BASE_URL}/openregister/api/objects/organisatie?${params}`;
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
          const label =
            item?.naam || item?.name || item?.title || `Organisatie ${index + 1}`;
          const value = item?.value || item?.id || item?.slug || label;
          return { value: String(value), label: String(label) };
        });
        setOrganisatieOptions(options);
      } catch (e) {
        setOrganisatieOptions([]);
      }
    };
    fetchOrganisaties();
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

  const stepsList = (() => {
    const base = [
      'Informatie',
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
      return !!gebruik?.contactpersoon;
    }
    if (currentStep === 1) {
      return !!(gebruik?.module?.id || gebruik?.module?.value);
    }
    if (currentStep === 2) {
      return !!gebruik?.moduleVersie;
    }
    if (currentStep === 3) {
      return true; // koppelingen optional
    }
    if (currentStep === 4) {
      return true; // diensten optional
    }
    if (currentStep === 5 && isAfnemerSamenwerking()) {
      return true; // deelnemers optional
    }
    return false;
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ConGebruikStepInformatie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            loading={loading}
            refCompOptions={refCompOptions}
            schemas={schemas}
            schemasLoading={schemasLoading}
          />
        );
      case 1:
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
          />
        );
      case 2:
        return (
          <ConGebruikStepVersie
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            versionOptions={versionOptions}
            loading={loading}
            schemas={schemas}
          />
        );
      case 3:
        return (
          <ConGebruikStepKoppelingen
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            koppelingOptions={koppelingOptions}
            schemas={schemas}
          />
        );
      case 4:
        return (
          <ConGebruikStepDiensten
            gebruik={gebruik}
            setGebruikData={setGebruikData}
            dienstOptions={dienstOptions}
            schemas={schemas}
          />
        );
      case 5:
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
          />
        );
    }
  };

  const currentStepName = (step) => stepsList[step] || '';

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <Heading1>Gebruik Aanmelden</Heading1>
            <Paragraph>
              Selecteer een applicatie, vul aanvullende informatie aan en controleer
              uw invoer.
            </Paragraph>
          </div>

          <h3 className={clsx('utrecht-heading-3', 'ac-register-form-heading')}>
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
                  <AcButton style='button' buttonType='primary' disabled>
                    Bevestigen (niet actief)
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

export default memo(withStore(observer(AcFormsGebruik)));
