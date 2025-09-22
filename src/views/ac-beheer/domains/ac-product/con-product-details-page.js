import React, { useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcFlex, AcSection } from '@atoms';
import { ConDynamicSidenav, AcLoader, ConDetailsActionsMenu } from '@components';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import DetailsPageConfigFactory from '@views/ac-beheer/core/factories/con-details-page-config-factory';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import ConProductDetailsPageContent from './con-product-details-page-content';

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
  // const schema = schemaType ? object.getSchema(schemaType) : null;

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

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />
        <div className='ac-beheer-details--100-width'>
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && (
              <>
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
                        const wizard = wizards.find(
                          (w) => w.schema === config.schemaSlug
                        );
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

                <ConProductDetailsPageContent
                  loading={loading}
                  data={data}
                  userStore={user}
                  id={id}
                  actionMenuItems={actionMenuItems}
                  handleDelete={() => setOpenModal('delete')}
                  canEdit={true}
                />
              </>
            )}
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

export default withStore(observer(ConProductDetailsPage));
