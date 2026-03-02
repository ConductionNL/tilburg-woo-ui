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
import ConKoppelingDetailsPageContent from './con-koppeling-details-page-content';

/**
 * Koppeling Details Page (fixed type 'koppeling')
 */
const ConKoppelingDetailsPage = ({ store }) => {
  const { user } = store;
  const navigate = useNavigate();
  const params = useParams();
  const id = params?.id;

  const pageType = 'koppeling';
  const config = useMemo(() => {
    try {
      return DetailsPageConfigFactory.createConfig(pageType);
    } catch (e) {
      return null;
    }
  }, []);

  const [openModal, setOpenModal] = useState(null);

  // Types
  const objectType = useMemo(() => {
    if (!config) return null;
    return store.object.getTypeFromParams(config.registerSlug, config.schemaSlug);
  }, [config?.registerSlug, config?.schemaSlug]);

  const schemaType = useMemo(() => {
    if (!config) return null;
    return store.object.getSchemaType(config.schemaSlug);
  }, [config?.schemaSlug]);

  // Reactive data
  const data =
    store.object.getObject(objectType, id) ||
    store.object.getActiveObject(objectType) ||
    null;

  const error = objectType
    ? (() => {
        const storeError = store.object.getError(objectType);
        return storeError ? { message: storeError } : null;
      })()
    : null;

  const loading =
    objectType && id
      ? !data &&
        (store.object.isLoading(`${objectType}_${id}`) ||
          store.object.isLoading(objectType) ||
          store.object.isSchemaLoading(schemaType))
      : false;

  // Fetch data
  useEffect(() => {
    if (!config || !id) return;
    const extendParams = Array.isArray(config.extend) ? config.extend : [];
    store.object.fetchObject(config.registerSlug, config.schemaSlug, id, {
      _extend: extendParams,
      _related: true,
      _relatedNames: true,
      _published: 'false',
    });
    store.object.fetchSchema(config.schemaSlug);
  }, [config?.schemaSlug, config?.registerSlug, id, config?.extend]);

  // Set active object (ensures related fetch helpers run)
  useEffect(() => {
    if (!config || !data) return;
    store.object.setActiveObject(config.registerSlug, config.schemaSlug, data);
  }, [config?.schemaSlug, config?.registerSlug, data?.id]);

  const registerSlug = config?.registerSlug;
  const schemaSlug = config?.schemaSlug;

  // Modal config
  const modalConfig = useMemo(() => {
    const availableKeys = BeheerModalFactory.modalComponents[pageType]
      ? Object.keys(BeheerModalFactory.modalComponents[pageType])
      : ['edit', 'delete', 'publish', 'depublish'];
    const filtered = availableKeys.filter((m) => m !== 'add' && m !== 'import');
    const modals = filtered;
    return { registerSlug, schemaSlug, modals };
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
              <ConKoppelingDetailsPageContent
                loading={loading}
                config={config}
                data={data}
                userStore={user}
                objectStore={store.object}
                id={id}
                canEdit={true}
                actionMenuProps={{
                  setOpenModal,
                  onDataUpdate: () => {
                    store.object.fetchObject(registerSlug, schemaSlug, id, {
                      _extend: config.extend,
                      _related: true,
                      _relatedNames: true,
                      _published: 'false',
                    });
                  },
                }}
              />
            )}
          </AcColumn>
        </div>
      </AcFlex>

      {BeheerModalFactory.renderModals(pageType, {
        singleSelectedRow: data,
        selectedRows: [],
        openModal,
        setOpenModal,
        setSingleSelectedRow: () => {},
        tableRef: { current: { resetSelectedRows: () => {} } },
        navigate,
        store,
        fetchData: () =>
          store.object.fetchObject(registerSlug, schemaSlug, id, {
            _extend: config.extend,
          }),
        config: modalConfig,
      })}
    </AcSection>
  );
};

export default withStore(observer(ConKoppelingDetailsPage));
