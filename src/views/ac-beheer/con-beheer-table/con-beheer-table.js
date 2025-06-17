import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import ConTable from '../con-table';
import { AcFlex } from '@src/atoms';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../ac-beheer';
import { VISUALS } from '@src/constants';
import { useLaterEffect } from '@src/hooks';
import { sortPropertiesByOrder } from '@src/utilities';
import ConActionMenu from '../con-action-menu';

const GET_CONFIG = (type, metadata, navigate) => {
  let typeGetFailed = false;

  const config = {
    navigateView: null,
    registerSlug: 'voorzieningen',
    schemaSlug: null,
    extend: [],
    defaultHeaders: [],
    removeHeaders: [],
  };

  if (type) {
    switch (type) {
      case 'voorziening':
      case 'applicaties':
        config.navigateView = (id) => navigate(`/beheer/applicaties/${id}`);
        config.schemaSlug = 'voorziening';
        config.extend = [['_extend[]', 'standaarden']];
        config.defaultHeaders = [
          'naam',
          'referentieComponenten',
          'standaarden',
          'categorie',
          'links',
        ];
        break;

      case 'voorzieningaanboden':
      case 'voorzieningaanbod':
      case 'diensten':
        config.navigateView = (id) => navigate(`/beheer/diensten/${id}`);
        config.schemaSlug = 'voorzieningaanbod';
        config.extend = [
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'leverancier'],
        ];
        config.defaultHeaders = ['name', 'voorzieningName', 'email'];
        config.removeHeaders = ['ondersteundeStandaarden'];
        break;

      case 'voorzieninggebruiken':
      case 'gebruiken':
        config.navigateView = (id) => navigate(`/beheer/gebruiken/${id}`);
        config.schemaSlug = 'voorzieninggebruik';
        config.extend = [
          ['_extend[]', 'voorzieningId'],
          ['_extend[]', 'organisatieId'],
        ];
        config.defaultHeaders = ['id', 'versionId', 'eindDatum', 'status'];
        break;

      case 'voorzieningversies':
      case 'versies':
        config.navigateView = (id) => navigate(`/beheer/voorzieningen-versie/${id}`);
        config.schemaSlug = 'voorzieningversie';
        config.extend = [
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'kwetsbaarheden'],
        ];
        config.defaultHeaders = ['name', 'versienummer', 'releaseDatum', 'status'];
        break;

      case 'contracten':
      case 'overeenkomsten':
        config.navigateView = (id) => navigate(`/beheer/overeenkomsten/${id}`);
        config.schemaSlug = 'contract';
        config.extend = [['_extend[]', 'all']];
        config.defaultHeaders = [
          'name',
          'startDatum',
          'eindDatum',
          'contactPersonProvider',
        ];
        break;

      case 'organisaties':
      case 'organisatie':
        config.navigateView = (id) => navigate(`/beheer/organisaties/${id}`);
        config.schemaSlug = 'organisatie';
        config.extend = [['_extend[]', 'contactgegevens']];
        config.defaultHeaders = ['organizationName', 'logo', 'contactDetails'];
        break;

      case 'kwetsbaarheden':
        config.navigateView = (id) => navigate(`/beheer/kwetsbaarheden/${id}`);
        config.schemaSlug = 'kwetsbaarheid';
        config.defaultHeaders = ['titel', 'ernst', 'detectedOn', 'status'];
        break;

      case 'gebruikers':
        config.navigateView = (id) => navigate(`/beheer/gebruikers/${id}`);
        config.schemaSlug = 'gebruiker';
        config.defaultHeaders = ['name', 'status', 'lastActivity', 'email'];
        break;

      default:
        typeGetFailed = true;
    }
  }

  if ((metadata && !type) || (metadata && typeGetFailed)) {
    config.registerSlug = metadata.register?.id ?? metadata.register;
    config.schemaSlug = metadata.schema?.id ?? metadata.schema;
    config.extend = [['_extend[]', 'all']];
  }

  return config;
};

