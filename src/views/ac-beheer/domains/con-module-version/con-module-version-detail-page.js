import React, { useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcFlex, AcSection } from '@atoms';
import { ConDynamicSidenav, AcLoader } from '@components';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import DetailsPageConfigFactory from '@views/ac-beheer/core/factories/con-details-page-config-factory';
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';
import ConModuleVersionDetailsPageContent from './con-module-version-detail-page-content';

/**
 * Module Version Details Page (Applicatie Versie)
 * - Fixed config for moduleversie; no dynamic type switching
 * - Fetches object, schema and related data (uses/used)
 * - Renders dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const ConModuleVersionDetailsPage = ({ store }) => {
  // Destructure the stores we need
  const { object, user } = store;
  const navigate = useNavigate();
  const params = useParams();
  const id = params?.id;

  // Fixed page type and configuration (moduleversie)
  const pageType = 'moduleversie';
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

  // Types
  const objectType = useMemo(() => {
    if (!config) return null;
    return object.getTypeFromParams(config.registerSlug, config.schemaSlug);
  }, [config?.registerSlug, config?.schemaSlug]);

  const schemaType = useMemo(() => {
    if (!config) return null;
    return object.getSchemaType(config.schemaSlug);
  }, [config?.schemaSlug]);

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
      _published: 'false',
    });
    object.fetchSchema(config.schemaSlug);
  }, [config?.schemaSlug, config?.registerSlug, id, config?.extend]);

  // When object becomes active, ensure related data are fetched by setActiveObject helper
  useEffect(() => {
    if (!config || !data) return;
    object.setActiveObject(config.registerSlug, config.schemaSlug, data);
  }, [config?.schemaSlug, config?.registerSlug, data?.id]);

  // Tabs: dynamic Uses/Used
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
              <ConModuleVersionDetailsPageContent
                loading={loading}
                config={config}
                data={data}
                userStore={user}
                objectStore={object}
                id={id}
                handleDelete={() => setOpenModal('delete')}
                canEdit={true}
                actionMenuProps={{
                  setDynamicCreateTargetType,
                  setDynamicCreatePreSelected,
                  setDynamicCreateMetadata,
                  setOpenModal,
                }}
              />
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
        store: { object, user },
        fetchData: () => {
          // After delete, navigate back to list; otherwise refetch the object
          if (openModal === 'delete') {
            setOpenModal(null);
            navigate(`/beheer/${config.routeType}`);
            return;
          }
          return object.fetchObject(registerSlug, schemaSlug, id, {
            _extend: config.extend,
            _published: 'false',
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

export default withStore(observer(ConModuleVersionDetailsPage));
