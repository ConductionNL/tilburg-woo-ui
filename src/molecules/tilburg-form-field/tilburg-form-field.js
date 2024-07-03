import {
  FormField,
  FormLabel,
  Heading,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgFormField = ({
  label,
  type = 'text',
  onBlur,
  defaultValue,
  placeholder,
}) => {
  const onBlurHandler = (e) => {
    if (!(onBlur instanceof Function)) {
      return;
    }

    onBlur(e.target.value);
  };

  return (
    <FormField type={type}>
      <FormLabel>
        <Heading level={4}>{label}</Heading>
      </FormLabel>
      <Textbox
        defaultValue={defaultValue}
        placeholder={placeholder}
        onBlur={onBlurHandler}
      />
    </FormField>
  );
};

export default TilburgFormField;
