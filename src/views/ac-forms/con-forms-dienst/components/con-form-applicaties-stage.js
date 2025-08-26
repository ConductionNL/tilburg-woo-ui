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
    selectedModuleIds,
    setSelectedModuleIds,
  }) => {
    const availableModules = useMemo(() => {
      const moduleMap = new Map();
      (selectedProductIds || []).forEach((prodId) => {
        const items = productToModulesLookup[prodId] || [];
        items.forEach((mod) => {
          if (!moduleMap.has(mod.value)) moduleMap.set(mod.value, mod);
        });
      });
      return Array.from(moduleMap.values());
    }, [productToModulesLookup, selectedProductIds]);

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

        {availableModules.length === 0 ? (
          <Paragraph>
            Geen applicaties beschikbaar voor de geselecteerde producten.
          </Paragraph>
        ) : (
          <div className='con-form-checkbox-list'>
            {availableModules.map((opt) => (
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
        )}
      </div>
    );
  }
);

ConFormApplicatiesStage.displayName = 'ConFormApplicatiesStage';

export default ConFormApplicatiesStage;
