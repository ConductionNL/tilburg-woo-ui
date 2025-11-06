import React, { memo, useMemo } from 'react';
import { ConUuidResolver } from '@components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Applicaties Selectie Stage
 * - Checkboxlijst van alle applicaties (modules)
 */
const ConFormApplicatiesStage = memo(
  ({
    productToModulesLookup,
    // Product-related props commented out
    // selectedProductIds,
    // selectedProductOptions,
    // productOptions,
    // productLabels,
    selectedModuleIds,
    setSelectedModuleIds,
    loadingModules,
  }) => {
    // Get all modules from the lookup (stored as { all: [...] })
    const allModules = useMemo(() => {
      if (productToModulesLookup?.all && Array.isArray(productToModulesLookup.all)) {
        return productToModulesLookup.all;
      }
      return [];
    }, [productToModulesLookup]);

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
          Selecteer de applicaties die onderdeel zijn van deze dienst.
        </Paragraph>

        {loadingModules ? (
          <Paragraph>Bezig met laden van applicaties…</Paragraph>
        ) : allModules.length === 0 ? (
          <Paragraph>Geen applicaties beschikbaar.</Paragraph>
        ) : (
          <div className='con-form-checkbox-list'>
            {allModules.map((opt) => (
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
                <span>
                  <ConUuidResolver>{opt.label}</ConUuidResolver>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ConFormApplicatiesStage.displayName = 'ConFormApplicatiesStage';

export default ConFormApplicatiesStage;
