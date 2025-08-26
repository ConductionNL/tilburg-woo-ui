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
          onChange={(opts) =>
            setSelectedProductIds((opts || []).map((o) => o.value))
          }
          onInputChange={(inputValue, meta) => {
            if (meta && meta.action === 'input-change') {
              searchProducts(inputValue || '');
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
