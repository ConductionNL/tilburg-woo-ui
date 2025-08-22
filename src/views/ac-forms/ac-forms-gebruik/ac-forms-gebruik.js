import { useState, useEffect, memo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import clsx from 'clsx';
import { AcSection, AcContainer, AcColumn } from '@src/atoms';
import { AcButton } from '@src/molecules';
import { ProcessSteps } from '@gemeente-denhaag/components-react';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';
import ReactSelect from 'react-select';
import {
  Heading1,
  Paragraph,
  UnorderedList,
  UnorderedListItem,
  Separator,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';

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

const AcFormsGebruik = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Applicatie selectie
  const [appOptions, setAppOptions] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  // Prefilled info (disabled)
  const [appName, setAppName] = useState('');
  const [appSummary, setAppSummary] = useState('');

  // Versies
  const [versionOptions, setVersionOptions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Referentiecomponenten
  const [refCompOptions, setRefCompOptions] = useState([]);
  const [selectedRefComps, setSelectedRefComps] = useState([]);

  // Fetch applicaties and referentiecomponenten options on mount
  useEffect(() => {
    let isMounted = true;

    const fetchApps = async () => {
      try {
        const params = new URLSearchParams({ _limit: '50', _page: '1' });
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
        if (isMounted) setAppOptions(options);
      } catch (e) {
        if (isMounted) setAppOptions([]);
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

    fetchApps();
    fetchRefComps();
    return () => {
      isMounted = false;
    };
  }, []);

  // When an app is selected, prefill info and fetch versions
  useEffect(() => {
    const prefillFromSelected = () => {
      const data = selectedApp?.data || null;
      const name =
        selectedApp?.label || data?.naam || data?.name || data?.title || '';
      const summary =
        data?.beschrijvingKort ||
        data?.beschrijving ||
        data?.description ||
        data?.summary ||
        '';
      setAppName(name);
      setAppSummary(summary);
    };

    const fetchVersions = async () => {
      setLoading(true);
      try {
        setVersionOptions([]);
        setSelectedVersion(null);
        if (!selectedApp?.value) return;

        // Fetch module versions via the dedicated endpoint with pagination
        // Filter by relation @self.relations.module; fallback to client-side filtering
        const moduleId = String(selectedApp.value);
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

    prefillFromSelected();
    fetchVersions();
  }, [selectedApp]);

  const getStatus = (active, step) => {
    if (active === step) return 'current';
    if (active < step) return 'not-checked';
    return 'checked';
  };

  const getStatusMulti = (active, first, last) => {
    if (active >= first && active <= last) return 'current';
    if (active < first) return 'not-checked';
    return 'checked';
  };

  const canGoNext = () => {
    if (currentStep === 0) return !!selectedApp;
    if (currentStep === 1) return !!selectedVersion;
    if (currentStep === 2) return true; // referentiecomponenten optional
    return false;
  };

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='app-select-title'
          >
            <h2 id='app-select-title' className='sr-only'>
              Applicatie selecteren
            </h2>
            <Paragraph>Kies een applicatie uit de catalogus.</Paragraph>
            <div style={{ maxWidth: '640px' }}>
              <ReactSelect
                className={clsx(
                  'ac-beheer-select',
                  loading && 'ac-beheer-select--disabled'
                )}
                options={appOptions}
                value={selectedApp}
                onChange={(opt) => setSelectedApp(opt)}
                isDisabled={loading}
                placeholder='Selecteer een applicatie...'
                isClearable
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='app-info-title'
          >
            <h2 id='app-info-title' className='sr-only'>
              Applicatie informatie
            </h2>
            <div className='ac-register-form-grid'>
              <div style={{ gridColumn: 'span 2' }}>
                <label className='utrecht-form-label'>Naam van de applicatie</label>
                <Textbox value={appName} disabled id='app-name' />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className='utrecht-form-label'>
                  Korte beschrijving van de applicatie
                </label>
                <Textbox value={appSummary} disabled id='app-summary' />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className='utrecht-form-label'>Versie</label>
                <ReactSelect
                  className={clsx(
                    'ac-beheer-select',
                    loading && 'ac-beheer-select--disabled'
                  )}
                  options={versionOptions}
                  value={
                    versionOptions.find((o) => o.value === selectedVersion) || null
                  }
                  onChange={(opt) => setSelectedVersion(opt?.value || null)}
                  isDisabled={loading || !versionOptions.length}
                  placeholder={
                    versionOptions.length
                      ? 'Selecteer een versie'
                      : 'Geen versies beschikbaar'
                  }
                  isClearable
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='refcomp-title'
          >
            <h2 id='refcomp-title' className='sr-only'>
              Referentiecomponenten
            </h2>
            <Paragraph>
              Selecteer de referentiecomponenten die door deze applicatie worden
              gebruikt.
            </Paragraph>
            <div style={{ maxWidth: '640px' }}>
              <ReactSelect
                isMulti
                className='ac-beheer-select'
                options={refCompOptions}
                value={selectedRefComps
                  .map((v) =>
                    refCompOptions.find((o) => String(o.value) === String(v))
                  )
                  .filter(Boolean)}
                onChange={(opts) =>
                  setSelectedRefComps(
                    Array.isArray(opts) ? opts.map((o) => String(o.value)) : []
                  )
                }
                placeholder='Selecteer referentiecomponenten...'
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='review-title'
          >
            <h2 id='review-title' className='sr-only'>
              Controleren
            </h2>
            <div className='ac-register-review'>
              <div className='ac-register-review__section'>
                <div className='ac-register-review__header'>
                  <h3 className='utrecht-heading-4'>Geselecteerde applicatie</h3>
                </div>
                <Separator className='con-form-wizard-review-header__separator' />
                <div className='ac-register-review__field'>
                  <strong>Naam:</strong>
                  <div>{appName || '-'}</div>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Korte beschrijving:</strong>
                  <div>{appSummary || '-'}</div>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Versie:</strong>
                  <div>
                    {versionOptions.find((o) => o.value === selectedVersion)
                      ?.label || '-'}
                  </div>
                </div>
                <div className='ac-register-review__field'>
                  <strong>Referentiecomponenten:</strong>
                  <div>
                    {selectedRefComps.length ? (
                      <UnorderedList>
                        {selectedRefComps.map((v) => {
                          const opt = refCompOptions.find(
                            (o) => String(o.value) === String(v)
                          );
                          return (
                            <UnorderedListItem key={v}>
                              {opt ? opt.label : v}
                            </UnorderedListItem>
                          );
                        })}
                      </UnorderedList>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const currentStepName = (step) => {
    switch (step) {
      case 0:
        return 'Applicatie selecteren';
      case 1:
        return 'Applicatie informatie';
      case 2:
        return 'Referentiecomponenten';
      case 3:
        return 'Controleren';
      default:
        return '';
    }
  };

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
            <div className='ac-register-process-steps'>
              <ProcessSteps
                steps={(() => {
                  const steps = [
                    {
                      id: 'grp-app-select',
                      marker: 1,
                      status: getStatusMulti(currentStep, 0, 2),
                      title: 'Applicatie selecteren',
                      steps: [
                        {
                          id: 'sub-app-info',
                          status: getStatus(currentStep, 1),
                          title: 'Applicatie informatie',
                        },
                        {
                          id: 'sub-refcomp',
                          status: getStatus(currentStep, 2),
                          title: 'Referentiecomponenten',
                        },
                      ],
                    },
                    {
                      id: 'grp-review',
                      marker: 2,
                      status: getStatus(currentStep, 3),
                      title: 'Controleren',
                    },
                  ];
                  return steps;
                })()}
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

                {currentStep !== 3 && (
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

                {currentStep === 3 && (
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
