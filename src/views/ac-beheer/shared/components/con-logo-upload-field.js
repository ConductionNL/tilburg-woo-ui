import React, { useState } from 'react';
import { AcFlex } from '@src/atoms';

/**
 * Custom Logo Upload Component for form fields
 * Handles file selection and validation for logo uploads
 */
export const LogoUploadField = ({
  fieldConfig,
  value,
  onChange,
  validation,
  propertyName,
}) => {
  const [logoFile, setLogoFile] = useState(null);

  const handleLogoFileSelect = (e) => {
    if (!e.target.files.length) {
      setLogoFile(null);
      onChange(null);
      return;
    }

    const file = e.target.files[0];
    file.getDataUrl = async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    };

    setLogoFile(file);
    onChange(file);
  };

  return (
    <AcFlex column>
      <label className='utrecht-form-label'>
        <h4 className='utrecht-heading-4'>
          {fieldConfig.label}
          {validation.required && (
            <>
              <span className='required-indicator' aria-hidden='true'>
                *
              </span>
              <span className='sr-only'>(verplicht)</span>
            </>
          )}
        </h4>
      </label>

      <input
        id={`fileInput-${propertyName}`}
        type='file'
        accept={[
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/svg+xml',
        ].join(',')}
        multiple={false}
        onChange={handleLogoFileSelect}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid var(--utrecht-textbox-border-color)',
          borderRadius: 'var(--utrecht-select-border-radius)',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '1em',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#f0f0f0',
            borderColor: 'var(--utrecht-button-primary-action-border-color)',
          },
        }}
      />

      <small
        style={{
          display: 'block',
          marginTop: '0.5em',
          color: 'var(--utrecht-paragraph-color)',
          fontSize: '0.85em',
          fontStyle: 'italic',
          opacity: 0.85,
          userSelect: 'none',
        }}
      >
        Toegestane bestandstypen: png, jpeg, jpg, webp, svg
      </small>
    </AcFlex>
  );
};

export default LogoUploadField;
