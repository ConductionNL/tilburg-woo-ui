import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcButton, AcFormField } from '@molecules';
import { TOOLTIP_ID } from '@src/index.web';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@src/atoms';

// Markdown Editor
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';

/**
 * ConEditableDescription - A versatile inline editable text/markdown field component for object properties.
 *
 * **Key Features:**
 * - Inline editing with save/cancel functionality
 * - Support for both plain text and markdown content
 * - Automatic character counting with configurable limits
 * - Integration with ObjectStore for seamless data persistence
 * - Custom value serialization/deserialization support
 * - Tooltip support for field labels
 * - Local loading states and error handling
 * - Markdown preview with rich plugin support
 *
 * **Markdown Support:**
 * When `isMarkdown` is enabled, the component provides:
 * - Full-featured markdown editor with toolbar
 * - Live preview capabilities
 * - Support for GitHub Flavored Markdown (GFM)
 * - Definition lists, emoji, superscript/subscript
 * - Mark highlighting and automatic heading slugs
 * - Accessible keyboard navigation
 *
 * **Data Flow:**
 * 1. Component receives `value` prop and deserializes it for display
 * 2. User clicks "Bewerken" to enter edit mode
 * 3. Changes are tracked in local state with character counting
 * 4. On save, uses ObjectStore.patchObject() to persist changes
 * 5. Success callback is triggered with the new value
 *
 * **Loading State Management:**
 * - Uses local loading state (`localSaving`) to prevent UI conflicts
 * - Each component instance manages its own loading state independently
 * - Prevents multiple instances from showing loading when editing different fields
 *
 * @example
 * ```jsx
 * // Basic text field
 * <ConEditableDescription
 *   registerSlug="products"
 *   schemaSlug="product"
 *   objectId="123"
 *   field="description"
 *   label="Beschrijving"
 *   value={product.description}
 *   placeholder="Voer een beschrijving in..."
 *   onSuccess={(newValue) => console.log('Updated:', newValue)}
 * />
 *
 * // Markdown field with custom deserialization
 * <ConEditableDescription
 *   registerSlug="articles"
 *   schemaSlug="article"
 *   objectId="456"
 *   field="content"
 *   label="Inhoud"
 *   value={article.content}
 *   isMarkdown={true}
 *   maxLength={5000}
 *   deserialize={(val) => val?.content || ''}
 *   tooltip="Gebruik markdown voor opmaak"
 *   markdownPreviewClassName="article-preview"
 *   onSuccess={(newValue) => refreshArticle()}
 * />
 * ```
 *
 * @param {Object} props - The component props.
 * @param {Object} props.store - MobX store object (injected by withStore HOC).
 * @param {Object} props.store.object - ObjectStore instance for data operations.
 * @param {string} props.registerSlug - The register slug for the ObjectStore operation.
 * @param {string} props.schemaSlug - The schema slug for the ObjectStore operation.
 * @param {string} props.objectId - The unique identifier of the object being edited.
 * @param {string} props.field - The field name on the object to update.
 * @param {string} [props.markdownPreviewClassName] - CSS class name for markdown preview styling.
 * @param {string} props.label - The display label for the field.
 * @param {string} [props.placeholder=''] - Placeholder text for the input field.
 * @param {string} [props.tooltip=''] - Tooltip text to display next to the label.
 * @param {number} [props.maxLength=5000] - Maximum character limit for the field.
 * @param {boolean} [props.isMarkdown=false] - Whether to enable markdown editing and preview.
 * @param {any} props.value - The current value of the field (will be deserialized for editing).
 * @param {Function} [props.deserialize=(v) => v ?? ''] - Function to transform the value for editing. Receives the raw value and should return a string.
 * @param {Function} [props.onSuccess] - Callback function called after successful save. Receives the new value as parameter.
 *
 * @returns {React.ReactElement} The rendered editable description component.
 *
 * @note The component automatically handles the editing state and does not preserve unsaved changes when the value prop changes.
 * @note Character counting includes all characters including markdown syntax when in markdown mode.
 * @note Uses local loading state management to prevent conflicts between multiple component instances editing different fields on the same object.
 *
 * @author Conduction Development Team
 */
