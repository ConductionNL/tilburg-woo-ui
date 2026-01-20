import { useMemo, useRef } from 'react';
import { VISUALS } from '@src/constants';
import { TOOLTIP_ID } from '@src/index.web';
import {
  FormField,
  Paragraph,
  FormLabel,
  Checkbox,
} from '@utrecht/component-library-react/dist/css-module';
import clsx from 'clsx';
import { ConUuidResolver } from '@src/components';

const AcCheckbox = ({
  label,
  value,
  checked,
  onChange,
  className,
  id,
  tooltip,
  required,
  customLabelPart,
  disabled = false,
  srOnlyLabel = false,
}) => {
  const uniqueIdRef = useRef(null);
  if (!uniqueIdRef.current) {
    uniqueIdRef.current = `ac-checkbox-${Math.random().toString(36).substr(2, 9)}`;
  }

  const memoizedId = useMemo(() => {
    if (label && value) {
      return `${label}_${value}`;
    }
    return uniqueIdRef.current;
  }, [label, value]);
  const _id = id || memoizedId;

  const onChangeHandler = (e) => {
    if (onChange instanceof Function) onChange(e.target.checked);
  };

  return (
    <FormField type='checkbox' className={className}>
      <Paragraph className='utrecht-form-field__label utrecht-form-field__label--checkbox ac-checkbox-label-paragraph'>
        <FormLabel type='checkbox' for={_id} className='ac-checkbox-label'>
          <Checkbox
            id={_id}
            className={`utrecht-form-field__input ${className || ''}`}
            checked={checked}
            name={label}
            value={value}
            onChange={onChangeHandler}
            disabled={disabled}
          />
          <div
            className={clsx({
              'ac-checkbox-label-info': tooltip,
              'ac-checkbox-label-info-with-custom-part': customLabelPart,
            })}
          >
            <div>
              {srOnlyLabel ? (
                <span className='sr-only'>
                  <ConUuidResolver>{label}</ConUuidResolver>
                </span>
              ) : (
                <ConUuidResolver>{label}</ConUuidResolver>
              )}
              {required && (
                <>
                  <span className='required-indicator' aria-hidden='true'>
                    *
                  </span>
                  <span className='sr-only'>(verplicht)</span>
                </>
              )}
            </div>
            {tooltip && (
              <>
                <span
                  data-tooltip-id={TOOLTIP_ID}
                  data-tooltip-content={tooltip}
                  className='info-indicator'
                  role='img'
                  aria-label={tooltip}
                >
                  <VISUALS.INFO />
                </span>
              </>
            )}
          </div>
        </FormLabel>
        {customLabelPart && customLabelPart}
      </Paragraph>
    </FormField>
  );
};

export default AcCheckbox;
