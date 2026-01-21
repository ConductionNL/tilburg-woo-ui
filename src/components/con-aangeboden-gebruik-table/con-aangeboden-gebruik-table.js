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
import { useResolvedSchema } from '@src/utilities/con-resolve-schema';

/**
 * Component that renders the applicatie column content, waiting for schema cache if needed
 */
const ApplicatieColumnContent = ({ row }) => {
  const schemaId = row?.['@self']?.schema;
  const { slug: schemaSlug, isLoading } = useResolvedSchema(schemaId);

  if (isLoading) {
    return '...';
  }

  // For module (Applicatie): display the name of the application itself
  if (schemaSlug === 'module') {
    const name = row?.naam || row?.name;
    if (name) return name;
    // Fallback to resolving the row's own ID
    const rowId = row?.['@self']?.id;
    return rowId ? <ConUuidResolver>{rowId}</ConUuidResolver> : '-';
  }

  // For koppeling: display moduleA
  if (schemaSlug === 'koppeling') {
    const moduleA = row?.moduleA;
    if (!moduleA) return '-';
    const moduleAId =
      typeof moduleA === 'string'
        ? moduleA
        : moduleA?.['@self']?.id || moduleA?.id;
    return moduleAId ? <ConUuidResolver>{moduleAId}</ConUuidResolver> : '-';
  }

  // For dienst: display modules array joined with commas
  if (schemaSlug === 'dienst') {
    const modules = row?.modules;
    if (!modules || !Array.isArray(modules) || modules.length === 0)
      return '-';

    return (
      <>
        {modules.map((moduleItem, index) => {
          const moduleId =
            typeof moduleItem === 'string'
              ? moduleItem
              : moduleItem?.['@self']?.id || moduleItem?.id;
          if (!moduleId) return null;

          return (
            <React.Fragment key={moduleId}>
              <ConUuidResolver>{moduleId}</ConUuidResolver>
              {index < modules.length - 1 && ', '}
            </React.Fragment>
          );
        })}
      </>
    );
  }

  // Default fallback: try to get module from relations (for gebruik and other types)
  const module = row?.module || row?.['@self']?.relations?.module;
  if (!module) return '-';

  const moduleId =
    typeof module === 'string' ? module : module?.['@self']?.id || module?.id;
  if (!moduleId) return '-';

  return <ConUuidResolver>{moduleId}</ConUuidResolver>;
};

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
        .getAanbod(id)
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
        const response = await api.aangebodenGebruik.acceptAanbod(suggestionId);

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
        const response = await api.aangebodenGebruik.denyAanbod(suggestionId);

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
        return <ApplicatieColumnContent row={row} />;
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
        // Hack because id does not give back the correct uuid TODO: if fixed in the api remove this
        // const rowId = row?.['@self']?.id;
        const rowId = row?.['@self']?.uuid;
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
