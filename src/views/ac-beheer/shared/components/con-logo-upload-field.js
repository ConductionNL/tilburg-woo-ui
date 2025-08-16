// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { AcFlex } from '@src/atoms';

/**
 * Custom Logo Upload Component for form fields
 * Handles file selection and validation for logo uploads
 */
export const LogoUploadField = ({
  fieldConfig,
  _value,
  onChange,
  validation,
  propertyName,
  isDisabled,
}) => {
  const handleLogoFileSelect = (e) => {
    const files = e?.target?.files;
    if (!files || !files.length) {
      onChange('');
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result);
    };
    reader.onerror = () => {
      // TODO: show user-friendly error state if needed
      onChange('');
    };
    reader.readAsDataURL(file);
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
        disabled={isDisabled}
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
