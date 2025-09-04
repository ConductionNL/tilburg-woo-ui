import React, { useEffect, useMemo, useState } from 'react';
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

/**
 * ConEditableDescription
 * Generic editable text/markdown field for any object field.
 * - Supports plain text or markdown preview via isMarkdown
 * - Uses ObjectStore.updateObject(register, schema, id, payload)
 * - Allows custom serialization/deserialization for value shape
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
  maxLength = 2000,
  isMarkdown = false,
  value,
  // serialize = (v) => v,
  deserialize = (v) => v ?? '',
  onSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [charCount, setCharCount] = useState(0);

  const requestType = useMemo(() => {
    if (!registerSlug || !schemaSlug || !objectId) return null;
    return `${registerSlug}_${schemaSlug}_${objectId}`;
  }, [registerSlug, schemaSlug, objectId]);

  const saving = requestType ? objectStore.isLoading(requestType) : false;

  useEffect(() => {
    const v = deserialize(value);
    setTempValue(v || '');
    setCharCount((v || '').length);
  }, [value]);

  const handleSave = async () => {
    if (!objectId || !field) return;
    const payload = { [field]: tempValue };
    try {
      await objectStore.patchObject(registerSlug, schemaSlug, objectId, payload);
      setIsEditing(false);
      if (onSuccess) {
        onSuccess(tempValue);
      }
    } catch (e) {
      // TODO: replace with project-wide notification
      // eslint-disable-next-line no-console
      console.error('Error updating field', field, e);
    }
  };

  return (
    <div className='ac-description-row'>
      {isEditing ? (
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
                  preview='live'
                  hideToolbar={saving}
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
                  disabled={saving}
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
                  const v = deserialize(value);
                  setIsEditing(false);
                  setTempValue(v || '');
                  setCharCount((v || '').length);
                }}
                disabled={saving}
              >
                Annuleren
              </AcButton>
              <AcButton
                style='button'
                onClick={handleSave}
                disabled={saving}
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
                    [remarkRehype, { handlers: { ...defListHastHandlers } }],
                  ]}
                />
              ) : (
                <p>{v}</p>
              );
            })()}
          </div>
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
        </>
      )}
    </div>
  );
};

export default withStore(observer(ConEditableDescription));
