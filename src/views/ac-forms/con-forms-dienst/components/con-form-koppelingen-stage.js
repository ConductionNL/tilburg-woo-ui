import React, { memo, useMemo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Koppelingen Selectie Stage voor Dienst
 * - Toont koppelingen die een van de geselecteerde modules bevatten (moduleA of moduleB)
 * - Selectie via checkboxen
 */
const ConFormKoppelingenStage = memo(
  ({
    selectedModuleIds,
    koppelingOptions,
    selectedKoppelingIds,
    setSelectedKoppelingIds,
  }) => {
    const filtered = useMemo(() => {
      if (!selectedModuleIds?.length) return [];
      return (koppelingOptions || []).filter((opt) => {
        const k = opt.data || {};
        const a = String(
          k.moduleA || k.applicatie1 || k.applicatieA || k.appA || ''
        );
        const b = String(
          k.moduleB || k.applicatie2 || k.applicatieB || k.appB || ''
        );
        return selectedModuleIds.includes(a) || selectedModuleIds.includes(b);
      });
    }, [koppelingOptions, selectedModuleIds]);

    const toggle = (id) => {
      setSelectedKoppelingIds((prev) => {
        if (prev.includes(id)) return prev.filter((v) => v !== id);
        return [...prev, id];
      });
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-koppelingen-section-title'
      >
        <h2 id='dienst-koppelingen-section-title' className='sr-only'>
          Koppelingen selecteren
        </h2>
        <Paragraph style={{ marginBottom: '1rem' }}>
          Selecteer de koppelingen die relevant zijn voor deze dienst. Alleen
          koppelingen met de geselecteerde applicaties worden getoond.
        </Paragraph>

        {filtered.length === 0 ? (
          <Paragraph>
            Geen koppelingen gevonden voor de geselecteerde applicaties.
          </Paragraph>
        ) : (
          <div className='con-form-checkbox-list'>
            {filtered.map((opt) => (
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
                  checked={selectedKoppelingIds.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span>
                  {(opt.data?.naam || opt.label) + ' – '}
                  {(opt.data?.moduleA ||
                    opt.data?.applicatie1 ||
                    opt.data?.applicatieA ||
                    opt.data?.appA ||
                    '-') +
                    ' ↔ ' +
                    (opt.data?.moduleB ||
                      opt.data?.applicatie2 ||
                      opt.data?.applicatieB ||
                      opt.data?.appB ||
                      '-')}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ConFormKoppelingenStage.displayName = 'ConFormKoppelingenStage';

export default ConFormKoppelingenStage;
