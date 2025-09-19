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
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import DetailsPageConfigFactory from '@views/ac-beheer/core/factories/con-details-page-config-factory';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import { canReadField } from '@utils/field-authorization';
import _ from 'lodash';
import ConObjectUploadFiles from '@views/ac-beheer/shared/components/con-object-upload-files/con-object-upload-files';
import ConEditableDescription from '@views/ac-beheer/shared/components/con-editable-description/con-editable-description';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
import { TOOLTIP_ID } from '@src/index.web';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { AcButton } from '@src/molecules';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

/**
 * Organisatie Details Page (simplified for fixed type)
 * - Fixed config for organisaties; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const ConOrganisatieDetailsPage = ({ store }) => {
  // Destructure the stores we need
  const { object, user } = store;
  const navigate = useNavigate();
  const params = useParams();
  const id = params?.id;

  // Fixed page type and configuration (organisaties)
  const pageType = 'organisaties';
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

  const dataProperties = schemaType ? object.getSchemaProperties(schemaType) : {};

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

  // Names cache for UUID resolution
  const namesMap = useMemo(() => {
    const map = {};
    Object.entries(object.namesCache || {}).forEach(([id, cacheEntry]) => {
      if (cacheEntry.name) {
        map[id] = cacheEntry.name;
      }
    });
    return map;
  }, [object?.namesCache]);

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

  const configuredMetaFields = useMemo(() => {
    const cfg = schema?.configuration;
    return [
      cfg?.objectDescriptionField,
      cfg?.objectImageField,
      cfg?.objectNameField,
    ].filter(Boolean);
  }, [schema]);

  const shortTooltip = (type) =>
    `Een korte beschrijving van de ${type.slice(0, -1)}`;
  const longTooltip = (type) =>
    `Een uitgebreide beschrijving van de ${type.slice(0, -1)}`;

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

        <div className='con-organisatie-details--header'>
          <AcFlex column spacing='xs'>
            <div className='con-beheer-details--header-container'>
              {data?.['@self']?.image && (
                <ConLogoPreview
                  className='con-beheer-details--logo-container'
                  logoUrl={data?.['@self']?.image}
                />
              )}

              <Heading className='con-beheer-details--title'>
                {data['@self']?.name || data.id}
              </Heading>
            </div>

            <Paragraph>{data?.['@self']?.summary || ''}</Paragraph>

            {/* @TODO: This data does not exist on the organisatie (yet?), don't know what to do with it */}
            <AcFlex
              spacing='sm'
              className='con-organisatie-details--header-hosting-types'
            >
              <div>
                <b>Hostingtypes:</b>
                <br />
                {data?.hostingTypes?.join?.(', ') || '-'}
              </div>
              <div>
                <b>De data wordt opgeslagen in:</b>
                <br />
                {data?.hostingLocatie || '-'}
              </div>
              <div>
                <b>Aantal afnemers:</b>
                <br />
                {data?.aantalAfnemers || '-'}
              </div>
            </AcFlex>
          </AcFlex>

          {!!data.contactpersonen.length && (
            <AcFlex column spacing='xs' alignItems='end'>
              {/* @TODO: contactpersoon doesn't have a logo / image */}
              <ConLogoPreview logoUrl={data.contactpersonen[0]['@self'].image} />

              <b>Contactpersoon</b>
              <p>
                {[
                  data.contactpersonen[0].voornaam,
                  data.contactpersonen[0].tussenvoegsel,
                  data.contactpersonen[0].achternaam,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </p>
              <Link href={`mailto:${data.contactpersonen[0]['e-mailadres']}`}>
                {data.contactpersonen[0]['e-mailadres']}
              </Link>
              <Link
                // expects a `+31 6 12345678` format, `06 12345678` may or may not be supported by the `tel:` href
                href={`tel:${data.contactpersonen[0].telefoonnummer
                  .split('')
                  .filter((i) => i !== ' ')
                  .join('')}`}
              >
                {data.contactpersonen[0].telefoonnummer}
              </Link>
              <p>{data.contactpersonen[0].functie}</p>
            </AcFlex>
          )}
        </div>

        <UnpublishedWarning data={data} config={config} />

        <AcColumn gap='tiger'>
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

          <AcFlex column spacing='sm'>
            <div className='ac-beheer-details--grid'>
              {Object.entries(dataProperties)
                .filter(([key]) => !config.excludedProperties.includes(key))
                .filter(([key]) => !configuredMetaFields.includes(key))
                .filter(([, schema]) => canReadField(user, schema))
                .map(([key, schema]) => {
                  // Check if this property should be displayed inline
                  const isInline =
                    config.formatBySchemaOptions?.profile?.[key]?.inline;

                  if (isInline) {
                    // Inline rendering: label and value on same line
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px',
                        }}
                      >
                        <strong
                          {...(schema?.description
                            ? {
                                'data-tooltip-id': TOOLTIP_ID,
                                'data-tooltip-content': schema.description,
                              }
                            : {})}
                        >
                          {_.startCase(key)}:
                        </strong>
                        {formatBySchema(schema, data, key, {
                          ...(config.formatBySchemaOptions || {}),
                          objectStore: object,
                          namesMap,
                        })}
                      </div>
                    );
                  } else {
                    // Default block rendering: label above value
                    return (
                      <div key={key}>
                        <strong
                          {...(schema?.description
                            ? {
                                'data-tooltip-id': TOOLTIP_ID,
                                'data-tooltip-content': schema.description,
                              }
                            : {})}
                        >
                          {_.startCase(key)}:
                        </strong>{' '}
                        {formatBySchema(schema, data, key, {
                          ...(config.formatBySchemaOptions || {}),
                          objectStore: object,
                          namesMap,
                        })}
                      </div>
                    );
                  }
                })}
            </div>

            <AcFlex column spacing='xs'>
              <Link href={`mailto:${data['e-mailadres']}`}>
                📬 {data['e-mailadres']}
              </Link>
              <Link
                // expects a `+31 6 12345678` format, `06 12345678` may or may not be supported by the `tel:` href
                href={`tel:${data.telefoonnummer
                  .split('')
                  .filter((i) => i !== ' ')
                  .join('')}`}
              >
                📞 {data.telefoonnummer}
              </Link>
            </AcFlex>
          </AcFlex>

          <DetailsPageTabs
            schema={schema}
            objectType={objectType}
            registerSlug={registerSlug}
            schemaSlug={schemaSlug}
            id={id}
            store={store}
          />
        </AcColumn>
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

export default withStore(observer(ConOrganisatieDetailsPage));
