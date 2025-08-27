import React, { memo, useMemo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

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
    // Build a moduleId -> label map for display of endpoints

    // Already pre-filtered by server search; apply safety filter
    const extractRelationId = (rel) => {
      if (!rel) return '';
      if (typeof rel === 'string') return rel;
      if (typeof rel === 'object') {
        return String(rel.id || rel.value || rel?.['@self']?.id || '') || '';
      }
      return '';
    };

    const filtered = useMemo(() => {
      if (!selectedModuleIds?.length) return [];
      const selectedSet = new Set((selectedModuleIds || []).map((v) => String(v)));
      return (koppelingOptions || []).filter((opt) => {
        const k = opt.data || {};
        const rels = k?.['@self']?.relations || {};
        const aRel =
          rels.moduleA ?? k.moduleA ?? k.applicatie1 ?? k.applicatieA ?? k.appA;
        const bRel =
          rels.moduleB ?? k.moduleB ?? k.applicatie2 ?? k.applicatieB ?? k.appB;
        const aId = String(extractRelationId(aRel));
        const bId = String(extractRelationId(bRel));
        return selectedSet.has(aId) || selectedSet.has(bId);
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
            {filtered.map((opt) => {
              const k = opt.data || {};

              const title = String(
                k?.naam || k?.['@self']?.name || opt.label || opt.value
              );
              return (
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
                  <span>{title}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

ConFormKoppelingenStage.displayName = 'ConFormKoppelingenStage';

export default ConFormKoppelingenStage;
