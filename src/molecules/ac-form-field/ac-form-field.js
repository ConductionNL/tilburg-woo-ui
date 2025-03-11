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
  onChange,
  value,
  defaultValue,
  placeholder,
  id,
  onKeyDown,
  hasError,
  min,
  max,
  pattern,
  'data-date-format': dateFormat,
}) => {
  const onBlurHandler = (e) => {
    if (!(onBlur instanceof Function)) {
      return;
    }

    onBlur(e.target.value);
  };

  const onChangeHandler = (e) => {
    if (!(onChange instanceof Function)) {
      return;
    }

    onChange(e);
  };

  const inputProps = {
    id,
    type,
    className: clsx({ 'error-input': hasError }),
    onBlur: onBlurHandler,
    onChange: onChangeHandler,
    onKeyDown,
    placeholder,
    min,
    max,
    pattern,
  };

  if (dateFormat) {
    inputProps['data-date-format'] = dateFormat;
  }

  // Only add value OR defaultValue, not both
  if (value !== undefined) {
    inputProps.value = value;
  } else if (defaultValue !== undefined) {
    inputProps.defaultValue = defaultValue;
  }

  return (
    <FormField type={type}>
      <FormLabel htmlFor={id}>
        <Heading level={4}>{label}</Heading>
      </FormLabel>
      <Textbox {...inputProps} />
    </FormField>
  );
};

export default AcFormField;
