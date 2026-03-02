import React, { useState, useRef } from 'react';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@src/constants';
import { ConMarkdown } from '@components';
import clsx from 'clsx';

/**
 * Lightweight WYSIWYG-style Markdown Editor
 * 
 * Features:
 * - User-friendly toolbar with markdown shortcuts
 * - Live preview side-by-side
 * - Uses existing ConMarkdown component
 * - No external dependencies
 * - Responsive design
 */
const ConLightweightMarkdownEditor = ({
  path,
  label,
  description,
  value,
  onChange,
  placeholder,
  required,
  disabled,
}) => {
  const [activeView, setActiveView] = useState('split'); // 'edit', 'preview', 'split'
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Insert markdown at cursor position
  const insertMarkdown = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${before}${selectedText || placeholder}${after}`;
    
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    
    if (onChange) {
      onChange(newValue);
    }

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + (selectedText || placeholder).length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Toolbar buttons configuration
  const toolbarButtons = [
    {
      title: 'Vet (Bold)',
      icon: 'B',
      style: { fontWeight: 'bold' },
      action: () => insertMarkdown('**', '**', 'vetgedrukte tekst')
    },
    {
      title: 'Cursief (Italic)', 
      icon: 'I',
      style: { fontStyle: 'italic' },
      action: () => insertMarkdown('*', '*', 'cursieve tekst')
    },
    {
      title: 'Koptekst',
      icon: 'H1',
      style: { fontWeight: 'bold', fontSize: '12px' },
      action: () => insertMarkdown('## ', '', 'Koptekst')
    },
    {
      title: 'Link',
      icon: '🔗',
      action: () => insertMarkdown('[', '](https://example.com)', 'linktekst')
    },
    {
      title: 'Lijst',
      icon: '•',
      action: () => insertMarkdown('- ', '', 'lijstitem')
    },
    {
      title: 'Genummerde lijst',
      icon: '1.',
      action: () => insertMarkdown('1. ', '', 'lijstitem')
    },
    {
      title: 'Quote',
      icon: '❝',
      action: () => insertMarkdown('> ', '', 'citaat')
    },
    {
      title: 'Code',
      icon: '</>',
      style: { fontFamily: 'monospace', fontSize: '11px' },
      action: () => insertMarkdown('`', '`', 'code')
    }
  ];

  return (
    <div className="con-lightweight-markdown-editor">
      {/* Field Header */}
      <label className="utrecht-form-label">
        <h4
          className={clsx('utrecht-heading-4', {
            'ac-form-field-header-info': description,
          })}
        >
          <div className="con-lightweight-markdown-editor__header">
            <div>
              {label}
              {required && (
                <>
                  <span className="required-indicator" aria-hidden="true">*</span>
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

      {/* Toolbar */}
      {!disabled && (
        <div className="con-lightweight-markdown-editor__toolbar">
          <div className="con-lightweight-markdown-editor__toolbar-section">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                title={button.title}
                className="con-lightweight-markdown-editor__toolbar-btn"
                onClick={button.action}
                style={button.style}
              >
                {button.icon}
              </button>
            ))}
          </div>
          
          <div className="con-lightweight-markdown-editor__toolbar-section">
            <button
              type="button"
              title="Alleen bewerken"
              className={clsx('con-lightweight-markdown-editor__view-btn', {
                'con-lightweight-markdown-editor__view-btn--active': activeView === 'edit'
              })}
              onClick={() => setActiveView('edit')}
            >
              Bewerken
            </button>
            <button
              type="button"
              title="Gesplitste weergave"
              className={clsx('con-lightweight-markdown-editor__view-btn', {
                'con-lightweight-markdown-editor__view-btn--active': activeView === 'split'
              })}
              onClick={() => setActiveView('split')}
            >
              Beide
            </button>
            <button
              type="button"
              title="Alleen voorbeeld"
              className={clsx('con-lightweight-markdown-editor__view-btn', {
                'con-lightweight-markdown-editor__view-btn--active': activeView === 'preview'
              })}
              onClick={() => setActiveView('preview')}
            >
              Voorbeeld
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className={`con-lightweight-markdown-editor__content con-lightweight-markdown-editor__content--${activeView}`}>
        {/* Edit Area */}
        {(activeView === 'edit' || activeView === 'split') && (
          <div className="con-lightweight-markdown-editor__edit">
            <textarea
              ref={textareaRef}
              id={path}
              className="con-lightweight-markdown-editor__textarea"
              value={value || ''}
              onChange={handleChange}
              placeholder={placeholder || 'Schrijf hier je markdown tekst...\n\n**Gebruik de knoppen hierboven** voor eenvoudige opmaak.'}
              disabled={disabled}
              required={required}
              spellCheck="true"
            />
          </div>
        )}

        {/* Preview Area */}
        {(activeView === 'preview' || activeView === 'split') && (
          <div className="con-lightweight-markdown-editor__preview">
            <div className="con-lightweight-markdown-editor__preview-content">
              {value && value.trim() ? (
                <ConMarkdown>{value}</ConMarkdown>
              ) : (
                <div className="con-lightweight-markdown-editor__preview-placeholder">
                  Voorbeeld wordt hier weergegeven...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConLightweightMarkdownEditor;
