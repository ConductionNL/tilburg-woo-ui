// eslint-disable-next-line import/no-unresolved
import React, { useRef } from 'react';
import { AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';

/**
 * Custom Logo Upload Component for form fields
 * Handles file selection and validation for logo uploads
 */
export const LogoUploadField = ({
  fieldConfig,
  _value,
  onChange,
  onChangeFileName,
  onClear,
  validation,
  propertyName,
  isDisabled,
  accept,
  showPreview = true,
}) => {
  const inputRef = useRef(null);
  const handleLogoFileSelect = (e) => {
    const files = e?.target?.files;
    if (!files || !files.length) {
      onChange('');
      if (onChangeFileName) onChangeFileName('');
      return;
    }

    const file = files[0];
    if (onChangeFileName) onChangeFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result);
    };
    reader.onerror = () => {
      // TODO: show user-friendly error state if needed
      onChange('');
      if (onChangeFileName) onChangeFileName('');
    };
    reader.readAsDataURL(file);
  };

  const defaultAccept = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
  ];
  const acceptAttr = Array.isArray(accept)
    ? accept.join(',')
    : typeof accept === 'string' && accept.length > 0
    ? accept
    : defaultAccept.join(',');

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
        ref={inputRef}
        id={`fileInput-${propertyName}`}
        type='file'
        accept={acceptAttr}
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
        Toegestane bestandstypen: {acceptAttr}
      </small>

      {(_value || fieldConfig?.filename) && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {fieldConfig?.filename ? (
            <span style={{ fontSize: '0.9em' }}>
              Geselecteerd: <b>{fieldConfig.filename}</b>
            </span>
          ) : null}
          {(_value || fieldConfig?.filename) && (
            <AcButton
              style='buttonSlim'
              buttonType='secondary'
              onClick={() => {
                if (inputRef.current) inputRef.current.value = null;
                onChange('');
                if (onChangeFileName) onChangeFileName('');
                if (onClear) onClear();
              }}
              title='Logo verwijderen'
            >
              Verwijderen
            </AcButton>
          )}
        </div>
      )}

      {showPreview && _value ? (
        <div
          style={{
            marginTop: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <img
            src={_value}
            alt='Logo preview'
            style={{
              display: 'block',
              maxWidth: '220px',
              maxHeight: '120px',
              objectFit: 'contain',
              border: '1px solid var(--utrecht-textbox-border-color)',
              borderRadius: '6px',
              padding: '6px',
              backgroundColor: 'white',
            }}
          />
        </div>
      ) : null}
    </AcFlex>
  );
};

export default LogoUploadField;
