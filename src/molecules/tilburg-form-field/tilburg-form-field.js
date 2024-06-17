import {
  FormField,
  FormLabel,
  Heading,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgFormField = ({ label, type = 'text' }) => {
  return (
    <FormField type={type}>
      <FormLabel>
        <Heading level={4}>{label}</Heading>
      </FormLabel>
      <Textbox />
    </FormField>
  );
};

export default TilburgFormField;
