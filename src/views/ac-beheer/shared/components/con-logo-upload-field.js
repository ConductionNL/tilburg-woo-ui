// eslint-disable-next-line import/no-unresolved
import React, { useMemo, useRef, useState } from 'react';
import { AcFlex } from '@src/atoms';
import { AcButton } from '@src/molecules';

/**
 * Custom Logo Upload Component for form fields
 * Handles file selection and validation for logo uploads
 *
 * @param {Object} props
 * @param {'normal'|'small'} props.size - Size variant of the component
 */
export const LogoUploadField = ({
  fieldConfig,
  _value,
  value, // Support both value (from ConDynamicSchemaForm) and _value (legacy)
  onChange,
  onChangeFileName,
  onClear,
  validation,
  propertyName,
  isDisabled,
  accept,
  showPreview = true,
  size = 'normal',
  maxFileSize = 1024, // in KB (default 1 MB)
}) => {
  const inputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Use value if provided (from ConDynamicSchemaForm), otherwise fall back to _value
  const logoValue = value !== undefined ? value : _value;

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

  const handleLogoFileSelect = (e) => {
    const files = e?.target?.files;
    if (!files || !files.length) {
      onChange('');
      setSelectedFileName('');
      if (onChangeFileName) onChangeFileName('');
      setErrorMessage('');
      return;
    }

    const file = files[0];

    // Build normalized tokens from `accept` supporting:
    // - extensions: ".png"
    // - exact MIME types: "image/png"
    // - wildcard types: "image/*"
    const tokens = acceptAttr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const fileType = (file.type || '').toLowerCase();
    const fileExt =
      file.name && file.name.includes('.')
        ? `.${file.name.split('.').pop().toLowerCase()}`
        : '';

    const isAllowed = tokens.some((token) => {
      // Match explicit extension (e.g. ".png")
      if (token.startsWith('.')) return fileExt === token;
      // Match wildcard groups (e.g. "image/*")
      if (token.endsWith('/*')) {
        const base = token.slice(0, -2);
        return fileType.startsWith(`${base}/`);
      }
      // Match exact MIME types (e.g. "image/png")
      if (token.includes('/')) return fileType === token;
      // Fallback for bare extensions without a dot (e.g. 'png')
      return token === fileExt.replace('.', '');
    });

    if (!isAllowed) {
      if (inputRef.current) inputRef.current.value = null;
      onChange('');
      setSelectedFileName('');
      if (onChangeFileName) onChangeFileName('');
      setErrorMessage(
        `Bestandstype niet toegestaan. Toegestane typen: ${readableAccept.join(
          ', '
        )}`
      );
      return;
    }

    // Validate file size against maxFileSize (KB)
    const limitBytes = (Number(maxFileSize) || 0) * 1024;
    const fileSizeBytes = file.size || 0;
    if (limitBytes > 0 && fileSizeBytes > limitBytes) {
      if (inputRef.current) inputRef.current.value = null;
      onChange('');
      setSelectedFileName('');
      if (onChangeFileName) onChangeFileName('');
      setErrorMessage(
        `Bestand is te groot. Maximale grootte is ${readableMaxFileSize}.`
      );
      return;
    }

    setErrorMessage('');
    setSelectedFileName(file.name);
    if (onChangeFileName) {
      onChangeFileName(file.name);
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result);
    };
    reader.onerror = () => {
      // TODO: show user-friendly error state if needed
      onChange('');
      setSelectedFileName('');
      if (onChangeFileName) onChangeFileName('');
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  /**
   * Convert the accept attribute to a readable format
   *
   * @example
   * ```
   * 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml'
   * => ['png', 'jpeg', 'jpg', 'webp', 'svg']
   * ```
   *
   * if no standard accept type is given (e.g. '.png') just return the item
   *
   * @example
   * ```
   * '.pdf,.txt,.doc,.docx'
   * => ['.pdf', '.txt', '.doc', '.docx']
   * ```
   *
   * @returns {string[]}
   */
  const readableAccept = useMemo(() => {
    return acceptAttr.split(',').map((item) => {
      const type = item.split('/')[1];
      if (!type) return item;
      return type.includes('+') ? type.split('+')[0] : type;
    });
  }, [acceptAttr]);

  // Human-readable max file size (uses highest fitting unit)
  const readableMaxFileSize = useMemo(() => {
    let sizeValue = Number(maxFileSize) || 0; // in KB
    const units = ['KB', 'MB', 'GB'];
    let unitIndex = 0;
    while (sizeValue >= 1024 && unitIndex < units.length - 1) {
      sizeValue = sizeValue / 1024;
      unitIndex += 1;
    }
    const isInteger = Number.isInteger(sizeValue);
    const displayValue = isInteger ? sizeValue : Math.round(sizeValue * 10) / 10; // one decimal
    return `${displayValue} ${units[unitIndex]}`;
  }, [maxFileSize]);

  // Validate size prop
  const validSizes = ['normal', 'small'];
  const componentSize = validSizes.includes(size) ? size : 'normal';

  // Get the display filename - auto-detect from URL if needed
  const displayFileName = useMemo(() => {
    if (selectedFileName) return selectedFileName;
    if (fieldConfig?.filename) return fieldConfig.filename;

    // Auto-detect filename from URL if logoValue is a URL
    if (logoValue && typeof logoValue === 'string') {
      if (logoValue.startsWith('http')) {
        const urlParts = logoValue.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        // Decode URI component in case filename has special characters
        try {
          return decodeURIComponent(lastPart) || 'Bestaand logo';
        } catch {
          return lastPart || 'Bestaand logo';
        }
      }
      // If it's base64 or other data, show generic label
      if (logoValue.length > 0) {
        return 'Bestaand logo';
      }
    }

    return '';
  }, [selectedFileName, fieldConfig?.filename, logoValue]);

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

      {componentSize === 'small' ? (
        <>
          <input
            ref={inputRef}
            id={`fileInput-${propertyName}`}
            type='file'
            accept={acceptAttr}
            multiple={false}
            onChange={handleLogoFileSelect}
            disabled={isDisabled}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--utrecht-textbox-border-color)',
              borderRadius: 'var(--utrecht-select-border-radius)',
              textAlign: 'center',
            }}
          >
            <button
              type='button'
              onClick={handleButtonClick}
              disabled={isDisabled}
              style={{
                padding: '1px 6px',
                border: '1px solid #767676',
                borderRadius: '2px',
                backgroundColor: '#f0f0f0',
                color: '#000',
                fontSize: '16px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                marginRight: '8px',
                minWidth: '125px',
                height: '25px',
                boxSizing: 'border-box',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.target.style.backgroundColor = '#e0e0e0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.target.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseDown={(e) => {
                if (!isDisabled) {
                  e.target.style.backgroundColor = '#d0d0d0';
                  e.target.style.borderColor = '#5a5a5a';
                }
              }}
              onMouseUp={(e) => {
                if (!isDisabled) {
                  e.target.style.backgroundColor = '#e0e0e0';
                  e.target.style.borderColor = '#767676';
                }
              }}
            >
              Bestand kiezen
            </button>
          </div>
        </>
      ) : (
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
      )}

      {componentSize !== 'small' && (
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
          Toegestane bestandstypen: {readableAccept.join(', ')}
          <br />
          Bestand mag maximaal {readableMaxFileSize} groot zijn.
        </small>
      )}

      {errorMessage && (
        <small
          role='alert'
          style={{
            display: 'block',
            marginTop: '0.5em',
            color: 'var(--utrecht-form-input-invalid-color, #d52b1e)',
            fontSize: '0.85em',
          }}
        >
          {/* Accessible inline error for invalid file types */}
          {errorMessage}
        </small>
      )}

      {(logoValue || displayFileName) && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {displayFileName && (
            <span style={{ fontSize: '0.9em' }}>
              {componentSize === 'small' ? (
                <b>{displayFileName}</b>
              ) : (
                <>
                  Geselecteerd: <b>{displayFileName}</b>
                </>
              )}
            </span>
          )}
          {(logoValue || displayFileName) && (
            <AcButton
              style='buttonSlim'
              buttonType='secondary'
              disabled={isDisabled}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = null;
                onChange(null); // Send null to backend when deleting
                setSelectedFileName('');
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

      {showPreview && logoValue ? (
        <div
          style={{
            marginTop: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <img
            src={logoValue}
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
