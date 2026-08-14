import { useState } from 'react';
import { VISUALS } from '@src/constants';
import { TOOLTIP_ID } from '@src/index.web';
import {
  FormField,
  FormLabel,
  Textbox,
  Textarea,
} from '@utrecht/component-library-react/dist/css-module';
import clsx from 'clsx';

const AcFormField = ({
  label,
  customLabelPart,
  type = 'text',
  inputType = 'text',
  onBlur,
  defaultValue,
  placeholder,
  id,
  onKeyDown,
  hasError,
  onChange,
  value,
  fullWidth,
  headingLevel = 4,
  disabled,
  minLength,
  maxLength,
  required,
  isTouched = false,
  customInput,
  icon,
  tooltip,
  labelStyle,
  ...restProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const onBlurHandler = (e) => {
    // Call parent onBlur if provided (for tracking touched state)
    if (onBlur instanceof Function) {
      onBlur(e.target.value);
    }
  };

  const onChangeHandler = (e) => {
    if (onChange instanceof Function) onChange(e.target.value);
  };

  const getInput = (inputType, props) => {
    const { customInput, icon, ...inputProps } = props;

    // Determine the actual input type (for password toggle)
    const isPasswordField = inputType === 'password';
    const actualInputType = isPasswordField && showPassword ? 'text' : inputType;

    if (customInput) {
      return customInput;
    } else if (inputType === 'textarea') {
      return (
        <div className={clsx(fullWidth && 'ac-form-field-textarea--full-width')}>
          <Textarea {...inputProps} />
        </div>
      );
    } else {
      // Render an icon inside the input when provided
      if (icon) {
        return (
          <div className='ac-form-field__icon-wrapper'>
            <span className='ac-form-field__icon' aria-hidden='true'>
              {icon}
            </span>
            <Textbox {...inputProps} type={actualInputType} />
          </div>
        );
      }

      // For password fields, wrap in a container with toggle button
      if (isPasswordField) {
        return (
          <div className='ac-form-field__password-wrapper'>
            <Textbox {...inputProps} type={actualInputType} />
            <button
              type='button'
              className='ac-form-field__password-toggle'
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              disabled={disabled}
              tabIndex={-1}
            >
              {showPassword ? <VISUALS.EYE_SLASH /> : <VISUALS.EYE />}
            </button>
          </div>
        );
      }

      // Pass the correct HTML input type to the Textbox component
      return <Textbox {...inputProps} type={actualInputType} />;
    }
  };

  return (
    <>
      <FormField type={type}>
        <FormLabel
          htmlFor={id}
          className={clsx({
            'ac-form-field-label-with-custom-part': customLabelPart,
          })}
        >
          <span
            className={clsx(`utrecht-heading-${headingLevel || '4'}`, {
              'ac-form-field-header-info': tooltip,
              'ac-form-field-header-info-with-custom-part': customLabelPart,
            })}
            style={labelStyle}
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
            {tooltip && (
              <>
                <span
                  data-tooltip-id={TOOLTIP_ID}
                  data-tooltip-content={tooltip}
                  className='info-indicator'
                  role='img'
                  aria-label={tooltip}
                >
                  <VISUALS.INFO
                    width={labelStyle?.fontSize || undefined}
                    height={labelStyle?.fontSize || undefined}
                  />
                </span>
              </>
            )}
          </span>
          {customLabelPart && customLabelPart}
        </FormLabel>
        {getInput(inputType, {
          id: id,
          className: clsx(
            { 'error-input': isTouched && hasError },
            fullWidth && 'ac-form-field--full-width'
          ),
          defaultValue: defaultValue,
          placeholder: placeholder,
          customInput: customInput,
          onBlur: onBlurHandler,
          disabled: disabled,
          onKeyDown: onKeyDown,
          onChange: onChangeHandler,
          value: value,
          minLength: minLength,
          maxLength: maxLength,
          // Do not pass a type prop to Textarea
          ...(inputType !== 'textarea' ? { type: inputType } : {}),
          icon: icon,
          ...restProps,
        })}
      </FormField>
      {isTouched && hasError && !!restProps.errorMessage ? (
        <span className='ac-register-form-field-error'>
          {restProps.errorMessage}
        </span>
      ) : null}
    </>
  );
};

export default AcFormField;
