import {
  FormField,
  FormLabel,
  Heading,
  Select,
  SelectOption,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgSelect = ({ label, defaultOption, options = [] }) => {
  return (
    <FormField type='select'>
      <FormLabel>
        <Heading level={3}>{label}</Heading>
      </FormLabel>
      <Select className='tilburg-select'>
        <SelectOption>{defaultOption}</SelectOption>
        {options.map((option, index) => (
          <SelectOption key={index}>{option}</SelectOption>
        ))}
      </Select>
    </FormField>
  );
};

export default TilburgSelect;
