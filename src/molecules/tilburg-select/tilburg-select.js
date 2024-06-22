import {
  FormField,
  FormLabel,
  Heading,
  Select,
  SelectOption,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgSelect = ({ label, defaultOption, options = [], onChange }) => {
  const onChangeHandler = (event) => {
    if (!(onChange instanceof Function)) {
      return;
    }

    onChange(event);
  };

  return (
    <FormField type='select'>
      <FormLabel>
        <Heading level={3}>{label}</Heading>
      </FormLabel>
      <Select className='tilburg-select' onChange={onChangeHandler}>
        <SelectOption>{defaultOption}</SelectOption>
        {options.map((option, index) => (
          <SelectOption value={option} key={index}>
            {option}
          </SelectOption>
        ))}
      </Select>
    </FormField>
  );
};

export default TilburgSelect;
