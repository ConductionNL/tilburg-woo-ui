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
import ConGebruikDetailsPageContent from './con-gebruik-details-page-content';

/**
 * Gebruik Details Page (fixed type 'gebruiken')
 * Mirrors other domain detail pages using DetailsPageConfigFactory
 */
const ConGebruikDetailsPage = ({ store }) => {
  const { object, user } = store;
  const navigate = useNavigate();
  const params = useParams();
  const id = params?.id;

  const pageType = 'gebruik';
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

  const objectType = useMemo(() => {
    if (!config) return null;
    return object.getTypeFromParams(config.registerSlug, config.schemaSlug);
  }, [config?.registerSlug, config?.schemaSlug]);

  const schemaType = useMemo(() => {
    if (!config) return null;
    return object.getSchemaType(config.schemaSlug);
  }, [config?.schemaSlug]);

  const data =
    object.getObject(objectType, id) || object.getActiveObject(objectType) || null;

  const error = objectType
    ? (() => {
        const storeError = object.getError(objectType);
        return storeError ? { message: storeError } : null;
      })()
    : null;

  const loading =
    objectType && id
      ? !data &&
        (object.isLoading(`${objectType}_${id}`) ||
          object.isLoading(objectType) ||
          object.isSchemaLoading(schemaType))
      : false;

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

  useEffect(() => {
    if (!config || !data) return;
    object.setActiveObject(config.registerSlug, config.schemaSlug, data);
  }, [config?.schemaSlug, config?.registerSlug, data?.id]);

  const registerSlug = config?.registerSlug;
  const schemaSlug = config?.schemaSlug;

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
              <ConGebruikDetailsPageContent
                loading={loading}
                config={config}
                data={data}
                userStore={user}
                objectStore={object}
                id={id}
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

export default withStore(observer(ConGebruikDetailsPage));
