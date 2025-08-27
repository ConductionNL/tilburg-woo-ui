import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Producten Selectie Stage
 * - Meerdere producten selecteren (multi-select)
 */
const ConFormProductenStage = memo(
  ({
    selectedProductIds,
    setSelectedProductIds,
    setSelectedProductOptions,
    productOptions,
    productsLoading,
    searchProducts,
  }) => {
    const value = (productOptions || []).filter((o) =>
      selectedProductIds.includes(o.value)
    );

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-producten-section-title'
      >
        <h2 id='dienst-producten-section-title' className='sr-only'>
          Producten selecteren
        </h2>

        <Paragraph style={{ marginBottom: '1rem' }}>
          Selecteer één of meerdere producten waarop deze dienst van toepassing is.
        </Paragraph>

        <ReactSelect
          isMulti
          className='ac-beheer-select'
          options={productOptions}
          value={value}
          isLoading={productsLoading}
          onChange={(opts) => {
            const arr = opts || [];
            setSelectedProductIds(arr.map((o) => o.value));
            setSelectedProductOptions(arr);
          }}
          onInputChange={(inputValue, meta) => {
            if (meta && meta.action === 'input-change') {
              // Debounce search by 500ms after user stops typing
              if (!window.__dienstProductsSearchTimers) {
                window.__dienstProductsSearchTimers = new Map();
              }
              const key = 'productenSearch';
              const timers = window.__dienstProductsSearchTimers;
              if (timers.has(key)) {
                clearTimeout(timers.get(key));
                timers.delete(key);
              }
              const timeoutId = setTimeout(() => {
                searchProducts(inputValue || '');
                timers.delete(key);
              }, 500);
              timers.set(key, timeoutId);
            }
            return inputValue;
          }}
          placeholder='Zoek en selecteer producten...'
        />
      </div>
    );
  }
);

ConFormProductenStage.displayName = 'ConFormProductenStage';

export default ConFormProductenStage;
