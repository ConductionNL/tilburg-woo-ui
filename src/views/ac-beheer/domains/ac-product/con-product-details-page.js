import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { ConDynamicSidenav, AcLoader, ConDetailsActionsMenu } from '@components';
import {
  Heading,
  Paragraph,
  Alert,
  Link,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import DetailsPageConfigFactory from '@views/ac-beheer/core/factories/con-details-page-config-factory';
import _ from 'lodash';
import ConObjectUploadFiles from '@views/ac-beheer/shared/components/con-object-upload-files/con-object-upload-files';
import ConEditableDescription from '@views/ac-beheer/shared/components/con-editable-description/con-editable-description';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { AcButton } from '@src/molecules';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const ConProductDetailsPage = ({ store }) => {
  // Destructure the stores we need
  const { object, user } = store;
  const navigate = useNavigate();
  const params = useParams();
  const id = params?.id;

  // Fixed page type and configuration (producten)
  const pageType = 'product';
  const config = useMemo(() => {
    try {
      return DetailsPageConfigFactory.createConfig(pageType);
    } catch (e) {
      return null;
    }
  }, []);

  const [openModal, setOpenModal] = useState(null);
  const [dynamicCreateTargetType, setDynamicCreateTargetType] = useState(null);
  const [dynamicCreatePreSelected, setDynamicCreatePreSelected] = useState({});
  const [dynamicCreateMetadata, setDynamicCreateMetadata] = useState({});
  const [actionMenuItems, setActionMenuItems] = useState([]);

  // Types
  const objectType = useMemo(() => {
    if (!config) return null;
    return object.getTypeFromParams(config.registerSlug, config.schemaSlug);
  }, [config?.registerSlug, config?.schemaSlug]);

  const schemaType = useMemo(() => {
    if (!config) return null;
    return object.getSchemaType(config.schemaSlug);
  }, [config?.schemaSlug]);

  // Full schema (to read configuration)
  const schema = schemaType ? object.getSchema(schemaType) : null;

  // Reactive data (read directly to enable MobX tracking)
  const data =
    object.getObject(objectType, id) || object.getActiveObject(objectType) || null;

  const error = objectType
    ? (() => {
        const storeError = object.getError(objectType);
        return storeError ? { message: storeError } : null;
      })()
    : null;

  // Only block the UI while loading if we don't have data yet.
  // If data exists, treat fetches as background refreshes.
  const loading =
    objectType && id
      ? !data &&
        (object.isLoading(`${objectType}_${id}`) ||
          object.isLoading(objectType) ||
          object.isSchemaLoading(schemaType))
      : false;

  // Fetch data
  useEffect(() => {
    if (!config || !id) return;
    const extendParams = Array.isArray(config.extend) ? config.extend : [];
    object.fetchObject(config.registerSlug, config.schemaSlug, id, {
      _extend: extendParams,
      _related: true,
      _relatedNames: true,
    });
    object.fetchSchema(config.schemaSlug);
  }, [config?.schemaSlug, config?.registerSlug, id, config?.extend]);

  // When object becomes active, ensure related data are fetched by setActiveObject helper
  useEffect(() => {
    if (!config || !data) return;
    object.setActiveObject(config.registerSlug, config.schemaSlug, data);
  }, [config?.schemaSlug, config?.registerSlug, data?.id]);

  // Tabs: Files always, plus dynamic Uses/Used
  const registerSlug = config?.registerSlug;
  const schemaSlug = config?.schemaSlug;

  // Memoize modal config to keep identity stable and avoid remount loops in modal factory
  const modalConfig = useMemo(() => {
    const availableKeys = BeheerModalFactory.modalComponents[pageType]
      ? Object.keys(BeheerModalFactory.modalComponents[pageType])
      : ['edit', 'delete', 'publish', 'depublish'];
    const filtered = availableKeys.filter((m) => m !== 'add' && m !== 'import');
    const modals = filtered.includes('dynamicCreate')
      ? filtered
      : [...filtered, 'dynamicCreate'];
    return {
      registerSlug,
      schemaSlug,
      modals,
    };
  }, [pageType, registerSlug, schemaSlug]);

  const toSingular = (type) => {
    // Very small helper for Dutch plural to singular for known types
    if (type === 'producten') return 'product';
    return type?.slice(0, -1);
  };
  const shortTooltip = (type) => `Een korte beschrijving van de ${toSingular(type)}`;
  const longTooltip = (type) =>
    `Een uitgebreide beschrijving van de ${toSingular(type)}`;

  const openDynamicCreate = React.useCallback(
    (targetType, preSelected, metadata = {}) => {
      setDynamicCreateTargetType(targetType);
      setDynamicCreatePreSelected(preSelected);
      // Store metadata for outgoing relationship handling and optimization
      // Store all metadata for the modal to use
      setDynamicCreateMetadata(metadata);
      setOpenModal('dynamicCreate');
    },
    []
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: config?.schemaSlug,
    currentType: pageType,
    openDynamicCreate,
    currentObject: data, // Pass current object for organization permission checks
    currentObjectRegister: config?.registerSlug, // Pass current object register
    currentObjectSchema: config?.schemaSlug, // Pass current object schema
  });

  useEffect(() => {
    if (!config?.schemaSlug || !data?.id) return;
    const items = makeActionsForContext(data.id).map(
      ({ key, label, onClick, schema, icon }) => ({
        key,
        label,
        onClick,
        schema,
        icon,
      })
    );
    setActionMenuItems(items);
  }, [config?.schemaSlug, data?.id, makeActionsForContext]);

  if (!config) {
    return <AcBeheerError error={'Onbekend detailtype'} store={store} />;
  }

  if (error) {
    return <AcBeheerError error={error.message} store={store} />;
  }

  const pageContent = () => {
    if (loading || !data) return null;
    return (
      <AcFlex column spacing='xl'>
        <AcFlex justifyContent='end'>
          <ConDetailsActionsMenu
            user={user}
            id={id}
            schemaSlug={config?.schemaSlug}
            title={data['@self']?.name || data.id}
            published={data?.['@self']?.published}
            object={data}
            showViewAction={false}
            showEditAction={true}
            showPublishActions={true}
            uniqueActions={[
              ...(config.uniqueActions
                ?.filter((action) => action.condition?.(data))
                .map((action) => ({
                  key: action.key,
                  label: action.label,
                  icon: action.icon,
                  onClick: () =>
                    typeof action.onClick === 'function'
                      ? action.onClick(data)
                      : setOpenModal(action.action),
                })) || []),
              {
                key: 'delete',
                label: 'Verwijderen',
                icon: VISUALS.TRASHCAN,
                onClick: () => setOpenModal('delete'),
              },
            ]}
            relatedActions={actionMenuItems}
            onEdit={() => {
              // Prefer wizard editing when available; fallback to legacy modal
              if (config?.schemaSlug) {
                const wizards = Object.values(DASHBOARD_WIZARDS);
                const wizard = wizards.find((w) => w.schema === config.schemaSlug);
                if (wizard) {
                  const baseUrl = getWizardUrl(wizard);
                  const url = new URL(baseUrl, window.location.origin);
                  url.searchParams.set('id', data?.id);
                  navigate(url.pathname + url.search);
                  return;
                }
              }
              setOpenModal('edit');
            }}
            onPublish={() => setOpenModal('publish')}
            onDepublish={() => setOpenModal('depublish')}
          />
        </AcFlex>

        <div className='con-product-details--header'>
          <AcFlex column spacing='xs'>
            <div className='con-beheer-details--header-container'>
              {(data?.logo || data?.['@self']?.image) && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={data?.logo || data?.['@self']?.image}
                />
              )}

              <Heading className='con-beheer-details--title'>
                {data?.naam || data?.['@self']?.name || data.id}
              </Heading>
            </div>

            <Paragraph>
              {data?.beschrijvingKort || data?.['@self']?.summary || ''}
            </Paragraph>

            <Separator />

            {/* Short stats grid (2 columns x 3 rows) */}
            {(() => {
              const usedRel = object.getRelatedData(objectType, 'used');
              const afnemersCount = Array.isArray(usedRel?.results)
                ? usedRel.results.length
                : 0;

              // Prefer extended aanbieder, fallback to aanbiederNaam
              const leverancierNaam =
                data?.aanbieder?.naam || data?.aanbiederNaam || '-';
              const hostingLocatie = data?.hostingLocatie || '-';
              // TODO: If product status uses another key, adjust here
              const statusLabel =
                typeof data?.inGebruik === 'boolean'
                  ? data.inGebruik
                    ? 'In gebruik'
                    : 'Niet in gebruik'
                  : data?.status || '-'; // @TODO: Confirm correct key for status on product
              const hostingType =
                data?.cloudDienstverleningsmodel || data?.hostingType || '-'; // @TODO: Confirm if hostingType maps to cloudDienstverleningsmodel
              const dataOpslag = data?.hostingJurisdictie || '-';

              const items = [
                { label: 'Leverancier', value: leverancierNaam },
                { label: 'De applicatie wordt gehost in', value: hostingLocatie },
                { label: 'Status', value: statusLabel },
                { label: 'Hosting type', value: hostingType },
                { label: 'De data wordt opgeslagen in', value: dataOpslag },
                { label: 'Aantal afnemers', value: String(afnemersCount) },
              ];

              return (
                <div className='con-product-details--header-short-stats'>
                  {items.map((item) => (
                    <div
                      key={item.label}
                      className='con-product-details--header-short-stats-item'
                    >
                      <div>{item.label}</div>
                      <div style={{ fontWeight: 600 }}>{item.value || '-'}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </AcFlex>

          {data?.contactpersoon && (
            <>
              <Separator />

              <AcFlex column spacing='xs' alignItems='end'>
                {/* @TODO: contactpersoon likely has no logo / image */}
                <b>Contactpersoon</b>
                {(() => {
                  // Glitch: sometimes an array with two objects is returned; use the first
                  const contact = Array.isArray(data.contactpersoon)
                    ? data.contactpersoon[0]
                    : data.contactpersoon;

                  if (contact && typeof contact === 'object') {
                    return (
                      <>
                        <p>
                          {[
                            contact.voornaam,
                            contact.tussenvoegsel,
                            contact.achternaam,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                        {contact['e-mailadres'] && (
                          <Link href={`mailto:${contact['e-mailadres']}`}>
                            {contact['e-mailadres']}
                          </Link>
                        )}
                        {contact.telefoonnummer && (
                          <Link
                            href={`tel:${String(contact.telefoonnummer)
                              .split('')
                              .filter((i) => i !== ' ')
                              .join('')}`}
                          >
                            {contact.telefoonnummer}
                          </Link>
                        )}
                        {contact.functie && <p>{contact.functie}</p>}
                      </>
                    );
                  }

                  // Only an ID present
                  return (
                    <>
                      {/* @TODO: Only an ID present. Consider extending 'contactpersoon' to show details. */}
                      <p>ID: {String(contact)}</p>
                    </>
                  );
                })()}
              </AcFlex>
            </>
          )}
        </div>

        <UnpublishedWarning data={data} config={config} />

        <Separator />

        <AcFlex spacing='xl' className='con-product-details--content'>
          <AcColumn gap='tiger' className='con-product-details--content-main'>
            <ConEditableDescription
              registerSlug={config.registerSlug}
              schemaSlug={config.schemaSlug}
              objectId={data.id}
              field='beschrijvingKort'
              label='Korte beschrijving'
              placeholder={shortTooltip(pageType)}
              tooltip={shortTooltip(pageType)}
              maxLength={255}
              isMarkdown={false}
              value={data.beschrijvingKort}
              serialize={(v) => v}
              deserialize={(v) => v || ''}
            />

            <ConEditableDescription
              registerSlug={config.registerSlug}
              schemaSlug={config.schemaSlug}
              objectId={data.id}
              field='beschrijvingLang'
              label='Lange beschrijving'
              placeholder={longTooltip(pageType)}
              tooltip={longTooltip(pageType)}
              maxLength={2000}
              isMarkdown={true}
              value={data.beschrijvingLang}
              serialize={(v) => JSON.stringify(v || '')}
              deserialize={(v) => {
                if (!v) return '';
                try {
                  return JSON.parse(v) || '';
                } catch (e) {
                  return v;
                }
              }}
            />
          </AcColumn>

          <Separator />

          {/* Side area next to editable descriptions with mock data */}
          <SuitableForList modules={data.modules} />
        </AcFlex>

        <DetailsPageTabs
          schema={schema}
          objectType={objectType}
          registerSlug={registerSlug}
          schemaSlug={schemaSlug}
          id={id}
          store={store}
        />
      </AcFlex>
    );
  };

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />
        <div className='ac-beheer-details--100-width'>
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && pageContent()}
          </AcColumn>
        </div>
      </AcFlex>

      {/* Render modals via factory for consistency (includes edit/delete) */}
      {BeheerModalFactory.renderModals(pageType, {
        singleSelectedRow: data,
        selectedRows: [],
        openModal,
        setOpenModal,
        setSingleSelectedRow: () => {},
        tableRef: { current: { resetSelectedRows: () => {} } },
        navigate,
        store: { object, user }, // Pass store for cross-collection refreshes
        fetchData: () => {
          // After delete, navigate back to list; otherwise refetch the object
          if (openModal === 'delete') {
            setOpenModal(null);
            navigate(`/beheer/${config.routeType}`);
            return;
          }
          return object.fetchObject(registerSlug, schemaSlug, id, {
            _extend: config.extend,
          });
        },
        config: modalConfig,
        dynamicCreateTargetType,
        dynamicCreatePreSelected,
        dynamicCreateMetadata,
      })}
    </AcSection>
  );
};

// separate component for tabs
// @TODO: make generic and use on all details pages
const DetailsPageTabs = observer(
  ({ schema, objectType, registerSlug, schemaSlug, id, store }) => {
    const { object, user } = store;
    const [tabIndex, setTabIndex] = useState(0);

    const usesData = object.getRelatedData(objectType, 'uses');
    const usedData = object.getRelatedData(objectType, 'used');

    // Respect schema configuration for files and tags
    const showFilesTab = !!schema?.configuration?.allowFiles;
    const allowedTags = Array.isArray(schema?.configuration?.allowedTags)
      ? schema.configuration.allowedTags
      : [];

    // Uses/Used unique schemas for tabs
    const uniqueSchemasFrom = useCallback((rel) => {
      if (!rel?.results) return [];
      const uniq = _.uniqBy(rel.results, (item) => item['@self']?.schema?.id);
      return uniq
        .map((item) => item['@self']?.schema)
        .filter(Boolean)
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }, []);

    const usesSchemas = useMemo(() => uniqueSchemasFrom(usesData), [usesData]);
    const usedSchemas = useMemo(() => uniqueSchemasFrom(usedData), [usedData]);

    // If Files tab is hidden, default to first dynamic tab (index 1)
    useEffect(() => {
      setTabIndex(() => (!showFilesTab ? 1 : 0));
    }, [showFilesTab]);

    if (!showFilesTab && !usesSchemas?.length && !usedSchemas?.length) return null;

    return (
      <div className='ac-beheer-details--tabs-container'>
        <AcTabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
          <AcTabList>
            {showFilesTab && <AcTab selected={tabIndex === 0}>Bestanden</AcTab>}
            {usesSchemas.length > 0 &&
              usesSchemas.map((schema, idx) => (
                <AcTab key={`uses-${schema.id}`} selected={tabIndex === idx + 1}>
                  {schema.title || schema.id}
                </AcTab>
              ))}
            {usedSchemas.length > 0 &&
              usedSchemas.map((schema, idx) => (
                <AcTab
                  key={`used-${schema.id}`}
                  selected={tabIndex === idx + 1 + usesSchemas.length}
                >
                  {schema.title || schema.id}
                </AcTab>
              ))}
          </AcTabList>
          {showFilesTab && (
            <AcTabPanel selected={tabIndex === 0}>
              <ConObjectUploadFiles
                register={registerSlug}
                schema={schemaSlug}
                id={id}
                allowedTags={allowedTags}
              />
            </AcTabPanel>
          )}
          {usesSchemas.length > 0 &&
            usesSchemas.map((schema, idx) => {
              const metadata = usesData?.results?.find(
                (r) => r['@self']?.schema?.id === schema.id
              )?.['@self'];
              const rows = (usesData?.results || []).filter(
                (r) => r['@self']?.schema?.id === schema.id
              );
              return (
                <AcTabPanel
                  key={`uses-${schema.id}`}
                  selected={tabIndex === idx + 1}
                >
                  {metadata ? (
                    <BeheerTable
                      type={schema.slug}
                      metadata={metadata}
                      data={rows}
                      dataProperties={schema.properties}
                      user={user}
                      actionButtons={(config) =>
                        !!config.navigateView && {
                          id: 'actions',
                          label: 'Acties',
                          key: '',
                          customContent: (row) => (
                            <AcFlex column spacing='xs'>
                              <AcButton
                                style='buttonSlim'
                                buttonType='secondary'
                                onClick={() => config.navigateView(row.id)}
                              >
                                <VISUALS.EYE className='ac-button__icon' /> Bekijken
                              </AcButton>
                            </AcFlex>
                          ),
                        }
                      }
                      tableProps={{
                        renderSelectRowButtons: false,
                        truncateLines: 1,
                      }}
                    />
                  ) : (
                    <Alert type='error'>
                      Er is een fout opgetreden bij het laden van deze gegevens.
                    </Alert>
                  )}
                </AcTabPanel>
              );
            })}
          {usedSchemas.length > 0 &&
            usedSchemas.map((schema, idx) => {
              const metadata = usedData?.results?.find(
                (r) => r['@self']?.schema?.id === schema.id
              )?.['@self'];
              const rows = (usedData?.results || []).filter(
                (r) => r['@self']?.schema?.id === schema.id
              );
              return (
                <AcTabPanel
                  key={`used-${schema.id}`}
                  selected={tabIndex === idx + 1 + usesSchemas.length}
                >
                  {metadata ? (
                    <BeheerTable
                      type={schema.slug}
                      metadata={metadata}
                      data={rows}
                      dataProperties={schema.properties}
                      user={user}
                      actionButtons={(config) =>
                        !!config.navigateView && {
                          id: 'actions',
                          label: 'Acties',
                          key: '',
                          customContent: (row) => (
                            <AcFlex column spacing='xs'>
                              <AcButton
                                style='buttonSlim'
                                buttonType='secondary'
                                onClick={() => config.navigateView(row.id)}
                              >
                                <VISUALS.EYE className='ac-button__icon' /> Bekijken
                              </AcButton>
                            </AcFlex>
                          ),
                        }
                      }
                      tableProps={{
                        renderSelectRowButtons: false,
                        truncateLines: 1,
                      }}
                    />
                  ) : (
                    <Alert type='error'>
                      Er is een fout opgetreden bij het laden van deze gegevens.
                    </Alert>
                  )}
                </AcTabPanel>
              );
            })}
        </AcTabs>
      </div>
    );
  }
);

// Small helper components for the side area using mock data
const SuitableForList = ({ modules }) => {
  return (
    <AcFlex column spacing='sm' className='con-product-details--content-side'>
      <AcFlex spacing='sm'>
        <p style={{ fontWeight: 'bold' }}>Pakket geschikt voor:</p>
        <p style={{ fontWeight: 'bold' }}>Ingevuld door:</p>
      </AcFlex>
      <ul style={{ marginLeft: '1rem' }}>
        {modules.map((m) => (
          <li key={m.id}>{m.naam}</li>
        ))}
      </ul>
    </AcFlex>
  );
};

/* Warning card for unpublished objects */
const UnpublishedWarning = ({ data, config }) => {
  if (data?.['@self']?.published) return null;
  const schemaName = config?.title || data?.['@self']?.schema?.title;
  const title = schemaName ? `Deze ${schemaName}` : '';
  const objectName = data?.['@self']?.name;

  return (
    <Alert type='warning'>
      <Heading level={4}>{title} is nog niet gepubliceerd</Heading>
      <Paragraph>
        {objectName} is momenteel niet zichtbaar in de zoekfunctie van{' '}
        {config?.title || 'de catalogus'}. Gebruik de &quot;Publiceren&quot; actie om
        deze gegevens beschikbaar te maken voor bezoekers.
      </Paragraph>
    </Alert>
  );
};

export default withStore(observer(ConProductDetailsPage));
