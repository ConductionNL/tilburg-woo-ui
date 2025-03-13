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
        <Heading level={4}>{label}</Heading>
      </FormLabel>
      <Textbox
        id={id}
        className={clsx({ 'error-input': hasError })}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onBlur={onBlurHandler}
        onKeyDown={onKeyDown}
        onChange={onChangeHandler}
      />
    </FormField>
  );
};

export default AcFormField;