/**
 * @typedef {Object} typeProps
 * @param {
 * 'voorzieningen'
 * | 'applicaties'
 * | 'voorzieningaanboden'
 * | 'diensten'
 * | 'voorzieninggebruiken'
 * | 'gebruiken'
 * | 'voorzieningversies'
 * | 'versies'
 * | 'contracten'
 * | 'overeenkomsten'
 * | 'organisaties'
 * | 'kwetsbaarheden'
 * | 'gebruikers'
 * } type
 */

/**
 * @param {typeProps} props.type - The type of the table
 * @param {Object} props.metadata - If not type is given, use metadata to get the config. (Errors if both type and metadata are not given)
 * @param {function} props.getSelectedRows - function that gets called when a row is selected. Returns the selected rows.
 * @param {function} props.getSingleSelectedRow - function that gets called when a single row is selected. Returns the selected row.
 * @param {function} props.getModalValue - function that gets called when an action button is clicked and sets the modal to a value. Returns any string, e.g. 'edit' or 'delete'.
 * @param {Object} props.headerOverrides - object that contains custom content for the table headers.
 * @param {function} props.getHeaders - gets the headers generated by the component
 * @param {function} props.headers - sets the headers to custom headers, takes precedence over the headers generated by the component
 * @param {function} props.getDefaultHeaders - gets the default headers from the specified type
 * @returns
 */
