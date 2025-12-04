import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import ConTable from '@views/ac-beheer/shared/components/con-table';
import { AcFlex } from '@atoms';
import { AcButton } from '@molecules';
import { ConUuidResolver } from '@components';
import { VISUALS } from '@src/constants';
import { Alert, Paragraph } from '@utrecht/component-library-react';

/**
 * Table component for displaying voorgesteld gebruik suggestions
 * Uses ConTable directly to avoid conflicts with generic BeheerTable data fetching
 */
const ConAangebodenGebruikTable = ({ store, onDataChange }) => {
  const { api } = store;

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [error, setError] = useState(null);

  // Custom data fetching that uses the AangebodenGebruik API
  const fetchVoorgesteldGebruik = useCallback(
    async (searchParams = {}) => {
      if (!api?.aangebodenGebruik) {
        console.error('AangebodenGebruik API not available');
        return;
      }

      try {
        setError(null);

        const params = {
          _limit: pagination.limit,
          _offset: (pagination.page - 1) * pagination.limit,
          ...searchParams,
        };

        const response = await api.aangebodenGebruik.getAfnemerGebruiks(params);

        if (response.results) {
          // Update pagination info
          setPagination((prev) => ({
            ...prev,
            total: response.total || 0,
            pages: response.pages || 0,
          }));

          // Inform parent component about data availability
          if (onDataChange) {
            onDataChange(response.results.length > 0);
          }

          return response.results;
        } else {
          setError('Er is een fout opgetreden bij het laden van de gegevens.');
          if (onDataChange) {
            onDataChange(false);
          }
          return [];
        }
      } catch (err) {
        console.error('Error fetching voorgesteld gebruiks:', err);
        setError('Er is een fout opgetreden bij het laden van de gegevens.');
        if (onDataChange) {
          onDataChange(false);
        }
        return [];
      }
    },
    [api, pagination.limit, pagination.page, onDataChange]
  );

  // Fetch initial data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const results = await fetchVoorgesteldGebruik();
      setData(results);
      setLoading(false);
    };

    loadData();
  }, [fetchVoorgesteldGebruik, pagination.page]);

  /**
   * Handle taking over a gebruik suggestion
   */
  const handleClaim = useCallback(
    async (gebruikId) => {
      if (!api?.aangebodenGebruik) return;

      try {
        setLoading(true);
        const response = await api.aangebodenGebruik.claimGebruik(gebruikId);

        if (response.success) {
          // Refresh the data after successful takeover
          const results = await fetchVoorgesteldGebruik();
          setData(results);
        } else {
          setError(response.error || 'Er is een fout opgetreden bij het overnemen.');
        }
      } catch (err) {
        console.error('Error taking over gebruik:', err);
        setError('Er is een fout opgetreden bij het overnemen.');
      } finally {
        setLoading(false);
      }
    },
    [api, fetchVoorgesteldGebruik]
  );

  /**
   * Handle denying a gebruik suggestion
   */
  const handleDeny = useCallback(
    async (gebruikId) => {
      if (!api?.aangebodenGebruik) return;

      try {
        setLoading(true);
        const response = await api.aangebodenGebruik.denyGebruik(gebruikId);

        if (response.success) {
          // Refresh the data after successful denial
          const results = await fetchVoorgesteldGebruik();
          setData(results);
        } else {
          setError(response.error || 'Er is een fout opgetreden bij het afwijzen.');
        }
      } catch (err) {
        console.error('Error denying gebruik:', err);
        setError('Er is een fout opgetreden bij het afwijzen.');
      } finally {
        setLoading(false);
      }
    },
    [api, fetchVoorgesteldGebruik]
  );

  // Define table headers for ConTable
  const tableHeaders = [
    {
      id: 'applicatie',
      label: 'Applicatie',
      key: '@self',
      customContent: (row) => {
        // Extract module (applicatie) from relations and resolve UUID to name
        const module = row?.module || row?.['@self']?.relations?.module;
        if (!module) return '-';

        // Handle both UUID string and object formats
        const moduleId =
          typeof module === 'string' ? module : module?.['@self']?.id || module?.id;
        if (!moduleId) return '-';

        return <ConUuidResolver>{moduleId}</ConUuidResolver>;
      },
    },
    {
      id: 'status',
      label: 'Status',
      key: 'status',
    },
    {
      id: 'beschrijving',
      label: 'Beschrijving',
      key: 'beschrijving',
    },
    {
      id: 'voorgesteld_door',
      label: 'Voorgesteld door',
      key: '@self',
      customContent: (row) => {
        // Extract organisation from @self object and resolve UUID to name
        const organisation = row?.['@self']?.organisation;
        if (!organisation) return '-';

        return <ConUuidResolver>{organisation}</ConUuidResolver>;
      },
    },
    {
      id: 'actions',
      label: 'Acties',
      key: '',
      static: true,
      customContent: (row) => (
        <AcFlex spacing='xs'>
          <AcButton
            style='buttonSlim'
            buttonType='primary'
            onClick={() => handleClaim(row?.['@self']?.id)}
            disabled={loading}
            className='con-gebruik-action-button'
          >
            <VISUALS.CHECK className='ac-button__icon' />
            Overnemen
          </AcButton>
          <AcButton
            style='buttonSlim'
            buttonType='secondary'
            onClick={() => handleDeny(row?.['@self']?.id)}
            disabled={loading}
            className='con-gebruik-action-button'
          >
            <VISUALS.XMARK className='ac-button__icon' />
            Afwijzen
          </AcButton>
        </AcFlex>
      ),
    },
  ];

  // Show error if there's one
  if (error) {
    return (
      <Alert type='error'>
        <Paragraph>{error}</Paragraph>
      </Alert>
    );
  }

  // Don't show empty state - parent component will hide the entire container
  if (!loading && data.length === 0) {
    return null;
  }

  return (
    <div>
      <ConTable
        data={data}
        tableHeaders={tableHeaders}
        loading={loading}
        renderSelectRowButtons={false}
        truncateLines={2}
        showSortButtons={true}
      />

      {/* Simple pagination controls */}
      {pagination.pages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '1rem',
            padding: '1rem',
          }}
        >
          <AcButton
            style='buttonSlim'
            buttonType='secondary'
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page <= 1 || loading}
          >
            Vorige
          </AcButton>

          <span>
            Pagina {pagination.page} van {pagination.pages} ({pagination.total}{' '}
            resultaten)
          </span>

          <AcButton
            style='buttonSlim'
            buttonType='secondary'
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(prev.pages, prev.page + 1),
              }))
            }
            disabled={pagination.page >= pagination.pages || loading}
          >
            Volgende
          </AcButton>
        </div>
      )}
    </div>
  );
};

export default withStore(observer(ConAangebodenGebruikTable));
