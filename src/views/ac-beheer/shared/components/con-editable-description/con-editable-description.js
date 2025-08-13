// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcButton, AcFormField } from '@molecules';
import { ConMarkdown } from '@components';
import { Heading, Button } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@src/atoms';

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
  label,
  placeholder = '',
  tooltip = '',
  maxLength = 2000,
  isMarkdown = false,
  value,
  serialize = (v) => v,
  deserialize = (v) => v ?? '',
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
    const payload = { [field]: serialize(tempValue || '') };
    try {
      await objectStore.patchObject(registerSlug, schemaSlug, objectId, payload);
      setIsEditing(false);
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
            <div className='ac-organisatie-detail-form-label-row'>
              <Heading level={3} className='ac-form-field__label-with-icon'>
                {label}
                {tooltip ? (
                  <span className='ac-form-field__tooltip' title={tooltip}>
                    <VISUALS.INFO />
                  </span>
                ) : null}
              </Heading>
            </div>
            <div className={isMarkdown ? 'ac-organisatie-detail-form-flex' : ''}>
              <div
                className={isMarkdown ? 'ac-organisatie-detail-form-textarea' : ''}
              >
                <AcFormField
                  label='Invoerveld'
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
              {isMarkdown && (
                <div className='ac-organisatie-detail-form-preview'>
                  <Heading level={4}>Preview</Heading>
                  <div className='ac-organisatie-detail-preview markdown-preview'>
                    <ConMarkdown>{tempValue}</ConMarkdown>
                  </div>
                </div>
              )}
            </div>

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
              return isMarkdown ? <ConMarkdown>{v}</ConMarkdown> : <p>{v}</p>;
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
