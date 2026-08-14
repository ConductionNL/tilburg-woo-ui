// eslint-disable-next-line import/no-unresolved
import React, { useState } from 'react';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@src/constants';
import clsx from 'clsx';
import { ConMarkdown } from '@components';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

/**
 * Markdown/HTML field with preview toggle.
 * - For markdown: renders markdown preview
 * - For html: shows raw textarea and sanitized preview via ConMarkdown pipeline (markdown renderer will still display HTML if provided)
 */
const MarkdownHtmlField = ({
  path,
  label,
  description,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  isMarkdown,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className='con-dynamic-schema-form-field con-dynamic-schema-form-field--span-2'>
      <label className='utrecht-form-label'>
        <span
          className={clsx('utrecht-heading-4', {
            'ac-form-field-header-info': description,
          })}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              {label}
              {required && (
                <>
                  <span className='required-indicator' aria-hidden='true'>
                    *
                  </span>
                  <span className='sr-only'>(verplicht)</span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input
                id={`${path}-preview-toggle`}
                type='checkbox'
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
              />
              <label
                className='utrecht-form-label'
                htmlFor={`${path}-preview-toggle`}
              >
                Toon voorbeeld
              </label>
            </div>
          </div>
          {description && (
            <>
              <span
                data-tooltip-id={TOOLTIP_ID}
                data-tooltip-content={description}
                className='info-indicator'
                role='img'
                aria-label={description}
              >
                <VISUALS.INFO />
              </span>
            </>
          )}
        </span>
      </label>

      <div className='con-dynamic-schema-form-flex'>
        {showPreview ? (
          <div className='con-dynamic-schema-form-preview'>
            <div className='con-dynamic-schema-form-preview__content markdown-preview'>
              {isMarkdown ? (
                <ConMarkdown>{value || ''}</ConMarkdown>
              ) : (
                <div>{parse(DOMPurify.sanitize(value || ''))}</div>
              )}
            </div>
          </div>
        ) : (
          <div className='con-dynamic-schema-form-textarea'>
            <textarea
              id={path}
              className='utrecht-textarea'
              value={value || ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownHtmlField;
