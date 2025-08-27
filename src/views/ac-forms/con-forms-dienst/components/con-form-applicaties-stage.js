import React, { memo, useMemo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Applicaties Selectie Stage
 * - Checkboxlijst van applicaties (modules) die horen bij de geselecteerde producten
 */
const ConFormApplicatiesStage = memo(
  ({
    productToModulesLookup,
    selectedProductIds,
    selectedProductOptions,
    productOptions,
    productLabels,
    selectedModuleIds,
    setSelectedModuleIds,
  }) => {
    const groupedModules = useMemo(() => {
      // Build groups per selected product id with product label
      const map = [];
      (selectedProductIds || []).forEach((prodId) => {
        // Prefer label from productLabels (fetched detail), then selected options, then search options
        const productLabel =
          (productLabels && productLabels[prodId]) ||
          (selectedProductOptions || []).find((p) => p.value === prodId)?.label ||
          (productOptions || []).find((p) => p.value === prodId)?.label ||
          null;
        const items = productToModulesLookup[prodId] || [];
        if (items.length > 0) {
          map.push({ productId: prodId, productLabel, modules: items });
        }
      });
      return map;
    }, [productToModulesLookup, selectedProductIds, selectedProductOptions]);

    const toggle = (id) => {
      setSelectedModuleIds((prev) => {
        if (prev.includes(id)) return prev.filter((v) => v !== id);
        return [...prev, id];
      });
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-applicaties-section-title'
      >
        <h2 id='dienst-applicaties-section-title' className='sr-only'>
          Applicaties selecteren
        </h2>
        <Paragraph style={{ marginBottom: '1rem' }}>
          Selecteer de applicaties die onderdeel zijn van deze dienst. Alleen
          applicaties uit de gekozen producten worden getoond.
        </Paragraph>

        {groupedModules.length === 0 ? (
          <Paragraph>
            Geen applicaties beschikbaar voor de geselecteerde producten.
          </Paragraph>
        ) : (
          <div className='con-form-checkbox-list'>
            {groupedModules.map((group) => (
              <div key={group.productId} style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '0.25rem',
                  }}
                >
                  {group.productLabel || 'Product'}
                </div>
                {(group.modules || []).map((opt) => (
                  <label
                    key={opt.value}
                    className='ac-checkbox-label'
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={selectedModuleIds.includes(opt.value)}
                      onChange={() => toggle(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ConFormApplicatiesStage.displayName = 'ConFormApplicatiesStage';

export default ConFormApplicatiesStage;
