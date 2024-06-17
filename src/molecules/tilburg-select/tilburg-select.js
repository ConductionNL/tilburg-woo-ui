import {
  FormField,
  FormLabel,
  Heading,
  Select,
  SelectOption,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgSelect = ({ label }) => {
  return (
    <FormField type='select'>
      <FormLabel>
        <Heading level={3}>{label}</Heading>
      </FormLabel>
      <Select>
        <SelectOption>Selecteer jaartallen</SelectOption>
        <SelectOption>2024</SelectOption>
        <SelectOption>2023</SelectOption>
      </Select>
    </FormField>
  );
};

export default TilburgSelect;
