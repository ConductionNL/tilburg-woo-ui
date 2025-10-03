import React, { memo, useEffect } from 'react';
import { AcCheckbox } from '@src/molecules';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';

/**
 * Aanbieder Informatie Form Component
 *
 * This step allows users to either select an existing organization or create a new one
 * when registering a missing product (type=ontbrekend).
 *
 * Features:
 * - Radio button choice between existing and new organization
 * - Searchable dropdown for existing organizations (defaults to user's active organization)
 * - Full form for creating new organization based on organisatie schema
 *
 * Only shown when formType === 'ontbrekend'
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProductData - Function to update product data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration (organisatie schema)
 * @param {Object} userStore - User store for active organization
 * @param {string} aanbiederkeuze - Choice between 'bestaand' or 'nieuw'
 * @param {Function} setAanbiederKeuze - Function to update choice
 */
const ConFormAanbiederInformatieStage = memo(
  ({
    product,
    setProductData,
    loading,
    // touched,
    schemas,
    store,
    aanbiederkeuze,
    setAanbiederKeuze,
  }) => {
    // Set default aanbieder to user's active organization when switching to 'bestaand'
    useEffect(() => {
      if (
        aanbiederkeuze === 'bestaand' &&
        store.user.activeOrganization &&
        !product.aanbieder
      ) {
        setProductData('aanbieder', store.user.activeOrganization.uuid);
      }
    }, [aanbiederkeuze, store.user.activeOrganization, product.aanbieder]);

    // Handle choice change between existing and new
    const handleChoiceChange = (choice) => {
      setAanbiederKeuze(choice);
      if (choice === 'bestaand') {
        // Clear new organization fields
        setProductData('aanbiederNaam', '');
        setProductData('aanbiederType', '');
        setProductData('aanbiederWebsite', '');
        setProductData('aanbiederBeschrijvingKort', '');
        setProductData('aanbiederBeschrijvingLang', '');
        setProductData('aanbiederEmail', '');
        setProductData('aanbiederTelefoonnummer', '');
        setProductData('aanbiederKvkNummer', '');
        setProductData('aanbiederLogo', '');
        // Set to default organization (user's active organization)
        if (store.user.activeOrganization) {
          setProductData('aanbieder', store.user.activeOrganization.uuid);
        }
      } else {
        // Clear existing organization selection
        setProductData('aanbieder', null);
      }
    };

    return (
      <div role='group' aria-labelledby='aanbieder-section-title'>
        <h2 id='aanbieder-section-title' className='sr-only'>
          Aanbieder informatie
        </h2>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Choice between existing and new organization - using same styling as ProductOpbouw */}
            <div className='con-form-field-wrapper field-size-full'>
              <div style={{ marginBottom: '1rem' }}>
                <h3
                  style={{
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                  }}
                >
                  Aanbieder selecteren
                </h3>

                <div className='ac-register-form-checkbox-wrapper'>
                  <AcCheckbox
                    label='Bestaande organisatie selecteren'
                    value='bestaand'
                    checked={aanbiederkeuze === 'bestaand'}
                    onChange={() => handleChoiceChange('bestaand')}
                    disabled={loading}
                  />
                  <AcCheckbox
                    label='Nieuwe organisatie aanmaken'
                    value='nieuw'
                    checked={aanbiederkeuze === 'nieuw'}
                    onChange={() => handleChoiceChange('nieuw')}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Existing organization dropdown - using ConSchemaEnhancedField */}
            {aanbiederkeuze === 'bestaand' && (
              <ConSchemaEnhancedField
                schemaType='product'
                schemaProperty='aanbieder'
                value={product.aanbieder}
                onChange={(value) => setProductData('aanbieder', value)}
                isDisabled={loading}
                width='full'
                customProps={{
                  // placeholder will come from schema example
                  isClearable: true,
                }}
                schemas={schemas}
              />
            )}

            {/* New organization form fields */}
            {aanbiederkeuze === 'nieuw' && (
              <>
                {/* Organization Name - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={product.aanbiederNaam || ''}
                  onChange={(value) => setProductData('aanbiederNaam', value)}
                  isDisabled={loading}
                  width='full'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Organization Type - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='type'
                  value={product.aanbiederType || ''}
                  onChange={(value) => setProductData('aanbiederType', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />

                {/* Organization Website - Required */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='website'
                  value={product.aanbiederWebsite || ''}
                  onChange={(value) => setProductData('aanbiederWebsite', value)}
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Short Description */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='beschrijvingKort'
                  value={product.aanbiederBeschrijvingKort || ''}
                  onChange={(value) =>
                    setProductData('aanbiederBeschrijvingKort', value)
                  }
                  isDisabled={loading}
                  width='full'
                  customProps={{
                    // placeholder will come from schema example
                    maxLength: 255,
                  }}
                  schemas={schemas}
                />

                {/* Long Description */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='beschrijvingLang'
                  value={product.aanbiederBeschrijvingLang || ''}
                  onChange={(value) =>
                    setProductData('aanbiederBeschrijvingLang', value)
                  }
                  isDisabled={loading}
                  width='full'
                  customProps={{
                    // placeholder will come from schema example
                    component: 'AcTextarea',
                    rows: 4,
                    maxLength: 5000,
                  }}
                  schemas={schemas}
                />

                {/* Email Address */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='e-mailadres'
                  value={product.aanbiederEmail || ''}
                  onChange={(value) => setProductData('aanbiederEmail', value)}
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Phone Number */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='telefoonnummer'
                  value={product.aanbiederTelefoonnummer || ''}
                  onChange={(value) =>
                    setProductData('aanbiederTelefoonnummer', value)
                  }
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* KvK Number */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='kvkNummer'
                  value={product.aanbiederKvkNummer || ''}
                  onChange={(value) => setProductData('aanbiederKvkNummer', value)}
                  isDisabled={loading}
                  width='half'
                  // placeholder will come from schema example
                  schemas={schemas}
                />

                {/* Logo URL */}
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='logo'
                  value={product.aanbiederLogo || ''}
                  onChange={(value) => setProductData('aanbiederLogo', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ConFormAanbiederInformatieStage.displayName = 'ConFormAanbiederInformatieStage';

export default ConFormAanbiederInformatieStage;
