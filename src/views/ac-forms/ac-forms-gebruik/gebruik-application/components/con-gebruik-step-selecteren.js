import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * ConGebruikStepSelecteren
 * Selecteren step for Aanbod beheerders flow.
 * Allows selecting one applicatie (filtered by leverancier) and multiple klanten.
 */
const ConGebruikStepSelecteren = ({
  gebruik,
  setGebruikData,
  moduleOptions,
  modulesLoading,
  searchLoading,
  searchModules,
  schemas,
  klantenOptions,
  klantenLoading,
  searchKlanten,
  selectedKlanten,
  setSelectedKlanten,
  loading,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='selecteren-title'
    >
      <h2 id='selecteren-title' className='sr-only'>
        Selecteer de applicatie en klanten
      </h2>
      <Paragraph className='con-form-wizard-paragraph'>
        Selecteer de applicatie(s) waarvan u het gebruik aan uw klanten wilt melden.
      </Paragraph>

      <div className='ac-register-form-grid'>
        <div style={{ maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='module'
            value={gebruik?.module || null}
            onChange={(value) => {
              const nextId =
                (value && value.data && (value.data.id || value.data.value)) ||
                (value && value.value) ||
                value;
              setGebruikData('module', nextId);
            }}
            isDisabled={modulesLoading || loading}
            isLoading={modulesLoading || searchLoading}
            width='full'
            schemas={schemas}
            optionsProvider={moduleOptions}
            onSearch={(_path, _refSlug, q) => searchModules && searchModules(q)}
            customProps={{
              label: 'Applicatie',
              placeholder: 'Selecteer een applicatie',
              required: true,
              description: 'Selecteer de applicatie uit uw aanbod',
            }}
          />

          <div style={{ marginTop: '1.5rem' }}>
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty='afnemer'
              value={selectedKlanten || []}
              onChange={(value) => {
                // Handle multi-select: value is array of option objects from ReactSelect
                const optionsArray = Array.isArray(value) ? value : [];

                // Extract IDs
                const klantenIds = optionsArray
                  .map((v) => {
                    // Extract ID from option object
                    if (v && typeof v === 'object') {
                      return String(
                        v.value || v.data?.id || v.data?.value || v.id || ''
                      );
                    }
                    return String(v || '');
                  })
                  .filter((id) => id && id !== ''); // Filter out empty values

                setSelectedKlanten(klantenIds);
              }}
              isDisabled={loading}
              isLoading={klantenLoading}
              width='full'
              schemas={schemas}
              optionsProvider={klantenOptions}
              onSearch={(_path, _refSlug, q) => searchKlanten && searchKlanten(q)}
              customProps={{
                label: 'Klant(en)',
                placeholder: 'Selecteer klanten',
                required: true,
                description:
                  'Selecteer de gemeenten of samenwerkingen aan wie u het gebruik wilt melden',
                isMulti: true,
                closeMenuOnSelect: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepSelecteren);
