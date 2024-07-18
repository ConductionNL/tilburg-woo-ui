import {
  FormField,
  FormLabel,
  Heading,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';

const AcFormField = ({
  label,
  type = 'text',
  onBlur,
  defaultValue,
  placeholder,
  id,
}) => {
  const onBlurHandler = (e) => {
    if (!(onBlur instanceof Function)) {
      return;
    }

    onBlur(e.target.value);
  };

  return (
    <FormField type={type}>
      <FormLabel for={id}>
        <Heading level={4}>{label}</Heading>
      </FormLabel>
      <Textbox
        id={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onBlur={onBlurHandler}
      />
    </FormField>
  );
};

export default AcFormField;
