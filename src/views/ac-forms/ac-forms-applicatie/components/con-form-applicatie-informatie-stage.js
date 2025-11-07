import React, { memo } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';

/**
 * Applicatie Informatie Form Component
 *
 * This step collects basic information about the application.
 *
 * Features:
 * - Application name (required)
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormApplicatieInformatieStage = memo(
  ({ applicatie, setApplicatieData, loading, touched, schemas }) => {
    return (
      <div role='group' aria-labelledby='applicatie-info-section-title'>
        <h2 id='applicatie-info-section-title' className='sr-only'>
          Applicatie informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Application Name - Required */}
            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='naam'
              value={applicatie.naam || ''}
              touched={touched}
              onChange={(value) => setApplicatieData('naam', value)}
              isDisabled={loading}
              width='full'
              customProps={{
                required: true,
                placeholder: 'Naam van de applicatie',
              }}
              schemas={schemas}
            />

            {/* Cloud Service Model */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='cloudDienstverleningsmodel'
              value={applicatie.cloudDienstverleningsmodel || ''}
              onChange={(value) =>
                setApplicatieData('cloudDienstverleningsmodel', value)
              }
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatieInformatieStage.displayName = 'ConFormApplicatieInformatieStage';

export default ConFormApplicatieInformatieStage;
