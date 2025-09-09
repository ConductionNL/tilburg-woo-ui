import { useState, useEffect, memo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { createDefaultFormObject } from '@src/utilities/schema-object-factory';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
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
import { VISUALS } from '@src/constants';

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
  const [searchParams] = useSearchParams();
  const gebruikId = searchParams.get('id') || '';
  const isEditMode = !!gebruikId;
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState(null);

  // Submission state management (following product wizard pattern)
  const [registerCallBack, setRegisterCallBack] = useState(null);
  const [error, setError] = useState({ message: null, errors: null });

  // Ref for ProcessSteps to add click handlers
  const processStepsRef = useRef(null);

  // Add click handlers to steps
  useEffect(() => {
    if (!processStepsRef.current) return;
    if (prefillLoading || prefillError) return;

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
  }, [currentStep, prefillLoading, prefillError]);

  // Helper to extract id string from various API reference shapes
  const getIdString = useCallback((ref) => {
    if (!ref) return '';
    if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
    return (
      String(
        ref.id || ref.value || ref?.['@self']?.id || ref?.['@self']?.value || ''
      ) || ''
    );
  }, []);

  // Map fetched gebruik object into the local state shape expected by this form
  const mapFetchedGebruikToLocalState = useCallback(
    (api) => {
      if (!api || typeof api !== 'object') return {};

      const mapped = {
        id: api.id || api?.['@self']?.id || '',
        status: api.status || 'Verwerving',
        contactpersoon:
          getIdString(
            api.contactpersoon || api?.['@self']?.relations?.contactpersoon
          ) || '',
        // Keep full objects for entities used for labels in UI
        afnemer: api.afnemer || api?.['@self']?.relations?.afnemer || null,
        product: api.product || api?.['@self']?.relations?.product || null,
        // Use string ids for fields used as identifiers in requests
        module:
          getIdString(
            api.module || api.moduleId || api?.['@self']?.relations?.module
          ) || '',
        moduleVersie:
          getIdString(
            api.moduleVersie ||
              api.moduleversie ||
              api?.['@self']?.relations?.moduleVersie
          ) || '',
        gebruiktVoorReferentiecomponenten: Array.isArray(
          api.gebruiktVoorReferentiecomponenten
        )
          ? api.gebruiktVoorReferentiecomponenten.map((x) => getIdString(x) || x)
          : [],
        deelnemers: Array.isArray(api.deelnemers) ? api.deelnemers : [],
        koppelingen: Array.isArray(api.koppelingen)
          ? api.koppelingen.map((k) => getIdString(k) || k)
          : [],
        diensten: Array.isArray(api.diensten)
          ? api.diensten
              .map((d) => getIdString(d))
              .filter((id) => typeof id === 'string' && id !== '')
          : [],
      };

      // Determine gebruikType from API or infer based on afnemer vs active org
      const apiGebruikType = api.gebruikType || api.type || api.soortGebruik;
      if (apiGebruikType) {
        mapped.gebruikType = apiGebruikType;
      } else {
        const activeOrgId = getIdString(store?.user?.activeOrganization);
        const afnemerId = getIdString(mapped.afnemer);
        mapped.gebruikType =
          activeOrgId && afnemerId && activeOrgId !== afnemerId
            ? 'andere-organisatie'
            : 'eigen-organisatie';
      }

      // map the date dependent on the status (it comes from the API as a string like `2025-09-10`)
      mapped.startDatumVerwerving = api.startDatumVerwerving || '';
      mapped.startDatumGepland = api.startDatumGepland || '';
      mapped.startDatumInProductie = api.startDatumInProductie || '';
      mapped.startDatumUitTeFaseren = api.startDatumUitTeFaseren || '';
      mapped.startDatumUitGefaseerd = api.startDatumUitGefaseerd || '';

      return mapped;
    },
    [getIdString, store?.user?.activeOrganization]
  );

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

  // When gebruikType is 'eigen-organisatie', ensure afnemer is the active organization
  useEffect(() => {
    if (gebruikType !== 'eigen-organisatie') return;
    const org = store?.user?.activeOrganization;
    if (!org) return;
    setGebruikData('afnemer', org);
  }, [gebruikType]);

  // Options state (UI-only)
  const [productOptions, setProductOptions] = useState([]);
  const [modulesOptions, setModulesOptions] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  // Version dropdown loading not used anymore (derived locally from module data)
  const [koppelingOptions, setKoppelingOptions] = useState([]);
  const [dienstOptions, setDienstOptions] = useState([]);

  // Deelnemers (organisaties) options
  const [organisatieOptions, setOrganisatieOptions] = useState([]);

  // Versies
  const [versionOptions, setVersionOptions] = useState([]);
  // Resolved selected module object (for consistent downstream usage)
  const [selectedModule, setSelectedModule] = useState(null);

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
          if (!isEditMode) setGebruik((prev) => ({ ...defaultGebruik, ...prev }));
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
  }, [store, isEditMode]);

  // Prefill for edit mode: fetch existing gebruik and map to local state; jump to step 1
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditMode) return;
      setCurrentStep(1);
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        await store.object.fetchObject(
          'voorzieningen',
          'gebruik',
          String(gebruikId),
          {
            _extend: ['@self.schema'],
          }
        );
        if (cancelled) return;
        const apiObj = store.object.getObject(
          'voorzieningen_gebruik',
          String(gebruikId)
        );
        const mapped = mapFetchedGebruikToLocalState(apiObj);
        setGebruik(mapped);
        setGebruikType(mapped.gebruikType || null);
      } catch (e) {
        if (!cancelled) {
          setPrefillError(
            'Het laden van de gebruiksregistratie is mislukt. Probeer het opnieuw of start een nieuwe registratie.'
          );
        }
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, gebruikId, mapFetchedGebruikToLocalState, store]);

  // Preload all slow API calls at component mount (hotloading like in product form)
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        // Use authenticated API client instead of raw fetch
        await store.object.fetchCollection('voorzieningen', 'product', {
          _limit: '50',
          _page: '1',
          _extend: '@self.schema',
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
          _extend: '@self.schema',
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
          _extend: '@self.schema',
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
          gemmaType: 'referentiecomponent',
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

  // When product changes, load only its modules by ID (restrict module selection to selected product)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const p = gebruik?.product;
      if (p === null || p === undefined || (typeof p === 'string' && p === '')) {
        if (!cancelled) {
          setModulesOptions([]);
          if (gebruik?.module != null) setGebruikData('module', null);
        }
        return;
      }

      // Resolve product object when value might be an id; fetch if needed
      let productData = null;
      if (typeof p === 'object') {
        productData = p;
      } else {
        const fromOptions = productOptions.find(
          (opt) => String(opt.value) === String(p)
        )?.data;
        if (fromOptions) {
          productData = fromOptions;
        } else {
          try {
            await store.object.fetchObject('voorzieningen', 'product', String(p), {
              _extend: '@self.schema',
            });
            productData = store.object.getObject('voorzieningen_product', String(p));
          } catch (_) {
            productData = null;
          }
        }
      }

      const moduleIds = Array.isArray(productData?.modules)
        ? productData.modules
        : [];

      if (moduleIds.length === 0) {
        if (!cancelled) {
          setModulesOptions([]);
          if (gebruik?.module != null) setGebruikData('module', null);
        }
        return;
      }

      setModulesLoading(true);
      try {
        await Promise.all(
          moduleIds.map((id) =>
            store.object.fetchObject('voorzieningen', 'module', String(id), {
              _extend: '@self.schema,@self.relations',
            })
          )
        );
        if (cancelled) return;

        const modules = moduleIds
          .map((id) => store.object.getObject('voorzieningen_module', String(id)))
          .filter(Boolean);
        const options = modules.map(mapToOption);
        setModulesOptions(options);

        const currentModule = String(gebruik?.module || '');
        if (!options.some((o) => String(o.value) === currentModule)) {
          setGebruikData('module', null);
        }

        if (options.length === 1) {
          const nextId = String(options[0].value);
          if (currentModule !== nextId) {
            setGebruikData('module', nextId);
          }
        }
      } catch (_) {
        if (!cancelled) {
          setModulesOptions([]);
          if (gebruik?.module != null) setGebruikData('module', null);
        }
      } finally {
        if (!cancelled) setModulesLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
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
      // Use authenticated API client instead of raw fetch
      await store.object.fetchCollection('voorzieningen', 'module', {
        _limit: '50',
        _page: '1',
        _search: q,
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

  // Resolve selected module object whenever selection changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const mod = gebruik?.module;
      if (!mod) {
        if (!cancelled) setSelectedModule(null);
        return;
      }

      let modData =
        typeof mod === 'object'
          ? mod
          : modulesOptions.find((m) => String(m.value) === String(mod))?.data;

      const versiesArray =
        (modData && (modData.moduleVersies || modData.moduleversies)) || null;

      if (!modData || !Array.isArray(versiesArray) || versiesArray.length === 0) {
        try {
          await store.object.fetchObject('voorzieningen', 'module', String(mod), {
            _extend: '@self.schema,@self.relations',
          });
          if (cancelled) return;
          modData = store.object.getObject('voorzieningen_module', String(mod));
        } catch (e) {
          if (!cancelled) setSelectedModule(null);
          return;
        }
      }

      if (!cancelled) setSelectedModule(modData || null);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [gebruik?.module, modulesOptions]);

  // When selected module object changes, derive versions from module.moduleVersies (no external API)
  useEffect(() => {
    setVersionOptions([]);
    if (!selectedModule) {
      if (gebruik?.moduleVersie != null) setGebruikData('moduleVersie', null);
      return;
    }

    const versies =
      selectedModule.moduleVersies || selectedModule.moduleversies || [];
    const options = versies.map((v, idx) => {
      const label = v?.versie || v?.version || v?.nummer || `Versie ${idx + 1}`;
      const value = String(v?.versie || v?.version || v?.nummer || label);
      return { value, label, data: v };
    });
    setVersionOptions(options);

    const current = String(gebruik?.moduleVersie || '');
    if (current && !options.some((o) => o.value === current)) {
      setGebruikData('moduleVersie', null);
    }
    if (options.length === 1 && current !== options[0].value) {
      setGebruikData('moduleVersie', options[0].value);
    }
  }, [selectedModule]);

  // When product changes, fetch diensten filtered by product id and map options to dienst IDs
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const p = gebruik?.product;
      const productId = getIdString(p);

      if (!productId) {
        if (!cancelled) {
          setDienstOptions([]);
          if (Array.isArray(gebruik?.diensten) && gebruik.diensten.length) {
            setGebruikData('diensten', []);
          }
        }
        return;
      }

      try {
        await store.object.fetchCollection('voorzieningen', 'dienst', {
          producten: String(productId),
          _limit: '100',
          _page: '1',
        });

        if (cancelled) return;

        const type = store.object.getTypeFromParams('voorzieningen', 'dienst');
        const collection = store.object.getCollection(type);
        const list = collection?.results || collection || [];
        const options = list.map((item, index) => {
          const label =
            item?.['@self']?.name ||
            item?.naam ||
            item?.name ||
            item?.title ||
            item?.label ||
            `Dienst ${index + 1}`;
          const value = item?.id;
          return { value: String(value), label: String(label), data: item };
        });

        setDienstOptions(options);

        // Prune selected diensten to those still available for current product
        if (Array.isArray(gebruik?.diensten) && gebruik.diensten.length) {
          const allowed = new Set(options.map((o) => String(o.value)));
          const next = gebruik.diensten
            .map((d) => String(d))
            .filter((id) => allowed.has(id));
          if (next.length !== gebruik.diensten.length) {
            setGebruikData('diensten', next);
          }
        }
      } catch (_) {
        if (!cancelled) {
          setDienstOptions([]);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // Only react to product changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gebruik?.product]);

  // When module changes, resolve koppelingen by IDs from selected module
  useEffect(() => {
    const fetchKoppelingenByIds = async () => {
      try {
        const mod = selectedModule;
        if (!mod) {
          setKoppelingOptions([]);
          return;
        }

        const ids = Array.isArray(mod.koppelingen)
          ? mod.koppelingen.map((id) => String(id))
          : [];

        if (ids.length === 0) {
          setKoppelingOptions([]);
          return;
        }

        await Promise.all(
          ids.map((id) =>
            store.object.fetchObject('voorzieningen', 'koppeling', id, {
              _extend: ['@self.schema', 'moduleA', 'moduleB'],
            })
          )
        );

        const list = ids
          .map((id) => store.object.getObject('voorzieningen_koppeling', String(id)))
          .filter(Boolean);

        const options = list.map((item, index) => {
          const appAName =
            typeof item?.moduleA === 'string'
              ? item.moduleA
              : item?.moduleA?.naam
              ? item.moduleA.naam
              : Array.isArray(item?.moduleA) && item.moduleA[0]?.naam
              ? item.moduleA[0].naam
              : item?.['@self']?.relations?.moduleA || `A${index + 1}`;

          const appBName =
            typeof item?.moduleB === 'string'
              ? item.moduleB
              : item?.moduleB?.naam
              ? item.moduleB.naam
              : Array.isArray(item?.moduleB) && item.moduleB[0]?.naam
              ? item.moduleB[0].naam
              : item?.['@self']?.relations?.moduleB || `B${index + 1}`;

          const direction = item?.gegevensuitwisselingRichting;
          const arrow =
            direction === 'AnaarB' ? '→' : direction === 'BnaarA' ? '←' : '↔';
          const label = `${appAName} ${arrow} ${appBName}`;
          const value = item?.value || item?.id || label;
          return { value: String(value), label: String(label) };
        });

        setKoppelingOptions(options);
      } catch (e) {
        setKoppelingOptions([]);
      }
    };

    fetchKoppelingenByIds();
  }, [selectedModule]);

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
        afnemer: gebruik?.afnemer?.uuid || gebruik?.afnemer?.id || gebruik?.afnemer,
        product: gebruik?.product,
        module: gebruik?.module,
        moduleVersie: gebruik?.moduleVersie,
        status: gebruik?.status || 'Verwerving',
        // Include usage type for processing
        gebruikType: gebruikType,
      };

      // Submit to the gebruik endpoint using the object store
      if (isEditMode) {
        await store.object.updateObject(
          'voorzieningen',
          'gebruik',
          String(gebruikId),
          gebruikData
        );
      } else {
        await store.object.createObject('voorzieningen', 'gebruik', gebruikData);
      }

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
      return !!gebruik?.moduleVersie; // Versie step
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
            versionsLoading={false}
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
    if (isEditMode) return 'Gebruik bewerken';
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
                          disabled={loading || prefillLoading || !!prefillError}
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
                            disabled={
                              !canGoNext() ||
                              loading ||
                              prefillLoading ||
                              !!prefillError
                            }
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
                          disabled={loading || prefillLoading}
                        >
                          {isEditMode ? 'Gebruik updaten' : 'Gebruik registreren'}
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
              <Heading1>
                {isEditMode
                  ? '🎉 Gebruik succesvol geüpdatet!'
                  : '🎉 Gebruik succesvol geregistreerd!'}
              </Heading1>

              <div style={{ marginTop: '1rem' }}>
                <div className='utrecht-alert utrecht-alert--success'>
                  <div className='utrecht-alert__content'>
                    <Paragraph>
                      <strong>
                        {isEditMode
                          ? 'Uw gebruik is succesvol bijgewerkt!'
                          : 'Uw gebruik is succesvol geregistreerd!'}
                      </strong>
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
                  icon={<VISUALS.HOUSE />}
                  onClick={() => (window.location.href = '/beheer')}
                >
                  Terug naar beheer dashboard
                </AcButton>

                <AcButton
                  style='button'
                  buttonType='secondary'
                  icon={<VISUALS.CLIPBOARD_CHECK />}
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
