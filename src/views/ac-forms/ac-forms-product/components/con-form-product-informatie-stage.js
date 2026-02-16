import React, { memo } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * Product Informatie Stage Component
 *
 * This stage collects basic product information including name, descriptions,
 * website, logo, hosting details, and contact information.
 *
 * @param {Object} product - The product object containing form data
 * @param {Function} setProductData - Function to update product data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormProductInformatieStage = memo(
  ({
    product,
    setProductData,
    loading,
    touched,
    schemas,
    isMultiApplicatie,
    formType,
  }) => {
    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='product-informatie-section-title'
        aria-busy={loading ? 'true' : 'false'}
      >
        <h2 id='product-informatie-section-title' className='sr-only'>
          Product informatie
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Basisinformatie voor vindbaarheid in de Softwarecatalogus</strong>
          <br />
          Deze gegevens maken uw applicatie vindbaar in de Softwarecatalogus. Een duidelijke
          naam, samenvatting en website helpen gemeenten om uw oplossing snel te
          begrijpen en te beoordelen. Logo en contactgegevens zorgen voor herkenning
          en vertrouwen. Hosting- en juridische informatie geven inzicht in waar en
          hoe de applicatie beschikbaar is.
        </Paragraph>

        {/* Use the same container class as ConDynamicSchemaForm for consistency */}
        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Product Name and Website on same row */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='naam'
              value={product.naam || ''}
              onChange={(value) => setProductData('naam', value)}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
              customProps={{
                placeholder:
                  'Bijv. VNG Product ' + (isMultiApplicatie ? 'Suite' : ''),
              }}
            />

            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='website'
              value={product.website || ''}
              onChange={(value) => setProductData('website', value)}
              isDisabled={loading}
              touched={touched}
              width='half'
              schemas={schemas}
              customProps={{
                // Override input type to avoid browser's native URL validation
                inputType: 'text',
                // Override URL validation to allow domains without protocol
                required: true,
                validation: {
                  custom: (value) => {
                    if (!value || value.trim() === '') return true;
                    const website = value.trim();
                    // More permissive domain validation - allow domains with or without protocol
                    return validateWebsite(website);
                  },
                  customErrorMessage:
                    'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)',
                },
              }}
            />

            {/* Short Description - full width */}
            <div style={{ width: '100%' }}>
              <ConSchemaEnhancedField
                schemaType='product'
                schemaProperty='beschrijvingKort'
                value={product.beschrijvingKort || ''}
                onChange={(value) => setProductData('beschrijvingKort', value)}
                isDisabled={loading}
                width='full'
                schemas={schemas}
              />
              {typeof schemas?.product?.properties?.beschrijvingKort?.maxLength ===
                'number' && (
                <span className='character-count'>
                  {schemas?.product?.properties?.beschrijvingKort?.maxLength -
                    (product.beschrijvingKort || '').length}{' '}
                  karakters over
                </span>
              )}
            </div>

            {/* Long Description */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='beschrijvingLang'
              value={product.beschrijvingLang || ''}
              onChange={(value) => setProductData('beschrijvingLang', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            {/* Logo Upload */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='logo'
              value={product.logo}
              onChange={(value) => setProductData('logo', value)}
              isDisabled={loading}
              width='full'
              formData={{
                ...product,
                logoFilename: product.logoFilename, // Include filename for LogoUploadField
              }}
              customProps={{
                inputType: 'file',
                format: 'base64', // This will trigger the LogoUploadField
              }}
              onFieldChange={(fieldPath, value) => {
                // Handle filename updates for LogoUploadField
                if (fieldPath === 'logoFilename') {
                  setProductData('logoFilename', value);
                }
              }}
              schemas={schemas}
            />

            {/* Hosting Location and Jurisdiction */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='hostingLocatie'
              value={product.hostingLocatie || ''}
              onChange={(value) => setProductData('hostingLocatie', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='hostingJurisdictie'
              value={product.hostingJurisdictie || ''}
              onChange={(value) => setProductData('hostingJurisdictie', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* Contact Person */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='contactpersoon'
              value={product.contactpersoon || ''}
              onChange={(value) => setProductData('contactpersoon', value)}
              isDisabled={loading || formType === 'ontbrekend'}
              width='half'
              schemas={schemas}
              customProps={{
                getOptionLabel: (opt) => {
                  const c = opt?.data ?? opt;
                  return [c?.voornaam, c?.tussenvoegsel, c?.achternaam]
                    .filter(Boolean)
                    .join(' ');
                },
              }}
            />

            {/* Cloud Service Model */}
            <ConSchemaEnhancedField
              schemaType='product'
              schemaProperty='cloudDienstverleningsmodel'
              value={product.cloudDienstverleningsmodel || ''}
              onChange={(value) =>
                setProductData('cloudDienstverleningsmodel', value)
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

ConFormProductInformatieStage.displayName = 'ConFormProductInformatieStage';

export default ConFormProductInformatieStage;