const BeheerTable = forwardRef((props, ref) => {
  const {
    type,
    metadata,
    data: providedData = [],
    dataProperties: providedDataProperties = [],
    getSelectedRows,
    getSingleSelectedRow,
    getModalValue,
    headerOverrides,
    getLoading = () => false,
    getHeaders = () => [],
    headers: providedHeaders = [],
    getDefaultHeaders = () => [],
    actionButtons: overrideActionButtons = null,
    getConfig = () => {},
    tableProps = {},
    pagination = {},
    setPagination = () => {},
  } = props;

  if (!type && !metadata) {
    throw new Error('Either type or metadata (@self) must be provided');
  }

  const navigate = useNavigate();
  const { makeRequest } = useNextcloudRequests();

  const shouldFetchData = !providedData?.length;
  const shouldFetchDataProperties = !providedDataProperties?.length;

  const [data, setData] = useState([]);
  const [dataProperties, setDataProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [tableHeaders, setTableHeaders] = useState([]);

  const config = useMemo(() => {
    const config = GET_CONFIG(type, metadata, navigate);
    getConfig?.(config);
    return config;
  }, [type, navigate, metadata]);

  useEffect(() => {
    getDefaultHeaders?.(config.defaultHeaders);
  }, [config.defaultHeaders, getDefaultHeaders]);

  const fetchObjectData = async () => {
    const response = await makeRequest(
      `${BASE_URL}/apps/openregister/api/objects/${config.registerSlug}/${config.schemaSlug}`,
      [
        ...config.extend,
        ['_limit', pagination?.limit || 9999],
        ['_page', pagination?.page || 1],
      ],
      null,
      '/beheer/diensten'
    );

    const data = response.data;
    if (data.error) {
      setError({ message: data.error });
    } else {
      setData(data.results);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        pages: data.pages,
        offset: data.offset,
      }));
    }
    return data;
  };

  const fetchSchemaData = async () => {
    const response = await makeRequest(
      `${BASE_URL}/apps/openregister/api/schemas/${config.schemaSlug}`,
      null,
      null,
      '/beheer/diensten'
    );

    const data = response.data;
    if (data.error) {
      setError({ message: data.error });
      return data;
    }

    setDataProperties(sortPropertiesByOrder(data.properties));
    return data;
  };

  useEffect(async () => {
    // Set provided data if it exists
    if (!shouldFetchData) {
      setData(providedData);
    }

    if (!shouldFetchDataProperties) {
      setDataProperties(providedDataProperties);
    }

    // Return early if no fetching needed
    if (!shouldFetchData && !shouldFetchDataProperties) {
      return;
    }

    try {
      setLoading(true);
      getLoading?.(true);

      if (shouldFetchData) {
        await fetchObjectData();
      }
      if (shouldFetchDataProperties) {
        await fetchSchemaData();
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
      getLoading?.(false);
    }
  }, []);

  useLaterEffect(async () => {
    if (!shouldFetchData) return;

    try {
      setLoading(true);
      getLoading?.(true);

      await fetchObjectData();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
      getLoading?.(false);
    }
  }, [pagination.page, pagination.limit]);

  // Generate headers from dataProperties schema
  const generatedHeaders = useMemo(() => {
    if (!dataProperties) return [];

    const schemaHeaders = Object.entries(dataProperties)
      .filter(([key, value]) => value.visible !== false)
      .flatMap(([key, value]) => {
        // leverancier from diensten is a special case as its referenced twice
        if (headerOverrides && type === 'diensten' && key === 'leverancier') {
          return [
            headerOverrides?.['leverancier_naam'],
            headerOverrides?.['leverancier_email'],
          ];
        }

        // Check if we have a custom override for this header
        if (headerOverrides?.[key]) {
          return headerOverrides[key];
        }

        // Generate standard header from schema
        return {
          id: key,
          label: _.upperFirst(key),
          key: key,
        };
      })
      // Filter out headers that are in the removeHeaders config
      .filter((header) => !config.removeHeaders?.includes(header.id));

    return schemaHeaders;
  }, [dataProperties, headerOverrides, config.removeHeaders]);

  useEffect(() => {
    getHeaders?.(generatedHeaders);

    // default headers if `headers` is not being used
    if (generatedHeaders.length > 0) {
      setTableHeaders(
        generatedHeaders.filter(
          // Show all headers if:
          // 1. No defaultHeaders exist in config
          // 2. defaultHeaders is an empty array
          (header) =>
            !config.defaultHeaders?.length ||
            config.defaultHeaders.includes(header.id)
        )
      );
    }
  }, [generatedHeaders]);

  // if no overrideActionButtons are provided, use the default action buttons
  const overrideActionsIsValid =
    !!overrideActionButtons && typeof overrideActionButtons === 'function';

  const actionButtons = overrideActionsIsValid
    ? overrideActionButtons(config)
    : {
        id: 'actions',
        label: 'Acties',
        key: '',
        customContent: (row) => (
          <ConActionMenu>
            <ConActionMenu.Trigger
              icon={<VISUALS.ELLIPSIS />}
              buttonType='secondary'
            >
              Acties
            </ConActionMenu.Trigger>

            <ConActionMenu.Menu position='right'>
              <ConActionMenu.Button
                icon={<VISUALS.EYE />}
                onClick={() => {
                  config.navigateView(row.id);
                }}
              >
                Bekijken
              </ConActionMenu.Button>

              <ConActionMenu.Button
                icon={<VISUALS.PENCIL />}
                onClick={() => {
                  getSingleSelectedRow?.(row);
                  getModalValue?.('edit');
                }}
              >
                Bewerken
              </ConActionMenu.Button>

              <ConActionMenu.Button
                icon={<VISUALS.TRASHCAN />}
                onClick={() => {
                  getSingleSelectedRow?.(row);
                  getModalValue?.('delete');
                }}
              >
                Verwijderen
              </ConActionMenu.Button>
            </ConActionMenu.Menu>
          </ConActionMenu>
        ),
      };

  return (
    <ConTable
      data={data}
      // `providedHeaders` takes precedence over the tableHeaders generated by the component
      tableHeaders={[
        ...(!!providedHeaders?.length ? providedHeaders : tableHeaders),
        ...(actionButtons ? [actionButtons] : []),
      ]}
      getSelectedRows={getSelectedRows}
      renderSelectRowButtons
      ref={ref}
      truncateLines={3}
      showSortButtons
      loading={loading}
      {...tableProps}
    />
  );
});

export default BeheerTable;
