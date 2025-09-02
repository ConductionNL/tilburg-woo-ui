import { VISUALS } from '@src/constants';
import { TOOLTIP_ID } from '@src/index.web';
import {
  FormField,
  FormLabel,
  Heading,
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
  touched,
  touchedKey,
  customInput,
  tooltip,
  ...restProps
}) => {
  const onBlurHandler = (e) => {
    if (!(onBlur instanceof Function)) {
      return;
    }

    onBlur(e.target.value);
  };

  const onChangeHandler = (e) => {
    if (onChange instanceof Function) onChange(e.target.value);
  };

  const getInput = (inputType, props) => {
    const { customInput, ...inputProps } = props;

    if (customInput) {
      return customInput;
    } else if (inputType === 'textarea') {
      return (
        <div className={clsx(fullWidth && 'ac-form-field-textarea--full-width')}>
          <Textarea {...inputProps} />
        </div>
      );
    } else {
      // Pass the correct HTML input type to the Textbox component
      return <Textbox {...inputProps} type={inputType} />;
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
          <Heading
            level={headingLevel}
            className={clsx({
              'ac-form-field-header-info': tooltip,
              'ac-form-field-header-info-with-custom-part': customLabelPart,
            })}
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
                  <VISUALS.INFO />
                </span>
              </>
            )}
          </Heading>
          {customLabelPart && customLabelPart}
        </FormLabel>
        {getInput(inputType, {
          id: id,
          className: clsx(
            { 'error-input': touched ? touched[touchedKey] && hasError : hasError },
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
          ...restProps,
        })}
      </FormField>
      {touched ? (
        touched[touchedKey] && hasError ? (
          <span className='ac-register-form-field-error'>
            {restProps.errorMessage}
          </span>
        ) : null
      ) : hasError ? (
        <span className='ac-register-form-field-error'>
          {restProps.errorMessage}
        </span>
      ) : null}
    </>
  );
};

export default AcFormField;