const ConEditableDescription = ({
  store: { object: objectStore },
  registerSlug,
  schemaSlug,
  objectId,
  field,
  markdownPreviewClassName,
  label,
  placeholder = '',
  tooltip = '',
  maxLength = 5000,
  isMarkdown = false,
  value,
  // serialize = (v) => v,
  deserialize = (v) => v ?? '',
  onSuccess,
  onCancel,
  canEdit = true,
  isEditingCustomTrigger = undefined,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [localSaving, setLocalSaving] = useState(false);

  // Remove the requestType and objectStore.isLoading logic

  useEffect(() => {
    const v = deserialize(value);
    setTempValue(v || '');
    setCharCount((v || '').length);
  }, [value]);

  const handleSave = async () => {
    if (!objectId || !field) return;
    const payload = { [field]: tempValue };
    setLocalSaving(true); // Set local saving state
    try {
      await objectStore.patchObject(registerSlug, schemaSlug, objectId, payload);

      setIsEditing(false);
      if (onSuccess) {
        onSuccess(tempValue);
      }
    } catch (e) {
      // TODO: replace with project-wide notification
      console.error('Error updating field', field, e);
    } finally {
      setLocalSaving(false); // Clear local saving state
    }
  };

  useEffect(() => {
    if (isEditingCustomTrigger) {
      const v = deserialize(value);
      setIsEditing(true);
      setTempValue(v || '');
      setCharCount((v || '').length);
    } else if (isEditingCustomTrigger === false) {
      // Handle when custom trigger becomes false - exit editing mode
      setIsEditing(false);
      const v = deserialize(value);
      setTempValue(v || '');
      setCharCount((v || '').length);
    }
  }, [isEditingCustomTrigger, value, deserialize]);

  return (
    <div className='ac-description-row'>
      {isEditing && canEdit ? (
        <div className='ac-organisatie-detail-form-wrapper'>
          <div className='ac-organisatie-detail-form'>
            {isMarkdown ? (
              <div className='con-wysiwyg-markdown-field'>
                <label className='utrecht-form-label'>
                  <Heading
                    level={4}
                    className={clsx({
                      'ac-form-field-header-info': tooltip,
                    })}
                  >
                    <div>{label}</div>
                    {tooltip && (
                      <span
                        data-tooltip-id={TOOLTIP_ID}
                        data-tooltip-content={tooltip}
                        className='info-indicator'
                        role='img'
                        aria-label={tooltip}
                      >
                        <VISUALS.INFO />
                      </span>
                    )}
                  </Heading>
                </label>
                <MDEditor
                  value={tempValue || ''}
                  onChange={(val) => {
                    setTempValue(val);
                    setCharCount((val || '').length);
                  }}
                  data-color-mode='light'
                  visibleDragBar={false}
                  preview='edit'
                  hideToolbar={localSaving}
                  // Stops the toolbar from being focused when tabbing through the form
                  commandsFilter={(cmd) => ({
                    ...cmd,
                    buttonProps: { ...(cmd.buttonProps || {}), tabIndex: -1 },
                  })}
                  textareaProps={{
                    maxLength: maxLength,
                  }}
                  previewOptions={{
                    remarkPlugins: [
                      [remarkGfm, { singleTilde: false }],
                      remarkDefinitionList,
                      remarkEmoji,
                      remarkSupersub,
                      remarkMark,
                    ],
                    rehypePlugins: [
                      rehypeSlug,
                      [rehypeSanitize],
                      [remarkRehype, { handlers: { ...defListHastHandlers } }],
                    ],
                  }}
                />
                <span className='character-count'>
                  {maxLength - charCount} karakters over
                </span>
              </div>
            ) : (
              <div>
                <AcFormField
                  label={label}
                  fullWidth={true}
                  inputType='textarea'
                  value={tempValue}
                  onChange={(val) => {
                    setTempValue(val);
                    setCharCount((val || '').length);
                  }}
                  disabled={localSaving}
                  maxLength={maxLength}
                  className={
                    isMarkdown
                      ? 'ac-organisatie-detail-textarea'
                      : 'textarea-with-dimensions'
                  }
                  placeholder={placeholder}
                />
                <span className='character-count'>
                  {maxLength - charCount} karakters over
                </span>
              </div>
            )}

            <AcFlex spacing='sm' justifyContent='end'>
              <AcButton
                style='button'
                buttonType='secondary'
                icon={<VISUALS.CLOSE />}
                onClick={() => {
                  if (isEditingCustomTrigger) {
                    onCancel(true);
                  }
                  const v = deserialize(value);
                  setIsEditing(false);
                  setTempValue(v || '');
                  setCharCount((v || '').length);
                }}
                disabled={localSaving}
              >
                Annuleren
              </AcButton>
              <AcButton
                style='button'
                onClick={handleSave}
                disabled={localSaving}
                loading={localSaving}
                icon={<VISUALS.SAVE />}
              >
                Opslaan
              </AcButton>
            </AcFlex>
          </div>
        </div>
      ) : (
        <>
          <div>
            {(() => {
              const v = deserialize(value);
              if (!v) {
                return (
                  <span className='ac-description-row-empty'>
                    Geen {label?.toLowerCase?.() || 'beschrijving'}
                  </span>
                );
              }
              return isMarkdown ? (
                <MDEditor.Markdown
                  wrapperElement={{
                    'data-color-mode': 'light',
                  }}
                  className={markdownPreviewClassName}
                  source={v}
                  remarkPlugins={[
                    [remarkGfm, { singleTilde: false }],
                    remarkDefinitionList,
                    remarkEmoji,
                    remarkSupersub,
                    remarkMark,
                  ]}
                  rehypePlugins={[
                    rehypeSlug,
                    [rehypeSanitize],
                    [remarkRehype, { handlers: { ...defListHastHandlers } }],
                  ]}
                />
              ) : (
                <p>{v}</p>
              );
            })()}
          </div>
          {canEdit && isEditingCustomTrigger === undefined && (
            <AcButton
              className='ac-description-edit-btn'
              icon={<VISUALS.PENCIL />}
              style='button'
              buttonType='secondary'
              onClick={() => {
                const v = deserialize(value);
                setIsEditing(true);
                setTempValue(v || '');
                setCharCount((v || '').length);
              }}
            >
              Bewerken
            </AcButton>
          )}
        </>
      )}
    </div>
  );
};

export default withStore(observer(ConEditableDescription));
