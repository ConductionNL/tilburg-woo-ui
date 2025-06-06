import {
  FormField,
  FormLabel,
  Heading,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import clsx from 'clsx';

const AcFormField = ({
  label,
  type = 'text',
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

  return (
    <FormField type={type}>
      <FormLabel htmlFor={id}>
        <Heading level={headingLevel}>
          {label}
          {required && (
            <>
              <span className='required-indicator' aria-hidden='true'>
                *
              </span>
              <span className='sr-only'>(verplicht)</span>
            </>
          )}
        </Heading>
      </FormLabel>
      <Textbox
        id={id}
        className={clsx(
          { 'error-input': hasError },
          fullWidth && 'ac-form-field--full-width'
        )}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onBlur={onBlurHandler}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onChange={onChangeHandler}
        value={value}
        minLength={minLength}
        maxLength={maxLength}
        {...restProps}
      />
    </FormField>
  );
};

export default AcFormField;
