import React, { useState, useEffect } from 'react';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@src/constants';
import clsx from 'clsx';

// Lazy load the markdown editor to avoid SSR issues
const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));

/**
 * Modern WYSIWYG Markdown Editor Field
 * 
 * Features:
 * - True WYSIWYG editing experience
 * - Live preview side-by-side
 * - Rich toolbar with formatting buttons
 * - User-friendly (no raw markdown editing required)
 * - Supports all common markdown features
 */
const ConWysiwygMarkdownField = ({
  path,
  label,
  description,
  value,
  onChange,
  placeholder,
  required,
  disabled,
}) => {
  const [editorValue, setEditorValue] = useState(value || '');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync external value changes with internal state
  useEffect(() => {
    if (value !== editorValue) {
      setEditorValue(value || '');
    }
  }, [value]);

  // Handle editor changes
  const handleEditorChange = (val) => {
    const newValue = val || '';
    setEditorValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Load the editor after mount to avoid SSR issues
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="con-wysiwyg-markdown-field">
      {/* Field Header */}
      <label className="utrecht-form-label">
        <h4
          className={clsx('utrecht-heading-4', {
            'ac-form-field-header-info': description,
          })}
        >
          <div className="con-wysiwyg-markdown-field__header">
            <div>
              {label}
              {required && (
                <>
                  <span className="required-indicator" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(verplicht)</span>
                </>
              )}
            </div>
          </div>
          {description && (
            <span
              data-tooltip-id={TOOLTIP_ID}
              data-tooltip-content={description}
              className="info-indicator"
              role="img"
              aria-label={description}
            >
              <VISUALS.INFO />
            </span>
          )}
        </h4>
      </label>

      {/* Editor Container */}
      <div className="con-wysiwyg-markdown-field__editor">
        {isLoaded ? (
          <React.Suspense fallback={<div className="con-wysiwyg-markdown-field__loading">Markdown editor wordt geladen...</div>}>
            <MDEditor
              value={editorValue}
              onChange={handleEditorChange}
              preview="edit"
              hideToolbar={disabled}
              visibleDragBar={false}
              data-color-mode="light"
              height={300}
              textareaProps={{
                placeholder: placeholder || 'Schrijf hier je markdown tekst...',
                disabled: disabled,
                required: required,
                id: path,
                style: {
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                },
              }}
              // Custom toolbar configuration for user-friendly editing
              toolbarHeight={40}
              // Enable preview by default for better UX
              data-testid={`markdown-editor-${path}`}
            />
          </React.Suspense>
        ) : (
          // Fallback textarea while loading
          <textarea
            id={path}
            className="utrecht-textarea con-wysiwyg-markdown-field__fallback"
            value={editorValue}
            onChange={(e) => handleEditorChange(e.target.value)}
            placeholder={placeholder || 'Schrijf hier je markdown tekst...'}
            disabled={disabled}
            required={required}
            rows={8}
          />
        )}
      </div>
    </div>
  );
};

export default ConWysiwygMarkdownField;
