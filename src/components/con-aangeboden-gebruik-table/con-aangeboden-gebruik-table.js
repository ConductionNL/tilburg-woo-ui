import React, { useState, useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import ConTable from '@views/ac-beheer/shared/components/con-table';
import { AcFlex } from '@atoms';
import { AcButton } from '@molecules';
import { ConUuidResolver, ConSchemaResolver } from '@components';
import { VISUALS } from '@src/constants';
import { Alert, Paragraph } from '@utrecht/component-library-react';
import { Pagination } from '@amsterdam/design-system-react';
import ConPaginationLimitSelector, {
  usePaginationLimit,
} from '@src/components/con-pagination-limit-selector/con-pagination-limit-selector';

/**
 * Default client-side pagination limit - items shown per page
 */
const DEFAULT_PAGE_SIZE = 10;

/**
 * Pagination key for storing limit preference in session storage
 */
const PAGINATION_KEY = 'aangeboden_suggesties';

/**
 * Generic table component for displaying aangeboden (offered) suggestions
 * Supports multiple suggestion types: gebruik, applicatie, koppeling, dienst
 * Uses ConTable directly to avoid conflicts with generic BeheerTable data fetching
 *
 * @param {Object} props
 * @param {Object} props.store - MobX store instance
 * @param {Function} props.onDataChange - Callback when data availability changes
 * @param {string} props.id - Organization UUID for fetching suggestions
 */
const ConAangebodenSuggestiesTable = ({ store, onDataChange, id }) => {
  const { api } = store;

  // All fetched data from API
  const [allData, setAllData] = useState([]);
  // Current page for client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Track which row and action is currently being processed
  const [processingAction, setProcessingAction] = useState(null); // { id: string, action: 'claim' | 'deny' }

  // Use the pagination limit hook for consistent behavior with other beheer pages
  const [pageSize, setPageSize] = usePaginationLimit(
    PAGINATION_KEY,
    DEFAULT_PAGE_SIZE
  );

  // Use ref to store onDataChange to avoid it being a dependency
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  // Calculate total pages based on fetched data and page size
  const totalPages = Math.ceil(allData.length / pageSize);

  // Get current page data (client-side pagination)
  const paginatedData = allData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  /**
   * Fetches suggestions from the koppelingen-gebruik endpoint
   * This endpoint returns both gebruik and koppeling suggestions
   * The type of each item is determined from @self.schema
   */
  const fetchSuggestions = useCallback(async () => {
    if (!api?.aangebodenGebruik || !id) {
      console.error('AangebodenGebruik API not available or no organization ID');
      return [];
    }

    try {
      setError(null);

      // Fetch both gebruik and koppeling from the koppelingen endpoint
      const response = await api.aangebodenGebruik
        .getKoppelingenGebruiks(id)
        .catch((fetchError) => {
          console.warn('Error fetching suggestions:', fetchError);
          return { results: [] };
        });

      const results = response?.results || [];

      if (results.length > 0) {
        onDataChangeRef.current?.(true);
        return results;
      } else {
        onDataChangeRef.current?.(false);
        return [];
      }
    } catch (fetchError) {
      console.error('Error fetching suggestions:', fetchError);
      setError('Er is een fout opgetreden bij het laden van de gegevens.');
      onDataChangeRef.current?.(false);
      return [];
    }
  }, [api, id]);

  // Fetch data when id changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setCurrentPage(1); // Reset to first page when fetching new data
      const results = await fetchSuggestions();
      setAllData(results || []);
      setLoading(false);
    };

    loadData();
  }, [id, fetchSuggestions]);

  /**
   * Handle taking over a suggestion
   */
  const handleClaim = useCallback(
    async (suggestionId) => {
      if (!api?.aangebodenGebruik) return;

      try {
        setProcessingAction({ id: suggestionId, action: 'claim' });
        const response = await api.aangebodenGebruik.claimGebruik(suggestionId);

        if (response.success) {
          // Refresh the data after successful takeover
          const results = await fetchSuggestions();
          setAllData(results || []);
        } else {
          setError(response.error || 'Er is een fout opgetreden bij het overnemen.');
        }
      } catch (claimError) {
        console.error('Error taking over suggestion:', claimError);
        setError('Er is een fout opgetreden bij het overnemen.');
      } finally {
        setProcessingAction(null);
      }
    },
    [api, fetchSuggestions]
  );

  /**
   * Handle denying a suggestion
   */
  const handleDeny = useCallback(
    async (suggestionId) => {
      if (!api?.aangebodenGebruik) return;

      try {
        setProcessingAction({ id: suggestionId, action: 'deny' });
        const response = await api.aangebodenGebruik.denyGebruik(suggestionId);

        if (response.success) {
          // Refresh the data after successful denial
          const results = await fetchSuggestions();
          setAllData(results || []);
        } else {
          setError(response.error || 'Er is een fout opgetreden bij het afwijzen.');
        }
      } catch (denyError) {
        console.error('Error denying suggestion:', denyError);
        setError('Er is een fout opgetreden bij het afwijzen.');
      } finally {
        setProcessingAction(null);
      }
    },
    [api, fetchSuggestions]
  );

  // Define table headers for ConTable
  const tableHeaders = [
    {
      id: 'type',
      label: 'Type',
      key: '@self',
      customContent: (row) => {
        const schemaId = row?.['@self']?.schema;
        if (!schemaId) return '-';
        return <ConSchemaResolver capitalize>{schemaId}</ConSchemaResolver>;
      },
    },
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
      customContent: (row) => {
        const rowId = row?.['@self']?.id;
        const isThisRowProcessing = processingAction?.id === rowId;
        const isClaimLoading =
          isThisRowProcessing && processingAction?.action === 'claim';
        const isDenyLoading =
          isThisRowProcessing && processingAction?.action === 'deny';

        return (
          <AcFlex spacing='xs'>
            <AcButton
              style='buttonSlim'
              buttonType='primary'
              icon={<VISUALS.CHECK />}
              onClick={() => handleClaim(rowId)}
              disabled={isThisRowProcessing}
              loading={isClaimLoading}
              className='con-gebruik-action-button'
            >
              Overnemen
            </AcButton>
            <AcButton
              style='buttonSlim'
              buttonType='secondary'
              icon={<VISUALS.XMARK />}
              onClick={() => handleDeny(rowId)}
              disabled={isThisRowProcessing}
              loading={isDenyLoading}
              className='con-gebruik-action-button'
            >
              Afwijzen
            </AcButton>
          </AcFlex>
        );
      },
    },
  ];

  // Don't show empty state - parent component will hide the entire container
  // But still show if there's an error so user can try again
  if (!loading && allData.length === 0 && !error) {
    return null;
  }

  return (
    <div>
      {/* Show error above the table so user can still interact with remaining items */}
      {error && (
        <Alert type='error' className='con-suggesties-error-alert'>
          <button
            type='button'
            onClick={() => setError(null)}
            className='con-suggesties-error-alert__close-button'
            title='Sluiten'
            aria-label='Alert sluiten'
          >
            <VISUALS.CLOSE />
          </button>
          <div className='con-suggesties-error-alert__content'>
            <Paragraph>{error}</Paragraph>
          </div>
        </Alert>
      )}

      <ConTable
        data={paginatedData}
        tableHeaders={tableHeaders}
        loading={loading && !processingAction}
        renderSelectRowButtons={false}
        truncateLines={2}
        showSortButtons={true}
      />

      {/* Client-side pagination controls - matching beheer page styling */}
      <AcFlex justifyContent='between' alignItems='center'>
        <Pagination
          key={currentPage}
          totalPages={totalPages}
          page={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          nextLabel=''
          previousLabel=''
          maxVisiblePages={7}
        />

        {totalPages <= 1 && (
          <span className='ac-beheer-pagination-single-page'>Pagina 1 van 1</span>
        )}

        <ConPaginationLimitSelector
          objectType={PAGINATION_KEY}
          value={pageSize}
          onChange={setPageSize}
        />
      </AcFlex>
    </div>
  );
};

export default withStore(observer(ConAangebodenSuggestiesTable));
